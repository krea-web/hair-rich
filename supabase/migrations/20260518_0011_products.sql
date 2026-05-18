-- Products + Orders (in-store pickup only — no online payment)
-- The client browses /prodotti, adds items to a cart, then submits a
-- "reservation" order. The barber sees the order in admin, prepares
-- the items, and the client pays + picks up in salone.

-- ─────────────────────────────────────────────────────────────────────
-- PRODUCTS
CREATE TABLE IF NOT EXISTS products (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    slug text UNIQUE NOT NULL,
    name text NOT NULL,
    brand text,
    category text NOT NULL CHECK (category IN ('hair', 'beard', 'shave', 'tools', 'other')),
    description text,
    price_cents int NOT NULL CHECK (price_cents >= 0),
    stock int NOT NULL DEFAULT 0 CHECK (stock >= 0),
    image_path text,
    badge text,
    is_active boolean NOT NULL DEFAULT true,
    sort_order int NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS products_category_idx ON products (category, sort_order) WHERE is_active;

-- updated_at trigger reuse from the bookings migration
DROP TRIGGER IF EXISTS products_updated_at ON products;
CREATE TRIGGER products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE products ENABLE ROW LEVEL SECURITY;
DO $$
DECLARE r RECORD;
BEGIN
    FOR r IN SELECT policyname FROM pg_policies
             WHERE schemaname='public' AND tablename='products'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.products', r.policyname);
    END LOOP;
END $$;

CREATE POLICY "public read products" ON products
    FOR SELECT USING (is_active);
CREATE POLICY "admin all products" ON products
    FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- ─────────────────────────────────────────────────────────────────────
-- ORDERS (in-store pickup reservations)
DO $$ BEGIN
    CREATE TYPE order_status AS ENUM ('pending', 'ready', 'picked_up', 'cancelled', 'expired');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS orders (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    short_code text UNIQUE NOT NULL,
    customer_id uuid REFERENCES customers(id) ON DELETE SET NULL,
    customer_first_name text NOT NULL,
    customer_last_name text,
    customer_phone text NOT NULL,
    customer_email text,
    status order_status NOT NULL DEFAULT 'pending',
    total_cents int NOT NULL DEFAULT 0,
    notes text,
    pickup_deadline timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS orders_status_idx ON orders (status, created_at DESC);
CREATE INDEX IF NOT EXISTS orders_customer_idx ON orders (customer_id, created_at DESC);

DROP TRIGGER IF EXISTS orders_updated_at ON orders;
CREATE TRIGGER orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS order_items (
    order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
    product_id uuid REFERENCES products(id) ON DELETE RESTRICT,
    product_name text NOT NULL,
    unit_price_cents int NOT NULL,
    quantity int NOT NULL CHECK (quantity > 0),
    PRIMARY KEY (order_id, product_id)
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE r RECORD;
BEGIN
    FOR r IN SELECT policyname FROM pg_policies
             WHERE schemaname='public' AND tablename IN ('orders','order_items')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
    END LOOP;
END $$;

-- Customer reads own orders via customers.user_id mapping
CREATE POLICY "self read orders" ON orders
    FOR SELECT USING (
        customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid())
    );
CREATE POLICY "self read order_items" ON order_items
    FOR SELECT USING (
        order_id IN (
            SELECT o.id FROM orders o
            JOIN customers c ON o.customer_id = c.id
            WHERE c.user_id = auth.uid()
        )
    );

CREATE POLICY "admin all orders" ON orders
    FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "admin all order_items" ON order_items
    FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- ─────────────────────────────────────────────────────────────────────
-- RPC: fn_create_order (atomic stock reservation + order creation)
-- Items array shape: [{ product_id: uuid, quantity: int }, ...]
CREATE OR REPLACE FUNCTION fn_create_order(
    p_first_name text,
    p_last_name text,
    p_phone text,
    p_email text,
    p_items jsonb,
    p_notes text DEFAULT NULL
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_order_id uuid;
    v_short_code text;
    v_customer_id uuid;
    v_user_id uuid;
    v_total int := 0;
    v_item jsonb;
    v_product_id uuid;
    v_qty int;
    v_product RECORD;
BEGIN
    IF jsonb_array_length(p_items) = 0 THEN
        RAISE EXCEPTION 'Carrello vuoto' USING ERRCODE = 'P0010';
    END IF;

    v_user_id := auth.uid();

    -- Resolve / create customer (same pattern as booking)
    IF v_user_id IS NOT NULL THEN
        SELECT id INTO v_customer_id FROM customers WHERE user_id = v_user_id;
    END IF;
    IF v_customer_id IS NULL AND p_email IS NOT NULL AND p_email <> '' THEN
        SELECT id INTO v_customer_id FROM customers WHERE lower(email) = lower(p_email) LIMIT 1;
    END IF;
    IF v_customer_id IS NULL AND p_phone IS NOT NULL THEN
        SELECT id INTO v_customer_id FROM customers WHERE phone = p_phone LIMIT 1;
    END IF;
    IF v_customer_id IS NULL THEN
        INSERT INTO customers (first_name, last_name, email, phone, is_guest, user_id)
        VALUES (p_first_name, p_last_name, NULLIF(p_email,''), p_phone, v_user_id IS NULL, v_user_id)
        RETURNING id INTO v_customer_id;
    END IF;

    -- Lock product rows that we're about to decrement
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
        v_product_id := (v_item->>'product_id')::uuid;
        v_qty := (v_item->>'quantity')::int;
        IF v_qty IS NULL OR v_qty <= 0 THEN
            RAISE EXCEPTION 'Quantità non valida' USING ERRCODE = 'P0011';
        END IF;

        SELECT id, name, price_cents, stock, is_active INTO v_product
            FROM products WHERE id = v_product_id FOR UPDATE;
        IF v_product.id IS NULL OR NOT v_product.is_active THEN
            RAISE EXCEPTION 'Prodotto non disponibile' USING ERRCODE = 'P0012';
        END IF;
        IF v_product.stock < v_qty THEN
            RAISE EXCEPTION 'Scorta insufficiente per %', v_product.name USING ERRCODE = 'P0013';
        END IF;

        v_total := v_total + v_product.price_cents * v_qty;
    END LOOP;

    -- Generate short code (6 alphanum upper)
    v_short_code := upper(substr(md5(gen_random_uuid()::text || clock_timestamp()::text), 1, 6));

    INSERT INTO orders (
        short_code, customer_id, customer_first_name, customer_last_name,
        customer_phone, customer_email, status, total_cents, notes
    ) VALUES (
        v_short_code, v_customer_id, p_first_name, p_last_name,
        p_phone, NULLIF(p_email, ''), 'pending', v_total, NULLIF(p_notes, '')
    ) RETURNING id INTO v_order_id;

    -- Insert items + decrement stock
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
        v_product_id := (v_item->>'product_id')::uuid;
        v_qty := (v_item->>'quantity')::int;

        SELECT name, price_cents INTO v_product FROM products WHERE id = v_product_id;

        INSERT INTO order_items (order_id, product_id, product_name, unit_price_cents, quantity)
        VALUES (v_order_id, v_product_id, v_product.name, v_product.price_cents, v_qty);

        UPDATE products SET stock = stock - v_qty WHERE id = v_product_id;
    END LOOP;

    RETURN jsonb_build_object(
        'order_id', v_order_id,
        'short_code', v_short_code,
        'total_cents', v_total,
        'pickup_deadline', (SELECT pickup_deadline FROM orders WHERE id = v_order_id)
    );
END $$;

GRANT EXECUTE ON FUNCTION fn_create_order(text,text,text,text,jsonb,text) TO anon, authenticated;

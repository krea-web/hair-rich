-- Hair Rich · Chat 3 · Suppliers directory + stock alert thresholds
-- (#75 stock alerts, #76 suppliers directory)
--
-- Tabella `suppliers` con contatti completi (telefono, email, sito, agente).
-- Tabella `supplier_orders` per il storico ordini con items jsonb +
-- PDF generato (storage URL). Estensione `products` con default_supplier_id
-- + soglie di stock (warning/critical) per il cron stock-low-alert.

CREATE TABLE IF NOT EXISTS suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  vat_number text,
  contact_person text,
  phone text,
  email text,
  website text,
  address text,
  city text,
  province text,
  country text NOT NULL DEFAULT 'IT',

  category text,
  payment_terms text,
  delivery_lead_days int,
  min_order_eur numeric(10,2),

  notes text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS suppliers_active_idx ON suppliers (is_active, name);

ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admin all suppliers" ON suppliers;
CREATE POLICY "admin all suppliers" ON suppliers
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP TRIGGER IF EXISTS trg_suppliers_updated ON suppliers;
CREATE TRIGGER trg_suppliers_updated
  BEFORE UPDATE ON suppliers
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ────────── Supplier orders (storico ordini ai fornitori) ───────────────
CREATE TABLE IF NOT EXISTS supplier_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id uuid NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
  order_number text NOT NULL,

  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','sent','confirmed','partially_received','received','cancelled')),

  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  total_eur numeric(10,2) NOT NULL DEFAULT 0,
  notes text,

  pdf_storage_path text,
  expected_delivery_date date,
  received_at timestamptz,
  cancelled_at timestamptz,

  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  UNIQUE (supplier_id, order_number)
);

CREATE INDEX IF NOT EXISTS supplier_orders_status_idx
  ON supplier_orders (status, created_at DESC);

ALTER TABLE supplier_orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admin all supplier_orders" ON supplier_orders;
CREATE POLICY "admin all supplier_orders" ON supplier_orders
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP TRIGGER IF EXISTS trg_supplier_orders_updated ON supplier_orders;
CREATE TRIGGER trg_supplier_orders_updated
  BEFORE UPDATE ON supplier_orders
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ────────── Extend products with supplier + stock thresholds ────────────
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS default_supplier_id uuid REFERENCES suppliers(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS supplier_sku text,
  ADD COLUMN IF NOT EXISTS cost_cents int,
  ADD COLUMN IF NOT EXISTS stock_low_threshold int NOT NULL DEFAULT 3,
  ADD COLUMN IF NOT EXISTS stock_critical_threshold int NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS reorder_quantity_suggestion int,
  ADD COLUMN IF NOT EXISTS last_low_stock_alert_at timestamptz;

CREATE INDEX IF NOT EXISTS products_supplier_idx
  ON products (default_supplier_id) WHERE default_supplier_id IS NOT NULL;

COMMENT ON COLUMN products.stock_low_threshold IS
  'Stock soglia warning. Quando stock <= questa, cron stock-low-alert manda Telegram.';
COMMENT ON COLUMN products.stock_critical_threshold IS
  'Stock soglia critica. Trigger di emergenza, anche fuori quiet hours.';
COMMENT ON COLUMN products.last_low_stock_alert_at IS
  'Anti-spam: max 1 alert per prodotto ogni 24h.';

-- ────────── Stock velocity helper (used by reorder suggestions) ─────────
CREATE OR REPLACE FUNCTION fn_product_velocity(p_product_id uuid, p_days int DEFAULT 30)
RETURNS numeric LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(SUM(oi.quantity)::numeric / GREATEST(p_days, 1), 0)
    FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
   WHERE oi.product_id = p_product_id
     AND o.status IN ('ready','picked_up')
     AND o.created_at > now() - make_interval(days => p_days);
$$;

GRANT EXECUTE ON FUNCTION fn_product_velocity(uuid, int) TO authenticated;

-- ────────── Low-stock check view (consumed by cron + /admin/prodotti) ───
CREATE OR REPLACE VIEW v_products_low_stock AS
SELECT
  p.id,
  p.slug,
  p.name,
  p.brand,
  p.stock,
  p.stock_low_threshold,
  p.stock_critical_threshold,
  CASE
    WHEN p.stock <= p.stock_critical_threshold THEN 'critical'
    WHEN p.stock <= p.stock_low_threshold THEN 'low'
    ELSE 'ok'
  END AS severity,
  p.default_supplier_id,
  s.name AS supplier_name,
  s.phone AS supplier_phone,
  s.email AS supplier_email,
  p.reorder_quantity_suggestion,
  p.last_low_stock_alert_at,
  fn_product_velocity(p.id, 30) AS avg_daily_velocity_30d
FROM products p
LEFT JOIN suppliers s ON s.id = p.default_supplier_id
WHERE p.is_active
  AND p.stock <= p.stock_low_threshold;

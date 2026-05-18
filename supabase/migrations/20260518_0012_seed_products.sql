-- Seed catalog (8 prodotti demo, sostituibili dall'admin)

INSERT INTO products (slug, name, brand, category, description, price_cents, stock, badge, sort_order, image_path) VALUES
    (
        'pomata-opaca-hr',
        'Pomata opaca · Signature',
        'Hair Rich',
        'hair',
        'La nostra pomata signature. Finish matte, tenuta medio-alta, base acqua — si stende facilmente con le mani umide e si lava in due passate sotto la doccia.',
        2500,
        24,
        'Best seller',
        1,
        'provvisorio/IMG_2090.jpeg'
    ),
    (
        'cera-fibrosa-hr',
        'Cera fibrosa · Texture',
        'Hair Rich',
        'hair',
        'Cera fibrosa per capelli mossi e medio-lunghi. Crea texture mantenendo movimento naturale. Profumo balsamico, asciuga senza appesantire.',
        2800,
        18,
        NULL,
        2,
        'provvisorio/IMG_1208.jpeg'
    ),
    (
        'shampoo-mineralizzante',
        'Shampoo mineralizzante',
        'Hair Rich',
        'hair',
        'Shampoo solfato-free per uso quotidiano. Mineralizzanti marini + caffeina, rinforza la fibra senza seccare.',
        1800,
        32,
        NULL,
        3,
        'provvisorio/IMG_1200.jpeg'
    ),
    (
        'olio-barba-jojoba',
        'Olio barba · Jojoba & legno di cedro',
        'Hair Rich',
        'beard',
        'Olio per barba a base di jojoba e cedro. Idrata la pelle sotto la barba, ammorbidisce il pelo, profumazione legnosa discreta.',
        2200,
        28,
        'Più scelto barba',
        4,
        'provvisorio/IMG_2143.jpeg'
    ),
    (
        'balsamo-barba',
        'Balsamo modellante barba',
        'Hair Rich',
        'beard',
        'Balsamo a cera d''api + burro di karité. Disciplina barbe medie-lunghe, finish naturale, profumazione speziata leggera.',
        2400,
        16,
        NULL,
        5,
        'provvisorio/IMG_2261.jpeg'
    ),
    (
        'pre-shave-oil',
        'Pre-shave oil',
        'Hair Rich',
        'shave',
        'Olio pre-rasatura per chi usa rasoio classico. Prepara la pelle, riduce irritazioni, lascia il pelo morbido per un taglio pulito.',
        1900,
        22,
        NULL,
        6,
        'provvisorio/IMG_2391.jpeg'
    ),
    (
        'pettine-corno',
        'Pettine in corno · Made in Italy',
        'Hair Rich',
        'tools',
        'Pettine artigianale in corno bovino, lavorazione a mano. Antistatico, denti precisi per styling, lunga durata.',
        3500,
        9,
        'Edizione limitata',
        7,
        'provvisorio/IMG_2404.jpeg'
    ),
    (
        'spazzola-cinghiale',
        'Spazzola setole di cinghiale',
        'Hair Rich',
        'tools',
        'Spazzola con setole di cinghiale per asciugatura e styling quotidiano. Stimola il cuoio capelluto e distribuisce gli oli naturali.',
        4500,
        7,
        NULL,
        8,
        'provvisorio/IMG_2493.jpeg'
    )
ON CONFLICT (slug) DO UPDATE
    SET name = EXCLUDED.name,
        brand = EXCLUDED.brand,
        category = EXCLUDED.category,
        description = EXCLUDED.description,
        price_cents = EXCLUDED.price_cents,
        stock = EXCLUDED.stock,
        badge = EXCLUDED.badge,
        sort_order = EXCLUDED.sort_order,
        image_path = EXCLUDED.image_path;

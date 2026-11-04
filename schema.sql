-- 1. Table des Marchands (Espace Vendeur Lomé)
CREATE TABLE merchants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    store_name TEXT NOT NULL,
    whatsapp TEXT NOT NULL,
    quarter TEXT NOT NULL,
    latitude NUMERIC DEFAULT 6.1319,
    longitude NUMERIC DEFAULT 1.2228,
    plan_type TEXT DEFAULT 'FREE', -- 'FREE', 'PRO', 'VIP'
    subscription_date TIMESTAMP WITH TIME ZONE,
    refund_deadline TIMESTAMP WITH TIME ZONE,
    refund_requested BOOLEAN DEFAULT false,
    official_contact TEXT DEFAULT '92485866'
);

-- 2. Table des Produits
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    merchant_id UUID REFERENCES merchants(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    price NUMERIC NOT NULL,
    category TEXT NOT NULL,
    image TEXT NOT NULL, -- Image Base64 compressée
    description TEXT
);

-- 3. Table des Abonnés aux Alertes Push
CREATE TABLE push_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    push_token TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 4. Table des Demandes de Support & Remboursement (Canal Officiel 92485866)
CREATE TABLE official_support_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    merchant_id UUID REFERENCES merchants(id) ON DELETE CASCADE,
    request_type TEXT NOT NULL, -- 'REFUND', 'SUPPORT', 'PARTNERSHIP'
    status TEXT DEFAULT 'pending',
    assigned_phone TEXT DEFAULT '92485866'
);
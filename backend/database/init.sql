
-- Create the tables in the PlanMy database.

CREATE TABLE IF NOT EXISTS users (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    profile_image_url TEXT
);

CREATE TABLE IF NOT EXISTS events (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id),
    name VARCHAR(200) NOT NULL,
    event_type VARCHAR(40) NOT NULL,
    date DATE NOT NULL,
    time TIME NOT NULL,
    location VARCHAR(255) NOT NULL,
    guests INTEGER NOT NULL CHECK (guests > 0),
    budget NUMERIC(12, 2) NOT NULL CHECK (budget >= 0),
    status VARCHAR(20) NOT NULL DEFAULT 'PLANNING'
        CHECK (status IN ('PLANNING', 'CONFIRMED', 'CANCELLED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS providers (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    category VARCHAR(40) NOT NULL,
    description TEXT NOT NULL,
    image_url TEXT,
    location VARCHAR(255) NOT NULL,
    rating NUMERIC(2, 1) NOT NULL DEFAULT 0,
    review_count INTEGER NOT NULL DEFAULT 0,
    price NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
    price_unit VARCHAR(20) NOT NULL
        CHECK (price_unit IN ('PER_EVENT', 'PER_GUEST', 'PER_HOUR')),
    max_guests INTEGER CHECK (max_guests > 0)
);

CREATE TABLE IF NOT EXISTS bookings (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    event_id BIGINT NOT NULL REFERENCES events(id) ON DELETE RESTRICT,
    provider_id BIGINT NOT NULL REFERENCES providers(id) ON DELETE RESTRICT,
    service_date DATE NOT NULL,
    price NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
    paid_amount NUMERIC(12, 2) NOT NULL DEFAULT 0
        CHECK (paid_amount >= 0 AND paid_amount <= price),
    status VARCHAR(20) NOT NULL DEFAULT 'CONFIRMED'
        CHECK (status IN ('CONFIRMED', 'CANCELLED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(event_id, provider_id)
);

CREATE TABLE IF NOT EXISTS conversations (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    event_id BIGINT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    provider_id BIGINT NOT NULL REFERENCES providers(id) ON DELETE RESTRICT,
    UNIQUE(event_id, provider_id)
);

CREATE TABLE IF NOT EXISTS messages (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    conversation_id BIGINT NOT NULL
        REFERENCES conversations(id) ON DELETE CASCADE,
    sender_type VARCHAR(20) NOT NULL
        CHECK (sender_type IN ('USER', 'PROVIDER')),
    text TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Useful indexes for common queries.
CREATE INDEX IF NOT EXISTS idx_events_user_date
    ON events(user_id, date);

CREATE INDEX IF NOT EXISTS idx_providers_category
    ON providers(category);

CREATE INDEX IF NOT EXISTS idx_bookings_event
    ON bookings(event_id);

CREATE INDEX IF NOT EXISTS idx_conversations_event
    ON conversations(event_id);

-- Demo user.
INSERT INTO users (name, email, profile_image_url)
VALUES ('Maya Bennett', 'maya@example.com', 'https://example.com/maya.jpg')
ON CONFLICT (email) DO NOTHING;

-- Demo providers.
INSERT INTO providers
    (name, category, description, image_url, location,
     rating, review_count, price, price_unit, max_guests)
VALUES
    ('The Garden Loft', 'VENUE',
     'A bright loft with a private garden.',
     'https://example.com/garden.jpg', 'Brooklyn, NY',
     4.9, 128, 1800, 'PER_EVENT', 80),

    ('Sage & Salt', 'CATERING',
     'Seasonal catering for special events.',
     'https://example.com/catering.jpg', 'Brooklyn, NY',
     4.8, 85, 30, 'PER_GUEST', 100),

    ('North Star Photography', 'PHOTOGRAPHY',
     'Candid event photography.',
     'https://example.com/photo.jpg', 'Brooklyn, NY',
     4.7, 64, 950, 'PER_EVENT', NULL)

ON CONFLICT DO NOTHING;

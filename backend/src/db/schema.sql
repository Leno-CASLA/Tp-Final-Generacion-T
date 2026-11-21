CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(160) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'USER',
  membership VARCHAR(20) NOT NULL DEFAULT 'NO_SOCIO',
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS matches (
  id SERIAL PRIMARY KEY,
  home_team VARCHAR(100) NOT NULL,
  away_team VARCHAR(100) NOT NULL,
  stadium VARCHAR(120) NOT NULL,
  starts_at TIMESTAMP NOT NULL,
  is_high_demand BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS match_sectors (
  id SERIAL PRIMARY KEY,
  match_id INTEGER NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  sector_type VARCHAR(30) NOT NULL,
  total_capacity INTEGER NOT NULL CHECK (total_capacity > 0),
  available_capacity INTEGER NOT NULL CHECK (available_capacity >= 0),
  UNIQUE (match_id, sector_type)
);

CREATE TABLE IF NOT EXISTS tickets (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  match_id INTEGER NOT NULL REFERENCES matches(id),
  sector_type VARCHAR(30) NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity BETWEEN 1 AND 2),
  unit_price INTEGER NOT NULL,
  total_paid INTEGER NOT NULL,
  penalty_amount INTEGER NOT NULL DEFAULT 0,
  refund_amount INTEGER NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'CONFIRMED',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  cancelled_at TIMESTAMP
);
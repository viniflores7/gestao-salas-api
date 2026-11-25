CREATE TABLE rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(100) NOT NULL,
  capacity integer NOT NULL CHECK (capacity > 0),
  location varchar(150),
  description text,
  active boolean NOT NULL DEFAULT true,
  created_by_id uuid REFERENCES users (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX rooms_name_unique_idx ON rooms (lower(name));
CREATE INDEX rooms_created_by_id_idx ON rooms (created_by_id);

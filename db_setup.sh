#!/bin/bash

# MedCare Pro PostgreSQL Local Setup Script

set -e  # Exit on any error

PG_PORT=5432
PG_DIR="./postgres_data"
DB_NAME="medcare_pro"
DB_USER="medcare_admin"
DB_PASS="admin123"

echo "🔧 Installing PostgreSQL..."
sudo apt install -y postgresql postgresql-contrib

# Ensure initdb is in path (some distros require this)
if ! command -v initdb &> /dev/null; then
  echo "📌 Adding PostgreSQL binaries to PATH..."
  export PATH="/usr/lib/postgresql/14/bin:$PATH"
fi

echo "📁 Creating database directory $PG_DIR..."
mkdir -p "$PG_DIR"

echo "🔄 Initializing PostgreSQL cluster in $PG_DIR..."
initdb -D "$PG_DIR"

echo "📝 Configuring PostgreSQL to listen locally on port $PG_PORT..."
echo "port = $PG_PORT" >> "$PG_DIR/postgresql.conf"
echo "unix_socket_directories = '$(pwd)/$PG_DIR'" >> "$PG_DIR/postgresql.conf"
echo "listen_addresses = 'localhost'" >> "$PG_DIR/postgresql.conf"

echo "🚀 Starting PostgreSQL server..."
pg_ctl -D "$PG_DIR" -l "$PG_DIR/logfile" start
sleep 3

echo "🗃️ Creating database '$DB_NAME'..."
createdb -h localhost -p $PG_PORT "$DB_NAME"

echo "👤 Creating user '$DB_USER' and granting privileges..."
psql -h localhost -p $PG_PORT -d "$DB_NAME" <<EOF
DO \$\$
BEGIN
   IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '${DB_USER}') THEN
      CREATE ROLE ${DB_USER} LOGIN PASSWORD '${DB_PASS}';
   END IF;
END
\$\$;
GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};
EOF

echo "🌐 Creating .env file..."
cat > .env <<EOF
DATABASE_URL=postgresql://${DB_USER}:${DB_PASS}@localhost:${PG_PORT}/${DB_NAME}
PGHOST=localhost
PGPORT=${PG_PORT}
PGDATABASE=${DB_NAME}
PGUSER=${DB_USER}
PGPASSWORD=${DB_PASS}
EOF

echo "📦 Pushing database schema (ensure 'db:push' is defined in package.json)..."
npm run db:push || echo "⚠️ npm run db:push failed. Make sure it's defined."

echo "✅ Setup complete!"
echo "ℹ️ To stop the server: pg_ctl -D $PG_DIR stop"
echo "ℹ️ To start it again: pg_ctl -D $PG_DIR -l $PG_DIR/logfile start"

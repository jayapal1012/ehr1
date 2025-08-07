# PostgreSQL Database Setup for MedCare Pro

## ✅ Current Status: PostgreSQL Database Active

The application is now successfully running with PostgreSQL database integration. The database contains:
- 3 users (admin, staff, patient)
- 3 patients with complete medical records
- Health predictions and medical history data

## For Replit Environment (Current Setup)
The PostgreSQL database is already configured and running. No additional setup needed.

## For Local Development (Optional)

### Prerequisites
Make sure you have PostgreSQL installed on your system:

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib

# CentOS/RHEL/Fedora
sudo yum install postgresql postgresql-server
# or for newer versions:
sudo dnf install postgresql postgresql-server
```

## Step 1: Create Database Directory in Project Root
```bash
mkdir -p ./postgres_data
```

## Step 2: Initialize PostgreSQL Database in Project Directory
```bash
# Initialize database cluster in project directory
initdb -D ./postgres_data

# Create configuration for local development
echo "port = 5432" >> ./postgres_data/postgresql.conf
echo "unix_socket_directories = '$(pwd)/postgres_data'" >> ./postgres_data/postgresql.conf
echo "listen_addresses = 'localhost'" >> ./postgres_data/postgresql.conf
```

## Step 3: Start PostgreSQL Server
```bash
# Start PostgreSQL server using the local data directory
pg_ctl -D ./postgres_data -l ./postgres_data/logfile start
```

## Step 4: Create Database and User
```bash
# Create database
createdb -h localhost -p 5432 medcare_pro

# Create user (optional, you can use default user)
psql -h localhost -p 5432 -d medcare_pro -c "CREATE USER medcare_admin WITH PASSWORD 'admin123';"
psql -h localhost -p 5432 -d medcare_pro -c "GRANT ALL PRIVILEGES ON DATABASE medcare_pro TO medcare_admin;"
```

## Step 5: Update Environment Variables
Create a `.env` file in your project root:
```bash
cat > .env << 'EOF'
DATABASE_URL=postgresql://medcare_admin:admin123@localhost:5432/medcare_pro
PGHOST=localhost
PGPORT=5432
PGDATABASE=medcare_pro
PGUSER=medcare_admin
PGPASSWORD=admin123
EOF
```

## Step 6: Push Database Schema
```bash
npm run db:push
```

## Step 7: Stop PostgreSQL Server (when done)
```bash
pg_ctl -D ./postgres_data stop
```

## Daily Usage Commands

### Start the database:
```bash
pg_ctl -D ./postgres_data -l ./postgres_data/logfile start
```

### Stop the database:
```bash
pg_ctl -D ./postgres_data stop
```

### Check database status:
```bash
pg_ctl -D ./postgres_data status
```

### Connect to database:
```bash
psql -h localhost -p 5432 -d medcare_pro
```

## Troubleshooting

1. **Permission denied**: Make sure you have write permissions in the project directory
2. **Port already in use**: Change the port in postgresql.conf or stop existing PostgreSQL services
3. **Database doesn't start**: Check the logfile in ./postgres_data/logfile for errors

## Notes
- The database files will be stored in `./postgres_data/` directory
- This setup is for local development only
- Make sure to add `postgres_data/` to your `.gitignore` file
- The database will only be accessible locally on your machine
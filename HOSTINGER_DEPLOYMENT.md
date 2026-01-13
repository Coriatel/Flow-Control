# Flow Control - Hostinger Deployment Guide

## Prerequisites

1. Hostinger VPS or Cloud Hosting plan with Node.js support
2. SSH access to your Hostinger server
3. PostgreSQL database (can be on same server or external service like Neon, Supabase)
4. Domain configured in Hostinger

## Option 1: Hostinger VPS Deployment

### 1. Server Setup

```bash
# Connect via SSH
ssh root@your-server-ip

# Update system
apt update && apt upgrade -y

# Install Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Verify installation
node --version  # Should be v20.x
npm --version

# Install PM2 for process management
npm install -g pm2

# Install nginx as reverse proxy
apt install -y nginx
```

### 2. PostgreSQL Setup (if hosting on same server)

```bash
# Install PostgreSQL
apt install -y postgresql postgresql-contrib

# Start PostgreSQL
systemctl start postgresql
systemctl enable postgresql

# Create database and user
sudo -u postgres psql

CREATE USER flowcontrol WITH PASSWORD 'your-secure-password';
CREATE DATABASE flowcontrol_db OWNER flowcontrol;
GRANT ALL PRIVILEGES ON DATABASE flowcontrol_db TO flowcontrol;
\q
```

### 3. Application Setup

```bash
# Create application directory
mkdir -p /var/www/flowcontrol
cd /var/www/flowcontrol

# Clone repository
git clone https://github.com/your-username/Flow-Control.git .

# Setup backend
cd server
npm ci --production
npm run prisma:generate
npm run build

# Create environment file
cp .env.example .env
nano .env  # Edit with your values
```

### 4. Environment Configuration

Edit `/var/www/flowcontrol/server/.env`:

```env
# Server
PORT=4000
HOST=0.0.0.0
NODE_ENV=production

# Database
DATABASE_URL=postgresql://flowcontrol:your-secure-password@localhost:5432/flowcontrol_db

# JWT
JWT_SECRET=your-very-long-and-secure-jwt-secret-key-here
JWT_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=https://your-domain.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
```

### 5. Database Migration

```bash
cd /var/www/flowcontrol/server
npx prisma migrate deploy
npm run prisma:seed  # Optional: seed initial data
```

### 6. PM2 Configuration

Create `/var/www/flowcontrol/ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'flowcontrol-api',
    script: 'dist/server.js',
    cwd: '/var/www/flowcontrol/server',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 4000
    },
    error_file: '/var/log/flowcontrol/error.log',
    out_file: '/var/log/flowcontrol/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    max_memory_restart: '500M',
    exp_backoff_restart_delay: 100
  }]
};
```

```bash
# Create log directory
mkdir -p /var/log/flowcontrol

# Start application
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
```

### 7. Nginx Configuration

Create `/etc/nginx/sites-available/flowcontrol`:

```nginx
server {
    listen 80;
    server_name api.your-domain.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.your-domain.com;

    # SSL Configuration (use Certbot for Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/api.your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.your-domain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
    ssl_prefer_server_ciphers off;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    location / {
        proxy_pass ;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
}
```

```bash
# Enable site
ln -s /etc/nginx/sites-available/flowcontrol /etc/nginx/sites-enabled/

# Test configuration
nginx -t

# Reload nginx
systemctl reload nginx

# Install SSL with Certbot
apt install -y certbot python3-certbot-nginx
certbot --nginx -d api.your-domain.com
```

### 8. Firewall Configuration

```bash
# Allow SSH, HTTP, HTTPS
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw enable
```

## Option 2: Hostinger Shared Hosting with Node.js

If using Hostinger's shared hosting with Node.js support:

### 1. Access hPanel

1. Login to Hostinger hPanel
2. Go to "Advanced" > "Node.js"

### 2. Configure Node.js Application

1. Set Node.js version: 20.x
2. Application root: `server`
3. Application startup file: `dist/server.js`
4. Run NPM Install: Yes

### 3. Environment Variables

In hPanel, add environment variables:

```
NODE_ENV=production
PORT=3000
DATABASE_URL=your-database-url
JWT_SECRET=your-jwt-secret
CORS_ORIGIN=https://your-domain.com
```

### 4. Build Before Upload

Build locally before uploading:

```bash
cd server
npm ci
npm run prisma:generate
npm run build
```

Upload the following to your hosting:
- `dist/` folder
- `node_modules/` folder (or run npm install on server)
- `package.json`
- `prisma/` folder
- `.env` file (configured for production)

## Database Options for Hostinger

### Option A: External PostgreSQL (Recommended)

Use a managed PostgreSQL service:

1. **Neon** (neon.tech) - Free tier available
2. **Supabase** (supabase.com) - Free tier available
3. **Railway** (railway.app) - Free tier available

### Option B: Hostinger MySQL

If PostgreSQL isn't available, you'll need to:

1. Update Prisma schema to use MySQL
2. Change `datasource` provider to `mysql`
3. Update `DATABASE_URL` format

```prisma
datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}
```

MySQL URL format:
```
mysql://user:password@hostname:3306/database_name
```

## Deployment Script

Create `deploy.sh` in project root:

```bash
#!/bin/bash
set -e

echo "Starting deployment..."

# Pull latest changes
git pull origin main

# Backend deployment
cd server

echo "Installing dependencies..."
npm ci --production

echo "Generating Prisma client..."
npm run prisma:generate

echo "Building application..."
npm run build

echo "Running database migrations..."
npx prisma migrate deploy

echo "Restarting application..."
pm2 restart flowcontrol-api

echo "Deployment complete!"
```

## Monitoring & Maintenance

### View Logs

```bash
# PM2 logs
pm2 logs flowcontrol-api

# Nginx logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

### Monitor Application

```bash
pm2 monit
pm2 status
```

### Backup Database

```bash
# Create backup
pg_dump -U flowcontrol flowcontrol_db > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore backup
psql -U flowcontrol flowcontrol_db < backup_file.sql
```

### Update Application

```bash
cd /var/www/flowcontrol
./deploy.sh
```

## Troubleshooting

### Application not starting

1. Check logs: `pm2 logs`
2. Verify environment variables: `pm2 env 0`
3. Check database connection: `npx prisma db pull`

### Database connection issues

1. Verify DATABASE_URL format
2. Check PostgreSQL is running: `systemctl status postgresql`
3. Test connection: `psql -U flowcontrol -d flowcontrol_db`

### Nginx 502 errors

1. Check if backend is running: `pm2 status`
2. Verify port configuration
3. Check nginx error logs

## Security Checklist

- [ ] Strong passwords for database and JWT
- [ ] SSL/TLS enabled
- [ ] Firewall configured
- [ ] Regular backups scheduled
- [ ] Log rotation configured
- [ ] Rate limiting enabled
- [ ] Security headers configured

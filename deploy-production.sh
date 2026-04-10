#!/bin/bash
# Production Deployment Script for Noteleks
# Run this on your AWS EC2 instance

set -e
export PATH="$HOME/.npm-global/bin:$PATH"

# Configuration
PROJECT_NAME="noteleks"
DEPLOY_PATH="/var/www/noteleks"
PHP_VERSION="8.3"

echo "🚀 Starting production deployment for $PROJECT_NAME"
echo "===================================================="

# Navigate to project directory
cd "$DEPLOY_PATH"

# Commit and push any local changes before pulling
echo "📝 Checking for local changes..."
git add -A
git reset HEAD .env .env.* .env.backup 2>/dev/null || true
if ! git diff --staged --quiet; then
    git commit -m "Auto-commit before deploy [$(date '+%Y-%m-%d %H:%M')]"
    echo "🚀 Pushing local commits..."
    git push origin main
fi

# Pull latest code from Git
echo "📦 Pulling latest code from Git..."
git pull origin main

# Install/Update PHP dependencies (production mode)
echo "🐘 Installing PHP dependencies..."
composer install --no-interaction --prefer-dist --no-progress --optimize-autoloader --classmap-authoritative --no-dev

# Install/Update Node dependencies
echo "📦 Installing Node dependencies..."
npm ci --production=false

# Build frontend assets
echo "🎨 Building frontend assets..."
npm run build

# Ensure writable directories and permissions
echo "🔒 Setting permissions..."
sudo mkdir -p storage/framework/{cache,sessions,views} bootstrap/cache
sudo chown -R www-data:www-data storage bootstrap/cache
sudo find storage bootstrap/cache -type d -exec chmod 775 {} \;
sudo find storage bootstrap/cache -type f -exec chmod 664 {} \;

# Cache Laravel artifacts as the web server user
echo "⚡ Optimizing Laravel..."
sudo -u www-data php artisan config:cache
sudo -u www-data php artisan route:cache
sudo -u www-data php artisan view:cache

# Restart PHP-FPM
echo "🔄 Restarting PHP-FPM..."
sudo systemctl reload php${PHP_VERSION}-fpm

echo ""
echo "✅ Deployment complete! https://noteleks.graveyardjokes.com"

#!/bin/bash
set -e

echo "🚀 Starting FamilyChores on Railway..."

# Ensure data directory exists with correct permissions
mkdir -p /var/www/html/data/sessions
chmod -R 777 /var/www/html/data
chown -R www-data:www-data /var/www/html/data

# Fix Apache MPM issue at runtime
echo "🔧 Configuring Apache MPM..."
a2dismod mpm_event mpm_worker 2>/dev/null || true
a2enmod mpm_prefork 2>/dev/null || true

# Test PHP is working
echo "✅ Testing PHP..."
php -v

# Test Apache configuration
echo "✅ Testing Apache configuration..."
apache2ctl configtest || true

# Start Apache
echo "🎉 Starting Apache..."
exec apache2-foreground

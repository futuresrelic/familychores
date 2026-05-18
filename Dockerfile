# Railway-optimized PHP/Apache Dockerfile for FamilyChores
FROM php:8.2-apache

# Install SQLite, curl (for healthcheck), and other dependencies
RUN apt-get update && apt-get install -y \
    sqlite3 \
    libsqlite3-dev \
    curl \
    && docker-php-ext-install pdo pdo_sqlite \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Fix Apache MPM conflict - completely remove conflicting modules
RUN rm -f /etc/apache2/mods-enabled/mpm_event.* /etc/apache2/mods-enabled/mpm_worker.* \
    && rm -f /etc/apache2/mods-available/mpm_event.* /etc/apache2/mods-available/mpm_worker.* \
    && a2enmod mpm_prefork

# Enable Apache modules
RUN a2enmod rewrite headers expires

# Optimize PHP for production
RUN mv "$PHP_INI_DIR/php.ini-production" "$PHP_INI_DIR/php.ini" && \
    echo "upload_max_filesize = 10M" >> "$PHP_INI_DIR/php.ini" && \
    echo "post_max_size = 10M" >> "$PHP_INI_DIR/php.ini" && \
    echo "memory_limit = 256M" >> "$PHP_INI_DIR/php.ini" && \
    echo "session.cookie_httponly = 1" >> "$PHP_INI_DIR/php.ini" && \
    echo "session.cookie_samesite = Lax" >> "$PHP_INI_DIR/php.ini"

# Set working directory
WORKDIR /var/www/html

# Copy application files
COPY . /var/www/html/

# Make entrypoint script executable
RUN chmod +x /var/www/html/docker-entrypoint.sh

# Create necessary directories with proper permissions
# Railway will persist /var/www/html/data automatically
RUN mkdir -p /var/www/html/data/sessions && \
    chmod -R 777 /var/www/html/data && \
    chmod -R 755 /var/www/html && \
    chown -R www-data:www-data /var/www/html

# Configure Apache ServerName to avoid warnings
RUN echo "ServerName familychores" >> /etc/apache2/apache2.conf

# Expose port (Railway provides PORT env var)
EXPOSE 80
ENV PORT=80

# Health check - verifies Apache and PHP are working
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD curl -f http://localhost/ || exit 1

# Use custom entrypoint for better startup
ENTRYPOINT ["/var/www/html/docker-entrypoint.sh"]

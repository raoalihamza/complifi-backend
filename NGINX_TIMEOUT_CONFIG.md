# Nginx Timeout Configuration for OCR Processing

If you're using Nginx as a reverse proxy and experiencing 504 Gateway Timeout errors, you need to increase the timeout settings in your Nginx configuration.

## Nginx Configuration

Add these settings to your Nginx server block (usually in `/etc/nginx/sites-available/your-app` or `/etc/nginx/nginx.conf`):

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;

        # Increase timeouts for OCR processing (10 minutes)
        proxy_connect_timeout 600s;
        proxy_send_timeout 600s;
        proxy_read_timeout 600s;
        send_timeout 600s;

        # Increase buffer sizes for large responses
        proxy_buffer_size 128k;
        proxy_buffers 4 256k;
        proxy_busy_buffers_size 256k;
    }

    # Increase client body size for file uploads (10MB)
    client_max_body_size 10M;
    client_body_timeout 600s;
}
```

## Key Settings Explained

- `proxy_connect_timeout 600s` - Time to establish connection with backend (10 minutes)
- `proxy_send_timeout 600s` - Timeout for transmitting request to backend (10 minutes)
- `proxy_read_timeout 600s` - Timeout for reading response from backend (10 minutes)
- `send_timeout 600s` - Timeout for sending response to client (10 minutes)
- `client_max_body_size 10M` - Maximum upload file size (10MB)
- `client_body_timeout 600s` - Timeout for reading client request body (10 minutes)

## After Configuration

1. Test the Nginx configuration:
   ```bash
   sudo nginx -t
   ```

2. Reload Nginx:
   ```bash
   sudo systemctl reload nginx
   ```
   or
   ```bash
   sudo service nginx reload
   ```

## Alternative: Apache Configuration

If you're using Apache as a reverse proxy, add these settings to your virtual host configuration:

```apache
<VirtualHost *:80>
    ServerName your-domain.com

    ProxyPass / http://localhost:5000/
    ProxyPassReverse / http://localhost:5000/

    # Increase timeout to 10 minutes
    ProxyTimeout 600
    Timeout 600

    # Increase body size
    LimitRequestBody 10485760
</VirtualHost>
```

## Cloud Platform Specific Settings

### AWS ALB (Application Load Balancer)
- Go to EC2 > Load Balancers
- Select your ALB > Attributes > Edit
- Set "Idle timeout" to 600 seconds

### Google Cloud Load Balancer
- Go to Network Services > Load balancing
- Edit your load balancer > Backend configuration
- Set "Timeout" to 600 seconds

### Azure Application Gateway
- Go to Application Gateway > Configuration
- Set "Request time-out" to 600 seconds

### Heroku
Add to your `Procfile`:
```
web: node server.js --timeout=600000
```

### Railway / Render
These platforms typically handle timeouts automatically, but if issues persist, contact support to increase timeout limits.

# 🌐 Deployment - Producción

## Antes de Deployar

- [ ] .env configurado con valores REALES
- [ ] JWT_SECRET fuerte (min 32 caracteres)
- [ ] OPENAI_API_KEY válida
- [ ] Base de datos respaldada
- [ ] Tests pasando

## 🐳 Opción 1: Docker (Recomendado)

### En tu servidor (Ubuntu/Debian)

```bash
# 1. Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 2. Instalar Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 3. Clonar repo
git clone <your-repo>
cd argos-it-pro

# 4. Setup
cp .env.example .env
# Editar .env con valores reales

# 5. Deploy
docker-compose -f docker/docker-compose.yml up -d

# 6. Verificar
docker ps
curl http://localhost:4000/api/health
```

### Nginx como Reverse Proxy

```nginx
# /etc/nginx/sites-available/argos
server {
    listen 80;
    server_name argos-it.com;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    # WebSockets
    location /socket.io {
        proxy_pass http://localhost:4000/socket.io;
        proxy_http_version 1.1;
        proxy_buffering off;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

### SSL con Let's Encrypt

```bash
# Instalar Certbot
sudo apt-get install certbot python3-certbot-nginx

# Generar certificado
sudo certbot --nginx -d argos-it.com

# Auto-renew
sudo systemctl enable certbot.timer
```

## ☁️ Opción 2: Railway / Heroku

### Railway (Recomendado)

```bash
# 1. Crear proyecto en railway.app
# 2. Conectar GitHub repo
# 3. Crear variables de entorno en dashboard:
PORT=4000
DATABASE_URL=<railway-postgres-url>
JWT_SECRET=<random-32-chars>
OPENAI_API_KEY=<your-key>

# 4. Deploy automático en push
git push
```

### Heroku

```bash
# 1. Instalar Heroku CLI
curl https://cli.heroku.com/install.sh | sh

# 2. Login
heroku login

# 3. Crear app
heroku create argos-it-prod

# 4. Agregar PostgreSQL
heroku addons:create heroku-postgresql:standard-0

# 5. Variables de entorno
heroku config:set JWT_SECRET=<value>
heroku config:set OPENAI_API_KEY=<value>

# 6. Deploy
git push heroku main
```

## 🔒 Checklist de Seguridad

- [ ] HTTPS habilitado
- [ ] CORS limitado a dominio
- [ ] Rate limiting activado
- [ ] Logs centralizados
- [ ] Backups automáticos
- [ ] Monitoreo configurado
- [ ] Alertas de errores
- [ ] .env fuera del repo

## 📊 Monitoreo

### Logs en tiempo real
```bash
# Docker
docker-compose logs -f backend
docker-compose logs -f frontend

# Servidor directo
sudo journalctl -u argos-backend -f
```

### Health Check
```bash
curl http://argos-it.com/api/health
```

### Database
```bash
# Conectar a producción
psql $DATABASE_URL
SELECT COUNT(*) FROM users;
```

## 🔄 Actualizaciones

```bash
# Actualizar código
git pull origin main

# Reiniciar servicios
docker-compose -f docker/docker-compose.yml restart

# O manual
systemctl restart argos-backend
systemctl restart argos-frontend
```

## 🔧 Troubleshooting

### Error: Port 80 en uso
```bash
sudo lsof -i :80
sudo kill -9 <PID>
```

### Error: Database connection
```bash
# Verificar URL
echo $DATABASE_URL

# Test conexión
psql $DATABASE_URL -c "SELECT 1"
```

### Error: CORS en producción
```javascript
// backend/server.js
const cors = require("cors");
app.use(cors({
  origin: ["https://argos-it.com", "https://www.argos-it.com"]
}));
```

## 💾 Backups

### Automático (Recomendado)
```bash
# Usar servicio proveedor (Railway, Heroku)
# O configurar cron job:

# /etc/cron.d/argos-backup
0 2 * * * pg_dump $DATABASE_URL | gzip > /backups/db-$(date +\%Y\%m\%d).sql.gz
```

### Manual
```bash
# Backup
pg_dump $DATABASE_URL > backup.sql

# Restore
psql $DATABASE_URL < backup.sql
```

---

**¿Problemas?** Contacta: ops@argos-it.com

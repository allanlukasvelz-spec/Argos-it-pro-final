# 🔥 GUÍA DE INICIO RÁPIDO

## Opción 1: Docker (Recomendado - 2 minutos)

```bash
cd argos-it-pro

# 1. Configurar variables
cp .env.example .env
# Editar .env: agregar OPENAI_API_KEY

# 2. Iniciar servicios
docker-compose -f docker/docker-compose.yml up -d

# 3. Esperar 30 segundos e ir a:
# Frontend: http://localhost:3000
# API Health: http://localhost:4000/api/health
```

## Opción 2: Local (Desarrollo)

### Terminal 1 - Backend
```bash
cd backend
npm install
npm run dev
```

### Terminal 2 - Frontend
```bash
cd frontend
npm install
npm run dev
```

### Terminal 3 - Base de Datos (si no usas Docker)
```bash
# PostgreSQL debe estar corriendo en localhost:5432
psql -U postgres -d argos_it < database/schema.sql
```

## 🧪 Pruebas Rápidas

### Crear Cuenta
```
Ir a: http://localhost:3000/auth/register
Email: test@argos.com
Password: Argos123!
```

### Login
```
Email: test@argos.com
Password: Argos123!
```

### Probar Dumbo (IA Pública)
```bash
curl -X POST http://localhost:4000/api/ai/public/dumbo-chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hola, ¿qué servicios ofrecen?"}'
```

### Probar Chico (Seguridad)
```bash
# 1. Login con cookies HttpOnly (REST cookie-only; Bearer → 401)
curl -s -c /tmp/argos.jar -b /tmp/argos.jar -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:3000" \
  -d '{"email":"test@argos.com","password":"Argos123!"}'

# 2. Probar Chico
curl -X POST http://localhost:4000/api/ai/chico \
  -b /tmp/argos.jar \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:3000" \
  -d '{
    "action": "login_attempt",
    "details": {"ip": "192.168.1.1"}
  }'
```

## 🔧 Troubleshooting

### Error "Connection refused"
- Verificar que PostgreSQL está corriendo
- Puerto 5432 no bloqueado
- En Docker: `docker-compose logs db`

### Error "OPENAI_API_KEY not found"
- Agregar en .env: `OPENAI_API_KEY=` y pegar la clave real solo en el entorno local o de produccion.
- Validar API key en OpenAI dashboard

### Frontend no conecta con Backend
- Verificar NEXT_PUBLIC_BACKEND_URL en .env
- Backend debe estar corriendo en puerto 4000
- CORS configurado: check en `backend/middleware/security.js`

### Port ya en uso
```bash
# Cambiar puerto
PORT=5000 npm run dev

# O matar proceso
lsof -i :4000 | grep LISTEN | awk '{print $2}' | xargs kill -9
```

## 📝 Próximos Pasos

1. ✅ Servidor corriendo
2. ✅ Database configurada
3. ✅ Usuarios pueden registrarse
4. ✅ IA funcionando
5. 📌 **Ahora**: Migrar contenido PHP existente
6. 📌 Integrar formularios reales
7. 📌 Conectar dominio
8. 📌 Deploy a producción

## 🎯 Arquitectura en Vivo

```
Usuario en navegador (http://localhost:3000)
        ↓
    Frontend Next.js
        ↓
    Socket.io + HTTP
        ↓
    Backend Node.js (4000)
        ↓
    ┌─────────────────────┐
    │  PostgreSQL (5432)  │
    │  OpenAI API (GPT-4) │
    └─────────────────────┘
```

## 💡 Tips Pro

- **Debug**: `docker-compose logs -f` para ver logs en tiempo real
- **Reload Frontend**: Ctrl+Shift+R (hard refresh)
- **Terminal Backend**: `npm run dev` auto-reloads con nodemon
- **API Testing**: Usa Postman/Insomnia con cookies de sesión (`argos_access`) y `Origin` en mutaciones
- **Database**: Conecta con PgAdmin en puerto 5050

---

¡Listo para programar! 🚀

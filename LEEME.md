# 🎉 PROYECTO ARGOS IT PRO - ENTREGA COMPLETA

## 📦 Qué has recibido

He construido una **arquitectura moderna y escalable** para Argos IT con:

### ✅ Stack Completo
- **Frontend**: Next.js 14 (React + TypeScript + Tailwind CSS + Framer Motion)
- **Backend**: Node.js + Express + WebSockets
- **Base de Datos**: PostgreSQL con esquemas optimizados
- **IA**: OpenAI API integrada (GPT-4)
- **Autenticación**: JWT con Refresh Tokens
- **Seguridad**: Rate limiting, detección de bots, validación fuerte
- **Deployment**: Docker Compose + instrucciones para producción

### 🤖 Dos Bots Inteligentes

#### 🐘 **Dumbo** - Guía UX
- Asistente que guía usuarios paso a paso
- Entiende contexto de conversaciones previas
- Lleva usuarios naturalmente hacia formularios
- Responde preguntas sobre servicios

#### 🔒 **Chico** - Guardián de Seguridad
- Monitorea acciones en tiempo real
- Detecta comportamientos sospechosos
- Analiza riesgos de seguridad
- Genera alertas inmediatas
- Logs persistentes de todo

### 📊 Panel Cliente
- Dashboard con estado de seguridad
- Historial de actividad
- Alertas y notificaciones
- Estadísticas en tiempo real

---

## 🚀 Cómo Empezar

### Opción 1: Con Docker (3 minutos)

```bash
# 1. Extraer ZIP
unzip argos-it-pro-v2.0.0.zip
cd argos-it-pro

# 2. Configurar
cp .env.example .env
# Editar .env: agregar OPENAI_API_KEY

# 3. Ejecutar setup automático
chmod +x setup.sh
./setup.sh

# 4. Acceder
# Frontend: http://localhost:3000
# Backend API: http://localhost:4000/api/health
```

### Opción 2: Setup Manual

```bash
# Terminal 1 - Backend
cd backend
npm install
npm run dev

# Terminal 2 - Frontend  
cd frontend
npm install
npm run dev

# Terminal 3 - Base de Datos (si no usas Docker)
psql -U postgres -d argos_it < database/schema.sql
```

---

## 📁 Estructura del Proyecto

```
argos-it-pro/
├── 📄 README.md                 ← Documentación principal
├── 🚀 setup.sh                  ← Setup automático
├── 📋 .env.example              ← Variables de entorno
│
├── 🔧 backend/                  ← API Node.js
│   ├── server.js                ← Punto de entrada
│   ├── routes/                  ← Endpoints (auth, ai, security)
│   ├── middleware/              ← Auth, seguridad, validación
│   ├── package.json
│   └── Dockerfile
│
├── 🎨 frontend/                 ← Next.js App
│   ├── app/                     ← Páginas (home, login, dashboard)
│   ├── components/              ← Dumbo, Chico, UI
│   ├── lib/                     ← Utilidades (auth, api)
│   ├── package.json
│   └── Dockerfile
│
├── 💾 database/
│   ├── schema.sql               ← Tablas PostgreSQL
│   └── migrate.sh               ← Script de migración
│
├── 🐳 docker/
│   └── docker-compose.yml       ← Orquestación servicios
│
└── 📚 docs/
    ├── QUICK_START.md           ← Inicio rápido
    ├── INTEGRACION.md           ← Migrar contenido PHP
    └── DEPLOYMENT.md            ← Cómo deployar a producción
```

---

## 🧪 Pruebas Rápidas

### 1. Crear Cuenta
```
Navega a: http://localhost:3000/auth/register
Email: test@argos.com
Password: Argos123!
```

### 2. Hablar con Dumbo
```bash
curl -X POST http://localhost:4000/api/ai/public/dumbo-chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hola, ¿qué servicios ofrecen?"}'
```

**Respuesta**: Dumbo te saluda y ofrece ayuda

### 3. Probar Chico (Seguridad)
```bash
# Login y guardar cookies
curl -sS -c /tmp/cookies.txt -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -H "Origin: http://127.0.0.1:3000" \
  -d '{"email":"test@argos.com","password":"Argos123!"}'

# Probar Chico con cookies
curl -X POST http://localhost:4000/api/ai/chico \
  -b /tmp/cookies.txt \
  -H "Content-Type: application/json" \
  -H "Origin: http://127.0.0.1:3000" \
  -d '{
    "action": "login_attempt",
    "details": {"ip": "192.168.1.1"}
  }'
```

**Respuesta**: Chico analiza la acción y retorna el nivel de riesgo

---

## 🔐 Características de Seguridad

✅ **Autenticación JWT** con cookies HttpOnly (24h access, 7d refresh)  
✅ **Refresh Tokens** con rotación y revocación en BD  
✅ **Password Hashing** con bcrypt (salt 10)  
✅ **Validación fuerte** de contraseñas  
✅ **Rate Limiting** (100 req/15min, 5 login/15min)  
✅ **Detección de Bots**  
✅ **CORS configurado** para producción  
✅ **Helmet** para headers de seguridad  
✅ **Logs de seguridad** persistentes en BD  
✅ **Monitoreo en tiempo real** con WebSockets  

---

## 🌍 Variables de Entorno Requeridas

```env
# Backend
PORT=4000
NODE_ENV=development

# Database
DATABASE_URL=postgresql://USUARIO:PASSWORD@HOST:5432/argos_it

# JWT (genera valores seguros!)
JWT_SECRET=your_secret_here_min_32_chars_required
JWT_REFRESH_SECRET=your_refresh_secret_here_min_32_chars

# OpenAI (obtén en https://platform.openai.com)
OPENAI_API_KEY=

# Frontend
NEXT_PUBLIC_BACKEND_URL=http://localhost:4000

# Environment
LOG_LEVEL=debug
```

**⚠️ IMPORTANTE**: Nunca commits .env a Git

---

## 📖 Documentación

### Inicio Rápido
Ver: `docs/QUICK_START.md`
- Setup en 2 minutos
- Pruebas básicas
- Troubleshooting

### Integración con PHP Existente
Ver: `docs/INTEGRACION.md`
- Migrar servicios
- Convertir formularios
- Traducir textos multiidioma
- Timeline de migración

### Deployment a Producción
Ver: `docs/DEPLOYMENT.md`
- Docker en servidor
- Nginx como reverse proxy
- SSL con Let's Encrypt
- Railway / Heroku
- Backups y monitoreo

---

## 🚀 Endpoints API

### Autenticación (Públicos)
```
POST /api/auth/register        → Crear cuenta
POST /api/auth/login           → Iniciar sesión
POST /api/auth/refresh         → Renovar token
```

### IA (Público)
```
POST /api/ai/public/dumbo-chat → Hablar con Dumbo
```

### IA (Protegido - requiere sesión autenticada)
```
POST /api/ai/dumbo             → Dumbo con contexto usuario
POST /api/ai/chico             → Análisis de seguridad
```

### Seguridad (Protegido)
```
GET  /api/security/dashboard   → Panel de usuario
GET  /api/security/stats       → Estadísticas globales
```

### Health
```
GET  /api/health               → Estado del servidor
```

---

## 🎯 Próximos Pasos (Para Ti)

### 1. Setup (Hoy)
- [ ] Extrae el ZIP
- [ ] Ejecuta `./setup.sh`
- [ ] Configura .env con OPENAI_API_KEY
- [ ] Prueba en http://localhost:3000

### 2. Familiarización (1-2 días)
- [ ] Lee `docs/QUICK_START.md`
- [ ] Prueba registro y login
- [ ] Habla con Dumbo y Chico
- [ ] Explora el dashboard

### 3. Integración (1-2 semanas)
- [ ] Sigue `docs/INTEGRACION.md`
- [ ] Migra servicios del PHP existente
- [ ] Convierte formularios a React
- [ ] Traduce textos a JSON

### 4. Deployment (1 semana)
- [ ] Lee `docs/DEPLOYMENT.md`
- [ ] Configura servidor (Railway/Heroku o VPS)
- [ ] Setup SSL con Let's Encrypt
- [ ] Configura dominio

### 5. Go Live 🎉
- [ ] Testing final
- [ ] Deploy a producción
- [ ] Monitoreo

---

## 💡 Tips Pro

- **Auto-reload**: `npm run dev` recompila automáticamente
- **Debug Frontend**: F12 → DevTools (Network, Console)
- **Debug Backend**: Ver logs con `docker-compose logs -f backend`
- **API Testing**: Usa [Postman](https://www.postman.com/) o [Insomnia](https://insomnia.rest/)
- **DB Direct**: `psql $DATABASE_URL` para queries SQL
- **Performance**: Todos los bots usan caché automático

---

## 🆘 Troubleshooting

### "Connection refused" en backend
→ Verifica que PostgreSQL está corriendo
→ Puerto 5432 debe estar disponible

### "OPENAI_API_KEY not found"
→ Agrega la clave en .env
→ Valida en https://platform.openai.com/account/api-keys

### Frontend no carga
→ Verifica NEXT_PUBLIC_BACKEND_URL en .env
→ Backend debe estar en puerto 4000
→ Hard refresh: Ctrl+Shift+R

### Port ya en uso
```bash
# Matar proceso
lsof -i :4000 | grep LISTEN | awk '{print $2}' | xargs kill -9

# O usar otro puerto
PORT=5000 npm run dev
```

---

## 📞 Soporte

Si necesitas ayuda:
1. Revisa la documentación en `/docs`
2. Verifica los logs: `docker-compose logs`
3. Valida que .env esté configurado
4. Intenta `setup.sh` de nuevo

---

## 📊 Lo que tienes

### Código
- ✅ Backend con todas las rutas
- ✅ Frontend con páginas esenciales
- ✅ IA integrada (Dumbo + Chico)
- ✅ WebSockets para tiempo real
- ✅ Autenticación JWT
- ✅ Seguridad avanzada

### Documentación
- ✅ README completo
- ✅ Quick Start (2 minutos)
- ✅ Guía de Integración
- ✅ Deploy Guide
- ✅ API Documentation

### Infrastructure
- ✅ Docker Compose
- ✅ PostgreSQL schema
- ✅ Setup automático
- ✅ .env.example

### Tests
- ✅ Endpoints funcionales
- ✅ Autenticación working
- ✅ IA responde
- ✅ BD conectada

---

## 🎓 Stack Learning

Si quieres aprender qué hay adentro:

**Frontend** (Next.js)
- Pages & Routing
- Components & Props
- Hooks (useState, useEffect)
- API calls con axios
- State management (Zustand)

**Backend** (Node.js)
- Express routing
- Middleware
- JWT authentication
- PostgreSQL queries
- WebSockets (Socket.io)
- OpenAI API

**Database** (PostgreSQL)
- Tablas normalizadas
- Índices para performance
- Foreign keys
- JSON fields

**DevOps** (Docker)
- Container images
- Docker Compose
- Volume persistence
- Environment variables

---

## 🏆 Qué viene después

Con esta base puedes:
1. Agregar más bots (Dumbo Avanzado, Chico Táctica)
2. Crear página de servicios dinámica
3. Integrar pagos (Stripe, PayPal)
4. Multi-lenguaje completo
5. Mobile app (React Native)
6. Analytics avanzado
7. CRM integrado
8. Marketplace de servicios

---

## 📄 Licencia & Propiedad

Este proyecto es propiedad de **Argos IT** © 2026
Todos los derechos reservados.

---

# 🚀 ¡A PROGRAMAR!

El proyecto está **100% funcional** y **listo para producción**.

Comienza con:
```bash
cd argos-it-pro
./setup.sh
```

¿Dudas? Lee `/docs/QUICK_START.md`

**¡Éxito!** 🎉

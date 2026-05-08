# 🏗️ Integración con Contenido Existente

Este documento explica cómo migrar el contenido PHP existente a la nueva arquitectura moderna.

## 📚 Contenido Existente

Del proyecto PHP tienes:
- ✅ Páginas multiidioma (es, en, ca, pt)
- ✅ Servicios y catálogo
- ✅ Formularios de contacto
- ✅ Analytics
- ✅ SEO y sitemap

## 🔄 Proceso de Migración

### 1. Convertir Contenido PHP a JSON

**Antes (PHP)**:
```php
$servicio = [
  'name' => 'Consultoría',
  'desc' => 'Asesoramiento tecnológico',
  'price' => 2500
];
```

**Después (JSON)**:
```json
{
  "services": [
    {
      "id": 1,
      "slug": "consultoria",
      "name": "Consultoría",
      "description": "Asesoramiento tecnológico",
      "price": 2500,
      "category": "consultancy"
    }
  ]
}
```

### 2. Cargar Servicios en BD

```bash
psql -U postgres -d argos_it
INSERT INTO services(name, description, slug, category, price)
VALUES('Consultoría', 'Asesoramiento tecnológico', 'consultoria', 'consultancy', 2500);
```

### 3. Crear Rutas en Frontend

**Antes**: URLs estáticas (`/servicios/consultoria.php`)

**Después**: Rutas dinámicas Next.js
```
/frontend/app/servicios/[slug]/page.tsx
```

### 4. Convertir Formularios

**Antes (PHP)**:
```php
if($_POST['contacto']) {
  mail($admin_email, $_POST['asunto'], $_POST['mensaje']);
}
```

**Después (Next.js + Backend)**:
```javascript
// frontend/components/ContactForm.tsx
const handleSubmit = async (data) => {
  await API.post("/api/forms/contact", data);
  toast.success("Formulario enviado");
};
```

**Backend**:
```javascript
// backend/routes/forms.js
router.post("/contact", async (req, res) => {
  const { name, email, message } = req.body;
  
  // Guardar en DB
  await pool.query(
    "INSERT INTO form_submissions(data) VALUES($1)",
    [JSON.stringify(req.body)]
  );
  
  // Enviar email (opcional)
  // await sendEmail(...);
  
  res.json({ success: true });
});
```

## 📱 Traduciones Multiidioma

### Anterior: PHP con constantes
```php
define('TEXTS', [
  'es' => ['titulo' => 'Servicios'],
  'en' => ['titulo' => 'Services'],
  'ca' => ['titulo' => 'Serveis']
]);
```

### Nuevo: JSON + Next.js
```json
// public/lang/es.json
{
  "titulo": "Servicios",
  "descripcion": "Nuestros servicios",
  "servicios": [...]
}
```

**Uso en componentes**:
```javascript
const [lang, setLang] = useState('es');
const [texts, setTexts] = useState({});

useEffect(() => {
  fetch(`/lang/${lang}.json`).then(r => r.json()).then(setTexts);
}, [lang]);

return <h1>{texts.titulo}</h1>;
```

## 🔗 Migración de Datos

### Script automático (Node.js)
```javascript
// scripts/migrate-data.js
const oldWP = require('wp-api-client');
const pool = require('../backend/db');

async function migrateServices() {
  const services = await oldWP.getServices();
  
  for (const service of services) {
    await pool.query(
      "INSERT INTO services(name, description, price) VALUES($1, $2, $3)",
      [service.title, service.content, service.price]
    );
  }
  
  console.log(`✅ ${services.length} servicios migrados`);
}

migrateServices();
```

## 📧 Formularios Inteligentes (con Chico)

**Antes**: Validación básica en PHP

**Después**: Validación + IA
```javascript
// backend/routes/forms.js
router.post("/submit", authMiddleware, async (req, res) => {
  const { formData } = req.body;
  
  // 1. Validación básica
  if (!formData.email || !formData.name) {
    return res.status(400).json({ error: "Campos requeridos" });
  }
  
  // 2. Análisis de Chico (IA de seguridad)
  const analysis = await chicoAnalyze({
    action: "form_submission",
    data: formData,
    userId: req.user.id
  });
  
  if (analysis.risk_level === "high") {
    return res.status(403).json({ error: "Verificación requerida" });
  }
  
  // 3. Guardar
  await pool.query(
    "INSERT INTO form_submissions(user_id, data, status) VALUES($1, $2, $3)",
    [req.user.id, JSON.stringify(formData), "pending"]
  );
  
  res.json({ success: true });
});
```

## 🎨 Componentes Reutilizables

**Para migrar templates PHP rapidamente:**

```javascript
// frontend/components/ServiceCard.tsx
export default function ServiceCard({ service }) {
  return (
    <div className="card">
      <h3>{service.name}</h3>
      <p>{service.description}</p>
      <p className="price">${service.price}</p>
      <button className="btn-primary">Solicitar</button>
    </div>
  );
}
```

## 🔐 Datos Sensibles

**Antes**: Guardados en archivos PHP
```php
$admin_email = "admin@example.com"; // ❌ Visible
```

**Después**: Variables de entorno
```env
ADMIN_EMAIL=admin@example.com  # .env (no en git)
```

**Uso**:
```javascript
const adminEmail = process.env.ADMIN_EMAIL;
```

## 📊 Analytics y Tracking

**Nueva capacidad**: Chico rastrea todo automáticamente

```javascript
// Al registrarse
await pool.query(
  "INSERT INTO activity_logs(user_id, action_type) VALUES($1, $2)",
  [userId, "signup"]
);

// Al enviar formulario
await pool.query(
  "INSERT INTO activity_logs(user_id, action_type) VALUES($1, $2)",
  [userId, "form_submission"]
);

// Ver dashboard
GET /api/security/dashboard → Retorna toda la actividad
```

## ✅ Checklist de Migración

- [ ] Exportar datos de WordPress a JSON
- [ ] Crear tablas en PostgreSQL
- [ ] Importar servicios
- [ ] Crear páginas en Next.js
- [ ] Migrar formularios
- [ ] Traducir textos a JSON
- [ ] Probar autenticación
- [ ] Probar IA (Dumbo + Chico)
- [ ] Deploy a staging
- [ ] Testing en producción

## 🚀 Timeline Estimado

| Fase | Duración | Qué |
|------|----------|-----|
| 1. Setup BD + Backend | 1 día | Tablas, migraciones, APIs |
| 2. Migrar contenido | 2-3 días | Servicios, páginas, formularios |
| 3. Frontend UI | 3-4 días | Componentes, páginas, navegación |
| 4. Testing + QA | 1-2 días | Pruebas funcionales |
| 5. Deploy | 1 día | Server, dominio, SSL |

**Total**: ~1-2 semanas para migración completa

---

¿Preguntas? Revisa `/docs` o contacta al equipo.

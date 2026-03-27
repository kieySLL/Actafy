# Actafy

> Genera actas de obra profesionales en PDF, Excel y Word — en segundos.

Plataforma SaaS para contratistas colombianos que necesitan crear actas de avance de obra con logo, AIU e IVA incluidos, directamente desde el navegador.

🌐 **Demo en vivo:** [actafy.vercel.app](https://actafy.vercel.app)

---

## Características

- **Exportación profesional** — PDF, Excel y Word con logo del contratista, firmas, AIU e IVA
- **Autenticación completa** — registro, login, recuperación de contraseña vía Supabase Auth
- **Perfil por contratista** — logo, NIT, representante, dirección, AIU e IVA configurables
- **Clientes guardados** — agrega, edita y elimina clientes para autocompletar actas
- **Catálogo de actividades** — importa desde CSV o agrega manualmente
- **Historial de actas** — busca y filtra actas por fecha, cliente o valor
- **Auto-guardado** — guarda automáticamente 2.5s después del último cambio
- **Plan Gratis / Pro** — gratis hasta 5 actas, Pro ilimitado
- **Landing page** — con animaciones, sección de precios y contacto por WhatsApp

---

## Stack

| Capa | Tecnología |
|------|-----------|
| Frontend | React 18 + Vite |
| Auth + DB | Supabase (PostgreSQL) |
| PDF | jsPDF + jspdf-autotable |
| Excel | ExcelJS 4.4 |
| Word | docx.js |
| Deploy | Vercel (CI/CD automático) |
| Estilos | CSS vanilla (sin framework) |

---

## Instalación local

```bash
git clone https://github.com/kieySLL/Actafy.git
cd Actafy
npm install
npm run dev
```

Abre [http://localhost:5173](http://localhost:5173)

### Variables de entorno

Crea un archivo `.env` en la raíz con tus credenciales de Supabase:

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key
```

Sin estas variables la app funciona en modo **localStorage** (solo local, sin nube).

---

## Base de datos (Supabase)

Ejecuta este SQL en Supabase → SQL Editor para crear las tablas:

```sql
-- Perfiles de contratistas
CREATE TABLE public.perfiles (
  id            uuid PRIMARY KEY REFERENCES auth.users(id),
  nombre        text,
  nit           text,
  representante text,
  tel           text,
  direccion     text,
  ciudad        text,
  tipo          text DEFAULT 'Obra civil',
  logo_url      text,
  aiu_admin     numeric DEFAULT 10,
  aiu_imp       numeric DEFAULT 3,
  aiu_util      numeric DEFAULT 10,
  iva           numeric DEFAULT 19,
  clientes      jsonb  DEFAULT '[]',
  catalogo      jsonb  DEFAULT '[]',
  plan          text   DEFAULT 'gratis'
);

-- Actas de obra
CREATE TABLE public.actas (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid REFERENCES auth.users(id),
  data       jsonb NOT NULL,
  totals     jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE public.perfiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.actas    ENABLE ROW LEVEL SECURITY;

CREATE POLICY "usuario ve su perfil"  ON public.perfiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "usuario ve sus actas"  ON public.actas    FOR ALL USING (auth.uid() = user_id);
```

---

## Estructura del proyecto

```
src/
  components/
    AuthContext.jsx     — estado global de auth (Supabase + localStorage fallback)
    AuthScreen.jsx      — login, registro, recuperación de contraseña
    ActaEditor.jsx      — editor de actas (3 pestañas: Obra, Actividades, Exportar)
    HistorialActas.jsx  — listado con búsqueda y filtros
    Settings.jsx        — perfil, logo, clientes, catálogo, AIU/IVA
    LandingPage.jsx     — página de inicio pública con precios
    ActafyLogo.jsx      — componente de logo SVG
  lib/
    supabase.js         — cliente Supabase
    actasDB.js          — CRUD de actas (Supabase + localStorage)
    exporters.js        — motores de exportación PDF, Word, Excel
    helpers.js          — utilidades, cálculos AIU/IVA, formato COP
  App.jsx               — router principal y control de vistas
  index.css             — estilos globales
  main.jsx              — entry point
```

---

## Deploy en Vercel

1. Sube el repositorio a GitHub
2. Ve a [vercel.com](https://vercel.com) → **Add New Project**
3. Conecta el repositorio
4. Agrega las variables de entorno (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`)
5. Clic en **Deploy** — Vercel detecta Vite automáticamente

El archivo `vercel.json` ya incluye las reglas de rewrite para SPA:

```json
{ "rewrites": [{ "source": "/(.*)", "destination": "/" }] }
```

---

## Planes

| Plan | Precio | Actas |
|------|--------|-------|
| Gratis | $0 | Hasta 5 |
| Pro | $29.900 COP/mes | Ilimitadas |

Para activar el plan Pro de un usuario, ejecuta en Supabase:

```sql
UPDATE perfiles SET plan = 'pro' WHERE id = 'uuid-del-usuario';
```

---

## Formato CSV para catálogo

```csv
codigo,actividad,und,valor
P1,Pañete allanado 1:4,M2,26000
J1,Jornal traciego materiales,DIA,85000
```

---

## Contacto

Para adquirir el plan Pro o soporte técnico:

📱 WhatsApp: [+57 300 245 4640](https://wa.me/573002454640)

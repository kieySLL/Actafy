# Actas de Obra — SaaS

Plataforma web para que contratistas generen actas de obra en PDF, Word y Excel directamente desde el navegador.

## Stack

- **React 18** + Vite
- **jsPDF** + autoTable — generación de PDF en el navegador
- **docx.js** — generación de Word en el navegador  
- **SheetJS (xlsx)** — generación de Excel en el navegador
- **localStorage** — persistencia de datos (sin backend por ahora)

## Funcionalidades

- Registro y login por usuario (datos guardados en el navegador)
- Perfil por contratista: logo, NIT, representante, AIU e IVA configurables
- Clientes guardados — selecciona y autorellena datos en el acta
- Catálogo de actividades — importa CSV o agrega manualmente
- Creación de actas con grupos de actividades (igual que Excel de obra)
- Cálculo automático de AIU e IVA
- Exportación en PDF, Word y Excel — 100% en el navegador, sin servidor

## Instalación local

```bash
npm install
npm run dev
```

Abre http://localhost:5173

## Deploy en Vercel

1. Sube este proyecto a un repositorio en GitHub
2. Ve a https://vercel.com → "Add New Project"
3. Conecta tu repositorio
4. Vercel detecta Vite automáticamente — no necesitas cambiar nada
5. Clic en "Deploy"

Tu app estará en https://tu-proyecto.vercel.app en 2 minutos.

## Formato del CSV para catálogo

```
codigo,actividad,und,valor
P1,Pañete allanado 1:4,M2,26000
J1,Jornal traciego materiales,DIA,85000
```

## Próximos pasos para el SaaS

- [ ] Migrar datos de localStorage a Supabase (PostgreSQL)
- [ ] Auth con Supabase (emails, recuperación de contraseña)
- [ ] Historial de actas generadas
- [ ] Planes de pago con Stripe
- [ ] Dominio propio

## Estructura del proyecto

```
src/
  components/
    AuthContext.jsx   — estado global de autenticación
    AuthScreen.jsx    — login y registro
    ActaEditor.jsx    — creación del acta (4 pestañas)
    Settings.jsx      — perfil, clientes, catálogo, AIU
  lib/
    helpers.js        — utilidades y cálculos
    exporters.js      — motores PDF, Word, Excel
  App.jsx             — router principal
  index.css           — estilos globales
  main.jsx            — entry point
```

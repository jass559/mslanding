---
inclusion: always
---

# Reglas Técnicas y de Arquitectura - Multiservicios Sanabria

## Stack Obligatorio
- **Frontend:** React 18+, TypeScript, Vite, React Router DOM v6+, Tailwind CSS, Lucide React.
- **Backend:** Node.js con Express y TypeScript en un servidor unificado que expone la API en `/api/*` y sirve los estáticos de `dist/` en producción en un solo puerto (`process.env.PORT || 3000`).
- **Base de Datos:** PostgreSQL usando Prisma ORM (`@prisma/client` y `prisma`).
- **Validación:** Zod tanto en el frontend como en los endpoints del backend.

## Estándares de Código y Estructura
- Mantener una estructura clara separando `client/` (o `src/` para Vite) y `server/` (para Express y Prisma), compilando ambos en una carpeta `dist/` lista para producción.
- **Variables de entorno requeridas (`.env.example`):**
  - `DATABASE_URL="postgresql://user:password@localhost:5432/multiservicios_db?schema=public"`
  - `PORT=3000`
  - `WHATSAPP_NUMBER="584162459941"`
- **Despliegue en Dokploy (Docker):**
  - Incluir un `Dockerfile` multi-stage basado en `node:20-alpine` (instalando `openssl` para compatibilidad con Prisma).
  - El comando `CMD` del Dockerfile debe ejecutar `npx prisma migrate deploy && node dist/server/index.js` para aplicar migraciones automáticamente al desplegar.
  - Exponer el puerto `3000` y añadir un endpoint `GET /api/health` que responda `200 OK` para healthchecks.

## Identidad Visual Estricta
- **Fondo base:** Negro carbón (`#0A0A0A`) y superficies de tarjetas en gris oscuro (`#171717` / `#1E1E1E`) con bordes sutiles (`#262626`).
- **Color Primario (Acentos, iconos, badges):** Verde esmeralda vibrante (`#10B981`).
- **Color Secundario (Botones CTA principales):** Naranja energético (`#F97316`, hover `#EA580C`).
- **Texto:** Blanco puro/humo (`#F8FAFC`) para títulos y gris claro (`#94A3B8`) para párrafos.

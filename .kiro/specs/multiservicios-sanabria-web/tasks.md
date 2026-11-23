# Implementation Plan: multiservicios-sanabria-web

## Overview

Implementar la aplicación corporativa de Multiservicios Sanabria como una SPA React/TypeScript con Vite, Tailwind CSS, React Router DOM y Lucide React, respaldada por un servidor unificado Express/TypeScript. El servidor expondrá `/api/health` y `/api/contact`, servirá `dist/client` y persistirá contactos en PostgreSQL mediante Prisma.

Las tareas siguen este orden: scaffold y build, contratos compartidos, persistencia, servidor, contenido, interfaz pública, flujo de contacto, pruebas y empaquetado de producción. Todas las tareas usan TypeScript y deben conservar los nombres canónicos `fullName`, `email`, `phone`, `service` y `message`; el modelo `ContactLead` debe contener exactamente `id`, `fullName`, `email`, `phone`, `service`, `message` y `createdAt`.

## Tasks

- [x] 1. Crear el scaffold del proyecto full-stack y la toolchain
  - [x] 1.1 Crear `package.json`, lockfile y scripts de implementación
    - Configurar dependencias de React 18+, React DOM, TypeScript, Vite, React Router DOM v6+, Tailwind CSS, Lucide React, Express, Zod, Prisma, `@prisma/client`, Vitest, React Testing Library, `user-event`, `fast-check` y Supertest o equivalente.
    - Definir scripts reproducibles para desarrollo, generación de Prisma, pruebas en modo no interactivo, compilación del cliente en `dist/client`, compilación del servidor en `dist/server` y `npm run build` como build completo.
    - Mantener las versiones fijadas en el lockfile.
    - _Requirements: 12.1, 12.2, 12.10, 13.1, 13.9_

  - [x] 1.2 Configurar TypeScript, Vite, Tailwind, PostCSS y Vitest
    - Crear los `tsconfig` para cliente, servidor y módulos compartidos sin mezclar el bundle del cliente con dependencias privadas del servidor.
    - Configurar Vite para emitir `dist/client`, Tailwind/PostCSS para los estilos de la SPA y Vitest/JS DOM para pruebas unitarias y de componentes.
    - Configurar aliases para importar módulos compartidos desde cliente y servidor sin duplicar la validación.
    - _Requirements: 8.6, 12.1, 12.2, 14.1, 14.2_

  - [x] 1.3 Crear la estructura inicial compilable de `client/`, `server/`, `shared/`, `prisma/` y `tests/`
    - Crear los entry points iniciales de React/Vite y Express, el punto de entrada de módulos compartidos y las carpetas para componentes, páginas, contenido, middleware, rutas, servicios y estilos.
    - Preparar el entorno de pruebas para ejecutar una sola vez, sin watchers ni servidores persistentes.
    - Mantener la separación de presentación, transporte, validación y persistencia definida en el diseño.
    - _Requirements: 12.1, 12.2, 14.1, 14.2, 14.3, 14.4_

- [x] 2. Checkpoint de scaffold
  - Ensure all tests pass, ask the user if questions arise.

- [x] 3. Implementar contratos compartidos, normalización y configuración
  - [x] 3.1 Implementar `ContactLeadInput`, respuestas API y `Contact_Schema` Zod estricto
    - Crear el esquema compartido con exactamente `fullName`, `email`, `phone`, `service` y `message`; rechazar claves desconocidas.
    - Aplicar `trim`, límites y formatos canónicos: nombre de 2–100, email válido de hasta 254, teléfono opcional de 7–30 con solo dígitos, espacios, `+`, `(`, `)`, `.` y `-`, servicio de 1–100 y mensaje de 10–2000 caracteres.
    - Hacer que un teléfono ausente o vacío quede representado como ausencia antes de persistir y conservar el tipo de presentación con string vacío para el formulario.
    - Definir los contratos `CONTACT_CREATED`, `VALIDATION_ERROR`, `RATE_LIMITED`, `PERSISTENCE_ERROR`, `INTERNAL_ERROR` y `HealthResponse` sin incluir identificadores internos en la respuesta de creación.
    - _Requirements: 4.1–4.7, 5.1–5.2, 5.6, 11.1–11.6, 14.2, 14.5_

  - [x] 3.2 Implementar `normalizeContactInput` y `validateContactInput`
    - Normalizar sin mutar el input, devolver un objeto nuevo con las claves canónicas y recortar los cinco campos según las reglas del esquema.
    - Convertir un `phone` vacío o ausente en `undefined` para el contrato normalizado y dejar que la capa de persistencia lo convierta en `NULL`.
    - Exponer errores serializables asociados a los campos exactos del formulario.
    - Garantizar idempotencia de la normalización y que ningún resultado inválido habilite persistencia.
    - _Requirements: 5.2, 5.5–5.6, 6.4–6.5, 13.2–13.3, 14.5_

  - [x] 3.3 Implementar `resolvePublicRoute` y `buildWhatsAppUrl`
    - Resolver `/`, `/nosotros`, `/servicios`, `/faq` y `/contacto` como `home`, `about`, `services`, `faq` y `contact`, respectivamente; resolver toda otra ruta absoluta como `notFound` y nunca como una ruta API.
    - Normalizar caracteres de formato permitidos del número de WhatsApp, aceptar la representación válida de `584162459941` y producir exactamente `https://wa.me/584162459941`.
    - Rechazar una configuración que no produzca un número válido sin exponer el valor al navegador.
    - _Requirements: 2.1–2.5, 3.4–3.7, 7.3, 13.7–13.8, 14.5_

  - [x] 3.4 Implementar la lectura y validación de configuración de entorno
    - Crear `.env.example` con `DATABASE_URL="postgresql://user:password@localhost:5432/multiservicios_db?schema=public"`, `PORT=3000` y `WHATSAPP_NUMBER="584162459941"`.
    - Validar en el servidor `DATABASE_URL`, `PORT` y `WHATSAPP_NUMBER` antes del arranque productivo, usando el puerto `Number(process.env.PORT) || 3000`.
    - Mantener `DATABASE_URL` únicamente en servidor y evitar que Vite lo incluya en el bundle o en respuestas HTTP.
    - _Requirements: 3.7, 7.5, 10.3, 10.10, 12.8, 14.4_

- [x] 4. Implementar Prisma, PostgreSQL y la migración canónica de `ContactLead`
  - [x] 4.1 Crear `prisma/schema.prisma` y la migración versionada exacta
    - Definir `ContactLead` únicamente con `id`, `fullName`, `email`, `phone`, `service`, `message` y `createdAt`.
    - Usar tipos y límites equivalentes al contrato: `id` generado por Prisma, `fullName` `VarChar(100)`, `email` `VarChar(254)`, `phone` nullable `VarChar(30)`, `service` `VarChar(100)`, `message` `Text` y `createdAt` con valor por defecto de base de datos.
    - No agregar `name`, `status`, `updatedAt` ni cualquier otro campo; crear la migración PostgreSQL versionada que refleje exactamente el modelo.
    - Configurar el datasource para obtener la conexión desde `DATABASE_URL` y generar el cliente Prisma.
    - _Requirements: 6.1, 6.3, 6.6, 6.7, 10.2, 12.6_

  - [x] 4.2 Implementar el cliente Prisma y `createContactLead`
    - Crear el cliente Prisma del servidor sin importarlo desde el cliente.
    - Implementar la creación parametrizada de un contacto con solo `fullName`, `email`, `phone`, `service` y `message`; enviar `phone: null` cuando el valor normalizado no exista.
    - Devolver internamente el registro canónico con los siete campos, propagar las excepciones para que el handler las convierta en un error público seguro y nunca fabricar un falso éxito.
    - _Requirements: 5.6, 5.8, 6.2–6.7, 10.1–10.3, 14.3, 14.6_

- [x] 5. Implementar el servidor Express unificado y sus endpoints
  - [x] 5.1 Crear `createServer` con middleware de seguridad, límites y observabilidad
    - Añadir `Request_ID`, cabeceras de seguridad, límite de body JSON y logging de método, ruta, status, duración e identificador de solicitud.
    - Excluir del log el body completo, email, teléfono, mensaje, `DATABASE_URL`, credenciales y stack traces sensibles.
    - Implementar rate limit por origen para `POST /api/contact`, con configuración aislada y respuesta `429` cuando corresponda.
    - Mantener la aplicación inyectable con `prisma`, `clientDistPath` y entorno para poder probar handlers sin iniciar PostgreSQL.
    - _Requirements: 5.9, 7.6, 10.4–10.6, 11.3, 14.3–14.5_

  - [x] 5.2 Implementar `GET /api/health`
    - Responder siempre `200` con exactamente `{ "status": "ok" }` cuando el servidor HTTP está listo.
    - No consultar ni modificar Prisma, `ContactLead` ni otra tabla de negocio.
    - Mantener el endpoint disponible antes del fallback SPA y separado de la ruta de contacto.
    - _Requirements: 7.1–7.2, 13.10–13.12_

  - [x] 5.3 Implementar `POST /api/contact` y sus respuestas de error
    - Volver a validar `req.body` con el `Contact_Schema` compartido antes de llamar a Prisma.
    - Responder `400` con `VALIDATION_ERROR` para JSON malformado, campos inválidos o campos desconocidos sin escribir en PostgreSQL.
    - Normalizar y crear exactamente un `ContactLead`; responder `201` con `{ "success": true, "code": "CONTACT_CREATED" }` sin `id`, `createdAt` ni otros identificadores.
    - Convertir fallos de persistencia en `500` con `PERSISTENCE_ERROR` o `INTERNAL_ERROR`, sin SQL, stack traces, credenciales, variables de entorno ni detalles de Prisma.
    - Responder `405` en `/api/contact` para métodos distintos de POST y `429` con `RATE_LIMITED` cuando actúe el limitador.
    - _Requirements: 5.3–5.8, 6.2–6.5, 10.1–10.9, 11.2–11.5, 13.3–13.5_

  - [x] 5.4 Separar el espacio `/api/*` del servicio estático y del fallback SPA
    - Responder error JSON `404` para rutas `/api/*` desconocidas y no devolver nunca `index.html` desde una ruta API.
    - Servir estáticos desde `dist/client` y entregar `dist/client/index.html` únicamente para rutas no API que no correspondan a un archivo estático.
    - Mantener el orden de middleware para que API, archivos estáticos y fallback no se interfieran.
    - _Requirements: 2.9, 7.3–7.4, 11.6–11.7, 14.4_

  - [x] 5.5 Implementar `startServer` y el entry point productivo
    - Validar la configuración de producción, crear Prisma y `createServer`, y escuchar en `Number(process.env.PORT) || 3000`.
    - Mantener API y cliente compilado en un solo proceso y puerto.
    - Hacer que un fallo de configuración detenga el arranque sin iniciar un servidor parcialmente válido.
    - _Requirements: 3.7, 7.5–7.6, 10.3, 12.2, 12.8, 14.4_

- [x] 6. Crear el contenido literal y su verificación
  - [x] 6.1 Implementar `Content_Fixture` tipado para las cinco páginas públicas
    - Transcribir literalmente el copy aprobado de la solicitud original, incluidos acentos, mayúsculas, signos, orden, nombres de secciones, CTAs, preguntas, respuestas, datos corporativos y mensajes de negocio; no resumir, corregir, traducir ni inventar texto.
    - Cubrir navegación, Inicio, Quiénes Somos, Servicios, FAQ, Contacto, footer, formularios, canales, CTA de WhatsApp y mensajes de estado.
    - Definir tipos para `PublicPath`, navegación, hero, beneficios, servicios con `ctaHref`, FAQ, contacto, footer y mensajes; conservar una entrada identificable para cada bloque visible.
    - Mantener el fixture separado de los componentes y exportar la fuente identificada como `original-feature-request`.
    - _Requirements: 1.1–1.6, 1.8, 2.6, 3.3, 4.1–4.2, 14.1_

  - [x] 6.2 Integrar una verificación de completitud de contenido al build
    - Crear una verificación ejecutable que falle si falta una entrada requerida, si la estructura del fixture no coincide con los tipos o si se detectan bloques visibles fuera de la fuente definida.
    - Hacer que el build ejecute la verificación antes de publicar los artefactos.
    - Preparar la base para comprobar mediante pruebas que el texto renderizado coincide carácter por carácter y conserva el orden del fixture.
    - _Requirements: 1.6–1.8, 12.1–12.2, 13.9, 14.1_

- [x] 7. Checkpoint de backend y contenido
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Implementar estilos, layout compartido y navegación responsive
  - [x] 8.1 Configurar tokens de marca y estilos globales
    - Definir en Tailwind los tokens `#0A0A0A`, `#171717`, `#1E1E1E`, `#262626`, `#10B981`, `#F97316`, `#EA580C`, `#F8FAFC` y `#94A3B8`.
    - Aplicar fondo, superficies, bordes, acentos, CTAs y colores de texto desde tokens, sin dispersar hexadecimales de marca en los componentes.
    - Añadir estilos globales para `:focus-visible`, `prefers-reduced-motion`, ancho fluido y ausencia de scroll horizontal.
    - _Requirements: 8.1–8.6, 9.1, 9.4, 9.8_

  - [x] 8.2 Crear el entry point React y el esqueleto de `AppShell`
    - Montar la aplicación React con TypeScript, cargar estilos globales y preparar el outlet de la ruta dentro del layout compartido.
    - Reservar espacio superior para el navbar fijo y una zona inferior que no oculte contenido.
    - Mantener la composición lista para montar `Navbar`, contenido de ruta, `Footer` y `WhatsApp_Button` sin duplicar layout por página.
    - _Requirements: 2.6, 9.1–9.2, 14.1_

  - [x] 8.3 Implementar `Navbar` fijo y responsive
    - Consumir las cinco etiquetas y rutas desde `Content_Fixture` y usar `NavLink` para navegación SPA sin recarga completa.
    - En móvil, mostrar un control accesible que abra y cierre los cinco enlaces; en escritorio, mostrar marca y enlaces requeridos.
    - Indicar la ruta activa con un estado visible que no dependa únicamente del color y mantener el orden de foco lógico.
    - _Requirements: 2.7, 3.1–3.2, 9.2–9.4, 9.7_

  - [x] 8.4 Implementar `Footer` corporativo
    - Renderizar únicamente copy y enlaces aprobados por `Content_Fixture`.
    - Proporcionar nombres accesibles para enlaces e iconos informativos y ocultar iconos puramente decorativos.
    - Mantener contraste, foco visible y adaptación a viewport móvil, tablet y escritorio.
    - _Requirements: 1.6, 2.6, 8.1–8.5, 9.1, 9.3–9.7, 14.1_

  - [x] 8.5 Implementar `WhatsApp_Button`
    - Usar `buildWhatsAppUrl` con la configuración validada y construir el destino canónico desde `WHATSAPP_NUMBER`.
    - Incluir un `aria-label` que describa propósito y destino, `target="_blank"` y `rel="noreferrer"` cuando abra una pestaña nueva.
    - Posicionar el botón con separación suficiente de campos, CTAs y controles en viewport móvil.
    - _Requirements: 3.4–3.7, 9.6, 9.10, 10.8, 14.1_

  - [x] 8.6 Integrar `AppShell` con Navbar, Footer y WhatsApp
    - Montar los tres componentes compartidos alrededor del contenido de ruta en cada `Public_Page`.
    - Verificar que el layout no duplique navegación ni footer y que las rutas mantengan el espacio superior e inferior necesario.
    - _Requirements: 2.6–2.7, 9.1–9.2, 14.1_

- [x] 9. Implementar las páginas públicas no transaccionales
  - [x] 9.1 Implementar `HomePage`
    - Renderizar desde `Content_Fixture` el hero, propuesta corporativa, beneficios, servicios destacados y CTA en el orden exacto aprobado.
    - Usar nodos React escapados, enlaces/CTAs con el destino definido por el fixture y componentes semánticos accesibles.
    - _Requirements: 1.1, 1.6–1.8, 3.3, 8.1–8.5, 9.1–9.9, 14.1_

  - [x] 9.2 Implementar `AboutPage`
    - Renderizar identidad, historia, valores y demás bloques de Quiénes Somos únicamente desde el fixture, conservando texto y orden literal.
    - Aplicar el layout responsive y los nombres accesibles establecidos para contenido e iconos.
    - _Requirements: 1.2, 1.6–1.8, 8.1–8.5, 9.1–9.9, 14.1_

  - [x] 9.3 Implementar `ServicesPage`
    - Renderizar cada servicio, descripción y CTA personalizado desde `Content_Fixture`, sin destinos alternativos definidos en el componente.
    - Mantener el orden del fixture y navegación SPA hacia el `ctaHref` aprobado.
    - _Requirements: 1.3, 1.6–1.8, 3.3, 8.1–8.5, 9.1–9.9, 14.1_

  - [x] 9.4 Implementar `FaqPage` y el acordeón accesible
    - Renderizar todas las preguntas y respuestas en el orden del fixture.
    - Implementar controles de teclado con nombre accesible, estado expandido y relación `aria-controls`/panel; abrir y cerrar sin perder el orden del contenido.
    - Respetar foco visible y `prefers-reduced-motion`.
    - _Requirements: 1.4, 1.6–1.8, 9.3–9.9, 13.9, 14.1_

  - [x] 9.5 Implementar `NotFoundPage`
    - Mostrar una vista segura para rutas públicas desconocidas, sin stack traces ni información de infraestructura.
    - Ofrecer navegación hacia páginas públicas válidas usando enlaces aprobados y accesibles.
    - _Requirements: 2.8, 7.3–7.4, 9.1–9.7, 11.7_

- [x] 10. Implementar el formulario de contacto y completar el routing
  - [x] 10.1 Implementar el cliente de envío y `submitContactForm`
    - Validar localmente con el `Contact_Schema` compartido antes de solicitar la API y enviar exactamente `fullName`, `email`, `phone`, `service` y `message` a `POST /api/contact`.
    - Modelar `idle`, `editing`, `validating`, `submitting`, `validationError`, `serverError`, `networkError` y `success`.
    - Impedir un segundo envío mientras exista una solicitud activa; tratar solo `201` con `CONTACT_CREATED` como éxito.
    - Conservar valores ante validación, HTTP `400/405/429/500`, timeout o red; limpiar solo tras éxito confirmado.
    - _Requirements: 4.8–4.13, 5.2, 11.1–11.5, 13.6, 14.2, 14.5_

  - [x] 10.2 Implementar `Contact_Form` con accesibilidad y estados visibles
    - Renderizar exactamente los controles `fullName`, `email`, `phone`, `service` y `message`; marcar obligatorios los cuatro campos requeridos y opcional `phone`.
    - Asociar cada label, control y error mediante `id`, `htmlFor` y `aria-describedby`; enfocar el primer campo inválido y conservar los valores ingresados.
    - Deshabilitar el envío durante `submitting`, mostrar errores específicos por campo, mensajes reintentables y una región `aria-live` para errores y éxito.
    - Ocultar o exponer iconos según su función semántica y mantener foco visible.
    - _Requirements: 4.1–4.13, 9.3–9.7, 11.1–11.5, 14.2_

  - [x] 10.3 Implementar `ContactPage`
    - Renderizar el copy literal de Contacto, datos corporativos, canales, CTA de WhatsApp y `Contact_Form` desde `Content_Fixture`.
    - Conectar el formulario con el cliente de envío sin acceso directo a Prisma y conservar el layout compartido.
    - Garantizar que la acción de éxito limpia los cinco controles y que cualquier error conserva el contenido para reintento.
    - _Requirements: 1.5–1.8, 2.6, 3.3–3.5, 4.1–4.13, 9.1–9.10, 14.1–14.3_

  - [x] 10.4 Completar el router y el wiring de la aplicación
    - Configurar React Router DOM v6+ con `/`, `/nosotros`, `/servicios`, `/faq`, `/contacto` y `*` para `NotFoundPage` dentro de `AppShell`.
    - Montar `HomePage`, `AboutPage`, `ServicesPage`, `FaqPage`, `ContactPage` y `NotFoundPage` sin recarga completa.
    - Confirmar que la resolución del servidor para rutas no API entrega la SPA y que React Router resuelve la página correcta.
    - _Requirements: 2.1–2.8, 2.9, 7.4, 13.7, 14.4_

- [x] 11. Crear la suite automatizada de unitarias, propiedades, integración y accesibilidad
  - [x] 11.1 Escribir pruebas unitarias de contratos y funciones puras
    - Cubrir `Contact_Schema`, `validateContactInput`, límites, trim, campos desconocidos, teléfono opcional, `normalizeContactInput`, `resolvePublicRoute` y `buildWhatsAppUrl`.
    - Comprobar que la salida no muta inputs, que conserva solo claves canónicas y que la URL de WhatsApp es exactamente la aprobada.
    - _Requirements: 3.4–3.7, 4.3–4.7, 5.1–5.2, 13.1–13.3, 13.7–13.8, 14.5_

  - [x] 11.2 Escribir pruebas unitarias y de componentes para layout y formulario
    - Cubrir Navbar móvil/escritorio, navegación activa, Footer, WhatsApp, acordeón FAQ, campos/labels/errores, foco, región `aria-live` y estados del formulario.
    - Verificar éxito, errores HTTP, error de red, conservación de valores, prevención de doble submit y limpieza posterior a `CONTACT_CREATED`.
    - _Requirements: 2.6–2.7, 3.1–3.5, 4.8–4.13, 9.2–9.10, 11.1–11.5_

  - [x] 11.3 Escribir la prueba de propiedad 1: contrato estricto y validación determinista
    - **Property 1: Contrato estricto y validación determinista**
    - Generar valores JSON con `fast-check`, ejecutar `Contact_Schema.safeParse` dos veces y verificar el mismo resultado; rechazar tipos, límites, formatos y claves desconocidas inválidos.
    - Ejecutar al menos 100 casos.
    - **Validates: Requirements 4.3–4.7, 5.1–5.2, 13.1–13.2**

  - [x] 11.4 Escribir la prueba de propiedad 2: normalización idempotente y sin mutación
    - **Property 2: Normalización idempotente y sin mutación**
    - Generar `ContactLeadInput` válidos, clonar el input, verificar `normalizeContactInput(normalizeContactInput(input)) === normalizeContactInput(input)`, ausencia de mutación y claves canónicas exactas.
    - Ejecutar al menos 100 casos.
    - **Validates: Requirements 5.6, 13.3, 14.5**

  - [x] 11.5 Escribir la prueba de propiedad 3: validación antes de persistencia
    - **Property 3: Validación antes de persistencia**
    - Generar bodies rechazados por el esquema, ejecutar el handler aislado y verificar HTTP `400`, código `VALIDATION_ERROR` y cero llamadas a `prisma.contactLead.create`.
    - Ejecutar al menos 100 casos.
    - **Validates: Requirements 5.4–5.5, 5.8, 13.4**

  - [x] 11.6 Escribir la prueba de propiedad 4: creación de un registro canónico
    - **Property 4: Un contacto válido produce un registro canónico**
    - Generar inputs válidos, verificar una única creación, HTTP `201`, datos normalizados, `phone` como `null` cuando corresponda y ausencia de `name`, `status` y `updatedAt`.
    - Ejecutar al menos 100 casos.
    - **Validates: Requirements 5.6, 6.1–6.5, 6.7, 13.5, 13.10**

  - [x] 11.7 Escribir la prueba de propiedad 5: conservación ante error
    - **Property 5: Conservación del formulario ante error**
    - Generar estados de formulario, respuestas HTTP no exitosas y fallos de red; verificar que los cinco valores se conservan y el estado nunca es `success`.
    - Ejecutar al menos 100 casos.
    - **Validates: Requirements 4.10, 4.12–4.13, 11.1–11.2, 11.4–11.5, 13.6**

  - [x] 11.8 Escribir la prueba de propiedad 6: no duplicación durante el envío
    - **Property 6: No duplicación durante el envío**
    - Generar secuencias con submits repetidos mientras el estado es `submitting` y verificar que como máximo una solicitud queda activa para el mismo envío.
    - Ejecutar al menos 100 casos.
    - **Validates: Requirements 4.9, 13.6**

  - [x] 11.9 Escribir la prueba de propiedad 7: ruteo total
    - **Property 7: Ruteo total**
    - Generar pathnames absolutos y verificar que `resolvePublicRoute` siempre devuelve `home`, `about`, `services`, `faq`, `contact` o `notFound`, nunca `undefined` ni una ruta API.
    - Ejecutar al menos 100 casos.
    - **Validates: Requirements 2.1–2.5, 13.7**

  - [x] 11.10 Escribir la prueba de propiedad 8: enlace WhatsApp canónico
    - **Property 8: Enlace WhatsApp canónico**
    - Generar representaciones válidas con caracteres de formato de `584162459941` y verificar exactamente `https://wa.me/584162459941`.
    - Ejecutar al menos 100 casos y cubrir entradas inválidas con error de configuración.
    - **Validates: Requirements 3.4–3.7, 13.8**

  - [x] 11.11 Escribir la prueba de propiedad 9: correspondencia exacta de contenido
    - **Property 9: Correspondencia exacta de contenido**
    - Recorrer cada clave visible de `Content_Fixture`, renderizar la página correspondiente y comparar texto carácter por carácter, incluyendo el orden de bloques.
    - Verificar que no se usa `dangerouslySetInnerHTML` para el copy del fixture.
    - Ejecutar la propiedad para cada página y sus entradas.
    - **Validates: Requirements 1.1–1.8, 13.9**

  - [x] 11.12 Escribir la prueba de propiedad 10: healthcheck aislado
    - **Property 10: Healthcheck aislado**
    - Generar configuraciones de servidor listo y verificar HTTP `200`, `{ "status": "ok" }` y cero consultas o modificaciones sobre `ContactLead`.
    - Ejecutar al menos 100 casos o iteraciones equivalentes del handler aislado.
    - **Validates: Requirements 7.1–7.2, 13.12**

  - [x] 11.13 Escribir pruebas de contrato e integración del servidor y PostgreSQL
    - Probar `GET /api/health`, `POST /api/contact` válido e inválido, JSON malformado, campos desconocidos, `405`, `429`, body excedido, fallo de persistencia y respuestas sin datos internos.
    - Verificar creación de un único `ContactLead` con los siete campos canónicos y `phone` nullable; comprobar que un input inválido no crea registros.
    - Probar que las rutas API desconocidas devuelven JSON `404`, que rutas no API reciben `index.html`, que `DATABASE_URL` no aparece en el cliente y que la tasa de solicitudes se limita por origen.
    - Ejecutar contra un Prisma/PostgreSQL de prueba o doble controlado, sin usar el servidor de desarrollo persistente.
    - _Requirements: 5.3–5.9, 6.1–6.7, 7.1–7.6, 10.1–10.10, 11.2–11.8, 13.9–13.12_

  - [x] 11.14 Ejecutar pruebas automatizadas de accesibilidad y responsive
    - Auditar las cinco páginas y el layout con Testing Library y una herramienta de accesibilidad apropiada.
    - Verificar labels, `aria-describedby`, `aria-live`, nombres de iconos, foco visible, acordeón, menú móvil, `target`/`rel` de WhatsApp, contraste y ausencia de scroll horizontal en viewports móvil, tablet y escritorio.
    - Verificar reducción de animaciones con `prefers-reduced-motion` y separación del botón flotante.
    - _Requirements: 2.6–2.8, 3.1–3.5, 8.1–8.6, 9.1–9.10, 13.9_

  - [x] 11.15 Escribir pruebas automatizadas de build y configuración Docker
    - Verificar la existencia de `dist/client`, `dist/server/index.js`, migraciones, `prisma/schema.prisma`, `.env.example` y los tokens requeridos.
    - Verificar que el Dockerfile usa `node:20-alpine`, instala `openssl`, expone `3000` y contiene exactamente `CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server/index.js"]`.
    - Verificar que la configuración de build ejecuta la comprobación de `Content_Fixture` y mantiene dependencias fijadas.
    - _Requirements: 8.6, 10.10, 12.1–12.10, 13.9, 14.1_

- [x] 12. Completar build de producción y empaquetado Docker/Dokploy
  - [x] 12.1 Integrar el pipeline de build y sus artefactos
    - Hacer que el pipeline valide `Content_Fixture`, compile el cliente Vite en `dist/client` y compile TypeScript del servidor en `dist/server` con `dist/server/index.js` como entry point.
    - Incluir generación del cliente Prisma y conservar migraciones en el flujo de producción.
    - Garantizar que `npm run build` sea reproducible con el lockfile y falle antes de producir un build publicable si la verificación de contenido o compilación falla.
    - _Requirements: 1.7, 6.6, 12.1–12.2, 12.6, 12.10, 14.1_

  - [x] 12.2 Crear el Dockerfile multi-stage de producción
    - Usar `node:20-alpine` en las etapas apropiadas e instalar `openssl` para Prisma.
    - Copiar únicamente artefactos y dependencias de producción necesarios, incluyendo `dist/`, `prisma/schema.prisma`, `prisma/migrations/` y el cliente Prisma generado.
    - Exponer el puerto `3000`, recibir `DATABASE_URL`, `PORT` y `WHATSAPP_NUMBER` desde el entorno y no incluir credenciales en repositorio o imagen.
    - Usar exactamente `CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server/index.js"]` para detener el arranque si falla una migración.
    - _Requirements: 10.10, 11.8, 12.3–12.9_

- [x] 13. Checkpoint final de verificación
  - Ejecutar la suite de pruebas en modo de una sola ejecución y `npm run build`.
  - Confirmar que el build genera `dist/client` y `dist/server/index.js`, que se mantienen los nombres canónicos y que ningún requisito de `requirements.md` quedó sin una implementación o prueba asociada.
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Las tareas marcadas con `*` son pruebas opcionales para acelerar un MVP, pero deben implementarse para cumplir la cobertura completa de `requirements.md` y `design.md`.
- Las tareas no marcadas con `*` son implementación requerida; no se deben omitir ni sustituir por mocks permanentes.
- El copy de `Content_Fixture` debe provenir literalmente de la solicitud original disponible para el implementador. No se permite inventar texto para completar el fixture.
- El contrato canónico prevalece sobre nombres heredados: nunca usar `name`, `status` o `updatedAt` en `ContactLead`, y nunca enviar otros campos junto con `fullName`, `email`, `phone`, `service` y `message`.
- El formulario conserva `phone` como string de presentación, pero la persistencia debe guardar `NULL` si está ausente o vacío después de normalizar.
- Las pruebas deben ejecutarse con comandos de una sola ejecución. No iniciar servidores de desarrollo, watchers ni aplicaciones interactivas como parte de estas tareas.
- Las tareas de pruebas de propiedades usan `fast-check` con al menos 100 iteraciones por propiedad y cada propiedad está separada para mantener trazabilidad con el diseño.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2"] },
    { "id": 1, "tasks": ["1.3"] },
    { "id": 2, "tasks": ["2"] },
    { "id": 3, "tasks": ["3.1", "3.3", "3.4"] },
    { "id": 4, "tasks": ["3.2"] },
    { "id": 5, "tasks": ["4.1"] },
    { "id": 6, "tasks": ["4.2"] },
    { "id": 7, "tasks": ["5.1"] },
    { "id": 8, "tasks": ["5.2", "5.3", "5.4", "6.1"] },
    { "id": 9, "tasks": ["5.5", "6.2"] },
    { "id": 10, "tasks": ["7"] },
    { "id": 11, "tasks": ["8.1", "8.2"] },
    { "id": 12, "tasks": ["8.3", "8.4", "8.5"] },
    { "id": 13, "tasks": ["8.6"] },
    { "id": 14, "tasks": ["9.1", "9.2", "9.3", "9.4", "9.5"] },
    { "id": 15, "tasks": ["10.1"] },
    { "id": 16, "tasks": ["10.2"] },
    { "id": 17, "tasks": ["10.3"] },
    { "id": 18, "tasks": ["10.4"] },
    { "id": 19, "tasks": ["11.1", "11.2"] },
    { "id": 20, "tasks": ["11.3", "11.4", "11.5", "11.6", "11.7", "11.8", "11.9", "11.10", "11.11", "11.12"] },
    { "id": 21, "tasks": ["11.13", "11.14"] },
    { "id": 22, "tasks": ["12.1"] },
    { "id": 23, "tasks": ["12.2"] },
    { "id": 24, "tasks": ["11.15"] },
    { "id": 25, "tasks": ["13"] }
  ]
}
```

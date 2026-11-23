# Requirements Document

## Introduction

Este documento define el contrato funcional, técnico y verificable para la aplicación web corporativa de Multiservicios Sanabria. El alcance conserva la solicitud original y el diseño técnico aprobado: una SPA React con TypeScript y Vite, un servidor unificado Node.js/Express, una API bajo `/api/*`, persistencia PostgreSQL mediante Prisma, validación Zod compartida y despliegue Docker/Dokploy en un solo puerto.

La solicitud original es la fuente de verdad del contenido visible. El `Content_Fixture` debe copiar ese contenido literalmente, incluidos acentos, mayúsculas, signos, orden, nombres de secciones, datos corporativos, llamadas a la acción, preguntas frecuentes y mensajes de negocio. Este documento define qué debe verificarse; no autoriza resumir, corregir, traducir, reordenar ni inventar copy.

El contrato canónico de este documento prevalece sobre referencias inconsistentes del diseño anterior:

- El formulario y la API usan exactamente `fullName`, `email`, `phone`, `service` y `message`.
- `ContactLead` contiene exactamente `id`, `fullName`, `email`, `phone`, `service`, `message` y `createdAt`.
- `phone` es opcional y se almacena como `NULL` cuando no se proporciona.
- `ContactLead` no contiene `name`, `status` ni `updatedAt`.
- La URL canónica de WhatsApp es `https://wa.me/584162459941`, construida desde `WHATSAPP_NUMBER`.

## Glossary

- **Corporate_Web_App**: Aplicación web corporativa de Multiservicios Sanabria, incluidas las páginas públicas, el layout compartido, el formulario, el cliente API y los estados visibles.
- **User**: Persona que visita una página pública o envía una solicitud de contacto.
- **Public_Page**: Cualquiera de las rutas `/`, `/nosotros`, `/servicios`, `/faq` o `/contacto`.
- **Home_Page**: Página pública asociada a `/`.
- **About_Page**: Página pública asociada a `/nosotros`.
- **Services_Page**: Página pública asociada a `/servicios`.
- **Faq_Page**: Página pública asociada a `/faq`.
- **Contact_Page**: Página pública asociada a `/contacto`.
- **NotFound_Page**: Vista para una ruta pública desconocida que ofrece navegación hacia una `Public_Page` válida.
- **Content_Fixture**: Fixture versionado que contiene, carácter por carácter, el copy aprobado de la solicitud original para navegación, Inicio, Quiénes Somos, Servicios, FAQ, Contacto, footer, CTAs, datos corporativos y mensajes de negocio.
- **Approved_Copy**: Texto que coincide exactamente con la entrada correspondiente del `Content_Fixture`.
- **App_Shell**: Layout compartido que monta `Navbar`, el contenido de la ruta, `Footer` y `WhatsApp_Button`.
- **Navbar**: Navegación fija y responsive con la marca y los cinco enlaces públicos.
- **Footer**: Pie compartido con el copy y los enlaces corporativos aprobados.
- **CTA**: Llamada a la acción visible cuyo destino está definido por el `Content_Fixture`.
- **WhatsApp_Button**: Enlace global hacia el número de WhatsApp configurado, con nombre accesible.
- **Contact_Form**: Formulario de `/contacto` con los campos exactos `fullName`, `email`, `phone`, `service` y `message`.
- **ContactLeadInput**: Objeto de entrada estricto con los cinco campos de `Contact_Form`, sin campos desconocidos.
- **Contact_Schema**: Esquema Zod compartido que valida y normaliza `ContactLeadInput` en el navegador y en el servidor.
- **Contact_API**: Endpoint `POST /api/contact` que valida y persiste solicitudes de contacto.
- **ContactLead**: Modelo persistido con exactamente `id`, `fullName`, `email`, `phone`, `service`, `message` y `createdAt`.
- **Prisma_Client**: Cliente generado por Prisma para acceder a PostgreSQL mediante operaciones tipadas y parametrizadas.
- **Unified_Server**: Proceso Express que expone la API, sirve los archivos compilados y resuelve el fallback SPA en el mismo puerto.
- **Build_Pipeline**: Proceso que compila el cliente Vite y el servidor TypeScript en artefactos de producción.
- **Build_Artifacts**: Archivos compilados en `dist/client` y `dist/server`, incluido `dist/server/index.js`.
- **Healthcheck**: Solicitud `GET /api/health` que verifica que `Unified_Server` atiende HTTP.
- **Deployment_Image**: Imagen Docker multi-stage basada en `node:20-alpine` con los artefactos de producción, Prisma y las migraciones.
- **Property_Test_Suite**: Pruebas con `fast-check` para propiedades universales de lógica pura y handlers aislados, con al menos 100 iteraciones por propiedad.
- **Test_Suite**: Conjunto de pruebas unitarias, de componentes, de contrato, de integración, de accesibilidad y de build.
- **Request_ID**: Identificador correlacionable de una solicitud HTTP que no contiene datos personales ni secretos.
- **WHATSAPP_NUMBER**: Variable pública de configuración que contiene el número de WhatsApp del negocio.
- **DATABASE_URL**: Variable privada de configuración que contiene la conexión PostgreSQL y que no puede exponerse al cliente.
- **Dokploy**: Plataforma de despliegue que ejecuta la `Deployment_Image` y proporciona sus variables de entorno.

## Requirements

### Requirement 1: Contenido corporativo exacto

**User Story:** Como User, quiero leer información corporativa consistente, para conocer Multiservicios Sanabria y sus servicios.

#### Acceptance Criteria

1. WHEN un User visita `/`, THE Corporate_Web_App SHALL renderizar el `Approved_Copy` de Inicio para hero, propuesta corporativa, beneficios, servicios destacados y CTA en el orden aprobado.
2. WHEN un User visita `/nosotros`, THE Corporate_Web_App SHALL renderizar el `Approved_Copy` de Quiénes Somos para identidad, historia, valores y demás bloques definidos en la solicitud original.
3. WHEN un User visita `/servicios`, THE Corporate_Web_App SHALL renderizar el `Approved_Copy` de Servicios para cada servicio, su descripción y su CTA personalizado.
4. WHEN un User visita `/faq`, THE Corporate_Web_App SHALL renderizar cada pregunta y respuesta del `Approved_Copy` en el contenido y orden definidos en la solicitud original.
5. WHEN un User visita `/contacto`, THE Corporate_Web_App SHALL renderizar el `Approved_Copy` de Contacto, los datos corporativos, los canales de contacto, el CTA de WhatsApp y el `Contact_Form`.
6. THE Content_Fixture SHALL contener una entrada literal para cada bloque visible de navegación, Inicio, Quiénes Somos, Servicios, FAQ, Contacto, footer, CTA, dato corporativo y mensaje de negocio aprobado.
7. IF un bloque visible difiere carácter por carácter de su entrada en `Content_Fixture`, THEN THE Build_Pipeline SHALL marcar la verificación de contenido como fallida antes de publicar el build.
8. THE Corporate_Web_App SHALL renderizar el copy aprobado como nodos React escapados y SHALL conservar el orden definido por `Content_Fixture`.

### Requirement 2: Rutas y layout compartido

**User Story:** Como User, quiero navegar entre páginas corporativas con una estructura consistente, para encontrar información sin perder el contexto del sitio.

#### Acceptance Criteria

1. WHEN un User solicita `/`, THE Corporate_Web_App SHALL resolver la solicitud como `Home_Page`.
2. WHEN un User solicita `/nosotros`, THE Corporate_Web_App SHALL resolver la solicitud como `About_Page`.
3. WHEN un User solicita `/servicios`, THE Corporate_Web_App SHALL resolver la solicitud como `Services_Page`.
4. WHEN un User solicita `/faq`, THE Corporate_Web_App SHALL resolver la solicitud como `Faq_Page`.
5. WHEN un User solicita `/contacto`, THE Corporate_Web_App SHALL resolver la solicitud como `Contact_Page`.
6. WHEN un User visita cualquier `Public_Page`, THE App_Shell SHALL montar `Navbar`, el contenido de la ruta, `Footer` y `WhatsApp_Button`.
7. WHEN un User activa un enlace del `Navbar`, THE Corporate_Web_App SHALL navegar a la `Public_Page` correspondiente sin recargar el documento completo.
8. WHEN un User visita una ruta desconocida que no pertenece a `/api`, THE Corporate_Web_App SHALL mostrar `NotFound_Page` con navegación hacia una `Public_Page` válida.
9. WHILE una ruta comienza con `/api`, THE Unified_Server SHALL procesar la solicitud como API y SHALL excluirla del fallback HTML de la SPA.

### Requirement 3: Navegación responsive y llamadas a la acción

**User Story:** Como User de móvil o escritorio, quiero acceder a la navegación y a los CTAs desde cualquier tamaño de pantalla, para contactar con la empresa desde el canal que prefiera.

#### Acceptance Criteria

1. WHEN el viewport tiene ancho móvil, THE Navbar SHALL mostrar un control accesible que permita abrir y cerrar los cinco enlaces públicos.
2. WHEN el viewport tiene ancho de escritorio, THE Navbar SHALL mostrar la marca y los cinco enlaces públicos sin ocultar los enlaces requeridos.
3. WHEN un User activa un CTA de una página, THE Corporate_Web_App SHALL usar el destino definido para ese CTA en `Content_Fixture`.
4. WHEN un User activa `WhatsApp_Button`, THE Corporate_Web_App SHALL abrir `https://wa.me/584162459941` mediante el número configurado en `WHATSAPP_NUMBER`.
5. WHEN `WhatsApp_Button` abre una pestaña nueva, THE Corporate_Web_App SHALL incluir `target="_blank"` y `rel="noreferrer"`.
6. IF `WHATSAPP_NUMBER` contiene caracteres de formato permitido, THEN THE Corporate_Web_App SHALL normalizar el número antes de construir la URL.
7. IF `WHATSAPP_NUMBER` no puede producir un número válido, THEN THE Unified_Server SHALL registrar el fallo sin exponer secretos al navegador y SHALL marcar el arranque como no válido para producción.

### Requirement 4: Formulario de contacto

**User Story:** Como User, quiero enviar una consulta con mis datos y el servicio de interés, para que Multiservicios Sanabria pueda responderme.

#### Acceptance Criteria

1. WHEN un User visita `/contacto`, THE Contact_Form SHALL renderizar exactamente los campos `fullName`, `email`, `phone`, `service` y `message`.
2. WHEN un User visualiza `Contact_Form`, THE Contact_Form SHALL marcar `fullName`, `email`, `service` y `message` como obligatorios y SHALL marcar `phone` como opcional.
3. WHEN un User proporciona `fullName`, THE Contact_Form SHALL aceptar entre 2 y 100 caracteres después de eliminar espacios externos.
4. WHEN un User proporciona `email`, THE Contact_Form SHALL aceptar una dirección válida de hasta 254 caracteres después de eliminar espacios externos.
5. WHEN un User proporciona `phone`, THE Contact_Form SHALL aceptar entre 7 y 30 caracteres después de eliminar espacios externos y SHALL aceptar únicamente dígitos, espacios, `+`, `(`, `)`, `.`, y `-`.
6. WHEN un User selecciona `service`, THE Contact_Form SHALL enviar un valor no vacío de hasta 100 caracteres después de eliminar espacios externos.
7. WHEN un User proporciona `message`, THE Contact_Form SHALL aceptar entre 10 y 2000 caracteres después de eliminar espacios externos.
8. WHEN un User envía `Contact_Form` con datos que cumplen `Contact_Schema`, THE Contact_Form SHALL iniciar una solicitud `POST /api/contact` con exactamente `fullName`, `email`, `phone`, `service` y `message`.
9. WHILE `Contact_Form` está enviando una solicitud, THE Contact_Form SHALL deshabilitar el control de envío y SHALL impedir una segunda solicitud simultánea.
10. WHEN la validación local rechaza un campo, THE Contact_Form SHALL mostrar el error junto al campo, conservar los valores ingresados y enfocar el primer campo inválido.
11. WHEN `Contact_API` responde HTTP 201 con `CONTACT_CREATED`, THE Contact_Form SHALL mostrar el estado de éxito y limpiar los valores del formulario.
12. IF `Contact_API` responde con un estado HTTP distinto de 201, THEN THE Contact_Form SHALL mostrar un error reintentable y SHALL conservar los valores ingresados.
13. IF la solicitud de `Contact_API` produce un fallo de red o timeout, THEN THE Contact_Form SHALL mostrar un error de red reintentable y SHALL conservar los valores ingresados.

### Requirement 5: Validación compartida y Contact_API

**User Story:** Como operador del sistema, quiero que cada solicitud de contacto se valide en ambas fronteras, para mantener datos consistentes y evitar escrituras inválidas.

#### Acceptance Criteria

1. THE Contact_Schema SHALL validar un objeto estricto con exactamente `fullName`, `email`, `phone`, `service` y `message`.
2. WHEN el navegador valida un `ContactLeadInput`, THE Contact_Schema SHALL aplicar las mismas reglas de tipos, límites, trim y formato que aplica el servidor.
3. WHEN `Contact_API` recibe un JSON válido para `ContactLeadInput`, THE Contact_API SHALL volver a validar el body con `Contact_Schema` antes de invocar `Prisma_Client`.
4. IF `Contact_API` recibe JSON malformado, THEN THE Contact_API SHALL responder HTTP 400 con código `VALIDATION_ERROR`.
5. IF `Contact_API` recibe campos inválidos o desconocidos, THEN THE Contact_API SHALL responder HTTP 400 con código `VALIDATION_ERROR` y SHALL omitir la escritura en PostgreSQL.
6. WHEN `Contact_API` recibe un `ContactLeadInput` válido, THE Contact_API SHALL normalizar los espacios externos, representar un `phone` ausente como `NULL` al persistir y SHALL responder HTTP 201 con `{ "success": true, "code": "CONTACT_CREATED" }` después de una persistencia exitosa.
7. IF una solicitud usa un método HTTP distinto de POST en `/api/contact`, THEN THE Unified_Server SHALL responder HTTP 405 con un error JSON de método no permitido.
8. IF una operación de persistencia falla, THEN THE Contact_API SHALL responder HTTP 500 con código `PERSISTENCE_ERROR` o `INTERNAL_ERROR` sin incluir SQL, stack trace, credenciales, variables de entorno ni detalles internos de Prisma.
9. THE Unified_Server SHALL aplicar un límite de tamaño al body JSON antes de ejecutar `Contact_Schema`.

### Requirement 6: Persistencia de ContactLead

**User Story:** Como responsable de la empresa, quiero que cada contacto válido quede almacenado con todos sus datos, para gestionar las solicitudes recibidas.

#### Acceptance Criteria

1. THE Prisma_Client SHALL persistir `ContactLead` en PostgreSQL mediante un modelo con exactamente los campos `id`, `fullName`, `email`, `phone`, `service`, `message` y `createdAt`.
2. WHEN `Contact_API` persiste un contacto válido, THE Prisma_Client SHALL crear exactamente un `ContactLead`.
3. WHEN Prisma crea un `ContactLead`, THE Prisma_Client SHALL generar `id` y la base de datos SHALL generar `createdAt`.
4. WHEN `phone` no está presente o está vacío después de normalizar un `ContactLeadInput` válido, THE Prisma_Client SHALL persistir `phone` como `NULL`.
5. WHEN `ContactLead` se persiste, THE Prisma_Client SHALL conservar `fullName`, `email`, `service` y `message` después de la normalización definida por `Contact_Schema`.
6. THE Unified_Server SHALL obtener la conexión PostgreSQL desde `DATABASE_URL` y SHALL usar migraciones Prisma versionadas para crear o actualizar `ContactLead`.
7. THE Prisma_Client SHALL ejecutar operaciones parametrizadas mediante Prisma y SHALL omitir campos que no pertenezcan al modelo canónico.

### Requirement 7: Healthcheck y comportamiento del servidor

**User Story:** Como operador de despliegue, quiero un healthcheck estable y una API separada del fallback SPA, para detectar fallos reales del servicio.

#### Acceptance Criteria

1. WHEN un cliente solicita `GET /api/health` mientras `Unified_Server` está listo, THE Unified_Server SHALL responder HTTP 200 con `{ "status": "ok" }`.
2. WHEN `Unified_Server` atiende `GET /api/health`, THE Healthcheck SHALL responder sin consultar registros de `ContactLead`.
3. IF una ruta `/api/*` no existe, THEN THE Unified_Server SHALL responder un error JSON HTTP 404 y SHALL evitar devolver `index.html`.
4. WHEN `Unified_Server` sirve una ruta no API que no corresponde a un archivo estático, THE Unified_Server SHALL entregar `dist/client/index.html` para que React Router resuelva la ruta.
5. WHEN `Unified_Server` inicia, THE Unified_Server SHALL escuchar en `Number(process.env.PORT) || 3000`.
6. THE Unified_Server SHALL exponer la API y los archivos estáticos de `dist/client` en un solo proceso y un solo puerto.

### Requirement 8: Identidad visual

**User Story:** Como User, quiero una interfaz coherente con la identidad de Multiservicios Sanabria, para reconocer la marca y leer el contenido con claridad.

#### Acceptance Criteria

1. THE Corporate_Web_App SHALL usar `#0A0A0A` como fondo base.
2. THE Corporate_Web_App SHALL usar `#171717` o `#1E1E1E` como superficies de tarjetas y `#262626` como borde sutil.
3. THE Corporate_Web_App SHALL usar `#10B981` para acentos, iconos, badges, estados activos y focos visibles.
4. THE Corporate_Web_App SHALL usar `#F97316` para CTA principales y `#EA580C` para estados hover y focus apropiados de esos CTA.
5. THE Corporate_Web_App SHALL usar `#F8FAFC` para títulos y `#94A3B8` para párrafos.
6. THE Corporate_Web_App SHALL definir los tokens de marca en la configuración de Tailwind y SHALL evitar valores hexadecimales de marca dispersos en componentes.

### Requirement 9: Responsive design y accesibilidad

**User Story:** Como User con distintas capacidades y dispositivos, quiero operar el sitio con teclado, lector de pantalla y viewport móvil, para acceder a la información y al formulario sin barreras.

#### Acceptance Criteria

1. THE Corporate_Web_App SHALL renderizar las cinco `Public_Page` sin scroll horizontal en viewport móvil, tablet y escritorio.
2. THE Navbar SHALL mantener un espacio superior suficiente para que el contenido no quede cubierto por la navegación fija.
3. WHEN un User usa navegación por teclado, THE Corporate_Web_App SHALL permitir acceder a `Navbar`, menú móvil, enlaces, CTAs, acordeón FAQ y `Contact_Form` en un orden lógico.
4. WHEN un control interactivo recibe foco de teclado, THE Corporate_Web_App SHALL mostrar un indicador `:focus-visible` distinguible mediante el color de acento o CTA correspondiente.
5. THE Contact_Form SHALL asociar cada label con su input, SHALL asociar cada error con su campo y SHALL anunciar estados de error y éxito mediante una región `aria-live`.
6. THE WhatsApp_Button SHALL incluir un `aria-label` que describa su destino y propósito.
7. THE Corporate_Web_App SHALL proporcionar nombres accesibles para iconos que transmitan información y SHALL ocultar iconos puramente decorativos a los lectores de pantalla.
8. WHILE `prefers-reduced-motion` está activo, THE Corporate_Web_App SHALL reducir o eliminar animaciones no esenciales.
9. THE Corporate_Web_App SHALL mantener contraste legible entre texto, superficies, bordes y estados interactivos según una auditoría automatizada de accesibilidad.
10. WHEN `WhatsApp_Button` aparece en viewport móvil, THE Corporate_Web_App SHALL mantenerlo separado de campos, CTAs y controles que puedan quedar debajo del botón.

### Requirement 10: Seguridad y privacidad

**User Story:** Como responsable de la aplicación, quiero proteger los datos enviados y los secretos de infraestructura, para reducir la exposición de la aplicación pública.

#### Acceptance Criteria

1. THE Unified_Server SHALL validar cada body de `POST /api/contact` en el servidor aunque el navegador haya ejecutado validación local.
2. THE Prisma_Client SHALL ejecutar operaciones parametrizadas mediante Prisma y SHALL evitar SQL construido por concatenación de strings.
3. THE Unified_Server SHALL mantener `DATABASE_URL` fuera del bundle del cliente y fuera de las respuestas HTTP públicas.
4. THE Unified_Server SHALL limitar la frecuencia de solicitudes a `POST /api/contact` por origen y SHALL responder HTTP 429 con código `RATE_LIMITED` cuando el origen exceda el límite configurado.
5. THE Unified_Server SHALL aplicar límites de body JSON y cabeceras de seguridad en solicitudes HTTP.
6. THE Unified_Server SHALL registrar método, ruta, status, duración y `Request_ID` sin registrar el body completo, email, teléfono ni mensaje de `POST /api/contact`.
7. THE Corporate_Web_App SHALL renderizar el copy corporativo como nodos React escapados y SHALL evitar `dangerouslySetInnerHTML` para contenido de la solicitud original.
8. WHEN `WhatsApp_Button` abre una pestaña nueva, THE Corporate_Web_App SHALL usar `rel="noreferrer"`.
9. THE Unified_Server SHALL omitir `id` y cualquier otro identificador interno de `ContactLead` de la respuesta pública de creación.
10. THE Deployment_Image SHALL recibir `DATABASE_URL`, `PORT` y `WHATSAPP_NUMBER` desde el entorno de despliegue y SHALL evitar incluir credenciales en el repositorio o en la imagen.

### Requirement 11: Manejo de errores y resiliencia

**User Story:** Como User, quiero recibir mensajes claros cuando una operación falla, para corregir datos o reintentar sin perder mi consulta.

#### Acceptance Criteria

1. IF la validación local falla, THEN THE Contact_Form SHALL mostrar mensajes específicos por campo y SHALL conservar cada valor no inválido.
2. IF `Contact_API` devuelve HTTP 400, THEN THE Contact_Form SHALL mostrar los errores de validación recibidos o los errores equivalentes del cliente.
3. IF `Contact_API` devuelve HTTP 429, THEN THE Contact_Form SHALL mostrar un mensaje de reintento sin revelar el límite interno.
4. IF `Contact_API` devuelve HTTP 500, THEN THE Contact_Form SHALL mostrar un mensaje genérico de persistencia y SHALL conservar el contenido del formulario.
5. IF `Contact_API` no está disponible, THEN THE Contact_Form SHALL mostrar un mensaje de red y SHALL permitir un nuevo intento.
6. IF el servidor recibe un body JSON que excede el límite configurado, THEN THE Unified_Server SHALL responder un error HTTP 400 o 413 con formato JSON.
7. IF una ruta pública no existe, THEN THE Corporate_Web_App SHALL mostrar `NotFound_Page` sin exponer stack traces ni información de infraestructura.
8. IF una migración Prisma falla durante el despliegue, THEN THE Deployment_Image SHALL detener el arranque de `Unified_Server` y SHALL mantener el despliegue no saludable.

### Requirement 12: Build, compilación y despliegue Docker/Dokploy

**User Story:** Como operador de Dokploy, quiero construir y arrancar la aplicación con un único contenedor, para desplegar el frontend y la API de forma reproducible.

#### Acceptance Criteria

1. THE Build_Pipeline SHALL compilar el cliente Vite en `dist/client`.
2. THE Build_Pipeline SHALL compilar el servidor TypeScript en `dist/server` y SHALL generar `dist/server/index.js` como entry point productivo.
3. THE Deployment_Image SHALL usar un Dockerfile multi-stage basado en `node:20-alpine`.
4. THE Deployment_Image SHALL instalar `openssl` para la compatibilidad requerida por Prisma.
5. THE Deployment_Image SHALL exponer el puerto `3000`.
6. THE Deployment_Image SHALL incluir `prisma/schema.prisma`, las migraciones necesarias y los artefactos de producción.
7. WHEN el contenedor inicia, THE Deployment_Image SHALL ejecutar exactamente `npx prisma migrate deploy && node dist/server/index.js`.
8. THE Deployment_Image SHALL leer `DATABASE_URL`, `PORT` y `WHATSAPP_NUMBER` desde variables de entorno de Dokploy.
9. WHEN el contenedor está listo, THE Healthcheck SHALL poder acceder a `GET /api/health` en el puerto configurado.
10. THE Build_Pipeline SHALL producir un build reproducible con las dependencias fijadas en el lockfile.

### Requirement 13: Pruebas basadas en propiedades y verificación

**User Story:** Como desarrollador, quiero probar propiedades universales y contratos de integración, para detectar errores de validación, normalización, navegación y envío antes de publicar.

#### Acceptance Criteria

1. THE Property_Test_Suite SHALL usar `fast-check` para propiedades de lógica pura y SHALL ejecutar al menos 100 iteraciones por propiedad.
2. WHEN `Property_Test_Suite` genera cualquier valor JSON, THE Property_Test_Suite SHALL verificar que dos ejecuciones de `Contact_Schema.safeParse` producen el mismo resultado y SHALL rechazar los valores que violan las reglas.
3. WHEN `Property_Test_Suite` genera cualquier `ContactLeadInput` válido, THE Property_Test_Suite SHALL verificar que normalizar dos veces produce el mismo resultado que normalizar una vez y SHALL verificar que la función no muta el input.
4. WHEN `Property_Test_Suite` genera cualquier body inválido para `POST /api/contact`, THE Property_Test_Suite SHALL verificar que el handler responde HTTP 400 y no invoca `Prisma_Client.contactLead.create`.
5. WHEN `Property_Test_Suite` genera cualquier `ContactLeadInput` válido, THE Property_Test_Suite SHALL verificar que el handler aislado produce HTTP 201 y una única llamada de creación con `fullName`, `email`, `phone`, `service` y `message` normalizados.
6. WHEN `Property_Test_Suite` genera cualquier estado de formulario y un error de red o HTTP no exitoso, THE Property_Test_Suite SHALL verificar que `values` se conserva y que el estado no es `success`.
7. WHEN `Property_Test_Suite` genera cualquier pathname absoluto, THE Property_Test_Suite SHALL verificar que `resolvePublicRoute` retorna uno de `home`, `about`, `services`, `faq`, `contact` o `notFound`.
8. WHEN `Property_Test_Suite` genera cualquier representación válida de `584162459941`, THE Property_Test_Suite SHALL verificar que `buildWhatsAppUrl` retorna exactamente `https://wa.me/584162459941`.
9. THE Test_Suite SHALL complementar las propiedades con pruebas de ejemplo para las cinco rutas, el healthcheck, los estados del formulario, los códigos HTTP de `Contact_API`, el fallback SPA, la auditoría de accesibilidad y la configuración Docker.
10. WHEN una prueba de contrato envía un `ContactLeadInput` válido contra `Contact_API`, THE Test_Suite SHALL verificar HTTP 201 y la creación de un `ContactLead` con los siete campos canónicos.
11. WHEN una prueba de contrato envía datos inválidos contra `Contact_API`, THE Test_Suite SHALL verificar HTTP 400 y la ausencia de un nuevo `ContactLead`.
12. WHEN una prueba de integración ejecuta `GET /api/health` en un `Unified_Server` listo, THE Test_Suite SHALL verificar HTTP 200 y `{ "status": "ok" }`.

### Requirement 14: Mantenibilidad y separación de responsabilidades

**User Story:** Como desarrollador, quiero separar contenido, presentación, transporte, validación y persistencia, para cambiar una capa sin introducir cambios accidentales en las demás.

#### Acceptance Criteria

1. THE Corporate_Web_App SHALL mantener `Content_Fixture` separado de los componentes de presentación.
2. THE Contact_Form SHALL consumir `ContactLeadInput`, `Contact_Schema` y las funciones de validación compartidas sin acceder directamente a `Prisma_Client`.
3. THE Contact_API SHALL mantener la validación, el handler HTTP y la persistencia en módulos separables.
4. THE Unified_Server SHALL mantener las rutas `/api/*` separadas del fallback de archivos estáticos del cliente.
5. THE Test_Suite SHALL poder probar `normalizeContactInput`, `validateContactInput`, `buildWhatsAppUrl` y `resolvePublicRoute` sin iniciar PostgreSQL.
6. THE Corporate_Web_App SHALL mantener el contrato de `ContactLead` alineado con exactamente `id`, `fullName`, `email`, `phone`, `service`, `message` y `createdAt`.

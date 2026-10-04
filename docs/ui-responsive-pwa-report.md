# Informe de revisión y mejora visual, responsive y PWA

Trabajo local con datos ficticios. Rama: `feat/ui-responsive-pwa-polish`, basada en `origin/main` (`2036297`). No se hace merge ni despliegue de producción.

## 1. Resumen de cambios

Se conserva la identidad verde/naranja y las fotografías existentes. Se mejoran jerarquía, superficies, espacios, botones, navegación y estados de foco. Los calendarios tienen una adaptación táctil, los registros simples se presentan como tarjetas en móvil, los modales caben con scroll interno y los PDF conservan composición A4. Se incorpora una PWA con fallback offline público y una política restrictiva de caché.

## 2. Archivos modificados

El listado completo se incluye al final. Los principales son `globals.css`, inicio, header/footer, layouts de ambos roles, los dos calendarios, clientes y formularios existentes, los dos PDF, manifest, service worker, registro PWA y nueva ruta `/offline`. Se añaden `AdaptiveTable`, `ModalSurface` y fixtures/pruebas locales. No hay cambios en `src/lib`, APIs existentes, middleware, SQL ni `package-lock.json`.

## 3. Problemas encontrados

Anchos rígidos, grids y flex sin adaptación, seis inputs OTP demasiado anchos, acciones comprimidas en tablas, pestañas clínicas desplazadas, modales sin límites uniformes, sidebars de altura rígida, fotografías con tamaños fijos, adornos 404 fuera del viewport, sombras/movimientos fuertes y botones CTA sin navegación. En PDF había anchos porcentuales mezclados con `flex: 1`, fuentes externas, reglas CSS no admitidas y pie sin espacio reservado. El manifest conservaba azul y no existía service worker.

## 4. Problemas corregidos

Se eliminó la dependencia de ocultar overflow global; se corrigieron tamaños, envoltura, grids, posiciones y separación. Se conservaron contenidos y handlers al adaptar tablas. Los formularios mantienen nombres, validaciones y envío. Se corrige el cierre del menú móvil con su propio botón, evitando que el clic exterior lo reabra. Las acciones secundarias tienen una jerarquía más discreta. Se recupera la visualización de mensajes toast que una regla global ocultaba.

## 5. Cambios responsive

Se usa `min-w-0`, anchos fluidos, grids de una columna cuando procede, padding por breakpoint, texto largo con envoltura y targets de 44 px en móvil. Los inputs usan 16 px en móvil. El menú conserva todos los accesos y tiene altura limitada y scroll propio. Las pestañas del historial se envuelven. Galerías tienen controles táctiles, foco y cierre por Escape. Se respetan `prefers-reduced-motion` y el espacio inferior de safe area.

Matriz: **320×568, 360×800, 375×667, 390×844, 412×915, 414×896, 430×932, 640×960, 768×1024, 1024×768, 1280×800, 1440×900 y 1920×1080**.

## 6. Overflows y corrección desde su causa

| Causa | Corrección |
| --- | --- |
| Grids/flex rígidos y padding excesivo | Una columna, `flex-wrap`, `min-w-0`, espaciado responsive |
| Fotografía fija y composición de hero rígida | Tamaños máximos fluidos, proporción cuadrada y columnas `minmax` |
| Seis inputs OTP de 48 px más gaps | Grid de seis columnas flexibles, `w-full` y gaps menores |
| Filtros/selects de ancho de escritorio | Columnas móviles y select de ancho completo |
| Tablas de registros | Tarjetas con etiqueta y valor; acciones originales y controles móviles de ordenación |
| Comparativas nutricionales, clínicas agrupadas y administrativas | Scroll dentro de la tabla, con indicación visible; todas las columnas consultables |
| Calendario de siete columnas demasiado estrechas | Ancho mínimo deliberado dentro de un único scroll local; targets y etiquetas legibles |
| Pestañas de historial fuera de pantalla | `flex-wrap`, padding responsive; todas las pestañas accesibles |
| Modales más grandes que pantalla | Máximo `100vw - 2rem` / `100dvh - 2rem`, margen lateral y scroll vertical interno |
| Menús largos y sidebar rígida | Contenedor propio con altura máxima; contenido principal flexible |
| Adornos absolutos 404, 8 px fuera del documento | `left-0` / `right-0` en móvil, offsets negativos solo desde desktop |

Las pruebas fuerzan `overflowX: visible` en html/body, comparan `scrollWidth` con `clientWidth` y revisan límites de acciones, textos, inputs y modales. Se excluyen únicamente las regiones donde el desplazamiento horizontal es explícito: tablas comparativas y calendarios. No se usa `overflow-x: hidden` como solución.

## 7. Calendarios

Se modifican ambos componentes reales. El mes, anterior/siguiente, selección, disponibilidad, estados de citas y panel de detalle siguen usando el código original. La cuadrícula mantiene días alineados, reserva un tamaño legible, muestra guía de desplazamiento y cuenta con nombres accesibles y estado seleccionado. Se verifica el cambio de mes y el desplazamiento sin ensanchar la página a 320 px.

## 8. PDFs

Ambos documentos siguen usando `@react-pdf/renderer`. Se elimina la carga externa de Roboto en estos documentos y se usa Helvetica estándar del renderer. Se definen márgenes A4, espacio reservado para header/footer fijos, paginación, anchos deterministas y filas de progreso sin división. Los planes largos fluyen en bloques por menú y comida, conservando horarios, días y contenido. Las imágenes de recomendaciones usan `contain` y dimensiones acotadas.

No hay llamadas activas a html2canvas ni exportaciones PDF adicionales en el código. No se captura el DOM ni se depende del ancho de pantalla.

Validación del renderer real: seis documentos (mínimo, normal y largo por rol), **1/6/11 páginas en administrador y 1/6/30 en paciente**, sin texto fuera de los márgenes comprobados. Se inspeccionaron renderizados PNG. Además, se descargaron cuatro PDFs desde el navegador con el renderer real a **320 y 1440 px**: cinco páginas por rol y exactamente las mismas posiciones y textos entre tamaños.

## 9. PWA

Manifest con nombre de Rubí Ramos, `id`, `start_url` y `scope` `/`, `display: standalone`, idioma es-MX, fondo blanco e iconos existentes. Se retira la restricción de orientación. Metadata de Apple y `viewportFit: cover`; registro solo en producción. Iconos PNG verificados: **192×192 y 512×512**. Se conserva `purpose: any`; no se declara maskable sin un icono diseñado para ello.

## 10. Theme color

Anterior: **`#1E3A8A`**. Nuevo: **`#6B8E7B`**, ya utilizado en la marca. El manifest y el metadata `theme-color` coinciden.

## 11. Estrategia del service worker

- Precache: `/offline`, logo e iconos. El documento offline es HTML estático autónomo y no consulta sesión ni datos.
- Cache First: recursos públicos enumerados y bundles JS/CSS/fuentes en `/_next/static`, del mismo origen, sin query, con respuestas básicas correctas y sin `private`/`no-store` ni redirección. Límite de 120 entradas de runtime.
- Navegación: red primero, sin almacenar HTML; al fallar conexión se devuelve el fallback público.
- APIs, autenticación, RSC, prefetch, acciones, imágenes optimizadas, recursos externos y escrituras no reciben caché de datos ni cola offline.
- Cachés versionadas; activate elimina exclusivamente versiones anteriores con prefijo `rubi-pwa-`. El archivo `sw.js` se sirve sin caché HTTP persistente.
- No hay `skipWaiting` automático en una actualización. Un aviso pide guardar cambios; el usuario decide actualizar o posponer. Solo la acción explícita activa el nuevo worker y recarga.

En futuros despliegues, incrementar `VERSION` en `public/sw.js` cuando cambien el fallback o los recursos públicos sin hash, para renovar también logo/fotografías. El manifest siempre se obtiene de red. El HTML no queda almacenado por el worker y los bundles nuevos tienen sus propios hashes.

## 12. Qué funciona offline

Tras una primera visita con conexión, una recarga/navegación sin red muestra **Sin conexión**, la marca, contacto público y opciones de reintento/inicio. Si la aplicación ya está abierta, aparece un aviso de conexión; se preserva su estado en memoria. Al reconectar se puede reintentar normalmente. Se reutilizan los recursos públicos ya disponibles en caché.

## 13. Qué requiere conexión deliberadamente

Login/logout en el servidor, sesiones, expediente, evaluaciones, planes clínicos, datos de paciente, citas/disponibilidad, pagos, ventas, inventario, publicaciones dinámicas, consultas administrativas y cambios de datos. No se guardan respuestas de estas operaciones, credenciales ni tokens en la caché del worker. No hay cola de acciones para enviar posteriormente. El fallback no representa una sesión autenticada ni muestra un expediente guardado.

## 14. Build

**`npm run build`: aprobado**, con compilación, TypeScript y generación de rutas. Permanecen advertencias previas sobre `images.domains` y la convención `middleware`; no se migró infraestructura ni autenticación en esta revisión.

## 15. Lint

Se sustituye `next lint` por **`eslint src`**. El comando funciona pero **no termina limpio**: línea base **202 errores / 22 advertencias**, resultado **198 errores / 22 advertencias**. La comparación por archivo, regla y mensaje no encontró hallazgos introducidos. No se deshabilitaron reglas ni se ocultaron errores. La deuda previa incluye `any`, variables sin uso y `prefer-const`; requiere un trabajo separado que incluya código ajeno al alcance visual.

## 16. TypeScript y otras comprobaciones

**`npm run typecheck`: aprobado**. No hay errores de importación ni nuevos errores de tipos. Política PWA y prueba existente de autenticación móvil: **7 pruebas aprobadas**. Matriz visual: **442 comprobaciones con 34 escenarios ficticios y 195 comprobaciones públicas, todas aprobadas**. Se repiten los controles afectados por el polish final.

Se comprueban apertura/cierre y foco de modales, precarga de edición, envío simulado de paciente/producto, confirmación de eliminación simulada, mes siguiente, scroll del calendario, galerías, menús y Escape. Se verifica offline sobre una navegación privada y regreso online. Una comparación AST confirmó **76 llamadas a funciones importadas del backend sin cambios en sus argumentos**. No se modificaron SQL, autenticación ni APIs existentes.

## 17. Riesgos y verificaciones pendientes

- Las vistas protegidas se prueban con componentes reales y adaptadores locales de sesión/servicios. No se afirma haber completado un E2E con PostgreSQL, Stripe, Cloudinary o correo reales ni login/logout reales. No se tocó producción.
- Las pruebas visuales corren en Edge/Chromium local con distintos viewports. La instalación y uso en equipos físicos iPhone/Android, Safari, teclado nativo y safe areas reales necesitan validación en esos dispositivos.
- El aviso de actualización se cubre mediante política y acción explícita del worker; falta verificar una secuencia de despliegue real con usuarios trabajando.
- Se conserva la deuda previa de lint y las advertencias de configuración descritas. El catálogo SSR completo requiere datos del servidor; aquí se prueba su cliente con datos ficticios.
- Las rutas/componentes incompletos de la auditoría (detalle de catálogo, calendario público de ejemplo y carrito sin checkout activo) siguen siendo alcance pendiente del producto. Esta revisión no inventa funciones comerciales ni modifica contratos.
- Los PDFs normales/largos y texto se verifican; imágenes externas siguen necesitando que su origen esté disponible al exportar. Las fuentes de los documentos ya no necesitan red.

## 18. Dependencias

**Ninguna dependencia de producción ni versión agregada/cambiada.** No fue necesario `npm install`. Las pruebas usan dependencias existentes del proyecto y Playwright, pdfjs-dist, canvas y sharp disponibles en el runtime local de Codex; no se incluyen en el bundle de la aplicación. Para repetir las pruebas fuera de ese entorno, proporcionar esas herramientas de QA mediante `CODEX_TEST_NODE_MODULES` o un entorno de herramientas separado.

## 19. Pull Request

La URL se añadirá al crear el PR. Objetivo: `main`. La rama conserva commits agrupados por calendario, PDF, responsive/UI, PWA y validación. **Sin merge automático.**

## Evidencia visual

Las capturas con datos ficticios se conservan solo en el workspace local, en "docs/ui-preview". No se suben al repositorio público ni se incluyen en el PR.

## Reproducción de pruebas

```powershell
npm run build
npm run typecheck
npm run lint
node --test tests/pwa-policy.test.cjs tests/mobile-api-auth.test.cjs

# Ruta a un entorno de QA con Playwright, pdfjs-dist y @napi-rs/canvas.
$env:CODEX_TEST_NODE_MODULES = 'RUTA_AL_ENTORNO_QA/node_modules'
$env:TEST_BROWSER_CHANNEL = 'msedge'
node tests/ui/build-fixture.cjs
node tests/ui/responsive.test.cjs
node tests/pdf-layout.test.cjs
node tests/ui/build-pdf-fixture.cjs
node tests/pdf-browser.test.cjs

# Con el build servido localmente en el puerto 3100:
node tests/public-pwa.test.cjs
```

Los fixtures sirven exclusivamente datos simulados en localhost; `tmp/qa` está ignorado por Git y almacena capturas, PDFs y resultados. El test público exige una configuración local de NextAuth válida; en esta revisión se usó una clave ficticia solo en el proceso de prueba, sin editar archivos de entorno ni compartir credenciales reales.

## Lista completa de archivos de esta rama

- `.gitignore`
- `docs/ui-responsive-pwa-audit.md`
- `docs/ui-responsive-pwa-report.md`
- `next.config.ts`
- `package.json`
- `public/manifest.json`
- `public/sw.js`
- `src/app/admin/alexa/page.tsx`
- `src/app/admin/appointments/page.tsx`
- `src/app/admin/calendar/page.tsx`
- `src/app/admin/db/page.tsx`
- `src/app/admin/historial/page.tsx`
- `src/app/admin/menus/page.tsx`
- `src/app/admin/monitoreo/page.tsx`
- `src/app/admin/muro/page.tsx`
- `src/app/admin/pacientes/page.tsx`
- `src/app/admin/pagos/page.tsx`
- `src/app/admin/patient/calendar/page.tsx`
- `src/app/admin/productos/page.tsx`
- `src/app/bad-request/page.tsx`
- `src/app/error.tsx`
- `src/app/globals.css`
- `src/app/historial/page.tsx`
- `src/app/layout.tsx`
- `src/app/login/page.tsx`
- `src/app/login/recuperacion/reestablecer/page.tsx`
- `src/app/not-found.tsx`
- `src/app/offline/route.ts`
- `src/app/page.tsx`
- `src/app/servicios/page.tsx`
- `src/components/admin_breadcrumbs.tsx`
- `src/components/breadcrumbs.tsx`
- `src/components/button.tsx`
- `src/components/calendar/AppointmentModal.tsx`
- `src/components/calendar/ConfirmationModal.tsx`
- `src/components/calendar/DisableHourModal.tsx`
- `src/components/calendar/SettingsModal.tsx`
- `src/components/car_shop/ShoppingCart.tsx`
- `src/components/catalog/CatalogClient.tsx`
- `src/components/catalog/ProductCard.tsx`
- `src/components/citas/CitasClient.tsx`
- `src/components/citas/ClinicalEvaluationModal.tsx`
- `src/components/citas/PendingPaymentsReview.tsx`
- `src/components/dashboard/AdminLayoutClient.tsx`
- `src/components/dashboard/DashboardClient.tsx`
- `src/components/dashboard/nav-links.tsx`
- `src/components/dashboard/sidenav.tsx`
- `src/components/FeatureCard/featureCard.tsx`
- `src/components/filter-button.tsx`
- `src/components/footer/footer.module.css`
- `src/components/header/header.module.css`
- `src/components/header/header.tsx`
- `src/components/layout/ClientWrapper.tsx`
- `src/components/LegalPageLayout/legalPageLayout.tsx`
- `src/components/login/form.tsx`
- `src/components/login/recuperacion.tsx`
- `src/components/login/reestablecer.tsx`
- `src/components/login/verificacion.tsx`
- `src/components/medical-history/AdminMedicalHistoryPDF.tsx`
- `src/components/medical-history/MedicalHistoryClient.tsx`
- `src/components/medical-history/NutritionPlan.tsx`
- `src/components/medical-history/PredictiveModule.tsx`
- `src/components/menus/MealOptionsManager.tsx`
- `src/components/monitoreo/auditoria.tsx`
- `src/components/monitoreo/metricasCards.tsx`
- `src/components/muro/CreatePostModal.tsx`
- `src/components/muro/ImageCarousel.tsx`
- `src/components/muro/PostsList.tsx`
- `src/components/pagination.tsx`
- `src/components/patient-medical-history/MedicalHistoryPDF.tsx`
- `src/components/patient-medical-history/PatientMedicalHistoryClient.tsx`
- `src/components/patient-medical-history/PatientNutritionPlanViewer.tsx`
- `src/components/patient-medical-history/PatientPredictiveModule.tsx`
- `src/components/patient-medical-history/PatientProgressView.tsx`
- `src/components/patient-muro/PatientImageCarousel.tsx`
- `src/components/patient-muro/PatientPostsList.tsx`
- `src/components/patient-profile/PatientProfileForm.tsx`
- `src/components/patient/PatientAppointmentActionsModal.tsx`
- `src/components/patient/PatientAppointmentModal.tsx`
- `src/components/patient/PatientDashboardClient.tsx`
- `src/components/patient/PatientLayoutClient.tsx`
- `src/components/patient/TimeSlotPicker.tsx`
- `src/components/patients/PatientList.tsx`
- `src/components/patients/PatientModal.tsx`
- `src/components/productos/modalProducto.tsx`
- `src/components/productos/products.tsx`
- `src/components/pwa/ServiceWorkerRegistration.tsx`
- `src/components/recommendations/RecommendationsModal.tsx`
- `src/components/search.tsx`
- `src/components/ui/AdaptiveTable.tsx`
- `src/components/ui/ModalSurface.tsx`
- `tests/pdf-browser.test.cjs`
- `tests/pdf-layout.test.cjs`
- `tests/public-pwa.test.cjs`
- `tests/pwa-policy.test.cjs`
- `tests/ui/backend-stub.cjs`
- `tests/ui/build-fixture.cjs`
- `tests/ui/build-pdf-fixture.cjs`
- `tests/ui/compile-loader.cjs`
- `tests/ui/data.cjs`
- `tests/ui/fixture.tsx`
- `tests/ui/next-stub.tsx`
- `tests/ui/pdf-fixture.tsx`
- `tests/ui/pdf-stub.tsx`
- `tests/ui/responsive.test.cjs`

# Segunda etapa visual y offline/PWA

Fecha: 5 de octubre de 2026. Rama: `feat/ui-responsive-pwa-polish`.

Se continúa la implementación de la primera etapa. El PR #3 fue fusionado antes de esta entrega; el usuario autorizó un PR de continuación desde la misma rama. Todas las pruebas son locales y utilizan registros ficticios. No se accedió a cuentas reales ni se realizaron operaciones contra servicios de producción.

1. **ADMIN.** Encabezado con jerarquía clara y accesos a calendario/pacientes; indicadores en una cuadrícula de dos columnas en móvil y cuatro en escritorio; tarjetas con borde sutil, acentos superiores, iconos integrados y números alineados. Los paneles de próximas citas, riesgo, actividad semanal y pacientes recientes comparten superficies, encabezados y separación. La navegación tiene marca, contexto del consultorio, selección visible y perfil integrado. Se conservan rutas, acciones, cálculos y filtros por rol.

2. **CLIENTE/PACIENTE.** Bienvenida cálida con accesos a calendario/perfil; métricas, próxima cita, seguimiento de peso, anuncios e historial con el mismo sistema de superficies. Perfil, calendario, planes, muro, productos y tablas heredan el acabado del contenedor compartido. Estados vacíos, botones secundarios y tablas móviles conservan sus acciones y contenido. No se modifican fórmulas nutricionales ni datos clínicos.

3. **HOME.** Se conserva la composición, las fotografías, textos, enlaces y CTA. El título, subtítulo, misión, botones e información de contacto tienen una entrada discreta. La palabra «Misión» usa el naranja de marca con mayor contraste sobre el fondo oscuro.

4. **Animaciones.** CSS de opacidad y desplazamiento vertical de 12 px durante 650 ms; retrasos de 90, 150, 210 y 270 ms. Sin dependencias nuevas, división por letras, rebotes, bucles, listeners de scroll ni contenido condicionado a JavaScript.

5. **Movimiento reducido y accesibilidad.** `prefers-reduced-motion: reduce` elimina la animación del hero y mantiene opacidad 1 y transformación desactivada. Se verifican navegación por teclado, foco de modales/menús, tamaños táctiles y el hero con JavaScript deshabilitado. El banner anuncia el estado con `role="status"` y `aria-live="polite"`. Se profundizan los tonos verdes/naranjas de textos y botones para mejorar contraste. Los botones principales probados alcanzan relaciones de 5,16:1 (naranja) y 5,83:1 (verde) entre texto y fondo.

6. **Service Worker.** Se pasa de `rubi-pwa-v1` a `rubi-pwa-v2`. El shell esencial, el contenido público de cada build y la caché temporal de bundles están separados. Un `postbuild` genera documentos autónomos a partir de cinco páginas públicas prerenderizadas: extrae el `<main>`, elimina la dependencia de hidratación/NextAuth/RSC, usa imágenes locales y enumera CSS/fuentes. Rechaza formularios, scripts dentro del contenido, handlers inline y recursos remotos o fuera de `public`/`_next/static`.

   Cada versión se descarga sin credenciales y solo se selecciona cuando todos sus recursos están guardados. Una actualización incompleta conserva la versión anterior. Se mantienen la versión pública activa y la anterior; la limpieza de 120 bundles temporales no elimina sus estilos, documentos, imágenes ni el fallback. Las navegaciones siguen usando la red primero, con fallback después de un error o espera máxima de cuatro segundos. El HTML recibido de una navegación online nunca se persiste. Una actualización del worker se activa por decisión del usuario.

7. **Disponible offline.** Inicio, Servicios, Nosotros, Privacidad y Términos; header/footer públicos, logo, fotografías públicas, estilos, fuentes locales, iconos, manifest, indicador de conexión y `/offline`. El build probado genera cinco documentos y un inventario de 23 recursos; el shell conserva además el fallback y manifest. Los enlaces públicos funcionan mediante navegación nativa cuando no hay red. Los documentos generados se excluyen de Git y se regeneran con `npm run build`.

   Es necesario un primer acceso online y completar la descarga pública. Las apps instaladas solicitan almacenamiento persistente cuando el navegador ofrece la API, como medida adicional. Su concesión depende del navegador; el usuario todavía puede borrar el almacenamiento. Cache Storage persiste entre sesiones, pero la eliminación por políticas/cuotas del navegador queda fuera del control de la app. [Cache API](https://developer.mozilla.org/en-US/docs/Web/API/Cache), [cuotas y eliminación de almacenamiento](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria).

8. **Excluido por seguridad.** Sesiones y HTML de usuarios autenticados; APIs y respuestas de NextAuth/RSC; citas privadas, expedientes, evaluaciones, planes individuales, perfil, pagos/finanzas e imágenes privadas/remotas. Login, catálogo dinámico y formularios no tienen copia pública offline. POST/PUT/PATCH/DELETE, Authorization y peticiones de Server Actions no se interceptan para guardar datos. No hay colas de escrituras ni sincronización de información clínica.

9. **Indicador offline.** Barra superior en flujo normal y sticky, con «Estás en modo offline» y explicación breve. Está en el layout raíz para home/admin/paciente, y también en los documentos autónomos. Ajusta la altura disponible del área de trabajo y del menú móvil para evitar cubrir controles. Las copias públicas señalan offline incluso si el sistema reporta conexión pero la navegación al servidor falló.

10. **Reconexión.** Cambia a «Conexión restablecida» y desaparece tras cuatro segundos. Se intenta actualizar el inventario público. No recarga formularios, no envía operaciones pendientes y no restaura datos privados desde caché. Los enlaces/reintento permiten volver a la versión online; una copia pública no fuerza una recarga automática.

11. **Pruebas de reapertura.** Edge real con perfil persistente de prueba. Se carga online una página con un marcador ficticio de sesión; se espera el inventario completo, se vacía la caché HTTP y se cierra el proceso del navegador. Se vuelve a abrir el mismo perfil sin red; además, un proxy local bloquea solicitudes para impedir que un nuevo proceso de service worker tenga acceso accidental al servidor durante la emulación. Dos ciclos verifican diez aperturas públicas, navegación Inicio→Servicios, fotografías, CSS, fallback del historial privado y cero marcadores privados/RSC/APIs en Cache Storage. Se comprueba offline a 320 y 1440 px, reconexión y conservación de un formulario sin guardar.

   Validación responsive: **442/442** comprobaciones de componentes y **195/195** públicas en 13 tamaños entre 320 y 1920 px. Después de los ajustes visuales se repiten **130/130** comprobaciones en diez vistas. El banner se verifica en **39** combinaciones: admin, paciente con datos y paciente vacío × 13 tamaños. **15/15** pruebas Node cubren generación pública segura, política SW, cambios de versión/interrupciones, límite de caché y autenticación móvil existente.

   Se revisan visualmente capturas locales de escritorio/móvil y estados offline. La instalación física como app en Edge/iOS/Android no se ha ejecutado; las pruebas de cierre/reapertura corresponden al navegador con almacenamiento persistente, no a un dispositivo instalado. Manifest, iconos y display `standalone` se conservan y verifican. Queda esa comprobación física para el entorno del usuario.

12. **Build.** `npm run build`: aprobado, incluida la generación `postbuild` de las cinco páginas públicas. Persisten las advertencias anteriores sobre `images.domains` y la convención `middleware`; no se migran versiones/configuración de servicios en esta etapa.

13. **TypeScript.** `npm run typecheck`: aprobado. El build también ejecuta TypeScript.

14. **Lint.** `npm run lint -- --format json --output-file tmp/qa/stage2-lint.json`: permanece en **198 errores / 22 advertencias**, exactamente las mismas incidencias de la rama anterior, sin nuevas reglas incumplidas ni reglas desactivadas. Sigue sin ser un check verde por esa deuda existente.

15. **Archivos modificados.**

   | Área | Archivos |
   | --- | --- |
   | Build público | `.gitignore`, `package.json`, `scripts/build-public-offline.cjs` |
   | PWA/estado | `public/sw.js`, `public/offline-status.js`, `src/components/pwa/ConnectionStatus.tsx`, `src/components/pwa/ServiceWorkerRegistration.tsx`, `src/app/offline/route.ts`, `src/app/layout.tsx` |
   | Estilos/home | `src/app/globals.css`, `src/app/page.tsx` |
   | Admin | `src/components/dashboard/AdminLayoutClient.tsx`, `DashboardClient.tsx`, `nav-links.tsx`, `sidenav.tsx` |
   | Paciente | `src/components/patient/PatientLayoutClient.tsx`, `PatientDashboardClient.tsx` |
   | Validación | `tests/pwa-build.test.cjs`, `tests/pwa-policy.test.cjs`, `tests/second-stage-browser.test.cjs`, `tests/ui/data.cjs`, `tests/ui/fixture.tsx` |
   | Informe | `docs/ui-pwa-second-stage-report.md` |

   Sin cambios en `src/lib`, `src/app/api`, middleware, SQL, migraciones, esquema, autenticación, permisos, roles o contratos. Las modificaciones de fixtures corrigen/completan únicamente datos ficticios (estadísticas, anuncios, citas y registros) para ejercitar paneles poblados y vacíos. Las capturas y perfiles de prueba quedan en `tmp/qa`, fuera del repositorio.

16. **Entrega/PR.** [PR #4: Segunda etapa: paneles refinados y contenido público offline persistente](https://github.com/consultoriorubiramos1-hub/RubiRamos/pull/4), desde `feat/ui-responsive-pwa-polish` hacia `main`, autorizado al detectar que #3 ya estaba fusionado. Incluye commits separados de UI, PWA, pruebas/informe y enlace de entrega. Permanece abierto para revisión; no se hace merge a main ni despliegue en esta etapa.

Para reproducir localmente: `npm run build`, `npm run typecheck`, `npm run lint`, `node --test tests/pwa-build.test.cjs tests/pwa-policy.test.cjs tests/mobile-api-auth.test.cjs`. Las pruebas de navegador requieren Playwright disponible en `CODEX_TEST_NODE_MODULES`, `TEST_BROWSER_CHANNEL=msedge`, un servidor de producción local en 3100 y construir primero las fixtures con `node tests/ui/build-fixture.cjs`; después ejecutar `tests/ui/responsive.test.cjs`, `tests/public-pwa.test.cjs` y `tests/second-stage-browser.test.cjs`. No usar credenciales reales.

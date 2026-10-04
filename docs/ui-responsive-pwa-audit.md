# Auditoría inicial de UI, responsive, PDF y PWA

Base revisada: `origin/main` (`2036297`). Rama de trabajo: `feat/ui-responsive-pwa-polish`.

Se revisaron primero rutas, layouts, componentes compartidos, estilos, calendarios, exportaciones y configuración PWA. La implementación conserva los contratos del frontend y limita las pruebas a ejecución local y datos ficticios.

## Estructura y cobertura

| Área | Vistas y componentes encontrados |
| --- | --- |
| Pública | Inicio, servicios, sobre mí, citas, catálogo, login, recuperación, restablecimiento, verificación, privacidad, términos, historial de ejemplo, calendario de ejemplo, 400, 404 y boundary de error |
| Administrador | Dashboard, pacientes, citas, calendario, pagos, productos, historial/expediente, menús, muro, monitoreo, auditoría, respaldos y Alexa |
| Paciente | Dashboard, calendario/citas, historial, evaluaciones, progreso, predicción, plan alimenticio, perfil y muro |
| Compartidos | Navbar, footer, breadcrumbs, sidebar, búsqueda, filtros, paginación, tarjetas, formularios, modales, galerías y tablas |
| Exportaciones | `AdminMedicalHistoryPDF.tsx` y `MedicalHistoryPDF.tsx`, descargados mediante `PDFDownloadLink` en los respectivos clientes de historial |
| PWA inicial | Manifest e iconos de 192/512 px; theme azul antiguo; sin registro de service worker ni documento offline |

`/catalog/[id]/page.tsx` está vacío. `/calendar` es un título de ejemplo. El carrito es un componente de demostración sin ruta activa ni checkout integrado. No hay rutas independientes de contacto ni notificaciones: el contacto se ofrece en inicio/footer. No se añadieron flujos comerciales para llenar esos huecos.

## Identidad encontrada

Verdes `#6B8E7B`, `#5A8C7A`, `#7CB38C` y verde oscuro `#2C3E34`; naranja `#F58634`, acento cálido `#BD7D4A`; superficies `#FAF9F7`, bordes `#E6E3DE`, texto secundario `#6E7C72`. Se reutiliza esta paleta. El azul `#1E3A8A` del manifest no representa la interfaz actual.

## Hallazgos y prioridades

| Prioridad | Hallazgo inicial | Archivos/ámbito |
| --- | --- | --- |
| P0 | `overflow-x: hidden` global impedía distinguir recortes reales | `globals.css` |
| P0 | Siete días comprimidos en móvil, etiquetas y controles de calendario estrechos | Ambos calendarios reales en `admin/calendar` y `admin/patient/calendar` |
| P0 | Tablas con columnas y acciones de escritorio sin alternativa móvil | Pacientes, productos, citas, historial, nutrición, monitoreo, DB y Alexa |
| P0 | Grids de dos columnas, paddings grandes, flex sin envoltura, botones y campos rígidos | Formularios y clientes de ambos roles |
| P0 | Modales sin límites uniformes de altura/ancho ni manejo uniforme del foco | Componentes de calendario, expediente, productos, pacientes, publicaciones y recomendaciones |
| P0 | PDF con `flex: 1` combinado con porcentajes de ancho, reglas CSS no soportadas y pie sin espacio reservado | Los dos documentos react-pdf |
| P1 | Manifest azul antiguo, sin estrategia offline ni actualización controlada | Manifest, layout raíz, configuración Next |
| P1 | Sidebar y menú móvil dependían de contenedores de altura rígida | Layouts administrador/paciente y header público |
| P2 | Sombras fuertes, escalas y espacios inconsistentes, CTA sin navegación | Inicio, tarjetas, controles compartidos y footer |
| P3 | Falta de foco claro, labels en controles gráficos y estado activo semántico | CSS, calendarios, navegación, contraseña y galerías |

Durante la validación se identificaron además pestañas del historial parcialmente fuera de pantalla y adornos absolutos de la pantalla 404 que extendían el documento 8 px. Se corrigieron desde su layout.

## Decisiones y límites antes de implementar

- Los calendarios se adaptan con desplazamiento local y un panel/listado de citas; se conserva la lógica de disponibilidad.
- Los registros simples pasan a tarjetas en móvil; comparativas y encabezados clínicos agrupados conservan tablas con scroll explícito.
- Los PDF mantienen documentos A4 independientes de CSS/DOM/viewport; no se introduce captura con html2canvas.
- La caché persiste únicamente recursos públicos enumerados, bundles estáticos y una página offline autónoma.
- No se modifican SQL, esquema, migraciones, APIs existentes, NextAuth, roles, permisos, variables de entorno del proyecto ni servicios externos.
- Riesgos a verificar: contenido clínico largo, acciones preservadas al adaptar tablas, foco de modales, navegación por rol y evitar datos privados en caché.

La línea base de TypeScript pasó. ESLint directo encontró **202 errores y 22 advertencias previos**. El script `next lint` era incompatible con Next 16 y se sustituyó por ESLint sin actualizar Next, React ni dependencias.

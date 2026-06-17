# ACTIVIDAD 13: GOOGLE MAPS / LEAFLET + MASHUP MULTIMEDIA
## Estándar Internacional: P-TECH - Geolocalización Interactiva - PWD 7° 2° Grupo B
**EEST N°1 "Eduardo Ader" - 7° 2º Año - Prof. York**


## 📅 Descripción del Proyecto

Sistema web de monitoreo georreferenciado desarrollado con Leaflet.js y Web Audio API. Proporciona un dashboard moderno para visualizar detecciones de residuos grandes en el territorio municipal, integrando mapas interactivos con alertas multimedia.

El módulo OTR Vision permite que operadores municipales localicen incidencias de residuos voluminosos mediante marcadores geográficos en tiempo real, reproduciendo alertas sonoras para priorizar tareas de recolección y mejorando la eficiencia operativa de los servicios urbanos.


## 👥 Equipo de Desarrollo
- Owen Olea  

## 🛠️ Stack Tecnológico

**Lenguajes de Programación:**
- HTML5, CSS3, JavaScript (ES6+)

**Bibliotecas y Frameworks:**
- Leaflet.js v1.9.4 (Mapas Interactivos)
- OpenStreetMap (Tiles de Mapas)
- Web Audio API (Síntesis de Audio)


**Entorno de Desarrollo:**
- Visual Studio Code
- Servidor HTTP local (Python `http.server`, Live Server, etc.)
- Git / GitHub para control de versiones

## 🏗️ Arquitectura del Sistema


- **Capa de Presentación:** HTML5 semántico, CSS3 con diseño responsivo y tema oscuro minimalista, JavaScript para interactividad.
- **Capa de Mapas:** Leaflet.js integrado para visualización de detecciones geográficas con marcadores dinámicos.
- **Capa de Audio:** Web Audio API para síntesis de tonos + reproducción de archivos con fallback automático.
- **Capa de Validación:** Búsqueda en tiempo real, filtrado de incidencias, sincronización tarjeta-mapa.

## 💻 Desarrollo

Se construyó una aplicación web completa que lee datos del formulario y genera reportes en PDF usando la librería **jsPDF**:

**Formulario de Captura:**
- Nombre del Operador/Alumno
- Detalle o Descripción del Registro (textarea para texto largo)

**El sistema valida que los campos obligatorios estén completos**, diseña un encabezado colorido, ajusta el contenido automáticamente y descarga el archivo sin necesidad de backend.

**Funcionalidades implementadas:**
- ✅ Captura dinámica de datos del formulario
- ✅ Generación automática del PDF en el navegador (sin servidor)
- ✅ Encabezado visual con color naranja (#e65c00) y tipografía clara
- ✅ Ajuste de texto largo mediante salto de líneas en el PDF
- ✅ Inclusión de fecha y hora de emisión (formato argentino)
- ✅ Descarga automática del archivo con nombre seguro: `Reporte_[Nombre]_[Timestamp].pdf`
- ✅ Validación de campos antes de generar
- ✅ Limpieza de formulario tras generación exitosa
- ✅ Manejo robusto de errores con alertas informativas

**Librerías CDN utilizadas:**
- `jsPDF` (v2.5.1) - Generación de documentos PDF
- `html2canvas` (v1.4.1) - Captura de elementos HTML (fallback opcional)


## 📁 Estructura del Repositorio

```
act13/
├── index.html              # Estructura HTML 
├── styles.css              # Estilos responsive 
├── script.js               # Lógica Leaflet, audio y manejo de eventos
├── assets/                 # Recursos multimedia
│   └── alerta.mp3          # Archivos de audio 
├── docs/                   # Documentación
│   └── Informe_APA.pdf     # Informe 
├── README.md               # Este archivo
├── LICENSE                 # Licencia MIT
└── .gitignore              # Archivos excluidos de Git
``

## 📄 Licencia
Este proyecto se distribuye bajo la licencia MIT.

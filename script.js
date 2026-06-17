// Integración de Leaflet.js con un mashup multimedia para el proyecto de residuos
const fallbackAudio = 'https://assets.mixkit.co/active_storage/sfx/2869/2869-84.wav';
let sonidoAlerta = new Audio(fallbackAudio);

// Intentamos usar un archivo local `assets/alerta.mp3` si existe en el servidor local
fetch('assets/alerta.mp3', { method: 'HEAD' }).then(r => {
  if (r.ok) {
    sonidoAlerta = new Audio('assets/alerta.mp3');
  }
}).catch(() => { /* usar fallback si no existe */ });

// --- Sintetizador Web Audio como fallback ---
let _audioCtx = null;
function playDynamicSound(baseFreq = 440, type = 'sine', duration = 1.0) {
  try {
    if (!_audioCtx) _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (_audioCtx.state === 'suspended') _audioCtx.resume();

    const now = _audioCtx.currentTime;

   
    const osc1 = _audioCtx.createOscillator();
    const gain1 = _audioCtx.createGain();
    const osc2 = _audioCtx.createOscillator();
    const gain2 = _audioCtx.createGain();

    osc1.type = type;
    osc1.frequency.setValueAtTime(baseFreq, now);
    gain1.gain.setValueAtTime(0, now);
    gain1.gain.linearRampToValueAtTime(0.12, now + 0.02);
    gain1.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(baseFreq * 1.5, now);
    gain2.gain.setValueAtTime(0, now);
    gain2.gain.linearRampToValueAtTime(0.04, now + 0.02);
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc1.connect(gain1);
    gain1.connect(_audioCtx.destination);
    osc2.connect(gain2);
    gain2.connect(_audioCtx.destination);

    osc1.start(now);
    osc1.stop(now + duration);
    osc2.start(now);
    osc2.stop(now + duration);
  } catch (e) {
    console.warn('playDynamicSound error:', e);
  }
}

function playSoundFor(punto) {
  // si se precargó un elemento Audio en el punto, usarlo
  // detener cualquier audio HTML activo antes de reproducir uno nuevo
  stopAllHtmlAudio();
  if (punto._audio instanceof HTMLAudioElement) {
    try {
      punto._audio.currentTime = 0;
      punto._audio.play().then(() => {
        activeHtmlAudio.push(punto._audio);
        // cortar la reproducción después de 1000 ms para que sea breve e interactiva
        setTimeout(() => { try { punto._audio.pause(); punto._audio.currentTime = 0; } catch(e){} }, 1000);
      }).catch(err => {
        console.warn('Reproducción del audio (precargado) falló, usando fallback sintético:', err);
        if (typeof playDynamicSound === 'function') playDynamicSound(punto.soundFreq, punto.soundType, 1.0);
      });
      console.log('Reproduciendo audio precargado para', punto.nombre);
      return;
    } catch (e) {
      console.warn('Error al reproducir audio precargado:', e);
    }
  }

  // si existe ruta a archivo pero no está precargado, intentar reproducir con new Audio
  if (punto.soundFile) {
    const a = new Audio(punto.soundFile);
    a.volume = 0.95;
    // detener audios previos
    stopAllHtmlAudio();
    // marcar como activo y reproducir
    a.play().then(() => {
      activeHtmlAudio.push(a);
      console.log('Reproduciendo audio desde URL para', punto.nombre);
      // cortar a 1 segundo
      setTimeout(() => { try { a.pause(); a.currentTime = 0; } catch(e){} }, 1000);
    }).catch(err => {
      console.warn('Audio file blocked or failed, usando sintetizador:', err);
      if (typeof playDynamicSound === 'function') playDynamicSound(punto.soundFreq, punto.soundType, 1.0);
    });
    return;
  }

  // último recurso: usar el sintetizador existente (si está definido)
  if (typeof playDynamicSound === 'function') {
    playDynamicSound(punto.soundFreq, punto.soundType, 1.0);
  } else {
    // si tampoco existe sintetizador, usar objeto `sonidoAlerta` global
    try {
      sonidoAlerta.currentTime = 0;
      sonidoAlerta.play().catch(() => {});
    } catch (e) { /* noop */ }
  }
}

// Control simple de audios HTML activos
const activeHtmlAudio = [];
function stopAllHtmlAudio() {
  while(activeHtmlAudio.length) {
    const a = activeHtmlAudio.pop();
    try { a.pause(); a.currentTime = 0; } catch(e) {}
  }
}

const mapa = L.map('map').setView([-34.5222, -58.4815], 14);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '© OpenStreetMap contributors'
}).addTo(mapa);

const puntosDeInteres = [
  {
    id: 1,
    nombre: 'Zona de Vigilancia Norte',
    coordenadas: [-34.5205, -58.4830],
    descripcion: 'Detección de residuos voluminosos en el barrio norte.'
    , soundFile: 'https://assets.mixkit.co/active_storage/sfx/2869/2869-84.wav'
  },
  {
    id: 2,
    nombre: 'Sector Comercial Sur',
    coordenadas: [-34.5260, -58.4785],
    descripcion: 'Alerta por bolsa de residuos de gran tamaño cerca de contenedores.'
    , soundFile: 'https://assets.mixkit.co/active_storage/sfx/1651/1651-preview.mp3'
  },
  {
    id: 3,
    nombre: 'Punto de Inspección Central',
    coordenadas: [-34.5222, -58.4815],
    descripcion: 'Base de monitoreo central del sistema inteligente integrado con cámaras municipales.'
    , soundFile: 'https://assets.mixkit.co/active_storage/sfx/preview/mixkit-alarm-tone-993.wav'
  }
];

// Estructuras para manejar marcadores y tarjetas
const marcadores = {};

const listaEl = document.getElementById('listaPOI');
const coordsEl = document.getElementById('coordsDisplay');
const dbCountEl = document.getElementById('dbCount');
const searchInput = document.getElementById('searchInput');

dbCountEl.textContent = puntosDeInteres.length;

// Crear marcadores y tarjetas
puntosDeInteres.forEach(punto => {
  // Pre-cargar audio si el punto tiene archivo definido
  if (punto.soundFile) {
    try {
      punto._audio = new Audio(punto.soundFile);
      punto._audio.preload = 'auto';
    } catch (e) {
      console.warn('No se pudo precargar el audio para', punto.nombre, e);
    }
  }

  const marcador = L.marker(punto.coordenadas).addTo(mapa);
  marcadores[punto.id] = marcador;

  const htmlPopup = `
    <div class="popup-contenido">
      <h3>📍 ${punto.nombre}</h3>
      <p>${punto.descripcion}</p>
    </div>
  `;

  marcador.bindPopup(htmlPopup);

  // Crear tarjeta lateral
  const card = document.createElement('div');
  card.className = 'poi-card';
  card.setAttribute('role', 'article');
  card.setAttribute('tabindex', '0');
  card.dataset.id = punto.id;
  card.innerHTML = `
    <h3>✳️ ${punto.nombre}</h3>
    <p>${punto.descripcion}</p>
    <div class="poi-actions">
      <small>${punto.coordenadas.join(', ')}</small>
      <div>
        <button class="sonar-btn" type="button">🔊 Sonar</button>
      </div>
    </div>
  `;

  listaEl.appendChild(card);

  // Eventos: click en tarjeta centra el mapa y abre popup
  card.addEventListener('click', (e) => {
    // evitar que el click del botón dispare el evento doble
    if (e.target.classList.contains('sonar-btn')) return;
    document.querySelectorAll('.poi-card').forEach(c => c.classList.remove('active'));
    card.classList.add('active');
    mapa.setView(punto.coordenadas, 16, { animate: true });
    marcador.openPopup();
    coordsEl.textContent = punto.coordenadas.join(', ');
  });

  // Soporte teclado: Enter o Space en la tarjeta abre el popup
  card.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      card.click();
    }
  });

  // Botón sonar reproduce el audio y centra
  const sonarBtn = card.querySelector('.sonar-btn');
  sonarBtn.setAttribute('aria-label', `Reproducir alerta en ${punto.nombre}`);
  sonarBtn.addEventListener('click', (ev) => {
    ev.stopPropagation();
    // Usar playSoundFor que intenta reproducir archivo local y si falla usa fallback
    playSoundFor(punto);
    document.querySelectorAll('.poi-card').forEach(c => c.classList.remove('active'));
    card.classList.add('active');
    mapa.setView(punto.coordenadas, 16, { animate: true });
    marcador.openPopup();
    coordsEl.textContent = punto.coordenadas.join(', ');
  });

  
  sonarBtn.addEventListener('playEvent', () => {});


  const srStatus = document.getElementById('srStatus');
  const announcePlay = (name) => {
    if (srStatus) srStatus.textContent = `Alerta reproducida en ${name}`;
  };
  sonarBtn.addEventListener('click', () => announcePlay(punto.nombre));

  // Click en marcador también resalta la tarjeta
  marcador.on('click', () => {
    document.querySelectorAll('.poi-card').forEach(c => c.classList.remove('active'));
    card.classList.add('active');
    coordsEl.textContent = punto.coordenadas.join(', ');
  });
});

// Center button
document.getElementById('centerBtn').addEventListener('click', () => {
  mapa.setView([-34.5222, -58.4815], 14);
  document.querySelectorAll('.poi-card').forEach(c => c.classList.remove('active'));
  coordsEl.textContent = '-34.5222, -58.4815';
});

// Buscador simple por nombre
searchInput.addEventListener('input', (e) => {
  const q = e.target.value.toLowerCase().trim();
  document.querySelectorAll('.poi-card').forEach(card => {
    const text = card.textContent.toLowerCase();
    card.style.display = text.includes(q) ? '' : 'none';
  });
});

// --- Generación de Reportes PDF ---
function generatePDF() {
  const { jsPDF } = window.jspdf;
  const operadorName = document.getElementById('operadorName').value.trim();
  const descriptionText = document.getElementById('descriptionText').value.trim();
  
  // Validación
  if (!operadorName || !descriptionText) {
    alert('Por favor completa todos los campos antes de generar el PDF.');
    return;
  }

  try {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    const contentWidth = pageWidth - 2 * margin;
    
    // Encabezado colorido
    doc.setFillColor(230, 92, 0); // Color naranja (#e65c00)
    doc.rect(0, 0, pageWidth, 40, 'F');
    
    // Título en encabezado
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont(undefined, 'bold');
    doc.text('📋 REPORTE DE INCIDENCIA', margin, 15);
    
    // Subtítulo
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text('Sistema OTR Vision - Detección de Residuos', margin, 25);
    
    // Información de generación
    const now = new Date();
    const fecha = now.toLocaleDateString('es-AR');
    const hora = now.toLocaleTimeString('es-AR');
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generado: ${fecha} a las ${hora}`, margin, 35);
    
    // Contenido principal
    let yPosition = 50;
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);
    
    // Nombre del Operador
    doc.setFont(undefined, 'bold');
    doc.text('Operador/Alumno:', margin, yPosition);
    yPosition += 7;
    
    doc.setFont(undefined, 'normal');
    doc.setFontSize(12);
    doc.text(operadorName, margin, yPosition);
    yPosition += 15;
    
    // Detalle del Registro
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.text('Detalle del Registro:', margin, yPosition);
    yPosition += 7;
    
    doc.setFont(undefined, 'normal');
    doc.setFontSize(10);
    
    // Ajustar texto largo con salto de líneas
    const splitText = doc.splitTextToSize(descriptionText, contentWidth);
    doc.text(splitText, margin, yPosition);
    yPosition += splitText.length * 5 + 10;
    
    // Pie de página
    doc.setFontSize(9);
    doc.setTextColor(150, 150, 150);
    doc.text('EEST N°1 "Eduardo Ader" - PWD 7° 2° - Proyecto de Residuos Inteligentes', margin, pageHeight - 10);
    
    // Descargar PDF
    const nombreArchivo = `Reporte_${operadorName.replace(/\s+/g, '_')}_${now.getTime()}.pdf`;
    doc.save(nombreArchivo);
    
    // Confirmar generación
    alert(`✅ PDF descargado: ${nombreArchivo}`);
    
    // Limpiar formulario
    document.getElementById('reportForm').reset();
    
  } catch (error) {
    console.error('Error generando PDF:', error);
    alert('❌ Error al generar el PDF. Verifica la consola para más detalles.');
  }
}

// Evento del botón generar PDF
document.getElementById('generatePdfBtn').addEventListener('click', generatePDF);

// Permitir Enter en textarea sin generar salto
document.getElementById('descriptionText').addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && e.ctrlKey) {
    generatePDF();
  }
});

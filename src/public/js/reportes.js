(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];

  const cardsReportes = $('#reportes .seccion-tarjetas');
  const cardsQuejas   = $('#quejas .seccion-tarjetas');
  const misTbody      = $('#mis_reportes tbody');


  const formWrapper = $('#formulario');
  const form        = $('#formulario form') || $('#formulario #formulario');
  const checkbox    = $('#lineamientos');

  function ensureMessages() {
    if (!$('#error-lineamientos')) {
      const error = document.createElement('p');
      error.id = 'error-lineamientos';
      error.innerHTML = `<i class='bx bxs-error-circle'></i> Debe leer y aceptar los lineamientos para enviar su reporte.`;
      error.classList.add('mensaje-error');
      error.style.display = 'none';
      checkbox.parentElement.appendChild(error);
    }
    if (!$('#mensaje-exito')) {
      const exito = document.createElement('p');
      exito.id = 'mensaje-exito';
      exito.innerHTML = `<i class='bx bxs-check-circle'></i> Reporte enviado con éxito. Un administrador lo revisará pronto`;
      exito.classList.add('mensaje-exito');
      exito.style.display = 'none';
      form.appendChild(exito);
    }
    if (!$('#mensaje-error-envio')) {
      const errEnv = document.createElement('p');
      errEnv.id = 'mensaje-error-envio';
      errEnv.innerHTML = `<i class='bx bxs-error-circle'></i> No se pudo enviar el reporte. Intente de nuevo.`;
      errEnv.classList.add('mensaje-error');
      errEnv.style.display = 'none';
      form.appendChild(errEnv);
    }
  }

  ensureMessages();

  const mostrarExito = () => { $('#mensaje-exito').style.display = 'flex'; $('#mensaje-error-envio').style.display = 'none'; };
  const ocultarExito = () => { $('#mensaje-exito').style.display = 'none'; };
  const mostrarErrorEnvio = () => { $('#mensaje-error-envio').style.display = 'flex'; $('#mensaje-exito').style.display = 'none'; };
  const toggleLineaError = (show) => { $('#error-lineamientos').style.display = show ? 'flex' : 'none'; checkbox?.classList.toggle('checkbox-invalido', show); };

  function renderCards(container, items) {
    if (!container) return;
    if (!Array.isArray(items)) items = [];
    container.innerHTML = items.length
      ? items.map(cardHTML).join('')
      : `<p class="sec-vacia">Aún no hay publicaciones.</p>`;
  }

  function cardHTML(it) {
    const fecha = it?.fecha ? new Date(it.fecha).toLocaleDateString() : '';
    const img   = it?.imagen ? `<img src="/img/reportes/${it.imagen}" alt="Archivo adjunto" class="imagen-reporte">` : '';
    return `
      <div class="tarjeta">
        <h4>${esc(it?.titulo)}</h4>
        <p>${esc(it?.descripcion || '')}</p>
        ${img}
        ${fecha ? `<div class="fecha">${fecha}</div>` : ''}
      </div>
    `;
  }

function renderMisReportes(tbody, items) {
  if (!tbody) return;
  tbody.innerHTML = '';
  if (!items?.length) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;">No tienes reportes aún.</td></tr>`;
    return;
  }

  items.forEach((it) => {
    const tr = document.createElement('tr');
    const fecha = it?.fecha ? new Date(it.fecha).toLocaleDateString() : '';

    // Motivo de rechazo si existe
    const motivoRechazo = (it.estado === 'rechazado')
      ? (it.rejectionReason || it.motivoRechazo || it.motivo || '').toString().trim()
      : '';

    tr.innerHTML = `
      <td>${capitalizar(it.tipo)}</td>
      <td>${esc(it.titulo)}</td>
      <td>${fecha}</td>
      <td><span class="estado ${it.estado}">${capitalizar(it.estado)}</span></td>
      <td>${motivoRechazo ? esc(motivoRechazo) : '—'}</td>
    `;
    tbody.appendChild(tr);
  });
}


  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const capitalizar = (s) => (s || '').charAt(0).toUpperCase() + (s || '').slice(1);

  async function getJSON(url) {
    const r = await fetch(url, { credentials: 'include' });
    if (!r.ok) throw new Error(`GET ${url} => ${r.status}`);
    return r.json();
  }

  async function postMultipart(url, formData) {
    const r = await fetch(url, { method: 'POST', body: formData, credentials: 'include' });
    if (!r.ok) throw new Error(`POST ${url} => ${r.status}`);
    return r;
  }

  // ======= cargar datos (aprobados) =======
  async function cargarPublicos() {
    try {
      const data = await getJSON('/reportes_publicos');
      const soloReportes = data.filter(d => d.tipo === 'reporte');
      const soloQuejas   = data.filter(d => d.tipo === 'queja');
      renderCards(cardsReportes, soloReportes);
      renderCards(cardsQuejas,   soloQuejas);
    } catch (e) {
      console.error('Error cargando públicos', e);
      renderCards(cardsReportes, []);
      renderCards(cardsQuejas,   []);
    }
  }

  // ======= cargar mis reportes =======
  async function cargarMios() {
    if (!misTbody) return;
    try {
      const mios = await getJSON('/reportes_mios');
      renderMisReportes(misTbody, mios);
    } catch (e) {

      console.warn('No autenticado para /reportes_mios (ok si no logueado)');
      renderMisReportes(misTbody, []);
    }
  }

  // ======= envío del formulario =======
  if (form && checkbox) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      if (!checkbox.checked) {
        toggleLineaError(true);
        ocultarExito();
        return;
      }
      toggleLineaError(false);

      try {
        const fd = new FormData(form);
        if (!fd.has('tipo'))        fd.set('tipo',        $('#tipo')?.value || 'reporte');
        if (!fd.has('titulo'))      fd.set('titulo',      $('#titulo')?.value || '');
        if (!fd.has('descripcion')) fd.set('descripcion', $('#descripcion')?.value || '');
        if (!fd.has('foto') && $('#foto')?.files?.[0]) fd.append('foto', $('#foto').files[0]);

        await postMultipart('/reportes', fd);

        mostrarExito();
        setTimeout(() => ocultarExito(), 3000);
        form.reset();

        // refrescar listas
        await Promise.all([cargarPublicos(), cargarMios()]);
      } catch (e2) {
        console.error('Error enviando reporte', e2);
        mostrarErrorEnvio();
      }
    });
  }

  // ======= pestañas =======
  $$('.btn-pestana').forEach(boton => {
    boton.addEventListener('click', () => {
      const destino = boton.dataset.tab;
      $$('.btn-pestana').forEach(b => b.classList.remove('activa'));
      $$('.contenido-pestana').forEach(p => p.classList.remove('activa'));
      boton.classList.add('activa');
      document.getElementById(destino)?.classList.add('activa');
    });
  });

  document.addEventListener('DOMContentLoaded', async () => {
    await cargarPublicos();
    await cargarMios();
  });
})();

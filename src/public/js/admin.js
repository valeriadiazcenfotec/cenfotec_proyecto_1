function qs(sel, el = document)  { return el.querySelector(sel); }
function qsa(sel, el = document) { return [...el.querySelectorAll(sel)]; }


async function actualizarEstado({ id, tipo, accion, motivo }) {

  const tipoPathMap = {
    anuncio: 'anuncios',
    evento: 'eventos',
    reporte: 'reportes',
    queja: 'quejas',
    emprendimiento: 'emprendimientos',
    oferta: 'ofertas',
    usuario: 'usuarios',
  };

  const key = (tipo || '').toLowerCase().replace(/s$/, '');
  const tipoPath = tipoPathMap[key] || `${key}s`;

  let accionEs = ({ approve: 'aprobar', reject: 'rechazar', delete: 'eliminar' }[accion] || accion);
  if (key === 'usuario' && accion === 'approve') accionEs = 'promover';

  let url  = `/${tipoPath}/${id}/${accionEs}`;
  let opts = { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' };

  if (accionEs === 'rechazar') {
    opts.body = JSON.stringify({ reason: motivo || '' });
  }

  if (accionEs === 'eliminar') {
    url  = `/${tipoPath}/${id}`;
    opts = { method: 'DELETE' };
  }

  const r = await fetch(url, opts);
  if (!r.ok) throw new Error((await r.text()) || 'No se pudo actualizar');
  return r.json().catch(() => ({}));
}


function enlazarAcciones(container, { id, tipo, onSuccess }) {
  qsa('.aprobar, .rechazar, .eliminar', container).forEach(btn => {
    if (btn.__bound) return;
    btn.__bound = true;

    btn.addEventListener('click', async (e) => {
      e.preventDefault();

      const isDelete  = btn.classList.contains('eliminar');
      const isReject  = !isDelete && btn.classList.contains('rechazar');
      const isApprove = !isDelete && !isReject && btn.classList.contains('aprobar');
      let motivo = null;

      if (isReject) {
        motivo = prompt('Ingrese el motivo del rechazo:');
        if (motivo === null) return;
        if (!motivo.trim()) { alert('Debe ingresar un motivo.'); return; }
      }

      if (isDelete) {
        const ok = confirm('¿Seguro que desea eliminar este elemento?');
        if (!ok) return;
      }

      try {
        await actualizarEstado({
          id,
          tipo,
          accion: isDelete ? 'delete' : (isReject ? 'reject' : 'approve'),
          motivo
        });

        if (typeof onSuccess === 'function') onSuccess();
      } catch (err) {
        alert(`Error: ${err.message || err}`);
      }
    });
  });
}


document.addEventListener('DOMContentLoaded', () => {
  const overlay = qs('#overlay');
  const modal   = qs('#modal-detalles');

  /* ---------- Tarjetas (todas las secciones) ---------- */
  qsa('.card').forEach(card => {
    // Botón de "tres puntos"
    if (!card.querySelector('.toggle-actions')) {
      const t = document.createElement('button');
      t.className = 'toggle-actions';
      t.setAttribute('aria-label', 'Mostrar acciones');
      t.innerHTML = "<i class='bx bx-dots-horizontal-rounded'></i>";
      card.prepend(t);

      t.addEventListener('click', (e) => {
        e.stopPropagation();
        card.classList.toggle('show-actions');
      });
    }

    enlazarAcciones(card, {
      id:   card.dataset.id,
      tipo: card.dataset.type,
      onSuccess: () => card.remove()
    });
  });

  qsa('#usuarios tbody tr').forEach(row => {
    const id   = row.dataset.id;
    const tipo = row.dataset.type || 'usuario';
    if (!id) return;

    enlazarAcciones(row, {
      id,
      tipo,
      onSuccess: () => {
        const roleCell = row.querySelector('td:nth-child(5)');
        if (roleCell) roleCell.textContent = 'admin';
        const btn = row.querySelector('.aprobar');
        if (btn) {
          btn.textContent = 'Ya es Admin';
          btn.disabled = true;
          btn.classList.remove('aprobar');
        }
      }
    });
  });

  /* ---------- Modal: abrir con "Ver detalles" ---------- */
  qsa('[data-modal-target]').forEach(btn => {
    btn.addEventListener('click', () => {
      const card = btn.closest('.card');
      if (!card) return;

      // Título / descripción
      qs('#md-titulo').textContent      = card.dataset.titulo || '';
      qs('#md-descripcion').textContent = card.dataset.descripcion || '';

      // Campos opcionales (según tipo)
      const mdLugar = qs('#md-lugar');  if (mdLugar)  mdLugar.textContent = card.dataset.lugar || '';
      const mdFecha = qs('#md-fecha');  if (mdFecha)  mdFecha.textContent = card.dataset.fecha || '';
      const mdProp  = qs('#md-propietario'); if (mdProp) mdProp.textContent =
        card.dataset.propietarioNombre || card.dataset.propietario || '';

      // Imagen principal
      const img = qs('#modal-image');
      const showBtn = qs('#show-image');
      if (img && showBtn) {
        img.src = card.dataset.imagen || '';
        img.style.display = 'none';
        showBtn.textContent = 'Ver imagen';
        showBtn.style.display = img.src ? 'inline-block' : 'none';
      }

      const wrap = qs('#md-galeria-wrap');
      const gal  = qs('#md-galeria');
      if (wrap && gal) {
        gal.innerHTML = '';
        wrap.style.display = 'none';
        if (card.dataset.galeria) {
          try {
            const arr = JSON.parse(card.dataset.galeria || '[]');
            if (arr.length) {
              arr.forEach(fn => {
                const el = document.createElement('img');
                el.src = `/img/${fn}`;
                el.alt = 'Producto';
                el.style.maxWidth = '140px';
                el.style.height = 'auto';
                el.style.borderRadius = '8px';
                el.style.border = '1px solid #eee';
                gal.appendChild(el);
              });
              wrap.style.display = 'block';
            }
          } catch {}
        }
      }

      const modalActions = qs('.modal-actions', modal);
      modalActions.innerHTML = '';
      qsa('.aprobar, .rechazar, .eliminar', card).forEach(b => {
        const clone = b.cloneNode(true);
        modalActions.appendChild(clone);
      });

      enlazarAcciones(modal, {
        id:   card.dataset.id,
        tipo: card.dataset.type,
        onSuccess: () => { card.remove(); closeModal(); }
      });

      openModal();
    });
  });

  /* ---------- Toggle imagen en modal ---------- */
  const toggleImageBtn = qs('#show-image');
  const modalImage     = qs('#modal-image');
  if (toggleImageBtn && modalImage) {
    toggleImageBtn.addEventListener('click', () => {
      const vis = modalImage.style.display === 'block';
      modalImage.style.display = vis ? 'none' : 'block';
      toggleImageBtn.textContent = vis ? 'Ver imagen' : 'Ocultar imagen';
    });
  }

  /* ---------- Cerrar modal ---------- */
  qsa('[data-close-button]').forEach(b => b.addEventListener('click', closeModal));
  if (overlay) overlay.addEventListener('click', closeModal);

  function openModal(){ modal.classList.add('active'); overlay.classList.add('active'); }
  function closeModal(){ modal.classList.remove('active'); overlay.classList.remove('active'); }

  const sidebarToggle = qs('#sidebar-toggle');
  qsa('.sidebar a').forEach(link => {
    link.addEventListener('click', () => { if (sidebarToggle) sidebarToggle.checked = false; });
  });
});

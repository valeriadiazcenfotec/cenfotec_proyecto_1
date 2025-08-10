
function qs(sel, el=document) { return el.querySelector(sel); }
function qsa(sel, el=document) { return [...el.querySelectorAll(sel)]; }


async function actualizarEstado({ id, tipo, accion, motivo }) {
  const accionMap = { approve: 'aprobar', reject: 'rechazar' };
  const accionEs = accionMap[accion] || accion;

  const url = `/${tipo}s/${id}/${accionEs}`;
  const opts = { method: 'POST', headers: { 'Content-Type': 'application/json' } };

  if (accionEs === 'rechazar') {
    opts.body = JSON.stringify({ reason: motivo || '' });
  } else {
    opts.body = '{}';
  }

  const r = await fetch(url, opts);
  if (!r.ok) throw new Error((await r.text()) || 'No se pudo actualizar');
  return r.json();
}

/* ===========================================================
   enlazar acciones a un contenedor
=========================================================== */
function enlazarAcciones(container, { id, tipo, onSuccess }) {
  qsa('.aprobar, .rechazar', container).forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      const isReject = btn.classList.contains('rechazar');
      let motivo = null;

      // Pedir motivo SOLO si es rechazar
      if (isReject) {
        motivo = prompt('Ingrese el motivo del rechazo:');
        if (motivo === null) return;
        if (!motivo.trim()) { alert('Debe ingresar un motivo.'); return; }
      }

      try {
        await actualizarEstado({
          id,
          tipo,
          accion: isReject ? 'reject' : 'approve',
          motivo
        });
        if (typeof onSuccess === 'function') onSuccess();
      } catch (err) {
        alert(`Error: ${err.message}`);
      }
    });
  });
}

/* ===========================================================
   crear todo desde la tarjeta
=========================================================== */
document.addEventListener('DOMContentLoaded', () => {
  const overlay = qs('#overlay');
  const modal = qs('#modal-detalles');

  // Abrir al hacer clic en "Ver Detalles"
  qsa('[data-modal-target]').forEach(btn => {
    btn.addEventListener('click', () => {
      const card = btn.closest('.card');
      if (!card) return;

      qs('#md-titulo').textContent = card.dataset.titulo || '';
      qs('#md-descripcion').textContent = card.dataset.descripcion || '';

      const img = qs('#modal-image');
      img.src = card.dataset.imagen || '/img/placeholder.jpg';
      img.style.display = 'none';
      const showBtn = qs('#show-image');
      if (showBtn) showBtn.textContent = 'Ver imagen';

      const modalActions = qs('.modal-actions', modal);
      modalActions.innerHTML = '';
      qsa('.aprobar, .rechazar', card).forEach(b => modalActions.appendChild(b.cloneNode(true)));

      enlazarAcciones(modal, {
        id: card.dataset.id,
        tipo: card.dataset.type,
        onSuccess: () => { card.remove(); closeModal(); }
      });

      openModal();
    });
  });

  const toggleImageBtn = qs('#show-image');
  const modalImage = qs('#modal-image');
  if (toggleImageBtn && modalImage) {
    toggleImageBtn.addEventListener('click', () => {
      const vis = modalImage.style.display === 'block';
      modalImage.style.display = vis ? 'none' : 'block';
      toggleImageBtn.textContent = vis ? 'Ver imagen' : 'Ocultar imagen';
    });
  }

  qsa('[data-close-button]').forEach(b => b.addEventListener('click', closeModal));
  overlay.addEventListener('click', closeModal);

  function openModal(){ modal.classList.add('active'); overlay.classList.add('active'); }
  function closeModal(){ modal.classList.remove('active'); overlay.classList.remove('active'); }
});

/* ===========================================================
   icono tres puntos y toggle de acciones en tarjetas
=========================================================== */
document.addEventListener('DOMContentLoaded', () => {
  qsa('.card').forEach(card => {
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

    // Enlazar "Aprobar/Rechazar" directamente en la tarjeta
    enlazarAcciones(card, {
      id: card.dataset.id,
      tipo: card.dataset.type,
      onSuccess: () => card.remove()
    });
  });

  // Cerrar los toggles al hacer click fuera de cualquier tarjeta
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.card')) {
      qsa('.card.show-actions').forEach(c => c.classList.remove('show-actions'));
    }
  });
});

/* ===========================================================
   responsive: cerrar sidebar al navegar
=========================================================== */
document.addEventListener("DOMContentLoaded", function () {
  const sidebarToggle = document.getElementById("sidebar-toggle");
  const sidebarLinks = document.querySelectorAll(".sidebar a");

  sidebarLinks.forEach(link => {
    link.addEventListener("click", () => {
      sidebarToggle.checked = false;
    });
  });
});

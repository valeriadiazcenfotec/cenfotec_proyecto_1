(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const cont = $('#lista-ofertas');

  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, m => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[m]));

  async function getJSON(url) {
    const r = await fetch(url, { credentials: 'include' });
    if (!r.ok) throw new Error(`GET ${url} => ${r.status}`);
    return r.json();
  }

  function cardHTML(off) {
    const portada = off?.imagenOferta ? `/img/${off.imagenOferta}` : '/img/placeholder.png';
    return `
        <div class="sales_card">
                <div class="item">
                    <h3 class="offer-tittle">${esc(off?.titulo || '')}</h3>
                    <img src="${portada}" alt="Imagen oferta" class="offer-image">
                    <p class="offer-description">${esc(off?.descripcion || '')}</p>
                </div>
        </div>
    `;
  }

  function renderLista(items) {
    if (!Array.isArray(items) || !items.length) {
      cont.innerHTML = `<p class="sec-vacia">Aún no hay ofertas aprobadas.</p>`;
      return;
    }
    cont.innerHTML = items.map(cardHTML).join('');
  }

  async function cargar(categoria = 'all') {
    cont.innerHTML = '<p>Cargando...</p>';
    const qs = categoria === 'all' ? '' : `?categoria=${encodeURIComponent(categoria)}`;
    try {
      const data = await getJSON(`/ofertas_publicas${qs}`); // SOLO APROBADOS
      renderLista(data);
    } catch (e) {
      console.error('Error cargando ofertas', e);
      cont.innerHTML = `<p class="sec-vacia">Error cargando ofertas.</p>`;
    }
  }

  $$('.f-cat').forEach(a => {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      const cat = a.getAttribute('data-cat') || 'all';
      cargar(cat);
      history.replaceState(null, '', cat === 'all' ? '/ofertas' : `/ofertas?categoria=${encodeURIComponent(cat)}`);
    });
  });

  document.addEventListener('DOMContentLoaded', () => {
    const cat = new URLSearchParams(location.search).get('categoria') || 'all';
    cargar(cat);
  });
})();

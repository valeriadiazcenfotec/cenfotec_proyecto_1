(() => {
  const $  = (s, el=document) => el.querySelector(s);
  const $$ = (s, el=document) => [...el.querySelectorAll(s)];
  const cont = $('#lista-emprendimientos');

  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, m => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[m]));

  async function getJSON(url) {
    const r = await fetch(url, { credentials: 'include' });
    if (!r.ok) throw new Error(`GET ${url} => ${r.status}`);
    return r.json();
  }

  function cardHTML(emp) {
    const portada = emp?.imagenNegocio ? `/img/${emp.imagenNegocio}` : '/img/placeholder.png';
    const productos = (emp?.imagenesProductos || [])
      .map(img => `<img src="/img/${img}" class="imagen" alt="Producto">`)
      .join('');

    return `
      <a class="business_card" href="/emprendimientos/${emp._id}">
        <div class="column">
          <h2 class="business_title">${esc(emp?.nombreN || '')}</h2>
          <p class="business_description">${esc(emp?.descripcion || '')}</p>
        </div>
        <div class="products">
          <h3 class="products_title">Imagen del negocio</h3>
          <img src="${portada}" alt="Imagen negocio" class="product_img">
        </div>
        <div class="carrusel">
          <div class="imagenes">${productos}</div>
          <button class="anterior"><i class='bx bx-arrow-left-stroke'></i></button>
          <button class="siguiente"><i class='bx bx-arrow-right'></i></button>
        </div>
      </a>
    `;
  }

  function activarCarruseles() {
    $$('.carrusel').forEach(carrusel => {
      const imgs = carrusel.querySelector('.imagenes');
      const total = carrusel.querySelectorAll('.imagenes img').length || 1;
      const prev = carrusel.querySelector('.anterior');
      const next = carrusel.querySelector('.siguiente');
      let i = 0;
      const w = () => carrusel.querySelector('img')?.width || 0;
      const upd = () => { imgs.style.transform = `translateX(-${i * w()}px)`; };
      next?.addEventListener('click', () => { i = (i + 1) % total; upd(); });
      prev?.addEventListener('click', () => { i = (i - 1 + total) % total; upd(); });
      window.addEventListener('resize', upd);
    });
  }

  function renderLista(items) {
    if (!Array.isArray(items) || !items.length) {
      cont.innerHTML = `<p class="sec-vacia">Aún no hay emprendimientos aprobados.</p>`;
      return;
    }
    cont.innerHTML = items.map(cardHTML).join('');
    activarCarruseles();
  }

  async function cargar(categoria='all') {
    cont.innerHTML = '<p>Cargando...</p>';
    const qs = categoria === 'all' ? '' : `?categoria=${encodeURIComponent(categoria)}`;
    try {
      const data = await getJSON(`/emprendimientos_publicos${qs}`); // SOLO APROBADOS
      renderLista(data);
    } catch (e) {
      console.error('Error cargando emprendimientos', e);
      cont.innerHTML = `<p class="sec-vacia">Error cargando emprendimientos.</p>`;
    }
  }

  $$('.f-cat').forEach(a => {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      const cat = a.getAttribute('data-cat') || 'all';
      cargar(cat);
      history.replaceState(null, '', cat==='all' ? '/emprendimientos' : `/emprendimientos?categoria=${encodeURIComponent(cat)}`);
    });
  });

  document.addEventListener('DOMContentLoaded', () => {
    const cat = new URLSearchParams(location.search).get('categoria') || 'all';
    cargar(cat);
  });
})();

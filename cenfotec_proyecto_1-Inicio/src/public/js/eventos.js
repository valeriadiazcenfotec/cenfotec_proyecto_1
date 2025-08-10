function escapeHTML(str = '') {
  return String(str).replace(/[&<>"']/g, s => (
    { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[s]
  ));
}

function formateaFecha(isoLike) {
  try {
    const d = new Date(isoLike);
    if (isNaN(d.getTime())) return isoLike || '';
    const pad = n => String(n).padStart(2, '0');
    return `${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return isoLike || '';
  }
}

function tarjetaEvento(ev) {
  const img  = ev.image || '/img/evento.jpg';
  const name = escapeHTML(ev.name);
  const desc = escapeHTML(ev.description || '');
  const place = escapeHTML(ev.place || '—');
  const date  = escapeHTML(formateaFecha(ev.date));

  return `
    <div class="carta" data-name="${name}" data-desc="${desc}" data-img="${img}">
      <img src="${img}" class="img_carta" alt="">
      <i class="fa-regular fa-heart fa-2x corazon sin_like"></i>
      <i class="fa-solid fa-heart fa-2x corazon con_like" style="visibility:hidden;"></i>
      <br>
      <div class="carta2">
        <h3 class="montserrat-bold nombre">${name}</h3>
        <p class="montserrat-medium parrafo">${desc}</p>
        <div class="fecha_lugar">
          <button class="escribir">
            <i class="fa-solid fa-location-dot fa-2x"></i>
            <p class="montserrat-semibold">${place}</p>
          </button>
          <p class="montserrat-medium fecha">${date}</p>
        </div>
      </div>
    </div>
  `;
}


async function cargarEventosPublicos() {
  const contenedor = document.querySelector('.cartas');
  if (!contenedor) return;

  contenedor.innerHTML = '<p style="padding:1rem;">Cargando eventos…</p>';

  const fetchEventos = async (url) => {
    const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
    if (!res.ok) throw new Error(`Error ${res.status} en ${url}`);
    return res.json();
  };

  try {
    let eventos = [];
    try {
      eventos = await fetchEventos('/eventos_publicos');
    } catch {
      eventos = await fetchEventos('/eventos_todos');
    }

    if (!Array.isArray(eventos) || eventos.length === 0) {
      contenedor.innerHTML = '<p style="padding:1rem;">No hay eventos publicados todavía.</p>';
      return;
    }

    contenedor.innerHTML = eventos.map(tarjetaEvento).join('');
  } catch (err) {
    console.error('Error al cargar eventos públicos:', err);
    contenedor.innerHTML = '<p style="padding:1rem;color:#c00;">Error al cargar eventos.</p>';
  }
}

const cartaMuestra = () => document.getElementById("carta_muestra");
const subtitulo = () => document.querySelector(".peticion");
const subtitulo2 = () => document.querySelector(".peticion2");
const imgCartaDesplegada = () => document.querySelector(".img_carta_desplegada");

function abrirFormularioDesdeCarta(card) {
  if (!card) return;
  const nombre = card.dataset.name || card.querySelector(".nombre")?.textContent || '';
  const parrafo = card.dataset.desc || card.querySelector(".parrafo")?.textContent || '';
  const imagen_src = card.dataset.img || card.querySelector(".img_carta")?.getAttribute("src") || '/img/evento.jpg';

  const cm = cartaMuestra();
  if (!cm) return;

  cm.style.display = "block";
  if (subtitulo())  subtitulo().textContent = nombre;
  if (subtitulo2()) subtitulo2().textContent = parrafo;
  if (imgCartaDesplegada()) imgCartaDesplegada().setAttribute("src", imagen_src);
}

// Cierra la carta desplegada
function cerrarFormulario() {
  const cm = cartaMuestra(); 
  if (cm) cm.style.display = "none";
}

document.addEventListener('click', (e) => {
  const card = e.target.closest('.carta');

  if (card && (e.target.closest('.img_carta') || e.target.closest('.carta2'))) {
    abrirFormularioDesdeCarta(card);
  }

  const btnSin = e.target.closest('.sin_like');
  const btnCon = e.target.closest('.con_like');

  if (btnSin) {
    btnSin.style.visibility = 'hidden';
    const con = btnSin.parentElement.querySelector('.con_like');
    if (con) con.style.visibility = 'visible';
  } else if (btnCon) {
    btnCon.style.visibility = 'hidden';
    const sin = btnCon.parentElement.querySelector('.sin_like');
    if (sin) sin.style.visibility = 'visible';
  }
});

function abrirFormulario() {
  const card = document.querySelector('.carta:hover') || null;
  if (card) abrirFormularioDesdeCarta(card);
  else if (cartaMuestra()) cartaMuestra().style.display = "block";
}

async function cargarPeticiones() {
  try {
    const res = await fetch('/eventos_todos');
    if (!res.ok) throw new Error('No se pudo cargar eventos');
    const eventos = await res.json();

    const peticiones_todas = document.getElementById('peticiones_todas');
    if (!peticiones_todas) return;

    peticiones_todas.innerHTML = '';
    eventos.forEach(evento => {
      const div = document.createElement('div');
      div.classList.add('peticion_una');
      div.innerHTML = `
        <h3 class="montserrat-semibold">${escapeHTML(evento.name)}</h3>
        <button class="boton_especifico_peticiones" data-id="${evento._id}">
          <p class="montserrat-medium">Cancelar</p>
        </button>
      `;
      peticiones_todas.appendChild(div);
    });
  } catch (error) {
    console.error('Error al cargar peticiones:', error);
  }
}

document.addEventListener('click', async function (e) {
  const boton = e.target.closest('.boton_especifico_peticiones');
  if (!boton) return;

  e.preventDefault();
  const id = boton.getAttribute('data-id');

  try {
    const res = await fetch('/peticion_evento_cancelar', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _id: id })
    });
    const data = await res.json();
    console.log('Eliminado:', data);
    boton.closest('.peticion_una')?.remove();
  } catch (err) {
    console.error('Error al cancelar petición:', err);
  }
});


function peticionAbierta() {
  const f = document.getElementById("form");
  if (f) f.style.display = "block";
}
function peticionCerrada() {
  const f = document.getElementById("form");
  if (f) f.style.display = "none";
}

function toBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
}

document.getElementById('form')?.addEventListener('submit', async function (e) {
  e.preventDefault();
  const file = document.getElementById('file').files[0];
  const name = document.getElementById('nombre').value;
  const place = document.getElementById('lugar').value;
  const date = document.getElementById('date').value;
  const description = document.getElementById('anuncio_en_curso').value;

  try {
    let imageBase64 = '';
    if (file) {
      imageBase64 = await toBase64(file);
    }

    const res = await fetch('/peticion_evento', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, place, date, description, image: imageBase64 })
    });

    const data = await res.json();
    console.log('Server response:', data);

    alert('Petición enviada. Un administrador la revisará.');
    peticionCerrada();
    this.reset();

    cargarPeticiones();
  } catch (err) {
    console.error('Upload error:', err);
    alert('Error al enviar la petición.');
  }
});

window.addEventListener('DOMContentLoaded', () => {
  cargarEventosPublicos();
  cargarPeticiones();
});

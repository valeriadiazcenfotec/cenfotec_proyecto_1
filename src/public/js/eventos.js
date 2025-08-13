(() => {
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];

const contenedorEventos = $('.cartas');
const contenedorMisEventos = $('#peticiones_todas');
const form = $('#form');
const modalDetalle = $('#carta_muestra');
const modalTitulo = $('.peticion');
const modalDescripcion = $('.peticion2');
const modalLugar = $('.lugar1');
const modalAutor = $('.autor');
const modalFecha = $('.fecha1');
const imgCartaDesplegada = $('.img_carta_desplegada');

// Escapar texto para evitar XSS
const esc = s => String(s ?? '').replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));

// ---- Formatear fecha ----
function formatearFecha(fecha) {
    if (!fecha) return 'Sin fecha';
    try {
        const date = new Date(fecha);
        if (isNaN(date.getTime())) return fecha || '';
        return date.toLocaleDateString('es-CR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch {
        return fecha || '';
    }
}

// ---- Obtener clase CSS según estado ----
function getEstadoClass(estado) {
    switch(estado) {
        case 'aprobado': return 'estado-aprobado';
        case 'rechazado': return 'estado-rechazado';
        case 'pendiente':
        default: return 'estado-pendiente';
    }
}

// ---- Crear tarjeta de evento para sección principal ----
function crearTarjetaEvento(evento) {
    const img = evento.image || '/img/evento.jpg';
    const name = esc(evento.name);
    const desc = esc(evento.description || '');
    const place = esc(evento.place || '—');
    const date = esc(formatearFecha(evento.date));

    return `
        <div class="carta" data-name="${name}" data-desc="${desc}" data-img="${img}" data-place="${place}" data-date="${date}">
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

// ---- Cargar eventos totales (solo aprobados) ----
async function cargarEventosTotales() {
    if (!contenedorEventos) return;
    
    contenedorEventos.innerHTML = '<p style="padding:1rem;">Cargando eventos…</p>';
    
    try {
        const res = await fetch('/eventos_todos');
        if (!res.ok) throw new Error('Error cargando eventos totales');
        
        const eventos = await res.json();
        // Filtrar solo eventos aprobados
        const eventosAprobados = eventos.filter(evento => evento.estado === 'aprobado');
        
        if (!eventosAprobados?.length) {
            contenedorEventos.innerHTML = '<p style="padding:1rem;">No hay eventos publicados todavía.</p>';
            return;
        }
        
        contenedorEventos.innerHTML = eventosAprobados.map(crearTarjetaEvento).join('');
    } catch (error) {
        console.error('Error al cargar eventos totales:', error);
        contenedorEventos.innerHTML = '<p style="padding:1rem;color:#c00;">Error al cargar eventos.</p>';
    }
}


    // ---- // ---- Renderizar lista de mis eventos ----
function renderMisEventos(container, items) {
    if (!container) return;
    container.innerHTML = '';
    if (!items?.length) {
        container.innerHTML = `<p style="text-align:center; color: #666;">No tienes eventos aún.</p>`;
        return;
    }
    items.forEach(item => {
        const div = document.createElement('div');
        div.classList.add('evento');
        div.dataset.id = item._id;
        
        // Determinar el texto del estado
        let estadoTexto = item.estado || 'pendiente';
        estadoTexto = estadoTexto.charAt(0).toUpperCase() + estadoTexto.slice(1);
        
        div.innerHTML = `
            <div class="categoria"><p class="montserrat-medium">Evento</p></div>
            <h2 class="montserrat-semibold nombre">${esc(item.name)}</h2>
            <p class="montserrat-medium descripcion parrafo">${esc(item.description)}</p>
            <p class="montserrat-medium lugar-evento"><strong>Lugar:</strong> ${esc(item.place || 'Sin lugar')}</p>
            <button class="estado montserrat-semibold ${getEstadoClass(item.estado)}">${estadoTexto}</button>
            ${item.estado === 'pendiente' ? `
            
            ` : ''}
            ${item.estado === 'rechazado' && item.rejectionReason ? `
                <div class="rechazo-razon">
                    <p class="montserrat-small"><strong>Motivo:</strong> ${esc(item.rejectionReason)}</p>
                </div>
            ` : ''}
            <div class="fecha"><p class="montserrat-medium">${formatearFecha(item.date)}</p></div>
        `;
        container.appendChild(div);
    });
}

// ---- Cargar mis eventos desde backend ----
async function cargarMisEventos() {
    if (!contenedorMisEventos) return;
    try {
        const res = await fetch('/eventos_mios', { credentials: 'include' });
        if (!res.ok) {
            if (res.status === 401) {
                // Usuario no autenticado
                contenedorMisEventos.innerHTML = `<p style="text-align:center; color: #666;">Inicia sesión para ver tus eventos.</p>`;
                return;
            }
            throw new Error('Error cargando mis eventos');
        }
        const eventos = await res.json();
        renderMisEventos(contenedorMisEventos, eventos);
    } catch (e) {
        console.warn('Error cargando /eventos_mios:', e);
        contenedorMisEventos.innerHTML = `<p style="text-align:center; color: #ff6b6b;">Error cargando tus eventos.</p>`;
    }
}

// ---- Mostrar modal con detalles del evento ----
function mostrarModalEvento(eventoEl) {
    if (!modalDetalle) return;
    
    modalDetalle.style.display = 'block';
    
    // Para eventos de la sección principal (cartas)
    if (eventoEl.classList.contains('carta')) {
        modalTitulo.textContent = eventoEl.dataset.name || eventoEl.querySelector('.nombre').textContent;
        modalDescripcion.textContent = eventoEl.dataset.desc || eventoEl.querySelector('.parrafo').textContent;
        if (modalLugar) modalLugar.textContent = eventoEl.dataset.place || 'Flores, Heredia';
        if (modalAutor) modalAutor.textContent = 'Aprobado';
        if (modalFecha) modalFecha.textContent = eventoEl.dataset.date || eventoEl.querySelector('.fecha').textContent;
        if (imgCartaDesplegada) imgCartaDesplegada.src = eventoEl.dataset.img || eventoEl.querySelector('.img_carta').src;
    }
    // Para mis eventos
    else if (eventoEl.classList.contains('evento')) {
        modalTitulo.textContent = eventoEl.querySelector('.nombre').textContent;
        modalDescripcion.textContent = eventoEl.querySelector('.descripcion').textContent;
        if (modalLugar) modalLugar.textContent = eventoEl.querySelector('.lugar-evento').textContent;
        if (modalAutor) modalAutor.textContent = eventoEl.querySelector('.estado').textContent;
        if (modalFecha) modalFecha.textContent = eventoEl.querySelector('.fecha-evento').textContent;
        if (imgCartaDesplegada) imgCartaDesplegada.src = '/img/evento.jpg';
    }
}

// ---- Cerrar modal detalle ----
function cerrarModalDetalle() {
    if (modalDetalle) {
        modalDetalle.style.display = 'none';
    }
}

// ---- Activar clicks en eventos ----
function activarClicksEventos() {
    // Para eventos totales (cartas)
    contenedorEventos?.addEventListener('click', e => {
        const carta = e.target.closest('.carta');
        if (!carta) return;
        
        // Solo abrir modal si click en imagen o carta2
        if (e.target.closest('.img_carta') || e.target.closest('.carta2')) {
            mostrarModalEvento(carta);
        }
        
        // Manejar likes
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
    
    // Para mis eventos
    contenedorMisEventos?.addEventListener('click', e => {
        const eventoEl = e.target.closest('.evento');
        if (!eventoEl) return;
        
        // Ignorar si clic en botón cancelar o estado
        if (e.target.closest('.boton_especifico_peticiones') || e.target.closest('.estado')) return;
        
        mostrarModalEvento(eventoEl);
    });
}

// ---- Verificar sesión de usuario ----
async function verificarSesion() {
    try {
        const res = await fetch('/sesion', { credentials: 'include' });
        const data = await res.json();
        return data.loggedIn;
    } catch (error) {
        console.warn('Error verificando sesión:', error);
        return false;
    }
}

// ---- Convertir archivo a base64 ----
function toBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = err => reject(err);
    });
}

// ---- Enviar nuevo evento ----
if (form) {
    form.addEventListener('submit', async e => {
        e.preventDefault();

        const file = $('#file')?.files?.[0];
        const name = $('#nombre')?.value.trim();
        const place = $('#lugar')?.value.trim();
        const date = $('#date')?.value;
        const description = $('#anuncio_en_curso')?.value.trim();

        if (!name || !place || !date || !description) {
            alert('Todos los campos son obligatorios');
            return;
        }

        // Verificar que el usuario esté autenticado
        const isLoggedIn = await verificarSesion();
        if (!isLoggedIn) {
            alert('Debes iniciar sesión para crear un evento');
            window.location.href = '/login';
            return;
        }

        try {
            let imageBase64 = null;
            if (file) {
                // Validar tipo de archivo
                const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
                if (!validTypes.includes(file.type)) {
                    alert('Solo se permiten imágenes (JPG, PNG, WEBP)');
                    return;
                }
                
                imageBase64 = await toBase64(file);
            }

            const res = await fetch('/peticion_evento', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, place, date, description, image: imageBase64 }),
                credentials: 'include',
            });

            if (!res.ok) {
                if (res.status === 401) {
                    alert('Debes iniciar sesión para crear un evento');
                    window.location.href = '/login';
                    return;
                }
                throw new Error('Error enviando evento');
            }
            
            const data = await res.json();
            console.log('Evento enviado:', data);
            alert('¡Evento enviado exitosamente! Estará visible una vez que sea aprobado por un administrador.');

            // Limpiar formulario
            form.reset();
            peticionCerrada();

            // Recargar eventos después de enviar
            await cargarMisEventos();
            await cargarEventosTotales();
        } catch (error) {
            console.error('Error enviando evento:', error);
            alert('No se pudo enviar el evento. Intente de nuevo.');
        }
    });
}

// ---- Cancelar/eliminar evento ----
document.addEventListener('click', async e => {
    const botonCancelar = e.target.closest('.boton_especifico_peticiones');
    if (!botonCancelar) return;

    e.preventDefault();

    const id = botonCancelar.dataset.id;
    if (!id) return;

    if (!confirm('¿Estás seguro de que quieres cancelar este evento?')) {
        return;
    }

    try {
        const res = await fetch('/peticion_evento_cancelar', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ _id: id }),
            credentials: 'include',
        });

        if (!res.ok) {
            if (res.status === 401) {
                alert('Debes iniciar sesión para realizar esta acción');
                window.location.href = '/login';
                return;
            }
            throw new Error('Error cancelando evento');
        }
        
        const data = await res.json();
        console.log('Evento cancelado:', data);
        alert('Evento cancelado exitosamente');

        // Remover el evento de la vista
        botonCancelar.closest('.evento')?.remove();
    } catch (error) {
        console.error('Error cancelando evento:', error);
        alert('No se pudo cancelar el evento. Intente de nuevo.');
    }
});

// ---- Funciones globales para abrir/cerrar formulario y modal ----
window.peticionAbierta = async () => { 
    const isLoggedIn = await verificarSesion();
    if (!isLoggedIn) {
        alert('Debes iniciar sesión para crear un evento');
        window.location.href = '/login';
        return;
    }
    form.style.display = 'block'; 
};

window.peticionCerrada = () => { 
    if (form) form.style.display = 'none'; 
};

window.abrirFormulario = async () => { 
    const isLoggedIn = await verificarSesion();
    if (!isLoggedIn) {
        alert('Debes iniciar sesión para crear un evento');
        window.location.href = '/login';
        return;
    }
    form.style.display = 'block'; 
};

window.cerrarFormulario = () => { 
    cerrarModalDetalle(); 
};

// ---- Inicialización ----
document.addEventListener('DOMContentLoaded', async () => {
    // Cargar eventos totales primero (solo aprobados, no requiere autenticación)
    await cargarEventosTotales();
    
    // Cargar mis eventos si el usuario está autenticado
    const isLoggedIn = await verificarSesion();
    if (isLoggedIn) {
        await cargarMisEventos();
    } else {
        // Si no está autenticado, mostrar mensaje
        if (contenedorMisEventos) {
            contenedorMisEventos.innerHTML = `<p style="text-align:center; color: #666;">Inicia sesión para ver tus eventos.</p>`;
        }
    }
    
    activarClicksEventos();

    // Cerrar modal con click fuera o ESC
    window.addEventListener('click', e => {
        if (e.target === modalDetalle) cerrarModalDetalle();
    });
    
    window.addEventListener('keydown', e => {
        if (e.key === 'Escape') {
            cerrarModalDetalle();
            if (form && form.style.display === 'block') {
                peticionCerrada();
            }
        }
    });
});

})();
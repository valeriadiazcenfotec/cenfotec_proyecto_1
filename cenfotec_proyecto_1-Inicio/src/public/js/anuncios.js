(() => {
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];

const contenedorAnuncios = $('#peticiones_todas');
const form = $('#form');
const inputBusqueda = $('#busca');
const modalDetalle = $('#carta_muestra');
const modalTitulo = $('.peticion');
const modalDescripcion = $('.peticion2');
const modalLugar = $('.lugar1');
const modalAutor = $('.autor');
const modalFecha = $('.fecha1');

// Escapar texto para evitar XSS
const esc = s => String(s ?? '').replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));

// ---- Formatear fecha ----
function formatearFecha(fecha) {
    if (!fecha) return 'Sin fecha';
    const date = new Date(fecha);
    return date.toLocaleDateString('es-CR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
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

// ---- Renderizar lista de mis anuncios ----
function renderMisAnuncios(container, items) {
    if (!container) return;
    container.innerHTML = '';
    if (!items?.length) {
        container.innerHTML = `<p style="text-align:center; color: #666;">No tienes anuncios aún.</p>`;
        return;
    }
    items.forEach(item => {
        const div = document.createElement('div');
        div.classList.add('anuncio');
        div.dataset.id = item._id;
        
        // Determinar el texto del estado
        let estadoTexto = item.estado || 'pendiente';
        estadoTexto = estadoTexto.charAt(0).toUpperCase() + estadoTexto.slice(1);
        
        div.innerHTML = `
            <div class="categoria"><p class="montserrat-medium">General</p></div>
            <h2 class="montserrat-semibold nombre">${esc(item.name)}</h2>
            <p class="montserrat-medium descripcion parrafo">${esc(item.description)}</p>
            <button class="estado montserrat-semibold ${getEstadoClass(item.estado)}">${estadoTexto}</button>
            ${item.estado === 'pendiente' ? `
                <button class="boton_especifico_peticiones" data-id="${item._id}">
                    <p class="montserrat-medium">Cancelar</p>
                </button>
            ` : ''}
            ${item.estado === 'rechazado' && item.rejectionReason ? `
                <div class="rechazo-razon">
                    <p class="montserrat-small"><strong>Motivo:</strong> ${esc(item.rejectionReason)}</p>
                </div>
            ` : ''}
            <div class="fecha"><p class="montserrat-medium">${formatearFecha(item.fecha)}</p></div>
        `;
        container.appendChild(div);
    });
}

// ---- Cargar mis anuncios desde backend ----
async function cargarMios() {
    if (!contenedorAnuncios) return;
    try {
        const res = await fetch('/anuncios_mios', { credentials: 'include' });
        if (!res.ok) {
            if (res.status === 401) {
                // Usuario no autenticado - mostrar mensaje apropiado
                contenedorAnuncios.innerHTML = `<p style="text-align:center; color: #666;">Inicia sesión para ver tus anuncios.</p>`;
                return;
            }
            throw new Error('Error cargando anuncios');
        }
        const anuncios = await res.json();
        renderMisAnuncios(contenedorAnuncios, anuncios);
    } catch (e) {
        console.warn('Error cargando /anuncios_mios:', e);
        contenedorAnuncios.innerHTML = `<p style="text-align:center; color: #ff6b6b;">Error cargando tus anuncios.</p>`;
    }
}

// ---- Mostrar modal detalle al hacer clic en anuncio (excluye botón cancelar) ----
function activarClicksAnuncios() {
    // Para mis anuncios en peticiones
    contenedorAnuncios?.addEventListener('click', e => {
        const anuncioEl = e.target.closest('.anuncio');
        if (!anuncioEl) return;

        // Ignorar si clic en botón cancelar o estado
        if (e.target.closest('.boton_especifico_peticiones') || e.target.closest('.estado')) return;

        mostrarModalDetalle(anuncioEl);
    });
}

// ---- Mostrar modal con detalles del anuncio ----
function mostrarModalDetalle(anuncioEl) {
    if (!modalDetalle) return;
    
    modalDetalle.style.display = 'block';
    modalTitulo.textContent = anuncioEl.querySelector('.nombre').textContent;
    modalDescripcion.textContent = anuncioEl.querySelector('.descripcion').textContent;
    
    // Actualizar información adicional
    if (modalLugar) modalLugar.textContent = 'Flores, Heredia';
    if (modalAutor) modalAutor.textContent = anuncioEl.querySelector('.estado').textContent;
    if (modalFecha) modalFecha.textContent = anuncioEl.querySelector('.fecha p').textContent;
}

// ---- Cerrar modal detalle ----
function cerrarModalDetalle() {
    if (modalDetalle) {
        modalDetalle.style.display = 'none';
    }
}

// ---- Búsqueda filtrando anuncios por nombre o descripción ----
function activarBusqueda() {
    if (!inputBusqueda) return;
    inputBusqueda.addEventListener('keyup', e => {
        const texto = e.target.value.toLowerCase();
        
        // Buscar en mis anuncios
        $$('#peticiones_todas .anuncio').forEach(anuncio => {
            const nombre = anuncio.querySelector('.nombre').textContent.toLowerCase();
            const descripcion = anuncio.querySelector('.descripcion').textContent.toLowerCase();
            anuncio.style.display = (nombre.includes(texto) || descripcion.includes(texto)) ? 'block' : 'none';
        });
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

// ---- Enviar nuevo anuncio ----
if (form) {
    form.addEventListener('submit', async e => {
        e.preventDefault();

        const file = $('#file')?.files?.[0];
        const name = $('#nombre')?.value.trim();
        const description = $('#anuncio_en_curso')?.value.trim();

        if (!name || !description) {
            alert('Nombre y descripción son obligatorios');
            return;
        }

        // Verificar que el usuario esté autenticado
        const isLoggedIn = await verificarSesion();
        if (!isLoggedIn) {
            alert('Debes iniciar sesión para crear un anuncio');
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

            const res = await fetch('/peticion_anuncio', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, description, image: imageBase64 }),
                credentials: 'include',
            });

            if (!res.ok) {
                if (res.status === 401) {
                    alert('Debes iniciar sesión para crear un anuncio');
                    window.location.href = '/login';
                    return;
                }
                throw new Error('Error enviando anuncio');
            }
            
            const data = await res.json();
            console.log('Anuncio enviado:', data);
            alert('¡Anuncio enviado exitosamente! Estará visible una vez que sea aprobado por un administrador.');

            // Limpiar formulario
            form.reset();
            cerrarFormulario();

            // Recargar anuncios después de enviar
            await cargarMios();
        } catch (error) {
            console.error('Error enviando anuncio:', error);
            alert('No se pudo enviar el anuncio. Intente de nuevo.');
        }
    });
}

// ---- Cancelar/eliminar anuncio ----
document.addEventListener('click', async e => {
    const botonCancelar = e.target.closest('.boton_especifico_peticiones');
    if (!botonCancelar) return;

    e.preventDefault();

    const id = botonCancelar.dataset.id;
    if (!id) return;

    if (!confirm('¿Estás seguro de que quieres cancelar este anuncio?')) {
        return;
    }

    try {
        const res = await fetch('/peticion_anuncio_cancelar', {
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
            throw new Error('Error cancelando anuncio');
        }
        
        const data = await res.json();
        console.log('Anuncio cancelado:', data);
        alert('Anuncio cancelado exitosamente');

        // Remover el anuncio de la vista
        botonCancelar.closest('.anuncio')?.remove();
    } catch (error) {
        console.error('Error cancelando anuncio:', error);
        alert('No se pudo cancelar el anuncio. Intente de nuevo.');
    }
});

// ---- Funciones para abrir/cerrar formulario y modal ----
window.abrirFormulario = async () => { 
    const isLoggedIn = await verificarSesion();
    if (!isLoggedIn) {
        alert('Debes iniciar sesión para crear un anuncio');
        window.location.href = '/login';
        return;
    }
    form.style.display = 'block'; 
};

window.cerrarFormulario = () => { 
    if (form) form.style.display = 'none'; 
};

window.peticionCerrada = () => { 
    cerrarModalDetalle(); 
};

// ---- Inicialización ----
document.addEventListener('DOMContentLoaded', async () => {
    // Cargar mis anuncios si el usuario está autenticado
    const isLoggedIn = await verificarSesion();
    if (isLoggedIn) {
        await cargarMios();
    } else {
        // Si no está autenticado, mostrar mensaje
        if (contenedorAnuncios) {
            contenedorAnuncios.innerHTML = `<p style="text-align:center; color: #666;">Inicia sesión para ver tus anuncios.</p>`;
        }
    }
    
    activarClicksAnuncios();
    activarBusqueda();

    // Cerrar modal con click fuera o ESC
    window.addEventListener('click', e => {
        if (e.target === modalDetalle) cerrarModalDetalle();
    });
    
    window.addEventListener('keydown', e => {
        if (e.key === 'Escape') {
            cerrarModalDetalle();
            if (form && form.style.display === 'block') {
                cerrarFormulario();
            }
        }
    });
});

})();
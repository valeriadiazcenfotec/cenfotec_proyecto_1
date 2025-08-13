// ---- CALENDARIO INTEGRADO ----
let calendar; // Variable global para acceder al calendario

document.addEventListener('DOMContentLoaded', function () {
    const calendarEl = document.getElementById('calendar');
    
    calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        selectable: true,
        locale: 'es',
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay',
        },
        buttonText: {
            today: 'Hoy',
            month: 'Mes',
            week: 'Semana',
            day: 'Día'
        },
        events: [], // Inicialmente vacío, se cargará dinámicamente
        eventColor: '#28a745', // Verde
        eventTextColor: 'white',
        
        // Evento cuando se hace clic en un evento del calendario
        eventClick: function(info) {
            const evento = info.event;
            mostrarModalEventoCalendario(evento);
        },
        
        // Personalizar la apariencia del evento
        eventDidMount: function(info) {
            // Añadir tooltip con información adicional
            info.el.setAttribute('title', `${info.event.title}\n${info.event.extendedProps.description || ''}`);
        }
    });
    
    calendar.render();
    
    // Cargar eventos en el calendario después de renderizar
    cargarEventosEnCalendario();
});

// ---- Cargar eventos en el calendario ----
async function cargarEventosEnCalendario() {
    try {
        const res = await fetch('/eventos_todos');
        if (!res.ok) throw new Error('Error cargando eventos para calendario');
        
        const eventos = await res.json();
        // Filtrar solo eventos aprobados
        const eventosAprobados = eventos.filter(evento => evento.estado === 'aprobado');
        
        // Convertir eventos al formato de FullCalendar
        const eventosCalendario = eventosAprobados.map(evento => ({
            id: evento._id,
            title: evento.name,
            start: evento.date,
            description: evento.description,
            location: evento.place,
            image: evento.image,
            extendedProps: {
                description: evento.description,
                place: evento.place,
                image: evento.image || '/img/evento.jpg'
            }
        }));
        
        // Actualizar eventos en el calendario
        if (calendar) {
            calendar.removeAllEvents();
            calendar.addEventSource(eventosCalendario);
        }
        
    } catch (error) {
        console.error('Error al cargar eventos en calendario:', error);
    }
}

// ---- Mostrar modal para evento del calendario ----
function mostrarModalEventoCalendario(evento) {
    if (!modalDetalle) return;
    
    modalDetalle.style.display = 'block';
    
    // Llenar modal con datos del evento del calendario
    if (modalTitulo) modalTitulo.textContent = evento.title;
    if (modalDescripcion) modalDescripcion.textContent = evento.extendedProps.description || 'Sin descripción';
    if (modalLugar) modalLugar.textContent = evento.extendedProps.place || 'Sin ubicación';
    if (modalAutor) modalAutor.textContent = 'Aprobado';
    if (modalFecha) modalFecha.textContent = formatearFecha(evento.start);
    if (imgCartaDesplegada) imgCartaDesplegada.src = evento.extendedProps.image || '/img/evento.jpg';
}

// ---- Función para actualizar calendario después de cambios ----
async function actualizarCalendario() {
    await cargarEventosEnCalendario();
}

// ---- MODIFICACIÓN DEL CÓDIGO ORIGINAL ----

// Modificar la función cargarEventosTotales para también actualizar el calendario
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
        
        // Actualizar calendario también
        if (calendar) {
            await cargarEventosEnCalendario();
        }
    } catch (error) {
        console.error('Error al cargar eventos totales:', error);
        contenedorEventos.innerHTML = '<p style="padding:1rem;color:#c00;">Error al cargar eventos.</p>';
    }
}

// Modificar el envío de formulario para actualizar el calendario
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

            // Recargar eventos y calendario después de enviar
            await cargarMisEventos();
            await cargarEventosTotales(); // Esto también actualizará el calendario
        } catch (error) {
            console.error('Error enviando evento:', error);
            alert('No se pudo enviar el evento. Intente de nuevo.');
        }
    });
}
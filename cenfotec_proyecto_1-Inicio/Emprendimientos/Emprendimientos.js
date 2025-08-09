
document.querySelectorAll('.visualize').forEach(button => {
    button.addEventListener('click', function () {
        const emprendimientoId = this.getAttribute('data-id');
        window.location.href = `pagina-generica.html?id=${emprendimientoId}`;
    });
});

document.addEventListener('DOMContentLoaded', function () {
    const urlParams = new URLSearchParams(window.location.search);
    const emprendimientoId = urlParams.get('id');
    cargarEmprendimiento(emprendimientoId);
});

function cargarEmprendimiento(id) {
    // Simulación de datos (en un caso real, esto vendría de una API o base de datos)
    const emprendimientos = {
        1: {
            titulo: "Título del Emprendimiento 1",
            descripcion: "Descripción detallada del Emprendimiento 1...",
            imagen: "imagen1.jpg"
        },
        2: {
            titulo: "Título del Emprendimiento 2",
            descripcion: "Descripción detallada del Emprendimiento 2...",
            imagen: "imagen2.jpg"
        }
    };

    const emprendimiento = emprendimientos[id];
    const contenedor = document.getElementById('contenido-emprendimiento');

    if (emprendimiento) {
        contenedor.innerHTML = `
            <h1>${emprendimiento.titulo}</h1>
            <img src="${emprendimiento.imagen}" alt="${emprendimiento.titulo}">
            <p>${emprendimiento.descripcion}</p>
        `;
    } else {
        contenedor.innerHTML = "<p>Emprendimiento no encontrado.</p>";
    }
}
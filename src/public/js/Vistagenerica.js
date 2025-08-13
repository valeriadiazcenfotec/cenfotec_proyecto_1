document.addEventListener("DOMContentLoaded", () => {
    const formulario = document.getElementById("nuevoEmprendimiento");

    const campos = {
        nombre: {
            element: document.getElementById("nombre"),
            validar: valor => valor.trim() !== "",
            mensaje: "El nombre es obligatorio."
        },
        descripcion: {
            element: document.getElementById("descripcion"),
            validar: valor => valor.trim() !== "" && valor.length <= 350,
            mensaje: "La descripción es obligatoria y debe tener máximo 350 caracteres."
        },
        categoria: {
            element: document.getElementById("categoria"),
            validar: valor => valor.trim() !== "",
            mensaje: "Debe seleccionar una categoría."
        },
        imagenNegocio: {
            element: document.getElementById("imagenNegocio"),
            validar: () => campos.imagenNegocio.element.files.length > 0,
            mensaje: "Debe subir una imagen del negocio."
        },
        imagenesProductos: {
            element: document.getElementById("imagenesProductos"),
            validar: () => campos.imagenesProductos.element.files.length > 0,
            mensaje: "Debe subir al menos una imagen de productos."
        }
    };

    // Crear elementos de error debajo de cada campo
    Object.values(campos).forEach(({ element }) => {
        const error = document.createElement("span");
        error.classList.add("mensaje-error");
        error.style.color = "red";
        error.style.fontSize = "0.9rem";
        error.style.display = "none";
        element.insertAdjacentElement("afterend", error);
        element.dataset.errorElementId = error;
    });

    // Validación individual al salir del campo
    Object.entries(campos).forEach(([key, { element, validar, mensaje }]) => {
        element.addEventListener("blur", () => {
            const esValido = validar(element.value);
            mostrarError(element, esValido ? "" : mensaje);
        });

        if (key === "descripcion") {
            // Limita a 350 caracteres
            element.addEventListener("input", () => {
                if (element.value.length > 350) {
                    element.value = element.value.slice(0, 350);
                }
            });
        }
    });

    // Mostrar mensaje de error debajo del campo
    function mostrarError(input, mensaje) {
        const errorElement = input.dataset.errorElementId;
        const span = input.nextElementSibling;
        if (mensaje) {
            span.textContent = mensaje;
            span.style.display = "block";
        } else {
            span.textContent = "";
            span.style.display = "none";
        }
    }

    // Validación al enviar el formulario
    formulario.addEventListener("submit", function (e) {
        let valido = true;

        Object.entries(campos).forEach(([key, { element, validar, mensaje }]) => {
            const esValido = validar(key === "imagenNegocio" || key === "imagenesProductos" ? null : element.value);
            mostrarError(element, esValido ? "" : mensaje);
            if (!esValido) valido = false;
        });

        if (!valido) {
            e.preventDefault(); // Detener envío si hay errores
        } else {
            alert("El emprendimiento esta en espera de ser aprobado");
        }
    });
});
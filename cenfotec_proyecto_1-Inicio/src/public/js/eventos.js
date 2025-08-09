    function abrirFormulario() {
        document.getElementById("carta_muestra").style.display = "block";
        let subtitulo = document.querySelector(".peticion");
        let subtitulo2 = document.querySelector(".peticion2");
        let img_carta_desplegada = document.querySelector(".img_carta_desplegada")

        document.querySelectorAll('.carta').forEach(function(carta) {
            carta.addEventListener('click', function () {
            const nombre = carta.querySelector(".nombre").textContent;
            const parrafo = carta.querySelector(".parrafo").textContent;
            const imagen_src = carta.querySelector(".img_carta").getAttribute("src");

            subtitulo.textContent = nombre;
            subtitulo2.textContent = parrafo;
            img_carta_desplegada.setAttribute("src",imagen_src)
            });
        });
    }

    function cerrarFormulario() {
        document.getElementById("carta_muestra").style.display = "none";
    }
    
    document.querySelectorAll('.carta').forEach(function(carta) {
        const sinLike = carta.querySelector('.sin_like');
        const conLike = carta.querySelector('.con_like');

        sinLike.addEventListener('click', function () {
            sinLike.style.visibility = 'hidden';
            conLike.style.visibility = 'visible';
        });

        conLike.addEventListener('click', function () {
            conLike.style.visibility = 'hidden';
            sinLike.style.visibility = 'visible';
        });
    });

    function peticionAbierta() {
        document.getElementById("form").style.display = "block";
    }
    function peticionCerrada() {
        document.getElementById("form").style.display = "none";
    }



function toBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = (error) => reject(error);
    });
}



document.getElementById('form').addEventListener('submit', async function (e) {
    e.preventDefault();
    const file = document.getElementById('file').files[0];
    const name = document.getElementById('nombre').value;
    const place = document.getElementById('lugar').value;
    const date = document.getElementById('date').value;

    const description = document.getElementById('anuncio_en_curso').value;
    console.log("esto es descripcion:", description)

    if (file) {
        const base64String = await toBase64(file);

        fetch('/peticion_evento', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: name,
                place: place,
                date: date,
                description: description,
                image: base64String
            })
        })
        .then(res => res.json())
        .then(data => {
            console.log('Server response:', data);
        })
        .catch(err => {
            console.error('Upload error:', err);
        });
    }
});


async function cargarEventos() {
    try {
        const res = await fetch('/eventos_todos');
        const eventos = await res.json();
        console.log('Eventos recibidos:', eventos);
        console.log('Cantidad eventos:', eventos.length);

        const peticiones_todas = document.getElementById('peticiones_todas');
        peticiones_todas.innerHTML = ''; 
        eventos.forEach(evento => {
            console.log("hpla")
            const div = document.createElement('div');
            div.classList.add('peticion_una');
            div.innerHTML = `
                <h3 class="montserrat-semibold">${evento.name}</h3>
                <button class="boton_especifico_peticiones"  data-id="${evento._id}"><p class="montserrat-medium">Cancelar</p></button>
            `;

            peticiones_todas.appendChild(div);
        });
    } catch (error) {
        console.error('Error al cargar eventos:', error);
    }
}

window.addEventListener('DOMContentLoaded', cargarEventos);
document.addEventListener('click', async function (e) {
    const boton = e.target.closest('.boton_especifico_peticiones');
    if (boton) {
        console.log("click en botón cancelar");
        e.preventDefault();

        const id = boton.getAttribute('data-id');

        const res = await fetch('/peticion_evento_cancelar', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ _id: id })
        });

        const data = await res.json();
        console.log('Eliminado:', data);

        boton.closest('.peticion_una')?.remove();
    }
});

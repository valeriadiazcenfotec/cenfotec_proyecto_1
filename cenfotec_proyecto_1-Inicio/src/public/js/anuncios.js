    function abrirFormulario() {
        document.getElementById("form").style.display = "block";
    }

    function cerrarFormulario() {
        document.getElementById("form").style.display = "none";
    }

        document.querySelectorAll('.anuncio').forEach(function(anuncio) {
            anuncio.addEventListener('click', function () {
            document.getElementById("carta_muestra").style.display = "block";
            let subtitulo = document.querySelector(".peticion");
            let subtitulo2 = document.querySelector(".peticion2");
            const nombre = anuncio.querySelector(".nombre").textContent;
            const parrafo = anuncio.querySelector(".descripcion").textContent;

            subtitulo.textContent = nombre;
            subtitulo2.textContent = parrafo;
            });
        });
    
        function peticionCerrada() {
        document.getElementById("carta_muestra").style.display = "none";
    }

    busca = document.getElementById("busca")
    busca.addEventListener("keyup", e =>{
        document.querySelectorAll(".anuncio").forEach(anuncio =>{
            anuncio.textContent.toLowerCase().includes(e.target.value.toLowerCase())
                ?anuncio.style.display = "block"
                : anuncio.style.display = "none"

        })
    })

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
    const description = document.getElementById('anuncio_en_curso').value;
    console.log("esto es descripcion:", description)

    if (file) {
        const base64String = await toBase64(file);

        fetch('/peticion_anuncio', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: name,
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


async function cargarAnuncios() {
    try {
        const res = await fetch('/anuncios');
        const anuncios = await res.json();
        console.log('Anuncios recibidos:', anuncios);
        console.log('Cantidad anuncios:', anuncios.length);

        const peticiones_todas = document.getElementById('peticiones_todas');
        peticiones_todas.innerHTML = ''; 

        anuncios.forEach(anuncio => {
            console.log("hpla")
            const div = document.createElement('div');
            div.classList.add('peticion_una');
            div.innerHTML = `
                <h3 class="montserrat-semibold">${anuncio.name}</h3>
                <button class="boton_especifico_peticiones"  data-id="${anuncio._id}"><p class="montserrat-medium">Cancelar</p></button>
            `;

            peticiones_todas.appendChild(div);
        });
    } catch (error) {
        console.error('Error al cargar anuncios:', error);
    }
}

window.addEventListener('DOMContentLoaded', cargarAnuncios);
document.addEventListener('click', async function (e) {
    const boton = e.target.closest('.boton_especifico_peticiones');
    if (boton) {
        console.log("click en botón cancelar");
        e.preventDefault();

        const id = boton.getAttribute('data-id');

        const res = await fetch('/peticion_anuncio_cancelar', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ _id: id })
        });

        const data = await res.json();
        console.log('Eliminado:', data);

        boton.closest('.peticion_una')?.remove();
    }
});
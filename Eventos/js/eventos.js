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
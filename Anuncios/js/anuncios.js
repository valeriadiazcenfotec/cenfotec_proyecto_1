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
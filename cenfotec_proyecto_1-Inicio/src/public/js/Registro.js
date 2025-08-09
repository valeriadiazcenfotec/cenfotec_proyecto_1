document.addEventListener("DOMContentLoaded", () => {
  const formulario = document.querySelector("#form-registro");

  const campos = {
    nombre: document.getElementById("nombre"),
    telefono: document.getElementById("telefono"),
    usuario: document.getElementById("usuario"),
    correo: document.getElementById("correo"),
    contrasena: document.getElementById("contrasena"),
    confirmar: document.getElementById("confirmar-contrasena"),
  };

  const mensajesError = {
    nombre: document.getElementById("error-nombre"),
    telefono: document.getElementById("error-telefono"),
    usuario: document.getElementById("error-usuario"),
    correo: document.getElementById("error-correo"),
    contrasena: document.getElementById("error-contrasena"),
    confirmar: document.getElementById("error-confirmar"),
  };

  formulario.addEventListener("submit", (e) => {
    e.preventDefault();
    let valido = true;

    // Validar nombre
    if (!/^[A-Za-zÁÉÍÓÚáéíóúñÑ ]+$/.test(campos.nombre.value.trim())) {
      mostrarError(campos.nombre, mensajesError.nombre, "Solo letras y espacios.");
      valido = false;
    } else {
      limpiarError(campos.nombre, mensajesError.nombre);
    }

    // Validar teléfono
    if (!/^\d{8}$/.test(campos.telefono.value.trim())) {
      mostrarError(campos.telefono, mensajesError.telefono, "Debe tener 8 dígitos.");
      valido = false;
    } else {
      limpiarError(campos.telefono, mensajesError.telefono);
    }

    // Validar usuario
    if (!/^[a-zA-Z0-9_]{4,20}$/.test(campos.usuario.value.trim())) {
      mostrarError(campos.usuario, mensajesError.usuario, "Usuario inválido (4–20 caracteres, solo letras, números o _).");
      valido = false;
    } else {
      limpiarError(campos.usuario, mensajesError.usuario);
    }

    // Validar correo
    if (!/^[\w.-]+@(gmail|hotmail|yahoo)\.com$/.test(campos.correo.value.trim())) {
      mostrarError(campos.correo, mensajesError.correo, "Correo no válido (gmail, hotmail o yahoo).");
      valido = false;
    } else {
      limpiarError(campos.correo, mensajesError.correo);
    }

    // Validar contraseña
    if (!/^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,30}$/.test(campos.contrasena.value.trim())) {
      mostrarError(campos.contrasena, mensajesError.contrasena, "Mínimo 8 caracteres, 1 mayúscula, 1 número y 1 símbolo.");
      valido = false;
    } else {
      limpiarError(campos.contrasena, mensajesError.contrasena);
    }

    // Confirmar contraseña
    if (campos.contrasena.value.trim() !== campos.confirmar.value.trim()) {
      mostrarError(campos.confirmar, mensajesError.confirmar, "Las contraseñas no coinciden.");
      valido = false;
    } else {
      limpiarError(campos.confirmar, mensajesError.confirmar);
    }

    // Si todo es válido
    if (valido) {
      alert("Registro exitoso supeustamende verdad ");
      formulario.reset();

      // Limpiar estilos
      Object.values(campos).forEach(input => {
        input.classList.remove("validado", "invalido");
      });

    }
  });

  function mostrarError(input, contenedor, mensaje) {
    if (!input || !contenedor) return;
    input.classList.add("invalido");
    input.classList.remove("validado");
    contenedor.textContent = mensaje;
  }

  function limpiarError(input, contenedor) {
    if (!input || !contenedor) return;
    input.classList.remove("invalido");
    input.classList.add("validado");
    contenedor.textContent = "";
  }
});


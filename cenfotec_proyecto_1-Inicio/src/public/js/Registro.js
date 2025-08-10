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
    let valido = true;

    Object.values(mensajesError).forEach(el => el && (el.textContent = ""));
    Object.values(campos).forEach(input => input && input.classList.remove("invalido", "validado"));

    // Validar nombre
    if (!/^[A-Za-zÁÉÍÓÚáéíóúñÑ ]+$/.test(campos.nombre.value.trim())) {
      mostrarError(campos.nombre, mensajesError.nombre, "Solo letras y espacios.");
      valido = false;
    } else {
      marcarOk(campos.nombre, mensajesError.nombre);
    }

    // Validar teléfono (8 dígitos CR)
    if (!/^\d{8}$/.test(campos.telefono.value.trim())) {
      mostrarError(campos.telefono, mensajesError.telefono, "Debe tener 8 dígitos.");
      valido = false;
    } else {
      marcarOk(campos.telefono, mensajesError.telefono);
    }

    // Validar usuario
    if (!/^[a-zA-Z0-9_]{4,20}$/.test(campos.usuario.value.trim())) {
      mostrarError(campos.usuario, mensajesError.usuario, "Usuario inválido (4–20 caracteres, solo letras, números o _).");
      valido = false;
    } else {
      marcarOk(campos.usuario, mensajesError.usuario);
    }

    // Validar correo (actual: solo gmail/hotmail/yahoo)
    if (!/^[\w.-]+@(gmail|hotmail|yahoo)\.com$/.test(campos.correo.value.trim())) {
      mostrarError(campos.correo, mensajesError.correo, "Correo no válido (gmail, hotmail o yahoo).");
      valido = false;
    } else {
      marcarOk(campos.correo, mensajesError.correo);
    }

    // Validar contraseña
    if (!/^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,30}$/.test(campos.contrasena.value.trim())) {
      mostrarError(campos.contrasena, mensajesError.contrasena, "Mínimo 8 caracteres, 1 mayúscula, 1 número y 1 símbolo.");
      valido = false;
    } else {
      marcarOk(campos.contrasena, mensajesError.contrasena);
    }

    // Confirmar contraseña
    if (campos.contrasena.value.trim() !== campos.confirmar.value.trim()) {
      mostrarError(campos.confirmar, mensajesError.confirmar, "Las contraseñas no coinciden.");
      valido = false;
    } else {
      marcarOk(campos.confirmar, mensajesError.confirmar);
    }

    if (!valido) {
      e.preventDefault();
      return;
    }

    // Todo OK -> enviamos el formulario al backend

    const btn = formulario.querySelector('button[type="submit"]');
    if (btn) { btn.disabled = true; btn.textContent = 'Enviando...'; }

  });

  function mostrarError(input, contenedor, mensaje) {
    if (!input || !contenedor) return;
    input.classList.add("invalido");
    contenedor.textContent = mensaje;
  }

  function marcarOk(input, contenedor) {
    if (!input || !contenedor) return;
    input.classList.add("validado");
    contenedor.textContent = "";
  }
});

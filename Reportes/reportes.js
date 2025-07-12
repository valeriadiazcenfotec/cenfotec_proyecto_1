const formulario = document.querySelector('#formulario form');
const checkbox = document.getElementById('lineamientos');

// Crear mensaje de error
if (!document.getElementById('error-lineamientos')) {
  const error = document.createElement('p');
  error.id = 'error-lineamientos';
  error.innerHTML = `<i class='bx bxs-error-circle'></i> Debe leer y aceptar los lineamientos para enviar su reporte.`;
  error.classList.add('mensaje-error');
  error.style.display = 'none';
  checkbox.parentElement.appendChild(error);
}

// Crear mensaje de éxito
if (!document.getElementById('mensaje-exito')) {
  const exito = document.createElement('p');
  exito.id = 'mensaje-exito';
  exito.innerHTML = `<i class='bx bxs-check-circle'></i> Reporte enviado con éxito. Un administrador lo revisará pronto`;
  exito.classList.add('mensaje-exito');
  exito.style.display = 'none';
  formulario.appendChild(exito);
}

// Validar al enviar
formulario.addEventListener('submit', (e) => {
  e.preventDefault();

  const error = document.getElementById('error-lineamientos');
  const exito = document.getElementById('mensaje-exito');

  if (checkbox.checked) {
    checkbox.classList.remove('checkbox-invalido');
    error.style.display = 'none';
    exito.style.display = 'flex';

    setTimeout(() => {
      formulario.reset();
      exito.style.display = 'none';
    }, 3000);
  } else {
    checkbox.classList.add('checkbox-invalido');
    error.style.display = 'flex';
    exito.style.display = 'none';
  }
});

// Lógica para pestañas
document.querySelectorAll('.btn-pestana').forEach(boton => {
  boton.addEventListener('click', () => {
    const destino = boton.dataset.tab;
    document.querySelectorAll('.btn-pestana').forEach(b => b.classList.remove('activa'));
    document.querySelectorAll('.contenido-pestana').forEach(p => p.classList.remove('activa'));
    boton.classList.add('activa');
    document.getElementById(destino).classList.add('activa');
  });
});

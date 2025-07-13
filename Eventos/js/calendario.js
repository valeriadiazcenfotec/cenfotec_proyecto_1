  document.addEventListener('DOMContentLoaded', function () {
      const calendarEl = document.getElementById('calendar');
      const calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        selectable: true,
        locale: 'es',
          headerToolbar: {
            left: 'prev,next',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay' ,
          },
            buttonText: {
            today: 'Hoy',
            month: 'Mes',
            week: 'Semana',
            day: 'Día'
          },
        events: [
          { title: 'Evento 1', start: '2025-07-03' },
          { title: 'Evento 2', start: '2025-07-05' }
        ],
        color: 'green',   
        textColor: 'black'
      });
      calendar.render();
    });
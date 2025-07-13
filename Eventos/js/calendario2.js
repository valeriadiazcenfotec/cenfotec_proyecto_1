 const months = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    const days = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
    const today = new Date();
    const title = document.getElementById("title");
    let visibleMonth = today.getMonth();
    let visibleYear = today.getFullYear();

    const events = [
    { title: "Evento 1", date: new Date(visibleYear, visibleMonth, today.getDate(), 10) },
    { title: "Evento 2", date: new Date(visibleYear, visibleMonth, today.getDate() + 2, 14) },
    ];

    function switchView(view) {
    document.getElementById("monthlyView").style.display = view === "month" ? "block" : "none";
    document.getElementById("weeklyView").style.display = view === "week" ? "block" : "none";
    document.getElementById("btnMonth").classList.toggle("active", view === "month");
    document.getElementById("btnWeek").classList.toggle("active", view === "week");
    }

    function changeMonth(offset) {
    visibleMonth += offset;
    if (visibleMonth > 11) {
        visibleMonth = 0;
        visibleYear++;
    } else if (visibleMonth < 0) {
        visibleMonth = 11;
        visibleYear--;
    }
    renderMonth();
    }

    function renderMonth() {
    const monthDays = document.getElementById("monthDays");
    const monthNames = document.getElementById("monthNames");
    monthDays.innerHTML = "";
    monthNames.innerHTML = "";
    title.textContent = `${months[visibleMonth]} ${visibleYear}`;

    days.forEach(d => {
        const div = document.createElement("div");
        div.classList.add("day-name");
        div.textContent = d;
        monthNames.appendChild(div);
    });

    const firstDay = new Date(visibleYear, visibleMonth, 1).getDay();
    const daysInMonth = new Date(visibleYear, visibleMonth + 1, 0).getDate();

    for (let i = 0; i < firstDay; i++) {
        monthDays.innerHTML += `<div></div>`;
    }

    for (let d = 1; d <= daysInMonth; d++) {
        const cell = document.createElement("div");
        cell.className = "day-box";
        const date = new Date(visibleYear, visibleMonth, d);

        if (date.toDateString() === new Date().toDateString()) {
        cell.classList.add("today");
        }

        events.forEach(ev => {
        if (ev.date.getDate() === d &&
            ev.date.getMonth() === visibleMonth &&
            ev.date.getFullYear() === visibleYear) {
            const evDiv = document.createElement("div");
            evDiv.className = "event";
            evDiv.textContent = ev.title;
            cell.appendChild(evDiv);
        }
        });

        cell.textContent = d;
        cell.onclick = () => {
        document.querySelectorAll('.day-box').forEach(box => box.classList.remove('selected'));
        cell.classList.add('selected');
        };

        monthDays.appendChild(cell);
    }
    }

    function renderWeek() {
    const weekHeader = document.getElementById("weekHeader");
    const weekGrid = document.getElementById("weekGrid");
    weekHeader.innerHTML = "";
    weekGrid.innerHTML = "";
    const startHour = 9, endHour = 18;

    const startDate = new Date(today);
    startDate.setDate(today.getDate() - today.getDay());

    weekHeader.appendChild(document.createElement("div"));
    for (let i = 0; i < 7; i++) {
        const d = new Date(startDate);
        d.setDate(startDate.getDate() + i);
        const div = document.createElement("div");
        div.textContent = `${days[i]} ${d.getDate()}/${d.getMonth() + 1}`;
        weekHeader.appendChild(div);
    }

    for (let h = startHour; h <= endHour; h++) {
        const hourLabel = document.createElement("div");
        hourLabel.className = "hour-label";
        hourLabel.textContent = `${h}:00`;
        weekGrid.appendChild(hourLabel);

        for (let d = 0; d < 7; d++) {
        const cell = document.createElement("div");
        cell.className = "week-cell";
        cell.onclick = () => {
            document.querySelectorAll('.week-cell').forEach(box => box.classList.remove('selected'));
            cell.classList.add('selected');
        };

        const cellDate = new Date(startDate);
        cellDate.setDate(cellDate.getDate() + d);
        cellDate.setHours(h, 0, 0, 0);

        events.forEach(ev => {
            if (ev.date.toDateString() === cellDate.toDateString() && ev.date.getHours() === h) {
            const evDiv = document.createElement("div");
            evDiv.className = "week-event";
            evDiv.textContent = ev.title;
            cell.appendChild(evDiv);
            }
        });

        weekGrid.appendChild(cell);
        }
    }
    }

    renderMonth();
    renderWeek();
    switchView("month");
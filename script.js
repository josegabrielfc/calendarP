// Suponiendo que tienes un objeto JavaScript con la información del JSON
var datosJSON = {
    "horarios": [
        {
            "materia_id": "1155523",
            "grupo_id": "A",
            "dia": "MARTES",
            "nombre": "Analitica de Datos",
            "hora_inicio": "06:00:00",
            "hora_fin": "08:00:00",
            "salon": "SB401",
            "fecha": "12/12/2023",
            "semestre": "3"
        },
        {
            "materia_id": "1155523",
            "grupo_id": "B",
            "dia": "MARTES",
            "nombre": "Analitica de Datos",
            "hora_inicio": "08:00:00",
            "hora_fin": "10:00:00",
            "salon": "SB401",
            "fecha": "12/12/2023",
            "semestre": "5"
        },
        {
            "materia_id": "1155101",
            "grupo_id": "A",
            "dia": "JUEVES",
            "nombre": "Calculo Diferencial",
            "hora_inicio": "08:00:00",
            "hora_fin": "10:00:00",
            "salon": "SA201",
            "fecha": "14/12/2023",
            "semestre": "1"
        }
    ]
};

// Organiza los horarios por semestre
var horariosPorSemestre = {};

datosJSON.horarios.forEach(function (horario) {
    var semestre = horario.semestre;
    if (!horariosPorSemestre[semestre]) {
        horariosPorSemestre[semestre] = [];
    }
    horariosPorSemestre[semestre].push(horario);
});

// Obtén la referencia al contenedor de tablas
var tablasContainer = document.getElementById("tablasContainer");

// Crea dinámicamente las tablas por semestre
Object.keys(horariosPorSemestre).forEach(function (semestre) {
    // Crea la tabla y su encabezado
    var tabla = document.createElement("table");
    tabla.classList.add("table", "table-striped");

    var thead = document.createElement("thead");
    var tr = document.createElement("tr");
    var th = document.createElement("th");
    th.colSpan = 4;
    th.classList.add("centered");
    th.textContent = "SEMESTRE " + semestre;

    tr.appendChild(th);
    thead.appendChild(tr);
    tabla.appendChild(thead);

    // Cuerpo de la tabla
    var tbody = document.createElement("tbody");

    // Recorre los horarios del semestre y agrega filas a la tabla
    horariosPorSemestre[semestre].forEach(function (horario) {
        var fila = document.createElement("tr");

        // Crea las celdas y asigna los valores
        var celdaMateriaGrupo = document.createElement("td");
        celdaMateriaGrupo.textContent = horario.materia_id + "-" + horario.grupo_id;
        fila.appendChild(celdaMateriaGrupo);

        var celdaNombre = document.createElement("td");
        celdaNombre.textContent = horario.nombre;
        fila.appendChild(celdaNombre);

        var celdaFecha = document.createElement("td");
        celdaFecha.textContent = horario.fecha;
        fila.appendChild(celdaFecha);

        var celdaHorarioSalon = document.createElement("td");
        celdaHorarioSalon.textContent = horario.hora_inicio + "-" + horario.hora_fin + " " + horario.salon;
        fila.appendChild(celdaHorarioSalon);

        // Agrega la fila al cuerpo de la tabla
        tbody.appendChild(fila);
    });

    // Agrega el cuerpo de la tabla y luego la tabla al contenedor
    tabla.appendChild(tbody);
    tablasContainer.appendChild(tabla);
});
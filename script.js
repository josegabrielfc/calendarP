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
            "semestre": "5"
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
            "materia_id": "1155523",
            "grupo_id": "C",
            "dia": "JUEVES",
            "nombre": "Analitica de Datos",
            "hora_inicio": "08:00:00",
            "hora_fin": "10:00:00",
            "salon": "SB401",
            "fecha": "14/12/2023",
            "semestre": "1"
        }
    ]
};

// Obtén la referencia a la tabla y la celda del semestre en el thead
var tabla = document.getElementById("tablaHorarios");
var semestreHeader = document.getElementById("semestreHeader");

// Configura el valor de la celda del semestre en el thead
semestreHeader.textContent = "SEMESTRE " + datosJSON.horarios[0].semestre;

// Recorre los horarios y agrega filas a la tabla
datosJSON.horarios.forEach(function (horario) {
    var fila = document.createElement("tr");

    // Agrega la fila a la tabla
    tabla.appendChild(fila);

    // Crea la celda para los demás datos y asigna los valores
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
});
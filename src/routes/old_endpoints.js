const { Router } = require("express");
const router = Router();

router.get("/t", (req, res) => {
  const filePath = path.join(__dirname, "..", "views", "home.html");
  res.sendFile(filePath);
});

router.get("/form", (req, res) => {
  const filePath = path.join(__dirname, "..", "views", "formulario.html");
  res.sendFile(filePath);
});

router.post("/registerX", (req, res) => {
  const { name, email, password } = req.body;

  res.send(`Datos recibidos: Nombre: ${name}, Correo: ${email}, ${password}`);
});

/*
router.put("/horario/:materiaId/:grupoId/:horarioId", async (req, res) => {
  try {
    const { materiaId, grupoId, horarioId } = req.params;
    const { dia, hora_inicio, hora_fin } = req.body;

    // Verificar que el horario seleccionado pertenezca a la materia y grupo especificados
    const checkQuery = `
      SELECT id
      FROM Horario
      WHERE id = ? AND materia_id = ? AND grupo_id = ?;
    `;

    const [checkResult] = await pool.query(checkQuery, [horarioId, materiaId, grupoId]);

    if (checkResult.length === 0) {
      return res.status(400).json({ error: "El horario seleccionado no pertenece a la materia y grupo especificados." });
    }

    // Realizar la actualización en la tabla Seleccionar
    const updateQuery = `
      UPDATE Seleccionar
      SET horario_id = ?, dia = ?, hora_inicio = ?, hora_fin = ?
      WHERE horario_id = ? AND materia_id = ? AND grupo_id = ?;
    `;

    await pool.query(updateQuery, [horarioId, dia, hora_inicio, hora_fin, materiaId, grupoId, horarioId]);

    res.json({ success: true, message: "Información actualizada correctamente." });
  } catch (error) {
    console.error("Error al actualizar la información:", error);
    res.status(500).send("Error interno del servidor.");
  }
});*/

/*router.post("/select", async (req, res) => {
  try {
    const { horarioId, materiaId, grupoId } = req.body;

    // Realizar el cálculo de las horas antes de la consulta
    /*const query = `
      SELECT dia, hora_inicio, hora_fin
      FROM Horario
      WHERE horario_id = ? AND materia_id = ? AND grupo_id = ? AND  >= 2;
    `;

    const [horarioDisponible] = await pool.query(query, [horarioId, materiaId, grupoId]);

    // Verificar si el horario está disponible
    if (!horarioDisponible || horarioDisponible.length === 0) {
      res.status(404).send("El horario seleccionado no está disponible para la materia y grupo específicos.");
      return;
    }

    const horario = horarioDisponible[0];
    const { dia, hora_inicio: horaInicio, hora_fin: horaFin } = horario;

    // Insertar la selección en la tabla "Seleccionar"
    const insertSeleccionQuery = `
      INSERT INTO Seleccionar (horario_id, materia_id, grupo_id, dia, hora_inicio, hora_fin)
      VALUES (?, ?, ?, ?, ?, ?);
    `;

    const [seleccion] = await pool.query(insertSeleccionQuery, [
      horarioId,
      materiaId,
      grupoId,
      dia,
      horaInicio,
      horaFin,
    ]);

    res.json({ horarioDisponible, seleccion });
  } catch (error) {
    console.error("Error al seleccionar y guardar el horario:", error);
    res.status(500).send("Error interno del servidor.");
  }
});*/

router.delete(
  "/delete-select-horario/:materiaId/:grupoId",
  async (req, res) => {
    try {
      const { materiaId, grupoId } = req.params;

      const getHorarioIdQuery =
        "SELECT horario_id FROM Seleccionar WHERE materia_id = ? AND grupo_id = ?";
      const [result] = await pool.query(getHorarioIdQuery, [
        materiaId,
        grupoId,
      ]);

      if (result.length === 0) {
        res
          .status(404)
          .send(
            "No se encontró ninguna selección de horario para la materia proporcionada."
          );
        return;
      }

      const deleteSeleccionQuery =
        "DELETE FROM Seleccionar WHERE materia_id = ? AND grupo_id = ?";
      await pool.query(deleteSeleccionQuery, [materiaId, grupoId]);

      res
        .status(200)
        .send(
          "Horario de la materia " +
            materiaId +
            ", grupo " +
            grupoId +
            " eliminado correctamente."
        );
    } catch (error) {
      console.error("Error al eliminar el horario:", error);
      res.status(500).send("Error interno del servidor.");
    }
  }
);

//De acuerdo a las fecha de Inicio de Previo y Fecha de Fin (Siempre debe haber un rango de 2 semanas)
//El endpoint ya genera los horarios distribuidos en las 2 semanas, pero sin considerar las fechas de inicio y fin
router.get("/horarios-semanas", async (req, res) => {
  try {
    const days = ["LUNES", "MARTES", "MIERCOLES", "JUEVES", "VIERNES"];
    const horariosPrimeraSemana = [];
    const horariosSegundaSemana = [];

    for (const day of days) {
      const query = "SELECT * FROM calendar.seleccionar WHERE dia = ?";
      const [selecciones] = await pool.query(query, [day]);

      const mitad = Math.ceil(selecciones.length / 2);
      horariosPrimeraSemana.push(...selecciones.slice(0, mitad));
      horariosSegundaSemana.push(...selecciones.slice(mitad));
    }

    //console.log(horariosPrimeraSemana.length);
    //console.log(horariosSegundaSemana.length);
    res.json({ horariosPrimeraSemana, horariosSegundaSemana });
  } catch (error) {
    console.error("Error al obtener los horarios entre semanas:", error);
    res.status(500).send("Error interno del servidor.");
  }
});

router.get("/horario-dia/:dia", async (req, res) => {
  try {
    const day = req.params.dia;
    const query = "SELECT * FROM calendar.seleccionar WHERE dia = ?";
    const [selecciones] = await pool.query(query, [day]);
    res.json({ selecciones });
  } catch (error) {
    console.error("Error al obtener la lista del dia " + day + " :", error);
    res.status(500).send("Error interno del servidor.");
  }
});

router.post("/selecct-week/:horarioId", async (req, res) => {
  try {
    const x = null;
  } catch (error) {}
});

router.post("/horarios-por-fechas", async (req, res) => {
  try {
    const { fechaInicio } = req.body;

    const { diaInicioT, diaFinT, fechaFin, fechasYDias } = calcularFechaFin(
      moment(fechaInicio, "DD/MM/YYYY")
    );

    const days = ["LUNES", "MARTES", "MIERCOLES", "JUEVES", "VIERNES"];
    const horariosPrimeraSemana = [];
    const horariosSegundaSemana = [];
    const horariosTercerSemana = [];
    const result = {};

    for (const { fecha, dia } of fechasYDias) {
      const query = "SELECT * FROM Seleccionar WHERE dia = ?";
      const [selecciones] = await pool.query(query, [dia]);

      // Agregar las selecciones al resultado
      const key = `${dia}-${fecha}`;
      result[key] = selecciones.map((horario) => ({ ...horario, fecha }));
    }

    res.json({ horariosPorFecha: result });
  } catch (error) {
    console.error("Error al obtener los horarios por fechas:", error);
    res.status(500).send("Error interno del servidor.");
  }
});

router.post("/rangofechas", (req, res) => {
  try {
    // Ejemplo de uso ->  const fechaInicio = '29/04/2024'; //Mejor valor para prueba
    const { fechaInicio } = req.body;
    const resultado = calcularFechaFin(fechaInicio);
    console.log(
      `Fecha de inicio: ${resultado.fechaInicio} (${resultado.diaInicioT})`
    );
    console.log(
      `Fecha de finalización: ${resultado.fechaFin} (${resultado.diaFinT})`
    );

    console.log("\nFechas y Días Iterados:");
    resultado.fechasYDias.forEach(({ fecha, dia }) => {
      console.log(`${fecha} - ${dia}`);
    });

    res.json({ horariosPorFecha: resultado.fechasYDias });
  } catch (error) {
    console.error("Error al obtener los horarios por fechas:", error);
    res.status(500).send("Error interno del servidor.");
  }
});

router.post("/fechas", (req, res) => {
  try {
    const { fechaInicio } = req.body;
    const resultado = calcularFechaFin(fechaInicio);
    console.log(
      `Fecha de inicio: ${resultado.fechaInicio} (${resultado.diaInicioT})`
    );
    console.log(
      `Fecha de finalización: ${resultado.fechaFin} (${resultado.diaFinT})`
    );

    console.log("\nFechas y Días Iterados:");
    resultado.fechasYDias.forEach(({ fecha, dia }) => {
      console.log(`${fecha} - ${dia}`);
    });

    res.json({
      horariosPorFecha: resultado.fechasYDias.map(({ fecha }) => fecha),
    });
  } catch (error) {
    console.error("Error al obtener los horarios por fechas:", error);
    res.status(500).send("Error interno del servidor.");
  }
});

router.post("/fecha-dia", (req, res) => {
  try {
    const { fechaInicio, dia } = req.body;
    const resultado = calcularFechaFin(fechaInicio);

    // Mostrar fechas asociadas a un dia
    // Ejemplo de uso para obtener fechas asociadas a un dia
    const dates = mapDias(resultado.fechasYDias, dia.toUpperCase());
    console.log(`Fechas asociadas a: ${dia} (${dates})`);
    res.json({ fechasPorDia: dates });
  } catch (error) {
    console.error("Error al obtener los horarios por fechas:", error);
    res.status(500).send("Error interno del servidor.");
  }
});

function calcularFechaFin(fechaInicio) {
  const fechaInicioMoment = moment(fechaInicio, "DD/MM/YYYY");
  let diasLaborables = 0;
  const fechasYDias = [];

  while (diasLaborables < 10) {
    const diaSemanaActual = fechaInicioMoment.day();
    const fechaActual = fechaInicioMoment.format("DD/MM/YYYY");
    if (
      diaSemanaActual >= 1 &&
      diaSemanaActual <= 5 &&
      !isHoliday(fechaActual)
    ) {
      diasLaborables++;
      const fechaYDiaActual = {
        fecha: fechaActual,
        dia: translateDay(fechaInicioMoment.format("dddd")),
      };
      fechasYDias.push(fechaYDiaActual);
    }
    fechaInicioMoment.add(1, "days");
  }
  fechaInicioMoment.add(-1, "days");
  const fechaFin = fechaInicioMoment.format("DD/MM/YYYY");
  const diaFin = fechaInicioMoment.format("dddd");
  const diaFinT = translateDay(diaFin);

  const diaInicio = moment(fechaInicio, "DD/MM/YYYY").format("dddd");
  const diaInicioT = translateDay(diaInicio);

  return { diaInicioT, fechaInicio, diaFinT, fechaFin, fechasYDias };
}

function mapDias(fechasYDias, diaBuscado) {
  const mapaDias = new Map();

  // Llenar el mapa con las fechas asociadas a cada día
  fechasYDias.forEach(({ fecha, dia }) => {
    if (!mapaDias.has(dia)) {
      mapaDias.set(dia, []);
    }
    mapaDias.get(dia).push(fecha);
  });
  // Obtener las fechas asociadas al día buscado
  const fechasDelDia = mapaDias.get(diaBuscado) || [];

  return fechasDelDia;
  /* Imprimir las fechas
    console.log(`${diaBuscado} {`);fechasDelDia.forEach((fecha) => { console.log(`${fecha}`); }); console.log('}');*/
}

function translateDay(day) {
  const translate = {
    Monday: "LUNES",
    Tuesday: "MARTES",
    Wednesday: "MIERCOLES",
    Thursday: "JUEVES",
    Friday: "VIERNES",
  };
  return translate[day];
}

function isHoliday(date) {
  // Verifica si la fecha está en la lista de días festivos
  return holidays.some((holiday) => holiday.date === date);
}

router.post("/signup", userCtrl.signUp);
router.post("/signin", userCtrl.signIn);
router.get("/private", auth, (req, res) => {
  res.status(200).send({ message: "Tienes acceso" });
});

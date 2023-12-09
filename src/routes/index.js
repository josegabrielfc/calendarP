const { Router } = require("express");
const router = Router();
const moment = require("moment");
const fs = require('fs');
const path = require('path');
const auth = require("../middleware/auth");
const userCtrl = require("../controller/user");
const holidays = require('./holidays'); 
const { insertData, pool } = require("../db");

router.get("/", (req, res) => {
  res.json({ Title: "Hello World" });
});

router.get("/t", (req, res) => {
  const filePath = path.join(
    __dirname, '..', 
    "views",
    "home.html"
  );
  res.sendFile(filePath);
});

router.get("/form", (req, res) => {
  const filePath = path.join(
    __dirname, '..', 
    "views",
    "formulario.html"
  );
  res.sendFile(filePath);
});
router.post("/procesar-formulario", (req, res) => {
  const { nombre, correo } = req.body;
  
  res.send(`Datos recibidos: Nombre: ${nombre}, Correo: ${correo}`);
});

router.post("/upload_xlsx", async (req, res) => {
  try {
    const xlsx = require("xlsx");

    // Ruta al archivo Excel que deseas leer
    const excelFilePath = "./src/routes/calendario.xlsx";
    // Cargar el libro de trabajo desde el archivo
    const workbook = xlsx.readFile(excelFilePath);
    // Obtener el nombre de la primera hoja
    const sheetName = workbook.SheetNames[0];
    // Obtener los datos de la hoja
    const worksheet = workbook.Sheets[sheetName];

    // Convertir los datos a un formato que sea fácil de trabajar
    let data = xlsx.utils.sheet_to_json(worksheet);

    let completeEntry = null;

    for (let i = 0; i < data.length; i++) {
      if (data[i].Materia) {
        completeEntry = data[i];
        if (!Array.isArray(completeEntry.Horario)) {
          completeEntry.Horario = completeEntry.Horario
            ? [completeEntry.Horario]
            : [];
        }
        // Dividir la propiedad Materia en Número y Grupo
        const matches = completeEntry.Materia.match(/^(\d+)([A-Z])$/);
        if (matches && matches.length === 3) {
          const nuevaMateria = matches[1];
          const nuevoGrupo = matches[2];

          completeEntry.Materia = nuevaMateria;
          completeEntry.Grupo = nuevoGrupo;
        }
      } else if (completeEntry && !data[i].Materia && data[i].Horario) {
        completeEntry.Horario.push(data[i].Horario);
      }
    }

    // Filtrar para eliminar los objetos que solo tienen Horario
    data = data.filter((item) => item.Materia);
    await insertData(data);
    console.log(data);
    //res.json({ data });
    res.status(200).send("Datos insertados correctamente en la base de datos.");
  } catch (error) {
    console.error("Error en el endpoint /upload_xlsx:", error);
    res.status(500).send("Error interno del servidor.");
  }
});

router.get("/materias", async (req, res) => {
  try {
    const query = "SELECT * FROM Materia";
    const [materias] = await pool.query(query);
    res.json({ materias });
  } catch (error) {
    console.error("Error al obtener la lista de materias:", error);
    res.status(500).send("Error interno del servidor.");
  }
});

router.get("/materias_sem/:idS", async (req, res) => {
  try {
    const [idS] = req.params.idS;
    const query = `SELECT id FROM Materia  WHERE CAST(SUBSTRING(id, 5, 1) AS SIGNED) = ? `;
    const [result] = await pool.query(query, [idS]);
    console.log("Resultados de la consulta:", result);
    res.json({ Semestre: result });
  } catch (error) {
    console.error("Error al obtener la lista de materias:", error);
    res.status(500).send("Error interno del servidor.");
  }
});

router.get('/semestres', (req, res) => {
  try {
    const semestresData = fs.readFileSync('./src/JSON/semestres.json', 'utf8');
    const semestres = JSON.parse(semestresData);
    res.json(semestres);
  } catch (error) {
    console.error("Error al leer el archivo .json", error);
    res.status(500).json({ error: 'Error al leer el archivo semestres.json' });
  }
});

//Horarios Validos para Previos
router.get("/horario", async (req, res) => {
  try {
    const query = `
      SELECT *
      FROM Horario
      WHERE calcDiffHoras(hora_inicio, hora_fin) >= 2;
    `;

    const [rows] = await pool.query(query);

    res.json({ horarios: rows });
    console.log(rows);
    console.log("Comando ejecutado correctamente en la base de datos.");
  } catch (error) {
    console.error("Error en el endpoint /getHorario:", error);
    res.status(500).send("Error interno del servidor.");
  }
});

router.get("/horario/:materiaId", async (req, res) => {
  try {
    const materiaId = req.params.materiaId;
    const query = `
      SELECT id, grupo_id, dia, hora_inicio, hora_fin, salon
      FROM Horario
      WHERE materia_id = ? AND calcDiffHoras(hora_inicio, hora_fin) >= 2;
    `;
    const [horarios] = await pool.query(query, [materiaId]);
    res.json({ horarios });
    console.log(horarios);
  } catch (error) {
    console.error("Error al obtener los horarios:", error);
    res.status(500).send("Error interno del servidor.");
  }
});

router.get("/horario/:materiaId/:grupoId", async (req, res) => {
  try {
    const { materiaId, grupoId } = req.params;

    const query = `
      SELECT id, dia, hora_inicio, hora_fin
      FROM Horario
      WHERE materia_id = ? AND grupo_id = ? AND calcDiffHoras(hora_inicio, hora_fin) >= 2;
    `;

    const [horarios] = await pool.query(query, [materiaId, grupoId]);

    res.json({ horarios });
  } catch (error) {
    console.error("Error al obtener los horarios:", error);
    res.status(500).send("Error interno del servidor.");
  }
});

router.post("/generate_pdf", (req, res) =>{

});

//Editar horario segun materia y grupo
router.put("/horario/:materiaId/:grupoId/:oldHorarioId/:newHorarioId", async (req, res) => {
  try {
    const { materiaId, grupoId, oldHorarioId, newHorarioId } = req.params;
    //const { dia, hora_inicio, hora_fin } = req.body;

    // Consulta para obtener los valores actuales del horario
    const selectQuery = `
      SELECT dia, hora_inicio, hora_fin
      FROM Horario
      WHERE id = ? AND materia_id = ? AND grupo_id = ?;
    `;

    const [result] = await pool.query(selectQuery, [newHorarioId, materiaId, grupoId]);

    if (result.length === 0) {
      return res.status(400).json({ error: "El horario seleccionado no pertenece a la materia y grupo especificados." });
    }

    const { dia, hora_inicio, hora_fin } = result[0];

    // Realizar la actualización en la tabla Seleccionar
    const updateQuery = `
      UPDATE Seleccionar
      SET horario_id = ?, dia = ?, hora_inicio = ?, hora_fin = ?
      WHERE horario_id = ? AND materia_id = ? AND grupo_id = ?;
    `;

    await pool.query(updateQuery, [newHorarioId, dia, hora_inicio, hora_fin, oldHorarioId, materiaId, grupoId]);

    const selectAfterUpdateQuery = `
      SELECT *
      FROM Seleccionar
      WHERE materia_id = ? AND grupo_id = ? AND horario_id = ?;
    `;

    const [resultAfterUpdate] = await pool.query(selectAfterUpdateQuery, [materiaId, grupoId, newHorarioId]);

    const horario = resultAfterUpdate[0];

    res.json({ horario });
    //res.json({ success: true, message: "Información actualizada correctamente." });
  } catch (error) {
    console.error("Error al actualizar la información:", error);
    res.status(500).send("Error interno del servidor.");
  }
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


router.post("/seleccionar-aleatorio", async (req, res) => {
  try {
    // Obtener todas las combinaciones únicas de materia_id y grupo_id desde la tabla Materia_grupo
    const combinacionesQuery = `
      SELECT DISTINCT materia_id, grupo_id
      FROM Materia_grupo;
    `;

    const [combinaciones] = await pool.query(combinacionesQuery);

    const horariosSeleccionados = new Map();

    // Iterar sobre las combinaciones únicas de materia_id e id_grupo
    for (const combinacion of combinaciones) {
      const { materia_id, grupo_id } = combinacion;

      // Obtener todos los horarios válidos para la materia y grupo actual
      const horariosQuery = `
        SELECT *
        FROM Horario
        WHERE materia_id = ? AND grupo_id = ? AND calcDiffHoras(hora_inicio, hora_fin) >= 2;
      `;

      const [horarios] = await pool.query(horariosQuery, [
        materia_id,
        grupo_id,
      ]);

      // Si hay horarios disponibles, seleccionar aleatoriamente uno
      if (horarios.length > 0) {
        const horarioSeleccionado =
          horarios[Math.floor(Math.random() * horarios.length)];

        // Agregar el horario seleccionado al mapa
        horariosSeleccionados.set(
          `${materia_id}-${grupo_id}`,
          horarioSeleccionado
        );
      }
    }

    const horariosSeleccionadosArray = Array.from(
      horariosSeleccionados.values()
    );

    // Insertar los horarios seleccionados en la tabla Seleccionar
    for (const horario of horariosSeleccionadosArray) {
      const insertSeleccionQuery = `
        INSERT INTO Seleccionar (horario_id, materia_id, grupo_id, dia, hora_inicio, hora_fin, salon) VALUES (?, ?, ?, ?, ?, ?, ?);
        `;

      await pool.query(insertSeleccionQuery, [
        horario.id,
        horario.materia_id,
        horario.grupo_id,
        horario.dia,
        horario.hora_inicio,
        horario.hora_fin,
        horario.salon,
      ]);
    }

    res.json({ horariosSeleccionados: horariosSeleccionadosArray });
    //res.status(200).send("Horarios seleccionados aleatoriamente y guardados correctamente.");
  } catch (error) {
    console.error("Error en el endpoint /seleccionar-aleatorio:", error);
    res.status(500).send("Error interno del servidor.");
  }
});

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


router.post("/select-horario", async (req, res) => {
  try {
    const { materia_id, grupo_id, dia, hora_inicio, hora_fin } = req.body;

    const query = `
        SELECT id
        FROM Horario
        WHERE materia_id = ? AND grupo_id = ? AND dia = ? AND hora_inicio = ? AND hora_fin = ? AND calcDiffHoras(hora_inicio, hora_fin) >= 2;
      `;

    const [horarioDisponible] = await pool.query(query, [
      materia_id,
      grupo_id,
      dia,
      hora_inicio,
      hora_fin,
    ]);

    // Verificar si el horario está disponible
    if (!horarioDisponible) {
      res
        .status(404)
        .send(
          "El horario seleccionado no está disponible para la materia y grupo específicos."
        );
      return;
    }

    // Insertar la selección en la tabla "Seleccionar"
    const insertSeleccionQuery = `
        INSERT INTO Seleccionar (materia_id, grupo_id, dia, hora_inicio, hora_fin)
        VALUES (?, ?, ?, ?, ?);
      `;

    await pool.query(insertSeleccionQuery, [
      materia_id,
      grupo_id,
      dia,
      hora_inicio,
      hora_fin,
    ]);

    res.status(200).send("Horario seleccionado y guardado correctamente.");
  } catch (error) {
    console.error("Error al seleccionar y guardar el horario:", error);
    res.status(500).send("Error interno del servidor.");
  }
});

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

router.get("/selecciones", async (req, res) => {
  try {
    const query = "SELECT * FROM Seleccionar";
    const [selecciones] = await pool.query(query);

    res.json({ selecciones });
  } catch (error) {
    console.error("Error al obtener la lista de selecciones:", error);
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

router.post("/selecct-week/:horarioId", async(req, res) => {
  try {
    const x = null;
  } catch (error) {
    
  }
});

router.post("/horarios-por-fechas", async (req, res) => {
  try {
    const { fechaInicio } = req.body;

    const { diaInicioT, diaFinT, fechaFin, fechasYDias } = calcularFechaFin(moment(fechaInicio, "DD/MM/YYYY"));

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

router.post("/fechas",(req, res) => {
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

    res.json({ horariosPorFecha: resultado.fechasYDias.map(({ fecha }) => fecha) });
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
  const fechaInicioMoment = moment(fechaInicio, 'DD/MM/YYYY');
  let diasLaborables = 0;
  const fechasYDias = [];

  while (diasLaborables < 10) {
    const diaSemanaActual = fechaInicioMoment.day();
    const fechaActual = fechaInicioMoment.format('DD/MM/YYYY');
    if (diaSemanaActual >= 1 && diaSemanaActual <= 5 && !isHoliday(fechaActual)) {
      diasLaborables++;
      const fechaYDiaActual = {
        fecha: fechaActual,
        dia: translateDay(fechaInicioMoment.format('dddd'))
      };
      fechasYDias.push(fechaYDiaActual);
    }
    fechaInicioMoment.add(1, 'days');
  }
  fechaInicioMoment.add(-1, 'days');
  const fechaFin = fechaInicioMoment.format('DD/MM/YYYY');
  const diaFin = fechaInicioMoment.format('dddd');
  const diaFinT = translateDay(diaFin);

  const diaInicio = moment(fechaInicio, 'DD/MM/YYYY').format('dddd');
  const diaInicioT = translateDay(diaInicio);
  
  return { diaInicioT, fechaInicio, diaFinT, fechaFin, fechasYDias };
}

function  mapDias(fechasYDias, diaBuscado) {
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
    'Monday': 'LUNES',
    'Tuesday': 'MARTES',
    'Wednesday': 'MIERCOLES',
    'Thursday': 'JUEVES',
    'Friday': 'VIERNES'
  };
  return translate[day];
}

function isHoliday(date) {
  // Verifica si la fecha está en la lista de días festivos
  return holidays.some(holiday => holiday.date === date);
}

/*router.post("/login", async (req, res) => {
  try {
    // Obtenemos las credenciales del usuario
    const { email, password } = req.body;

    const query = `
      SELECT * FROM Usuario WHERE email = ? AND password = ?;
    `;
    const userFound = await pool.query(query, [email, password]);

    if (!userFound || !userFound.estado) {
      req.log.warn(
        {
          user:
            userFound !== null
              ? [userFound.id, userFound.nombre]
              : "usuario no registrado",
        },
        "Intento de acceso no autorizado"
      );
      return res.status(401).json({ error: "Credenciales incorrectas" });
    }

    // Comprobamos la contraseña
    const match = await bcrypt.compare(password, userFound.password);

    if (!match) {
      return res.status(401).json({ error: "Credenciales incorrectas" });
    }

    // Creamos el token de acceso
    const accessToken = jwt.sign(
      {
        id: userFound.id,
        username: email,
        nombre: userFound.nombre,
        tipo: userFound.tipo,
      },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "3d" }
    );

    // Enviamos el token de acceso al usuario
    res.json({
      username: email,
      name: userFound.nombre,
      role: userFound.tipo,
      accessToken,
    });
  } catch (error) {
    const errorLogin = new Error(
      `Ocurrio un problema al intentar iniciar sesión - ${error.message}`
    );
    errorLogin.stack = error.stack;
    next(errorLogin);
  }
});*/

router.post("/signup", userCtrl.signUp);
router.post("/signin", userCtrl.signIn);
router.get("/private", auth, (req, res) => {
  res.status(200).send({ message: "Tienes acceso" });
});



module.exports = router;

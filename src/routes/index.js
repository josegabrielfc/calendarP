const { Router } = require("express");
const router = Router();
const { insertData, executeScript, pool } = require("../db");
const auth = require("../middleware/auth");
const userCtrl = require("../controller/user");
const moment = require("moment");

router.get("/", (req, res) => {
  res.json({ Title: "Hello World" });
});

router.get("/test", (req, res) => {
  const data = {
    name: "Calendar",
    website: "calendar.com",
  };
  res.json(data);
});
router.post("/signup", userCtrl.signUp);
router.post("/signin", userCtrl.signIn);
router.get("/private", auth, (req, res) => {
  res.status(200).send({ message: "Tienes acceso" });
});

router.post("/update_xlsx", async (req, res) => {
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
    //console.log(data);
    //res.json({ data });
    res.status(200).send("Datos insertados correctamente en la base de datos.");
  } catch (error) {
    console.error("Error en el endpoint /update_xlsx:", error);
    res.status(500).send("Error interno del servidor.");
  }
});

router.get("/materias", async (req, res) => {
  try {
    const query = "SELECT * FROM calendar.materia";
    const [materias] = await pool.query(query);
    res.json({ materias });
  } catch (error) {
    console.error("Error al obtener la lista de materias:", error);
    res.status(500).send("Error interno del servidor.");
  }
});

router.get("/horario", async (req, res) => {
  try {
    await executeScript();
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
      SELECT id, grupo_id, dia, hora_inicio, hora_fin
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
        INSERT INTO Seleccionar (horario_id, materia_id, grupo_id, dia, hora_inicio, hora_fin) VALUES (?, ?, ?, ?, ?, ?);
        `;

      await pool.query(insertSeleccionQuery, [
        horario.id,
        horario.materia_id,
        horario.grupo_id,
        horario.dia,
        horario.hora_inicio,
        horario.hora_fin,
      ]);
    }

    res.json({ horariosSeleccionados: horariosSeleccionadosArray });
    //res.status(200).send("Horarios seleccionados aleatoriamente y guardados correctamente.");
  } catch (error) {
    console.error("Error en el endpoint /seleccionar-aleatorio:", error);
    res.status(500).send("Error interno del servidor.");
  }
});

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

module.exports = router;

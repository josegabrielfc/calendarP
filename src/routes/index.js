const { Router } = require("express");
const router = Router();
const { insertData, executeScript, pool } = require("../db");
const auth = require("../middleware/auth");
const userCtrl = require("../controller/user");

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
    // Insertar datos en la base de datos utilizando la función de db.js
    await insertData(data);
    //console.log(data);
    // Enviar respuesta al cliente
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

module.exports = router;

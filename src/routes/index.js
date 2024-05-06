const { Router } = require("express");
const router = Router();
const moment = require("moment");
const fs = require("fs");
const path = require("path");
const auth = require("../middleware/auth");
const userCtrl = require("../controller/user_old");
const holidays = require("./holidays");
const { insertData, pool } = require("../db");
const xlsx = require("xlsx");
const fileUpload = require("express-fileupload");
const bcryptjs = require("bcryptjs");
const jsonwebtoken = require("jsonwebtoken");
const dotenv = require("dotenv");
const methods = require("../controller/authentication.controller");

dotenv.config();
router.use(fileUpload());

router.get("/", (req, res) => {
  res.json({ Title: "Hello World" });
});

router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !password || !email) {
    return res
      .status(400)
      .send({ status: "Error", message: "Los campos están incompletos" });
  }

  try {
    const [existingUser] = await pool.query(
      "SELECT * FROM Usuario WHERE email = ?",
      [email]
    );
    if (existingUser.length > 0) {
      return res
        .status(400)
        .json({
          status: "Email_Error",
          message: "El correo electrónico ya está en uso",
        });
    }
  } catch (error) {
    console.error("Error al verificar el correo electrónico:", error);
    return res.status(500).send("Error interno del servidor.");
  }

  const salt = await bcryptjs.genSalt(5);
  const hashPassword = await bcryptjs.hash(password, salt);
  try {
    const query =
      "INSERT INTO Usuario (name, email, password) VALUES (?, ?, ?);";
    await pool.query(query, [name, email, hashPassword]);

    res.status(200).json({
      status: "Success",
      message: "Usuario registrado correctamente.",
    });
  } catch (error) {
    console.error("Error al registrar usuario:", error);
    res.status(500).send("Error interno del servidor.");
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res
      .status(400)
      .send({ status: "Error", message: "Los campos están incompletos" });
  }

  try {
    // Consultar usuario por correo electrónico
    const query = "SELECT * FROM Usuario WHERE email = ?";
    const [rows] = await pool.query(query, [email]);

    // Verificar si se encontró un usuario con el correo electrónico dado
    if (rows.length !== 1) {
      return res.status(400).send({
        status: "Error",
        message: "Correo electrónico o contraseña incorrectos",
      });
    }

    // Obtener el usuario de la fila de resultados
    const user = rows[0];

    // Verificar si la contraseña proporcionada coincide con la contraseña almacenada hasheada
    const passwordMatches = await bcryptjs.compare(password, user.password);
    if (!passwordMatches) {
      return res.status(400).send({
        status: "Error",
        message: "Correo electrónico o contraseña incorrectos",
      });
    }

    // Enviar respuesta de éxito
    res.send({
      status: "ok",
      message: "Usuario autenticado",
      redirect: "/home",
    });
  } catch (error) {
    console.error("Error durante el inicio de sesión:", error);
    res
      .status(500)
      .send({ status: "Error", message: "Error interno del servidor" });
  }
});

/*
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
*/

router.post("/upload_xlsx_new", async (req, res) => {
  try {
    res.setHeader("Access-Control-Allow-Origin", "*");
    if (!req.files || !req.files.calendario) {
      return res.status(400).send("No file uploaded or incorrect field name.");
    }
    // Assuming the uploaded file is in the 'calendario' field of the request body
    const excelFile = req.files.calendario;

    if (!excelFile) {
      return res.status(400).send("No file uploaded.");
    }

    const workbook = xlsx.read(excelFile.data, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    let data = xlsx.utils.sheet_to_json(worksheet);

    let completeEntry = null;

    for (let i = 0; i < data.length; i++) {
      if (data[i].Materia) {
        completeEntry = data[i];
        completeEntry.Horario = Array.isArray(completeEntry.Horario)
          ? completeEntry.Horario
          : completeEntry.Horario
          ? [completeEntry.Horario]
          : [];

        const matches = completeEntry.Materia.match(/^(\d+)([A-Z])$/);

        if (matches && matches.length === 3) {
          completeEntry.Materia = matches[1];
          completeEntry.Grupo = matches[2];
        }
      } else if (completeEntry && !data[i].Materia && data[i].Horario) {
        completeEntry.Horario.push(data[i].Horario);
      }
    }

    data = data.filter((item) => item.Materia);
    await insertData(data);

    res.status(200).send("Data inserted successfully.");
  } catch (error) {
    console.error("Error in /upload_xlsx endpoint:", error);
    res.status(500).send("Internal server error.");
  }
});

router.get("/holidays", async (req, res) => {
  res.json({
    status: "Success",
    message: "Festivos obtenidos correctamente.",
    holidays: holidays,
  });
});

router.get("/holidays_dates", (req, res) => {
  const holidayDates = holidays.map((holiday) => holiday.date);

  res.json({
    status: "Success",
    holidayDates: holidayDates,
  });
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

router.get("/semestres", (req, res) => {
  try {
    const semestresData = fs.readFileSync("./src/JSON/semestres.json", "utf8");
    const semestres = JSON.parse(semestresData);
    res.json(semestres);
  } catch (error) {
    console.error("Error al leer el archivo .json", error);
    res.status(500).json({ error: "Error al leer el archivo semestres.json" });
  }
});

//Horarios Validos para Previos
router.get("/horario", async (req, res) => {
  try {
    const query = `
      SELECT * FROM Horario WHERE hora_fin - hora_inicio >= 2 OR materia_id = 1155108;
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
      WHERE materia_id = ? AND hora_fin - hora_inicio >= 2 OR materia_id = 1155108;
    `;
    const [horarios] = await pool.query(query, [materiaId]);
    res.json({ horarios });
    console.log(horarios);
  } catch (error) {
    console.error("Error al obtener los horarios:", error);
    res.status(500).send("Error interno del servidor.");
  }
});

router.post("/generate_pdf", (req, res) => {});

router.get("/seleccionar-aleatorio", async (req, res) => {
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
        WHERE materia_id = ? AND grupo_id = ? AND hora_fin - hora_inicio >= 2;
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

      try {
        await pool.query(insertSeleccionQuery, [
          horario.id,
          horario.materia_id,
          horario.grupo_id,
          horario.dia,
          horario.hora_inicio,
          horario.hora_fin,
          horario.salon,
        ]);
      } catch (error) {}
    }

    res.json({ horarios: horariosSeleccionadosArray });
    //res.status(200).send("Horarios seleccionados aleatoriamente y guardados correctamente.");
  } catch (error) {
    console.error("Error en el endpoint /seleccionar-aleatorio:", error);
    res.status(500).send("Error interno del servidor.");
  }
});

router.post("/reset-horario", async (req, res) => {
  try {
    // Ejecutar la consulta para eliminar todos los datos de la tabla "Horario"
    await pool.query("DELETE FROM Horario WHERE id > 0");
    // Ejecutar la consulta para resetear el contador de identidad (id) en la tabla "Horario"
    await pool.query("ALTER TABLE Horario AUTO_INCREMENT = 1");

    // Responder con un mensaje de éxito
    res.json({
      status: "Success",
      message: "Datos eliminados de la tabla 'Horario' y contador de identidad reseteado correctamente."
    });
  } catch (error) {
    console.error("Error al resetear la tabla 'Horario':", error);
    res.status(500).json({ status: "Error", message: "Error interno del servidor." });
  }
});


router.post("/reset-materiagrupo", async (req, res) => {
  try {
    // Ejecutar la consulta para eliminar todos los datos de la tabla "Materia_grupo"
    await pool.query("DELETE FROM Materia_grupo WHERE materia_id > 0");

    // Responder con un mensaje de éxito
    res.json({
      status: "Success",
      message: "Datos eliminados de la tabla 'Materia_grupo' y contador de identidad reseteado correctamente."
    });
  } catch (error) {
    console.error("Error al resetear la tabla 'Materia_grupo':", error);
    res.status(500).json({ status: "Error", message: "Error interno del servidor." });
  }
});

router.post("/reset-materia", async (req, res) => {
  try {
    // Ejecutar la consulta para eliminar todos los datos de la tabla "Materia"
    await pool.query("DELETE FROM Materia WHERE id > 0");

    // Responder con un mensaje de éxito
    res.json({
      status: "Success",
      message: "Datos eliminados de la tabla 'Materia' y contador de identidad reseteado correctamente."
    });
  } catch (error) {
    console.error("Error al resetear la tabla 'Materia':", error);
    res.status(500).json({ status: "Error", message: "Error interno del servidor." });
  }
});

module.exports = router;

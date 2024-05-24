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

// Listas Horarios y Materias
let horarios = [];
let materias = [];
let grupos = [];

router.post("/get_xlsx_data", async (req, res) => {
  try {
    res.setHeader("Access-Control-Allow-Origin", "*");
    // Resetear listas para evitar acumulación de datos
    horarios = [];
    materias = [];
    
    if (!req.files || !req.files.calendario) {
      return res.status(400).send("No file uploaded or incorrect field name.");
    }
    
    const excelFile = req.files.calendario;

    if (!excelFile) {
      return res.status(400).send("No file uploaded.");
    }

    const workbook = xlsx.read(excelFile.data, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    let data = xlsx.utils.sheet_to_json(worksheet);

    let completeEntry = null;
    let idCounter = 1;
    let materiasMap = new Map();

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

        if (!materiasMap.has(completeEntry.Materia)) {
          materiasMap.set(completeEntry.Materia, {
            id: completeEntry.Materia,
            name: completeEntry.Nombre
          });
        }

        for (let horario of completeEntry.Horario) {
          const [dia, timeRange, salon] = horario.split(" ");
          const [hora_inicio, hora_fin] = timeRange.split("-");

          horarios.push({
            id: idCounter++,
            materia_id: completeEntry.Materia,
            grupo_id: completeEntry.Grupo,
            dia,
            hora_inicio: `${hora_inicio}:00`,
            hora_fin: `${hora_fin}:00`,
            salon
          });
        }
      } else if (completeEntry && !data[i].Materia && data[i].Horario) {
        const [dia, timeRange, salon] = data[i].Horario.split(" ");
        const [hora_inicio, hora_fin] = timeRange.split("-");

        horarios.push({
          id: idCounter++,
          materia_id: completeEntry.Materia,
          grupo_id: completeEntry.Grupo,
          dia,
          hora_inicio: `${hora_inicio}:00`,
          hora_fin: `${hora_fin}:00`,
          salon
        });
      }
    }

    materias = Array.from(materiasMap.values());

    res.status(200).json({ horarios, materias });
    //res.status(200).send("Horarios y materias cargados satisfactoriamente");
  } catch (error) {
    console.error("Error in /get_xlsx_data endpoint:", error);
    res.status(500).send("Internal server error.");
  }
});

router.get("/materias", async (req, res) => {
  try {
    res.json({ materias });
  } catch (error) {
    console.error("Error al obtener la lista de materias:", error);
  }
});

//Horarios validos x materia
router.get("/horario/:materiaId", async (req, res) => {
  try {
    const materiaId = req.params.materiaId;
    
    // Filtrar los horarios válidos
    const horariosValidos = horarios.filter(horario => {
      const horaInicio = new Date(`2024-01-01T${horario.hora_inicio}`).getTime();
      const horaFin = new Date(`2024-01-01T${horario.hora_fin}`).getTime();
      const duration = (horaFin - horaInicio) / (1000 * 60 * 60); // Convertir a horas

      //return duration >= 2 || horario.materia_id === "1155108";
      return duration >= 2;
    });

    // Filtrar los horarios por materiaId
    const filteredHorarios = horariosValidos.filter(horario => horario.materia_id === materiaId);
    
    // Devolver los horarios filtrados en formato JSON
    res.json({ horarios: filteredHorarios });
  } catch (error) {
    console.error("Error al obtener los horarios:", error);
    res.status(500).send("Error interno del servidor.");
  }
});

// Horarios Válidos para Previos
router.get("/horarios_validos", async (req, res) => {
  try {
    // Filtrar los horarios válidos
    const horariosValidos = horarios.filter(horario => {
      const horaInicio = new Date(`2024-01-01T${horario.hora_inicio}`).getTime();
      const horaFin = new Date(`2024-01-01T${horario.hora_fin}`).getTime();
      const duration = (horaFin - horaInicio) / (1000 * 60 * 60); // Convertir a horas

      //return duration >= 2 || horario.materia_id === "1155108";
      return duration >= 2;
    });

    res.json({ horarios: horariosValidos });
    //console.log(horariosValidos);
    //console.log("Horarios válidos filtrados correctamente.");
  } catch (error) {
    console.error("Error en el endpoint /horarios_validos:", error);
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

router.get("/grupos", (req, res) => {
  try {
    const gruposData = fs.readFileSync("./src/JSON/grupos.json", "utf8");
    const gruposJson = JSON.parse(gruposData);
    grupos = gruposJson.grupos;
    res.json(gruposJson);
  } catch (error) {
    console.error("Error al leer el archivo .json", error);
    res.status(500).json({ error: "Error al leer el archivo grupos.json" });
  }
});

router.get("/holidays_dates", (req, res) => {
  const holidayDates = holidays.map((holiday) => holiday.date);

  res.json({
    status: "Success",
    holidayDates: holidayDates,
  });
});

router.get("/seleccionar-aleatorio", async (req, res) => {
  try {
    const gruposData = fs.readFileSync("./src/JSON/grupos.json", "utf8");
    const gruposJson = JSON.parse(gruposData);
    grupos = gruposJson.grupos;

    // Crear un mapa para almacenar los horarios seleccionados
    const horariosSeleccionados = new Map();

    // Iterar sobre cada materia
    for (const materia of materias) {
      // Iterar sobre cada grupo para la materia actual
      for (const grupo of grupos) {
        // Filtrar los horarios válidos para la materia y el grupo actual
        const horariosValidos = horarios.filter((horario) => {
        const horaInicio = new Date(`2024-01-01T${horario.hora_inicio}`).getTime();
        const horaFin = new Date(`2024-01-01T${horario.hora_fin}`).getTime();
        const duration = (horaFin - horaInicio) / (1000 * 60 * 60);
        
        return (
          horario.materia_id === materia.id &&
          horario.grupo_id === grupo &&
          duration >= 2
        );
      });

        // Si hay horarios válidos, seleccionar aleatoriamente uno
        if (horariosValidos.length > 0) {
          const horarioSeleccionado =
            horariosValidos[Math.floor(Math.random() * horariosValidos.length)];

          // Agregar el horario seleccionado al mapa
          horariosSeleccionados.set(
            `${materia.id}-${grupo}`,
            horarioSeleccionado
          );
        } else {
          break;
        }
      }
    }

    // Convertir los horarios seleccionados en un array
    const horariosSeleccionadosArray = Array.from(horariosSeleccionados.values());

    // Responder con los horarios seleccionados
    res.json({ horarios: horariosSeleccionadosArray });
  } catch (error) {
    console.error("Error en el endpoint /seleccionar-aleatorio:", error);
    res.status(500).send("Error interno del servidor.");
  }
});

module.exports = router;

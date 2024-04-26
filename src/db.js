const mysql = require("mysql2/promise");
const config = require("./config");

const dbConfig = config.db;
const pool = mysql.createPool(process.env.MYSQL_CONNECTION);

async function initializeDatabase() {
  try {
    await pool.getConnection();
    console.log("Conexión a la base de datos establecida...");
  } catch (error) {
    console.error("Error al inicializar la base de datos:", error);
  }
}

async function insertData(data) {
  const connection = await pool.getConnection();
  try {

    // Tabla estatica Grupo
    for (let i = 0; i < 5; i++) {
      // Generar un carácter 'A' hasta 'E' usando el código ASCII
      let char = String.fromCharCode(65 + i); // 65 es el código ASCII para 'A'
      try {
        await connection.query(`INSERT INTO Grupo (id) VALUES ('${char}')`);
      } catch (error) {
        console.error(`Error al insertar para '${char}': ${error.message}`);
      }
    }

    // Insertar el usuario (asumiendo que ya tienes la información del usuario)
    const usuario = {
      name: "Pilar",
      email: "pilar@ufps.edu.com",
      password: "123456789",
    };
    // Verificar si el usuario ya existe por su correo electrónico
    const [existingUser] = await connection.query(
      "SELECT * FROM Usuario WHERE email = ?",[usuario.email]
    );
    let userId;

    if (existingUser.length > 0) {
      // El usuario ya existe
      userId = existingUser[0].id;
    } else {
      // Insertar el nuevo usuario si no existe
      const [result] = await connection.query("INSERT INTO Usuario SET ?", [
        usuario,
      ]);
      userId = result.insertId;
    }

    // Insertar la información del documento
    const [documentoResult] = await connection.query(
      "INSERT INTO Document SET ?",
      {
        userId: userId,
        filename: "calendario.xlsx", // Reemplazar con el nombre real del archivo
        path: "./src/routes/calendario.xlsx", // Reemplazar con la ruta real del archivo
      }
    );

    // Insertar la información del archivo (data) relacionada con el usuario
    for (const entry of data) {
      // Insertar la información de Materia
      const [materiaResult] = await connection.query(
        "INSERT IGNORE INTO Materia SET ?",
        {
          id: entry.Materia,
          name: entry.Nombre,
        }
      );

      // Relacionar Materia y Grupo en Materia_grupo
      await connection.query("INSERT IGNORE INTO Materia_grupo SET ?", {
        materia_id: entry.Materia,
        grupo_id: entry.Grupo,
      });

      // Obtener el ID de Materia_grupo recién insertado
      const [materiaGrupoResult] = await connection.query(
        "SELECT * FROM Materia_grupo WHERE materia_id = ? AND grupo_id = ?",
        [entry.Materia, entry.Grupo]
      );

      const materiaId = materiaGrupoResult[0].materia_id; // Utilizar materia_id como clave foránea
      const grupoId = materiaGrupoResult[0].grupo_id; // Utilizar grupo_id como clave foránea

      // Insertar la información de Horario
      for (const horario of entry.Horario) {
        const [horarioResult] = await connection.query(
          "INSERT INTO Horario SET ?",
          {
            materia_id: materiaId, // Usar el ID de Materia_grupo
            grupo_id: grupoId, // Usar el ID de Grupo
            dia: horario.split(" ")[0], // Extraer el día del horario
            hora_inicio: horario.split(" ")[1].split("-")[0], // Extraer la hora de inicio del horario
            hora_fin: horario.split(" ")[1].split("-")[1], // Extraer la hora de fin del horario
            salon: horario.split(" ")[2], // Extraer el valor del salón
          }
        );
      }
    }
  } catch (error) {
    console.error("Error al insertar datos en la base de datos:", error);
  } finally {
    await connection.release();
  }
}

module.exports = {
  initializeDatabase,
  insertData,
  pool,
};

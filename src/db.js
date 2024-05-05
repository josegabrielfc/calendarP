const mysql = require("mysql2/promise");
const config = require("./config");

const dbConfig = config.db;
const pool = mysql.createPool(process.env.MYSQL_CONNECTION);

let globalConnection = null;

async function initializeDatabase() {
  try {
    globalConnection = await pool.getConnection();
    console.log("Conexión a la base de datos establecida...");
  } catch (error) {
    console.error("Error al inicializar la base de datos:", error);
  }
}

async function insertData(data) {
  try {
    if (!globalConnection) {
      console.error("No hay conexión global a la base de datos.");
      return;
    }

    /* Tabla estatica Grupo
    for (let i = 0; i < 5; i++) {
      // Generar un carácter 'A' hasta 'E' usando el código ASCII
      let char = String.fromCharCode(65 + i); // 65 es el código ASCII para 'A'
      try {
        await connection.query(`INSERT INTO Grupo (id) VALUES ('${char}')`);
      } catch (error) {
        console.error(`Error al insertar para '${char}': ${error.message}`);
      }
    }*/

    // Insertar la información del archivo (data) relacionada con el usuario
    for (const entry of data) {
      // Insertar la información de Materia
      const [materiaResult] = await globalConnection.query(
        "INSERT IGNORE INTO Materia SET ?",
        {
          id: entry.Materia,
          name: entry.Nombre,
        }
      );

      // Relacionar Materia y Grupo en Materia_grupo
      await globalConnection.query("INSERT IGNORE INTO Materia_grupo SET ?", {
        materia_id: entry.Materia,
        grupo_id: entry.Grupo,
      });

      // Obtener el ID de Materia_grupo recién insertado
      const [materiaGrupoResult] = await globalConnection.query(
        "SELECT * FROM Materia_grupo WHERE materia_id = ? AND grupo_id = ?",
        [entry.Materia, entry.Grupo]
      );

      const materiaId = materiaGrupoResult[0].materia_id; // Utilizar materia_id como clave foránea
      const grupoId = materiaGrupoResult[0].grupo_id; // Utilizar grupo_id como clave foránea

      // Insertar la información de Horario
      for (const horario of entry.Horario) {
        const [horarioResult] = await globalConnection.query(
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
    await globalConnection.release();
  }
}

module.exports = {
  initializeDatabase,
  insertData,
  pool,
};

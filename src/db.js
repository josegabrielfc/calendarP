const mysql = require("mysql2/promise");
const config = require("./config");

async function createDatabase() {
  const poolC = mysql.createPool({
    host: "localhost",
    user: "root",
    password: "1Q2W3E4R",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });
  const connection = await poolC.getConnection();
  try {
    await connection.query("CREATE DATABASE IF NOT EXISTS calendar");
  } catch (error) {
    console.error("Error al crear la base de datos:", error);
  } finally {
    connection.release();
  }
}

async function createTables(pool) {
  const connection = await pool.getConnection();
  try {
    await connection.query(`
      CREATE TABLE IF NOT EXISTS Usuario (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255),
        email VARCHAR(255),
        password VARCHAR(255)
      )
    `);
    await connection.query(`
      CREATE TABLE IF NOT EXISTS Materia (
        id INT PRIMARY KEY,
        name VARCHAR(255)
      )
    `);
    await connection.query(`
      CREATE TABLE IF NOT EXISTS Grupo (
        id CHAR(1) PRIMARY KEY
      )
    `);
    await connection.query(`
      CREATE TABLE IF NOT EXISTS Materia_grupo (
        materia_id INT,
        grupo_id CHAR(1),
        PRIMARY KEY (materia_id, grupo_id),
        FOREIGN KEY (materia_id) REFERENCES Materia(id),
        FOREIGN KEY (grupo_id) REFERENCES Grupo(id)
      )
    `);
    await connection.query(`
      CREATE TABLE IF NOT EXISTS Horario (
        id INT AUTO_INCREMENT PRIMARY KEY,
        materia_id INT,
        grupo_id CHAR(1),
        dia VARCHAR(50),
        hora_inicio TIME,
        hora_fin TIME,
        FOREIGN KEY (materia_id) REFERENCES Materia_grupo(materia_id),
        FOREIGN KEY (grupo_id) REFERENCES Materia_grupo(grupo_id)
      )
    `);
    await connection.query(`
      CREATE TABLE IF NOT EXISTS Seleccionar (
        id INT AUTO_INCREMENT PRIMARY KEY,
        horario_id INT,
        FOREIGN KEY (horario_id) REFERENCES Horario(id),
        id_materia INT,
        grupo_id CHAR(1),
        dia VARCHAR(50),
        hora_inicio TIME,
        hora_fin TIME
      )
    `);
    await connection.query(`
      CREATE TABLE IF NOT EXISTS Document (
        id INT AUTO_INCREMENT PRIMARY KEY,
        userId INT,
        filename VARCHAR(255),
        path VARCHAR(255),
        FOREIGN KEY (userId) REFERENCES Usuario(id)
      )
    `);
    await connection.query(`
      CREATE TABLE IF NOT EXISTS Document_horario (
        id INT AUTO_INCREMENT PRIMARY KEY,
        documentId INT,
        horarioId INT,
        FOREIGN KEY (documentId) REFERENCES Document(id),
        FOREIGN KEY (horarioId) REFERENCES Horario(id)
      )
    `);

    // Bucle for para generar los valores de id y name
    for (let i = 0; i < 5; i++) {
      // Generar un carácter 'A' hasta 'E' usando el código ASCII
      let char = String.fromCharCode(65 + i); // 65 es el código ASCII para 'A'

      try {
        // Crear la sentencia INSERT INTO y ejecutarla
        await connection.query(
          `INSERT IGNORE INTO Grupo (id) VALUES ('${char}')`
        );
        //console.log(`Registro insertado para '${char}'.`);
      } catch (error) {
        console.error(`Error al insertar para '${char}': ${error.message}`);
      }
    }
  } finally {
    connection.release();
  }
}

const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "1Q2W3E4R",
  database: "calendar",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

async function insertData(data) {
  const connection = await pool.getConnection();
  try {
    // Insertar el usuario (asumiendo que ya tienes la información del usuario)
    const usuario = {
      name: "Pilar",
      email: "pilar@ufps.edu.com",
      password: "123456789",
    };

    // Verificar si el usuario ya existe por su correo electrónico
    const [existingUser] = await connection.query(
      "SELECT * FROM Usuario WHERE email = ?",
      [usuario.email]
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
      await connection.query("INSERT INTO Materia_grupo SET ?", {
        materia_id: entry.Materia,
        grupo_id: entry.Grupo,
      });

      // Obtener el ID de Materia_grupo recién insertado
      const [materiaGrupoResult] = await connection.query(
        "SELECT * FROM Materia_grupo WHERE materia_id = ? AND grupo_id = ?",
        [entry.Materia, entry.Grupo]
      );

      const materiaGrupoId = materiaGrupoResult[0].materia_id; // Utilizar materia_id como clave foránea
      const grupoId = materiaGrupoResult[0].grupo_id; // Utilizar grupo_id como clave foránea

      // Insertar la información de Horario
      for (const horario of entry.Horario) {
        const [horarioResult] = await connection.query(
          "INSERT INTO Horario SET ?",
          {
            materia_id: materiaGrupoId, // Usar el ID de Materia_grupo
            grupo_id: grupoId, // Usar el ID de Grupo
            dia: horario.split(" ")[0], // Extraer el día del horario
            hora_inicio: horario.split(" ")[1].split("-")[0], // Extraer la hora de inicio del horario
            hora_fin: horario.split(" ")[1].split("-")[1], // Extraer la hora de fin del horario
          }
        );
      }
    }
  } catch (error) {
    console.error("Error al insertar datos en la base de datos:", error);
  } finally {
    // Cerrar la conexión
    await connection.release();
  }
}

const funcionSQL = `
CREATE FUNCTION IF NOT EXISTS calcDiffHoras(
  horaInicio TIME,
  horaFin TIME
) RETURNS INT DETERMINISTIC
BEGIN
  DECLARE diferencia INT;
  SET diferencia = TIMESTAMPDIFF(HOUR, horaInicio, horaFin);
  RETURN diferencia;
END;
`;
async function executeScript() {
  try {
    const connection = await pool.getConnection();
    await connection.query(funcionSQL);
    connection.release();
    console.log("La función se creó correctamente.");
  } catch (error) {
    console.error("Error al ejecutar el script SQL:", error);
  }
}

module.exports = {
  createDatabase,
  createTables,
  insertData,
  executeScript,
  pool,
};

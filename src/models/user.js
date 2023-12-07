const mysql = require("mysql2/promise");
const bcrypt = require("bcrypt-nodejs");
//const crypto = require("crypto"); //gravatar

// Configuración de la conexión a la base de datos
const connection = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "1Q2W3E4R",
  database: "calendar",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Crear una tabla llamada 'users' en la base de datos
const createTableQuery = `
  CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255),
    email VARCHAR(255) UNIQUE,
    password VARCHAR(255) NOT NULL,
    signupDate DATETIME DEFAULT CURRENT_TIMESTAMP,
    lastLogin DATETIME
  )
`;

// Ejecutar la creación de la tabla
connection.query(createTableQuery).then(() => {
    console.log("La tabla users se ha creado correctamente.");
  }).catch((error) => {
    console.error("Error al crear la tabla users:", error);
  });

// Definir el modelo del usuario
class User {
  constructor(userData) {
    this.name = userData.name;
    this.email = userData.email;
    this.password = userData.password;
    this.signupDate = userData.signupDate || new Date();
    this.lastLogin = userData.lastLogin;
  }

  async save() {
    const saltRounds = 10;
    const salt = bcrypt.genSaltSync(saltRounds);
    const hashedPassword = bcrypt.hashSync(this.password, salt);

    const insertUserQuery = `
      INSERT INTO users (name, email, password, signupDate, lastLogin)
      VALUES (?, ?, ?, ?, ?)
    `;

    const insertUserValues = [
      this.name,
      this.email,
      hashedPassword,
      this.signupDate,
      this.lastLogin,
    ];

    try {
      const [result] = await connection.query(
        insertUserQuery,
        insertUserValues
      );
      console.log("Usuario insertado correctamente. ID:", result.insertId);
    } catch (error) {
      console.error("Error al insertar el usuario:", error);
    }
  }
  /*
  gravatar() {
    if (!this.email) return `https://gravatar.com/avatar/?s=200&d=retro`;

    const md5 = crypto.createHash("md5").update(this.email).digest("hex");
    return `https://gravatar.com/avatar/${md5}?s=200&d=retro`;
  }*/
}

/* Ejemplo de uso
const exampleUser = new User({
  name: "Example User",
  email: "example@example.com",
  password: "password123",
});

exampleUser.save();*/
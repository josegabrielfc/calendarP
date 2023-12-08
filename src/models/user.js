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

// Definir el modelo del usuario
class User {
  constructor(userData) {
    this.name = userData.name;
    this.email = userData.email;
    this.password = userData.password;
  }

  async save() {
    const saltRounds = 10;
    const salt = bcrypt.genSaltSync(saltRounds);
    const hashedPassword = bcrypt.hashSync(this.password, salt);

    const insertUserQuery = `
      INSERT INTO users (name, email, password)
      VALUES (?, ?, ?)
    `;

    const insertUserValues = [
      this.name,
      this.email,
      hashedPassword,
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
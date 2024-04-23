drop database if exists calendar;
create database if not exists calendar;
use calendar;

CREATE TABLE IF NOT EXISTS Usuario (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255),
    email VARCHAR(255),
    password VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS Materia (
    id INT PRIMARY KEY,
    name VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS Grupo (id CHAR(1) PRIMARY KEY);

CREATE TABLE IF NOT EXISTS Materia_grupo (
    materia_id INT,
    grupo_id CHAR(1),
    PRIMARY KEY (materia_id, grupo_id),
    FOREIGN KEY (materia_id) REFERENCES Materia(id),
    FOREIGN KEY (grupo_id) REFERENCES Grupo(id)
);

CREATE TABLE IF NOT EXISTS Horario (
    id INT AUTO_INCREMENT PRIMARY KEY,
    materia_id INT,
    grupo_id CHAR(1),
    dia VARCHAR(50),
    hora_inicio TIME,
    hora_fin TIME,
    salon VARCHAR(50),
    FOREIGN KEY (materia_id) REFERENCES Materia_grupo(materia_id),
    FOREIGN KEY (grupo_id) REFERENCES Materia_grupo(grupo_id)
);

CREATE TABLE IF NOT EXISTS Seleccionar (
    id INT AUTO_INCREMENT PRIMARY KEY,
    horario_id INT,
    FOREIGN KEY (horario_id) REFERENCES Horario(id),
    materia_id INT,
    grupo_id CHAR(1),
    dia VARCHAR(50),
    hora_inicio TIME,
    hora_fin TIME,
    salon VARCHAR(50),
    CONSTRAINT unique_combination UNIQUE (materia_id, grupo_id)
);

CREATE TABLE IF NOT EXISTS Document (
    id INT AUTO_INCREMENT PRIMARY KEY,
    userId INT,
    filename VARCHAR(255),
    path VARCHAR(255),
    FOREIGN KEY (userId) REFERENCES Usuario(id)
);

CREATE TABLE IF NOT EXISTS Document_horario (
    id INT AUTO_INCREMENT PRIMARY KEY,
    documentId INT,
    horarioId INT,
    FOREIGN KEY (documentId) REFERENCES Document(id),
    FOREIGN KEY (horarioId) REFERENCES Horario(id)
);

DELIMITER //

CREATE FUNCTION calcDiffHoras(
  horaInicio TIME,
  horaFin TIME
) RETURNS INT DETERMINISTIC
BEGIN
  DECLARE diferencia INT;
  SET diferencia = TIMESTAMPDIFF(HOUR, horaInicio, horaFin);
  RETURN diferencia;
END//

DELIMITER ;
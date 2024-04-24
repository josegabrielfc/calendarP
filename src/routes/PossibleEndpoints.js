router.get("/materias_sem/:idS", async (req, res) => {
  try {
    const [idS] = req.params.idS;
    const query = `SELECT id FROM Materia  WHERE CAST(SUBSTRING(id, 5, 1) AS SIGNED) = ? `;
    const [result] = await pool.query(query, [idS]);
    console.log("Resultados de la consulta:", result);
    res.json({ Semestre: result });
  } catch (error) {
    console.error("Error al obtener la lista de materias:", error);
    res.status(500).send("Error interno del servidor.");
  }
});

router.get("/horario/:materiaId/:grupoId", async (req, res) => {
  try {
    const { materiaId, grupoId } = req.params;

    const query = `
        SELECT id, dia, hora_inicio, hora_fin
        FROM Horario
        WHERE materia_id = ? AND grupo_id = ? AND hora_fin - hora_inicio >= 2;
      `;

    const [horarios] = await pool.query(query, [materiaId, grupoId]);

    res.json({ horarios });
  } catch (error) {
    console.error("Error al obtener los horarios:", error);
    res.status(500).send("Error interno del servidor.");
  }
});

//Editar horario segun materia y grupo
router.put(
  "/horario/:materiaId/:grupoId/:oldHorarioId/:newHorarioId",
  async (req, res) => {
    try {
      const { materiaId, grupoId, oldHorarioId, newHorarioId } = req.params;
      //const { dia, hora_inicio, hora_fin } = req.body;

      // Consulta para obtener los valores actuales del horario
      const selectQuery = `
        SELECT dia, hora_inicio, hora_fin
        FROM Horario
        WHERE id = ? AND materia_id = ? AND grupo_id = ?;
      `;

      const [result] = await pool.query(selectQuery, [
        newHorarioId,
        materiaId,
        grupoId,
      ]);

      if (result.length === 0) {
        return res.status(400).json({
          error:
            "El horario seleccionado no pertenece a la materia y grupo especificados.",
        });
      }

      const { dia, hora_inicio, hora_fin } = result[0];

      // Realizar la actualización en la tabla Seleccionar
      const updateQuery = `
        UPDATE Seleccionar
        SET horario_id = ?, dia = ?, hora_inicio = ?, hora_fin = ?
        WHERE horario_id = ? AND materia_id = ? AND grupo_id = ?;
      `;

      await pool.query(updateQuery, [
        newHorarioId,
        dia,
        hora_inicio,
        hora_fin,
        oldHorarioId,
        materiaId,
        grupoId,
      ]);

      const selectAfterUpdateQuery = `
        SELECT *
        FROM Seleccionar
        WHERE materia_id = ? AND grupo_id = ? AND horario_id = ?;
      `;

      const [resultAfterUpdate] = await pool.query(selectAfterUpdateQuery, [
        materiaId,
        grupoId,
        newHorarioId,
      ]);

      const horario = resultAfterUpdate[0];

      res.json({ horario });
      //res.json({ success: true, message: "Información actualizada correctamente." });
    } catch (error) {
      console.error("Error al actualizar la información:", error);
      res.status(500).send("Error interno del servidor.");
    }
  }
);

router.post("/select-horario", async (req, res) => {
  try {
    const { materia_id, grupo_id, dia, hora_inicio, hora_fin } = req.body;

    const query = `
          SELECT id
          FROM Horario
          WHERE materia_id = ? AND grupo_id = ? AND dia = ? AND hora_inicio = ? AND hora_fin = ? AND hora_fin - hora_inicio >= 2;
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

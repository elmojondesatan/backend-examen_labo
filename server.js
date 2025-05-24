const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');

const app = express();

app.use(cors({
  origin: 'http://127.0.0.1:5500'
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'alonsov1234',
  database: 'examenlaboratorio'
});

db.connect((err) => {
  if (err) {
    console.error('Error de conexión a la base de datos:', err);
    return;
  }
  console.log('Conexión exitosa a la base de datos');
});

// Registro
app.post("/register", (req, res) => {
  const { usuario, nombre, correo, telefono, clave } = req.body;

  const checkQuery = `SELECT * FROM profesor WHERE correo = ?`;
  db.query(checkQuery, [correo], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Error en la base de datos' });
    }

    if (results.length > 0) {
      return res.status(400).json({ message: 'El correo ya está registrado' });
    }

    const query = `INSERT INTO profesor (usuario, nombre, correo, telefono, clave) VALUES (?, ?, ?, ?, ?)`;
    db.query(query, [usuario, nombre, correo, telefono, clave], (error) => {
      if (error) {
        console.error(error);
        return res.status(500).json({ message: 'Error al registrar el profesor' });
      }
      res.json({ message: 'Profesor registrado exitosamente' });
    });
  });
});

// Login
app.post('/login', (req, res) => {
  const { correo, clave } = req.body;

  const query = 'SELECT * FROM profesor WHERE correo = ?';
  db.query(query, [correo], (err, results) => {
    if (err) {
      console.error('Error de conexión:', err);
      return res.status(500).json({ message: 'Error en el servidor' });
    }

    if (results.length === 0) {
      return res.status(401).json({ message: 'Usuario no encontrado' });
    }

    const user = results[0];

    if (user.clave === clave) {
      return res.json({ message: 'Login exitoso' });
    } else {
      return res.status(401).json({ message: 'Contraseña incorrecta' });
    }
  });
});

// Recuperación de contraseña
app.post("/recuperar", (req, res) => {
  const { correo } = req.body;

  const buscarUsuario = 'SELECT * FROM profesor WHERE correo = ?';
  db.query(buscarUsuario, [correo], (err, result) => {
    if (err) {
      console.error('Error en la base de datos:', err);
      return res.status(500).json({ message: "Error del servidor" });
    }

    if (result.length === 0) {
      return res.status(404).json({ message: "Correo no encontrado" });
    }

    // Generación de nueva contraseña temporal
    const nuevaClave = Math.random().toString(36).slice(2, 10);

    const actualizarClave = 'UPDATE profesor SET clave = ? WHERE correo = ?';
    db.query(actualizarClave, [nuevaClave, correo], (err2) => {
      if (err2) {
        console.error('Error al actualizar la clave:', err2);
        return res.status(500).json({ message: "Error al actualizar clave" });
      }

      // Responder al frontend con la nueva clave
      return res.json({ message: 'Contraseña actualizada', nuevaClave });
    });
  });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});

module.exports = app;

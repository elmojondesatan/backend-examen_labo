const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');

// Crear una instancia de la aplicación Express
const app = express();

// Usar CORS para permitir solicitudes desde el frontend
app.use(cors({
  origin: 'http://127.0.0.1:5500' // Ajusta este origen al de tu frontend
}));

// Middlewares para la configuración básica de Express
app.use(express.json()); // Para parsear JSON en las solicitudes
app.use(express.urlencoded({ extended: false })); // Para parsear formularios

// Crear conexión a la base de datos MySQL
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',    // Cambia esto según tu configuración
  password: 'alonsov1234',    // Cambia esto según tu configuración
  database: 'examenlaboratorio'  // Nombre de tu base de datos
});

db.connect((err) => {
  if (err) {
    console.error('Error de conexión a la base de datos:', err);
    return;
  }
  console.log('Conexión exitosa a la base de datos');
});

app.post("/register", (req, res) => {
  const { usuario, nombre, correo, telefono, clave } = req.body;

  // Verifica si el correo ya está registrado
  const checkQuery = `SELECT * FROM profesor WHERE correo = ?`;
  db.query(checkQuery, [correo], (err, results) => {
      if (err) {
          console.error(err);
          return res.status(500).json({ message: 'Error en la base de datos' });
      }

      if (results.length > 0) {
          return res.status(400).json({ message: 'El correo ya está registrado' });
      }

      // Si no está registrado, inserta el nuevo profesor
      const query = `INSERT INTO profesor (usuario, nombre, correo, telefono, clave) VALUES (?, ?, ?, ?, ?)`;
      db.query(query, [usuario, nombre, correo, telefono, clave], (error, result) => {
          if (error) {
              console.error(error);
              return res.status(500).json({ message: 'Error al registrar el profesor' });
          }
          res.json({ message: 'Profesor registrado exitosamente' });
      });
  });
});

// Ruta para iniciar sesión
app.post('/login', (req, res) => {
  const { correo, clave } = req.body;

  // Consulta para buscar el usuario por correo
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

      // Verificar que la contraseña sea correcta
      if (user.clave === clave) {
          return res.json({ message: 'Login exitoso' });
      } else {
          return res.status(401).json({ message: 'Contraseña incorrecta' });
      }
  });
});




// Configurar el puerto en el que se escucharán las solicitudes
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});

module.exports = app;

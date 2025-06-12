require('dotenv').config(); // Carga variables desde .env

const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();

// Configuración
const PORT = 3000;
<<<<<<< HEAD
const JWT_SECRET = process.env.JWT_SECRET;

// Middlewares
app.use(cors({
  origin: 'http://127.0.0.1:5500'
=======
const JWT_SECRET = 'patopato'; 

// Middlewares
app.use(cors({
  origin: 'http://127.0.0.1:5500' 
>>>>>>> 7d17f8c (Terminado y corregidos errores)
}));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

<<<<<<< HEAD
// Conexión a MySQL (Clever Cloud)
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  multipleStatements: true
=======
// Conexión a MySQL
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'alonsov1234',
  database: 'examenlaboratorio',
  multipleStatements: true 
>>>>>>> 7d17f8c (Terminado y corregidos errores)
});

db.connect((err) => {
  if (err) {
    console.error('Error de conexión a la base de datos:', err);
    return;
  }
  console.log('Conexión exitosa a la base de datos');
});

<<<<<<< HEAD
=======

>>>>>>> 7d17f8c (Terminado y corregidos errores)
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

<<<<<<< HEAD
=======

>>>>>>> 7d17f8c (Terminado y corregidos errores)
app.post("/register", async (req, res) => {
  const { usuario, nombre, correo, telefono, clave } = req.body;

  if (!usuario || !nombre || !correo || !clave) {
    return res.status(400).json({ message: 'Todos los campos son requeridos' });
  }

  try {
<<<<<<< HEAD
    const checkQuery = `SELECT * FROM profesor WHERE correo = ?`;
=======
    // Verificar si el correo ya existe
    const checkQuery = SELECT * FROM profesor WHERE correo = ?;
>>>>>>> 7d17f8c (Terminado y corregidos errores)
    db.query(checkQuery, [correo], async (err, results) => {
      if (err) return res.status(500).json({ message: 'Error en la base de datos' });

      if (results.length > 0) {
        return res.status(400).json({ message: 'El correo ya está registrado' });
      }

<<<<<<< HEAD
      const hashedPassword = await bcrypt.hash(clave, 10);

      const query = `INSERT INTO profesor (usuario, nombre, correo, telefono, clave) VALUES (?, ?, ?, ?, ?)`;
      db.query(query, [usuario, nombre, correo, telefono, hashedPassword], (error, results) => {
        if (error) return res.status(500).json({ message: 'Error al registrar el profesor' });
        
        const token = jwt.sign(
          { id: results.insertId, correo, nombre },
          JWT_SECRET,
          { expiresIn: '24h' }
        );
        
        res.json({
=======
  
      const hashedPassword = await bcrypt.hash(clave, 10);

    
      const query = INSERT INTO profesor (usuario, nombre, correo, telefono, clave) VALUES (?, ?, ?, ?, ?);
      db.query(query, [usuario, nombre, correo, telefono, hashedPassword], (error, results) => {
        if (error) return res.status(500).json({ message: 'Error al registrar el profesor' });
        
     
        const token = jwt.sign(
          { id: results.insertId, correo, nombre }, 
          JWT_SECRET, 
          { expiresIn: '24h' }
        );
        
        res.json({ 
>>>>>>> 7d17f8c (Terminado y corregidos errores)
          message: 'Profesor registrado exitosamente',
          token,
          user: { id: results.insertId, nombre, correo, usuario }
        });
      });
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
});

app.post('/login', (req, res) => {
  const { correo, clave } = req.body;

  if (!correo || !clave) {
    return res.status(400).json({ message: 'Correo y contraseña son requeridos' });
  }

  const query = 'SELECT * FROM profesor WHERE correo = ?';
  db.query(query, [correo], async (err, results) => {
    if (err) return res.status(500).json({ message: 'Error en el servidor' });

    if (results.length === 0) {
      return res.status(401).json({ message: 'Credenciales incorrectas' });
    }

    const user = results[0];

    try {
<<<<<<< HEAD
      const match = await bcrypt.compare(clave, user.clave);
      
      if (match) {
        const token = jwt.sign(
          { id: user.id, correo: user.correo, nombre: user.nombre },
          JWT_SECRET,
          { expiresIn: '24h' }
        );
        
        return res.json({
=======
      // Comparar contraseña hasheada
      const match = await bcrypt.compare(clave, user.clave);
      
      if (match) {
        // Generar token JWT
        const token = jwt.sign(
          { id: user.id, correo: user.correo, nombre: user.nombre }, 
          JWT_SECRET, 
          { expiresIn: '24h' }
        );
        
        return res.json({ 
>>>>>>> 7d17f8c (Terminado y corregidos errores)
          message: 'Login exitoso',
          token,
          user: { id: user.id, nombre: user.nombre, correo: user.correo, usuario: user.usuario }
        });
      } else {
        return res.status(401).json({ message: 'Credenciales incorrectas' });
      }
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Error en el servidor' });
    }
  });
});

<<<<<<< HEAD
=======
// Ruta para recuperar contraseña
>>>>>>> 7d17f8c (Terminado y corregidos errores)
app.post('/recuperar', (req, res) => {
  const { correo } = req.body;
  
  if (!correo) {
    return res.status(400).json({ message: 'Correo es requerido' });
  }

<<<<<<< HEAD
=======
  // Verificar si el correo existe
>>>>>>> 7d17f8c (Terminado y corregidos errores)
  const query = 'SELECT * FROM profesor WHERE correo = ?';
  db.query(query, [correo], (err, results) => {
    if (err) return res.status(500).json({ message: 'Error en el servidor' });

    if (results.length === 0) {
      return res.status(404).json({ message: 'Correo no encontrado' });
    }

<<<<<<< HEAD
=======
    // En producción, aquí enviarías un correo con un enlace para restablecer la contraseña
    // Por ahora solo simulamos el envío
    
>>>>>>> 7d17f8c (Terminado y corregidos errores)
    return res.json({ message: 'Correo enviado' });
  });
});

<<<<<<< HEAD
app.use(authenticateToken);

// Obtener alumnos por grado y sección
=======
// Rutas protegidas (requieren autenticación)
app.use(authenticateToken);

// Ruta para obtener todos los alumnos
>>>>>>> 7d17f8c (Terminado y corregidos errores)
app.get('/alumnos', (req, res) => {
  const { grado, seccion } = req.query;
  
  if (!grado || !seccion) {
    return res.status(400).json({ message: 'Grado y sección son requeridos' });
  }

  const query = 'SELECT * FROM alumnos WHERE grado = ? AND seccion = ?';
  db.query(query, [grado, seccion], (err, results) => {
    if (err) return res.status(500).json({ message: 'Error al obtener alumnos' });
    res.json(results);
  });
});

<<<<<<< HEAD
// Agregar alumno
=======
// Ruta para agregar un nuevo alumno
>>>>>>> 7d17f8c (Terminado y corregidos errores)
app.post('/alumnos', (req, res) => {
  const { nombre, clave, correo, grado, seccion } = req.body;
  
  if (!nombre || !clave || !grado || !seccion) {
    return res.status(400).json({ message: 'Nombre, clave, grado y sección son requeridos' });
  }

  const query = 'INSERT INTO alumnos (nombre, clave, correo, grado, seccion) VALUES (?, ?, ?, ?, ?)';
  db.query(query, [nombre, clave, correo, grado, seccion], (err, results) => {
    if (err) return res.status(500).json({ message: 'Error al agregar alumno' });
    
<<<<<<< HEAD
    res.json({
=======
    res.json({ 
>>>>>>> 7d17f8c (Terminado y corregidos errores)
      success: true,
      alumno: {
        id: results.insertId,
        nombre,
        clave,
        correo,
        grado,
        seccion
      }
    });
  });
});

<<<<<<< HEAD
// Registrar asistencia
=======
// Ruta para registrar asistencia
>>>>>>> 7d17f8c (Terminado y corregidos errores)
app.post('/asistencia', (req, res) => {
  const { alumno_id, estado, fecha, grado, seccion } = req.body;
  
  if (!alumno_id || !estado || !fecha || !grado || !seccion) {
    return res.status(400).json({ message: 'Todos los campos son requeridos' });
  }

<<<<<<< HEAD
=======
  // Primero verificamos que el alumno existe
>>>>>>> 7d17f8c (Terminado y corregidos errores)
  const checkQuery = 'SELECT nombre FROM alumnos WHERE id = ?';
  db.query(checkQuery, [alumno_id], (err, results) => {
    if (err) return res.status(500).json({ message: 'Error en la base de datos' });
    
    if (results.length === 0) {
      return res.status(404).json({ message: 'Alumno no encontrado' });
    }

    const alumnoNombre = results[0].nombre;
<<<<<<< HEAD

=======
    
    // Insertar asistencia
>>>>>>> 7d17f8c (Terminado y corregidos errores)
    const insertQuery = 'INSERT INTO asistencia (alumno_id, estado, fecha, grado, seccion) VALUES (?, ?, ?, ?, ?)';
    db.query(insertQuery, [alumno_id, estado, fecha, grado, seccion], (err, results) => {
      if (err) return res.status(500).json({ message: 'Error al registrar asistencia' });
      
<<<<<<< HEAD
      res.json({
=======
      res.json({ 
>>>>>>> 7d17f8c (Terminado y corregidos errores)
        success: true,
        nombre: alumnoNombre
      });
    });
  });
});

<<<<<<< HEAD
// Reporte de asistencia
=======
// Ruta para obtener reporte de asistencia
>>>>>>> 7d17f8c (Terminado y corregidos errores)
app.get('/asistencia/reporte', (req, res) => {
  const { grado, seccion, fecha } = req.query;
  
  if (!grado || !seccion) {
    return res.status(400).json({ message: 'Grado y sección son requeridos' });
  }

<<<<<<< HEAD
  let query = `
=======
  let query = 
>>>>>>> 7d17f8c (Terminado y corregidos errores)
    SELECT a.nombre, asis.estado, asis.fecha 
    FROM asistencia asis
    JOIN alumnos a ON asis.alumno_id = a.id
    WHERE asis.grado = ? AND asis.seccion = ?
<<<<<<< HEAD
  `;
=======
  ;
>>>>>>> 7d17f8c (Terminado y corregidos errores)
  
  const params = [grado, seccion];
  
  if (fecha) {
    query += ' AND asis.fecha = ?';
    params.push(fecha);
  }
  
  db.query(query, params, (err, results) => {
    if (err) return res.status(500).json({ message: 'Error al obtener reporte' });
    res.json(results);
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(Servidor escuchando en http://localhost:${PORT});
});

module.exports = app;

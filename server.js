require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise'); // Usamos la versión promise
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'tu_clave_secreta';

app.use(cors({ origin: '*' }));
app.use(express.json());

// Configuración de la conexión a MySQL
const dbConfig = {
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DB || 'asistencia_escolar',
  port: process.env.MYSQL_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

const pool = mysql.createPool(dbConfig);

// Middleware de autenticación
const autenticar = async (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Acceso no autorizado' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Token inválido' });
  }
};

// Endpoint para obtener niveles
app.get('/api/niveles', async (req, res) => {
  try {
    const [niveles] = await pool.query('SELECT * FROM niveles');
    res.json(niveles);
  } catch (err) {
    console.error('Error al obtener niveles:', err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// Endpoint para obtener grados por nivel
app.get('/api/grados/:nivelId', async (req, res) => {
  try {
    const [grados] = await pool.query(
      'SELECT * FROM grados WHERE nivel_id = ?',
      [req.params.nivelId]
    );
    res.json(grados);
  } catch (err) {
    console.error('Error al obtener grados:', err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// Endpoint para obtener secciones por grado
app.get('/api/secciones/:gradoId', async (req, res) => {
  try {
    const [secciones] = await pool.query(
      'SELECT * FROM secciones WHERE grado_id = ?',
      [req.params.gradoId]
    );
    res.json(secciones);
  } catch (err) {
    console.error('Error al obtener secciones:', err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// Endpoint para obtener estudiantes por grado y sección
app.get('/api/estudiantes', autenticar, async (req, res) => {
  const { grado, seccion } = req.query;

  try {
    const [estudiantes] = await pool.query(`
      SELECT e.id, e.nombre, e.correo 
      FROM estudiantes e
      JOIN secciones s ON e.seccion_id = s.id
      JOIN grados g ON s.grado_id = g.id
      WHERE g.nombre = ? AND s.nombre = ? AND e.activo = 1
    `, [grado, seccion]);

    res.json(estudiantes);
  } catch (err) {
    console.error('Error al obtener estudiantes:', err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// Endpoint para guardar asistencias
app.post('/api/asistencias', autenticar, async (req, res) => {
  const { estudiantes, fecha, grado, seccion } = req.body;
  const registrado_por = req.user.id;

  if (!estudiantes || !fecha || !grado || !seccion) {
    return res.status(400).json({ error: 'Datos incompletos' });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Primero obtenemos el ID de la sección
    const [secciones] = await connection.query(`
      SELECT s.id 
      FROM secciones s
      JOIN grados g ON s.grado_id = g.id
      WHERE g.nombre = ? AND s.nombre = ?
    `, [grado, seccion]);

    if (secciones.length === 0) {
      throw new Error('Sección no encontrada');
    }

    const seccion_id = secciones[0].id;

    // Insertamos todas las asistencias
    for (const estudiante of estudiantes) {
      await connection.query(`
        INSERT INTO asistencias 
        (estudiante_id, seccion_id, fecha, estado, tarde, observaciones, registrado_por) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        estudiante.id,
        seccion_id,
        fecha,
        estudiante.estado,
        estudiante.tarde || false,
        estudiante.observaciones || null,
        registrado_por
      ]);
    }

    await connection.commit();
    res.status(201).json({ mensaje: 'Asistencias guardadas correctamente' });
  } catch (err) {
    await connection.rollback();
    console.error('Error al guardar asistencias:', err);
    res.status(500).json({ error: 'Error al guardar asistencias' });
  } finally {
    connection.release();
  }
});

// Endpoint para login
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const [usuarios] = await pool.query(
      'SELECT * FROM usuarios WHERE correo = ?',
      [email]
    );

    if (usuarios.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const usuario = usuarios[0];
    const passwordValida = await bcrypt.compare(password, usuario.contraseña);

    if (!passwordValida) {
      return res.status(401).json({ error: 'Contraseña incorrecta' });
    }

    const token = jwt.sign(
      { id: usuario.id, nombre: usuario.nombre, rol: usuario.rol },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      token,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        correo: usuario.correo,
        rol: usuario.rol
      }
    });
  } catch (err) {
    console.error('Error en login:', err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// Iniciar servidor
app.listen(PORT, async () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  
  // Crear tablas si no existen (solo para desarrollo)
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS asistencias (
        id INT AUTO_INCREMENT PRIMARY KEY,
        estudiante_id INT NOT NULL,
        seccion_id INT NOT NULL,
        fecha DATE NOT NULL,
        estado ENUM('presente', 'ausente') NOT NULL,
        tarde BOOLEAN DEFAULT FALSE,
        observaciones VARCHAR(255),
        registrado_por INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (estudiante_id) REFERENCES estudiantes(id),
        FOREIGN KEY (seccion_id) REFERENCES secciones(id),
        FOREIGN KEY (registrado_por) REFERENCES usuarios(id)
      )
    `);
    console.log('✅ Tablas verificadas');
  } catch (err) {
    console.error('Error al verificar tablas:', err);
  }
});
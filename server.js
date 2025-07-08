const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json());

// Base de datos con pool de conexiones
const pool = mysql.createPool({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DB,
  port: process.env.MYSQL_PORT,
  waitForConnections: true,
  connectionLimit: 10,
});

// Middleware para autenticar con JWT
function autenticar(req, res, next) {
  const token = req.headers.authorization;
  if (!token) return res.status(401).json({ error: 'Token no proporcionado' });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Token inválido' });
    req.user = user;
    next();
  });
}

// Endpoint base
app.get('/', (req, res) => {
  res.send('✅ API funcionando correctamente');
});

// Registro de usuario
app.post('/api/register', async (req, res) => {
  const { nombre, email, password, rol } = req.body;

  if (!nombre || !email || !password || !rol) {
    return res.status(400).json({ message: 'Todos los campos son obligatorios' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await pool.query(
      'INSERT INTO usuarios (nombre, correo, contraseña, rol) VALUES (?, ?, ?, ?)',
      [nombre, email, hashedPassword, rol]
    );

    res.status(200).json({ message: 'Registro exitoso', id: result.insertId });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'Correo ya registrado' });
    }
    res.status(500).json({ message: 'Error al procesar el registro', error: err });
  }
});

// Login de usuario
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const [usuarios] = await pool.query(
      'SELECT * FROM usuarios WHERE correo = ?',
      [email]
    );

    if (usuarios.length === 0) return res.status(404).json({ message: 'Usuario no encontrado' });

    const user = usuarios[0];
    const validPassword = await bcrypt.compare(password, user.contraseña);

    if (!validPassword) return res.status(401).json({ message: 'Contraseña incorrecta' });

    const token = jwt.sign(
      { id: user.id, nombre: user.nombre, rol: user.rol },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.status(200).json({
      message: 'Login exitoso',
      token,
      nombre: user.nombre,
      rol: user.rol
    });
  } catch (err) {
    res.status(500).json({ message: 'Error al iniciar sesión', error: err });
  }
});

// Obtener niveles
app.get("/api/niveles", async (req, res) => {
  try {
    const [results] = await pool.query("SELECT * FROM niveles");
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: "Error al obtener niveles" });
  }
});

// Obtener grados por nivel
app.get("/api/grados/:nivel_id", async (req, res) => {
  const { nivel_id } = req.params;
  try {
    const [results] = await pool.query("SELECT * FROM grados WHERE nivel_id = ?", [nivel_id]);
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: "Error al obtener grados" });
  }
});

// Obtener secciones por grado
app.get("/api/secciones/:grado_id", async (req, res) => {
  const { grado_id } = req.params;
  try {
    const [results] = await pool.query("SELECT * FROM secciones WHERE grado_id = ?", [grado_id]);
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: "Error al obtener secciones" });
  }
});

// Obtener estudiantes por grado y sección
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
    res.status(500).json({ error: 'Error al obtener estudiantes' });
  }
});

// Agregar nuevo estudiante
app.post('/api/estudiantes/agregar', autenticar, async (req, res) => {
  const { nombre, correo, nivel, grado, seccion_id } = req.body;

  if (!nombre || !correo || !nivel || !grado || !seccion_id) {
    return res.status(400).json({ error: 'Faltan datos obligatorios' });
  }

  try {
    const [seccionResult] = await pool.query(
      'SELECT id FROM secciones WHERE id = ?',
      [seccion_id]
    );

    if (seccionResult.length === 0) {
      return res.status(404).json({ error: 'Sección no encontrada' });
    }

    const [resultado] = await pool.query(
      `INSERT INTO estudiantes 
        (nombre, correo, nivel, grado, seccion_id, activo) 
       VALUES (?, ?, ?, ?, ?, 1)`,
      [nombre, correo, nivel, grado, seccion_id]
    );

    res.status(201).json({ success: true, id: resultado.insertId });
  } catch (err) {
    res.status(500).json({ error: 'Error al agregar estudiante' });
  }
});

// Guardar asistencias
app.post('/api/asistencias', autenticar, async (req, res) => {
  const { estudiantes, fecha, grado, seccion } = req.body;
  const registrado_por = req.user.id;

  if (!estudiantes || !fecha || !grado || !seccion) {
    return res.status(400).json({ error: 'Datos incompletos' });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [secciones] = await connection.query(`
      SELECT s.id 
      FROM secciones s
      JOIN grados g ON s.grado_id = g.id
      WHERE g.nombre = ? AND s.nombre = ?
    `, [grado, seccion]);

    if (secciones.length === 0) throw new Error('Sección no encontrada');

    const seccion_id = secciones[0].id;

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
    res.status(500).json({ error: 'Error al guardar asistencias' });
  } finally {
    connection.release();
  }
});

// Guardar uniformes
app.post('/api/uniformes', autenticar, async (req, res) => {
  const { estudiante_id, fecha, completo, detalles, partes } = req.body;

  if (!estudiante_id || !fecha || !partes || typeof partes !== 'object') {
    return res.status(400).json({ error: 'Datos incompletos del uniforme' });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [resultado] = await connection.query(`
      INSERT INTO uniformes (estudiante_id, fecha, completo, detalles)
      VALUES (?, ?, ?, ?)
    `, [estudiante_id, fecha, completo, detalles]);

    const uniforme_id = resultado.insertId;

    for (const prenda in partes) {
      await connection.query(`
        INSERT INTO uniforme_partes (uniforme_id, prenda, presente)
        VALUES (?, ?, ?)
      `, [uniforme_id, prenda, partes[prenda]]);
    }

    await connection.commit();
    res.status(201).json({ mensaje: 'Uniforme guardado correctamente' });
  } catch (err) {
    await connection.rollback();
    console.error(err);
    res.status(500).json({ error: 'Error al guardar el uniforme' });
  } finally {
    connection.release();
  }
});


// Verificar tablas necesarias
(async () => {
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
    console.error('❌ Error al verificar tablas:', err);
  }
})();

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});

const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({ origin: '*' })); // Permite conexiones desde cualquier origen (ideal para desarrollo)
app.use(express.json());

// Conexión a la base de datos Clever Cloud
const db = mysql.createConnection({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DB,
  port: process.env.MYSQL_PORT
});

// Verificar conexión
db.connect(err => {
  if (err) {
    console.error('❌ Error de conexión a la base de datos:', err);
  } else {
    console.log('✅ Conectado a la base de datos de Clever Cloud');
  }
});

// Endpoint de prueba
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

    const query = `INSERT INTO usuarios (nombre, correo, contraseña, rol) VALUES (?, ?, ?, ?)`;

    db.query(query, [nombre, email, hashedPassword, rol], (err, result) => {
      if (err) {
        if (err.code === 'ER_DUP_ENTRY') {
          return res.status(400).json({ message: 'Correo ya registrado' });
        }
        return res.status(500).json({ message: 'Error al registrar usuario', error: err });
      }
      res.status(200).json({ message: 'Registro exitoso' });
    });
  } catch (err) {
    res.status(500).json({ message: 'Error al procesar el registro', error: err });
  }
});

// Login de usuario
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;

  db.query(`SELECT * FROM usuarios WHERE correo = ?`, [email], async (err, results) => {
    if (err) return res.status(500).json({ message: 'Error en la base de datos' });
    if (results.length === 0) return res.status(404).json({ message: 'Usuario no encontrado' });

    const user = results[0];

    const validPassword = await bcrypt.compare(password, user.contraseña);
    if (!validPassword) return res.status(401).json({ message: 'Contraseña incorrecta' });

    const token = jwt.sign(
      { id: user.id, rol: user.rol },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.status(200).json({
      message: 'Login exitoso',
      token,
      nombre: user.nombre,
      rol: user.rol
    });
  });
});


app.get("/api/niveles", (req, res) => {
  db.query("SELECT * FROM niveles", (err, results) => {
    if (err) return res.status(500).json({ error: "Error al obtener niveles" });
    res.json(results);
  });
});

app.get("/api/grados/:nivel_id", (req, res) => {
  const { nivel_id } = req.params;
  db.query("SELECT * FROM grados WHERE nivel_id = ?", [nivel_id], (err, results) => {
    if (err) return res.status(500).json({ error: "Error al obtener grados" });
    res.json(results);
  });
});

app.get("/api/secciones/:grado_id", (req, res) => {
  const { grado_id } = req.params;
  db.query("SELECT * FROM secciones WHERE grado_id = ?", [grado_id], (err, results) => {
    if (err) return res.status(500).json({ error: "Error al obtener secciones" });
    res.json(results);
  });
});



// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});


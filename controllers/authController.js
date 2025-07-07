const db = require('../db');
const bcrypt = require('bcrypt');

// LOGIN
exports.login = (req, res) => {
  const { correo, contraseña } = req.body;

  if (!correo || !contraseña) {
    return res.status(400).json({ mensaje: 'Correo y contraseña son requeridos' });
  }

  const sql = 'SELECT * FROM usuarios WHERE correo = ?';

  db.query(sql, [correo], async (err, resultados) => {
    if (err) return res.status(500).json({ mensaje: 'Error en el servidor', error: err });

    if (resultados.length === 0) {
      return res.status(401).json({ mensaje: 'Correo no registrado' });
    }

    const usuario = resultados[0];

    const contraseñaValida = await bcrypt.compare(contraseña, usuario.contraseña);
    if (!contraseñaValida) {
      return res.status(401).json({ mensaje: 'Contraseña incorrecta' });
    }

    res.json({
      mensaje: 'Login exitoso',
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        rol: usuario.rol,
        correo: usuario.correo
      }
    });
  });
};

// REGISTRO
exports.register = async (req, res) => {
  const { nombre, correo, contraseña, rol } = req.body;

  if (!nombre || !correo || !contraseña || !rol) {
    return res.status(400).json({ mensaje: 'Todos los campos son requeridos' });
  }

  db.query('SELECT * FROM usuarios WHERE correo = ?', [correo], async (err, resultados) => {
    if (err) return res.status(500).json({ mensaje: 'Error del servidor', error: err });

    if (resultados.length > 0) {
      return res.status(400).json({ mensaje: 'El correo ya está registrado' });
    }

    const contraseñaHash = await bcrypt.hash(contraseña, 10);

    const insertSql = 'INSERT INTO usuarios (nombre, correo, contraseña, rol) VALUES (?, ?, ?, ?)';
    db.query(insertSql, [nombre, correo, contraseñaHash, rol], (err, resultado) => {
      if (err) return res.status(500).json({ mensaje: 'Error al registrar el usuario', error: err });

      res.status(201).json({ mensaje: 'Usuario registrado correctamente' });
    });
  });
};

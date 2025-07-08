// db.js
const mysql = require('mysql2');

const connection = mysql.createConnection({
  host: 'b5hjho2rkhpqpdw9bbfe-mysql.services.clever-cloud.com',
  user: 'ua4hwwygc1fxp11t',
  password: '3Qk1i017g80CyahaHKHy',
  database: 'b5hjho2rkhpqpdw9bbfe'
});

connection.connect((err) => {
  if (err) {
    console.error('Error al conectar a la base de datos:', err);
    return;
  }
  console.log('Conectado a la base de datos MySQL.');
});

module.exports = connection;
const express = require('express');
const router = express.Router();
const { login, register } = require('../controllers/authController'); // <- Asegúrate de que esto esté bien

router.post('/login', login);
router.post('/register', register); // <-- importante

module.exports = router;

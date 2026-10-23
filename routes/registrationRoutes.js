const express = require('express');
const eventController = require('../controllers/eventController');
const { authenticate } = require('../middlewares/auth');

const router = express.Router();

router.get('/', authenticate, eventController.listMyRegistrations);

module.exports = router;

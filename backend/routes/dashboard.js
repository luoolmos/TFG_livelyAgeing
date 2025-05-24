const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');

// Rutas del dashboard
router.get('/daily-summary', dashboardController.getDailySummary);
router.get('/user-info', dashboardController.getUserInfo);

// GET /api/dashboard/users
router.get('/users', dashboardController.getUsers);

// GET /api/dashboard/devices
router.get('/devices', dashboardController.getDevices);

module.exports = router;
const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');

// GET /api/dashboard/daily-summary
router.get('/daily-summary', dashboardController.getDailySummary);

// GET /api/dashboard/users
router.get('/users', dashboardController.getUsers);

// GET /api/dashboard/devices
router.get('/devices', dashboardController.getDevices);

module.exports = router;
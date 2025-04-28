const express = require('express');
const router = express.Router();
const healthRouter = require('./health');

router.use('/health', healthRouter);

module.exports = router; 
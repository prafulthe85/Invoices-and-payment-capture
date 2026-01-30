
const express = require('express');
const router = express.Router();
const paymentService = require('../services/paymentService');

router.get('/', async (req, res, next) => {
  try {
    const payments = await paymentService.getAll();
    res.json({ success: true, data: payments });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

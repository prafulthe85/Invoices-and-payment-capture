
const express = require('express');
const router = express.Router();
const invoiceService = require('../services/invoiceService');
const paymentService = require('../services/paymentService');

router.get('/', async (req, res, next) => {
  try {
    const status = req.query.status || null;
    const invoices = await invoiceService.getAll(status);
    res.json({ success: true, data: invoices });
  } catch (error) {
    next(error);
  }
});

router.get('/stats', async (req, res, next) => {
  try {
    const stats = await invoiceService.getStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const invoice = await invoiceService.getById(req.params.id);
    res.json({ success: true, data: invoice });
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    if (!req.body.customerName || req.body.customerName.trim() === '') {
      return res.status(400).json({ success: false, error: 'Customer name is required' });
    }
    const result = await invoiceService.create(req.body);
    
    if (result.error) {
      return res.status(400).json({ success: false, error: result.error });
    }
    
    res.status(201).json({ success: true, data: result.data });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/issue', async (req, res) => {
  const result = await invoiceService.issue(req.params.id);
  
  if (result.error) {
    return res.status(400).json({ success: false, error: result.error });
  }
  
  res.json({ success: true, data: result.data });
});

router.post('/:id/void', async (req, res) => {
  const result = await invoiceService.voidInvoice(req.params.id, req.body.reason);
  
  if (result.error) {
    return res.status(400).json({ success: false, error: result.error });
  }
  
  res.json({ success: true, data: result.data });
});

router.get('/:id/payments', async (req, res, next) => {
  try {
    const payments = await paymentService.getByInvoiceId(req.params.id);
    res.json({ success: true, data: payments });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/payments', async (req, res) => {
  const amount = parseFloat(req.body.amount);
  if (!amount || isNaN(amount) || amount <= 0) {
    return res.status(400).json({ success: false, error: 'Valid payment amount is required' });
  }
  
  const result = await paymentService.create({
    invoiceId: req.params.id,
    amount: amount,
    paymentMethod: req.body.paymentMethod || 'CASH',
    referenceNumber: req.body.referenceNumber,
    notes: req.body.notes,
    idempotencyKey: req.body.idempotencyKey
  });

  if (result.error) {
    return res.status(400).json({ success: false, error: result.error });
  }

  res.status(result.isDuplicate ? 200 : 201).json({ 
    success: true, 
    data: result.payment,
    isDuplicate: result.isDuplicate
  });
});

module.exports = router;

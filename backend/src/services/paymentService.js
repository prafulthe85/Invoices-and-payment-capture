
const supabase = require('../db/supabase');

async function getAll() {
  const { data, error } = await supabase
    .from('payments')
    .select('*, invoice:invoices(id, invoice_number)')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

async function getByInvoiceId(invoiceId) {
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('invoice_id', invoiceId)
    .order('payment_date', { ascending: false });

  if (error) throw error;
  return data;
}

async function create(paymentData) {
  const { invoiceId, amount, paymentMethod, referenceNumber, notes, idempotencyKey } = paymentData;

  if (idempotencyKey) {
    const { data: existing } = await supabase
      .from('payments')
      .select('*')
      .eq('idempotency_key', idempotencyKey)
      .single();

    if (existing) {
      console.log('[Payment] Idempotency check: Returning existing payment for key:', idempotencyKey);
      return { payment: existing, isDuplicate: true, error: null };
    }
  }

  const { data: invoice, error: invoiceError } = await supabase
    .from('invoices')
    .select('*')
    .eq('id', invoiceId)
    .single();

  if (invoiceError) {
    console.log('[Payment] Invoice not found:', invoiceId);
    return { payment: null, isDuplicate: false, error: 'Invoice not found' };
  }

  if (invoice.status === 'VOIDED') {
    console.log('[Payment] Rejected: Cannot pay voided invoice');
    return { payment: null, isDuplicate: false, error: 'Cannot pay voided invoice' };
  }
  if (invoice.status === 'DRAFT') {
    console.log('[Payment] Rejected: Invoice must be issued first');
    return { payment: null, isDuplicate: false, error: 'Invoice must be issued first' };
  }
  if (invoice.status === 'PAID') {
    console.log('[Payment] Rejected: Invoice already fully paid');
    return { payment: null, isDuplicate: false, error: 'Invoice already fully paid' };
  }

  const amountPaise = Math.round(amount * 100);
  if (amountPaise > invoice.amount_due) {
    console.log('[Payment] Rejected: Payment exceeds amount due');
    return { payment: null, isDuplicate: false, error: 'Payment exceeds amount due' };
  }

  const { data: payment, error: paymentError } = await supabase
    .from('payments')
    .insert({
      invoice_id: invoiceId,
      amount: amountPaise,
      payment_method: paymentMethod,
      reference_number: referenceNumber || null,
      payment_date: new Date().toISOString().split('T')[0],
      notes: notes || null,
      idempotency_key: idempotencyKey || null
    })
    .select()
    .single();

  if (paymentError) {
    console.log('[Payment] Database error:', paymentError.message);
    return { payment: null, isDuplicate: false, error: paymentError.message };
  }

  const currentVersion = invoice.version || 1;
  const newAmountPaid = invoice.amount_paid + amountPaise;
  const newAmountDue = invoice.total_amount - newAmountPaid;
  const newStatus = newAmountDue <= 0 ? 'PAID' : 'PARTIALLY_PAID';

  const { data: updatedInvoice, error: updateError } = await supabase
    .from('invoices')
    .update({
      amount_paid: newAmountPaid,
      amount_due: newAmountDue,
      status: newStatus,
      version: currentVersion + 1
    })
    .eq('id', invoiceId)
    .eq('version', currentVersion)
    .select()
    .single();

  if (updateError || !updatedInvoice) {
    await supabase.from('payments').delete().eq('id', payment.id);
    console.log('[Payment] Concurrency conflict: Invoice was modified by another user');
    return { payment: null, isDuplicate: false, error: 'Invoice was modified by another user. Please refresh and try again.' };
  }

  console.log('[Payment] Success: Payment recorded for invoice', invoice.invoice_number);
  return { payment, isDuplicate: false, error: null };
}

module.exports = {
  getAll,
  getByInvoiceId,
  create
};

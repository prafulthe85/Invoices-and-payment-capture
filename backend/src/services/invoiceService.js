
const supabase = require('../db/supabase');

async function getAll(status = null) {
  let query = supabase
    .from('invoices')
    .select('*')
    .order('created_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

async function getById(id) {
  const { data, error } = await supabase
    .from('invoices')
    .select('*, line_items:invoice_line_items(*)')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

async function generateInvoiceNumber() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const random = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
  return `INV-${year}${month}-${random}`;
}

async function create(invoiceData) {
  const { customerName, customerEmail, customerPhone, lineItems, discountPercent, taxPercent, notes, dueDate } = invoiceData;

  let subtotal = 0;
  lineItems.forEach(item => {
    subtotal += Math.round(item.quantity * item.unitPrice * 100);
  });

  const discountAmount = Math.round(subtotal * (discountPercent || 0) / 100);
  const afterDiscount = subtotal - discountAmount;
  const taxAmount = Math.round(afterDiscount * (taxPercent || 18) / 100);
  const totalAmount = afterDiscount + taxAmount;

  const invoiceNumber = await generateInvoiceNumber();

  const { data: invoice, error: invoiceError } = await supabase
    .from('invoices')
    .insert({
      invoice_number: invoiceNumber,
      customer_name: customerName || null,
      customer_email: customerEmail || null,
      customer_phone: customerPhone || null,
      subtotal: subtotal,
      discount_percent: discountPercent || 0,
      discount_amount: discountAmount,
      tax_percent: taxPercent || 18,
      tax_amount: taxAmount,
      total_amount: totalAmount,
      amount_paid: 0,
      amount_due: totalAmount,
      status: 'DRAFT',
      issue_date: new Date().toISOString().split('T')[0],
      due_date: dueDate || null,
      notes: notes || null,
      version: 1
    })
    .select()
    .single();

  if (invoiceError) throw invoiceError;

  const lineItemsToInsert = lineItems.map((item, index) => ({
    invoice_id: invoice.id,
    description: item.description,
    quantity: item.quantity,
    unit_price: Math.round(item.unitPrice * 100),
    amount: Math.round(item.quantity * item.unitPrice * 100),
    sort_order: index
  }));

  const { error: lineItemsError } = await supabase
    .from('invoice_line_items')
    .insert(lineItemsToInsert);

  if (lineItemsError) throw lineItemsError;

  console.log('[Invoice] Created:', invoiceNumber);
  return { data: invoice, error: null };
}

async function issue(id) {
  const { data: invoice, error: getError } = await supabase
    .from('invoices')
    .select('*')
    .eq('id', id)
    .single();

  if (getError) {
    console.log('[Invoice] Not found:', id);
    return { data: null, error: 'Invoice not found' };
  }

  if (invoice.status !== 'DRAFT') {
    console.log('[Invoice] Rejected: Only draft invoices can be issued. Current status:', invoice.status);
    return { data: null, error: 'Only draft invoices can be issued' };
  }

  const currentVersion = invoice.version || 1;

  const { data, error } = await supabase
    .from('invoices')
    .update({ 
      status: 'ISSUED', 
      issue_date: new Date().toISOString().split('T')[0],
      version: currentVersion + 1
    })
    .eq('id', id)
    .eq('version', currentVersion)
    .select()
    .single();

  if (error || !data) {
    console.log('[Invoice] Concurrency conflict: Invoice was modified by another user');
    return { data: null, error: 'Invoice was modified by another user. Please refresh.' };
  }
  
  console.log('[Invoice] Issued:', invoice.invoice_number);
  return { data, error: null };
}

async function voidInvoice(id, reason) {
  const { data: invoice, error: getError } = await supabase
    .from('invoices')
    .select('*')
    .eq('id', id)
    .single();

  if (getError) {
    console.log('[Invoice] Not found:', id);
    return { data: null, error: 'Invoice not found' };
  }

  if (invoice.status === 'VOIDED') {
    console.log('[Invoice] Rejected: Invoice already voided');
    return { data: null, error: 'Invoice already voided' };
  }

  if (invoice.amount_paid > 0) {
    console.log('[Invoice] Rejected: Cannot void invoice with payments');
    return { data: null, error: 'Cannot void invoice with payments' };
  }

  const currentVersion = invoice.version || 1;

  const { data, error } = await supabase
    .from('invoices')
    .update({ 
      status: 'VOIDED', 
      void_reason: reason,
      voided_at: new Date().toISOString(),
      version: currentVersion + 1
    })
    .eq('id', id)
    .eq('version', currentVersion)
    .select()
    .single();

  if (error || !data) {
    console.log('[Invoice] Concurrency conflict: Invoice was modified by another user');
    return { data: null, error: 'Invoice was modified by another user. Please refresh.' };
  }

  console.log('[Invoice] Voided:', invoice.invoice_number);
  return { data, error: null };
}

async function getStats() {
  const { data, error } = await supabase
    .from('invoices')
    .select('status, total_amount, amount_paid, amount_due');

  if (error) throw error;

  const stats = {
    total: data.length,
    draft: 0,
    issued: 0,
    partiallyPaid: 0,
    paid: 0,
    voided: 0,
    totalOutstanding: 0,
    totalCollected: 0
  };

  data.forEach(inv => {
    if (inv.status === 'DRAFT') stats.draft++;
    if (inv.status === 'ISSUED') stats.issued++;
    if (inv.status === 'PARTIALLY_PAID') stats.partiallyPaid++;
    if (inv.status === 'PAID') stats.paid++;
    if (inv.status === 'VOIDED') stats.voided++;
    
    if (inv.status !== 'VOIDED') {
      stats.totalOutstanding += inv.amount_due;
      stats.totalCollected += inv.amount_paid;
    }
  });

  return stats;
}

module.exports = {
  getAll,
  getById,
  create,
  issue,
  voidInvoice,
  getStats
};

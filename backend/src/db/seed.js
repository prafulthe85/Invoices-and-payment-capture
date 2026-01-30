
require('dotenv').config();
const supabase = require('./supabase');

async function seed() {
  console.log('Seeding database...');

  try {
    await supabase.from('payments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('invoice_line_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('invoices').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('customers').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    const { data: customers, error: custError } = await supabase
      .from('customers')
      .insert([
        { name: 'Acme Technologies', email: 'billing@acme.com', phone: '+91 98765 43210', gst_number: '29AABCU9603R1ZM' },
        { name: 'Sharma Trading Co', email: 'accounts@sharma.com', phone: '+91 98123 45678', gst_number: '07AADCS1234F1ZK' },
        { name: 'Global Imports Ltd', email: 'finance@global.in', phone: '+91 99887 76655', gst_number: '27AAECG1234H1ZP' }
      ])
      .select();

    if (custError) throw custError;
    console.log('Created 3 customers');

    const { data: invoices, error: invError } = await supabase
      .from('invoices')
      .insert([
        {
          invoice_number: 'INV-202601-0001',
          customer_id: customers[0].id,
          subtotal: 5000000,
          discount_percent: 10,
          discount_amount: 500000,
          tax_percent: 18,
          tax_amount: 810000,
          total_amount: 5310000,
          amount_paid: 5310000,
          amount_due: 0,
          status: 'PAID',
          notes: 'Website development - fully paid'
        },
        {
          invoice_number: 'INV-202601-0002',
          customer_id: customers[1].id,
          subtotal: 2500000,
          discount_percent: 0,
          discount_amount: 0,
          tax_percent: 18,
          tax_amount: 450000,
          total_amount: 2950000,
          amount_paid: 1500000,
          amount_due: 1450000,
          status: 'PARTIALLY_PAID',
          notes: 'Monthly maintenance'
        },
        {
          invoice_number: 'INV-202601-0003',
          customer_id: customers[2].id,
          subtotal: 7500000,
          discount_percent: 5,
          discount_amount: 375000,
          tax_percent: 18,
          tax_amount: 1282500,
          total_amount: 8407500,
          amount_paid: 0,
          amount_due: 8407500,
          status: 'ISSUED',
          notes: 'Consulting services'
        },
        {
          invoice_number: 'INV-202601-0004',
          customer_id: customers[0].id,
          subtotal: 3000000,
          discount_percent: 0,
          discount_amount: 0,
          tax_percent: 18,
          tax_amount: 540000,
          total_amount: 3540000,
          amount_paid: 0,
          amount_due: 3540000,
          status: 'DRAFT',
          notes: 'New project - draft'
        }
      ])
      .select();

    if (invError) throw invError;
    console.log('Created 4 invoices');

    // Create line items
    const lineItems = [
      { invoice_id: invoices[0].id, description: 'Website Design', quantity: 1, unit_price: 3000000, amount: 3000000, sort_order: 0 },
      { invoice_id: invoices[0].id, description: 'Development', quantity: 1, unit_price: 2000000, amount: 2000000, sort_order: 1 },
      { invoice_id: invoices[1].id, description: 'Monthly Maintenance', quantity: 1, unit_price: 2500000, amount: 2500000, sort_order: 0 },
      { invoice_id: invoices[2].id, description: 'Consulting (15 hours)', quantity: 15, unit_price: 500000, amount: 7500000, sort_order: 0 },
      { invoice_id: invoices[3].id, description: 'Mobile App Design', quantity: 1, unit_price: 3000000, amount: 3000000, sort_order: 0 }
    ];

    const { error: lineError } = await supabase.from('invoice_line_items').insert(lineItems);
    if (lineError) throw lineError;
    console.log('Created 5 line items');

    // Create payments
    const payments = [
      { invoice_id: invoices[0].id, amount: 5310000, payment_method: 'BANK_TRANSFER', reference_number: 'NEFT123456', idempotency_key: 'seed-1' },
      { invoice_id: invoices[1].id, amount: 1500000, payment_method: 'UPI', reference_number: 'UPI789012', idempotency_key: 'seed-2' }
    ];

    const { error: payError } = await supabase.from('payments').insert(payments);
    if (payError) throw payError;
    console.log('Created 2 payments');

    console.log('\n✅ Seed completed!');
    console.log('Summary: 3 customers, 4 invoices, 5 line items, 2 payments');

  } catch (error) {
    console.error('Seed failed:', error.message);
    process.exit(1);
  }
}

seed();

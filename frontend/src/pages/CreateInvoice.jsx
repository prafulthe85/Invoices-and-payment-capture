import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createInvoice } from '../api';

function CreateInvoice() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [discountPercent, setDiscountPercent] = useState(0);
  const [taxPercent, setTaxPercent] = useState(18);
  const [notes, setNotes] = useState('');
  const [lineItems, setLineItems] = useState([
    { description: '', quantity: 1, unitPrice: '' }
  ]);

  function addLineItem() {
    setLineItems([...lineItems, { description: '', quantity: 1, unitPrice: '' }]);
  }

  function removeLineItem(index) {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter((_, i) => i !== index));
    }
  }

  function updateLineItem(index, field, value) {
    const updated = [...lineItems];
    updated[index][field] = value;
    setLineItems(updated);
  }

  function calculateTotal() {
    let subtotal = 0;
    lineItems.forEach(item => {
      subtotal += (parseFloat(item.quantity) || 0) * (parseFloat(item.unitPrice) || 0);
    });
    const discount = subtotal * (discountPercent / 100);
    const afterDiscount = subtotal - discount;
    const tax = afterDiscount * (taxPercent / 100);
    return {
      subtotal,
      discount,
      tax,
      total: afterDiscount + tax
    };
  }

  async function handleSubmit(e) {
    e.preventDefault();


    if (!customerName.trim()) {
      setError('Customer name is required');
      return;
    }

    const validItems = lineItems.filter(item => item.description && parseFloat(item.unitPrice) > 0);
    if (validItems.length === 0) {
      setError('Add at least one line item with description and price');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await createInvoice({
        customerName: customerName.trim(),
        customerEmail: customerEmail || null,
        customerPhone: customerPhone || null,
        dueDate: dueDate || null,
        discountPercent: parseFloat(discountPercent) || 0,
        taxPercent: parseFloat(taxPercent) || 18,
        notes: notes || null,
        lineItems: validItems.map(item => ({
          description: item.description,
          quantity: parseFloat(item.quantity) || 1,
          unitPrice: parseFloat(item.unitPrice) || 0
        }))
      });
      navigate(`/invoices/${res.data.data.id}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create invoice');
    } finally {
      setLoading(false);
    }
  }

  const totals = calculateTotal();

  return (
    <div>
      <h1 className="page-title">Create Invoice</h1>

      {error && <div className="error">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
          <div className="card">
            <h3 style={{ marginBottom: '15px' }}>Customer Details</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
              <div className="form-group">
                <label>Customer Name <span style={{ color: '#dc2626' }}>*</span></label>
                <input 
                  type="text" 
                  value={customerName} 
                  onChange={(e) => setCustomerName(e.target.value)} 
                  placeholder="e.g. John Doe"
                  required
                />
              </div>
              <div className="form-group">
                <label>Email (optional)</label>
                <input 
                  type="email" 
                  value={customerEmail} 
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="e.g. john@email.com"
                />
              </div>
              <div className="form-group">
                <label>Phone (optional)</label>
                <input 
                  type="text" 
                  value={customerPhone} 
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="e.g. 9876543210"
                />
              </div>
            </div>

            <h3 style={{ marginTop: '20px', marginBottom: '15px' }}>Invoice Details</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
              <div className="form-group">
                <label>Due Date</label>
                <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Discount %</label>
                <input type="number" value={discountPercent} onChange={(e) => setDiscountPercent(e.target.value)} min="0" max="100" />
              </div>
              <div className="form-group">
                <label>Tax %</label>
                <input type="number" value={taxPercent} onChange={(e) => setTaxPercent(e.target.value)} min="0" max="100" />
              </div>
            </div>
            <div className="form-group">
              <label>Notes</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows="2" />
            </div>
          </div>

          <div className="card">
            <h3 style={{ marginBottom: '15px' }}>Summary</h3>
            <p>Subtotal: ₹{totals.subtotal.toFixed(2)}</p>
            <p>Discount: -₹{totals.discount.toFixed(2)}</p>
            <p>Tax: ₹{totals.tax.toFixed(2)}</p>
            <hr style={{ margin: '10px 0' }} />
            <p><strong>Total: ₹{totals.total.toFixed(2)}</strong></p>
          </div>
        </div>

        <div className="card mt-20">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h3>Line Items</h3>
            <button type="button" className="btn btn-secondary" onClick={addLineItem}>+ Add Item</button>
          </div>

          {lineItems.map((item, index) => (
            <div key={index} style={{ display: 'grid', gridTemplateColumns: '3fr 1fr 1fr auto', gap: '10px', marginBottom: '10px' }}>
              <input
                type="text"
                placeholder="Description"
                value={item.description}
                onChange={(e) => updateLineItem(index, 'description', e.target.value)}
              />
              <input
                type="number"
                placeholder="Qty"
                value={item.quantity}
                onChange={(e) => updateLineItem(index, 'quantity', e.target.value)}
                min="1"
              />
              <input
                type="number"
                placeholder="Unit Price (₹)"
                value={item.unitPrice}
                onChange={(e) => updateLineItem(index, 'unitPrice', e.target.value)}
                min="0"
              />
              <button type="button" className="btn btn-danger" onClick={() => removeLineItem(index)}>✕</button>
            </div>
          ))}
        </div>

        <div style={{ marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-secondary" onClick={() => navigate('/invoices')}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Creating...' : 'Create Invoice'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default CreateInvoice;

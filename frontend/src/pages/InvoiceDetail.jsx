import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getInvoice, getInvoicePayments, issueInvoice, voidInvoice, recordPayment } from '../api';

function formatAmount(paise) {
  return '₹' + (paise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 });
}

function InvoiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentType, setPaymentType] = useState('full');
  const [partialAmount, setPartialAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [paymentRef, setPaymentRef] = useState('');
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [idempotencyKey, setIdempotencyKey] = useState('');

  const [showVoidModal, setShowVoidModal] = useState(false);
  const [voidReason, setVoidReason] = useState('');

  useEffect(() => {
    loadInvoice();
  }, [id]);

  async function loadInvoice() {
    try {
      const [invRes, payRes] = await Promise.all([
        getInvoice(id),
        getInvoicePayments(id)
      ]);
      setInvoice(invRes.data.data);
      setPayments(payRes.data.data);
    } catch (err) {
      setError('Failed to load invoice');
    } finally {
      setLoading(false);
    }
  }

  async function handleIssue() {
    try {
      await issueInvoice(id);
      loadInvoice();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to issue invoice');
    }
  }

  async function handleVoid() {
    if (!voidReason) {
      alert('Please enter a reason');
      return;
    }
    try {
      await voidInvoice(id, voidReason);
      setShowVoidModal(false);
      loadInvoice();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to void invoice');
    }
  }

  function openPaymentModal() {
    setIdempotencyKey('pay-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9));
    setPaymentType('full');
    setPartialAmount('');
    setPaymentMethod('UPI');
    setPaymentRef('');
    setPaymentError('');
    setPaymentLoading(false);
    setShowPaymentModal(true);
  }

  function closePaymentModal() {
    setShowPaymentModal(false);
    setPaymentError('');
    setPaymentLoading(false);
  }

  async function handlePayment() {
    if (paymentLoading) {
      return;
    }

    setPaymentError('');

    let amount;
    if (paymentType === 'full') {
      amount = invoice.amount_due / 100;
    } else {
      if (!partialAmount || parseFloat(partialAmount) <= 0) {
        setPaymentError('Please enter a valid partial payment amount');
        return;
      }
      amount = parseFloat(partialAmount);
      if (amount > invoice.amount_due / 100) {
        setPaymentError('Partial amount cannot exceed amount due');
        return;
      }
    }

    setPaymentLoading(true);

    try {
      await recordPayment(id, {
        amount: amount,
        paymentMethod: paymentMethod,
        referenceNumber: paymentRef,
        idempotencyKey: idempotencyKey
      });
      closePaymentModal();
      loadInvoice();
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Failed to record payment';
      setPaymentError(errorMessage);
      setPaymentLoading(false);
    }
  }

  if (loading) return <div className="loading">Loading...</div>;
  if (!invoice) return <div className="error">Invoice not found</div>;

  const canIssue = invoice.status === 'DRAFT';
  const canPay = invoice.status === 'ISSUED' || invoice.status === 'PARTIALLY_PAID';
  const canVoid = invoice.status !== 'VOIDED' && invoice.status !== 'PAID' && invoice.amount_paid === 0;

  return (
    <div>
      <button className="btn btn-secondary" onClick={() => navigate('/invoices')} style={{ marginBottom: '20px' }}>
        ← Back
      </button>

      {error && <div className="error">{error}</div>}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1 className="page-title" style={{ marginBottom: '5px' }}>{invoice.invoice_number}</h1>
          <span className={`status status-${invoice.status.toLowerCase()}`}>{invoice.status}</span>
        </div>
        <div>
          {canIssue && <button className="btn btn-primary" onClick={handleIssue}>Issue Invoice</button>}
          {canPay && <button className="btn btn-success" onClick={openPaymentModal}>Record Payment</button>}
          {canVoid && <button className="btn btn-danger" onClick={() => setShowVoidModal(true)}>Void</button>}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div className="card">
          <h3 style={{ marginBottom: '15px' }}>Details</h3>
          <p><strong>Customer:</strong> {invoice.customer_name || 'No customer'}</p>
          {invoice.customer_email && <p><strong>Email:</strong> {invoice.customer_email}</p>}
          {invoice.customer_phone && <p><strong>Phone:</strong> {invoice.customer_phone}</p>}
          <p><strong>Issue Date:</strong> {invoice.issue_date}</p>
          <p><strong>Due Date:</strong> {invoice.due_date || '-'}</p>
          {invoice.notes && <p><strong>Notes:</strong> {invoice.notes}</p>}
        </div>

        <div className="card">
          <h3 style={{ marginBottom: '15px' }}>Amount</h3>
          <p>Subtotal: {formatAmount(invoice.subtotal)}</p>
          <p>Discount ({invoice.discount_percent}%): -{formatAmount(invoice.discount_amount)}</p>
          <p>Tax ({invoice.tax_percent}%): {formatAmount(invoice.tax_amount)}</p>
          <hr style={{ margin: '10px 0' }} />
          <p><strong>Total: {formatAmount(invoice.total_amount)}</strong></p>
          <p style={{ color: '#059669' }}>Paid: {formatAmount(invoice.amount_paid)}</p>
          <p style={{ color: '#d97706' }}><strong>Due: {formatAmount(invoice.amount_due)}</strong></p>
        </div>
      </div>

      <div className="card mt-20">
        <h3 style={{ marginBottom: '15px' }}>Line Items</h3>
        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th>Qty</th>
              <th>Unit Price</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            {invoice.line_items?.map(item => (
              <tr key={item.id}>
                <td>{item.description}</td>
                <td>{item.quantity}</td>
                <td>{formatAmount(item.unit_price)}</td>
                <td>{formatAmount(item.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card mt-20">
        <h3 style={{ marginBottom: '15px' }}>Payments</h3>
        {payments.length === 0 ? (
          <p>No payments yet</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Method</th>
                <th>Reference</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {payments.map(pay => (
                <tr key={pay.id}>
                  <td>{pay.payment_date}</td>
                  <td>{pay.payment_method}</td>
                  <td>{pay.reference_number || '-'}</td>
                  <td>{formatAmount(pay.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showPaymentModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3 className="modal-title">Record Payment</h3>
            <p style={{ marginBottom: '15px' }}>Amount Due: {formatAmount(invoice.amount_due)}</p>
            
            {paymentError && (
              <div className="error" style={{ marginBottom: '15px' }}>
                {paymentError}
              </div>
            )}
            
            <div className="form-group">
              <label>Payment Type</label>
              <div style={{ display: 'flex', gap: '20px', marginTop: '8px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input 
                    type="radio" 
                    name="paymentType" 
                    value="full" 
                    checked={paymentType === 'full'} 
                    onChange={() => setPaymentType('full')}
                    disabled={paymentLoading}
                  />
                  Full Payment ({formatAmount(invoice.amount_due)})
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input 
                    type="radio" 
                    name="paymentType" 
                    value="partial" 
                    checked={paymentType === 'partial'} 
                    onChange={() => setPaymentType('partial')}
                    disabled={paymentLoading}
                  />
                  Partial Payment
                </label>
              </div>
            </div>

            {paymentType === 'partial' && (
              <div className="form-group">
                <label>Partial Amount (₹) <span style={{ color: '#dc2626' }}>*</span></label>
                <input 
                  type="number" 
                  value={partialAmount} 
                  onChange={(e) => setPartialAmount(e.target.value)}
                  max={invoice.amount_due / 100}
                  min="1"
                  placeholder="Enter amount"
                  disabled={paymentLoading}
                />
              </div>
            )}

            <div className="form-group">
              <label>Method</label>
              <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} disabled={paymentLoading}>
                <option value="CASH">Cash</option>
                <option value="UPI">UPI</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
                <option value="CHEQUE">Cheque</option>
                <option value="CARD">Card</option>
              </select>
            </div>
            <div className="form-group">
              <label>Reference Number</label>
              <input type="text" value={paymentRef} onChange={(e) => setPaymentRef(e.target.value)} disabled={paymentLoading} />
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={closePaymentModal} disabled={paymentLoading}>
                Cancel
              </button>
              <button className="btn btn-success" onClick={handlePayment} disabled={paymentLoading}>
                {paymentLoading ? 'Saving...' : 'Save Payment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showVoidModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3 className="modal-title">Void Invoice</h3>
            <p style={{ marginBottom: '15px', color: '#dc2626' }}>This action cannot be undone.</p>
            <div className="form-group">
              <label>Reason</label>
              <input type="text" value={voidReason} onChange={(e) => setVoidReason(e.target.value)} placeholder="Enter reason" />
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowVoidModal(false)}>Cancel</button>
              <button className="btn btn-danger" onClick={handleVoid}>Void Invoice</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default InvoiceDetail;

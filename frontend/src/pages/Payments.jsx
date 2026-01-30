import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getPayments } from '../api';

function formatAmount(paise) {
  return '₹' + (paise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 });
}

function Payments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPayments();
  }, []);

  async function loadPayments() {
    try {
      const res = await getPayments();
      setPayments(res.data.data);
    } catch (err) {
      console.error('Error loading payments:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div>
      <h1 className="page-title">Payments</h1>

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Invoice</th>
              <th>Method</th>
              <th>Reference</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            {payments.length === 0 ? (
              <tr><td colSpan="5" style={{ textAlign: 'center' }}>No payments yet</td></tr>
            ) : (
              payments.map(pay => (
                <tr key={pay.id}>
                  <td>{pay.payment_date}</td>
                  <td><Link to={`/invoices/${pay.invoice_id}`}>{pay.invoice?.invoice_number || pay.invoice_id.slice(0, 8)}</Link></td>
                  <td>{pay.payment_method}</td>
                  <td>{pay.reference_number || '-'}</td>
                  <td>{formatAmount(pay.amount)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Payments;

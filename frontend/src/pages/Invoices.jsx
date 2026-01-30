import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getInvoices } from '../api';

function formatAmount(paise) {
  return '₹' + (paise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 });
}

function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    loadInvoices();
  }, [filter]);

  async function loadInvoices() {
    try {
      setLoading(true);
      const res = await getInvoices(filter || null);
      setInvoices(res.data.data);
    } catch (err) {
      console.error('Error loading invoices:', err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 className="page-title" style={{ marginBottom: 0 }}>Invoices</h1>
        <div>
          <select value={filter} onChange={(e) => setFilter(e.target.value)} style={{ padding: '10px', marginRight: '10px' }}>
            <option value="">All Status</option>
            <option value="DRAFT">Draft</option>
            <option value="ISSUED">Issued</option>
            <option value="PARTIALLY_PAID">Partially Paid</option>
            <option value="PAID">Paid</option>
            <option value="VOIDED">Voided</option>
          </select>
          <Link to="/invoices/new">
            <button className="btn btn-primary">Create Invoice</button>
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="loading">Loading...</div>
      ) : (
        <div className="card">
          <table>
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Customer</th>
                <th>Issue Date</th>
                <th>Total</th>
                <th>Paid</th>
                <th>Due</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {invoices.length === 0 ? (
                <tr><td colSpan="7" style={{ textAlign: 'center' }}>No invoices found</td></tr>
              ) : (
                invoices.map(inv => (
                  <tr key={inv.id}>
                    <td><Link to={`/invoices/${inv.id}`}>{inv.invoice_number}</Link></td>
                    <td>{inv.customer_name || '-'}</td>
                    <td>{inv.issue_date}</td>
                    <td>{formatAmount(inv.total_amount)}</td>
                    <td style={{ color: '#059669' }}>{formatAmount(inv.amount_paid)}</td>
                    <td style={{ color: '#d97706' }}>{formatAmount(inv.amount_due)}</td>
                    <td><span className={`status status-${inv.status.toLowerCase()}`}>{inv.status}</span></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default Invoices;

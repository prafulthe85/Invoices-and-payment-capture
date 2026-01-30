import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getInvoiceStats, getInvoices } from '../api';

function formatAmount(paise) {
  return '₹' + (paise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 });
}

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [recentInvoices, setRecentInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [statsRes, invoicesRes] = await Promise.all([
        getInvoiceStats(),
        getInvoices()
      ]);
      setStats(statsRes.data.data);
      setRecentInvoices(invoicesRes.data.data.slice(0, 5));
    } catch (err) {
      console.error('Error loading dashboard:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div>
      <h1 className="page-title">Dashboard</h1>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Invoices</h3>
          <div className="value">{stats?.total || 0}</div>
        </div>
        <div className="stat-card">
          <h3>Outstanding</h3>
          <div className="value">{formatAmount(stats?.totalOutstanding || 0)}</div>
        </div>
        <div className="stat-card">
          <h3>Collected</h3>
          <div className="value">{formatAmount(stats?.totalCollected || 0)}</div>
        </div>
        <div className="stat-card">
          <h3>Pending</h3>
          <div className="value">{(stats?.issued || 0) + (stats?.partiallyPaid || 0)}</div>
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: '15px' }}>Recent Invoices</h3>
        <table>
          <thead>
            <tr>
              <th>Invoice #</th>
              <th>Customer</th>
              <th>Amount</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {recentInvoices.map(inv => (
              <tr key={inv.id}>
                <td><Link to={`/invoices/${inv.id}`}>{inv.invoice_number}</Link></td>
                <td>{inv.customer_name || '-'}</td>
                <td>{formatAmount(inv.total_amount)}</td>
                <td><span className={`status status-${inv.status.toLowerCase()}`}>{inv.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Dashboard;

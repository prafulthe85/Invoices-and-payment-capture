
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_URL
});



export const getInvoices = (status) => api.get('/invoices', { params: { status } });
export const getInvoiceStats = () => api.get('/invoices/stats');
export const getInvoice = (id) => api.get(`/invoices/${id}`);
export const createInvoice = (data) => api.post('/invoices', data);
export const issueInvoice = (id) => api.post(`/invoices/${id}/issue`);
export const voidInvoice = (id, reason) => api.post(`/invoices/${id}/void`, { reason });
export const getInvoicePayments = (id) => api.get(`/invoices/${id}/payments`);
export const recordPayment = (id, data) => api.post(`/invoices/${id}/payments`, data);


export const getPayments = () => api.get('/payments');

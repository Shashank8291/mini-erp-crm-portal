import { useState, useEffect, type FormEvent } from 'react';
import { customersApi } from '../api/customers';
import type { Customer } from '../types';
import { useAuth } from '../context/AuthContext';
import PageHeader from '../components/PageHeader';
import KpiCard from '../components/KpiCard';
import {
  Users,
  UserCheck,
  UserPlus,
  Building2,
  Search,
  Plus,
  Eye,
  Edit,
  X,
  MessageSquare,
  Calendar,
  Send,
  AlertCircle,
  CheckCircle2,
  Phone,
  Mail,
  MapPin,
} from 'lucide-react';

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDetail, setShowDetail] = useState<Customer | null>(null);
  const [editCustomer, setEditCustomer] = useState<Customer | null>(null);
  const [newNote, setNewNote] = useState('');
  const [toast, setToast] = useState<{ type: string; message: string } | null>(null);
  const { hasRole } = useAuth();

  const [form, setForm] = useState({
    name: '',
    mobile: '',
    email: '',
    business_name: '',
    gst_no: '',
    type: 'Retail',
    address: '',
    status: 'Lead',
    follow_up_date: '',
    notes: '',
  });

  useEffect(() => {
    loadCustomers();
  }, [page, search, statusFilter, typeFilter]);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const res = await customersApi.getAll({
        page,
        limit: 10,
        search,
        status: statusFilter,
        type: typeFilter,
      });
      setCustomers(res.data.data || []);
      setTotalPages(res.data.pagination?.totalPages || 1);
      setTotalRecords(res.data.pagination?.total || (res.data.data?.length || 0));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (type: string, message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      if (editCustomer) {
        await customersApi.update(editCustomer.id, form);
        showToast('success', 'Customer record updated successfully');
      } else {
        await customersApi.create(form);
        showToast('success', 'New customer registered successfully');
      }
      setShowModal(false);
      setEditCustomer(null);
      resetForm();
      loadCustomers();
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Operation failed');
    }
  };

  const handleEdit = (customer: Customer) => {
    setEditCustomer(customer);
    setForm({
      name: customer.name,
      mobile: customer.mobile || '',
      email: customer.email || '',
      business_name: customer.business_name || '',
      gst_no: customer.gst_no || '',
      type: customer.type,
      address: customer.address || '',
      status: customer.status,
      follow_up_date: customer.follow_up_date?.split('T')[0] || '',
      notes: customer.notes || '',
    });
    setShowModal(true);
  };

  const handleAddNote = async (e: FormEvent) => {
    e.preventDefault();
    if (!showDetail || !newNote.trim()) return;
    try {
      const res = await customersApi.addNote(showDetail.id, newNote);
      setShowDetail(res.data.data);
      setNewNote('');
      showToast('success', 'Follow-up note logged');
      loadCustomers();
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Failed to add note');
    }
  };

  const viewDetail = async (id: number) => {
    try {
      const res = await customersApi.getById(id);
      setShowDetail(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const resetForm = () => {
    setForm({
      name: '',
      mobile: '',
      email: '',
      business_name: '',
      gst_no: '',
      type: 'Retail',
      address: '',
      status: 'Lead',
      follow_up_date: '',
      notes: '',
    });
  };

  const openCreate = () => {
    setEditCustomer(null);
    resetForm();
    setShowModal(true);
  };

  // Metric derivations from current listing
  const activeCount = customers.filter((c) => c.status === 'Active').length;
  const leadCount = customers.filter((c) => c.status === 'Lead').length;
  const wholesaleCount = customers.filter((c) => c.type === 'Wholesale' || c.type === 'Distributor').length;

  return (
    <div>
      {/* Toast Alert */}
      {toast && (
        <div className="toast-container">
          <div
            className={`toast ${
              toast.type === 'success' ? 'toast-success' : 'toast-error'
            }`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: toast.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              border: `1px solid ${toast.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
              color: toast.type === 'success' ? '#34d399' : '#f87171',
            }}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 size={16} />
            ) : (
              <AlertCircle size={16} />
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      <PageHeader
        title="Customer CRM"
        subtitle="Manage client accounts, prospective leads, and follow-up communication"
        breadcrumb="Customers"
        actions={
          hasRole('Admin', 'Sales') && (
            <button className="btn btn-primary" onClick={openCreate}>
              <Plus size={16} /> Register Customer
            </button>
          )
        }
      />

      {/* Summary KPI Cards */}
      <div className="kpi-grid">
        <KpiCard
          label="Total Records"
          value={totalRecords || customers.length}
          icon={Users}
          tint="indigo"
          badgeText="CRM Directory"
          badgeType="neutral"
          subtext="Total registered accounts"
        />
        <KpiCard
          label="Active Accounts"
          value={activeCount}
          icon={UserCheck}
          tint="emerald"
          badgeText="Active"
          badgeType="positive"
          subtext="Purchasing clients"
        />
        <KpiCard
          label="Sales Pipeline"
          value={leadCount}
          icon={UserPlus}
          tint="blue"
          badgeText="Leads"
          badgeType="neutral"
          subtext="Prospective opportunities"
        />
        <KpiCard
          label="B2B Wholesale / Distributor"
          value={wholesaleCount}
          icon={Building2}
          tint="sky"
          badgeText="Enterprise"
          badgeType="neutral"
          subtext="Commercial buyers"
        />
      </div>

      {/* Filter and Search Bar */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ padding: '16px 20px' }}>
          <div className="filter-bar" style={{ marginBottom: 0 }}>
            <div className="search-input-wrapper">
              <span className="search-icon">
                <Search size={16} />
              </span>
              <input
                type="text"
                className="form-input"
                placeholder="Search by name, business, email, phone..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>

            <div className="filter-group">
              <select
                className="form-select"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                style={{ minWidth: 150 }}
              >
                <option value="">All Statuses</option>
                <option value="Lead">Lead</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>

              <select
                className="form-select"
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value);
                  setPage(1);
                }}
                style={{ minWidth: 150 }}
              >
                <option value="">All Account Types</option>
                <option value="Retail">Retail</option>
                <option value="Wholesale">Wholesale</option>
                <option value="Distributor">Distributor</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Customer Data Table */}
      <div className="card">
        <div className="table-container" style={{ border: 'none', boxShadow: 'none' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Customer / Contact</th>
                <th>Company / Business</th>
                <th>Phone Number</th>
                <th>Type</th>
                <th>Status</th>
                <th>Follow-up</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7}>
                    <div className="loading-spinner">
                      <div className="spinner" />
                    </div>
                  </td>
                </tr>
              ) : customers.length > 0 ? (
                customers.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <div
                        style={{ cursor: 'pointer', fontWeight: 600, color: 'var(--color-primary)' }}
                        onClick={() => viewDetail(c.id)}
                      >
                        {c.name}
                      </div>
                      {c.email && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                          {c.email}
                        </div>
                      )}
                    </td>
                    <td>{c.business_name || '—'}</td>
                    <td>{c.mobile || '—'}</td>
                    <td>
                      <span className={`badge badge-${c.type.toLowerCase()}`}>
                        {c.type}
                      </span>
                    </td>
                    <td>
                      <span className={`badge badge-${c.status.toLowerCase()}`}>
                        {c.status}
                      </span>
                    </td>
                    <td>
                      {c.follow_up_date ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.8rem' }}>
                          <Calendar size={13} className="text-secondary" />
                          {new Date(c.follow_up_date).toLocaleDateString()}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: 6 }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '5px 8px' }}
                          onClick={() => viewDetail(c.id)}
                          title="View Details & Notes"
                        >
                          <Eye size={14} />
                        </button>
                        {hasRole('Admin', 'Sales') && (
                          <button
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '5px 8px' }}
                            onClick={() => handleEdit(c)}
                            title="Edit Record"
                          >
                            <Edit size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7}>
                    <div className="empty-state">
                      <div className="empty-state-icon">
                        <Users size={24} />
                      </div>
                      <div className="empty-state-title">No Customers Found</div>
                      <div className="empty-state-text">
                        Try adjusting your search criteria or register a new customer profile.
                      </div>
                      {hasRole('Admin', 'Sales') && (
                        <button className="btn btn-primary btn-sm" onClick={openCreate}>
                          <Plus size={14} /> Add Customer
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ padding: '0 20px' }}>
            <div className="pagination">
              <span className="pagination-info">
                Page {page} of {totalPages}
              </span>
              <button
                className="pagination-btn"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
              >
                Previous
              </button>
              <button
                className="pagination-btn"
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit Customer Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editCustomer ? 'Edit Customer Record' : 'Register New Customer'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Full Name *</label>
                    <input
                      type="text"
                      className="form-input"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="e.g. John Doe"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Mobile Number</label>
                    <input
                      type="text"
                      className="form-input"
                      value={form.mobile}
                      onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                      placeholder="e.g. +91 98765 43210"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Email Address</label>
                    <input
                      type="email"
                      className="form-input"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="e.g. john@company.com"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Company / Business Name</label>
                    <input
                      type="text"
                      className="form-input"
                      value={form.business_name}
                      onChange={(e) => setForm({ ...form, business_name: e.target.value })}
                      placeholder="e.g. Acme Industries Ltd"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Account Type</label>
                    <select
                      className="form-select"
                      value={form.type}
                      onChange={(e) => setForm({ ...form, type: e.target.value })}
                    >
                      <option value="Retail">Retail</option>
                      <option value="Wholesale">Wholesale</option>
                      <option value="Distributor">Distributor</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Lead Status</label>
                    <select
                      className="form-select"
                      value={form.status}
                      onChange={(e) => setForm({ ...form, status: e.target.value })}
                    >
                      <option value="Lead">Lead</option>
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">GST / Tax Identification</label>
                    <input
                      type="text"
                      className="form-input"
                      value={form.gst_no}
                      onChange={(e) => setForm({ ...form, gst_no: e.target.value })}
                      placeholder="e.g. 27ABCDE1234F1Z5"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Next Follow-Up Date</label>
                    <input
                      type="date"
                      className="form-input"
                      value={form.follow_up_date}
                      onChange={(e) => setForm({ ...form, follow_up_date: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Registered Office / Address</label>
                  <textarea
                    className="form-textarea"
                    rows={2}
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    placeholder="Enter physical address or shipping location"
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editCustomer ? 'Save Changes' : 'Create Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer Detail & Notes Drawer Modal */}
      {showDetail && (
        <div className="modal-overlay" onClick={() => setShowDetail(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>{showDetail.name}</h2>
                <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                  <span className={`badge badge-${showDetail.status.toLowerCase()}`}>
                    {showDetail.status}
                  </span>
                  <span className={`badge badge-${showDetail.type.toLowerCase()}`}>
                    {showDetail.type}
                  </span>
                </div>
              </div>
              <button className="modal-close" onClick={() => setShowDetail(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              <div className="detail-grid">
                <div className="detail-section">
                  <h3>Contact Info</h3>
                  <div className="detail-row">
                    <span className="detail-label"><Phone size={13} style={{ display: 'inline', marginRight: 4 }} /> Phone</span>
                    <span className="detail-value">{showDetail.mobile || '—'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label"><Mail size={13} style={{ display: 'inline', marginRight: 4 }} /> Email</span>
                    <span className="detail-value">{showDetail.email || '—'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label"><MapPin size={13} style={{ display: 'inline', marginRight: 4 }} /> Address</span>
                    <span className="detail-value">{showDetail.address || '—'}</span>
                  </div>
                </div>

                <div className="detail-section">
                  <h3>Company Details</h3>
                  <div className="detail-row">
                    <span className="detail-label"><Building2 size={13} style={{ display: 'inline', marginRight: 4 }} /> Company</span>
                    <span className="detail-value">{showDetail.business_name || '—'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">GST No.</span>
                    <span className="detail-value">{showDetail.gst_no || '—'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Follow-up</span>
                    <span className="detail-value">
                      {showDetail.follow_up_date
                        ? new Date(showDetail.follow_up_date).toLocaleDateString()
                        : '—'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Follow-up Notes Timeline */}
              <div style={{ marginTop: 20 }}>
                <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>
                  <MessageSquare size={14} style={{ display: 'inline', marginRight: 6 }} />
                  Follow-Up Interaction Notes
                </h3>
                <div className="notes-list">
                  {showDetail.notes ? (
                    showDetail.notes.split('\n\n').map((note, i) => (
                      <div key={i} className="note-item">
                        {note}
                      </div>
                    ))
                  ) : (
                    <div style={{ color: 'var(--color-text-muted)', fontSize: '0.825rem', fontStyle: 'italic', padding: 8 }}>
                      No follow-up notes recorded yet.
                    </div>
                  )}
                </div>

                {hasRole('Admin', 'Sales') && (
                  <form onSubmit={handleAddNote} style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Add a new follow-up interaction or call log..."
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                    />
                    <button type="submit" className="btn btn-primary" disabled={!newNote.trim()}>
                      <Send size={15} /> Add
                    </button>
                  </form>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setShowDetail(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

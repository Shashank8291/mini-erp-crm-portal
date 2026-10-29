import { useState, useEffect, type FormEvent } from 'react';
import { stockApi } from '../api/stock';
import { productsApi } from '../api/products';
import type { StockMovement, Product } from '../types';
import PageHeader from '../components/PageHeader';
import KpiCard from '../components/KpiCard';
import {
  ArrowLeftRight,
  ArrowDownLeft,
  ArrowUpRight,
  Package,
  Plus,
  X,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
} from 'lucide-react';

export default function StockMovements() {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [filterType, setFilterType] = useState<string>('ALL');
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState<{ type: string; message: string } | null>(null);

  const [form, setForm] = useState({
    product_id: 0,
    quantity: 1,
    movement_type: 'IN' as 'IN' | 'OUT',
    reason: '',
  });

  useEffect(() => {
    loadMovements();
    loadProducts();
  }, [page]);

  const loadMovements = async () => {
    try {
      setLoading(true);
      const res = await stockApi.getAll({ page, limit: 15 });
      setMovements(res.data.data || []);
      setTotalPages(res.data.pagination?.totalPages || 1);
      setTotalRecords(res.data.pagination?.total || (res.data.data?.length || 0));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      const res = await productsApi.getAll({ limit: 100 });
      setProducts(res.data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const showToast = (type: string, message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.product_id) {
      showToast('error', 'Please select a valid catalog product');
      return;
    }
    try {
      await stockApi.createMovement({
        product_id: Number(form.product_id),
        quantity: Number(form.quantity),
        movement_type: form.movement_type,
        reason: form.reason,
      });
      showToast(
        'success',
        `Inventory ${form.movement_type === 'IN' ? 'receipt' : 'dispatch'} recorded successfully`
      );
      setShowModal(false);
      setForm({ product_id: 0, quantity: 1, movement_type: 'IN', reason: '' });
      loadMovements();
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Failed to record movement');
    }
  };

  // Metrics
  const inMovements = movements.filter((m) => m.movement_type === 'IN').length;
  const outMovements = movements.filter((m) => m.movement_type === 'OUT').length;
  const filteredMovements = filterType === 'ALL'
    ? movements
    : movements.filter((m) => m.movement_type === filterType);

  const selectedProduct = products.find((p) => p.id === Number(form.product_id));

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
        title="Stock Movements"
        subtitle="Real-time audit log of warehouse receipts, inventory deductions, and order adjustments"
        breadcrumb="Stock Movements"
        actions={
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={16} /> Record Movement
          </button>
        }
      />

      {/* KPI Cards */}
      <div className="kpi-grid">
        <KpiCard
          label="Total Logged Movements"
          value={totalRecords || movements.length}
          icon={ArrowLeftRight}
          tint="indigo"
          badgeText="Audit Log"
          badgeType="neutral"
          subtext="Lifetime warehouse transactions"
        />
        <KpiCard
          label="Inbound Receipts"
          value={inMovements}
          icon={ArrowDownLeft}
          tint="emerald"
          badgeText="Restock IN"
          badgeType="positive"
          subtext="Supplies added to inventory"
          onClick={() => setFilterType(filterType === 'IN' ? 'ALL' : 'IN')}
        />
        <KpiCard
          label="Outbound Dispatches"
          value={outMovements}
          icon={ArrowUpRight}
          tint="rose"
          badgeText="Dispatched OUT"
          badgeType="negative"
          subtext="Orders & stock adjustments"
          onClick={() => setFilterType(filterType === 'OUT' ? 'ALL' : 'OUT')}
        />
        <KpiCard
          label="Catalog Coverage"
          value={products.length}
          icon={Package}
          tint="blue"
          badgeText="Tracked SKUs"
          badgeType="neutral"
          subtext="Warehouse managed items"
        />
      </div>

      {/* Filter Tabs */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              className={`btn btn-sm ${filterType === 'ALL' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFilterType('ALL')}
            >
              All Movements
            </button>
            <button
              type="button"
              className={`btn btn-sm ${filterType === 'IN' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFilterType('IN')}
            >
              <ArrowDownLeft size={14} /> Inbound (IN) Only
            </button>
            <button
              type="button"
              className={`btn btn-sm ${filterType === 'OUT' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFilterType('OUT')}
            >
              <ArrowUpRight size={14} /> Outbound (OUT) Only
            </button>
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
            Showing {filteredMovements.length} transactions
          </span>
        </div>
      </div>

      {/* Movements Table */}
      <div className="card">
        <div className="table-container" style={{ border: 'none', boxShadow: 'none' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Date & Time</th>
                <th>Product Description</th>
                <th>SKU Code</th>
                <th>Operation</th>
                <th>Quantity</th>
                <th>Reason / Reference</th>
                <th>Logged By</th>
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
              ) : filteredMovements.length > 0 ? (
                filteredMovements.map((m) => {
                  const isIn = m.movement_type === 'IN';
                  return (
                    <tr key={m.id}>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: '0.825rem' }}>
                          <Clock size={13} className="text-secondary" />
                          {new Date(m.created_at).toLocaleString()}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                        {m.product_name || '—'}
                      </td>
                      <td className="td-mono">{m.product_sku || '—'}</td>
                      <td>
                        <span className={`badge ${isIn ? 'badge-in' : 'badge-out'}`}>
                          {isIn ? <ArrowDownLeft size={12} /> : <ArrowUpRight size={12} />}
                          {m.movement_type}
                        </span>
                      </td>
                      <td>
                        <span
                          style={{
                            fontWeight: 700,
                            color: isIn ? 'var(--color-success-dark)' : 'var(--color-error-dark)',
                          }}
                        >
                          {isIn ? '+' : '-'}{m.quantity_changed} units
                        </span>
                      </td>
                      <td style={{ color: 'var(--color-text-secondary)', fontSize: '0.825rem' }}>
                        {m.reason || 'Standard operation'}
                      </td>
                      <td style={{ color: 'var(--color-text-muted)', fontSize: '0.825rem' }}>
                        {m.created_by_name || 'System Operator'}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7}>
                    <div className="empty-state">
                      <div className="empty-state-icon">
                        <FileText size={24} />
                      </div>
                      <div className="empty-state-title">No Stock Operations Found</div>
                      <div className="empty-state-text">
                        Record your first inventory stock receipt or deduction using the button below.
                      </div>
                      <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}>
                        <Plus size={14} /> Record Movement
                      </button>
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

      {/* Record Stock Movement Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Record Warehouse Movement</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Select Catalog Product *</label>
                  <select
                    className="form-select"
                    value={form.product_id}
                    onChange={(e) => setForm({ ...form, product_id: Number(e.target.value) })}
                    required
                  >
                    <option value={0}>Choose a product from catalog...</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.sku}) — Current Stock: {p.current_stock}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedProduct && (
                  <div
                    style={{
                      background: 'var(--color-bg-subtle)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-md)',
                      padding: '10px 14px',
                      fontSize: '0.8rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: 16,
                    }}
                  >
                    <span>Current Inventory: <strong>{selectedProduct.current_stock} units</strong></span>
                    <span>Safety Threshold: <strong>{selectedProduct.min_stock_alert} units</strong></span>
                  </div>
                )}

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Movement Direction *</label>
                    <select
                      className="form-select"
                      value={form.movement_type}
                      onChange={(e) => setForm({ ...form, movement_type: e.target.value as 'IN' | 'OUT' })}
                    >
                      <option value="IN">IN — Restock / Supplier Receipt</option>
                      <option value="OUT">OUT — Dispatch / Wastage / Adjustment</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Quantity (Units) *</label>
                    <input
                      type="number"
                      min="1"
                      className="form-input"
                      value={form.quantity}
                      onChange={(e) => setForm({ ...form, quantity: Math.max(1, Number(e.target.value)) })}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Operation Reason / Reference Note *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={form.reason}
                    onChange={(e) => setForm({ ...form, reason: e.target.value })}
                    placeholder="e.g. PO-8921 supplier delivery, batch inspection, damaged goods"
                    required
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
                  Commit Movement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

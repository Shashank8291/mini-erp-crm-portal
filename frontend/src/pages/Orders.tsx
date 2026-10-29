import { useState, useEffect } from 'react';
import { ordersApi } from '../api/orders';
import { customersApi } from '../api/customers';
import { productsApi } from '../api/products';
import type { Order, Customer, Product } from '../types';
import { useAuth } from '../context/AuthContext';
import PageHeader from '../components/PageHeader';
import KpiCard from '../components/KpiCard';
import {
  ClipboardList,
  CheckCircle2,
  Clock,
  XCircle,
  Plus,
  Search,
  Eye,
  Check,
  X,
  Trash2,
  AlertCircle,
  FileText,
  ShoppingBag,
} from 'lucide-react';

interface OrderItemInput {
  product_id: number;
  product_name: string;
  product_price: number;
  quantity: number;
  max_stock: number;
}

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [showDetail, setShowDetail] = useState<Order | null>(null);
  const [toast, setToast] = useState<{ type: string; message: string } | null>(null);
  const { hasRole } = useAuth();

  // Create form state
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState(0);
  const [items, setItems] = useState<OrderItemInput[]>([]);
  const [addProductId, setAddProductId] = useState(0);
  const [addQuantity, setAddQuantity] = useState(1);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadOrders();
  }, [page, statusFilter, search]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const res = await ordersApi.getAll({ page, limit: 10, status: statusFilter, search });
      setOrders(res.data.data || []);
      setTotalPages(res.data.pagination?.totalPages || 1);
      setTotalRecords(res.data.pagination?.total || (res.data.data?.length || 0));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadFormData = async () => {
    try {
      const [cusRes, prodRes] = await Promise.all([
        customersApi.getAll({ limit: 100 }),
        productsApi.getAll({ limit: 100 }),
      ]);
      setCustomers(cusRes.data.data || []);
      setProducts(prodRes.data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const showToast = (type: string, message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const openCreate = async () => {
    await loadFormData();
    setSelectedCustomer(0);
    setItems([]);
    setAddProductId(0);
    setAddQuantity(1);
    setShowCreate(true);
  };

  const addItem = () => {
    if (!addProductId) return;
    const product = products.find((p) => p.id === addProductId);
    if (!product) return;

    if (items.find((i) => i.product_id === addProductId)) {
      showToast('error', 'This item has already been added to the order lines');
      return;
    }

    setItems([
      ...items,
      {
        product_id: product.id,
        product_name: product.name,
        product_price: product.unit_price,
        quantity: Math.max(1, addQuantity),
        max_stock: product.current_stock,
      },
    ]);
    setAddProductId(0);
    setAddQuantity(1);
  };

  const removeItem = (productId: number) => {
    setItems(items.filter((i) => i.product_id !== productId));
  };

  const updateItemQuantity = (productId: number, quantity: number) => {
    setItems(
      items.map((i) =>
        i.product_id === productId ? { ...i, quantity: Math.max(1, quantity) } : i
      )
    );
  };

  const totalQuantity = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalAmount = items.reduce(
    (sum, i) => sum + i.quantity * i.product_price,
    0
  );

  const handleCreateOrder = async (status: 'Draft' | 'Confirmed') => {
    if (!selectedCustomer) {
      showToast('error', 'Please select a customer for this order');
      return;
    }
    if (items.length === 0) {
      showToast('error', 'Please add at least one line item to the order');
      return;
    }

    try {
      setSaving(true);
      await ordersApi.create({
        customer_id: selectedCustomer,
        items: items.map((i) => ({
          product_id: i.product_id,
          quantity: i.quantity,
        })),
        status,
      });

      showToast(
        'success',
        `Sales order created successfully as ${status}`
      );
      setShowCreate(false);
      loadOrders();
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Failed to create sales order');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateStatus = async (orderId: number, newStatus: string) => {
    try {
      await ordersApi.updateStatus(orderId, newStatus);
      showToast('success', `Order marked as ${newStatus}`);
      if (showDetail) {
        setShowDetail({ ...showDetail, status: newStatus as any });
      }
      loadOrders();
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Failed to update order status');
    }
  };

  const viewDetail = async (id: number) => {
    try {
      const res = await ordersApi.getById(id);
      setShowDetail(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const formatPrice = (price: number) =>
    `₹${Number(price).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

  // Metrics
  const confirmedCount = orders.filter((o) => o.status === 'Confirmed').length;
  const draftCount = orders.filter((o) => o.status === 'Draft').length;
  const cancelledCount = orders.filter((o) => o.status === 'Cancelled').length;

  const currentAddProduct = products.find((p) => p.id === addProductId);

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
        title="Sales Orders"
        subtitle="Manage customer orders, multi-item invoices, snapshots, and fulfillment lifecycle"
        breadcrumb="Orders"
        actions={
          hasRole('Admin', 'Sales') && (
            <button className="btn btn-primary" onClick={openCreate}>
              <Plus size={16} /> Create Order
            </button>
          )
        }
      />

      {/* KPI Cards */}
      <div className="kpi-grid">
        <KpiCard
          label="Total Orders"
          value={totalRecords || orders.length}
          icon={ClipboardList}
          tint="indigo"
          badgeText="All Orders"
          badgeType="neutral"
          subtext="Processed sales invoices"
        />
        <KpiCard
          label="Confirmed & Fulfilled"
          value={confirmedCount}
          icon={CheckCircle2}
          tint="emerald"
          badgeText="Confirmed"
          badgeType="positive"
          subtext="Ready for dispatch or completed"
          onClick={() => setStatusFilter(statusFilter === 'Confirmed' ? '' : 'Confirmed')}
        />
        <KpiCard
          label="Pending Drafts"
          value={draftCount}
          icon={Clock}
          tint="blue"
          badgeText="Drafts"
          badgeType="neutral"
          subtext="Awaiting client confirmation"
          onClick={() => setStatusFilter(statusFilter === 'Draft' ? '' : 'Draft')}
        />
        <KpiCard
          label="Cancelled Orders"
          value={cancelledCount}
          icon={XCircle}
          tint="rose"
          badgeText="Void"
          badgeType="negative"
          subtext="Cancelled transactions"
          onClick={() => setStatusFilter(statusFilter === 'Cancelled' ? '' : 'Cancelled')}
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
                placeholder="Search by order number or customer name..."
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
                style={{ minWidth: 170 }}
              >
                <option value="">All Fulfillment Statuses</option>
                <option value="Draft">Draft</option>
                <option value="Confirmed">Confirmed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="card">
        <div className="table-container" style={{ border: 'none', boxShadow: 'none' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Order Number</th>
                <th>Client / Customer</th>
                <th>Units</th>
                <th>Fulfillment Status</th>
                <th>Created By</th>
                <th>Order Date</th>
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
              ) : orders.length > 0 ? (
                orders.map((o) => (
                  <tr key={o.id}>
                    <td
                      className="td-mono"
                      style={{ cursor: 'pointer' }}
                      onClick={() => viewDetail(o.id)}
                    >
                      {o.order_number}
                    </td>
                    <td style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                      {o.customer_name}
                    </td>
                    <td>{o.total_quantity} units</td>
                    <td>
                      <span className={`badge badge-${o.status.toLowerCase()}`}>
                        {o.status}
                      </span>
                    </td>
                    <td style={{ color: 'var(--color-text-secondary)', fontSize: '0.825rem' }}>
                      {o.created_by_name || 'System'}
                    </td>
                    <td>{new Date(o.created_at).toLocaleDateString()}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: 6 }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '5px 8px' }}
                          onClick={() => viewDetail(o.id)}
                          title="View Order Details"
                        >
                          <Eye size={14} />
                        </button>
                        {o.status === 'Draft' && hasRole('Admin', 'Sales') && (
                          <>
                            <button
                              className="btn btn-success btn-sm"
                              style={{ padding: '5px 8px' }}
                              onClick={() => handleUpdateStatus(o.id, 'Confirmed')}
                              title="Confirm Order"
                            >
                              <Check size={14} />
                            </button>
                            <button
                              className="btn btn-danger btn-sm"
                              style={{ padding: '5px 8px' }}
                              onClick={() => handleUpdateStatus(o.id, 'Cancelled')}
                              title="Cancel Order"
                            >
                              <X size={14} />
                            </button>
                          </>
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
                        <FileText size={24} />
                      </div>
                      <div className="empty-state-title">No Orders Found</div>
                      <div className="empty-state-text">
                        {statusFilter
                          ? `No orders matching status "${statusFilter}".`
                          : 'Create your first sales order using the button below.'}
                      </div>
                      {hasRole('Admin', 'Sales') && (
                        <button className="btn btn-primary btn-sm" onClick={openCreate}>
                          <Plus size={14} /> Create Order
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

      {/* Create Order Modal */}
      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div
            className="modal-content"
            style={{ maxWidth: 750 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>New Sales Order Generator</h2>
              <button className="modal-close" onClick={() => setShowCreate(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              {/* Customer Selector */}
              <div className="form-group">
                <label className="form-label">Client / Customer Account *</label>
                <select
                  className="form-select"
                  value={selectedCustomer}
                  onChange={(e) => setSelectedCustomer(Number(e.target.value))}
                >
                  <option value={0}>Choose customer to bill...</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.business_name ? `(${c.business_name})` : ''} — {c.type}
                    </option>
                  ))}
                </select>
              </div>

              {/* Line Item Adder */}
              <div
                style={{
                  background: 'var(--color-bg-subtle)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-lg)',
                  padding: 16,
                  marginTop: 16,
                }}
              >
                <div style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 10 }}>
                  <ShoppingBag size={14} style={{ display: 'inline', marginRight: 6 }} />
                  Add Products to Order
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px auto', gap: 10, alignItems: 'end' }}>
                  <div>
                    <label className="form-label">Select Product</label>
                    <select
                      className="form-select"
                      value={addProductId}
                      onChange={(e) => setAddProductId(Number(e.target.value))}
                    >
                      <option value={0}>Choose catalog product...</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.sku}) — {formatPrice(p.unit_price)} [Stock: {p.current_stock}]
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Quantity</label>
                    <input
                      type="number"
                      min="1"
                      className="form-input"
                      value={addQuantity}
                      onChange={(e) => setAddQuantity(Math.max(1, Number(e.target.value)))}
                    />
                  </div>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={addItem}
                    disabled={!addProductId}
                  >
                    <Plus size={16} /> Add Item
                  </button>
                </div>

                {currentAddProduct && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: 8 }}>
                    Unit Price: {formatPrice(currentAddProduct.unit_price)} | Available: {currentAddProduct.current_stock} units
                  </div>
                )}
              </div>

              {/* Line Items Table */}
              <div style={{ marginTop: 20 }}>
                <label className="form-label">Order Items Breakdown ({items.length})</label>
                {items.length === 0 ? (
                  <div
                    style={{
                      border: '1px dashed var(--color-border)',
                      borderRadius: 'var(--radius-md)',
                      padding: 24,
                      textAlign: 'center',
                      color: 'var(--color-text-muted)',
                      fontSize: '0.85rem',
                    }}
                  >
                    No items added yet. Select a product above to add to this order.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {items.map((item) => (
                      <div key={item.product_id} className="order-item-row">
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--color-text-primary)', fontSize: '0.875rem' }}>
                            {item.product_name}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                            {formatPrice(item.product_price)} per unit
                          </div>
                        </div>
                        <div>
                          <input
                            type="number"
                            min="1"
                            className="form-input"
                            value={item.quantity}
                            onChange={(e) =>
                              updateItemQuantity(item.product_id, Number(e.target.value))
                            }
                            style={{ padding: '6px 10px' }}
                          />
                        </div>
                        <div style={{ fontWeight: 700, color: 'var(--color-primary)', textAlign: 'right' }}>
                          {formatPrice(item.quantity * item.product_price)}
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <button
                            type="button"
                            className="btn btn-danger btn-sm"
                            style={{ padding: '6px' }}
                            onClick={() => removeItem(item.product_id)}
                            title="Remove Line"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Summary Bar */}
              {items.length > 0 && (
                <div className="order-summary">
                  <div>
                    <div className="order-summary-label">Total Quantity</div>
                    <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{totalQuantity} units</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="order-summary-label">Grand Total Amount</div>
                    <div className="order-summary-value">{formatPrice(totalAmount)}</div>
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowCreate(false)}
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => handleCreateOrder('Draft')}
                disabled={saving || !selectedCustomer || items.length === 0}
              >
                Save as Draft
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => handleCreateOrder('Confirmed')}
                disabled={saving || !selectedCustomer || items.length === 0}
              >
                Confirm Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Order Details Modal */}
      {showDetail && (
        <div className="modal-overlay" onClick={() => setShowDetail(null)}>
          <div
            className="modal-content"
            style={{ maxWidth: 700 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <h2>Order #{showDetail.order_number}</h2>
                <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                  <span className={`badge badge-${showDetail.status.toLowerCase()}`}>
                    {showDetail.status}
                  </span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                    Created on {new Date(showDetail.created_at).toLocaleString()}
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
                  <h3>Order Info</h3>
                  <div className="detail-row">
                    <span className="detail-label">Order Ref</span>
                    <span className="detail-value td-mono">{showDetail.order_number}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Status</span>
                    <span className="detail-value">
                      <span className={`badge badge-${showDetail.status.toLowerCase()}`}>
                        {showDetail.status}
                      </span>
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Operator</span>
                    <span className="detail-value">{showDetail.created_by_name || 'System'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Total Units</span>
                    <span className="detail-value">{showDetail.total_quantity}</span>
                  </div>
                </div>

                <div className="detail-section">
                  <h3>Customer Details</h3>
                  <div className="detail-row">
                    <span className="detail-label">Customer</span>
                    <span className="detail-value">{showDetail.customer_name}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Business</span>
                    <span className="detail-value">{showDetail.customer_business || '—'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Mobile</span>
                    <span className="detail-value">{showDetail.customer_mobile || '—'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">GST</span>
                    <span className="detail-value">{showDetail.customer_gst || '—'}</span>
                  </div>
                </div>
              </div>

              {/* Items Table Snapshot */}
              <div style={{ marginTop: 20 }}>
                <label className="form-label">Itemized Snapshot</label>
                <div className="table-container" style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Product Snapshot</th>
                        <th>Locked Unit Price</th>
                        <th>Qty</th>
                        <th style={{ textAlign: 'right' }}>Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {showDetail.items?.map((item) => (
                        <tr key={item.id}>
                          <td style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                            {item.product_name_snapshot}
                          </td>
                          <td>{formatPrice(item.product_price_snapshot)}</td>
                          <td>{item.quantity}</td>
                          <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--color-primary)' }}>
                            {formatPrice(item.quantity * item.product_price_snapshot)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {showDetail.items && (
                  <div className="order-summary" style={{ marginTop: 14 }}>
                    <div>
                      <div className="order-summary-label">Total Order Quantity</div>
                      <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>
                        {showDetail.items.reduce((s, i) => s + i.quantity, 0)} units
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div className="order-summary-label">Invoice Total</div>
                      <div className="order-summary-value">
                        {formatPrice(
                          showDetail.items.reduce(
                            (s, i) => s + i.quantity * i.product_price_snapshot,
                            0
                          )
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer">
              {showDetail.status === 'Draft' && hasRole('Admin', 'Sales') && (
                <>
                  <button
                    className="btn btn-success"
                    onClick={() => handleUpdateStatus(showDetail.id, 'Confirmed')}
                  >
                    <Check size={16} /> Confirm Order
                  </button>
                  <button
                    className="btn btn-danger"
                    onClick={() => handleUpdateStatus(showDetail.id, 'Cancelled')}
                  >
                    <X size={16} /> Cancel Order
                  </button>
                </>
              )}
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

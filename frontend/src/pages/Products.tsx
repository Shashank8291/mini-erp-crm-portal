import { useState, useEffect, type FormEvent } from 'react';
import { productsApi } from '../api/products';
import type { Product } from '../types';
import { useAuth } from '../context/AuthContext';
import PageHeader from '../components/PageHeader';
import KpiCard from '../components/KpiCard';
import {
  Package,
  AlertTriangle,
  CheckCircle2,
  Boxes,
  Search,
  Plus,
  Edit,
  X,
  MapPin,
  Tag,
  AlertCircle,
} from 'lucide-react';

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [search, setSearch] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [toast, setToast] = useState<{ type: string; message: string } | null>(null);
  const { hasRole } = useAuth();

  const [form, setForm] = useState({
    name: '',
    sku: '',
    category: '',
    unit_price: 0,
    current_stock: 0,
    min_stock_alert: 0,
    location: '',
  });

  useEffect(() => {
    loadProducts();
  }, [page, search, lowStockOnly]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const res = await productsApi.getAll({
        page,
        limit: 10,
        search,
        lowStock: lowStockOnly || undefined,
      });
      setProducts(res.data.data || []);
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
      const payload = {
        ...form,
        unit_price: Number(form.unit_price),
        current_stock: Number(form.current_stock),
        min_stock_alert: Number(form.min_stock_alert),
      };

      if (editProduct) {
        const { current_stock, ...updatePayload } = payload;
        await productsApi.update(editProduct.id, updatePayload);
        showToast('success', 'Product record updated successfully');
      } else {
        await productsApi.create(payload);
        showToast('success', 'New product catalogued successfully');
      }
      setShowModal(false);
      setEditProduct(null);
      resetForm();
      loadProducts();
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Operation failed');
    }
  };

  const handleEdit = (product: Product) => {
    setEditProduct(product);
    setForm({
      name: product.name,
      sku: product.sku,
      category: product.category || '',
      unit_price: product.unit_price,
      current_stock: product.current_stock,
      min_stock_alert: product.min_stock_alert,
      location: product.location || '',
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setForm({
      name: '',
      sku: '',
      category: '',
      unit_price: 0,
      current_stock: 0,
      min_stock_alert: 0,
      location: '',
    });
  };

  const openCreate = () => {
    setEditProduct(null);
    resetForm();
    setShowModal(true);
  };

  const formatPrice = (price: number) =>
    `₹${Number(price).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

  // Metric derivations
  const lowStockCount = products.filter((p) => p.current_stock <= p.min_stock_alert).length;
  const inStockCount = products.filter((p) => p.current_stock > p.min_stock_alert).length;
  const categoriesCount = new Set(products.map((p) => p.category).filter(Boolean)).size;

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
              background: toast.type === 'success' ? '#ecfdf5' : '#fef2f2',
              border: `1px solid ${toast.type === 'success' ? '#a7f3d0' : '#fecaca'}`,
              color: toast.type === 'success' ? '#065f46' : '#991b1b',
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
        title="Product Inventory"
        subtitle="Catalog listings, pricing models, stock levels, and warehouse bay locations"
        breadcrumb="Products"
        actions={
          hasRole('Admin', 'Warehouse') && (
            <button className="btn btn-primary" onClick={openCreate}>
              <Plus size={16} /> Add Product
            </button>
          )
        }
      />

      {/* KPI Cards */}
      <div className="kpi-grid">
        <KpiCard
          label="Catalog SKUs"
          value={totalRecords || products.length}
          icon={Package}
          tint="indigo"
          badgeText="Active Catalog"
          badgeType="neutral"
          subtext="Total tracked products"
        />
        <KpiCard
          label="Healthy Inventory"
          value={inStockCount}
          icon={CheckCircle2}
          tint="emerald"
          badgeText="Sufficient"
          badgeType="positive"
          subtext="Above alert threshold"
        />
        <KpiCard
          label="Restock Alerts"
          value={lowStockCount}
          icon={AlertTriangle}
          tint={lowStockCount > 0 ? 'amber' : 'emerald'}
          badgeText={lowStockCount > 0 ? 'Action Needed' : 'No Shortages'}
          badgeType={lowStockCount > 0 ? 'negative' : 'positive'}
          subtext="At or below safety stock"
          onClick={() => setLowStockOnly(!lowStockOnly)}
        />
        <KpiCard
          label="Product Categories"
          value={categoriesCount || '—'}
          icon={Boxes}
          tint="blue"
          badgeText="Classifications"
          badgeType="neutral"
          subtext="Distinct product lines"
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
                placeholder="Search by product name, SKU code, or category..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>

            <div className="filter-group">
              <button
                type="button"
                className={`btn btn-sm ${
                  lowStockOnly ? 'btn-primary' : 'btn-secondary'
                }`}
                onClick={() => {
                  setLowStockOnly(!lowStockOnly);
                  setPage(1);
                }}
              >
                <AlertTriangle size={14} />
                {lowStockOnly ? 'Showing Low Stock Only' : 'Filter Low Stock Only'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="card">
        <div className="table-container" style={{ border: 'none', boxShadow: 'none' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Product Name</th>
                <th>SKU Code</th>
                <th>Category</th>
                <th>Unit Price</th>
                <th>Stock Level</th>
                <th>Safety Threshold</th>
                <th>Location</th>
                {hasRole('Admin', 'Warehouse') && <th style={{ textAlign: 'right' }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8}>
                    <div className="loading-spinner">
                      <div className="spinner" />
                    </div>
                  </td>
                </tr>
              ) : products.length > 0 ? (
                products.map((p) => {
                  const isLow = p.current_stock <= p.min_stock_alert;
                  return (
                    <tr key={p.id}>
                      <td style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                        {p.name}
                      </td>
                      <td className="td-mono">{p.sku}</td>
                      <td>
                        {p.category ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.8rem' }}>
                            <Tag size={13} className="text-secondary" />
                            {p.category}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td style={{ fontWeight: 600 }}>{formatPrice(p.unit_price)}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontWeight: 700, color: isLow ? 'var(--color-error)' : 'var(--color-text-primary)' }}>
                            {p.current_stock}
                          </span>
                          {isLow ? (
                            <span className="badge badge-low-stock">
                              Low Stock
                            </span>
                          ) : (
                            <span className="badge badge-active">
                              In Stock
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={{ color: 'var(--color-text-muted)' }}>{p.min_stock_alert} units</td>
                      <td>
                        {p.location ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.8rem' }}>
                            <MapPin size={13} className="text-secondary" />
                            {p.location}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      {hasRole('Admin', 'Warehouse') && (
                        <td style={{ textAlign: 'right' }}>
                          <button
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '5px 8px' }}
                            onClick={() => handleEdit(p)}
                            title="Edit Product"
                          >
                            <Edit size={14} />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8}>
                    <div className="empty-state">
                      <div className="empty-state-icon">
                        <Package size={24} />
                      </div>
                      <div className="empty-state-title">No Products Found</div>
                      <div className="empty-state-text">
                        {lowStockOnly
                          ? 'No products are currently under minimum stock reserve.'
                          : 'Try modifying your search filter or catalogue a new product.'}
                      </div>
                      {hasRole('Admin', 'Warehouse') && (
                        <button className="btn btn-primary btn-sm" onClick={openCreate}>
                          <Plus size={14} /> Add Product
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

      {/* Add / Edit Product Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editProduct ? 'Edit Product Record' : 'Catalogue New Product'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Product Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Industrial Steel Flange"
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">SKU Identifier *</label>
                    <input
                      type="text"
                      className="form-input"
                      value={form.sku}
                      onChange={(e) => setForm({ ...form, sku: e.target.value })}
                      placeholder="e.g. FLG-IND-01"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Category</label>
                    <input
                      type="text"
                      className="form-input"
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                      placeholder="e.g. Hardware"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Unit Price (₹) *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="form-input"
                      value={form.unit_price}
                      onChange={(e) => setForm({ ...form, unit_price: Number(e.target.value) })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Minimum Stock Alert Threshold</label>
                    <input
                      type="number"
                      min="0"
                      className="form-input"
                      value={form.min_stock_alert}
                      onChange={(e) => setForm({ ...form, min_stock_alert: Number(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="form-row">
                  {!editProduct && (
                    <div className="form-group">
                      <label className="form-label">Initial Stock Quantity</label>
                      <input
                        type="number"
                        min="0"
                        className="form-input"
                        value={form.current_stock}
                        onChange={(e) => setForm({ ...form, current_stock: Number(e.target.value) })}
                      />
                    </div>
                  )}
                  <div className="form-group">
                    <label className="form-label">Warehouse Bay / Location</label>
                    <input
                      type="text"
                      className="form-input"
                      value={form.location}
                      onChange={(e) => setForm({ ...form, location: e.target.value })}
                      placeholder="e.g. Aisle 3 - Bay B"
                    />
                  </div>
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
                  {editProduct ? 'Save Changes' : 'Catalogue Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

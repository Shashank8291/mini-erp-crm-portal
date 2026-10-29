import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { dashboardApi } from '../api/dashboard';
import type { DashboardStats } from '../types';
import PageHeader from '../components/PageHeader';
import KpiCard from '../components/KpiCard';
import {
  Users,
  Package,
  ClipboardList,
  AlertTriangle,
  Plus,
  ArrowRight,
  Eye,
  FileText,
  Clock,
} from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const res = await dashboardApi.getStats();
      setStats(res.data.data);
    } catch (err) {
      console.error('Failed to load stats:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner" />
      </div>
    );
  }

  const hasLowStock = (stats?.products?.lowStock || 0) > 0;

  return (
    <div>
      <PageHeader
        title="Operations Dashboard"
        subtitle="Live metrics, inventory health, and recent sales activities"
        breadcrumb="Overview"
        actions={
          <>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => navigate('/customers')}
            >
              <Users size={15} /> Add Customer
            </button>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => navigate('/orders')}
            >
              <Plus size={15} /> New Sales Order
            </button>
          </>
        }
      />

      {/* Smart KPI Grid */}
      <div className="kpi-grid">
        <KpiCard
          label="Total Customers"
          value={stats?.customers?.total || 0}
          icon={Users}
          tint="indigo"
          badgeText={`${stats?.customers?.active || 0} Active`}
          badgeType="positive"
          subtext={`${stats?.customers?.leads || 0} leads in pipeline`}
          onClick={() => navigate('/customers')}
        />

        <KpiCard
          label="Catalog Products"
          value={stats?.products?.total || 0}
          icon={Package}
          tint="blue"
          badgeText="Active SKUs"
          badgeType="neutral"
          subtext="Tracked in warehouse"
          onClick={() => navigate('/products')}
        />

        <KpiCard
          label="Sales Orders"
          value={stats?.orders?.total || 0}
          icon={ClipboardList}
          tint="emerald"
          badgeText={`${stats?.orders?.confirmed || 0} Confirmed`}
          badgeType="positive"
          subtext={`${stats?.orders?.drafts || 0} draft status`}
          onClick={() => navigate('/orders')}
        />

        <KpiCard
          label="Stock Alert Monitor"
          value={stats?.products?.lowStock || 0}
          icon={AlertTriangle}
          tint={hasLowStock ? 'amber' : 'emerald'}
          badgeText={hasLowStock ? 'Restock Required' : 'All Stock Healthy'}
          badgeType={hasLowStock ? 'negative' : 'positive'}
          subtext={hasLowStock ? 'Items below minimum reserve' : 'Thresholds satisfied'}
          onClick={() => navigate('/products')}
        />
      </div>

      {/* Recent Orders Section */}
      <div className="card">
        <div className="card-header">
          <div>
            <h2 className="card-title">
              <Clock size={18} className="text-secondary" />
              Recent Sales Orders
            </h2>
            <p className="card-description">
              Latest transactions generated across all client accounts
            </p>
          </div>
          <Link to="/orders" className="btn btn-ghost btn-sm">
            View All Orders <ArrowRight size={14} />
          </Link>
        </div>

        <div className="table-container" style={{ border: 'none', boxShadow: 'none' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Order Number</th>
                <th>Client / Account</th>
                <th>Quantity</th>
                <th>Fulfillment Status</th>
                <th>Created Date</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {stats?.recentOrders && stats.recentOrders.length > 0 ? (
                stats.recentOrders.map((order) => (
                  <tr
                    key={order.id}
                    onClick={() => navigate('/orders')}
                    style={{ cursor: 'pointer' }}
                  >
                    <td className="td-mono">{order.order_number}</td>
                    <td>{order.customer_name}</td>
                    <td>{order.total_quantity} units</td>
                    <td>
                      <span className={`badge badge-${order.status.toLowerCase()}`}>
                        {order.status}
                      </span>
                    </td>
                    <td>{new Date(order.created_at).toLocaleDateString()}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate('/orders');
                        }}
                        title="View Order Details"
                      >
                        <Eye size={15} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6}>
                    <div className="empty-state">
                      <div className="empty-state-icon">
                        <FileText size={24} />
                      </div>
                      <div className="empty-state-title">No Orders Recorded</div>
                      <div className="empty-state-text">
                        Create your first sales order to start monitoring real-time dispatch and revenue.
                      </div>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => navigate('/orders')}
                      >
                        <Plus size={14} /> Create Order
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

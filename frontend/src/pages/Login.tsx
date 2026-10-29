import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../api/auth';
import LogoIcon from '../components/LogoIcon';
import { Mail, Lock, ArrowRight, ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await authApi.login(email, password);
      if (res.data.success) {
        login(res.data.data.token, res.data.data.user);
        navigate('/dashboard');
      }
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        (err.response?.status
          ? `Server Error (${err.response.status}). Please try again.`
          : err.message || 'Login failed. Please check network connection.');
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const testCredentials = [
    { role: 'Admin', email: 'admin@erp.com', password: 'Admin@123', badgeColor: 'badge-confirmed' },
    { role: 'Sales', email: 'sales@erp.com', password: 'Sales@123', badgeColor: 'badge-lead' },
    { role: 'Warehouse', email: 'warehouse@erp.com', password: 'Warehouse@123', badgeColor: 'badge-distributor' },
    { role: 'Accounts', email: 'accounts@erp.com', password: 'Accounts@123', badgeColor: 'badge-retail' },
  ];

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo">
            <LogoIcon size={44} />
          </div>
          <h1>NexusERP Operations</h1>
          <p>Sign in to your enterprise ERP + CRM dashboard</p>
        </div>

        {error && (
          <div className="login-error">
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="login-email">
              Email Address
            </label>
            <div className="search-input-wrapper" style={{ minWidth: 'unset' }}>
              <span className="search-icon">
                <Mail size={16} />
              </span>
              <input
                id="login-email"
                type="email"
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                required
                autoFocus
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="login-password">
              Password
            </label>
            <div className="search-input-wrapper" style={{ minWidth: 'unset' }}>
              <span className="search-icon">
                <Lock size={16} />
              </span>
              <input
                id="login-password"
                type="password"
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary login-btn"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 size={16} className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
                Signing in...
              </>
            ) : (
              <>
                Sign In <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        <div className="test-accounts-section">
          <div className="test-accounts-title">
            <ShieldCheck size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
            One-Click Test Profiles
          </div>
          <div className="test-accounts-grid">
            {testCredentials.map((cred) => (
              <button
                key={cred.role}
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ justifyContent: 'space-between', padding: '7px 10px' }}
                onClick={() => {
                  setEmail(cred.email);
                  setPassword(cred.password);
                }}
              >
                <span>{cred.role}</span>
                <span className={`badge ${cred.badgeColor}`} style={{ padding: '1px 6px', fontSize: '0.65rem' }}>
                  Demo
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

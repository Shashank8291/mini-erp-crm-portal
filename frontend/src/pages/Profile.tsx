import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../api/auth';
import PageHeader from '../components/PageHeader';
import {
  User,
  Shield,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Save,
  ArrowLeft,
  Loader2,
} from 'lucide-react';

export default function Profile() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [mobile, setMobile] = useState(user?.mobile || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: string; message: string } | null>(null);

  useEffect(() => {
    authApi
      .getMe()
      .then((res) => {
        if (res.data?.data) {
          const u = res.data.data;
          setName(u.name || '');
          setEmail(u.email || '');
          setMobile(u.mobile || '');
          updateUser(u);
        }
      })
      .catch(console.error);
  }, []);

  const showToast = (type: string, message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword || confirmPassword) {
      if (!currentPassword) {
        showToast('error', 'Please enter your current password to authorize this security change');
        return;
      }
      if (newPassword !== confirmPassword) {
        showToast('error', 'New password and confirmation do not match');
        return;
      }
      if (newPassword.length < 6) {
        showToast('error', 'New password must contain at least 6 characters');
        return;
      }
    }

    try {
      setSaving(true);
      const res = await authApi.updateProfile({
        name,
        email,
        mobile,
        currentPassword: currentPassword || undefined,
        newPassword: newPassword || undefined,
      });

      const updatedUser = res.data.data;
      updateUser(updatedUser);
      showToast('success', 'Profile and account preferences updated successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Failed to update profile settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: 800 }}>
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
        title="Account Preferences"
        subtitle="Manage your profile information, role security parameters, and access credentials"
        breadcrumb="Account"
        actions={
          <button className="btn btn-secondary" onClick={() => navigate(-1)}>
            <ArrowLeft size={16} /> Return to Dashboard
          </button>
        }
      />

      {/* Profile Overview Card */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: 20 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 'var(--radius-full)',
              background: 'var(--color-primary)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem',
              fontWeight: 700,
              boxShadow: 'var(--shadow-sm)',
              flexShrink: 0,
            }}
          >
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                {user?.name || 'User Profile'}
              </h2>
              <span className="badge badge-wholesale">
                <Shield size={12} /> {user?.role || 'Operator'}
              </span>
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginTop: 4 }}>
              {user?.email}
            </div>
          </div>
        </div>
      </div>

      {/* Profile Form Card */}
      <form onSubmit={handleSubmit} className="card">
        <div className="card-header">
          <div>
            <h3 className="card-title">
              <User size={18} className="text-secondary" /> Personal Profile
            </h3>
            <p className="card-description">
              Update your corporate identity and contact points
            </p>
          </div>
        </div>

        <div className="card-body">
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input
                type="text"
                className="form-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Email Address *</label>
              <input
                type="email"
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Mobile Contact Number</label>
              <input
                type="text"
                className="form-input"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                placeholder="+91 98765 43210"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Assigned Access Role</label>
              <input
                type="text"
                className="form-input"
                value={user?.role || ''}
                disabled
                style={{ background: 'var(--color-bg-subtle)', cursor: 'not-allowed', color: 'var(--color-text-muted)' }}
              />
            </div>
          </div>

          <div style={{ margin: '24px 0 16px', borderTop: '1px solid var(--color-border-subtle)', paddingTop: 20 }}>
            <h3 className="card-title" style={{ marginBottom: 4 }}>
              <KeyRound size={18} className="text-secondary" /> Change Security Password
            </h3>
            <p className="card-description" style={{ marginBottom: 16 }}>
              Leave blank if you do not wish to update your current password
            </p>

            <div className="form-group">
              <label className="form-label">Current Password</label>
              <input
                type="password"
                className="form-input"
                placeholder="Required only when altering password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">New Password</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="Minimum 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Confirm New Password</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="Repeat new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="card-header" style={{ justifyContent: 'flex-end', background: 'rgba(11, 16, 26, 0.4)' }}>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={saving}
          >
            {saving ? (
              <>
                <Loader2 size={16} className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
                Saving Changes...
              </>
            ) : (
              <>
                <Save size={16} /> Save Preferences
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

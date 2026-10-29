import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LogoIcon from './LogoIcon';
import {
  LayoutDashboard,
  Users,
  Package,
  ArrowLeftRight,
  ClipboardList,
  LogOut,
  Menu,
  X,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { user, logout, hasRole } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    {
      path: '/dashboard',
      icon: LayoutDashboard,
      label: 'Dashboard',
      roles: ['Admin', 'Sales', 'Warehouse', 'Accounts'],
    },
    {
      path: '/customers',
      icon: Users,
      label: 'Customers',
      roles: ['Admin', 'Sales', 'Accounts'],
    },
    {
      path: '/products',
      icon: Package,
      label: 'Products',
      roles: ['Admin', 'Sales', 'Warehouse', 'Accounts'],
    },
    {
      path: '/stock',
      icon: ArrowLeftRight,
      label: 'Stock Movements',
      roles: ['Admin', 'Warehouse'],
    },
    {
      path: '/orders',
      icon: ClipboardList,
      label: 'Sales Orders',
      roles: ['Admin', 'Sales', 'Accounts'],
    },
  ];

  return (
    <>
      <button
        className="hamburger"
        onClick={() => onClose()}
        aria-label="Toggle navigation menu"
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <LogoIcon size={32} />
          <div className="sidebar-brand-name">
            NexusERP
            <span className="sidebar-brand-badge">PRO</span>
          </div>
        </div>

        <div className="sidebar-nav-container">
          <div className="sidebar-nav-label">Main Menu</div>
          <nav>
            {navItems.map((item) => {
              if (!hasRole(...item.roles)) return null;
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `sidebar-link ${isActive ? 'active' : ''}`
                  }
                  onClick={() => onClose()}
                >
                  <span className="sidebar-link-icon">
                    <Icon size={18} strokeWidth={2} />
                  </span>
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        <div className="sidebar-footer">
          <div
            className="sidebar-user-card"
            onClick={() => {
              navigate('/profile');
              onClose();
            }}
            title="Account Settings"
          >
            <div className="sidebar-user-avatar">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="sidebar-user-details">
              <div className="sidebar-user-name">{user?.name || 'User'}</div>
              <div className="sidebar-user-role">{user?.role || 'Guest'}</div>
            </div>
            <button
              className="sidebar-logout-btn"
              onClick={(e) => {
                e.stopPropagation();
                handleLogout();
              }}
              title="Logout"
              aria-label="Logout"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

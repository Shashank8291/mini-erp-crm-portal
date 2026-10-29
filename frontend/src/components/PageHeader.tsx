import React from 'react';
import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumb?: string;
  actions?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  breadcrumb,
  actions,
}) => {
  return (
    <div className="page-header">
      <div>
        <div className="breadcrumbs">
          <Link to="/dashboard">ERP</Link>
          <ChevronRight size={14} className="breadcrumb-separator" />
          <span>{breadcrumb || title}</span>
        </div>
        <h1 className="page-title">{title}</h1>
        {subtitle && <p className="page-subtitle">{subtitle}</p>}
      </div>

      {actions && <div className="header-actions">{actions}</div>}
    </div>
  );
};

export default PageHeader;

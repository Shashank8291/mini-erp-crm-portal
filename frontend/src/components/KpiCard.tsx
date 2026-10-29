import React from 'react';
import type { LucideIcon } from 'lucide-react';

export interface KpiCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  tint?: 'indigo' | 'blue' | 'emerald' | 'amber' | 'sky' | 'rose';
  subtext?: string;
  badgeText?: string;
  badgeType?: 'positive' | 'negative' | 'neutral';
  onClick?: () => void;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  label,
  value,
  icon: Icon,
  tint = 'indigo',
  subtext,
  badgeText,
  badgeType = 'neutral',
  onClick,
}) => {
  return (
    <div
      className={`kpi-card ${onClick ? 'clickable' : ''}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <div className="kpi-card-header">
        <span className="kpi-label">{label}</span>
        <div className={`kpi-icon-container kpi-icon-${tint}`}>
          <Icon size={20} strokeWidth={2} />
        </div>
      </div>

      <div className="kpi-value">{value}</div>

      {(subtext || badgeText) && (
        <div className="kpi-footer">
          {badgeText && (
            <span className={`kpi-badge ${badgeType}`}>
              {badgeText}
            </span>
          )}
          {subtext && <span>{subtext}</span>}
        </div>
      )}
    </div>
  );
};

export default KpiCard;


import type { LucideIcon } from 'lucide-react';

interface KpiCardProps {
  label: string;
  value: string;
  hint: string;
  icon: LucideIcon;
  tone?: 'green' | 'gold' | 'red' | 'blue';
}

export function KpiCard({ label, value, hint, icon: Icon, tone = 'green' }: KpiCardProps) {
  return (
    <article className={`kpi-card ${tone}`}>
      <div className="kpi-icon">
        <Icon size={24} aria-hidden />
      </div>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
        <small>{hint}</small>
      </div>
    </article>
  );
}

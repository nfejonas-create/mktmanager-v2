import type { ReactNode } from 'react';

interface MetricCardProps {
  title: string;
  value: string | number;
  delta?: string;
  icon?: ReactNode;
}

export default function MetricCard({ title, value, delta, icon }: MetricCardProps) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400">{title}</p>
          <p className="mt-3 text-3xl font-bold text-white">{value}</p>
          {delta ? <p className="mt-2 text-sm text-slate-400">{delta}</p> : null}
        </div>
        {icon ? <div className="text-blue-400">{icon}</div> : null}
      </div>
    </div>
  );
}

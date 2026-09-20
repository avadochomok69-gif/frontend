import React, { useMemo, useState } from 'react';
import { formatCurrency, type Order } from '../../lib/api';
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area,
} from 'recharts';
import {
  startOfMonth, endOfMonth, subMonths, isWithinInterval, parseISO,
  format, eachDayOfInterval, isSameDay, eachMonthOfInterval, startOfYear, endOfYear
} from 'date-fns';

type Props = { orders: Order[] };
type Timeframe = 'thisMonth' | 'lastMonth' | 'last3Months' | 'thisYear';

export const AdminSummary: React.FC<Props> = ({ orders }) => {
  const [tf, setTf] = useState<Timeframe>('thisMonth');

  const stats = useMemo(() => {
    const now = new Date();
    let startDate: Date, endDate: Date = now;

    if (tf === 'thisMonth') { startDate = startOfMonth(now); endDate = endOfMonth(now); }
    else if (tf === 'lastMonth') { startDate = startOfMonth(subMonths(now, 1)); endDate = endOfMonth(subMonths(now, 1)); }
    else if (tf === 'last3Months') { startDate = startOfMonth(subMonths(now, 2)); endDate = endOfMonth(now); }
    else { startDate = startOfYear(now); endDate = endOfYear(now); }

    const periodOrders = orders.filter((o) => {
      try { return isWithinInterval(parseISO(o.createdAt), { start: startDate, end: endDate }); }
      catch { return false; }
    });

    let totalSales = 0, pending = 0, approved = 0, delivered = 0, cancelled = 0;
    periodOrders.forEach((o) => {
      if (o.status !== 'CANCELLED') totalSales += o.totalAmount;
      if (o.status === 'PENDING') pending++;
      if (o.status === 'APPROVED') approved++;
      if (o.status === 'DELIVERED') delivered++;
      if (o.status === 'CANCELLED') cancelled++;
    });

    const isDaily = tf === 'thisMonth' || tf === 'lastMonth';
    const chartData = isDaily
      ? eachDayOfInterval({ start: startDate, end: endDate }).map(day => {
          const s = periodOrders.filter(o => { try { return isSameDay(parseISO(o.createdAt), day) && o.status !== 'CANCELLED'; } catch { return false; } }).reduce((a, o) => a + o.totalAmount, 0);
          return { name: format(day, 'd MMM'), sales: s };
        })
      : eachMonthOfInterval({ start: startDate, end: endDate }).map(month => {
          const s = periodOrders.filter(o => { try { const d = parseISO(o.createdAt); return d.getMonth() === month.getMonth() && d.getFullYear() === month.getFullYear() && o.status !== 'CANCELLED'; } catch { return false; } }).reduce((a, o) => a + o.totalAmount, 0);
          return { name: format(month, 'MMM yyyy'), sales: s };
        });

    return { totalSales, pending, approved, delivered, cancelled, total: periodOrders.length, chartData };
  }, [orders, tf]);

  const kpis = [
    { label: 'Total Sales', value: formatCurrency(stats.totalSales), color: 'var(--color-primary)', bg: 'rgba(255,107,0,0.08)' },
    { label: 'Pending', value: stats.pending, color: '#f59e0b', bg: 'rgba(245,158,11,0.08)' },
    { label: 'Approved', value: stats.approved, color: '#16a34a', bg: 'rgba(22,163,74,0.08)' },
    { label: 'Delivered', value: stats.delivered, color: '#2563eb', bg: 'rgba(37,99,235,0.08)' },
    { label: 'Cancelled', value: stats.cancelled, color: '#9ca3af', bg: 'rgba(156,163,175,0.08)' },
    { label: 'Total Orders', value: stats.total, color: '#111', bg: '#f9f9f9' },
  ];

  return (
    <div className="as-wrap">
      <div className="as-header">
        <h3>Business Overview</h3>
        <select className="as-select" value={tf} onChange={(e) => setTf(e.target.value as Timeframe)}>
          <option value="thisMonth">This Month</option>
          <option value="lastMonth">Last Month</option>
          <option value="last3Months">Last 3 Months</option>
          <option value="thisYear">This Year</option>
        </select>
      </div>

      <div className="as-kpi-grid">
        {kpis.map((k) => (
          <div key={k.label} className="as-kpi" style={{ '--kpi-bg': k.bg, '--kpi-color': k.color } as React.CSSProperties}>
            <div className="as-kpi-label">{k.label}</div>
            <div className="as-kpi-value">{k.value}</div>
          </div>
        ))}
      </div>

      <div className="as-chart-card">
        <h4>Sales Trend</h4>
        <div style={{ width: '100%', height: 360 }}>
          <ResponsiveContainer>
            <AreaChart data={stats.chartData} margin={{ top: 15, right: 20, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="cfGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ff6b00" stopOpacity={0.5} />
                  <stop offset="95%" stopColor="#ff6b00" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="name" tick={{ fill: '#888', fontSize: 11 }} tickMargin={8} />
              <YAxis tick={{ fill: '#888', fontSize: 11 }} tickFormatter={(v) => `৳${v}`} tickMargin={8} />
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <Tooltip
                contentStyle={{ background: '#111', border: '1px solid #ff6b00', borderRadius: 8, color: '#fff' }}
                itemStyle={{ color: '#ff6b00' }}
                formatter={(v: any) => [formatCurrency(Number(v)), 'Sales']}
              />
              <Area type="monotone" dataKey="sales" stroke="#ff6b00" strokeWidth={2.5} fill="url(#cfGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

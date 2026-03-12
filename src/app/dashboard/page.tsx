'use client';

import { useEffect, useState } from 'react';
import {
  DollarSign, ShoppingCart, Users, Bell, RefreshCw,
  TrendingUp, Package, AlertCircle, CheckCircle2, Clock
} from 'lucide-react';
import StatCard from '@/components/ui/StatCard';
import { formatCurrency, formatDate, formatDateTime, daysUntil, isOverdue } from '@/lib/utils';
import StatusBadge from '@/components/ui/StatusBadge';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line
} from 'recharts';
import Link from 'next/link';

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard')
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-10 h-10 rounded-full gradient-green flex items-center justify-center mx-auto mb-3 animate-pulse">
            <RefreshCw className="w-5 h-5 text-white" />
          </div>
          <p className="text-sm text-gray-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const salesChartData = data?.monthlyRevenue?.slice(-14).map((d: any) => ({
    date: formatDate(d.orderDate),
    revenue: d._sum?.totalAmount || 0,
    orders: d._count || 0,
  })) || [];

  const leadChartData = data?.leadsByStatus?.map((l: any) => ({
    status: l.status.replace('_', ' '),
    count: l._count,
  })) || [];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">Your supplement sales at a glance</p>
        </div>
        <Link
          href="/followups"
          className="flex items-center gap-2 bg-green-50 hover:bg-green-100 text-green-700 text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          <Bell className="w-4 h-4" />
          View All Follow-Ups
        </Link>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Revenue"
          value={formatCurrency(data?.totalRevenue || 0)}
          icon={DollarSign}
          iconColor="text-green-600"
          iconBg="bg-green-50"
          subtitle="All-time paid orders"
        />
        <StatCard
          title="Orders Today"
          value={data?.ordersToday || 0}
          icon={ShoppingCart}
          iconColor="text-blue-600"
          iconBg="bg-blue-50"
          subtitle="New orders placed"
        />
        <StatCard
          title="Leads Today"
          value={data?.leadsToday || 0}
          icon={Users}
          iconColor="text-purple-600"
          iconBg="bg-purple-50"
          subtitle="New leads added"
        />
        <StatCard
          title="Upcoming Follow-Ups"
          value={(data?.upcomingFollowUps || 0) + (data?.refillReminders || 0)}
          icon={Bell}
          iconColor="text-orange-600"
          iconBg="bg-orange-50"
          subtitle="Due in next 7 days"
        />
      </div>

      {/* Secondary stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="stat-card flex items-center gap-4">
          <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
            <Users className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Lead Follow-Ups</p>
            <p className="font-display text-xl font-bold text-gray-900">{data?.upcomingFollowUps || 0}</p>
          </div>
        </div>
        <div className="stat-card flex items-center gap-4">
          <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center">
            <RefreshCw className="w-5 h-5 text-orange-500" />
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Refill Reminders</p>
            <p className="font-display text-xl font-bold text-gray-900">{data?.refillReminders || 0}</p>
          </div>
        </div>
        <div className="stat-card flex items-center gap-4">
          <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
            <AlertCircle className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Unread Alerts</p>
            <p className="font-display text-xl font-bold text-gray-900">{data?.unreadNotifications || 0}</p>
          </div>
        </div>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue chart */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-display font-bold text-gray-900">Recent Revenue</h3>
              <p className="text-xs text-gray-400 mt-0.5">Last 30 days</p>
            </div>
            <TrendingUp className="w-5 h-5 text-green-500" />
          </div>
          {salesChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={salesChartData} barSize={20}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: any) => [formatCurrency(v), 'Revenue']} />
                <Bar dataKey="revenue" fill="#16a34a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-sm text-gray-400">No sales data yet</div>
          )}
        </div>

        {/* Top products */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-bold text-gray-900">Top Products</h3>
            <Package className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-3">
            {(data?.topProducts || []).map((product: any, i: number) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-800 truncate">{product.name}</p>
                  <p className="text-[10px] text-gray-400">{product.sales} units sold</p>
                </div>
                <div className="text-xs font-bold text-green-600">{formatCurrency(product.revenue)}</div>
              </div>
            ))}
            {(!data?.topProducts || data.topProducts.length === 0) && (
              <p className="text-sm text-gray-400 text-center py-4">No sales data yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending follow-ups */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
            <h3 className="font-display font-bold text-gray-900">Upcoming Follow-Ups</h3>
            <Link href="/followups" className="text-xs text-green-600 hover:text-green-700 font-medium">View all</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {(data?.pendingFollowUps || []).slice(0, 5).map((followUp: any) => {
              const days = daysUntil(followUp.dueDate);
              const overdue = isOverdue(followUp.dueDate);
              return (
                <div key={followUp.id} className="px-5 py-3 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        followUp.type === 'refill_followup' ? 'bg-blue-50' : 'bg-green-50'
                      }`}>
                        {followUp.type === 'refill_followup'
                          ? <RefreshCw className="w-4 h-4 text-blue-500" />
                          : <Bell className="w-4 h-4 text-green-500" />
                        }
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-800 line-clamp-1">{followUp.title}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">
                          {followUp.lead?.phone || followUp.customer?.phone || 'No contact'}
                        </p>
                      </div>
                    </div>
                    <div className={`text-xs font-bold ${overdue ? 'text-red-600' : days <= 1 ? 'text-orange-500' : 'text-gray-500'}`}>
                      {overdue ? 'Overdue' : days === 0 ? 'Today' : `${days}d`}
                    </div>
                  </div>
                </div>
              );
            })}
            {(!data?.pendingFollowUps || data.pendingFollowUps.length === 0) && (
              <div className="px-5 py-10 text-center text-sm text-gray-400">
                <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-green-400" />
                All caught up! No pending follow-ups.
              </div>
            )}
          </div>
        </div>

        {/* Recent orders */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
            <h3 className="font-display font-bold text-gray-900">Recent Orders</h3>
            <Link href="/orders" className="text-xs text-green-600 hover:text-green-700 font-medium">View all</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {(data?.recentOrders || []).map((order: any) => (
              <div key={order.id} className="px-5 py-3 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-gray-800">{order.orderId}</span>
                      <StatusBadge status={order.paymentStatus} />
                    </div>
                    <p className="text-[10px] text-gray-400 mt-0.5">{order.customer?.name}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-gray-900">{formatCurrency(order.totalAmount)}</div>
                    <div className="text-[10px] text-gray-400">{formatDate(order.orderDate)}</div>
                  </div>
                </div>
              </div>
            ))}
            {(!data?.recentOrders || data.recentOrders.length === 0) && (
              <div className="px-5 py-10 text-center text-sm text-gray-400">No orders yet</div>
            )}
          </div>
        </div>
      </div>

      {/* Lead status breakdown */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-bold text-gray-900">Lead Pipeline</h3>
          <Link href="/leads" className="text-xs text-green-600 hover:text-green-700 font-medium">Manage leads</Link>
        </div>
        <div className="grid grid-cols-5 gap-3">
          {['new', 'contacted', 'interested', 'not_interested', 'converted'].map((status) => {
            const item = data?.leadsByStatus?.find((l: any) => l.status === status);
            const count = item?._count || 0;
            const colors: Record<string, { bg: string; text: string; bar: string }> = {
              new: { bg: 'bg-blue-50', text: 'text-blue-700', bar: 'bg-blue-400' },
              contacted: { bg: 'bg-yellow-50', text: 'text-yellow-700', bar: 'bg-yellow-400' },
              interested: { bg: 'bg-green-50', text: 'text-green-700', bar: 'bg-green-400' },
              not_interested: { bg: 'bg-red-50', text: 'text-red-700', bar: 'bg-red-400' },
              converted: { bg: 'bg-purple-50', text: 'text-purple-700', bar: 'bg-purple-400' },
            };
            const c = colors[status];
            return (
              <div key={status} className={`${c.bg} rounded-xl p-4 text-center`}>
                <div className={`font-display text-2xl font-bold ${c.text}`}>{count}</div>
                <div className="text-xs font-medium text-gray-600 mt-1 capitalize">
                  {status.replace('_', ' ')}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

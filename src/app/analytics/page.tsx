'use client';

import { useEffect, useState } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { TrendingUp, ShoppingCart, Users, RefreshCw, Target, Award } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

const COLORS = ['#16a34a', '#22c55e', '#4ade80', '#86efac', '#bbf7d0', '#2563eb', '#3b82f6', '#60a5fa'];

export default function AnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30d');

  useEffect(() => {
    setLoading(true);
    fetch(`/api/analytics?period=${period}`)
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [period]);

  const periods = [
    { value: '7d', label: '7 Days' },
    { value: '30d', label: '30 Days' },
    { value: '90d', label: '90 Days' },
    { value: '12m', label: '12 Months' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-sm text-gray-500 mt-0.5">Sales, leads, and performance metrics</p>
        </div>
        <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl p-1">
          {periods.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                period === p.value
                  ? 'gradient-green text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-10 h-10 rounded-full gradient-green flex items-center justify-center mx-auto mb-3 animate-pulse">
              <RefreshCw className="w-5 h-5 text-white" />
            </div>
            <p className="text-sm text-gray-500">Loading analytics...</p>
          </div>
        </div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Revenue', value: formatCurrency(data?.summary?.totalRevenue || 0), icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
              { label: 'Total Orders', value: data?.summary?.totalOrders || 0, icon: ShoppingCart, color: 'text-blue-600', bg: 'bg-blue-50' },
              { label: 'Avg Order Value', value: formatCurrency(data?.summary?.avgOrderValue || 0), icon: Award, color: 'text-purple-600', bg: 'bg-purple-50' },
              { label: 'Conversion Rate', value: `${data?.summary?.conversionRate || 0}%`, icon: Target, color: 'text-orange-600', bg: 'bg-orange-50' },
            ].map((card) => (
              <div key={card.label} className="stat-card">
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${card.bg}`}>
                    <card.icon className={`w-5 h-5 ${card.color}`} />
                  </div>
                </div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{card.label}</p>
                <p className="font-display text-2xl font-bold text-gray-900 mt-0.5">{card.value}</p>
              </div>
            ))}
          </div>

          {/* Revenue chart */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-display font-bold text-gray-900">Revenue Over Time</h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  {period === '12m' ? 'Monthly revenue' : 'Daily revenue'}
                </p>
              </div>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            {data?.dailySales?.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={data.dailySales}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis
                    dataKey={period === '12m' ? 'month' : 'date'}
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    interval={period === '30d' ? 4 : 0}
                  />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip formatter={(v: any) => [formatCurrency(v), 'Revenue']} />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#16a34a"
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ r: 5, fill: '#16a34a' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-sm text-gray-400">No revenue data for this period</div>
            )}
          </div>

          {/* Orders chart + Lead funnel */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Orders per period */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="font-display font-bold text-gray-900">Orders Volume</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Number of orders placed</p>
                </div>
                <ShoppingCart className="w-5 h-5 text-blue-500" />
              </div>
              {data?.dailySales?.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={data.dailySales} barSize={period === '12m' ? 20 : 8}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                    <XAxis
                      dataKey={period === '12m' ? 'month' : 'date'}
                      tick={{ fontSize: 11 }}
                      tickLine={false}
                      axisLine={false}
                      interval={period === '30d' ? 4 : 0}
                    />
                    <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                    <Tooltip formatter={(v: any) => [v, 'Orders']} />
                    <Bar dataKey="orders" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-48 flex items-center justify-center text-sm text-gray-400">No order data</div>
              )}
            </div>

            {/* Lead funnel */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="font-display font-bold text-gray-900">Lead Pipeline</h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {data?.summary?.totalLeads || 0} leads · {data?.summary?.conversionRate || 0}% converted
                  </p>
                </div>
                <Users className="w-5 h-5 text-purple-500" />
              </div>
              {data?.leadsByStatus?.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={data.leadsByStatus.filter((l: any) => l.count > 0)}
                      dataKey="count"
                      nameKey="status"
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={3}
                    >
                      {data.leadsByStatus.map((_: any, index: number) => (
                        <Cell key={index} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: any, name: any) => [v, name?.replace('_', ' ')]} />
                    <Legend
                      formatter={(value) => value.replace('_', ' ')}
                      iconType="circle"
                      iconSize={8}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-48 flex items-center justify-center text-sm text-gray-400">No lead data</div>
              )}
            </div>
          </div>

          {/* Top products */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-display font-bold text-gray-900">Top Selling Products</h3>
                <p className="text-xs text-gray-400 mt-0.5">By revenue</p>
              </div>
              <Award className="w-5 h-5 text-yellow-500" />
            </div>
            {data?.topProducts?.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={data.topProducts} layout="vertical" barSize={16}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    width={140}
                  />
                  <Tooltip formatter={(v: any) => [formatCurrency(v), 'Revenue']} />
                  <Bar dataKey="revenue" fill="#16a34a" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-48 flex items-center justify-center text-sm text-gray-400">No product data</div>
            )}
          </div>

          {/* Retention stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="stat-card col-span-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
                  <RefreshCw className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Repeat Customers</p>
                  <p className="font-display text-2xl font-bold text-gray-900">{data?.summary?.repeatCustomers || 0}</p>
                </div>
              </div>
              <div className="bg-green-50 rounded-lg p-2 text-center">
                <span className="text-sm font-bold text-green-700">{data?.summary?.repeatRate || 0}% repeat rate</span>
              </div>
            </div>
            <div className="stat-card col-span-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                  <Target className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Converted Leads</p>
                  <p className="font-display text-2xl font-bold text-gray-900">{data?.summary?.convertedLeads || 0}</p>
                </div>
              </div>
              <div className="bg-blue-50 rounded-lg p-2 text-center">
                <span className="text-sm font-bold text-blue-700">{data?.summary?.conversionRate || 0}% conversion rate</span>
              </div>
            </div>
            <div className="stat-card col-span-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
                  <Award className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Avg Order Value</p>
                  <p className="font-display text-2xl font-bold text-gray-900">{formatCurrency(data?.summary?.avgOrderValue || 0)}</p>
                </div>
              </div>
              <div className="bg-purple-50 rounded-lg p-2 text-center">
                <span className="text-sm font-bold text-purple-700">per order</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

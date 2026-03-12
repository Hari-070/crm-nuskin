'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus, Phone, Mail, MapPin, Tag, ShoppingBag } from 'lucide-react';
import DataTable from '@/components/tables/DataTable';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import StatusBadge from '@/components/ui/StatusBadge';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [showDetail, setShowDetail] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: '', phone: '', email: '', address: '', city: '', tags: '', notes: '',
  });

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: page.toString(), pageSize: '20',
      ...(search && { search }),
    });
    const res = await fetch(`/api/customers?${params}`);
    const data = await res.json();
    setCustomers(data.data || []);
    setTotal(data.total || 0);
    setLoading(false);
  }, [page, search]);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

  const fetchDetail = async (id: string) => {
    const res = await fetch(`/api/customers/${id}`);
    const data = await res.json();
    setShowDetail(data.data);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const tags = form.tags.split(',').map(t => t.trim()).filter(Boolean);
    const res = await fetch('/api/customers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, tags }),
    });
    if (res.ok) {
      setShowAdd(false);
      setForm({ name: '', phone: '', email: '', address: '', city: '', tags: '', notes: '' });
      fetchCustomers();
    }
    setSaving(false);
  };

  const columns = [
    {
      key: 'name',
      label: 'Customer',
      render: (row: any) => (
        <div>
          <div className="font-semibold text-gray-900 text-sm">{row.name}</div>
          <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
            <Phone className="w-3 h-3" />{row.phone}
          </div>
        </div>
      ),
    },
    {
      key: 'contact',
      label: 'Contact',
      render: (row: any) => (
        <div className="text-xs text-gray-500 space-y-0.5">
          {row.email && <div className="flex items-center gap-1"><Mail className="w-3 h-3" />{row.email}</div>}
          {row.city && <div className="flex items-center gap-1"><MapPin className="w-3 h-3" />{row.city}</div>}
        </div>
      ),
    },
    {
      key: 'tags',
      label: 'Tags',
      render: (row: any) => (
        <div className="flex flex-wrap gap-1">
          {(row.tags || []).map((tag: string) => (
            <span key={tag} className="bg-blue-50 text-blue-700 text-[10px] font-semibold px-2 py-0.5 rounded-full">
              {tag}
            </span>
          ))}
        </div>
      ),
    },
    {
      key: 'orders',
      label: 'Orders',
      render: (row: any) => (
        <div className="flex items-center gap-1.5">
          <ShoppingBag className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-sm font-semibold text-gray-700">{row._count?.orders || 0}</span>
        </div>
      ),
    },
    {
      key: 'totalSpent',
      label: 'Total Spent',
      render: (row: any) => (
        <span className="font-bold text-green-600 text-sm">{formatCurrency(row.totalSpent || 0)}</span>
      ),
    },
    {
      key: 'lastOrder',
      label: 'Last Order',
      render: (row: any) => (
        <span className="text-xs text-gray-400">
          {row.orders?.[0] ? formatDate(row.orders[0].orderDate) : '—'}
        </span>
      ),
    },
    {
      key: 'createdAt',
      label: 'Since',
      render: (row: any) => <span className="text-xs text-gray-400">{formatDate(row.createdAt)}</span>,
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900">Customers</h1>
          <p className="text-sm text-gray-500 mt-0.5">{total} total customers</p>
        </div>
        <Button icon={Plus} onClick={() => setShowAdd(true)}>Add Customer</Button>
      </div>

      <DataTable
        columns={columns}
        data={customers}
        total={total}
        page={page}
        pageSize={20}
        loading={loading}
        searchPlaceholder="Search customers..."
        onSearch={(q) => { setSearch(q); setPage(1); }}
        onPageChange={setPage}
        onRowClick={(row) => fetchDetail(row.id!)}
      />

      {/* Add Customer Modal */}
      <Modal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        title="Add New Customer"
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button loading={saving} onClick={handleAdd as any}>Save Customer</Button>
          </>
        }
      >
        <form onSubmit={handleAdd} className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Name *</label>
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-400"
              placeholder="Full name" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Phone *</label>
            <input required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-400"
              placeholder="+91 9876543210" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Email</label>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-400"
              placeholder="email@example.com" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">City</label>
            <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-400"
              placeholder="Mumbai" />
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Address</label>
            <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-400"
              placeholder="Full address" />
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Tags</label>
            <input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-400"
              placeholder="vip, regular, bulk-buyer (comma separated)" />
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Notes</label>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={3} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-400 resize-none"
              placeholder="Any notes about this customer..." />
          </div>
        </form>
      </Modal>

      {/* Customer Detail Modal */}
      {showDetail && (
        <Modal
          open={!!showDetail}
          onClose={() => setShowDetail(null)}
          title="Customer Profile"
          size="xl"
          footer={<Button variant="outline" onClick={() => setShowDetail(null)}>Close</Button>}
        >
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-green-50 rounded-xl p-4">
                <p className="text-xs text-green-600 font-medium uppercase tracking-wide">Total Spent</p>
                <p className="font-display text-2xl font-bold text-green-700 mt-1">{formatCurrency(showDetail.totalSpent || 0)}</p>
              </div>
              <div className="bg-blue-50 rounded-xl p-4">
                <p className="text-xs text-blue-600 font-medium uppercase tracking-wide">Total Orders</p>
                <p className="font-display text-2xl font-bold text-blue-700 mt-1">{showDetail.orders?.length || 0}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">Name</p>
                <p className="font-semibold text-gray-900">{showDetail.name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">Phone</p>
                <a href={`tel:${showDetail.phone}`} className="font-medium text-green-600 hover:underline">{showDetail.phone}</a>
              </div>
              {showDetail.email && (
                <div>
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">Email</p>
                  <a href={`mailto:${showDetail.email}`} className="font-medium text-blue-600 hover:underline">{showDetail.email}</a>
                </div>
              )}
              {showDetail.city && (
                <div>
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">City</p>
                  <p className="font-medium text-gray-700">{showDetail.city}</p>
                </div>
              )}
            </div>

            {showDetail.tags?.length > 0 && (
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-2">Tags</p>
                <div className="flex flex-wrap gap-1.5">
                  {showDetail.tags.map((tag: string) => (
                    <span key={tag} className="bg-blue-50 text-blue-700 text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1">
                      <Tag className="w-3 h-3" />{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Order history */}
            <div>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-3">Purchase History</p>
              <div className="space-y-2">
                {(showDetail.orders || []).map((order: any) => (
                  <div key={order.id} className="bg-gray-50 rounded-lg p-3 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-800">{order.orderId}</span>
                        <StatusBadge status={order.paymentStatus} />
                        <StatusBadge status={order.deliveryStatus} />
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        {order.items?.map((i: any) => `${i.product?.name} ×${i.quantity}`).join(', ')}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-gray-900">{formatCurrency(order.totalAmount)}</div>
                      <div className="text-xs text-gray-400">{formatDate(order.orderDate)}</div>
                    </div>
                  </div>
                ))}
                {(!showDetail.orders || showDetail.orders.length === 0) && (
                  <p className="text-sm text-gray-400 py-4 text-center">No orders yet</p>
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

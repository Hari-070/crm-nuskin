'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus, Package, Trash2 } from 'lucide-react';
import DataTable from '@/components/tables/DataTable';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import StatusBadge from '@/components/ui/StatusBadge';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [deliveryFilter, setDeliveryFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [showDetail, setShowDetail] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [orderItems, setOrderItems] = useState<{ productId: string; quantity: number; price: number }[]>([
    { productId: '', quantity: 1, price: 0 },
  ]);
  const [paymentStatus, setPaymentStatus] = useState('pending');
  const [deliveryStatus, setDeliveryStatus] = useState('processing');
  const [orderNotes, setOrderNotes] = useState('');

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: page.toString(), pageSize: '20',
      ...(search && { search }),
      ...(paymentFilter && { paymentStatus: paymentFilter }),
      ...(deliveryFilter && { deliveryStatus: deliveryFilter }),
    });
    const res = await fetch(`/api/orders?${params}`);
    const data = await res.json();
    setOrders(data.data || []);
    setTotal(data.total || 0);
    setLoading(false);
  }, [page, search, paymentFilter, deliveryFilter]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const openAdd = async () => {
    const [cRes, pRes] = await Promise.all([
      fetch('/api/customers?pageSize=100'),
      fetch('/api/products?pageSize=100&activeOnly=true'),
    ]);
    const [cData, pData] = await Promise.all([cRes.json(), pRes.json()]);
    setCustomers(cData.data || []);
    setProducts(pData.data || []);
    setShowAdd(true);
  };

  const updateItem = (idx: number, field: string, value: any) => {
    const items = [...orderItems];
    items[idx] = { ...items[idx], [field]: value };
    if (field === 'productId') {
      const product = products.find((p) => p.id === value);
      if (product) items[idx].price = product.price;
    }
    setOrderItems(items);
  };

  const totalAmount = orderItems.reduce((sum, item) => sum + (item.price * item.quantity || 0), 0);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerId: selectedCustomer,
        items: orderItems.filter((i) => i.productId),
        paymentStatus,
        deliveryStatus,
        notes: orderNotes,
      }),
    });
    if (res.ok) {
      setShowAdd(false);
      setOrderItems([{ productId: '', quantity: 1, price: 0 }]);
      setSelectedCustomer('');
      fetchOrders();
    }
    setSaving(false);
  };

  const handleUpdateStatus = async (id: string, updates: any) => {
    await fetch(`/api/orders/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    fetchOrders();
    setShowDetail(null);
  };

  const columns = [
    {
      key: 'orderId',
      label: 'Order ID',
      render: (row: any) => <span className="font-mono text-xs font-semibold text-gray-800">{row.orderId}</span>,
    },
    {
      key: 'customer',
      label: 'Customer',
      render: (row: any) => (
        <div>
          <div className="font-semibold text-sm text-gray-900">{row.customer?.name}</div>
          <div className="text-xs text-gray-400">{row.customer?.phone}</div>
        </div>
      ),
    },
    {
      key: 'items',
      label: 'Items',
      render: (row: any) => (
        <div className="flex items-center gap-1.5">
          <Package className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-xs text-gray-600">{row.items?.length || 0} item{row.items?.length !== 1 ? 's' : ''}</span>
        </div>
      ),
    },
    {
      key: 'totalAmount',
      label: 'Amount',
      render: (row: any) => <span className="font-bold text-green-600">{formatCurrency(row.totalAmount)}</span>,
    },
    {
      key: 'paymentStatus',
      label: 'Payment',
      render: (row: any) => <StatusBadge status={row.paymentStatus} />,
    },
    {
      key: 'deliveryStatus',
      label: 'Delivery',
      render: (row: any) => <StatusBadge status={row.deliveryStatus} />,
    },
    {
      key: 'refillDate',
      label: 'Refill Date',
      render: (row: any) => (
        <span className="text-xs text-gray-400">
          {row.refillDate ? formatDate(row.refillDate) : '—'}
        </span>
      ),
    },
    {
      key: 'orderDate',
      label: 'Order Date',
      render: (row: any) => <span className="text-xs text-gray-400">{formatDate(row.orderDate)}</span>,
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900">Orders</h1>
          <p className="text-sm text-gray-500 mt-0.5">{total} total orders</p>
        </div>
        <Button icon={Plus} onClick={openAdd}>New Order</Button>
      </div>

      <DataTable
        columns={columns}
        data={orders}
        total={total}
        page={page}
        pageSize={20}
        loading={loading}
        searchPlaceholder="Search orders..."
        onSearch={(q) => { setSearch(q); setPage(1); }}
        onPageChange={setPage}
        onRowClick={setShowDetail}
        filters={
          <div className="flex items-center gap-2">
            <select value={paymentFilter} onChange={(e) => { setPaymentFilter(e.target.value); setPage(1); }}
              className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none">
              <option value="">All Payments</option>
              {['pending', 'paid', 'failed', 'refunded'].map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <select value={deliveryFilter} onChange={(e) => { setDeliveryFilter(e.target.value); setPage(1); }}
              className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none">
              <option value="">All Deliveries</option>
              {['processing', 'shipped', 'delivered', 'cancelled', 'returned'].map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        }
      />

      {/* Create Order Modal */}
      <Modal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        title="Create New Order"
        size="xl"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button loading={saving} onClick={handleAdd as any}>Create Order</Button>
          </>
        }
      >
        <form onSubmit={handleAdd} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Customer *</label>
            <select required value={selectedCustomer} onChange={(e) => setSelectedCustomer(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20">
              <option value="">Select customer...</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>{c.name} — {c.phone}</option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-gray-700">Order Items *</label>
              <Button size="sm" variant="ghost" type="button"
                onClick={() => setOrderItems([...orderItems, { productId: '', quantity: 1, price: 0 }])}>
                + Add Item
              </Button>
            </div>
            <div className="space-y-2">
              {orderItems.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-gray-50 rounded-lg p-3">
                  <select value={item.productId} onChange={(e) => updateItem(idx, 'productId', e.target.value)}
                    className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none bg-white">
                    <option value="">Select product...</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}{p.variant ? ` - ${p.variant}` : ''} (₹{p.price})</option>
                    ))}
                  </select>
                  <input type="number" min="1" value={item.quantity} onChange={(e) => updateItem(idx, 'quantity', parseInt(e.target.value))}
                    className="w-20 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none bg-white text-center" />
                  <div className="text-sm font-bold text-green-600 w-24 text-right">
                    {formatCurrency(item.price * item.quantity)}
                  </div>
                  {orderItems.length > 1 && (
                    <button type="button" onClick={() => setOrderItems(orderItems.filter((_, i) => i !== idx))}
                      className="text-red-400 hover:text-red-600 p-1">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <div className="text-right mt-2">
              <span className="text-sm font-bold text-gray-900">Total: {formatCurrency(totalAmount)}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Payment Status</label>
              <select value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none">
                {['pending', 'paid', 'failed'].map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Delivery Status</label>
              <select value={deliveryStatus} onChange={(e) => setDeliveryStatus(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none">
                {['processing', 'shipped', 'delivered'].map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Notes</label>
            <textarea value={orderNotes} onChange={(e) => setOrderNotes(e.target.value)} rows={2}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none resize-none"
              placeholder="Order notes..." />
          </div>
          <p className="text-[10px] text-gray-400">A refill reminder will be automatically created based on product cycle</p>
        </form>
      </Modal>

      {/* Order Detail Modal */}
      {showDetail && (
        <Modal
          open={!!showDetail}
          onClose={() => setShowDetail(null)}
          title={`Order ${showDetail.orderId}`}
          size="lg"
          footer={<Button variant="outline" onClick={() => setShowDetail(null)}>Close</Button>}
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-green-50 rounded-xl p-4">
                <p className="text-xs text-green-600 font-medium">Total Amount</p>
                <p className="font-display text-2xl font-bold text-green-700 mt-1">{formatCurrency(showDetail.totalAmount)}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs text-gray-500 font-medium">Customer</p>
                <p className="font-bold text-gray-900 mt-1">{showDetail.customer?.name}</p>
                <p className="text-xs text-gray-500">{showDetail.customer?.phone}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <StatusBadge status={showDetail.paymentStatus} />
              <StatusBadge status={showDetail.deliveryStatus} />
              <span className="text-xs text-gray-400 ml-auto">{formatDate(showDetail.orderDate)}</span>
            </div>

            <div>
              <p className="text-xs text-gray-500 font-medium mb-2">Items</p>
              <div className="space-y-2">
                {showDetail.items?.map((item: any) => (
                  <div key={item.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{item.product?.name}</p>
                      {item.product?.variant && <p className="text-xs text-gray-400">{item.product.variant}</p>}
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-900">{formatCurrency(item.totalPrice)}</p>
                      <p className="text-xs text-gray-400">×{item.quantity} @ {formatCurrency(item.price)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {showDetail.refillDate && (
              <div className="bg-blue-50 rounded-lg p-3">
                <p className="text-xs text-blue-600 font-medium">Estimated Refill Date</p>
                <p className="text-sm font-bold text-blue-700 mt-1">{formatDate(showDetail.refillDate)}</p>
              </div>
            )}

            {/* Quick status update */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-gray-500 font-medium mb-1.5">Payment Status</p>
                <select
                  defaultValue={showDetail.paymentStatus}
                  onChange={(e) => handleUpdateStatus(showDetail.id, { paymentStatus: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none"
                >
                  {['pending', 'paid', 'failed', 'refunded'].map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium mb-1.5">Delivery Status</p>
                <select
                  defaultValue={showDetail.deliveryStatus}
                  onChange={(e) => handleUpdateStatus(showDetail.id, { deliveryStatus: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none"
                >
                  {['processing', 'shipped', 'delivered', 'cancelled', 'returned'].map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus, Package, Tag, RefreshCw } from 'lucide-react';
import DataTable from '@/components/tables/DataTable';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [showDetail, setShowDetail] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);

  const [form, setForm] = useState({
    name: '', variant: '', sku: '', price: '', stock: '', description: '', refillCycleDays: '30',
  });

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: page.toString(), pageSize: '20', ...(search && { search }) });
    const res = await fetch(`/api/products?${params}`);
    const data = await res.json();
    setProducts(data.data || []);
    setTotal(data.total || 0);
    setLoading(false);
  }, [page, search]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setShowAdd(false);
      setForm({ name: '', variant: '', sku: '', price: '', stock: '', description: '', refillCycleDays: '30' });
      fetchProducts();
    }
    setSaving(false);
  };

  const handleUpdate = async (id: string, data: any) => {
    await fetch(`/api/products/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    fetchProducts();
    setShowDetail(null);
    setEditing(false);
  };

  const columns = [
    {
      key: 'name',
      label: 'Product',
      render: (row: any) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-green-50 rounded-lg flex items-center justify-center flex-shrink-0">
            <Package className="w-4 h-4 text-green-600" />
          </div>
          <div>
            <div className="font-semibold text-gray-900 text-sm">{row.name}</div>
            {row.variant && <div className="text-xs text-gray-400">{row.variant}</div>}
          </div>
        </div>
      ),
    },
    {
      key: 'sku',
      label: 'SKU',
      render: (row: any) => (
        <div className="flex items-center gap-1">
          <Tag className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-xs font-mono text-gray-600">{row.sku}</span>
        </div>
      ),
    },
    {
      key: 'price',
      label: 'Price',
      render: (row: any) => <span className="font-bold text-green-600">{formatCurrency(row.price)}</span>,
    },
    {
      key: 'stock',
      label: 'Stock',
      render: (row: any) => (
        <span className={`font-semibold text-sm ${row.stock < 10 ? 'text-red-600' : row.stock < 30 ? 'text-orange-500' : 'text-gray-700'}`}>
          {row.stock} {row.stock < 10 && '⚠️'}
        </span>
      ),
    },
    {
      key: 'refillCycleDays',
      label: 'Refill Cycle',
      render: (row: any) => (
        <div className="flex items-center gap-1.5">
          <RefreshCw className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-sm text-gray-600">{row.refillCycleDays} days</span>
        </div>
      ),
    },
    {
      key: 'isActive',
      label: 'Status',
      render: (row: any) => (
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${row.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
          {row.isActive ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'createdAt',
      label: 'Added',
      render: (row: any) => <span className="text-xs text-gray-400">{formatDate(row.createdAt)}</span>,
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-sm text-gray-500 mt-0.5">{total} total products</p>
        </div>
        <Button icon={Plus} onClick={() => setShowAdd(true)}>Add Product</Button>
      </div>

      <DataTable
        columns={columns}
        data={products}
        total={total}
        page={page}
        pageSize={20}
        loading={loading}
        searchPlaceholder="Search products..."
        onSearch={(q) => { setSearch(q); setPage(1); }}
        onPageChange={setPage}
        onRowClick={setShowDetail}
      />

      {/* Add Product Modal */}
      <Modal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        title="Add New Product"
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button loading={saving} onClick={handleAdd as any}>Save Product</Button>
          </>
        }
      >
        <form onSubmit={handleAdd} className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Product Name *</label>
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-400"
              placeholder="Whey Protein" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Variant</label>
            <input value={form.variant} onChange={(e) => setForm({ ...form, variant: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-400"
              placeholder="Chocolate - 2kg" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">SKU *</label>
            <input required value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-400"
              placeholder="WHEY-001" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Price (₹) *</label>
            <input required type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-400"
              placeholder="2499" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Stock Quantity</label>
            <input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-400"
              placeholder="100" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Refill Cycle (days)</label>
            <input type="number" value={form.refillCycleDays} onChange={(e) => setForm({ ...form, refillCycleDays: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-400"
              placeholder="30" />
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-400 resize-none"
              placeholder="Product description..." />
          </div>
        </form>
      </Modal>

      {/* Product Detail Modal */}
      {showDetail && (
        <Modal
          open={!!showDetail}
          onClose={() => { setShowDetail(null); setEditing(false); }}
          title={showDetail.name}
          size="md"
          footer={
            <div className="flex items-center gap-2 w-full">
              <Button
                variant={showDetail.isActive ? 'outline' : 'secondary'}
                onClick={() => handleUpdate(showDetail.id, { isActive: !showDetail.isActive })}
                className="mr-auto"
              >
                {showDetail.isActive ? 'Deactivate' : 'Activate'}
              </Button>
              <Button variant="outline" onClick={() => { setShowDetail(null); setEditing(false); }}>Close</Button>
            </div>
          }
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-green-50 rounded-xl p-4">
                <p className="text-xs text-green-600 font-medium">Price</p>
                <p className="font-display text-2xl font-bold text-green-700 mt-1">{formatCurrency(showDetail.price)}</p>
              </div>
              <div className={`rounded-xl p-4 ${showDetail.stock < 10 ? 'bg-red-50' : 'bg-blue-50'}`}>
                <p className={`text-xs font-medium ${showDetail.stock < 10 ? 'text-red-600' : 'text-blue-600'}`}>Stock</p>
                <p className={`font-display text-2xl font-bold mt-1 ${showDetail.stock < 10 ? 'text-red-700' : 'text-blue-700'}`}>
                  {showDetail.stock} units
                </p>
              </div>
            </div>

            <div className="space-y-2">
              {showDetail.variant && (
                <div className="flex justify-between">
                  <span className="text-xs text-gray-500">Variant</span>
                  <span className="text-xs font-medium text-gray-800">{showDetail.variant}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-xs text-gray-500">SKU</span>
                <span className="text-xs font-mono font-medium text-gray-800">{showDetail.sku}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-gray-500">Refill Cycle</span>
                <span className="text-xs font-medium text-gray-800">{showDetail.refillCycleDays} days</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-gray-500">Status</span>
                <span className={`text-xs font-semibold ${showDetail.isActive ? 'text-green-600' : 'text-gray-500'}`}>
                  {showDetail.isActive ? '● Active' : '○ Inactive'}
                </span>
              </div>
            </div>

            {showDetail.description && (
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-gray-500 font-medium mb-1">Description</p>
                <p className="text-sm text-gray-700">{showDetail.description}</p>
              </div>
            )}

            {/* Quick stock update */}
            <div className="border border-gray-100 rounded-lg p-4">
              <p className="text-xs text-gray-500 font-medium mb-2">Update Stock</p>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  id="stock-update"
                  defaultValue={showDetail.stock}
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20"
                />
                <Button
                  size="sm"
                  onClick={() => {
                    const input = document.getElementById('stock-update') as HTMLInputElement;
                    handleUpdate(showDetail.id, { stock: parseInt(input.value) });
                  }}
                >
                  Update
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

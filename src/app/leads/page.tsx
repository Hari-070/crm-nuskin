'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus, Phone, Mail, MapPin, Calendar, UserPlus } from 'lucide-react';
import DataTable from '@/components/tables/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { formatDate, formatDateTime, daysUntil, isOverdue } from '@/lib/utils';

const LEAD_STATUSES = ['new', 'contacted', 'interested', 'not_interested', 'converted'];
const LEAD_SOURCES = ['website', 'referral', 'social_media', 'cold_call', 'advertisement', 'other'];

export default function LeadsPage() {
  const [leads, setLeads] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [showDetail, setShowDetail] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [converting, setConverting] = useState(false);

  const [form, setForm] = useState({
    name: '', phone: '', email: '', city: '', source: 'other',
    notes: '', status: 'new', followUpDate: '',
  });

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: page.toString(), pageSize: '20',
      ...(search && { search }),
      ...(statusFilter && { status: statusFilter }),
    });
    const res = await fetch(`/api/leads?${params}`);
    const data = await res.json();
    setLeads(data.data || []);
    setTotal(data.total || 0);
    setLoading(false);
  }, [page, search, statusFilter]);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setShowAdd(false);
      setForm({ name: '', phone: '', email: '', city: '', source: 'other', notes: '', status: 'new', followUpDate: '' });
      fetchLeads();
    }
    setSaving(false);
  };

  const handleStatusUpdate = async (id: string, status: string) => {
    await fetch(`/api/leads/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    fetchLeads();
    if (showDetail) setShowDetail({ ...showDetail, status });
  };

  const handleConvert = async (leadId: string) => {
    setConverting(true);
    const res = await fetch(`/api/leads/${leadId}/convert`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    if (res.ok) {
      setShowDetail(null);
      fetchLeads();
    }
    setConverting(false);
  };

  const columns = [
    {
      key: 'name',
      label: 'Lead',
      render: (row: any) => (
        <div>
          <div className="font-semibold text-gray-900 text-sm">{row.name}</div>
          <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
            <Phone className="w-3 h-3" />
            {row.phone}
          </div>
        </div>
      ),
    },
    {
      key: 'contact',
      label: 'Contact',
      render: (row: any) => (
        <div className="text-xs text-gray-500 space-y-0.5">
          {row.email && (
            <div className="flex items-center gap-1">
              <Mail className="w-3 h-3" />
              {row.email}
            </div>
          )}
          {row.city && (
            <div className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {row.city}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'source',
      label: 'Source',
      render: (row: any) => (
        <span className="text-xs text-gray-500 capitalize">{row.source?.replace('_', ' ')}</span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (row: any) => <StatusBadge status={row.status} />,
    },
    {
      key: 'followUpDate',
      label: 'Follow-Up',
      render: (row: any) => {
        if (!row.followUpDate) return <span className="text-xs text-gray-400">—</span>;
        const days = daysUntil(row.followUpDate);
        const overdue = isOverdue(row.followUpDate);
        return (
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-gray-400" />
            <span className={`text-xs font-medium ${overdue ? 'text-red-600' : days <= 1 ? 'text-orange-500' : 'text-gray-600'}`}>
              {formatDate(row.followUpDate)}
              {overdue && ' (Overdue)'}
            </span>
          </div>
        );
      },
    },
    {
      key: 'createdAt',
      label: 'Added',
      render: (row: any) => <span className="text-xs text-gray-400">{formatDate(row.createdAt)}</span>,
    },
    {
      key: 'actions',
      label: '',
      render: (row: any) => (
        <Button
          size="sm"
          variant="ghost"
          onClick={(e) => { e.stopPropagation(); setShowDetail(row); }}
        >
          View
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900">Leads</h1>
          <p className="text-sm text-gray-500 mt-0.5">{total} total leads</p>
        </div>
        <Button icon={Plus} onClick={() => setShowAdd(true)}>Add Lead</Button>
      </div>

      <DataTable
        columns={columns}
        data={leads}
        total={total}
        page={page}
        pageSize={20}
        loading={loading}
        searchPlaceholder="Search leads..."
        onSearch={(q) => { setSearch(q); setPage(1); }}
        onPageChange={setPage}
        onRowClick={setShowDetail}
        filters={
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500/20"
          >
            <option value="">All Statuses</option>
            {LEAD_STATUSES.map((s) => (
              <option key={s} value={s}>{s.replace('_', ' ')}</option>
            ))}
          </select>
        }
      />

      {/* Add Lead Modal */}
      <Modal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        title="Add New Lead"
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button loading={saving} onClick={handleAdd as any}>Save Lead</Button>
          </>
        }
      >
        <form onSubmit={handleAdd} className="grid grid-cols-2 gap-4">
          <div className="col-span-2 grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Name *</label>
              <input
                required value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-400"
                placeholder="Full name"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Phone *</label>
              <input
                required value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-400"
                placeholder="+91 9876543210"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Email</label>
            <input
              type="email" value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-400"
              placeholder="email@example.com"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">City</label>
            <input
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-400"
              placeholder="Mumbai"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Source</label>
            <select
              value={form.source}
              onChange={(e) => setForm({ ...form, source: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-400"
            >
              {LEAD_SOURCES.map((s) => (
                <option key={s} value={s}>{s.replace('_', ' ')}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Status</label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-400"
            >
              {LEAD_STATUSES.map((s) => (
                <option key={s} value={s}>{s.replace('_', ' ')}</option>
              ))}
            </select>
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Follow-Up Date</label>
            <input
              type="datetime-local"
              value={form.followUpDate}
              onChange={(e) => setForm({ ...form, followUpDate: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-400"
            />
            <p className="text-[10px] text-gray-400 mt-1">A reminder will be automatically created</p>
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={3}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-400 resize-none"
              placeholder="Any notes about this lead..."
            />
          </div>
        </form>
      </Modal>

      {/* Lead Detail Modal */}
      {showDetail && (
        <Modal
          open={!!showDetail}
          onClose={() => setShowDetail(null)}
          title="Lead Details"
          size="lg"
          footer={
            <div className="flex items-center gap-2 w-full">
              {showDetail.status !== 'converted' && (
                <Button
                  icon={UserPlus}
                  onClick={() => handleConvert(showDetail.id)}
                  loading={converting}
                  className="mr-auto"
                >
                  Convert to Customer
                </Button>
              )}
              <Button variant="outline" onClick={() => setShowDetail(null)}>Close</Button>
            </div>
          }
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Name</p>
                <p className="font-semibold text-gray-900">{showDetail.name}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Status</p>
                <div className="flex items-center gap-2">
                  <StatusBadge status={showDetail.status} />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Phone</p>
                <a href={`tel:${showDetail.phone}`} className="font-medium text-green-600 hover:underline flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5" />{showDetail.phone}
                </a>
              </div>
              {showDetail.email && (
                <div className="space-y-1">
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Email</p>
                  <a href={`mailto:${showDetail.email}`} className="font-medium text-blue-600 hover:underline flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5" />{showDetail.email}
                  </a>
                </div>
              )}
              {showDetail.city && (
                <div className="space-y-1">
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">City</p>
                  <p className="font-medium text-gray-700 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-gray-400" />{showDetail.city}
                  </p>
                </div>
              )}
              <div className="space-y-1">
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Source</p>
                <p className="font-medium text-gray-700 capitalize">{showDetail.source?.replace('_', ' ')}</p>
              </div>
            </div>

            {showDetail.notes && (
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">Notes</p>
                <p className="text-sm text-gray-700">{showDetail.notes}</p>
              </div>
            )}

            {showDetail.followUpDate && (
              <div className="bg-orange-50 rounded-lg p-4">
                <p className="text-xs text-orange-600 font-medium uppercase tracking-wide mb-1">Follow-Up Due</p>
                <p className="text-sm font-semibold text-orange-700">{formatDateTime(showDetail.followUpDate)}</p>
              </div>
            )}

            {/* Quick status update */}
            <div>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-2">Update Status</p>
              <div className="flex flex-wrap gap-2">
                {LEAD_STATUSES.map((s) => (
                  <button
                    key={s}
                    onClick={() => handleStatusUpdate(showDetail.id, s)}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-all ${
                      showDetail.status === s
                        ? 'gradient-green text-white shadow-sm'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {s.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            <div className="text-xs text-gray-400">
              Added {formatDateTime(showDetail.createdAt)}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

'use client';

import { useEffect, useState, useCallback } from 'react';
import { Bell, RefreshCw, CheckCircle2, Clock, AlertCircle, Phone } from 'lucide-react';
import DataTable from '@/components/tables/DataTable';
import Button from '@/components/ui/Button';
import StatusBadge from '@/components/ui/StatusBadge';
import { formatDate, formatDateTime, daysUntil, isOverdue } from '@/lib/utils';

export default function FollowUpsPage() {
  const [followUps, setFollowUps] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('pending');
  const [typeFilter, setTypeFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);

  const fetchFollowUps = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: page.toString(), pageSize: '20',
      ...(search && { search }),
      ...(statusFilter && { status: statusFilter }),
      ...(typeFilter && { type: typeFilter }),
    });
    const res = await fetch(`/api/followups?${params}`);
    const data = await res.json();
    setFollowUps(data.data || []);
    setTotal(data.total || 0);
    setLoading(false);
  }, [page, search, statusFilter, typeFilter]);

  useEffect(() => { fetchFollowUps(); }, [fetchFollowUps]);

  const handleStatusUpdate = async (id: string, status: string) => {
    await fetch(`/api/followups/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    fetchFollowUps();
  };

  const handleTriggerNotifications = async () => {
    setTriggering(true);
    await fetch('/api/notifications/trigger', { method: 'POST' });
    setTriggering(false);
    fetchFollowUps();
  };

  const columns = [
    {
      key: 'type',
      label: 'Type',
      render: (row: any) => (
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
            row.type === 'refill_followup' ? 'bg-blue-50' : 'bg-green-50'
          }`}>
            {row.type === 'refill_followup'
              ? <RefreshCw className="w-4 h-4 text-blue-500" />
              : <Bell className="w-4 h-4 text-green-500" />
            }
          </div>
          <StatusBadge status={row.type} />
        </div>
      ),
    },
    {
      key: 'title',
      label: 'Title',
      render: (row: any) => (
        <div>
          <div className="font-semibold text-sm text-gray-900">{row.title}</div>
          {row.lead && (
            <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
              <Phone className="w-3 h-3" />{row.lead.phone}
            </div>
          )}
          {row.customer && (
            <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
              <Phone className="w-3 h-3" />{row.customer.phone}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'dueDate',
      label: 'Due Date',
      render: (row: any) => {
        const days = daysUntil(row.dueDate);
        const overdue = isOverdue(row.dueDate) && row.status === 'pending';
        return (
          <div>
            <div className={`text-sm font-semibold ${
              overdue ? 'text-red-600' : days <= 1 ? 'text-orange-500' : 'text-gray-700'
            }`}>
              {formatDate(row.dueDate)}
            </div>
            {row.status === 'pending' && (
              <div className={`text-xs mt-0.5 ${overdue ? 'text-red-500' : days <= 1 ? 'text-orange-400' : 'text-gray-400'}`}>
                {overdue ? `${Math.abs(days)}d overdue` : days === 0 ? 'Due today' : `in ${days}d`}
              </div>
            )}
          </div>
        );
      },
    },
    {
      key: 'status',
      label: 'Status',
      render: (row: any) => <StatusBadge status={row.status} />,
    },
    {
      key: 'notificationSent',
      label: 'Notified',
      render: (row: any) => (
        <span className={`text-xs font-medium ${row.notificationSent ? 'text-green-600' : 'text-gray-400'}`}>
          {row.notificationSent ? '✓ Sent' : '—'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row: any) => (
        <div className="flex items-center gap-1.5">
          {row.status === 'pending' && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); handleStatusUpdate(row.id, 'completed'); }}
                className="p-1.5 bg-green-50 hover:bg-green-100 text-green-600 rounded-lg transition-colors"
                title="Mark complete"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); handleStatusUpdate(row.id, 'snoozed'); }}
                className="p-1.5 bg-gray-100 hover:bg-gray-200 text-gray-500 rounded-lg transition-colors"
                title="Snooze"
              >
                <Clock className="w-3.5 h-3.5" />
              </button>
            </>
          )}
          {row.status !== 'pending' && (
            <button
              onClick={(e) => { e.stopPropagation(); handleStatusUpdate(row.id, 'pending'); }}
              className="text-xs text-blue-600 hover:underline"
            >
              Reopen
            </button>
          )}
        </div>
      ),
    },
  ];

  // Stats
  const overdueCount = followUps.filter((f) => isOverdue(f.dueDate) && f.status === 'pending').length;
  const todayCount = followUps.filter((f) => daysUntil(f.dueDate) === 0 && f.status === 'pending').length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900">Follow-Ups</h1>
          <p className="text-sm text-gray-500 mt-0.5">{total} reminders</p>
        </div>
        <Button
          variant="secondary"
          icon={Bell}
          loading={triggering}
          onClick={handleTriggerNotifications}
        >
          Send Notifications Now
        </Button>
      </div>

      {/* Alert cards */}
      {(overdueCount > 0 || todayCount > 0) && (
        <div className="grid grid-cols-2 gap-4">
          {overdueCount > 0 && (
            <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <div>
                <p className="font-bold text-red-700">{overdueCount} overdue</p>
                <p className="text-xs text-red-500">Requires immediate attention</p>
              </div>
            </div>
          )}
          {todayCount > 0 && (
            <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 flex items-center gap-3">
              <Clock className="w-5 h-5 text-orange-500 flex-shrink-0" />
              <div>
                <p className="font-bold text-orange-700">{todayCount} due today</p>
                <p className="text-xs text-orange-500">Follow up before end of day</p>
              </div>
            </div>
          )}
        </div>
      )}

      <DataTable
        columns={columns}
        data={followUps}
        total={total}
        page={page}
        pageSize={20}
        loading={loading}
        searchPlaceholder="Search follow-ups..."
        onSearch={(q) => { setSearch(q); setPage(1); }}
        onPageChange={setPage}
        filters={
          <div className="flex items-center gap-2">
            <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none">
              <option value="">All Statuses</option>
              {['pending', 'completed', 'cancelled', 'snoozed'].map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
              className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none">
              <option value="">All Types</option>
              <option value="lead_followup">Lead Follow-Ups</option>
              <option value="refill_followup">Refill Reminders</option>
            </select>
          </div>
        }
        emptyMessage="No follow-ups found. They're created automatically from leads and orders."
      />
    </div>
  );
}

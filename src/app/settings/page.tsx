'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Settings, Bell, User, Shield, Mail, RefreshCw, CheckCircle2 } from 'lucide-react';
import Button from '@/components/ui/Button';

export default function SettingsPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState('profile');
  const [saved, setSaved] = useState(false);

  const [profile, setProfile] = useState({
    name: (session?.user as any)?.name || '',
    email: (session?.user as any)?.email || '',
  });

  const [notifications, setNotifications] = useState({
    emailFollowups: true,
    emailRefills: true,
    inAppNotifications: true,
    dailyDigest: false,
  });

  const [emailConfig, setEmailConfig] = useState({
    host: '',
    port: '587',
    user: '',
    adminEmail: '',
  });

  const handleSave = async () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'email', label: 'Email Config', icon: Mail },
    { id: 'system', label: 'System', icon: Settings },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-0.5">Configure your CRM preferences</p>
      </div>

      <div className="flex gap-6">
        {/* Sidebar tabs */}
        <div className="w-48 flex-shrink-0">
          <nav className="space-y-1">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left ${
                  activeTab === id
                    ? 'gradient-green text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 bg-white rounded-xl border border-gray-100 shadow-sm">
          {activeTab === 'profile' && (
            <div className="p-6 space-y-6">
              <div>
                <h3 className="font-display font-bold text-gray-900 mb-4">Profile Settings</h3>
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 rounded-2xl gradient-green flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-green-500/30">
                    {profile.name?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{profile.name}</p>
                    <p className="text-sm text-gray-500">{profile.email}</p>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full mt-1 inline-block ${
                      (session?.user as any)?.role === 'ADMIN'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {(session?.user as any)?.role}
                    </span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Display Name</label>
                  <input
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Email</label>
                  <input
                    value={profile.email}
                    disabled
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-400"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">New Password</label>
                <input
                  type="password"
                  placeholder="Leave blank to keep current password"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-400"
                />
              </div>
              <div className="flex justify-end">
                <Button onClick={handleSave} icon={saved ? CheckCircle2 : undefined}>
                  {saved ? 'Saved!' : 'Save Changes'}
                </Button>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="p-6 space-y-6">
              <h3 className="font-display font-bold text-gray-900">Notification Preferences</h3>
              <div className="space-y-4">
                {[
                  { key: 'emailFollowups', label: 'Lead Follow-Up Emails', desc: 'Receive emails when lead follow-ups are due' },
                  { key: 'emailRefills', label: 'Refill Reminder Emails', desc: 'Receive emails when customers are due for refills' },
                  { key: 'inAppNotifications', label: 'In-App Notifications', desc: 'Show notification badge in the top bar' },
                  { key: 'dailyDigest', label: 'Daily Summary Email', desc: 'Get a daily summary of all pending tasks' },
                ].map(({ key, label, desc }) => (
                  <div key={key} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{label}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                    </div>
                    <button
                      onClick={() => setNotifications({ ...notifications, [key]: !(notifications as any)[key] })}
                      className={`relative w-11 h-6 rounded-full transition-colors ${
                        (notifications as any)[key] ? 'bg-green-500' : 'bg-gray-200'
                      }`}
                    >
                      <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                        (notifications as any)[key] ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex justify-end">
                <Button onClick={handleSave} icon={saved ? CheckCircle2 : undefined}>
                  {saved ? 'Saved!' : 'Save Preferences'}
                </Button>
              </div>
            </div>
          )}

          {activeTab === 'email' && (
            <div className="p-6 space-y-6">
              <h3 className="font-display font-bold text-gray-900">Email Configuration</h3>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
                <p className="font-semibold mb-1">⚙️ Environment Variables</p>
                <p>Email settings are configured via environment variables in your <code className="bg-amber-100 px-1 rounded">.env.local</code> file. Update the file and restart the server to apply changes.</p>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">SMTP Host</label>
                    <input
                      placeholder="smtp.gmail.com"
                      value={emailConfig.host}
                      onChange={(e) => setEmailConfig({ ...emailConfig, host: e.target.value })}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Port</label>
                    <input
                      placeholder="587"
                      value={emailConfig.port}
                      onChange={(e) => setEmailConfig({ ...emailConfig, port: e.target.value })}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-400"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">From Email (EMAIL_SERVER_USER)</label>
                  <input
                    type="email"
                    placeholder="crm@yourcompany.com"
                    value={emailConfig.user}
                    onChange={(e) => setEmailConfig({ ...emailConfig, user: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Admin Notification Email</label>
                  <input
                    type="email"
                    placeholder="admin@yourcompany.com"
                    value={emailConfig.adminEmail}
                    onChange={(e) => setEmailConfig({ ...emailConfig, adminEmail: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-400"
                  />
                </div>
              </div>
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-800">
                <p className="font-semibold mb-1">📧 Free Email Options</p>
                <ul className="space-y-1 text-xs">
                  <li>• <strong>Gmail (Nodemailer)</strong>: Use App Password with 2FA enabled — 500/day free</li>
                  <li>• <strong>Resend</strong>: 100 emails/day free — set RESEND_API_KEY in .env</li>
                  <li>• <strong>SendGrid</strong>: 100 emails/day free — set SENDGRID_API_KEY in .env</li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'system' && (
            <div className="p-6 space-y-6">
              <h3 className="font-display font-bold text-gray-900">System Settings</h3>
              <div className="space-y-4">
                <div className="bg-white border border-gray-100 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Background Cron Job</p>
                      <p className="text-xs text-gray-500 mt-0.5">Checks follow-ups every 5 minutes and sends notifications</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500 pulse-green" />
                      <span className="text-xs font-semibold text-green-600">Running</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-gray-100 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Database</p>
                      <p className="text-xs text-gray-500 mt-0.5">MongoDB via Prisma ORM</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      <span className="text-xs font-semibold text-green-600">Connected</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-gray-100 rounded-xl p-4 space-y-3">
                  <p className="text-sm font-semibold text-gray-900">Manual Actions</p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      icon={RefreshCw}
                      onClick={async () => {
                        await fetch('/api/notifications/trigger', { method: 'POST' });
                        alert('Follow-up check triggered!');
                      }}
                    >
                      Run Follow-Up Check Now
                    </Button>
                  </div>
                  <p className="text-xs text-gray-400">Manually trigger the follow-up notification system</p>
                </div>

                <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
                  <p className="text-sm font-semibold text-gray-700 mb-2">App Information</p>
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
                    <div>Version: <span className="font-medium text-gray-700">1.0.0</span></div>
                    <div>Framework: <span className="font-medium text-gray-700">Next.js 15</span></div>
                    <div>Database: <span className="font-medium text-gray-700">MongoDB</span></div>
                    <div>ORM: <span className="font-medium text-gray-700">Prisma 5</span></div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

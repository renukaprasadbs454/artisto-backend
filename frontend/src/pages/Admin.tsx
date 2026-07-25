import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/auth';
import { Navigate } from 'react-router-dom';
import { api } from '../services/api';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Users, ShoppingBag, CreditCard, DollarSign, ShieldAlert, Activity, Database, ExternalLink, Trash2, RefreshCw } from 'lucide-react';

const SUPABASE_EDITOR_URL = "https://supabase.com/dashboard/project/gqfnfixggglnjvwbalbw/editor/18033";

const TABLE_LIST = [
  { id: 'users', label: 'Users' },
  { id: 'profiles', label: 'Profiles' },
  { id: 'actor_profiles', label: 'Actor Profiles' },
  { id: 'listings', label: 'Listings' },
  { id: 'orders', label: 'Orders' },
  { id: 'payments', label: 'Payments' },
  { id: 'posts', label: 'Posts' },
];

export default function AdminDashboard() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalOrders: 0,
    activeSubscriptions: 0,
    revenue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [suspendUserId, setSuspendUserId] = useState('');
  const [isSuspending, setIsSuspending] = useState(false);

  // Table Editor State
  const [activeTable, setActiveTable] = useState('users');
  const [tableData, setTableData] = useState<any[]>([]);
  const [loadingTable, setLoadingTable] = useState(false);
  const [tableError, setTableError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const data = await api.getAdminStats();
        setStats(data);
      } catch (err: any) {
        setError(err.response?.data?.error?.message || 'Failed to load stats');
      } finally {
        setLoading(false);
      }
    };

    if (user?.role === 'ADMIN') {
      fetchStats();
    }
  }, [user]);

  const loadTableData = async (tableName: string) => {
    try {
      setLoadingTable(true);
      setTableError(null);
      const data = await api.getAdminTableRecords(tableName);
      setTableData(data || []);
    } catch (err: any) {
      setTableError(err.response?.data?.error?.message || `Failed to load '${tableName}' table records`);
    } finally {
      setLoadingTable(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      loadTableData(activeTable);
    }
  }, [activeTable, user]);

  const handleSuspend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!suspendUserId.trim()) return;

    if (!confirm(`Are you sure you want to suspend user ${suspendUserId}?`)) return;

    try {
      setIsSuspending(true);
      const res = await api.suspendUser(suspendUserId, true);
      alert(`User "${res?.username || suspendUserId}" suspended successfully.`);
      setSuspendUserId('');
      loadTableData(activeTable);
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to suspend user');
    } finally {
      setIsSuspending(false);
    }
  };

  const handleDeleteRecord = async (id: string) => {
    if (!confirm(`Are you sure you want to delete record '${id}' from '${activeTable}'?`)) return;

    try {
      await api.deleteAdminTableRecord(activeTable, id);
      alert(`Record deleted from ${activeTable}`);
      loadTableData(activeTable);
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to delete record');
    }
  };

  if (user?.role !== 'ADMIN') {
    return <Navigate to="/" />;
  }

  const statCards = [
    { title: "Total Users", value: stats.totalUsers, icon: Users, color: "text-blue-600", bg: "bg-blue-100" },
    { title: "Total Orders", value: stats.totalOrders, icon: ShoppingBag, color: "text-purple-600", bg: "bg-purple-100" },
    { title: "Active Subs", value: stats.activeSubscriptions, icon: CreditCard, color: "text-emerald-600", bg: "bg-emerald-100" },
    { title: "Total Revenue", value: `₹${stats.revenue.toLocaleString()}`, icon: DollarSign, color: "text-amber-600", bg: "bg-amber-100" },
  ];

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] p-6 md:p-10">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-red-950/80 border border-red-500/30 rounded-xl flex items-center justify-center text-red-400 shadow-sm">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-white">Admin Command Center</h1>
              <p className="text-[var(--text-muted)] text-sm">Platform control, live statistics, and database CRUD table editor.</p>
            </div>
          </div>

          <a
            href={SUPABASE_EDITOR_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white font-semibold px-5 py-2.5 rounded-xl shadow-md transition-all text-sm"
          >
            <Database className="w-4 h-4" />
            Open Supabase Table Editor
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>

        {error && (
          <div className="p-4 bg-red-950/80 text-red-400 border border-red-500/30 rounded-xl text-sm font-medium">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-purple-500/30 border-t-red-500 rounded-full animate-spin" />
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {statCards.map((stat, idx) => (
                <Card key={idx} className="border-[var(--border-secondary)] bg-[var(--bg-card)] shadow-lg hover:border-purple-500/30 transition-all rounded-2xl">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold text-[var(--text-muted)] mb-1 uppercase tracking-wider">{stat.title}</p>
                        <h3 className="text-3xl font-bold text-white">{stat.value}</h3>
                      </div>
                      <div className={`w-12 h-12 rounded-2xl ${stat.bg} flex items-center justify-center ${stat.color} border border-white/10 shadow-inner`}>
                        <stat.icon className="w-6 h-6" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Moderation Section */}
            <Card className="border-[var(--border-secondary)] bg-[var(--bg-card)] shadow-lg rounded-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <ShieldAlert className="w-5 h-5 text-red-400" />
                  Security & User Moderation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSuspend} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-[var(--text-secondary)] block">Suspend User by UUID / Username / Email</label>
                    <div className="flex gap-3 max-w-xl">
                      <Input 
                        placeholder="Enter username, email, or UUID..."
                        value={suspendUserId}
                        onChange={(e) => setSuspendUserId(e.target.value)}
                        className="flex-1 bg-[var(--bg-secondary)] border-[var(--border-primary)] text-white"
                      />
                      <Button 
                        type="submit" 
                        variant="destructive"
                        disabled={isSuspending || !suspendUserId}
                        className="rounded-xl px-5"
                      >
                        {isSuspending ? 'Suspending...' : 'Suspend User'}
                      </Button>
                    </div>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* ─── DATABASE TABLE EDITOR / CRUD COMPONENT ─────────────────── */}
            <Card className="border-[var(--border-secondary)] bg-[var(--bg-card)] shadow-xl rounded-2xl overflow-hidden">
              <CardHeader className="bg-slate-950 border-b border-white/10 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-950/80 border border-purple-500/30 rounded-xl flex items-center justify-center text-purple-400">
                    <Database className="w-5 h-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg text-white">Database Table Editor (CRUD)</CardTitle>
                    <p className="text-xs text-slate-400">View, inspect, and manage raw database records across all platform tables.</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Button
                    onClick={() => loadTableData(activeTable)}
                    variant="outline"
                    size="sm"
                    className="border-white/10 text-slate-300 hover:bg-white/10 bg-slate-900 rounded-xl"
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${loadingTable ? 'animate-spin' : ''}`} />
                    Refresh Table
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="p-6 space-y-6">
                {/* Table Tabs */}
                <div className="flex flex-wrap gap-2 border-b border-[var(--border-secondary)] pb-4">
                  {TABLE_LIST.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setActiveTable(t.id)}
                      className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                        activeTable === t.id
                          ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20'
                          : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-white border border-[var(--border-primary)]'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                {tableError && (
                  <div className="p-4 bg-red-950/80 text-red-400 border border-red-500/30 rounded-xl text-xs">
                    {tableError}
                  </div>
                )}

                {/* Table Data View */}
                {loadingTable ? (
                  <div className="flex justify-center py-12">
                    <div className="w-8 h-8 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
                  </div>
                ) : tableData.length === 0 ? (
                  <div className="text-center py-12 text-[var(--text-muted)] text-sm font-medium">
                    No records found in '{activeTable}' table.
                  </div>
                ) : (
                  <div className="overflow-x-auto border border-[var(--border-secondary)] rounded-xl shadow-inner max-h-[500px]">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-950 text-slate-300 font-bold uppercase sticky top-0 border-b border-white/10">
                        <tr>
                          {Object.keys(tableData[0]).map((key) => (
                            <th key={key} className="px-4 py-3 whitespace-nowrap">
                              {key}
                            </th>
                          ))}
                          <th className="px-4 py-3 whitespace-nowrap text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 bg-[var(--bg-secondary)]">
                        {tableData.map((row, idx) => (
                          <tr key={row.id || idx} className="hover:bg-white/5 transition-colors">
                            {Object.entries(row).map(([k, v]: [string, any]) => (
                              <td key={k} className="px-4 py-3 whitespace-nowrap max-w-xs truncate text-slate-200 font-mono text-[11px]">
                                {typeof v === 'object' ? JSON.stringify(v) : String(v ?? '')}
                              </td>
                            ))}
                            <td className="px-4 py-3 whitespace-nowrap text-right">
                              {row.id && (
                                <Button
                                  onClick={() => handleDeleteRecord(row.id)}
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-400 hover:bg-red-950/60 hover:text-red-300 h-7 px-2 rounded-lg"
                                  title="Delete Record"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>

          </motion.div>
        )}
      </div>
    </div>
  );
}

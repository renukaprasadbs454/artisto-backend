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
    <div className="min-h-screen bg-slate-50 text-slate-900 p-6 md:p-10">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center text-red-600 shadow-sm">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Admin Command Center</h1>
              <p className="text-slate-500">Platform control, live statistics, and Supabase database CRUD table editor.</p>
            </div>
          </div>

          <a
            href={SUPABASE_EDITOR_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold px-5 py-2.5 rounded-xl shadow-sm transition-all"
          >
            <Database className="w-4 h-4" />
            Open Supabase Table Editor
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>

        {error && (
          <div className="p-4 bg-red-50 text-red-600 border border-red-200 rounded-lg font-medium">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-slate-200 border-t-red-600 rounded-full animate-spin" />
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
                <Card key={idx} className="border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-slate-500 mb-1">{stat.title}</p>
                        <h3 className="text-3xl font-bold text-slate-900">{stat.value}</h3>
                      </div>
                      <div className={`w-12 h-12 rounded-full ${stat.bg} flex items-center justify-center ${stat.color}`}>
                        <stat.icon className="w-6 h-6" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Moderation Section */}
            <Card className="border-slate-200 bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-slate-700" />
                  Security & User Moderation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSuspend} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Suspend User by UUID / Username / Email</label>
                    <div className="flex gap-3 max-w-xl">
                      <Input 
                        placeholder="Enter username, email, or UUID..."
                        value={suspendUserId}
                        onChange={(e) => setSuspendUserId(e.target.value)}
                        className="flex-1 bg-slate-50 border-slate-200"
                      />
                      <Button 
                        type="submit" 
                        variant="destructive"
                        disabled={isSuspending || !suspendUserId}
                      >
                        {isSuspending ? 'Suspending...' : 'Suspend User'}
                      </Button>
                    </div>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* ─── SUPABASE DATABASE TABLE EDITOR / CRUD COMPONENT ─────────────────── */}
            <Card className="border-slate-200 bg-white shadow-sm overflow-hidden">
              <CardHeader className="bg-slate-900 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center text-purple-400">
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
                    className="border-slate-700 text-slate-300 hover:bg-slate-800 bg-slate-900"
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${loadingTable ? 'animate-spin' : ''}`} />
                    Refresh Table
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="p-6 space-y-6">
                {/* Table Tabs */}
                <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-4">
                  {TABLE_LIST.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setActiveTable(t.id)}
                      className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
                        activeTable === t.id
                          ? 'bg-purple-600 text-white shadow-sm'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                {tableError && (
                  <div className="p-4 bg-red-50 text-red-600 border border-red-200 rounded-lg text-sm">
                    {tableError}
                  </div>
                )}

                {/* Table Data View */}
                {loadingTable ? (
                  <div className="flex justify-center py-12">
                    <div className="w-8 h-8 border-4 border-slate-200 border-t-purple-600 rounded-full animate-spin" />
                  </div>
                ) : tableData.length === 0 ? (
                  <div className="text-center py-12 text-slate-500 font-medium">
                    No records found in '{activeTable}' table.
                  </div>
                ) : (
                  <div className="overflow-x-auto border border-slate-200 rounded-xl shadow-inner max-h-[500px]">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 text-slate-700 font-bold uppercase sticky top-0 border-b border-slate-200">
                        <tr>
                          {Object.keys(tableData[0]).map((key) => (
                            <th key={key} className="px-4 py-3 whitespace-nowrap">
                              {key}
                            </th>
                          ))}
                          <th className="px-4 py-3 whitespace-nowrap text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {tableData.map((row, idx) => (
                          <tr key={row.id || idx} className="hover:bg-slate-50/80 transition-colors">
                            {Object.entries(row).map(([k, v]: [string, any]) => (
                              <td key={k} className="px-4 py-3 whitespace-nowrap max-w-xs truncate text-slate-800 font-mono">
                                {typeof v === 'object' ? JSON.stringify(v) : String(v ?? '')}
                              </td>
                            ))}
                            <td className="px-4 py-3 whitespace-nowrap text-right">
                              {row.id && (
                                <Button
                                  onClick={() => handleDeleteRecord(row.id)}
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-600 hover:bg-red-50 h-7 px-2"
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

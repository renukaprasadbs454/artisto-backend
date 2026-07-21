import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/auth';
import { Navigate } from 'react-router-dom';
import { api } from '../services/api';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Users, ShoppingBag, CreditCard, DollarSign, ShieldAlert, Activity } from 'lucide-react';

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

  const handleSuspend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!suspendUserId.trim()) return;

    if (!confirm(`Are you sure you want to suspend user ${suspendUserId}?`)) return;

    try {
      setIsSuspending(true);
      const res = await api.suspendUser(suspendUserId, true);
      alert(`User "${res?.username || suspendUserId}" suspended successfully.`);
      setSuspendUserId('');
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to suspend user');
    } finally {
      setIsSuspending(false);
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
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center text-red-600 shadow-sm">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Admin Command Center</h1>
            <p className="text-slate-500">Manage your platform and view real-time statistics.</p>
          </div>
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

            {/* Actions Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* User Management */}
              <Card className="border-slate-200 bg-white shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShieldAlert className="w-5 h-5 text-slate-700" />
                    Security & Moderation
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSuspend} className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Suspend User by UUID / Username</label>
                      <div className="flex gap-3">
                        <Input 
                          placeholder="Enter user identifier..."
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
                      <p className="text-xs text-slate-500 mt-2">
                        Suspended users will immediately lose access to their accounts.
                      </p>
                    </div>
                  </form>
                </CardContent>
              </Card>

              {/* Placeholder for future features */}
              <Card className="border-slate-200 bg-white shadow-sm opacity-60">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-slate-400">
                    <Activity className="w-5 h-5" />
                    System Health
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-center py-8">
                  <p className="text-slate-400 font-medium">Coming soon in next milestone</p>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

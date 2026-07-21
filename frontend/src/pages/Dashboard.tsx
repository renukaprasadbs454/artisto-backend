import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../services/api";
import { useAuthStore } from "../store/auth";
import { MessageSquare, CheckCircle2, XCircle, ChevronRight } from "lucide-react";

export default function Dashboard() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        if (user?.role === "SELLER") {
          const data = await api.getSellerDashboard();
          setStats(data.stats);
          setRecentOrders(data.recentOrders || []);
        } else if (user?.role === "BUYER") {
          const data = await api.getBuyerDashboard();
          setStats(data.stats);
          setRecentOrders(data.recentOrders || []);
        }
      } catch (err) {
        console.error("Failed to load dashboard:", err);
      } finally {
        setLoading(false);
      }
    };

    if (user) fetchDashboard();
  }, [user]);

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      await api.updateOrderStatus(orderId, newStatus);
      setRecentOrders(recentOrders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    } catch (err: any) {
      alert(err.response?.data?.error?.message || "Failed to update application status");
    }
  };

  const handleOpenMessage = (order: any) => {
    if (order.conversation?.id) {
      navigate(`/messages/${order.conversation.id}`);
    } else {
      navigate(`/messages`);
    }
  };

  if (loading) {
    return (
      <div className="page-container flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="max-w-7xl mx-auto">

        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-2xl p-8 mb-8 shadow-lg border border-white/10">
          <h1 className="text-3xl font-bold">
            Welcome Back, {user?.profile?.displayName || user?.username} 👋
          </h1>
          <p className="mt-2 text-purple-100">
            {user?.role === 'SELLER' ? 'Manage your casting calls, review actor applications, and hire talent.' : 'Track your casting call applications and profile activity.'}
          </p>
        </div>

        {/* Statistics */}
        <div className="grid md:grid-cols-3 gap-6 mb-10">
          <div className="bg-[var(--bg-card)] rounded-2xl shadow-lg border border-[var(--border-secondary)] p-6 text-center backdrop-blur-md">
            <h2 className="text-4xl font-bold text-purple-400">{stats?.totalOrders || 0}</h2>
            <p className="mt-2 text-[var(--text-muted)] font-medium">Total Applications</p>
          </div>
          {user?.role === 'SELLER' && (
            <div className="bg-[var(--bg-card)] rounded-2xl shadow-lg border border-[var(--border-secondary)] p-6 text-center backdrop-blur-md">
              <h2 className="text-4xl font-bold text-blue-400">{stats?.activeListings || 0}</h2>
              <p className="mt-2 text-[var(--text-muted)] font-medium">Active Casting Calls</p>
            </div>
          )}
          <div className="bg-[var(--bg-card)] rounded-2xl shadow-lg border border-[var(--border-secondary)] p-6 text-center backdrop-blur-md">
            <h2 className="text-4xl font-bold text-amber-400">{stats?.pendingOrders || 0}</h2>
            <p className="mt-2 text-[var(--text-muted)] font-medium">Pending Applications</p>
          </div>
        </div>

        {/* Recent Applications Section */}
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-[var(--text-primary)]">Recent Applications</h2>
            <Link to="/orders" className="text-sm font-semibold text-purple-400 hover:underline flex items-center gap-1">
              View All Applications <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <p className="text-[var(--text-muted)] bg-[var(--bg-card)] p-8 rounded-2xl shadow-lg border border-[var(--border-secondary)] text-center">
              No recent applications found.
            </p>
          ) : (
            <div className="space-y-4">
              {recentOrders.map((order) => (
                <div key={order.id} className="bg-[var(--bg-card)] rounded-2xl shadow-xl p-6 border border-[var(--border-secondary)] backdrop-blur-md transition-all hover:border-purple-500/30">
                  <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-bold text-lg text-[var(--text-primary)]">
                          {order.listing?.title || "Casting Application"}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          order.status === 'ACCEPTED' ? 'bg-emerald-900/40 text-emerald-400 border border-emerald-500/30' :
                          order.status === 'CANCELLED' ? 'bg-red-900/40 text-red-400 border border-red-500/30' :
                          'bg-amber-900/40 text-amber-400 border border-amber-500/30'
                        }`}>
                          {order.status}
                        </span>
                      </div>

                      {order.buyer?.profile && (
                        <p className="text-sm text-[var(--text-secondary)]">
                          Applicant: <Link to={order.buyer.username ? `/u/${order.buyer.username}` : `/profile/${order.buyer.id}`} className="text-purple-400 hover:underline font-semibold">{order.buyer.profile.displayName}</Link>
                        </p>
                      )}
                    </div>

                    <div className="text-right">
                      <span className="text-xl font-extrabold text-emerald-400">${order.price || order.listing?.price}</span>
                      <p className="text-xs text-[var(--text-muted)] mt-0.5">Order #{order.id.substring(0,8)}</p>
                    </div>
                  </div>

                  {order.requirements && (
                    <div className="bg-[var(--bg-tertiary)] p-3.5 rounded-xl border border-[var(--border-primary)] mb-4 text-sm text-[var(--text-secondary)]">
                      <span className="font-semibold text-[var(--text-primary)]">Pitch: </span>
                      {order.requirements}
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-[var(--border-primary)] justify-end">
                    <button
                      onClick={() => handleOpenMessage(order)}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-purple-600/20 text-purple-400 border border-purple-500/30 hover:bg-purple-600/30 transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <MessageSquare className="w-4 h-4" /> Message Applicant
                    </button>

                    {user?.role === 'SELLER' && order.status === 'PENDING' && (
                      <>
                        <button
                          onClick={() => handleStatusUpdate(order.id, 'ACCEPTED')}
                          className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                        >
                          <CheckCircle2 className="w-4 h-4" /> Accept Application
                        </button>
                        <button
                          onClick={() => handleStatusUpdate(order.id, 'CANCELLED')}
                          className="px-4 py-2 rounded-xl text-xs font-bold bg-red-900/30 text-red-400 border border-red-500/30 hover:bg-red-900/50 transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <XCircle className="w-4 h-4" /> Decline
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
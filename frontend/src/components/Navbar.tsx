import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/auth";
import { api } from "../services/api";
import { disconnectSocket, getSocket } from "../services/socket";
import { Button } from "./ui/button";
import { Search, Bell, Settings, MessageSquare, ClipboardList, Check, Trash2 } from "lucide-react";

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'message' | 'application';
  link: string;
  time: string;
  read: boolean;
}

function Navbar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  useEffect(() => {
    if (!user) return;

    const fetchNotifications = async () => {
      try {
        const notifs: NotificationItem[] = [];

        // Fetch recent conversations for message notifications
        const convosRes = await api.getConversations();
        const convosList = Array.isArray(convosRes) ? convosRes : (convosRes as any)?.data || [];
        convosList.slice(0, 5).forEach((c: any) => {
          if (c.lastMessage) {
            const isMe = c.lastMessage.senderId === user.id;
            if (!isMe) {
              const otherUser = c.participantOne?.id === user.id ? c.participantTwo : c.participantOne;
              const displayName = otherUser?.profile?.displayName || otherUser?.username || "Someone";
              notifs.push({
                id: `msg-${c.id}`,
                title: `Message from ${displayName}`,
                message: c.lastMessage.content,
                type: 'message',
                link: `/messages/${c.id}`,
                time: new Date(c.lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                read: !!c.lastMessage.readAt,
              });
            }
          }
        });

        // Fetch recent orders for application notifications
        const ordersRes = await api.getOrders();
        const ordersList = Array.isArray(ordersRes) ? ordersRes : (ordersRes as any)?.data || [];
        ordersList.slice(0, 5).forEach((o: any) => {
          notifs.push({
            id: `ord-${o.id}`,
            title: `Application: ${o.listing?.title || 'Casting Call'}`,
            message: `Status: ${o.status}`,
            type: 'application',
            link: '/orders',
            time: new Date(o.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            read: false,
          });
        });

        setNotifications(notifs);
      } catch (err) {
        console.error("Failed to load notifications:", err);
      }
    };

    fetchNotifications();

    // Listen for live socket messages
    const socket = getSocket();
    const handleReceiveMessage = (msg: any) => {
      if (msg.senderId !== user.id) {
        const senderName = msg.sender?.profile?.displayName || "New Message";
        setNotifications((prev) => [
          {
            id: `msg-live-${Date.now()}`,
            title: `New Message from ${senderName}`,
            message: msg.content,
            type: 'message',
            link: `/messages/${msg.conversationId}`,
            time: 'Just now',
            read: false,
          },
          ...prev,
        ]);
      }
    };

    socket.on('receive_message', handleReceiveMessage);
    return () => {
      socket.off('receive_message', handleReceiveMessage);
    };
  }, [user]);

  const handleLogout = async () => {
    try {
      await api.logout();
    } catch {
      // ignore
    } finally {
      disconnectSocket();
      logout();
      navigate("/");
    }
  };

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      navigate(`/feed?q=${encodeURIComponent(searchQuery)}`);
      setSearchQuery("");
    }
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <nav className="sticky top-0 z-50 w-full bg-slate-900/40 backdrop-blur-2xl border-b border-white/5 shadow-sm transition-all duration-300">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-tr from-purple-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-sm">
            <span className="transform -skew-x-12">A</span>
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-100 hidden sm:block">Artisto</span>
        </Link>

        {/* Center */}
        <div className="hidden md:flex flex-1 items-center justify-center space-x-6">
        </div>

        {/* Right Section: Search & Auth/User */}
        <div className="flex items-center space-x-4">
          
          {user ? (
            <>
              {/* Search Bar */}
              <div className="hidden md:flex items-center bg-slate-800/50 rounded-full px-4 py-2 w-64 focus-within:ring-2 focus-within:ring-purple-500/50 focus-within:bg-slate-800 border border-white/5 transition-all duration-200">
                <input 
                  type="text" 
                  placeholder="Enter your search request..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleSearch}
                  className="bg-transparent border-none outline-none text-sm w-full text-slate-200 placeholder-slate-400"
                />
                <Search className="w-4 h-4 text-slate-400 shrink-0" />
              </div>

              {/* Action Icons */}
              <Link to="/profile" className="hidden sm:block">
                <button className="p-2 rounded-full hover:bg-white/10 text-slate-300 transition-colors">
                  <Settings className="w-5 h-5" />
                </button>
              </Link>

              {/* Live Notification Dropdown */}
              <div className="relative hidden sm:block">
                <button 
                  onClick={() => setShowNotifications(!showNotifications)} 
                  className="p-2 rounded-full hover:bg-white/10 text-slate-300 transition-colors relative"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center border-2 border-slate-900">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-white/10 shadow-2xl rounded-2xl p-4 z-50 text-slate-100">
                    <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/10">
                      <h4 className="font-bold text-sm text-slate-100 flex items-center gap-1.5">
                        <Bell className="w-4 h-4 text-purple-400" /> Notifications
                      </h4>
                      {notifications.length > 0 && (
                        <div className="flex gap-2">
                          <button
                            onClick={markAllAsRead}
                            title="Mark all as read"
                            className="text-xs text-purple-400 hover:underline flex items-center gap-0.5"
                          >
                            <Check className="w-3 h-3" /> Mark read
                          </button>
                          <button
                            onClick={clearAllNotifications}
                            title="Clear all"
                            className="text-xs text-slate-400 hover:text-red-400"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>

                    {notifications.length === 0 ? (
                      <div className="text-xs text-slate-400 text-center py-6 bg-slate-800/40 rounded-xl border border-white/5">
                        No new notifications
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                        {notifications.map((n) => (
                          <div
                            key={n.id}
                            onClick={() => {
                              setShowNotifications(false);
                              navigate(n.link);
                            }}
                            className={`p-3 rounded-xl border transition-all cursor-pointer text-xs ${
                              n.read ? 'bg-slate-800/30 border-white/5 opacity-70' : 'bg-slate-800/80 border-purple-500/30 shadow-md'
                            }`}
                          >
                            <div className="flex items-start gap-2.5">
                              {n.type === 'message' ? (
                                <MessageSquare className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                              ) : (
                                <ClipboardList className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-center mb-0.5">
                                  <p className="font-bold text-slate-200 truncate">{n.title}</p>
                                  <span className="text-[10px] text-slate-400">{n.time}</span>
                                </div>
                                <p className="text-slate-300 truncate">{n.message}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="h-6 w-px bg-white/10 hidden sm:block mx-1" />

              {/* User Avatar Dropdown Area */}
              <div className="flex items-center gap-3">
                <Link to={`/u/${user.username}`} className="flex items-center gap-2 group">
                  <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center text-sm font-bold text-slate-600 overflow-hidden border-2 border-white shadow-sm transition-transform group-hover:scale-105">
                    {user.profile?.avatarUrl ? (
                      <img src={user.profile.avatarUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      user.profile?.displayName?.[0]?.toUpperCase() || user.email[0].toUpperCase()
                    )}
                  </div>
                </Link>

                <Button variant="ghost" size="sm" onClick={handleLogout} className="text-slate-300 hover:text-white hidden lg:inline-flex">
                  Logout
                </Button>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login">
                <Button variant="ghost" size="sm" className="font-medium">Log in</Button>
              </Link>
              <Link to="/signup">
                <Button size="sm" className="font-medium bg-slate-900 text-white hover:bg-slate-800 rounded-full px-5">Sign up</Button>
              </Link>
            </div>
          )}
        </div>

      </div>
    </nav>
  );
}

export default Navbar;
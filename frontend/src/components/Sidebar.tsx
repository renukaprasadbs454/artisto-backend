import { Link, useLocation } from "react-router-dom";
import { useAuthStore } from "../store/auth";
import { Home, MessageSquare, Compass, Wallet, LayoutDashboard, ShieldAlert, Lock } from "lucide-react";
import { motion } from "framer-motion";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

export default function Sidebar() {
  const { user } = useAuthStore();
  const location = useLocation();

  if (!user) return null; // Don't show sidebar for logged out users

  const navItems = [
    { name: "Home", href: "/", icon: Home },
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Marketplace", href: "/opportunities", icon: LayoutDashboard },
    { name: "Actors", href: "/actors", icon: MessageSquare },
    { name: "Recruiters", href: "/company", icon: Wallet },
    { name: "Messages", href: "/messages", icon: MessageSquare },
  ];

  if (user.role === 'ADMIN') {
    navItems.push({ name: "Admin", href: "/admin", icon: ShieldAlert });
  }

  return (
    <motion.aside
      initial={{ x: -50, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="hidden lg:flex flex-col w-64 h-[calc(100vh-64px)] sticky top-16 border-r border-slate-700/30 bg-slate-900/60 backdrop-blur-2xl p-4 shrink-0 shadow-[4px_0_24px_rgba(0,0,0,0.1)]"
    >
      <div className="flex flex-col space-y-2 mt-4">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href || (item.href !== "/" && location.pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all duration-300",
                isActive
                  ? "bg-white/10 text-white shadow-[0_8px_30px_rgb(0,0,0,0.1)] border border-white/10"
                  : "text-slate-300 hover:text-white hover:bg-white/5 border border-transparent"
              )}
            >
              <Icon className={cn("w-5 h-5", isActive ? "text-purple-400" : "text-slate-400")} />
              {item.name}
            </Link>
          );
        })}
      </div>

      <div className="mt-auto">
        {user.role === 'BUYER' && (
          <div className="bg-slate-800/80 p-4 rounded-3xl text-slate-200 relative overflow-hidden shadow-lg border border-white/10 backdrop-blur-md mb-4">
            <h4 className="font-bold mb-1 relative z-10 text-sm">Hiring?</h4>
            <p className="text-xs text-slate-400 mb-3 relative z-10">Post casting calls and hire actors.</p>
            <button 
              onClick={async () => {
                if (!confirm("Are you sure you want to register as a Recruiter? You will be able to post casting calls.")) return;
                try {
                  const { api } = await import("../services/api");
                  await api.updateRole("SELLER");
                  window.location.reload();
                } catch(err) { alert("Failed to change role"); }
              }}
              className="inline-block bg-purple-600 text-white text-xs font-bold py-2 px-4 rounded-full relative z-10 hover:bg-purple-500 transition-colors shadow-sm w-full"
            >
              Register as Recruiter
            </button>
          </div>
        )}
        <div className="bg-gradient-to-br from-purple-500/80 to-indigo-600/80 p-4 rounded-3xl text-white relative overflow-hidden shadow-lg border border-white/10 backdrop-blur-md">
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10" />
          <h4 className="font-bold mb-1 relative z-10">Artisto Pro</h4>
          <p className="text-xs text-white/80 mb-3 relative z-10">Get access to all premium features.</p>
          <div className="flex items-center justify-between relative z-10">
            <Link to="/premium" className="inline-block bg-white/90 text-slate-900 text-xs font-bold py-2 px-4 rounded-full hover:bg-white transition-colors shadow-sm">
              Upgrade
            </Link>
            <Link to="/secret-admin" title="Secret Admin Portal" className="opacity-20 hover:opacity-100 transition-opacity text-white p-1">
              <Lock className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </motion.aside>
  );
}

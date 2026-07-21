import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useAuthStore } from "./store/auth";
import { api } from "./services/api";
import { connectSocket, disconnectSocket } from "./services/socket";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Profile from "./pages/Profile";
import ProfileComplete from "./pages/ProfileComplete";
import Feed from "./pages/Feed";
import ActorDiscovery from "./pages/ActorDiscovery";
import ActorProfilePage from "./pages/ActorProfile";
import Premium from "./pages/Premium";
import AdminDashboard from "./pages/Admin";
import SecretAdmin from "./pages/SecretAdmin";
import Company from "./pages/Company";
import Opportunities from "./pages/Opportunities";
import Dashboard from "./pages/Dashboard";
import Orders from "./pages/Orders";
import OpportunitiesDetails from "./pages/OpportunitiesDetails";
import Messages from "./pages/Messages";

import Sidebar from "./components/Sidebar";

function App() {
  const { setAccessToken, setUser, user } = useAuthStore();
  const [authLoading, setAuthLoading] = useState(true);

  // Silent refresh on app load — if a valid refresh cookie exists,
  // rehydrate the access token + user without forcing a login screen
  useEffect(() => {
    const silentRefresh = async () => {
      try {
        const { data } = await (await import("axios")).default.post(
          `${import.meta.env.VITE_API_URL || "http://localhost:4000/api/v1"}/auth/refresh`,
          {},
          { withCredentials: true }
        );
        setAccessToken(data.data.accessToken);
        // Fetch user data with the new token
        const userData = await api.getMe();
        setUser(userData);
      } catch {
        // No valid session — that's fine, just continue as guest
      } finally {
        setAuthLoading(false);
      }
    };
    silentRefresh();
  }, [setAccessToken, setUser]);

  // Connect socket when user is authenticated
  useEffect(() => {
    if (user) {
      connectSocket();
    } else {
      disconnectSocket();
    }
  }, [user]);

  if (authLoading) {
    return (
      <div className="auth-loading-screen">
        <div className="auth-loading-content">
          <div className="loading-spinner large"></div>
          <h2>Artisto</h2>
          <p>Loading your creative workspace...</p>
        </div>
      </div>
    );
  }

  const location = useLocation();

  return (
    <div className="min-h-screen text-slate-100 font-sans selection:bg-purple-500/30">
      <Navbar />
      <div className="max-w-[1600px] mx-auto flex relative">
        <Sidebar />
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 15, filter: "blur(4px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -15, filter: "blur(4px)" }}
              transition={{ duration: 0.3, ease: "circOut" }}
              className="h-full"
            >
              <Routes location={location} key={location.pathname}>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/u/:username" element={<Profile />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/profile/:username" element={<Profile />} />
                <Route path="/profile/complete" element={<ProfileComplete />} />
                <Route path="/actors" element={<ActorDiscovery />} />
                <Route path="/actor/u/:username" element={<ActorProfilePage />} />
                <Route path="/actor" element={<ActorProfilePage />} />
                <Route path="/premium" element={<Premium />} />
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/secret-admin" element={<SecretAdmin />} />
                <Route path="/feed" element={<Feed />} />
                <Route path="/company" element={<Company />} />
                <Route path="/opportunities" element={<Opportunities />} />
                <Route path="/opportunities/:id" element={<OpportunitiesDetails />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/orders" element={<Orders />} />
                <Route path="/messages" element={<Messages />} />
                <Route path="/messages/:conversationId" element={<Messages />} />
              </Routes>
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

export default App;
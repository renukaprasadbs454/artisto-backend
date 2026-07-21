import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "../services/api";
import { useAuthStore } from "../store/auth";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { MapPin, Briefcase, Camera, Image as ImageIcon, Trash2, PenTool, CheckCircle2 } from "lucide-react";

export default function Profile() {
  const { username } = useParams<{ username: string }>();
  const { user: authUser, setUser } = useAuthStore();

  const [profileUser, setProfileUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Portfolio
  const [portfolio, setPortfolio] = useState<any[]>([]);
  const [loadingPortfolio, setLoadingPortfolio] = useState(false);
  const [showAddPortfolio, setShowAddPortfolio] = useState(false);
  const [portfolioForm, setPortfolioForm] = useState({ title: "", description: "", projectUrl: "" });
  const [portfolioSaving, setPortfolioSaving] = useState(false);

  // If no username in URL, we are viewing our own profile IF logged in.
  // We compare username if provided, else compare IDs.
  const isOwnProfile = !username || (authUser?.username === username);
  const [activeTab, setActiveTab] = useState("portfolio"); // "portfolio", "overview", "settings"

  // Form state for profile editing
  const [formData, setFormData] = useState({
    displayName: "",
    bio: "",
    headline: "",
    location: "",
    skills: "",
    availabilityStatus: "NOT_LOOKING",
  });
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const portfolioImagesRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError(null);
        let data;
        const isUuid = username && /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(username);

        if (isUuid) {
          data = await api.getProfile(username);
        } else if (username) {
          data = await api.getProfileByUsername(username);
        } else if (authUser?.id) {
          data = await api.getProfile(authUser.id);
        } else {
          setError("No user provided and not logged in.");
          return;
        }

        setProfileUser(data);

        let actorData = null;
        try {
          const targetId = data.user?.id || data.userId || authUser?.id;
          if (targetId) {
            actorData = await api.getActorProfile(targetId);
          }
        } catch(e) {}

        setFormData({
          displayName: data.displayName || "",
          bio: data.bio || "",
          headline: data.headline || "",
          location: data.location || "",
          skills: data.skills ? data.skills.join(", ") : "",
          availabilityStatus: actorData?.availabilityStatus || "AVAILABLE",
        });
      } catch (err: any) {
        setError(err.response?.data?.error?.message || "Failed to load profile");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [username, authUser?.id]);

  useEffect(() => {
    const fetchPortfolio = async () => {
      const targetId = profileUser?.user?.id || profileUser?.userId;
      if (!targetId) return;
      try {
        setLoadingPortfolio(true);
        const data = await api.getPortfolio(targetId);
        setPortfolio(data || []);
      } catch {
        // Portfolio might not exist yet — that's fine
      } finally {
        setLoadingPortfolio(false);
      }
    };
    fetchPortfolio();
  }, [profileUser?.userId, profileUser?.user?.id, authUser?.id]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOwnProfile) return;

    try {
      setSaving(true);
      setSaveSuccess(false);

      const { availabilityStatus, ...profileData } = formData;

      const payload = {
        ...profileData,
        skills: formData.skills ? formData.skills.split(",").map((s) => s.trim()).filter(Boolean) : [],
      };

      const updatedProfile = await api.updateProfile(payload);
      setProfileUser({ ...profileUser, ...updatedProfile });

      if (authUser) {
        setUser({ ...authUser, profile: { ...authUser.profile, ...updatedProfile } } as any);
      }

      await api.upsertActorProfile({ availabilityStatus });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !isOwnProfile) return;

    try {
      setSaving(true);
      const data = await api.uploadAvatar(file);
      setProfileUser({ ...profileUser, avatarUrl: data.avatarUrl });
      if (authUser) {
        setUser({ ...authUser, profile: { ...authUser.profile, avatarUrl: data.avatarUrl } } as any);
      }
    } catch (err: any) {
      alert(err.response?.data?.error?.message || "Failed to upload avatar");
    } finally {
      setSaving(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !isOwnProfile) return;

    try {
      setSaving(true);
      const data = await api.uploadBanner(file);
      setProfileUser({ ...profileUser, bannerUrl: data.bannerUrl });
      if (authUser) {
        setUser({ ...authUser, profile: { ...authUser.profile, bannerUrl: data.bannerUrl } } as any);
      }
    } catch (err: any) {
      alert(err.response?.data?.error?.message || "Failed to upload banner");
    } finally {
      setSaving(false);
      if (bannerInputRef.current) bannerInputRef.current.value = "";
    }
  };

  const handleAddPortfolioItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!portfolioForm.title.trim()) return;

    try {
      setPortfolioSaving(true);
      const item = await api.createPortfolioItem({
        title: portfolioForm.title,
        description: portfolioForm.description || undefined,
        projectUrl: portfolioForm.projectUrl || undefined,
      });
      setPortfolio([item, ...portfolio]);
      setPortfolioForm({ title: "", description: "", projectUrl: "" });
      setShowAddPortfolio(false);
    } catch (err: any) {
      alert(err.response?.data?.error?.message || "Failed to add portfolio item");
    } finally {
      setPortfolioSaving(false);
    }
  };

  const handleDeletePortfolioItem = async (itemId: string) => {
    if (!confirm("Delete this portfolio item?")) return;
    try {
      await api.deletePortfolioItem(itemId);
      setPortfolio(portfolio.filter((p) => p.id !== itemId));
    } catch (err: any) {
      alert(err.response?.data?.error?.message || "Failed to delete");
    }
  };

  const handlePortfolioImageUpload = async (itemId: string, files: FileList) => {
    try {
      const fileArray = Array.from(files).slice(0, 6);
      const images = await api.uploadPortfolioImages(itemId, fileArray);
      setPortfolio(portfolio.map((p) =>
        p.id === itemId ? { ...p, images: [...(p.images || []), ...images] } : p
      ));
    } catch (err: any) {
      alert(err.response?.data?.error?.message || "Failed to upload images");
    }
  };

  const shareProfile = async () => {
    const targetUsername = profileUser?.user?.username || authUser?.username;
    if (!targetUsername) return;
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1';
    const url = `${baseUrl}/share/profile/${targetUsername}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${profileUser?.displayName || targetUsername}'s Profile`,
          text: "Check out my Artisto profile!",
          url
        });
      } catch (err) {
        console.log("Error sharing:", err);
      }
    } else {
      await navigator.clipboard.writeText(url);
      alert("Profile link copied!");
    }
  };

  const tabs = [
    { id: "portfolio", label: "Portfolio" },
    { id: "overview", label: "Overview" },
    ...(isOwnProfile ? [{ id: "settings", label: "Settings" }] : []),
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (error && !profileUser) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="text-center p-8 bg-white border border-slate-200 rounded-2xl max-w-md w-full shadow-sm">
          <div className="text-4xl mb-4">👤</div>
          <h3 className="text-xl font-semibold text-slate-900 mb-2">Profile not found</h3>
          <p className="text-slate-500">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container pb-20 pt-4">
      {/* Profile Header Banner */}
      <div className="h-48 md:h-64 bg-gradient-to-r from-purple-600 to-blue-600 relative rounded-2xl overflow-hidden shadow-lg group">
        {profileUser?.bannerUrl ? (
          <img src={profileUser.bannerUrl} alt="Banner" className="w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm"></div>
        )}
        {isOwnProfile && (
          <button
            onClick={() => bannerInputRef.current?.click()}
            disabled={saving}
            className="absolute top-4 right-4 bg-black/60 hover:bg-black/80 text-white px-4 py-2 rounded-xl text-xs font-bold backdrop-blur-md transition flex items-center gap-2 border border-white/20 shadow-lg cursor-pointer z-10"
          >
            <Camera className="w-4 h-4" /> Change Banner
          </button>
        )}
        <input
          type="file"
          ref={bannerInputRef}
          onChange={handleBannerUpload}
          accept="image/*"
          className="hidden"
        />
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 relative -mt-24">
        {/* Profile Card */}
        <Card className="bg-[var(--bg-card)] border-[var(--border-secondary)] shadow-xl backdrop-blur-md rounded-2xl">
          <CardContent className="p-6 md:p-8 flex flex-col md:flex-row gap-6 md:items-end">
            <div className="relative group">
              <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-[var(--bg-card)] bg-gradient-to-tr from-purple-500 to-blue-500 shadow-lg flex items-center justify-center text-4xl font-bold text-white overflow-hidden">
                {profileUser?.avatarUrl ? (
                  <img src={profileUser.avatarUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  profileUser?.displayName?.[0]?.toUpperCase() || "?"
                )}
              </div>
              {isOwnProfile && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={saving}
                  className="absolute bottom-2 right-2 w-10 h-10 bg-[var(--bg-secondary)] border border-[var(--border-primary)] shadow-md rounded-full flex items-center justify-center text-[var(--text-secondary)] hover:text-purple-400 transition-colors"
                >
                  <Camera className="w-5 h-5" />
                </button>
              )}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleAvatarUpload}
                accept="image/*"
                className="hidden"
              />
            </div>
            
            <div className="flex-1 space-y-2">
              <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                <div>
                  <h1 className="text-3xl font-extrabold text-[var(--text-primary)]">
                    {profileUser?.displayName}
                  </h1>
                  <p className="text-lg text-[var(--text-secondary)] font-medium">
                    {profileUser?.headline || (profileUser?.user?.role === "CREATOR" ? "Creative Professional" : "Member")}
                  </p>
                </div>
                <div className="flex gap-3">
                  <Button onClick={shareProfile} className="bg-white text-slate-900 hover:bg-slate-100 font-bold rounded-xl shadow-md border-0">
                    Share Profile
                  </Button>
                  {isOwnProfile && (
                    <Button onClick={() => setActiveTab("settings")} className="bg-white text-slate-900 hover:bg-slate-100 font-bold rounded-xl shadow-md border-0">
                      Edit Profile
                    </Button>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-sm text-[var(--text-muted)] pt-2">
                {profileUser?.location && (
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4" />
                    {profileUser.location}
                  </div>
                )}
                {profileUser?.user?.role === "CREATOR" && (
                  <div className="flex items-center gap-1.5 text-purple-400 font-medium bg-purple-900/30 border border-purple-500/20 px-2.5 py-1 rounded-full">
                    <CheckCircle2 className="w-4 h-4" />
                    Verified Creative
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Custom Tabs */}
        <div className="flex gap-8 mt-8 border-b border-[var(--border-secondary)] overflow-x-auto hide-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative pb-4 text-sm font-semibold transition-colors whitespace-nowrap ${
                activeTab === tab.id ? "text-purple-400" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <motion.div
                  layoutId="activeTabProfile"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600"
                />
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="py-8">
          <AnimatePresence mode="wait">
            {/* PORTFOLIO TAB */}
            {activeTab === "portfolio" && (
              <motion.div
                key="portfolio"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
                    <ImageIcon className="w-6 h-6 text-purple-400" />
                    Portfolio Projects
                  </h2>
                  {isOwnProfile && (
                    <Button onClick={() => setShowAddPortfolio(!showAddPortfolio)} variant="outline">
                      {showAddPortfolio ? "Cancel" : "Add Project"}
                    </Button>
                  )}
                </div>

                {showAddPortfolio && isOwnProfile && (
                  <Card className="bg-[var(--bg-card)] border-[var(--border-secondary)] shadow-lg rounded-2xl">
                    <CardContent className="p-6">
                      <form onSubmit={handleAddPortfolioItem} className="space-y-4">
                        <div>
                          <label className="text-sm font-medium text-[var(--text-secondary)]">Project Title *</label>
                          <Input
                            required
                            value={portfolioForm.title}
                            onChange={(e) => setPortfolioForm({ ...portfolioForm, title: e.target.value })}
                            placeholder="e.g. Brand Identity 2026"
                            className="bg-[var(--bg-secondary)] border-[var(--border-primary)] text-[var(--text-primary)] rounded-xl"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-[var(--text-secondary)]">Description</label>
                          <textarea
                            className="flex min-h-[80px] w-full rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] px-3 py-2 text-sm placeholder:text-[var(--text-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 text-[var(--text-primary)]"
                            value={portfolioForm.description}
                            onChange={(e) => setPortfolioForm({ ...portfolioForm, description: e.target.value })}
                            placeholder="Briefly describe the project..."
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-[var(--text-secondary)]">Project URL (Optional)</label>
                          <Input
                            type="url"
                            value={portfolioForm.projectUrl}
                            onChange={(e) => setPortfolioForm({ ...portfolioForm, projectUrl: e.target.value })}
                            placeholder="https://"
                            className="bg-[var(--bg-secondary)] border-[var(--border-primary)] text-[var(--text-primary)] rounded-xl"
                          />
                        </div>
                        <div className="flex justify-end pt-2">
                          <Button type="submit" disabled={portfolioSaving}>
                            {portfolioSaving ? "Saving..." : "Save Project"}
                          </Button>
                        </div>
                      </form>
                    </CardContent>
                  </Card>
                )}

                {loadingPortfolio ? (
                  <div className="py-20 flex justify-center">
                    <div className="w-8 h-8 border-4 border-[var(--border-secondary)] border-t-purple-500 rounded-full animate-spin" />
                  </div>
                ) : portfolio.length === 0 ? (
                  <div className="text-center py-20 border border-dashed border-[var(--border-secondary)] rounded-2xl bg-[var(--bg-card)] shadow-sm">
                    <ImageIcon className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-[var(--text-primary)]">No projects yet</h3>
                    <p className="text-[var(--text-secondary)]">Showcase your best work here.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {portfolio.map((item) => (
                      <Card key={item.id} className="overflow-hidden group hover:border-purple-500/50 transition-colors bg-[var(--bg-card)] border-[var(--border-secondary)] rounded-2xl shadow-lg">
                        <div className="aspect-[4/3] bg-[var(--bg-secondary)] relative">
                          {item.images && item.images.length > 0 ? (
                            <img src={item.images[0].url} alt={item.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ImageIcon className="w-10 h-10 text-[var(--text-muted)]" />
                            </div>
                          )}
                          {isOwnProfile && (
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                              <input
                                type="file"
                                multiple
                                accept="image/*"
                                className="hidden"
                                ref={portfolioImagesRef}
                                onChange={(e) => {
                                  if (e.target.files) handlePortfolioImageUpload(item.id, e.target.files);
                                  e.target.value = "";
                                }}
                              />
                              <Button size="sm" variant="secondary" onClick={() => portfolioImagesRef.current?.click()}>
                                Upload Images
                              </Button>
                              <Button size="sm" variant="destructive" onClick={() => handleDeletePortfolioItem(item.id)}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                        <CardContent className="p-4">
                          <h4 className="font-bold text-[var(--text-primary)]">{item.title}</h4>
                          {item.description && (
                            <p className="text-sm text-[var(--text-secondary)] mt-1 line-clamp-2">{item.description}</p>
                          )}
                          {item.projectUrl && (
                            <a href={item.projectUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-purple-400 hover:underline mt-3 inline-block font-medium">
                              View Live Project →
                            </a>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* OVERVIEW TAB */}
            {activeTab === "overview" && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="grid grid-cols-1 md:grid-cols-3 gap-8"
              >
                <div className="md:col-span-2 space-y-8">
                  <Card className="bg-[var(--bg-card)] border-[var(--border-secondary)] shadow-lg rounded-2xl">
                    <CardContent className="p-6 md:p-8">
                      <h2 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2 mb-4">
                        <Briefcase className="w-5 h-5 text-purple-400" /> About
                      </h2>
                      {profileUser?.bio ? (
                        <p className="text-[var(--text-secondary)] leading-relaxed whitespace-pre-line text-[15px]">
                          {profileUser.bio}
                        </p>
                      ) : (
                        <p className="text-[var(--text-muted)] italic">No biography provided yet.</p>
                      )}
                    </CardContent>
                  </Card>

                  {/* Portfolio Projects under Overview */}
                  <Card className="bg-[var(--bg-card)] border-[var(--border-secondary)] shadow-lg rounded-2xl">
                    <CardContent className="p-6 md:p-8">
                      <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
                          <ImageIcon className="w-5 h-5 text-purple-400" /> Portfolio Projects
                        </h2>
                        <button 
                          onClick={() => setActiveTab("portfolio")} 
                          className="text-xs font-semibold text-purple-400 hover:underline"
                        >
                          View All ({portfolio.length}) →
                        </button>
                      </div>

                      {portfolio.length === 0 ? (
                        <p className="text-[var(--text-muted)] italic text-sm">No portfolio projects added yet.</p>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {portfolio.slice(0, 4).map((item) => (
                            <div key={item.id} className="bg-[var(--bg-secondary)] border border-[var(--border-secondary)] rounded-xl overflow-hidden p-3 flex gap-3 items-center">
                              <div className="w-14 h-14 rounded-lg bg-[var(--bg-tertiary)] overflow-hidden shrink-0 flex items-center justify-center">
                                {item.images && item.images.length > 0 ? (
                                  <img src={item.images[0].url} alt={item.title} className="w-full h-full object-cover" />
                                ) : (
                                  <ImageIcon className="w-6 h-6 text-[var(--text-muted)]" />
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <h4 className="font-bold text-sm text-[var(--text-primary)] truncate">{item.title}</h4>
                                {item.description && (
                                  <p className="text-xs text-[var(--text-secondary)] line-clamp-1 mt-0.5">{item.description}</p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-8">
                  <Card className="bg-[var(--bg-card)] border-[var(--border-secondary)] shadow-lg rounded-2xl">
                    <CardContent className="p-6">
                      <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4">Skills</h2>
                      {profileUser?.skills && profileUser.skills.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {profileUser.skills.map((skill: string, idx: number) => (
                            <span key={idx} className="bg-[var(--bg-tertiary)] text-[var(--text-secondary)] px-3 py-1 rounded-full text-sm font-medium border border-[var(--border-primary)]">
                              {skill}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[var(--text-muted)] text-sm">No skills listed.</p>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </motion.div>
            )}

            {/* SETTINGS TAB */}
            {activeTab === "settings" && isOwnProfile && (
              <motion.div
                key="settings"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <Card className="bg-[var(--bg-card)] border-[var(--border-secondary)] shadow-lg rounded-2xl max-w-2xl">
                  <CardContent className="p-6 md:p-8">
                    <div className="flex items-center gap-2 mb-6">
                      <PenTool className="w-5 h-5 text-purple-400" />
                      <h2 className="text-xl font-bold text-[var(--text-primary)]">Edit Profile Details</h2>
                    </div>

                    {saveSuccess && (
                      <div className="bg-emerald-900/30 text-emerald-400 p-4 rounded-xl mb-6 border border-emerald-500/20 text-sm font-medium">
                        Profile updated successfully!
                      </div>
                    )}
                    {error && (
                      <div className="bg-red-900/30 text-red-400 p-4 rounded-xl mb-6 border border-red-500/20 text-sm font-medium">
                        {error}
                      </div>
                    )}

                    <form onSubmit={handleSaveProfile} className="space-y-5">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-2">
                          <label className="text-sm font-semibold text-[var(--text-secondary)]">Display Name</label>
                          <Input
                            required
                            value={formData.displayName}
                            onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                            placeholder="Your Name"
                            className="bg-[var(--bg-secondary)] border-[var(--border-primary)] text-[var(--text-primary)] rounded-xl"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-semibold text-[var(--text-secondary)]">Headline</label>
                          <Input
                            value={formData.headline}
                            onChange={(e) => setFormData({ ...formData, headline: e.target.value })}
                            placeholder="e.g. Senior Video Editor"
                            className="bg-[var(--bg-secondary)] border-[var(--border-primary)] text-[var(--text-primary)] rounded-xl"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-semibold text-[var(--text-secondary)]">Location</label>
                          <Input
                            value={formData.location}
                            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                            placeholder="e.g. New York, USA"
                            className="bg-[var(--bg-secondary)] border-[var(--border-primary)] text-[var(--text-primary)] rounded-xl"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-semibold text-[var(--text-secondary)]">Skills</label>
                          <Input
                            value={formData.skills}
                            onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                            placeholder="Editing, Animation, Grading (comma separated)"
                            className="bg-[var(--bg-secondary)] border-[var(--border-primary)] text-[var(--text-primary)] rounded-xl"
                          />
                        </div>

                        <div className="space-y-2 md:col-span-2">
                          <label className="text-sm font-semibold text-[var(--text-secondary)]">Availability Status</label>
                          <select
                            value={formData.availabilityStatus}
                            onChange={(e) => setFormData({ ...formData, availabilityStatus: e.target.value })}
                            className="flex h-10 w-full rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] px-3 py-2 text-sm text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
                          >
                            <option value="AVAILABLE">Available (Actively looking for roles)</option>
                            <option value="BUSY">Busy (Currently engaged)</option>
                            <option value="NOT_LOOKING">Unavailable (Not looking)</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-[var(--text-secondary)]">Bio</label>
                        <textarea
                          className="flex min-h-[120px] w-full rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] px-3 py-2 text-sm placeholder:text-[var(--text-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 text-[var(--text-primary)]"
                          value={formData.bio}
                          onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                          placeholder="Tell clients about your experience..."
                        />
                      </div>

                      <div className="pt-4 flex justify-end">
                        <Button type="submit" size="lg" disabled={saving}>
                          {saving ? "Saving..." : "Save Changes"}
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
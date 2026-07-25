import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../services/api";
import { useAuthStore } from "../store/auth";
import { Building2, Plus, Globe, Briefcase, ChevronDown, ChevronUp, CheckCircle2, XCircle, Trash2, Send } from "lucide-react";

export default function Companies() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const isRecruiter = user?.role === 'SELLER' || user?.role === 'ADMIN';

  const [activeTab, setActiveTab] = useState<'explore' | 'my'>('explore');
  const [pages, setPages] = useState<any[]>([]);
  const [myPages, setMyPages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Candidate Application Modal State
  const [applyModalData, setApplyModalData] = useState<{ opening: any; company: any; page: any } | null>(null);
  const [applyForm, setApplyForm] = useState({ requirements: "", portfolioUrl: "" });
  const [applying, setApplying] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);
  const [applySuccess, setApplySuccess] = useState(false);

  // Create Page modal/form state
  const [showCreatePageModal, setShowCreatePageModal] = useState(false);
  const [pageForm, setPageForm] = useState({ name: "", description: "", logoUrl: "", bannerUrl: "" });
  const [creatingPage, setCreatingPage] = useState(false);

  // Expanded Page accordion state
  const [expandedPageId, setExpandedPageId] = useState<string | null>(null);

  // Add Company state
  const [addingCompanyPageId, setAddingCompanyPageId] = useState<string | null>(null);
  const [companyForm, setCompanyForm] = useState({ name: "", industry: "", websiteUrl: "", isRecruitmentOpen: true });
  const [creatingCompany, setCreatingCompany] = useState(false);

  // Add Opening state
  const [addingOpeningCompanyId, setAddingOpeningCompanyId] = useState<string | null>(null);
  const [openingForm, setOpeningForm] = useState({ title: "", roleCategory: "Acting", description: "", location: "", salaryRange: "", isOpen: true });
  const [creatingOpening, setCreatingOpening] = useState(false);

  const fetchPages = async () => {
    try {
      setLoading(true);
      const data = await api.getPages({ q: searchQuery.trim() || undefined });
      setPages(data || []);

      if (user && isRecruiter) {
        const myData = await api.getMyPages();
        setMyPages(myData || []);
      }
    } catch (err) {
      console.error("Failed to load recruiter pages:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPages();
  }, [searchQuery, user?.id]);

  const handleSubmitApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!applyModalData) return;

    if (!user) {
      navigate('/login');
      return;
    }

    if (applyForm.portfolioUrl && !/^https?:\/\/.+/i.test(applyForm.portfolioUrl.trim())) {
      setApplyError("Portfolio URL must start with http:// or https://");
      return;
    }

    try {
      setApplying(true);
      setApplyError(null);
      setApplySuccess(false);

      await api.createOrder({
        openingId: applyModalData.opening.id,
        requirements: applyForm.requirements.trim() || undefined,
        portfolioUrl: applyForm.portfolioUrl.trim() || undefined,
      });

      setApplySuccess(true);
      setTimeout(() => {
        setApplyModalData(null);
        setApplyForm({ requirements: "", portfolioUrl: "" });
        setApplySuccess(false);
      }, 2000);
    } catch (err: any) {
      setApplyError(err.response?.data?.error?.message || "Failed to submit application");
    } finally {
      setApplying(false);
    }
  };

  const handleCreatePage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pageForm.name.trim()) return;

    try {
      setCreatingPage(true);
      const newPage = await api.createPage(pageForm);
      setShowCreatePageModal(false);
      setPageForm({ name: "", description: "", logoUrl: "", bannerUrl: "" });
      if (newPage?.id) {
        navigate(`/company/${newPage.id}`);
      } else {
        fetchPages();
      }
    } catch (err: any) {
      alert(err.response?.data?.error?.message || "Failed to create page");
    } finally {
      setCreatingPage(false);
    }
  };

  const handleAddCompany = async (e: React.FormEvent, pageId: string) => {
    e.preventDefault();
    if (!companyForm.name.trim()) return;

    try {
      setCreatingCompany(true);
      await api.addCompany(pageId, companyForm);
      setAddingCompanyPageId(null);
      setCompanyForm({ name: "", industry: "", websiteUrl: "", isRecruitmentOpen: true });
      fetchPages();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || "Failed to add company");
    } finally {
      setCreatingCompany(false);
    }
  };

  const handleToggleRecruitment = async (companyId: string, currentStatus: boolean) => {
    try {
      await api.updateCompany(companyId, { isRecruitmentOpen: !currentStatus });
      fetchPages();
    } catch (err: any) {
      alert("Failed to update recruitment status");
    }
  };

  const handleDeleteCompany = async (companyId: string) => {
    if (!confirm("Are you sure you want to remove this company?")) return;
    try {
      await api.deleteCompany(companyId);
      fetchPages();
    } catch (err: any) {
      alert("Failed to delete company");
    }
  };

  const handleAddOpening = async (e: React.FormEvent, companyId: string) => {
    e.preventDefault();
    if (!openingForm.title.trim() || !openingForm.description.trim()) return;

    try {
      setCreatingOpening(true);
      await api.addOpening(companyId, openingForm);
      setAddingOpeningCompanyId(null);
      setOpeningForm({ title: "", roleCategory: "Acting", description: "", location: "", salaryRange: "", isOpen: true });
      fetchPages();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || "Failed to add opening");
    } finally {
      setCreatingOpening(false);
    }
  };

  const handleToggleOpeningStatus = async (openingId: string, currentStatus: boolean) => {
    try {
      await api.updateOpening(openingId, { isOpen: !currentStatus });
      fetchPages();
    } catch (err: any) {
      alert("Failed to update opening status");
    }
  };

  const handleDeleteOpening = async (openingId: string) => {
    if (!confirm("Are you sure you want to remove this role opening?")) return;
    try {
      await api.deleteOpening(openingId);
      fetchPages();
    } catch (err: any) {
      alert("Failed to delete opening");
    }
  };

  return (
    <div className="page-container">
      {/* HEADER & TABS */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Building2 className="w-8 h-8 text-purple-400" />
            Recruiter Pages & Brands
          </h1>
          <p className="page-subtitle">
            Explore organization pages, manage multiple brand profiles, and review role openings.
          </p>
        </div>

        {isRecruiter && (
          <button
            onClick={() => setShowCreatePageModal(true)}
            className="btn btn-primary flex items-center gap-2 shadow-lg shadow-purple-500/20"
          >
            <Plus className="w-4 h-4" /> Create Recruiter Page
          </button>
        )}
      </div>

      {/* TABS HEADER */}
      <div className="flex gap-4 border-b border-white/10 mb-8">
        <button
          onClick={() => setActiveTab('explore')}
          className={`pb-3 px-2 font-bold text-sm border-b-2 transition-colors ${
            activeTab === 'explore'
              ? 'border-purple-500 text-purple-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          🌐 Explore All Pages ({pages.length})
        </button>

        {isRecruiter && (
          <button
            onClick={() => setActiveTab('my')}
            className={`pb-3 px-2 font-bold text-sm border-b-2 transition-colors ${
              activeTab === 'my'
                ? 'border-purple-500 text-purple-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            🏢 My Owned Pages ({myPages.length})
          </button>
        )}
      </div>

      {/* SEARCH BAR FOR EXPLORE */}
      {activeTab === 'explore' && (
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search recruiter pages or brands..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full max-w-md px-4 py-2.5 rounded-xl bg-slate-900/60 border border-white/10 text-white placeholder-slate-400 text-sm focus:outline-none focus:border-purple-500"
          />
        </div>
      )}

      {/* CREATE PAGE MODAL */}
      {showCreatePageModal && (
        <div className="modal-overlay" onClick={() => setShowCreatePageModal(false)}>
          <div className="modal-card max-w-lg" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-white mb-2">Create New Recruiter Page</h2>
            <p className="text-xs text-slate-400 mb-6">
              A Recruiter Page represents an organization or studio brand (e.g. Netflix India, Paramount Studios).
            </p>

            <form onSubmit={handleCreatePage} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Page Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Universal Casting Group"
                  value={pageForm.name}
                  onChange={(e) => setPageForm({ ...pageForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-white/10 rounded-xl text-white text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Description</label>
                <textarea
                  rows={3}
                  placeholder="About this recruiter organization..."
                  value={pageForm.description}
                  onChange={(e) => setPageForm({ ...pageForm, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-white/10 rounded-xl text-white text-sm"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreatePageModal(false)}
                  className="btn btn-ghost"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingPage}
                  className="btn btn-primary"
                >
                  {creatingPage ? "Creating..." : "Create Page"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MAIN CONTENT AREA */}
      {loading ? (
        <div className="empty-state">
          <div className="loading-spinner large" style={{ margin: '0 auto' }}></div>
          <p style={{ marginTop: 16, color: 'var(--text-muted)' }}>Loading recruiter pages...</p>
        </div>
      ) : (
        <>
          {/* TAB 1: EXPLORE ALL PAGES */}
          {activeTab === 'explore' && (
            <div>
              {pages.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">🏢</div>
                  <h3>No Recruiter Pages found</h3>
                  <p>There are no active organization pages listed matching your search.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {pages.map((page) => {
                    const isExpanded = expandedPageId === page.id;
                    const totalCompanies = page.companies?.length || 0;

                    return (
                      <div
                        key={page.id}
                        className="bg-slate-900/60 border border-white/10 rounded-2xl p-6 shadow-xl backdrop-blur-md"
                      >
                        {/* Page Header */}
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-white/5">
                          <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-xl font-black text-white shadow-md overflow-hidden">
                              {page.logoUrl ? (
                                <img src={page.logoUrl} alt="" className="w-full h-full object-cover" />
                              ) : (
                                page.name[0].toUpperCase()
                              )}
                            </div>
                            <div>
                              <h2 className="text-xl font-bold text-white flex items-center gap-2 hover:text-purple-400 transition-colors">
                                <Link to={`/company/${page.id}`}>{page.name}</Link>
                              </h2>
                              <p className="text-xs text-slate-400 mt-0.5">
                                Managed by <strong className="text-purple-400">{page.owner?.profile?.displayName || page.owner?.username || "Recruiter"}</strong> • {totalCompanies} brand/company listing{totalCompanies !== 1 ? 's' : ''}
                              </p>
                            </div>
                          </div>

                          <button
                            onClick={() => setExpandedPageId(isExpanded ? null : page.id)}
                            className="btn btn-secondary btn-sm flex items-center gap-2"
                          >
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            {isExpanded ? "Collapse Page" : `View Brands & Openings (${totalCompanies})`}
                          </button>
                        </div>

                        {page.description && (
                          <p className="text-sm text-slate-300 mt-4 leading-relaxed">
                            {page.description}
                          </p>
                        )}

                        {/* Companies & Openings Section */}
                        {isExpanded && (
                          <div className="mt-6 pt-6 border-t border-white/10 space-y-6">
                            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
                              Companies & Recruitment Openings under {page.name}
                            </h3>

                            {totalCompanies === 0 ? (
                              <p className="text-xs text-slate-500 italic">No companies listed under this page yet.</p>
                            ) : (
                              <div className="grid grid-cols-1 gap-4">
                                {page.companies.map((comp: any) => (
                                  <div
                                    key={comp.id}
                                    className="bg-slate-800/50 border border-white/5 rounded-xl p-5"
                                  >
                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-3">
                                      <div>
                                        <div className="flex items-center gap-3">
                                          <h4 className="font-bold text-base text-white">{comp.name}</h4>
                                          {comp.isRecruitmentOpen ? (
                                            <span className="inline-flex items-center gap-1 bg-emerald-950/80 text-emerald-400 text-xs font-bold px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                                              <CheckCircle2 className="w-3 h-3" /> Recruitment Open
                                            </span>
                                          ) : (
                                            <span className="inline-flex items-center gap-1 bg-red-950/80 text-red-400 text-xs font-bold px-2.5 py-0.5 rounded-full border border-red-500/30">
                                              <XCircle className="w-3 h-3" /> Recruitment Closed
                                            </span>
                                          )}
                                        </div>
                                        {comp.industry && (
                                          <p className="text-xs text-slate-400 mt-1">Industry: {comp.industry}</p>
                                        )}
                                      </div>

                                      {comp.websiteUrl && (
                                        <a
                                          href={comp.websiteUrl}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-xs text-purple-400 hover:underline flex items-center gap-1"
                                        >
                                          <Globe className="w-3.5 h-3.5" /> {comp.websiteUrl.replace(/^https?:\/\//i, '')}
                                        </a>
                                      )}
                                    </div>

                                    {/* Role Openings list */}
                                    <div className="mt-4 pt-3 border-t border-white/5 space-y-2">
                                      <h5 className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                                        <Briefcase className="w-3.5 h-3.5 text-purple-400" />
                                        Role Openings ({comp.openings?.length || 0})
                                      </h5>

                                      {comp.openings && comp.openings.length > 0 ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                                          {comp.openings.map((op: any) => (
                                            <div key={op.id} className="flex flex-col justify-between p-3 bg-slate-900/60 rounded-xl border border-white/5">
                                              <div>
                                                <div className="flex justify-between items-start">
                                                  <h6 className="font-bold text-xs text-slate-200">{op.title}</h6>
                                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${op.isOpen ? 'bg-purple-900/50 text-purple-300' : 'bg-slate-800 text-slate-500'}`}>
                                                    {op.isOpen ? 'Open' : 'Closed'}
                                                  </span>
                                                </div>
                                                <p className="text-xs text-slate-400 mt-1 line-clamp-2">{op.description}</p>
                                              </div>

                                              <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/5">
                                                <div className="flex gap-3 text-[11px] text-slate-400">
                                                  {op.location && <span>📍 {op.location}</span>}
                                                  {op.salaryRange && <span>💰 {op.salaryRange}</span>}
                                                </div>

                                                {op.isOpen && comp.isRecruitmentOpen && (
                                                  <button
                                                    onClick={() => {
                                                      setApplyModalData({ opening: op, company: comp, page });
                                                      setApplyForm({ requirements: "", portfolioUrl: "" });
                                                      setApplyError(null);
                                                      setApplySuccess(false);
                                                    }}
                                                    className="btn btn-primary btn-sm text-[11px] py-1 px-3 rounded-full flex items-center gap-1 shadow-md shadow-purple-500/20"
                                                  >
                                                    <Send className="w-3 h-3" /> Apply Now
                                                  </button>
                                                )}
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      ) : (
                                        <p className="text-[11px] text-slate-500 italic">No open roles specified for this company.</p>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: MY OWNED PAGES (RECRUITER MANAGEMENT) */}
          {activeTab === 'my' && isRecruiter && (
            <div>
              {myPages.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">➕</div>
                  <h3>You haven't created any Recruiter Pages yet</h3>
                  <p>Create a Recruiter Page to list your companies, toggle recruitment open/closed status, and add role openings.</p>
                  <button onClick={() => setShowCreatePageModal(true)} className="btn btn-primary">
                    Create Your First Page
                  </button>
                </div>
              ) : (
                <div className="space-y-8">
                  {myPages.map((page) => (
                    <div key={page.id} className="bg-slate-900/80 border border-purple-500/30 rounded-2xl p-6 shadow-xl">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h2 className="text-2xl font-black text-white">{page.name}</h2>
                          <p className="text-xs text-slate-400">{page.description || "No description provided."}</p>
                        </div>
                        <button
                          onClick={() => setAddingCompanyPageId(addingCompanyPageId === page.id ? null : page.id)}
                          className="btn btn-primary btn-sm flex items-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" /> Add Company under {page.name}
                        </button>
                      </div>

                      {/* ADD COMPANY FORM */}
                      {addingCompanyPageId === page.id && (
                        <div className="mb-6 p-4 bg-slate-800/80 border border-purple-500/40 rounded-xl space-y-3">
                          <h4 className="text-sm font-bold text-purple-300">Add Company under {page.name}</h4>
                          <form onSubmit={(e) => handleAddCompany(e, page.id)} className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <input
                              type="text"
                              required
                              placeholder="Company Name *"
                              value={companyForm.name}
                              onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })}
                              className="px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-white text-xs"
                            />
                            <input
                              type="text"
                              placeholder="Industry (e.g. Film Production)"
                              value={companyForm.industry}
                              onChange={(e) => setCompanyForm({ ...companyForm, industry: e.target.value })}
                              className="px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-white text-xs"
                            />
                            <input
                              type="url"
                              placeholder="Website URL (https://...)"
                              value={companyForm.websiteUrl}
                              onChange={(e) => setCompanyForm({ ...companyForm, websiteUrl: e.target.value })}
                              className="px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-white text-xs md:col-span-2"
                            />
                            <div className="flex items-center gap-2 md:col-span-2">
                              <label className="text-xs font-semibold text-slate-300">Recruitment Status:</label>
                              <select
                                value={companyForm.isRecruitmentOpen ? "open" : "closed"}
                                onChange={(e) => setCompanyForm({ ...companyForm, isRecruitmentOpen: e.target.value === "open" })}
                                className="px-3 py-1 bg-slate-900 border border-white/10 rounded-lg text-white text-xs"
                              >
                                <option value="open">🟢 Recruitment Open</option>
                                <option value="closed">🔴 Recruitment Closed</option>
                              </select>
                            </div>
                            <div className="md:col-span-2 flex justify-end gap-2 pt-2">
                              <button type="button" onClick={() => setAddingCompanyPageId(null)} className="btn btn-ghost btn-sm">Cancel</button>
                              <button type="submit" disabled={creatingCompany} className="btn btn-primary btn-sm">
                                {creatingCompany ? "Adding..." : "Save Company"}
                              </button>
                            </div>
                          </form>
                        </div>
                      )}

                      {/* COMPANIES LIST */}
                      <div className="space-y-4 mt-6">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                          Companies ({page.companies?.length || 0})
                        </h3>

                        {(!page.companies || page.companies.length === 0) ? (
                          <p className="text-xs text-slate-500 italic">No companies added under this page yet.</p>
                        ) : (
                          page.companies.map((comp: any) => (
                            <div key={comp.id} className="bg-slate-800/60 border border-white/10 rounded-xl p-5">
                              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                                <div>
                                  <div className="flex items-center gap-3">
                                    <h4 className="font-bold text-base text-white">{comp.name}</h4>
                                    <button
                                      onClick={() => handleToggleRecruitment(comp.id, comp.isRecruitmentOpen)}
                                      className={`text-xs font-bold px-3 py-1 rounded-full border transition-all ${
                                        comp.isRecruitmentOpen
                                          ? 'bg-emerald-950 text-emerald-400 border-emerald-500/40 hover:bg-emerald-900'
                                          : 'bg-red-950 text-red-400 border-red-500/40 hover:bg-red-900'
                                      }`}
                                    >
                                      {comp.isRecruitmentOpen ? '🟢 Recruitment Open (Click to Close)' : '🔴 Recruitment Closed (Click to Open)'}
                                    </button>
                                  </div>
                                  {comp.industry && <p className="text-xs text-slate-400 mt-1">Industry: {comp.industry}</p>}
                                </div>

                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => setAddingOpeningCompanyId(addingOpeningCompanyId === comp.id ? null : comp.id)}
                                    className="btn btn-secondary btn-sm flex items-center gap-1"
                                  >
                                    <Plus className="w-3 h-3" /> Add Role Opening
                                  </button>
                                  <button
                                    onClick={() => handleDeleteCompany(comp.id)}
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-950/40"
                                    title="Remove company"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>

                              {/* ADD OPENING FORM */}
                              {addingOpeningCompanyId === comp.id && (
                                <div className="mt-4 p-4 bg-slate-900 border border-purple-500/30 rounded-xl space-y-3">
                                  <h5 className="text-xs font-bold text-purple-300">Add Role Opening under {comp.name}</h5>
                                  <form onSubmit={(e) => handleAddOpening(e, comp.id)} className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <input
                                      type="text"
                                      required
                                      placeholder="Opening Title * (e.g. Lead Female Actor)"
                                      value={openingForm.title}
                                      onChange={(e) => setOpeningForm({ ...openingForm, title: e.target.value })}
                                      className="px-3 py-2 bg-slate-800 border border-white/10 rounded-xl text-white text-xs"
                                    />
                                    <input
                                      type="text"
                                      placeholder="Role Category (e.g. Acting, Stunts)"
                                      value={openingForm.roleCategory}
                                      onChange={(e) => setOpeningForm({ ...openingForm, roleCategory: e.target.value })}
                                      className="px-3 py-2 bg-slate-800 border border-white/10 rounded-xl text-white text-xs"
                                    />
                                    <input
                                      type="text"
                                      placeholder="Location (e.g. Mumbai, India)"
                                      value={openingForm.location}
                                      onChange={(e) => setOpeningForm({ ...openingForm, location: e.target.value })}
                                      className="px-3 py-2 bg-slate-800 border border-white/10 rounded-xl text-white text-xs"
                                    />
                                    <input
                                      type="text"
                                      placeholder="Salary/Compensation Range"
                                      value={openingForm.salaryRange}
                                      onChange={(e) => setOpeningForm({ ...openingForm, salaryRange: e.target.value })}
                                      className="px-3 py-2 bg-slate-800 border border-white/10 rounded-xl text-white text-xs"
                                    />
                                    <textarea
                                      required
                                      rows={2}
                                      placeholder="Role description & requirements *"
                                      value={openingForm.description}
                                      onChange={(e) => setOpeningForm({ ...openingForm, description: e.target.value })}
                                      className="px-3 py-2 bg-slate-800 border border-white/10 rounded-xl text-white text-xs md:col-span-2"
                                    />
                                    <div className="md:col-span-2 flex justify-end gap-2 pt-1">
                                      <button type="button" onClick={() => setAddingOpeningCompanyId(null)} className="btn btn-ghost btn-sm">Cancel</button>
                                      <button type="submit" disabled={creatingOpening} className="btn btn-primary btn-sm">
                                        {creatingOpening ? "Saving..." : "Save Role Opening"}
                                      </button>
                                    </div>
                                  </form>
                                </div>
                              )}

                              {/* OPENINGS LIST */}
                              <div className="mt-4 pt-3 border-t border-white/5 space-y-2">
                                <h5 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                  Role Openings ({comp.openings?.length || 0})
                                </h5>

                                {comp.openings && comp.openings.length > 0 ? (
                                  <div className="space-y-2">
                                    {comp.openings.map((op: any) => (
                                      <div key={op.id} className="p-3 bg-slate-900/80 rounded-xl border border-white/5 flex justify-between items-center">
                                        <div>
                                          <div className="flex items-center gap-2">
                                            <span className="font-bold text-xs text-white">{op.title}</span>
                                            <span className={`text-[10px] font-bold px-2 py-0.2 rounded-full ${op.isOpen ? 'bg-purple-900/60 text-purple-300' : 'bg-slate-800 text-slate-500'}`}>
                                              {op.isOpen ? 'Open' : 'Closed'}
                                            </span>
                                          </div>
                                          <p className="text-xs text-slate-400 mt-0.5">{op.description}</p>
                                        </div>

                                        <div className="flex items-center gap-2">
                                          <button
                                            onClick={() => handleToggleOpeningStatus(op.id, op.isOpen)}
                                            className="text-[11px] text-purple-400 hover:underline"
                                          >
                                            {op.isOpen ? 'Close Role' : 'Open Role'}
                                          </button>
                                          <button
                                            onClick={() => handleDeleteOpening(op.id)}
                                            className="text-slate-400 hover:text-red-400 p-1"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-[11px] text-slate-500 italic">No openings listed yet.</p>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* CANDIDATE ROLE APPLICATION MODAL */}
      {applyModalData && (
        <div className="modal-overlay" onClick={() => setApplyModalData(null)}>
          <div className="modal-card max-w-lg" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-purple-400" />
                Apply for {applyModalData.opening.title}
              </h2>
            </div>
            <p className="text-xs text-slate-400 mb-6">
              Recruiter Page: <strong className="text-purple-300">{applyModalData.page.name}</strong> • Brand: <strong className="text-white">{applyModalData.company.name}</strong>
            </p>

            {applySuccess ? (
              <div className="bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 p-6 rounded-2xl text-center space-y-2 animate-fadeIn">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                <h4 className="font-bold text-base text-white">Application Submitted!</h4>
                <p className="text-xs text-emerald-200">
                  Your application, pitch, and portfolio work link have been sent directly to the recruiter.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmitApplication} className="space-y-4">
                {applyError && (
                  <div className="bg-red-900/30 text-red-400 p-3 rounded-xl border border-red-500/30 text-xs">
                    {applyError}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Portfolio / Work Link *
                  </label>
                  <input
                    type="url"
                    required
                    placeholder="https://behance.net/mywork, https://github.com/..."
                    value={applyForm.portfolioUrl}
                    onChange={(e) => setApplyForm({ ...applyForm, portfolioUrl: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-800 border border-white/10 rounded-xl text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-purple-500"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Submit a link to your portfolio, website, GitHub, Google Drive, or Behance.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Application Details / Pitch
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Describe your relevant experience, availability, and why you are a fit for this role..."
                    value={applyForm.requirements}
                    onChange={(e) => setApplyForm({ ...applyForm, requirements: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-800 border border-white/10 rounded-xl text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setApplyModalData(null)}
                    className="btn btn-ghost"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={applying}
                    className="btn btn-primary shadow-lg shadow-purple-500/20 flex items-center gap-2"
                  >
                    <Send className="w-4 h-4" /> {applying ? "Submitting..." : "Submit Application"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
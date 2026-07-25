import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { api } from "../services/api";
import { useAuthStore } from "../store/auth";
import { Building2, Globe, Briefcase, MapPin, DollarSign, ArrowLeft, Plus, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";

export default function CompanyDetail() {
  const { pageId } = useParams<{ pageId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isRecruiter = user?.role === 'SELLER' || user?.role === 'ADMIN';

  const [pageData, setPageData] = useState<any>(null);
  const [myPages, setMyPages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Application modal state
  const [applyModalData, setApplyModalData] = useState<{ opening: any; company: any } | null>(null);
  const [applyForm, setApplyForm] = useState({ requirements: "", portfolioUrl: "" });
  const [applying, setApplying] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);
  const [applySuccess, setApplySuccess] = useState(false);

  // Add Company state for owner
  const [showAddCompany, setShowAddCompany] = useState(false);
  const [companyForm, setCompanyForm] = useState({ name: "", industry: "", websiteUrl: "", isRecruitmentOpen: true });
  const [creatingCompany, setCreatingCompany] = useState(false);

  // Add Opening state for owner
  const [addingOpeningCompanyId, setAddingOpeningCompanyId] = useState<string | null>(null);
  const [openingForm, setOpeningForm] = useState({ title: "", roleCategory: "Acting", description: "", location: "", salaryRange: "", isOpen: true });
  const [creatingOpening, setCreatingOpening] = useState(false);

  const fetchPage = async () => {
    if (!pageId) return;
    try {
      setLoading(true);
      setError(null);
      const data = await api.getPage(pageId);
      setPageData(data);

      if (user && isRecruiter) {
        const mine = await api.getMyPages();
        setMyPages(mine || []);
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || "Failed to load company page");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPage();
  }, [pageId, user?.id]);

  const handleApply = async (e: React.FormEvent) => {
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

  const handleAddCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pageData || !companyForm.name.trim()) return;
    try {
      setCreatingCompany(true);
      await api.addCompany(pageData.id, companyForm);
      setShowAddCompany(false);
      setCompanyForm({ name: "", industry: "", websiteUrl: "", isRecruitmentOpen: true });
      fetchPage();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || "Failed to add company");
    } finally {
      setCreatingCompany(false);
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
      fetchPage();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || "Failed to add role opening");
    } finally {
      setCreatingOpening(false);
    }
  };

  const isOwner = user?.id === pageData?.ownerId;

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !pageData) {
    return (
      <div className="page-container flex flex-col items-center justify-center py-20 text-center">
        <Building2 className="w-16 h-16 text-[var(--text-muted)] mb-4" />
        <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Company Page Not Found</h2>
        <p className="text-[var(--text-secondary)] mb-6">{error || "The requested page does not exist."}</p>
        <Button asChild variant="outline">
          <Link to="/company"><ArrowLeft className="w-4 h-4 mr-2" /> Back to Recruitment</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] pb-20">
      {/* Banner */}
      <div className="h-56 md:h-72 bg-gradient-to-r from-purple-900 to-indigo-900 relative overflow-hidden">
        {pageData.bannerUrl ? (
          <img src={pageData.bannerUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
        )}
        <div className="absolute top-4 left-4">
          <Button asChild variant="ghost" size="sm" className="text-white hover:bg-white/10 backdrop-blur-md">
            <Link to="/company"><ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Recruitment</Link>
          </Button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 relative -mt-20 space-y-8">
        {/* Header Profile Card */}
        <Card className="bg-[var(--bg-card)] border-[var(--border-secondary)] shadow-xl backdrop-blur-md rounded-2xl">
          <CardContent className="p-6 md:p-8 flex flex-col md:flex-row gap-6 md:items-end justify-between">
            <div className="flex flex-col md:flex-row gap-6 items-start md:items-end">
              <div className="w-28 h-28 md:w-36 md:h-36 rounded-2xl border-4 border-[var(--bg-card)] bg-slate-900 shadow-lg flex items-center justify-center overflow-hidden shrink-0">
                {pageData.logoUrl ? (
                  <img src={pageData.logoUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <Building2 className="w-14 h-14 text-purple-400" />
                )}
              </div>
              <div>
                <h1 className="text-3xl font-extrabold text-[var(--text-primary)]">{pageData.name}</h1>
                <p className="text-[var(--text-secondary)] mt-1.5 max-w-2xl text-sm leading-relaxed">
                  {pageData.description || "Recruitment Page & Agency"}
                </p>
                <div className="flex items-center gap-4 text-xs text-[var(--text-muted)] mt-3">
                  <span>Created by {pageData.owner?.profile?.displayName || pageData.owner?.username || "Recruiter"}</span>
                  <span>•</span>
                  <span>{pageData.companies?.length || 0} Companies & Sub-brands</span>
                </div>
              </div>
            </div>

            {/* Multi-company switcher if recruiter manages multiple pages */}
            {myPages.length > 1 && (
              <div className="shrink-0 bg-[var(--bg-secondary)] p-3 rounded-xl border border-[var(--border-primary)]">
                <label className="text-xs font-semibold text-[var(--text-muted)] block mb-1.5">Switch Your Pages</label>
                <select
                  className="bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] text-white text-xs rounded-lg p-2 outline-none w-full"
                  value={pageData.id}
                  onChange={(e) => navigate(`/company/${e.target.value}`)}
                >
                  {myPages.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Owner Controls */}
        {isOwner && (
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Building2 className="w-5 h-5 text-purple-400" /> Managed Companies & Openings
            </h2>
            <Button onClick={() => setShowAddCompany(!showAddCompany)} size="sm">
              {showAddCompany ? "Cancel" : <><Plus className="w-4 h-4 mr-1" /> Add Sub-Company / Brand</>}
            </Button>
          </div>
        )}

        {/* Add Company Form Modal/Card */}
        {showAddCompany && isOwner && (
          <Card className="bg-[var(--bg-card)] border-[var(--border-secondary)] shadow-lg rounded-2xl">
            <CardContent className="p-6">
              <h3 className="text-lg font-bold text-white mb-4">Add Sub-Company / Brand to {pageData.name}</h3>
              <form onSubmit={handleAddCompany} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">Company Name *</label>
                    <input
                      type="text"
                      required
                      value={companyForm.name}
                      onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })}
                      placeholder="e.g. Paramount Pictures"
                      className="w-full bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-white text-sm rounded-xl p-3 outline-none focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">Industry</label>
                    <input
                      type="text"
                      value={companyForm.industry}
                      onChange={(e) => setCompanyForm({ ...companyForm, industry: e.target.value })}
                      placeholder="e.g. Film Production"
                      className="w-full bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-white text-sm rounded-xl p-3 outline-none focus:border-purple-500"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-xs font-semibold text-slate-300 block mb-1">Website URL</label>
                    <input
                      type="url"
                      value={companyForm.websiteUrl}
                      onChange={(e) => setCompanyForm({ ...companyForm, websiteUrl: e.target.value })}
                      placeholder="https://..."
                      className="w-full bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-white text-sm rounded-xl p-3 outline-none focus:border-purple-500"
                    />
                  </div>
                </div>
                <div className="flex justify-end pt-2">
                  <Button type="submit" disabled={creatingCompany}>
                    {creatingCompany ? "Adding..." : "Add Company"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Companies & Openings List */}
        <div className="space-y-6">
          {(!pageData.companies || pageData.companies.length === 0) ? (
            <Card className="bg-[var(--bg-card)] border-[var(--border-secondary)] text-center py-16">
              <CardContent>
                <Building2 className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-white mb-1">No Companies Listed Yet</h3>
                <p className="text-slate-400 text-sm">This recruiter has not added specific company profiles under this page.</p>
              </CardContent>
            </Card>
          ) : (
            pageData.companies.map((company: any) => (
              <Card key={company.id} className="bg-[var(--bg-card)] border-[var(--border-secondary)] shadow-lg rounded-2xl overflow-hidden">
                <CardHeader className="bg-[var(--bg-secondary)]/50 border-b border-[var(--border-secondary)] p-6">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-purple-950/80 border border-purple-500/30 flex items-center justify-center text-purple-400 font-bold text-lg">
                        {company.name[0]}
                      </div>
                      <div>
                        <CardTitle className="text-xl text-white">{company.name}</CardTitle>
                        <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                          {company.industry && <span>{company.industry}</span>}
                          {company.websiteUrl && (
                            <a href={company.websiteUrl} target="_blank" rel="noreferrer" className="text-purple-400 hover:underline flex items-center gap-1">
                              <Globe className="w-3 h-3" /> Website
                            </a>
                          )}
                        </div>
                      </div>
                    </div>

                    {isOwner && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setAddingOpeningCompanyId(addingOpeningCompanyId === company.id ? null : company.id)}
                      >
                        {addingOpeningCompanyId === company.id ? "Cancel" : <><Plus className="w-4 h-4 mr-1" /> Post Role Opening</>}
                      </Button>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="p-6">
                  {/* Add Opening Inline Form */}
                  {addingOpeningCompanyId === company.id && isOwner && (
                    <div className="mb-6 p-5 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-primary)] space-y-4">
                      <h4 className="font-bold text-white text-sm">Post New Role Opening under {company.name}</h4>
                      <form onSubmit={(e) => handleAddOpening(e, company.id)} className="space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs text-slate-300 font-semibold block mb-1">Role Title *</label>
                            <input
                              type="text"
                              required
                              value={openingForm.title}
                              onChange={(e) => setOpeningForm({ ...openingForm, title: e.target.value })}
                              placeholder="e.g. Lead Actor - Action Feature"
                              className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] text-white text-xs rounded-lg p-2.5 outline-none"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-slate-300 font-semibold block mb-1">Category</label>
                            <input
                              type="text"
                              value={openingForm.roleCategory}
                              onChange={(e) => setOpeningForm({ ...openingForm, roleCategory: e.target.value })}
                              placeholder="Acting, Voiceover, Stunt"
                              className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] text-white text-xs rounded-lg p-2.5 outline-none"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-slate-300 font-semibold block mb-1">Location</label>
                            <input
                              type="text"
                              value={openingForm.location}
                              onChange={(e) => setOpeningForm({ ...openingForm, location: e.target.value })}
                              placeholder="e.g. Mumbai / Remote"
                              className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] text-white text-xs rounded-lg p-2.5 outline-none"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-slate-300 font-semibold block mb-1">Compensation / Budget</label>
                            <input
                              type="text"
                              value={openingForm.salaryRange}
                              onChange={(e) => setOpeningForm({ ...openingForm, salaryRange: e.target.value })}
                              placeholder="e.g. $50,000 / project"
                              className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] text-white text-xs rounded-lg p-2.5 outline-none"
                            />
                          </div>
                          <div className="sm:col-span-2">
                            <label className="text-xs text-slate-300 font-semibold block mb-1">Description & Requirements *</label>
                            <textarea
                              required
                              rows={3}
                              value={openingForm.description}
                              onChange={(e) => setOpeningForm({ ...openingForm, description: e.target.value })}
                              placeholder="Describe role requirements, character bio, production dates..."
                              className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] text-white text-xs rounded-lg p-2.5 outline-none"
                            />
                          </div>
                        </div>
                        <div className="flex justify-end pt-1">
                          <Button type="submit" size="sm" disabled={creatingOpening}>
                            {creatingOpening ? "Posting..." : "Publish Role Opening"}
                          </Button>
                        </div>
                      </form>
                    </div>
                  )}

                  {/* Openings List */}
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-1.5">
                    <Briefcase className="w-4 h-4 text-purple-400" /> Active Openings ({company.openings?.length || 0})
                  </h4>

                  {(!company.openings || company.openings.length === 0) ? (
                    <p className="text-slate-500 italic text-xs py-2">No active role openings for this company.</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {company.openings.map((opening: any) => (
                        <div key={opening.id} className="p-4 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl space-y-3 flex flex-col justify-between">
                          <div>
                            <div className="flex justify-between items-start mb-2">
                              <span className="text-[11px] font-bold uppercase tracking-wider text-purple-400 bg-purple-950/60 px-2.5 py-0.5 rounded-full border border-purple-500/30">
                                {opening.roleCategory}
                              </span>
                              {opening.salaryRange && (
                                <span className="text-xs font-bold text-emerald-400 flex items-center gap-0.5">
                                  <DollarSign className="w-3 h-3" /> {opening.salaryRange}
                                </span>
                              )}
                            </div>
                            <h5 className="font-bold text-white text-base">{opening.title}</h5>
                            <p className="text-xs text-slate-300 mt-1 line-clamp-3 leading-relaxed">{opening.description}</p>
                            {opening.location && (
                              <div className="text-xs text-slate-400 flex items-center gap-1 mt-2">
                                <MapPin className="w-3.5 h-3.5" /> {opening.location}
                              </div>
                            )}
                          </div>

                          <div className="pt-2 border-t border-[var(--border-secondary)] flex justify-between items-center">
                            <span className="text-[11px] text-slate-500">Posted {new Date(opening.createdAt).toLocaleDateString()}</span>
                            <Button
                              size="sm"
                              onClick={() => setApplyModalData({ opening, company })}
                              className="bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-lg px-4"
                            >
                              Apply for Role
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Candidate Application Modal */}
      {applyModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-slate-900 border border-white/10 rounded-2xl shadow-2xl p-6 text-white relative animate-scaleIn">
            <h3 className="text-xl font-bold mb-1">Apply for {applyModalData.opening.title}</h3>
            <p className="text-xs text-purple-400 mb-4">{applyModalData.company.name}</p>

            {applySuccess ? (
              <div className="p-6 text-center space-y-3">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
                <h4 className="text-lg font-bold text-white">Application Submitted!</h4>
                <p className="text-xs text-slate-400">The recruiter has received your application and work portfolio link.</p>
              </div>
            ) : (
              <form onSubmit={handleApply} className="space-y-4">
                {applyError && (
                  <div className="p-3 bg-red-950/80 border border-red-500/30 text-red-400 text-xs rounded-xl">
                    {applyError}
                  </div>
                )}

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5 uppercase tracking-wider">
                    Portfolio / Work Link *
                  </label>
                  <input
                    type="url"
                    required
                    value={applyForm.portfolioUrl}
                    onChange={(e) => setApplyForm({ ...applyForm, portfolioUrl: e.target.value })}
                    placeholder="https://behance.net/yourprofile or https://github.com/..."
                    className="w-full bg-slate-800 border border-white/10 rounded-xl p-3 text-sm text-white placeholder-slate-500 outline-none focus:border-purple-500"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Link to your portfolio, Behance, GitHub, IMDb, YouTube reel, or Google Drive.
                  </span>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5 uppercase tracking-wider">
                    Cover Note / Pitch (Optional)
                  </label>
                  <textarea
                    rows={4}
                    value={applyForm.requirements}
                    onChange={(e) => setApplyForm({ ...applyForm, requirements: e.target.value })}
                    placeholder="Briefly introduce yourself and explain why you're a fit for this role..."
                    className="w-full bg-slate-800 border border-white/10 rounded-xl p-3 text-sm text-white placeholder-slate-500 outline-none focus:border-purple-500"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setApplyModalData(null)}
                    className="text-slate-400 hover:text-white"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={applying} className="bg-purple-600 hover:bg-purple-500 text-white font-bold">
                    {applying ? "Submitting..." : "Submit Application"}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

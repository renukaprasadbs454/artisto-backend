import { useEffect, useState, useCallback } from "react";
import { api } from "../services/api";
import { useAuthStore } from "../store/auth";
import { Link, useSearchParams } from "react-router-dom";

export default function Opportunities() {
  const { user } = useAuthStore();
  const [searchParams, setSearchParams] = useSearchParams();

  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [categoryFilter, setCategoryFilter] = useState(searchParams.get("category") || "");
  const [page, setPage] = useState(1);

  const [showListingForm, setShowListingForm] = useState(false);
  const [listingForm, setListingForm] = useState({
    title: "",
    description: "",
    category: "Acting & Voice",
    price: "",
    deliveryDays: "",
  });
  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  const fetchListings = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, any> = { page, limit: 12 };
      const q = searchParams.get("q");
      const category = searchParams.get("category");
      if (q) params.q = q;
      if (category) params.category = category;

      const res = await api.getListings(params);
      setListings(res.data || []);
      setTotal(res.meta?.total || 0);
    } catch (err) {
      console.error("Failed to fetch listings:", err);
    } finally {
      setLoading(false);
    }
  }, [searchParams, page]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  const handleCreateListing = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    try {
      setFormLoading(true);
      const newListing = await api.createListing({
        ...listingForm,
        price: Number(listingForm.price),
        deliveryDays: Number(listingForm.deliveryDays),
      });
      // Prepend to current list
      setListings([newListing, ...listings]);
      setTotal(total + 1);
      setShowListingForm(false);
      setListingForm({
        title: "",
        description: "",
        category: "Acting & Voice",
        price: "",
        deliveryDays: "",
      });
    } catch (err: any) {
      setFormError(err.response?.data?.error?.message || "Failed to create casting call");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteListing = async (id: string) => {
    if (!confirm("Delete this casting call permanently?")) return;
    try {
      await api.deleteListing(id);
      setListings(listings.filter(l => l.id !== id));
      setTotal(Math.max(0, total - 1));
    } catch (err) {
      alert("Failed to delete casting call.");
    }
  };

  // Debounced search
  useEffect(() => {
    const timeout = setTimeout(() => {
      const newParams: Record<string, string> = {};
      if (searchQuery) newParams.q = searchQuery;
      if (categoryFilter) newParams.category = categoryFilter;
      setSearchParams(newParams, { replace: true });
      setPage(1);
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchQuery, categoryFilter, setSearchParams]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchListings();
  };

  const categories = [
    "Direction",
    "Video Editing",
    "Photography",
    "Graphic Design",
    "Music & Audio",
    "Acting & Voice",
  ];

  return (
    <div className="page-container">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8 text-[var(--text-primary)]">
          Explore Casting Calls
        </h1>

        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4 mb-8">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title or description..."
            className="flex-1 p-3 bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] text-[var(--text-primary)] rounded-xl focus:outline-none focus:border-purple-500 shadow-lg"
          />

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="p-3 bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] text-[var(--text-primary)] rounded-xl focus:outline-none focus:border-purple-500 shadow-lg min-w-[200px]"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          <button type="submit" className="bg-purple-600 text-white px-8 py-3 rounded-xl hover:bg-purple-500 font-bold transition shadow-lg shadow-purple-500/20">
            Search
          </button>
        </form>

        <div className="flex justify-between items-center mb-6">
          <p className="text-[var(--text-muted)] font-medium">
            {total > 0 ? `${total} casting calls available` : "Find acting roles and jobs"}
          </p>
          <div className="flex gap-4">
            {user?.role === "SELLER" && (
              <button onClick={() => setShowListingForm(!showListingForm)} className="bg-purple-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-purple-500 shadow-lg shadow-purple-500/20">
                {showListingForm ? "Cancel" : "+ Post Casting Call"}
              </button>
            )}
          </div>
        </div>

        {showListingForm && user?.role === "SELLER" && (
          <div className="bg-[var(--bg-card)] rounded-2xl shadow-lg border border-[var(--border-secondary)] p-6 mb-8 backdrop-blur-md">
            <h3 className="font-bold mb-4 text-lg text-[var(--text-primary)]">Post New Casting Call</h3>
            {formError && <p className="text-red-400 text-sm mb-4 bg-red-900/30 border border-red-500/30 p-3 rounded-md">{formError}</p>}
            
            <form onSubmit={handleCreateListing} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-[var(--text-secondary)] mb-1">Title</label>
                <input type="text" required value={listingForm.title} onChange={e => setListingForm({...listingForm, title: e.target.value})} className="w-full p-2.5 bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] text-[var(--text-primary)] rounded-md focus:outline-none focus:border-purple-500" placeholder="e.g. Lead Actor for Short Film" />
              </div>
              <div>
                <label className="block text-sm font-bold text-[var(--text-secondary)] mb-1">Category</label>
                <select required value={listingForm.category} onChange={e => setListingForm({...listingForm, category: e.target.value})} className="w-full p-2.5 bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] text-[var(--text-primary)] rounded-md focus:outline-none focus:border-purple-500">
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-[var(--text-secondary)] mb-1">Price / Budget ($)</label>
                  <input type="number" required min="1" value={listingForm.price} onChange={e => setListingForm({...listingForm, price: e.target.value})} className="w-full p-2.5 bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] text-[var(--text-primary)] rounded-md focus:outline-none focus:border-purple-500" placeholder="500" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-[var(--text-secondary)] mb-1">Duration (Days)</label>
                  <input type="number" required min="1" value={listingForm.deliveryDays} onChange={e => setListingForm({...listingForm, deliveryDays: e.target.value})} className="w-full p-2.5 bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] text-[var(--text-primary)] rounded-md focus:outline-none focus:border-purple-500" placeholder="10" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-[var(--text-secondary)] mb-1">Description</label>
                <textarea required rows={3} value={listingForm.description} onChange={e => setListingForm({...listingForm, description: e.target.value})} className="w-full p-2.5 bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] text-[var(--text-primary)] rounded-md resize-none focus:outline-none focus:border-purple-500" placeholder="Describe the role..."></textarea>
              </div>
              <button type="submit" disabled={formLoading} className="w-full bg-purple-600 text-white font-bold p-3 rounded-md hover:bg-purple-500 disabled:opacity-50 transition shadow-lg shadow-purple-500/20">
                {formLoading ? "Publishing..." : "Publish Casting Call"}
              </button>
            </form>
          </div>
        )}

        {/* Results */}
        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block w-10 h-10 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mb-4" />
            <p className="text-gray-500 font-medium">Searching marketplace...</p>
          </div>
        ) : listings.length === 0 ? (
          <div className="bg-[var(--bg-card)] border border-[var(--border-secondary)] rounded-2xl shadow-lg p-12 text-center backdrop-blur-md">
            <div className="text-5xl mb-4">🔍</div>
            <h3 className="text-xl font-bold mb-2 text-[var(--text-primary)]">No casting calls found</h3>
            <p className="text-[var(--text-muted)] mb-6">Try adjusting your search or filters to find what you're looking for.</p>
            {user?.role === "SELLER" && (
              <button onClick={() => setShowListingForm(true)} className="bg-purple-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-purple-500 transition shadow-lg shadow-purple-500/20 inline-block">
                Post the First Casting Call
              </button>
            )}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {listings.map((item) => (
              <div key={item.id} className="bg-[var(--bg-card)] border border-[var(--border-secondary)] rounded-2xl shadow-lg overflow-hidden hover:-translate-y-1 transition duration-300 flex flex-col group backdrop-blur-md">
                <Link to={`/opportunities/${item.id}`} className="p-6 flex-1 block">
                  <div className="flex justify-between items-start mb-4">
                    <span className="bg-purple-500/20 text-purple-300 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                      {item.category}
                    </span>
                    <span className="font-bold text-green-400 bg-green-500/10 px-3 py-1 rounded-full">${item.price}</span>
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-[var(--text-primary)] group-hover:text-purple-400 transition">{item.title}</h3>
                  <p className="text-[var(--text-secondary)] line-clamp-2 text-sm leading-relaxed mb-4">{item.description}</p>
                </Link>
                
                <div className="border-t border-[var(--border-secondary)] p-4 flex items-center justify-between bg-[var(--bg-glass)]">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold text-xs">
                      {item.seller?.profile?.displayName?.[0]?.toUpperCase() || "R"}
                    </div>
                    <span className="text-sm font-medium text-[var(--text-secondary)]">
                      {item.seller?.profile?.displayName || "Recruiter"}
                    </span>
                  </div>
                  {user?.id === item.sellerId && (
                    <button onClick={(e) => { e.preventDefault(); handleDeleteListing(item.id); }} className="text-red-400 hover:bg-red-500/20 p-2 rounded-full transition" title="Delete Casting Call">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
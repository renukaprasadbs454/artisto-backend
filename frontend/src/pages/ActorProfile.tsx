import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { api, type ActorProfile } from '../services/api';
import { useAuthStore } from '../store/auth';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Film, MapPin, Briefcase, Search, Plus, Trash2, CheckCircle2, Clock, PlayCircle } from 'lucide-react';
import axios from 'axios';

export default function ActorProfilePage() {
  const { username } = useParams<{ username: string }>();
  const { user: authUser } = useAuthStore();
  
  const [profile, setProfile] = useState<ActorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [activeTab, setActiveTab] = useState("credits"); // "credits", "overview"

  // Edit states
  const [showAddCredit, setShowAddCredit] = useState(false);
  const [creditForm, setCreditForm] = useState({
    tmdbMovieId: '',
    title: '',
    releaseYear: '',
    posterUrl: '',
    roleName: '',
  });
  
  // TMDB Search States
  const [tmdbQuery, setTmdbQuery] = useState('');
  const [tmdbResults, setTmdbResults] = useState<any[]>([]);
  const [searchingTmdb, setSearchingTmdb] = useState(false);
  
  const [submittingCredit, setSubmittingCredit] = useState(false);
  const [savingStatus, setSavingStatus] = useState(false);

  const isOwnProfile = !username || (authUser?.username === username);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      let data;
      if (username) {
        data = await api.getActorProfileByUsername(username);
      } else if (authUser?.id) {
        data = await api.getActorProfile(authUser.id);
      } else {
        setError('No user provided and not logged in.');
        return;
      }
      setProfile(data);
    } catch (err: any) {
      if (err.response?.status === 404 && isOwnProfile) {
        try {
          const newData = await api.upsertActorProfile({ availabilityStatus: 'AVAILABLE' });
          setProfile(newData);
        } catch (createErr) {
          setError('Failed to initialize actor profile.');
        }
      } else {
        setError(err.response?.data?.error?.message || 'Actor profile not found');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [username, authUser?.id]);

  const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (!isOwnProfile) return;
    try {
      setSavingStatus(true);
      const newStatus = e.target.value as 'AVAILABLE' | 'BUSY' | 'NOT_LOOKING';
      const updated = await api.upsertActorProfile({ availabilityStatus: newStatus });
      setProfile(updated);
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to update status');
    } finally {
      setSavingStatus(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (tmdbQuery.length < 3) {
        setTmdbResults([]);
        return;
      }
      
      const apiKey = import.meta.env.VITE_TMDB_API_KEY;
      if (!apiKey) {
        console.warn('VITE_TMDB_API_KEY is not set. TMDB search is disabled.');
        return;
      }
      
      try {
        setSearchingTmdb(true);
        const res = await axios.get(`https://api.themoviedb.org/3/search/movie`, {
          params: {
            api_key: apiKey,
            query: tmdbQuery,
            include_adult: false,
          }
        });
        setTmdbResults(res.data.results.slice(0, 5));
      } catch (err) {
        console.error('TMDB search failed', err);
      } finally {
        setSearchingTmdb(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [tmdbQuery]);

  const selectTmdbMovie = (movie: any) => {
    setCreditForm({
      ...creditForm,
      tmdbMovieId: movie.id.toString(),
      title: movie.title,
      releaseYear: movie.release_date ? movie.release_date.split('-')[0] : '',
      posterUrl: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : '',
    });
    setTmdbQuery('');
    setTmdbResults([]);
  };

  const handleAddCredit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmittingCredit(true);
      const payload = {
        tmdbMovieId: parseInt(creditForm.tmdbMovieId) || 0,
        title: creditForm.title,
        releaseYear: parseInt(creditForm.releaseYear) || undefined,
        posterUrl: creditForm.posterUrl || undefined,
        roleName: creditForm.roleName,
      };
      const credit = await api.addFilmCredit(payload);
      if (profile) {
        setProfile({
          ...profile,
          filmCredits: [credit, ...profile.filmCredits],
        });
      }
      setCreditForm({ tmdbMovieId: '', title: '', releaseYear: '', posterUrl: '', roleName: '' });
      setShowAddCredit(false);
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to add credit');
    } finally {
      setSubmittingCredit(false);
    }
  };

  const handleDeleteCredit = async (creditId: string) => {
    if (!confirm('Are you sure you want to remove this credit?')) return;
    try {
      await api.deleteFilmCredit(creditId);
      if (profile) {
        setProfile({
          ...profile,
          filmCredits: profile.filmCredits.filter(c => c.id !== creditId),
        });
      }
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to delete credit');
    }
  };

  const tabs = [
    { id: "credits", label: "Film Credits" },
    { id: "overview", label: "Overview" },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="text-center p-8 bg-white border border-slate-200 rounded-2xl max-w-md w-full shadow-sm">
          <div className="text-4xl mb-4 text-slate-300">🎭</div>
          <h3 className="text-xl font-semibold text-slate-900 mb-2">Profile Unavailable</h3>
          <p className="text-slate-500">{error}</p>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      {/* Profile Header Banner */}
      <div className="h-48 md:h-64 bg-gradient-to-r from-blue-100 to-indigo-100 relative">
        <div className="absolute inset-0 bg-white/30 backdrop-blur-sm"></div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 relative -mt-24">
        
        {/* Profile Card */}
        <Card className="bg-white border-slate-200 shadow-md">
          <CardContent className="p-6 md:p-8 flex flex-col md:flex-row gap-6 md:items-end">
            <div className="relative shrink-0 group">
              <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-white bg-gradient-to-tr from-blue-100 to-indigo-200 shadow-md flex items-center justify-center text-4xl font-bold text-blue-700 overflow-hidden">
                {profile.user.profile?.avatarUrl ? (
                  <img src={profile.user.profile.avatarUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  profile.user.profile?.displayName?.[0] || '?'
                )}
              </div>
            </div>
            
            <div className="flex-1 space-y-2">
              <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                <div>
                  <h1 className="text-3xl font-extrabold text-slate-900">
                    {profile.user.profile?.displayName || 'Unknown Actor'}
                  </h1>
                  <p className="text-lg text-blue-600 font-medium mb-3">
                    {profile.user.profile?.headline || 'Professional Actor'}
                  </p>
                  <Button variant="secondary" size="sm" onClick={async () => {
                    const targetUsername = profile.user.username;
                    if (!targetUsername) return;
                    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1';
                    const url = `${baseUrl}/share/actor/${targetUsername}`;
                    if (navigator.share) {
                      try { await navigator.share({ title: `${profile.user.profile?.displayName || targetUsername}'s Profile`, text: "Check out my Artisto actor profile!", url }); } catch (err) {}
                    } else {
                      await navigator.clipboard.writeText(url);
                      alert("Actor profile link copied!");
                    }
                  }}>
                    Share Actor Profile
                  </Button>
                </div>
              </div>
              
              <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 pt-2">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4" />
                  {profile.user.profile?.location || 'Unknown Location'}
                </div>
                
                <div className="flex items-center gap-2">
                  <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase
                    ${profile.availabilityStatus === 'AVAILABLE' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 
                      profile.availabilityStatus === 'BUSY' ? 'bg-amber-50 text-amber-600 border border-amber-200' : 
                      'bg-slate-100 text-slate-500 border border-slate-200'}`}
                  >
                    {profile.availabilityStatus === 'AVAILABLE' && <CheckCircle2 className="w-3.5 h-3.5" />}
                    {profile.availabilityStatus === 'BUSY' && <Clock className="w-3.5 h-3.5" />}
                    {profile.availabilityStatus.replace('_', ' ')}
                  </div>
                  
                  {isOwnProfile && (
                    <select 
                      className="bg-white border border-slate-200 rounded-md text-xs py-1.5 px-2 text-slate-700 focus:ring-1 focus:ring-blue-500 outline-none shadow-sm cursor-pointer"
                      value={profile.availabilityStatus}
                      onChange={handleStatusChange}
                      disabled={savingStatus}
                    >
                      <option value="AVAILABLE">Set Available</option>
                      <option value="BUSY">Set Busy</option>
                      <option value="NOT_LOOKING">Set Not Looking</option>
                    </select>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Custom Tabs */}
        <div className="flex gap-8 mt-8 border-b border-slate-200 overflow-x-auto hide-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative pb-4 text-sm font-semibold transition-colors whitespace-nowrap ${
                activeTab === tab.id ? "text-blue-700" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <motion.div
                  layoutId="activeTabActor"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"
                />
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="py-8">
          <AnimatePresence mode="wait">
            
            {/* CREDITS TAB */}
            {activeTab === "credits" && (
              <motion.div
                key="credits"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                    <PlayCircle className="w-6 h-6 text-blue-600" />
                    Film & TV Credits
                  </h2>
                  {isOwnProfile && (
                    <Button 
                      onClick={() => setShowAddCredit(!showAddCredit)}
                      variant={showAddCredit ? "outline" : "default"}
                    >
                      {showAddCredit ? 'Cancel' : <><Plus className="w-4 h-4 mr-1" /> Add Credit</>}
                    </Button>
                  )}
                </div>

                <AnimatePresence>
                  {showAddCredit && isOwnProfile && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <Card className="bg-white border-slate-200 shadow-sm mb-6">
                        <CardContent className="p-6">
                          <div className="mb-6">
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Search TMDB (Movie Database)</label>
                            <div className="relative">
                              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                              <Input 
                                placeholder="Type a movie name to auto-fill..." 
                                className="pl-10"
                                value={tmdbQuery}
                                onChange={(e) => setTmdbQuery(e.target.value)}
                              />
                              {searchingTmdb && (
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                              )}
                              
                              {tmdbResults.length > 0 && (
                                <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl overflow-hidden">
                                  {tmdbResults.map(movie => (
                                    <button
                                      key={movie.id}
                                      type="button"
                                      className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center gap-3 border-b border-slate-100 last:border-0 transition-colors"
                                      onClick={() => selectTmdbMovie(movie)}
                                    >
                                      {movie.poster_path ? (
                                        <img src={`https://image.tmdb.org/t/p/w92${movie.poster_path}`} alt="" className="w-8 h-12 object-cover rounded shadow-sm" />
                                      ) : (
                                        <div className="w-8 h-12 bg-slate-100 rounded flex items-center justify-center border border-slate-200">
                                          <Film className="w-4 h-4 text-slate-400" />
                                        </div>
                                      )}
                                      <div>
                                        <div className="font-medium text-slate-900">{movie.title}</div>
                                        <div className="text-xs text-slate-500">{movie.release_date?.split('-')[0]}</div>
                                      </div>
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>

                          <form onSubmit={handleAddCredit}>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                              <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Role Name *</label>
                                <Input required value={creditForm.roleName} onChange={e => setCreditForm({...creditForm, roleName: e.target.value})} placeholder="e.g. Lead, Supporting, Extra" />
                              </div>
                              <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Title *</label>
                                <Input required value={creditForm.title} onChange={e => setCreditForm({...creditForm, title: e.target.value})} />
                              </div>
                              <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Release Year</label>
                                <Input type="number" value={creditForm.releaseYear} onChange={e => setCreditForm({...creditForm, releaseYear: e.target.value})} />
                              </div>
                              <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">TMDB Movie ID</label>
                                <Input type="number" value={creditForm.tmdbMovieId} onChange={e => setCreditForm({...creditForm, tmdbMovieId: e.target.value})} />
                              </div>
                              <div className="space-y-2 sm:col-span-2">
                                <label className="text-sm font-semibold text-slate-700">Poster URL</label>
                                <Input type="url" value={creditForm.posterUrl} onChange={e => setCreditForm({...creditForm, posterUrl: e.target.value})} />
                              </div>
                            </div>
                            <div className="flex justify-end">
                              <Button type="submit" disabled={submittingCredit}>
                                {submittingCredit ? 'Saving...' : 'Save Credit'}
                              </Button>
                            </div>
                          </form>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )}
                </AnimatePresence>

                {profile.filmCredits.length === 0 ? (
                  <div className="text-center py-20 border border-dashed border-slate-300 rounded-2xl bg-white">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-200 text-slate-400">
                      <Film className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2 text-slate-900">No credits yet</h3>
                    <p className="text-slate-500">Film and TV roles will appear here.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    <AnimatePresence>
                      {profile.filmCredits.map(credit => (
                        <motion.div 
                          key={credit.id}
                          layout
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          className="group relative bg-white rounded-xl border border-slate-200 overflow-hidden hover:border-blue-300 hover:shadow-md transition-all"
                        >
                          <div className="aspect-[2/3] w-full relative bg-slate-100">
                            {credit.posterUrl ? (
                              <img src={credit.posterUrl} alt={credit.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Film className="w-12 h-12 text-slate-300" />
                              </div>
                            )}
                            
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-90 transition-opacity" />
                            
                            <div className="absolute bottom-0 left-0 w-full p-4">
                              <h4 className="font-bold text-white leading-tight mb-1 line-clamp-2">
                                {credit.title}
                              </h4>
                              <div className="text-xs font-semibold text-blue-300 mb-0.5 uppercase tracking-wider">
                                as {credit.roleName}
                              </div>
                              {credit.releaseYear && (
                                <div className="text-xs text-gray-300">
                                  {credit.releaseYear}
                                </div>
                              )}
                            </div>
                            
                            {isOwnProfile && (
                              <button 
                                onClick={() => handleDeleteCredit(credit.id)}
                                className="absolute top-2 right-2 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-slate-600 opacity-0 group-hover:opacity-100 transition-all hover:text-red-500 hover:bg-white shadow-sm z-10"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
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
              >
                <Card className="bg-white border-slate-200 max-w-3xl">
                  <CardContent className="p-6 md:p-8">
                    <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2 mb-4">
                      <Briefcase className="w-5 h-5 text-blue-600" /> Biography
                    </h2>
                    {profile.user.profile?.bio ? (
                      <p className="text-slate-600 leading-relaxed whitespace-pre-line text-[15px]">
                        {profile.user.profile.bio}
                      </p>
                    ) : (
                      <p className="text-slate-400 italic">No biography provided yet.</p>
                    )}
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

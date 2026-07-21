import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { api, type ActorProfile } from '../services/api';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Search, UserCircle, Video } from 'lucide-react';

export default function ActorDiscovery() {
  const [actors, setActors] = useState<ActorProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [location, setLocation] = useState('');

  const fetchActors = async (q = '', loc = '') => {
    try {
      setLoading(true);
      const res = await api.getActors({ q, location: loc });
      setActors(res.data);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to load actors');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActors();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchActors(search, location);
  };

  return (
    <div className="page-container relative">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight mb-2 text-[var(--text-primary)]">Discover Talent</h1>
            <p className="text-[var(--text-secondary)] text-lg">Find the perfect actor for your next production.</p>
          </div>
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row w-full md:w-auto gap-3">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                type="text"
                placeholder="Search by name..."
                className="pl-10 bg-[var(--bg-tertiary)] border-[var(--border-secondary)] text-[var(--text-primary)]"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div className="relative flex-1 md:w-48">
              <Input
                type="text"
                placeholder="Filter by Location..."
                className="bg-[var(--bg-tertiary)] border-[var(--border-secondary)] text-[var(--text-primary)]"
                value={location}
                onChange={e => setLocation(e.target.value)}
              />
            </div>
            <Button type="submit">Search</Button>
          </form>
        </div>

        {error && (
          <div className="p-4 bg-red-50 text-red-600 border border-red-200 rounded-lg">
            {error}
          </div>
        )}

        {/* Content Section */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
          </div>
        ) : actors.length === 0 ? (
          <div className="text-center py-24 border border-dashed border-[var(--border-secondary)] rounded-2xl bg-[var(--bg-card)]">
            <div className="w-16 h-16 bg-[var(--bg-secondary)] rounded-full flex items-center justify-center mx-auto mb-4 text-[var(--text-muted)] border border-[var(--border-secondary)]">
              <UserCircle className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-[var(--text-primary)]">No actors found</h3>
            <p className="text-[var(--text-secondary)]">Try adjusting your search criteria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {actors.map((actor, index) => (
              <motion.div 
                key={actor.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <Link to={`/actor/u/${actor.user.username}`}>
                  <Card className="h-full hover:border-purple-300 hover:shadow-md transition-all group bg-white border-slate-200">
                    <CardHeader className="pb-4 border-b border-slate-100">
                      <div className="flex items-start gap-4">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center text-xl font-bold text-purple-700 overflow-hidden shrink-0 shadow-sm border border-slate-200">
                          {actor.user.profile?.avatarUrl ? (
                            <img src={actor.user.profile.avatarUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            actor.user.profile?.displayName?.[0]?.toUpperCase() || '?'
                          )}
                        </div>
                        <div className="min-w-0">
                          <CardTitle className="text-lg text-slate-900 group-hover:text-purple-600 transition-colors truncate">
                            {actor.user.profile?.displayName || 'Unknown'}
                          </CardTitle>
                          <CardDescription className="truncate mt-1 text-slate-500">
                            {actor.user.profile?.headline || 'Actor'}
                          </CardDescription>
                          
                          <div className="mt-2">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold
                              ${actor.availabilityStatus === 'AVAILABLE' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 
                                actor.availabilityStatus === 'BUSY' ? 'bg-amber-50 text-amber-600 border border-amber-200' : 
                                'bg-slate-100 text-slate-600 border border-slate-200'}`}
                            >
                              {actor.availabilityStatus.replace('_', ' ')}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="pt-4">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                        <Video className="w-3.5 h-3.5" /> Top Credits
                      </h4>
                      {actor.filmCredits.length > 0 ? (
                        <ul className="space-y-2">
                          {actor.filmCredits.slice(0, 3).map(credit => (
                            <li key={credit.id} className="flex justify-between items-center text-sm">
                              <span className="font-medium text-slate-700 truncate pr-2">
                                {credit.title}
                              </span>
                              <span className="text-slate-500 text-xs shrink-0 bg-slate-100 px-2 py-0.5 rounded-full font-medium">
                                {credit.releaseYear || ''}
                              </span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div className="text-sm text-slate-400 italic py-2">No credits added</div>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

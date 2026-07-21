import { useState, useEffect } from "react";
import { Link, Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import { api } from "../services/api";
import { useAuthStore } from "../store/auth";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "../components/ui/card";
import { Search, ShieldCheck, Star, ArrowRight, CheckCircle2 } from "lucide-react";

export default function Home() {
  const [featuredListings, setFeaturedListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const res = await api.getListings({ limit: 6 });
        setFeaturedListings(res.data);
      } catch (err) {
        console.error("Failed to load featured listings:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchFeatured();
  }, []);

  if (user) {
    return <Navigate to="/feed" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 overflow-hidden relative">
      {/* Background glow effects (Light mode friendly) */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-purple-200/50 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-200/50 rounded-full blur-[120px] pointer-events-none" />

      {/* Hero Section */}
      <section className="relative flex flex-col items-center justify-center min-h-[90vh] px-6 text-center">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-4xl mx-auto space-y-8"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 text-sm font-medium text-purple-700 shadow-sm">
            <Star className="w-4 h-4 text-purple-500 fill-purple-500" />
            The Premier Talent Platform
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900">
            Find & Hire <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600">Verified Talent</span>
          </h1>
          
          <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Connect with top-tier professionals in film, design, and media. 
            Rigorous portfolio checks and authentic credentials guarantee quality.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Button size="lg" asChild className="w-full sm:w-auto h-14 px-8 text-lg rounded-full">
              <Link to="/opportunities">
                Explore Talent <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="w-full sm:w-auto h-14 px-8 text-lg rounded-full border-slate-300">
              <Link to="/register">
                Join as Professional
              </Link>
            </Button>
          </div>
        </motion.div>
      </section>

      {/* Trust & Authority Section */}
      <section className="py-24 px-6 relative bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900">Industry Standard Excellence</h2>
            <p className="text-slate-500 text-lg">Trusted by creative agencies and production houses worldwide</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div whileHover={{ y: -5 }} transition={{ duration: 0.2 }}>
              <Card className="h-full hover:border-purple-300 hover:shadow-md transition-all">
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center mb-4 text-purple-600">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <CardTitle className="text-xl text-slate-900">Verified Credentials</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base text-slate-600">
                    Every professional is vetted. We verify portfolios, identity, and past industry experience to ensure you work with experts.
                  </CardDescription>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div whileHover={{ y: -5 }} transition={{ duration: 0.2 }}>
              <Card className="h-full hover:border-blue-300 hover:shadow-md transition-all">
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center mb-4 text-blue-600">
                    <Search className="w-6 h-6" />
                  </div>
                  <CardTitle className="text-xl text-slate-900">Precision Discovery</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base text-slate-600">
                    Find the exact skill set you need with advanced filtering. Browse curated portfolios before initiating contact.
                  </CardDescription>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div whileHover={{ y: -5 }} transition={{ duration: 0.2 }}>
              <Card className="h-full hover:border-pink-300 hover:shadow-md transition-all">
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-pink-100 flex items-center justify-center mb-4 text-pink-600">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <CardTitle className="text-xl text-slate-900">Secure Contracts</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base text-slate-600">
                    Milestone-based payments and clear contracts protect both buyers and sellers, guaranteeing project delivery.
                  </CardDescription>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Featured Listings Section */}
      <section className="py-24 px-6 relative bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-slate-900">Featured Opportunities</h2>
              <p className="text-slate-600">Discover top-rated services from our community.</p>
            </div>
            <Button variant="link" asChild className="hidden sm:inline-flex text-purple-600">
              <Link to="/opportunities">View all opportunities →</Link>
            </Button>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-10 h-10 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
            </div>
          ) : featuredListings.length === 0 ? (
            <div className="text-center py-20 border border-dashed border-slate-300 rounded-2xl bg-white">
              <div className="text-4xl mb-4">🎬</div>
              <h3 className="text-xl font-semibold mb-2 text-slate-900">No opportunities yet</h3>
              <p className="text-slate-500 mb-6">Be the first to create a listing and get discovered!</p>
              <Button asChild><Link to="/register">Get Started</Link></Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredListings.map((listing) => (
                <Link to={`/opportunities/${listing.id}`} key={listing.id}>
                  <motion.div whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
                    <Card className="h-full hover:border-purple-300 transition-all group overflow-hidden shadow-sm hover:shadow-md">
                      <CardHeader className="pb-4">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-xs font-semibold uppercase tracking-wider text-purple-700 bg-purple-100 px-2.5 py-1 rounded-full">
                            {listing.category}
                          </span>
                          <span className="text-lg font-bold text-slate-900">${listing.price}</span>
                        </div>
                        <CardTitle className="text-xl group-hover:text-purple-600 transition-colors text-slate-900">{listing.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <CardDescription className="line-clamp-2 text-sm text-slate-600">{listing.description}</CardDescription>
                      </CardContent>
                      <CardFooter className="pt-4 border-t border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-100 to-blue-100 flex items-center justify-center text-xs font-bold overflow-hidden border border-slate-200 text-purple-700">
                            {listing.seller?.profile?.avatarUrl ? (
                              <img src={listing.seller.profile.avatarUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                              listing.seller?.profile?.displayName?.[0]?.toUpperCase() || "S"
                            )}
                          </div>
                          <span className="text-sm font-medium text-slate-700">{listing.seller?.profile?.displayName || "Artist"}</span>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-purple-600 transition-colors" />
                      </CardFooter>
                    </Card>
                  </motion.div>
                </Link>
              ))}
            </div>
          )}
          
          <div className="mt-8 text-center sm:hidden">
            <Button variant="outline" asChild className="w-full">
              <Link to="/opportunities">View all opportunities</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-blue-600">
            Artisto
          </div>
          <p className="text-slate-500 text-sm text-center md:text-left">
            Connecting creative professionals with top-tier opportunities.
          </p>
          <div className="flex gap-4 text-sm text-slate-500">
            <span>📧 support@artisto.com</span>
            <span>📍 Bangalore, India</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

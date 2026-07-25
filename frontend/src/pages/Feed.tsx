import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { api, type Post, type PostComment } from '../services/api';
import { useAuthStore } from '../store/auth';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardFooter } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Heart, MessageCircle, Image as ImageIcon, Send } from 'lucide-react';

export default function Feed() {
  const { user } = useAuthStore();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // New post state
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostImage, setNewPostImage] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Comments state
  const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null);
  const [comments, setComments] = useState<Record<string, PostComment[]>>({});
  const [newCommentContent, setNewCommentContent] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const fetchedPosts = await api.getPosts();
      setPosts(fetchedPosts);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to load feed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostContent.trim()) return;

    try {
      setSubmitting(true);
      const post = await api.createPost({
        content: newPostContent,
        image: newPostImage || undefined,
      });
      setPosts([post, ...posts]);
      setNewPostContent('');
      setNewPostImage(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to create post');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleLike = async (postId: string) => {
    try {
      const { liked } = await api.toggleLike(postId);
      setPosts(posts.map(p => {
        if (p.id === postId) {
          const countDiff = liked ? 1 : -1;
          return {
            ...p,
            likedByMe: liked,
            _count: { ...p._count, likes: Math.max(0, p._count.likes + countDiff) }
          };
        }
        return p;
      }));
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to toggle like');
    }
  };

  const toggleComments = async (postId: string) => {
    if (activeCommentPostId === postId) {
      setActiveCommentPostId(null);
      return;
    }
    setActiveCommentPostId(postId);
    if (!comments[postId]) {
      try {
        const fetchedComments = await api.getPostComments(postId);
        setComments(prev => ({ ...prev, [postId]: fetchedComments }));
      } catch (err: any) {
        alert(err.response?.data?.error?.message || 'Failed to load comments');
      }
    }
  };

  const handleAddComment = async (e: React.FormEvent, postId: string) => {
    e.preventDefault();
    if (!newCommentContent.trim()) return;

    try {
      setSubmittingComment(true);
      const comment = await api.addPostComment(postId, newCommentContent);
      setComments(prev => ({
        ...prev,
        [postId]: [...(prev[postId] || []), comment],
      }));
      setPosts(posts.map(p => p.id === postId ? {
          ...p,
          _count: { ...p._count, comments: p._count.comments + 1 }
      } : p));
      setNewCommentContent('');
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to add comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-slate-100 p-4 sm:p-6 relative">
      <div className="max-w-xl mx-auto space-y-5">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-black text-white">Community Feed</h1>
          <span className="text-xs text-slate-400 font-medium">Live Updates</span>
        </div>

        {/* Create Post */}
        <Card className="border-white/10 bg-slate-900/80 shadow-xl rounded-2xl backdrop-blur-xl">
          <CardContent className="p-4 sm:p-5">
            <form onSubmit={handleCreatePost}>
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-sm font-bold text-white overflow-hidden shrink-0 border border-white/10">
                  {user?.profile?.avatarUrl ? (
                    <img src={user.profile.avatarUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    user?.profile?.displayName?.[0] || '?'
                  )}
                </div>
                <div className="flex-1 space-y-3">
                  <textarea
                    value={newPostContent}
                    onChange={e => setNewPostContent(e.target.value)}
                    placeholder="Share an update or creative project..."
                    className="w-full bg-transparent border-0 focus:ring-0 resize-none text-sm placeholder:text-slate-500 text-white min-h-[70px] outline-none"
                  />
                  {newPostImage && (
                    <div className="text-xs text-purple-300 bg-purple-950/60 px-3 py-1 rounded-full inline-flex items-center gap-1.5 border border-purple-500/30 font-medium">
                      <ImageIcon className="w-3.5 h-3.5" /> {newPostImage.name}
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-2.5 border-t border-white/10">
                    <input
                      type="file"
                      accept="image/*"
                      ref={fileInputRef}
                      className="hidden"
                      onChange={e => setNewPostImage(e.target.files?.[0] || null)}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-slate-400 hover:text-purple-300 hover:bg-white/5 text-xs"
                    >
                      <ImageIcon className="w-4 h-4 mr-1.5 text-purple-400" /> Attach Media
                    </Button>
                    <Button
                      type="submit"
                      size="sm"
                      disabled={!newPostContent.trim() || submitting}
                      className="rounded-full px-5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md shadow-purple-500/20"
                    >
                      {submitting ? 'Posting...' : 'Post'}
                    </Button>
                  </div>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Error */}
        {error && (
          <div className="p-3 bg-red-950/60 border border-red-500/30 text-red-400 rounded-xl text-xs">
            {error}
          </div>
        )}

        {/* Posts */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-3 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-white/10 rounded-2xl text-slate-400 bg-slate-900/40 text-sm">
             No posts yet. Be the first to share something!
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {posts.map((post, index) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: index * 0.04 }}
                >
                  <Card className="border-white/10 bg-slate-900/60 shadow-lg rounded-2xl overflow-hidden hover:border-white/20 transition-all backdrop-blur-md">
                    <CardHeader className="flex flex-row items-center gap-3 p-4 pb-2">
                      <Link 
                        to={post.author.username ? `/u/${post.author.username}` : '#'} 
                        className="flex items-center gap-3 group cursor-pointer"
                      >
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-sm font-bold text-white overflow-hidden shrink-0 border border-white/10 group-hover:ring-2 group-hover:ring-purple-500 transition-all">
                          {post.author.profile?.avatarUrl ? (
                            <img src={post.author.profile.avatarUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            post.author.profile?.displayName?.[0] || '?'
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-white text-sm group-hover:text-purple-400 transition-colors flex items-center gap-1.5">
                            <span>{post.author.profile?.displayName || 'Unknown'}</span>
                            {post.author.username && (
                              <span className="text-xs text-purple-400 font-medium">@{post.author.username}</span>
                            )}
                          </div>
                          <div className="text-[11px] font-medium text-slate-400">
                            {new Date(post.createdAt).toLocaleDateString()} at {new Date(post.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </Link>
                    </CardHeader>

                    <CardContent className="px-4 py-2">
                      <div className="whitespace-pre-wrap text-sm leading-relaxed text-slate-200">
                        {post.content}
                      </div>

                      {post.imageUrl && (
                        <div className="mt-3 -mx-4">
                          <img src={post.imageUrl} alt="Post attachment" className="w-full max-h-[420px] object-cover bg-slate-950" />
                        </div>
                      )}
                    </CardContent>

                    <CardFooter className="flex gap-4 border-t border-white/5 px-4 py-2.5">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleLike(post.id)}
                        className={`gap-1.5 rounded-full text-xs ${post.likedByMe ? 'text-pink-400 hover:text-pink-300 hover:bg-pink-950/40' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                      >
                        <Heart className={`w-4 h-4 ${post.likedByMe ? 'fill-current' : ''}`} /> 
                        <span className="font-semibold">{post._count.likes}</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleComments(post.id)}
                        className="gap-1.5 text-slate-400 hover:text-purple-300 hover:bg-white/5 rounded-full text-xs"
                      >
                        <MessageCircle className="w-4 h-4" />
                        <span className="font-semibold">{post._count.comments}</span>
                      </Button>
                    </CardFooter>

                    {/* Comments Section */}
                    <AnimatePresence>
                      {activeCommentPostId === post.id && (
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="bg-slate-950/60 border-t border-white/5 overflow-hidden"
                        >
                          <div className="p-4 space-y-3">
                            {comments[post.id]?.map(comment => (
                              <div key={comment.id} className="flex gap-2.5">
                                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-[10px] font-bold text-white overflow-hidden shrink-0 border border-white/10">
                                  {comment.user.profile?.avatarUrl ? (
                                    <img src={comment.user.profile.avatarUrl} alt="" className="w-full h-full object-cover" />
                                  ) : (
                                    comment.user.profile?.displayName?.[0] || '?'
                                  )}
                                </div>
                                <div className="bg-slate-900/90 border border-white/10 px-3.5 py-2 rounded-xl rounded-tl-none flex-1 shadow-sm">
                                  <div className="font-bold text-xs mb-0.5 text-white">
                                    {comment.user.profile?.displayName || 'Unknown'}
                                  </div>
                                  <div className="text-xs text-slate-300">{comment.content}</div>
                                </div>
                              </div>
                            ))}

                            <form onSubmit={e => handleAddComment(e, post.id)} className="flex gap-2 pt-2">
                              <Input
                                type="text"
                                value={newCommentContent}
                                onChange={e => setNewCommentContent(e.target.value)}
                                placeholder="Write a comment..."
                                className="flex-1 rounded-full bg-slate-900 border-white/10 focus-visible:ring-purple-500 text-xs text-white placeholder:text-slate-500"
                              />
                              <Button type="submit" size="icon" disabled={!newCommentContent.trim() || submittingComment} className="rounded-full shrink-0 h-8 w-8 bg-purple-600 hover:bg-purple-500 text-white">
                                <Send className="w-3.5 h-3.5" />
                              </Button>
                            </form>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}

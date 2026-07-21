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
    <div className="min-h-screen bg-slate-50 text-slate-900 p-6 relative">
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-3xl font-extrabold text-slate-900 mb-6">Feed</h1>

        {/* Create Post */}
        <Card className="border-slate-200 bg-white shadow-sm">
          <CardContent className="pt-6">
            <form onSubmit={handleCreatePost}>
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center text-lg font-bold text-purple-700 overflow-hidden shrink-0 border border-slate-200">
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
                    placeholder="What's on your mind?"
                    className="w-full bg-transparent border-0 focus:ring-0 resize-none text-lg placeholder:text-slate-400 text-slate-900 min-h-[80px] outline-none"
                  />
                  {newPostImage && (
                    <div className="text-sm text-purple-700 bg-purple-50 px-3 py-1.5 rounded-full inline-flex items-center gap-2 border border-purple-100 font-medium">
                      <ImageIcon className="w-4 h-4" /> {newPostImage.name}
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-3 border-t border-slate-100">
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
                      className="text-slate-500 hover:text-purple-600 hover:bg-purple-50"
                    >
                      <ImageIcon className="w-5 h-5 mr-2" /> Attach Image
                    </Button>
                    <Button
                      type="submit"
                      disabled={!newPostContent.trim() || submitting}
                      className="rounded-full px-6 shadow-sm"
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
          <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg shadow-sm">
            {error}
          </div>
        )}

        {/* Posts */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-slate-300 rounded-2xl text-slate-500 bg-white">
             No posts yet. Be the first to share something!
          </div>
        ) : (
          <div className="space-y-6">
            <AnimatePresence>
              {posts.map((post, index) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <Card className="border-slate-200 bg-white shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center gap-4 pb-4">
                      <Link 
                        to={post.author.username ? `/u/${post.author.username}` : '#'} 
                        className="flex items-center gap-4 group cursor-pointer"
                      >
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center text-lg font-bold text-purple-700 overflow-hidden shrink-0 border border-slate-200 group-hover:ring-2 group-hover:ring-purple-500 transition-all">
                          {post.author.profile?.avatarUrl ? (
                            <img src={post.author.profile.avatarUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            post.author.profile?.displayName?.[0] || '?'
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 text-lg group-hover:text-purple-600 transition-colors">
                            {post.author.profile?.displayName || 'Unknown'}
                          </div>
                          <div className="text-sm font-medium text-slate-500">
                            {new Date(post.createdAt).toLocaleDateString()} at {new Date(post.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </Link>
                    </CardHeader>

                    <CardContent className="pb-4">
                      <div className="whitespace-pre-wrap text-[15px] leading-relaxed text-slate-700 mb-4">
                        {post.content}
                      </div>

                      {post.imageUrl && (
                        <div className="mt-4 -mx-6">
                          <img src={post.imageUrl} alt="Post attachment" className="w-full max-h-[500px] object-cover bg-slate-100" />
                        </div>
                      )}
                    </CardContent>

                    <CardFooter className="flex gap-6 border-t border-slate-100 pt-4 pb-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleLike(post.id)}
                        className={`gap-2 rounded-full ${post.likedByMe ? 'text-pink-600 hover:text-pink-700 hover:bg-pink-50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}
                      >
                        <Heart className={`w-5 h-5 ${post.likedByMe ? 'fill-current' : ''}`} /> 
                        <span className="font-semibold">{post._count.likes}</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleComments(post.id)}
                        className="gap-2 text-slate-500 hover:text-purple-600 hover:bg-purple-50 rounded-full"
                      >
                        <MessageCircle className="w-5 h-5" />
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
                          className="bg-slate-50 border-t border-slate-100 overflow-hidden"
                        >
                          <div className="p-6 space-y-4">
                            {comments[post.id]?.map(comment => (
                              <div key={comment.id} className="flex gap-3">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center text-xs font-bold text-purple-700 overflow-hidden shrink-0 border border-slate-200">
                                  {comment.user.profile?.avatarUrl ? (
                                    <img src={comment.user.profile.avatarUrl} alt="" className="w-full h-full object-cover" />
                                  ) : (
                                    comment.user.profile?.displayName?.[0] || '?'
                                  )}
                                </div>
                                <div className="bg-white border border-slate-200 px-4 py-2.5 rounded-2xl rounded-tl-sm flex-1 shadow-sm">
                                  <div className="font-bold text-sm mb-0.5 text-slate-900">
                                    {comment.user.profile?.displayName || 'Unknown'}
                                  </div>
                                  <div className="text-sm text-slate-700">{comment.content}</div>
                                </div>
                              </div>
                            ))}

                            <form onSubmit={e => handleAddComment(e, post.id)} className="flex gap-3 pt-3">
                              <Input
                                type="text"
                                value={newCommentContent}
                                onChange={e => setNewCommentContent(e.target.value)}
                                placeholder="Write a comment..."
                                className="flex-1 rounded-full bg-white border-slate-200 focus-visible:ring-purple-500 shadow-sm"
                              />
                              <Button type="submit" size="icon" disabled={!newCommentContent.trim() || submittingComment} className="rounded-full shrink-0 shadow-sm">
                                <Send className="w-4 h-4" />
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

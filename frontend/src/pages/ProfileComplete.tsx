import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { useAuthStore } from "../store/auth";

export default function ProfileComplete() {
  const { user, setUser } = useAuthStore();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    displayName: user?.profile?.displayName || "",
    bio: user?.profile?.bio || "",
    location: user?.profile?.location || "",
    skills: user?.profile?.skills ? user?.profile?.skills.join(", ") : "",
  });
  const [avatarUrl, setAvatarUrl] = useState<string | null>(user?.profile?.avatarUrl || null);
  
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // If user is already complete, redirect away
  useEffect(() => {
    if (user?.profileComplete) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setSaving(true);
      const data = await api.uploadAvatar(file);
      setAvatarUrl(data.avatarUrl);
      if (user) {
        setUser({ ...user, profile: { ...user.profile, avatarUrl: data.avatarUrl } } as any);
      }
    } catch (err: any) {
      alert(err.response?.data?.error?.message || "Failed to upload avatar");
    } finally {
      setSaving(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!avatarUrl) {
      setError("Please upload a profile photo.");
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const payload = {
        ...formData,
        skills: formData.skills ? formData.skills.split(",").map((s) => s.trim()).filter(Boolean) : [],
      };

      if (!payload.bio || !payload.location || payload.skills.length === 0 || !payload.displayName) {
          setError("All fields are required to complete your profile.");
          setSaving(false);
          return;
      }

      const updatedProfile = await api.updateProfile(payload);
      
      // Update local user state
      if (user) {
        setUser({ 
            ...user, 
            profile: { ...user.profile, ...updatedProfile },
            profileComplete: true
        } as any);
      }

      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error?.message || "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 64px)' }}>
      <div className="profile-section" style={{ maxWidth: 500, width: '100%', margin: 'auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div className="empty-state-icon" style={{ marginBottom: 12 }}>✨</div>
            <h2>Complete Your Profile</h2>
            <p style={{ color: 'var(--text-muted)' }}>You need a complete profile before you can access the marketplace.</p>
        </div>

        {error && <div className="form-error">{error}</div>}

        <form onSubmit={handleSaveProfile}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div className="profile-avatar" style={{ margin: '0 auto 12px' }}>
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" />
              ) : (
                <span style={{opacity: 0.5}}>?</span>
              )}
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleAvatarUpload}
              accept="image/jpeg,image/png,image/webp"
              style={{ display: 'none' }}
            />
            <button type="button" onClick={() => fileInputRef.current?.click()} disabled={saving} className="btn btn-ghost btn-sm">
              {saving ? "Uploading..." : "📷 Upload Photo (Required)"}
            </button>
          </div>

          <div className="form-group">
            <label className="form-label">Display Name *</label>
            <input
              type="text"
              required
              value={formData.displayName}
              onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
              placeholder="Enter your name"
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Location *</label>
            <input
              type="text"
              required
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="e.g. Bangalore, India"
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Skills (comma separated) *</label>
            <input
              type="text"
              required
              value={formData.skills}
              onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
              placeholder="Acting, Editing, Photography..."
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Bio *</label>
            <textarea
              required
              rows={4}
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              placeholder="Tell us about your experience..."
              className="form-textarea"
            ></textarea>
          </div>

          <button type="submit" disabled={saving} className="btn btn-primary" style={{ width: '100%', marginTop: 12 }}>
            {saving ? "Saving..." : "Complete Profile"}
          </button>
        </form>
      </div>
    </div>
  );
}

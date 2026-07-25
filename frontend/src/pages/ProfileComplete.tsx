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
  });
  const [skillsList, setSkillsList] = useState<string[]>(user?.profile?.skills || []);
  const [newSkillInput, setNewSkillInput] = useState("");
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

  const handleAddSkill = () => {
    const trimmed = newSkillInput.trim().replace(/,/g, '');
    if (trimmed && !skillsList.includes(trimmed)) {
      setSkillsList([...skillsList, trimmed]);
      setNewSkillInput("");
    }
  };

  const handleRemoveSkill = (idxToRemove: number) => {
    setSkillsList(skillsList.filter((_, idx) => idx !== idxToRemove));
  };

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
        skills: skillsList,
      };

      if (!payload.bio || !payload.location || payload.skills.length === 0 || !payload.displayName) {
          setError("All fields (including at least 1 skill) are required to complete your profile.");
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
            <label className="form-label">Skills ({skillsList.length}) *</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8, padding: 10, background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', borderRadius: 'var(--radius-md)', minHeight: 44 }}>
              {skillsList.length === 0 ? (
                <span style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>No skills added yet. Add below.</span>
              ) : (
                skillsList.map((skill, idx) => (
                  <span key={idx} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(147, 51, 234, 0.25)', color: '#e9d5ff', border: '1px solid rgba(168, 85, 247, 0.4)', padding: '2px 10px', borderRadius: 9999, fontSize: 12, fontWeight: 600 }}>
                    {skill}
                    <button type="button" onClick={() => handleRemoveSkill(idx)} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontWeight: 'bold' }}>×</button>
                  </span>
                ))
              )}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="text"
                value={newSkillInput}
                onChange={(e) => setNewSkillInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); handleAddSkill(); } }}
                placeholder="Type skill name and press Enter..."
                className="form-input"
                style={{ flex: 1 }}
              />
              <button type="button" onClick={handleAddSkill} className="btn btn-secondary btn-sm">
                + Add
              </button>
            </div>
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

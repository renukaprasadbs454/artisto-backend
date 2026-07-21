import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";

export default function Companies() {
  const [sellers, setSellers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSellersFromListings = async () => {
      try {
        setLoading(true);
        // Fetch listings to extract unique sellers
        const res = await api.getListings({ limit: 50 });

        const uniqueSellers = new Map();
        res.data.forEach((listing: any) => {
          if (listing.seller && !uniqueSellers.has(listing.seller.id)) {
            uniqueSellers.set(listing.seller.id, listing.seller);
          }
        });

        setSellers(Array.from(uniqueSellers.values()));
      } catch (err) {
        console.error("Failed to load creators:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSellersFromListings();
  }, []);

  return (
    <div className="page-container">
      <div style={{ textAlign: 'center', marginBottom: 48 }}>
        <h1 className="page-title" style={{ textAlign: 'center', marginBottom: 8 }}>
          Discover Recruiters
        </h1>
        <p className="page-subtitle" style={{ maxWidth: 500, margin: '0 auto' }}>
          Explore top casting directors, agencies, and recruiters offering their roles on Artisto.
        </p>
      </div>

      {loading ? (
        <div className="empty-state">
          <div className="loading-spinner large" style={{ margin: '0 auto' }}></div>
          <p style={{ marginTop: 16, color: 'var(--text-muted)' }}>Loading recruiters...</p>
        </div>
      ) : sellers.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">👥</div>
          <h3>No recruiters found</h3>
          <p>There are currently no active recruiters on the platform.</p>
          <button 
            onClick={async () => {
              if (!confirm("Are you sure you want to register as a Recruiter?")) return;
              try {
                const { api } = await import("../services/api");
                await api.updateRole("SELLER");
                window.location.reload();
              } catch(err) { alert("Failed to change role"); }
            }}
            className="btn btn-primary"
          >
            Become a Recruiter
          </button>
        </div>
      ) : (
        <div className="creators-grid">
          {sellers.map((seller, index) => (
            <div key={seller.id || index} className="creator-card">
              <div className="creator-avatar">
                {seller.profile?.avatarUrl ? (
                  <img src={seller.profile.avatarUrl} alt="" />
                ) : (
                  seller.profile?.displayName?.[0]?.toUpperCase() || "S"
                )}
              </div>

              <h3>{seller.profile?.displayName || "Anonymous Recruiter"}</h3>

              {seller.profile?.headline && (
                <p className="creator-headline">{seller.profile.headline}</p>
              )}

              {seller.profile?.location && (
                <p className="creator-location">📍 {seller.profile.location}</p>
              )}

              <Link to={`/profile/${seller.id}`} className="btn btn-primary btn-sm" style={{ width: '100%' }}>
                View Profile
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
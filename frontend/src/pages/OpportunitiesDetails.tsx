import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { api } from "../services/api";
import { useAuthStore } from "../store/auth";

export default function OpportunityDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [listing, setListing] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Order modal state
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [requirements, setRequirements] = useState("");
  const [ordering, setOrdering] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);

  useEffect(() => {
    const fetchListing = async () => {
      try {
        setLoading(true);
        if (!id) return;
        const data = await api.getListing(id);
        setListing(data);
      } catch (err: any) {
        setError(err.response?.data?.error?.message || "Listing not found");
      } finally {
        setLoading(false);
      }
    };
    fetchListing();
  }, [id]);

  const handlePlaceOrder = async () => {
    if (!user) {
      navigate("/login");
      return;
    }

    if (user.id === listing?.sellerId) {
      setOrderError("You cannot apply to your own casting call.");
      return;
    }

    try {
      setOrdering(true);
      setOrderError(null);
      await api.createOrder({
        listingId: id!,
        requirements: requirements.trim() || undefined,
      });
      setShowOrderModal(false);
      navigate(`/orders`);
    } catch (err: any) {
      setOrderError(err.response?.data?.error?.message || "Failed to place order");
    } finally {
      setOrdering(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 64px)' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="loading-spinner large" style={{ margin: '0 auto 16px' }}></div>
          <p style={{ color: 'var(--text-muted)' }}>Loading opportunity...</p>
        </div>
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 64px)' }}>
        <div className="empty-state" style={{ maxWidth: 400 }}>
          <div className="empty-state-icon">⚠️</div>
          <h3>{error || "Listing not found"}</h3>
          <p>This opportunity may have been removed or doesn't exist.</p>
          <button onClick={() => navigate("/opportunities")} className="btn btn-secondary">
            Back to Marketplace
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Application Modal */}
      {showOrderModal && (
        <div className="modal-overlay" onClick={() => setShowOrderModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h2>Apply Now</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>
              You're applying to <strong style={{ color: 'var(--text-primary)' }}>{listing.title}</strong> for{" "}
              <strong style={{ color: 'var(--success)' }}>${listing.price}</strong>
            </p>

            {orderError && <div className="form-error">{orderError}</div>}

            <div className="form-group">
              <label className="form-label">Why are you a good fit? (Optional)</label>
              <textarea
                rows={4}
                value={requirements}
                onChange={(e) => setRequirements(e.target.value)}
                placeholder="Share your experience, links to previous work, or a short pitch..."
                className="form-textarea"
              ></textarea>
            </div>

            <div className="modal-actions">
              <button
                onClick={() => setShowOrderModal(false)}
                disabled={ordering}
                className="btn btn-ghost"
              >
                Cancel
              </button>
              <button
                onClick={handlePlaceOrder}
                disabled={ordering}
                className="btn btn-primary"
              >
                {ordering ? "Processing..." : "Submit Application"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="detail-page">
        <div className="detail-card">
          <div className="detail-card-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
              {/* Top section: info + price card */}
              <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
                {/* Left: Listing Info */}
                <div style={{ flex: 1, minWidth: 300 }}>
                  <span className="category-tag" style={{ marginBottom: 16, display: 'inline-block' }}>
                    {listing.category}
                  </span>
                  <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 16, letterSpacing: -0.5 }}>
                    {listing.title}
                  </h1>

                  {/* Seller Info */}
                  <Link
                    to={`/profile/${listing.seller?.id || listing.sellerId}`}
                    style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 12, padding: '8px 16px 8px 8px', borderRadius: 'var(--radius-full)', background: 'var(--bg-glass-hover)', transition: 'background 0.2s' }}
                  >
                    <div className="seller-avatar" style={{ width: 40, height: 40, fontSize: 16 }}>
                      {listing.seller?.profile?.avatarUrl ? (
                        <img src={listing.seller.profile.avatarUrl} alt="" />
                      ) : (
                        listing.seller?.profile?.displayName?.[0]?.toUpperCase() || "S"
                      )}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>
                        {listing.seller?.profile?.displayName || "Artist"}
                      </div>
                      {listing.seller?.profile?.headline && (
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                          {listing.seller.profile.headline}
                        </div>
                      )}
                    </div>
                  </Link>
                </div>

                {/* Right: Price Card */}
                <div className="detail-seller-card">
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
                    Price
                  </div>
                  <div className="detail-price">${listing.price}</div>
                  <div className="detail-delivery">
                    📅 Delivery in <strong style={{ color: 'var(--text-primary)' }}>{listing.deliveryDays} days</strong>
                  </div>

                  {user?.id !== listing.sellerId && (
                    <button
                      onClick={() => user ? setShowOrderModal(true) : navigate("/login")}
                      className="btn btn-primary btn-lg"
                      style={{ width: '100%' }}
                    >
                      Apply Now
                    </button>
                  )}

                  {user?.id === listing.sellerId && (
                    <div style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center' }}>
                      This is your listing
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>Description</h2>
                <div style={{
                  background: 'var(--bg-glass)',
                  border: '1px solid var(--border-secondary)',
                  borderRadius: 'var(--radius-md)',
                  padding: 24,
                  color: 'var(--text-secondary)',
                  lineHeight: 1.8,
                  whiteSpace: 'pre-line',
                  fontSize: 14,
                }}>
                  {listing.description}
                </div>
              </div>

              {/* Location */}
              {listing.seller?.profile?.location && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', fontSize: 14 }}>
                  📍 Located in <strong style={{ color: 'var(--text-secondary)' }}>{listing.seller.profile.location}</strong>
                </div>
              )}

              {/* Back link */}
              <div>
                <button onClick={() => navigate("/opportunities")} className="btn btn-ghost">
                  ← Back to Marketplace
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
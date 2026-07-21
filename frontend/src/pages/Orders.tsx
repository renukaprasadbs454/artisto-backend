import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { useAuthStore } from "../store/auth";

const ORDER_STEPS = ["PENDING", "ACCEPTED", "IN_PROGRESS", "DELIVERED", "COMPLETED"];

function getStepState(status: string, step: string) {
  const currentIdx = ORDER_STEPS.indexOf(status);
  const stepIdx = ORDER_STEPS.indexOf(step);
  if (status === "CANCELLED") return stepIdx === 0 ? "current" : "";
  if (stepIdx < currentIdx) return "completed";
  if (stepIdx === currentIdx) return "current";
  return "";
}

export default function Orders() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params: Record<string, any> = {};
      if (statusFilter) params.status = statusFilter;
      const res = await api.getOrders(params);
      setOrders(res.data || res as any);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || "Failed to fetch orders");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      await api.updateOrderStatus(orderId, newStatus);
      fetchOrders();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || "Failed to update order status");
    }
  };

  const handleOpenMessages = async (order: any) => {
    try {
      // Try to create or get existing conversation for this order
      const convo = await api.createConversation(order.id);
      navigate(`/messages/${convo.id}`);
    } catch (err: any) {
      // If conversation already exists, the error response may contain the ID
      // Fallback: just go to messages page
      navigate("/messages");
    }
  };

  if (loading) {
    return (
      <div className="page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 64px)' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="loading-spinner large" style={{ margin: '0 auto 16px' }}></div>
          <p style={{ color: 'var(--text-muted)' }}>Loading applications...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 64px)' }}>
        <div className="empty-state" style={{ maxWidth: 400 }}>
          <div className="empty-state-icon">⚠️</div>
          <h3>Error loading applications</h3>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            {user?.role === "SELLER" ? "Received Applications" : "My Applications"}
          </h1>
          <p className="page-subtitle">
            {orders.length} application{orders.length !== 1 ? "s" : ""}
          </p>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="filter-select"
        >
          <option value="">All Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="ACCEPTED">Accepted</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="DELIVERED">Delivered</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      {orders.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📦</div>
          <h3>No applications found</h3>
          <p>
            {statusFilter
              ? "No applications match the selected filter."
              : "You don't have any applications yet."}
          </p>
          {user?.role === "BUYER" && (
            <Link to="/opportunities" className="btn btn-primary">
              Browse Marketplace
            </Link>
          )}
        </div>
      ) : (
        <div>
          {orders.map((order) => {
            const isBuyer = user?.id === order.buyerId;
            const isSeller = user?.id === order.sellerId;
            const partnerProfile = isBuyer ? order.seller?.profile : order.buyer?.profile;

            return (
              <div key={order.id} className="order-card">
                <div className="order-card-header">
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span className="category-tag" style={{ fontSize: 10 }}>
                        {order.listing?.category}
                      </span>
                      <span className="order-id">#{order.id.slice(0, 8)}</span>
                    </div>
                    <div className="order-title">{order.listing?.title}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span className={`status-badge status-${order.status.toLowerCase()}`}>
                      {order.status.replace("_", " ")}
                    </span>
                    <div className="order-price" style={{ marginTop: 8 }}>
                      ${order.listing?.price}
                    </div>
                  </div>
                </div>

                <div className="order-card-body">
                  {/* Status Timeline */}
                  {order.status !== "CANCELLED" && (
                    <div className="status-timeline">
                      {ORDER_STEPS.map((step, idx) => (
                        <div key={step} style={{ display: 'contents' }}>
                          <div className={`timeline-step ${getStepState(order.status, step)}`}>
                            <div className="timeline-dot">
                              {getStepState(order.status, step) === "completed" ? "✓" : idx + 1}
                            </div>
                            <span className="timeline-label">
                              {step.replace("_", " ")}
                            </span>
                          </div>
                          {idx < ORDER_STEPS.length - 1 && (
                            <div className={`timeline-connector ${getStepState(order.status, step) === "completed" ? "completed" : ""}`}></div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {order.status === "CANCELLED" && (
                    <div style={{ textAlign: 'center', padding: '12px 0', color: 'var(--error)', fontSize: 14, fontWeight: 600 }}>
                      This order was cancelled
                    </div>
                  )}

                  {/* Partner & Requirements */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginTop: 16 }}>
                    <div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        {isBuyer ? "Recruiter" : "Actor"}
                      </div>
                      <div className="order-partner">
                        <div className="seller-avatar" style={{ width: 36, height: 36 }}>
                          {partnerProfile?.avatarUrl ? (
                            <img src={partnerProfile.avatarUrl} alt="" />
                          ) : (
                            partnerProfile?.displayName?.[0]?.toUpperCase() || "?"
                          )}
                        </div>
                        <span style={{ fontWeight: 600, fontSize: 14 }}>
                          {partnerProfile?.displayName || "Unknown"}
                        </span>
                      </div>
                    </div>

                    {order.requirements && (
                      <div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                          Requirements
                        </div>
                        <div className="order-requirements">{order.requirements}</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="order-card-footer">
                  {/* State Machine Actions */}
                  {isSeller && order.status === "PENDING" && (
                    <>
                      <button onClick={() => handleStatusUpdate(order.id, "ACCEPTED")} className="btn btn-primary btn-sm">
                        Accept Application
                      </button>
                      <button onClick={() => handleStatusUpdate(order.id, "CANCELLED")} className="btn btn-danger btn-sm">
                        Decline
                      </button>
                    </>
                  )}

                  {isSeller && order.status === "ACCEPTED" && (
                    <button onClick={() => handleStatusUpdate(order.id, "IN_PROGRESS")} className="btn btn-primary btn-sm">
                      Start Working
                    </button>
                  )}

                  {isSeller && order.status === "IN_PROGRESS" && (
                    <button onClick={() => handleStatusUpdate(order.id, "DELIVERED")} className="btn btn-primary btn-sm">
                      Mark Delivered
                    </button>
                  )}

                  {isBuyer && order.status === "DELIVERED" && (
                    <button onClick={() => handleStatusUpdate(order.id, "COMPLETED")} className="btn btn-primary btn-sm" style={{ background: 'linear-gradient(135deg, #10b981, #34d399)' }}>
                      Accept & Complete
                    </button>
                  )}

                  {(order.status === "PENDING" || order.status === "ACCEPTED") && (
                    <button onClick={() => handleStatusUpdate(order.id, "CANCELLED")} className="btn btn-ghost btn-sm" style={{ color: 'var(--error)' }}>
                      Cancel
                    </button>
                  )}

                  <button onClick={() => handleOpenMessages(order)} className="btn btn-secondary btn-sm" style={{ marginLeft: 'auto' }}>
                    💬 Messages
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

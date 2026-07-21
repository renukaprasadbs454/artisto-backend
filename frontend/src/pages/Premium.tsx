import { useState } from 'react';
import { api } from '../services/api';
import { useAuthStore } from '../store/auth';

function loadRazorpayScript(src: string): Promise<boolean> {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = () => {
      resolve(true);
    };
    script.onerror = () => {
      resolve(false);
    };
    document.body.appendChild(script);
  });
}

export default function Premium() {
  const { user } = useAuthStore();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const handleSubscribe = async (plan: 'PRO' | 'AGENCY', price: number) => {
    try {
      setLoadingPlan(plan);
      
      const res = await loadRazorpayScript('https://checkout.razorpay.com/v1/checkout.js');
      if (!res) {
        alert('Razorpay SDK failed to load. Are you offline?');
        return;
      }

      // Create Order on backend
      const data = await api.createPaymentOrder({
        amount: price,
        currency: 'INR',
        paymentType: 'SUBSCRIPTION',
      });

      const options = {
        key: data.key,
        amount: data.razorpayOrder.amount,
        currency: data.razorpayOrder.currency,
        name: 'Artisto Premium',
        description: `Upgrade to ${plan} Plan`,
        order_id: data.razorpayOrder.id,
        handler: async function (response: any) {
          try {
            await api.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              paymentId: data.paymentId,
              plan,
            });
            alert('Payment successful! Your subscription is now active.');
            window.location.reload();
          } catch (err: any) {
            alert(err.response?.data?.error?.message || 'Verification failed');
          }
        },
        prefill: {
          name: user?.profile?.displayName || '',
          email: user?.email || '',
        },
        theme: {
          color: '#8b5cf6',
        },
      };

      const paymentObject = new (window as any).Razorpay(options);
      paymentObject.open();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to initialize payment');
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="page-container" style={{ maxWidth: 1000, margin: '0 auto', padding: '64px 16px' }}>
      <div style={{ textAlign: 'center', marginBottom: 64 }}>
        <h1>Upgrade Your Artisto Experience</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 18, marginTop: 16 }}>
          Choose the perfect plan for your creative career.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 32 }}>
        
        {/* Pro Plan */}
        <div style={{ 
          background: 'var(--bg-elevated)', 
          borderRadius: 'var(--radius)', 
          padding: 32, 
          border: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <h2>Pro</h2>
          <div style={{ fontSize: 40, fontWeight: 700, margin: '24px 0' }}>
            ₹999<span style={{ fontSize: 16, color: 'var(--text-muted)' }}>/mo</span>
          </div>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
            Perfect for individual actors and creators looking to stand out.
          </p>
          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px 0', flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <li>✅ Priority listing in search results</li>
            <li>✅ Advanced analytics on profile views</li>
            <li>✅ Unlimited portfolio items</li>
            <li>✅ Dedicated "Pro" badge</li>
          </ul>
          <button 
            className="w-full py-4 px-6 rounded-xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-500/20 transition-all cursor-pointer"
            disabled={loadingPlan === 'PRO'}
            onClick={() => handleSubscribe('PRO', 999)}
          >
            {loadingPlan === 'PRO' ? 'Processing...' : 'Subscribe to Pro'}
          </button>
        </div>

        {/* Agency Plan */}
        <div style={{ 
          background: 'var(--bg-elevated)', 
          borderRadius: 'var(--radius)', 
          padding: 32, 
          border: '2px solid var(--primary)',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative'
        }}>
          <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: 'var(--primary)', color: '#fff', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
            MOST POPULAR
          </div>
          <h2>Agency</h2>
          <div style={{ fontSize: 40, fontWeight: 700, margin: '24px 0' }}>
            ₹4999<span style={{ fontSize: 16, color: 'var(--text-muted)' }}>/mo</span>
          </div>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
            For casting directors and production houses managing multiple talents.
          </p>
          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px 0', flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <li>✅ Everything in Pro</li>
            <li>✅ Manage up to 50 talent profiles</li>
            <li>✅ Escrow payment processing tools</li>
            <li>✅ Priority 24/7 support</li>
          </ul>
          <button 
            className="w-full py-4 px-6 rounded-xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-500/20 transition-all cursor-pointer"
            disabled={loadingPlan === 'AGENCY'}
            onClick={() => handleSubscribe('AGENCY', 4999)}
          >
            {loadingPlan === 'AGENCY' ? 'Processing...' : 'Subscribe to Agency'}
          </button>
        </div>

      </div>
    </div>
  );
}

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { api, formatCurrency } from '../lib/api';
import CheckoutItem from '../components/CheckoutItem';
import './CheckoutPage.css';

const getGuestDeviceId = () => {
  const key = 'chomok_fashion_guest_id';
  const saved = localStorage.getItem(key);
  if (saved) return saved;
  const id = crypto.randomUUID();
  localStorage.setItem(key, id);
  return id;
};

const CheckoutPage = () => {
  const { cart, cartTotal, clearCart } = useCart();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await api.createOrder({
        guestDeviceId: getGuestDeviceId(),
        customerName: formData.name,
        customerPhone: formData.phone,
        shippingAddress: formData.address,
        items: cart.map((item) => ({
          productId: item.productId,
          variationId: item.variationId,
          variationName: item.variationName,
          quantity: item.quantity,
          priceAtOrder: item.price,
        })),
      });

      clearCart();
      setSuccess(true);
      setTimeout(() => navigate('/'), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not place order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="checkout-success">
        <div className="checkout-success-card">
          <div className="checkout-success-icon">✓</div>
          <h2>Order Placed Successfully!</h2>
          <p>আপনার অর্ডার পাওয়া গেছে। আমরা শীঘ্রই আপনার সাথে যোগাযোগ করব।</p>
          <p className="checkout-redirect">Redirecting to home...</p>
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="checkout-empty">
        <ShoppingBag size={64} strokeWidth={1} />
        <h2>Your Cart is Empty</h2>
        <p>আপনার কার্টে কোনো পণ্য নেই। পণ্য browse করুন।</p>
        <button onClick={() => navigate('/')} type="button">Browse Products</button>
      </div>
    );
  }

  return (
    <motion.div
      className="checkout-page"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="container">
        <h1 className="checkout-heading">Checkout</h1>

        <div className="checkout-layout">
          {/* Order Summary */}
          <div className="checkout-summary">
            <div className="checkout-card">
              <h2 className="checkout-card-title">Order Summary</h2>
              <div className="checkout-items">
                {cart.map((item) => (
                  <CheckoutItem key={`${item.productId}-${item.variationId || 'base'}`} item={item} />
                ))}
              </div>
              <div className="checkout-totals">
                <div className="checkout-total-row">
                  <span>Subtotal</span>
                  <span>{formatCurrency(cartTotal)}</span>
                </div>
                <div className="checkout-total-row">
                  <span>Delivery</span>
                  <span className="free-tag">Free</span>
                </div>
                <div className="checkout-total-row grand-total">
                  <span>Total</span>
                  <span>{formatCurrency(cartTotal)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Customer Form */}
          <div className="checkout-form-wrap">
            <div className="checkout-card">
              <h2 className="checkout-card-title">Delivery Details</h2>
              <form onSubmit={handleConfirm} className="checkout-form">
                <div className="cf-group">
                  <label>Full Name / আপনার নাম *</label>
                  <input
                    required
                    type="text"
                    name="name"
                    placeholder="e.g. Rahim Uddin"
                    value={formData.name}
                    onChange={handleChange}
                  />
                </div>
                <div className="cf-group">
                  <label>Phone Number / ফোন নম্বর *</label>
                  <input
                    required
                    type="tel"
                    name="phone"
                    placeholder="017XXXXXXXX"
                    value={formData.phone}
                    onChange={handleChange}
                  />
                </div>
                <div className="cf-group">
                  <label>Full Address / সম্পূর্ণ ঠিকানা *</label>
                  <input
                    required
                    type="text"
                    name="address"
                    placeholder="House, Road, Area, District"
                    value={formData.address}
                    onChange={handleChange}
                  />
                </div>

                {error && <div className="cf-error">{error}</div>}

                <button
                  type="submit"
                  className="cf-submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <span className="cf-spinner" />
                  ) : (
                    `Confirm Order — ${formatCurrency(cartTotal)}`
                  )}
                </button>

                <p className="cf-note">
                  ✓ No account needed &nbsp;|&nbsp; Cash on Delivery available
                </p>
              </form>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default CheckoutPage;

import { motion, AnimatePresence } from 'framer-motion';
import { X, Minus, Plus, ShoppingBag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { formatCurrency } from '../lib/api';
import './CartDrawer.css';

const CartDrawer = () => {
  const { isCartOpen, setIsCartOpen, cart, updateQuantity, removeFromCart, cartTotal } = useCart();
  const navigate = useNavigate();

  const handleCheckout = () => {
    setIsCartOpen(false);
    navigate('/checkout');
  };

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          <motion.div
            className="cart-drawer-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsCartOpen(false)}
          />
          <motion.div
            className="cart-drawer"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          >
            <div className="cart-header">
              <div className="cart-title-row">
                <ShoppingBag size={20} className="cart-header-icon" />
                <h2>Your Cart</h2>
                {cart.length > 0 && <span className="cart-count-chip">{cart.reduce((s, i) => s + i.quantity, 0)}</span>}
              </div>
              <button className="cart-close" onClick={() => setIsCartOpen(false)} type="button" aria-label="Close">
                <X size={22} />
              </button>
            </div>

            <div className="cart-items">
              {cart.length === 0 ? (
                <div className="cart-empty">
                  <ShoppingBag size={48} className="cart-empty-icon" />
                  <p>Your cart is empty</p>
                  <span>Add some products to get started!</span>
                </div>
              ) : (
                cart.map((item, idx) => (
                  <div key={`${item.productId}-${item.variationId || idx}`} className="cart-item">
                    <img src={item.image} alt={item.name} className="cart-item-img" />
                    <div className="cart-item-details">
                      <h4 className="cart-item-title">{item.name}</h4>
                      {item.variationName && <p className="cart-item-var">{item.variationName}</p>}
                      <p className="cart-item-price">{formatCurrency(item.price)}</p>
                      <div className="cart-item-actions">
                        <div className="qty-selector">
                          <button className="qty-btn" onClick={() => updateQuantity(item.productId, item.quantity - 1, item.variationId)} type="button">
                            <Minus size={12} />
                          </button>
                          <span className="qty-display">{item.quantity}</span>
                          <button className="qty-btn" onClick={() => updateQuantity(item.productId, item.quantity + 1, item.variationId)} type="button">
                            <Plus size={12} />
                          </button>
                        </div>
                        <button className="remove-btn" onClick={() => removeFromCart(item.productId, item.variationId)} type="button">
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {cart.length > 0 && (
              <div className="cart-footer">
                <div className="cart-subtotal">
                  <span>Subtotal</span>
                  <span className="cart-total-amount">{formatCurrency(cartTotal)}</span>
                </div>
                <button className="btn-primary checkout-btn" onClick={handleCheckout} type="button">
                  Proceed to Checkout
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CartDrawer;

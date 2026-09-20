import { useLocation, useNavigate } from 'react-router-dom';
import { Home, LayoutGrid, ShoppingCart, User } from 'lucide-react';
import { useCart } from '../context/CartContext';
import './MobileBottomNav.css';

const MobileBottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { cartCount, setIsCartOpen } = useCart();
  const path = location.pathname;

  const scrollToSection = (id: string) => {
    if (location.pathname !== '/') {
      navigate('/', { state: { scrollTo: id } });
    } else {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
      {/* Home */}
      <button
        id="mob-nav-home"
        type="button"
        className={`mob-nav-item${path === '/' ? ' active' : ''}`}
        onClick={() => { navigate('/'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
        aria-label="Home"
      >
        <Home size={22} />
        <span>Home</span>
      </button>

      {/* Categories */}
      <button
        id="mob-nav-categories"
        type="button"
        className="mob-nav-item"
        onClick={() => scrollToSection('category-section')}
        aria-label="Categories"
      >
        <LayoutGrid size={22} />
        <span>Categories</span>
      </button>

      {/* Cart */}
      <button
        id="mob-nav-cart"
        type="button"
        className="mob-nav-item mob-nav-cart"
        onClick={() => setIsCartOpen(true)}
        aria-label="Cart"
      >
        <div className="mob-cart-icon-wrap">
          <ShoppingCart size={22} />
          {cartCount > 0 && (
            <span className="mob-cart-badge">{cartCount > 9 ? '9+' : cartCount}</span>
          )}
        </div>
        <span>Cart</span>
      </button>

      {/* Account / Admin */}
      <button
        id="mob-nav-account"
        type="button"
        className={`mob-nav-item${path.startsWith('/admin') ? ' active' : ''}`}
        onClick={() => navigate('/admin')}
        aria-label="Account"
      >
        <User size={22} />
        <span>Account</span>
      </button>
    </nav>
  );
};

export default MobileBottomNav;

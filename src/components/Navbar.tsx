import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Search, ShoppingBag, User } from 'lucide-react';
import { useCart } from '../context/CartContext';
import SearchModal from './SearchModal';
import './Navbar.css';

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { cartCount, setIsCartOpen } = useCart();
  const location = useLocation();
  const navigate = useNavigate();
  const [activeNav, setActiveNav] = useState<'home' | 'category' | 'products'>('home');

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 25);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollOrNavigate = (target: 'top' | 'category' | 'products') => {
    const doScroll = () => {
      if (target === 'top') return window.scrollTo({ top: 0, behavior: 'smooth' });
      const id = target === 'category' ? 'category-section' : 'all-products-section';
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      else window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    if (target === 'top') setActiveNav('home');
    else if (target === 'category') setActiveNav('category');
    else setActiveNav('products');

    if (location.pathname === '/') doScroll();
    else navigate('/', { state: { scrollTo: target } });
  };

  return (
    <>
      <nav className={`navbar${scrolled ? ' scrolled' : ''}`}>
        <div className="nav-container">
          {/* Left nav links */}
          <div className="nav-links">
            <button type="button" className={`nav-link${activeNav === 'home' ? ' active' : ''}`} onClick={() => scrollOrNavigate('top')}>Home</button>
            <button type="button" className={`nav-link${activeNav === 'category' ? ' active' : ''}`} onClick={() => scrollOrNavigate('category')}>Categories</button>
            <button type="button" className={`nav-link${activeNav === 'products' ? ' active' : ''}`} onClick={() => scrollOrNavigate('products')}>Products</button>
          </div>

          {/* Center Brand */}
          <Link to="/" className="nav-brand" onClick={() => setActiveNav('home')}>
            <span className="brand-icon">✦</span>
            <span className="brand-name">Chomok Fashion</span>
          </Link>

          {/* Right Actions */}
          <div className="nav-actions">
            <button className="nav-icon-btn" aria-label="Search" onClick={() => setIsSearchOpen(true)} type="button">
              <Search size={20} />
            </button>
            <button className="nav-icon-btn cart-btn" aria-label="Cart" onClick={() => setIsCartOpen(true)} type="button">
              <ShoppingBag size={20} />
              {cartCount > 0 && <span className="cart-badge">{cartCount > 9 ? '9+' : cartCount}</span>}
            </button>
            <Link to="/admin" className="nav-icon-btn" aria-label="Admin">
              <User size={20} />
            </Link>
          </div>
        </div>
      </nav>
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
};

export default Navbar;

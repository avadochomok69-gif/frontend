import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, ArrowRight, ChevronRight, ShoppingBag, Zap, TrendingUp } from 'lucide-react';
import { api } from '../lib/api';
import type { Category, Product, Banner } from '../lib/api';
import ProductCard from '../components/ProductCard';
import './HomePage.css';
import '../components/ProductCard.css';

function scrollToSection(id: string) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

const HomePage = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [catalogFilter, setCatalogFilter] = useState<string>('all');
  const [catalogVisible, setCatalogVisible] = useState(8);
  const [searchQuery, setSearchQuery] = useState('');
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;
    Promise.all([api.getCategories(), api.getProducts(), api.getBanners()])
      .then(([cats, allProds, bans]) => {
        if (!isMounted) return;
        setCategories(cats);
        setAllProducts(allProds);
        setBanners(bans);
      })
      .catch((err: Error) => { if (isMounted) setError(err.message); })
      .finally(() => { if (isMounted) setIsLoading(false); });
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    const state = (location as any).state as { scrollTo?: string } | null;
    if (!state?.scrollTo) return;
    const target = state.scrollTo;
    setTimeout(() => {
      if (target === 'top') return window.scrollTo({ top: 0, behavior: 'smooth' });
      const id = target === 'category' ? 'category-section' : 'all-products-section';
      scrollToSection(id);
    }, 200);
    navigate(location.pathname, { replace: true, state: null });
  }, [location, navigate]);

  // Flash sales = last 3 added products
  const flashSaleProducts = [...allProducts]
    .sort((a, b) => {
      if (a.createdAt && b.createdAt) return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      return 0;
    })
    .slice(0, 3);

  const filteredCatalog = catalogFilter === 'all' ? allProducts : allProducts.filter(p => p.categoryId === catalogFilter);
  const visibleCatalog = filteredCatalog.slice(0, catalogVisible);
  const hasMore = visibleCatalog.length < filteredCatalog.length;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) navigate(`/?search=${encodeURIComponent(searchQuery.trim())}`);
  };

  return (
    <motion.div className="homepage" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>

      {/* ════════════════════════════════════════
          MOBILE LAYOUT (≤ 768px)
      ════════════════════════════════════════ */}

      {/* Mobile: Search Bar */}
      <div className="mobile-search-section">
        <form className="mobile-search-form" onSubmit={handleSearchSubmit}>
          <div className="mobile-search-bar">
            <Search size={18} className="mob-search-icon" />
            <input
              type="text"
              placeholder="Search for fashion items..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="mob-search-input"
            />
            <button type="submit" className="mob-search-btn">Search</button>
          </div>
        </form>
      </div>

      {/* Mobile: Banner Section */}
      {banners.length > 0 && (
        <section className="mobile-banner-section" style={{ padding: '0 15px', marginBottom: '15px' }}>
          <img 
            src={banners[0].image_url} 
            alt="Promotion Banner" 
            style={{ width: '100%', borderRadius: '12px', objectFit: 'cover', display: 'block' }} 
          />
        </section>
      )}

      {/* Mobile: Flash Sales */}
      <section className="mobile-flash-section" id="flash-sales">
        <div className="flash-header">
          <div className="flash-title">
            <Zap size={18} className="flash-icon" />
            <h2>Flash Sale</h2>
          </div>
          <button className="flash-more-btn" onClick={() => scrollToSection('all-products-section')} type="button">
            Shop More <ChevronRight size={14} />
          </button>
        </div>
        <div className="flash-products-row">
          {isLoading
            ? [1,2,3].map(i => <div key={i} className="flash-card-skeleton" />)
            : flashSaleProducts.map(product => (
              <div key={product.id} className="flash-card" onClick={() => navigate(`/product/${product.id}`)}>
                <div className="flash-card-img-wrap">
                  <span className="flash-save-badge">SALE</span>
                  <img src={product.mainImage} alt={product.name} />
                </div>
                <div className="flash-card-info">
                  <p className="flash-card-price">৳{Math.round(product.price).toLocaleString()}</p>
                  <p className="flash-card-name">{product.name}</p>
                </div>
              </div>
            ))
          }
        </div>
      </section>

      {/* Mobile: Popular Categories */}
      <section className="mobile-categories-section" id="category-section">
        <div className="mob-section-header">
          <div className="mob-section-title">
            <TrendingUp size={16} />
            <h2>Popular Categories</h2>
          </div>
          <button className="mob-scroll-more" type="button">Scroll More <ChevronRight size={13} /></button>
        </div>
        <div className="mob-categories-grid">
          {isLoading
            ? [1,2,3,4,5,6].map(i => <div key={i} className="mob-cat-skeleton" />)
            : categories.slice(0, 6).map(cat => (
              <div key={cat.id} className="mob-category-card" onClick={() => navigate(`/category/${cat.id}`)}>
                <div className="mob-cat-img-wrap">
                  <img src={cat.imageUrl || 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?auto=format&fit=crop&q=80&w=400'} alt={cat.name} />
                </div>
                <span className="mob-cat-name">{cat.name}</span>
              </div>
            ))
          }
        </div>
      </section>

      {/* ════════════════════════════════════════
          PC LAYOUT HERO (hidden on mobile)
      ════════════════════════════════════════ */}
      <section className="hero-banner pc-only">
        <div className="hero-bg-decoration" />
        <div className="container hero-container">
          <motion.div className="hero-text" initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, delay: 0.15 }}>
            <span className="hero-label">✦ Best Fashion Store</span>
            <h1 className="hero-title">
              Fashion That<br />
              <span className="hero-title-orange">Makes You</span><br />
              Shine.
            </h1>
            <p className="hero-desc">
              Discover the latest fashion trends — from casual wear to premium collections. Style that speaks for you.
            </p>
            <div className="hero-actions">
              <button className="btn-primary" onClick={() => scrollToSection('all-products-section')} type="button">
                Shop Now <ShoppingBag size={18} />
              </button>
              <button className="btn-outline" onClick={() => scrollToSection('category-section')} type="button">
                Browse Categories
              </button>
            </div>
          </motion.div>
          <motion.div className="hero-visual" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, delay: 0.3 }}>
            <div className="hero-img-container">
              <div className="hero-glow" />
              <img
                src="https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&q=80&w=800"
                alt="Fashion collection"
                className="hero-main-img"
              />
              <div className="hero-badge-1">
                <span className="badge-icon">✦</span>
                <div>
                  <div className="badge-title">Premium Quality</div>
                  <div className="badge-sub">100% Authentic</div>
                </div>
              </div>
              <div className="hero-badge-2">
                <div className="badge-title">500+</div>
                <div className="badge-sub">Happy Customers</div>
              </div>
            </div>
            <div className="hero-tags">
              {['T-Shirts', 'Dresses', 'Hoodies', 'Accessories', 'Saree'].map((tag, i) => (
                <motion.span key={tag} className="hero-tag-pill" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 + i * 0.08 }}>
                  {tag}
                </motion.span>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* PC: Categories Section */}
      <section className="category-section pc-only" id="category-section-pc">
        <div className="container">
          <div className="section-header center">
            <span className="section-label">Shop By</span>
            <h2 className="section-heading">Categories</h2>
            <div className="section-divider" />
          </div>
          {isLoading && <p className="state-message">Loading categories...</p>}
          {!isLoading && error && <p className="state-message" style={{ color: '#ff4d4f' }}>{error}</p>}
          <div className="category-grid">
            {categories.map((cat, idx) => (
              <motion.div
                key={cat.id}
                className="category-card"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: idx * 0.06 }}
                onClick={() => navigate(`/category/${cat.id}`)}
                role="button"
                tabIndex={0}
                onKeyDown={e => e.key === 'Enter' && navigate(`/category/${cat.id}`)}
              >
                <div className="category-img-wrap">
                  <img src={cat.imageUrl || 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?auto=format&fit=crop&q=80&w=600'} alt={cat.name} className="category-img" loading="lazy" />
                </div>
                <div className="category-overlay">
                  <h3 className="category-name">{cat.name}</h3>
                  <div className="category-meta">
                    <span className="category-count">{cat._count?.products ?? 0} Products</span>
                    <span className="category-arrow"><ArrowRight size={16} /></span>
                  </div>
                </div>
              </motion.div>
            ))}
            {!isLoading && categories.length === 0 && !error && (
              <p className="state-message" style={{ gridColumn: '1/-1' }}>No categories yet — add from Admin panel.</p>
            )}
          </div>
        </div>
      </section>

      {/* All Products Section (both PC and Mobile) */}
      <section className="catalogue-section" id="all-products-section">
        <div className="container">
          <div className="section-header center">
            <span className="section-label">Complete Range</span>
            <h2 className="section-heading">All Products</h2>
            <div className="section-divider" />
          </div>

          {/* Category Filter */}
          <div className="catalogue-filters">
            <button className={`filter-tab${catalogFilter === 'all' ? ' active' : ''}`} onClick={() => { setCatalogFilter('all'); setCatalogVisible(8); }} type="button">All</button>
            {categories.map(cat => (
              <button key={cat.id} className={`filter-tab${catalogFilter === cat.id ? ' active' : ''}`} onClick={() => { setCatalogFilter(cat.id); setCatalogVisible(8); }} type="button">{cat.name}</button>
            ))}
          </div>

          <div className="catalogue-grid">
            {visibleCatalog.map((product, idx) => (
              <motion.div key={product.id} initial={{ opacity: 0, scale: 0.97 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.35, delay: (idx % 4) * 0.06 }}>
                <ProductCard product={product} />
              </motion.div>
            ))}
            {!isLoading && filteredCatalog.length === 0 && (
              <p className="state-message" style={{ gridColumn: '1/-1' }}>No products in this category yet.</p>
            )}
          </div>

          {hasMore && (
            <div className="catalogue-more">
              <button className="btn-outline load-more-btn" onClick={() => setCatalogVisible(prev => prev + 8)} type="button">
                Load More Products <ChevronRight size={18} />
              </button>
            </div>
          )}
        </div>
      </section>

    </motion.div>
  );
};

export default HomePage;

import { useEffect, Component, type ReactNode } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import './App.css';

import Navbar from './components/Navbar';
import Footer from './components/Footer';
import MobileBottomNav from './components/MobileBottomNav';
import CartDrawer from './components/CartDrawer';

import HomePage from './pages/HomePage';
import ProductDetailPage from './pages/ProductDetailPage';
import CheckoutPage from './pages/CheckoutPage';
import AdminDashboard from './pages/admin/Dashboard';
import CategoryPage from './pages/CategoryPage';

// Error boundary to catch crashes and show a fallback
class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: string }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: '' };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message };
  }
  componentDidCatch(error: Error) {
    console.error('[Chomok Fashion] Error:', error);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem', background: '#fff', color: '#333', fontFamily: 'Inter, sans-serif' }}>
          <div style={{ fontSize: '2rem' }}>⚠️</div>
          <h2 style={{ color: '#ff6b00' }}>Something went wrong</h2>
          <p style={{ color: '#888', fontSize: '0.9rem' }}>{this.state.error}</p>
          <button
            onClick={() => { this.setState({ hasError: false, error: '' }); window.location.href = '/'; }}
            style={{ background: '#ff6b00', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: '8px', cursor: 'pointer', fontWeight: 700 }}
          >
            Go Home
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function ScrollToTop() {
  const location = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [location.pathname]);
  return null;
}

function AppRoutes() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');

  return (
    <div className="app-container">
      {!isAdmin && <Navbar />}
      <CartDrawer />
      <ScrollToTop />
      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/category/:id" element={<CategoryPage />} />
          <Route path="/product/:id" element={<ProductDetailPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/admin/*" element={<AdminDashboard />} />
        </Routes>
      </main>
      {!isAdmin && <Footer />}
      {!isAdmin && <MobileBottomNav />}
    </div>
  );
}

function App() {
  return (
    <Router>
      <ErrorBoundary>
        <AppRoutes />
      </ErrorBoundary>
    </Router>
  );
}

export default App;

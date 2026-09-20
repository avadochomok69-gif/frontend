import { Link } from 'react-router-dom';
import { Mail, MapPin, Phone } from 'lucide-react';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-top">
        <div className="container">
          <div className="footer-grid">
            {/* Brand */}
            <div className="footer-brand-col">
              <Link to="/" className="footer-brand-link">
                <span className="footer-brand-icon">✦</span>
                <span className="footer-brand-name">Chomok Fashion</span>
              </Link>
              <p className="footer-brand-desc">
                Bangladesh-এর সেরা ফ্যাশন ডেস্টিনেশন। সেরা মানের পোশাক ও ফ্যাশন পণ্য সবচেয়ে ভালো দামে।
              </p>
              <div className="footer-social">
                <a href="#" aria-label="Facebook" className="social-link">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
                </a>
                <a href="#" aria-label="Instagram" className="social-link">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
                </a>
                <a href="#" aria-label="TikTok" className="social-link">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"/></svg>
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div className="footer-col">
              <h4 className="footer-col-title">Quick Links</h4>
              <ul className="footer-links-list">
                <li><Link to="/">Home</Link></li>
                <li><a href="#category-section">Categories</a></li>
                <li><a href="#flash-sales">Flash Sale</a></li>
                <li><a href="#all-products-section">All Products</a></li>
              </ul>
            </div>

            {/* Customer Care */}
            <div className="footer-col">
              <h4 className="footer-col-title">Customer Care</h4>
              <ul className="footer-links-list">
                <li><Link to="/checkout">Place Order</Link></li>
                <li><a href="#">Shipping Policy</a></li>
                <li><a href="#">Return &amp; Refund</a></li>
                <li><a href="#">Track Order</a></li>
                <li><a href="#">FAQ</a></li>
              </ul>
            </div>

            {/* Contact */}
            <div className="footer-col footer-contact-col">
              <h4 className="footer-col-title">Contact Us</h4>
              <ul className="footer-contact-list">
                <li>
                  <Phone size={15} className="contact-icon" />
                  <span>01712 345678</span>
                </li>
                <li>
                  <Mail size={15} className="contact-icon" />
                  <span>chomokfashion@gmail.com</span>
                </li>
                <li>
                  <MapPin size={15} className="contact-icon" />
                  <span>Chittagong, Bangladesh</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="container footer-bottom-inner">
          <p>© 2026 <span className="footer-brand-inline">Chomok Fashion</span>. All rights reserved.</p>
          <div className="footer-bottom-links">
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

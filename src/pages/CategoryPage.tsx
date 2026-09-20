import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, SlidersHorizontal } from 'lucide-react';
import { api } from '../lib/api';
import type { Product, Category } from '../lib/api';
import ProductCard from '../components/ProductCard';
import './CategoryPage.css';

const CategoryPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [category, setCategory] = useState<Category | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    if (!id) { setError('Category not found'); setIsLoading(false); return; }

    Promise.all([api.getCategories(), api.getProducts({ categoryId: id })])
      .then(([cats, prods]) => {
        if (!mounted) return;
        setCategory(cats.find((c) => c.id === id) ?? null);
        setProducts(prods);
      })
      .catch((err: Error) => { if (mounted) setError(err.message); })
      .finally(() => { if (mounted) setIsLoading(false); });

    return () => { mounted = false; };
  }, [id]);

  return (
    <motion.div
      className="cat-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
    >
      {/* Header */}
      <div className="cat-header">
        <div className="container cat-header-inner">
          <button className="cat-back-btn" onClick={() => navigate(-1)} type="button">
            <ArrowLeft size={18} /> Back
          </button>
          <div>
            <p className="cat-label">Collection</p>
            <h1 className="cat-title">{category?.name ?? 'Products'}</h1>
          </div>
          {products.length > 0 && (
            <span className="cat-count">{products.length} items</span>
          )}
        </div>
      </div>

      {/* Products Grid */}
      <div className="cat-body">
        <div className="container">
          {isLoading && (
            <div className="cat-state">
              <div className="cat-spinner"></div>
              <p>Loading products...</p>
            </div>
          )}

          {!isLoading && error && (
            <div className="cat-state cat-error">
              <p>{error}</p>
            </div>
          )}

          {!isLoading && !error && products.length === 0 && (
            <div className="cat-state">
              <SlidersHorizontal size={48} strokeWidth={1} />
              <p>No products found in this category.</p>
              <button onClick={() => navigate('/')} type="button">Go to Home</button>
            </div>
          )}

          {products.length > 0 && (
            <div className="cat-grid">
              {products.map((product, idx) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.35, delay: (idx % 4) * 0.05 }}
                >
                  <ProductCard product={product} />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default CategoryPage;

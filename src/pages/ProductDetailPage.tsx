import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, ShoppingBag, Zap } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { api, formatCurrency } from '../lib/api';
import type { Product, ProductVariation } from '../lib/api';
import ProductCard from '../components/ProductCard';
import './ProductDetailPage.css';

const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, ProductVariation | null>>({});
  const [activeImage, setActiveImage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [similarProducts, setSimilarProducts] = useState<Product[]>([]);

  useEffect(() => {
    if (!id) return;
    let isMounted = true;
    setIsLoading(true);
    setError('');
    setSimilarProducts([]);
    setSelectedOptions({});
    api.getProduct(id)
      .then((data) => {
        if (!isMounted) return;
        setProduct(data);
        setActiveImage(data.mainImage);
        if (data.categoryId) {
          api.getProducts({ categoryId: data.categoryId })
            .then(prods => { if (isMounted) setSimilarProducts(prods.filter(p => p.id !== data.id)); })
            .catch(() => {});
        }
      })
      .catch((err: Error) => { if (isMounted) setError(err.message); })
      .finally(() => { if (isMounted) setIsLoading(false); });
    return () => { isMounted = false; };
  }, [id]);

  useEffect(() => {
    if (!product) return;
    const firstOpt = Object.values(selectedOptions).find(Boolean);
    if (firstOpt?.imageUrl) setActiveImage(firstOpt.imageUrl);
    else setActiveImage(product.mainImage);
  }, [product, selectedOptions]);

  const variationGroups = useMemo(() => {
    if (!product) return [] as Array<{ name: string; options: ProductVariation[] }>;
    const groups: Record<string, ProductVariation[]> = {};
    (product.variations ?? []).forEach((v) => {
      groups[v.name] = groups[v.name] ?? [];
      groups[v.name].push(v);
    });
    return Object.keys(groups).map((name) => ({ name, options: groups[name] }));
  }, [product]);

  const galleryImages = useMemo(() => {
    if (!product) return [];
    const imgs: string[] = [product.mainImage];
    if (product.images?.length) imgs.push(...product.images.map((img) => img.url));
    if (product.variations?.length) {
      product.variations.forEach((v) => { if (v.imageUrl) imgs.push(v.imageUrl); });
    }
    return Array.from(new Set(imgs));
  }, [product]);

  const finalPrice = product
    ? product.price + Object.values(selectedOptions).reduce((sum, opt) => sum + (opt?.priceAdded ?? 0), 0)
    : 0;

  const cartName = product
    ? `${product.name}${Object.values(selectedOptions).filter(Boolean).map((opt) => ` - ${opt!.name}: ${opt!.value}`).join('')}`
    : '';

  const addCurrentProductToCart = () => {
    if (!product) return;
    const primaryOpt = Object.values(selectedOptions).find(Boolean) ?? null;
    addToCart({
      productId: product.id,
      variationId: primaryOpt?.id,
      variationName: Object.values(selectedOptions).filter(Boolean).map((opt) => `${opt!.name}: ${opt!.value}`).join(', '),
      name: cartName,
      price: finalPrice,
      quantity: 1,
      image: primaryOpt?.imageUrl ?? product.mainImage,
    });
  };

  const handleBuyNow = () => {
    addCurrentProductToCart();
    navigate('/checkout');
  };

  if (isLoading) {
    return (
      <div className="pdp-loading">
        <div className="pdp-spinner"></div>
        <p>Loading product...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="pdp-error container">
        <h2>Product not found</h2>
        <p>{error || 'This product is not available.'}</p>
        <button className="pdp-back-btn" onClick={() => navigate('/')} type="button">← Back to Home</button>
      </div>
    );
  }

  return (
    <motion.div
      className="pdp-page"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="container">
        <div className="pdp-grid">
          {/* Gallery */}
          <div className="pdp-gallery">
            <div className="pdp-main-image">
              <motion.img
                key={activeImage}
                src={activeImage}
                alt={product.name}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.25 }}
              />
            </div>
            {galleryImages.length > 1 && (
              <div className="pdp-thumbnails">
                {galleryImages.map((img, idx) => (
                  <img
                    key={idx}
                    src={img}
                    alt={product.name}
                    className={`pdp-thumb ${activeImage === img ? 'active' : ''}`}
                    onClick={() => setActiveImage(img)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="pdp-info">
            {product.category?.name && (
              <span className="pdp-category">{product.category.name}</span>
            )}
            <h1 className="pdp-title">{product.name}</h1>
            <div className="pdp-price">
              <span className="pdp-price-value">{formatCurrency(finalPrice)}</span>
            </div>

            {product.description && (
              <p className="pdp-description">{product.description}</p>
            )}

            {/* Variations */}
            {variationGroups.length > 0 && (
              <div className="pdp-variations">
                {variationGroups.map((group) => (
                  <div key={group.name} className="pdp-variation-group">
                    <div className="pdp-variation-label">{group.name}:</div>
                    <div className="pdp-variation-options">
                      {group.options.map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          className={`pdp-variation-btn ${selectedOptions[opt.name]?.id === opt.id ? 'active' : ''}`}
                          onClick={() => {
                            setSelectedOptions((curr) => ({ ...curr, [opt.name]: opt }));
                            if (opt.imageUrl) setActiveImage(opt.imageUrl);
                          }}
                        >
                          {opt.imageUrl && (
                            <img src={opt.imageUrl} alt={opt.value} className="pdp-variation-img" />
                          )}
                          <span>{opt.value}</span>
                          {opt.priceAdded > 0 && <span className="pdp-price-adj">+{formatCurrency(opt.priceAdded)}</span>}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="pdp-actions">
              <button className="pdp-buy-now" onClick={handleBuyNow} type="button">
                <Zap size={18} /> Buy Now
              </button>
              <button className="pdp-add-cart" onClick={addCurrentProductToCart} type="button">
                <ShoppingBag size={18} /> Add to Cart
              </button>
            </div>
          </div>
        </div>

        {/* Similar Products */}
        {similarProducts.length > 0 && (
          <section className="pdp-similar">
            <div className="pdp-similar-header">
              <h2>Similar Products</h2>
              {product.categoryId && (
                <button
                  className="pdp-see-all"
                  onClick={() => navigate(`/category/${product.categoryId}`)}
                  type="button"
                >
                  See All <ArrowRight size={14} />
                </button>
              )}
            </div>
            <div className="pdp-similar-grid">
              {similarProducts.slice(0, 8).map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}
      </div>
    </motion.div>
  );
};

export default ProductDetailPage;

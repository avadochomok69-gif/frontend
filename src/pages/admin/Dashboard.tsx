import React, { useEffect, useState, type FormEvent } from 'react';
import { api, formatCurrency } from '../../lib/api';
import supabase from '../../lib/supabaseClient';
import type { Category, Order, OrderStatus, Product } from '../../lib/api';
import { AdminLogin } from './AdminLogin';
import { AdminSummary } from './AdminSummary';
import './Admin.css';

const BUCKET = import.meta.env.VITE_SUPABASE_BUCKET ?? 'uploads';

type Tab = 'summary' | 'orders' | 'products' | 'categories';
type OptionDraft = { id: string; value: string; priceAdded: string; image: File | null; imageUrl?: string | null; };
type GroupDraft = { id: string; name: string; options: OptionDraft[]; };

const ORDER_STATUSES: OrderStatus[] = ['PENDING', 'APPROVED', 'DELIVERED', 'CANCELLED'];

// Cross-browser UUID generator (works on http:// and older mobile browsers)
const genId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback for older browsers / non-secure contexts
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

const newOpt = (): OptionDraft => ({ id: genId(), value: '', priceAdded: '0', image: null, imageUrl: null });
const newGroup = (): GroupDraft => ({ id: genId(), name: '', options: [newOpt()] });

const AdminDashboard = () => {
  const [loggedIn, setLoggedIn] = useState(() => localStorage.getItem('chomok_admin_token') === 'chomok_authenticated');
  const [tab, setTab] = useState<Tab>('summary');
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [expanded, setExpanded] = useState<string[]>([]);
  const [orderFilter, setOrderFilter] = useState<OrderStatus | 'ALL'>('ALL');
  const [prodCache, setProdCache] = useState<Record<string, Product | null>>({});

  // Category form
  const [catName, setCatName] = useState('');
  const [catImage, setCatImage] = useState<File | null>(null);
  const [editCatId, setEditCatId] = useState<string | null>(null);
  const [existCatImg, setExistCatImg] = useState<string | null>(null);

  // Product form
  const [prodForm, setProdForm] = useState({ name: '', shortDescription: '', description: '', price: '', categoryId: '', isSignature: false });
  const [editProdId, setEditProdId] = useState<string | null>(null);
  const [existMainImg, setExistMainImg] = useState<string | null>(null);
  const [groups, setGroups] = useState<GroupDraft[]>([newGroup()]);
  const [mainImg, setMainImg] = useState<File | null>(null);
  const [secImgs, setSecImgs] = useState<FileList | null>(null);

  const loadData = async () => {
    setLoading(true); setErr('');
    try {
      const [cats, prods, ords] = await Promise.all([api.getCategories(), api.getProducts(), api.getOrders()]);
      setCategories(cats); setProducts(prods); setOrders(ords);
    } catch (e) { setErr(e instanceof Error ? e.message : 'Failed to load data'); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  const flash = (v: string) => { setMsg(v); setTimeout(() => setMsg(''), 2500); };

  const upload = async (file: File, folder: string) => {
    const ext = file.name.split('.').pop();
    const path = `${folder}/${Date.now()}_${crypto.randomUUID()}.${ext}`;
    const { error: e } = await supabase.storage.from(BUCKET).upload(path, file, { cacheControl: '3600', upsert: false });
    if (e) throw e;
    return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
  };

  const handleSaveCategory = async (ev: FormEvent) => {
    ev.preventDefault(); setErr('');
    try {
      let imgUrl: string | null = existCatImg;
      if (catImage) imgUrl = await upload(catImage, 'categories');
      if (editCatId) { await api.updateCategory(editCatId, { name: catName, image_url: imgUrl }); flash('Category updated'); }
      else { await api.createCategory({ name: catName, image_url: imgUrl }); flash('Category created'); }
      setCatName(''); setCatImage(null); setEditCatId(null); setExistCatImg(null);
      await loadData();
    } catch (e) { setErr(e instanceof Error ? e.message : 'Failed to save category'); }
  };

  const handleSaveProduct = async (ev: FormEvent) => {
    ev.preventDefault(); setErr('');
    if (!editProdId && !mainImg) { setErr('Main image is required'); return; }
    try {
      const mainUrl = mainImg ? await upload(mainImg, 'products/main') : existMainImg;
      const secUrls: string[] = [];
      if (secImgs) for (let i = 0; i < secImgs.length; i++) { try { secUrls.push(await upload(secImgs[i], 'products/secondary')); } catch {} }

      const vars: any[] = [];
      for (const g of groups) {
        if (!g.name.trim()) continue;
        for (const o of g.options) {
          if (!o.value.trim()) continue;
          let imgUrl: string | null = o.imageUrl ?? null;
          if (o.image) try { imgUrl = await upload(o.image, 'products/variations'); } catch {}
          vars.push({ name: g.name.trim(), value: o.value.trim(), priceAdded: Number(o.priceAdded || 0), imageUrl: imgUrl });
        }
      }

      const payload = {
        name: prodForm.name, short_description: prodForm.shortDescription, description: prodForm.description,
        price: Number(prodForm.price), is_signature: prodForm.isSignature, category_id: prodForm.categoryId || null,
        main_image: mainUrl, images: secUrls, variations: vars, stock: 0, metadata: {},
      };

      if (editProdId) { await api.updateProduct(editProdId, payload); flash('Product updated'); }
      else { await api.createProduct(payload); flash('Product created'); }

      setProdForm({ name: '', shortDescription: '', description: '', price: '', categoryId: '', isSignature: false });
      setGroups([newGroup()]); setMainImg(null); setSecImgs(null); setEditProdId(null); setExistMainImg(null);
      await loadData();
    } catch (e) { setErr(e instanceof Error ? e.message : 'Failed to save product'); }
  };

  const startEditProd = (p: Product) => {
    setEditProdId(p.id);
    setProdForm({ name: p.name, shortDescription: p.shortDescription, description: p.description ?? '', price: String(p.price), categoryId: p.categoryId ?? '', isSignature: p.isSignature });
    const gMap: Record<string, any[]> = {};
    (p.variations || []).forEach(v => { gMap[v.name] = gMap[v.name] || []; gMap[v.name].push({ id: v.id, value: v.value, priceAdded: String(v.priceAdded ?? 0), image: null, imageUrl: v.imageUrl ?? null }); });
    setGroups(Object.keys(gMap).length > 0 ? Object.keys(gMap).map(n => ({ id: crypto.randomUUID(), name: n, options: gMap[n] })) : [newGroup()]);
    setExistMainImg(p.mainImage); setMainImg(null); setSecImgs(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const startEditCat = (c: Category) => {
    setEditCatId(c.id); setCatName(c.name); setExistCatImg(c.imageUrl ?? null); setCatImage(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleExpand = async (id: string) => {
    setExpanded(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
    const order = orders.find(o => o.id === id);
    if (!order) return;
    for (const it of order.items || []) {
      if (!prodCache[it.productId]) {
        try { const p = await api.getProduct(it.productId); setProdCache(prev => ({ ...prev, [p.id]: p })); } catch {}
      }
    }
  };

  if (!loggedIn) return <AdminLogin onLoginSuccess={() => setLoggedIn(true)} />;

  const TABS: Tab[] = ['summary', 'orders', 'products', 'categories'];
  const filteredOrders = orderFilter === 'ALL' ? orders : orders.filter(o => o.status === orderFilter);

  return (
    <div className="ad-shell">
      <aside className="ad-sidebar">
        <div className="ad-brand">
          <span className="ad-brand-cf">Chomok</span> Fashion
        </div>
        <nav className="ad-nav">
          {TABS.map(t => (
            <button key={t} className={`ad-nav-btn ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)} type="button">
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </nav>
        <button
          className="ad-logout"
          onClick={() => { localStorage.removeItem('chomok_admin_token'); setLoggedIn(false); }}
          type="button"
        >
          Logout
        </button>
      </aside>

      <div className="ad-main">
        <div className="ad-topbar">
          <h2 className="ad-page-title">{tab.charAt(0).toUpperCase() + tab.slice(1)}</h2>
          <button className="ad-refresh-btn" onClick={loadData} type="button">↻ Refresh</button>
        </div>

        {msg && <div className="ad-flash ad-flash-ok">{msg}</div>}
        {err && <div className="ad-flash ad-flash-err">{err}</div>}
        {loading && <div className="ad-loading">Loading...</div>}

        {/* ── Summary ── */}
        {!loading && tab === 'summary' && <AdminSummary orders={orders} />}

        {/* ── Orders ── */}
        {!loading && tab === 'orders' && (
          <div>
            <div className="ad-status-row">
              {(['PENDING', 'APPROVED', 'DELIVERED', 'CANCELLED'] as OrderStatus[]).map(s => (
                <div
                  key={s}
                  className={`ad-stat-box ad-stat-${s.toLowerCase()} ${orderFilter === s ? 'active' : ''}`}
                  onClick={() => setOrderFilter(orderFilter === s ? 'ALL' : s)}
                  role="button" tabIndex={0}
                >
                  <div className="ad-stat-count">{orders.filter(o => o.status === s).length}</div>
                  <div className="ad-stat-label">{s}</div>
                </div>
              ))}
            </div>

            <div className="ad-table-wrap">
              <table className="ad-table">
                <thead><tr>
                  <th>Order ID</th><th>Customer</th><th>Date</th><th>Total</th><th>Status</th><th>Action</th>
                </tr></thead>
                <tbody>
                  {filteredOrders.map(order => (
                    <React.Fragment key={order.id}>
                      <tr>
                        <td>
                          <button className="ad-expand-btn" type="button" onClick={() => toggleExpand(order.id)}>
                            {expanded.includes(order.id) ? '−' : '+'}
                          </button>
                          <span className="ad-order-id">#{order.id.slice(0, 8)}</span>
                        </td>
                        <td>
                          <div className="ad-customer-name">{order.customerName}</div>
                          <div className="ad-customer-phone">{order.customerPhone}</div>
                        </td>
                        <td>{new Date(order.createdAt).toLocaleDateString('en-BD')}</td>
                        <td className="ad-amount">{formatCurrency(order.totalAmount)}</td>
                        <td><span className={`ad-badge ad-badge-${order.status.toLowerCase()}`}>{order.status}</span></td>
                        <td>
                          <select
                            className="ad-select"
                            value={order.status}
                            onChange={async e => {
                              try { await api.updateOrderStatus(order.id, e.target.value as OrderStatus); flash('Order updated'); await loadData(); }
                              catch (e) { setErr(e instanceof Error ? e.message : 'Failed'); }
                            }}
                          >
                            {ORDER_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </td>
                      </tr>
                      {expanded.includes(order.id) && (
                        <tr className="ad-expand-row">
                          <td colSpan={6}>
                            <div className="ad-order-detail">
                              <p><strong>Address:</strong> {order.shippingAddress}</p>
                              <table className="ad-inner-table">
                                <thead><tr><th>Product</th><th>Variation</th><th>Qty</th><th>Price</th></tr></thead>
                                <tbody>
                                  {(order.items || []).map(it => {
                                    const p = prodCache[it.productId] ?? (it.product as Product | null);
                                    const v = p?.variations?.find(v => v.id === it.variationId);
                                    return (
                                      <tr key={it.id}>
                                        <td>
                                          <div className="ad-prod-cell">
                                            {p?.mainImage && <img src={p.mainImage} alt={p.name} />}
                                            <span>{p?.name ?? it.productId}</span>
                                          </div>
                                        </td>
                                        <td>{it.variationName || (v ? `${v.name}: ${v.value}` : '—')}</td>
                                        <td>{it.quantity}</td>
                                        <td>{formatCurrency(it.priceAtOrder)}</td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                  {filteredOrders.length === 0 && (
                    <tr><td colSpan={6} className="ad-empty-row">No orders found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Products ── */}
        {!loading && tab === 'products' && (
          <>
            <div className="ad-form-card">
              <h3>{editProdId ? '✏️ Edit Product' : '+ Add New Product'}</h3>
              <form onSubmit={handleSaveProduct}>
                <div className="ad-form-row">
                  <div className="ad-fg">
                    <label>Product Name *</label>
                    <input required value={prodForm.name} onChange={e => setProdForm({ ...prodForm, name: e.target.value })} placeholder="e.g. Floral Cotton Kurti" />
                  </div>
                  <div className="ad-fg">
                    <label>Price (৳) *</label>
                    <input required type="number" min="0" step="1" value={prodForm.price} onChange={e => setProdForm({ ...prodForm, price: e.target.value })} placeholder="e.g. 850" />
                  </div>
                </div>
                <div className="ad-fg">
                  <label>Short Description *</label>
                  <input required value={prodForm.shortDescription} onChange={e => setProdForm({ ...prodForm, shortDescription: e.target.value })} placeholder="One line about the product" />
                </div>
                <div className="ad-fg">
                  <label>Full Description</label>
                  <textarea value={prodForm.description} onChange={e => setProdForm({ ...prodForm, description: e.target.value })} placeholder="Detailed description..." />
                </div>
                <div className="ad-form-row">
                  <div className="ad-fg">
                    <label>Category</label>
                    <select value={prodForm.categoryId} onChange={e => setProdForm({ ...prodForm, categoryId: e.target.value })}>
                      <option value="">No category</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                </div>
                <div className="ad-form-row">
                  <div className="ad-fg">
                    <label>Main Image {editProdId ? '(leave blank to keep current)' : '*'}</label>
                    {editProdId && existMainImg && (
                      <div className="ad-current-img">
                        <img src={existMainImg} alt="current" />
                        <span>Current image</span>
                      </div>
                    )}
                    <input type="file" accept="image/*" required={!editProdId} onChange={e => setMainImg(e.target.files?.[0] ?? null)} />
                  </div>
                  <div className="ad-fg">
                    <label>Additional Images (multiple)</label>
                    <input type="file" accept="image/*" multiple onChange={e => setSecImgs(e.target.files)} />
                  </div>
                </div>

                {/* Variations */}
                <div className="ad-variations-section">
                  <div className="ad-var-header">
                    <label>Variations (Size, Color, etc.)</label>
                    <button type="button" className="ad-btn-sm" onClick={() => setGroups(g => [...g, newGroup()])}>+ Add Group</button>
                  </div>
                  {groups.map(group => (
                    <div key={group.id} className="ad-var-group">
                      <div className="ad-form-row">
                        <div className="ad-fg">
                          <label>Group Name</label>
                          <input placeholder="e.g. Size / Color / Material"
                            value={group.name}
                            onChange={e => setGroups(gs => gs.map(g => g.id === group.id ? { ...g, name: e.target.value } : g))}
                          />
                        </div>
                        <div className="ad-fg" style={{ display: 'flex', alignItems: 'flex-end' }}>
                          <button type="button" className="ad-btn-danger-sm" onClick={() => setGroups(gs => gs.filter(g => g.id !== group.id))}>Remove Group</button>
                        </div>
                      </div>
                      {group.options.map((opt) => (
                        <div key={opt.id} className="ad-var-option-row">
                          <div className="ad-fg">
                            <label>Option Value</label>
                            <input placeholder="e.g. Red / XL / Cotton"
                              value={opt.value}
                              onChange={e => setGroups(gs => gs.map(g => g.id === group.id ? { ...g, options: g.options.map(o => o.id === opt.id ? { ...o, value: e.target.value } : o) } : g))}
                            />
                          </div>
                          <div className="ad-fg">
                            <label>Price Adjustment (৳)</label>
                            <input type="number" step="1" value={opt.priceAdded}
                              onChange={e => setGroups(gs => gs.map(g => g.id === group.id ? { ...g, options: g.options.map(o => o.id === opt.id ? { ...o, priceAdded: e.target.value } : o) } : g))}
                            />
                          </div>
                          <div className="ad-fg">
                            <label>Option Image (optional)</label>
                            {opt.imageUrl && <div className="ad-current-img"><img src={opt.imageUrl} alt={opt.value} /></div>}
                            <input type="file" accept="image/*"
                              onChange={e => setGroups(gs => gs.map(g => g.id === group.id ? { ...g, options: g.options.map(o => o.id === opt.id ? { ...o, image: e.target.files?.[0] ?? null } : o) } : g))}
                            />
                          </div>
                          <button type="button" className="ad-btn-danger-sm"
                            onClick={() => setGroups(gs => gs.map(g => g.id === group.id ? { ...g, options: g.options.length === 1 ? [newOpt()] : g.options.filter(o => o.id !== opt.id) } : g))}
                          >✕</button>
                        </div>
                      ))}
                      <button type="button" className="ad-btn-sm"
                        onClick={() => setGroups(gs => gs.map(g => g.id === group.id ? { ...g, options: [...g.options, newOpt()] } : g))}
                      >+ Add Option</button>
                    </div>
                  ))}
                </div>

                <div className="ad-form-actions">
                  <button type="submit" className="ad-btn-primary">
                    {editProdId ? 'Update Product' : 'Save Product'}
                  </button>
                  {editProdId && (
                    <button type="button" className="ad-btn-cancel"
                      onClick={() => { setEditProdId(null); setProdForm({ name: '', shortDescription: '', description: '', price: '', categoryId: '', isSignature: false }); setGroups([newGroup()]); setExistMainImg(null); }}
                    >Cancel</button>
                  )}
                </div>
              </form>
            </div>

            <div className="ad-table-wrap">
              <table className="ad-table">
                <thead><tr><th>Image</th><th>Name</th><th>Price</th><th>Category</th><th>Actions</th></tr></thead>
                <tbody>
                  {products.map(p => (
                    <tr key={p.id}>
                      <td><img src={p.mainImage} alt={p.name} className="ad-thumb" /></td>
                      <td className="ad-prod-name">{p.name}</td>
                      <td className="ad-amount">{formatCurrency(p.price)}</td>
                      <td>{p.category?.name ?? <span className="ad-muted">Unassigned</span>}</td>
                      <td className="ad-actions-cell">
                        <button className="ad-btn-edit" type="button" onClick={() => startEditProd(p)}>Edit</button>
                        <button className="ad-btn-del" type="button" onClick={async () => { try { await api.deleteProduct(p.id); flash('Deleted'); await loadData(); } catch (e) { setErr(e instanceof Error ? e.message : 'Error'); } }}>Delete</button>
                      </td>
                    </tr>
                  ))}
                  {products.length === 0 && <tr><td colSpan={5} className="ad-empty-row">No products yet.</td></tr>}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* ── Categories ── */}
        {!loading && tab === 'categories' && (
          <>
            <div className="ad-form-card">
              <h3>{editCatId ? '✏️ Edit Category' : '+ Add Category'}</h3>
              <form onSubmit={handleSaveCategory}>
                <div className="ad-form-row">
                  <div className="ad-fg">
                    <label>Category Name *</label>
                    <input required value={catName} onChange={e => setCatName(e.target.value)} placeholder="e.g. Kameez, Saree, Tops" />
                  </div>
                  <div className="ad-fg">
                    <label>Category Image {editCatId ? '(leave blank to keep)' : ''}</label>
                    {editCatId && existCatImg && <div className="ad-current-img"><img src={existCatImg} alt="current" /></div>}
                    <input type="file" accept="image/*" onChange={e => setCatImage(e.target.files?.[0] ?? null)} />
                  </div>
                </div>
                <div className="ad-form-actions">
                  <button type="submit" className="ad-btn-primary">{editCatId ? 'Update Category' : 'Save Category'}</button>
                  {editCatId && (
                    <button type="button" className="ad-btn-cancel"
                      onClick={() => { setEditCatId(null); setCatName(''); setCatImage(null); setExistCatImg(null); }}
                    >Cancel</button>
                  )}
                </div>
              </form>
            </div>

            <div className="ad-table-wrap">
              <table className="ad-table">
                <thead><tr><th>Image</th><th>Name</th><th>Products</th><th>Actions</th></tr></thead>
                <tbody>
                  {categories.map(c => (
                    <tr key={c.id}>
                      <td>{c.imageUrl ? <img src={c.imageUrl} alt={c.name} className="ad-thumb" /> : <span className="ad-muted">No image</span>}</td>
                      <td className="ad-prod-name">{c.name}</td>
                      <td>{c._count?.products ?? 0}</td>
                      <td className="ad-actions-cell">
                        <button className="ad-btn-edit" type="button" onClick={() => startEditCat(c)}>Edit</button>
                        <button className="ad-btn-del" type="button" onClick={async () => { try { await api.deleteCategory(c.id); flash('Deleted'); await loadData(); } catch (e) { setErr(e instanceof Error ? e.message : 'Error'); } }}>Delete</button>
                      </td>
                    </tr>
                  ))}
                  {categories.length === 0 && <tr><td colSpan={4} className="ad-empty-row">No categories yet.</td></tr>}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;

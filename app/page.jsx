'use client'
import { useState, useRef, useEffect } from 'react'
import { useCart }  from '@/context/CartContext'
import Navbar       from '@/components/Navbar'
import Footer       from '@/components/Footer'
import CartPanel    from '@/components/CartPanel'

function Toast({ msg, type }) {
  return msg ? <div className={`stock-toast show ${type}`}>{msg}</div> : null
}

function OrderNotif({ show, onClose }) {
  if (!show) return null
  return (
    <div style={{
      position: 'fixed', top: 80, left: '50%', transform: 'translateX(-50%)',
      background: 'linear-gradient(135deg,rgba(74,222,128,0.95),rgba(34,197,94,0.95))',
      backdropFilter: 'blur(12px)', border: '1px solid rgba(74,222,128,0.5)',
      borderRadius: 14, padding: '14px 18px', maxWidth: 500, width: '90%',
      boxShadow: '0 10px 40px rgba(74,222,128,0.35)', zIndex: 950,
      display: 'flex', alignItems: 'center', gap: 12,
      animation: 'slideDown 0.4s ease-out'
    }}>
      <span style={{ fontSize: '1.4rem', flexShrink: 0 }}>✅</span>
      <span style={{ color: '#fff', fontSize: 13, fontWeight: 500, lineHeight: 1.5, flex: 1 }}>
        Selamat datang! 🎉 Pilih menu favorit Anda dan tambahkan ke keranjang. Kami siap melayani! 🛒
      </span>
      <button
        onClick={onClose}
        style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', fontSize: '1.2rem', width: 28, height: 28, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >×</button>
      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateX(-50%) translateY(-20px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
    </div>
  )
}

export default function Home() {
  const { addToCart, setCartOpen } = useCart()
  const menuRef = useRef(null)

  const [products, setProducts]   = useState([])
  const [sembako, setSembako]     = useState([])
  const [loading, setLoading]     = useState(true)
  const [qtys, setQtys]           = useState({})
  const [selectedVariants, setSelectedVariants] = useState({})
  const [toast, setToast]         = useState({ msg: '', type: '' })
  const [showNotif, setShowNotif] = useState(false)

  // ── Ambil produk dan sembako dari API ────────────────────────────────
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [prodRes, sembakoRes] = await Promise.all([
          fetch('/api/products'),
          fetch('/api/sembako')
        ])
        
        const prodData = await prodRes.json()
        const sembakoData = await sembakoRes.json()
        
        if (Array.isArray(prodData)) {
          setProducts(prodData)
          setQtys(Object.fromEntries(prodData.map(p => [p.id, 1])))
        }
        
        if (Array.isArray(sembakoData)) {
          setSembako(sembakoData)
          // Set default selected variant untuk setiap sembako
          const defaultVariants = {}
          sembakoData.forEach(s => {
            if (s.variants && s.variants.length > 0) {
              defaultVariants[s.id] = 0 // index varian pertama
            }
          })
          setSelectedVariants(defaultVariants)
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // ── Auto-scroll ke menu saat page load ─────────────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => {
      menuRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      // Tampilkan notifikasi jika datang dari halaman lain
      if (typeof window !== 'undefined' && window.location.hash === '' && !sessionStorage.getItem('menuNotifShown')) {
        setShowNotif(true)
        sessionStorage.setItem('menuNotifShown', 'true')
        setTimeout(() => setShowNotif(false), 5000)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [loading])

  const showToast = (msg, type) => {
    setToast({ msg, type })
    setTimeout(() => setToast({ msg: '', type: '' }), 2500)
  }

  const changeQty = (id, delta) =>
    setQtys(prev => ({ ...prev, [id]: Math.max(1, (prev[id] || 1) + delta) }))

  const handleAdd = (product) => {
    if (!product.inStock) {
      showToast(`❌ Maaf, ${product.name} sedang habis!`, 'error')
      return
    }
    addToCart(product.name, product.price, product.unit, qtys[product.id] || 1)
    setQtys(prev => ({ ...prev, [product.id]: 1 }))
    showToast(`✅ ${product.name} ditambahkan ke keranjang!`, 'success')
    setCartOpen(true)
  }

  const handleAddSembako = (sembakoItem) => {
    if (!sembakoItem.inStock) {
      showToast(`❌ Maaf, ${sembakoItem.name} sedang habis!`, 'error')
      return
    }

    const variantIdx = selectedVariants[sembakoItem.id] || 0
    const selectedVariant = sembakoItem.variants[variantIdx]

    if (!selectedVariant) {
      showToast('❌ Pilih varian terlebih dahulu!', 'error')
      return
    }

    const qty = qtys[sembakoItem.id] || 1
    addToCart(
      `${sembakoItem.name} (${selectedVariant.size})`,
      selectedVariant.price,
      selectedVariant.size,
      qty
    )
    setQtys(prev => ({ ...prev, [sembakoItem.id]: 1 }))
    showToast(`✅ ${sembakoItem.name} ditambahkan ke keranjang!`, 'success')
    setCartOpen(true)
  }

  return (
    <div>
      <Navbar />
      <Toast msg={toast.msg} type={toast.type} />
      <OrderNotif show={showNotif} onClose={() => setShowNotif(false)} />

      {/* Hero */}
      <section className="hero">
        <div className="hero-bg" />
        <div className="hero-content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <img
            src="/assets/logo.png"
            alt="Logo HA BIBI SNACK CORNER"
            className="hero-logo"
            style={{ display: 'block', margin: '0 auto 1.2rem' }}
          />
          <h1 className="hero-title">HA BIBI SNACK CORNER</h1>
          <p className="hero-sub">Toko Sembako & Angkringan · Di Jamin Nagihh best 🔥</p>
        </div>
        <div className="hero-wave">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 80" preserveAspectRatio="none">
            <path className="wave-path" d="M0,50 C400,90 1040,10 1440,50 L1440,80 L0,80 Z" />
          </svg>
        </div>
      </section>

      {/* Banner */}
      <section className="banner-section">
        <div className="banner-wrapper">
          <img src="/assets/banner.png" alt="Banner HA BIBI SNACK CORNER" className="banner-img" />
        </div>
      </section>

      {/* Menu */}
      <div className="container" id="menuSection" ref={menuRef}>
        {/* ANGKRINGAN SECTION */}
        <div className="section-title">Angkringan <span>Pilihan</span> 🔥</div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>⏳ Memuat menu...</div>
        ) : products.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            Belum ada produk angkringan.
          </div>
        ) : (
          <div className="products">
            {products.map(p => (
              <div key={p.id} className={`product-card ${!p.inStock ? 'sold-out' : ''}`}>
                {/* Gambar dari Base64 atau placeholder */}
                {p.imgBase64
                  ? <img src={p.imgBase64} alt={p.name} className="product-image" />
                  : (
                    <div className="product-image" style={{ background: 'var(--bg-input)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem' }}>
                      🍡
                    </div>
                  )
                }

                <span className={`stock-badge ${p.inStock ? 'in-stock' : 'out-of-stock'}`}>
                  {p.inStock ? '✅ Stok Tersedia' : '❌ Stok Habis'}
                </span>

                <div className="product-info">
                  <div className="product-name">{p.name}</div>
                  <div className="product-desc">{p.desc}</div>
                  <div className="product-price">
                    Rp {Number(p.price).toLocaleString('id-ID')}
                    <span className="product-unit"> / {p.unit}</span>
                  </div>
                  <div className="card-action">
                    <div className="qty-control">
                      <button onClick={() => changeQty(p.id, -1)} disabled={!p.inStock}>−</button>
                      <span className="qty-value">{qtys[p.id] || 1}</span>
                      <button onClick={() => changeQty(p.id,  1)} disabled={!p.inStock}>+</button>
                    </div>
                    <button className="btn-order" disabled={!p.inStock} onClick={() => handleAdd(p)}>
                      {p.inStock ? '+ Keranjang' : 'Habis'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* SEMBAKO SECTION */}
        <div className="section-title" style={{ marginTop: '3rem' }}>Sembako <span>Terlengkap</span> 🛒</div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>⏳ Memuat menu...</div>
        ) : sembako.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            Belum ada produk sembako.
          </div>
        ) : (
          <div className="products">
            {sembako.map(s => (
              <div key={s.id} className={`product-card ${!s.inStock ? 'sold-out' : ''}`}>
                {/* Gambar dari Base64 atau placeholder */}
                {s.imgBase64
                  ? <img src={s.imgBase64} alt={s.name} className="product-image" />
                  : (
                    <div className="product-image" style={{ background: 'var(--bg-input)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem' }}>
                      🏪
                    </div>
                  )
                }

                <span className={`stock-badge ${s.inStock ? 'in-stock' : 'out-of-stock'}`}>
                  {s.inStock ? '✅ Stok Tersedia' : '❌ Stok Habis'}
                </span>

                <div className="product-info">
                  <div className="product-name">{s.name}</div>
                  <div className="product-desc">{s.desc}</div>
                  
                  {/* Varian Selector */}
                  <div style={{ marginBottom: '0.8rem' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '0.4rem', textTransform: 'uppercase' }}>
                      📏 Pilih Ukuran
                    </label>
                    <select
                      disabled={!s.inStock}
                      value={selectedVariants[s.id] || 0}
                      onChange={(e) => setSelectedVariants(prev => ({ ...prev, [s.id]: Number(e.target.value) }))}
                      style={{
                        width: '100%',
                        padding: '0.6rem 0.8rem',
                        borderRadius: '8px',
                        border: '1px solid var(--border-input)',
                        background: 'var(--bg-input)',
                        color: 'var(--text-main)',
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        cursor: s.inStock ? 'pointer' : 'not-allowed',
                        opacity: s.inStock ? 1 : 0.6,
                        fontFamily: 'Poppins, sans-serif'
                      }}
                    >
                      {s.variants?.map((v, idx) => (
                        <option key={idx} value={idx}>
                          {v.size} - Rp {Number(v.price).toLocaleString('id-ID')}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Harga dari varian terpilih */}
                  <div className="product-price">
                    Rp {Number(s.variants?.[selectedVariants[s.id] || 0]?.price || 0).toLocaleString('id-ID')}
                    <span className="product-unit"> / {s.variants?.[selectedVariants[s.id] || 0]?.size || ''}</span>
                  </div>

                  <div className="card-action">
                    <div className="qty-control">
                      <button onClick={() => changeQty(s.id, -1)} disabled={!s.inStock}>−</button>
                      <span className="qty-value">{qtys[s.id] || 1}</span>
                      <button onClick={() => changeQty(s.id,  1)} disabled={!s.inStock}>+</button>
                    </div>
                    <button className="btn-order" disabled={!s.inStock} onClick={() => handleAddSembako(s)}>
                      {s.inStock ? '+ Keranjang' : 'Habis'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Footer />
      <CartPanel />
    </div>
  )
}
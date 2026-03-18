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
  const [selectedFlavors, setSelectedFlavors] = useState({})
  const [productPrices, setProductPrices] = useState({})
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
          // Set default rasa = original untuk setiap produk
          const defaultFlavors = {}
          prodData.forEach(p => {
            defaultFlavors[p.id] = 'original'
          })
          setSelectedFlavors(defaultFlavors)
        }
        
        if (Array.isArray(sembakoData)) {
          setSembako(sembakoData)
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

  // ── ANGKRINGAN: Tambah dengan harga custom & rasa yang dipilih ──────────
  const handleAddProduct = (product) => {
    if (!product.inStock) {
      showToast(`❌ Maaf, ${product.name} sedang habis!`, 'error')
      return
    }

    const selectedRasa = selectedFlavors[product.id] || 'original'
    const customPrice = parseInt(productPrices[product.id]) || 0

    if (customPrice <= 0) {
      showToast('❌ Masukkan harga yang valid (minimal Rp 1.000)!', 'error')
      return
    }

    // Tambah dengan harga custom & rasa yang dipilih
    addToCart(
      `${product.name} (${selectedRasa === 'pedas' ? 'Pedas 🌶️' : 'Original 🍡'})`,
      customPrice,
      `Rp ${customPrice.toLocaleString('id-ID')}`,
      1  // Selalu 1 per klik
    )
    
    showToast(
      `✅ ${product.name} (${selectedRasa === 'pedas' ? 'Pedas' : 'Original'}) Rp ${customPrice.toLocaleString('id-ID')} ditambahkan!`,
      'success'
    )
    setCartOpen(true)
    
    // Reset harga
    setProductPrices(prev => ({ ...prev, [product.id]: '' }))
  }

  // ── SEMBAKO: Tambah dengan ukuran dari variants ──────────────────────────
  const handleAddSembako = (sembakoItem, variantIdx) => {
    if (!sembakoItem.inStock) {
      showToast(`❌ Maaf, ${sembakoItem.name} sedang habis!`, 'error')
      return
    }

    const selectedVariant = sembakoItem.variants[variantIdx]

    if (!selectedVariant) {
      showToast('❌ Pilih ukuran terlebih dahulu!', 'error')
      return
    }

    addToCart(
      `${sembakoItem.name} (${selectedVariant.size})`,
      selectedVariant.price,
      selectedVariant.size,
      1
    )
    
    showToast(`✅ ${sembakoItem.name} (${selectedVariant.size}) ditambahkan!`, 'success')
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
                  
                  {/* TOMBOL PILIH RASA */}
                  <div style={{ marginBottom: '0.8rem' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '0.6rem', textTransform: 'uppercase' }}>
                      🌶️ Pilih Rasa
                    </label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => setSelectedFlavors(prev => ({ ...prev, [p.id]: 'original' }))}
                        disabled={!p.inStock}
                        style={{
                          flex: 1,
                          padding: '0.6rem',
                          borderRadius: '8px',
                          border: selectedFlavors[p.id] === 'original' ? '2px solid #D4AF37' : '1px solid var(--border-input)',
                          background: selectedFlavors[p.id] === 'original' ? 'rgba(212,175,55,0.15)' : 'var(--bg-input)',
                          color: selectedFlavors[p.id] === 'original' ? '#D4AF37' : 'var(--text-main)',
                          fontWeight: 700,
                          fontSize: '0.875rem',
                          cursor: p.inStock ? 'pointer' : 'not-allowed',
                          opacity: p.inStock ? 1 : 0.6,
                          fontFamily: 'Poppins, sans-serif',
                          transition: 'all 0.3s ease'
                        }}
                      >
                        🍡 Original
                      </button>
                      <button
                        onClick={() => setSelectedFlavors(prev => ({ ...prev, [p.id]: 'pedas' }))}
                        disabled={!p.inStock}
                        style={{
                          flex: 1,
                          padding: '0.6rem',
                          borderRadius: '8px',
                          border: selectedFlavors[p.id] === 'pedas' ? '2px solid #f87171' : '1px solid var(--border-input)',
                          background: selectedFlavors[p.id] === 'pedas' ? 'rgba(248,113,113,0.15)' : 'var(--bg-input)',
                          color: selectedFlavors[p.id] === 'pedas' ? '#f87171' : 'var(--text-main)',
                          fontWeight: 700,
                          fontSize: '0.875rem',
                          cursor: p.inStock ? 'pointer' : 'not-allowed',
                          opacity: p.inStock ? 1 : 0.6,
                          fontFamily: 'Poppins, sans-serif',
                          transition: 'all 0.3s ease'
                        }}
                      >
                        🌶️ Pedas
                      </button>
                    </div>
                  </div>

                  {/* INPUT HARGA CUSTOM */}
                  <div style={{ marginBottom: '0.8rem' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '0.4rem', textTransform: 'uppercase' }}>
                      💰 Input Harga (Rp)
                    </label>
                    <input
                      type="number"
                      disabled={!p.inStock}
                      value={productPrices[p.id] || ''}
                      onChange={(e) => setProductPrices(prev => ({ ...prev, [p.id]: e.target.value }))}
                      placeholder="Contoh: 1000, 5000, 10000"
                      style={{
                        width: '100%',
                        padding: '0.6rem 0.8rem',
                        borderRadius: '8px',
                        border: '1px solid var(--border-input)',
                        background: 'var(--bg-input)',
                        color: 'var(--text-main)',
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        cursor: p.inStock ? 'text' : 'not-allowed',
                        opacity: p.inStock ? 1 : 0.6,
                        fontFamily: 'Poppins, sans-serif'
                      }}
                    />
                  </div>

                  {/* DISPLAY HARGA */}
                  {productPrices[p.id] && (
                    <div className="product-price">
                      Rp {Number(productPrices[p.id]).toLocaleString('id-ID')}
                      <span className="product-unit"> / {selectedFlavors[p.id] === 'pedas' ? 'Pedas 🌶️' : 'Original 🍡'}</span>
                    </div>
                  )}

                  <div className="card-action">
                    <div style={{ flex: 1 }}></div>
                    <button 
                      className="btn-order" 
                      disabled={!p.inStock} 
                      onClick={() => handleAddProduct(p)}
                      style={{ flex: 1 }}
                    >
                      {p.inStock ? '+ Keranjang' : 'Habis'}
                    </button>
                  </div>

                  {/* INFO */}
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.5rem', textAlign: 'center', fontStyle: 'italic' }}>
                    💡 Setiap klik = 1 bungkus dengan rasa & harga pilihan
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
                  
                  {/* VARIAN UKURAN BUTTONS */}
                  <div style={{ marginBottom: '0.8rem' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '0.6rem', textTransform: 'uppercase' }}>
                      📏 Pilih Ukuran
                    </label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {s.variants?.map((v, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleAddSembako(s, idx)}
                          disabled={!s.inStock}
                          style={{
                            padding: '0.6rem 0.8rem',
                            borderRadius: '8px',
                            border: '1px solid var(--border-input)',
                            background: 'var(--bg-input)',
                            color: 'var(--text-main)',
                            fontWeight: 700,
                            fontSize: '0.875rem',
                            cursor: s.inStock ? 'pointer' : 'not-allowed',
                            opacity: s.inStock ? 1 : 0.6,
                            fontFamily: 'Poppins, sans-serif',
                            transition: 'all 0.3s ease'
                          }}
                        >
                          {v.size} - Rp {Number(v.price).toLocaleString('id-ID')}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* INFO */}
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.5rem', textAlign: 'center', fontStyle: 'italic' }}>
                    💡 Setiap klik = 1 item dengan ukuran pilihan
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
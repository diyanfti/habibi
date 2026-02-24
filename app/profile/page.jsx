'use client'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

// ── Data Asal Usul & Rekomendasi (hardcode berdasarkan nama produk) ────────────
const PRODUCT_EXTRA = {
  'Cireng': {
    origin: 'Cireng atau "Aci digoreng" berasal dari tradisi kuliner Sunda. Dibuat dari adonan tepung tapioka yang dicampur bumbu, dibentuk tipis, lalu digoreng dengan minyak panas hingga mengembang dan renyah.',
    recommend: 'Cocok banget buat teman nongkrong! Renyahnya bikin nagih, sekali makan pasti nambah terus. Yuk cobain sebelum kehabisan! 🔥',
  },
  'Jihu': {
    origin: 'Jihu dibuat dari campuran tepung terigu dan tepung tapioka yang dibumbui, lalu dibentuk dan digoreng. Perpaduan dua tepung inilah yang menghasilkan tekstur khas yang tidak bisa kamu temukan di jajanan lain.',
    recommend: 'Mau camilan yang beda dari biasanya? Jihu jawabannya! Murah meriah, nagih, dan bikin hari-harimu makin seru. Jangan sampai kehabisan! 😋',
  },
  'Pentol Bakso Kecil': {
    origin: 'Pentol merupakan variasi bakso khas Jawa Timur. Dibuat dengan menggiling daging sapi halus, dicampur tepung tapioka dan bumbu rempah, lalu dibentuk bulat kecil dan direbus hingga matang sempurna.',
    recommend: '5 biji dengan harga terjangkau? Ini yang paling worth it! Gurih, kenyal, dan bikin perut happy. Pas banget buat teman ngobrol santai sore hari! ☕',
  },
  'Bakso': {
    origin: 'Bakso terinspirasi dari masakan Tionghoa yang kemudian berkembang menjadi kuliner khas Indonesia. Dibuat dari daging sapi segar yang digiling halus, dicampur tepung tapioka dan bumbu pilihan, dibentuk bulat lalu dimasak dalam kaldu sapi yang kaya rasa.',
    recommend: 'Hujan-hujanan atau lagi butuh penyemangat? Semangkuk bakso hangat dari HA BIBI SNACK CORNER adalah jawabannya! Kaldu gurihnya bikin ketagihan terus! 🍜',
  },
  'Pentol Tahu Daging': {
    origin: 'Tahu dipotong dan dibelah, lalu diisi dengan adonan daging sapi yang sudah dibumbui dengan bawang putih, merica, dan rempah pilihan. Kemudian dikukus atau digoreng hingga matang merata dan beraroma menggoda.',
    recommend: 'Suka tahu? Suka daging? Kenapa tidak keduanya sekaligus! Pentol tahu daging kami hadir untuk memanjakan lidahmu dengan cita rasa yang tidak akan kamu lupakan! 🤤',
  },
  'Tahu Walek': {
    origin: 'Tahu walek atau tahu balon adalah kreasi kuliner unik dari Jawa Timur. Tahu putih digoreng dalam minyak panas dengan teknik khusus sehingga kulit luarnya mengembang, menciptakan rongga di dalam yang renyah dan unik.',
    recommend: 'Penasaran dengan tahu yang bisa mengembang seperti balon? Kriuk di luar, lembut di dalam — murah tapi premium rasanya! Jangan kehabisan ya! 🎈',
  },
}

// Fallback jika nama produk tidak ada di mapping
const getExtra = (name) => PRODUCT_EXTRA[name] || {
  origin: 'Produk ini dibuat dengan bahan-bahan pilihan berkualitas tinggi oleh HA BIBI SNACK CORNER.',
  recommend: 'Produk pilihan kami dibuat dengan penuh cinta dan bahan berkualitas. Yuk segera pesan sebelum kehabisan! 🔥',
}

// ── Slideshow ─────────────────────────────────────────────────────────────────
function Slideshow({ images }) {
  const [cur, setCur]       = useState(0)
  const [paused, setPaused] = useState(false)
  const [prog, setProg]     = useState(0)
  const timerRef  = useRef(null)
  const progRef   = useRef(null)
  const touchX    = useRef(0)
  const DURATION  = 3000
  const isSolo    = images.length <= 1

  useEffect(() => {
    if (isSolo || paused) return
    setProg(0)
    const start = Date.now()
    progRef.current = setInterval(() =>
      setProg(Math.min(((Date.now() - start) / DURATION) * 100, 100)), 50)
    timerRef.current = setTimeout(() => setCur(p => (p + 1) % images.length), DURATION)
    return () => { clearTimeout(timerRef.current); clearInterval(progRef.current) }
  }, [cur, paused, isSolo, images.length])

  const goTo = idx => { setCur(((idx % images.length) + images.length) % images.length); setProg(0) }

  return (
    <div
      className="prod-slideshow"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={e => { touchX.current = e.touches[0].clientX }}
      onTouchEnd={e => {
        const diff = e.changedTouches[0].clientX - touchX.current
        if (Math.abs(diff) > 40) goTo(cur + (diff < 0 ? 1 : -1))
      }}
    >
      <div className="prod-slide-track" style={{ transform: `translateX(-${cur * 100}%)` }}>
        {images.map((src, i) => <img key={i} src={src} alt={`Foto ${i + 1}`} draggable={false} />)}
      </div>
      {!isSolo && <div className="prod-progress-bar" style={{ width: `${prog}%` }} />}
      {!isSolo && (
        <div className="prod-slide-dots">
          {images.map((_, i) => (
            <button key={i} className={`prod-slide-dot${i === cur ? ' active' : ''}`} onClick={() => goTo(i)} />
          ))}
        </div>
      )}
    </div>
  )
}

// ── Modal Produk ──────────────────────────────────────────────────────────────
function ProductModal({ product, index, total, onClose, onPrev, onNext, onGoTo, onOrder }) {
  useEffect(() => {
    const handler = e => {
      if (e.key === 'Escape')     onClose()
      if (e.key === 'ArrowRight') onNext()
      if (e.key === 'ArrowLeft')  onPrev()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose, onNext, onPrev])

  const images = product.imgBase64 ? [product.imgBase64] : []
  const extra  = getExtra(product.name)

  return (
    <div className="prod-modal-overlay active" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="prod-modal-box">

        <button className="prod-modal-close-btn" onClick={onClose}>×</button>

        {/* Slideshow atau placeholder */}
        {images.length > 0
          ? <Slideshow key={product.id} images={images} />
          : (
            <div className="prod-slideshow" style={{ background: 'var(--bg-input)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '4rem', borderRadius: '22px 22px 0 0' }}>
              🍡
            </div>
          )
        }

        {/* Navigasi produk */}
        <div className="prod-nav-row">
          <button className="prod-arrow-btn" onClick={onPrev}>‹</button>
          <div className="prod-nav-center">
            <div className="prod-dots-row">
              {Array.from({ length: total }).map((_, i) => (
                <button key={i} className={`prod-dot-btn${i === index ? ' active' : ''}`} onClick={() => onGoTo(i)} />
              ))}
            </div>
            <div className="prod-counter">{index + 1} / {total}</div>
          </div>
          <button className="prod-arrow-btn" onClick={onNext}>›</button>
        </div>

        {/* Body */}
        <div className="prod-modal-body">
          {/* Nama & Harga */}
          <div className="prod-modal-name-row">
            <h3 className="prod-modal-name">{product.name}</h3>
            <span className="prod-modal-price">Rp {Number(product.price).toLocaleString('id-ID')} / {product.unit}</span>
          </div>

          {/* Deskripsi singkat */}
          <p className="prod-modal-desc">{product.desc || 'Produk segar pilihan HA BIBI SNACK CORNER.'}</p>

          {/* Asal Usul / Cara Pembuatan */}
          <div className="prod-modal-origin-box">
            <p style={{ fontWeight: 700, marginBottom: '0.4rem' }}>📖 Asal Usul / Cara Pembuatan</p>
            <p>{extra.origin}</p>
          </div>

          {/* Rekomendasi */}
          <div className="prod-modal-recommend-box">
            <p>✨ {extra.recommend}</p>
          </div>

          {/* Status stok */}
          <div style={{
            marginTop: '0.6rem',
            padding: '8px 12px',
            borderRadius: 10,
            fontSize: 13,
            fontWeight: 600,
            background: product.inStock ? 'rgba(74,222,128,0.1)' : 'rgba(248,113,113,0.1)',
            color: product.inStock ? '#4ade80' : '#f87171',
            border: `1px solid ${product.inStock ? 'rgba(74,222,128,0.3)' : 'rgba(248,113,113,0.3)'}`,
          }}>
            {product.inStock
              ? '✅ Tersedia sekarang! Yuk segera pesan sebelum kehabisan 🔥'
              : '❌ Maaf, produk ini sedang habis. Cek kembali nanti ya!'}
          </div>
        </div>

        <button className="prod-modal-order-btn" onClick={onOrder}>🛒 Pesan Sekarang</button>
      </div>
    </div>
  )
}

// ── Section Label ─────────────────────────────────────────────────────────────
function SectionLabel({ icon, title }) {
  return (
    <div style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px', color: 'var(--grad-a)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: 6 }}>
      {icon} {title}
      <span style={{ flex: 1, height: 1, background: 'var(--border)', display: 'block' }} />
    </div>
  )
}

// ── Halaman Profile ───────────────────────────────────────────────────────────
export default function Profile() {
  const router = useRouter()
  const [products, setProducts]   = useState([])
  const [activeIdx, setActiveIdx] = useState(null)

  useEffect(() => {
    fetch('/api/products')
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setProducts(data) })
      .catch(console.error)
  }, [])

  const goToMenu     = () => router.push('/')
  const closeProduct = () => setActiveIdx(null)
  const prevProduct  = () => setActiveIdx(p => ((p - 1) + products.length) % products.length)
  const nextProduct  = () => setActiveIdx(p => (p + 1) % products.length)

  return (
    <div>
      <Navbar />

      {activeIdx !== null && products[activeIdx] && (
        <ProductModal
          product={products[activeIdx]}
          index={activeIdx}
          total={products.length}
          onClose={closeProduct}
          onPrev={prevProduct}
          onNext={nextProduct}
          onGoTo={setActiveIdx}
          onOrder={goToMenu}
        />
      )}

      {/* Hero */}
      <section className="hero">
        <div className="hero-bg" />
        <div className="hero-content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <img src="/assets/logo.png" alt="Logo" className="hero-logo" style={{ display: 'block', margin: '0 auto 1.2rem' }} />
          <h1 className="hero-title">HA BIBI SNACK CORNER</h1>
          <p className="hero-sub">Toko Sembako & Angkringan · Di Jamin Nagihh best 🔥</p>
          <button className="btn-wa-hero" onClick={goToMenu}>🛒 Pesan Sekarang</button>
        </div>
        <div className="hero-wave">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 80" preserveAspectRatio="none">
            <path className="wave-path" d="M0,50 C400,90 1040,10 1440,50 L1440,80 L0,80 Z" />
          </svg>
        </div>
      </section>

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '2rem 1.5rem 4rem' }}>

        {/* Tentang Kami */}
        <section style={{ marginBottom: '3rem' }}>
          <SectionLabel icon="✨" title="Tentang Kami" />
          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 18, padding: '1.8rem' }}>
            <div style={{ fontSize: '3rem', flexShrink: 0 }}>🏪</div>
            <div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.8rem' }}>Selamat Datang di HA BIBI SNACK CORNER!</h2>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-desc)', lineHeight: 1.75, marginBottom: '0.6rem' }}>
                HA BIBI SNACK CORNER adalah toko sembako dan angkringan yang dikelola oleh <strong>Ibu Siti</strong>, hadir untuk memenuhi kebutuhan sehari-hari masyarakat sekitar dengan harga terjangkau dan produk berkualitas.
              </p>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-desc)', lineHeight: 1.75, marginBottom: '0.6rem' }}>
                Kami menyediakan berbagai jajanan angkringan seperti cireng, jihu, pentol, bakso, tahu walek, dan masih banyak lagi — semua dibuat dengan cita rasa yang nagih! 😋
              </p>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-desc)', lineHeight: 1.75 }}>
                Dengan semangat melayani 24 jam, kami siap memenuhi pesananmu kapan saja. <em>Di Jamin Nagihh best!</em>
              </p>
            </div>
          </div>
        </section>

        {/* Info Toko */}
        <section style={{ marginBottom: '3rem' }}>
          <SectionLabel icon="📋" title="Informasi Toko" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: '1rem' }}>
            {[
              { icon: '👩‍💼', title: 'Pemilik',          value: 'Ibu Siti' },
              { icon: '🕐',   title: 'Jam Operasional', value: 'Buka 24 Jam', badge: '● Buka Sekarang' },
              { icon: '📍',   title: 'Alamat',           value: 'Sumber Pinang, Kec. Mlandingan', sub: 'Kab. Situbondo, Jawa Timur' },
              { icon: '📱',   title: 'WhatsApp',         value: '083852930872', badge: '● Kontak WA', onClick: goToMenu },
            ].map((c, i) => (
              <div key={i} onClick={c.onClick} style={{ background: 'linear-gradient(135deg,rgba(124,58,237,0.08),rgba(37,99,235,0.08))', border: '1px solid rgba(124,58,237,0.25)', borderRadius: 16, padding: '1.3rem', display: 'flex', alignItems: 'flex-start', gap: 12, cursor: c.onClick ? 'pointer' : 'default' }}>
                <div style={{ fontSize: '1.8rem', flexShrink: 0 }}>{c.icon}</div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 3 }}>{c.title}</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: 5 }}>{c.value}</div>
                  {c.sub   && <div style={{ fontSize: 11, color: 'var(--text-desc)' }}>{c.sub}</div>}
                  {c.badge && <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 50, fontSize: 11, fontWeight: 600, background: 'rgba(74,222,128,0.15)', color: '#4ade80' }}>{c.badge}</span>}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Galeri Produk */}
        <section style={{ marginBottom: '3rem' }}>
          <SectionLabel icon="📸" title="Galeri Produk" />
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: '1.2rem' }}>Klik salah satu produk untuk melihat detail lengkapnya 👇</p>

          {products.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>⏳ Memuat produk...</div>
          ) : (
            <div className="profile-gallery-grid">
              {products.map((p, i) => (
                <div key={p.id} className="gallery-card" onClick={() => setActiveIdx(i)}>
                  <div className="gallery-card-img-wrap">
                    {p.imgBase64
                      ? <img src={p.imgBase64} alt={p.name} />
                      : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', background: 'var(--bg-input)' }}>🍡</div>
                    }
                    <div className="gallery-card-overlay">🔍</div>
                  </div>
                  <div className="gallery-card-body">
                    <div className="gallery-card-name">{p.name}</div>
                    <div className="gallery-card-desc">{p.desc}</div>
                    <div className="gallery-card-price">
                      Rp {Number(p.price).toLocaleString('id-ID')}
                      <span className="gallery-card-unit"> / {p.unit}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={{ textAlign: 'center', marginTop: '1.4rem' }}>
            <button onClick={goToMenu} style={{ padding: '10px 26px', background: 'linear-gradient(135deg,var(--grad-a),var(--grad-b))', color: '#fff', border: 'none', borderRadius: 50, fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'Poppins,sans-serif' }}>
              🛒 Lihat Semua Menu & Pesan
            </button>
          </div>
        </section>

        {/* Lokasi */}
        <section style={{ marginBottom: '3rem' }}>
          <SectionLabel icon="🗺️" title="Lokasi Toko" />
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 18, overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '1.2rem 1.5rem', borderBottom: '1px solid var(--border)', fontSize: 13, color: 'var(--text-sub)' }}>
              <span style={{ fontSize: '1.5rem', flexShrink: 0 }}>📍</span>
              <div>
                <strong style={{ display: 'block', color: 'var(--text-main)', fontSize: 14, marginBottom: 2 }}>HA BIBI SNACK CORNER</strong>
                Sumber Pinang, Kec. Mlandingan, Kab. Situbondo, Jawa Timur
              </div>
            </div>
            <iframe
              src="https://maps.google.com/maps?q=Sumber+Pinang+Mlandingan+Situbondo+Jawa+Timur&output=embed&z=15"
              width="100%" height="300"
              style={{ border: 0, display: 'block' }}
              allowFullScreen loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
            <a
              href="https://maps.google.com/?q=Sumber+Pinang+Mlandingan+Situbondo"
              target="_blank" rel="noreferrer"
              style={{ display: 'block', textAlign: 'center', padding: 13, background: 'linear-gradient(135deg,var(--grad-a),var(--grad-b))', color: '#fff', textDecoration: 'none', fontWeight: 700, fontSize: 14 }}
            >
              🗺️ Buka di Google Maps
            </a>
          </div>
        </section>

        {/* CTA */}
        <section>
          <div style={{ background: 'linear-gradient(135deg,rgba(124,58,237,0.15),rgba(37,99,235,0.15))', border: '1px solid rgba(124,58,237,0.3)', borderRadius: 20, padding: '2.5rem', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '0.8rem' }}>🛍️</div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.5rem' }}>Yuk, Pesan Sekarang!</h2>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-sub)', marginBottom: '1.5rem' }}>Lapar? Butuh jajanan nagih? Kami siap melayani 24 jam!</p>
            <button onClick={goToMenu} style={{ padding: '12px 28px', background: 'rgba(124,58,237,0.12)', color: 'var(--text-main)', border: '1.5px solid rgba(124,58,237,0.3)', borderRadius: 50, fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'Poppins,sans-serif' }}>
              🛒 Pesan Sekarang
            </button>
          </div>
        </section>

      </div>
      <Footer />
    </div>
  )
}
'use client'
import { useState }    from 'react'
import { useRouter }   from 'next/navigation'

export default function Footer() {
  const router = useRouter()
  const [tapCount, setTapCount] = useState(0)
  const [showBtn, setShowBtn]   = useState(false)

  const handleSecretTap = () => {
    const next = tapCount + 1
    setTapCount(next)
    if (next >= 5) { setShowBtn(true); setTapCount(0) }
  }

  return (
    <footer className="site-footer">
      <div className="footer-logo">
        <img src="/assets/logo.png" alt="Logo" className="footer-logo-img" />
        <span>HA BIBI SNACK CORNER</span>
      </div>

      <p className="footer-addr">📍 Sumber Pinang, Mlandingan, Situbondo, Jawa Timur</p>

      <p
        className="footer-copy"
        onClick={handleSecretTap}
        style={{ cursor: 'default', userSelect: 'none' }}
      >
        © 2026 HA BIBI SNACK CORNER · Ibu Siti · All rights reserved
      </p>

      {/* Tombol Admin tersembunyi — muncul setelah klik copyright 5x */}
      {showBtn && (
        <div style={{ marginTop: '1rem' }}>
          <button
            onClick={() => router.push('/admin')}
            style={{
              padding: '7px 20px', background: 'transparent',
              border: '1px solid rgba(167,139,250,0.35)', borderRadius: 50,
              color: 'var(--grad-a)', fontSize: 12, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'Poppins, sans-serif',
            }}
          >
            🔐 Admin Panel
          </button>
        </div>
      )}
    </footer>
  )
}
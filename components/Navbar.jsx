'use client'
import Link        from 'next/link'
import { usePathname } from 'next/navigation'
import { useCart } from '@/context/CartContext'

export default function Navbar() {
  const { getTotalQty, setCartOpen, theme, toggleTheme } = useCart()
  const pathname = usePathname()

  return (
    <nav className="navbar">
      <div className="nav-inner">

        {/* Logo */}
        <Link href="/" className="nav-logo">
          <img src="/assets/logo.png" alt="Logo HA BIBI SNACK CORNER" className="nav-logo-img" />
        </Link>

        {/* Links Tengah */}
        <div className="nav-links">
          <Link href="/"        className={`nav-link ${pathname === '/'        ? 'active' : ''}`}>🛍️ Menu</Link>
          <Link href="/profile" className={`nav-link ${pathname === '/profile' ? 'active' : ''}`}>👤 Profil</Link>
        </div>

        {/* Aksi Kanan */}
        <div className="header-actions">
          <button className="btn-theme" onClick={toggleTheme} title="Ganti Tema">
            {theme === 'dark' ? '🌙' : '☀️'}
          </button>
          {pathname === '/' && (
            <button className="btn-cart" onClick={() => setCartOpen(true)}>
              🛒 <span className="cart-text">Keranjang</span>
              <span className="cart-badge">{getTotalQty()}</span>
            </button>
          )}
        </div>

      </div>
    </nav>
  )
}
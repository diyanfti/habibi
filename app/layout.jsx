import './globals.css'
import { CartProvider } from '@/context/CartContext'

export const metadata = {
  title:       'HA BIBI SNACK CORNER',
  description: 'Toko Sembako & Angkringan · Di Jamin Nagihh best 🔥',
}

export default function RootLayout({ children }) {
  return (
    <html lang="id" data-theme="light">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        {/* Leaflet CSS untuk peta di CartPanel */}
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        />
      </head>
      <body>
        <CartProvider>
          {children}
        </CartProvider>
        {/* Leaflet JS — harus setelah body */}
        <script
          src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
          defer
        />
      </body>
    </html>
  )
}
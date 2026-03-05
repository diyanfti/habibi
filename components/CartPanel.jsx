'use client'
import { useState, useRef, useEffect } from 'react'
import { useCart, ONGKIR, NOMOR_WA, MAX_KM, TOKO_LAT, TOKO_LNG } from '@/context/CartContext'

function getDistance(lat1, lng1, lat2, lng2) {
  const R    = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a    = Math.sin(dLat/2)**2
              + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLng/2)**2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
}

function Toast({ msg, type }) {
  return msg ? <div className={`stock-toast show ${type}`}>{msg}</div> : null
}

export default function CartPanel() {
  const {
    cart, removeFromCart, changeQty, getSubtotal,
    cartOpen, setCartOpen,
    qrisPaid, setQrisPaid, qrisShown, setQrisShown,
    qrisOpen, setQrisOpen, pendingMsg, setPendingMsg,
    resetCart,
  } = useCart()

  const [delivery, setDelivery]   = useState('ambil')
  const [payment, setPayment]     = useState('COD')
  const [nama, setNama]           = useState('')
  const [email, setEmail]         = useState('')
  const [catatan, setCatatan]     = useState('')
  const [mapsLink, setMapsLink]   = useState('')
  const [locStatus, setLocStatus] = useState('')
  const [locClass, setLocClass]   = useState('')
  const [toast, setToast]         = useState({ msg: '', type: '' })
  const [userLat, setUserLat]     = useState(null)
  const [userLng, setUserLng]     = useState(null)

  const mapRef     = useRef(null)
  const leafletMap = useRef(null)
  const userMarker = useRef(null)

  const subtotal = getSubtotal()
  const grand    = subtotal + (delivery === 'antar' ? ONGKIR : 0)

  const showToast = (msg, type) => {
    setToast({ msg, type })
    setTimeout(() => setToast({ msg: '', type: '' }), 2500)
  }

  // ── Init Leaflet ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (delivery !== 'antar') {
      if (leafletMap.current) {
        leafletMap.current.remove()
        leafletMap.current = null
        userMarker.current = null
      }
      return
    }
    if (!window.L || leafletMap.current) return
    setTimeout(() => {
      if (!mapRef.current || leafletMap.current) return
      const m = window.L.map(mapRef.current).setView([TOKO_LAT, TOKO_LNG], 15)
      window.L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        { attribution: '© Esri', maxZoom: 18 }
      ).addTo(m)
      window.L.marker([TOKO_LAT, TOKO_LNG]).addTo(m).bindPopup('🏪 HA BIBI SNACK CORNER')
      m.on('click', e => selectFromMap(e.latlng.lat, e.latlng.lng, m))
      leafletMap.current = m
    }, 200)
  }, [delivery])

  const selectFromMap = (lat, lng, m) => {
    const map  = m || leafletMap.current
    const dist = getDistance(lat, lng, TOKO_LAT, TOKO_LNG)
    if (dist > MAX_KM) {
      setLocStatus(`❌ Lokasi ${dist.toFixed(1)} km dari toko. Max ${MAX_KM} km.`)
      setLocClass('error')
      setUserLat(null); setUserLng(null)
      if (userMarker.current) { map.removeLayer(userMarker.current); userMarker.current = null }
    } else {
      setUserLat(lat); setUserLng(lng)
      setLocStatus(`✅ Jarak ±${dist.toFixed(2)} km dari toko.`)
      setLocClass('success')
      setMapsLink(`https://maps.google.com/?q=${lat},${lng}`)
      if (userMarker.current) userMarker.current.setLatLng([lat, lng])
      else userMarker.current = window.L.marker([lat, lng]).addTo(map).bindPopup('📍 Lokasi Anda')
      map.fitBounds(window.L.latLngBounds([[TOKO_LAT, TOKO_LNG], [lat, lng]]), { padding: [50, 50] })
    }
  }

  const getLocation = () => {
    setLocStatus('⏳ Mendapatkan lokasi...'); setLocClass('')
    if (!navigator.geolocation) { setLocStatus('❌ Browser tidak mendukung geolocation'); return }
    navigator.geolocation.getCurrentPosition(
      pos => {
        const { latitude: lat, longitude: lng } = pos.coords
        const dist = getDistance(lat, lng, TOKO_LAT, TOKO_LNG)
        if (dist > MAX_KM) {
          setLocStatus(`❌ Lokasi ${dist.toFixed(1)} km dari toko. Max ${MAX_KM} km.`)
          setLocClass('error')
        } else {
          setUserLat(lat); setUserLng(lng)
          setLocStatus(`✅ Jarak ±${dist.toFixed(2)} km dari toko.`)
          setLocClass('success')
          setMapsLink(`https://maps.google.com/?q=${lat},${lng}`)
          if (leafletMap.current) selectFromMap(lat, lng, leafletMap.current)
        }
      },
      () => { setLocStatus('❌ Gagal. Paste link Google Maps manual.'); setLocClass('error') }
    )
  }

  // ── Simpan pesanan ke database ────────────────────────────────────────────────
  const saveOrder = async () => {
    try {
      await fetch('/api/orders', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          nama,
          email:      email || null,
          pengiriman: delivery,
          pembayaran: payment,
          lokasi:     mapsLink || null,
          catatan:    catatan  || null,
          total:      grand,
          items:      cart.map(i => ({ name: i.name, price: i.price, qty: i.qty, unit: i.unit })),
        }),
      })
    } catch (e) {
      console.error('Gagal menyimpan pesanan:', e)
    }
  }

  // ── Bangun pesan WA ───────────────────────────────────────────────────────────
  const buildMessage = () => {
    let pesanItems = ''
    cart.forEach((item, i) => {
      pesanItems += `${i+1}. ${item.name} ${item.qty}× (${item.unit}) = Rp ${(item.price*item.qty).toLocaleString('id-ID')}\n`
    })
    const isAntar = delivery === 'antar'
    let pesan = `🛍️ *PESANAN HA BIBI SNACK CORNER*\n\n`
              + `👤 Nama      : ${nama}\n`
              + `🚚 Pengiriman: ${isAntar ? 'Antar ke Rumah' : 'Ambil Sendiri'}\n`
              + `💳 Pembayaran: ${payment}\n\n`
              + `📦 *Detail Pesanan:*\n${pesanItems}`
    if (isAntar) pesan += `🛵 Ongkir      : Rp ${ONGKIR.toLocaleString('id-ID')}\n📍 Lokasi      : ${mapsLink}\n`
    pesan += `\n💰 *Total Bayar: Rp ${grand.toLocaleString('id-ID')}*`
    if (catatan) pesan += `\n\n📝 Catatan: ${catatan}`
    return pesan
  }

  const doSendWA = async (msg) => {
    let m = msg || pendingMsg
    if (payment === 'QRIS' && qrisPaid) m += '\n\n✅ Pembayaran: Sudah dilakukan via QRIS'
    await saveOrder()
    window.open(`https://wa.me/${NOMOR_WA}?text=${encodeURIComponent(m)}`, '_blank')
    resetCart()
    setDelivery('ambil'); setPayment('COD'); setNama(''); setCatatan('')
    setMapsLink(''); setLocStatus(''); setLocClass('')
    setUserLat(null); setUserLng(null)
    showToast('🎉 Pesanan berhasil dikirim!', 'success')
  }

  const handleOrder = () => {
    if (cart.length === 0)               { alert('Keranjang masih kosong!'); return }
    if (!nama.trim())                    { alert('Mohon isi nama pemesan!'); return }
    if (delivery === 'antar' && !mapsLink) { alert('Mohon dapatkan lokasi atau paste link Google Maps!'); return }
    const msg = buildMessage()
    if (payment === 'QRIS') {
      if (qrisPaid) { doSendWA(msg); return }
      setPendingMsg(msg); setQrisShown(true); setQrisOpen(true); setCartOpen(false)
    } else {
      doSendWA(msg)
    }
  }

  return (
    <>
      <Toast msg={toast.msg} type={toast.type} />

      {/* Overlay */}
      <div
        className={`overlay ${cartOpen || qrisOpen ? 'active' : ''}`}
        onClick={() => { setCartOpen(false); setQrisOpen(false) }}
      />

      {/* ── Cart Panel ── */}
      <div className={`cart-panel ${cartOpen ? 'active' : ''}`}>
        <div className="cart-header">
          <h2>🛒 Keranjang Belanja</h2>
          <button className="close-btn" onClick={() => setCartOpen(false)}>×</button>
        </div>

        <div className="cart-items">
          {cart.length === 0
            ? <p className="cart-empty">Keranjang masih kosong</p>
            : cart.map(item => (
              <div key={item.name} className="cart-item">
                <div className="cart-item-name">
                  {item.name}
                  <span className="cart-item-unit">{item.qty} × {item.unit}</span>
                </div>
                <div className="cart-item-controls">
                  <button onClick={() => changeQty(item.name, -1)}>−</button>
                  <span>{item.qty}</span>
                  <button onClick={() => changeQty(item.name, 1)}>+</button>
                </div>
                <div className="cart-item-price">Rp {(item.price * item.qty).toLocaleString('id-ID')}</div>
                <button className="cart-item-remove" onClick={() => removeFromCart(item.name)}>🗑</button>
              </div>
            ))
          }
        </div>

        {cart.length > 0 && (
          <div className="cart-footer">
            <div className="cart-total">Subtotal: <strong>Rp {subtotal.toLocaleString('id-ID')}</strong></div>

            {/* Pengiriman */}
            <div className="form-group">
              <label>Metode Pengiriman</label>
              <div className="delivery-options">
                {['ambil', 'antar'].map(v => (
                  <label key={v} className={`delivery-opt ${delivery === v ? 'selected' : ''}`}>
                    <input
                      type="radio" name="delivery" value={v}
                      checked={delivery === v}
                      onChange={e => setDelivery(e.target.value)}
                    />
                    {v === 'ambil'
                      ? '🏪 Ambil Sendiri'
                      : <span>🛵 Antar ke Rumah <small>(+Rp 1.000)</small></span>
                    }
                  </label>
                ))}
              </div>
            </div>

            {/* Peta lokasi (hanya jika antar) */}
            {delivery === 'antar' && (
              <div className="form-group">
                <label>📍 Lokasi Kamu</label>
                <button className="btn-maps" onClick={getLocation}>📌 Dapatkan Lokasi Saya</button>
                <div className={`location-status ${locClass}`}>{locStatus}</div>
                <div style={{ marginTop: 12 }}>
                  <div ref={mapRef} style={{ height: 300, borderRadius: 8, border: '1px solid var(--border)' }} />
                </div>
                <input
                  style={{ width:'100%', marginTop:8, padding:'9px 11px', background:'var(--bg-input)', border:'1.5px solid var(--border-input)', borderRadius:9, fontSize:13, color:'var(--text-main)', fontFamily:'Poppins,sans-serif', boxSizing:'border-box' }}
                  value={mapsLink}
                  onChange={e => setMapsLink(e.target.value)}
                  placeholder="Atau paste link Google Maps kamu"
                />
                <small className="location-note">⚠️ Pengiriman hanya dalam radius 1 km dari toko</small>
              </div>
            )}

            {delivery === 'antar' && (
              <div className="ongkir-info">🛵 Ongkir: <strong>Rp 1.000</strong></div>
            )}

            <div className="grand-total-box">
              Total Bayar: <strong>Rp {grand.toLocaleString('id-ID')}</strong>
            </div>

            {/* Nama */}
            <div className="form-group">
              <label>Nama Pemesan *</label>
              <input value={nama} onChange={e => setNama(e.target.value)} placeholder="Masukkan nama kamu" />
            </div>

            {/* Email */}
            <div className="form-group">
              <label>📧 Email</label>
              <input 
                type="email"
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                placeholder="email@gmail.com" 
              />
            </div>

            {/* Pembayaran */}
            <div className="form-group">
              <label>Metode Pembayaran</label>
              <div className="delivery-options">
                {['COD', 'QRIS'].map(v => (
                  <label key={v} className={`delivery-opt ${payment === v ? 'selected' : ''}`}>
                    <input
                      type="radio" name="payment" value={v}
                      checked={payment === v}
                      onChange={e => setPayment(e.target.value)}
                    />
                    {v === 'COD' ? '💵 COD (Bayar di Tempat)' : '📱 QRIS'}
                  </label>
                ))}
              </div>
            </div>

            {/* Catatan */}
            <div className="form-group">
              <label>Catatan (Opsional)</label>
              <textarea
                rows={2} value={catatan}
                onChange={e => setCatatan(e.target.value)}
                placeholder="Contoh: jangan pedas, tambah saos, dll"
              />
            </div>

            <button
              className="btn-wa-order"
              disabled={payment === 'QRIS' && qrisShown && !qrisPaid}
              onClick={handleOrder}
            >
              📲 Pesan via WhatsApp
            </button>
          </div>
        )}
      </div>

      {/* ── Modal QRIS ── */}
      <div className={`modal ${qrisOpen ? 'active' : ''}`}>
        <div className="modal-content">
          <div className="modal-header">
            <h2>📱 Pembayaran QRIS</h2>
            <button className="close-btn" onClick={() => { setQrisOpen(false); setQrisPaid(false); setQrisShown(false) }}>×</button>
          </div>
          <p className="qris-info">Scan QR di bawah untuk melakukan pembayaran</p>
          <img src="/assets/QRIS.jpeg" alt="QRIS" className="qris-img" />
          <p className="qris-amount">Total: <strong>Rp {grand.toLocaleString('id-ID')}</strong></p>
          <p className="qris-note">Setelah bayar, pesananmu akan segera kami proses! 🎉</p>
          <div className="qris-actions">
            <a className="qris-download" href="/assets/QRIS.jpeg" download>⬇️ Unduh QRIS</a>
            <label className="qris-confirm">
              <input
                type="checkbox" checked={qrisPaid}
                onChange={e => { setQrisPaid(e.target.checked); if (e.target.checked) setQrisShown(false) }}
              />
              <span>Saya sudah membayar</span>
            </label>
          </div>
          <button
            id="qrisContinueBtn"
            className="btn-wa-order"
            disabled={!qrisPaid}
            onClick={() => { setQrisOpen(false); doSendWA(pendingMsg) }}
          >
            📲 Lanjut Kirim Pesanan ke WA
          </button>
        </div>
      </div>
    </>
  )
}
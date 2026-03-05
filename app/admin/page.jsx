'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

// ── Helpers ───────────────────────────────────────────────
const statusConfig = {
  pending: { bg: 'rgba(251,191,36,0.15)',  color: '#fbbf24', label: '⏳ Pending' },
  proses:  { bg: 'rgba(96,165,250,0.15)',  color: '#60a5fa', label: '🔄 Diproses' },
  selesai: { bg: 'rgba(74,222,128,0.15)',  color: '#4ade80', label: '✅ Selesai' },
  batal:   { bg: 'rgba(248,113,113,0.15)', color: '#f87171', label: '❌ Dibatal' },
}
const getStatus = s => statusConfig[s] || statusConfig.pending

const inp = {
  width:'100%', padding:'9px 11px', background:'var(--bg-input)',
  border:'1.5px solid var(--border-input)', borderRadius:9,
  fontSize:13, fontFamily:'Poppins,sans-serif', color:'var(--text-main)',
  boxSizing:'border-box', outline:'none',
}

// ── Safe JSON fetch helper ──
const safeJson = async (res) => {
  const text = await res.text()
  try {
    const data = JSON.parse(text)
    if (!res.ok) throw new Error(`HTTP ${res.status} on ${res.url}: ${JSON.stringify(data)}`)
    return data
  } catch (e) {
    if (!res.ok) throw new Error(`HTTP ${res.status} on ${res.url}: ${text.slice(0, 150)}`)
    throw new Error(`Response bukan JSON dari ${res.url}: ${text.slice(0, 150)}`)
  }
}

function Toast({ msg, type }) {
  return msg ? <div className={`stock-toast show ${type}`}>{msg}</div> : null
}

function StatCard({ icon, label, value, sub, color }) {
  return (
    <div style={{ background:'var(--bg-card)', border:`1px solid ${color}33`, borderRadius:18, padding:'1.4rem 1.6rem', display:'flex', alignItems:'center', gap:'1rem', boxShadow:`0 4px 24px ${color}18` }}>
      <div style={{ fontSize:'1.8rem', width:52, height:52, background:`${color}18`, borderRadius:14, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>{icon}</div>
      <div>
        <div style={{ fontSize:11, fontWeight:600, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:2 }}>{label}</div>
        <div style={{ fontSize:'1.6rem', fontWeight:800, color:'var(--text-main)', lineHeight:1.1 }}>{value}</div>
        {sub && <div style={{ fontSize:11, color:'var(--text-desc)', marginTop:2 }}>{sub}</div>}
      </div>
    </div>
  )
}

function TabBtn({ active, onClick, icon, label }) {
  return (
    <button onClick={onClick} style={{ padding:'9px 18px', background:active?'linear-gradient(135deg,var(--grad-a),var(--grad-b))':'var(--bg-card)', color:active?'#fff':'var(--text-sub)', border:active?'none':'1px solid var(--border)', borderRadius:10, fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:'Poppins,sans-serif', display:'flex', alignItems:'center', gap:6 }}>
      {icon} {label}
    </button>
  )
}

function SectionLabel({ icon, title }) {
  return (
    <div style={{ fontSize:'0.78rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'1.5px', color:'var(--grad-a)', marginBottom:'1rem', display:'flex', alignItems:'center', gap:6 }}>
      {icon} {title}
      <span style={{ flex:1, height:1, background:'var(--border)', display:'block' }} />
    </div>
  )
}

// ── Main Component ────────────────────────────────────────
export default function Admin() {
  const router = useRouter()

  // Auth
  const [user, setUser]               = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [email, setEmail]             = useState('')
  const [password, setPassword]       = useState('')
  const [authError, setAuthError]     = useState('')

  // UI
  const [tab, setTab]     = useState('dashboard')
  const [toast, setToast] = useState({ msg:'', type:'' })
  const showToast = (msg, type='success') => {
    setToast({ msg, type })
    setTimeout(() => setToast({ msg:'', type:'' }), 2800)
  }

  // Data
  const [products, setProducts] = useState([])
  const [orders, setOrders]     = useState([])
  const [users, setUsers]       = useState([])

  // Product form
  const PROD_INIT = { name:'', price:'', unit:'', desc:'', inStock:true, imgBase64:'' }
  const [prodForm, setProdForm]         = useState(PROD_INIT)
  const [editProdId, setEditProdId]     = useState(null)
  const [showProdForm, setShowProdForm] = useState(false)
  const [imgPreview, setImgPreview]     = useState(null)

  // User form
  const USER_INIT = { nama:'', role:'pelanggan', email:'', telp:'', password:'' }
  const [userForm, setUserForm]         = useState(USER_INIT)
  const [editUserId, setEditUserId]     = useState(null)
  const [showUserForm, setShowUserForm] = useState(false)

  // Order modal
  const [selectedOrder, setSelectedOrder] = useState(null)

  // ── Token helper ──────────────────────────────────────────
  const getToken   = () => {
    if (typeof window === 'undefined') return ''
    return localStorage.getItem('adminToken') || ''
  }
  const authHeader = () => ({ 'Content-Type':'application/json', Authorization:`Bearer ${getToken()}` })

  // ── Cek auth ──────────────────────────────────────────────
  useEffect(() => {
    const token = getToken()
    if (!token) { setAuthLoading(false); return }
    fetch('/api/auth/me', { headers:{ Authorization:`Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.role === 'admin') setUser(data) })
      .catch(() => {})
      .finally(() => setAuthLoading(false))
  }, [])

  // ── Fetch semua data ──────────────────────────────────────
  const fetchAll = useCallback(async (overrideHeaders) => {
    const headers = overrideHeaders || authHeader()
    try {
      const [p, o, u] = await Promise.all([
        fetch('/api/products').then(safeJson),
        fetch('/api/orders', { headers }).then(safeJson),
        fetch('/api/users', { headers }).then(safeJson),
      ])
      setProducts(Array.isArray(p) ? p : [])
      setOrders(Array.isArray(o) ? o : [])
      setUsers(Array.isArray(u) ? u : [])
    } catch (err) {
      console.error('fetchAll error:', err.message)
      showToast('Gagal memuat data.', 'error')
    }
  }, [])

  useEffect(() => { if (user) fetchAll() }, [user, fetchAll])

  // ── Login ─────────────────────────────────────────────────
  const handleLogin = async e => {
    e.preventDefault(); setAuthError('')
    try {
      const res  = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      const data = await res.json()
      if (!res.ok) { setAuthError(data.error || 'Login gagal'); return }
      localStorage.setItem('adminToken', data.token)
      setUser(data.user)
      const headers = { 'Content-Type':'application/json', Authorization:`Bearer ${data.token}` }
      await fetchAll(headers)
    } catch (err) {
      console.error('Login error:', err)
      setAuthError('Terjadi kesalahan, coba lagi.')
    }
  }

  // ── Logout ────────────────────────────────────────────────
  const handleLogout = () => {
    fetch('/api/auth/logout', { method:'POST' }).catch(() => {})
    localStorage.removeItem('adminToken')
    setUser(null)
  }

  // ── Gambar → Base64 ───────────────────────────────────────
  const handleImgChange = e => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      setProdForm(p => ({ ...p, imgBase64: ev.target.result }))
      setImgPreview(ev.target.result)
    }
    reader.readAsDataURL(file)
  }

  // ── CRUD Produk ───────────────────────────────────────────
  const saveProd = async () => {
    if (!prodForm.name.trim() || !prodForm.price) { showToast('Isi nama & harga produk!','error'); return }
    const method = editProdId ? 'PUT' : 'POST'
    const url    = editProdId ? `/api/products/${editProdId}` : '/api/products'
    try {
      await fetch(url, { method, headers:authHeader(), body:JSON.stringify(prodForm) }).then(safeJson)
      showToast(editProdId ? '✅ Produk diperbarui!' : '✅ Produk ditambahkan!')
      setProdForm(PROD_INIT); setEditProdId(null); setImgPreview(null); setShowProdForm(false)
      fetchAll()
    } catch (err) {
      console.error('saveProd error:', err.message)
      showToast('Gagal menyimpan produk.','error')
    }
  }

  const editProd = p => {
    setProdForm({ name:p.name, price:p.price, unit:p.unit, desc:p.desc, inStock:p.inStock, imgBase64:p.imgBase64||'' })
    setImgPreview(p.imgBase64||null); setEditProdId(p.id); setShowProdForm(true)
    window.scrollTo({ top: 0, behavior:'smooth' })
  }

  const deleteProd = async p => {
    if (!confirm(`Hapus produk "${p.name}"?`)) return
    try {
      const res = await fetch(`/api/products/${p.id}`, { method:'DELETE', headers:authHeader() })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      showToast('🗑️ Produk dihapus!','error'); fetchAll()
    } catch (err) {
      console.error('deleteProd error:', err.message)
      showToast('Gagal menghapus produk.','error')
    }
  }

  const toggleStok = async p => {
    try {
      await fetch(`/api/products/${p.id}`, {
        method:'PUT', headers:authHeader(),
        body:JSON.stringify({ ...p, inStock:!p.inStock })
      }).then(safeJson)
      showToast(!p.inStock ? '✅ Stok tersedia' : '❌ Stok habis'); fetchAll()
    } catch (err) {
      console.error('toggleStok error:', err.message)
      showToast('Gagal mengubah stok.','error')
    }
  }

  // ── Kirim Email Notifikasi ───────────────────────────────────────
  const sendEmailNotification = async (orderId, customerEmail) => {
    if (!customerEmail) {
      showToast('❌ Email pelanggan tidak tersedia.', 'error')
      return
    }
    try {
      const res = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: customerEmail,
          subject: '✅ Pesanan Anda Selesai!',
          message: `Halo! Pesanan Anda di HA BIBI SNACK CORNER sudah selesai. Silakan ambil pesanan Anda! 🎉`
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Gagal kirim email')
      showToast('✅ Email notifikasi terkirim!', 'success')
    } catch (err) {
      console.error('sendEmailNotification error:', err.message)
      showToast('❌ Gagal kirim email.', 'error')
    }
  }

  // ── CRUD Pesanan ──────────────────────────────────────────
  const updateOrderStatus = async (id, status) => {
    try {
      await fetch(`/api/orders/${id}`, {
        method:'PUT', headers:authHeader(),
        body:JSON.stringify({ status })
      }).then(safeJson)
      if (selectedOrder?.id === id) setSelectedOrder(p => ({ ...p, status }))
      showToast(`Status diubah: ${status}`); 
      
      // Auto-kirim email saat status = "selesai"
      if (status === 'selesai') {
        const order = orders.find(o => o.id === id)
        if (order?.email) {
          await sendEmailNotification(id, order.email)
        }
      }
      
      fetchAll()
    } catch (err) {
      console.error('updateOrderStatus error:', err.message)
      showToast('Gagal mengubah status.','error')
    }
  }

  const deleteOrder = async id => {
    if (!confirm('Hapus pesanan ini?')) return
    try {
      const res = await fetch(`/api/orders/${id}`, { method:'DELETE', headers:authHeader() })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      showToast('🗑️ Pesanan dihapus','error'); fetchAll()
    } catch (err) {
      console.error('deleteOrder error:', err.message)
      showToast('Gagal menghapus pesanan.','error')
    }
  }

  // ── CRUD Pengguna ─────────────────────────────────────────
  const saveUser = async () => {
    if (!userForm.nama.trim()) { showToast('Isi nama!','error'); return }
    const method = editUserId ? 'PUT' : 'POST'
    const url    = editUserId ? `/api/users/${editUserId}` : '/api/users'
    try {
      await fetch(url, { method, headers:authHeader(), body:JSON.stringify(userForm) }).then(safeJson)
      showToast(editUserId ? '✅ Pengguna diperbarui!' : '✅ Pengguna ditambahkan!')
      setUserForm(USER_INIT); setEditUserId(null); setShowUserForm(false); fetchAll()
    } catch (err) {
      console.error('saveUser error:', err.message)
      showToast('Gagal menyimpan pengguna.','error')
    }
  }

  const editUser   = u => { setUserForm({ nama:u.nama, role:u.role, email:u.email||'', telp:u.telp||'', password:'' }); setEditUserId(u.id); setShowUserForm(true) }
  const deleteUser = async u => {
    if (!confirm(`Hapus "${u.nama}"?`)) return
    try {
      const res = await fetch(`/api/users/${u.id}`, { method:'DELETE', headers:authHeader() })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      showToast('🗑️ Dihapus','error'); fetchAll()
    } catch (err) {
      console.error('deleteUser error:', err.message)
      showToast('Gagal menghapus pengguna.','error')
    }
  }

  // ── Stats ─────────────────────────────────────────────────
  const totalRevenue = orders.reduce((s, o) => s + (o.total||0), 0)
  const pendingCount = orders.filter(o => !o.status || o.status==='pending').length
  const doneCount    = orders.filter(o => o.status==='selesai').length
  const prodHabis    = products.filter(p => !p.inStock).length

  // ════════════════════════════════════════════════════════
  // RENDER — Loading
  // ════════════════════════════════════════════════════════
  if (authLoading) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg-main)' }}>
      <div style={{ color:'var(--text-sub)', fontSize:16 }}>⏳ Memuat...</div>
    </div>
  )

  // ════════════════════════════════════════════════════════
  // RENDER — Login
  // ════════════════════════════════════════════════════════
  if (!user) return (
    <div style={{ minHeight:'100vh', background:'var(--bg-main)', display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }}>
      <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:22, padding:'2.5rem 2rem', width:'100%', maxWidth:380, boxShadow:'0 20px 60px rgba(0,0,0,0.3)' }}>
        <div style={{ textAlign:'center', marginBottom:'2rem' }}>
          <div style={{ fontSize:'2.5rem', marginBottom:8 }}>🔐</div>
          <h1 style={{ fontSize:'1.4rem', fontWeight:800, color:'var(--text-main)', marginBottom:4 }}>Admin Login</h1>
          <p style={{ fontSize:13, color:'var(--text-sub)' }}>HA BIBI SNACK CORNER Dashboard</p>
        </div>
        <form onSubmit={handleLogin}>
          <div style={{ marginBottom:14 }}>
            <label style={{ fontSize:11, fontWeight:700, color:'var(--text-sub)', textTransform:'uppercase', display:'block', marginBottom:5 }}>Email</label>
            <input style={inp} type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="admin@habibi.com" required />
          </div>
          <div style={{ marginBottom:18 }}>
            <label style={{ fontSize:11, fontWeight:700, color:'var(--text-sub)', textTransform:'uppercase', display:'block', marginBottom:5 }}>Password</label>
            <input style={inp} type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" required />
          </div>
          {authError && <p style={{ color:'#f87171', fontSize:12, marginBottom:12, textAlign:'center' }}>{authError}</p>}
          <button type="submit" style={{ width:'100%', padding:12, background:'linear-gradient(135deg,var(--grad-a),var(--grad-b))', color:'#fff', border:'none', borderRadius:12, fontWeight:700, fontSize:14, cursor:'pointer', fontFamily:'Poppins,sans-serif' }}>
            🚀 Login
          </button>
        </form>
        <button onClick={()=>router.push('/')} style={{ marginTop:12, width:'100%', padding:10, background:'transparent', color:'var(--text-sub)', border:'1px solid var(--border)', borderRadius:10, fontSize:13, cursor:'pointer', fontFamily:'Poppins,sans-serif' }}>
          ← Kembali ke Toko
        </button>
      </div>
    </div>
  )

  // ════════════════════════════════════════════════════════
  // RENDER — Dashboard
  // ════════════════════════════════════════════════════════
  return (
    <div>
      <Navbar />
      <Toast msg={toast.msg} type={toast.type} />

      {/* Modal Detail Pesanan */}
      {selectedOrder && (
        <>
          <div className="overlay active" onClick={()=>setSelectedOrder(null)} />
          <div className="modal active">
            <div className="modal-content" style={{ textAlign:'left', maxWidth:480 }}>
              <div className="modal-header">
                <h2>📦 Detail Pesanan</h2>
                <button className="close-btn" onClick={()=>setSelectedOrder(null)}>×</button>
              </div>
              <div style={{ marginTop:12 }}>
                {[['👤 Nama',selectedOrder.nama],['🚚 Pengiriman',selectedOrder.pengiriman],['💳 Pembayaran',selectedOrder.pembayaran],['📍 Lokasi',selectedOrder.lokasi],['📝 Catatan',selectedOrder.catatan]].map(([k,v])=>(
                  <div key={k} style={{ display:'flex', gap:12, padding:'8px 0', borderBottom:'1px solid var(--border)', fontSize:13 }}>
                    <span style={{ color:'var(--text-muted)', minWidth:110 }}>{k}</span>
                    <span style={{ color:'var(--text-main)', fontWeight:600 }}>{v||'-'}</span>
                  </div>
                ))}
                <div style={{ padding:'10px 0', borderBottom:'1px solid var(--border)' }}>
                  <p style={{ fontSize:11, color:'var(--text-muted)', fontWeight:700, textTransform:'uppercase', marginBottom:8 }}>Item Pesanan</p>
                  {(selectedOrder.items||[]).map((it,i)=>(
                    <div key={i} style={{ display:'flex', justifyContent:'space-between', fontSize:13, marginBottom:4 }}>
                      <span>{it.name} × {it.qty}</span>
                      <span style={{ fontWeight:700 }}>Rp {((it.price||0)*(it.qty||1)).toLocaleString('id-ID')}</span>
                    </div>
                  ))}
                </div>
                <div style={{ display:'flex', justifyContent:'space-between', padding:'10px 0', fontWeight:800, fontSize:15 }}>
                  <span>💰 Total</span>
                  <span>Rp {(selectedOrder.total||0).toLocaleString('id-ID')}</span>
                </div>
                <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginTop:8 }}>
                  {['pending','proses','selesai','batal'].map(s=>{
                    const sc = getStatus(s)
                    return <button key={s} onClick={()=>updateOrderStatus(selectedOrder.id,s)} style={{ padding:'7px 14px', borderRadius:8, border:'none', background:sc.bg, color:sc.color, fontWeight:700, fontSize:12, cursor:'pointer', fontFamily:'Poppins,sans-serif' }}>{sc.label}</button>
                  })}
                </div>
                {selectedOrder.email && (
                  <div style={{ marginTop:12, paddingTop:12, borderTop:'1px solid var(--border)' }}>
                    <button 
                      onClick={() => sendEmailNotification(selectedOrder.id, selectedOrder.email)}
                      style={{ padding:'7px 14px', borderRadius:8, border:'none', background:'rgba(74,222,128,0.15)', color:'#4ade80', fontWeight:700, fontSize:12, cursor:'pointer', fontFamily:'Poppins,sans-serif' }}>
                      📧 Kirim Email Notifikasi
                    </button>
                    <p style={{ fontSize:11, color:'var(--text-muted)', marginTop:6 }}>Email: {selectedOrder.email}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Hero */}
      <section className="hero" style={{ padding:'1.5rem 2rem 4.5rem' }}>
        <div className="hero-bg" />
        <div className="hero-content" style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'1rem' }}>
          <div>
            <p style={{ fontSize:11, fontWeight:700, color:'rgba(255,255,255,0.6)', letterSpacing:'2px', textTransform:'uppercase', marginBottom:4 }}>Dashboard Admin</p>
            <h1 className="hero-title" style={{ fontSize:'1.8rem', marginBottom:4 }}>👨‍💼 HA BIBI SNACK CORNER</h1>
            <p style={{ color:'rgba(255,255,255,0.7)', fontSize:13 }}>Selamat datang, {user.email} 👋</p>
          </div>
          <button onClick={handleLogout} style={{ padding:'9px 20px', background:'rgba(248,113,113,0.2)', color:'#f87171', border:'1.5px solid rgba(248,113,113,0.4)', borderRadius:50, fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:'Poppins,sans-serif' }}>🚪 Logout</button>
        </div>
        <div className="hero-wave">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 80" preserveAspectRatio="none">
            <path className="wave-path" d="M0,50 C400,90 1040,10 1440,50 L1440,80 L0,80 Z" />
          </svg>
        </div>
      </section>

      <div style={{ maxWidth:1100, margin:'0 auto', padding:'2rem 1.5rem 4rem' }}>

        {/* Tabs */}
        <div style={{ display:'flex', gap:8, marginBottom:'2rem', flexWrap:'wrap' }}>
          <TabBtn active={tab==='dashboard'} onClick={()=>setTab('dashboard')} icon="📊" label="Dashboard" />
          <TabBtn active={tab==='produk'}    onClick={()=>setTab('produk')}    icon="🛍️" label="Produk" />
          <TabBtn active={tab==='pesanan'}   onClick={()=>setTab('pesanan')}   icon="📦" label="Pesanan" />
          <TabBtn active={tab==='pengguna'}  onClick={()=>setTab('pengguna')}  icon="👥" label="Pengguna" />
        </div>

        {/* ── DASHBOARD ── */}
        {tab==='dashboard' && (
          <div>
            <SectionLabel icon="📊" title="Ringkasan" />
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:'1rem', marginBottom:'2.5rem' }}>
              <StatCard icon="💰" label="Total Pendapatan" value={`Rp ${totalRevenue.toLocaleString('id-ID')}`} sub="Semua pesanan"     color="#a78bfa" />
              <StatCard icon="📦" label="Total Pesanan"    value={orders.length}                                sub={`${pendingCount} menunggu`} color="#60a5fa" />
              <StatCard icon="✅" label="Selesai"          value={doneCount}                                   sub="Berhasil"          color="#4ade80" />
              <StatCard icon="🛍️" label="Produk"          value={products.length}                             sub={`${prodHabis} habis`}        color="#f472b6" />
              <StatCard icon="👥" label="Pengguna"         value={users.length}                                sub="Terdaftar"         color="#fbbf24" />
            </div>
            <SectionLabel icon="📦" title="Pesanan Terbaru" />
            <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:16, overflow:'hidden' }}>
              {orders.length===0
                ? <p style={{ padding:'2rem', textAlign:'center', color:'var(--text-muted)', fontSize:13 }}>Belum ada pesanan.</p>
                : orders.slice(0,5).map(o => {
                  const sc = getStatus(o.status)
                  return (
                    <div key={o.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 16px', borderBottom:'1px solid var(--border)', flexWrap:'wrap' }}>
                      <div style={{ flex:1, minWidth:120 }}>
                        <div style={{ fontSize:13, fontWeight:700, color:'var(--text-main)' }}>{o.nama||'Anonim'}</div>
                        <div style={{ fontSize:11, color:'var(--text-muted)' }}>{o.pengiriman}</div>
                      </div>
                      <div style={{ fontSize:13, fontWeight:700 }}>Rp {(o.total||0).toLocaleString('id-ID')}</div>
                      <span style={{ padding:'4px 10px', borderRadius:8, background:sc.bg, color:sc.color, fontSize:11, fontWeight:700 }}>{sc.label}</span>
                      <button onClick={()=>setSelectedOrder(o)} style={{ padding:'5px 12px', background:'rgba(167,139,250,0.12)', border:'1px solid rgba(167,139,250,0.3)', color:'var(--grad-a)', borderRadius:8, fontSize:11, fontWeight:700, cursor:'pointer', fontFamily:'Poppins,sans-serif' }}>Detail</button>
                    </div>
                  )
                })
              }
            </div>
          </div>
        )}

        {/* ── PRODUK ── */}
        {tab==='produk' && (
          <div>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem', flexWrap:'wrap', gap:8 }}>
              <SectionLabel icon="🛍️" title="Manajemen Produk" />
              <button
                onClick={()=>{ setShowProdForm(!showProdForm); setEditProdId(null); setProdForm(PROD_INIT); setImgPreview(null) }}
                style={{ padding:'9px 18px', background:'linear-gradient(135deg,var(--grad-a),var(--grad-b))', color:'#fff', border:'none', borderRadius:10, fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:'Poppins,sans-serif' }}>
                {showProdForm ? '✕ Batal' : '+ Tambah Produk'}
              </button>
            </div>

            {showProdForm && (
              <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:16, padding:'1.4rem', marginBottom:'1.5rem' }}>
                <p style={{ fontWeight:700, fontSize:14, color:'var(--text-main)', marginBottom:'1rem' }}>{editProdId?'✏️ Edit Produk':'➕ Tambah Produk Baru'}</p>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:12 }}>
                  {[{label:'Nama Produk',key:'name',placeholder:'Cireng',type:'text'},{label:'Harga (Rp)',key:'price',placeholder:'1000',type:'number'},{label:'Satuan',key:'unit',placeholder:'1 pcs',type:'text'}].map(({label,key,placeholder,type})=>(
                    <div key={key}>
                      <label style={{ fontSize:11, fontWeight:700, color:'var(--text-sub)', textTransform:'uppercase', display:'block', marginBottom:5 }}>{label}</label>
                      <input style={inp} type={type} value={prodForm[key]} onChange={e=>setProdForm(p=>({...p,[key]:e.target.value}))} placeholder={placeholder} />
                    </div>
                  ))}
                  <div style={{ gridColumn:'1/-1' }}>
                    <label style={{ fontSize:11, fontWeight:700, color:'var(--text-sub)', textTransform:'uppercase', display:'block', marginBottom:5 }}>Deskripsi</label>
                    <input style={inp} type="text" value={prodForm.desc} onChange={e=>setProdForm(p=>({...p,desc:e.target.value}))} placeholder="Deskripsi singkat produk..." />
                  </div>
                  <div style={{ gridColumn:'1/-1' }}>
                    <label style={{ fontSize:11, fontWeight:700, color:'var(--text-sub)', textTransform:'uppercase', display:'block', marginBottom:8 }}>📷 Foto Produk</label>
                    <div style={{ display:'flex', gap:16, alignItems:'flex-start', flexWrap:'wrap' }}>
                      <div style={{ width:120, height:120, borderRadius:12, border:'2px dashed var(--border-input)', background:'var(--bg-input)', display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden', flexShrink:0 }}>
                        {imgPreview ? <img src={imgPreview} alt="preview" style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : <span style={{ fontSize:'2.5rem' }}>🖼️</span>}
                      </div>
                      <div style={{ flex:1 }}>
                        <label style={{ display:'inline-block', padding:'9px 18px', background:'rgba(167,139,250,0.12)', border:'1.5px solid rgba(167,139,250,0.35)', borderRadius:10, color:'var(--grad-a)', fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:'Poppins,sans-serif' }}>
                          📁 Pilih Foto
                          <input type="file" accept="image/*" onChange={handleImgChange} style={{ display:'none' }} />
                        </label>
                        <p style={{ fontSize:11, color:'var(--text-muted)', marginTop:8 }}>Format: JPG, PNG, WEBP. Gambar tersimpan langsung ke database.</p>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize:13, fontWeight:600, color:'var(--text-main)', cursor:'pointer', display:'flex', alignItems:'center', gap:8 }}>
                      <input type="checkbox" checked={prodForm.inStock} onChange={e=>setProdForm(p=>({...p,inStock:e.target.checked}))} />
                      Stok Tersedia
                    </label>
                  </div>
                </div>
                <div style={{ display:'flex', gap:10, marginTop:16 }}>
                  <button onClick={saveProd} style={{ padding:'9px 22px', background:'linear-gradient(135deg,var(--grad-a),var(--grad-b))', color:'#fff', border:'none', borderRadius:10, fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:'Poppins,sans-serif' }}>💾 Simpan Produk</button>
                  <button onClick={()=>{ setShowProdForm(false); setEditProdId(null); setImgPreview(null) }} style={{ padding:'9px 18px', background:'transparent', color:'var(--text-sub)', border:'1px solid var(--border)', borderRadius:10, fontWeight:600, fontSize:13, cursor:'pointer', fontFamily:'Poppins,sans-serif' }}>Batal</button>
                </div>
              </div>
            )}

            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:'1rem' }}>
              {products.length===0
                ? <p style={{ color:'var(--text-muted)', fontSize:13 }}>Belum ada produk. Klik "+ Tambah Produk".</p>
                : products.map(p=>(
                  <div key={p.id} style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:16, overflow:'hidden' }}>
                    <div style={{ position:'relative', height:160, background:'var(--bg-input)' }}>
                      {p.imgBase64
                        ? <img src={p.imgBase64} alt={p.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                        : <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'3rem' }}>🍡</div>
                      }
                      <span style={{ position:'absolute', top:8, right:8, padding:'4px 10px', borderRadius:8, fontSize:11, fontWeight:700, background:p.inStock?'rgba(74,222,128,0.9)':'rgba(248,113,113,0.9)', color:'#fff' }}>
                        {p.inStock?'✅ Tersedia':'❌ Habis'}
                      </span>
                    </div>
                    <div style={{ padding:'0.9rem' }}>
                      <div style={{ fontSize:14, fontWeight:700, color:'var(--text-main)', marginBottom:2 }}>{p.name}</div>
                      <div style={{ fontSize:11, color:'var(--text-muted)', marginBottom:6 }}>{p.unit} · {p.desc}</div>
                      <div style={{ fontSize:14, fontWeight:800, background:'linear-gradient(90deg,var(--grad-a),var(--grad-b))', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', marginBottom:10 }}>
                        Rp {Number(p.price).toLocaleString('id-ID')}
                      </div>
                      <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                        <button onClick={()=>toggleStok(p)} style={{ flex:1, padding:'6px', borderRadius:8, border:'none', background:p.inStock?'rgba(248,113,113,0.12)':'rgba(74,222,128,0.12)', color:p.inStock?'#f87171':'#4ade80', fontWeight:700, fontSize:11, cursor:'pointer', fontFamily:'Poppins,sans-serif' }}>
                          {p.inStock?'❌ Tandai Habis':'✅ Tandai Tersedia'}
                        </button>
                        <button onClick={()=>editProd(p)} style={{ padding:'6px 12px', background:'rgba(96,165,250,0.12)', border:'1px solid rgba(96,165,250,0.3)', color:'#60a5fa', borderRadius:8, fontSize:11, fontWeight:700, cursor:'pointer', fontFamily:'Poppins,sans-serif' }}>✏️</button>
                        <button onClick={()=>deleteProd(p)} style={{ padding:'6px 12px', background:'rgba(248,113,113,0.12)', border:'1px solid rgba(248,113,113,0.3)', color:'#f87171', borderRadius:8, fontSize:11, fontWeight:700, cursor:'pointer', fontFamily:'Poppins,sans-serif' }}>🗑️</button>
                      </div>
                    </div>
                  </div>
                ))
              }
            </div>
          </div>
        )}

        {/* ── PESANAN ── */}
        {tab==='pesanan' && (
          <div>
            <SectionLabel icon="📦" title="Manajemen Pesanan" />
            {orders.length===0
              ? <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:16, padding:'3rem', textAlign:'center', color:'var(--text-muted)' }}>📭 Belum ada pesanan.</div>
              : orders.map(o=>{
                const sc = getStatus(o.status)
                return (
                  <div key={o.id} style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:16, padding:'1.2rem 1.4rem', marginBottom:'1rem' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', flexWrap:'wrap', gap:8, marginBottom:10 }}>
                      <div>
                        <div style={{ fontSize:14, fontWeight:700, color:'var(--text-main)' }}>{o.nama||'Anonim'}</div>
                        <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:2 }}>{o.pengiriman} · {o.pembayaran}</div>
                      </div>
                      <span style={{ padding:'5px 12px', borderRadius:8, background:sc.bg, color:sc.color, fontSize:12, fontWeight:700 }}>{sc.label}</span>
                    </div>
                    <div style={{ fontSize:13, fontWeight:700, color:'var(--text-main)', marginBottom:10 }}>💰 Total: Rp {(o.total||0).toLocaleString('id-ID')}</div>
                    <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                      <button onClick={()=>setSelectedOrder(o)} style={{ padding:'6px 14px', background:'rgba(167,139,250,0.12)', border:'1px solid rgba(167,139,250,0.3)', color:'var(--grad-a)', borderRadius:8, fontSize:11, fontWeight:700, cursor:'pointer', fontFamily:'Poppins,sans-serif' }}>📋 Detail</button>
                      {['pending','proses','selesai','batal'].filter(s=>s!==(o.status||'pending')).map(s=>{
                        const sc2 = getStatus(s)
                        return <button key={s} onClick={()=>updateOrderStatus(o.id,s)} style={{ padding:'6px 14px', background:sc2.bg, border:'none', color:sc2.color, borderRadius:8, fontSize:11, fontWeight:700, cursor:'pointer', fontFamily:'Poppins,sans-serif' }}>{sc2.label}</button>
                      })}
                      <button onClick={()=>deleteOrder(o.id)} style={{ padding:'6px 14px', background:'rgba(248,113,113,0.12)', border:'1px solid rgba(248,113,113,0.3)', color:'#f87171', borderRadius:8, fontSize:11, fontWeight:700, cursor:'pointer', fontFamily:'Poppins,sans-serif', marginLeft:'auto' }}>🗑️</button>
                    </div>
                  </div>
                )
              })
            }
          </div>
        )}

        {/* ── PENGGUNA ── */}
        {tab==='pengguna' && (
          <div>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem', flexWrap:'wrap', gap:8 }}>
              <SectionLabel icon="👥" title="Manajemen Pengguna" />
              <button onClick={()=>{ setShowUserForm(!showUserForm); setEditUserId(null); setUserForm(USER_INIT) }}
                style={{ padding:'9px 18px', background:'linear-gradient(135deg,var(--grad-a),var(--grad-b))', color:'#fff', border:'none', borderRadius:10, fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:'Poppins,sans-serif' }}>
                {showUserForm?'✕ Batal':'+ Tambah Pengguna'}
              </button>
            </div>
            {showUserForm && (
              <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:16, padding:'1.4rem', marginBottom:'1.5rem' }}>
                <p style={{ fontWeight:700, fontSize:14, color:'var(--text-main)', marginBottom:'1rem' }}>{editUserId?'✏️ Edit Pengguna':'➕ Tambah Pengguna'}</p>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:12 }}>
                  {[{label:'Nama',key:'nama',placeholder:'Ibu Siti',type:'text'},{label:'Email',key:'email',placeholder:'email@contoh.com',type:'email'},{label:'No. Telp',key:'telp',placeholder:'08xxxxxxxx',type:'text'},{label:'Password',key:'password',placeholder:'Kosongkan jika tidak diubah',type:'password'}].map(({label,key,placeholder,type})=>(
                    <div key={key}>
                      <label style={{ fontSize:11, fontWeight:700, color:'var(--text-sub)', textTransform:'uppercase', display:'block', marginBottom:5 }}>{label}</label>
                      <input style={inp} type={type} value={userForm[key]} onChange={e=>setUserForm(p=>({...p,[key]:e.target.value}))} placeholder={placeholder} />
                    </div>
                  ))}
                  <div>
                    <label style={{ fontSize:11, fontWeight:700, color:'var(--text-sub)', textTransform:'uppercase', display:'block', marginBottom:5 }}>Role</label>
                    <select style={inp} value={userForm.role} onChange={e=>setUserForm(p=>({...p,role:e.target.value}))}>
                      <option value="pelanggan">👤 Pelanggan</option>
                      <option value="admin">👨‍💼 Admin</option>
                    </select>
                  </div>
                </div>
                <div style={{ display:'flex', gap:10, marginTop:14 }}>
                  <button onClick={saveUser} style={{ padding:'9px 22px', background:'linear-gradient(135deg,var(--grad-a),var(--grad-b))', color:'#fff', border:'none', borderRadius:10, fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:'Poppins,sans-serif' }}>💾 Simpan</button>
                  <button onClick={()=>{ setShowUserForm(false); setEditUserId(null) }} style={{ padding:'9px 18px', background:'transparent', color:'var(--text-sub)', border:'1px solid var(--border)', borderRadius:10, fontWeight:600, fontSize:13, cursor:'pointer', fontFamily:'Poppins,sans-serif' }}>Batal</button>
                </div>
              </div>
            )}
            <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:16, overflow:'hidden' }}>
              {users.length===0
                ? <p style={{ padding:'2rem', textAlign:'center', color:'var(--text-muted)', fontSize:13 }}>Belum ada pengguna.</p>
                : users.map((u,i)=>(
                  <div key={u.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 16px', borderBottom:i<users.length-1?'1px solid var(--border)':'none', flexWrap:'wrap' }}>
                    <div style={{ width:38, height:38, background:u.role==='admin'?'rgba(167,139,250,0.15)':'rgba(96,165,250,0.15)', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.2rem', flexShrink:0 }}>
                      {u.role==='admin'?'👨‍💼':'👤'}
                    </div>
                    <div style={{ flex:1, minWidth:140 }}>
                      <div style={{ fontSize:13, fontWeight:700, color:'var(--text-main)' }}>{u.nama}</div>
                      <div style={{ fontSize:11, color:'var(--text-muted)' }}>{u.email||'-'} · {u.telp||'-'}</div>
                    </div>
                    <span style={{ padding:'4px 10px', borderRadius:8, background:u.role==='admin'?'rgba(167,139,250,0.15)':'rgba(96,165,250,0.15)', color:u.role==='admin'?'#a78bfa':'#60a5fa', fontSize:11, fontWeight:700 }}>
                      {u.role==='admin'?'👨‍💼 Admin':'👤 Pelanggan'}
                    </span>
                    <button onClick={()=>editUser(u)} style={{ padding:'5px 12px', background:'rgba(96,165,250,0.12)', border:'1px solid rgba(96,165,250,0.3)', color:'#60a5fa', borderRadius:8, fontSize:11, fontWeight:700, cursor:'pointer', fontFamily:'Poppins,sans-serif' }}>✏️</button>
                    <button onClick={()=>deleteUser(u)} style={{ padding:'5px 12px', background:'rgba(248,113,113,0.12)', border:'1px solid rgba(248,113,113,0.3)', color:'#f87171', borderRadius:8, fontSize:11, fontWeight:700, cursor:'pointer', fontFamily:'Poppins,sans-serif' }}>🗑️</button>
                  </div>
                ))
              }
            </div>
          </div>
        )}

      </div>
      <Footer />
    </div>
  )
}
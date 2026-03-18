'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

// ─────── Status Config ───────
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

// ─────── Utility Functions ───────
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
    <button onClick={onClick} style={{ padding:'9px 18px', background:active?'linear-gradient(135deg,#D4AF37,#B8956A)':'var(--bg-card)', color:active?'#3D2817':'var(--text-sub)', border:active?'none':'1px solid var(--border)', borderRadius:10, fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:'Poppins,sans-serif', display:'flex', alignItems:'center', gap:6 }}>
      {icon} {label}
    </button>
  )
}

function SectionLabel({ icon, title }) {
  return (
    <div style={{ fontSize:'0.78rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'1.5px', color:'#D4AF37', marginBottom:'1rem', display:'flex', alignItems:'center', gap:6 }}>
      {icon} {title}
      <span style={{ flex:1, height:1, background:'var(--border)', display:'block' }} />
    </div>
  )
}

export default function Admin() {
  const router = useRouter()

  // ─── AUTH ───
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState('')

  // ─── UI ───
  const [tab, setTab] = useState('dashboard')
  const [toast, setToast] = useState({ msg:'', type:'' })
  const [loading, setLoading] = useState(false)
  
  const showToast = (msg, type='success') => {
    setToast({ msg, type })
    setTimeout(() => setToast({ msg:'', type:'' }), 2800)
  }

  // ─── DATA ───
  const [products, setProducts] = useState([])
  const [sembakoProducts, setSembakoProducts] = useState([])
  const [orders, setOrders] = useState([])
  const [users, setUsers] = useState([])

  // ─── PRODUCT FORM (Angkringan) - WITH PRICE & FLAVOR VARIANTS ───
  const PROD_INIT = { name:'', variants:[], unit:'', desc:'', inStock:true, imgBase64:'' }
  const [prodForm, setProdForm] = useState(PROD_INIT)
  const [editProdId, setEditProdId] = useState(null)
  const [showProdForm, setShowProdForm] = useState(false)
  const [imgPreview, setImgPreview] = useState(null)

  // ─── SEMBAKO FORM - WITH VARIANTS ───
  const SEMBAKO_INIT = { name:'', variants:[], desc:'', inStock:true, imgBase64:'' }
  const [sembakoForm, setSembakoForm] = useState(SEMBAKO_INIT)
  const [editSembakoId, setEditSembakoId] = useState(null)
  const [showSembakoForm, setShowSembakoForm] = useState(false)
  const [sembakoImgPreview, setSembakoImgPreview] = useState(null)

  // ─── USER FORM ───
  const USER_INIT = { nama:'', role:'pelanggan', email:'', telp:'', password:'' }
  const [userForm, setUserForm] = useState(USER_INIT)
  const [editUserId, setEditUserId] = useState(null)
  const [showUserForm, setShowUserForm] = useState(false)

  // ─── ORDER ───
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [orderStatusFilter, setOrderStatusFilter] = useState('all')

  // ─── HELPERS ───
  const getToken = () => {
    if (typeof window === 'undefined') return ''
    return localStorage.getItem('adminToken') || ''
  }
  const authHeader = () => ({ 'Content-Type':'application/json', Authorization:`Bearer ${getToken()}` })

  // ─── FETCH AUTH ───
  useEffect(() => {
    const token = getToken()
    if (!token) { setAuthLoading(false); return }
    fetch('/api/auth/me', { headers:{ Authorization:`Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.role === 'admin') setUser(data) })
      .catch(err => console.error('Auth check error:', err))
      .finally(() => setAuthLoading(false))
  }, [])

  // ─── FETCH ALL DATA ───
  const fetchAll = useCallback(async (overrideHeaders) => {
    const headers = overrideHeaders || authHeader()
    try {
      console.log('🔄 Fetching all data...')
      
      const [p, s, o, u] = await Promise.all([
        fetch('/api/products').then(r => r.json()).catch(err => { console.error('Error fetching products:', err); return [] }),
        fetch('/api/sembako').then(r => r.json()).catch(err => { console.error('Error fetching sembako:', err); return [] }),
        fetch('/api/orders', { headers }).then(r => r.json()).catch(err => { console.error('Error fetching orders:', err); return [] }),
        fetch('/api/users', { headers }).then(r => r.json()).catch(err => { console.error('Error fetching users:', err); return [] }),
      ])
      
      setProducts(Array.isArray(p) ? p : [])
      setSembakoProducts(Array.isArray(s) ? s : [])
      setOrders(Array.isArray(o) ? o : [])
      setUsers(Array.isArray(u) ? u : [])
      console.log('✅ All data fetched - Products:', Array.isArray(p) ? p.length : 0, 'Sembako:', Array.isArray(s) ? s.length : 0)
    } catch (err) {
      console.error('fetchAll error:', err)
      showToast('Gagal memuat data.', 'error')
    }
  }, [])

  useEffect(() => { if (user) fetchAll() }, [user, fetchAll])

  // ─── LOGIN ───
  const handleLogin = async e => {
    e.preventDefault(); setAuthError('')
    try {
      const res = await fetch('/api/auth/login', {
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

  // ─── LOGOUT ───
  const handleLogout = () => {
    fetch('/api/auth/logout', { method:'POST' }).catch(() => {})
    localStorage.removeItem('adminToken')
    setUser(null)
  }

  // ═════════════════════════════════════════════════════════════════
  // PRODUCT (ANGKRINGAN) HANDLERS - WITH PRICE & FLAVOR VARIANTS
  // ═════════════════════════════════════════════════════════════════

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

  const addProductVariant = () => {
    setProdForm(p => ({
      ...p,
      variants: [...(p.variants || []), { label: '', flavor: 'original', price: '' }]
    }))
  }

  const updateProductVariant = (idx, key, val) => {
    setProdForm(p => ({
      ...p,
      variants: p.variants.map((v, i) => i === idx ? { ...v, [key]: val } : v)
    }))
  }

  const removeProductVariant = (idx) => {
    setProdForm(p => ({
      ...p,
      variants: p.variants.filter((_, i) => i !== idx)
    }))
  }

  const saveProd = async () => {
    if (!prodForm.name.trim()) { showToast('Isi nama produk!','error'); return }
    if (!prodForm.variants || prodForm.variants.length === 0) {
      showToast('Tambahkan minimal 1 varian harga!','error')
      return
    }
    if (prodForm.variants.some(v => !v.label || !v.price)) {
      showToast('Semua varian harus punya label dan harga!','error')
      return
    }
    
    setLoading(true)
    const method = editProdId ? 'PUT' : 'POST'
    const url = editProdId ? `/api/products/${editProdId}` : '/api/products'
    try {
      const res = await fetch(url, { method, headers:authHeader(), body:JSON.stringify(prodForm) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan')
      showToast(editProdId ? '✅ Produk diperbarui!' : '✅ Produk ditambahkan!')
      setProdForm(PROD_INIT); setEditProdId(null); setImgPreview(null); setShowProdForm(false)
      await fetchAll()
    } catch (err) {
      console.error('saveProd error:', err)
      showToast('Gagal menyimpan produk.','error')
    } finally {
      setLoading(false)
    }
  }

  const editProd = p => {
    setProdForm({ 
      name:p.name, 
      variants:p.variants||[], 
      unit:p.unit, 
      desc:p.desc, 
      inStock:p.inStock, 
      imgBase64:p.imgBase64||'' 
    })
    setImgPreview(p.imgBase64||null); setEditProdId(p.id); setShowProdForm(true)
    window.scrollTo({ top: 0, behavior:'smooth' })
  }

  const deleteProd = async p => {
    if (!confirm(`Hapus produk "${p.name}"?`)) return
    setLoading(true)
    try {
      const res = await fetch(`/api/products/${p.id}`, { method:'DELETE', headers:authHeader() })
      if (!res.ok) throw new Error('Gagal menghapus')
      showToast('🗑️ Produk dihapus!','success')
      await fetchAll()
    } catch (err) {
      console.error('deleteProd error:', err)
      showToast('Gagal menghapus produk.','error')
    } finally {
      setLoading(false)
    }
  }

  const toggleStok = async p => {
    setLoading(true)
    try {
      const res = await fetch(`/api/products/${p.id}`, { 
        method:'PUT', 
        headers:authHeader(), 
        body:JSON.stringify({ ...p, inStock:!p.inStock }) 
      })
      if (!res.ok) throw new Error('Gagal mengubah stok')
      showToast(!p.inStock ? '✅ Stok tersedia' : '❌ Stok habis')
      await fetchAll()
    } catch (err) {
      console.error('toggleStok error:', err)
      showToast('Gagal mengubah stok.','error')
    } finally {
      setLoading(false)
    }
  }

  // ═════════════════════════════════════════════════════════════════
  // SEMBAKO HANDLERS - WITH VARIANTS
  // ═════════════════════════════════════════════════════════════════

  const handleSembakoImgChange = e => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      setSembakoForm(p => ({ ...p, imgBase64: ev.target.result }))
      setSembakoImgPreview(ev.target.result)
    }
    reader.readAsDataURL(file)
  }

  const addSembakoVariant = () => {
    setSembakoForm(p => ({
      ...p,
      variants: [...(p.variants || []), { size: '', price: '' }]
    }))
  }

  const updateSembakoVariant = (idx, key, val) => {
    setSembakoForm(p => ({
      ...p,
      variants: p.variants.map((v, i) => i === idx ? { ...v, [key]: val } : v)
    }))
  }

  const removeSembakoVariant = (idx) => {
    setSembakoForm(p => ({
      ...p,
      variants: p.variants.filter((_, i) => i !== idx)
    }))
  }

  const saveSembako = async () => {
    if (!sembakoForm.name.trim()) { 
      showToast('Isi nama sembako!','error')
      return 
    }
    if (!sembakoForm.variants || sembakoForm.variants.length === 0) {
      showToast('Tambahkan minimal 1 varian ukuran!','error')
      return
    }
    if (sembakoForm.variants.some(v => !v.size || !v.price)) {
      showToast('Semua varian harus punya ukuran dan harga!','error')
      return
    }
    
    setLoading(true)
    const method = editSembakoId ? 'PUT' : 'POST'
    const url = editSembakoId ? `/api/sembako/${editSembakoId}` : '/api/sembako'
    
    try {
      console.log(`📤 ${method} ${url}`, sembakoForm)
      
      const res = await fetch(url, { 
        method, 
        headers:authHeader(), 
        body:JSON.stringify(sembakoForm) 
      })
      
      const data = await res.json()
      console.log('Response:', data)
      
      if (!res.ok) {
        showToast(data.error || 'Gagal menyimpan sembako','error')
        return
      }
      
      showToast(editSembakoId ? '✅ Sembako diperbarui!' : '✅ Sembako ditambahkan!')
      setSembakoForm(SEMBAKO_INIT)
      setEditSembakoId(null)
      setSembakoImgPreview(null)
      setShowSembakoForm(false)
      
      console.log('🔄 Refreshing sembako data...')
      await fetchAll()
    } catch (err) {
      console.error('❌ saveSembako error:', err)
      showToast('Gagal menyimpan sembako.','error')
    } finally {
      setLoading(false)
    }
  }

  const editSembako = p => {
    setSembakoForm({ 
      name:p.name, 
      variants:p.variants||[], 
      desc:p.desc, 
      inStock:p.inStock, 
      imgBase64:p.imgBase64||'' 
    })
    setSembakoImgPreview(p.imgBase64||null)
    setEditSembakoId(p.id)
    setShowSembakoForm(true)
    window.scrollTo({ top: 0, behavior:'smooth' })
  }

  const deleteSembako = async p => {
    if (!confirm(`Hapus sembako "${p.name}"?`)) return
    
    setLoading(true)
    try {
      console.log(`🗑️ DELETE /api/sembako/${p.id}`)
      
      const res = await fetch(`/api/sembako/${p.id}`, { 
        method:'DELETE', 
        headers:authHeader() 
      })
      
      if (!res.ok) {
        const data = await res.json()
        showToast(data.error || 'Gagal menghapus sembako','error')
        return
      }
      
      showToast('✅ Sembako dihapus!','success')
      console.log('🔄 Refreshing sembako data...')
      await fetchAll()
    } catch (err) {
      console.error('❌ deleteSembako error:', err)
      showToast('Gagal menghapus sembako.','error')
    } finally {
      setLoading(false)
    }
  }

  const toggleSembakoStok = async p => {
    setLoading(true)
    try {
      console.log(`📤 PUT /api/sembako/${p.id} - Toggle stock`)
      
      const res = await fetch(`/api/sembako/${p.id}`, {
        method:'PUT',
        headers:authHeader(),
        body:JSON.stringify({ ...p, inStock:!p.inStock })
      })
      
      if (!res.ok) {
        const data = await res.json()
        showToast(data.error || 'Gagal mengubah stok','error')
        return
      }
      
      showToast(!p.inStock ? '✅ Stok tersedia' : '❌ Stok habis')
      console.log('🔄 Refreshing sembako data...')
      await fetchAll()
    } catch (err) {
      console.error('❌ toggleSembakoStok error:', err)
      showToast('Gagal mengubah stok.','error')
    } finally {
      setLoading(false)
    }
  }

  // ═════════════════════════════════════════════════════════════════
  // ORDER HANDLERS - UPDATE STATUS & SEND EMAIL NOTIFICATION
  // ═════════════════════════════════════════════════════════════════

  const updateOrderStatus = async (orderId, newStatus) => {
    setLoading(true)
    try {
      const token = getToken()
      console.log('🔐 Token:', token ? '✅ Ada' : '❌ Tidak ada')
      console.log('📤 Headers:', authHeader())
      
      const order = orders.find(o => o.id === orderId)
      if (!order) throw new Error('Pesanan tidak ditemukan')

      console.log(`📤 Mengubah status pesanan #${orderId} ke "${newStatus}"...`)

      const updateRes = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: authHeader(),
        body: JSON.stringify({ status: newStatus })
      })

      if (!updateRes.ok) {
        const errorData = await updateRes.json()
        throw new Error(errorData.error || 'Gagal mengubah status pesanan')
      }

      console.log(`✅ Status pesanan berhasil diubah ke "${newStatus}"`)

      if (newStatus === 'selesai') {
        console.log(`📧 Mengirim notifikasi email ke ${order.email}...`)
        await sendOrderReadyEmail(orderId, order)
      }

      showToast(`✅ Status pesanan diubah menjadi ${getStatus(newStatus).label}`)
      
      await fetchAll()
    } catch (err) {
      console.error('❌ updateOrderStatus error:', err)
      showToast('Gagal mengubah status pesanan.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const sendOrderReadyEmail = async (orderId, order) => {
    try {
      if (!order.email) {
        showToast('Email pelanggan tidak tersedia. Email tidak dikirim.', 'warning')
        return
      }

      const customerName = order.nama || 'Pelanggan'

      console.log(`📧 Preparing email to ${order.email}...`)

      const notificationRes = await fetch('/api/orders/send-notification', {
        method: 'POST',
        headers: authHeader(),
        body: JSON.stringify({
          orderId: orderId,
          customerEmail: order.email,
          customerName: customerName,
          orderTotal: order.total || 0
        })
      })

      const notificationData = await notificationRes.json()

      if (!notificationRes.ok) {
        console.error('❌ Email send error:', notificationData.error)
        showToast(
          'Pesanan diperbarui, tapi gagal mengirim email notifikasi.',
          'warning'
        )
        return
      }

      console.log(`✅ Email berhasil dikirim!`)
      console.log(`📨 Message ID: ${notificationData.messageId}`)
      showToast('✅ Email notifikasi berhasil dikirim ke pelanggan!', 'success')
    } catch (err) {
      console.error('❌ sendOrderReadyEmail error:', err)
      showToast(
        'Pesanan diperbarui, tapi gagal mengirim email notifikasi.',
        'warning'
      )
    }
  }

  // ─── STATS ───
  const totalRevenue = orders.reduce((s, o) => s + (o.total||0), 0)
  const pendingCount = orders.filter(o => !o.status || o.status==='pending').length
  const doneCount = orders.filter(o => o.status==='selesai').length
  const prodHabis = products.filter(p => !p.inStock).length
  const sembakoHabis = sembakoProducts.filter(p => !p.inStock).length

  const filteredOrders = orderStatusFilter === 'all' 
    ? orders 
    : orders.filter(o => (o.status || 'pending') === orderStatusFilter)

  // ═════════════════════════════════════════════════════════════════
  // RENDER LOADING
  // ═════════════════════════════════════════════════════════════════

  if (authLoading) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg-main)' }}>
      <div style={{ color:'var(--text-sub)', fontSize:16 }}>⏳ Memuat...</div>
    </div>
  )

  // ═════════════════════════════════════════════════════════════════
  // RENDER LOGIN
  // ═════════════════════════════════════════════════════════════════

  if (!user) return (
    <div style={{ minHeight:'100vh', background:'var(--bg-main)', display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }}>
      <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:22, padding:'2.5rem 2rem', width:'100%', maxWidth:380, boxShadow:'0 20px 60px rgba(0,0,0,0.3)' }}>
        <div style={{ textAlign:'center', marginBottom:'2rem' }}>
          <div style={{ fontSize:'2.5rem', marginBottom:8 }}>🔐</div>
          <h1 style={{ fontSize:'1.4rem', fontWeight:800, color:'var(--text-main)', marginBottom:4 }}>Admin Login</h1>
          <p style={{ fontSize:13, color:'var(--text-sub)' }}>HA BIBI SNACK CORNER Dashboard</p>
        </div>
        <div>
          <div style={{ marginBottom:14 }}>
            <label style={{ fontSize:11, fontWeight:700, color:'var(--text-sub)', textTransform:'uppercase', display:'block', marginBottom:5 }}>Email</label>
            <input style={inp} type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="admin@habibi.com" />
          </div>
          <div style={{ marginBottom:18 }}>
            <label style={{ fontSize:11, fontWeight:700, color:'var(--text-sub)', textTransform:'uppercase', display:'block', marginBottom:5 }}>Password</label>
            <input style={inp} type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" />
          </div>
          {authError && <p style={{ color:'#f87171', fontSize:12, marginBottom:12, textAlign:'center' }}>{authError}</p>}
          <button onClick={handleLogin} style={{ width:'100%', padding:12, background:'linear-gradient(135deg,#D4AF37,#B8956A)', color:'#3D2817', border:'none', borderRadius:12, fontWeight:700, fontSize:14, cursor:'pointer', fontFamily:'Poppins,sans-serif' }}>🚀 Login</button>
        </div>
        <button onClick={()=>router.push('/')} style={{ marginTop:12, width:'100%', padding:10, background:'transparent', color:'var(--text-sub)', border:'1px solid var(--border)', borderRadius:10, fontSize:13, cursor:'pointer', fontFamily:'Poppins,sans-serif' }}>← Kembali ke Toko</button>
      </div>
    </div>
  )

  // ═════════════════════════════════════════════════════════════════
  // RENDER DASHBOARD
  // ═════════════════════════════════════════════════════════════════

  return (
    <div>
      <Navbar />
      <Toast msg={toast.msg} type={toast.type} />

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

        {/* TABS */}
        <div style={{ display:'flex', gap:8, marginBottom:'2rem', flexWrap:'wrap' }}>
          <TabBtn active={tab==='dashboard'} onClick={()=>setTab('dashboard')} icon="📊" label="Dashboard" />
          <TabBtn active={tab==='produk'} onClick={()=>setTab('produk')} icon="🔥" label="Angkringan" />
          <TabBtn active={tab==='sembako'} onClick={()=>setTab('sembako')} icon="🛒" label="Sembako" />
          <TabBtn active={tab==='pesanan'} onClick={()=>setTab('pesanan')} icon="📦" label="Pesanan" />
          <TabBtn active={tab==='pengguna'} onClick={()=>setTab('pengguna')} icon="👥" label="Pengguna" />
        </div>

        {/* DASHBOARD TAB */}
        {tab==='dashboard' && (
          <div>
            <SectionLabel icon="📊" title="Ringkasan" />
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:'1rem', marginBottom:'2.5rem' }}>
              <StatCard icon="💰" label="Total Pendapatan" value={`Rp ${totalRevenue.toLocaleString('id-ID')}`} sub="Semua pesanan" color="#D4AF37" />
              <StatCard icon="📦" label="Total Pesanan" value={orders.length} sub={`${pendingCount} menunggu`} color="#60a5fa" />
              <StatCard icon="✅" label="Selesai" value={doneCount} sub="Berhasil" color="#4ade80" />
              <StatCard icon="🔥" label="Angkringan" value={products.length} sub={`${prodHabis} habis`} color="#D4AF37" />
              <StatCard icon="🛒" label="Sembako" value={sembakoProducts.length} sub={`${sembakoHabis} habis`} color="#f472b6" />
              <StatCard icon="👥" label="Pengguna" value={users.length} sub="Terdaftar" color="#fbbf24" />
            </div>
          </div>
        )}

        {/* PRODUK ANGKRINGAN TAB - WITH PRICE & FLAVOR VARIANTS */}
        {tab==='produk' && (
          <div>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem', flexWrap:'wrap', gap:8 }}>
              <SectionLabel icon="🔥" title="Manajemen Angkringan" />
              <button onClick={()=>{ setShowProdForm(!showProdForm); setEditProdId(null); setProdForm(PROD_INIT); setImgPreview(null) }} disabled={loading} style={{ padding:'9px 18px', background:'linear-gradient(135deg,#D4AF37,#B8956A)', color:'#3D2817', border:'none', borderRadius:10, fontWeight:700, fontSize:13, cursor:loading?'not-allowed':'pointer', opacity:loading?0.6:1, fontFamily:'Poppins,sans-serif' }}>
                {showProdForm ? '✕ Batal' : '+ Tambah Angkringan'}
              </button>
            </div>

            {showProdForm && (
              <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:16, padding:'1.4rem', marginBottom:'1.5rem' }}>
                <p style={{ fontWeight:700, fontSize:14, color:'var(--text-main)', marginBottom:'1rem' }}>{editProdId?'✏️ Edit Angkringan':'➕ Tambah Angkringan Baru'}</p>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:12 }}>
                  <div style={{ gridColumn:'1/-1' }}>
                    <label style={{ fontSize:11, fontWeight:700, color:'var(--text-sub)', textTransform:'uppercase', display:'block', marginBottom:5 }}>Nama Produk</label>
                    <input style={inp} type="text" value={prodForm.name} onChange={e=>setProdForm(p=>({...p,name:e.target.value}))} placeholder="Cireng" />
                  </div>
                  <div>
                    <label style={{ fontSize:11, fontWeight:700, color:'var(--text-sub)', textTransform:'uppercase', display:'block', marginBottom:5 }}>Satuan</label>
                    <input style={inp} type="text" value={prodForm.unit} onChange={e=>setProdForm(p=>({...p,unit:e.target.value}))} placeholder="1 pcs, 1 porsi" />
                  </div>
                  <div style={{ gridColumn:'1/-1' }}>
                    <label style={{ fontSize:11, fontWeight:700, color:'var(--text-sub)', textTransform:'uppercase', display:'block', marginBottom:5 }}>Deskripsi</label>
                    <input style={inp} type="text" value={prodForm.desc} onChange={e=>setProdForm(p=>({...p,desc:e.target.value}))} placeholder="Deskripsi singkat..." />
                  </div>

                  {/* PRODUCT VARIANTS - PRICE & FLAVOR */}
                  <div style={{ gridColumn:'1/-1' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
                      <label style={{ fontSize:11, fontWeight:700, color:'var(--text-sub)', textTransform:'uppercase' }}>💰 Varian Harga & Rasa</label>
                      <button onClick={addProductVariant} disabled={loading} style={{ padding:'6px 12px', background:'rgba(212,175,55,0.12)', border:'1px solid rgba(212,175,55,0.3)', color:'#D4AF37', borderRadius:8, fontWeight:700, fontSize:11, cursor:loading?'not-allowed':'pointer', fontFamily:'Poppins,sans-serif' }}>+ Tambah</button>
                    </div>
                    {prodForm.variants?.map((v, idx) => (
                      <div key={idx} style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr auto', gap:8, marginBottom:8, alignItems:'flex-end' }}>
                        <div>
                          <label style={{ fontSize:10, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', display:'block', marginBottom:3 }}>Label (Harga)</label>
                          <input style={inp} type="text" value={v.label} onChange={e=>updateProductVariant(idx,'label',e.target.value)} placeholder="Rp 1000" />
                        </div>
                        <div>
                          <label style={{ fontSize:10, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', display:'block', marginBottom:3 }}>Rasa</label>
                          <select style={{...inp}} value={v.flavor || 'original'} onChange={e=>updateProductVariant(idx,'flavor',e.target.value)}>
                            <option value="original">Original</option>
                            <option value="pedas">Pedas</option>
                          </select>
                        </div>
                        <div>
                          <label style={{ fontSize:10, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', display:'block', marginBottom:3 }}>Harga (Rp)</label>
                          <input style={inp} type="number" value={v.price} onChange={e=>updateProductVariant(idx,'price',e.target.value)} placeholder="1000" />
                        </div>
                        <button onClick={()=>removeProductVariant(idx)} disabled={loading} style={{ padding:'6px 10px', background:'rgba(248,113,113,0.12)', border:'1px solid rgba(248,113,113,0.3)', color:'#f87171', borderRadius:8, fontSize:11, fontWeight:700, cursor:loading?'not-allowed':'pointer', fontFamily:'Poppins,sans-serif' }}>🗑️</button>
                      </div>
                    ))}
                  </div>

                  <div style={{ gridColumn:'1/-1' }}>
                    <label style={{ fontSize:11, fontWeight:700, color:'var(--text-sub)', textTransform:'uppercase', display:'block', marginBottom:8 }}>📷 Foto</label>
                    <div style={{ display:'flex', gap:16, alignItems:'flex-start', flexWrap:'wrap' }}>
                      <div style={{ width:120, height:120, borderRadius:12, border:'2px dashed var(--border-input)', background:'var(--bg-input)', display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden', flexShrink:0 }}>
                        {imgPreview ? <img src={imgPreview} alt="preview" style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : <span style={{ fontSize:'2.5rem' }}>🖼️</span>}
                      </div>
                      <div style={{ flex:1 }}>
                        <label style={{ display:'inline-block', padding:'9px 18px', background:'rgba(212,175,55,0.12)', border:'1.5px solid rgba(212,175,55,0.35)', borderRadius:10, color:'#D4AF37', fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:'Poppins,sans-serif' }}>
                          📁 Pilih Foto
                          <input type="file" accept="image/*" onChange={handleImgChange} style={{ display:'none' }} />
                        </label>
                        <p style={{ fontSize:11, color:'var(--text-muted)', marginTop:8 }}>JPG, PNG, WEBP</p>
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
                  <button onClick={saveProd} disabled={loading} style={{ padding:'9px 22px', background:'linear-gradient(135deg,#D4AF37,#B8956A)', color:'#3D2817', border:'none', borderRadius:10, fontWeight:700, fontSize:13, cursor:loading?'not-allowed':'pointer', opacity:loading?0.6:1, fontFamily:'Poppins,sans-serif' }}>{loading?'⏳ Menyimpan...':'💾 Simpan'}</button>
                  <button onClick={()=>{ setShowProdForm(false); setEditProdId(null); setImgPreview(null) }} disabled={loading} style={{ padding:'9px 18px', background:'transparent', color:'var(--text-sub)', border:'1px solid var(--border)', borderRadius:10, fontWeight:600, fontSize:13, cursor:loading?'not-allowed':'pointer', opacity:loading?0.6:1, fontFamily:'Poppins,sans-serif' }}>Batal</button>
                </div>
              </div>
            )}

            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:'1rem' }}>
              {products.length===0
                ? <p style={{ color:'var(--text-muted)', fontSize:13 }}>Belum ada angkringan.</p>
                : products.map(p=>(
                  <div key={p.id} style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:16, overflow:'hidden' }}>
                    <div style={{ position:'relative', height:160, background:'var(--bg-input)' }}>
                      {p.imgBase64 ? <img src={p.imgBase64} alt={p.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'3rem' }}>🍡</div>}
                      <span style={{ position:'absolute', top:8, right:8, padding:'4px 10px', borderRadius:8, fontSize:11, fontWeight:700, background:p.inStock?'rgba(212,175,55,0.9)':'rgba(139,111,71,0.9)', color:'#fff' }}>{p.inStock?'✅ Ada':'❌ Habis'}</span>
                    </div>
                    <div style={{ padding:'0.9rem' }}>
                      <div style={{ fontSize:14, fontWeight:700, color:'var(--text-main)', marginBottom:2 }}>{p.name}</div>
                      <div style={{ fontSize:10, color:'var(--text-muted)', marginBottom:6, maxHeight:80, overflowY:'auto' }}>
                        {p.variants?.map((v,i) => <div key={i}>• {v.label} ({v.flavor}) - Rp {Number(v.price).toLocaleString('id-ID')}</div>)}
                      </div>
                      <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                        <button onClick={()=>toggleStok(p)} disabled={loading} style={{ flex:1, padding:'6px', borderRadius:8, border:'none', background:p.inStock?'rgba(139,111,71,0.12)':'rgba(212,175,55,0.12)', color:p.inStock?'#8B6F47':'#D4AF37', fontWeight:700, fontSize:11, cursor:loading?'not-allowed':'pointer', opacity:loading?0.6:1, fontFamily:'Poppins,sans-serif' }}>{p.inStock?'❌ Habiskan':'✅ Buka'}</button>
                        <button onClick={()=>editProd(p)} disabled={loading} style={{ padding:'6px 12px', background:'rgba(96,165,250,0.12)', border:'1px solid rgba(96,165,250,0.3)', color:'#60a5fa', borderRadius:8, fontSize:11, fontWeight:700, cursor:loading?'not-allowed':'pointer', opacity:loading?0.6:1, fontFamily:'Poppins,sans-serif' }}>✏️</button>
                        <button onClick={()=>deleteProd(p)} disabled={loading} style={{ padding:'6px 12px', background:'rgba(139,111,71,0.12)', border:'1px solid rgba(139,111,71,0.3)', color:'#8B6F47', borderRadius:8, fontSize:11, fontWeight:700, cursor:loading?'not-allowed':'pointer', opacity:loading?0.6:1, fontFamily:'Poppins,sans-serif' }}>🗑️</button>
                      </div>
                    </div>
                  </div>
                ))
              }
            </div>
          </div>
        )}

        {/* SEMBAKO TAB - WITH VARIANTS */}
        {tab==='sembako' && (
          <div>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem', flexWrap:'wrap', gap:8 }}>
              <SectionLabel icon="🛒" title="Manajemen Sembako" />
              <button onClick={()=>{ setShowSembakoForm(!showSembakoForm); setEditSembakoId(null); setSembakoForm(SEMBAKO_INIT); setSembakoImgPreview(null) }} disabled={loading} style={{ padding:'9px 18px', background:'linear-gradient(135deg,#D4AF37,#B8956A)', color:'#3D2817', border:'none', borderRadius:10, fontWeight:700, fontSize:13, cursor:loading?'not-allowed':'pointer', opacity:loading?0.6:1, fontFamily:'Poppins,sans-serif' }}>
                {showSembakoForm ? '✕ Batal' : '+ Tambah Sembako'}
              </button>
            </div>

            {showSembakoForm && (
              <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:16, padding:'1.4rem', marginBottom:'1.5rem' }}>
                <p style={{ fontWeight:700, fontSize:14, color:'var(--text-main)', marginBottom:'1rem' }}>{editSembakoId?'✏️ Edit Sembako':'➕ Tambah Sembako Baru'}</p>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:12 }}>
                  <div style={{ gridColumn:'1/-1' }}>
                    <label style={{ fontSize:11, fontWeight:700, color:'var(--text-sub)', textTransform:'uppercase', display:'block', marginBottom:5 }}>Nama Produk</label>
                    <input style={inp} type="text" value={sembakoForm.name} onChange={e=>setSembakoForm(p=>({...p,name:e.target.value}))} placeholder="Beras 5kg" />
                  </div>
                  <div style={{ gridColumn:'1/-1' }}>
                    <label style={{ fontSize:11, fontWeight:700, color:'var(--text-sub)', textTransform:'uppercase', display:'block', marginBottom:5 }}>Deskripsi</label>
                    <input style={inp} type="text" value={sembakoForm.desc} onChange={e=>setSembakoForm(p=>({...p,desc:e.target.value}))} placeholder="Deskripsi singkat..." />
                  </div>

                  <div style={{ gridColumn:'1/-1' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
                      <label style={{ fontSize:11, fontWeight:700, color:'var(--text-sub)', textTransform:'uppercase' }}>📏 Varian Ukuran & Harga</label>
                      <button onClick={addSembakoVariant} disabled={loading} style={{ padding:'6px 12px', background:'rgba(212,175,55,0.12)', border:'1px solid rgba(212,175,55,0.3)', color:'#D4AF37', borderRadius:8, fontWeight:700, fontSize:11, cursor:loading?'not-allowed':'pointer', fontFamily:'Poppins,sans-serif' }}>+ Tambah</button>
                    </div>
                    {sembakoForm.variants?.map((v, idx) => (
                      <div key={idx} style={{ display:'grid', gridTemplateColumns:'1fr 1fr auto', gap:8, marginBottom:8, alignItems:'flex-end' }}>
                        <div>
                          <label style={{ fontSize:10, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', display:'block', marginBottom:3 }}>Ukuran</label>
                          <input style={inp} type="text" value={v.size} onChange={e=>updateSembakoVariant(idx,'size',e.target.value)} placeholder="Contoh: 1kg, 5kg, pack" />
                        </div>
                        <div>
                          <label style={{ fontSize:10, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', display:'block', marginBottom:3 }}>Harga (Rp)</label>
                          <input style={inp} type="number" value={v.price} onChange={e=>updateSembakoVariant(idx,'price',e.target.value)} placeholder="50000" />
                        </div>
                        <button onClick={()=>removeSembakoVariant(idx)} disabled={loading} style={{ padding:'6px 10px', background:'rgba(248,113,113,0.12)', border:'1px solid rgba(248,113,113,0.3)', color:'#f87171', borderRadius:8, fontSize:11, fontWeight:700, cursor:loading?'not-allowed':'pointer', fontFamily:'Poppins,sans-serif' }}>🗑️</button>
                      </div>
                    ))}
                  </div>

                  <div style={{ gridColumn:'1/-1' }}>
                    <label style={{ fontSize:11, fontWeight:700, color:'var(--text-sub)', textTransform:'uppercase', display:'block', marginBottom:8 }}>📷 Foto</label>
                    <div style={{ display:'flex', gap:16, alignItems:'flex-start', flexWrap:'wrap' }}>
                      <div style={{ width:120, height:120, borderRadius:12, border:'2px dashed var(--border-input)', background:'var(--bg-input)', display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden', flexShrink:0 }}>
                        {sembakoImgPreview ? <img src={sembakoImgPreview} alt="preview" style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : <span style={{ fontSize:'2.5rem' }}>🏪</span>}
                      </div>
                      <div style={{ flex:1 }}>
                        <label style={{ display:'inline-block', padding:'9px 18px', background:'rgba(212,175,55,0.12)', border:'1.5px solid rgba(212,175,55,0.35)', borderRadius:10, color:'#D4AF37', fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:'Poppins,sans-serif' }}>
                          📁 Pilih Foto
                          <input type="file" accept="image/*" onChange={handleSembakoImgChange} style={{ display:'none' }} />
                        </label>
                        <p style={{ fontSize:11, color:'var(--text-muted)', marginTop:8 }}>JPG, PNG, WEBP</p>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize:13, fontWeight:600, color:'var(--text-main)', cursor:'pointer', display:'flex', alignItems:'center', gap:8 }}>
                      <input type="checkbox" checked={sembakoForm.inStock} onChange={e=>setSembakoForm(p=>({...p,inStock:e.target.checked}))} />
                      Stok Tersedia
                    </label>
                  </div>
                </div>
                <div style={{ display:'flex', gap:10, marginTop:16 }}>
                  <button onClick={saveSembako} disabled={loading} style={{ padding:'9px 22px', background:'linear-gradient(135deg,#D4AF37,#B8956A)', color:'#3D2817', border:'none', borderRadius:10, fontWeight:700, fontSize:13, cursor:loading?'not-allowed':'pointer', opacity:loading?0.6:1, fontFamily:'Poppins,sans-serif' }}>{loading?'⏳ Menyimpan...':'💾 Simpan'}</button>
                  <button onClick={()=>{ setShowSembakoForm(false); setEditSembakoId(null); setSembakoImgPreview(null) }} disabled={loading} style={{ padding:'9px 18px', background:'transparent', color:'var(--text-sub)', border:'1px solid var(--border)', borderRadius:10, fontWeight:600, fontSize:13, cursor:loading?'not-allowed':'pointer', opacity:loading?0.6:1, fontFamily:'Poppins,sans-serif' }}>Batal</button>
                </div>
              </div>
            )}

            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:'1rem' }}>
              {sembakoProducts.length===0
                ? <div style={{ gridColumn:'1/-1', padding:'2rem', textAlign:'center', background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:16, color:'var(--text-muted)' }}>
                    {loading ? '⏳ Memuat sembako...' : '📭 Belum ada sembako. Klik "Tambah Sembako" untuk mulai!'}
                  </div>
                : sembakoProducts.map(p=>(
                  <div key={p.id} style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:16, overflow:'hidden' }}>
                    <div style={{ position:'relative', height:160, background:'var(--bg-input)' }}>
                      {p.imgBase64 ? <img src={p.imgBase64} alt={p.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'3rem' }}>🏪</div>}
                      <span style={{ position:'absolute', top:8, right:8, padding:'4px 10px', borderRadius:8, fontSize:11, fontWeight:700, background:p.inStock?'rgba(212,175,55,0.9)':'rgba(139,111,71,0.9)', color:'#fff' }}>{p.inStock?'✅ Ada':'❌ Habis'}</span>
                    </div>
                    <div style={{ padding:'0.9rem' }}>
                      <div style={{ fontSize:14, fontWeight:700, color:'var(--text-main)', marginBottom:2 }}>{p.name}</div>
                      <div style={{ fontSize:10, color:'var(--text-muted)', marginBottom:6, maxHeight:60, overflowY:'auto' }}>
                        {p.variants?.map((v,i) => <div key={i}>• {v.size} - Rp {Number(v.price).toLocaleString('id-ID')}</div>)}
                      </div>
                      <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                        <button onClick={()=>toggleSembakoStok(p)} disabled={loading} style={{ flex:1, padding:'6px', borderRadius:8, border:'none', background:p.inStock?'rgba(139,111,71,0.12)':'rgba(212,175,55,0.12)', color:p.inStock?'#8B6F47':'#D4AF37', fontWeight:700, fontSize:11, cursor:loading?'not-allowed':'pointer', opacity:loading?0.6:1, fontFamily:'Poppins,sans-serif' }}>{p.inStock?'❌ Habiskan':'✅ Buka'}</button>
                        <button onClick={()=>editSembako(p)} disabled={loading} style={{ padding:'6px 12px', background:'rgba(96,165,250,0.12)', border:'1px solid rgba(96,165,250,0.3)', color:'#60a5fa', borderRadius:8, fontSize:11, fontWeight:700, cursor:loading?'not-allowed':'pointer', opacity:loading?0.6:1, fontFamily:'Poppins,sans-serif' }}>✏️</button>
                        <button onClick={()=>deleteSembako(p)} disabled={loading} style={{ padding:'6px 12px', background:'rgba(139,111,71,0.12)', border:'1px solid rgba(139,111,71,0.3)', color:'#8B6F47', borderRadius:8, fontSize:11, fontWeight:700, cursor:loading?'not-allowed':'pointer', opacity:loading?0.6:1, fontFamily:'Poppins,sans-serif' }}>🗑️</button>
                      </div>
                    </div>
                  </div>
                ))
              }
            </div>
          </div>
        )}

        {/* PESANAN TAB */}
        {tab==='pesanan' && (
          <div>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem', flexWrap:'wrap', gap:8 }}>
              <SectionLabel icon="📦" title="Manajemen Pesanan" />
              <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                {['all', 'pending', 'proses', 'selesai', 'batal'].map(st => (
                  <button 
                    key={st}
                    onClick={() => setOrderStatusFilter(st)}
                    style={{ 
                      padding:'6px 12px', 
                      background: orderStatusFilter === st ? 'linear-gradient(135deg,#D4AF37,#B8956A)' : 'var(--bg-card)',
                      color: orderStatusFilter === st ? '#3D2817' : 'var(--text-sub)',
                      border: orderStatusFilter === st ? 'none' : '1px solid var(--border)',
                      borderRadius: 8, 
                      fontWeight: 700, 
                      fontSize: 11, 
                      cursor: 'pointer',
                      fontFamily: 'Poppins,sans-serif'
                    }}
                  >
                    {st === 'all' ? '📋 Semua' : st === 'pending' ? '⏳ Pending' : st === 'proses' ? '🔄 Proses' : st === 'selesai' ? '✅ Selesai' : '❌ Batal'}
                  </button>
                ))}
              </div>
            </div>

            {filteredOrders.length===0
              ? <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:16, padding:'3rem', textAlign:'center', color:'var(--text-muted)' }}>
                  📭 Belum ada pesanan dengan status ini.
                </div>
              : filteredOrders.map(o=>(
                  <div key={o.id} style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:16, padding:'1.2rem 1.4rem', marginBottom:'1rem' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:'1rem', marginBottom:'1rem' }}>
                      <div>
                        <div style={{ fontSize:14, fontWeight:700, color:'var(--text-main)' }}>{o.nama||'Anonim'}</div>
                        <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:4 }}>📧 {o.email||'-'}</div>
                        <div style={{ fontSize:12, color:'var(--text-muted)' }}>📱 {o.telp||'-'}</div>
                      </div>
                      <div style={{ textAlign:'right' }}>
                        <div style={{ fontSize:14, fontWeight:800, color:'#D4AF37' }}>Rp {(o.total||0).toLocaleString('id-ID')}</div>
                        <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:4 }}>Order ID: {o.id}</div>
                      </div>
                    </div>

                    <div style={{ background:'var(--bg-input)', borderRadius:12, padding:'0.8rem', marginBottom:'1rem' }}>
                      <div style={{ fontSize:11, fontWeight:700, color:'var(--text-muted)', marginBottom:6 }}>ITEM PESANAN</div>
                      {o.items?.map((item, idx) => (
                        <div key={idx} style={{ fontSize:12, color:'var(--text-main)', marginBottom:4 }}>
                          • {item.name} x{item.qty} = Rp {(item.subtotal||0).toLocaleString('id-ID')}
                        </div>
                      ))}
                    </div>

                    <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                      {['pending', 'proses', 'selesai', 'batal'].map(st => {
                        const config = statusConfig[st]
                        const isActive = (o.status || 'pending') === st
                        return (
                          <button
                            key={st}
                            onClick={() => updateOrderStatus(o.id, st)}
                            disabled={loading || isActive}
                            style={{
                              padding: '6px 12px',
                              background: isActive ? config.bg : 'var(--bg-input)',
                              border: `1px solid ${config.color}40`,
                              color: config.color,
                              borderRadius: 8,
                              fontSize: 11,
                              fontWeight: 700,
                              cursor: loading || isActive ? 'not-allowed' : 'pointer',
                              opacity: loading || isActive ? 0.6 : 1,
                              fontFamily: 'Poppins,sans-serif'
                            }}
                          >
                            {config.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))
            }
          </div>
        )}

        {/* PENGGUNA TAB */}
        {tab==='pengguna' && (
          <div>
            <SectionLabel icon="👥" title="Manajemen Pengguna" />
            <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:16, overflow:'hidden' }}>
              {users.length===0
                ? <p style={{ padding:'2rem', textAlign:'center', color:'var(--text-muted)', fontSize:13 }}>Belum ada pengguna.</p>
                : users.map((u,i)=>(
                  <div key={u.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 16px', borderBottom:i<users.length-1?'1px solid var(--border)':'none', flexWrap:'wrap' }}>
                    <div style={{ width:38, height:38, background:u.role==='admin'?'rgba(212,175,55,0.15)':'rgba(96,165,250,0.15)', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.2rem', flexShrink:0 }}>
                      {u.role==='admin'?'👨‍💼':'👤'}
                    </div>
                    <div style={{ flex:1, minWidth:140 }}>
                      <div style={{ fontSize:13, fontWeight:700, color:'var(--text-main)' }}>{u.nama}</div>
                      <div style={{ fontSize:11, color:'var(--text-muted)' }}>{u.email||'-'}</div>
                    </div>
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

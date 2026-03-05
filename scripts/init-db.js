// scripts/init-db.js
// Jalankan dengan: node scripts/init-db.js

const fs = require('fs')
const path = require('path')
const bcrypt = require('bcryptjs')

const DB_PATH = path.join(__dirname, '..', 'data', 'db.json')

async function initDatabase() {
  try {
    // Buat folder data jika belum ada
    const dir = path.dirname(DB_PATH)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
      console.log('✅ Folder data berhasil dibuat')
    }

    // Cek apakah database sudah ada
    if (fs.existsSync(DB_PATH)) {
      console.log('⚠️  Database sudah ada di:', DB_PATH)
      console.log('Hapus file tersebut jika ingin membuat database baru')
      return
    }

    // Hash password untuk admin default
    const hashedPassword = await bcrypt.hash('admin123', 10)

    // Data awal
    const initialData = {
      products: [
        {
          id: 1,
          name: 'Cireng Bumbu',
          price: 1000,
          unit: '1 pcs',
          desc: 'Cireng crispy dengan bumbu rahasia',
          inStock: true,
          imgBase64: '',
          createdAt: new Date().toISOString()
        },
        {
          id: 2,
          name: 'Cilok Kuah',
          price: 2000,
          unit: '1 porsi',
          desc: 'Cilok dengan kuah pedas',
          inStock: true,
          imgBase64: '',
          createdAt: new Date().toISOString()
        }
      ],
      orders: [],
      users: [
        {
          id: 1,
          nama: 'Admin HA BIBI',
          role: 'admin',
          email: 'admin@habibi.com',
          telp: '08123456789',
          password: hashedPassword,
          createdAt: new Date().toISOString()
        },
        {
          id: 2,
          nama: 'Ibu Siti',
          role: 'pelanggan',
          email: 'siti@contoh.com',
          telp: '08567890123',
          password: await bcrypt.hash('pelanggan123', 10),
          createdAt: new Date().toISOString()
        }
      ]
    }

    // Tulis ke file
    fs.writeFileSync(DB_PATH, JSON.stringify(initialData, null, 2))
    
    console.log('✅ Database berhasil diinisialisasi!')
    console.log('📍 Lokasi:', DB_PATH)
    console.log('\n👤 Akun Admin Default:')
    console.log('   Email: admin@habibi.com')
    console.log('   Password: admin123')
    console.log('\n🛍️ Produk sample: 2 item')
    console.log('👥 Pengguna: 2 akun (1 admin, 1 pelanggan)')
  } catch (error) {
    console.error('❌ Error saat inisialisasi database:', error)
  }
}

initDatabase()
'use client'
import { createContext, useContext, useState } from 'react'

const CartContext = createContext()

export const NOMOR_WA = '6283852930872'
export const ONGKIR   = 1000
export const MAX_KM   = 1
export const TOKO_LAT = -7.762126
export const TOKO_LNG = 113.770656

export function CartProvider({ children }) {
  const [cart, setCart]             = useState([])
  const [cartOpen, setCartOpen]     = useState(false)
  const [theme, setTheme]           = useState('light')
  const [qrisPaid, setQrisPaid]     = useState(false)
  const [qrisShown, setQrisShown]   = useState(false)
  const [qrisOpen, setQrisOpen]     = useState(false)
  const [pendingMsg, setPendingMsg] = useState('')

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    document.documentElement.setAttribute('data-theme', next)
  }

  const addToCart = (name, price, unit, qty) => {
    setCart(prev => {
      const ex = prev.find(i => i.name === name)
      if (ex) return prev.map(i => i.name === name ? { ...i, qty: i.qty + qty } : i)
      return [...prev, { name, price, unit, qty }]
    })
  }

  const removeFromCart = name =>
    setCart(prev => prev.filter(i => i.name !== name))

  const changeQty = (name, delta) => {
    setCart(prev => {
      const item = prev.find(i => i.name === name)
      if (!item) return prev
      if (item.qty + delta <= 0) return prev.filter(i => i.name !== name)
      return prev.map(i => i.name === name ? { ...i, qty: i.qty + delta } : i)
    })
  }

  const getSubtotal = () => cart.reduce((s, i) => s + i.price * i.qty, 0)
  const getTotalQty = () => cart.reduce((s, i) => s + i.qty, 0)

  const resetCart = () => {
    setCart([])
    setQrisPaid(false)
    setQrisShown(false)
    setQrisOpen(false)
    setCartOpen(false)
  }

  return (
    <CartContext.Provider value={{
      cart, addToCart, removeFromCart, changeQty,
      getSubtotal, getTotalQty,
      cartOpen, setCartOpen,
      theme, toggleTheme,
      qrisPaid, setQrisPaid,
      qrisShown, setQrisShown,
      qrisOpen, setQrisOpen,
      pendingMsg, setPendingMsg,
      resetCart,
    }}>
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => useContext(CartContext)
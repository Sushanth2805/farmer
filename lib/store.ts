import { create } from "zustand"
import { persist } from "zustand/middleware"

export type CartItem = {
  id: number
  productId?: string
  name: string
  price: number
  quantity: number
  unit: string
  farmer: string
  farmerId?: string
  farmerEmail?: string
  image: string
}

export type FavoriteItem = {
  id: number
  name: string
  farmer: string
  location: string
  price: number
  unit: string
  image: string
}

type Store = {
  cart: CartItem[]
  favorites: FavoriteItem[]
  addToCart: (item: CartItem) => void
  removeFromCart: (id: number) => void
  updateCartItemQuantity: (id: number, quantity: number) => void
  clearCart: () => void
  addToFavorites: (item: FavoriteItem) => void
  removeFromFavorites: (id: number) => void
  isFavorite: (id: number) => boolean
}

export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      cart: [],
      favorites: [],

      addToCart: (item) => {
        const { cart } = get()
        const existingItem = cart.find((cartItem) => cartItem.id === item.id)

        if (existingItem) {
          set({
            cart: cart.map((cartItem) =>
              cartItem.id === item.id ? { ...cartItem, quantity: cartItem.quantity + item.quantity } : cartItem,
            ),
          })
        } else {
          set({ cart: [...cart, item] })
        }
      },

      removeFromCart: (id) => {
        const { cart } = get()
        set({ cart: cart.filter((item) => item.id !== id) })
      },

      updateCartItemQuantity: (id, quantity) => {
        const { cart } = get()
        set({
          cart: cart.map((item) => (item.id === id ? { ...item, quantity } : item)),
        })
      },

      clearCart: () => set({ cart: [] }),

      addToFavorites: (item) => {
        const { favorites } = get()
        const existingItem = favorites.find((favItem) => favItem.id === item.id)

        if (!existingItem) {
          set({ favorites: [...favorites, item] })
        }
      },

      removeFromFavorites: (id) => {
        const { favorites } = get()
        set({ favorites: favorites.filter((item) => item.id !== id) })
      },

      isFavorite: (id) => {
        const { favorites } = get()
        return favorites.some((item) => item.id === id)
      },
    }),
    {
      name: "kisan-direct-storage",
    },
  ),
)

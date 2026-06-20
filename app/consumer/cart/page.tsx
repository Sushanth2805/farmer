"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/components/ui/use-toast"
import { useStore } from "@/lib/store"
import { Bell, ChevronLeft, Home, Leaf, LogOut, Minus, Plus, Settings, ShoppingCart, Trash, User } from 'lucide-react'
import { auth } from "@/lib/firebase"
import { signOut, getAuth, onAuthStateChanged } from "firebase/auth"

export default function CartPage() {
  const { toast } = useToast()
  const { cart, updateCartItemQuantity, removeFromCart, clearCart } = useStore()
  const [isCheckingOut, setIsCheckingOut] = useState(false)
  const [user, setUser] = useState<any>(null)
  const router = useRouter()

  const handleLogout = async () => {
    try {
      await signOut(auth)
      router.push("/auth/login")
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  useEffect(() => {
    const authInstance = getAuth()
    const unsubscribe = onAuthStateChanged(authInstance, (firebaseUser) => {
      if (firebaseUser) {
        setUser({
          uid: firebaseUser.uid,
          name: firebaseUser.displayName || null,
          email: firebaseUser.email || null,
          image: firebaseUser.photoURL || null,
        })
      } else {
        setUser(null)
      }
    })

    return () => unsubscribe()
  }, [])

  // Calculate totals
  const subtotal = cart.reduce((total, item) => total + item.price * item.quantity, 0)
  const deliveryFee = 50
  const total = subtotal + deliveryFee

  const handleQuantityChange = (id: number, newQuantity: number) => {
    if (newQuantity < 1) return
    updateCartItemQuantity(id, newQuantity)
  }

  const handleRemoveItem = (id: number) => {
    removeFromCart(id)
    toast({
      title: "Item removed",
      description: "The item has been removed from your cart.",
    })
  }

  const handleCheckout = () => {
    setIsCheckingOut(true)
    router.push("/consumer/checkout")
  }

  const showNotifications = () => {
    toast({ title: "No notifications", description: "Your cart updates are already reflected on this page." })
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="hidden w-64 flex-col bg-gray-50 border-r md:flex">
        <div className="flex h-14 items-center border-b px-4">
          <Link href="/consumer/dashboard" className="flex items-center gap-2 font-semibold">
            <Leaf className="h-5 w-5 text-green-600" />
            <span>Consumer Portal</span>
          </Link>
        </div>
        <nav className="flex-1 overflow-auto py-4">
          <div className="px-4 py-2">
            <h2 className="mb-2 text-xs font-semibold tracking-tight">Shopping</h2>
            <div className="space-y-1">
              <Link href="/consumer/dashboard">
                <Button variant="ghost" className="w-full justify-start">
                  <Home className="mr-2 h-4 w-4" />
                  Dashboard
                </Button>
              </Link>
              <Link href="/consumer/products">
                <Button variant="ghost" className="w-full justify-start">
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Products
                </Button>
              </Link>
            </div>
          </div>
        </nav>
        <div className="border-t p-4">
  <div className="flex items-center gap-4 mb-4">
    <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
      {user?.image ? (
        <img src={user.image || "/placeholder.svg"} alt="User" className="h-10 w-10 rounded-full" />
      ) : (
        <span className="text-sm font-semibold">
          {user?.name?.[0] || user?.email?.[0] || "U"}
        </span>
      )}
    </div>
    <div>
      <p className="text-sm font-medium">
        {user?.name || user?.email || "Unknown User"}
      </p>
      {/* {!editingLocation ? (
        <p className="text-xs text-gray-500">
          {location || (
            <button
              className="text-blue-500 underline"
              onClick={() => setEditingLocation(true)}
            >
              Add Location
            </button>
          )}
        </p>
      ) : (
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={newLocation}
            onChange={(e) => setNewLocation(e.target.value)}
            placeholder="Enter city"
            className="text-xs border px-2 py-1 rounded"
          />
          <button
            onClick={saveLocation}
            className="text-blue-600 text-xs underline"
          >
            Save
          </button>
        </div>
      )} */}
    </div>
  </div>
  <div className="flex items-center gap-2">
    <Link href="/consumer/settings">
      <Button variant="outline" size="sm" className="w-full">
        <Settings className="mr-2 h-4 w-4" />
        Settings
      </Button>
    </Link>
    <Button
      variant="outline"
      size="sm"
      onClick={handleLogout}
      className="text-red-600 hover:bg-red-100"
    >
      <LogOut className="h-4 w-4" />
    </Button>
  </div>
</div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="flex h-14 items-center border-b px-4 md:h-16">
          <Button variant="outline" size="sm" className="mr-4 md:hidden">
            <Leaf className="h-5 w-5 text-green-600" />
          </Button>
          <div className="ml-auto flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={showNotifications}>
              <Bell className="h-4 w-4" />
            </Button>
            
          </div>
        </div>

        <div className="p-4 md:p-6">
          <div className="flex items-center mb-6">
            <Button variant="ghost" size="sm" onClick={() => router.back()} className="mr-2">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
            <h1 className="text-2xl font-bold">Your Cart</h1>
          </div>

          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <ShoppingCart className="h-16 w-16 text-gray-300 mb-4" />
              <h2 className="text-xl font-semibold mb-2">Your cart is empty</h2>
              <p className="text-gray-500 mb-6">Looks like you haven't added any products to your cart yet.</p>
              <Link href="/consumer/products">
                <Button>Browse Products</Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Cart Items ({cart.length})</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {cart.map((item) => (
                      <div key={item.id} className="flex items-center space-x-4 py-2 border-b">
                        <div className="h-16 w-16 rounded-md overflow-hidden">
                          <img
                            src={item.image || "/placeholder.svg"}
                            alt={item.name}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium">{item.name}</h3>
                          <p className="text-sm text-gray-500">Farmer: {item.farmer}</p>
                          <p className="text-sm font-medium">Rs. {item.price}/{item.unit}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <Input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => handleQuantityChange(item.id, Number.parseInt(e.target.value) || 1)}
                            className="h-8 w-12 text-center"
                          />
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="text-right min-w-[80px]">
                          <p className="font-medium">Rs. {item.price * item.quantity}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleRemoveItem(item.id)}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button variant="outline" onClick={() => router.push("/consumer/products")}>
                      Continue Shopping
                    </Button>
                    <Button variant="ghost" onClick={() => clearCart()}>
                      Clear Cart
                    </Button>
                  </CardFooter>
                </Card>
              </div>

              <div>
                <Card>
                  <CardHeader>
                    <CardTitle>Order Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Subtotal</span>
                      <span>Rs. {subtotal}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Delivery Fee</span>
                      <span>Rs. {deliveryFee}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-medium text-lg">
                      <span>Total</span>
                      <span>Rs. {total}</span>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button className="w-full" onClick={handleCheckout} disabled={isCheckingOut}>
                      {isCheckingOut ? "Processing..." : "Place Order"}
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

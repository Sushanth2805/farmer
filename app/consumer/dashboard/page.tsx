"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Heart,
  Home,
  Leaf,
  LogOut,
  MapPin,
  MessageSquare,
  Search,
  Settings,
  ShoppingCart,
  User,
} from "lucide-react"
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { useStore } from "@/lib/store"
import { ensureDynamicDataSeeded, getOrdersForConsumer, getProducts, subscribeToDynamicData } from "@/lib/dynamic-data"

type FavoriteFarmerView = {
  name: string
  location: string
  email: string | null
  favoriteCount: number
  completedOrders: number
}

export default function ConsumerDashboard() {
  const { cart, favorites } = useStore()
  const [user, setUser] = useState<any>(null)
  const [recentOrders, setRecentOrders] = useState<any[]>([])
  const [favoriteFarmers, setFavoriteFarmers] = useState<FavoriteFarmerView[]>([])
  const router = useRouter()
  const cartCount = cart.reduce((total, item) => total + item.quantity, 0)

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

  useEffect(() => {
    ensureDynamicDataSeeded()
  }, [])

  useEffect(() => {
    if (!user?.uid) {
      setRecentOrders([])
      setFavoriteFarmers([])
      return
    }

    const syncDashboard = () => {
      const orders = [...getOrdersForConsumer(user.uid)].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      )

      setRecentOrders(
        orders.slice(0, 5).map((order) => ({
          id: order.id,
          items: order.items.map((item) => item.name).join(", "),
          farmer: order.items[0]?.farmer || "Farmer",
          date: new Date(order.date).toLocaleDateString("en-IN"),
          status:
            order.status === "delivered"
              ? "Delivered"
              : order.status === "shipped"
                ? "In Transit"
                : order.status === "processing"
                  ? "Processing"
                  : order.status === "cancelled"
                    ? "Cancelled"
                    : "Pending",
          amount: `Rs. ${order.total.toLocaleString()}`,
        })),
      )

      const products = getProducts()
      const farmerMap = new Map<string, FavoriteFarmerView>()

      favorites.forEach((favorite) => {
        const matchedProduct = products.find((item) => item.name === favorite.name && item.farmerName === favorite.farmer)
        const completedOrders = orders.filter(
          (order) => order.status === "delivered" && order.items.some((item) => item.farmer === favorite.farmer),
        ).length

        farmerMap.set(favorite.farmer, {
          name: favorite.farmer,
          location: matchedProduct?.location || favorite.location,
          email: matchedProduct?.farmerEmail || null,
          favoriteCount: (farmerMap.get(favorite.farmer)?.favoriteCount || 0) + 1,
          completedOrders: Math.max(farmerMap.get(favorite.farmer)?.completedOrders || 0, completedOrders),
        })
      })

      setFavoriteFarmers(Array.from(farmerMap.values()))
    }

    syncDashboard()
    return subscribeToDynamicData(syncDashboard)
  }, [favorites, user?.uid])

  const name = user?.name || "User"
  const primaryLocation = useMemo(() => favoriteFarmers[0]?.location || "All Locations", [favoriteFarmers])

  return (
    <div className="flex min-h-screen">
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
                <Button variant="secondary" className="w-full justify-start">
                  <Search className="mr-2 h-4 w-4" />
                  Discover Products
                </Button>
              </Link>
              <Link href="/consumer/cart">
                <Button variant="ghost" className="w-full justify-start">
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  My Cart
                </Button>
              </Link>
              <Link href="/consumer/favorites">
                <Button variant="secondary" className="w-full justify-start">
                  <Heart className="mr-2 h-4 w-4" />
                  Favorites
                  {favorites.length > 0 && (
                    <span className="ml-auto bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs">
                      {favorites.length}
                    </span>
                  )}
                </Button>
              </Link>
            </div>
          </div>
        </nav>
        <div className="border-t p-4">
          <div className="flex items-center gap-4 mb-4">
            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
              {user?.image ? (
                <img src={user.image} alt="User" className="h-10 w-10 rounded-full" />
              ) : (
                <span className="text-sm font-semibold">{user?.name?.[0] || user?.email?.[0] || "U"}</span>
              )}
            </div>
            <div>
              <p className="text-sm font-medium">{user?.name || user?.email || "Unknown User"}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/consumer/settings">
              <Button variant="outline" size="sm" className="w-full">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Button>
            </Link>
            <Button variant="outline" size="sm" onClick={handleLogout} className="text-red-600 hover:bg-red-100">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <div className="flex h-14 items-center border-b px-4 md:h-16">
          <Button variant="outline" size="sm" className="mr-4 md:hidden">
            <Leaf className="h-5 w-5 text-green-600" />
          </Button>
          <div className="ml-auto flex items-center gap-4">
            <Button variant="outline" size="sm">
              <MapPin className="h-4 w-4 mr-2" />
              {primaryLocation}
            </Button>
            <Button variant="outline" size="sm" onClick={() => router.push("/consumer/cart")}>
              <ShoppingCart className="h-4 w-4" />
              {cartCount > 0 && (
                <span className="ml-1 bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs">
                  {cartCount}
                </span>
              )}
            </Button>
          </div>
        </div>

        <div className="p-4 md:p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold">Welcome, {name}</h1>
              <p className="text-gray-500">Discover fresh produce directly from farmers near you</p>
            </div>
          </div>

          <Tabs defaultValue="orders" className="mb-6">
            <TabsList>
              <TabsTrigger value="orders">My Orders</TabsTrigger>
              <TabsTrigger value="farmers">Favorite Farmers</TabsTrigger>
            </TabsList>
            <TabsContent value="orders" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Orders</CardTitle>
                  <CardDescription>Track and manage your orders</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-2">Order ID</th>
                          <th className="text-left py-3 px-2">Items</th>
                          <th className="text-left py-3 px-2">Farmer</th>
                          <th className="text-left py-3 px-2">Date</th>
                          <th className="text-left py-3 px-2">Status</th>
                          <th className="text-left py-3 px-2">Amount</th>
                          <th className="text-left py-3 px-2">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentOrders.map((order) => (
                          <tr key={order.id} className="border-b">
                            <td className="py-3 px-2">{order.id}</td>
                            <td className="py-3 px-2">{order.items}</td>
                            <td className="py-3 px-2">{order.farmer}</td>
                            <td className="py-3 px-2">{order.date}</td>
                            <td className="py-3 px-2">
                              <span
                                className={`inline-block px-2 py-1 rounded-full text-xs ${
                                  order.status === "Delivered"
                                    ? "bg-green-100 text-green-800"
                                    : order.status === "In Transit"
                                      ? "bg-blue-100 text-blue-800"
                                      : order.status === "Cancelled"
                                        ? "bg-red-100 text-red-800"
                                        : "bg-orange-100 text-orange-800"
                                }`}
                              >
                                {order.status}
                              </span>
                            </td>
                            <td className="py-3 px-2">{order.amount}</td>
                            <td className="py-3 px-2">
                              <Button variant="outline" size="sm" onClick={() => router.push("/consumer/myorders")}>
                                View
                              </Button>
                            </td>
                          </tr>
                        ))}
                        {recentOrders.length === 0 && (
                          <tr>
                            <td className="py-6 px-2 text-sm text-gray-500" colSpan={7}>
                              No orders yet.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
                <CardFooter>
                  <Link href="/consumer/myorders" className="w-full">
                    <Button variant="outline" className="w-full">
                      View All Orders
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            </TabsContent>

            <TabsContent value="farmers" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Your Favorite Farmers</CardTitle>
                  <CardDescription>Farmers you frequently purchase from</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {favoriteFarmers.map((farmer) => (
                      <Card key={farmer.name}>
                        <CardContent className="p-4 flex items-center gap-4">
                          <div className="h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center">
                            <User className="h-8 w-8" />
                          </div>
                          <div>
                            <h3 className="font-semibold">{farmer.name}</h3>
                            <p className="text-sm text-gray-500">{farmer.location}</p>
                            <div className="mt-1 text-sm text-gray-500">
                              {farmer.favoriteCount} saved products
                            </div>
                            <div className="text-sm text-gray-500">{farmer.completedOrders} completed orders</div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="ml-auto"
                            onClick={() => {
                              if (farmer.email) {
                                window.location.href = `mailto:${farmer.email}`
                                return
                              }
                              router.push("/consumer/favorites")
                            }}
                          >
                            <MessageSquare className="h-4 w-4" />
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                    {favoriteFarmers.length === 0 && <p className="text-sm text-gray-500">No favorite farmers yet.</p>}
                  </div>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" className="w-full" onClick={() => router.push("/consumer/favorites")}>
                    View Favorites
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}

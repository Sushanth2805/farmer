"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "@/components/ui/chart"
import { ArrowUpRight, Home, Leaf, LogOut, Package, Settings, ShoppingCart } from "lucide-react"
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { useRouter } from "next/navigation"
import { ensureDynamicDataSeeded, getOrdersForFarmer, getProductsByOwner, getTenders, subscribeToDynamicData } from "@/lib/dynamic-data"

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"]

export default function FarmerDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [salesData, setSalesData] = useState<{ name: string; sales: number }[]>([])
  const [productPerformance, setProductPerformance] = useState<{ name: string; value: number }[]>([])
  const [recentOrders, setRecentOrders] = useState<any[]>([])
  const [govProcurements, setGovProcurements] = useState<any[]>([])

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
      setSalesData([])
      setProductPerformance([])
      setRecentOrders([])
      setGovProcurements([])
      return
    }

    const syncDashboard = () => {
      const orders = [...getOrdersForFarmer(user.uid)].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      )
      const products = getProductsByOwner(user.uid)
      const tenders = [...getTenders().filter((tender) => tender.status !== "Closed")].sort(
        (a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime(),
      )

      const monthlySalesMap = new Map<string, number>()
      const productRevenueMap = new Map<string, number>()

      orders.forEach((order) => {
        const month = new Date(order.date).toLocaleDateString("en-IN", { month: "short", year: "2-digit" })
        const farmerItems = order.items.filter((item) => item.farmerId === user.uid)
        const farmerTotal = farmerItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
        monthlySalesMap.set(month, (monthlySalesMap.get(month) || 0) + farmerTotal)
        farmerItems.forEach((item) => {
          productRevenueMap.set(item.name, (productRevenueMap.get(item.name) || 0) + item.price * item.quantity)
        })
      })

      setSalesData(Array.from(monthlySalesMap.entries()).map(([name, sales]) => ({ name, sales })).slice(-6))

      if (productRevenueMap.size > 0) {
        setProductPerformance(
          Array.from(productRevenueMap.entries())
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value),
        )
      } else {
        setProductPerformance(
          products.map((product) => ({
            name: product.name,
            value: product.price * product.quantity,
          })),
        )
      }

      setRecentOrders(
        orders.slice(0, 4).map((order) => ({
          id: order.id,
          customer: order.consumerName,
          date: new Date(order.date).toLocaleDateString("en-IN"),
          status:
            order.status === "delivered"
              ? "Delivered"
              : order.status === "processing"
                ? "Processing"
                : order.status === "shipped"
                  ? "Shipped"
                  : order.status === "cancelled"
                    ? "Cancelled"
                    : "Pending",
          amount: `Rs. ${order.items
            .filter((item) => item.farmerId === user.uid)
            .reduce((sum, item) => sum + item.price * item.quantity, 0)
            .toLocaleString()}`,
        })),
      )

      setGovProcurements(
        tenders.slice(0, 4).map((tender) => ({
          id: tender.id,
          title: tender.title,
          deadline: tender.deadline,
          quantity: tender.quantity,
          status: tender.status,
        })),
      )
    }

    syncDashboard()
    return subscribeToDynamicData(syncDashboard)
  }, [user?.uid])

  const totalSales = useMemo(
    () =>
      recentOrders.reduce((sum, order) => {
        const amount = Number(String(order.amount).replace(/[^0-9.]/g, ""))
        return sum + amount
      }, 0),
    [recentOrders],
  )

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-64 flex-col bg-gray-50 border-r md:flex">
        <div className="flex h-14 items-center border-b px-4">
          <Link href="/farmer/dashboard" className="flex items-center gap-2 font-semibold">
            <Leaf className="h-5 w-5 text-green-600" />
            <span>Farmer Portal</span>
          </Link>
        </div>
        <nav className="flex-1 overflow-auto py-4">
          <div className="px-4 py-2">
            <h2 className="mb-2 text-xs font-semibold tracking-tight">Dashboard</h2>
            <div className="space-y-1">
              <Link href="/farmer/dashboard">
                <Button variant="ghost" className="w-full justify-start">
                  <Home className="mr-2 h-4 w-4" />
                  Overview
                </Button>
              </Link>
              <Link href="/farmer/products">
                <Button variant="ghost" className="w-full justify-start">
                  <Package className="mr-2 h-4 w-4" />
                  My Products
                </Button>
              </Link>
              <Link href="/farmer/orders">
                <Button variant="ghost" className="w-full justify-start">
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Orders
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
        </div>

        <div className="p-4 md:p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold">Farmer Dashboard</h1>
              <p className="text-gray-500">Welcome back, Producer</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Rs. {totalSales.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">Based on your current recorded orders</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Active Orders</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{recentOrders.filter((order) => order.status !== "Delivered" && order.status !== "Cancelled").length}</div>
                <p className="text-xs text-muted-foreground">Orders still in progress</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Procurement Opportunities</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{govProcurements.length}</div>
                <p className="text-xs text-muted-foreground">Available tenders right now</p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="overview" className="mb-6">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="orders">Orders</TabsTrigger>
              <TabsTrigger value="procurement">Gov. Procurement</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Sales Overview</CardTitle>
                    <CardDescription>Your sales performance over the last months</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={salesData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Line type="monotone" dataKey="sales" stroke="#8884d8" activeDot={{ r: 8 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Top Products</CardTitle>
                    <CardDescription>Your products by recorded revenue</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={productPerformance}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                          >
                            {productPerformance.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>Your recent orders and updates</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentOrders.map((order) => (
                      <div key={order.id} className="flex items-center justify-between border-b pb-4">
                        <div>
                          <p className="font-medium">{order.customer}</p>
                          <p className="text-sm text-gray-500">Order {order.id} • {order.date}</p>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="font-medium">{order.amount}</p>
                            <p className={`text-sm ${order.status === "Delivered" ? "text-green-500" : order.status === "Processing" ? "text-blue-500" : "text-orange-500"}`}>
                              {order.status}
                            </p>
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => router.push("/farmer/orders")}>
                            <ArrowUpRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    {recentOrders.length === 0 && <p className="text-sm text-gray-500">No recent orders yet.</p>}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="orders" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Orders</CardTitle>
                  <CardDescription>Manage your customer orders</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-2">Order ID</th>
                          <th className="text-left py-3 px-2">Customer</th>
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
                            <td className="py-3 px-2">{order.customer}</td>
                            <td className="py-3 px-2">{order.date}</td>
                            <td className="py-3 px-2">{order.status}</td>
                            <td className="py-3 px-2">{order.amount}</td>
                            <td className="py-3 px-2">
                              <Button variant="outline" size="sm" onClick={() => router.push("/farmer/orders")}>
                                View
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="procurement" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Government Procurement Opportunities</CardTitle>
                  <CardDescription>Available tenders and procurement requests</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-2">ID</th>
                          <th className="text-left py-3 px-2">Title</th>
                          <th className="text-left py-3 px-2">Deadline</th>
                          <th className="text-left py-3 px-2">Quantity</th>
                          <th className="text-left py-3 px-2">Status</th>
                          <th className="text-left py-3 px-2">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {govProcurements.map((proc) => (
                          <tr key={proc.id} className="border-b">
                            <td className="py-3 px-2">{proc.id}</td>
                            <td className="py-3 px-2">{proc.title}</td>
                            <td className="py-3 px-2">{proc.deadline}</td>
                            <td className="py-3 px-2">{proc.quantity}</td>
                            <td className="py-3 px-2">{proc.status}</td>
                            <td className="py-3 px-2">
                              <Button variant="outline" size="sm" onClick={() => router.push("/farmer/tenders")}>
                                Apply
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}

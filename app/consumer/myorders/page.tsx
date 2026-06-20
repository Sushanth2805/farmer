"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { auth } from "@/lib/firebase"
import { signOut, getAuth, onAuthStateChanged } from "firebase/auth"
import {
  Bell,
  ChevronLeft,
  Clock,
  Home,
  Leaf,
  LogOut,
  Package,
  PackageCheck,
  PackageX,
  Settings,
  ShoppingCart,
  Truck,
} from "lucide-react"
import {
  ensureDynamicDataSeeded,
  getOrdersForConsumer,
  subscribeToDynamicData,
  updateOrderStatus,
  type OrderRecord,
} from "@/lib/dynamic-data"

export default function OrdersPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [orders, setOrders] = useState<OrderRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("all")
  const [user, setUser] = useState<any>(null)

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

  const userId = user?.uid

  const handleLogout = async () => {
    try {
      await signOut(auth)
      router.push("/auth/login")
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  useEffect(() => {
    ensureDynamicDataSeeded()
  }, [])

  useEffect(() => {
    if (!userId) {
      setOrders([])
      setLoading(false)
      return
    }

    const syncOrders = () => {
      setOrders(
        [...getOrdersForConsumer(userId)].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
      )
      setLoading(false)
    }

    syncOrders()
    return subscribeToDynamicData(syncOrders)
  }, [userId])

  const filteredOrders = orders.filter((order) => {
    if (activeTab === "all") return true
    if (activeTab === "active") return ["pending", "processing", "shipped"].includes(order.status)
    if (activeTab === "delivered") return order.status === "delivered"
    if (activeTab === "cancelled") return order.status === "cancelled"
    return true
  })

  const getStatusIcon = (status: OrderRecord["status"]) => {
    switch (status) {
      case "pending":
        return <Clock className="h-5 w-5 text-yellow-500" />
      case "processing":
        return <Package className="h-5 w-5 text-blue-500" />
      case "shipped":
        return <Truck className="h-5 w-5 text-purple-500" />
      case "delivered":
        return <PackageCheck className="h-5 w-5 text-green-500" />
      case "cancelled":
        return <PackageX className="h-5 w-5 text-red-500" />
    }
  }

  const getStatusText = (status: OrderRecord["status"]) => {
    switch (status) {
      case "pending":
        return "Order Placed"
      case "processing":
        return "Processing"
      case "shipped":
        return "Shipped"
      case "delivered":
        return "Delivered"
      case "cancelled":
        return "Cancelled"
    }
  }

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })

  const openTrackingView = (order: OrderRecord) => {
    const trackingDocument = `
      <html>
        <head>
          <title>${order.id} Tracking</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 24px; color: #111827; }
            h1 { margin-bottom: 4px; }
            .step { padding: 12px 0; border-bottom: 1px solid #e5e7eb; }
            .muted { color: #6b7280; }
          </style>
        </head>
        <body>
          <h1>Tracking for ${order.id}</h1>
          <p class="muted">Tracking number: ${order.trackingNumber || "Not assigned"}</p>
          <div class="step"><strong>Order placed</strong><div class="muted">${formatDate(order.date)}</div></div>
          <div class="step"><strong>Status</strong><div class="muted">${getStatusText(order.status)}</div></div>
          <div class="step"><strong>Destination</strong><div class="muted">${order.deliveryAddress.address}, ${order.deliveryAddress.city}, ${order.deliveryAddress.state} ${order.deliveryAddress.postalCode}</div></div>
          ${order.estimatedDelivery ? `<div class="step"><strong>Estimated delivery</strong><div class="muted">${formatDate(order.estimatedDelivery)}</div></div>` : ""}
        </body>
      </html>
    `

    const url = window.URL.createObjectURL(new Blob([trackingDocument], { type: "text/html" }))
    window.open(url, "_blank", "noopener,noreferrer")
  }

  const downloadInvoice = (order: OrderRecord) => {
    const lines = [
      `Invoice for Order ${order.id}`,
      `Placed: ${formatDate(order.date)}`,
      `Customer: ${user?.name || user?.email || "Consumer"}`,
      "",
      "Items:",
      ...order.items.map((item) => `${item.name} | ${item.quantity} ${item.unit} | Rs. ${item.price} | Rs. ${item.price * item.quantity}`),
      "",
      `Subtotal: Rs. ${order.subtotal}`,
      `Delivery Fee: Rs. ${order.deliveryFee}`,
      `Total: Rs. ${order.total}`,
      `Payment Method: ${order.paymentMethod}`,
      `Delivery Address: ${order.deliveryAddress.address}, ${order.deliveryAddress.city}, ${order.deliveryAddress.state} ${order.deliveryAddress.postalCode}`,
    ]

    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `${order.id}-invoice.txt`
    link.click()
    window.URL.revokeObjectURL(url)
    toast({ title: "Invoice downloaded", description: `Saved invoice for order #${order.id}.` })
  }

  const rateOrder = (order: OrderRecord) => {
    const recipient = order.items.find((item) => item.farmerEmail)?.farmerEmail
    if (!recipient) {
      toast({ title: "Feedback unavailable", description: "This order does not include a farmer contact email yet." })
      return
    }

    const farmerNames = Array.from(new Set(order.items.map((item) => item.farmer))).join(", ")
    window.location.href = `mailto:${recipient}?subject=${encodeURIComponent(`Feedback for order ${order.id}`)}&body=${encodeURIComponent(`Hello ${farmerNames || "Farmer"},\n\nThanks for the order ${order.id}. I wanted to share my feedback:\n`)}` 
  }

  const showNotifications = () => {
    toast({ title: "No notifications", description: "Order status changes will appear directly in this list." })
  }

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
                <Button variant="ghost" className="w-full justify-start">
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Products
                </Button>
              </Link>
              <Link href="/consumer/myorders">
                <Button variant="ghost" className="w-full justify-start bg-gray-200">
                  <Package className="mr-2 h-4 w-4" />
                  My Orders
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
            <h1 className="text-2xl font-bold">My Orders</h1>
          </div>

          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="mb-6">
            <TabsList>
              <TabsTrigger value="all">All Orders</TabsTrigger>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="delivered">Delivered</TabsTrigger>
              <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
            </TabsList>
          </Tabs>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Package className="h-16 w-16 text-gray-300 mb-4" />
              <h2 className="text-xl font-semibold mb-2">No orders found</h2>
              <p className="text-gray-500 mb-6">You don&apos;t have any {activeTab !== "all" ? activeTab : ""} orders yet.</p>
              <Link href="/consumer/products">
                <Button>Browse Products</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((order) => (
                <Card key={order.id} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                      <div>
                        <CardTitle className="text-lg">Order #{order.id}</CardTitle>
                        <CardDescription>Placed on {formatDate(order.date)}</CardDescription>
                      </div>
                      <div className="flex items-center mt-2 md:mt-0 space-x-2">
                        {getStatusIcon(order.status)}
                        <span className="font-medium">{getStatusText(order.status)}</span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="md:col-span-2">
                        <h3 className="text-sm font-medium mb-2">Items</h3>
                        <div className="space-y-2">
                          {order.items.slice(0, 2).map((item) => (
                            <div key={item.id} className="flex items-center space-x-3">
                              <div className="h-12 w-12 rounded-md overflow-hidden">
                                <img src={item.image || "/placeholder.svg"} alt={item.name} className="h-full w-full object-cover" />
                              </div>
                              <div>
                                <p className="text-sm font-medium">{item.name}</p>
                                <p className="text-xs text-gray-500">{item.quantity} x Rs. {item.price}</p>
                              </div>
                            </div>
                          ))}
                          {order.items.length > 2 && <p className="text-xs text-gray-500">+{order.items.length - 2} more items</p>}
                        </div>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium mb-2">Delivery Address</h3>
                        <p className="text-sm">{order.deliveryAddress.address}</p>
                        <p className="text-sm">{order.deliveryAddress.city}, {order.deliveryAddress.state}</p>
                        <p className="text-sm">{order.deliveryAddress.postalCode}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium mb-2">Order Info</h3>
                        <p className="text-sm"><span className="text-gray-500">Total:</span> Rs. {order.total}</p>
                        <p className="text-sm"><span className="text-gray-500">Payment:</span> {order.paymentMethod}</p>
                        {order.trackingNumber && <p className="text-sm"><span className="text-gray-500">Tracking:</span> {order.trackingNumber}</p>}
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between border-t pt-4">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline">View Details</Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-3xl">
                        <DialogHeader>
                          <DialogTitle>Order #{order.id}</DialogTitle>
                          <DialogDescription>Placed on {formatDate(order.date)}</DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              {getStatusIcon(order.status)}
                              <span className="font-medium">{getStatusText(order.status)}</span>
                            </div>
                            {order.estimatedDelivery && <div className="text-sm"><span className="text-gray-500">Estimated Delivery:</span> {formatDate(order.estimatedDelivery)}</div>}
                          </div>

                          <Separator />

                          <div>
                            <h3 className="font-medium mb-2">Items</h3>
                            <div className="space-y-3">
                              {order.items.map((item) => (
                                <div key={item.id} className="flex items-center space-x-4">
                                  <div className="h-16 w-16 rounded-md overflow-hidden">
                                    <img src={item.image || "/placeholder.svg"} alt={item.name} className="h-full w-full object-cover" />
                                  </div>
                                  <div className="flex-1">
                                    <p className="font-medium">{item.name}</p>
                                    <p className="text-sm text-gray-500">Farmer: {item.farmer}</p>
                                    <p className="text-sm">Rs. {item.price}/{item.unit}</p>
                                  </div>
                                  <div className="text-right">
                                    <p className="font-medium">Rs. {item.price * item.quantity}</p>
                                    <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          <Separator />

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <h3 className="font-medium mb-2">Delivery Address</h3>
                              <p>{order.deliveryAddress.address}</p>
                              <p>{order.deliveryAddress.city}, {order.deliveryAddress.state}</p>
                              <p>{order.deliveryAddress.postalCode}</p>
                            </div>
                            <div>
                              <h3 className="font-medium mb-2">Payment Information</h3>
                              <p><span className="text-gray-500">Method:</span> {order.paymentMethod}</p>
                              {order.trackingNumber && <p><span className="text-gray-500">Tracking Number:</span> {order.trackingNumber}</p>}
                            </div>
                          </div>

                          <Separator />

                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-gray-500">Subtotal</span>
                              <span>Rs. {order.subtotal}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Delivery Fee</span>
                              <span>Rs. {order.deliveryFee}</span>
                            </div>
                            <Separator />
                            <div className="flex justify-between font-medium text-lg">
                              <span>Total</span>
                              <span>Rs. {order.total}</span>
                            </div>
                          </div>
                        </div>
                        {order.status === "delivered" && (
                          <div className="flex justify-end">
                            <Button variant="outline" onClick={() => downloadInvoice(order)}>Download Invoice</Button>
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                    {order.status === "pending" && (
                      <Button
                        variant="outline"
                        className="text-red-600 hover:bg-red-50"
                        onClick={() => {
                          updateOrderStatus(order.id, "cancelled")
                          toast({ title: "Order cancelled", description: `Order #${order.id} has been cancelled.` })
                        }}
                      >
                        Cancel Order
                      </Button>
                    )}
                    {order.status === "delivered" && <Button variant="outline" onClick={() => rateOrder(order)}>Rate Order</Button>}
                    {order.status === "shipped" && (
                      <Button variant="outline" onClick={() => openTrackingView(order)}>
                        Track Order
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

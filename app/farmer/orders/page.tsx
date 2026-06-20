"use client"

import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowRight, Check, Clock, Filter, Home, Leaf, LogOut, Package, Search, Settings, ShoppingCart, Truck, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { auth } from "@/lib/firebase"
import { signOut, getAuth, onAuthStateChanged } from "firebase/auth"
import {
  ensureDynamicDataSeeded,
  getOrdersForFarmer,
  subscribeToDynamicData,
  updateOrderStatus,
  type OrderRecord,
} from "@/lib/dynamic-data"

type FarmerOrderView = {
  id: string
  customerName: string
  customerPhone: string
  customerAddress: string
  date: string
  status: "Pending" | "Processing" | "Shipped" | "Delivered" | "Cancelled"
  total: number
  paymentMethod: string
  items: {
    id: string
    name: string
    price: number
    quantity: number
    unit: string
    total: number
  }[]
}

const statusMap = {
  pending: "Pending",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
} as const

const reverseStatusMap = {
  Pending: "pending",
  Processing: "processing",
  Shipped: "shipped",
  Delivered: "delivered",
  Cancelled: "cancelled",
} as const

export default function FarmerOrders() {
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const [selectedOrder, setSelectedOrder] = useState<FarmerOrderView | null>(null)
  const [isOrderDetailsOpen, setIsOrderDetailsOpen] = useState(false)
  const [ordersList, setOrdersList] = useState<FarmerOrderView[]>([])
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

  const userId = user?.uid

  useEffect(() => {
    ensureDynamicDataSeeded()
  }, [])

  useEffect(() => {
    if (!userId) {
      setOrdersList([])
      return
    }

    const syncOrders = () => {
      const farmerOrders = [...getOrdersForFarmer(userId)]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .map((order: OrderRecord) => {
          const items = order.items.filter((item) => item.farmerId === userId)
          return {
            id: order.id,
            customerName: order.consumerName,
            customerPhone: order.consumerPhone,
            customerAddress: `${order.deliveryAddress.address}, ${order.deliveryAddress.city}, ${order.deliveryAddress.state}`,
            date: new Date(order.date).toLocaleDateString("en-IN"),
            status: statusMap[order.status],
            total: items.reduce((sum, item) => sum + item.price * item.quantity, 0),
            paymentMethod: order.paymentMethod,
            items: items.map((item) => ({
              id: item.id,
              name: item.name,
              price: item.price,
              quantity: item.quantity,
              unit: item.unit,
              total: item.price * item.quantity,
            })),
          }
        })

      setOrdersList(farmerOrders)
    }

    syncOrders()
    return subscribeToDynamicData(syncOrders)
  }, [userId])

  const filteredOrders = useMemo(
    () =>
      ordersList.filter((order) => {
        const matchesSearch =
          order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
          order.customerName.toLowerCase().includes(searchQuery.toLowerCase())

        if (activeTab === "all") return matchesSearch
        if (activeTab === "pending") return matchesSearch && order.status === "Pending"
        if (activeTab === "processing") return matchesSearch && order.status === "Processing"
        if (activeTab === "shipped") return matchesSearch && order.status === "Shipped"
        if (activeTab === "delivered") return matchesSearch && order.status === "Delivered"
        if (activeTab === "cancelled") return matchesSearch && order.status === "Cancelled"
        return matchesSearch
      }),
    [activeTab, ordersList, searchQuery],
  )

  const handleViewOrder = (order: FarmerOrderView) => {
    setSelectedOrder(order)
    setIsOrderDetailsOpen(true)
  }

  const handleUpdateStatus = (orderId: string, newStatus: FarmerOrderView["status"]) => {
    updateOrderStatus(orderId, reverseStatusMap[newStatus])
    if (selectedOrder?.id === orderId) {
      setSelectedOrder({ ...selectedOrder, status: newStatus })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Pending":
        return "bg-yellow-500 hover:bg-yellow-600"
      case "Processing":
        return "bg-blue-500 hover:bg-blue-600"
      case "Shipped":
        return "bg-purple-500 hover:bg-purple-600"
      case "Delivered":
        return "bg-green-500 hover:bg-green-600"
      case "Cancelled":
        return "bg-red-500 hover:bg-red-600"
      default:
        return "bg-gray-500 hover:bg-gray-600"
    }
  }

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
                <Button variant="secondary" className="w-full justify-start">
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
        </div>

        <div className="p-4 md:p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold">Orders</h1>
              <p className="text-gray-500">Manage your customer orders</p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <Tabs value={activeTab} className="w-full" onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-3 md:grid-cols-6">
                <TabsTrigger value="all">All Orders</TabsTrigger>
                <TabsTrigger value="pending">Pending</TabsTrigger>
                <TabsTrigger value="processing">Processing</TabsTrigger>
                <TabsTrigger value="shipped">Shipped</TabsTrigger>
                <TabsTrigger value="delivered">Delivered</TabsTrigger>
                <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="flex gap-2 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input type="search" placeholder="Search orders..." className="w-full pl-8" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              </div>
              <Button variant="outline" size="icon" onClick={() => { setSearchQuery(""); setActiveTab("all") }}>
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.length > 0 ? (
                  filteredOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.id}</TableCell>
                      <TableCell>{order.date}</TableCell>
                      <TableCell>{order.customerName}</TableCell>
                      <TableCell>Rs. {order.total.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(order.status)}>{order.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => handleViewOrder(order)}>
                          View Details
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      No orders found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        <Dialog open={isOrderDetailsOpen} onOpenChange={setIsOrderDetailsOpen}>
          <DialogContent className="sm:max-w-[700px]">
            <DialogHeader>
              <DialogTitle>Order Details</DialogTitle>
              <DialogDescription>Order ID: {selectedOrder?.id} | Date: {selectedOrder?.date}</DialogDescription>
            </DialogHeader>
            {selectedOrder && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium mb-2">Customer Information</h3>
                    <div className="space-y-1 text-sm">
                      <p><span className="font-medium">Name:</span> {selectedOrder.customerName}</p>
                      <p><span className="font-medium">Phone:</span> {selectedOrder.customerPhone}</p>
                      <p><span className="font-medium">Address:</span> {selectedOrder.customerAddress}</p>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium mb-2">Order Information</h3>
                    <div className="space-y-1 text-sm">
                      <p><span className="font-medium">Payment Method:</span> {selectedOrder.paymentMethod}</p>
                      <p><span className="font-medium">Status:</span> <Badge className={getStatusColor(selectedOrder.status)}>{selectedOrder.status}</Badge></p>
                      <p><span className="font-medium">Total Amount:</span> Rs. {selectedOrder.total.toFixed(2)}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium mb-2">Order Items</h3>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Item</TableHead>
                          <TableHead className="text-right">Price</TableHead>
                          <TableHead className="text-right">Quantity</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedOrder.items.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>{item.name}</TableCell>
                            <TableCell className="text-right">Rs. {item.price}/{item.unit}</TableCell>
                            <TableCell className="text-right">{item.quantity} {item.unit}</TableCell>
                            <TableCell className="text-right">Rs. {item.total.toFixed(2)}</TableCell>
                          </TableRow>
                        ))}
                        <TableRow>
                          <TableCell colSpan={3} className="text-right font-medium">Total</TableCell>
                          <TableCell className="text-right font-medium">Rs. {selectedOrder.total.toFixed(2)}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium mb-2">Update Order Status</h3>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" className={selectedOrder.status === "Pending" ? "bg-yellow-100" : ""} onClick={() => handleUpdateStatus(selectedOrder.id, "Pending")}>
                      <Clock className="mr-2 h-4 w-4" />
                      Pending
                    </Button>
                    <Button variant="outline" size="sm" className={selectedOrder.status === "Processing" ? "bg-blue-100" : ""} onClick={() => handleUpdateStatus(selectedOrder.id, "Processing")}>
                      <Package className="mr-2 h-4 w-4" />
                      Processing
                    </Button>
                    <Button variant="outline" size="sm" className={selectedOrder.status === "Shipped" ? "bg-purple-100" : ""} onClick={() => handleUpdateStatus(selectedOrder.id, "Shipped")}>
                      <Truck className="mr-2 h-4 w-4" />
                      Shipped
                    </Button>
                    <Button variant="outline" size="sm" className={selectedOrder.status === "Delivered" ? "bg-green-100" : ""} onClick={() => handleUpdateStatus(selectedOrder.id, "Delivered")}>
                      <Check className="mr-2 h-4 w-4" />
                      Delivered
                    </Button>
                    <Button variant="outline" size="sm" className={selectedOrder.status === "Cancelled" ? "bg-red-100" : ""} onClick={() => handleUpdateStatus(selectedOrder.id, "Cancelled")}>
                      <X className="mr-2 h-4 w-4" />
                      Cancelled
                    </Button>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsOrderDetailsOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  )
}

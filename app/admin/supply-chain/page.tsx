"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Building, FileText, Home, LogOut, Search, Settings, ShieldCheck, Store, Truck } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { auth } from "@/lib/firebase"
import { signOut, getAuth, onAuthStateChanged } from "firebase/auth"
import { createShipment, ensureDynamicDataSeeded, getShipments, subscribeToDynamicData, type ShipmentRecord } from "@/lib/dynamic-data"

const shipmentProgress: Record<ShipmentRecord["status"], number> = {
  Processing: 25,
  "In Transit": 65,
  Delivered: 100,
}

export default function SupplyChainPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [shipments, setShipments] = useState<ShipmentRecord[]>([])
  const [user, setUser] = useState<any>(null)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [form, setForm] = useState({
    product: "",
    quantity: "",
    source: "",
    sourceLocation: "",
    destination: "",
    destinationLocation: "",
    status: "Processing" as ShipmentRecord["status"],
    date: "",
    estimatedArrival: "",
  })
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

  useEffect(() => {
    ensureDynamicDataSeeded()
    const sync = () => setShipments(getShipments())
    sync()
    return subscribeToDynamicData(sync)
  }, [])

  const filteredEvents = useMemo(
    () =>
      shipments.filter((event) => {
        const matchesSearch =
          event.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
          event.product.toLowerCase().includes(searchQuery.toLowerCase()) ||
          event.source.toLowerCase().includes(searchQuery.toLowerCase()) ||
          event.destination.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesStatus = statusFilter === "all" || event.status.toLowerCase() === statusFilter.toLowerCase()
        return matchesSearch && matchesStatus
      }),
    [searchQuery, shipments, statusFilter],
  )

  const shipmentStats = useMemo(
    () => ({
      processing: shipments.filter((shipment) => shipment.status === "Processing").length,
      inTransit: shipments.filter((shipment) => shipment.status === "In Transit").length,
      delivered: shipments.filter((shipment) => shipment.status === "Delivered").length,
    }),
    [shipments],
  )

  const addShipment = () => {
    createShipment(form)
    setForm({
      product: "",
      quantity: "",
      source: "",
      sourceLocation: "",
      destination: "",
      destinationLocation: "",
      status: "Processing",
      date: "",
      estimatedArrival: "",
    })
    setIsAddOpen(false)
  }

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-64 flex-col bg-gray-50 border-r md:flex">
        <div className="flex h-14 items-center border-b px-4">
          <Link href="/admin/dashboard" className="flex items-center gap-2 font-semibold"><Building className="h-5 w-5 text-purple-600" /><span>Admin Portal</span></Link>
        </div>
        <nav className="flex-1 overflow-auto py-4">
          <div className="px-4 py-2">
            <h2 className="mb-2 text-xs font-semibold tracking-tight">Dashboard</h2>
            <div className="space-y-1">
              <Link href="/admin/dashboard"><Button variant="ghost" className="w-full justify-start"><Home className="mr-2 h-4 w-4" />Overview</Button></Link>
              <Link href="/admin/tenders"><Button variant="ghost" className="w-full justify-start"><FileText className="mr-2 h-4 w-4" />Tenders</Button></Link>
              <Link href="/admin/supply-chain"><Button variant="secondary" className="w-full justify-start"><Truck className="mr-2 h-4 w-4" />Supply Chain</Button></Link>
              <Link href="/admin/ration-shops"><Button variant="ghost" className="w-full justify-start"><Store className="mr-2 h-4 w-4" />Ration Shops</Button></Link>
            </div>
          </div>
        </nav>
        <div className="border-t p-4">
          <div className="flex items-center gap-4 mb-4">
            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">{user?.image ? <img src={user.image} alt="User" className="h-10 w-10 rounded-full" /> : <span className="text-sm font-semibold">{user?.name?.[0] || user?.email?.[0] || "U"}</span>}</div>
            <div><p className="text-sm font-medium">{user?.name || user?.email || "Unknown User"}</p></div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/consumer/settings"><Button variant="outline" size="sm" className="w-full"><Settings className="mr-2 h-4 w-4" />Settings</Button></Link>
            <Button variant="outline" size="sm" onClick={handleLogout} className="text-red-600 hover:bg-red-100"><LogOut className="h-4 w-4" /></Button>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <div className="flex h-14 items-center border-b px-4 md:h-16"><Button variant="outline" size="sm" className="mr-4 md:hidden"><Building className="h-5 w-5 text-purple-600" /></Button></div>
        <div className="p-4 md:p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
            <div><h1 className="text-2xl font-bold">Supply Chain Management</h1><p className="text-gray-500">Track and manage the movement of goods from purchase to distribution</p></div>
            <div className="mt-4 md:mt-0"><Button onClick={() => setIsAddOpen(true)}><Truck className="mr-2 h-4 w-4" />Add New Shipment</Button></div>
          </div>

          <div className="grid gap-4 md:grid-cols-3 mb-6">
            <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Processing</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{shipmentStats.processing}</div><p className="text-xs text-muted-foreground">Shipments being prepared</p></CardContent></Card>
            <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">In Transit</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{shipmentStats.inTransit}</div><p className="text-xs text-muted-foreground">Active routes on the move</p></CardContent></Card>
            <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Delivered</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{shipmentStats.delivered}</div><p className="text-xs text-muted-foreground">Completed supply drops</p></CardContent></Card>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div className="relative w-full md:w-auto md:flex-1 max-w-md"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" /><Input type="search" placeholder="Search by ID, product, source, or destination..." className="w-full pl-8" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} /></div>
            <div className="flex gap-2 w-full md:w-auto">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]"><SelectValue placeholder="Filter by status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="in transit">In Transit</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Tabs defaultValue="list" className="mb-6">
            <TabsList>
              <TabsTrigger value="list">List View</TabsTrigger>
              <TabsTrigger value="map">Map View</TabsTrigger>
              <TabsTrigger value="ledger">Ledger View</TabsTrigger>
            </TabsList>

            <TabsContent value="list" className="space-y-4">
              <Card>
                <CardHeader><CardTitle>Supply Chain Events</CardTitle><CardDescription>All shipments and their current status</CardDescription></CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead><tr className="border-b"><th className="text-left py-3 px-2">ID</th><th className="text-left py-3 px-2">Product</th><th className="text-left py-3 px-2">Quantity</th><th className="text-left py-3 px-2">Source</th><th className="text-left py-3 px-2">Destination</th><th className="text-left py-3 px-2">Status</th><th className="text-left py-3 px-2">Date</th></tr></thead>
                      <tbody>
                        {filteredEvents.map((event) => (
                          <tr key={event.id} className="border-b">
                            <td className="py-3 px-2">{event.id}</td>
                            <td className="py-3 px-2">{event.product}</td>
                            <td className="py-3 px-2">{event.quantity}</td>
                            <td className="py-3 px-2">{event.source}<div className="text-xs text-gray-500">{event.sourceLocation}</div></td>
                            <td className="py-3 px-2">{event.destination}<div className="text-xs text-gray-500">{event.destinationLocation}</div></td>
                            <td className="py-3 px-2"><Badge className={event.status === "Delivered" ? "bg-green-100 text-green-800 hover:bg-green-100" : event.status === "In Transit" ? "bg-blue-100 text-blue-800 hover:bg-blue-100" : "bg-orange-100 text-orange-800 hover:bg-orange-100"}>{event.status}</Badge></td>
                            <td className="py-3 px-2">{event.date}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="map" className="space-y-4">
              <Card>
                <CardHeader><CardTitle>Supply Chain Map</CardTitle><CardDescription>Visual representation of current shipments</CardDescription></CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    {filteredEvents.map((event) => (
                      <div key={event.id} className="rounded-md border bg-gray-50 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-medium">{event.product}</p>
                            <p className="text-sm text-gray-500">{event.sourceLocation} to {event.destinationLocation}</p>
                          </div>
                          <Badge className={event.status === "Delivered" ? "bg-green-100 text-green-800 hover:bg-green-100" : event.status === "In Transit" ? "bg-blue-100 text-blue-800 hover:bg-blue-100" : "bg-orange-100 text-orange-800 hover:bg-orange-100"}>{event.status}</Badge>
                        </div>
                        <div className="mt-4 space-y-2">
                          <div className="flex justify-between text-sm"><span>{event.source}</span><span>{event.destination}</span></div>
                          <Progress value={shipmentProgress[event.status]} className="h-2" />
                          <div className="flex justify-between text-xs text-gray-500">
                            <span>Dispatched: {event.date}</span>
                            <span>ETA: {event.estimatedArrival}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                    {filteredEvents.length === 0 && <div className="rounded-md border border-dashed p-8 text-center text-gray-500 md:col-span-2">No routes match the current filters.</div>}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="ledger" className="space-y-4">
              <Card>
                <CardHeader><CardTitle>Supply Chain Ledger</CardTitle><CardDescription>Immutable record of all supply chain transactions</CardDescription></CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {filteredEvents.map((event) => (
                      <div key={event.id} className="flex items-center justify-between border-b pb-4">
                        <div className="flex items-center gap-4">
                          <div className="rounded-full bg-blue-100 p-2"><ShieldCheck className="h-4 w-4 text-blue-600" /></div>
                          <div>
                            <p className="font-medium">{event.product} Shipment - {event.id}</p>
                            <p className="text-sm text-gray-500">From {event.source} to {event.destination}</p>
                            <p className="text-xs text-gray-400">Transaction ID: {event.transactionId}</p>
                          </div>
                        </div>
                        <div className="text-sm text-gray-500">{event.date}</div>
                      </div>
                    ))}
                    {filteredEvents.length === 0 && <div className="py-8 text-center text-gray-500">No shipment ledger entries match the current filters.</div>}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader><DialogTitle>Add New Shipment</DialogTitle><DialogDescription>Create a real supply chain record that appears across admin surfaces.</DialogDescription></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2"><Label htmlFor="product">Product</Label><Input id="product" value={form.product} onChange={(e) => setForm((prev) => ({ ...prev, product: e.target.value }))} /></div>
              <div className="grid gap-2"><Label htmlFor="quantity">Quantity</Label><Input id="quantity" value={form.quantity} onChange={(e) => setForm((prev) => ({ ...prev, quantity: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2"><Label htmlFor="source">Source</Label><Input id="source" value={form.source} onChange={(e) => setForm((prev) => ({ ...prev, source: e.target.value }))} /></div>
              <div className="grid gap-2"><Label htmlFor="sourceLocation">Source Location</Label><Input id="sourceLocation" value={form.sourceLocation} onChange={(e) => setForm((prev) => ({ ...prev, sourceLocation: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2"><Label htmlFor="destination">Destination</Label><Input id="destination" value={form.destination} onChange={(e) => setForm((prev) => ({ ...prev, destination: e.target.value }))} /></div>
              <div className="grid gap-2"><Label htmlFor="destinationLocation">Destination Location</Label><Input id="destinationLocation" value={form.destinationLocation} onChange={(e) => setForm((prev) => ({ ...prev, destinationLocation: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2"><Label htmlFor="date">Date</Label><Input id="date" type="date" value={form.date} onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value }))} /></div>
              <div className="grid gap-2"><Label htmlFor="estimatedArrival">Estimated Arrival</Label><Input id="estimatedArrival" type="date" value={form.estimatedArrival} onChange={(e) => setForm((prev) => ({ ...prev, estimatedArrival: e.target.value }))} /></div>
            </div>
            <div className="grid gap-2">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(value: ShipmentRecord["status"]) => setForm((prev) => ({ ...prev, status: value }))}>
                <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Processing">Processing</SelectItem>
                  <SelectItem value="In Transit">In Transit</SelectItem>
                  <SelectItem value="Delivered">Delivered</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button><Button onClick={addShipment}>Add Shipment</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

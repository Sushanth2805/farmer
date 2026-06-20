"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Building, FileText, Home, LogOut, Search, Settings, Store, Truck, Users } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { auth } from "@/lib/firebase"
import { signOut, getAuth, onAuthStateChanged } from "firebase/auth"
import { createRationShop, ensureDynamicDataSeeded, getRationShops, subscribeToDynamicData, type RationShopRecord } from "@/lib/dynamic-data"

export default function RationShopsPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [shops, setShops] = useState<RationShopRecord[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [form, setForm] = useState({
    name: "",
    location: "",
    manager: "",
    contact: "",
    beneficiaries: "",
    lastDelivery: "",
    nextDelivery: "",
    status: "Active" as RationShopRecord["status"],
  })

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
    const sync = () => setShops(getRationShops())
    sync()
    return subscribeToDynamicData(sync)
  }, [])

  const filteredShops = useMemo(
    () =>
      shops.filter((shop) => {
        const matchesSearch =
          shop.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
          shop.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          shop.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
          shop.manager.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesStatus =
          statusFilter === "all" ||
          (statusFilter === "active" && shop.status === "Active") ||
          (statusFilter === "low" && shop.status === "Low Stock") ||
          (statusFilter === "inactive" && shop.status === "Inactive")
        return matchesSearch && matchesStatus
      }),
    [searchQuery, shops, statusFilter],
  )

  const shopStats = useMemo(
    () => ({
      active: shops.filter((shop) => shop.status === "Active").length,
      lowStock: shops.filter((shop) => shop.status === "Low Stock").length,
      beneficiaries: shops.reduce((sum, shop) => sum + shop.beneficiaries, 0),
    }),
    [shops],
  )

  const inventorySummary = useMemo(
    () =>
      Array.from(
        shops.reduce((map, shop) => {
          shop.inventory.forEach((item) => {
            map.set(item.product, [...(map.get(item.product) || []), item.percentage])
          })
          return map
        }, new Map<string, number[]>()),
      ).map(([product, percentages]) => ({
        product,
        average: Math.round(percentages.reduce((sum, value) => sum + value, 0) / percentages.length),
      })),
    [shops],
  )

  const addShop = () => {
    createRationShop({
      name: form.name,
      location: form.location,
      manager: form.manager,
      contact: form.contact,
      status: form.status,
      inventory: [
        { product: "Rice", quantity: "0 kg", allocated: "2000 kg", percentage: 0 },
        { product: "Wheat", quantity: "0 kg", allocated: "1500 kg", percentage: 0 },
      ],
      beneficiaries: Number(form.beneficiaries) || 0,
      lastDelivery: form.lastDelivery,
      nextDelivery: form.nextDelivery,
    })
    setForm({ name: "", location: "", manager: "", contact: "", beneficiaries: "", lastDelivery: "", nextDelivery: "", status: "Active" })
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
              <Link href="/admin/supply-chain"><Button variant="ghost" className="w-full justify-start"><Truck className="mr-2 h-4 w-4" />Supply Chain</Button></Link>
              <Link href="/admin/ration-shops"><Button variant="secondary" className="w-full justify-start"><Store className="mr-2 h-4 w-4" />Ration Shops</Button></Link>
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
            <div><h1 className="text-2xl font-bold">Ration Shops Management</h1><p className="text-gray-500">Manage and monitor ration shops and distribution centers</p></div>
            <div className="mt-4 md:mt-0"><Button onClick={() => setIsAddOpen(true)}><Store className="mr-2 h-4 w-4" />Add New Shop</Button></div>
          </div>

          <div className="grid gap-4 md:grid-cols-3 mb-6">
            <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Active Shops</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{shopStats.active}</div><p className="text-xs text-muted-foreground">Currently serving beneficiaries</p></CardContent></Card>
            <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Low Stock Alerts</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{shopStats.lowStock}</div><p className="text-xs text-muted-foreground">Locations needing replenishment</p></CardContent></Card>
            <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Beneficiaries Covered</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{shopStats.beneficiaries.toLocaleString()}</div><p className="text-xs text-muted-foreground">Across tracked distribution centers</p></CardContent></Card>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div className="relative w-full md:w-auto md:flex-1 max-w-md"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" /><Input type="search" placeholder="Search by ID, name, location, or manager..." className="w-full pl-8" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} /></div>
            <div className="flex gap-2 w-full md:w-auto">
              <Button variant={statusFilter === "all" ? "default" : "outline"} size="sm" onClick={() => setStatusFilter("all")}>All</Button>
              <Button variant={statusFilter === "active" ? "default" : "outline"} size="sm" onClick={() => setStatusFilter("active")}>Active</Button>
              <Button variant={statusFilter === "low" ? "default" : "outline"} size="sm" onClick={() => setStatusFilter("low")}>Low Stock</Button>
              <Button variant={statusFilter === "inactive" ? "default" : "outline"} size="sm" onClick={() => setStatusFilter("inactive")}>Inactive</Button>
            </div>
          </div>

          <Tabs defaultValue="list" className="mb-6">
            <TabsList>
              <TabsTrigger value="list">List View</TabsTrigger>
              <TabsTrigger value="map">Map View</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

            <TabsContent value="list" className="space-y-4">
              {filteredShops.map((shop) => (
                <Card key={shop.id} className="mb-4">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div><CardTitle className="text-xl">{shop.name}</CardTitle><CardDescription>{shop.location} • ID: {shop.id}</CardDescription></div>
                      <Badge className={shop.status === "Active" ? "bg-green-100 text-green-800 hover:bg-green-100" : shop.status === "Low Stock" ? "bg-orange-100 text-orange-800 hover:bg-orange-100" : "bg-red-100 text-red-800 hover:bg-red-100"}>{shop.status}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h3 className="text-sm font-medium mb-2">Shop Information</h3>
                        <div className="space-y-2">
                          <div className="flex justify-between"><span className="text-sm text-gray-500">Manager:</span><span className="text-sm">{shop.manager}</span></div>
                          <div className="flex justify-between"><span className="text-sm text-gray-500">Contact:</span><span className="text-sm">{shop.contact}</span></div>
                          <div className="flex justify-between"><span className="text-sm text-gray-500">Beneficiaries:</span><span className="text-sm">{shop.beneficiaries}</span></div>
                          <div className="flex justify-between"><span className="text-sm text-gray-500">Last Delivery:</span><span className="text-sm">{shop.lastDelivery}</span></div>
                          <div className="flex justify-between"><span className="text-sm text-gray-500">Next Delivery:</span><span className="text-sm">{shop.nextDelivery}</span></div>
                        </div>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium mb-2">Inventory Status</h3>
                        <div className="space-y-4">
                          {shop.inventory.map((item) => (
                            <div key={item.product} className="space-y-1">
                              <div className="flex justify-between"><span className="text-sm">{item.product}</span><span className="text-sm">{item.quantity} / {item.allocated}</span></div>
                              <Progress value={item.percentage} className="h-2" />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {filteredShops.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12">
                  <Store className="h-16 w-16 text-gray-300 mb-4" />
                  <h2 className="text-xl font-semibold mb-2">No ration shops found</h2>
                  <p className="text-gray-500 mb-6">Try adjusting your search or filters</p>
                  <Button variant="outline" onClick={() => { setSearchQuery(""); setStatusFilter("all") }}>Reset Filters</Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="map" className="space-y-4">
              <Card>
                <CardHeader><CardTitle>Ration Shops Map</CardTitle><CardDescription>Geographic distribution of ration shops</CardDescription></CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    {filteredShops.map((shop) => (
                      <div key={shop.id} className="rounded-md border bg-gray-50 p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium">{shop.name}</p>
                            <p className="text-sm text-gray-500">{shop.location}</p>
                          </div>
                          <Badge className={shop.status === "Active" ? "bg-green-100 text-green-800 hover:bg-green-100" : shop.status === "Low Stock" ? "bg-orange-100 text-orange-800 hover:bg-orange-100" : "bg-red-100 text-red-800 hover:bg-red-100"}>{shop.status}</Badge>
                        </div>
                        <div className="mt-4 grid gap-3">
                          <div className="flex items-center gap-2 text-sm text-gray-600"><Users className="h-4 w-4" />{shop.beneficiaries.toLocaleString()} beneficiaries</div>
                          <div className="space-y-2">
                            {shop.inventory.slice(0, 2).map((item) => (
                              <div key={item.product} className="space-y-1">
                                <div className="flex justify-between text-sm"><span>{item.product}</span><span>{item.percentage}%</span></div>
                                <Progress value={item.percentage} className="h-2" />
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                    {filteredShops.length === 0 && <div className="rounded-md border border-dashed p-8 text-center text-gray-500 md:col-span-2">No ration shops match the current filters.</div>}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-4">
              <Card>
                <CardHeader><CardTitle>Ration Distribution Analytics</CardTitle><CardDescription>Performance metrics and distribution statistics</CardDescription></CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3">
                    {inventorySummary.map((item) => (
                      <div key={item.product} className="rounded-md border bg-gray-50 p-4">
                        <p className="font-medium">{item.product}</p>
                        <p className="mt-1 text-2xl font-bold">{item.average}%</p>
                        <p className="text-sm text-gray-500">Average stock fulfillment across shops</p>
                        <div className="mt-3"><Progress value={item.average} className="h-2" /></div>
                      </div>
                    ))}
                    {inventorySummary.length === 0 && <div className="rounded-md border border-dashed p-8 text-center text-gray-500 md:col-span-3">Add ration shops to see stock analytics.</div>}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader><DialogTitle>Add New Ration Shop</DialogTitle><DialogDescription>Create a real shop record for admin tracking.</DialogDescription></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2"><Label htmlFor="name">Name</Label><Input id="name" value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} /></div>
              <div className="grid gap-2"><Label htmlFor="location">Location</Label><Input id="location" value={form.location} onChange={(e) => setForm((prev) => ({ ...prev, location: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2"><Label htmlFor="manager">Manager</Label><Input id="manager" value={form.manager} onChange={(e) => setForm((prev) => ({ ...prev, manager: e.target.value }))} /></div>
              <div className="grid gap-2"><Label htmlFor="contact">Contact</Label><Input id="contact" value={form.contact} onChange={(e) => setForm((prev) => ({ ...prev, contact: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2"><Label htmlFor="beneficiaries">Beneficiaries</Label><Input id="beneficiaries" type="number" value={form.beneficiaries} onChange={(e) => setForm((prev) => ({ ...prev, beneficiaries: e.target.value }))} /></div>
              <div className="grid gap-2"><Label>Status</Label><Input value={form.status} onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value as RationShopRecord["status"] }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2"><Label htmlFor="lastDelivery">Last Delivery</Label><Input id="lastDelivery" type="date" value={form.lastDelivery} onChange={(e) => setForm((prev) => ({ ...prev, lastDelivery: e.target.value }))} /></div>
              <div className="grid gap-2"><Label htmlFor="nextDelivery">Next Delivery</Label><Input id="nextDelivery" type="date" value={form.nextDelivery} onChange={(e) => setForm((prev) => ({ ...prev, nextDelivery: e.target.value }))} /></div>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button><Button onClick={addShop}>Add Shop</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Building, FileText, Home, Leaf, LogOut, Search, Settings, Store, Truck } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { auth } from "@/lib/firebase"
import { signOut, getAuth, onAuthStateChanged } from "firebase/auth"
import {
  createTender,
  ensureDynamicDataSeeded,
  getTenders,
  subscribeToDynamicData,
  updateTenderBidStatus,
  type TenderRecord,
} from "@/lib/dynamic-data"

type TenderFormState = {
  title: string
  description: string
  product: string
  quantity: string
  totalAmount: string
  budget: string
  deadline: string
  region: string
  minPrice: string
  maxPrice: string
  requirements: string
}

const emptyTender: TenderFormState = {
  title: "",
  description: "",
  product: "",
  quantity: "",
  totalAmount: "",
  budget: "",
  deadline: "",
  region: "",
  minPrice: "",
  maxPrice: "",
  requirements: "",
}

export default function TendersPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [regionFilter, setRegionFilter] = useState("all")
  const [tenders, setTenders] = useState<TenderRecord[]>([])
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [form, setForm] = useState<TenderFormState>(emptyTender)

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
    const syncTenders = () => setTenders(getTenders())
    syncTenders()
    return subscribeToDynamicData(syncTenders)
  }, [])

  const filteredTenders = useMemo(
    () =>
      tenders.filter((tender) => {
        const matchesSearch =
          tender.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
          tender.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          tender.product.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesStatus = statusFilter === "all" || tender.status.toLowerCase() === statusFilter.toLowerCase()
        const matchesRegion = regionFilter === "all" || tender.region === regionFilter
        return matchesSearch && matchesStatus && matchesRegion
      }),
    [regionFilter, searchQuery, statusFilter, tenders],
  )

  const regions = useMemo(() => ["all", ...new Set(tenders.map((tender) => tender.region))], [tenders])

  const handleCreateTender = () => {
    createTender({
      title: form.title,
      description: form.description,
      product: form.product,
      quantity: form.quantity,
      totalAmount: Number(form.totalAmount),
      budget: form.budget,
      deadline: form.deadline,
      region: form.region,
      minPrice: Number(form.minPrice),
      maxPrice: Number(form.maxPrice),
      requirements: form.requirements,
    })

    setForm(emptyTender)
    setIsCreateOpen(false)
  }

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-64 flex-col bg-gray-50 border-r md:flex">
        <div className="flex h-14 items-center border-b px-4">
          <Link href="/admin/dashboard" className="flex items-center gap-2 font-semibold">
            <Building className="h-5 w-5 text-purple-600" />
            <span>Admin Portal</span>
          </Link>
        </div>
        <nav className="flex-1 overflow-auto py-4">
          <div className="px-4 py-2">
            <h2 className="mb-2 text-xs font-semibold tracking-tight">Dashboard</h2>
            <div className="space-y-1">
              <Link href="/admin/dashboard">
                <Button variant="ghost" className="w-full justify-start">
                  <Home className="mr-2 h-4 w-4" />
                  Overview
                </Button>
              </Link>
              <Link href="/admin/tenders">
                <Button variant="secondary" className="w-full justify-start">
                  <FileText className="mr-2 h-4 w-4" />
                  Tenders
                </Button>
              </Link>
              <Link href="/admin/supply-chain">
                <Button variant="ghost" className="w-full justify-start">
                  <Truck className="mr-2 h-4 w-4" />
                  Supply Chain
                </Button>
              </Link>
              <Link href="/admin/ration-shops">
                <Button variant="ghost" className="w-full justify-start">
                  <Store className="mr-2 h-4 w-4" />
                  Ration Shops
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
            <Building className="h-5 w-5 text-purple-600" />
          </Button>
        </div>

        <div className="p-4 md:p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold">Government Procurement Tenders</h1>
              <p className="text-gray-500">Manage and monitor procurement tenders and farmer bids</p>
            </div>
            <div className="mt-4 md:mt-0">
              <Button onClick={() => setIsCreateOpen(true)}>
                <FileText className="mr-2 h-4 w-4" />
                Create New Tender
              </Button>
            </div>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div className="relative w-full md:w-auto md:flex-1 max-w-md">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input type="search" placeholder="Search by ID, title, or product..." className="w-full pl-8" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="closing soon">Closing Soon</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>

              <Select value={regionFilter} onValueChange={setRegionFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Region" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Regions</SelectItem>
                  {regions.filter((region) => region !== "all").map((region) => (
                    <SelectItem key={region} value={region}>{region}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Tabs defaultValue="active" className="mb-6">
            <TabsList>
              <TabsTrigger value="active">Active Tenders</TabsTrigger>
              <TabsTrigger value="bids">Farmer Bids</TabsTrigger>
              <TabsTrigger value="completed">Completed Tenders</TabsTrigger>
            </TabsList>

            <TabsContent value="active" className="space-y-4">
              {filteredTenders.map((tender) => {
                const acceptedBids = tender.bids.filter((bid) => bid.status === "Accepted")
                const currentAmount = acceptedBids.reduce((sum, bid) => sum + Number(bid.quantity.replace(/\D/g, "")), 0)
                const percentage = tender.totalAmount > 0 ? (currentAmount / tender.totalAmount) * 100 : 0

                return (
                  <Card key={tender.id} className="mb-4">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-xl">{tender.title}</CardTitle>
                          <CardDescription>{tender.id} • {tender.product} • {tender.region}</CardDescription>
                        </div>
                        <Badge className={tender.status === "Open" ? "bg-green-100 text-green-800 hover:bg-green-100" : tender.status === "Closing Soon" ? "bg-orange-100 text-orange-800 hover:bg-orange-100" : "bg-red-100 text-red-800 hover:bg-red-100"}>
                          {tender.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h3 className="text-sm font-medium mb-2">Tender Details</h3>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-500">Description:</span>
                              <span className="text-sm text-right">{tender.description}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-500">Quantity Required:</span>
                              <span className="text-sm">{tender.quantity}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-500">Budget:</span>
                              <span className="text-sm">{tender.budget}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-500">Deadline:</span>
                              <span className="text-sm">{tender.deadline}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-500">Bids Received:</span>
                              <span className="text-sm">{tender.bids.length}</span>
                            </div>
                          </div>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium mb-2">Procurement Progress</h3>
                          <div className="space-y-4">
                            <div className="space-y-1">
                              <div className="flex justify-between">
                                <span className="text-sm">Current Amount</span>
                                <span className="text-sm">{currentAmount} tons / {tender.totalAmount} tons</span>
                              </div>
                              <Progress value={percentage} className="h-2" />
                              <p className="text-xs text-gray-500">{percentage.toFixed(1)}% of required quantity has been procured</p>
                            </div>
                            <div className="space-y-1">
                              <h4 className="text-sm font-medium">Accepted Bids</h4>
                              {acceptedBids.length === 0 ? (
                                <p className="text-sm text-gray-500">No accepted bids yet</p>
                              ) : (
                                acceptedBids.map((bid) => (
                                  <div key={bid.id} className="flex justify-between text-sm">
                                    <span>{bid.farmerName}</span>
                                    <span>{bid.quantity}</span>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}

              {filteredTenders.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12">
                  <FileText className="h-16 w-16 text-gray-300 mb-4" />
                  <h2 className="text-xl font-semibold mb-2">No tenders found</h2>
                  <p className="text-gray-500 mb-6">Try adjusting your search or filters</p>
                  <Button variant="outline" onClick={() => { setSearchQuery(""); setStatusFilter("all"); setRegionFilter("all") }}>
                    Reset Filters
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="bids" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Farmer Bids</CardTitle>
                  <CardDescription>All bids received for active tenders</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-2">Bid ID</th>
                          <th className="text-left py-3 px-2">Tender</th>
                          <th className="text-left py-3 px-2">Farmer</th>
                          <th className="text-left py-3 px-2">Quantity</th>
                          <th className="text-left py-3 px-2">Price</th>
                          <th className="text-left py-3 px-2">Status</th>
                          <th className="text-left py-3 px-2">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredTenders.flatMap((tender) =>
                          tender.bids.map((bid) => (
                            <tr key={bid.id} className="border-b">
                              <td className="py-3 px-2">{bid.id}</td>
                              <td className="py-3 px-2">{tender.id}</td>
                              <td className="py-3 px-2">{bid.farmerName}</td>
                              <td className="py-3 px-2">{bid.quantity}</td>
                              <td className="py-3 px-2">{bid.price}</td>
                              <td className="py-3 px-2">
                                <Badge className={bid.status === "Accepted" ? "bg-green-100 text-green-800 hover:bg-green-100" : bid.status === "Rejected" ? "bg-red-100 text-red-800 hover:bg-red-100" : "bg-blue-100 text-blue-800 hover:bg-blue-100"}>
                                  {bid.status}
                                </Badge>
                              </td>
                              <td className="py-3 px-2">
                                <div className="flex gap-2">
                                  {bid.status === "Pending" ? (
                                    <>
                                      <Button variant="outline" size="sm" className="bg-green-50 text-green-600 hover:bg-green-100 hover:text-green-700" onClick={() => updateTenderBidStatus(tender.id, bid.id, "Accepted")}>
                                        Accept
                                      </Button>
                                      <Button variant="outline" size="sm" className="bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700" onClick={() => updateTenderBidStatus(tender.id, bid.id, "Rejected")}>
                                        Reject
                                      </Button>
                                    </>
                                  ) : (
                                    <Button variant="outline" size="sm">View</Button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )),
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="completed" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Completed Tenders</CardTitle>
                  <CardDescription>Archive of past procurement tenders</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {tenders.filter((tender) => tender.status === "Closed").length === 0 ? (
                      <div className="h-[300px] bg-gray-100 rounded-md flex items-center justify-center">
                        <p className="text-gray-500">Completed tenders will appear here once deadlines pass.</p>
                      </div>
                    ) : (
                      tenders.filter((tender) => tender.status === "Closed").map((tender) => (
                        <Card key={tender.id}>
                          <CardHeader>
                            <CardTitle>{tender.title}</CardTitle>
                            <CardDescription>{tender.id} • {tender.region}</CardDescription>
                          </CardHeader>
                        </Card>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>Create New Tender</DialogTitle>
            <DialogDescription>Publish a new procurement opportunity without changing the existing dashboard layout.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" value={form.title} onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" value={form.description} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="product">Product</Label>
                <Input id="product" value={form.product} onChange={(e) => setForm((prev) => ({ ...prev, product: e.target.value }))} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="region">Region</Label>
                <Input id="region" value={form.region} onChange={(e) => setForm((prev) => ({ ...prev, region: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="quantity">Quantity Label</Label>
                <Input id="quantity" placeholder="500 tons" value={form.quantity} onChange={(e) => setForm((prev) => ({ ...prev, quantity: e.target.value }))} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="totalAmount">Total Amount</Label>
                <Input id="totalAmount" type="number" placeholder="500" value={form.totalAmount} onChange={(e) => setForm((prev) => ({ ...prev, totalAmount: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="budget">Budget</Label>
                <Input id="budget" placeholder="₹1.5 Cr" value={form.budget} onChange={(e) => setForm((prev) => ({ ...prev, budget: e.target.value }))} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="deadline">Deadline</Label>
                <Input id="deadline" type="date" value={form.deadline} onChange={(e) => setForm((prev) => ({ ...prev, deadline: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="minPrice">Min Price</Label>
                <Input id="minPrice" type="number" value={form.minPrice} onChange={(e) => setForm((prev) => ({ ...prev, minPrice: e.target.value }))} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="maxPrice">Max Price</Label>
                <Input id="maxPrice" type="number" value={form.maxPrice} onChange={(e) => setForm((prev) => ({ ...prev, maxPrice: e.target.value }))} />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="requirements">Requirements</Label>
              <Textarea id="requirements" value={form.requirements} onChange={(e) => setForm((prev) => ({ ...prev, requirements: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateTender}>Create Tender</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

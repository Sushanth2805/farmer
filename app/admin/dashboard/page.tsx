"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "@/components/ui/chart"
import { Building, Database, FileText, Home, LogOut, Settings, ShieldCheck, Store, Truck } from "lucide-react"
import { auth } from "@/lib/firebase"
import { signOut, getAuth, onAuthStateChanged } from "firebase/auth"
import { ensureDynamicDataSeeded, getAdminDashboardSnapshot, getRationShops, getShipments, getTenders, subscribeToDynamicData } from "@/lib/dynamic-data"

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"]

export default function AdminDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [tenders, setTenders] = useState<any[]>([])
  const [shipments, setShipments] = useState<any[]>([])
  const [shops, setShops] = useState<any[]>([])

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
    const sync = () => {
      setTenders(getTenders())
      setShipments(getShipments())
      setShops(getRationShops())
    }
    sync()
    return subscribeToDynamicData(sync)
  }, [])

  const snapshot = useMemo(() => getAdminDashboardSnapshot(), [tenders, shipments, shops])
  const procurementData = useMemo(
    () =>
      tenders.map((tender) => ({
        name: tender.region,
        amount: Number(tender.budget.replace(/[^0-9.]/g, "")) || 0,
      })),
    [tenders],
  )
  const supplyDistribution = useMemo(
    () =>
      Array.from(
        shipments.reduce((map, shipment) => {
          map.set(shipment.destinationLocation, (map.get(shipment.destinationLocation) || 0) + 1)
          return map
        }, new Map<string, number>()),
      ).map(([name, value]) => ({ name, value })),
    [shipments],
  )

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
              <Link href="/admin/dashboard"><Button variant="ghost" className="w-full justify-start"><Home className="mr-2 h-4 w-4" />Overview</Button></Link>
              <Link href="/admin/tenders"><Button variant="ghost" className="w-full justify-start"><FileText className="mr-2 h-4 w-4" />Tenders</Button></Link>
              <Link href="/admin/supply-chain"><Button variant="ghost" className="w-full justify-start"><Truck className="mr-2 h-4 w-4" />Supply Chain</Button></Link>
              <Link href="/admin/ration-shops"><Button variant="ghost" className="w-full justify-start"><Store className="mr-2 h-4 w-4" />Ration Shops</Button></Link>
              <Link href="/admin/public-ledger"><Button variant="ghost" className="w-full justify-start"><Database className="mr-2 h-4 w-4" />Public Ledger</Button></Link>
            </div>
          </div>
        </nav>
        <div className="border-t p-4">
          <div className="flex items-center gap-4 mb-4">
            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
              {user?.image ? <img src={user.image || "/placeholder.svg"} alt="User" className="h-10 w-10 rounded-full" /> : <span className="text-sm font-semibold">{user?.name?.[0] || user?.email?.[0] || "U"}</span>}
            </div>
            <div><p className="text-sm font-medium">{user?.name || user?.email || "Unknown User"}</p></div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/consumer/settings"><Button variant="outline" size="sm" className="w-full"><Settings className="mr-2 h-4 w-4" />Settings</Button></Link>
            <Button variant="outline" size="sm" onClick={handleLogout} className="text-red-600 hover:bg-red-100"><LogOut className="h-4 w-4" /></Button>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <div className="flex h-14 items-center border-b px-4 md:h-16">
          <Button variant="outline" size="sm" className="mr-4 md:hidden"><Building className="h-5 w-5 text-purple-600" /></Button>
        </div>
        <div className="p-4 md:p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold">Government Admin Dashboard</h1>
              <p className="text-gray-500">Welcome back, Admin</p>
            </div>
            <div className="mt-4 md:mt-0 flex gap-2">
              <Link href="/admin/tenders"><Button>Create New Tender</Button></Link>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3 mb-6">
            <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total Procurement</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">₹{snapshot.totalTenderBudget.toFixed(1)} Cr</div><p className="text-xs text-muted-foreground">Across active tenders</p></CardContent></Card>
            <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Active Tenders</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{snapshot.activeTenderCount}</div><p className="text-xs text-muted-foreground">{snapshot.closingSoonCount} closing soon</p></CardContent></Card>
            <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Ration Distribution</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{snapshot.deliveredShipments}</div><p className="text-xs text-muted-foreground">Delivered shipments recorded</p></CardContent></Card>
          </div>

          <Tabs defaultValue="overview" className="mb-6">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="tenders">Tenders</TabsTrigger>
              <TabsTrigger value="supply-chain">Supply Chain</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader><CardTitle>Procurement Overview</CardTitle><CardDescription>Budgets by tender region</CardDescription></CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={procurementData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="amount" fill="#8884d8" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle>Supply Distribution</CardTitle><CardDescription>Shipment destinations by region</CardDescription></CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={supplyDistribution} cx="50%" cy="50%" labelLine={false} outerRadius={80} fill="#8884d8" dataKey="value" label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}>
                            {supplyDistribution.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader><CardTitle>Recent Activity</CardTitle><CardDescription>Latest updates from the system</CardDescription></CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {tenders.slice(0, 3).map((tender) => (
                      <div key={tender.id} className="flex items-center justify-between border-b pb-4">
                        <div className="flex items-center gap-4">
                          <div className="rounded-full bg-purple-100 p-2"><FileText className="h-4 w-4 text-purple-600" /></div>
                          <div>
                            <p className="font-medium">{tender.title}</p>
                            <p className="text-sm text-gray-500">{tender.id} • {tender.region}</p>
                          </div>
                        </div>
                        <div className="text-sm text-gray-500">{tender.status}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="tenders" className="space-y-4">
              <Card>
                <CardHeader><CardTitle>Active Tenders</CardTitle><CardDescription>Current procurement opportunities</CardDescription></CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead><tr className="border-b"><th className="text-left py-3 px-2">ID</th><th className="text-left py-3 px-2">Title</th><th className="text-left py-3 px-2">Deadline</th><th className="text-left py-3 px-2">Quantity</th><th className="text-left py-3 px-2">Status</th><th className="text-left py-3 px-2">Bids</th></tr></thead>
                      <tbody>
                        {tenders.map((tender) => (
                          <tr key={tender.id} className="border-b">
                            <td className="py-3 px-2">{tender.id}</td>
                            <td className="py-3 px-2">{tender.title}</td>
                            <td className="py-3 px-2">{tender.deadline}</td>
                            <td className="py-3 px-2">{tender.quantity}</td>
                            <td className="py-3 px-2">{tender.status}</td>
                            <td className="py-3 px-2">{tender.bids.length}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="supply-chain" className="space-y-4">
              <Card>
                <CardHeader><CardTitle>Supply Chain Tracking</CardTitle><CardDescription>Monitor movement of goods from purchase to distribution</CardDescription></CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead><tr className="border-b"><th className="text-left py-3 px-2">ID</th><th className="text-left py-3 px-2">Product</th><th className="text-left py-3 px-2">Source</th><th className="text-left py-3 px-2">Destination</th><th className="text-left py-3 px-2">Status</th><th className="text-left py-3 px-2">Date</th></tr></thead>
                      <tbody>
                        {shipments.map((event) => (
                          <tr key={event.id} className="border-b">
                            <td className="py-3 px-2">{event.id}</td>
                            <td className="py-3 px-2">{event.product}</td>
                            <td className="py-3 px-2">{event.source}</td>
                            <td className="py-3 px-2">{event.destination}</td>
                            <td className="py-3 px-2">{event.status}</td>
                            <td className="py-3 px-2">{event.date}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>Public Ledger</CardTitle><CardDescription>Transparent record of all government purchases and movement</CardDescription></CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {shipments.slice(0, 3).map((event) => (
                      <div key={event.id} className="flex items-center justify-between border-b pb-4">
                        <div className="flex items-center gap-4">
                          <div className="rounded-full bg-blue-100 p-2"><ShieldCheck className="h-4 w-4 text-blue-600" /></div>
                          <div>
                            <p className="font-medium">{event.product} Shipment</p>
                            <p className="text-sm text-gray-500">From {event.source} to {event.destination}</p>
                            <p className="text-xs text-gray-400">Transaction ID: {event.transactionId}</p>
                          </div>
                        </div>
                        <div className="text-sm text-gray-500">{event.date}</div>
                      </div>
                    ))}
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

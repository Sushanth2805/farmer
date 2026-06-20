"use client"

import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Building,
  ChevronDown,
  ChevronUp,
  Clock,
  Database,
  ExternalLink,
  FileText,
  Home,
  LogOut,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Store,
  Truck,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { auth } from "@/lib/firebase"
import { signOut, getAuth, onAuthStateChanged } from "firebase/auth"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import {
  createLedgerTransaction,
  ensureDynamicDataSeeded,
  getLedgerTransactions,
  subscribeToDynamicData,
  type LedgerTransactionRecord,
} from "@/lib/dynamic-data"

export default function PublicLedgerPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState("")
  const [commodityFilter, setCommodityFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [expandedTransaction, setExpandedTransaction] = useState<string | null>(null)
  const [transactions, setTransactions] = useState<LedgerTransactionRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddingTransaction, setIsAddingTransaction] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [newTransaction, setNewTransaction] = useState({
    commodity: "",
    quantity: "",
    broughtFrom: "",
    sourceLocation: "",
    storedAt: "",
    storageLocation: "",
    soldTo: "",
    destinationLocation: "",
    price: "",
    status: "Processing" as LedgerTransactionRecord["status"],
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
    const syncTransactions = () => {
      setTransactions(getLedgerTransactions())
      setLoading(false)
    }
    syncTransactions()
    return subscribeToDynamicData(syncTransactions)
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setNewTransaction((prev) => ({ ...prev, [name]: value }))
  }

  const calculateTotalValue = () => {
    const quantity = Number.parseFloat(newTransaction.quantity.replace(/[^0-9.]/g, ""))
    const price = Number.parseFloat(newTransaction.price.replace(/[^0-9.]/g, ""))
    if (!Number.isNaN(quantity) && !Number.isNaN(price)) {
      return `Rs. ${(quantity * price).toLocaleString()}`
    }
    return ""
  }

  const exportLedger = () => {
    if (transactions.length === 0) {
      toast({ title: "Nothing to export", description: "Create or sync ledger transactions first." })
      return
    }

    const headers = [
      "ID",
      "Hash",
      "Timestamp",
      "Commodity",
      "Quantity",
      "Brought From",
      "Source Location",
      "Stored At",
      "Storage Location",
      "Sold To",
      "Destination Location",
      "Price",
      "Total Value",
      "Status",
      "Block Number",
      "Verified",
    ]
    const rows = transactions.map((tx) =>
      [
        tx.id,
        tx.hash,
        tx.timestamp,
        tx.commodity,
        tx.quantity,
        tx.broughtFrom,
        tx.sourceLocation,
        tx.storedAt,
        tx.storageLocation,
        tx.soldTo,
        tx.destinationLocation,
        tx.price,
        tx.totalValue,
        tx.status,
        tx.blockNumber,
        tx.verified ? "Yes" : "No",
      ]
        .map((value) => `"${String(value).replace(/"/g, '""')}"`)
        .join(","),
    )

    const blob = new Blob([[headers.join(","), ...rows].join("\n")], { type: "text/csv;charset=utf-8" })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = "public-ledger.csv"
    link.click()
    window.URL.revokeObjectURL(url)
    toast({ title: "Ledger exported", description: "Downloaded the current public ledger as CSV." })
  }

  const openExplorerView = (transaction: LedgerTransactionRecord) => {
    const explorerDocument = `
      <html>
        <head>
          <title>${transaction.id} Explorer</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 24px; color: #111827; }
            h1 { margin-bottom: 4px; }
            p { color: #6b7280; }
            dl { display: grid; grid-template-columns: 180px 1fr; gap: 12px 16px; margin-top: 24px; }
            dt { font-weight: 600; }
            dd { margin: 0; word-break: break-word; }
          </style>
        </head>
        <body>
          <h1>${transaction.id}</h1>
          <p>Ledger explorer view for the selected transaction.</p>
          <dl>
            <dt>Hash</dt><dd>${transaction.hash}</dd>
            <dt>Commodity</dt><dd>${transaction.commodity}</dd>
            <dt>Quantity</dt><dd>${transaction.quantity}</dd>
            <dt>Status</dt><dd>${transaction.status}</dd>
            <dt>Timestamp</dt><dd>${new Date(transaction.timestamp).toLocaleString()}</dd>
            <dt>Source</dt><dd>${transaction.broughtFrom} (${transaction.sourceLocation})</dd>
            <dt>Storage</dt><dd>${transaction.storedAt} (${transaction.storageLocation})</dd>
            <dt>Destination</dt><dd>${transaction.soldTo} (${transaction.destinationLocation})</dd>
            <dt>Price</dt><dd>${transaction.price}</dd>
            <dt>Total Value</dt><dd>${transaction.totalValue}</dd>
            <dt>Block Number</dt><dd>${transaction.blockNumber}</dd>
            <dt>Previous Hash</dt><dd>${transaction.previousHash}</dd>
            <dt>Verified</dt><dd>${transaction.verified ? "Yes" : "No"}</dd>
          </dl>
        </body>
      </html>
    `

    const explorerUrl = window.URL.createObjectURL(new Blob([explorerDocument], { type: "text/html" }))
    window.open(explorerUrl, "_blank", "noopener,noreferrer")
  }

  const addTransaction = () => {
    const requiredFields = [
      "commodity",
      "quantity",
      "broughtFrom",
      "sourceLocation",
      "storedAt",
      "storageLocation",
      "soldTo",
      "destinationLocation",
      "price",
    ]
    const missingFields = requiredFields.filter((field) => !newTransaction[field as keyof typeof newTransaction])
    if (missingFields.length > 0) {
      toast({
        title: "Missing Information",
        description: `Please fill in all required fields: ${missingFields.join(", ")}`,
        variant: "destructive",
      })
      return
    }

    const record = createLedgerTransaction({
      commodity: newTransaction.commodity,
      quantity: newTransaction.quantity,
      broughtFrom: newTransaction.broughtFrom,
      sourceLocation: newTransaction.sourceLocation,
      storedAt: newTransaction.storedAt,
      storageLocation: newTransaction.storageLocation,
      soldTo: newTransaction.soldTo,
      destinationLocation: newTransaction.destinationLocation,
      price: newTransaction.price,
      totalValue: calculateTotalValue() || "Rs. 0",
      status: newTransaction.status,
    })

    setNewTransaction({
      commodity: "",
      quantity: "",
      broughtFrom: "",
      sourceLocation: "",
      storedAt: "",
      storageLocation: "",
      soldTo: "",
      destinationLocation: "",
      price: "",
      status: "Processing",
    })
    setIsAddingTransaction(false)
    toast({ title: "Transaction Added", description: `Transaction ${record.id} has been added to the public ledger.` })
  }

  const commodities = ["all", ...new Set(transactions.map((tx) => tx.commodity))]
  const filteredTransactions = transactions.filter((tx) => {
    const matchesSearch =
      tx.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.hash.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.broughtFrom.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.storedAt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.soldTo.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCommodity = commodityFilter === "all" || tx.commodity === commodityFilter
    const matchesStatus = statusFilter === "all" || tx.status.toLowerCase() === statusFilter.toLowerCase()
    return matchesSearch && matchesCommodity && matchesStatus
  })

  const ledgerStats = useMemo(() => {
    const totalValue = transactions.reduce((sum, tx) => sum + Number(tx.totalValue.replace(/[^0-9.]/g, "")), 0)
    const completedCount = transactions.filter((tx) => tx.status === "Completed").length
    const uniqueCommodities = new Set(transactions.map((tx) => tx.commodity)).size
    return { totalValue, completedCount, uniqueCommodities }
  }, [transactions])

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
              <Link href="/admin/public-ledger"><Button variant="secondary" className="w-full justify-start"><Database className="mr-2 h-4 w-4" />Public Ledger</Button></Link>
            </div>
          </div>
        </nav>
        <div className="border-t p-4">
          <div className="flex items-center gap-4 mb-4">
            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
              {user?.image ? <img src={user.image} alt="User" className="h-10 w-10 rounded-full" /> : <span className="text-sm font-semibold">{user?.name?.[0] || user?.email?.[0] || "U"}</span>}
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
        <div className="flex h-14 items-center border-b px-4 md:h-16"><Button variant="outline" size="sm" className="mr-4 md:hidden"><Building className="h-5 w-5 text-purple-600" /></Button></div>
        <div className="p-4 md:p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
            <div><h1 className="text-2xl font-bold">Public Ledger</h1><p className="text-gray-500">Transparent and immutable record of all government transactions</p></div>
            <div className="mt-4 md:mt-0 flex gap-2">
              <Dialog open={isAddingTransaction} onOpenChange={setIsAddingTransaction}>
                <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" />Add Transaction</Button></DialogTrigger>
                <DialogContent className="sm:max-w-[600px]">
                  <DialogHeader><DialogTitle>Add New Transaction</DialogTitle><DialogDescription>Add a new transaction to the immutable public ledger.</DialogDescription></DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2"><Label htmlFor="commodity">Commodity *</Label><Input id="commodity" name="commodity" placeholder="e.g., Wheat, Rice" value={newTransaction.commodity} onChange={handleInputChange} /></div>
                      <div className="space-y-2"><Label htmlFor="quantity">Quantity *</Label><Input id="quantity" name="quantity" placeholder="e.g., 200 tons" value={newTransaction.quantity} onChange={handleInputChange} /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2"><Label htmlFor="broughtFrom">Brought From *</Label><Input id="broughtFrom" name="broughtFrom" placeholder="Supplier name" value={newTransaction.broughtFrom} onChange={handleInputChange} /></div>
                      <div className="space-y-2"><Label htmlFor="sourceLocation">Source Location *</Label><Input id="sourceLocation" name="sourceLocation" placeholder="e.g., Amritsar, Punjab" value={newTransaction.sourceLocation} onChange={handleInputChange} /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2"><Label htmlFor="storedAt">Stored At *</Label><Input id="storedAt" name="storedAt" placeholder="Warehouse name" value={newTransaction.storedAt} onChange={handleInputChange} /></div>
                      <div className="space-y-2"><Label htmlFor="storageLocation">Storage Location *</Label><Input id="storageLocation" name="storageLocation" placeholder="e.g., Delhi Central" value={newTransaction.storageLocation} onChange={handleInputChange} /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2"><Label htmlFor="soldTo">Sold To *</Label><Input id="soldTo" name="soldTo" placeholder="Destination name" value={newTransaction.soldTo} onChange={handleInputChange} /></div>
                      <div className="space-y-2"><Label htmlFor="destinationLocation">Destination Location *</Label><Input id="destinationLocation" name="destinationLocation" placeholder="e.g., Central Delhi" value={newTransaction.destinationLocation} onChange={handleInputChange} /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2"><Label htmlFor="price">Price (per unit) *</Label><Input id="price" name="price" placeholder="e.g., Rs. 30,000/ton" value={newTransaction.price} onChange={handleInputChange} /></div>
                      <div className="space-y-2">
                        <Label htmlFor="status">Status</Label>
                        <Select value={newTransaction.status} onValueChange={(value: LedgerTransactionRecord["status"]) => setNewTransaction((prev) => ({ ...prev, status: value }))}>
                          <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Processing">Processing</SelectItem>
                            <SelectItem value="In Transit">In Transit</SelectItem>
                            <SelectItem value="Completed">Completed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    {calculateTotalValue() && <div className="bg-gray-50 p-3 rounded-md"><p className="text-sm font-medium">Calculated Total Value: {calculateTotalValue()}</p></div>}
                  </div>
                  <DialogFooter><Button variant="outline" onClick={() => setIsAddingTransaction(false)}>Cancel</Button><Button onClick={addTransaction}>Add to Ledger</Button></DialogFooter>
                </DialogContent>
              </Dialog>
              <Button variant="outline" onClick={exportLedger}><Database className="mr-2 h-4 w-4" />Export Ledger</Button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3 mb-6">
            <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total Ledger Value</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">Rs. {ledgerStats.totalValue.toLocaleString()}</div><p className="text-xs text-muted-foreground">Tracked across all entries</p></CardContent></Card>
            <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Completed Transactions</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{ledgerStats.completedCount}</div><p className="text-xs text-muted-foreground">Verified commodity movements</p></CardContent></Card>
            <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Commodities</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{ledgerStats.uniqueCommodities}</div><p className="text-xs text-muted-foreground">Unique commodities in the ledger</p></CardContent></Card>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div className="relative w-full md:w-auto md:flex-1 max-w-md"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" /><Input type="search" placeholder="Search by ID, hash, source, or destination..." className="w-full pl-8" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} /></div>
            <div className="flex gap-2 w-full md:w-auto">
              <Select value={commodityFilter} onValueChange={setCommodityFilter}>
                <SelectTrigger className="w-[150px]"><SelectValue placeholder="Commodity" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Commodities</SelectItem>
                  {commodities.filter((c) => c !== "all").map((commodity) => <SelectItem key={commodity} value={commodity}>{commodity}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="in transit">In Transit</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Tabs defaultValue="ledger" className="mb-6">
            <TabsList>
              <TabsTrigger value="ledger">Ledger View</TabsTrigger>
              <TabsTrigger value="blockchain">Blockchain View</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

            <TabsContent value="ledger" className="space-y-4">
              <Card>
                <CardHeader><CardTitle>Transaction Ledger</CardTitle><CardDescription>Complete record of all commodity transactions</CardDescription></CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex justify-center items-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-700"></div></div>
                  ) : (
                    <div className="space-y-4">
                      {filteredTransactions.length > 0 ? filteredTransactions.map((tx) => (
                        <Collapsible key={tx.id} open={expandedTransaction === tx.id} onOpenChange={() => setExpandedTransaction(expandedTransaction === tx.id ? null : tx.id)} className="border rounded-md">
                          <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50">
                            <div className="flex items-center gap-4">
                              <div className={`rounded-full p-2 ${tx.status === "Completed" ? "bg-green-100" : tx.status === "In Transit" ? "bg-blue-100" : "bg-orange-100"}`}><ShieldCheck className={`h-4 w-4 ${tx.status === "Completed" ? "text-green-600" : tx.status === "In Transit" ? "text-blue-600" : "text-orange-600"}`} /></div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="font-medium">{tx.id}</p>
                                  <Badge className={tx.status === "Completed" ? "bg-green-100 text-green-800 hover:bg-green-100" : tx.status === "In Transit" ? "bg-blue-100 text-blue-800 hover:bg-blue-100" : "bg-orange-100 text-orange-800 hover:bg-orange-100"}>{tx.status}</Badge>
                                  {tx.verified && <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">Verified</Badge>}
                                </div>
                                <p className="text-sm text-gray-500">{tx.commodity} • {tx.quantity} • {new Date(tx.timestamp).toLocaleString()}</p>
                              </div>
                            </div>
                            <CollapsibleTrigger asChild><Button variant="ghost" size="sm">{expandedTransaction === tx.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}</Button></CollapsibleTrigger>
                          </div>
                          <CollapsibleContent>
                            <div className="border-t p-4 bg-gray-50">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                  <h3 className="text-sm font-medium mb-2">Transaction Details</h3>
                                  <div className="space-y-2">
                                    <div className="flex justify-between"><span className="text-sm text-gray-500">Transaction Hash:</span><span className="text-sm font-mono">{tx.hash.substring(0, 12)}...</span></div>
                                    <div className="flex justify-between"><span className="text-sm text-gray-500">Block Number:</span><span className="text-sm">{tx.blockNumber}</span></div>
                                    <div className="flex justify-between"><span className="text-sm text-gray-500">Timestamp:</span><span className="text-sm">{new Date(tx.timestamp).toLocaleString()}</span></div>
                                    <div className="flex justify-between"><span className="text-sm text-gray-500">Total Value:</span><span className="text-sm">{tx.totalValue}</span></div>
                                    <div className="flex justify-between"><span className="text-sm text-gray-500">Price:</span><span className="text-sm">{tx.price}</span></div>
                                  </div>
                                </div>
                                <div>
                                  <h3 className="text-sm font-medium mb-2">Supply Chain Path</h3>
                                  <div className="space-y-4">
                                    <div className="flex items-start gap-3"><div className="rounded-full bg-green-100 p-2 mt-1"><Truck className="h-4 w-4 text-green-600" /></div><div><p className="text-sm font-medium">Brought From</p><p className="text-sm">{tx.broughtFrom}</p><p className="text-xs text-gray-500">{tx.sourceLocation}</p></div></div>
                                    <div className="flex items-start gap-3"><div className="rounded-full bg-blue-100 p-2 mt-1"><Database className="h-4 w-4 text-blue-600" /></div><div><p className="text-sm font-medium">Stored At</p><p className="text-sm">{tx.storedAt}</p><p className="text-xs text-gray-500">{tx.storageLocation}</p></div></div>
                                    <div className="flex items-start gap-3"><div className="rounded-full bg-purple-100 p-2 mt-1"><Store className="h-4 w-4 text-purple-600" /></div><div><p className="text-sm font-medium">Sold To</p><p className="text-sm">{tx.soldTo}</p><p className="text-xs text-gray-500">{tx.destinationLocation}</p></div></div>
                                  </div>
                                </div>
                              </div>
                              <div className="mt-4 flex justify-end"><Button variant="outline" size="sm" className="flex items-center gap-1" onClick={() => openExplorerView(tx)}><ExternalLink className="h-3 w-3" />View on Explorer</Button></div>
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      )) : (
                        <div className="flex flex-col items-center justify-center py-12">
                          <Database className="h-16 w-16 text-gray-300 mb-4" />
                          <h2 className="text-xl font-semibold mb-2">No transactions found</h2>
                          <p className="text-gray-500 mb-6">Try adjusting your search or filters</p>
                          <Button variant="outline" onClick={() => { setSearchQuery(""); setCommodityFilter("all"); setStatusFilter("all") }}>Reset Filters</Button>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="blockchain" className="space-y-4">
              <Card>
                <CardHeader><CardTitle>Blockchain View</CardTitle><CardDescription>Visual representation of the transaction chain</CardDescription></CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <div className="flex flex-nowrap gap-4 pb-4 min-w-max">
                      {[...transactions].sort((a, b) => b.blockNumber - a.blockNumber).slice(0, 6).map((tx, index) => (
                        <div key={tx.id} className="flex flex-col items-center min-w-[200px] max-w-[200px] border rounded-md p-4 bg-white relative">
                          <div className="text-xs font-mono bg-gray-100 px-2 py-1 rounded mb-2 w-full text-center">Block #{tx.blockNumber}</div>
                          <div className="text-xs font-mono text-gray-500 mb-2 truncate w-full text-center">{tx.hash.substring(0, 10)}...</div>
                          <div className="text-sm font-medium mb-1">{tx.commodity}</div>
                          <div className="text-xs text-gray-500 mb-2">{tx.quantity}</div>
                          <Badge className={tx.status === "Completed" ? "bg-green-100 text-green-800 hover:bg-green-100" : tx.status === "In Transit" ? "bg-blue-100 text-blue-800 hover:bg-blue-100" : "bg-orange-100 text-orange-800 hover:bg-orange-100"}>{tx.status}</Badge>
                          <div className="flex items-center gap-1 mt-2 text-xs text-gray-500"><Clock className="h-3 w-3" />{new Date(tx.timestamp).toLocaleDateString()}</div>
                          {index < 5 && <div className="absolute right-[-20px] top-1/2 transform -translate-y-1/2"><div className="w-4 h-0.5 bg-gray-300"></div></div>}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="mt-6 bg-gray-100 rounded-md p-4">
                    <h3 className="text-sm font-medium mb-2">Blockchain Statistics</h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="bg-white p-3 rounded-md shadow-sm"><div className="text-xs text-gray-500">Total Blocks</div><div className="text-xl font-semibold">{transactions.length > 0 ? Math.max(...transactions.map((tx) => tx.blockNumber)) : 0}</div></div>
                      <div className="bg-white p-3 rounded-md shadow-sm"><div className="text-xs text-gray-500">Total Transactions</div><div className="text-xl font-semibold">{transactions.length}</div></div>
                      <div className="bg-white p-3 rounded-md shadow-sm"><div className="text-xs text-gray-500">Verified Entries</div><div className="text-xl font-semibold">{transactions.filter((tx) => tx.verified).length}</div></div>
                      <div className="bg-white p-3 rounded-md shadow-sm"><div className="text-xs text-gray-500">Statuses</div><div className="text-xl font-semibold">{new Set(transactions.map((tx) => tx.status)).size}</div></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-4">
              <Card>
                <CardHeader><CardTitle>Ledger Analytics</CardTitle><CardDescription>Statistical analysis of transaction data</CardDescription></CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3">
                    {commodities.filter((commodity) => commodity !== "all").map((commodity) => {
                      const commodityTransactions = transactions.filter((tx) => tx.commodity === commodity)
                      const commodityValue = commodityTransactions.reduce((sum, tx) => sum + Number(tx.totalValue.replace(/[^0-9.]/g, "")), 0)
                      return (
                        <Card key={commodity}>
                          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">{commodity}</CardTitle></CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold">Rs. {commodityValue.toLocaleString()}</div>
                            <p className="text-xs text-muted-foreground">{commodityTransactions.length} transactions</p>
                          </CardContent>
                        </Card>
                      )
                    })}
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

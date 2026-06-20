"use client"

import { Label } from "@/components/ui/label"
import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertCircle, Calendar, FileText, Search } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { getAuth, onAuthStateChanged } from "firebase/auth"
import { ensureDynamicDataSeeded, getTenders, saveTenderBid, subscribeToDynamicData, type TenderRecord } from "@/lib/dynamic-data"

export default function FarmerTendersPage() {
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedTender, setSelectedTender] = useState<TenderRecord | null>(null)
  const [tenders, setTenders] = useState<TenderRecord[]>([])
  const [bidDetails, setBidDetails] = useState({ quantity: "", price: "", notes: "" })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showDialog, setShowDialog] = useState(false)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const auth = getAuth()
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser({
          uid: firebaseUser.uid,
          name: firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "Farmer",
          email: firebaseUser.email || "unknown@example.com",
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
        return matchesSearch && matchesStatus
      }),
    [searchQuery, statusFilter, tenders],
  )

  const myBids = useMemo(() => {
    if (!user?.uid) return []

    return tenders
      .flatMap((tender) =>
        tender.bids
          .filter((bid) => bid.farmerId === user.uid)
          .map((bid) => ({
            id: bid.id,
            tenderId: tender.id,
            tenderTitle: tender.title,
            quantity: bid.quantity,
            price: bid.price,
            totalValue: `Rs. ${bid.amount.toLocaleString()}`,
            status: bid.status,
            submittedDate: new Date(bid.createdAt).toLocaleDateString("en-IN"),
            submittedAt: bid.createdAt,
            product: tender.product,
          })),
      )
      .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
  }, [tenders, user?.uid])

  const handleSelectTender = (tender: TenderRecord) => {
    setSelectedTender(tender)
    setBidDetails({ quantity: "", price: tender.minPrice.toString(), notes: "" })
    setShowDialog(true)
  }

  const handleBidInputChange = (e: { target: { name: string; value: string } }) => {
    const { name, value } = e.target
    setBidDetails((prev) => ({ ...prev, [name]: value }))
  }

  const handleBidSubmit = (e: { preventDefault: () => void }) => {
    e.preventDefault()
    if (!selectedTender || !user?.uid) {
      return
    }

    setIsSubmitting(true)

    saveTenderBid(selectedTender.id, {
      farmerId: user.uid,
      farmerName: user.name,
      farmerEmail: user.email,
      quantity: `${bidDetails.quantity} tons`,
      price: `Rs. ${Number(bidDetails.price).toLocaleString()}/ton`,
      amount: Number(bidDetails.quantity) * Number(bidDetails.price),
      notes: bidDetails.notes,
    })

    setIsSubmitting(false)
    setShowDialog(false)

    toast({
      title: "Bid submitted successfully",
      description: `Your bid for ${selectedTender.title} has been submitted and is under review.`,
    })
  }

  return (
    <div className="container max-w-6xl py-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Government Procurement Tenders</h1>
          <p className="text-gray-500">Apply for government procurement opportunities</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div className="relative w-full md:w-auto md:flex-1 max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input type="search" placeholder="Search tenders by ID, title, or product..." className="w-full pl-8" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <Button variant={statusFilter === "all" ? "default" : "outline"} size="sm" onClick={() => setStatusFilter("all")}>All</Button>
          <Button variant={statusFilter === "open" ? "default" : "outline"} size="sm" onClick={() => setStatusFilter("open")}>Open</Button>
          <Button variant={statusFilter === "closing soon" ? "default" : "outline"} size="sm" onClick={() => setStatusFilter("closing soon")}>Closing Soon</Button>
        </div>
      </div>

      <Tabs defaultValue="available" className="w-full">
        <TabsList>
          <TabsTrigger value="available">Available Tenders</TabsTrigger>
          <TabsTrigger value="mybids">My Bids</TabsTrigger>
        </TabsList>

        <TabsContent value="available" className="space-y-4">
          {filteredTenders.map((tender) => (
            <Card key={tender.id} className="mb-4">
              <CardHeader>
                <div className="flex flex-col md:flex-row md:items-start justify-between">
                  <div>
                    <CardTitle>{tender.title}</CardTitle>
                    <CardDescription>{tender.id} • {tender.product} • {tender.region}</CardDescription>
                  </div>
                  <Badge className={tender.status === "Open" ? "mt-2 md:mt-0 bg-green-100 text-green-800 hover:bg-green-100" : tender.status === "Closing Soon" ? "mt-2 md:mt-0 bg-orange-100 text-orange-800 hover:bg-orange-100" : "mt-2 md:mt-0 bg-red-100 text-red-800 hover:bg-red-100"}>
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
                        <span className="text-sm text-gray-500">Price Range:</span>
                        <span className="text-sm">Rs. {tender.minPrice.toLocaleString()} - Rs. {tender.maxPrice.toLocaleString()}/ton</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium mb-2">Requirements</h3>
                    <div className="space-y-2">
                      <p className="text-sm">{tender.requirements}</p>
                      <div className="mt-4 pt-4 border-t">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-500">
                            {new Date(tender.deadline) < new Date()
                              ? "Deadline passed"
                              : `${Math.ceil((new Date(tender.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days remaining`}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button onClick={() => handleSelectTender(tender)} disabled={new Date(tender.deadline) < new Date()}>
                  Apply for Tender
                </Button>
              </CardFooter>
            </Card>
          ))}

          {filteredTenders.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="h-12 w-12 text-gray-300 mb-4" />
              <h2 className="text-xl font-medium mb-2">No tenders found</h2>
              <p className="text-gray-500 mb-6">Try adjusting your search criteria</p>
              <Button variant="outline" onClick={() => { setSearchQuery(""); setStatusFilter("all") }}>
                Reset Filters
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="mybids" className="space-y-4">
          {myBids.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-gray-300 mb-4" />
              <h2 className="text-xl font-medium mb-2">No bids yet</h2>
              <p className="text-gray-500 mb-6">You haven&apos;t applied for any tenders yet</p>
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>My Tender Applications</CardTitle>
                <CardDescription>Track the status of your tender applications</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-2">Bid ID</th>
                        <th className="text-left py-3 px-2">Tender</th>
                        <th className="text-left py-3 px-2">Product</th>
                        <th className="text-left py-3 px-2">Quantity</th>
                        <th className="text-left py-3 px-2">Price</th>
                        <th className="text-left py-3 px-2">Total Value</th>
                        <th className="text-left py-3 px-2">Submitted</th>
                        <th className="text-left py-3 px-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {myBids.map((bid) => (
                        <tr key={bid.id} className="border-b">
                          <td className="py-3 px-2">{bid.id}</td>
                          <td className="py-3 px-2">
                            <div className="font-medium">{bid.tenderTitle}</div>
                            <div className="text-xs text-gray-500">{bid.tenderId}</div>
                          </td>
                          <td className="py-3 px-2">{bid.product}</td>
                          <td className="py-3 px-2">{bid.quantity}</td>
                          <td className="py-3 px-2">{bid.price}</td>
                          <td className="py-3 px-2">{bid.totalValue}</td>
                          <td className="py-3 px-2">{bid.submittedDate}</td>
                          <td className="py-3 px-2">
                            <Badge className={bid.status === "Accepted" ? "bg-green-100 text-green-800 hover:bg-green-100" : bid.status === "Rejected" ? "bg-red-100 text-red-800 hover:bg-red-100" : "bg-blue-100 text-blue-800 hover:bg-blue-100"}>
                              {bid.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Apply for Tender</DialogTitle>
            <DialogDescription>{selectedTender?.title} ({selectedTender?.id})</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleBidSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="quantity" className="text-right">Quantity (tons)</Label>
                <Input id="quantity" name="quantity" type="number" min="1" max={selectedTender?.quantity?.replace(/\D/g, "")} value={bidDetails.quantity} onChange={handleBidInputChange} className="col-span-3" required />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="price" className="text-right">Price per ton (Rs.)</Label>
                <Input id="price" name="price" type="number" min={selectedTender?.minPrice} max={selectedTender?.maxPrice} value={bidDetails.price} onChange={handleBidInputChange} className="col-span-3" required />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="notes" className="text-right">Notes</Label>
                <Textarea id="notes" name="notes" placeholder="Additional details about your bid" value={bidDetails.notes} onChange={handleBidInputChange} className="col-span-3" rows={3} />
              </div>

              {bidDetails.quantity && bidDetails.price && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <div className="text-right">
                    <span className="text-sm font-medium">Total Value:</span>
                  </div>
                  <div className="col-span-3">
                    <span className="text-lg font-bold">Rs. {(Number.parseInt(bidDetails.quantity) * Number.parseInt(bidDetails.price)).toLocaleString()}</span>
                  </div>
                </div>
              )}

              {selectedTender && (
                <div className="bg-amber-50 p-4 rounded-md">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-amber-800">Important Note</h4>
                      <p className="text-sm text-amber-700">By submitting this bid, you are committing to deliver the specified quantity at the price mentioned above if your bid is accepted.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Submitting..." : "Submit Bid"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

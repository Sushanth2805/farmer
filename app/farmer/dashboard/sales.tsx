"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart, Line, BarChart, Bar, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip } from "@/components/ui/chart"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowUpRight, Download } from "lucide-react"
import { getAuth, onAuthStateChanged } from "firebase/auth"
import { ensureDynamicDataSeeded, getOrdersForFarmer, getProductsByOwner, subscribeToDynamicData } from "@/lib/dynamic-data"

type ChartPoint = { label: string; amount: number }
type ProductPoint = { name: string; value: number }
type TransactionRow = {
  id: string
  buyer: string
  date: string
  products: string
  amountValue: number
  amount: string
  status: string
  rawDate: string
}

const rangeInMonths: Record<string, number> = {
  "1m": 1,
  "3m": 3,
  "6m": 6,
  "1y": 12,
}

export default function FarmerSales() {
  const [timeRange, setTimeRange] = useState("6m")
  const [userId, setUserId] = useState<string | null>(null)
  const [monthlySales, setMonthlySales] = useState<ChartPoint[]>([])
  const [weeklyEarnings, setWeeklyEarnings] = useState<ChartPoint[]>([])
  const [productPerformance, setProductPerformance] = useState<ProductPoint[]>([])
  const [transactions, setTransactions] = useState<TransactionRow[]>([])

  useEffect(() => {
    const auth = getAuth()
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUserId(firebaseUser?.uid || null)
    })
    return () => unsubscribe()
  }, [])

  useEffect(() => {
    ensureDynamicDataSeeded()
  }, [])

  useEffect(() => {
    if (!userId) return

    const syncSales = () => {
      const orders = getOrdersForFarmer(userId)
      const products = getProductsByOwner(userId)
      const monthsToKeep = rangeInMonths[timeRange]
      const cutoff = new Date()
      cutoff.setMonth(cutoff.getMonth() - monthsToKeep)

      const relevantOrders = orders.filter((order) => new Date(order.date) >= cutoff)
      const monthMap = new Map<string, number>()
      const weekMap = new Map<string, number>()
      const productMap = new Map<string, number>()

      relevantOrders.forEach((order) => {
        const orderDate = new Date(order.date)
        const month = orderDate.toLocaleDateString("en-IN", { month: "short", year: "2-digit" })
        const week = `${orderDate.toLocaleDateString("en-IN", { month: "short" })} W${Math.min(5, Math.floor((orderDate.getDate() - 1) / 7) + 1)}`
        const farmerItems = order.items.filter((item) => item.farmerId === userId)
        const total = farmerItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
        monthMap.set(month, (monthMap.get(month) || 0) + total)
        weekMap.set(week, (weekMap.get(week) || 0) + total)
        farmerItems.forEach((item) => productMap.set(item.name, (productMap.get(item.name) || 0) + item.price * item.quantity))
      })

      setMonthlySales(Array.from(monthMap.entries()).map(([label, amount]) => ({ label, amount })))
      setWeeklyEarnings(Array.from(weekMap.entries()).map(([label, amount]) => ({ label, amount })))
      setProductPerformance(
        Array.from(productMap.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value),
      )
      setTransactions(
        relevantOrders.map((order) => {
          const amountValue = order.items
            .filter((item) => item.farmerId === userId)
            .reduce((sum, item) => sum + item.price * item.quantity, 0)

          return {
            id: order.id,
            buyer: order.consumerName,
            date: new Date(order.date).toLocaleDateString("en-IN"),
            products: order.items.filter((item) => item.farmerId === userId).map((item) => item.name).join(", "),
            amountValue,
            amount: `Rs. ${amountValue.toLocaleString()}`,
            status: order.status === "delivered" ? "Completed" : order.status === "cancelled" ? "Cancelled" : "Pending",
            rawDate: order.date,
          }
        }),
      )

      if (productMap.size === 0 && products.length > 0) {
        setProductPerformance(products.map((product) => ({ name: product.name, value: product.price * product.quantity })))
      }
    }

    syncSales()
    return subscribeToDynamicData(syncSales)
  }, [timeRange, userId])

  const exportSales = () => {
    if (transactions.length === 0) {
      return
    }

    const rows = transactions.map((transaction) =>
      [transaction.id, transaction.buyer, transaction.date, transaction.products, transaction.amountValue, transaction.status]
        .map((value) => `"${String(value).replace(/"/g, '""')}"`)
        .join(","),
    )
    const csv = [["Transaction ID", "Buyer", "Date", "Products", "Amount", "Status"].join(","), ...rows].join("\n")
    const url = window.URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }))
    const link = document.createElement("a")
    link.href = url
    link.download = "farmer-sales.csv"
    link.click()
    window.URL.revokeObjectURL(url)
  }

  const totalEarnings = monthlySales.reduce((sum, month) => sum + month.amount, 0)
  const avgEarnings = monthlySales.length > 0 ? Math.round(totalEarnings / monthlySales.length) : 0
  const currentMonthEarnings = monthlySales[monthlySales.length - 1]?.amount || 0
  const prevMonthEarnings = monthlySales[monthlySales.length - 2]?.amount || currentMonthEarnings || 1
  const growthPercentage = prevMonthEarnings ? Math.round(((currentMonthEarnings - prevMonthEarnings) / prevMonthEarnings) * 100) : 0
  const sortedTransactions = useMemo(
    () => [...transactions].sort((a, b) => new Date(b.rawDate).getTime() - new Date(a.rawDate).getTime()),
    [transactions],
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <h2 className="text-2xl font-bold">Sales & Earnings</h2>
          <p className="text-gray-500">Monitor your sales performance and earnings</p>
        </div>
        <div className="flex gap-2 mt-2 md:mt-0">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[150px]"><SelectValue placeholder="Select time range" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="1m">Last Month</SelectItem>
              <SelectItem value="3m">Last 3 Months</SelectItem>
              <SelectItem value="6m">Last 6 Months</SelectItem>
              <SelectItem value="1y">Last Year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={exportSales} disabled={transactions.length === 0}><Download className="h-4 w-4" /></Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total Earnings</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">Rs. {totalEarnings.toLocaleString()}</div><p className="text-xs text-muted-foreground">Over the selected period</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Monthly Average</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">Rs. {avgEarnings.toLocaleString()}</div><p className="text-xs text-muted-foreground">Average per month</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">This Month</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">Rs. {currentMonthEarnings.toLocaleString()}</div><p className="text-xs text-muted-foreground"><span className={growthPercentage >= 0 ? "text-green-500" : "text-red-500"}>{growthPercentage >= 0 ? "+" : ""}{growthPercentage}%</span> from last month</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Top Products</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{productPerformance.length}</div><p className="text-xs text-muted-foreground">Products generating revenue</p></CardContent></Card>
      </div>

      <Tabs defaultValue="earnings" className="w-full">
        <TabsList>
          <TabsTrigger value="earnings">Earnings</TabsTrigger>
          <TabsTrigger value="products">Product Performance</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
        </TabsList>

        <TabsContent value="earnings" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Monthly Earnings</CardTitle></CardHeader>
            <CardContent className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlySales}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`Rs. ${value}`, "Revenue"]} labelFormatter={(label) => `Month: ${label}`} />
                  <Bar dataKey="amount" fill="#4ade80" name="Revenue" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Weekly Earnings</CardTitle></CardHeader>
            <CardContent className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weeklyEarnings}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`Rs. ${value}`, "Revenue"]} />
                  <Line type="monotone" dataKey="amount" stroke="#8884d8" name="Revenue" activeDot={{ r: 8 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Product Revenue</CardTitle></CardHeader>
            <CardContent className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={productPerformance} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={100} />
                  <Tooltip formatter={(value) => [`Rs. ${value}`, "Revenue"]} />
                  <Bar dataKey="value" fill="#22c55e" name="Revenue" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Top Performing Products</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-4">
                {productPerformance.map((product, idx) => (
                  <div key={product.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="font-medium w-6 text-center">{idx + 1}</div>
                      <div>
                        <div className="font-medium">{product.name}</div>
                        <div className="text-sm text-gray-500">{(product.value / 1000).toFixed(1)}k revenue</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="font-medium text-right">Rs. {product.value.toLocaleString()}</div>
                      <Button variant="ghost" size="icon" className="h-8 w-8"><ArrowUpRight className="h-4 w-4" /></Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Recent Transactions</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-2">Transaction ID</th>
                      <th className="text-left py-3 px-2">Buyer</th>
                      <th className="text-left py-3 px-2">Date</th>
                      <th className="text-left py-3 px-2">Products</th>
                      <th className="text-left py-3 px-2">Amount</th>
                      <th className="text-left py-3 px-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedTransactions.map((transaction) => (
                      <tr key={transaction.id} className="border-b">
                        <td className="py-3 px-2">{transaction.id}</td>
                        <td className="py-3 px-2">{transaction.buyer}</td>
                        <td className="py-3 px-2">{transaction.date}</td>
                        <td className="py-3 px-2">{transaction.products}</td>
                        <td className="py-3 px-2">{transaction.amount}</td>
                        <td className="py-3 px-2"><span className={`inline-block px-2 py-1 rounded-full text-xs ${transaction.status === "Completed" ? "bg-green-100 text-green-800" : transaction.status === "Cancelled" ? "bg-red-100 text-red-800" : "bg-orange-100 text-orange-800"}`}>{transaction.status}</span></td>
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
  )
}

"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/components/ui/use-toast"
import { useStore } from "@/lib/store"
import { ChevronLeft, CreditCard, Leaf, Wallet } from "lucide-react"
import { getAuth, onAuthStateChanged } from "firebase/auth"
import { createOrder } from "@/lib/dynamic-data"

export default function CheckoutPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { cart, clearCart } = useStore()
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState("card")
  const [user, setUser] = useState<any>(null)
  const [upiId, setUpiId] = useState("")
  const [cardDetails, setCardDetails] = useState({
    name: "",
    number: "",
    expiry: "",
    cvc: "",
  })
  const [billingAddress, setBillingAddress] = useState({
    address: "",
    city: "",
    state: "",
    postalCode: "",
    country: "India",
  })

  useEffect(() => {
    const auth = getAuth()
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser)
      } else {
        setUser(null)
      }
    })

    return () => unsubscribe()
  }, [])

  useEffect(() => {
    if (cart.length === 0) {
      router.replace("/consumer/cart")
    }
  }, [cart.length, router])

  const subtotal = cart.reduce((total, item) => total + item.price * item.quantity, 0)
  const deliveryFee = 50
  const total = subtotal + deliveryFee

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, formType: "card" | "billing") => {
    const { name, value } = e.target

    if (formType === "card") {
      setCardDetails((prev) => ({ ...prev, [name]: value }))
    } else {
      setBillingAddress((prev) => ({ ...prev, [name]: value }))
    }
  }

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "")
    if (value.length > 0) {
      value = value.match(/.{1,4}/g)?.join(" ") || value
    }

    if (value.length <= 19) {
      setCardDetails((prev) => ({ ...prev, number: value }))
    }
  }

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "")
    if (value.length > 2) {
      value = `${value.slice(0, 2)}/${value.slice(2, 4)}`
    }

    if (value.length <= 5) {
      setCardDetails((prev) => ({ ...prev, expiry: value }))
    }
  }

  const handleCvcChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "")
    if (value.length <= 3) {
      setCardDetails((prev) => ({ ...prev, cvc: value }))
    }
  }

  const validateForm = () => {
    if (paymentMethod === "card") {
      if (!cardDetails.name || cardDetails.name.length < 3) {
        toast({ title: "Invalid name", description: "Please enter the cardholder name", variant: "destructive" })
        return false
      }
      if (!cardDetails.number || cardDetails.number.replace(/\s/g, "").length !== 16) {
        toast({ title: "Invalid card number", description: "Please enter a valid 16-digit card number", variant: "destructive" })
        return false
      }
      if (!cardDetails.expiry || !/^\d{2}\/\d{2}$/.test(cardDetails.expiry)) {
        toast({ title: "Invalid expiry date", description: "Please enter a valid expiry date (MM/YY)", variant: "destructive" })
        return false
      }
      if (!cardDetails.cvc || cardDetails.cvc.length !== 3) {
        toast({ title: "Invalid CVC", description: "Please enter a valid 3-digit CVC code", variant: "destructive" })
        return false
      }
    }

    if (paymentMethod === "upi" && !/^[\w.-]{2,}@[A-Za-z]{2,}$/.test(upiId)) {
      toast({ title: "Invalid UPI ID", description: "Please enter a valid UPI ID before continuing.", variant: "destructive" })
      return false
    }

    if (!billingAddress.address || !billingAddress.city || !billingAddress.state || !billingAddress.postalCode) {
      toast({
        title: "Incomplete billing address",
        description: "Please fill in all required address fields",
        variant: "destructive",
      })
      return false
    }

    if (!user?.uid || !user?.email) {
      toast({
        title: "Sign in required",
        description: "Please sign in again before placing an order.",
        variant: "destructive",
      })
      return false
    }

    return true
  }

  const processPayment = async () => new Promise<boolean>((resolve) => setTimeout(() => resolve(true), 1200))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    setIsProcessing(true)

    try {
      const success = await processPayment()
      if (!success) {
        toast({ title: "Payment failed", description: "There was an issue processing your payment. Please try again.", variant: "destructive" })
        setIsProcessing(false)
        return
      }

      createOrder({
        consumerId: user.uid,
        consumerName: user.displayName || user.email.split("@")[0],
        consumerEmail: user.email,
        consumerPhone: paymentMethod === "upi" ? upiId : "Not provided",
        items: cart.map((item) => ({
          id: `${item.productId || item.id}`,
          productId: item.productId || String(item.id),
          name: item.name,
          price: item.price,
          image: item.image,
          farmer: item.farmer,
          farmerEmail: item.farmerEmail || "No Email",
          farmerId: item.farmerId || "unknown-farmer",
          unit: item.unit,
          quantity: item.quantity,
        })),
        subtotal,
        deliveryFee,
        total,
        paymentMethod: paymentMethod === "card" ? "Credit/Debit Card" : "UPI/Wallet",
        deliveryAddress: billingAddress,
      })

      clearCart()
      toast({
        title: "Payment successful!",
        description: "Your order has been placed and will be processed soon.",
      })
      router.push("/consumer/myorders")
    } catch (error) {
      console.error("Payment error:", error)
      toast({ title: "Payment error", description: "An unexpected error occurred. Please try again later.", variant: "destructive" })
      setIsProcessing(false)
    }
  }

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="border-b bg-white">
          <div className="container mx-auto flex h-16 items-center px-4">
            <Link href="/" className="flex items-center gap-2 font-semibold">
              <Leaf className="h-5 w-5 text-green-600" />
              <span>Consumer Portal</span>
            </Link>
          </div>
        </header>
        <main className="container mx-auto px-4 py-8">
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle>Your cart is empty</CardTitle>
              <CardDescription>Add products before continuing to checkout.</CardDescription>
            </CardHeader>
            <CardFooter>
              <Button onClick={() => router.push("/consumer/cart")}>Go to Cart</Button>
            </CardFooter>
          </Card>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="container mx-auto flex h-16 items-center px-4">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <Leaf className="h-5 w-5 text-green-600" />
            <span>Consumer Portal</span>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button variant="ghost" size="sm" onClick={() => router.back()} className="mb-2">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Cart
          </Button>
          <h1 className="text-2xl font-bold">Checkout</h1>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <div className="md:col-span-2">
            <form onSubmit={handleSubmit}>
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Payment Method</CardTitle>
                  <CardDescription>Select your preferred payment method</CardDescription>
                </CardHeader>
                <CardContent>
                  <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="grid grid-cols-2 gap-4">
                    <div>
                      <RadioGroupItem value="card" id="card" className="peer sr-only" />
                      <Label htmlFor="card" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                        <CreditCard className="mb-3 h-6 w-6" />
                        Credit/Debit Card
                      </Label>
                    </div>
                    <div>
                      <RadioGroupItem value="upi" id="upi" className="peer sr-only" />
                      <Label htmlFor="upi" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                        <Wallet className="mb-3 h-6 w-6" />
                        UPI/Wallet
                      </Label>
                    </div>
                  </RadioGroup>
                </CardContent>
              </Card>

              {paymentMethod === "card" && (
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle>Card Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-2">
                      <Label htmlFor="name">Cardholder Name</Label>
                      <Input id="name" name="name" placeholder="Name as it appears on card" value={cardDetails.name} onChange={(e) => handleInputChange(e, "card")} required />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="number">Card Number</Label>
                      <Input id="number" name="number" placeholder="1234 5678 9012 3456" value={cardDetails.number} onChange={handleCardNumberChange} required />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="expiry">Expiry Date</Label>
                        <Input id="expiry" name="expiry" placeholder="MM/YY" value={cardDetails.expiry} onChange={handleExpiryChange} required />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="cvc">CVC</Label>
                        <Input id="cvc" name="cvc" placeholder="123" value={cardDetails.cvc} onChange={handleCvcChange} required />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {paymentMethod === "upi" && (
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle>UPI Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-2">
                      <Label htmlFor="upiId">UPI ID</Label>
                      <Input id="upiId" placeholder="yourname@upi" value={upiId} onChange={(e) => setUpiId(e.target.value)} required />
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Billing Address</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="address">Street Address</Label>
                    <Input id="address" name="address" placeholder="123 Main St" value={billingAddress.address} onChange={(e) => handleInputChange(e, "billing")} required />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="city">City</Label>
                      <Input id="city" name="city" placeholder="City" value={billingAddress.city} onChange={(e) => handleInputChange(e, "billing")} required />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="state">State</Label>
                      <Input id="state" name="state" placeholder="State" value={billingAddress.state} onChange={(e) => handleInputChange(e, "billing")} required />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="postalCode">Postal Code</Label>
                      <Input id="postalCode" name="postalCode" placeholder="123456" value={billingAddress.postalCode} onChange={(e) => handleInputChange(e, "billing")} required />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="country">Country</Label>
                      <Input id="country" name="country" value={billingAddress.country} onChange={(e) => handleInputChange(e, "billing")} disabled />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="md:hidden">
                <OrderSummary cart={cart} subtotal={subtotal} deliveryFee={deliveryFee} total={total} isProcessing={isProcessing} />
              </div>
            </form>
          </div>

          <div className="hidden md:block">
            <OrderSummary cart={cart} subtotal={subtotal} deliveryFee={deliveryFee} total={total} isProcessing={isProcessing} onSubmit={handleSubmit} />
          </div>
        </div>
      </main>
    </div>
  )
}

interface OrderSummaryProps {
  cart: any[]
  subtotal: number
  deliveryFee: number
  total: number
  isProcessing: boolean
  onSubmit?: (e: React.FormEvent) => void
}

function OrderSummary({ cart, subtotal, deliveryFee, total, isProcessing, onSubmit }: OrderSummaryProps) {
  return (
    <Card className="sticky top-4">
      <CardHeader>
        <CardTitle>Order Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="max-h-64 overflow-auto space-y-2">
          {cart.map((item) => (
            <div key={item.id} className="flex items-center space-x-4 py-2">
              <div className="h-12 w-12 rounded-md overflow-hidden">
                <img src={item.image || "/placeholder.svg"} alt={item.name} className="h-full w-full object-cover" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{item.name}</p>
                <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">Rs. {item.price * item.quantity}</p>
              </div>
            </div>
          ))}
        </div>

        <Separator />

        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-500">Subtotal</span>
            <span>Rs. {subtotal}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Delivery Fee</span>
            <span>Rs. {deliveryFee}</span>
          </div>
          <Separator />
          <div className="flex justify-between font-medium text-lg">
            <span>Total</span>
            <span>Rs. {total}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button className="w-full" disabled={isProcessing} onClick={onSubmit} type={onSubmit ? "button" : "submit"}>
          {isProcessing ? "Processing Payment..." : `Pay Rs. ${total}`}
        </Button>
      </CardFooter>
    </Card>
  )
}

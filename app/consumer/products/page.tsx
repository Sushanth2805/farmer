"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Filter,
  Heart,
  Home,
  Leaf,
  LogOut,
  MapPin,
  Search,
  Settings,
  ShoppingCart,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { useToast } from "@/components/ui/use-toast"
import { useStore, type CartItem, type FavoriteItem } from "@/lib/store"
import { useRouter } from "next/navigation"
import { auth } from "@/lib/firebase"
import { signOut, getAuth, onAuthStateChanged } from "firebase/auth"
import { ensureDynamicDataSeeded, getProducts, subscribeToDynamicData, type ProductRecord } from "@/lib/dynamic-data"

type DiscoverProduct = ProductRecord & {
  farmer: string
  distance: number
  rating: number
  freshness: string
}

function getFreshnessLabel(harvestDate: string) {
  const diffDays = Math.max(
    0,
    Math.floor((Date.now() - new Date(harvestDate).getTime()) / (1000 * 60 * 60 * 24)),
  )

  if (diffDays === 0) return "Today"
  if (diffDays === 1) return "1 day ago"
  return `${diffDays} days ago`
}

function buildDiscoverProducts(products: ProductRecord[]): DiscoverProduct[] {
  return products
    .filter((product) => product.quantity > 0)
    .map((product, index) => ({
      ...product,
      farmer: product.farmerName,
      distance: 4 + (index % 8) * 3,
      rating: 4 + ((index % 5) * 0.2),
      freshness: getFreshnessLabel(product.harvestDate),
    }))
}

export default function ConsumerProducts() {
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState("")
  const [locationQuery, setLocationQuery] = useState("")
  const [showLocationSearch, setShowLocationSearch] = useState(false)
  const [products, setProducts] = useState<DiscoverProduct[]>([])
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

  const [filters, setFilters] = useState({
    categories: [] as string[],
    maxDistance: 50,
    priceRange: [0, 200] as [number, number],
    minRating: 0,
  })
  const [sortBy, setSortBy] = useState("distance")

  const { cart, addToCart, favorites, addToFavorites, removeFromFavorites, isFavorite } = useStore()
  const cartCount = cart.reduce((total, item) => total + item.quantity, 0)

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
    const syncProducts = () => setProducts(buildDiscoverProducts(getProducts()))
    syncProducts()
    return subscribeToDynamicData(syncProducts)
  }, [])

  const categories = useMemo(
    () => Array.from(new Set(products.map((product) => product.category))).sort(),
    [products],
  )
  const locations = useMemo(
    () => Array.from(new Set(products.map((product) => product.location))).sort(),
    [products],
  )

  const filteredProducts = products
    .filter((product) => {
      const matchesSearch =
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.farmer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.location.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesLocation = !locationQuery || product.location.toLowerCase().includes(locationQuery.toLowerCase())
      const matchesCategory = filters.categories.length === 0 || filters.categories.includes(product.category)
      const matchesDistance = product.distance <= filters.maxDistance
      const matchesPrice = product.price >= filters.priceRange[0] && product.price <= filters.priceRange[1]
      const matchesRating = product.rating >= filters.minRating

      return matchesSearch && matchesLocation && matchesCategory && matchesDistance && matchesPrice && matchesRating
    })
    .sort((a, b) => {
      if (sortBy === "distance") return a.distance - b.distance
      if (sortBy === "price_low") return a.price - b.price
      if (sortBy === "price_high") return b.price - a.price
      if (sortBy === "rating") return b.rating - a.rating
      if (sortBy === "freshness") return new Date(b.harvestDate).getTime() - new Date(a.harvestDate).getTime()
      return 0
    })

  const toggleCategory = (category: string) => {
    setFilters((prev) => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter((item) => item !== category)
        : [...prev.categories, category],
    }))
  }

  const handleAddToCart = (product: DiscoverProduct) => {
    const cartItem: CartItem = {
      id: Number(product.id.replace(/\D/g, "").slice(-9) || Date.now()),
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
      unit: product.unit,
      farmer: product.farmer,
      farmerId: product.ownerId,
      farmerEmail: product.farmerEmail,
      image: product.image,
    }

    addToCart(cartItem)
    toast({
      title: "Added to cart",
      description: `${product.name} has been added to your cart.`,
    })
  }

  const handleToggleFavorite = (product: DiscoverProduct) => {
    const favoriteItem: FavoriteItem = {
      id: Number(product.id.replace(/\D/g, "").slice(-9) || Date.now()),
      name: product.name,
      farmer: product.farmer,
      location: product.location,
      price: product.price,
      unit: product.unit,
      image: product.image,
    }

    if (isFavorite(favoriteItem.id)) {
      removeFromFavorites(favoriteItem.id)
      toast({
        title: "Removed from favorites",
        description: `${product.name} has been removed from your favorites.`,
      })
    } else {
      addToFavorites(favoriteItem)
      toast({
        title: "Added to favorites",
        description: `${product.name} has been added to your favorites.`,
      })
    }
  }

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-64 flex-col bg-gray-50 border-r lg:flex">
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
                <Button variant="secondary" className="w-full justify-start">
                  <Search className="mr-2 h-4 w-4" />
                  Discover Products
                </Button>
              </Link>
              <Link href="/consumer/myorders">
                <Button variant="ghost" className="w-full justify-start">
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  My Orders
                </Button>
              </Link>
              <Link href="/consumer/favorites">
                <Button variant="ghost" className="w-full justify-start">
                  <Heart className="mr-2 h-4 w-4" />
                  Favorites
                  {favorites.length > 0 && (
                    <span className="ml-auto bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs">
                      {favorites.length}
                    </span>
                  )}
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
          <Button variant="outline" size="sm" className="mr-4 lg:hidden">
            <Leaf className="h-5 w-5 text-green-600" />
          </Button>
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              type="search"
              placeholder="Search products, farmers..."
              className="w-full bg-gray-100 pl-8 focus-visible:ring-green-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="ml-auto flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={() => setShowLocationSearch(!showLocationSearch)}>
              <MapPin className="h-4 w-4 mr-2" />
              {locationQuery || "All Locations"}
            </Button>
            <Button variant="outline" size="sm" onClick={() => router.push("/consumer/cart")}>
              <ShoppingCart className="h-4 w-4" />
              {cartCount > 0 && (
                <span className="ml-1 bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs">
                  {cartCount}
                </span>
              )}
            </Button>
          </div>
        </div>

        {showLocationSearch && (
          <div className="p-4 border-b">
            <div className="flex flex-col space-y-2">
              <Label htmlFor="location-search">Search by location</Label>
              <div className="flex gap-2">
                <Input
                  id="location-search"
                  placeholder="Enter city or state..."
                  value={locationQuery}
                  onChange={(e) => setLocationQuery(e.target.value)}
                  className="flex-1"
                />
                <Button variant="outline" onClick={() => setLocationQuery("")}>
                  Clear
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {locations.map((location) => (
                  <Badge
                    key={location}
                    variant="outline"
                    className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                    onClick={() => setLocationQuery(location)}
                  >
                    {location}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="p-4 md:p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold">Discover Products</h1>
              <p className="text-gray-500">Find fresh produce directly from farmers near you</p>
            </div>
            <div className="mt-4 md:mt-0 flex gap-2">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="distance">Nearest First</SelectItem>
                  <SelectItem value="price_low">Price: Low to High</SelectItem>
                  <SelectItem value="price_high">Price: High to Low</SelectItem>
                  <SelectItem value="rating">Highest Rated</SelectItem>
                  <SelectItem value="freshness">Freshness</SelectItem>
                </SelectContent>
              </Select>

              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" className="lg:hidden">
                    <Filter className="h-4 w-4 mr-2" />
                    Filters
                  </Button>
                </SheetTrigger>
                <SheetContent side="left">
                  <SheetHeader>
                    <SheetTitle>Filters</SheetTitle>
                    <SheetDescription>Refine your product search</SheetDescription>
                  </SheetHeader>
                  <div className="py-4 space-y-6">
                    <div className="space-y-4">
                      <h3 className="text-sm font-medium">Categories</h3>
                      <div className="space-y-2">
                        {categories.map((category) => (
                          <div key={category} className="flex items-center">
                            <Checkbox
                              id={`category-${category}`}
                              checked={filters.categories.includes(category)}
                              onCheckedChange={() => toggleCategory(category)}
                            />
                            <Label htmlFor={`category-${category}`} className="ml-2 text-sm font-normal">
                              {category}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-sm font-medium">Maximum Distance</h3>
                        <span className="text-sm">{filters.maxDistance} km</span>
                      </div>
                      <Slider value={[filters.maxDistance]} min={1} max={50} step={1} onValueChange={(value) => setFilters((prev) => ({ ...prev, maxDistance: value[0] }))} />
                    </div>

                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-sm font-medium">Price Range</h3>
                        <span className="text-sm">₹{filters.priceRange[0]} - ₹{filters.priceRange[1]}</span>
                      </div>
                      <Slider value={filters.priceRange} min={0} max={200} step={5} onValueChange={(value: [number, number]) => setFilters((prev) => ({ ...prev, priceRange: value }))} />
                    </div>

                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-sm font-medium">Minimum Rating</h3>
                        <span className="text-sm">{filters.minRating} ★</span>
                      </div>
                      <Slider value={[filters.minRating]} min={0} max={5} step={0.5} onValueChange={(value) => setFilters((prev) => ({ ...prev, minRating: value[0] }))} />
                    </div>

                    <Button
                      className="w-full"
                      onClick={() =>
                        setFilters({
                          categories: [],
                          maxDistance: 50,
                          priceRange: [0, 200],
                          minRating: 0,
                        })
                      }
                    >
                      Reset Filters
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {filteredProducts.map((product) => {
              const numericId = Number(product.id.replace(/\D/g, "").slice(-9) || Date.now())
              return (
                <Card key={product.id} className="overflow-hidden">
                  <CardContent className="flex flex-col items-center p-4">
                    <div className="relative w-full">
                      <img src={product.image || "/placeholder.svg"} alt={product.name} className="w-full h-40 object-cover mb-4" />
                      <Button
                        variant="ghost"
                        size="icon"
                        className={`absolute top-2 right-2 bg-white rounded-full h-8 w-8 shadow-sm hover:bg-white ${isFavorite(numericId) ? "text-red-500" : ""}`}
                        onClick={() => handleToggleFavorite(product)}
                      >
                        <Heart className={`h-4 w-4 ${isFavorite(numericId) ? "fill-current" : ""}`} />
                      </Button>
                    </div>
                    <h2 className="text-lg font-bold mb-2">{product.name}</h2>
                    <p className="text-sm text-gray-500 mb-2">Farmer: {product.farmer}</p>
                    <p className="text-sm text-gray-500 mb-2">Location: {product.location}</p>
                    <div className="flex items-center mb-2">
                      <Badge variant="outline" className="mr-2">{product.distance} km</Badge>
                      <Badge variant="outline" className="mr-2">₹{product.price}/{product.unit}</Badge>
                      <Badge variant="outline">{product.rating.toFixed(1)} ★</Badge>
                    </div>
                    <p className="text-sm text-gray-500 mb-4">Freshness: {product.freshness}</p>
                    <Button variant="default" className="w-full" onClick={() => handleAddToCart(product)}>
                      Add to Cart
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {filteredProducts.length === 0 && (
            <div className="flex flex-col items-center justify-center h-64">
              <Search className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium">No products found</h3>
              <p className="text-gray-500">Try adjusting your search or filters</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ArrowRight, Leaf, ShoppingBag, Building, Menu } from "lucide-react";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 md:px-8 lg:px-12">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-1 rounded-lg bg-green-50">
              <Leaf className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
            </div>
            <span className="text-lg sm:text-xl font-bold text-gray-900">
              KisanDirect
            </span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex gap-6 lg:gap-8">
            <Link
              href="#features"
              className="text-sm font-medium text-gray-700 hover:text-green-600 hover:underline underline-offset-4 transition-colors duration-200"
            >
              Features
            </Link>
            <Link
              href="#about"
              className="text-sm font-medium text-gray-700 hover:text-green-600 hover:underline underline-offset-4 transition-colors duration-200"
            >
              About
            </Link>
            <Link
              href="#contact"
              className="text-sm font-medium text-gray-700 hover:text-green-600 hover:underline underline-offset-4 transition-colors duration-200"
            >
              Contact
            </Link>
          </nav>

          {/* Desktop Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <Link href="/auth/login">
              <Button
                variant="outline"
                className="h-9 px-4 text-sm font-medium"
              >
                Login
              </Button>
            </Link>
            <Link href="/auth/signup">
              <Button className="h-9 px-4 text-sm font-medium bg-green-600 hover:bg-green-700">
                Register
              </Button>
            </Link>
          </div>

          {/* Mobile Menu */}
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <div className="flex flex-col space-y-6 mt-6">
                  <div className="flex items-center gap-2">
                    <div className="p-1 rounded-lg bg-green-50">
                      <Leaf className="h-6 w-6 text-green-600" />
                    </div>
                    <span className="text-xl font-bold text-gray-900">
                      KisanDirect
                    </span>
                  </div>
                  <nav className="flex flex-col space-y-4">
                    <Link
                      href="#features"
                      className="text-base font-medium text-gray-700 hover:text-green-600 transition-colors duration-200"
                    >
                      Features
                    </Link>
                    <Link
                      href="#about"
                      className="text-base font-medium text-gray-700 hover:text-green-600 transition-colors duration-200"
                    >
                      About
                    </Link>
                    <Link
                      href="#contact"
                      className="text-base font-medium text-gray-700 hover:text-green-600 transition-colors duration-200"
                    >
                      Contact
                    </Link>
                  </nav>
                  <div className="flex flex-col space-y-3 pt-4 border-t">
                    <Link href="/auth/login">
                      <Button
                        variant="outline"
                        className="w-full h-10 text-sm font-medium"
                      >
                        Login
                      </Button>
                    </Link>
                    <Link href="/auth/signup">
                      <Button className="w-full h-10 text-sm font-medium bg-green-600 hover:bg-green-700">
                        Register
                      </Button>
                    </Link>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>
      <main className="flex-1">
        <section className="relative w-full py-12 sm:py-16 md:py-24 lg:py-32 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute top-10 left-10 w-20 h-20 bg-green-600 rounded-full"></div>
            <div className="absolute top-32 right-20 w-16 h-16 bg-emerald-500 rounded-full"></div>
            <div className="absolute bottom-20 left-1/4 w-12 h-12 bg-teal-400 rounded-full"></div>
            <div className="absolute bottom-32 right-1/3 w-8 h-8 bg-green-400 rounded-full"></div>
          </div>

          <div className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-12 relative z-10">
            <div className="grid gap-6 sm:gap-8 lg:grid-cols-2 lg:gap-16 items-center">
              <div className="space-y-4 sm:space-y-6 text-center lg:text-left">
                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold tracking-tighter leading-tight text-gray-900">
                  <span className="text-green-600">Connecting</span> Farmers
                  Directly to{" "}
                  <span className="text-emerald-600">Consumers</span> &{" "}
                  <span className="text-teal-600">Government</span>
                </h1>

                <p className="max-w-[600px] mx-auto lg:mx-0 text-sm sm:text-base md:text-lg lg:text-xl text-gray-700 leading-relaxed">
                  Empowering farmers with direct market access while ensuring
                  transparency in government procurement. Build sustainable
                  relationships and grow your business.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-2 sm:pt-4 max-w-md mx-auto lg:mx-0">
                  <Link href="/auth/register?role=farmer" className="flex-1">
                    <Button className="w-full h-10 sm:h-12 text-sm sm:text-base bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl transition-all duration-300">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                        I'm a Farmer
                        <ArrowRight className="ml-1 h-4 w-4" />
                      </div>
                    </Button>
                  </Link>
                  <Link href="/auth/register?role=consumer" className="flex-1">
                    <Button className="w-full h-10 sm:h-12 text-sm sm:text-base bg-white hover:bg-gray-50 text-gray-900 border-2 border-green-200 hover:border-green-300 shadow-lg hover:shadow-xl transition-all duration-300">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                        I'm a Consumer
                        <ArrowRight className="ml-1 h-4 w-4" />
                      </div>
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="flex justify-center lg:justify-end mt-8 lg:mt-0">
                <div className="relative w-full max-w-md lg:max-w-none">
                  {/* Image Container with Decorative Elements */}
                  <div className="relative">
                    <div className="absolute -top-4 -right-4 w-8 h-8 bg-green-400 rounded-full opacity-60"></div>
                    <div className="absolute -bottom-4 -left-4 w-6 h-6 bg-emerald-400 rounded-full opacity-60"></div>
                    <div className="absolute top-1/2 -left-6 w-4 h-4 bg-teal-400 rounded-full opacity-60"></div>

                    <img
                      src="/farmers.jpg?height=400&width=600"
                      alt="Farmer working in paddy field - KisanDirect Platform"
                      className="rounded-2xl object-cover shadow-2xl w-full h-auto border-4 border-white"
                      width={600}
                      height={400}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          id="features"
          className="w-full py-12 sm:py-16 md:py-24 lg:py-32"
        >
          <div className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-12">
            <div className="flex flex-col items-center justify-center space-y-4 sm:space-y-6 text-center mb-12 sm:mb-16">
              <div className="space-y-3 sm:space-y-4">
                <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tighter">
                  Platform Features
                </h2>
                <p className="max-w-[900px] text-sm sm:text-base md:text-lg lg:text-xl text-gray-600 leading-relaxed px-4">
                  Our platform serves three distinct user groups with
                  specialized features
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-6xl grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
              <Card className="hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-4 sm:p-6 lg:p-8 flex flex-col items-center space-y-4 sm:space-y-6">
                  <div className="p-3 sm:p-4 rounded-full bg-green-50">
                    <Leaf className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 text-green-600" />
                  </div>
                  <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-center">
                    For Farmers
                  </h3>
                  <p className="text-sm sm:text-base text-gray-600 text-center leading-relaxed">
                    List products, manage orders, access government procurement
                    opportunities, and track sales analytics.
                  </p>
                </CardContent>
              </Card>
              <Card className="hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-4 sm:p-6 lg:p-8 flex flex-col items-center space-y-4 sm:space-y-6">
                  <div className="p-3 sm:p-4 rounded-full bg-blue-50">
                    <ShoppingBag className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 text-blue-600" />
                  </div>
                  <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-center">
                    For Consumers
                  </h3>
                  <p className="text-sm sm:text-base text-gray-600 text-center leading-relaxed">
                    Discover local produce, place orders directly with farmers,
                    track deliveries, and build relationships with producers.
                  </p>
                </CardContent>
              </Card>
              <Card className="hover:shadow-lg transition-shadow duration-300 sm:col-span-2 lg:col-span-1">
                <CardContent className="p-4 sm:p-6 lg:p-8 flex flex-col items-center space-y-4 sm:space-y-6">
                  <div className="p-3 sm:p-4 rounded-full bg-purple-50">
                    <Building className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 text-purple-600" />
                  </div>
                  <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-center">
                    For Government
                  </h3>
                  <p className="text-sm sm:text-base text-gray-600 text-center leading-relaxed">
                    Publish procurement tenders, manage bids, track supply
                    chain, and maintain transparent records.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section className="w-full py-12 sm:py-16 md:py-24 lg:py-32 bg-gray-50">
          <div className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-12">
            <Tabs defaultValue="farmer" className="w-full max-w-6xl mx-auto">
              <div className="flex flex-col items-center justify-center space-y-6 sm:space-y-8 text-center mb-8 sm:mb-12">
                <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tighter">
                  How It Works
                </h2>
                <TabsList className="grid w-full max-w-xs sm:max-w-md grid-cols-3 h-10 sm:h-12">
                  <TabsTrigger
                    value="farmer"
                    className="text-xs sm:text-sm md:text-base px-2 sm:px-4"
                  >
                    <span className="hidden sm:inline">For Farmers</span>
                    <span className="sm:hidden">Farmers</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="consumer"
                    className="text-xs sm:text-sm md:text-base px-2 sm:px-4"
                  >
                    <span className="hidden sm:inline">For Consumers</span>
                    <span className="sm:hidden">Consumers</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="government"
                    className="text-xs sm:text-sm md:text-base px-2 sm:px-4"
                  >
                    <span className="hidden sm:inline">For Government</span>
                    <span className="sm:hidden">Government</span>
                  </TabsTrigger>
                </TabsList>
              </div>
              <TabsContent value="farmer" className="space-y-6 sm:space-y-8">
                <div className="grid gap-6 sm:gap-8 md:grid-cols-2 md:gap-16 items-center">
                  <div className="order-2 md:order-1">
                    <img
                      src="/indian-farmer.jpg?height=300&width=400"
                      alt="Farmer Dashboard"
                      className="rounded-xl object-cover shadow-lg w-full h-auto"
                      width={400}
                      height={300}
                    />
                  </div>
                  <div className="space-y-4 sm:space-y-6 order-1 md:order-2">
                    <h3 className="text-xl sm:text-2xl md:text-3xl font-bold">
                      Farmer Dashboard
                    </h3>
                    <ul className="space-y-3 sm:space-y-4">
                      <li className="flex items-start gap-3 sm:gap-4">
                        <div className="rounded-full bg-green-500 p-1.5 sm:p-2 text-white flex-shrink-0 mt-0.5 sm:mt-1">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="h-3 w-3 sm:h-4 sm:w-4"
                          >
                            <polyline points="20 6 9 17 4 12"></polyline>
                          </svg>
                        </div>
                        <div className="text-sm sm:text-base text-gray-700 leading-relaxed">
                          Authenticate with phone number or Aadhar
                        </div>
                      </li>
                      <li className="flex items-start gap-3 sm:gap-4">
                        <div className="rounded-full bg-green-500 p-1.5 sm:p-2 text-white flex-shrink-0 mt-0.5 sm:mt-1">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="h-3 w-3 sm:h-4 sm:w-4"
                          >
                            <polyline points="20 6 9 17 4 12"></polyline>
                          </svg>
                        </div>
                        <div className="text-sm sm:text-base text-gray-700 leading-relaxed">
                          List products with details and pricing
                        </div>
                      </li>
                      <li className="flex items-start gap-3 sm:gap-4">
                        <div className="rounded-full bg-green-500 p-1.5 sm:p-2 text-white flex-shrink-0 mt-0.5 sm:mt-1">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="h-3 w-3 sm:h-4 sm:w-4"
                          >
                            <polyline points="20 6 9 17 4 12"></polyline>
                          </svg>
                        </div>
                        <div className="text-sm sm:text-base text-gray-700 leading-relaxed">
                          Manage orders and update status
                        </div>
                      </li>
                      <li className="flex items-start gap-3 sm:gap-4">
                        <div className="rounded-full bg-green-500 p-1.5 sm:p-2 text-white flex-shrink-0 mt-0.5 sm:mt-1">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="h-3 w-3 sm:h-4 sm:w-4"
                          >
                            <polyline points="20 6 9 17 4 12"></polyline>
                          </svg>
                        </div>
                        <div className="text-sm sm:text-base text-gray-700 leading-relaxed">
                          Access government procurement opportunities
                        </div>
                      </li>
                    </ul>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="consumer" className="space-y-6 sm:space-y-8">
                <div className="grid gap-6 sm:gap-8 md:grid-cols-2 md:gap-16 items-center">
                  <div className="order-2 md:order-1">
                    <img
                      src="/customer.jpg?height=300&width=400"
                      alt="Consumer Dashboard"
                      className="rounded-xl object-cover shadow-lg w-full h-auto"
                      width={400}
                      height={300}
                    />
                  </div>
                  <div className="space-y-4 sm:space-y-6 order-1 md:order-2">
                    <h3 className="text-xl sm:text-2xl md:text-3xl font-bold">
                      Consumer Experience
                    </h3>
                    <ul className="space-y-3 sm:space-y-4">
                      <li className="flex items-start gap-3 sm:gap-4">
                        <div className="rounded-full bg-blue-500 p-1.5 sm:p-2 text-white flex-shrink-0 mt-0.5 sm:mt-1">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="h-3 w-3 sm:h-4 sm:w-4"
                          >
                            <polyline points="20 6 9 17 4 12"></polyline>
                          </svg>
                        </div>
                        <div className="text-sm sm:text-base text-gray-700 leading-relaxed">
                          Discover nearby farms and products
                        </div>
                      </li>
                      <li className="flex items-start gap-3 sm:gap-4">
                        <div className="rounded-full bg-blue-500 p-1.5 sm:p-2 text-white flex-shrink-0 mt-0.5 sm:mt-1">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="h-3 w-3 sm:h-4 sm:w-4"
                          >
                            <polyline points="20 6 9 17 4 12"></polyline>
                          </svg>
                        </div>
                        <div className="text-sm sm:text-base text-gray-700 leading-relaxed">
                          Filter products by category, freshness, and price
                        </div>
                      </li>
                      <li className="flex items-start gap-3 sm:gap-4">
                        <div className="rounded-full bg-blue-500 p-1.5 sm:p-2 text-white flex-shrink-0 mt-0.5 sm:mt-1">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="h-3 w-3 sm:h-4 sm:w-4"
                          >
                            <polyline points="20 6 9 17 4 12"></polyline>
                          </svg>
                        </div>
                        <div className="text-sm sm:text-base text-gray-700 leading-relaxed">
                          Place orders directly with farmers
                        </div>
                      </li>
                      <li className="flex items-start gap-3 sm:gap-4">
                        <div className="rounded-full bg-blue-500 p-1.5 sm:p-2 text-white flex-shrink-0 mt-0.5 sm:mt-1">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="h-3 w-3 sm:h-4 sm:w-4"
                          >
                            <polyline points="20 6 9 17 4 12"></polyline>
                          </svg>
                        </div>
                        <div className="text-sm sm:text-base text-gray-700 leading-relaxed">
                          Track orders and message farmers
                        </div>
                      </li>
                    </ul>
                  </div>
                </div>
              </TabsContent>
              <TabsContent
                value="government"
                className="space-y-6 sm:space-y-8"
              >
                <div className="grid gap-6 sm:gap-8 md:grid-cols-2 md:gap-16 items-center">
                  <div className="order-2 md:order-1">
                    <img
                      src="/admin.jpg?height=300&width=400"
                      alt="Government Dashboard"
                      className="rounded-xl object-cover shadow-lg w-full h-auto"
                      width={400}
                      height={300}
                    />
                  </div>
                  <div className="space-y-4 sm:space-y-6 order-1 md:order-2">
                    <h3 className="text-xl sm:text-2xl md:text-3xl font-bold">
                      Government Administration
                    </h3>
                    <ul className="space-y-3 sm:space-y-4">
                      <li className="flex items-start gap-3 sm:gap-4">
                        <div className="rounded-full bg-purple-500 p-1.5 sm:p-2 text-white flex-shrink-0 mt-0.5 sm:mt-1">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="h-3 w-3 sm:h-4 sm:w-4"
                          >
                            <polyline points="20 6 9 17 4 12"></polyline>
                          </svg>
                        </div>
                        <div className="text-sm sm:text-base text-gray-700 leading-relaxed">
                          Publish procurement tenders
                        </div>
                      </li>
                      <li className="flex items-start gap-3 sm:gap-4">
                        <div className="rounded-full bg-purple-500 p-1.5 sm:p-2 text-white flex-shrink-0 mt-0.5 sm:mt-1">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="h-3 w-3 sm:h-4 sm:w-4"
                          >
                            <polyline points="20 6 9 17 4 12"></polyline>
                          </svg>
                        </div>
                        <div className="text-sm sm:text-base text-gray-700 leading-relaxed">
                          Manage and verify farmer bids
                        </div>
                      </li>
                      <li className="flex items-start gap-3 sm:gap-4">
                        <div className="rounded-full bg-purple-500 p-1.5 sm:p-2 text-white flex-shrink-0 mt-0.5 sm:mt-1">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="h-3 w-3 sm:h-4 sm:w-4"
                          >
                            <polyline points="20 6 9 17 4 12"></polyline>
                          </svg>
                        </div>
                        <div className="text-sm sm:text-base text-gray-700 leading-relaxed">
                          Track supply chain from purchase to distribution
                        </div>
                      </li>
                      <li className="flex items-start gap-3 sm:gap-4">
                        <div className="rounded-full bg-purple-500 p-1.5 sm:p-2 text-white flex-shrink-0 mt-0.5 sm:mt-1">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="h-3 w-3 sm:h-4 sm:w-4"
                          >
                            <polyline points="20 6 9 17 4 12"></polyline>
                          </svg>
                        </div>
                        <div className="text-sm sm:text-base text-gray-700 leading-relaxed">
                          Maintain transparent public ledger
                        </div>
                      </li>
                    </ul>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </section>
      </main>
      <footer className="w-full border-t bg-white">
        <div className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-12 py-6 sm:py-8 md:py-12">
          <div className="flex flex-col items-center justify-between gap-4 sm:gap-6 md:flex-row">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded-lg bg-green-50">
                <Leaf className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
              </div>
              <span className="text-lg sm:text-xl font-bold text-gray-900">
                KisanDirect
              </span>
            </div>
            <p className="text-center text-xs sm:text-sm text-gray-600 md:text-left">
              © 2025 KisanDirect. All rights reserved.
            </p>
            <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
              <Link
                href="#"
                className="text-xs sm:text-sm font-medium text-gray-600 hover:text-gray-900 hover:underline underline-offset-4 transition-colors"
              >
                Terms
              </Link>
              <Link
                href="#"
                className="text-xs sm:text-sm font-medium text-gray-600 hover:text-gray-900 hover:underline underline-offset-4 transition-colors"
              >
                Privacy
              </Link>
              <Link
                href="#"
                className="text-xs sm:text-sm font-medium text-gray-600 hover:text-gray-900 hover:underline underline-offset-4 transition-colors"
              >
                Contact
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

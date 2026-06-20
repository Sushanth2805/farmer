"use client"

import { collection, deleteDoc, doc, getDocs, setDoc } from "firebase/firestore"
import { db, hasRealFirebaseConfig } from "@/lib/firebase"

export type ProductRecord = {
  id: string
  ownerId: string
  name: string
  description: string
  price: number
  unit: string
  quantity: number
  harvestDate: string
  location: string
  farmerName: string
  farmerEmail: string
  status: "Available" | "Low Stock" | "Out of Stock"
  image: string
  category: string
  createdAt: string
  updatedAt: string
}

export type OrderStatus = "pending" | "processing" | "shipped" | "delivered" | "cancelled"

export type OrderItemRecord = {
  id: string
  productId: string
  name: string
  price: number
  image: string
  farmer: string
  farmerEmail: string
  farmerId: string
  unit: string
  quantity: number
}

export type OrderRecord = {
  id: string
  consumerId: string
  consumerName: string
  consumerEmail: string
  consumerPhone: string
  date: string
  status: OrderStatus
  items: OrderItemRecord[]
  subtotal: number
  deliveryFee: number
  total: number
  paymentMethod: string
  deliveryAddress: {
    address: string
    city: string
    state: string
    postalCode: string
    country: string
  }
  trackingNumber?: string
  estimatedDelivery?: string
}

export type TenderBidRecord = {
  id: string
  farmerId: string
  farmerName: string
  farmerEmail: string
  quantity: string
  price: string
  amount: number
  notes: string
  status: "Pending" | "Accepted" | "Rejected"
  createdAt: string
}

export type TenderRecord = {
  id: string
  title: string
  description: string
  product: string
  quantity: string
  totalAmount: number
  budget: string
  deadline: string
  status: "Open" | "Closing Soon" | "Closed"
  region: string
  minPrice: number
  maxPrice: number
  requirements: string
  bids: TenderBidRecord[]
  createdAt: string
  updatedAt: string
}

export type ShipmentRecord = {
  id: string
  product: string
  quantity: string
  source: string
  sourceLocation: string
  destination: string
  destinationLocation: string
  status: "Processing" | "In Transit" | "Delivered"
  date: string
  estimatedArrival: string
  transactionId: string
}

export type RationShopInventoryItem = {
  product: string
  quantity: string
  allocated: string
  percentage: number
}

export type RationShopRecord = {
  id: string
  name: string
  location: string
  manager: string
  contact: string
  status: "Active" | "Low Stock" | "Inactive"
  inventory: RationShopInventoryItem[]
  beneficiaries: number
  lastDelivery: string
  nextDelivery: string
}

export type LedgerTransactionRecord = {
  id: string
  hash: string
  timestamp: string
  commodity: string
  quantity: string
  broughtFrom: string
  sourceLocation: string
  storedAt: string
  storageLocation: string
  soldTo: string
  destinationLocation: string
  price: string
  totalValue: string
  status: "Processing" | "In Transit" | "Completed"
  previousHash: string
  blockNumber: number
  verified: boolean
}

const STORAGE_KEYS = {
  initialized: "kisan-direct-seeded-v1",
  products: "kisan-direct-products-v1",
  orders: "kisan-direct-orders-v1",
  tenders: "kisan-direct-tenders-v1",
  shipments: "kisan-direct-shipments-v1",
  rationShops: "kisan-direct-ration-shops-v1",
  ledgerTransactions: "kisan-direct-ledger-transactions-v1",
} as const

const CHANGE_EVENT = "kisan-direct-data-change"
const firestoreHydrationState: Partial<Record<keyof typeof STORAGE_KEYS, boolean>> = {}

const seededProducts: ProductRecord[] = [
  {
    id: "prod-seed-1",
    ownerId: "seed-farmer-rajesh",
    name: "Fresh Tomatoes",
    description: "Organically grown tomatoes, freshly harvested",
    price: 40,
    unit: "kg",
    quantity: 100,
    harvestDate: "2026-06-10",
    location: "Punjab",
    farmerName: "Rajesh Kumar",
    farmerEmail: "rajesh@example.com",
    status: "Available",
    image: "/tomato.png?height=200&width=200",
    category: "Vegetables",
    createdAt: "2026-06-10T08:00:00.000Z",
    updatedAt: "2026-06-10T08:00:00.000Z",
  },
  {
    id: "prod-seed-2",
    ownerId: "seed-farmer-suresh",
    name: "Organic Potatoes",
    description: "Fresh potatoes sorted for household and bulk orders",
    price: 30,
    unit: "kg",
    quantity: 80,
    harvestDate: "2026-06-08",
    location: "Haryana",
    farmerName: "Suresh Singh",
    farmerEmail: "suresh@example.com",
    status: "Available",
    image: "/potato.png?height=200&width=200",
    category: "Vegetables",
    createdAt: "2026-06-08T08:00:00.000Z",
    updatedAt: "2026-06-08T08:00:00.000Z",
  },
  {
    id: "prod-seed-3",
    ownerId: "seed-farmer-ramesh",
    name: "Organic Rice",
    description: "Premium rice ready for direct consumer delivery",
    price: 60,
    unit: "kg",
    quantity: 40,
    harvestDate: "2026-06-01",
    location: "Uttar Pradesh",
    farmerName: "Ramesh Yadav",
    farmerEmail: "ramesh@example.com",
    status: "Low Stock",
    image: "/rice.png?height=200&width=200",
    category: "Grains",
    createdAt: "2026-06-01T08:00:00.000Z",
    updatedAt: "2026-06-01T08:00:00.000Z",
  },
]

const seededTenders: TenderRecord[] = [
  {
    id: "TEN-001",
    title: "Wheat Procurement - Delhi Region",
    description: "Procurement of high-quality wheat for Delhi region ration shops",
    product: "Wheat",
    quantity: "500 tons",
    totalAmount: 500,
    budget: "₹1.5 Cr",
    deadline: "2026-07-15",
    status: "Open",
    region: "Delhi",
    minPrice: 30000,
    maxPrice: 34000,
    requirements: "Grade A wheat with moisture below 12%",
    bids: [],
    createdAt: "2026-06-10T08:00:00.000Z",
    updatedAt: "2026-06-10T08:00:00.000Z",
  },
  {
    id: "TEN-002",
    title: "Rice Procurement - Punjab",
    description: "Procurement of basmati and non-basmati rice varieties for distribution",
    product: "Rice",
    quantity: "1000 tons",
    totalAmount: 1000,
    budget: "₹3.2 Cr",
    deadline: "2026-07-20",
    status: "Open",
    region: "Punjab",
    minPrice: 32000,
    maxPrice: 35000,
    requirements: "Packed in sealed bags and ready for district dispatch",
    bids: [],
    createdAt: "2026-06-09T08:00:00.000Z",
    updatedAt: "2026-06-09T08:00:00.000Z",
  },
  {
    id: "TEN-003",
    title: "Vegetable Supply - Maharashtra",
    description: "Fresh vegetable supply for Mumbai and Pune ration shops",
    product: "Vegetables (Mixed)",
    quantity: "200 tons",
    totalAmount: 200,
    budget: "₹0.8 Cr",
    deadline: "2026-06-28",
    status: "Closing Soon",
    region: "Maharashtra",
    minPrice: 38000,
    maxPrice: 44000,
    requirements: "Mixed vegetables graded and sorted by type",
    bids: [],
    createdAt: "2026-06-05T08:00:00.000Z",
    updatedAt: "2026-06-05T08:00:00.000Z",
  },
]

const seededShipments: ShipmentRecord[] = [
  {
    id: "SCE-001",
    product: "Wheat",
    quantity: "500 tons",
    source: "Punjab Farms",
    sourceLocation: "Punjab",
    destination: "Delhi Ration Center",
    destinationLocation: "Delhi",
    status: "In Transit",
    date: "2026-06-15",
    estimatedArrival: "2026-06-22",
    transactionId: "0x8f7e6d5c4b3a2918",
  },
  {
    id: "SCE-002",
    product: "Rice",
    quantity: "1000 tons",
    source: "Haryana Farms",
    sourceLocation: "Haryana",
    destination: "UP Ration Center",
    destinationLocation: "Uttar Pradesh",
    status: "Delivered",
    date: "2026-06-12",
    estimatedArrival: "2026-06-15",
    transactionId: "0x7e6d5c4b3a291807",
  },
  {
    id: "SCE-003",
    product: "Vegetables",
    quantity: "200 tons",
    source: "Maharashtra Farms",
    sourceLocation: "Maharashtra",
    destination: "Mumbai Ration Center",
    destinationLocation: "Maharashtra",
    status: "Processing",
    date: "2026-06-16",
    estimatedArrival: "2026-06-20",
    transactionId: "0x6d5c4b3a29180796",
  },
]

const seededRationShops: RationShopRecord[] = [
  {
    id: "RS-001",
    name: "Delhi Central Ration Shop",
    location: "Central Delhi",
    manager: "Rajiv Kumar",
    contact: "+91 98765 43210",
    status: "Active",
    inventory: [
      { product: "Rice", quantity: "2000 kg", allocated: "5000 kg", percentage: 40 },
      { product: "Wheat", quantity: "1500 kg", allocated: "3000 kg", percentage: 50 },
      { product: "Sugar", quantity: "500 kg", allocated: "1000 kg", percentage: 50 },
      { product: "Oil", quantity: "300 L", allocated: "800 L", percentage: 37.5 },
    ],
    beneficiaries: 1250,
    lastDelivery: "2026-06-10",
    nextDelivery: "2026-06-25",
  },
  {
    id: "RS-002",
    name: "East Delhi Ration Center",
    location: "East Delhi",
    manager: "Priya Singh",
    contact: "+91 87654 32109",
    status: "Active",
    inventory: [
      { product: "Rice", quantity: "1800 kg", allocated: "4000 kg", percentage: 45 },
      { product: "Wheat", quantity: "1200 kg", allocated: "2500 kg", percentage: 48 },
      { product: "Sugar", quantity: "400 kg", allocated: "800 kg", percentage: 50 },
      { product: "Oil", quantity: "250 L", allocated: "600 L", percentage: 41.7 },
    ],
    beneficiaries: 980,
    lastDelivery: "2026-06-12",
    nextDelivery: "2026-06-27",
  },
  {
    id: "RS-003",
    name: "South Delhi Distribution Center",
    location: "South Delhi",
    manager: "Amit Sharma",
    contact: "+91 76543 21098",
    status: "Low Stock",
    inventory: [
      { product: "Rice", quantity: "800 kg", allocated: "4500 kg", percentage: 17.8 },
      { product: "Wheat", quantity: "500 kg", allocated: "3000 kg", percentage: 16.7 },
      { product: "Sugar", quantity: "200 kg", allocated: "900 kg", percentage: 22.2 },
      { product: "Oil", quantity: "100 L", allocated: "700 L", percentage: 14.3 },
    ],
    beneficiaries: 1450,
    lastDelivery: "2026-06-05",
    nextDelivery: "2026-06-20",
  },
]

const seededLedgerTransactions: LedgerTransactionRecord[] = [
  {
    id: "TX-001",
    hash: "0x8f7e6d5c4b3a2918",
    timestamp: "2026-06-15T10:30:00.000Z",
    commodity: "Wheat",
    quantity: "500 tons",
    broughtFrom: "Punjab Farms",
    sourceLocation: "Punjab",
    storedAt: "Delhi Central Warehouse",
    storageLocation: "Delhi",
    soldTo: "Delhi Ration Centers",
    destinationLocation: "Central Delhi",
    price: "₹30,000/ton",
    totalValue: "₹15,000,000",
    status: "In Transit",
    previousHash: "0x0000000000000000000000000000000000000000",
    blockNumber: 1045682,
    verified: true,
  },
  {
    id: "TX-002",
    hash: "0x7e6d5c4b3a291807",
    timestamp: "2026-06-12T09:15:00.000Z",
    commodity: "Rice",
    quantity: "1000 tons",
    broughtFrom: "Haryana Farms",
    sourceLocation: "Haryana",
    storedAt: "UP Regional Storage",
    storageLocation: "Uttar Pradesh",
    soldTo: "UP Ration Centers",
    destinationLocation: "Lucknow",
    price: "₹32,000/ton",
    totalValue: "₹32,000,000",
    status: "Completed",
    previousHash: "0x8f7e6d5c4b3a2918",
    blockNumber: 1045683,
    verified: true,
  },
]

function isBrowser() {
  return typeof window !== "undefined"
}

function readJson<T>(key: string, fallback: T): T {
  if (!isBrowser()) {
    return fallback
  }

  try {
    const rawValue = window.localStorage.getItem(key)
    return rawValue ? (JSON.parse(rawValue) as T) : fallback
  } catch {
    return fallback
  }
}

function writeJson<T>(key: string, value: T) {
  if (!isBrowser()) {
    return
  }

  window.localStorage.setItem(key, JSON.stringify(value))
}

function emitChange() {
  if (!isBrowser()) {
    return
  }

  window.dispatchEvent(new CustomEvent(CHANGE_EVENT))
}

async function hydrateCollectionFromFirestore<T extends { id: string }>(storageKey: keyof typeof STORAGE_KEYS, collectionName: string) {
  if (!isBrowser() || !hasRealFirebaseConfig || firestoreHydrationState[storageKey]) {
    return
  }

  firestoreHydrationState[storageKey] = true

  try {
    const snapshot = await getDocs(collection(db, collectionName))
    if (snapshot.empty) {
      return
    }

    const records = snapshot.docs.map((entry) => {
      const data = entry.data() as T
      return { ...data, id: data.id || entry.id }
    })

    writeJson(STORAGE_KEYS[storageKey], records)
    emitChange()
  } catch {
    firestoreHydrationState[storageKey] = false
  }
}

async function persistRecordToFirestore<T extends { id: string }>(collectionName: string, record: T) {
  if (!isBrowser() || !hasRealFirebaseConfig) {
    return
  }

  try {
    await setDoc(doc(db, collectionName, record.id), record)
  } catch {
    // Keep local-first behavior even when Firestore is temporarily unavailable.
  }
}

async function deleteRecordFromFirestore(collectionName: string, recordId: string) {
  if (!isBrowser() || !hasRealFirebaseConfig) {
    return
  }

  try {
    await deleteDoc(doc(db, collectionName, recordId))
  } catch {
    // Keep local-first behavior even when Firestore is temporarily unavailable.
  }
}

function requestFirestoreHydration(storageKey: keyof typeof STORAGE_KEYS, collectionName: string) {
  void hydrateCollectionFromFirestore(storageKey, collectionName)
}

function computeTenderStatus(deadline: string): TenderRecord["status"] {
  const deadlineDate = new Date(deadline)
  const now = new Date()
  const diffDays = Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays < 0) {
    return "Closed"
  }

  if (diffDays <= 7) {
    return "Closing Soon"
  }

  return "Open"
}

function normalizeProduct(product: ProductRecord): ProductRecord {
  const status =
    product.quantity <= 0 ? "Out of Stock" : product.quantity <= 50 ? "Low Stock" : "Available"

  return {
    ...product,
    status,
  }
}

function normalizeTender(tender: TenderRecord): TenderRecord {
  return {
    ...tender,
    status: computeTenderStatus(tender.deadline),
  }
}

export function ensureDynamicDataSeeded() {
  if (!isBrowser()) {
    return
  }

  const isInitialized = window.localStorage.getItem(STORAGE_KEYS.initialized)
  if (isInitialized) {
    return
  }

  writeJson(STORAGE_KEYS.products, seededProducts.map(normalizeProduct))
  writeJson(STORAGE_KEYS.orders, [] satisfies OrderRecord[])
  writeJson(STORAGE_KEYS.tenders, seededTenders.map(normalizeTender))
  writeJson(STORAGE_KEYS.shipments, seededShipments)
  writeJson(STORAGE_KEYS.rationShops, seededRationShops)
  writeJson(STORAGE_KEYS.ledgerTransactions, seededLedgerTransactions)
  window.localStorage.setItem(STORAGE_KEYS.initialized, "true")
}

export function subscribeToDynamicData(callback: () => void) {
  if (!isBrowser()) {
    return () => {}
  }

  const handler = () => callback()
  window.addEventListener(CHANGE_EVENT, handler)
  window.addEventListener("storage", handler)
  return () => {
    window.removeEventListener(CHANGE_EVENT, handler)
    window.removeEventListener("storage", handler)
  }
}

export function getProducts() {
  ensureDynamicDataSeeded()
  requestFirestoreHydration("products", "products")
  return readJson<ProductRecord[]>(STORAGE_KEYS.products, []).map(normalizeProduct)
}

export function getProductsByOwner(ownerId?: string | null) {
  return getProducts().filter((product) => product.ownerId === ownerId)
}

export function saveProduct(
  input: Omit<ProductRecord, "id" | "createdAt" | "updatedAt" | "status"> & { id?: string | null },
) {
  const products = getProducts()
  const timestamp = new Date().toISOString()

  const record = normalizeProduct({
    ...input,
    id: input.id || `prod-${crypto.randomUUID()}`,
    createdAt: input.id ? products.find((product) => product.id === input.id)?.createdAt || timestamp : timestamp,
    updatedAt: timestamp,
    status: "Available",
  })

  const updatedProducts = input.id
    ? products.map((product) => (product.id === input.id ? record : product))
    : [record, ...products]

  writeJson(STORAGE_KEYS.products, updatedProducts)
  emitChange()
  void persistRecordToFirestore("products", record)
  return record
}

export function deleteProduct(productId: string) {
  const updatedProducts = getProducts().filter((product) => product.id !== productId)
  writeJson(STORAGE_KEYS.products, updatedProducts)
  emitChange()
  void deleteRecordFromFirestore("products", productId)
}

export function getOrders() {
  ensureDynamicDataSeeded()
  requestFirestoreHydration("orders", "orders")
  return readJson<OrderRecord[]>(STORAGE_KEYS.orders, [])
}

export function getOrdersForConsumer(consumerId?: string | null) {
  return getOrders().filter((order) => order.consumerId === consumerId)
}

export function getOrdersForFarmer(farmerId?: string | null) {
  return getOrders().filter((order) => order.items.some((item) => item.farmerId === farmerId))
}

export function createOrder(order: Omit<OrderRecord, "id" | "date" | "status">) {
  const orders = getOrders()
  const timestamp = new Date().toISOString()
  const createdOrder: OrderRecord = {
    ...order,
    id: `ORD-${Date.now()}`,
    date: timestamp,
    status: "pending",
  }

  writeJson(STORAGE_KEYS.orders, [createdOrder, ...orders])
  emitChange()
  void persistRecordToFirestore("orders", createdOrder)
  return createdOrder
}

export function updateOrderStatus(orderId: string, status: OrderStatus) {
  const updatedOrders = getOrders().map((order) => {
    if (order.id !== orderId) {
      return order
    }

    const trackingNumber =
      status === "shipped" || status === "delivered" ? order.trackingNumber || `TRK${Date.now()}` : undefined
    const estimatedDelivery =
      status === "shipped" || status === "delivered"
        ? order.estimatedDelivery || new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
        : undefined

    return {
      ...order,
      status,
      trackingNumber,
      estimatedDelivery,
    }
  })

  writeJson(STORAGE_KEYS.orders, updatedOrders)
  emitChange()
  const updatedOrder = updatedOrders.find((order) => order.id === orderId)
  if (updatedOrder) {
    void persistRecordToFirestore("orders", updatedOrder)
  }
}

export function getTenders() {
  ensureDynamicDataSeeded()
  requestFirestoreHydration("tenders", "tenders")
  return readJson<TenderRecord[]>(STORAGE_KEYS.tenders, []).map(normalizeTender)
}

export function createTender(
  input: Omit<TenderRecord, "id" | "bids" | "createdAt" | "updatedAt" | "status">,
) {
  const tenders = getTenders()
  const timestamp = new Date().toISOString()
  const record = normalizeTender({
    ...input,
    id: `TEN-${Date.now()}`,
    bids: [],
    createdAt: timestamp,
    updatedAt: timestamp,
    status: "Open",
  })

  writeJson(STORAGE_KEYS.tenders, [record, ...tenders])
  emitChange()
  void persistRecordToFirestore("tenders", record)
  return record
}

export function saveTenderBid(
  tenderId: string,
  bid: Omit<TenderBidRecord, "id" | "createdAt" | "status">,
) {
  const tenders = getTenders()
  const timestamp = new Date().toISOString()
  const updatedTenders = tenders.map((tender) => {
    if (tender.id !== tenderId) {
      return tender
    }

    const nextBid: TenderBidRecord = {
      ...bid,
      id: `BID-${Date.now()}`,
      createdAt: timestamp,
      status: "Pending",
    }

    return {
      ...tender,
      bids: [nextBid, ...tender.bids],
      updatedAt: timestamp,
    }
  })

  writeJson(STORAGE_KEYS.tenders, updatedTenders)
  emitChange()
  const updatedTender = updatedTenders.find((tender) => tender.id === tenderId)
  if (updatedTender) {
    void persistRecordToFirestore("tenders", updatedTender)
  }
}

export function updateTenderBidStatus(tenderId: string, bidId: string, status: TenderBidRecord["status"]) {
  const updatedTenders = getTenders().map((tender) => {
    if (tender.id !== tenderId) {
      return tender
    }

    return {
      ...tender,
      bids: tender.bids.map((bid) => (bid.id === bidId ? { ...bid, status } : bid)),
      updatedAt: new Date().toISOString(),
    }
  })

  writeJson(STORAGE_KEYS.tenders, updatedTenders)
  emitChange()
  const updatedTender = updatedTenders.find((tender) => tender.id === tenderId)
  if (updatedTender) {
    void persistRecordToFirestore("tenders", updatedTender)
  }
}

export function getShipments() {
  ensureDynamicDataSeeded()
  requestFirestoreHydration("shipments", "shipments")
  return readJson<ShipmentRecord[]>(STORAGE_KEYS.shipments, [])
}

export function createShipment(input: Omit<ShipmentRecord, "id" | "transactionId">) {
  const shipments = getShipments()
  const record: ShipmentRecord = {
    ...input,
    id: `SCE-${Date.now()}`,
    transactionId: `0x${crypto.randomUUID().replace(/-/g, "")}`,
  }

  writeJson(STORAGE_KEYS.shipments, [record, ...shipments])
  emitChange()
  void persistRecordToFirestore("shipments", record)
  return record
}

export function updateShipmentStatus(shipmentId: string, status: ShipmentRecord["status"]) {
  const updatedShipments = getShipments().map((shipment) =>
    shipment.id === shipmentId ? { ...shipment, status } : shipment,
  )
  writeJson(STORAGE_KEYS.shipments, updatedShipments)
  emitChange()
  const updatedShipment = updatedShipments.find((shipment) => shipment.id === shipmentId)
  if (updatedShipment) {
    void persistRecordToFirestore("shipments", updatedShipment)
  }
}

export function getRationShops() {
  ensureDynamicDataSeeded()
  requestFirestoreHydration("rationShops", "rationShops")
  return readJson<RationShopRecord[]>(STORAGE_KEYS.rationShops, [])
}

export function createRationShop(input: Omit<RationShopRecord, "id">) {
  const shops = getRationShops()
  const record: RationShopRecord = {
    ...input,
    id: `RS-${Date.now()}`,
  }

  writeJson(STORAGE_KEYS.rationShops, [record, ...shops])
  emitChange()
  void persistRecordToFirestore("rationShops", record)
  return record
}

export function getAdminDashboardSnapshot() {
  const tenders = getTenders()
  const shipments = getShipments()
  const shops = getRationShops()
  const orders = getOrders()

  return {
    activeTenderCount: tenders.filter((tender) => tender.status !== "Closed").length,
    closingSoonCount: tenders.filter((tender) => tender.status === "Closing Soon").length,
    totalTenderBudget: tenders.reduce((sum, tender) => {
      const amount = Number(tender.budget.replace(/[^0-9.]/g, ""))
      return sum + (Number.isFinite(amount) ? amount : 0)
    }, 0),
    deliveredShipments: shipments.filter((shipment) => shipment.status === "Delivered").length,
    activeShopCount: shops.filter((shop) => shop.status === "Active").length,
    lowStockShopCount: shops.filter((shop) => shop.status === "Low Stock").length,
    orderCount: orders.length,
  }
}

export function getLedgerTransactions() {
  ensureDynamicDataSeeded()
  requestFirestoreHydration("ledgerTransactions", "ledgerTransactions")
  return readJson<LedgerTransactionRecord[]>(STORAGE_KEYS.ledgerTransactions, [])
}

export function createLedgerTransaction(
  input: Omit<LedgerTransactionRecord, "id" | "hash" | "timestamp" | "previousHash" | "blockNumber" | "verified">,
) {
  const transactions = getLedgerTransactions()
  const latestBlockNumber = transactions.length > 0 ? Math.max(...transactions.map((tx) => tx.blockNumber)) + 1 : 1045682
  const previousHash = transactions.length > 0 ? transactions[0].hash : "0x0000000000000000000000000000000000000000"
  const record: LedgerTransactionRecord = {
    ...input,
    id: `TX-${Date.now()}`,
    hash: `0x${crypto.randomUUID().replace(/-/g, "")}`,
    timestamp: new Date().toISOString(),
    previousHash,
    blockNumber: latestBlockNumber,
    verified: false,
  }

  writeJson(STORAGE_KEYS.ledgerTransactions, [record, ...transactions])
  emitChange()
  void persistRecordToFirestore("ledgerTransactions", record)
  return record
}

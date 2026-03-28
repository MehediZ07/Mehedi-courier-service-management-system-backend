# Courier Management System - Backend

A production-ready courier and delivery management system built with Node.js, Express, TypeScript, Prisma, and PostgreSQL. This system provides a complete solution for managing shipments, couriers, merchants, payments, dynamic pricing, and real-time tracking.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-green)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-5.2-lightgrey)](https://expressjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-6.19-2D3748)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-blue)](https://www.postgresql.org/)

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Database Schema](#database-schema)
- [User Roles](#user-roles)
- [Pricing Engine](#pricing-engine)
- [Payment Integration](#payment-integration)
- [Project Structure](#project-structure)
- [Scripts](#scripts)

---

## Features

### Authentication & Authorization
- JWT-based authentication with access and refresh tokens
- Role-based access control with 5 user roles
- Secure password hashing with bcrypt
- Token refresh mechanism
- Password change functionality

### User Management
- User registration and profile management
- Profile image upload with base64 encoding (Vercel-compatible)
- Cloudinary integration for image storage
- User status management (Active, Inactive, Suspended)
- Advanced search, filtering, pagination, and sorting

### Courier Management
- Public courier registration with admin approval workflow
- Availability toggle for online/offline status
- View and accept available shipments
- Self-assignment of deliveries
- Real-time status updates
- Earnings and COD settlement tracking
- Vehicle type support (Bike, Bicycle, Car, Van, Truck)
- City-based courier assignment

### Shipment Management
- Create and track shipments with unique tracking numbers
- Real-time shipment status updates
- Public tracking without authentication
- Priority shipping (Standard/Express)
- Proof of delivery support
- Hub-based multi-leg delivery system
- Automatic route planning
- Leg-based courier workflow for local deliveries
- Shipment cancellation support

### Dynamic Pricing Engine
- Region-based pricing (LOCAL, NATIONAL, INTERNATIONAL)
- Automatic price calculation from weight, region, and priority
- Express surcharge configuration per region
- Admin-configurable rates without code changes
- ShipmentPricing audit trail for each shipment
- Public price quote API

### Payment Processing
- Multiple payment methods: Cash on Delivery, Stripe, SSLCommerz
- Automatic payment status updates
- Payment history and tracking
- Secure transaction handling
- COD settlement for couriers
- Merchant settlement tracking

### Merchant Management
- Merchant profile creation and management
- Company information management
- Shipment history tracking
- Settlement history and pending balance tracking
- Product price configuration

### Notification System
- Real-time notifications for shipment updates
- Read/unread status tracking
- Mark all as read functionality
- User-specific notification feed

---

## Tech Stack

### Backend
- Runtime: Node.js 20+
- Framework: Express.js 5.2
- Language: TypeScript 5.9
- Database: PostgreSQL 15+
- ORM: Prisma 6.19

### Authentication & Security
- JWT: jsonwebtoken
- Password Hashing: bcryptjs
- Validation: Zod

### Payment Gateways
- Stripe
- SSLCommerz (Ready for integration)

### File Storage
- Cloudinary for image uploads

### Development Tools
- ESLint for code linting
- TypeScript for type checking
- tsx for hot reload

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Client Layer                         │
│  (Web App, Mobile App, Admin Dashboard, Courier App)        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      API Gateway Layer                       │
│         (Express.js + Middleware + Authentication)           │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Business Logic Layer                    │
│  ┌────────┬────────┬─────────┬──────────┬────────┬───────┐ │
│  │  Auth  │ Users  │Couriers │Shipments │Payment │Pricing│ │
│  └────────┴────────┴─────────┴──────────┴────────┴───────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Data Access Layer                       │
│                    (Prisma ORM + Models)                     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Database Layer                          │
│                      (PostgreSQL)                            │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    External Services                         │
│         (Cloudinary, Stripe, SSLCommerz)                     │
└─────────────────────────────────────────────────────────────┘
```

---

## Getting Started

### Prerequisites
- Node.js 20 or higher
- PostgreSQL 15 or higher
- npm or pnpm
- Cloudinary account for image uploads
- Stripe account for payment processing

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd L2B6A5-Backend-Management-System
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
```bash
cp .env.example .env
```
Edit `.env` with your configuration (see Environment Variables section)

4. Set up the database
```bash
# Run migrations
npm run migrate

# Generate Prisma Client
npm run generate
```

5. Start the development server
```bash
npm run dev
```

Server will start at `http://localhost:5000`

6. Seed initial pricing (required before creating shipments)
```bash
POST /api/v1/pricing
{
  "regionType": "LOCAL",
  "basePrice": 50,
  "perKgPrice": 20,
  "expressMult": 1.2
}
```

---

## 🔑 Environment Variables

Create a `.env` file in the root directory:

```env
# Server Configuration
NODE_ENV=development
PORT=5000

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/courier_system?schema=public"

# JWT Secrets
ACCESS_TOKEN_SECRET=your_super_secret_access_token_key_here
REFRESH_TOKEN_SECRET=your_super_secret_refresh_token_key_here
ACCESS_TOKEN_EXPIRES_IN=1d
REFRESH_TOKEN_EXPIRES_IN=7d

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000

# Super Admin Credentials (auto-seeded)
SUPER_ADMIN_EMAIL=admin@example.com
SUPER_ADMIN_PASSWORD=Admin@123456

# Cloudinary (for image uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Stripe (for payments)
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
```

---

## 📚 API Documentation

Comprehensive API documentation is available in:
- **[API_DOCUMENTATION.md](./API_DOCUMENTATION.md)** - Complete API reference with all endpoints
- **[docs/](./docs/)** - Detailed flow diagrams and scenarios per module

### Quick API Overview

| Module | Endpoints | Description |
|--------|-----------|-------------|
| **Auth** | `/api/v1/auth/*` | Registration, login, token refresh, password change |
| **Users** | `/api/v1/users/*` | User management, profile updates, role management |
| **Couriers** | `/api/v1/couriers/*` | Courier registration, approval, availability, profile |
| **Merchants** | `/api/v1/merchants/*` | Merchant profile management |
| **Shipments** | `/api/v1/shipments/*` | Create, track, assign, update shipments |
| **Hubs** | `/api/v1/hubs/*` | Hub management, hub-based delivery network |
| **Legs** | `/api/v1/legs/*` | Shipment leg operations, courier leg workflow |
| **Payments** | `/api/v1/payments/*` | Payment processing, Stripe integration |
| **Pricing** | `/api/v1/pricing/*` | Shipping rates, price quotes, admin configuration |
| **Notifications** | `/api/v1/notifications/*` | User notifications, read status |

### Authentication

Most endpoints require a Bearer token:
```bash
Authorization: Bearer <your_access_token>
```

### Example Requests

```bash
# Login
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "Admin@123456"}'

# Get price quote (public — no auth needed)
curl -X POST http://localhost:5000/api/v1/pricing/calculate \
  -H "Content-Type: application/json" \
  -d '{"pickupCity": "Dhaka", "deliveryCity": "Chittagong", "weight": 2.5, "priority": "EXPRESS"}'

# Create Shipment (price is auto-calculated — no amount field needed)
curl -X POST http://localhost:5000/api/v1/shipments \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "pickupAddress": "123 Main St",
    "pickupCity": "Dhaka",
    "deliveryAddress": "456 Oak Ave",
    "deliveryCity": "Chittagong",
    "packageType": "Electronics",
    "weight": 2.5,
    "priority": "EXPRESS",
    "paymentMethod": "COD"
  }'
```

---

## 🗄️ Database Schema

### Core Models

```
User
├── id: String (UUID)
├── name: String
├── email: String (unique)
├── password: String (hashed)
├── phone: String?
├── profileImage: String?
├── role: Role (SUPER_ADMIN, ADMIN, COURIER, MERCHANT, USER)
├── status: UserStatus (ACTIVE, INACTIVE, SUSPENDED)
└── Relations: Courier, Merchant, Shipments, Notifications

Courier
├── id: String (UUID)
├── userId: String (unique)
├── vehicleType: VehicleType (BIKE, BICYCLE, CAR, VAN, TRUCK)
├── licenseNumber: String
├── city: String?
├── availability: Boolean
├── approvalStatus: ApprovalStatus (PENDING, APPROVED, REJECTED)
├── totalEarnings: Float
├── pendingCOD: Float
└── Relations: User, Shipments, ShipmentLegs

Shipment
├── id: String (UUID)
├── trackingNumber: String (unique)
├── senderId: String
├── merchantId: String?
├── courierId: String?
├── pickupAddress: String
├── pickupCity: String
├── pickupPhone: String
├── deliveryAddress: String
├── deliveryCity: String
├── deliveryPhone: String
├── packageType: String
├── weight: Float
├── priority: Priority (STANDARD, EXPRESS)
├── status: ShipmentStatus (PENDING, ASSIGNED, PICKED_UP, IN_TRANSIT, OUT_FOR_DELIVERY, DELIVERED, FAILED, RETURNED, CANCELLED)
├── paymentStatus: PaymentStatus (PENDING, PAID, COD, FAILED)
├── proofOfDelivery: String?
├── deliveryType: DeliveryType? (LEGACY_DIRECT, DIRECT, HUB_BASED)
├── currentLegId: String?
└── Relations: Sender, Merchant, Courier, Payment, ShipmentPricing, Notifications, Events, ShipmentLegs

Hub
├── id: String (UUID)
├── name: String
├── city: String
├── address: String
├── hubType: HubType (LOCAL, REGIONAL, INTERNATIONAL)
├── isActive: Boolean
└── Relations: ShipmentLegs (as origin/destination)

ShipmentLeg
├── id: String (UUID)
├── shipmentId: String
├── legNumber: Int
├── legType: LegType (DIRECT, PICKUP, HUB_TRANSFER, DELIVERY)
├── originType: LocationType (ADDRESS, HUB)
├── originAddress: String?
├── originHubId: String?
├── destType: LocationType (ADDRESS, HUB)
├── destAddress: String?
├── destHubId: String?
├── courierId: String?
├── status: LegStatus (PENDING, ASSIGNED, IN_PROGRESS, COMPLETED, FAILED)
├── assignedAt: DateTime?
├── pickedUpAt: DateTime?
├── deliveredAt: DateTime?
├── estimatedAt: DateTime?
└── Relations: Shipment, Courier, OriginHub, DestinationHub

Payment
├── id: String (UUID)
├── shipmentId: String (unique)
├── amount: Float  (auto-calculated by pricing engine)
├── method: PaymentMethod (STRIPE, SSLCOMMERZ, COD)
├── status: PaymentStatus
├── transactionId: String?
└── Relations: Shipment

Pricing
├── id: String (UUID)
├── regionType: RegionType (LOCAL, NATIONAL, INTERNATIONAL)  @unique
├── basePrice: Float
├── perKgPrice: Float
└── expressMult: Float  (e.g. 1.25 = +25% for EXPRESS)

ShipmentPricing
├── id: String (UUID)
├── shipmentId: String (unique)
├── regionType: RegionType
├── basePrice: Float
├── weightCharge: Float
├── priorityCharge: Float
├── totalPrice: Float
└── Relations: Shipment
```

### Entity Relationship Diagram

```
┌──────────┐       ┌──────────┐       ┌────────────────────┐
│   User   │──────▶│ Courier  │──────▶│      Shipment      │
└──────────┘       └──────────┘       └──┬──────┬──────┬───┘
     │                                   │      │      │
     ▼                                   ▼      ▼      ▼
┌──────────┐                        ┌───────┐ ┌──────────────┐
│ Merchant │───────────────────────▶│Payment│ │ShipmentPricing│
└──────────┘                        └───────┘ └──────────────┘
     │                                   │
     ▼                                   ▼
┌──────────────┐                  ┌──────────────┐
│ Notification │                  │ShipmentEvent │
└──────────────┘                  └──────────────┘
```

---

## 👤 User Roles

| Role | Permissions | Use Case |
|------|-------------|----------|
| **SUPER_ADMIN** | Full system access, manage admins, all CRUD operations | System owner |
| **ADMIN** | Manage users, couriers, merchants, shipments, payments, pricing | Operations manager |
| **COURIER** | View/accept shipments, update status, manage availability | Delivery rider |
| **MERCHANT** | Create shipments, view own shipments, manage profile | Business client |
| **USER** | Create shipments, track packages, view notifications | End customer |

---

## 💰 Pricing Engine

### How It Works

```
totalPrice = basePrice + (weight × perKgPrice) + priorityCharge

priorityCharge = (basePrice + weightCharge) × (expressMult - 1)  [EXPRESS only]
```

### Region Detection

| Region | Rule |
|--------|------|
| `LOCAL` | `pickupCity` == `deliveryCity` (case-insensitive) |
| `NATIONAL` | Different cities, same country |
| `INTERNATIONAL` | Admin-configured manually |

### Example Calculation

A 5 kg package from Dhaka → Chittagong (NATIONAL, EXPRESS, rates: base=100, perKg=30, mult=1.25):

```
weightCharge   = 5 × 30       = 150 BDT
subtotal       = 100 + 150    = 250 BDT
priorityCharge = 250 × 0.25   = 62.5 BDT
totalPrice     = 250 + 62.5   = 312.5 BDT
```

### Pricing Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|:----:|-------------|
| `GET` | `/api/v1/pricing` | ❌ Public | Get all pricing tiers |
| `POST` | `/api/v1/pricing/calculate` | ❌ Public | Get price quote |
| `POST` | `/api/v1/pricing` | 🛡️ ADMIN | Create / update a pricing tier |

---

## 💳 Payment Integration

### Supported Payment Methods

1. **Cash on Delivery (COD)**
   - Payment collected at delivery
   - Automatically marked as PAID when shipment is DELIVERED
   - No online processing required

2. **Stripe**
   - Secure online payment processing
   - PaymentIntent API for 3D Secure support
   - Automatic payment confirmation

3. **SSLCommerz** (Ready for integration)
   - Popular payment gateway in Bangladesh
   - Support for local payment methods

### Payment Flow

```
Create Shipment → Price auto-calculated → Select Payment Method
                                                  │
                          ┌───────────────────────┼───────────────────────┐
                          │                       │                       │
                          ▼                       ▼                       ▼
                        COD                   STRIPE                SSLCOMMERZ
                          │                       │                       │
                          │               Initiate Payment                │
                          │               (Get Client Secret)             │
                          │                       │                       │
                          │               Frontend Processing             │
                          │                       │                       │
                          │               Confirm Payment                 │
                          │                       │                       │
                          └───────────────────────┼───────────────────────┘
                                                  │
                                                  ▼
                                          Payment Complete
```

---

## 📁 Project Structure

```
L2B6A5-Backend-Management-System/
├── prisma/
│   ├── migrations/          # Database migrations
│   └── schema/              # Prisma schema files
│       ├── schema.prisma    # Main schema config
│       ├── enums.prisma     # Enum definitions (incl. RegionType)
│       ├── user.prisma
│       ├── courier.prisma
│       ├── merchant.prisma
│       ├── shipment.prisma
│       ├── hub.prisma        # Hub model for delivery network
│       ├── shipmentLeg.prisma # Multi-leg delivery model
│       ├── payment.prisma
│       ├── pricing.prisma   # Pricing + ShipmentPricing models
│       ├── shipmentEvent.prisma
│       └── notification.prisma
├── src/
│   ├── app/
│   │   ├── config/
│   │   ├── errorHelpers/
│   │   ├── interfaces/
│   │   ├── lib/
│   │   ├── middleware/
│   │   ├── module/
│   │   │   ├── auth/
│   │   │   ├── user/
│   │   │   ├── courier/
│   │   │   ├── merchant/
│   │   │   ├── shipment/
│   │   │   ├── hub/
│   │   │   ├── shipmentLeg/
│   │   │   ├── payment/
│   │   │   ├── pricing/
│   │   │   └── notification/
│   │   ├── routes/
│   │   ├── shared/
│   │   └── utils/
│   ├── types/
│   ├── app.ts
│   └── server.ts
├── docs/                    # Flow documentation
├── .env
├── .env.example
├── package.json
├── tsconfig.json
├── eslint.config.mjs
└── API_DOCUMENTATION.md
```

### Module Structure

Each module follows a consistent pattern:
```
module/
├── module.controller.ts    # Request handlers
├── module.service.ts       # Business logic
├── module.route.ts         # Route definitions
└── module.validation.ts    # Zod schemas
```

---

## 📜 Scripts

```bash
# Development
npm run dev              # Start development server with hot reload

# Build
npm run build            # Compile TypeScript to JavaScript

# Production
npm start                # Start production server

# Database
npm run migrate          # Run database migrations
npm run generate         # Generate Prisma Client
npm run studio           # Open Prisma Studio (DB GUI)
npm run push             # Push schema changes without migration

# Code Quality
npm run lint             # Run ESLint
```

---

## 🔄 Complete Courier Workflow

### 1. Courier Registration
```
Person applies → POST /auth/register-courier
                 ↓
         Account created (PENDING approval)
```

### 2. Admin Approval
```
Admin reviews → PATCH /couriers/:id/approve
                ↓
         Status: APPROVED (can work now)
```

### 3. Go Online
```
Courier ready → PATCH /couriers/toggle-availability
                ↓
         availability = true (online)
```

### 4. Accept Shipment
```
Browse shipments → GET /shipments/courier/available
                   ↓
Accept shipment → POST /shipments/:id/accept
                   ↓
         Shipment assigned to courier
```

### 5. Delivery Process
```
PENDING → ASSIGNED → PICKED_UP → IN_TRANSIT → OUT_FOR_DELIVERY → DELIVERED
```

### 6. Go Offline
```
End shift → PATCH /couriers/toggle-availability
            ↓
     availability = false (offline)
```

---

## 🎯 Key Features Highlights

### ✅ Self-Service Courier System
Just like Uber Eats or Foodpanda:
- Riders register themselves
- Admin approves applications
- Riders go online when ready
- Riders see and accept available deliveries
- Real-time status updates
- Automatic customer notifications

### ✅ Dynamic Pricing Engine
- Region-based rates (LOCAL / NATIONAL / INTERNATIONAL)
- Weight-based charges
- Express priority surcharge
- Admin-configurable without code changes
- Full audit trail per shipment

### ✅ Production-Ready
- Type-safe with TypeScript
- Comprehensive error handling
- Request validation with Zod
- JWT authentication
- Role-based access control
- Database migrations
- Cloudinary integration
- Payment gateway integration

### ✅ Scalable Architecture
- Modular design
- Clean separation of concerns
- Reusable utilities
- Query builder for complex queries
- Optimized database queries

---

## 🧪 Testing

```bash
# Run tests (when implemented)
npm test

# Test coverage
npm run test:coverage
```

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the ISC License.

---

## 👨‍💻 Author

**Your Name**
- GitHub: [@yourusername](https://github.com/yourusername)
- Email: your.email@example.com

---

## 🗺️ Roadmap

- [x] Dynamic pricing engine (region + weight + priority)
- [x] Hub-based multi-leg delivery system
- [x] Automatic route planning
- [x] Leg-based courier workflow
- [ ] Real-time tracking with WebSockets
- [ ] Mobile app (React Native)
- [ ] Admin dashboard (React)
- [ ] SMS notifications
- [ ] Email notifications
- [ ] Advanced analytics
- [ ] Route optimization
- [ ] API rate limiting

---

**Made with ❤️ for the courier industry**

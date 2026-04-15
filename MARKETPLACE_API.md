# Marketplace API Documentation

## Overview
The Marketplace API provides endpoints to manage and retrieve crop/product information with prices. This is a master data catalog separate from farmer-specific crop listings.

## Base URL
```
http://localhost:5000/api/marketplace
```

---

## Models

### MarketplaceProduct Schema
```javascript
{
  name: String (required, unique),
  category: String (enum: 'grain', 'vegetable', 'fruit', 'pulse', 'oilseed', 'spice'),
  pricePerKg: Number (required, min: 0),
  unit: String (enum: 'kg', 'quintal', 'ton', default: 'kg'),
  season: String (enum: 'kharif', 'rabi', 'zaid', 'all-year'),
  description: String,
  isActive: Boolean (default: true),
  createdAt: Date,
  updatedAt: Date
}
```

---

## API Endpoints

### 1. Get All Marketplace Products (Public)
**GET** `/api/marketplace`

Get all active marketplace products with optional filters.

**Query Parameters:**
- `category` - Filter by category (grain, vegetable, fruit, pulse, oilseed, spice)
- `season` - Filter by season (kharif, rabi, zaid, all-year)
- `search` - Search by name or description
- `minPrice` - Minimum price per kg
- `maxPrice` - Maximum price per kg

**Example Request:**
```bash
GET /api/marketplace?category=vegetable&minPrice=20&maxPrice=50
```

**Example Response:**
```json
{
  "success": true,
  "count": 15,
  "data": [
    {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
      "name": "Tomato",
      "category": "vegetable",
      "pricePerKg": 40,
      "unit": "kg",
      "season": "all-year",
      "description": "Essential vegetable, used in curries and salads",
      "isActive": true,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    },
    {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k2",
      "name": "Onion",
      "category": "vegetable",
      "pricePerKg": 35,
      "unit": "kg",
      "season": "rabi",
      "description": "Base ingredient for most Indian dishes",
      "isActive": true,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

---

### 2. Get Single Product (Public)
**GET** `/api/marketplace/:id`

Get a single marketplace product by ID.

**Example Request:**
```bash
GET /api/marketplace/65a1b2c3d4e5f6g7h8i9j0k1
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
    "name": "Rice",
    "category": "grain",
    "pricePerKg": 45,
    "unit": "kg",
    "season": "kharif",
    "description": "Staple food grain, widely consumed across India",
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

---

### 3. Add New Product (Admin Only)
**POST** `/api/marketplace`

Add a new crop/product to the marketplace.

**Headers:**
```
Authorization: Bearer <admin_jwt_token>
```

**Request Body:**
```json
{
  "name": "Basmati Rice",
  "category": "grain",
  "pricePerKg": 80,
  "unit": "kg",
  "season": "kharif",
  "description": "Premium aromatic rice variety"
}
```

**Example Response:**
```json
{
  "success": true,
  "message": "Product added to marketplace successfully",
  "data": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k3",
    "name": "Basmati Rice",
    "category": "grain",
    "pricePerKg": 80,
    "unit": "kg",
    "season": "kharif",
    "description": "Premium aromatic rice variety",
    "isActive": true,
    "createdAt": "2024-01-15T11:00:00.000Z",
    "updatedAt": "2024-01-15T11:00:00.000Z"
  }
}
```

---

### 4. Update Product (Admin Only)
**PUT** `/api/marketplace/:id`

Update marketplace product details, especially useful for updating prices.

**Headers:**
```
Authorization: Bearer <admin_jwt_token>
```

**Request Body (all fields optional):**
```json
{
  "pricePerKg": 50,
  "description": "Updated description",
  "season": "all-year"
}
```

**Example Response:**
```json
{
  "success": true,
  "message": "Product updated successfully",
  "data": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
    "name": "Tomato",
    "category": "vegetable",
    "pricePerKg": 50,
    "unit": "kg",
    "season": "all-year",
    "description": "Updated description",
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T11:15:00.000Z"
  }
}
```

---

### 5. Soft Delete Product (Admin Only)
**DELETE** `/api/marketplace/:id`

Deactivate a product (soft delete by setting isActive to false).

**Headers:**
```
Authorization: Bearer <admin_jwt_token>
```

**Example Response:**
```json
{
  "success": true,
  "message": "Product deactivated successfully",
  "data": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
    "name": "Tomato",
    "isActive": false,
    "updatedAt": "2024-01-15T11:20:00.000Z"
  }
}
```

---

### 6. Reactivate Product (Admin Only)
**PUT** `/api/marketplace/:id/activate`

Reactivate a previously deactivated product.

**Headers:**
```
Authorization: Bearer <admin_jwt_token>
```

**Example Response:**
```json
{
  "success": true,
  "message": "Product activated successfully",
  "data": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
    "name": "Tomato",
    "isActive": true,
    "updatedAt": "2024-01-15T11:25:00.000Z"
  }
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "errors": [
    {
      "param": "pricePerKg",
      "msg": "Price per kg must be a number"
    }
  ]
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Not authorized to access this route"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Product not found"
}
```

### 500 Server Error
```json
{
  "success": false,
  "message": "Server error",
  "error": "Error message details"
}
```

---

## Setup Instructions

### 1. Seed the Database
Run the seed script to populate marketplace with Indian crops:

```bash
cd backend
npm run seed-marketplace
```

This will add 60+ common Indian crops with realistic prices.

### 2. Test the API

**Get all products:**
```bash
curl http://localhost:5000/api/marketplace
```

**Get products by category:**
```bash
curl http://localhost:5000/api/marketplace?category=vegetable
```

**Search products:**
```bash
curl http://localhost:5000/api/marketplace?search=tomato
```

**Filter by price range:**
```bash
curl http://localhost:5000/api/marketplace?minPrice=30&maxPrice=60
```

---

## Categories

- **grain**: Rice, Wheat, Maize, Barley, Millets
- **vegetable**: Tomato, Onion, Potato, Brinjal, etc.
- **fruit**: Mango, Banana, Orange, Apple, etc.
- **pulse**: Tur Dal, Moong Dal, Chana Dal, etc.
- **oilseed**: Groundnut, Mustard, Sesame, Sunflower
- **spice**: Turmeric, Chilli, Coriander, Cumin, etc.

---

## Seasons

- **kharif**: Monsoon season crops (June-October)
- **rabi**: Winter season crops (November-April)
- **zaid**: Summer season crops (March-June)
- **all-year**: Crops available throughout the year

---

## Notes

- Prices are stored in INR (Indian Rupees) per kg
- All prices are realistic based on Indian market rates
- Products are soft-deleted (isActive: false) rather than permanently removed
- Public endpoints don't require authentication
- Admin endpoints require JWT token with admin role

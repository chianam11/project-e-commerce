# 🛒 Project Thế Giới Di Động

## 📖 Short Description
This project is an online shopping platform where users can purchase items such as **smartphones, laptops, Apple Watches, and more.**

---

## ⚡ Tech Stack
- **Frontend Client**: Next.js  
- **Frontend Admin**: React.js  
- **Backend**: Node.js (Express), PostgreSQL  
- **Authentication**: JWT (Access/Refresh tokens)  
- **Deployment**: Docker, CI/CD (GitHub Actions)  
- **Testing & Tools**: Jest, ESLint, Prettier  

---

## ✅ Quick Roadmap (Overview)

### Phase 1: Core Features (MVP)
- [ ] Authentication & Authorization  
- [ ] Product Management  
- [ ] Shopping Cart  
- [ ] Checkout  
- [ ] Order Management  

### Phase 2: Enhanced Features
- [ ] Reviews & Ratings  
- [ ] Wishlist / Favorites  
- [ ] Coupons / Discount codes  
- [ ] Email Notifications  
- [ ] Admin Dashboard  

### Phase 3: Advanced Features
- [ ] Real-time Notification (Socket.IO)  
- [ ] Recommendation System (AI)  
- [ ] Multi-language & Multi-currency  
- [ ] Chatbot / Live Chat  
- [ ] Progressive Web App (PWA)  
- [ ] SEO-friendly + SSR (Next.js)  
- [ ] Microservices / Clean Architecture  

---

## 📌 Detailed Feature Roadmap

### 🚀 Phase 1: Core Features (MVP)

#### 🔐 Authentication & Authorization
- [ ] User Registration/Login (Email & password)  
- [ ] JWT Authentication (Access/Refresh tokens)  
- [ ] Role-based Access (User/Admin)  
- [ ] Password Recovery (Forgot/Reset password)  

#### 📦 Product Management
- [ ] CRUD Products (Admin only)  
- [ ] Categories & Subcategories (Hierarchical structure)  
- [ ] Product Search (By name, category, brand)  
- [ ] Product Filtering (Price range, ratings, brands)  
- [ ] Product Images (Multiple images per product)  

#### 🛒 Shopping Cart
- [ ] Add to Cart (Authenticated users)  
- [ ] Cart Management (Update quantity, remove items)  
- [ ] Cart Persistence (Save across sessions)  
- [ ] Price Calculation (Real-time totals)  

#### 💳 Checkout & Orders
- [ ] Shipping Address (Multiple per user)  
- [ ] Payment Integration (VNPay/Momo – simulated)  
- [ ] Order Creation (Convert cart to order)  
- [ ] Order Confirmation (Email notification)  

#### 👤 User Management
- [ ] User Profiles (Personal info)  
- [ ] Order History  
- [ ] Order Tracking (Status updates)  

---

### 🎨 Phase 2: Enhanced Features

#### ⭐ Reviews & Ratings
- [ ] Product Reviews (Text + star rating)  
- [ ] Average Rating Calculation  
- [ ] Review Moderation (Admin approval)  

#### ❤️ Wishlist & Favorites
- [ ] Wishlist Management (Add/remove favorites)  
- [ ] Share Wishlist (Social sharing)  

#### 🎫 Discounts & Promotions
- [ ] Coupon System (Percentage/fixed amount)  
- [ ] Seasonal Campaigns  
- [ ] Bulk Discounts (Quantity-based pricing)  

#### 📊 Admin Dashboard
- [ ] Sales Analytics (Revenue charts & reports)  
- [ ] Inventory Management (Stock alerts)  
- [ ] User Management (Admin controls)  
- [ ] Content Management (Product updates)  

#### 📧 Notifications
- [ ] Email Service (Orders, promotions)  
- [ ] System Alerts (Low stock, new orders)  

---

### 💎 Phase 3: Advanced Features

#### 🔔 Real-time Features
- [ ] Live Notifications (Socket.IO)  
- [ ] Customer Support (Live Chat)  
- [ ] Real-time Inventory Updates  

#### 🤖 AI & Personalization
- [ ] Recommendation Engine ("You may also like…")  
- [ ] AI-powered Search Optimization  
- [ ] Personalized Content (User behavior)  

#### 🌐 Internationalization
- [ ] Multi-language (EN/VN)  
- [ ] Multi-currency (VND/USD)  
- [ ] Localized Content  

#### 📱 Advanced Frontend
- [ ] PWA Support (Offline functionality)  
- [ ] Advanced SEO (Meta tags, structured data)  
- [ ] Performance Optimization (Caching, CDN)  

#### 🏗️ Architecture Improvements
- [ ] Microservices  
- [ ] API Gateway  
- [ ] Clean Architecture  

---

## 🛠 Database Schema (Key Tables)

```sql
users, products, categories, orders, order_items, 
reviews, cart_items, coupons, notifications, payments, addresses

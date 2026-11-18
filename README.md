# 🏕️ HostelBazaar

> An intra-college C2C marketplace built exclusively for hostel students — buy, sell, and exchange used items without exposing phone numbers.

![Tech Stack](https://img.shields.io/badge/Stack-MERN-blueviolet?style=flat-square)
![Auth](https://img.shields.io/badge/Auth-USN%20%2B%20JWT-indigo?style=flat-square)
![Chat](https://img.shields.io/badge/Chat-Socket.io-green?style=flat-square)
![Images](https://img.shields.io/badge/Images-Cloudinary-orange?style=flat-square)

---

## ✨ Features

| Feature | Description |
|---|---|
| 🔐 **USN-Only Auth** | Login exclusively via University Seat Number — no email, no OAuth |
| 🛍️ **Marketplace Feed** | Browse active listings with search + filters (category, condition, price) |
| 📦 **Post Listings** | Upload items with title, description, price, category, condition and an image |
| ✏️ **Ad Management** | Edit, delete, or mark listings as Sold |
| 💬 **Real-Time Chat** | Socket.io peer-to-peer messaging — negotiate without sharing contact details |
| ☁️ **Cloudinary Upload** | Images stored on Cloudinary CDN, auto-resized to 800×800 |

---

## 🛠️ Tech Stack

**Backend**
- Node.js + Express.js
- MongoDB + Mongoose
- Socket.io (real-time chat)
- Cloudinary + Multer (image upload)
- JWT + HttpOnly cookies (authentication)
- bcryptjs (password hashing)

**Frontend**
- React 19 + Vite
- Tailwind CSS
- React Router v7
- Axios + Socket.io-client

---

## 📁 Project Structure

```
hostel-bazaar/
├── server/                  # Express + Socket.io backend
│   ├── config/              # DB + Cloudinary setup
│   ├── controllers/         # auth / item / chat
│   ├── middleware/          # JWT auth + Multer upload
│   ├── models/              # User, Item, Conversation, Message
│   ├── routes/              # auth / item / chat routes
│   ├── socket/              # Socket.io event handlers
│   ├── utils/               # JWT token generator
│   └── server.js
│
└── client/                  # React (Vite) frontend
    └── src/
        ├── api/             # Axios wrappers
        ├── components/      # Navbar, ItemCard, ChatWindow, …
        ├── context/         # AuthContext, SocketContext
        ├── pages/           # Feed, ItemDetail, Post, Inbox, …
        └── utils/           # USN regex validation
```

---

## 🔐 USN Format

Login is restricted to valid University Seat Numbers matching:

```
/^1ms(23|24|25|26)[a-zA-Z]{2,3}\d{3}$/i
```

**Examples:** 1MS23CS001, 1MS24IS042, 1MS26EC123

---

## 🚀 Getting Started

### Prerequisites
- Node.js ≥ 18
- MongoDB Atlas account (free tier works)
- Cloudinary account (free tier works)

### 1. Clone the repo

```bash
git clone https://github.com/MR-ADITYA007/hostel-bazaar.git
cd hostel-bazaar
```

### 2. Configure the backend

```bash
cd server
cp .env.example .env
```

Fill in server/.env:

```env
PORT=5000
MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/hostelbazaar
JWT_SECRET=your_super_secret_key
CLIENT_URL=http://localhost:5173
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
NODE_ENV=development
```

### 3. Install dependencies and run

**Backend:**
```bash
cd server
npm install
npm run dev        # nodemon on :5000
```

**Frontend (new terminal):**
```bash
cd client
npm install
npm run dev        # Vite on :5173
```

### 4. Open the app

```
http://localhost:5173
```

---

## 🗃️ Database Schema

| Collection | Key Fields |
|---|---|
| users | usn (unique, uppercase), password (bcrypt), 
ame |
| items | seller, 	itle, price, category, condition, imageUrl, status |
| conversations | item, uyer, seller, lastMessage — unique per buyer+item pair |
| messages | conversation, sender, 	ext |

---

## 🌐 API Reference

### Auth — /api/auth
| Method | Route | Auth | Description |
|---|---|---|---|
| POST | /register | — | Register with USN + name + password |
| POST | /login | — | Login, receive JWT cookie |
| POST | /logout | ✅ | Clear JWT cookie |
| GET | /me | ✅ | Get current user |

### Items — /api/items
| Method | Route | Auth | Description |
|---|---|---|---|
| GET | / | — | Feed (search, filter, paginate) |
| GET | /my | ✅ | My listings |
| GET | /:id | — | Item detail |
| POST | / | ✅ | Create listing (multipart) |
| PUT | /:id | ✅ | Edit listing |
| DELETE | /:id | ✅ | Delete listing |
| PATCH | /:id/status | ✅ | Toggle Active / Sold |

### Chat — /api/chat
| Method | Route | Auth | Description |
|---|---|---|---|
| POST | /conversations | ✅ | Start or fetch conversation |
| GET | /conversations | ✅ | Inbox |
| GET | /conversations/:id/messages | ✅ | Message history |
| POST | /conversations/:id/messages | ✅ | Send message (REST fallback) |

### Socket.io Events
| Direction | Event | Payload |
|---|---|---|
| Client → Server | join_conversation | { conversationId } |
| Client → Server | leave_conversation | { conversationId } |
| Client → Server | send_message | { conversationId, text } |
| Server → Client | eceive_message | { _id, sender, text, createdAt, conversationId } |

---

## 📸 Screenshots

> *Register / Login with your USN → Browse the feed → Post an item → Chat with the seller in real time.*

---

## 🔒 Security Highlights

- Passwords hashed with **bcrypt** (12 salt rounds)
- JWT stored in **HttpOnly + SameSite=Strict** cookie — not localStorage
- USN regex enforced on **both** frontend and backend
- Cloudinary upload validates MIME type and enforces 5 MB limit
- Ownership checks on all edit/delete/toggle endpoints
- Socket.io connections require a valid JWT on handshake

---

## 📄 License

MIT © 2024 MR-ADITYA007

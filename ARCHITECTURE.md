# HostelBazaar — Architecture Plan

## Top-Level Overview

**Goal:** Build a secure, intra-college C2C marketplace web application ("HostelBazaar") exclusively for hostel students, identified by their University Seat Number (USN). Students can post, browse, and negotiate on second-hand items entirely within the campus ecosystem — no phone numbers exposed, no external accounts required.

**Stack:**
- **Backend:** Node.js + Express.js + MongoDB (Mongoose) + Socket.io + Cloudinary (image hosting) + JWT (HttpOnly cookies)
- **Frontend:** React.js (Vite) + Tailwind CSS + Socket.io-client

**Scope:**
- USN-only authentication (JWT + HttpOnly cookies, strict regex enforcement on both sides)
- Marketplace feed with search and filters (category, price range, condition)
- Post / Edit / Delete / Mark-as-Sold item listings (1 image per listing via Cloudinary)
- Real-time peer-to-peer chat (Socket.io) with full message history persisted to MongoDB
- Open chat model: any authenticated student can message any active listing's seller immediately

**Non-Goals (v1):**
- Email/password or OAuth login
- Push notifications
- Payment integration
- Admin dashboard
- Multi-image listings

---

## Project Structure

```
hostel-bazaar/
├── server/                        # Express + Socket.io backend
│   ├── config/
│   │   ├── db.js                  # Mongoose connection
│   │   └── cloudinary.js          # Cloudinary SDK config
│   ├── middleware/
│   │   ├── auth.middleware.js      # JWT cookie verification
│   │   └── upload.middleware.js    # Multer + Cloudinary storage
│   ├── models/
│   │   ├── User.model.js
│   │   ├── Item.model.js
│   │   ├── Conversation.model.js
│   │   └── Message.model.js
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── item.controller.js
│   │   └── chat.controller.js
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── item.routes.js
│   │   └── chat.routes.js
│   ├── socket/
│   │   └── socket.handler.js      # Socket.io event handlers
│   ├── utils/
│   │   └── generateToken.js       # JWT sign + cookie setter
│   └── server.js                  # App entry point
│
└── client/                        # React (Vite) frontend
    ├── src/
    │   ├── api/                   # Axios instance + per-resource helpers
    │   ├── components/
    │   │   ├── Navbar.jsx
    │   │   ├── ItemCard.jsx
    │   │   ├── ItemFilters.jsx
    │   │   ├── ImageUpload.jsx
    │   │   └── ChatWindow.jsx
    │   ├── context/
    │   │   ├── AuthContext.jsx     # Current user + login/logout
    │   │   └── SocketContext.jsx   # Socket.io singleton
    │   ├── pages/
    │   │   ├── LoginPage.jsx
    │   │   ├── RegisterPage.jsx
    │   │   ├── FeedPage.jsx        # Homepage / browse all ads
    │   │   ├── ItemDetailPage.jsx  # Single listing + "Message Seller" CTA
    │   │   ├── PostItemPage.jsx    # Create new listing
    │   │   ├── EditItemPage.jsx    # Edit existing listing
    │   │   ├── MyListingsPage.jsx  # Seller's own ads
    │   │   └── InboxPage.jsx       # All conversations + chat window
    │   ├── hooks/
    │   │   └── useSocket.js        # Convenience hook for SocketContext
    │   ├── App.jsx
    │   └── main.jsx
    └── vite.config.js
```

---

## Mongoose Schemas

### 1. User

```
Collection: users

Fields:
  usn        String   required, unique, uppercase, index
               — stored as uppercase, matched case-insensitively
               — regex validated: /^1ms(23|24|25|26)[a-zA-Z]{2,3}\d{3}$/i
  password   String   required, bcrypt-hashed (min 8 chars)
  name       String   required (display name, e.g. "Rahul M")
  branch     String   derived from USN during registration (optional denormalization)
  createdAt  Date     auto (timestamps: true)
  updatedAt  Date     auto (timestamps: true)
```

### 2. Item

```
Collection: items

Fields:
  seller       ObjectId   ref: 'User', required
  title        String     required, trim, maxLength 100
  description  String     required, maxLength 1000
  price        Number     required, min 0
  category     String     enum: [Books, Electronics, Stationery,
                                 Clothing, Bicycles, Lab Equipment,
                                 Hostel Essentials, Other]
  condition    String     enum: [New, Like New, Good, Fair, Poor]
  imageUrl     String     required (Cloudinary HTTPS URL)
  imagePublicId String    required (Cloudinary public_id for deletion)
  status       String     enum: [Active, Sold]  default: Active
  createdAt    Date       auto
  updatedAt    Date       auto

Indexes:
  { status: 1, createdAt: -1 }   — feed queries
  { seller: 1 }                  — my listings queries
  text index on { title, description } — full-text search
```

### 3. Conversation

```
Collection: conversations

Fields:
  item         ObjectId   ref: 'Item', required
  buyer        ObjectId   ref: 'User', required
  seller       ObjectId   ref: 'User', required
  lastMessage  String     updated on each new message (UI preview)
  updatedAt    Date       auto (used to sort inbox by most recent)
  createdAt    Date       auto

Compound unique index: { item: 1, buyer: 1 }
  — ensures only one thread per buyer–item pair

Indexes:
  { buyer: 1, updatedAt: -1 }   — buyer's inbox
  { seller: 1, updatedAt: -1 }  — seller's inbox
```

### 4. Message

```
Collection: messages

Fields:
  conversation  ObjectId   ref: 'Conversation', required, index
  sender        ObjectId   ref: 'User', required
  text          String     required, maxLength 1000
  createdAt     Date       auto (timestamps: true)
```

---

## REST API Endpoints

All JSON responses follow `{ success, data?, message? }` envelope.  
Protected routes require a valid JWT in the `token` HttpOnly cookie.

### Auth Routes — `/api/auth`

| Method | Path        | Auth | Description                                      |
|--------|-------------|------|--------------------------------------------------|
| POST   | /register   | No   | Register with USN + name + password              |
| POST   | /login      | No   | Validate USN + password, set JWT HttpOnly cookie |
| POST   | /logout     | Yes  | Clear the JWT cookie                             |
| GET    | /me         | Yes  | Return current user's public profile             |

**Register logic:**
1. Validate USN against regex `/^1ms(23|24|25|26)[a-zA-Z]{2,3}\d{3}$/i`
2. Check USN uniqueness (case-insensitive)
3. Hash password with bcrypt (salt rounds: 12)
4. Save user, sign JWT, set HttpOnly cookie, return user object (no password)

**Login logic:**
1. Validate USN regex
2. Find user by uppercase USN
3. `bcrypt.compare` password
4. Sign JWT, set HttpOnly cookie, return user object (no password)

### Item Routes — `/api/items`

| Method | Path        | Auth | Description                                                   |
|--------|-------------|------|---------------------------------------------------------------|
| GET    | /           | No   | Feed — paginated, filterable by category/price/condition/search |
| GET    | /:id        | No   | Single item detail + seller's public USN/name                 |
| POST   | /           | Yes  | Create listing (multipart/form-data, 1 image → Cloudinary)    |
| PUT    | /:id        | Yes  | Edit listing (seller only); re-upload image if new file sent  |
| DELETE | /:id        | Yes  | Delete listing (seller only); delete image from Cloudinary    |
| PATCH  | /:id/status | Yes  | Toggle status Active ↔ Sold (seller only)                     |
| GET    | /my         | Yes  | All listings by the authenticated seller                      |

**Feed query parameters:**
- `search` — full-text search on title/description
- `category` — exact enum value
- `condition` — exact enum value
- `minPrice` / `maxPrice` — numeric range
- `page` / `limit` — pagination (default limit: 12)

### Chat Routes — `/api/chat`

| Method | Path                        | Auth | Description                                                 |
|--------|-----------------------------|------|-------------------------------------------------------------|
| POST   | /conversations              | Yes  | Create or fetch existing conversation for item+buyer pair   |
| GET    | /conversations              | Yes  | All conversations for the authenticated user (inbox)        |
| GET    | /conversations/:id/messages | Yes  | Paginated message history for a conversation                |
| POST   | /conversations/:id/messages | Yes  | Persist a new message (also emitted via Socket.io)          |

**Create-or-fetch logic (POST /conversations):**
- Body: `{ itemId }`
- Buyer = `req.user._id`; Seller = item's seller field
- `findOneOrCreate` using the compound unique index `{ item, buyer }`
- Returns the conversation document (populated with item title + seller name)

---

## Socket.io Architecture

**Transport:** WebSocket with polling fallback  
**Authentication:** On `connection`, the server reads the JWT HttpOnly cookie from the socket handshake headers and verifies it. Unauthenticated sockets are disconnected immediately.

**Rooms:** Each conversation has its own Socket.io room named by its MongoDB `_id` string.

**Events:**

| Direction         | Event              | Payload                                       | Description                               |
|-------------------|--------------------|-----------------------------------------------|-------------------------------------------|
| Client → Server   | `join_conversation`  | `{ conversationId }`                          | Client joins the room for a conversation  |
| Client → Server   | `leave_conversation` | `{ conversationId }`                          | Client leaves the room                    |
| Client → Server   | `send_message`       | `{ conversationId, text }`                    | Client sends a message                    |
| Server → Client   | `receive_message`    | `{ _id, sender, text, createdAt, conversationId }` | Broadcast to room on new message     |
| Server → Client   | `error`              | `{ message }`                                 | Validation or auth error                  |

**Server-side `send_message` handler:**
1. Validate sender is a participant in the conversation (buyer or seller)
2. Persist `Message` document to MongoDB
3. Update `Conversation.lastMessage` and `updatedAt`
4. Emit `receive_message` to the room (all participants in the room receive it)

---

## React Component Tree

```
App.jsx
├── AuthContext.Provider
│   └── SocketContext.Provider
│       ├── Navbar.jsx            — USN display, My Listings, Inbox, Logout
│       └── Routes
│           ├── /login            → LoginPage.jsx
│           │                         └── USN + password form
│           │                             (regex validated client-side)
│           ├── /register         → RegisterPage.jsx
│           │                         └── USN + name + password form
│           ├── /                 → FeedPage.jsx
│           │                         ├── ItemFilters.jsx
│           │                         │    — category, condition,
│           │                         │      price range, search bar
│           │                         └── ItemCard.jsx (×N)
│           ├── /items/:id        → ItemDetailPage.jsx
│           │                         ├── Image, title, price,
│           │                         │   condition, description
│           │                         └── "Message Seller" button
│           │                             (creates/fetches conversation,
│           │                              redirects to /inbox/:convId)
│           ├── /items/post       → PostItemPage.jsx   [Protected]
│           │                         └── ImageUpload.jsx + form fields
│           ├── /items/:id/edit   → EditItemPage.jsx   [Protected]
│           │                         └── Pre-filled form + ImageUpload.jsx
│           ├── /my-listings      → MyListingsPage.jsx [Protected]
│           │                         └── ItemCard.jsx (×N)
│           │                             with Edit / Delete / Mark Sold
│           └── /inbox/:convId?   → InboxPage.jsx      [Protected]
│                                     ├── ConversationList sidebar
│                                     │    — sorted by updatedAt desc
│                                     │    — shows lastMessage preview
│                                     └── ChatWindow.jsx
│                                          ├── Message history (scrollable)
│                                          └── Message input + send button
```

---

## Implementation Sub-Tasks

### Sub-Task 1 — Backend Scaffolding & USN Auth
**Status:** [ ] pending

**Intent:** Stand up the Express server, connect to MongoDB, configure Cloudinary, and implement the full USN authentication flow (register, login, logout, /me).

**Expected Outcomes:**
- `server/server.js` starts without errors; connects to MongoDB
- `POST /api/auth/register` accepts a valid USN, hashes the password, and returns a JWT cookie
- `POST /api/auth/login` validates credentials and returns a JWT cookie
- `GET /api/auth/me` returns the current user's profile when a valid cookie is present
- Invalid USNs are rejected with a descriptive 400 error on both register and login

**Todo List:**
1. `npm init` in `server/`; install dependencies: `express`, `mongoose`, `bcryptjs`, `jsonwebtoken`, `cookie-parser`, `cors`, `dotenv`, `multer`, `multer-storage-cloudinary`, `cloudinary`
2. Create `server.js` — Express app, middleware (`cors` with credentials, `cookie-parser`, `express.json`), mount routes, attach Socket.io server, start listener
3. Create `config/db.js` — `mongoose.connect(process.env.MONGO_URI)`
4. Create `config/cloudinary.js` — configure Cloudinary SDK with env vars
5. Create `models/User.model.js` — schema as defined above
6. Create `utils/generateToken.js` — sign JWT, set HttpOnly + SameSite=Strict cookie
7. Create `middleware/auth.middleware.js` — verify JWT from cookie, attach `req.user`
8. Create `controllers/auth.controller.js` — `register`, `login`, `logout`, `getMe` functions
9. Create `routes/auth.routes.js` — wire controllers to routes
10. Create `.env.example` with all required env vars (`MONGO_URI`, `JWT_SECRET`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `CLIENT_URL`, `PORT`)

**Relevant Context:** USN regex `/^1ms(23|24|25|26)[a-zA-Z]{2,3}\d{3}$/i`; store USN as uppercase; bcrypt salt rounds 12; JWT expiry 7 days; cookie `maxAge` 7 days.

---

### Sub-Task 2 — Frontend Scaffolding & Login/Register UI
**Status:** [ ] pending

**Intent:** Scaffold the React (Vite) client, configure Tailwind CSS, set up routing, build AuthContext, and implement the Login and Register pages with strict client-side USN validation.

**Expected Outcomes:**
- `npm run dev` starts the Vite dev server without errors
- Tailwind CSS utility classes render correctly
- `/login` and `/register` routes are accessible as public pages
- Submitting an invalid USN shows an inline validation error before any API call is made
- Submitting valid credentials calls `POST /api/auth/login` (or `/register`) and stores the user in AuthContext
- A protected route wrapper redirects unauthenticated users to `/login`

**Todo List:**
1. `npm create vite@latest client -- --template react` in project root; install `tailwindcss`, `postcss`, `autoprefixer`, `axios`, `react-router-dom`, `socket.io-client`
2. Run `npx tailwindcss init -p`; configure `tailwind.config.js` content paths; add Tailwind directives to `index.css`
3. Create `src/api/axiosInstance.js` — Axios instance with `baseURL=/api`, `withCredentials: true`
4. Create `src/context/AuthContext.jsx` — `user` state, `login`, `register`, `logout` functions that call the auth API; `loading` state for initial `/me` check
5. Create `src/components/ProtectedRoute.jsx` — redirect to `/login` if `!user`
6. Create `src/App.jsx` — `BrowserRouter` + `Routes`; wire all page paths (public and protected)
7. Create `src/pages/LoginPage.jsx` — USN + password form; client-side regex check on submit; display inline error; on success navigate to `/`
8. Create `src/pages/RegisterPage.jsx` — USN + name + password form; same regex check; on success navigate to `/`
9. Create `src/components/Navbar.jsx` — links conditional on auth state

**Relevant Context:** USN regex `/^1ms(23|24|25|26)[a-zA-Z]{2,3}\d{3}$/i`; Axios must send `withCredentials: true` for cookies to work cross-origin in dev; configure Vite proxy in `vite.config.js` to forward `/api` to `http://localhost:5000`.

---

### Sub-Task 3 — Item Listings (Backend)
**Status:** [ ] pending

**Intent:** Implement all item CRUD endpoints including Cloudinary image upload and the full feed query with filters.

**Expected Outcomes:**
- `POST /api/items` accepts `multipart/form-data`, uploads image to Cloudinary, saves the item, returns the created document
- `GET /api/items` returns a paginated, filtered list; all filter combinations work correctly
- `PUT /api/items/:id` updates fields; optionally replaces the Cloudinary image (old image deleted)
- `DELETE /api/items/:id` deletes the Cloudinary image then removes the document
- `PATCH /api/items/:id/status` toggles Active ↔ Sold (seller only)
- `GET /api/items/my` returns only the authenticated seller's listings

**Todo List:**
1. Create `middleware/upload.middleware.js` — Multer instance using `multer-storage-cloudinary`; set folder `hostel-bazaar/items`; allowed MIME types: `image/jpeg`, `image/png`, `image/webp`; max file size 5 MB
2. Create `models/Item.model.js` — schema as defined above; add text index on `title` + `description`
3. Create `controllers/item.controller.js` — `createItem`, `getFeed`, `getItem`, `updateItem`, `deleteItem`, `toggleStatus`, `getMyListings`
4. Create `routes/item.routes.js` — apply `auth.middleware` to protected routes; apply `upload.middleware` to POST and PUT
5. Mount item routes in `server.js`

**Relevant Context:** Cloudinary delete uses `cloudinary.uploader.destroy(imagePublicId)`. Feed query must build a MongoDB filter object dynamically from query params; use `$text` operator for search. Ownership check: `item.seller.toString() !== req.user._id.toString()` → 403.

---

### Sub-Task 4 — Item Listings (Frontend)
**Status:** [ ] pending

**Intent:** Build the feed page, item detail page, post/edit form, and my-listings management page.

**Expected Outcomes:**
- Feed page loads and displays active listings as cards
- Search bar and filter panel refetch the feed with updated params
- Item detail page shows all fields and a "Message Seller" button (hidden for own listings)
- Post Item form validates fields and uploads image; redirects to the new item's detail page on success
- Edit Item form is pre-filled; supports image replacement
- My Listings page shows all own ads with Edit / Delete / Mark Sold actions

**Todo List:**
1. Create `src/api/itemApi.js` — `getFeed(params)`, `getItem(id)`, `createItem(formData)`, `updateItem(id, formData)`, `deleteItem(id)`, `toggleStatus(id)`, `getMyListings()`
2. Create `src/components/ItemCard.jsx` — image, title, price badge, condition, category chip, relative date
3. Create `src/components/ItemFilters.jsx` — controlled selects + range inputs + search input; triggers `onFilterChange` callback
4. Create `src/components/ImageUpload.jsx` — file input with preview; enforces 1 image, shows current image on edit
5. Create `src/pages/FeedPage.jsx` — fetch on mount + on filter change; grid of `ItemCard`; loading skeleton + empty state
6. Create `src/pages/ItemDetailPage.jsx` — fetch item by id; show all fields; "Message Seller" CTA calls `POST /api/chat/conversations` then navigates to `/inbox/:convId`
7. Create `src/pages/PostItemPage.jsx` — form with `ImageUpload`; submit as `FormData`; show validation errors
8. Create `src/pages/EditItemPage.jsx` — pre-fetch item, populate form, submit `FormData` to PUT
9. Create `src/pages/MyListingsPage.jsx` — list own ads; Edit (navigate), Delete (confirm modal), Mark Sold (PATCH)

---

### Sub-Task 5 — Real-Time Chat (Backend)
**Status:** [ ] pending

**Intent:** Implement the conversation/message REST endpoints and the Socket.io server with room-based messaging and JWT authentication on the socket handshake.

**Expected Outcomes:**
- `POST /api/chat/conversations` creates or returns the existing conversation for a buyer–item pair
- `GET /api/chat/conversations` returns all conversations for the logged-in user, populated with item title and the other participant's name
- `GET /api/chat/conversations/:id/messages` returns paginated message history
- Connecting to Socket.io without a valid JWT cookie is rejected
- Sending a `send_message` event persists the message, updates `lastMessage`, and broadcasts `receive_message` to the room

**Todo List:**
1. Create `models/Conversation.model.js` — schema + compound unique index + both inbox indexes
2. Create `models/Message.model.js` — schema as defined above
3. Create `controllers/chat.controller.js` — `createOrFetchConversation`, `getInbox`, `getMessages`, `postMessage`
4. Create `routes/chat.routes.js` — all routes protected by `auth.middleware`; mount in `server.js`
5. Create `socket/socket.handler.js` — parse JWT from `socket.handshake.headers.cookie`; disconnect on failure; handle `join_conversation`, `leave_conversation`, `send_message` events; validate sender is a participant before persisting and broadcasting

---

### Sub-Task 6 — Real-Time Chat (Frontend)
**Status:** [ ] pending

**Intent:** Build SocketContext, the Inbox page (conversation list sidebar + chat window), and wire up real-time message delivery.

**Expected Outcomes:**
- `SocketContext` establishes a single Socket.io connection when the user is authenticated and disconnects on logout
- Inbox page shows all conversations sorted by most recent message
- Selecting a conversation joins its Socket.io room, loads message history, and displays messages in a scrollable window
- Sending a message optimistically appends it and emits `send_message`; incoming `receive_message` events append the new message in real time
- Switching conversations leaves the old room and joins the new one

**Todo List:**
1. Create `src/context/SocketContext.jsx` — connect on user login, disconnect on logout, expose `socket` instance via context
2. Create `src/hooks/useSocket.js` — consume `SocketContext`
3. Create `src/api/chatApi.js` — `createOrFetchConversation(itemId)`, `getInbox()`, `getMessages(convId, page)`, `postMessage(convId, text)`
4. Create `src/components/ChatWindow.jsx` — messages list (auto-scroll to bottom), text input + send button; listens for `receive_message` on mount, removes listener on unmount; joins/leaves room on `conversationId` change
5. Create `src/pages/InboxPage.jsx` — fetch inbox on mount; conversation list sidebar; render `ChatWindow` for selected/URL conversation; update `lastMessage` preview on new messages

---

## Environment Variables (.env)

```
# Server
PORT=5000
MONGO_URI=mongodb+srv://...
JWT_SECRET=your_super_secret_key
CLIENT_URL=http://localhost:5173

# Cloudinary
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

---

## Key Security Decisions

| Concern                | Decision                                                                 |
|------------------------|--------------------------------------------------------------------------|
| Auth credential        | USN only — no email, no OAuth                                            |
| Session storage        | JWT in HttpOnly + SameSite=Strict cookie — not localStorage              |
| USN validation         | Regex enforced on both backend controller and frontend form submit         |
| Password storage       | bcrypt, 12 salt rounds                                                   |
| Image upload           | Server-side type + size validation before Cloudinary upload               |
| Ownership enforcement  | Backend checks `item.seller === req.user._id` on edit/delete/toggle      |
| Socket authentication  | JWT cookie verified on handshake — unauthenticated sockets disconnected   |
| Chat participant check | Sender must be buyer or seller of the conversation — validated on server  |

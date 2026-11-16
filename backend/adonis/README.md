# AdonisJS project

to activate: 
```
> cd planmy-api                                               
> npm run dev                                                 
> Open http://localhost:3333 
```   


to run backend 
```
node ace serve --watch
```

# PlanMy Backend API – Developer Memo

**Framework:** AdonisJS 7  
**Database:** PostgreSQL  
**Local development URL:** `http://localhost:3333`  
**API version:** `v1`  
**Base path:** `/api/v1`

---

## 1. Project Setup and Development Commands

Run all commands from the backend project directory:

```powershell
cd backend/adonis/planmy-api
```

### Start the development server

```powershell
npm run dev
```

The API will be available at:

```text
http://localhost:3333
```

### Regenerate AdonisJS controller registry

Run this after creating a new controller:

```powershell
node ace codegen
```

### TypeScript type checking

```powershell
npm run typecheck
```

### Check migration status

```powershell
node ace migration:status
```

### Run pending migrations

```powershell
node ace migration:run
```

**Important:** The existing PostgreSQL database and its tables are already in use. Do not recreate existing tables or modify the auto-generated `database/schema.ts` manually.

---

## 2. Authentication

The API uses AdonisJS token-based authentication with the `api` guard.

Protected endpoints require a valid Bearer Token.

### 2.1 Sign Up

**POST** `/api/v1/auth/signup`

Example body:

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

### 2.2 Login

**POST** `/api/v1/auth/login`

Example body:

```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

The response contains an access token. Copy its value without quotation marks.

Example:

```json
{
  "token": "YOUR_ACCESS_TOKEN"
}
```

The exact response may contain additional user or token fields.

### 2.3 Get Current User Profile

**GET** `/api/v1/account/profile`

Requires authentication.

### 2.4 Logout

**POST** `/api/v1/account/logout`

Requires authentication.

The current access token is revoked.

### Authentication Header

For every protected endpoint, include:

```http
Authorization: Bearer YOUR_ACCESS_TOKEN
Content-Type: application/json
```

In Thunder Client:

1. Open the Auth tab.
2. Select Bearer.
3. Paste the token without quotation marks.
4. Send the request.

---

## 3. Events API

All event endpoints require authentication.

### 3.1 Create Event

**POST** `/api/v1/events`

Example body:

```json
{
  "name": "My Birthday",
  "eventType": "Birthday",
  "date": "2027-06-15",
  "time": "18:30",
  "location": "Zurich",
  "guests": 50,
  "budget": 3000
}
```

Expected status: `201 Created`

### 3.2 Get All User Events

**GET** `/api/v1/events`

Returns events belonging to the authenticated user.

Optional query parameter:

```text
/api/v1/events?status=PLANNING
```

Allowed statuses:

- `PLANNING`
- `CONFIRMED`
- `CANCELLED`

The response includes `bookedServicesCount`, counting confirmed bookings.

### 3.3 Get Event Details

**GET** `/api/v1/events/:id`

Returns the event and its associated bookings, including provider information.

### 3.4 Update Event

**PUT** `/api/v1/events/:id`

Supports partial updates.

Example body:

```json
{
  "name": "Updated Birthday",
  "guests": 60,
  "budget": 3500
}
```

Allowed fields:

- `name`
- `eventType`
- `date`
- `time`
- `location`
- `guests`
- `budget`
- `status`

### 3.5 Delete Event

**DELETE** `/api/v1/events/:id`

An event cannot be deleted if it has bookings.

Expected responses:

- `204 No Content`: successful deletion.
- `404 Not Found`: event does not exist or does not belong to the user.
- `409 Conflict`: event still has bookings.

---

## 4. Providers API

Provider endpoints are public and do not require authentication.

### 4.1 Get All Providers

**GET** `/api/v1/providers`

Optional filters:

| Parameter | Description | Example |
|---|---|---|
| `category` | Provider category | `CATERING` |
| `location` | Location search | `Zurich` |
| `guests` | Minimum guest capacity | `80` |
| `maxPrice` | Maximum provider price | `1500` |

Example with all filters:

```text
GET /api/v1/providers?category=CATERING&location=Zurich&guests=80&maxPrice=1500
```

Results are ordered by rating descending, with null ratings last, then by name ascending.

### 4.2 Get Provider Details

**GET** `/api/v1/providers/:id`

Returns the provider details.

Expected response: `404 Not Found` if the provider does not exist.

---

## 5. Bookings API

Booking endpoints require authentication.

### 5.1 Create Booking

**POST** `/api/v1/events/:id/bookings`

Example:

```text
POST /api/v1/events/1/bookings
```

Example body:

```json
{
  "providerId": 1,
  "serviceDate": "2027-06-15",
  "price": 1200
}
```

The API:

1. Checks that the event belongs to the authenticated user.
2. Locks the event during the database transaction.
3. Rejects bookings for cancelled events.
4. Checks that the provider exists.
5. Creates the booking with status `CONFIRMED`.

Expected responses:

| Status | Meaning |
|---|---|
| `201` | Booking created |
| `400` | Invalid provider ID or price |
| `404` | Event or provider not found |
| `409` | Event cancelled or duplicate booking |

---

## 6. Conversations API

Conversation endpoints require authentication.

### 6.1 Get User Conversations

**GET** `/api/v1/conversations`

Returns conversations associated with events owned by the authenticated user.

Each conversation includes:

- `id`
- `eventId`
- `eventName`
- `providerId`
- `providerName`
- `providerImageUrl`
- `lastMessage`
- `lastMessageAt`

Conversations without messages are also returned. Their `lastMessage` and `lastMessageAt` fields are `null`.

Results are ordered by the latest message, newest first.

---

## 7. Complete Route Overview

| Method | Endpoint | Authentication | Function |
|---|---|---|---|
| POST | `/api/v1/auth/signup` | No | Register |
| POST | `/api/v1/auth/login` | No | Login |
| GET | `/api/v1/account/profile` | Yes | Get profile |
| POST | `/api/v1/account/logout` | Yes | Logout |
| POST | `/api/v1/events` | Yes | Create event |
| GET | `/api/v1/events` | Yes | List user events |
| GET | `/api/v1/events/:id` | Yes | Get event details |
| PUT | `/api/v1/events/:id` | Yes | Update event |
| DELETE | `/api/v1/events/:id` | Yes | Delete event |
| GET | `/api/v1/providers` | No | List providers |
| GET | `/api/v1/providers/:id` | No | Get provider details |
| POST | `/api/v1/events/:id/bookings` | Yes | Create booking |
| GET | `/api/v1/conversations` | Yes | List conversations |

---

## 8. Thunder Client Testing Workflow

Recommended order for testing the API:

1. Register a user using `POST /auth/signup`.
2. Log in using `POST /auth/login`.
3. Copy the access token.
4. Test `GET /account/profile` using Bearer authentication.
5. Create an event using `POST /events`.
6. Browse providers using `GET /providers`.
7. Get provider details using `GET /providers/:id`.
8. Create a booking using `POST /events/:id/bookings`.
9. Retrieve event details using `GET /events/:id`.
10. Retrieve all events using `GET /events`.
11. Retrieve conversations using `GET /conversations`.
12. Test event updates and deletion.

For protected requests, always use the token obtained from login.

---

## 9. Important Development Notes

- The Android Kotlin frontend should remain unchanged during the backend migration.
- Preserve existing API paths and JSON field names.
- The PostgreSQL database is shared with the existing application.
- AdonisJS handles API requests, authentication, validation, database access and responses.
- Provider listing and detail endpoints are public.
- Events, bookings, account and conversations endpoints require authentication.
- Never commit `.env` or expose database credentials or access tokens.
- After adding a controller, run `node ace codegen` and `npm run typecheck`.

**Current migration status:** Authentication, Events, Providers, Bookings and Conversations have been migrated and tested individually. Further endpoints and integration testing may still be required.

# PlanMy Prototype — Backend API Specification

This document describes the proposed API and JSON contracts for the PlanMy university prototype. It is a simple contract for the screens in the final UI, not a description of an already implemented backend.

## 1. Scope and assumptions

-  Endpoints use JSON request and response bodies.
- One photo per provider for now (`imageUrl`).
- T prototype would use one consistent currency.
- Provider listings, ratings, reviews, can use mock data.
- No real payment gateway, invoices, advanced recommendations, push notifications, or real-time messaging are required for the MVP.
- The first screen collects event details. **When the user taps “Find providers”, the backend creates the event and returns its ID.** The app then uses this ID as the context for provider discovery and bookings.

## 2. Main user flow

1. The user fills in the Plan your event screen.
2. Android sends the event details to `POST /events` when the user taps **Find providers**.
3. The backend creates the event (initially with status `PLANNING`) and returns the event ID.
4. Android opens Explore and requests providers using the event ID and relevant filters.
5. The user opens a provider, checks , and adds the provider to the event.
6. Android loads `GET /events/{id}` to show the event details and all booked services.

## 3. Endpoint summary

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/events` | Create an event when the user taps “Find providers” |
| `GET` | `/events` | List the user's events  |
| `GET` | `/events/{id}` | Get event details and all booked services |
| `GET` | `/providers` | Search/filter providers |
| `GET` | `/providers/{id}` | Get provider details |
| `POST` | `/events/{id}/bookings` | Add a provider to an event |
| `GET` | `/conversations` | List conversations for the Messages screen |
| `GET` | `/users/me` | Get the profile screen data |

The `/api` prefix can be omitted if your team already uses a different base path. Use plural resource names (`/events`, not `/event`).

---

## 4. Create event

### `POST /events`

Called when the user taps **Find providers** on the first screen. This both saves the form and creates the event; there is no need to create it earlier.

Request:

```json
{
  "name": "Maya's 30th birthday",
  "eventType": "BIRTHDAY",
  "date": "2026-10-24",
  "time": "18:00",
  "location": "Brooklyn, NY",
  "guests": 40,
  "budget": 6000
}
```

Response: `201 Created`

```json
{
  "id": 1,
  "name": "Maya's 30th birthday",
  "eventType": "BIRTHDAY",
  "date": "2026-10-24",
  "time": "18:00",
  "location": "Brooklyn, NY",
  "guests": 40,
  "budget": 6000,
  "status": "PLANNING"
}
```

Notes:
-  The backend should return the new event ID. Android must retain it while the user browses providers and adds services.
- The event is created only after the user taps “Find providers”.
- If event creation fails, keep the form contents and show an error so the user can retry.

## 5. List events

### `GET /events`

Returns the user's events for the My Events screen.

Optional query parameter: `status`, e.g. `GET /events?status=PLANNING`.

Response:

```json
{
  "events": [
    {
      "id": 1,
      "name": "Maya's 30th birthday",
      "eventType": "BIRTHDAY",
      "date": "2026-10-24",
      "location": "Brooklyn, NY",
      "guests": 40,
      "status": "PLANNING",
      "bookedServicesCount": 3,
      "coverImageUrl": "https://example.com/garden.jpg"
    },
    {
      "id": 2,
      "name": "Baby shower",
      "eventType": "BABY_SHOWER",
      "date": "2026-10-30",
      "location": "Brooklyn, NY",
      "guests": 25,
      "status": "CONFIRMED",
      "bookedServicesCount": 2,
      "coverImageUrl": "https://example.com/baby-shower.jpg"
    }
  ]
}
```

Notes:
- `bookedServicesCount` is calculated from bookings.
- `coverImageUrl` can be the first booked provider's image, or a default event image if no service has been booked yet.
---

## 6. Get event details and all services

### `GET /events/{id}`

Returns event details and all services booked for that event in a single response, so the app does not need a second request to render the event dashboard.

Example: `GET /events/1`

Response:

```json
{
  "id": 1,
  "name": "Maya's 30th birthday",
  "eventType": "BIRTHDAY",
  "date": "2026-10-24",
  "time": "18:00",
  "location": "Brooklyn, NY",
  "guests": 40,
  "status": "PLANNING",
  "services": [
    {
      "bookingId": 501,
      "providerId": 101,
      "providerName": "The Garden Loft",
      "category": "VENUE",
      "imageUrl": "https://example.com/garden.jpg",
      "price": 1800,
      "paidAmount": 900,
      "status": "CONFIRMED"
    },
    {
      "bookingId": 502,
      "providerId": 102,
      "providerName": "Sage & Salt",
      "category": "CATERING",
      "imageUrl": "https://example.com/catering.jpg",
      "price": 1200,
      "paidAmount": 360,
      "status": "CONFIRMED"
    }
  ]
}
```

Notes:
- `services` can be an empty array.
- `price` is the agreed booking price, and `paidAmount` is the amount paid.
- ---

## 7. Search providers

### `GET /providers`

Supports the Explore screen and category filters.

Example:

`GET /providers?eventId=1&category=VENUE&location=Brooklyn`

Optional query parameters:

| Parameter | Meaning |
|---|---|
| `eventId` | Event being planned; allows the backend to use its date, guest count, and budget as context |
| `category` | Provider category, e.g. `VENUE`, `CATERING`, `PHOTOGRAPHY` |
| `location` | City/area filter |
| `guests` | Optional capacity filter; can be derived from the event |
| `maxPrice` | Optional price filter |

Response:

```json
{
  "providers": [
    {
      "id": 101,
      "name": "The Garden Loft",
      "category": "VENUE",
      "description": "A bright loft with a private garden.",
      "imageUrl": "https://example.com/garden.jpg",
      "location": "Brooklyn, NY",
      "rating": 4.9,
      "reviewCount": 128,
      "price": 1800,
      "priceUnit": "PER_EVENT",
      "maxGuests": 80
    },
    {
      "id": 102,
      "name": "Sage & Salt",
      "category": "CATERING",
      "description": "Seasonal catering for special events.",
      "imageUrl": "https://example.com/catering.jpg",
      "location": "Brooklyn, NY",
      "rating": 4.8,
      "reviewCount": 85,
      "price": 30,
      "priceUnit": "PER_GUEST",
      "maxGuests": 100
    }
  ]
}
```

Notes:
- `eventId` is useful because the backend can derive the event's date, location, guest count, and budget. Avoid sending those values repeatedly if they are already stored on the event.
- If the user changes filters, Android can call this endpoint again with updated query parameters.
- `priceUnit` values: `PER_EVENT`, `PER_GUEST`, `PER_HOUR`.
- Provider data and ratings can be seeded locally for the prototype.

---

## 8. Provider details

### `GET /providers/{id}`

Returns details for a provider, with one image only.

Example: `GET /providers/101`

Response:

```json
{
  "id": 101,
  "name": "The Garden Loft",
  "category": "VENUE",
  "description": "A bright loft with a private garden.",
  "imageUrl": "https://example.com/garden.jpg",
  "location": "Williamsburg, Brooklyn",
  "rating": 4.9,
  "reviewCount": 128,
  "price": 1800,
  "priceUnit": "PER_EVENT",
  "maxGuests": 80
}
```

---

## 10. Add a service to an event

### `POST /events/{id}/bookings`

Called when the user taps **Add Service**.

Request:

```json
{
  "providerId": 101,
  "serviceDate": "2026-10-24"
}
```

Response: `201 Created`

```json
{
  "id": 501,
  "eventId": 1,
  "providerId": 101,
  "providerName": "The Garden Loft",
  "providerImageUrl": "https://example.com/garden.jpg",
  "serviceDate": "2026-10-24",
  "price": 1800,
  "paidAmount": 0,
  "status": "CONFIRMED"
}
```

Notes:
- The backend looks up the provider price; the client does not submit the price.
- For the prototype, adding a service can immediately create a `CONFIRMED` booking.
- If the same provider should not be added twice to the same event, validate that on the backend.

---

## 12. Profile

### `GET /users/me`

Response:

```json
{
  "id": 1,
  "name": "Maya Bennett",
  "email": "maya@example.com",
  "profileImageUrl": "https://example.com/maya.jpg",
  "upcomingEventsCount": 1,
  "bookingsCount": 3
}
```

For a demo, this can return a seeded user; full authentication and profile editing can be out of scope if the course permits it.

---

## 13. Minimal database tables

Six main tables are enough for the core prototype:

| Table | Important fields |
|---|---|
| `users` | `id`, `name`, `email`, `profile_image_url` |
| `events` | `id`, `user_id`, `name`, `event_type`, `date`, `time`, `location`, `guests`, `budget`, `status` |
| `providers` | `id`, `name`, `category`, `description`, `location`, `price`, `price_unit`, `rating`, `image_url`, `max_guests` |
| `bookings` | `id`, `event_id`, `provider_id`, `service_date`, `price`, `paid_amount`, `status` |
| `conversations` | `id`, `event_id`, `provider_id` |
| `messages` | `id`, `conversation_id`, `sender_type`, `text`, `created_at` |

Provider reviews can be hardcoded/seeded for the prototype rather than stored in separate tables. Availability is out of scope for this prototype.

## 14. Status values

Keep status values small and consistent.

- Event `status`: `PLANNING`, `CONFIRMED`, `CANCELLED`.
- Booking `status`: `CONFIRMED`, `CANCELLED`.
- Provider `category`: `VENUE`, `CATERING`, `PHOTOGRAPHY`, `ENTERTAINMENT`, `TRANSPORTATION`, `DECORATIONS`, `CAKES`.

## 15. Common API behavior

- Use JSON for request and response bodies.
- Return `201 Created` after creating an event or booking.
- Return `200 OK` for successful GET requests.
- Return `400 Bad Request` for invalid input and `404 Not Found` for missing records.
-  Keep event IDs returned by `POST /events` in Android state while the user explores providers and books services.
## 16. MVP implementation order

1. `POST /events`
2. `GET /providers`
3. `GET /providers/{id}`
5. `POST /events/{id}/bookings`
6. `GET /events/{id}`
7. `GET /events`
8. `GET /conversations` and message endpoints if needed
9. `GET /users/me`

This supports the main flow: **fill in event details → tap Find providers (event is created) → explore providers → view details → add services → view the event and its booked services**.

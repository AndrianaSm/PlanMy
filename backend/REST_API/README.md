## REST API

A simple REST API to handle the core operations required by the PlanMy MVP, allowing users to create, retrieve, update, and delete events, browse providers, add services to events, and retrieve user and conversation data.

### Endpoints
The following endpoints are required for the MVP:

1. `POST /events` — Create an event when the user requests to find providers for a specific event type.
2. `GET /providers` — Browse and filter providers, optionally using event details as context.
3. `GET /providers/{id}` — Retrieve the details of a specific provider.
4. `POST /events/{id}/bookings` — Add a provider's service to an existing event.
5. `GET /events/{id}` — Retrieve event details and all services booked for that event.
6. `GET /events` — Retrieve the user's events.
7. `GET /conversations` — Retrieve the user's conversations for the Messages screen.
8. `GET /users/me` — Retrieve the current user's profile information.
9. `PUT /events/{id}` — Update the details of an existing event, such as its date, time, location, number of guests, or budget.
10. `DELETE /events/{id}` — Delete an existing event that the user no longer needs.

### Technologies
API implemented using Node.js and Express.js.

Installation needed:
```
npm init -y
npm install express better-sqlite3 cors helmet
npm install --save-dev nodemon
```

# Databse
## Tech and services
Tables originally made wit PostgreSQL on DBeaver. Later migrated on Supabase to be accessible online.

## Tables

# PlanMy — Database Schema

## 1. `users`

Stores registered users of the platform.

| Attribute | Data Type | Constraints | Description |
|---|---|---|---|
| `id` | `BIGINT` | PK, Identity | Unique user identifier |
| `name` | `VARCHAR(120)` | NOT NULL | User's name |
| `email` | `VARCHAR(255)` | NOT NULL, UNIQUE | Unique email address |
| `profile_image_url` | `TEXT` | Nullable | URL of the user's profile image |

## 2. `events`

Stores events created by users.

| Attribute | Data Type | Constraints | Description |
|---|---|---|---|
| `id` | `BIGINT` | PK, Identity | Unique event identifier |
| `user_id` | `BIGINT` | FK → `users.id`, NOT NULL | User who owns the event |
| `name` | `VARCHAR(200)` | NOT NULL | Event name |
| `event_type` | `VARCHAR(40)` | NOT NULL | Type of event |
| `date` | `DATE` | NOT NULL | Event date |
| `time` | `TIME` | NOT NULL | Event time |
| `location` | `VARCHAR(255)` | NOT NULL | Event location |
| `guests` | `INTEGER` | NOT NULL, CHECK > 0 | Number of guests |
| `budget` | `NUMERIC(12,2)` | NOT NULL, CHECK >= 0 | Planned event budget |
| `status` | `VARCHAR(20)` | NOT NULL, DEFAULT `PLANNING` | Current event status |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, DEFAULT `NOW()` | Date and time the event was created |

Allowed values for `status`: `PLANNING`, `CONFIRMED`, `CANCELLED`.

## 3. `providers`

Stores service providers available for events.

| Attribute | Data Type | Constraints | Description |
|---|---|---|---|
| `id` | `BIGINT` | PK, Identity | Unique provider identifier |
| `name` | `VARCHAR(200)` | NOT NULL | Provider or business name |
| `category` | `VARCHAR(40)` | NOT NULL | Service category |
| `description` | `TEXT` | NOT NULL | Description of the service |
| `image_url` | `TEXT` | Nullable | URL of the provider's image |
| `location` | `VARCHAR(255)` | NOT NULL | Provider's location |
| `rating` | `NUMERIC(2,1)` | NOT NULL, DEFAULT `0` | Average provider rating |
| `review_count` | `INTEGER` | NOT NULL, DEFAULT `0` | Number of reviews |
| `price` | `NUMERIC(12,2)` | NOT NULL, CHECK >= 0 | Service price |
| `price_unit` | `VARCHAR(20)` | NOT NULL, CHECK | Pricing unit |
| `max_guests` | `INTEGER` | Nullable, CHECK > 0 | Maximum number of guests supported |

Allowed values for `price_unit`: `PER_EVENT`, `PER_GUEST`, `PER_HOUR`.

## 4. `bookings`

Associates an event with a provider and stores booking details.

| Attribute | Data Type | Constraints | Description |
|---|---|---|---|
| `id` | `BIGINT` | PK, Identity | Unique booking identifier |
| `event_id` | `BIGINT` | FK → `events.id`, NOT NULL | Associated event |
| `provider_id` | `BIGINT` | FK → `providers.id`, NOT NULL | Booked provider |
| `service_date` | `DATE` | NOT NULL | Date of the service |
| `price` | `NUMERIC(12,2)` | NOT NULL, CHECK >= 0 | Agreed service price |
| `paid_amount` | `NUMERIC(12,2)` | NOT NULL, DEFAULT `0`, CHECK >= 0 AND <= price | Amount already paid |
| `status` | `VARCHAR(20)` | NOT NULL, DEFAULT `CONFIRMED` | Current booking status |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, DEFAULT `NOW()` | Date and time the booking was created |

Allowed values for `status`: `CONFIRMED`, `CANCELLED`.

Additional constraint: `UNIQUE(event_id, provider_id)` ensures that the same provider can only have one booking record for a given event.

Design note: To support a provider-request and provider-confirmation workflow, consider adding `REQUESTED` and `DECLINED` to the allowed booking statuses and updating the default status and API logic accordingly.

## 5. `conversations`

Stores conversations associated with an event and a provider.

| Attribute | Data Type | Constraints | Description |
|---|---|---|---|
| `id` | `BIGINT` | PK, Identity | Unique conversation identifier |
| `event_id` | `BIGINT` | FK → `events.id`, NOT NULL | Associated event |
| `provider_id` | `BIGINT` | FK → `providers.id`, NOT NULL | Participating provider |

Additional constraint: `UNIQUE(event_id, provider_id)` allows only one conversation for each event-provider pair.

Deletion behavior:
- Deleting an event automatically deletes its conversations (`ON DELETE CASCADE`).
- A provider cannot be deleted while associated conversations exist (`ON DELETE RESTRICT`).

## 6. `messages`

Stores messages sent within conversations.

| Attribute | Data Type | Constraints | Description |
|---|---|---|---|
| `id` | `BIGINT` | PK, Identity | Unique message identifier |
| `conversation_id` | `BIGINT` | FK → `conversations.id`, NOT NULL | Parent conversation |
| `sender_type` | `VARCHAR(20)` | NOT NULL, CHECK | Type of sender |
| `text` | `TEXT` | NOT NULL | Message content |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, DEFAULT `NOW()` | Date and time the message was sent |

Allowed values for `sender_type`: `USER`, `PROVIDER`.

Deleting a conversation automatically deletes its associated messages (`ON DELETE CASCADE`).

## 7. Database Indexes

Indexes improve the performance of common queries.

| Index Name | Table | Indexed Attributes | Purpose |
|---|---|---|---|
| `idx_events_user_date` | `events` | `(user_id, date)` | Retrieve a user's events by date |
| `idx_providers_category` | `providers` | `(category)` | Filter providers by category |
| `idx_bookings_event` | `bookings` | `(event_id)` | Retrieve bookings for an event |
| `idx_conversations_event` | `conversations` | `(event_id)` | Retrieve conversations for an event |

Primary keys and `UNIQUE` constraints also create their corresponding unique indexes in PostgreSQL.

## 8. Entity Relationships

- `users` 1:N `events` — A user can create multiple events.
- `events` 1:N `bookings` — An event can have multiple booking records.
- `providers` 1:N `bookings` — A provider can be associated with multiple bookings.
- `events` 1:N `conversations` — An event can have multiple conversations.
- `providers` 1:N `conversations` — A provider can participate in multiple conversations.
- `conversations` 1:N `messages` — A conversation can contain multiple messages.

## 9. Recommended Future Improvements

- Add provider accounts linked to authenticated users.
- Add `REQUESTED` and `DECLINED` booking statuses.
- Validate that provider ratings are between 0 and 5.
- Ensure `review_count` cannot be negative.
- Define authorization rules for events, bookings, and conversations.
- Add an external authentication identifier such as `auth_subject` when integrating Supabase Auth, Google, or Apple.

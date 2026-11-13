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


# PlanMy API – Authentication Guide

This document explains how to test and use the authentication endpoints of the PlanMy backend, developed with AdonisJS.

## 1. Start the Backend

Open a terminal in the AdonisJS project directory:

```bash
cd backend/adonis/planmy-api
node ace serve --watch
```

The backend will be available at:

```text
http://localhost:3333
```

## 2. Available Routes

All authentication routes use the `/api/v1` prefix.

| Method | Endpoint | Authentication | Description |
|---|---|---|---|
| POST | `/api/v1/auth/signup` | Not required | Register a new user |
| POST | `/api/v1/auth/login` | Not required | Log in an existing user |
| GET | `/api/v1/account/profile` | Required | Retrieve the authenticated user's profile |
| POST | `/api/v1/account/logout` | Required | Log out the current user |

## 3. Testing with Thunder Client

You can test the endpoints using the **Thunder Client** extension in Visual Studio Code.

For each request:

1. Create a new request.
2. Select the appropriate HTTP method.
3. Enter the endpoint URL.
4. For requests with a body, select `Body → JSON`.
5. Click **Send** to execute the request.

### 3.1 Sign Up – Register a New User

**Request**

```http
POST http://localhost:3333/api/v1/auth/signup
Content-Type: application/json
```

**Body**

```json
{
  "name": "Mario Rossi",
  "email": "mario@example.com",
  "password": "Password123",
  "passwordConfirmation": "Password123"
}
```

**Expected response**

The response contains:
- `user`: information about the newly registered user.
- `token`: an access token used for subsequent authenticated requests.

Save the returned token.

### 3.2 Login – Authenticate an Existing User

**Request**

```http
POST http://localhost:3333/api/v1/auth/login
Content-Type: application/json
```

**Body**

```json
{
  "email": "mario@example.com",
  "password": "Password123"
}
```

**Expected response**

The response contains the user's information and a new access token.

### 3.3 Profile – Retrieve the User Profile

This endpoint requires a valid access token.

**Request**

```http
GET http://localhost:3333/api/v1/account/profile
Authorization: Bearer YOUR_ACCESS_TOKEN
```

In Thunder Client:

1. Open the **Auth** tab.
2. Select **Bearer**.
3. Paste the token received from signup or login.

**Expected response**

Returns the profile information of the authenticated user.

### 3.4 Logout – Sign Out

**Request**

```http
POST http://localhost:3333/api/v1/account/logout
Authorization: Bearer YOUR_ACCESS_TOKEN
```

The backend deletes the current access token from the database. The revoked token can no longer be used to access protected endpoints.

## 4. Authentication Flow

The typical authentication flow is:

1. **Sign Up:** The user creates an account and receives an access token.
2. **Login:** The user authenticates and receives an access token.
3. **Authenticated Requests:** The frontend includes the token in the `Authorization` header when accessing protected endpoints.
4. **Logout:** The backend revokes the current access token.

```text
Android App
    |
    | POST /api/v1/auth/signup
    | POST /api/v1/auth/login
    v
AdonisJS Backend
    |
    | Validates credentials
    | Creates access token
    v
PostgreSQL
    |
    | Returns token to frontend
    v
Android App
    |
    | Authorization: Bearer <token>
    v
Protected API Routes
    |
    | GET /api/v1/account/profile
    | POST /api/v1/account/logout
    v
AdonisJS Backend
```

## 5. Android Frontend Integration

After signup or login, the Android application must save the returned access token and reuse it for subsequent authenticated requests.

Add the following header to every protected request:

```http
Authorization: Bearer <ACCESS_TOKEN>
```

The token should be stored securely, for example using **Android EncryptedSharedPreferences** or an equivalent solution based on Android Keystore.

When the user logs out:

1. Call `POST /api/v1/account/logout`.
2. Remove the locally stored access token.
3. Redirect the user to the login screen.

## 6. Important Notes

- Passwords are stored as hashes, never as plain text.
- Access tokens must remain private and must not be shared.
- The `profile` and `logout` endpoints require authentication.
- Requests with missing, invalid, or revoked tokens must be rejected.
- The Android application communicates with the AdonisJS backend, which handles all database operations through PostgreSQL.
- The backend is responsible for authentication, token management, and access control.


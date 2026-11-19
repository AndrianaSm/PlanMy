package com.example.planmy.data

import io.ktor.client.HttpClient
import io.ktor.client.call.body
import io.ktor.client.request.delete
import io.ktor.client.request.get
import io.ktor.client.request.header
import io.ktor.client.request.parameter
import io.ktor.client.request.post
import io.ktor.client.request.put
import io.ktor.client.request.setBody
import io.ktor.client.statement.HttpResponse
import io.ktor.http.ContentType
import io.ktor.http.HttpHeaders
import io.ktor.http.contentType

expect fun platformHttpClient(): HttpClient

class ApiException(val status: Int, message: String) : Exception(message)

class PlanMyApi(
    private val tokenStore: TokenStore = TokenStore(),
    private val client: HttpClient = platformHttpClient(),
) {
    suspend fun login(email: String, password: String): AuthResponse =
        request<AuthResponse>("POST", "/api/v1/auth/login", mapOf("email" to email, "password" to password))
            .also { tokenStore.write(it.token) }

    suspend fun signup(name: String, email: String, password: String, passwordConfirmation: String): AuthResponse =
        request<AuthResponse>(
            "POST",
            "/api/v1/auth/signup",
            mapOf(
                "name" to name,
                "email" to email,
                "password" to password,
                "passwordConfirmation" to passwordConfirmation,
            ),
        ).also { tokenStore.write(it.token) }

    suspend fun profile(): User = request("GET", "/api/v1/account/profile")

    suspend fun logout() {
        request<HttpResponse>("POST", "/api/v1/account/logout")
        tokenStore.clear()
    }

    suspend fun events(status: EventStatus? = null): List<Event> =
        request("GET", "/api/v1/events", query = status?.let { mapOf("status" to it.name) } ?: emptyMap())

    suspend fun event(id: Int): Event = request("GET", "/api/v1/events/$id")

    suspend fun createEvent(payload: CreateEventRequest): Event =
        request("POST", "/api/v1/events", payload)

    suspend fun updateEvent(id: Int, payload: UpdateEventRequest): Event =
        request("PUT", "/api/v1/events/$id", payload)

    suspend fun deleteEvent(id: Int) {
        request<HttpResponse>("DELETE", "/api/v1/events/$id")
    }

    suspend fun providers(
        category: String? = null,
        location: String? = null,
        guests: Int? = null,
        maxPrice: Double? = null,
    ): List<Provider> = request(
        "GET",
        "/api/v1/providers",
        query = buildMap {
            category?.let { put("category", it) }
            location?.let { put("location", it) }
            guests?.let { put("guests", it.toString()) }
            maxPrice?.let { put("maxPrice", it.toString()) }
        },
    )

    suspend fun provider(id: Int): Provider = request("GET", "/api/v1/providers/$id")

    suspend fun createBooking(eventId: Int, payload: CreateBookingRequest): Booking =
        request("POST", "/api/v1/events/$eventId/bookings", payload)

    suspend fun conversations(): List<Conversation> = request("GET", "/api/v1/conversations")

    private suspend inline fun <reified T> request(
        method: String,
        path: String,
        body: Any? = null,
        query: Map<String, String> = emptyMap(),
    ): T {
        val response = when (method) {
            "GET" -> client.get(apiBaseUrl + path) {
                tokenStore.read()?.let { header(HttpHeaders.Authorization, "Bearer $it") }
                query.forEach { (key, value) -> parameter(key, value) }
            }
            "POST" -> client.post(apiBaseUrl + path) { configure(body, query) }
            "PUT" -> client.put(apiBaseUrl + path) { configure(body, query) }
            "DELETE" -> client.delete(apiBaseUrl + path) { configure(body, query) }
            else -> error("Unsupported HTTP method")
        }
        if (response.status.value !in 200..299) {
            val message = response.body<String>().ifBlank { "Request failed (${response.status.value})" }
            throw ApiException(response.status.value, message)
        }
        return if (T::class == HttpResponse::class) response as T else response.body()
    }

    private fun io.ktor.client.request.HttpRequestBuilder.configure(body: Any?, query: Map<String, String>) {
        tokenStore.read()?.let { header(HttpHeaders.Authorization, "Bearer $it") }
        query.forEach { (key, value) -> parameter(key, value) }
        if (body != null) {
            contentType(ContentType.Application.Json)
            setBody(body)
        }
    }
}

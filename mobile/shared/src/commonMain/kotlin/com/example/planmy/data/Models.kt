package com.example.planmy.data

import kotlinx.serialization.Serializable

@Serializable
data class User(
    val id: Int,
    val name: String,
    val email: String,
    val createdAt: String? = null,
    val updatedAt: String? = null,
    val initials: String? = null,
)

@Serializable
data class AuthResponse(val user: User, val token: String)

@Serializable
data class Event(
    val id: Int,
    val userId: Int? = null,
    val name: String,
    val eventType: String,
    val date: String,
    val time: String,
    val location: String,
    val guests: Int,
    val budget: String,
    val status: EventStatus = EventStatus.PLANNING,
    val createdAt: String? = null,
    val bookedServicesCount: Int = 0,
    val bookings: List<Booking> = emptyList(),
)

@Serializable
enum class EventStatus { PLANNING, CONFIRMED, CANCELLED }

@Serializable
data class Provider(
    val id: Int,
    val name: String,
    val category: String,
    val location: String? = null,
    val description: String? = null,
    val imageUrl: String? = null,
    val price: String? = null,
    val priceUnit: String? = null,
    val rating: Double? = null,
    val reviewCount: Int? = null,
    val maxGuests: Int? = null,
)

@Serializable
data class Booking(
    val id: Int,
    val eventId: Int? = null,
    val providerId: Int,
    val providerName: String,
    val category: String? = null,
    val imageUrl: String? = null,
    val serviceDate: String? = null,
    val price: String,
    val paidAmount: String? = null,
    val status: String,
    val createdAt: String? = null,
)

@Serializable
data class Conversation(
    val id: Int,
    val eventId: Int,
    val eventName: String,
    val providerId: Int,
    val providerName: String,
    val providerImageUrl: String? = null,
    val lastMessage: String? = null,
    val lastMessageAt: String? = null,
)

@Serializable
data class CreateEventRequest(
    val name: String,
    val eventType: String,
    val date: String,
    val time: String,
    val location: String,
    val guests: Int,
    val budget: Double,
)

@Serializable
data class UpdateEventRequest(
    val name: String? = null,
    val eventType: String? = null,
    val date: String? = null,
    val time: String? = null,
    val location: String? = null,
    val guests: Int? = null,
    val budget: Double? = null,
    val status: EventStatus? = null,
)

@Serializable
data class CreateBookingRequest(
    val providerId: Int,
    val serviceDate: String? = null,
    val price: Double,
)

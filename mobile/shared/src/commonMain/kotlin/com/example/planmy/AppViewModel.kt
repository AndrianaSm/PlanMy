package com.example.planmy

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.planmy.data.ApiException
import com.example.planmy.data.AuthResponse
import com.example.planmy.data.CreateBookingRequest
import com.example.planmy.data.CreateEventRequest
import com.example.planmy.data.Event
import com.example.planmy.data.EventStatus
import com.example.planmy.data.PlanMyApi
import com.example.planmy.data.Provider
import com.example.planmy.data.TokenStore
import com.example.planmy.data.UpdateEventRequest
import com.example.planmy.data.User
import com.example.planmy.data.Conversation
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class AppState(
    val user: User? = null,
    val events: List<Event> = emptyList(),
    val selectedEvent: Event? = null,
    val providers: List<Provider> = emptyList(),
    val selectedProvider: Provider? = null,
    val conversations: List<Conversation> = emptyList(),
    val loading: Boolean = false,
    val error: String? = null,
    val authenticated: Boolean = TokenStore().read() != null,
)

class AppViewModel(private val api: PlanMyApi = PlanMyApi()) : ViewModel() {
    private val mutableState = MutableStateFlow(AppState())
    val state: StateFlow<AppState> = mutableState.asStateFlow()

    fun clearError() { mutableState.value = mutableState.value.copy(error = null) }

    fun login(email: String, password: String, onSuccess: () -> Unit) =
        launchRequest(onSuccess) { api.login(email, password); mutableState.value = mutableState.value.copy(authenticated = true); loadProfile() }

    fun signup(name: String, email: String, password: String, confirmation: String, onSuccess: () -> Unit) =
        launchRequest(onSuccess) { api.signup(name, email, password, confirmation); mutableState.value = mutableState.value.copy(authenticated = true); loadProfile() }

    fun logout(onComplete: () -> Unit) = launchRequest(onComplete) {
        api.logout()
        mutableState.value = mutableState.value.copy(authenticated = false, user = null, events = emptyList())
    }

    fun loadProfile() = launchRequest { mutableState.value = mutableState.value.copy(user = api.profile()) }

    fun loadEvents() = launchRequest { mutableState.value = mutableState.value.copy(events = api.events()) }

    fun loadEvent(id: Int) = launchRequest {
        mutableState.value = mutableState.value.copy(selectedEvent = api.event(id))
    }

    fun saveEvent(payload: CreateEventRequest, onSuccess: (Event) -> Unit) =
        launchRequest { onSuccess(api.createEvent(payload)) }

    fun updateEvent(id: Int, payload: UpdateEventRequest, onSuccess: (Event) -> Unit) =
        launchRequest { onSuccess(api.updateEvent(id, payload)) }

    fun deleteEvent(id: Int, onSuccess: () -> Unit) =
        launchRequest { api.deleteEvent(id); onSuccess() }

    fun loadProviders(category: String? = null, location: String? = null, guests: Int? = null, maxPrice: Double? = null) =
        launchRequest { mutableState.value = mutableState.value.copy(providers = api.providers(category, location, guests, maxPrice)) }

    fun loadProvider(id: Int) = launchRequest {
        mutableState.value = mutableState.value.copy(selectedProvider = api.provider(id))
    }

    fun addBooking(eventId: Int, payload: CreateBookingRequest, onSuccess: () -> Unit) =
        launchRequest { api.createBooking(eventId, payload); loadEvent(eventId); onSuccess() }

    fun loadConversations() = launchRequest {
        mutableState.value = mutableState.value.copy(conversations = api.conversations())
    }

    private fun launchRequest(onSuccess: (() -> Unit)? = null, request: suspend () -> Unit) {
        viewModelScope.launch {
            mutableState.value = mutableState.value.copy(loading = true, error = null)
            runCatching { request() }
                .onFailure { error ->
                    val message = (error as? ApiException)?.message ?: error.message ?: "Something went wrong"
                    mutableState.value = mutableState.value.copy(error = message)
                }
                .onSuccess { onSuccess?.invoke() }
            mutableState.value = mutableState.value.copy(loading = false)
        }
    }
}

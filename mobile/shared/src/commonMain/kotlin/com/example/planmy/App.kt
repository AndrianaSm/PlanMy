package com.example.planmy

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.runtime.collectAsState
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import com.example.planmy.data.CreateBookingRequest
import com.example.planmy.data.CreateEventRequest
import com.example.planmy.data.Event
import com.example.planmy.data.EventStatus
import com.example.planmy.data.Provider

private val Lavender = Color(0xFF7667C8)
private val WarmWhite = Color(0xFFFFFBF7)

private enum class Screen { LOGIN, SIGNUP, HOME, CREATE_EVENT, EVENTS, EVENT_DETAILS, EDIT_EVENT, PROVIDERS, PROVIDER_DETAILS, CONVERSATIONS, PROFILE }

@Composable
fun App() {
    MaterialTheme(colorScheme = MaterialTheme.colorScheme.copy(primary = Lavender, background = WarmWhite)) {
        val viewModel = remember { AppViewModel() }
        val state by viewModel.state.collectAsState()
        var screen by remember { mutableStateOf(if (state.authenticated) Screen.HOME else Screen.LOGIN) }
        var selectedId by remember { mutableStateOf(0) }
        var selectedProviderId by remember { mutableStateOf(0) }
        LaunchedEffect(state.authenticated) {
            if (state.authenticated) {
                viewModel.loadProfile()
                viewModel.loadEvents()
            }
        }
        if (state.loading) {
            CircularProgressIndicator(modifier = Modifier.padding(24.dp))
        }
        Column(Modifier.fillMaxSize().background(WarmWhite).verticalScroll(rememberScrollState()).padding(20.dp)) {
            Text("PlanMy", style = MaterialTheme.typography.headlineMedium, color = Lavender)
            state.error?.let { Text(it, color = MaterialTheme.colorScheme.error, modifier = Modifier.padding(vertical = 8.dp)) }
            when (screen) {
                Screen.LOGIN -> LoginScreen(
                    onLogin = { email, password -> viewModel.login(email, password) { screen = Screen.HOME } },
                    onSignup = { screen = Screen.SIGNUP },
                )
                Screen.SIGNUP -> SignupScreen(
                    onSignup = { name, email, password, confirmation ->
                        viewModel.signup(name, email, password, confirmation) { screen = Screen.HOME }
                    },
                    onBack = { screen = Screen.LOGIN },
                )
                Screen.HOME -> HomeScreen(
                    onEvents = { viewModel.loadEvents(); screen = Screen.EVENTS },
                    onCreate = { screen = Screen.CREATE_EVENT },
                    onProviders = { viewModel.loadProviders(); screen = Screen.PROVIDERS },
                    onConversations = { viewModel.loadConversations(); screen = Screen.CONVERSATIONS },
                    onProfile = { screen = Screen.PROFILE },
                )
                Screen.CREATE_EVENT -> CreateEventScreen(
                    onSave = { payload -> viewModel.saveEvent(payload) { viewModel.loadEvents(); screen = Screen.EVENTS } },
                    onBack = { screen = Screen.HOME },
                )
                Screen.EVENTS -> EventsScreen(
                    events = state.events,
                    onEvent = { selectedId = it; viewModel.loadEvent(it); screen = Screen.EVENT_DETAILS },
                    onCreate = { screen = Screen.CREATE_EVENT },
                    onBack = { screen = Screen.HOME },
                )
                Screen.EVENT_DETAILS -> EventDetailsScreen(
                    event = state.selectedEvent,
                    onBack = { screen = Screen.EVENTS },
                    onEdit = { screen = Screen.EDIT_EVENT },
                    onDelete = { id -> viewModel.deleteEvent(id) { viewModel.loadEvents(); screen = Screen.EVENTS } },
                    onProviders = { viewModel.loadProviders(); screen = Screen.PROVIDERS },
                )
                Screen.EDIT_EVENT -> EditEventScreen(
                    event = state.selectedEvent,
                    onBack = { screen = Screen.EVENT_DETAILS },
                    onSave = { id, payload -> viewModel.updateEvent(id, payload) { viewModel.loadEvent(id); screen = Screen.EVENT_DETAILS } },
                )
                Screen.PROVIDERS -> ProvidersScreen(
                    providers = state.providers,
                    onProvider = { selectedProviderId = it; viewModel.loadProvider(it); screen = Screen.PROVIDER_DETAILS },
                    onFilter = { category, location, guests, maxPrice -> viewModel.loadProviders(category, location, guests, maxPrice) },
                    onBack = { screen = Screen.HOME },
                )
                Screen.PROVIDER_DETAILS -> ProviderDetailsScreen(
                    provider = state.selectedProvider,
                    events = state.events,
                    onBack = { screen = Screen.PROVIDERS },
                    onBook = { eventId, price, date ->
                        viewModel.addBooking(eventId, CreateBookingRequest(selectedProviderId, date.ifBlank { null }, price)) {
                            viewModel.loadEvents()
                            screen = Screen.EVENT_DETAILS
                            selectedId = eventId
                            viewModel.loadEvent(eventId)
                        }
                    },
                )
                Screen.CONVERSATIONS -> ConversationsScreen(state.conversations, onBack = { screen = Screen.HOME })
                Screen.PROFILE -> ProfileScreen(state.user, onLogout = {
                    viewModel.logout { screen = Screen.LOGIN }
                }, onBack = { screen = Screen.HOME })
            }
            if (state.error != null) TextButton(onClick = viewModel::clearError) { Text("Dismiss") }
        }
    }
}

@Composable private fun HomeScreen(onEvents: () -> Unit, onCreate: () -> Unit, onProviders: () -> Unit, onConversations: () -> Unit, onProfile: () -> Unit) {
    Text("Plan your next event", style = MaterialTheme.typography.headlineSmall)
    Spacer(Modifier.height(20.dp))
    ActionButton("Plan an event", onCreate)
    ActionButton("My events", onEvents)
    ActionButton("Explore providers", onProviders)
    ActionButton("Conversations", onConversations)
    ActionButton("Profile", onProfile)
}

@Composable private fun LoginScreen(onLogin: (String, String) -> Unit, onSignup: () -> Unit) {
    var email by remember { mutableStateOf("") }; var password by remember { mutableStateOf("") }
    AuthFields("Welcome back", email, { email = it }, password, { password = it }, "Log in", { onLogin(email, password) })
    TextButton(onClick = onSignup) { Text("Create an account") }
}

@Composable private fun SignupScreen(onSignup: (String, String, String, String) -> Unit, onBack: () -> Unit) {
    var name by remember { mutableStateOf("") }; var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }; var confirmation by remember { mutableStateOf("") }
    Column {
        Text("Create your account", style = MaterialTheme.typography.headlineSmall)
        Input("Name", name) { name = it }; Input("Email", email) { email = it }
        Input("Password", password) { password = it }; Input("Confirm password", confirmation) { confirmation = it }
        ActionButton("Sign up") { onSignup(name, email, password, confirmation) }; TextButton(onClick = onBack) { Text("Back to login") }
    }
}

@Composable private fun AuthFields(title: String, email: String, setEmail: (String) -> Unit, password: String, setPassword: (String) -> Unit, action: String, submit: () -> Unit) {
    Column {
        Text(title, style = MaterialTheme.typography.headlineSmall); Input("Email", email, setEmail); Input("Password", password, setPassword); ActionButton(action, submit)
    }
}

@Composable private fun EventsScreen(events: List<Event>, onEvent: (Int) -> Unit, onCreate: () -> Unit, onBack: () -> Unit) {
    Header("My events", onBack); ActionButton("Create event", onCreate)
    if (events.isEmpty()) Text("No events yet.", modifier = Modifier.padding(vertical = 20.dp))
    events.forEach { event -> Card(Modifier.fillMaxWidth().padding(vertical = 6.dp).clickable { onEvent(event.id) }) { Column(Modifier.padding(16.dp)) { Text(event.name, style = MaterialTheme.typography.titleLarge); Text("${event.date} · ${event.location}"); Text("${event.status} · ${event.bookedServicesCount} booked services") } } }
}

@Composable private fun CreateEventScreen(onSave: (CreateEventRequest) -> Unit, onBack: () -> Unit) {
    var name by remember { mutableStateOf("") }; var type by remember { mutableStateOf("") }; var date by remember { mutableStateOf("") }
    var time by remember { mutableStateOf("") }; var location by remember { mutableStateOf("") }; var guests by remember { mutableStateOf("") }; var budget by remember { mutableStateOf("") }
    Header("Plan an event", onBack); Input("Name", name) { name = it }; Input("Event type", type) { type = it }; Input("Date (YYYY-MM-DD)", date) { date = it }; Input("Time (HH:MM)", time) { time = it }; Input("Location", location) { location = it }; Input("Guests", guests) { guests = it }; Input("Budget", budget) { budget = it }
    ActionButton("Save event") { onSave(CreateEventRequest(name, type, date, time, location, guests.toIntOrNull() ?: 0, budget.toDoubleOrNull() ?: 0.0)) }
}

@Composable private fun EventDetailsScreen(event: Event?, onBack: () -> Unit, onEdit: () -> Unit, onDelete: (Int) -> Unit, onProviders: () -> Unit) {
    Header("Event details", onBack)
    if (event == null) return
    Text(event.name, style = MaterialTheme.typography.headlineSmall); Text("${event.date} at ${event.time}"); Text(event.location); Text("${event.guests} guests · budget ${event.budget}"); Text(event.status.name)
    OutlinedButton(onClick = onEdit) { Text("Edit event") }
    ActionButton("Add a provider", onProviders)
    Text("Bookings", style = MaterialTheme.typography.titleLarge, modifier = Modifier.padding(top = 20.dp))
    if (event.bookings.isEmpty()) Text("No bookings yet.") else event.bookings.forEach { Card(Modifier.fillMaxWidth().padding(vertical = 4.dp)) { Column(Modifier.padding(12.dp)) { Text(it.providerName); Text("${it.category ?: ""} · ${it.price} · ${it.status}") } } }
    if (event.bookings.isEmpty()) OutlinedButton(onClick = { onDelete(event.id) }) { Text("Delete event") }
}

@Composable private fun EditEventScreen(event: Event?, onBack: () -> Unit, onSave: (Int, com.example.planmy.data.UpdateEventRequest) -> Unit) {
    if (event == null) return
    var name by remember { mutableStateOf(event.name) }; var type by remember { mutableStateOf(event.eventType) }; var date by remember { mutableStateOf(event.date) }
    var time by remember { mutableStateOf(event.time) }; var location by remember { mutableStateOf(event.location) }; var guests by remember { mutableStateOf(event.guests.toString()) }; var budget by remember { mutableStateOf(event.budget) }
    Header("Edit event", onBack); Input("Name", name) { name = it }; Input("Event type", type) { type = it }; Input("Date (YYYY-MM-DD)", date) { date = it }; Input("Time (HH:MM)", time) { time = it }; Input("Location", location) { location = it }; Input("Guests", guests) { guests = it }; Input("Budget", budget) { budget = it }
    ActionButton("Save changes") { onSave(event.id, com.example.planmy.data.UpdateEventRequest(name, type, date, time, location, guests.toIntOrNull(), budget.toDoubleOrNull())) }
}

@Composable private fun ProvidersScreen(providers: List<Provider>, onProvider: (Int) -> Unit, onFilter: (String?, String?, Int?, Double?) -> Unit, onBack: () -> Unit) {
    var category by remember { mutableStateOf("") }; var location by remember { mutableStateOf("") }; var maxPrice by remember { mutableStateOf("") }
    var guests by remember { mutableStateOf("") }
    Header("Explore providers", onBack); Input("Category", category) { category = it }; Input("Location", location) { location = it }; Input("Guest capacity", guests) { guests = it }; Input("Maximum price", maxPrice) { maxPrice = it }
    ActionButton("Apply filters") { onFilter(category.ifBlank { null }, location.ifBlank { null }, guests.toIntOrNull(), maxPrice.toDoubleOrNull()) }
    providers.forEach { provider -> Card(Modifier.fillMaxWidth().padding(vertical = 6.dp).clickable { onProvider(provider.id) }) { Column(Modifier.padding(16.dp)) { Text(provider.name, style = MaterialTheme.typography.titleLarge); Text("${provider.category} · ${provider.location ?: "Location unavailable"}");     Text("${provider.price ?: "Price on request"} ${provider.priceUnit ?: ""}")
    provider.rating?.let { Text("Rating $it (${provider.reviewCount ?: 0} reviews)") } } } }
}

@Composable private fun ProviderDetailsScreen(provider: Provider?, events: List<Event>, onBack: () -> Unit, onBook: (Int, Double, String) -> Unit) {
    Header("Provider details", onBack); if (provider == null) return
    Text(provider.name, style = MaterialTheme.typography.headlineSmall); Text(provider.category); provider.description?.let { Text(it) }; Text(provider.location ?: ""); Text(provider.price ?: "Price on request")
    var eventId by remember { mutableStateOf(events.firstOrNull()?.id?.toString() ?: "") }; var price by remember { mutableStateOf(provider.price ?: "") }; var date by remember { mutableStateOf("") }
    Input("Event id", eventId) { eventId = it }; Input("Service date (optional)", date) { date = it }; Input("Price", price) { price = it }
    ActionButton("Add provider to event") { onBook(eventId.toIntOrNull() ?: 0, price.toDoubleOrNull() ?: 0.0, date) }
}

@Composable private fun ConversationsScreen(items: List<com.example.planmy.data.Conversation>, onBack: () -> Unit) {
    Header("Conversations", onBack); if (items.isEmpty()) Text("No conversations yet.")
    items.forEach { Card(Modifier.fillMaxWidth().padding(vertical = 6.dp)) { Column(Modifier.padding(16.dp)) { Text(it.providerName, style = MaterialTheme.typography.titleLarge); Text(it.eventName); Text(it.lastMessage ?: "No messages yet") } } }
}

@Composable private fun ProfileScreen(user: com.example.planmy.data.User?, onLogout: () -> Unit, onBack: () -> Unit) {
    Header("Profile", onBack); Text(user?.name ?: ""); Text(user?.email ?: ""); Spacer(Modifier.height(20.dp)); OutlinedButton(onClick = onLogout) { Text("Log out") }
}

@Composable private fun Header(title: String, onBack: () -> Unit) { Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) { Text(title, style = MaterialTheme.typography.headlineSmall); TextButton(onClick = onBack) { Text("Back") } } }
@Composable private fun Input(label: String, value: String, onValueChange: (String) -> Unit) { OutlinedTextField(value, onValueChange, label = { Text(label) }, modifier = Modifier.fillMaxWidth().padding(vertical = 5.dp), singleLine = true) }
@Composable private fun ActionButton(label: String, onClick: () -> Unit) { Button(onClick, modifier = Modifier.fillMaxWidth().padding(vertical = 5.dp)) { Text(label) } }

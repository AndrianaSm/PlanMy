package com.example.planmy.data

import android.content.Context
import com.example.planmy.AppContext

actual class TokenStore {
    private val preferences = AppContext.instance.getSharedPreferences("planmy_auth", Context.MODE_PRIVATE)
    actual fun read(): String? = preferences.getString("token", null)
    actual fun write(token: String) { preferences.edit().putString("token", token).apply() }
    actual fun clear() { preferences.edit().remove("token").apply() }
}

package com.example.planmy.data

import platform.Foundation.NSUserDefaults

actual class TokenStore {
    private val defaults = NSUserDefaults.standardUserDefaults
    actual fun read(): String? = defaults.stringForKey("planmy_auth_token")
    actual fun write(token: String) { defaults.setObject(token, forKey = "planmy_auth_token") }
    actual fun clear() { defaults.removeObjectForKey("planmy_auth_token") }
}

package com.example.planmy.data

expect class TokenStore() {
    fun read(): String?
    fun write(token: String)
    fun clear()
}

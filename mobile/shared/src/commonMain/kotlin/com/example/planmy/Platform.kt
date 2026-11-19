package com.example.planmy

interface Platform {
    val name: String
}

expect fun getPlatform(): Platform
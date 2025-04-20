package com.example.network

import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.*
import java.io.IOException

object ApiClient {
    private val client = OkHttpClient()

    fun enviarDatosPasos(url: String, pasos: Int, userID:String) {
        val json = """
            {
                "user_id":$userID,
                "steps": $pasos,
                "date": "${getTodayDate()}"
            }
        """.trimIndent()
        //val jsonMediaType = "application/json".toMediaTypeOrNull()
            ?: throw IllegalArgumentException("Tipo de medio no válido")
        val body = RequestBody.create("application/json".toMediaTypeOrNull(), json)
        val request = Request.Builder()
            .url(url)
            .addHeader("Content-Type", "application/json")
            .post(body)
            .build()

        client.newCall(request).enqueue(object : Callback {
            override fun onFailure(call: Call, e: IOException) {
                println("Fallo al enviar datos: ${e.message}")
            }

            override fun onResponse(call: Call, response: Response) {
                println("Datos enviados con éxito: ${response.code}")
            }
        })
    }

    private fun getTodayDate(): String {
        val sdf = java.text.SimpleDateFormat("yyyy-MM-dd")
        return sdf.format(java.util.Date())
    }
}

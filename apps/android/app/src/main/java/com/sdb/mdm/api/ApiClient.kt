package com.sdb.mdm.api

import android.util.Log
import com.google.gson.GsonBuilder
import com.sdb.mdm.SDBApplication
import okhttp3.Interceptor
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.util.concurrent.TimeUnit

class ApiClient {
    
    companion object {
        private const val TAG = "ApiClient"
        private const val TIMEOUT_SECONDS = 30L
    }
    
    private val _apiService: ApiService by lazy {
        createRetrofit().create(ApiService::class.java)
    }
    
    fun getApiService(): ApiService = _apiService
    
    private fun createRetrofit(): Retrofit {
        val okHttpClient = OkHttpClient.Builder()
            .connectTimeout(TIMEOUT_SECONDS, TimeUnit.SECONDS)
            .readTimeout(TIMEOUT_SECONDS, TimeUnit.SECONDS)
            .writeTimeout(TIMEOUT_SECONDS, TimeUnit.SECONDS)
            .addInterceptor(createLoggingInterceptor())
            .addInterceptor(createAuthInterceptor())
            .build()
        
        val gson = GsonBuilder()
            .setDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'")
            .create()
        
        return Retrofit.Builder()
            .baseUrl(SDBApplication.instance.getApiBaseUrl())
            .client(okHttpClient)
            .addConverterFactory(GsonConverterFactory.create(gson))
            .build()
    }
    
    private fun createLoggingInterceptor(): HttpLoggingInterceptor {
        return HttpLoggingInterceptor { message ->
            Log.d(TAG, message)
        }.apply {
            level = HttpLoggingInterceptor.Level.BODY
        }
    }
    
    private fun createAuthInterceptor(): Interceptor {
        return Interceptor { chain ->
            val original = chain.request()
            val requestBuilder = original.newBuilder()
            
            // Adicionar device ID como header para autenticação
            SDBApplication.instance.getStoredDeviceId()?.let { deviceId ->
                requestBuilder.addHeader("X-Device-ID", deviceId)
            }
            
            // Adicionar User-Agent
            requestBuilder.addHeader("User-Agent", "SDB-Android/1.0")
            
            val request = requestBuilder.build()
            chain.proceed(request)
        }
    }
}
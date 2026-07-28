package com.example.data

import com.squareup.moshi.JsonClass
import com.squareup.moshi.Moshi
import com.squareup.moshi.kotlin.reflect.KotlinJsonAdapterFactory
import okhttp3.OkHttpClient
import okhttp3.ResponseBody
import retrofit2.Response
import retrofit2.Retrofit
import retrofit2.converter.moshi.MoshiConverterFactory
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.Header
import retrofit2.http.PUT
import retrofit2.http.Path
import retrofit2.http.Url
import java.nio.charset.StandardCharsets
import java.util.concurrent.TimeUnit

object BinarySerializer {
    /**
     * Encodes a JSON string into a string of '1's and '0's based on 8-bit bytes.
     */
    fun jsonToBinary(jsonString: String): String {
        val bytes = jsonString.toByteArray(StandardCharsets.UTF_8)
        val sb = StringBuilder()
        for (b in bytes) {
            val unsignedByte = b.toInt() and 0xFF
            val binaryStr = Integer.toBinaryString(unsignedByte).padStart(8, '0')
            sb.append(binaryStr)
        }
        return sb.toString()
    }

    /**
     * Decodes a string of '1's and '0's back into a JSON string.
     */
    fun binaryToJson(binaryString: String): String {
        val cleanBinary = binaryString.filter { it == '0' || it == '1' }
        val byteCount = cleanBinary.length / 8
        if (byteCount == 0) return ""
        val bytes = ByteArray(byteCount)
        for (i in 0 until byteCount) {
            val chunk = cleanBinary.substring(i * 8, (i + 1) * 8)
            bytes[i] = chunk.toInt(2).toByte()
        }
        return String(bytes, StandardCharsets.UTF_8)
    }
}

@JsonClass(generateAdapter = true)
data class GitHubFileContentRequest(
    val message: String,
    val content: String, // Base64 encoded file content
    val sha: String? = null
)

@JsonClass(generateAdapter = true)
data class GitHubFileMetadata(
    val name: String,
    val path: String,
    val sha: String,
    val size: Int,
    val url: String,
    val download_url: String?,
    val type: String
)

interface GitHubApiService {
    @GET("repos/{owner}/{repo}/contents/{path}")
    suspend fun getDirectoryContents(
        @Path("owner") owner: String,
        @Path("repo") repo: String,
        @Path("path") path: String,
        @Header("Authorization") authHeader: String
    ): List<GitHubFileMetadata>

    @PUT("repos/{owner}/{repo}/contents/{path}")
    suspend fun saveFile(
        @Path("owner") owner: String,
        @Path("repo") repo: String,
        @Path("path") path: String,
        @Header("Authorization") authHeader: String,
        @Body request: GitHubFileContentRequest
    ): Response<Unit>

    @GET
    suspend fun downloadRawContent(
        @Url url: String
    ): ResponseBody
}

object GitHubClient {
    private const val BASE_URL = "https://api.github.com/"

    private val moshi = Moshi.Builder()
        .add(KotlinJsonAdapterFactory())
        .build()

    private val okHttpClient = OkHttpClient.Builder()
        .connectTimeout(30, TimeUnit.SECONDS)
        .readTimeout(30, TimeUnit.SECONDS)
        .build()

    private val retrofit = Retrofit.Builder()
        .baseUrl(BASE_URL)
        .client(okHttpClient)
        .addConverterFactory(MoshiConverterFactory.create(moshi))
        .build()

    val apiService: GitHubApiService = retrofit.create(GitHubApiService::class.java)
}

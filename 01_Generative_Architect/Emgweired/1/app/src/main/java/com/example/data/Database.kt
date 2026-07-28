package com.example.data

import androidx.room.Entity
import androidx.room.PrimaryKey
import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Database
import androidx.room.RoomDatabase
import kotlinx.coroutines.flow.Flow

@Entity(tableName = "chat_messages")
data class ChatMessage(
    @PrimaryKey(autoGenerate = true) val id: Int = 0,
    val text: String,
    val sender: String, // "user" or "ai"
    val timestamp: Long = System.currentTimeMillis()
)

@Entity(tableName = "principles")
data class Principle(
    @PrimaryKey(autoGenerate = true) val id: Int = 0,
    val text: String
)

@Entity(tableName = "learning_logs")
data class LearningLog(
    @PrimaryKey(autoGenerate = true) val id: Int = 0,
    val text: String,
    val timestamp: Long = System.currentTimeMillis()
)

@Entity(tableName = "evolution_markers")
data class EvolutionMarker(
    @PrimaryKey(autoGenerate = true) val id: Int = 0,
    val text: String,
    val timestamp: Long = System.currentTimeMillis()
)

@Entity(tableName = "insight_connections")
data class InsightConnection(
    @PrimaryKey(autoGenerate = true) val id: Int = 0,
    val source: String,
    val target: String,
    val description: String,
    val timestamp: Long = System.currentTimeMillis()
)

@Dao
interface EmgCoreDao {
    // Chat messages
    @Query("SELECT * FROM chat_messages ORDER BY timestamp ASC")
    fun getAllMessages(): Flow<List<ChatMessage>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertMessage(message: ChatMessage)

    @Query("DELETE FROM chat_messages")
    suspend fun clearAllMessages()

    // Principles
    @Query("SELECT * FROM principles")
    fun getAllPrinciples(): Flow<List<Principle>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertPrinciple(principle: Principle)

    @Query("DELETE FROM principles WHERE text = :text")
    suspend fun deletePrinciple(text: String)

    @Query("DELETE FROM principles")
    suspend fun clearAllPrinciples()

    // Learning logs
    @Query("SELECT * FROM learning_logs ORDER BY timestamp DESC")
    fun getAllLearningLogs(): Flow<List<LearningLog>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertLearningLog(log: LearningLog)

    @Query("DELETE FROM learning_logs")
    suspend fun clearAllLearningLogs()

    // Evolution markers
    @Query("SELECT * FROM evolution_markers ORDER BY timestamp DESC")
    fun getAllEvolutionMarkers(): Flow<List<EvolutionMarker>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertEvolutionMarker(marker: EvolutionMarker)

    @Query("DELETE FROM evolution_markers")
    suspend fun clearAllEvolutionMarkers()

    // Insight connections
    @Query("SELECT * FROM insight_connections ORDER BY timestamp DESC")
    fun getAllConnections(): Flow<List<InsightConnection>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertConnection(connection: InsightConnection)

    @Query("DELETE FROM insight_connections")
    suspend fun clearAllConnections()
}

@Database(
    entities = [
        ChatMessage::class,
        Principle::class,
        LearningLog::class,
        EvolutionMarker::class,
        InsightConnection::class
    ],
    version = 1,
    exportSchema = false
)
abstract class AppDatabase : RoomDatabase() {
    abstract fun emgCoreDao(): EmgCoreDao
}

class EmgCoreRepository(private val dao: EmgCoreDao) {
    val messages: Flow<List<ChatMessage>> = dao.getAllMessages()
    val principles: Flow<List<Principle>> = dao.getAllPrinciples()
    val learningLogs: Flow<List<LearningLog>> = dao.getAllLearningLogs()
    val evolutionMarkers: Flow<List<EvolutionMarker>> = dao.getAllEvolutionMarkers()
    val connections: Flow<List<InsightConnection>> = dao.getAllConnections()

    suspend fun insertMessage(message: ChatMessage) = dao.insertMessage(message)
    suspend fun clearAllMessages() = dao.clearAllMessages()

    suspend fun insertPrinciple(principle: Principle) = dao.insertPrinciple(principle)
    suspend fun deletePrinciple(text: String) = dao.deletePrinciple(text)
    suspend fun clearAllPrinciples() = dao.clearAllPrinciples()

    suspend fun insertLearningLog(log: LearningLog) = dao.insertLearningLog(log)
    suspend fun clearAllLearningLogs() = dao.clearAllLearningLogs()

    suspend fun insertEvolutionMarker(marker: EvolutionMarker) = dao.insertEvolutionMarker(marker)
    suspend fun clearAllEvolutionMarkers() = dao.clearAllEvolutionMarkers()

    suspend fun insertConnection(connection: InsightConnection) = dao.insertConnection(connection)
    suspend fun clearAllConnections() = dao.clearAllConnections()
}

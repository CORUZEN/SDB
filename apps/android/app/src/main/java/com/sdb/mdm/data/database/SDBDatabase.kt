package com.sdb.mdm.data.database

import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import androidx.room.TypeConverters
import android.content.Context
import com.sdb.mdm.data.model.*
import com.sdb.mdm.data.dao.*

/**
 * SDB Database - FRIAXIS v4.0.0
 * Room database implementation for the FRIAXIS MDM system
 */
@Database(
    entities = [
        Device::class,
        DeviceRegistration::class,
        Organization::class,
        User::class,
        Policy::class,
        Command::class
    ],
    version = 1,
    exportSchema = false
)
@TypeConverters(Converters::class)
abstract class SDBDatabase : RoomDatabase() {
    
    abstract fun deviceDao(): DeviceDao
    abstract fun deviceRegistrationDao(): DeviceRegistrationDao
    abstract fun organizationDao(): OrganizationDao
    abstract fun userDao(): UserDao
    abstract fun policyDao(): PolicyDao
    abstract fun commandDao(): CommandDao
    
    companion object {
        @Volatile
        private var INSTANCE: SDBDatabase? = null
        
        fun getDatabase(context: Context): SDBDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    SDBDatabase::class.java,
                    "sdb_database"
                )
                .fallbackToDestructiveMigration()
                .build()
                INSTANCE = instance
                instance
            }
        }
    }
}
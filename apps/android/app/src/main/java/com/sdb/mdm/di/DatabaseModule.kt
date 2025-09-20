package com.sdb.mdm.di

import android.content.Context
import androidx.room.Room
import com.sdb.mdm.data.database.SDBDatabase
import com.sdb.mdm.data.dao.*
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

/**
 * Database Module - FRIAXIS v4.0.0
 * Dependency injection configuration for database components
 */
@Module
@InstallIn(SingletonComponent::class)
object DatabaseModule {
    
    @Provides
    @Singleton
    fun provideSDBDatabase(@ApplicationContext context: Context): SDBDatabase {
        return Room.databaseBuilder(
            context,
            SDBDatabase::class.java,
            "sdb_database"
        )
        .fallbackToDestructiveMigration()
        .build()
    }
    
    @Provides
    fun provideDeviceDao(database: SDBDatabase): DeviceDao {
        return database.deviceDao()
    }
    
    @Provides
    fun provideDeviceRegistrationDao(database: SDBDatabase): DeviceRegistrationDao {
        return database.deviceRegistrationDao()
    }
    
    @Provides
    fun provideOrganizationDao(database: SDBDatabase): OrganizationDao {
        return database.organizationDao()
    }
    
    @Provides
    fun provideUserDao(database: SDBDatabase): UserDao {
        return database.userDao()
    }
    
    @Provides
    fun providePolicyDao(database: SDBDatabase): PolicyDao {
        return database.policyDao()
    }
    
    @Provides
    fun provideCommandDao(database: SDBDatabase): CommandDao {
        return database.commandDao()
    }
}
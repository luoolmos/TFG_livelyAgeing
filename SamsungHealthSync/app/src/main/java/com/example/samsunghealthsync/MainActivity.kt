package com.example.samsunghealthsync

import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import androidx.work.*
import com.example.samsunghealthsync.worker.DataSyncWorker

class MainActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val request = OneTimeWorkRequestBuilder<DataSyncWorker>().build()
        WorkManager.getInstance(this).enqueue(request)


        /*val syncRequest = PeriodicWorkRequestBuilder<com.ejemplo.worker.DataSyncWorker>(
            1, java.util.concurrent.TimeUnit.DAYS
        ).build()

        WorkManager.getInstance(this).enqueueUniquePeriodicWork(
            "DataSync", ExistingPeriodicWorkPolicy.REPLACE, syncRequest
        )*/
    }
}
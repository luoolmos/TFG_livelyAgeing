package com.example.samsunghealthsync.worker

import android.content.Context
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import com.example.data.HealthDataManager
import com.example.network.ApiClient
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlin.coroutines.resume

class DataSyncWorker(appContext: Context, workerParams: WorkerParameters) :
    CoroutineWorker(appContext, workerParams) {

    override suspend fun doWork(): Result {
        val pasosSimulados = 1234
        val user_id = "79e570f3-6690-4232-9765-8ee9acfe4a76"


        ApiClient.enviarDatosPasos(
            url = "http://10.0.2.2:3000/api/sync-steps",
            pasos = pasosSimulados,
            userID = user_id
        )

        return Result.success()

    }
}

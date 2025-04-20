package com.example.data

import android.content.Context
import android.util.Log
import com.samsung.android.sdk.healthdata.*
import java.text.SimpleDateFormat
import java.util.*
import com.samsung.android.sdk.healthdata.HealthPermissionManager
import com.samsung.android.sdk.healthdata.HealthDataResolver
import com.samsung.android.sdk.healthdata.HealthDataStore
import com.samsung.android.sdk.healthdata.HealthConstants
import com.samsung.android.sdk.healthdata.HealthData
import com.google.android.gms.tasks.Tasks
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext


class HealthDataManager(private val context: Context) {
    private var mStore: HealthDataStore? = null

    fun connect(onConnected: () -> Unit) {
        val connectionListener = object : HealthDataStore.ConnectionListener {
            override fun onConnected() {
                Log.d("SamsungHealth", "Conectado a HealthDataStore")
                onConnected()
            }

            override fun onConnectionFailed(p0: HealthConnectionErrorResult?) {
                Log.e("SamsungHealth", "Error de conexión: ${p0?.errorCode}")
            }

            override fun onDisconnected() {
                Log.d("SamsungHealth", "Desconectado de Samsung Health")
            }
        }

        mStore = HealthDataStore(context, connectionListener)
        mStore?.connectService()
    }

    fun requestPermissions(onResult: (Boolean) -> Unit){
        val permissionManager = HealthPermissionManager(mStore)

        val permissions = setOf(
            HealthPermissionManager.PermissionKey("com.samsung.health.step_count", HealthPermissionManager.PermissionType.READ)
        )

        return@withContext try {
            val result = Tasks.await(permissionManager.isPermissionAcquired(permissions))
            val missing = permissions.filter { !result[it]!! }.toSet()

            if (missing.isEmpty()) {
                Log.d("HealthData", "Permisos ya concedidos")
                true
            } else {
                val resultMap = Tasks.await(permissionManager.requestPermissions(missing))
                val granted = missing.all { resultMap[it] == HealthPermissionManager.PermissionResult.PERMISSION_GRANTED }
                Log.d("HealthData", "Permisos concedidos: $granted")
                granted
            }
        } catch (e: Exception) {
            Log.e("HealthData", "Error al pedir permisos", e)
            false
        }
    }

    fun readDailySteps(onStepsRead: (Int) -> Unit) {
        val resolver = HealthDataResolver(mStore, null)

        val startTime = getStartOfDay()
        val endTime = System.currentTimeMillis()

        val request = HealthDataResolver.ReadRequest.Builder()
            .setDataType("com.samsung.health.step_count")
            .setProperties(arrayOf("count"))
            .setLocalTimeRange("start_time", "end_time", startTime, endTime)
            .build()

        resolver.read(request).setResultListener { result ->
            var totalSteps = 0
            result?.use {
                while (it.hasNext()) {
                    val data = it.next()
                    totalSteps += data.getInt("count")
                }
            }
            Log.d("HealthData", "Pasos leídos: $totalSteps")
            onStepsRead(totalSteps)
        }
    }

    private fun getStartOfDay(): Long {
        val calendar = Calendar.getInstance()
        calendar.set(Calendar.HOUR_OF_DAY, 0)
        calendar.set(Calendar.MINUTE, 0)
        calendar.set(Calendar.SECOND, 0)
        return calendar.timeInMillis
    }

    fun disconnect() {
        mStore?.disconnectService()
    }
}
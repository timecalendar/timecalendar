package expo.modules.legacymigrationsource

import android.system.Os
import android.system.OsConstants
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.io.File

class LegacyMigrationSourceModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("LegacyMigrationSource")
    AsyncFunction("getLegacyMigrationSource") {
      val context = appContext.reactContext ?: throw sourceError()
      if (context.packageName != "fr.samuelprak.timecalendar") {
        throw CodedException("INELIGIBLE_APPLICATION_ID", "INELIGIBLE_APPLICATION_ID", null)
      }
      try {
        val root = File(context.applicationInfo.dataDir)
        val database = File(root, "app_flutter/simple_database.db")
        val metadata = try {
          val stat = Os.lstat(database.path)
          check(OsConstants.S_ISREG(stat.st_mode) && database.canonicalFile == File(root.canonicalFile, "app_flutter/simple_database.db"))
          check(database.canRead())
          mapOf("uri" to database.toURI().toString(), "sizeBytes" to stat.st_size, "modifiedAtMs" to database.lastModified())
        } catch (error: android.system.ErrnoException) {
          if (error.errno == OsConstants.ENOENT) null else throw error
        }
        val preferences = File(root, "shared_prefs/FlutterSharedPreferences.xml")
        // Android treats an existing backup as authoritative after an interrupted write.
        val backup = File(root, "shared_prefs/FlutterSharedPreferences.xml.bak")
        val source = if (backup.exists()) backup else preferences
        mapOf(
          "database" to metadata,
          "preferences" to LegacyPreferences.keys.associateWith { key -> LegacyPreferences.read(source, key) },
          "platformEvidence" to mapOf("preferenceBackend" to "android-shared-preferences")
        )
      } catch (_: Exception) {
        throw sourceError()
      }
    }
  }

  private fun sourceError() = CodedException("SOURCE_OPEN_FAILED", "SOURCE_OPEN_FAILED", null)
}

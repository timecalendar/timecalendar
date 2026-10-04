const fs = require("node:fs/promises")
const path = require("node:path")

const { withAndroidManifest, withDangerousMod } = require("expo/config-plugins")

module.exports = function withLegacyMigrationBackup(config) {
  config = withAndroidManifest(config, (mod) => {
    const application = mod.modResults.manifest.application[0]
    application.$["android:fullBackupContent"] =
      "@xml/timecalendar_backup_rules"
    application.$["android:dataExtractionRules"] =
      "@xml/timecalendar_data_extraction_rules"
    return mod
  })
  return withDangerousMod(config, [
    "android",
    async (mod) => {
      const destination = path.join(
        mod.modRequest.platformProjectRoot,
        "app/src/main/res/xml",
      )
      await fs.mkdir(destination, { recursive: true })
      for (const name of [
        "timecalendar_backup_rules.xml",
        "timecalendar_data_extraction_rules.xml",
      ]) {
        await fs.copyFile(
          path.join(
            path.dirname(require.resolve("./expo-module.config.json")),
            "backup",
            name,
          ),
          path.join(destination, name),
        )
      }
      return mod
    },
  ])
}

const fs = require("node:fs")
const path = require("node:path")

const {
  withAndroidManifest,
  withAppBuildGradle,
  withDangerousMod,
} = require("expo/config-plugins")

const PERF_APPLICATION_ID = "fr.samuelprak.timecalendar.perf"
const REANIMATED_PROFILING_LINE = "ext.enableReanimatedProfiling = true"

const addPerfClient = (googleServices) => {
  const [template] = googleServices.client
  if (template === undefined) throw new Error("google-services has no client")

  const perfClient = structuredClone(template)
  perfClient.client_info.android_client_info.package_name = PERF_APPLICATION_ID

  return { ...googleServices, client: [...googleServices.client, perfClient] }
}

const withProfileable = (config) =>
  withAndroidManifest(config, (modConfig) => {
    const application = modConfig.modResults.manifest.application?.[0]
    if (application === undefined)
      throw new Error("manifest has no application")

    application.profileable = [{ $: { "android:shell": "true" } }]
    return modConfig
  })

const withReanimatedProfiling = (config) =>
  withAppBuildGradle(config, (modConfig) => {
    if (!modConfig.modResults.contents.includes(REANIMATED_PROFILING_LINE)) {
      modConfig.modResults.contents += `\n${REANIMATED_PROFILING_LINE}\n`
    }
    return modConfig
  })

// The Google Services Gradle plugin rejects a package that has no client in the
// file. The perf id is not registered in Firebase, so the dev client is cloned
// under it. Build-type source sets win over app/google-services.json, which keeps
// this independent of the order in which Expo copies the base file.
const withPerfGoogleServices = (config) =>
  withDangerousMod(config, [
    "android",
    (modConfig) => {
      const source = modConfig.android?.googleServicesFile
      if (source === undefined) throw new Error("googleServicesFile is unset")

      const { projectRoot, platformProjectRoot } = modConfig.modRequest
      const googleServices = JSON.parse(
        fs.readFileSync(path.resolve(projectRoot, source), "utf8"),
      )
      const contents = JSON.stringify(addPerfClient(googleServices), null, 2)

      for (const buildType of ["debug", "release"]) {
        const directory = path.join(platformProjectRoot, "app/src", buildType)
        fs.mkdirSync(directory, { recursive: true })
        fs.writeFileSync(path.join(directory, "google-services.json"), contents)
      }
      return Promise.resolve(modConfig)
    },
  ])

const withPerfBuild = (config) =>
  withPerfGoogleServices(withReanimatedProfiling(withProfileable(config)))

module.exports = { PERF_APPLICATION_ID, addPerfClient, withPerfBuild }

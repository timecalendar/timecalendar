import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

export const verifyAndroidContract = ({ manifest, gradleProperties }) => {
  const activity = manifest.match(
    /<activity\b[^>]*android:name="\.MainActivity"[^>]*>/,
  )?.[0]
  assert.ok(activity, "Generated Android manifest must contain .MainActivity")
  assert.doesNotMatch(
    activity,
    /android:screenOrientation="portrait"/,
    "MainActivity must not be locked to portrait",
  )
  assert.doesNotMatch(
    manifest,
    /android:resizeableActivity="false"/,
    "Application must not disable Android window resizing",
  )
  assert.match(
    gradleProperties,
    /^android\.minSdkVersion=24$/m,
    "Generated Android minimum SDK must remain 24",
  )
  return { minSdkVersion: 24, orientation: "unlocked", resizeable: true }
}

export const verifyGeneratedAndroidProject = (androidRoot) => {
  const result = verifyAndroidContract({
    manifest: fs.readFileSync(
      path.join(androidRoot, "app/src/main/AndroidManifest.xml"),
      "utf8",
    ),
    gradleProperties: fs.readFileSync(
      path.join(androidRoot, "gradle.properties"),
      "utf8",
    ),
  })
  console.log(`android.minSdkVersion=${result.minSdkVersion}`)
  console.log(`MainActivity orientation=${result.orientation}`)
  console.log(`Application resizeable=${result.resizeable}`)
}

const runSelfTest = () => {
  const valid = {
    manifest:
      '<manifest><application><activity android:name=".MainActivity" android:exported="true"></activity></application></manifest>',
    gradleProperties: "android.minSdkVersion=24\n",
  }
  assert.deepEqual(verifyAndroidContract(valid), {
    minSdkVersion: 24,
    orientation: "unlocked",
    resizeable: true,
  })
  assert.throws(
    () =>
      verifyAndroidContract({
        ...valid,
        manifest: valid.manifest.replace(
          'android:exported="true"',
          'android:screenOrientation="portrait"',
        ),
      }),
    /must not be locked to portrait/,
  )
  assert.throws(
    () =>
      verifyAndroidContract({
        ...valid,
        manifest: valid.manifest.replace(
          "<application",
          '<application android:resizeableActivity="false"',
        ),
      }),
    /must not disable Android window resizing/,
  )
  assert.throws(
    () => verifyAndroidContract({ ...valid, gradleProperties: "" }),
    /minimum SDK must remain 24/,
  )
  console.log("Android device-contract parser self-test passed")
}

const isEntryPoint = process.argv[1] === fileURLToPath(import.meta.url)
if (isEntryPoint) {
  if (process.argv[2] === "--self-test") runSelfTest()
  else {
    assert.ok(
      process.argv[2],
      "Usage: assert-android-device-contract.mjs <android-root>",
    )
    verifyGeneratedAndroidProject(path.resolve(process.argv[2]))
  }
}

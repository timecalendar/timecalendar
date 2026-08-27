import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import { createRequire } from "node:module"
import { fileURLToPath } from "node:url"

const require = createRequire(import.meta.url)
const plist = require("@expo/plist").default
const xcode = require("xcode")

const APPLICATION_PRODUCT_TYPE = "com.apple.product-type.application"
const IPAD_ORIENTATIONS_KEY = "UISupportedInterfaceOrientations~ipad"
const GENERIC_ORIENTATIONS_KEY = "UISupportedInterfaceOrientations"
const PORTRAIT_ORIENTATIONS = new Set([
  "UIInterfaceOrientationPortrait",
  "UIInterfaceOrientationPortraitUpsideDown",
])

const unquote = (value) => String(value).replace(/^"|"$/g, "")

export const normalizeDeviceFamily = (value) =>
  unquote(value).replace(/\s/g, "")

const targetBuildConfigurations = (project, target) => {
  const configurationList =
    project.pbxXCConfigurationList()[target.buildConfigurationList]
  assert.ok(
    configurationList,
    "Application target configuration list is missing",
  )

  const configurations = project.pbxXCBuildConfigurationSection()
  return configurationList.buildConfigurations.map(({ value }) => {
    const configuration = configurations[value]
    assert.ok(
      configuration,
      `Application build configuration ${value} is missing`,
    )
    return configuration
  })
}

export const verifyTargetConfigurations = (configurations) => {
  assert.ok(
    configurations.length > 0,
    "Application target has no build configurations",
  )

  for (const configuration of configurations) {
    const family = normalizeDeviceFamily(
      configuration.buildSettings.TARGETED_DEVICE_FAMILY,
    )
    assert.equal(
      family,
      "1,2",
      `${configuration.name} TARGETED_DEVICE_FAMILY must resolve exactly to 1,2`,
    )
  }

  const plistPaths = new Set(
    configurations.map((configuration) =>
      unquote(configuration.buildSettings.INFOPLIST_FILE),
    ),
  )
  assert.equal(
    plistPaths.size,
    1,
    "Application configurations must share one Info.plist",
  )
  const [plistPath] = plistPaths
  assert.ok(plistPath, "Application target INFOPLIST_FILE is missing")

  return { family: "1,2", plistPath }
}

export const verifyInfoPlist = (infoPlist) => {
  assert.equal(
    infoPlist.UIRequiresFullScreen,
    true,
    "UIRequiresFullScreen must be true",
  )

  const orientationKey = Object.hasOwn(infoPlist, IPAD_ORIENTATIONS_KEY)
    ? IPAD_ORIENTATIONS_KEY
    : GENERIC_ORIENTATIONS_KEY
  const orientations = infoPlist[orientationKey]
  assert.ok(
    Array.isArray(orientations) && orientations.length > 0,
    `${orientationKey} must contain iPad orientations`,
  )
  assert.ok(
    orientations.every((orientation) => PORTRAIT_ORIENTATIONS.has(orientation)),
    `${orientationKey} must contain portrait orientations only; received ${orientations.join(",")}`,
  )

  return { orientationKey, orientations }
}

const findProjectFile = (iosRoot) => {
  const projects = fs
    .readdirSync(iosRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name.endsWith(".xcodeproj"))
  assert.equal(
    projects.length,
    1,
    "Expected exactly one generated Xcode project",
  )
  return path.join(iosRoot, projects[0].name, "project.pbxproj")
}

const resolvePlistPath = (iosRoot, plistPath) => {
  const relativePath = plistPath.replace(/^\$\(SRCROOT\)\/?/, "")
  return path.resolve(iosRoot, relativePath)
}

export const verifyGeneratedProject = (iosRoot) => {
  const project = xcode.project(findProjectFile(iosRoot))
  project.parseSync()

  const applicationTarget = project.getTarget(APPLICATION_PRODUCT_TYPE)
  assert.ok(
    applicationTarget,
    "Generated Xcode project has no application target",
  )

  const configurations = targetBuildConfigurations(
    project,
    applicationTarget.target,
  )
  const { family, plistPath } = verifyTargetConfigurations(configurations)
  const resolvedPlistPath = resolvePlistPath(iosRoot, plistPath)
  assert.ok(
    fs.existsSync(resolvedPlistPath),
    `Application Info.plist does not exist at ${resolvedPlistPath}`,
  )

  const infoPlist = plist.parse(fs.readFileSync(resolvedPlistPath, "utf8"))
  const { orientationKey, orientations } = verifyInfoPlist(infoPlist)

  console.log(`Application target: ${unquote(applicationTarget.target.name)}`)
  console.log(`TARGETED_DEVICE_FAMILY=${family}`)
  console.log(`UIRequiresFullScreen=${infoPlist.UIRequiresFullScreen}`)
  console.log(`${orientationKey}=${orientations.join(",")}`)
}

const runSelfTest = () => {
  const baseConfiguration = {
    name: "Release",
    buildSettings: {
      INFOPLIST_FILE: '"TimeCalendar/Info.plist"',
      TARGETED_DEVICE_FAMILY: '"1,2"',
    },
  }
  assert.deepEqual(verifyTargetConfigurations([baseConfiguration]), {
    family: "1,2",
    plistPath: "TimeCalendar/Info.plist",
  })
  assert.throws(
    () =>
      verifyTargetConfigurations([
        {
          ...baseConfiguration,
          buildSettings: {
            ...baseConfiguration.buildSettings,
            TARGETED_DEVICE_FAMILY: '"1"',
          },
        },
      ]),
    /must resolve exactly to 1,2/,
  )

  assert.deepEqual(
    verifyInfoPlist({
      UIRequiresFullScreen: true,
      [GENERIC_ORIENTATIONS_KEY]: ["UIInterfaceOrientationPortrait"],
    }),
    {
      orientationKey: GENERIC_ORIENTATIONS_KEY,
      orientations: ["UIInterfaceOrientationPortrait"],
    },
  )
  assert.throws(
    () =>
      verifyInfoPlist({
        UIRequiresFullScreen: true,
        [IPAD_ORIENTATIONS_KEY]: [
          "UIInterfaceOrientationPortrait",
          "UIInterfaceOrientationLandscapeLeft",
        ],
      }),
    /portrait orientations only/,
  )
  assert.throws(
    () =>
      verifyInfoPlist({
        UIRequiresFullScreen: false,
        [GENERIC_ORIENTATIONS_KEY]: ["UIInterfaceOrientationPortrait"],
      }),
    /UIRequiresFullScreen must be true/,
  )

  console.log("iOS device-contract parser self-test passed")
}

const isEntryPoint = process.argv[1] === fileURLToPath(import.meta.url)
if (isEntryPoint) {
  if (process.argv[2] === "--self-test") {
    runSelfTest()
  } else {
    assert.ok(
      process.argv[2],
      "Usage: assert-ios-device-contract.mjs <ios-root>",
    )
    verifyGeneratedProject(path.resolve(process.argv[2]))
  }
}

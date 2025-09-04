#!/usr/bin/env node

/**
 * Script to generate AI-powered profiles for schools
 * Usage: npm run app:tsnode ./src/scripts/generate-school-profiles.ts [schoolId]
 */

import { NestFactory } from "@nestjs/core"
import { AppModule } from "app.module"
import { SchoolRepository } from "modules/school/repositories/school.repository"
import { SchoolProfileGenerationService } from "modules/school/services/school-profile-generation.service"

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule)

  const schoolProfileGenerationService = app.get(SchoolProfileGenerationService)
  const schoolRepository = app.get(SchoolRepository)

  const args = process.argv.slice(2)
  const targetSchoolId = args[0]

  try {
    if (targetSchoolId) {
      // Generate profile for specific school
      console.log(`Generating profile for school ID: ${targetSchoolId}`)
      const profile =
        await schoolProfileGenerationService.generateSchoolProfile(
          targetSchoolId,
        )
      console.log("Generated profile:", JSON.stringify(profile, null, 2))
    } else {
      // Generate profiles for all schools without profiles
      console.log("Finding schools without profiles...")
      const schools = await schoolRepository.findAll()

      for (const school of schools) {
        try {
          console.log(`\nGenerating profile for: ${school.name} (${school.id})`)
          const profile =
            await schoolProfileGenerationService.generateSchoolProfile(
              school.id,
            )
          console.log("Generated profile:", JSON.stringify(profile, null, 2))
          console.log(`✓ Successfully generated profile for ${school.name}`)
        } catch (error) {
          console.error(
            `✗ Failed to generate profile for ${school.name}:`,
            error.message,
          )
        }
      }
    }
  } catch (error) {
    console.error("Error:", error.message)
    process.exit(1)
  } finally {
    await app.close()
  }
}

main().catch((error) => {
  console.error("Script failed:", error)
  process.exit(1)
})

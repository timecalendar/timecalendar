import { createOpenAI } from "@ai-sdk/openai"
import { Injectable, Logger } from "@nestjs/common"
import { generateText } from "ai"
import { OPENAI_API_KEY } from "config/constants"
import { Campus } from "modules/school/models/entities/campus.model"
import { SchoolProfile } from "modules/school/models/entities/school-profile.entity"
import { SchoolProfileRepository } from "modules/school/repositories/school-profile.repository"
import { SchoolRepository } from "modules/school/repositories/school.repository"
import { z } from "zod"

const CampusSchema = z.object({
  name: z.string().describe("Campus name"),
  location: z.string().describe("Campus location description"),
})

const SchoolProfileGenerationSchema = z.object({
  campuses: z
    .array(CampusSchema)
    .max(10)
    .optional()
    .describe("List of campuses with their names and locations"),
  formations: z
    .array(z.string())
    .max(6)
    .optional()
    .describe("Key academic programs or formations the school offers"),
  description: z.string().max(500).describe("Brief description of the school"),
  studentCount: z
    .number()
    .int()
    .positive()
    .optional()
    .describe("Approximate number of students"),
  domains: z
    .array(z.string())
    .max(5)
    .optional()
    .describe("Main academic domains or fields of study"),
  excellenceTitle: z
    .string()
    .max(100)
    .optional()
    .describe("Title highlighting the school's area of excellence"),
  excellenceDescription: z
    .string()
    .max(300)
    .optional()
    .describe("Description of why the school excels in its domains"),
  tags: z
    .array(z.string())
    .max(6)
    .optional()
    .describe("Descriptive tags about the school's characteristics"),
  campusLocationContext: z
    .string()
    .max(100)
    .optional()
    .describe("Regional context where the school is located"),
})

@Injectable()
export class SchoolProfileGenerationService {
  private readonly logger = new Logger(SchoolProfileGenerationService.name)

  constructor(
    private readonly schoolRepository: SchoolRepository,
    private readonly schoolProfileRepository: SchoolProfileRepository,
  ) {}

  async generateSchoolProfile(schoolId: string): Promise<SchoolProfile> {
    this.logger.log(`Generating profile for school ID: ${schoolId}`)

    // Fetch the school entity
    const school = await this.schoolRepository.findOneOrFail(schoolId)

    if (school.profile) {
      this.logger.log(`Profile already exists for school ID: ${schoolId}`)
      return school.profile
    }

    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not configured")
    }

    const openai = createOpenAI({
      apiKey: OPENAI_API_KEY,
    })

    try {
      // Generate profile data using AI
      const { text } = await generateText({
        model: openai("gpt-4.1"),
        prompt: this.buildPrompt(school.name, school.siteUrl),
        temperature: 0.3,
        tools: {
          web_search_preview: openai.tools.webSearchPreview({
            searchContextSize: "high",
            userLocation: {
              type: "approximate",
              city: "Paris",
              region: "Ile-de-France",
            },
          }),
        },
        toolChoice: { type: "tool", toolName: "web_search_preview" },
      })

      this.logger.log(`Generated profile data for ${school.name}`)

      // Extract and parse the JSON response
      let generatedData
      try {
        const jsonText = this.extractJsonFromText(text)
        generatedData = JSON.parse(jsonText)
      } catch (parseError) {
        this.logger.error(
          `Failed to parse JSON response: ${parseError.message}`,
        )
        this.logger.error(`Raw response text: ${text}`)
        throw new Error(`Invalid JSON response from AI: ${parseError.message}`)
      }

      // Validate the generated data against our schema
      const validatedData = SchoolProfileGenerationSchema.parse(generatedData)

      // Transform the generated data to match entity structure
      const profileData = {
        ...validatedData,
        campuses: validatedData.campuses?.map((campus) =>
          Object.assign(new Campus(), campus),
        ),
      }

      // Upsert the profile in the database
      const savedProfile = await this.schoolProfileRepository.upsertBySchoolId(
        schoolId,
        profileData,
      )

      this.logger.log(`Successfully saved profile for school ID: ${schoolId}`)
      return savedProfile
    } catch (error) {
      console.error(error)
      this.logger.error(
        `Failed to generate profile for school ${school.name}:`,
        error,
      )
      throw new Error(`Failed to generate school profile: ${error.message}`)
    }
  }

  private extractJsonFromText(text: string): string {
    // Find the first opening brace
    const startIndex = text.indexOf("{")
    if (startIndex === -1) {
      throw new Error("No JSON object found in response")
    }

    // Find the matching closing brace by counting braces
    let braceCount = 0
    let endIndex = -1

    for (let i = startIndex; i < text.length; i++) {
      if (text[i] === "{") {
        braceCount++
      } else if (text[i] === "}") {
        braceCount--
        if (braceCount === 0) {
          endIndex = i
          break
        }
      }
    }

    if (endIndex === -1) {
      throw new Error("Unmatched braces in JSON response")
    }

    return text.substring(startIndex, endIndex + 1)
  }

  private buildPrompt(schoolName: string, schoolWebsite: string): string {
    return `You are an expert education researcher. I need you to research and provide accurate information about the following educational institution:

School Name: ${schoolName}
School Website: ${schoolWebsite}

Please research this school and provide the following information in a structured JSON format. Be accurate and factual - if you cannot find reliable information for a field, leave it undefined rather than making up data.

You must respond with ONLY a valid JSON object that matches this exact structure:

{
  "campuses": [
    {
      "name": "Campus name",
      "location": "Campus location description"
    }
  ],
  "formations": ["Academic program 1", "Academic program 2"],
  "description": "Brief description of the school (max 500 characters)",
  "studentCount": 1000,
  "domains": ["Domain 1", "Domain 2"],
  "excellenceTitle": "Title highlighting the school's area of excellence (max 100 characters)",
  "excellenceDescription": "Description of why the school excels (max 300 characters)",
  "tags": ["Tag 1", "Tag 2"],
  "campusLocationContext": "Regional context (max 100 characters)"
}

Guidelines:
- Respond with ONLY the JSON object, no additional text or explanations
- Use accurate, factual information only
- Keep descriptions concise and professional
- Focus on the school's distinctive characteristics
- Use French language for French institutions, English for others
- If the school has multiple campuses, list the main ones (max 10)
- For formations, focus on the most prominent programs (max 6)
- Limit domains to max 5 items
- Limit tags to max 6 items
- Ensure all text fields respect their character limits`
  }
}

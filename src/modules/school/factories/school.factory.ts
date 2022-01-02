import { AppFactory } from "src/test-utils/factories/app-factory"
import { factoryBuilder } from "src/test-utils/factories/factory-builder"
import { School } from "../models/school.entity"

export class SchoolFactory extends AppFactory<School> {}

export const schoolFactory = factoryBuilder(() => [
  School,
  SchoolFactory.define(() => ({
    code: "mygamingacademia",
    name: "My Gaming Academia",
    assistant: "groups",
    fallbackAssistant: null,
    siteUrl: "https://gaming-academia.com",
    visible: true,
  })),
])

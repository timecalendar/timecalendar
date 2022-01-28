import { School } from "modules/school/models/school.entity"
import { AppFactory } from "test-utils/factories/app-factory"
import { factoryBuilder } from "test-utils/factories/factory-builder"

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

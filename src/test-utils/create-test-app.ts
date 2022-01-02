import { ModuleMetadata } from "@nestjs/common"
import { createNestTestApp } from "./create-nest-app"
import createTestModule from "./create-test-module"

const createTestApp = async (metadata: ModuleMetadata) => {
  const module = await createTestModule(metadata)
  return createNestTestApp(module)
}

export default createTestApp

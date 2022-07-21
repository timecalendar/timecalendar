import { ModuleMetadata } from "@nestjs/common"
import { createNestTestApp } from "test-utils/create-nest-app"
import createTestModule from "test-utils/create-test-module"

const createTestApp = async (metadata: ModuleMetadata) => {
  const module = await createTestModule(metadata)
  return createNestTestApp(module)
}

export default createTestApp

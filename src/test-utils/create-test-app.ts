import { ModuleMetadata } from "@nestjs/common"
import { createNestTestApp } from "test-utils/create-nest-app"
import createTestModule, {
  CreateTestModuleOptions,
} from "test-utils/create-test-module"

const createTestApp = async (
  metadata: ModuleMetadata,
  options?: CreateTestModuleOptions,
) => {
  const module = await createTestModule(metadata, options)
  return createNestTestApp(module)
}

export default createTestApp

import { ModuleMetadata } from "@nestjs/common"
import { Test } from "@nestjs/testing"
import { typeOrmTestModuleForRoot } from "./typeorm-test-module"

const createTestModule = async (metadata: ModuleMetadata) => {
  const addedImports: ModuleMetadata["imports"] = []

  addedImports.push(typeOrmTestModuleForRoot())

  const module = Test.createTestingModule({
    ...metadata,
    imports: [...(metadata.imports ?? []), ...addedImports],
  })

  return module.compile()
}

export default createTestModule

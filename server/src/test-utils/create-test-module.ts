import {
  ClassProvider,
  FactoryProvider,
  ModuleMetadata,
  ValueProvider,
} from "@nestjs/common"
import { Test } from "@nestjs/testing"
import { COMMON_IMPORTS } from "common-imports"

type Provider<T> = ClassProvider<T> | ValueProvider<T> | FactoryProvider<T>

const isClassProvider = <T>(
  provider: Provider<T>,
): provider is ClassProvider<T> => (provider as any).useClass
const isValueProvider = <T>(
  provider: Provider<T>,
): provider is ValueProvider<T> => (provider as any).useValue
const isFactoryProvider = <T>(
  provider: Provider<T>,
): provider is FactoryProvider<T> => (provider as any).useFactory

export type CreateTestModuleOptions = {
  overrides?: Provider<unknown>[]
}

const defaultOptions: CreateTestModuleOptions = {
  overrides: [],
}

const createTestModule = async (
  metadata: ModuleMetadata,
  options: Partial<CreateTestModuleOptions> = {},
) => {
  const { overrides = [] } = { ...defaultOptions, ...options }

  let module = Test.createTestingModule({
    ...metadata,
    imports: [...COMMON_IMPORTS, ...(metadata.imports ?? [])],
  })

  const defaultOverrides: Provider<unknown>[] = []

  const moduleOverrides = [
    ...overrides,
    ...defaultOverrides.filter(
      (provider) =>
        !overrides.some(
          (existingProvider) => existingProvider.provide === provider.provide,
        ),
    ),
  ]

  for (const provider of moduleOverrides) {
    const overrideBy = module.overrideProvider(provider.provide)
    if (isClassProvider(provider))
      module = overrideBy.useClass(provider.useClass)
    if (isValueProvider(provider))
      module = overrideBy.useValue(provider.useValue)
    if (isFactoryProvider(provider))
      module = overrideBy.useFactory({
        factory: provider.useFactory,
        inject: provider.inject,
      })
  }

  return module.compile()
}

export default createTestModule

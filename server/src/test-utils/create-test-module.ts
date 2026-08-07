import { QueueService } from "@lyrolab/nest-shared/queue"
import {
  ClassProvider,
  FactoryProvider,
  Global,
  Module,
  ModuleMetadata,
  ValueProvider,
} from "@nestjs/common"
import { Test } from "@nestjs/testing"
import { COMMON_IMPORTS } from "common-imports"
import { sharedDatabaseTestModule } from "test-utils/typeorm/typeorm-test-module"

type Provider<T> = ClassProvider<T> | ValueProvider<T> | FactoryProvider<T>

const isClassProvider = <T>(
  provider: Provider<T>,
): provider is ClassProvider<T> => "useClass" in provider
const isValueProvider = <T>(
  provider: Provider<T>,
): provider is ValueProvider<T> => "useValue" in provider
const isFactoryProvider = <T>(
  provider: Provider<T>,
): provider is FactoryProvider<T> => "useFactory" in provider

export type CreateTestModuleOptions = {
  overrides?: Provider<unknown>[]
}

// Runtime mounts SharedQueueModule.forRoot (a global module) in app.module.ts
// only — mounting it here would open Redis connections and upsert cron
// schedulers from jest. This global stub keeps QueueService injectable from any
// module under test; enqueues are no-ops (override the provider to assert them).
@Global()
@Module({
  providers: [
    {
      provide: QueueService,
      useValue: {
        add: async () => undefined,
        addBulk: async () => [],
      },
    },
  ],
  exports: [QueueService],
})
class QueueServiceStubModule {}

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
    imports: [
      ...COMMON_IMPORTS,
      sharedDatabaseTestModule,
      QueueServiceStubModule,
      ...(metadata.imports ?? []),
    ],
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

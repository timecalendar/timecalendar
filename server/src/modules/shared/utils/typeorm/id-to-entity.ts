import { DeepPartial } from "fishery"
import { AppFactory } from "test-utils/factories/app-factory"

export const idToEntity = <T>(id: string) => ({ id }) as unknown as T

/**
 * Casts a factory to an entity. Used only in factory constructors.
 */
export const factoryToEntity = <T>(
  factory: AppFactory<DeepPartial<NonNullable<T>>>,
) => factory as unknown as T

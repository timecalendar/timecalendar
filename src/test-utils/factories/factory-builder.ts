import _ from "lodash"
import { getObjectPaths } from "modules/shared/utils/object-paths"
import { getNestTestApps } from "test-utils/create-nest-app"
import { AppFactory } from "test-utils/factories/app-factory"
import { DataSource } from "typeorm"

export type AppFactoryContextParam = AppFactoryContext

export interface AppFactoryContext {
  dataSource?: DataSource
}

export type AppBuildFactoryGenerator<T, U> = (
  context: AppFactoryContext,
  factory?: U,
) => [any, T]

export const factoryBuilder = <T, U = null>(
  generator: AppBuildFactoryGenerator<T, U>,
  factoryClass?: U,
) => {
  return <V extends U>(
    context?: AppFactoryContextParam,
    customFactoryClass?: V,
  ) => {
    const buildContext: AppFactoryContext = context || {}

    if (!buildContext.dataSource) {
      const dataSources = getNestTestApps()
        .map((app) => app.get(DataSource))
        .filter((dataSource) => dataSource)
      buildContext.dataSource = dataSources[0] || undefined
    }

    const [model, factory] = generator(
      buildContext,
      customFactoryClass ?? factoryClass,
    )
    const { dataSource } = buildContext

    return (factory as any).onCreate(async (obj: any) => {
      if (!dataSource) return obj
      const paths = getObjectPaths(obj)
        .map((path: any) => [path, _.get(obj, path)])
        .filter(([, val]: any) => val instanceof AppFactory)
      const promises = await Promise.all(
        paths.map(([, val]: any) => val.create()),
      )
      paths.forEach(([path]: any, i: any) => _.set(obj, path, promises[i]))

      const entity = dataSource.entityMetadatas.find(
        (entity) => entity.name === model.name,
      )
      if (!entity) throw new Error("Entity not found: " + model.name)

      const repository = dataSource.getRepository(entity.name)
      repository.insert(obj)
    }) as T
  }
}

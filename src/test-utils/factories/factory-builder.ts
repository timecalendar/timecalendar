import _ from "lodash"
import { getObjectPaths } from "modules/shared/utils/object-paths"
import { Connection } from "typeorm"
import { getNestTestApps } from "../create-nest-app"
import { AppFactory } from "./app-factory"

export type AppFactoryContextParam = AppFactoryContext

export interface AppFactoryContext {
  connection?: Connection
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

    if (!buildContext.connection) {
      const connections = getNestTestApps()
        .map((app) => app.get(Connection))
        .filter((connection) => connection)
      buildContext.connection = connections[0] || undefined
    }

    const [model, factory] = generator(
      buildContext,
      customFactoryClass ?? factoryClass,
    )
    const { connection } = buildContext

    return (factory as any).onCreate(async (obj: any) => {
      if (!connection) return obj
      const paths = getObjectPaths(obj)
        .map((path: any) => [path, _.get(obj, path)])
        .filter(([, val]: any) => val instanceof AppFactory)
      const promises = await Promise.all(
        paths.map(([, val]: any) => val.create()),
      )
      paths.forEach(([path]: any, i: any) => _.set(obj, path, promises[i]))

      const entity = connection.entityMetadatas.find(
        (entity) => entity.name === model.name,
      )
      if (!entity) throw new Error("Entity not found: " + model.name)

      const repository = connection.getRepository(entity.name)
      repository.insert(obj)
    }) as T
  }
}

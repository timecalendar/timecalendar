import { DataSource, DataSourceOptions } from "typeorm"

export type RunMigrationParams = {
  log: boolean
}

export const runMigrations = async (
  dataSourceOptions: DataSourceOptions,
  params: RunMigrationParams = { log: false },
) => {
  const connection = await new DataSource({
    ...dataSourceOptions,
    logging: params.log,
  }).initialize()
  await connection.runMigrations()
  await connection.destroy()
}

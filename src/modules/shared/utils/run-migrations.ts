import { createConnection } from "typeorm"
import { MysqlConnectionOptions } from "typeorm/driver/mysql/MysqlConnectionOptions"

export type RunMigrationParams = {
  log: boolean
}

export const runMigrations = async (
  options: MysqlConnectionOptions,
  params: RunMigrationParams = { log: false },
) => {
  const connection = await createConnection({ ...options, logging: params.log })
  await connection.runMigrations()
  await connection.close()
}

import { DATABASE_LOGGING, DATABASE_URL } from "config/constants"
import { DataSource, DataSourceOptions } from "typeorm"

// Single connection-string source of truth (DATABASE_URL), shared by the
// runtime app, the test harness, and the TypeORM migration CLI — the
// nest-shared convention the rest of the platform uses.
export const dataSourceOptions: DataSourceOptions = {
  type: "postgres",
  url: DATABASE_URL,
  entities: [`${__dirname}/**/*.entity.{ts,js}`],
  migrations: [`${__dirname}/migrations/*.{ts,js}`],
  logging: DATABASE_LOGGING,
}

const AppDataSource = new DataSource(dataSourceOptions)

export default AppDataSource

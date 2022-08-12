import {
  DATABASE_HOST,
  DATABASE_LOGGING,
  DATABASE_MAIN_NAME,
  DATABASE_PASSWORD,
  DATABASE_PORT,
  DATABASE_USERNAME,
} from "config/constants"
import { DataSource, DataSourceOptions } from "typeorm"

export const dataSourceOptions: DataSourceOptions = {
  type: "postgres",
  host: DATABASE_HOST,
  port: DATABASE_PORT,
  username: DATABASE_USERNAME,
  password: DATABASE_PASSWORD,
  database: DATABASE_MAIN_NAME,
  entities: [`${__dirname}/**/*.entity.{ts,js}`],
  migrations: [`${__dirname}/migrations/*.{ts,js}`],
  logging: DATABASE_LOGGING,
}

const AppDataSource = new DataSource(dataSourceOptions)

export default AppDataSource

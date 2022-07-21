import {
  DATABASE_HOST,
  DATABASE_MAIN_NAME,
  DATABASE_PASSWORD,
  DATABASE_PORT,
  DATABASE_USERNAME,
} from "config/constants"
import { DataSource, DataSourceOptions } from "typeorm"

export const dataSourceOptions: DataSourceOptions = {
  type: "mariadb",
  host: DATABASE_HOST,
  port: DATABASE_PORT,
  username: DATABASE_USERNAME,
  password: DATABASE_PASSWORD,
  database: DATABASE_MAIN_NAME,
  entities: [__dirname + "/**/*.entity.{ts,js}"],
  migrations: [__dirname + "/migrations/*.{ts,js}"],
}

const AppDataSource = new DataSource(dataSourceOptions)

export default AppDataSource

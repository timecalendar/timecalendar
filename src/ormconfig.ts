import { MysqlConnectionOptions } from "typeorm/driver/mysql/MysqlConnectionOptions"
import {
  DATABASE_HOST,
  DATABASE_MAIN_NAME,
  DATABASE_PASSWORD,
  DATABASE_PORT,
  DATABASE_USERNAME,
} from "./config/constants"

const ormconfig: MysqlConnectionOptions = {
  type: "mariadb",
  host: DATABASE_HOST,
  port: DATABASE_PORT,
  username: DATABASE_USERNAME,
  password: DATABASE_PASSWORD,
  database: DATABASE_MAIN_NAME,
  entities: [__dirname + "/**/*.entity.{ts,js}"],
  migrations: [__dirname + "/migrations/*.{ts,js}"],
  cli: {
    migrationsDir: __dirname + "/migrations",
  },
}

export = ormconfig

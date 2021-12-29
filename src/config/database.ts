import { TypeOrmModuleOptions } from "@nestjs/typeorm"
import {
  DATABASE_HOST,
  DATABASE_PASSWORD,
  DATABASE_PORT,
  DATABASE_USERNAME,
} from "./constants"

export const databaseDefaultOptions: TypeOrmModuleOptions = {
  type: "mysql",
  host: DATABASE_HOST,
  port: DATABASE_PORT,
  username: DATABASE_USERNAME,
  password: DATABASE_PASSWORD,
}

export const DATABASE_CONTENT_CONNECTION = "content"

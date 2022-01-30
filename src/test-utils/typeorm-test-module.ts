import { TypeOrmModule } from "@nestjs/typeorm"
import { DATABASE_TEST_MAIN_NAME, DATABASE_TEST_PORT } from "config/constants"
import ormconfig from "ormconfig"
import { MysqlConnectionOptions } from "typeorm/driver/mysql/MysqlConnectionOptions"

export const ormconfigTest: MysqlConnectionOptions = {
  ...ormconfig,
  type: "mariadb",
  port: DATABASE_TEST_PORT,
  database: DATABASE_TEST_MAIN_NAME,
}

export const typeOrmTestModuleForRoot = () =>
  TypeOrmModule.forRoot({
    ...ormconfigTest,
    autoLoadEntities: true,
  })

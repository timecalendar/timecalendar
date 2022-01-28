import { TypeOrmModule } from "@nestjs/typeorm"
import { DATABASE_TEST_PORT } from "config/constants"
import ormconfig from "ormconfig"
import { MysqlConnectionOptions } from "typeorm/driver/mysql/MysqlConnectionOptions"

export const ormconfigTest: MysqlConnectionOptions = {
  ...ormconfig,
  type: "mysql",
  port: DATABASE_TEST_PORT,
}

export const typeOrmTestModuleForRoot = () =>
  TypeOrmModule.forRoot({
    ...ormconfigTest,
    autoLoadEntities: true,
  })

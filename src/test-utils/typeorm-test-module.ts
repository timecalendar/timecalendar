import { TypeOrmModule } from "@nestjs/typeorm"
import { DATABASE_TEST_MAIN_NAME, DATABASE_TEST_PORT } from "config/constants"
import { dataSourceOptions } from "data-source"
import { DataSourceOptions } from "typeorm"

export const dataSourceOptionsForTest = {
  ...dataSourceOptions,
  port: DATABASE_TEST_PORT,
  database: DATABASE_TEST_MAIN_NAME,
  multipleStatements: true,
} as DataSourceOptions

export const typeOrmTestModuleForRoot = () =>
  TypeOrmModule.forRoot({
    ...dataSourceOptionsForTest,
    autoLoadEntities: true,
  })

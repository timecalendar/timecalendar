import { TypeOrmModule } from "@nestjs/typeorm"
import { dataSourceOptions } from "data-source"
import { DataSourceOptions } from "typeorm"

export const dataSourceOptionsForTest = {
  ...dataSourceOptions,
  multipleStatements: true,
} as DataSourceOptions

export const typeOrmTestModuleForRoot = () =>
  TypeOrmModule.forRoot({
    ...dataSourceOptionsForTest,
    autoLoadEntities: true,
  })

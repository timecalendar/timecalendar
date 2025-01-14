import { BullModule } from "@nestjs/bullmq"
import { ModuleMetadata } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import { REDIS_KEY_PREFIX, REDIS_URL } from "config/constants"
import { dataSourceOptions } from "data-source"

export const COMMON_IMPORTS: NonNullable<ModuleMetadata["imports"]> = [
  BullModule.forRoot({
    connection: { url: REDIS_URL },
    prefix: REDIS_KEY_PREFIX,
  }),
  TypeOrmModule.forRoot({
    ...dataSourceOptions,
    autoLoadEntities: true,
  }),
]

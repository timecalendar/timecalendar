import { IsArray, IsString } from "class-validator"

export class GetCalendarLogsDto {
  // Without @IsArray() a bare string passes `each: true`, spreads to zero
  // characters, and returns a silent empty success indistinguishable from
  // "no changes". The committed OpenAPI schema is unaffected: the Swagger
  // plugin already emits `type: array` from the TypeScript type.
  @IsArray()
  @IsString({ each: true })
  tokens: string[]
}

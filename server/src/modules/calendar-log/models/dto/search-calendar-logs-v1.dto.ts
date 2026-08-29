import { ApiPropertyOptional } from "@nestjs/swagger"
import { Transform } from "class-transformer"
import {
  ArrayMaxSize,
  IsArray,
  IsInt,
  IsISO8601,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from "class-validator"

export const MAX_SEARCH_TOKENS = 100
export const DEFAULT_SEARCH_LIMIT = 50
export const MAX_SEARCH_LIMIT = 100

// Note on the doc comments below: `nest-cli.json` runs the Swagger plugin with
// `introspectComments`, so every JSDoc block here is published verbatim into
// `openapi/openapi.json` and on into the generated clients. Keep JSDoc to what a
// consumer needs; implementation rationale goes in `//` comments, which the
// plugin ignores.
export class SearchCalendarLogsV1Dto {
  /** Calendar tokens to read. Duplicates are collapsed; at most 100 unique. */
  // Dedup runs *before* `@ArrayMaxSize`, so a device resending the same token
  // 150 times is a 200 while 101 distinct tokens is the bound violation the
  // contract rejects. Guarded on `Array.isArray` so a bare string is left
  // untouched and reaches `@IsArray()`, which 400s it instead of silently
  // spreading it to characters.
  @Transform(({ value }) =>
    Array.isArray(value) ? [...new Set(value)] : value,
  )
  @IsArray()
  @ArrayMaxSize(MAX_SEARCH_TOKENS)
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  tokens: string[]

  /** Page size, 1–100. Defaults to 50. */
  // Optionality is carried by the class default, not `@IsOptional()`: the
  // default supplies 50 whenever the key is absent, so the validators below
  // always run. That is deliberate — `@IsOptional()` skips validation on an
  // explicit `null`, which would reach the repository as `LIMIT NULL`, and
  // Postgres reads a NULL limit as *unbounded*. That is precisely the failure
  // this endpoint exists to prevent, so `null` must 400.
  //
  // `@ApiPropertyOptional` is what keeps the *contract* honest: the field is
  // not optional in TypeScript (it has a default), so the plugin would
  // otherwise publish it as required.
  //
  // Deliberately no `@Type(() => Number)` either: the body is JSON, so a quoted
  // `"50"` is a client bug that must 400 rather than be silently coerced.
  @ApiPropertyOptional({
    default: DEFAULT_SEARCH_LIMIT,
    minimum: 1,
    maximum: MAX_SEARCH_LIMIT,
  })
  @IsInt()
  @Min(1)
  @Max(MAX_SEARCH_LIMIT)
  limit: number = DEFAULT_SEARCH_LIMIT

  /** Opaque cursor from a previous page's `nextCursor`. Omit for the newest page. */
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  cursor?: string

  /**
   * ISO-8601 read watermark. When supplied without a `cursor`, the response
   * carries `unreadCount`.
   */
  // Kept as a string on the DTO; converted to a `Date` at the repository
  // boundary, the convention the shipped prune job already uses on this column.
  @IsOptional()
  @IsISO8601({ strict: true })
  unreadSince?: string
}

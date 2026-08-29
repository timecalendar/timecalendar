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

export class SearchCalendarLogsV1Dto {
  /**
   * Calendar tokens to read. Duplicates collapse *before* `@ArrayMaxSize`, so a
   * device resending the same token 150 times is a 200 while 101 distinct
   * tokens is the bound violation the contract rejects. The transform is
   * guarded on `Array.isArray` so a bare string is left untouched and reaches
   * `@IsArray()`, which 400s it instead of silently spreading it to characters.
   */
  @Transform(({ value }) =>
    Array.isArray(value) ? [...new Set(value)] : value,
  )
  @IsArray()
  @ArrayMaxSize(MAX_SEARCH_TOKENS)
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  tokens: string[]

  /**
   * Page size. Optionality is carried by the class default, not `@IsOptional()`:
   * the default supplies 50 whenever the key is absent, so the validators below
   * always run. That is deliberate — `@IsOptional()` skips validation on an
   * explicit `null`, which would reach the repository as `LIMIT NULL`, and
   * Postgres reads a NULL limit as *unbounded*. That is precisely the failure
   * this endpoint exists to prevent, so `null` must 400.
   *
   * Deliberately no `@Type(() => Number)` either: the body is JSON, so a quoted
   * `"50"` is a client bug that must 400 rather than be silently coerced.
   */
  @IsInt()
  @Min(1)
  @Max(MAX_SEARCH_LIMIT)
  limit: number = DEFAULT_SEARCH_LIMIT

  /** Opaque cursor issued by a previous page. Absent means "newest page". */
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  cursor?: string

  /**
   * Read watermark for the unread count. Kept as a string on the DTO — it is
   * converted to a `Date` at the repository boundary, the convention the
   * shipped prune job already uses against this column.
   */
  @IsOptional()
  @IsISO8601({ strict: true })
  unreadSince?: string
}

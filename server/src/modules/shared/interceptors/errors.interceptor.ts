import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  NotFoundException,
} from "@nestjs/common"
import { Observable, throwError } from "rxjs"
import { catchError } from "rxjs/operators"
import { EntityNotFoundError } from "typeorm"

@Injectable()
export class ErrorsInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      catchError((err) =>
        throwError(() => {
          if (err instanceof EntityNotFoundError) {
            return new NotFoundException("Entity not found")
          }
          return err
        }),
      ),
    )
  }
}

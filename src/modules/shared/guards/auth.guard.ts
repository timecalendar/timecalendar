import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common"
import { API_TOKEN } from "src/config/constants"

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest()

    const header = request.headers.authorization

    if (!header) {
      return false
    }

    const auth = header.split(" ")

    // We only allow bearer
    if (auth[0].toLowerCase() !== "bearer") {
      return false
    }

    return auth[1] === API_TOKEN
  }
}

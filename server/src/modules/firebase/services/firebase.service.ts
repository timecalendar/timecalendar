import { Injectable, Logger } from "@nestjs/common"
import firebaseAdmin from "config/firebase"
import { FirebaseMetricsService } from "modules/firebase/services/firebase-metrics.service"
import { NotifyOptions } from "modules/firebase/models/notify-options.model"

const INVALID_TOKEN_ERROR_CODE = "messaging/registration-token-not-registered"
const INVALID_TOKEN_ERROR_MESSAGE = "Requested entity was not found."

@Injectable()
export class FirebaseService {
  private readonly logger = new Logger(FirebaseService.name)

  constructor(private readonly metrics: FirebaseMetricsService) {}

  async notify(token: string, { notification, data }: NotifyOptions) {
    const type = data?.action ?? "unknown"

    try {
      const result = await firebaseAdmin.messaging().send({
        notification,
        data: {
          click_action: "FLUTTER_NOTIFICATION_CLICK",
          ...data,
        },
        android: {
          priority: "high",
        },
        token,
      })

      this.metrics.pushNotificationsCounter.add(1, { result: "success", type })

      return result
    } catch (e) {
      if (isInvalidTokenError(e)) {
        this.metrics.pushNotificationsCounter.add(1, {
          result: "invalid_token",
          type,
        })
        this.logger.warn(
          `FCM token no longer registered (token suffix=${tokenSuffix(
            token,
          )}); ` + `caller should remove this token from its subscriber list.`,
        )
        return null
      }
      this.metrics.pushNotificationsCounter.add(1, { result: "failure", type })
      throw e
    }
  }
}

function isInvalidTokenError(e: unknown): boolean {
  if (!e || typeof e !== "object") return false
  const code = (e as { code?: unknown }).code
  const message = (e as { message?: unknown }).message
  return (
    code === INVALID_TOKEN_ERROR_CODE || message === INVALID_TOKEN_ERROR_MESSAGE
  )
}

function tokenSuffix(token: string): string {
  return token.length > 8 ? `…${token.slice(-8)}` : token
}

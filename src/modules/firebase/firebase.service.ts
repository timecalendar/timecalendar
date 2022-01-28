import { Injectable } from "@nestjs/common"
import firebaseAdmin from "config/firebase"
import { NotifyOptions } from "./models/notify-options.model"

@Injectable()
export class FirebaseService {
  async notify(token: string, { notification, data }: NotifyOptions) {
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

      return result
    } catch (e) {
      if (e.message === "Requested entity was not found.") {
        // The token does not exist anymore
        // TODO:
        // await this.subscriberService.deleteByToken(token);
      } else {
        throw e
      }
    }
  }
}

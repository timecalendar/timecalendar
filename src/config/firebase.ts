import { readFileSync } from "fs"
import { join } from "path"
import firebaseAdmin from "firebase-admin"
import { SERVICE_ACCOUNT_KEY_PATH } from "./constants"

const serviceAccountKey = JSON.parse(
  readFileSync(join(__dirname, "../..", SERVICE_ACCOUNT_KEY_PATH), "utf-8"),
)

if (!firebaseAdmin.apps.length) {
  firebaseAdmin.initializeApp({
    credential: firebaseAdmin.credential.cert(serviceAccountKey),
  })
}

export default firebaseAdmin

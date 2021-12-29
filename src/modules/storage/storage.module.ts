import { Module } from "@nestjs/common"
import { appFirestore } from "./firestore"

export const APP_FIRESTORE = "APP_FIRESTORE"

@Module({
  providers: [
    {
      provide: APP_FIRESTORE,
      useValue: appFirestore,
    },
  ],
})
export class StorageModule {}

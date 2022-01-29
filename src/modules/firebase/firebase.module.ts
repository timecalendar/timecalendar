import { Module } from "@nestjs/common"
import { FirebaseService } from "./services/firebase.service"

@Module({
  providers: [FirebaseService],
  exports: [FirebaseService],
})
export class FirebaseModule {}

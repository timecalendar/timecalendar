import { Module } from "@nestjs/common"
import { FirebaseMetricsService } from "modules/firebase/services/firebase-metrics.service"
import { FirebaseService } from "modules/firebase/services/firebase.service"

@Module({
  providers: [FirebaseService, FirebaseMetricsService],
  exports: [FirebaseService],
})
export class FirebaseModule {}

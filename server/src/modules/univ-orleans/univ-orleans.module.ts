import { Module } from "@nestjs/common"
import { UnivOrleansController } from "modules/univ-orleans/controllers/univ-orleans.controller"
import { UnivOrleansClient } from "modules/univ-orleans/clients/univ-orleans.client"
import { UnivOrleansService } from "modules/univ-orleans/services/univ-orleans.service"

@Module({
  providers: [UnivOrleansClient, UnivOrleansService],
  controllers: [UnivOrleansController],
})
export class UnivOrleansModule {}

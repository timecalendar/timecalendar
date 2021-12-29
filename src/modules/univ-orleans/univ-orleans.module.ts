import { Module } from "@nestjs/common"
import { UnivOrleansClient } from "./univ-orleans.client"
import { UnivOrleansController } from "./univ-orleans.controller"
import { UnivOrleansService } from "./univ-orleans.service"

@Module({
  providers: [UnivOrleansClient, UnivOrleansService],
  controllers: [UnivOrleansController],
})
export class UnivOrleansModule {}

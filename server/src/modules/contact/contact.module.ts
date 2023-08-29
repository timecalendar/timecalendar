import { Module } from "@nestjs/common"
import { CrispClient } from "modules/contact/clients/crisp.client"
import { ContactController } from "modules/contact/controllers/contact.controller"
import { ContactService } from "modules/contact/services/contact.service"

@Module({
  controllers: [ContactController],
  providers: [CrispClient, ContactService],
})
export class ContactModule {}

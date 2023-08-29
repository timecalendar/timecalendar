import { Body, Controller, Post } from "@nestjs/common"
import { SendMessageDto } from "modules/contact/models/dto/send-message.dto"
import { ContactService } from "modules/contact/services/contact.service"

@Controller("/contact")
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Post()
  sendMessage(@Body() payload: SendMessageDto) {
    return this.contactService.sendMessage(payload)
  }
}

import { Body, Controller, Post } from "@nestjs/common"
import { ApiOperation, ApiTags } from "@nestjs/swagger"
import { SendMessageDto } from "modules/contact/models/dto/send-message.dto"
import { ContactService } from "modules/contact/services/contact.service"

@ApiTags("Contact")
@Controller("/contact")
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Post()
  @ApiOperation({ summary: "Contact the developers" })
  sendMessage(@Body() payload: SendMessageDto) {
    return this.contactService.sendMessage(payload)
  }
}

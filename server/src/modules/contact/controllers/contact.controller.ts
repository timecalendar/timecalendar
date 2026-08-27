import { Body, Controller, Post } from "@nestjs/common"
import {
  ApiBadRequestResponse,
  ApiOperation,
  ApiServiceUnavailableResponse,
  ApiTags,
} from "@nestjs/swagger"
import { SendMessageDto } from "modules/contact/models/dto/send-message.dto"
import {
  CONTACT_UNAVAILABLE_MESSAGE,
  ContactService,
} from "modules/contact/services/contact.service"

@ApiTags("Contact")
@Controller("/contact")
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Post()
  @ApiOperation({ summary: "Contact the developers" })
  @ApiBadRequestResponse({ description: "Invalid contact submission" })
  @ApiServiceUnavailableResponse({ description: CONTACT_UNAVAILABLE_MESSAGE })
  sendMessage(@Body() payload: SendMessageDto) {
    return this.contactService.sendMessage(payload)
  }
}

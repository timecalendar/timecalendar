import { Body, Controller, HttpCode, HttpStatus, Put } from "@nestjs/common"
import { ApiOperation, ApiTags } from "@nestjs/swagger"
import { NotificationSubscriptionCreate } from "modules/notification-subscription/models/dto/notification-subscription-create.dto"
import { NotificationSubscriptionService } from "modules/notification-subscription/services/notification-subscription.service"

@ApiTags("notification-subscription")
@Controller("notification-subscription")
export class NotificationSubscriptionController {
  constructor(
    private readonly notificationSubscriptionService: NotificationSubscriptionService,
  ) {}

  @Put()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Create or update notification subscription" })
  async createOrUpdateSubscription(
    @Body() dto: NotificationSubscriptionCreate,
  ): Promise<void> {
    await this.notificationSubscriptionService.createOrUpdateSubscription(dto)
  }
}

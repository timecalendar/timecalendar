# NotificationSubscriptionApi

All URIs are relative to *http://localhost*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**notificationSubscriptionControllerCreateOrUpdateSubscription**](#notificationsubscriptioncontrollercreateorupdatesubscription) | **PUT** /notification-subscription | Create or update notification subscription|

# **notificationSubscriptionControllerCreateOrUpdateSubscription**
> notificationSubscriptionControllerCreateOrUpdateSubscription(notificationSubscriptionCreate)


### Example

```typescript
import {
    NotificationSubscriptionApi,
    Configuration,
    NotificationSubscriptionCreate
} from './api';

const configuration = new Configuration();
const apiInstance = new NotificationSubscriptionApi(configuration);

let notificationSubscriptionCreate: NotificationSubscriptionCreate; //

const { status, data } = await apiInstance.notificationSubscriptionControllerCreateOrUpdateSubscription(
    notificationSubscriptionCreate
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **notificationSubscriptionCreate** | **NotificationSubscriptionCreate**|  | |


### Return type

void (empty response body)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: Not defined


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**204** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)


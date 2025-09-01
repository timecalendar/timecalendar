# ContactApi

All URIs are relative to *http://localhost*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**contactControllerSendMessage**](#contactcontrollersendmessage) | **POST** /contact | Contact the developers|

# **contactControllerSendMessage**
> contactControllerSendMessage(sendMessageDto)


### Example

```typescript
import {
    ContactApi,
    Configuration,
    SendMessageDto
} from './api';

const configuration = new Configuration();
const apiInstance = new ContactApi(configuration);

let sendMessageDto: SendMessageDto; //

const { status, data } = await apiInstance.contactControllerSendMessage(
    sendMessageDto
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **sendMessageDto** | **SendMessageDto**|  | |


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
|**201** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)


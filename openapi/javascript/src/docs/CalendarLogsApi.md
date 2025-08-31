# CalendarLogsApi

All URIs are relative to *http://localhost*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**calendarLogControllerGetCalendarLogs**](#calendarlogcontrollergetcalendarlogs) | **POST** /calendar-logs/search | Get calendar logs for given tokens|

# **calendarLogControllerGetCalendarLogs**
> Array<CalendarLogGet> calendarLogControllerGetCalendarLogs(getCalendarLogsDto)


### Example

```typescript
import {
    CalendarLogsApi,
    Configuration,
    GetCalendarLogsDto
} from './api';

const configuration = new Configuration();
const apiInstance = new CalendarLogsApi(configuration);

let getCalendarLogsDto: GetCalendarLogsDto; //

const { status, data } = await apiInstance.calendarLogControllerGetCalendarLogs(
    getCalendarLogsDto
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **getCalendarLogsDto** | **GetCalendarLogsDto**|  | |


### Return type

**Array<CalendarLogGet>**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)


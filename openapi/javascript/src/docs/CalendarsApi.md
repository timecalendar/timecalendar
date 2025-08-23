# CalendarsApi

All URIs are relative to *http://localhost*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**calendarControllerFindCalendarByToken**](#calendarcontrollerfindcalendarbytoken) | **GET** /calendars/by-token/{token} | Find a calendar by its token|
|[**calendarSyncControllerCreateCalendar**](#calendarsynccontrollercreatecalendar) | **POST** /calendars | Create a calendar|
|[**calendarSyncControllerSyncCalendars**](#calendarsynccontrollersynccalendars) | **POST** /calendars/sync | Sync calendars|

# **calendarControllerFindCalendarByToken**
> CalendarForPublic calendarControllerFindCalendarByToken()


### Example

```typescript
import {
    CalendarsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new CalendarsApi(configuration);

let token: string; //The calendar token (default to undefined)

const { status, data } = await apiInstance.calendarControllerFindCalendarByToken(
    token
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **token** | [**string**] | The calendar token | defaults to undefined|


### Return type

**CalendarForPublic**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **calendarSyncControllerCreateCalendar**
> CreateCalendarRepDto calendarSyncControllerCreateCalendar(createCalendarDto)


### Example

```typescript
import {
    CalendarsApi,
    Configuration,
    CreateCalendarDto
} from './api';

const configuration = new Configuration();
const apiInstance = new CalendarsApi(configuration);

let createCalendarDto: CreateCalendarDto; //

const { status, data } = await apiInstance.calendarSyncControllerCreateCalendar(
    createCalendarDto
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **createCalendarDto** | **CreateCalendarDto**|  | |


### Return type

**CreateCalendarRepDto**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**201** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **calendarSyncControllerSyncCalendars**
> Array<CalendarWithContent> calendarSyncControllerSyncCalendars(syncCalendarsDto)


### Example

```typescript
import {
    CalendarsApi,
    Configuration,
    SyncCalendarsDto
} from './api';

const configuration = new Configuration();
const apiInstance = new CalendarsApi(configuration);

let syncCalendarsDto: SyncCalendarsDto; //

const { status, data } = await apiInstance.calendarSyncControllerSyncCalendars(
    syncCalendarsDto
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **syncCalendarsDto** | **SyncCalendarsDto**|  | |


### Return type

**Array<CalendarWithContent>**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**201** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)


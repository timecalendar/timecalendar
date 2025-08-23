# SchoolsApi

All URIs are relative to *http://localhost*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**schoolControllerFindSchool**](#schoolcontrollerfindschool) | **GET** /schools/{schoolId} | Find a school|
|[**schoolControllerFindSchools**](#schoolcontrollerfindschools) | **GET** /schools | Find list of schools|
|[**schoolGroupControllerFindSchoolGroups**](#schoolgroupcontrollerfindschoolgroups) | **GET** /schools/{schoolId}/school-group | Find school groups|
|[**schoolGroupControllerGetSchoolGroupsIcalUrl**](#schoolgroupcontrollergetschoolgroupsicalurl) | **POST** /schools/{schoolId}/school-group/ical | Get school groups ICal URL|
|[**schoolGroupControllerSetSchoolGroups**](#schoolgroupcontrollersetschoolgroups) | **PUT** /schools/{schoolId}/school-group | Set school groups|
|[**univOrleansControllerGetIcalUrlFromStudentNumber**](#univorleanscontrollergeticalurlfromstudentnumber) | **POST** /schools/univ-orleans/students | Get the ICal URL from a student number|

# **schoolControllerFindSchool**
> SchoolForList schoolControllerFindSchool()


### Example

```typescript
import {
    SchoolsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new SchoolsApi(configuration);

let schoolId: string; //The school id (default to undefined)

const { status, data } = await apiInstance.schoolControllerFindSchool(
    schoolId
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **schoolId** | [**string**] | The school id | defaults to undefined|


### Return type

**SchoolForList**

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

# **schoolControllerFindSchools**
> FindSchoolsRepDto schoolControllerFindSchools()


### Example

```typescript
import {
    SchoolsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new SchoolsApi(configuration);

const { status, data } = await apiInstance.schoolControllerFindSchools();
```

### Parameters
This endpoint does not have any parameters.


### Return type

**FindSchoolsRepDto**

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

# **schoolGroupControllerFindSchoolGroups**
> FindSchoolGroupsRepDto schoolGroupControllerFindSchoolGroups()


### Example

```typescript
import {
    SchoolsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new SchoolsApi(configuration);

let schoolId: string; //The school id (default to undefined)

const { status, data } = await apiInstance.schoolGroupControllerFindSchoolGroups(
    schoolId
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **schoolId** | [**string**] | The school id | defaults to undefined|


### Return type

**FindSchoolGroupsRepDto**

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

# **schoolGroupControllerGetSchoolGroupsIcalUrl**
> GetSchoolGroupsIcalUrlRepDto schoolGroupControllerGetSchoolGroupsIcalUrl(getSchoolGroupsIcalUrlDto)


### Example

```typescript
import {
    SchoolsApi,
    Configuration,
    GetSchoolGroupsIcalUrlDto
} from './api';

const configuration = new Configuration();
const apiInstance = new SchoolsApi(configuration);

let schoolId: string; //The school id (default to undefined)
let getSchoolGroupsIcalUrlDto: GetSchoolGroupsIcalUrlDto; //

const { status, data } = await apiInstance.schoolGroupControllerGetSchoolGroupsIcalUrl(
    schoolId,
    getSchoolGroupsIcalUrlDto
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **getSchoolGroupsIcalUrlDto** | **GetSchoolGroupsIcalUrlDto**|  | |
| **schoolId** | [**string**] | The school id | defaults to undefined|


### Return type

**GetSchoolGroupsIcalUrlRepDto**

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

# **schoolGroupControllerSetSchoolGroups**
> schoolGroupControllerSetSchoolGroups(setSchoolGroupDto)


### Example

```typescript
import {
    SchoolsApi,
    Configuration,
    SetSchoolGroupDto
} from './api';

const configuration = new Configuration();
const apiInstance = new SchoolsApi(configuration);

let schoolId: string; //The school id (default to undefined)
let setSchoolGroupDto: SetSchoolGroupDto; //

const { status, data } = await apiInstance.schoolGroupControllerSetSchoolGroups(
    schoolId,
    setSchoolGroupDto
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **setSchoolGroupDto** | **SetSchoolGroupDto**|  | |
| **schoolId** | [**string**] | The school id | defaults to undefined|


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
|**200** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **univOrleansControllerGetIcalUrlFromStudentNumber**
> univOrleansControllerGetIcalUrlFromStudentNumber(orleansGetIcalUrlFromStudentNumberDto)


### Example

```typescript
import {
    SchoolsApi,
    Configuration,
    OrleansGetIcalUrlFromStudentNumberDto
} from './api';

const configuration = new Configuration();
const apiInstance = new SchoolsApi(configuration);

let orleansGetIcalUrlFromStudentNumberDto: OrleansGetIcalUrlFromStudentNumberDto; //

const { status, data } = await apiInstance.univOrleansControllerGetIcalUrlFromStudentNumber(
    orleansGetIcalUrlFromStudentNumberDto
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **orleansGetIcalUrlFromStudentNumberDto** | **OrleansGetIcalUrlFromStudentNumberDto**|  | |


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


# FeatureFlagsApi

All URIs are relative to *http://localhost*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**featureFlagControllerEvaluateFlags**](#featureflagcontrollerevaluateflags) | **GET** /feature-flags/evaluate | Evaluate multiple feature flags|

# **featureFlagControllerEvaluateFlags**
> object featureFlagControllerEvaluateFlags()


### Example

```typescript
import {
    FeatureFlagsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new FeatureFlagsApi(configuration);

let keys: string; // (default to undefined)

const { status, data } = await apiInstance.featureFlagControllerEvaluateFlags(
    keys
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **keys** | [**string**] |  | defaults to undefined|


### Return type

**object**

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


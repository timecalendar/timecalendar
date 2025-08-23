# CalendarEventForPublic


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**type** | [**EventTypeEnum**](EventTypeEnum.md) |  | [default to undefined]
**color** | **string** |  | [default to undefined]
**groupColor** | **string** |  | [default to undefined]
**uid** | **string** |  | [default to undefined]
**title** | **string** |  | [default to undefined]
**startsAt** | **string** |  | [default to undefined]
**endsAt** | **string** |  | [default to undefined]
**location** | **string** |  | [default to undefined]
**allDay** | **boolean** |  | [default to undefined]
**description** | **string** |  | [default to undefined]
**teachers** | **Array&lt;string&gt;** |  | [default to undefined]
**tags** | [**Array&lt;EventTag&gt;**](EventTag.md) |  | [default to undefined]
**fields** | [**CalendarEventCustomFields**](CalendarEventCustomFields.md) |  | [default to undefined]
**exportedAt** | **string** |  | [default to undefined]

## Example

```typescript
import { CalendarEventForPublic } from './api';

const instance: CalendarEventForPublic = {
    type,
    color,
    groupColor,
    uid,
    title,
    startsAt,
    endsAt,
    location,
    allDay,
    description,
    teachers,
    tags,
    fields,
    exportedAt,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)

# SalesAction

영업 액션

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**actionId** | **number** |  | [optional] [default to undefined]
**type** | [**SalesActionType**](SalesActionType.md) |  | [default to undefined]
**title** | **string** |  | [default to undefined]
**content** | **string** |  | [default to undefined]
**date** | **string** |  | [default to undefined]
**stateChange** | [**StateChange**](StateChange.md) |  | [optional] [default to undefined]

## Example

```typescript
import { SalesAction } from './api';

const instance: SalesAction = {
    actionId,
    type,
    title,
    content,
    date,
    stateChange,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)

# ActionState

액션 수행 시점의 상태

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**possibility** | [**PossibilityType**](PossibilityType.md) |  | [optional] [default to undefined]
**targetRevenue** | **number** |  | [optional] [default to undefined]
**targetDate** | **string** |  | [optional] [default to undefined]
**test** | **boolean** |  | [optional] [default to false]
**quote** | **boolean** |  | [optional] [default to false]
**approval** | **boolean** |  | [optional] [default to false]
**contract** | **boolean** |  | [optional] [default to false]

## Example

```typescript
import { ActionState } from './api';

const instance: ActionState = {
    possibility,
    targetRevenue,
    targetDate,
    test,
    quote,
    approval,
    contract,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)

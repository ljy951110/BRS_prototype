# PeriodData

시점별 데이터 (현재/과거 공통)

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**trustIndex** | **number** |  | [optional] [default to undefined]
**possibility** | [**Possibility**](Possibility.md) |  | [optional] [default to undefined]
**targetRevenue** | **number** |  | [optional] [default to undefined]
**targetMonth** | **number** |  | [optional] [default to undefined]
**test** | **boolean** |  | [optional] [default to false]
**quote** | **boolean** |  | [optional] [default to false]
**approval** | **boolean** |  | [optional] [default to false]
**contract** | **boolean** |  | [optional] [default to false]

## Example

```typescript
import { PeriodData } from './api';

const instance: PeriodData = {
    trustIndex,
    possibility,
    targetRevenue,
    targetMonth,
    test,
    quote,
    approval,
    contract,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)

# CustomerDetailPeriodData

고객 상세용 시점별 데이터 (targetDate 포함)

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**trustIndex** | **number** |  | [optional] [default to undefined]
**possibility** | **string** |  | [optional] [default to '0%']
**targetRevenue** | **number** |  | [optional] [default to undefined]
**targetDate** | **string** |  | [optional] [default to undefined]
**test** | **boolean** |  | [optional] [default to false]
**quote** | **boolean** |  | [optional] [default to false]
**approval** | **boolean** |  | [optional] [default to false]
**contract** | **boolean** |  | [optional] [default to false]

## Example

```typescript
import { CustomerDetailPeriodData } from './api';

const instance: CustomerDetailPeriodData = {
    trustIndex,
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

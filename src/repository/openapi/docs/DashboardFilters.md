# DashboardFilters

대시보드 필터

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**companySizes** | [**Array&lt;CompanySize&gt;**](CompanySize.md) |  | [optional] [default to undefined]
**managers** | **Array&lt;string&gt;** |  | [optional] [default to undefined]
**categories** | [**Array&lt;Category&gt;**](Category.md) |  | [optional] [default to undefined]
**productUsages** | [**Array&lt;ProductType&gt;**](ProductType.md) |  | [optional] [default to undefined]
**possibilityRange** | [**PossibilityRange**](PossibilityRange.md) |  | [optional] [default to undefined]
**stages** | [**Array&lt;ProgressStage&gt;**](ProgressStage.md) |  | [optional] [default to undefined]
**contractAmountRange** | [**AmountRange**](AmountRange.md) |  | [optional] [default to undefined]
**targetRevenueRange** | [**AmountRange**](AmountRange.md) |  | [optional] [default to undefined]
**expectedRevenueRange** | [**AmountRange**](AmountRange.md) |  | [optional] [default to undefined]
**currentQuarterRevenueRange** | [**AmountRange**](AmountRange.md) |  | [optional] [default to undefined]
**targetMonthRange** | [**DateRangeFilter**](DateRangeFilter.md) |  | [optional] [default to undefined]
**lastContactDateRange** | [**DateRangeFilter**](DateRangeFilter.md) |  | [optional] [default to undefined]
**lastMBMDateRange** | [**DateRangeFilter**](DateRangeFilter.md) |  | [optional] [default to undefined]

## Example

```typescript
import { DashboardFilters } from './api';

const instance: DashboardFilters = {
    companySizes,
    managers,
    categories,
    productUsages,
    possibilityRange,
    stages,
    contractAmountRange,
    targetRevenueRange,
    expectedRevenueRange,
    currentQuarterRevenueRange,
    targetMonthRange,
    lastContactDateRange,
    lastMBMDateRange,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)

# CompanyWeeklyScore

기업별 주간 집계 점수 (최고점 기준)

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**company_id** | **string** |  | [default to undefined]
**year_week** | **string** |  | [default to undefined]
**contact_count** | **number** |  | [optional] [default to 0]
**max_new_mkt_score** | **number** |  | [optional] [default to undefined]
**max_new_sales_fit_score** | **number** |  | [optional] [default to undefined]
**max_customer_mkt_score** | **number** |  | [optional] [default to undefined]
**max_customer_usage_score** | **number** |  | [optional] [default to undefined]

## Example

```typescript
import { CompanyWeeklyScore } from './api';

const instance: CompanyWeeklyScore = {
    company_id,
    year_week,
    contact_count,
    max_new_mkt_score,
    max_new_sales_fit_score,
    max_customer_mkt_score,
    max_customer_usage_score,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)

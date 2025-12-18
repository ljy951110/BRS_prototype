# TrustScore

신뢰 점수 데이터

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**company_id** | **string** |  | [default to undefined]
**year_week** | **string** |  | [default to undefined]
**avg_score** | **number** |  | [optional] [default to undefined]
**max_score** | **number** |  | [optional] [default to undefined]
**min_score** | **number** |  | [optional] [default to undefined]
**lead_count** | **number** |  | [optional] [default to 0]
**is_before_deal** | **boolean** |  | [optional] [default to false]

## Example

```typescript
import { TrustScore } from './api';

const instance: TrustScore = {
    company_id,
    year_week,
    avg_score,
    max_score,
    min_score,
    lead_count,
    is_before_deal,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)

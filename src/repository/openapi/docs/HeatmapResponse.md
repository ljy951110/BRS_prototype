# HeatmapResponse

히트맵 API 응답

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**companies** | [**Array&lt;Company&gt;**](Company.md) |  | [default to undefined]
**weeks** | [**Array&lt;Week&gt;**](Week.md) |  | [default to undefined]
**scores** | [**Array&lt;TrustScore&gt;**](TrustScore.md) |  | [default to undefined]
**events** | [**Array&lt;MarketingEvent&gt;**](MarketingEvent.md) |  | [default to undefined]
**attendance** | [**Array&lt;EventAttendance&gt;**](EventAttendance.md) |  | [default to undefined]

## Example

```typescript
import { HeatmapResponse } from './api';

const instance: HeatmapResponse = {
    companies,
    weeks,
    scores,
    events,
    attendance,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)

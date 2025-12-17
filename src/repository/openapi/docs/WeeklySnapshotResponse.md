# WeeklySnapshotResponse

Weekly Snapshot 히트맵 API 응답

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**companies** | [**Array&lt;AppsDashboardApiModelsWeeklySnapshotCompany&gt;**](AppsDashboardApiModelsWeeklySnapshotCompany.md) |  | [default to undefined]
**weeks** | [**Array&lt;AppsDashboardApiModelsWeeklySnapshotWeek&gt;**](AppsDashboardApiModelsWeeklySnapshotWeek.md) |  | [default to undefined]
**scores** | [**Array&lt;CompanyWeeklyScore&gt;**](CompanyWeeklyScore.md) |  | [default to undefined]
**events** | [**Array&lt;AppsDashboardApiModelsWeeklySnapshotMarketingEvent&gt;**](AppsDashboardApiModelsWeeklySnapshotMarketingEvent.md) |  | [optional] [default to undefined]
**attendance** | [**Array&lt;AppsDashboardApiModelsWeeklySnapshotEventAttendance&gt;**](AppsDashboardApiModelsWeeklySnapshotEventAttendance.md) |  | [optional] [default to undefined]
**total_counts** | [**TotalCounts**](TotalCounts.md) |  | [optional] [default to undefined]

## Example

```typescript
import { WeeklySnapshotResponse } from './api';

const instance: WeeklySnapshotResponse = {
    companies,
    weeks,
    scores,
    events,
    attendance,
    total_counts,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)

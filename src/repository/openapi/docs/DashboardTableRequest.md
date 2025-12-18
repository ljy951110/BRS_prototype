# DashboardTableRequest

대시보드 테이블 요청

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**dateRange** | [**DateRange**](DateRange.md) |  | [default to undefined]
**search** | [**SearchFilter**](SearchFilter.md) |  | [optional] [default to undefined]
**filters** | [**DashboardFilters**](DashboardFilters.md) |  | [optional] [default to undefined]
**sort** | [**SortConfig**](SortConfig.md) |  | [optional] [default to undefined]
**pagination** | [**PaginationConfig**](PaginationConfig.md) |  | [optional] [default to undefined]

## Example

```typescript
import { DashboardTableRequest } from './api';

const instance: DashboardTableRequest = {
    dateRange,
    search,
    filters,
    sort,
    pagination,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)

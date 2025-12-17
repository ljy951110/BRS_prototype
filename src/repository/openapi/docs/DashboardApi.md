# DashboardApi

All URIs are relative to *http://localhost*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**getDashboardCompaniesApiV1DashboardCompaniesPost**](#getdashboardcompaniesapiv1dashboardcompaniespost) | **POST** /api/v1/dashboard/companies | Get Dashboard Companies|
|[**getFilterOptionsApiV1DashboardCompaniesFiltersGet**](#getfilteroptionsapiv1dashboardcompaniesfiltersget) | **GET** /api/v1/dashboard/companies/filters | Get Filter Options|

# **getDashboardCompaniesApiV1DashboardCompaniesPost**
> DashboardTableResponse getDashboardCompaniesApiV1DashboardCompaniesPost(dashboardTableRequest)

고객사 파이프라인 현황 테이블 조회  복합 필터링, 정렬, 페이지네이션을 지원합니다.  - **dateRange**: 날짜 범위 (startDate ~ endDate, YYYY-MM-DD)     - startDate: 전기(previous) 기준점     - endDate: 현재(current) 기준점 - **search**: 기업명 부분 검색 - **filters**: 다중 선택 필터 (기업규모, 담당자, 카테고리, 제품 등) - **sort**: 정렬 필드와 방향 - **pagination**: 페이지 번호와 페이지 크기  Returns:     rows: 테이블 행 데이터 (productUsage, lastMBMDate, lastContactDate 포함)     total: 전체 건수     currentPage: 현재 페이지     pageSize: 페이지 크기

### Example

```typescript
import {
    DashboardApi,
    Configuration,
    DashboardTableRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new DashboardApi(configuration);

let dashboardTableRequest: DashboardTableRequest; //

const { status, data } = await apiInstance.getDashboardCompaniesApiV1DashboardCompaniesPost(
    dashboardTableRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **dashboardTableRequest** | **DashboardTableRequest**|  | |


### Return type

**DashboardTableResponse**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Successful Response |  -  |
|**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getFilterOptionsApiV1DashboardCompaniesFiltersGet**
> any getFilterOptionsApiV1DashboardCompaniesFiltersGet()

대시보드 필터 옵션 조회  사용 가능한 필터 값 목록을 반환합니다.  Returns:     managers: 담당자 목록     companySizes: 사용 중인 기업 규모 목록     categories: 사용 중인 카테고리 목록

### Example

```typescript
import {
    DashboardApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new DashboardApi(configuration);

const { status, data } = await apiInstance.getFilterOptionsApiV1DashboardCompaniesFiltersGet();
```

### Parameters
This endpoint does not have any parameters.


### Return type

**any**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Successful Response |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)


# WeeklySnapshotsApi

All URIs are relative to *http://localhost*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**getOwnersApiV1WeeklySnapshotsOwnersGet**](#getownersapiv1weeklysnapshotsownersget) | **GET** /api/v1/weekly-snapshots/owners | Get Owners|
|[**getSnapshotCompaniesApiV1WeeklySnapshotsCompaniesGet**](#getsnapshotcompaniesapiv1weeklysnapshotscompaniesget) | **GET** /api/v1/weekly-snapshots/companies | Get Snapshot Companies|
|[**getSnapshotStatsApiV1WeeklySnapshotsStatsGet**](#getsnapshotstatsapiv1weeklysnapshotsstatsget) | **GET** /api/v1/weekly-snapshots/stats | Get Snapshot Stats|
|[**getWeeklySnapshotsApiV1WeeklySnapshotsGet**](#getweeklysnapshotsapiv1weeklysnapshotsget) | **GET** /api/v1/weekly-snapshots | Get Weekly Snapshots|

# **getOwnersApiV1WeeklySnapshotsOwnersGet**
> any getOwnersApiV1WeeklySnapshotsOwnersGet()

영업담당자 목록 조회 (활성 담당자만)

### Example

```typescript
import {
    WeeklySnapshotsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new WeeklySnapshotsApi(configuration);

const { status, data } = await apiInstance.getOwnersApiV1WeeklySnapshotsOwnersGet();
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

# **getSnapshotCompaniesApiV1WeeklySnapshotsCompaniesGet**
> any getSnapshotCompaniesApiV1WeeklySnapshotsCompaniesGet()

스냅샷 데이터가 있는 기업 목록 검색

### Example

```typescript
import {
    WeeklySnapshotsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new WeeklySnapshotsApi(configuration);

let search: string; //기업명 검색어 (optional) (default to undefined)
let limit: number; //최대 결과 수 (optional) (default to 50)

const { status, data } = await apiInstance.getSnapshotCompaniesApiV1WeeklySnapshotsCompaniesGet(
    search,
    limit
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **search** | [**string**] | 기업명 검색어 | (optional) defaults to undefined|
| **limit** | [**number**] | 최대 결과 수 | (optional) defaults to 50|


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
|**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getSnapshotStatsApiV1WeeklySnapshotsStatsGet**
> any getSnapshotStatsApiV1WeeklySnapshotsStatsGet()

주간 스냅샷 통계 정보

### Example

```typescript
import {
    WeeklySnapshotsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new WeeklySnapshotsApi(configuration);

const { status, data } = await apiInstance.getSnapshotStatsApiV1WeeklySnapshotsStatsGet();
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

# **getWeeklySnapshotsApiV1WeeklySnapshotsGet**
> WeeklySnapshotResponse getWeeklySnapshotsApiV1WeeklySnapshotsGet()

주간 스냅샷 히트맵 데이터 조회  기업별 주간 스냅샷 점수 데이터를 반환합니다.  - **start_date**: 조회 시작일 (기본: 3개월 전) - **end_date**: 조회 종료일 (기본: 오늘) - **company_ids**: 필터링할 기업 ID (쉼표 구분) - **list_ids**: 필터링할 리스트 ID (쉼표 구분) - **limit**: 최대 조회 기업 수 (기본: 100, 최대: 1000)  Returns:     companies: 기업 목록     weeks: 주차 목록     scores: 기업별 주간 점수 (신규/기존 고객별 마케팅 점수, 세일즈 적합도 점수)

### Example

```typescript
import {
    WeeklySnapshotsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new WeeklySnapshotsApi(configuration);

let startDate: string; //시작일 (기본: 3개월 전) (optional) (default to undefined)
let endDate: string; //종료일 (기본: 오늘) (optional) (default to undefined)
let companyIds: string; //쉼표로 구분된 기업 ID 목록 (optional) (default to undefined)
let listIds: string; //쉼표로 구분된 리스트 ID 목록 (리스트에 속한 기업만 조회) (optional) (default to undefined)
let ownerIds: string; //쉼표로 구분된 영업담당자 ID 목록 (optional) (default to undefined)
let productUsages: string; //쉼표로 구분된 제품사용 목록 (예: ATS,역량검사,온보딩) (optional) (default to undefined)
let limit: number; //최대 기업 수 (optional) (default to 100)

const { status, data } = await apiInstance.getWeeklySnapshotsApiV1WeeklySnapshotsGet(
    startDate,
    endDate,
    companyIds,
    listIds,
    ownerIds,
    productUsages,
    limit
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **startDate** | [**string**] | 시작일 (기본: 3개월 전) | (optional) defaults to undefined|
| **endDate** | [**string**] | 종료일 (기본: 오늘) | (optional) defaults to undefined|
| **companyIds** | [**string**] | 쉼표로 구분된 기업 ID 목록 | (optional) defaults to undefined|
| **listIds** | [**string**] | 쉼표로 구분된 리스트 ID 목록 (리스트에 속한 기업만 조회) | (optional) defaults to undefined|
| **ownerIds** | [**string**] | 쉼표로 구분된 영업담당자 ID 목록 | (optional) defaults to undefined|
| **productUsages** | [**string**] | 쉼표로 구분된 제품사용 목록 (예: ATS,역량검사,온보딩) | (optional) defaults to undefined|
| **limit** | [**number**] | 최대 기업 수 | (optional) defaults to 100|


### Return type

**WeeklySnapshotResponse**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Successful Response |  -  |
|**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)


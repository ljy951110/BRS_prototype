# HeatmapApi

All URIs are relative to *http://localhost*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**getCompaniesApiV1HeatmapCompaniesGet**](#getcompaniesapiv1heatmapcompaniesget) | **GET** /api/v1/heatmap/companies | Get Companies|
|[**getEventsApiV1HeatmapEventsGet**](#geteventsapiv1heatmapeventsget) | **GET** /api/v1/heatmap/events | Get Events|
|[**getHeatmapApiV1HeatmapGet**](#getheatmapapiv1heatmapget) | **GET** /api/v1/heatmap | Get Heatmap|
|[**getListsApiV1HeatmapListsGet**](#getlistsapiv1heatmaplistsget) | **GET** /api/v1/heatmap/lists | Get Lists|

# **getCompaniesApiV1HeatmapCompaniesGet**
> any getCompaniesApiV1HeatmapCompaniesGet()

기업 목록 검색  히트맵에 표시할 기업을 검색합니다.

### Example

```typescript
import {
    HeatmapApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new HeatmapApi(configuration);

let search: string; //기업명 검색어 (optional) (default to undefined)
let limit: number; //최대 결과 수 (optional) (default to 50)

const { status, data } = await apiInstance.getCompaniesApiV1HeatmapCompaniesGet(
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

# **getEventsApiV1HeatmapEventsGet**
> any getEventsApiV1HeatmapEventsGet()

마케팅 이벤트 목록 조회  기간 내 마케팅 이벤트 목록을 반환합니다.

### Example

```typescript
import {
    HeatmapApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new HeatmapApi(configuration);

let startDate: string; //시작일 (optional) (default to undefined)
let endDate: string; //종료일 (optional) (default to undefined)

const { status, data } = await apiInstance.getEventsApiV1HeatmapEventsGet(
    startDate,
    endDate
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **startDate** | [**string**] | 시작일 | (optional) defaults to undefined|
| **endDate** | [**string**] | 종료일 | (optional) defaults to undefined|


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

# **getHeatmapApiV1HeatmapGet**
> HeatmapResponse getHeatmapApiV1HeatmapGet()

히트맵 데이터 조회  기업별 신뢰 점수 시계열 데이터와 마케팅 이벤트, 참석 정보를 반환합니다.  - **start_date**: 조회 시작일 (기본: 6개월 전) - **end_date**: 조회 종료일 (기본: 오늘) - **company_ids**: 필터링할 기업 ID (쉼표 구분) - **list_ids**: 필터링할 리스트 ID (쉼표 구분) - **limit**: 최대 조회 기업 수 (기본: 100, 최대: 1000)

### Example

```typescript
import {
    HeatmapApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new HeatmapApi(configuration);

let startDate: string; //시작일 (기본: 6개월 전) (optional) (default to undefined)
let endDate: string; //종료일 (기본: 오늘) (optional) (default to undefined)
let companyIds: string; //쉼표로 구분된 기업 ID 목록 (optional) (default to undefined)
let listIds: string; //쉼표로 구분된 리스트 ID 목록 (리스트에 속한 기업만 조회) (optional) (default to undefined)
let limit: number; //최대 기업 수 (optional) (default to 100)

const { status, data } = await apiInstance.getHeatmapApiV1HeatmapGet(
    startDate,
    endDate,
    companyIds,
    listIds,
    limit
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **startDate** | [**string**] | 시작일 (기본: 6개월 전) | (optional) defaults to undefined|
| **endDate** | [**string**] | 종료일 (기본: 오늘) | (optional) defaults to undefined|
| **companyIds** | [**string**] | 쉼표로 구분된 기업 ID 목록 | (optional) defaults to undefined|
| **listIds** | [**string**] | 쉼표로 구분된 리스트 ID 목록 (리스트에 속한 기업만 조회) | (optional) defaults to undefined|
| **limit** | [**number**] | 최대 기업 수 | (optional) defaults to 100|


### Return type

**HeatmapResponse**

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

# **getListsApiV1HeatmapListsGet**
> any getListsApiV1HeatmapListsGet()

HubSpot 리스트 목록 조회  필터링에 사용할 수 있는 리스트 목록을 반환합니다.

### Example

```typescript
import {
    HeatmapApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new HeatmapApi(configuration);

const { status, data } = await apiInstance.getListsApiV1HeatmapListsGet();
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


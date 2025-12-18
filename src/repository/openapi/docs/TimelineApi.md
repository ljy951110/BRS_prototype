# TimelineApi

All URIs are relative to *http://localhost*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**getTimelineDataApiV1TimelineGet**](#gettimelinedataapiv1timelineget) | **GET** /api/v1/timeline | Get Timeline Data|

# **getTimelineDataApiV1TimelineGet**
> any getTimelineDataApiV1TimelineGet()

타임라인 이벤트 데이터 조회  기업별 모든 이벤트를 타임라인 형식으로 반환: - Sales Activities: calls, meetings, notes, emails - Marketing Events: event attendance - Engagement Events: page_view, form_submit, email_click, email_open

### Example

```typescript
import {
    TimelineApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new TimelineApi(configuration);

let startDate: string; //시작일 (YYYY-MM-DD) (optional) (default to undefined)
let endDate: string; //종료일 (YYYY-MM-DD) (optional) (default to undefined)
let companyIds: string; //기업 ID 목록 (콤마 구분) (optional) (default to undefined)
let listIds: string; //리스트 ID 목록 (콤마 구분) (optional) (default to undefined)
let ownerIds: string; //담당자 ID 목록 (콤마 구분) (optional) (default to undefined)
let productUsages: string; //제품 사용 목록 (콤마 구분) (optional) (default to undefined)
let limit: number; //최대 기업 수 (optional) (default to 100)

const { status, data } = await apiInstance.getTimelineDataApiV1TimelineGet(
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
| **startDate** | [**string**] | 시작일 (YYYY-MM-DD) | (optional) defaults to undefined|
| **endDate** | [**string**] | 종료일 (YYYY-MM-DD) | (optional) defaults to undefined|
| **companyIds** | [**string**] | 기업 ID 목록 (콤마 구분) | (optional) defaults to undefined|
| **listIds** | [**string**] | 리스트 ID 목록 (콤마 구분) | (optional) defaults to undefined|
| **ownerIds** | [**string**] | 담당자 ID 목록 (콤마 구분) | (optional) defaults to undefined|
| **productUsages** | [**string**] | 제품 사용 목록 (콤마 구분) | (optional) defaults to undefined|
| **limit** | [**number**] | 최대 기업 수 | (optional) defaults to 100|


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


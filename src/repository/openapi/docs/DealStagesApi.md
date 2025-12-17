# DealStagesApi

All URIs are relative to *http://localhost*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**getDealStagesApiV1DealStagesGet**](#getdealstagesapiv1dealstagesget) | **GET** /api/v1/deal-stages | Get Deal Stages|

# **getDealStagesApiV1DealStagesGet**
> any getDealStagesApiV1DealStagesGet()

Deal Stage 히스토리 데이터 조회  기업별 Deal의 Stage 변화 히스토리를 타임라인 형식으로 반환: - Company → Leads → Deal_Contacts → Deals → Deal_Stage_History 경로로 조회 - 각 Deal의 Stage 전환 이력 및 체류 기간 포함 - pipeline_ids로 특정 파이프라인의 Deal만 필터링 가능 - owner_ids로 특정 영업담당자의 Deal만 필터링 가능

### Example

```typescript
import {
    DealStagesApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new DealStagesApi(configuration);

let startDate: string; //시작일 (YYYY-MM-DD) (optional) (default to undefined)
let endDate: string; //종료일 (YYYY-MM-DD) (optional) (default to undefined)
let companyIds: string; //기업 ID 목록 (콤마 구분) (optional) (default to undefined)
let listIds: string; //리스트 ID 목록 (콤마 구분) (optional) (default to undefined)
let pipelineIds: string; //파이프라인 ID 목록 (콤마 구분) (optional) (default to undefined)
let ownerIds: string; //영업담당자 ID 목록 (콤마 구분) (optional) (default to undefined)
let limit: number; //최대 기업 수 (optional) (default to 50)

const { status, data } = await apiInstance.getDealStagesApiV1DealStagesGet(
    startDate,
    endDate,
    companyIds,
    listIds,
    pipelineIds,
    ownerIds,
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
| **pipelineIds** | [**string**] | 파이프라인 ID 목록 (콤마 구분) | (optional) defaults to undefined|
| **ownerIds** | [**string**] | 영업담당자 ID 목록 (콤마 구분) | (optional) defaults to undefined|
| **limit** | [**number**] | 최대 기업 수 | (optional) defaults to 50|


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


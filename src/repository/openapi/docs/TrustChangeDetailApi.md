# TrustChangeDetailApi

All URIs are relative to *http://localhost*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**getTrustChangeDetailApiV1DashboardTrustChangeDetailPost**](#gettrustchangedetailapiv1dashboardtrustchangedetailpost) | **POST** /api/v1/dashboard/trust-change-detail | Get Trust Change Detail|

# **getTrustChangeDetailApiV1DashboardTrustChangeDetailPost**
> TrustChangeDetailResponse getTrustChangeDetailApiV1DashboardTrustChangeDetailPost(trustChangeDetailRequest)

신뢰지수 변동 상세 조회  신뢰지수 변동 기업 리스트에서 특정 기업 카드를 클릭했을 때 표시되는 상세 모달 데이터입니다.  - **companyId**: 조회할 기업 ID (필수) - **dateRange**: 조회 기간 (startDate ~ endDate, YYYY-MM-DD 형식)     - 해당 기간 내의 콘텐츠 소비 및 MBM 참석 이력 제공  Returns:     TrustChangeDetailResponse:         - changeAmount: 신뢰지수 변화량         - engagementItems: Engagement 목록 (이벤트 기반 활동)

### Example

```typescript
import {
    TrustChangeDetailApi,
    Configuration,
    TrustChangeDetailRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new TrustChangeDetailApi(configuration);

let trustChangeDetailRequest: TrustChangeDetailRequest; //

const { status, data } = await apiInstance.getTrustChangeDetailApiV1DashboardTrustChangeDetailPost(
    trustChangeDetailRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **trustChangeDetailRequest** | **TrustChangeDetailRequest**|  | |


### Return type

**TrustChangeDetailResponse**

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


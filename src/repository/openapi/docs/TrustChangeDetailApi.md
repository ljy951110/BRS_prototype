# TrustChangeDetailApi

All URIs are relative to *http://localhost*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**getTrustChangeDetailApiV1DashboardTrustChangeDetailGet**](#gettrustchangedetailapiv1dashboardtrustchangedetailget) | **GET** /api/v1/dashboard/trust-change-detail | Get Trust Change Detail|

# **getTrustChangeDetailApiV1DashboardTrustChangeDetailGet**
> TrustChangeDetailResponse getTrustChangeDetailApiV1DashboardTrustChangeDetailGet()

신뢰지수 변동 상세 조회  신뢰지수 변동 기업 리스트에서 특정 기업 카드를 클릭했을 때 표시되는 상세 모달 데이터입니다.  - **companyId**: 조회할 기업 ID (필수) - **period**: 조회 기간 (WEEK | MONTH | HALF_YEAR | YEAR)     - 해당 기간 내의 콘텐츠 소비 및 MBM 참석 이력 제공  Returns:     TrustChangeDetailResponse:         - companyId: 기업 ID         - companyName: 기업명         - manager: 담당 영업사원         - category: 카테고리 (채용/공공/병원/성과)         - companySize: 기업 규모 (T0/T1/T3/T5/T9/T10)         - trustIndex: 현재 신뢰지수         - trustLevel: 신뢰레벨 (P1/P2/P3)         - changeAmount: 신뢰지수 변화량 (절댓값)         - changeDirection: 변화 방향 (up/down/none)         - engagementScores: Engagement Score 목록 (이벤트 기반 활동)         - fitScores: Fit Score 목록 (속성 기반 점수)

### Example

```typescript
import {
    TrustChangeDetailApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new TrustChangeDetailApi(configuration);

let companyId: number; //조회할 기업 ID (default to undefined)
let period: TimePeriod; //조회 기간 (optional) (default to undefined)

const { status, data } = await apiInstance.getTrustChangeDetailApiV1DashboardTrustChangeDetailGet(
    companyId,
    period
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **companyId** | [**number**] | 조회할 기업 ID | defaults to undefined|
| **period** | **TimePeriod** | 조회 기간 | (optional) defaults to undefined|


### Return type

**TrustChangeDetailResponse**

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


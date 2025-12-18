# TrustIndexCardApi

All URIs are relative to *http://localhost*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**getTrustIndexCardApiV1DashboardTrustIndexGet**](#gettrustindexcardapiv1dashboardtrustindexget) | **GET** /api/v1/dashboard/trust-index | Get Trust Index Card|

# **getTrustIndexCardApiV1DashboardTrustIndexGet**
> TrustIndexCardResponse getTrustIndexCardApiV1DashboardTrustIndexGet()

신뢰지수 변동 카드 조회  전체 집합을 기준으로 계산하며, 테이블 필터를 따로 적용하지 않습니다.  - **period**: 기간 필터 (WEEK | MONTH | HALF_YEAR | YEAR)     - WEEK: 1주 전 데이터와 비교     - MONTH: 1개월 전 데이터와 비교     - HALF_YEAR: 6개월 전 데이터와 비교     - YEAR: 1년 전 데이터와 비교 - **category**: 카테고리 필터 (선택적)     - recruit: 채용     - performance: 성과     - public: 공공     - 미지정 시 전체 카테고리 대상  Returns:     TrustIndexCardResponse:         - trustUp: 신뢰지수 상승 기업 목록 (변화량 내림차순)         - trustDown: 신뢰지수 하락 기업 목록 (변화량 내림차순)

### Example

```typescript
import {
    TrustIndexCardApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new TrustIndexCardApi(configuration);

let period: TimePeriod; //기간 필터 (optional) (default to undefined)
let category: Category; //카테고리 필터 (선택적) (optional) (default to undefined)

const { status, data } = await apiInstance.getTrustIndexCardApiV1DashboardTrustIndexGet(
    period,
    category
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **period** | **TimePeriod** | 기간 필터 | (optional) defaults to undefined|
| **category** | **Category** | 카테고리 필터 (선택적) | (optional) defaults to undefined|


### Return type

**TrustIndexCardResponse**

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


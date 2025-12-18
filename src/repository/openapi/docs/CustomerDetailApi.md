# CustomerDetailApi

All URIs are relative to *http://localhost*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**getCustomerSummaryApiV1DashboardCustomerCompanyIdSummaryPost**](#getcustomersummaryapiv1dashboardcustomercompanyidsummarypost) | **POST** /api/v1/dashboard/customer/{company_id}/summary | Get Customer Summary|
|[**getSalesHistoryApiV1DashboardCustomerCompanyIdSalesHistoryPost**](#getsaleshistoryapiv1dashboardcustomercompanyidsaleshistorypost) | **POST** /api/v1/dashboard/customer/{company_id}/sales-history | Get Sales History|

# **getCustomerSummaryApiV1DashboardCustomerCompanyIdSummaryPost**
> CustomerSummaryResponse getCustomerSummaryApiV1DashboardCustomerCompanyIdSummaryPost(customerSummaryRequest)

고객 요약 정보 조회  테이블에서 행 클릭 시 표시되는 모달의 요약 탭 정보  - **company_id**: 조회할 고객사 ID - **dateRange**: 조회 기간 (startDate ~ endDate)     - startDate: 전기(previous) 기준점 (YYYY-MM-DD)     - endDate: 현재(current) 기준점 (YYYY-MM-DD)  Returns:     CustomerSummaryResponse:         - companyId: 고객사 ID         - companyName: 고객사명         - manager: 담당자명         - category: 카테고리 (recruit/performance/public)         - companySize: 기업 규모 (T0~T10)         - productUsage: 사용 중인 제품 목록         - contractAmount: 계약금액 (원 단위)         - current: 현재 시점 데이터         - previous: 전기(과거) 시점 데이터

### Example

```typescript
import {
    CustomerDetailApi,
    Configuration,
    CustomerSummaryRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new CustomerDetailApi(configuration);

let companyId: number; // (default to undefined)
let customerSummaryRequest: CustomerSummaryRequest; //

const { status, data } = await apiInstance.getCustomerSummaryApiV1DashboardCustomerCompanyIdSummaryPost(
    companyId,
    customerSummaryRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **customerSummaryRequest** | **CustomerSummaryRequest**|  | |
| **companyId** | [**number**] |  | defaults to undefined|


### Return type

**CustomerSummaryResponse**

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

# **getSalesHistoryApiV1DashboardCustomerCompanyIdSalesHistoryPost**
> SalesHistoryResponse getSalesHistoryApiV1DashboardCustomerCompanyIdSalesHistoryPost(salesHistoryRequest)

영업 히스토리 조회  테이블에서 행 클릭 시 표시되는 모달의 영업 히스토리 탭 정보  - **company_id**: 조회할 고객사 ID - **dateRange**: 조회 기간 (startDate ~ endDate)     - startDate: 조회 시작일 (YYYY-MM-DD)     - endDate: 조회 종료일 (YYYY-MM-DD)     - 해당 기간 내의 영업 액션만 반환  Returns:     SalesHistoryResponse:         - companyId: 고객사 ID         - companyName: 고객사명         - salesActions: 영업 액션 목록 (최신순)

### Example

```typescript
import {
    CustomerDetailApi,
    Configuration,
    SalesHistoryRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new CustomerDetailApi(configuration);

let companyId: number; // (default to undefined)
let salesHistoryRequest: SalesHistoryRequest; //

const { status, data } = await apiInstance.getSalesHistoryApiV1DashboardCustomerCompanyIdSalesHistoryPost(
    companyId,
    salesHistoryRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **salesHistoryRequest** | **SalesHistoryRequest**|  | |
| **companyId** | [**number**] |  | defaults to undefined|


### Return type

**SalesHistoryResponse**

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


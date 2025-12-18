# CustomerSummaryResponse

고객 요약 응답

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**companyId** | **number** |  | [default to undefined]
**companyName** | **string** |  | [default to undefined]
**manager** | **string** |  | [optional] [default to undefined]
**category** | [**Category**](Category.md) |  | [optional] [default to undefined]
**companySize** | [**CompanySize**](CompanySize.md) |  | [optional] [default to undefined]
**productUsage** | [**Array&lt;ProductType&gt;**](ProductType.md) |  | [optional] [default to undefined]
**contractAmount** | **number** |  | [optional] [default to undefined]
**current** | [**CustomerDetailPeriodData**](CustomerDetailPeriodData.md) |  | [default to undefined]
**previous** | [**CustomerDetailPeriodData**](CustomerDetailPeriodData.md) |  | [default to undefined]

## Example

```typescript
import { CustomerSummaryResponse } from './api';

const instance: CustomerSummaryResponse = {
    companyId,
    companyName,
    manager,
    category,
    companySize,
    productUsage,
    contractAmount,
    current,
    previous,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)

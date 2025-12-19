# DashboardTableRow

대시보드 테이블 행

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**companyId** | **number** |  | [default to undefined]
**companyName** | **string** |  | [default to undefined]
**companySize** | [**CompanySize**](CompanySize.md) |  | [optional] [default to undefined]
**categories** | [**Array&lt;Category&gt;**](Category.md) |  | [optional] [default to undefined]
**productUsage** | [**Array&lt;ProductType&gt;**](ProductType.md) |  | [optional] [default to undefined]
**manager** | **string** |  | [optional] [default to undefined]
**contractAmount** | **number** |  | [optional] [default to undefined]
**lastMBMDate** | **string** |  | [optional] [default to undefined]
**lastContactDate** | **string** |  | [optional] [default to undefined]
**current** | [**PeriodData**](PeriodData.md) |  | [default to undefined]
**previous** | [**PeriodData**](PeriodData.md) |  | [default to undefined]

## Example

```typescript
import { DashboardTableRow } from './api';

const instance: DashboardTableRow = {
    companyId,
    companyName,
    companySize,
    categories,
    productUsage,
    manager,
    contractAmount,
    lastMBMDate,
    lastContactDate,
    current,
    previous,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)

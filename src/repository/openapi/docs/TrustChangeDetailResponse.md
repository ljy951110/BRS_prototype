# TrustChangeDetailResponse

신뢰지수 변동 상세 응답

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**companyId** | **number** |  | [default to undefined]
**companyName** | **string** |  | [default to undefined]
**manager** | **string** |  | [optional] [default to undefined]
**category** | [**Category**](Category.md) |  | [optional] [default to undefined]
**companySize** | [**CompanySize**](CompanySize.md) |  | [optional] [default to undefined]
**trustIndex** | **number** |  | [optional] [default to undefined]
**trustLevel** | [**TrustLevel**](TrustLevel.md) |  | [optional] [default to undefined]
**changeAmount** | **number** |  | [default to undefined]
**changeDirection** | [**ChangeDirection**](ChangeDirection.md) |  | [default to undefined]
**engagementScores** | [**Array&lt;EngagementScore&gt;**](EngagementScore.md) |  | [default to undefined]
**fitScores** | [**Array&lt;FitScore&gt;**](FitScore.md) |  | [default to undefined]

## Example

```typescript
import { TrustChangeDetailResponse } from './api';

const instance: TrustChangeDetailResponse = {
    companyId,
    companyName,
    manager,
    category,
    companySize,
    trustIndex,
    trustLevel,
    changeAmount,
    changeDirection,
    engagementScores,
    fitScores,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)

# TrustChangeItem

신뢰지수 변동 항목

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**companyId** | **number** |  | [default to undefined]
**companyName** | **string** |  | [default to undefined]
**manager** | **string** |  | [optional] [default to undefined]
**category** | [**Category**](Category.md) |  | [optional] [default to undefined]
**companySize** | [**CompanySize**](CompanySize.md) |  | [optional] [default to undefined]
**pastTrustIndex** | **number** |  | [optional] [default to undefined]
**currentTrustIndex** | **number** |  | [optional] [default to undefined]

## Example

```typescript
import { TrustChangeItem } from './api';

const instance: TrustChangeItem = {
    companyId,
    companyName,
    manager,
    category,
    companySize,
    pastTrustIndex,
    currentTrustIndex,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)

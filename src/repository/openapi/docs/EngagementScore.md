# EngagementScore

Engagement Score - 이벤트 기반 활동

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**title** | **string** |  | [default to undefined]
**date** | **string** |  | [default to undefined]
**mainCategory** | [**ContentMainCategory**](ContentMainCategory.md) |  | [default to undefined]
**subCategory** | [**ContentSubCategory**](ContentSubCategory.md) |  | [default to undefined]
**action** | [**ContentActionType**](ContentActionType.md) |  | [default to undefined]
**score** | **number** |  | [default to undefined]
**url** | **string** |  | [optional] [default to undefined]
**website** | **string** |  | [optional] [default to undefined]
**introducedProduct** | **string** |  | [optional] [default to undefined]

## Example

```typescript
import { EngagementScore } from './api';

const instance: EngagementScore = {
    title,
    date,
    mainCategory,
    subCategory,
    action,
    score,
    url,
    website,
    introducedProduct,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)

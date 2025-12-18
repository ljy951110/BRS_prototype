# 전체현황 탭 - 신뢰지수 변동 상세 모달 API 인터페이스

신뢰지수 변동 기업 리스트에서 특정 기업 카드를 클릭했을 때 표시되는 상세 모달 데이터 스펙입니다. 

고객의 리드 스코어링 활동을 두 가지 유형으로 구분하여 제공합니다:
- **Engagement Score**: 이벤트 기반 활동 (아티클, 리포트, eDM, 온에어, MBM 등 콘텐츠 활동 및 이벤트 참여)
- **Fit Score**: 속성 기반 점수 (회원가입, NPS, MBM 행사만족도)
 
https://midasinfra-my.sharepoint.com/:x:/g/personal/ksi0921_jainwon_com/IQBYfGKNlWN7Tb5Ys9QnDLncAUhE_PsBd8BAPXS085NNN5E?e=pcqbLx&wdOrigin=TEAMS-MAGLEV.null_ns.rwc&wdExp=TEAMS-TREATMENT&wdhostclicktime=1765893011232&web=1[참고]

## 타입 정의 (공유)

```ts
export type CategoryType = "채용" | "공공" | "성과"; // 카테고리
export type CompanySizeType = "T0" | "T1" | "T3" | "T5" | "T9" | "T10" | null;
export type TrustLevelType = "P1" | "P2" | "P3" | null; // 신뢰 레벨


// 액션 타입
export type ContentActionType = 
  | "PAGE_VISITED"      // 페이지 방문
  | "FORM_SUBMISSION"   // 폼 제출
  | "OPENED_EMAIL"      // 이메일 오픈
  | "CLICKED_LINK"      // 이메일 링크 클릭
  | "REGISTERED"        // 등록/신청
  | "ATTENDED"          // 참석
  | "NPS_SUBMITTED";    // 만족도 제출
```

## 요청 (Request)

```ts
export interface TrustChangeDetailRequest {
  companyId: number;                                     // 조회할 기업 ID
  dateRange: { startDate: string; endDate: string };     // 조회 기간 (YYYY-MM-DD)
}
```

### 필드 설명 (Request)
- `companyId`: 상세 정보를 조회할 기업의 ID
- `dateRange`: 신뢰지수 변동 계산 기간 (startDate ~ endDate 범위 내의 콘텐츠 소비 및 MBM 참석 이력 제공)

## 응답 (Response)

```ts
export interface TrustChangeDetailResponse {
  engagementItems: EngagementScore[];   // Engagement Score (이벤트 기반 활동, MBM 포함)
  marketingEvents: MarketingEvent[];

}

export interface EngagementItem {
  title: string;                      // 콘텐츠/활동 제목
  date: string;                       // 액션 발생 날짜 (YYYY-MM-DD)
  funnelType ?: any;                  // 컨텐츠별 퍼널 스테이지 타입(TOFU, MOFU, BOFU, null) - 확인 필요
  contentType ?: any;                 // 아티클, 툴즈, 리포트, 온에어 ... - 확인 필요
  viewCount:?number;                  //컨텐츠 조회 수 (컨택들의 총 뷰 합) - 확인 필요     
  url?: string;                       // 콘텐츠 URL 있으면 내려줌
}

export interface MarketingEvent {
  date : string; //mbm 참날짜
  title : string; // 제목 
  event_url : //mbm 랜딩페이지 url 
  product : //mbm 소개 제품
  event_target :TargetType[]  신규 고가 공공 //대상
  event_type:string;

  // 추후 hubspot 데이터 쌓기 필요.
  npsScore:number | null; //추후 contacts - Hubspot customObject 기준으로 조회(현재는 null)
}

export TargetType = '신규' | '고가' | '공공'

```


## API 엔드포인트 예시

```
POST /dashboard/trust-change-detail
Content-Type: application/json
```

### 요청 예시
```
POST /dashboard/trust-change-detail
Content-Type: application/json

{
  "companyId": 4,
  "dateRange": {
    "startDate": "2024-11-01",
    "endDate": "2024-12-01"
  }
}
```

---

## 규칙
EngagementItem은 동일 컨텐츠가 여러개 조회될 경우 agreegate하여 가장 최근 조회일자와 총 조회수를 도출한다.





## 변경 이력

### 2024-12-17: 조회 기간 타입 변경
- **변경 전**: `period: TimePeriodType` ("WEEK" | "MONTH" | "HALF_YEAR" | "YEAR")
- **변경 후**: `dateRange: { startDate: string; endDate: string }` (YYYY-MM-DD 형식)
- **사유**: UI에서 RangePicker로 직접 날짜 범위를 선택하므로, API도 정확한 날짜 범위를 받도록 변경
- **API 메서드 변경**: GET → POST (날짜 범위를 바디로 전달)
- **필터링 방식**: startDate ~ endDate 범위 내의 콘텐츠 소비 및 MBM 참석 이력 반환


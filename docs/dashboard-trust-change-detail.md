# 전체현황 탭 - 신뢰지수 변동 상세 모달 API 인터페이스

신뢰지수 변동 기업 리스트에서 특정 기업 카드를 클릭했을 때 표시되는 상세 모달 데이터 스펙입니다. 

고객의 리드 스코어링 활동을 두 가지 유형으로 구분하여 제공합니다:
- **Engagement Score**: 이벤트 기반 활동 (아티클, 리포트, eDM, 온에어, MBM 등 콘텐츠 활동 및 이벤트 참여)
- **Fit Score**: 속성 기반 점수 (회원가입, NPS, MBM 행사만족도)
 
https://midasinfra-my.sharepoint.com/:x:/g/personal/ksi0921_jainwon_com/IQBYfGKNlWN7Tb5Ys9QnDLncAUhE_PsBd8BAPXS085NNN5E?e=pcqbLx&wdOrigin=TEAMS-MAGLEV.null_ns.rwc&wdExp=TEAMS-TREATMENT&wdhostclicktime=1765893011232&web=1[참고]

## 타입 정의 (공유)

```ts
export type TimePeriodType = "WEEK" | "MONTH" | "HALF_YEAR" | "YEAR"; // 기간 필터
export type CategoryType = "채용" | "공공" | "병원" | "성과"; // 카테고리
export type CompanySizeType = "T0" | "T1" | "T3" | "T5" | "T9" | "T10" | null;
export type TrustLevelType = "P1" | "P2" | "P3" | null; // 신뢰 레벨

// 콘텐츠 대분류
export type ContentMainCategoryType = 
  | "ARTICLE"           // 아티클
  | "REPORT"            // 리포트
  | "ON_AIR"            // 온에어
  | "TOOLS"             // 툴즈
  | "TOOLS_PLUS"        // 툴즈+
  | "PLANNER"           // 플래너
  | "EDM"               // eDM
  | "MBM"               // MBM (솔루션 데이, 사람경영포럼 등)
  | "ETC";              // 기타 (에이치닷 페이지 등)

// 콘텐츠 중분류
export type ContentSubCategoryType = 
  | "TOFU"              // TOFU 콘텐츠
  | "MOFU"              // MOFU 콘텐츠
  | "BOFU"              // BOFU 콘텐츠
  | "PEOPLE_MANAGEMENT" // 사람경영 아티클
  | "CLASS"             // 클래스
  | "PODCAST"           // 팟캐스트
  | "INSIGHT"           // 인사이트
  | "NEWSLETTER_INSA"   // 인사EAT 뉴스레터
  | "NEWSLETTER_PEOPLE" // 사람경영레터
  | "PROMO_EMAIL"       // 프로모션 이메일
  | "OTHER_EMAIL"       // 기타 이메일
  | "MAIN_PAGE"         // 메인 페이지
  | "TRIAL"             // 체험하기
  | "BROCHURE"          // 솔루션 소개서
  | "INQUIRY"           // 도입문의
  | "SOLUTION_PAGE"     // 솔루션/고객사례 페이지
  | "MBM_EVENT"         // MBM 이벤트 (솔루션 데이, 사람경영포럼 등)
  | "OTHER";            // 기타

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
  companyId: number;           // 조회할 기업 ID
  period: TimePeriodType;      // 조회 기간 (신뢰지수 변동 계산 기준)
}
```

### 필드 설명 (Request)
- `companyId`: 상세 정보를 조회할 기업의 ID
- `period`: 신뢰지수 변동 계산 기간. 해당 기간 내의 콘텐츠 소비 및 MBM 참석 이력 제공

## 응답 (Response)

```ts
export interface TrustChangeDetailResponse {
  changeAmount: number;                  // 변화량
  engagementScores: EngagementScore[];   // Engagement Score (이벤트 기반 활동, MBM 포함)
  fitScores: FitScore[];                 // Fit Score (속성 기반 점수)
}

export interface EngagementScore {
  title: string;                      // 콘텐츠/활동 제목
  date: string;                       // 액션 발생 날짜 (YYYY-MM-DD)
  mainCategory: ContentMainCategoryType;    // 대분류 (아티클, 리포트, 온에어, MBM 등)
  subCategory: ContentSubCategoryType;      // 중분류 (TOFU, MOFU, BOFU, MBM_EVENT 등)
  action: ContentActionType;          // 액션 타입 (페이지 방문, 폼 제출, 등록, 참석 등)
  score: number;                      // Engagement Score 배점
  url?: string;                       // 콘텐츠 URL (선택적)
  website?: string;                   // 웹사이트 URL (MBM 이벤트에서 사용)
  introducedProduct?: string;         // 소개된 제품 (MBM 이벤트에서 사용)
}

export interface FitScore {
  type: "SIGNUP" | "NPS" | "EVENT_SATISFACTION"; // Fit Score 타입
  date: string;                       // 발생 날짜 (YYYY-MM-DD)
  score: number;                      // Fit Score 배점 (회원가입: 30, NPS/만족도: -5~+5)
  description?: string;               // 추가 설명 (선택적)
}
```

### 필드 설명 (Response)

#### 기업 및 신뢰지수 정보
- `companyId`: 기업 ID
- `companyName`: 기업명
- `manager`: 담당 영업사원
- `category`: 카테고리 (채용/공공/병원/성과)
- `companySize`: 기업 규모 (T0/T1/T3/T5/T9/T10)
- `trustIndex`: 현재 신뢰지수
- `trustLevel`: 현재 신뢰레벨 (P1/P2/P3)
- `changeAmount`: 신뢰지수 변화량


#### `engagementScores[]` (Engagement Score - 이벤트 기반 활동)
고객의 콘텐츠 활동 및 이벤트 참여 내역 (배열, MBM 포함)

- `title`: 콘텐츠/활동 제목
- `date`: 액션 발생 날짜 (YYYY-MM-DD 형식)
- `mainCategory`: 콘텐츠 대분류
  - `"ARTICLE"`: 아티클
  - `"REPORT"`: 리포트
  - `"ON_AIR"`: 온에어 (클래스, 팟캐스트, 인사이트)
  - `"TOOLS"`: 툴즈
  - `"TOOLS_PLUS"`: 툴즈+
  - `"PLANNER"`: 플래너
  - `"EDM"`: eDM (뉴스레터, 프로모션 이메일 등)
  - `"MBM"`: MBM (솔루션 데이, 사람경영포럼 등)
  - `"ETC"`: 기타 (에이치닷 페이지 등)

- `subCategory`: 콘텐츠 중분류
  - `"TOFU"`: TOFU 콘텐츠
  - `"MOFU"`: MOFU 콘텐츠
  - `"BOFU"`: BOFU 콘텐츠
  - `"PEOPLE_MANAGEMENT"`: 사람경영 아티클
  - `"CLASS"`: 클래스
  - `"PODCAST"`: 팟캐스트
  - `"INSIGHT"`: 인사이트
  - `"NEWSLETTER_INSA"`: 인사EAT 뉴스레터
  - `"NEWSLETTER_PEOPLE"`: 사람경영레터
  - `"PROMO_EMAIL"`: 프로모션 이메일
  - `"OTHER_EMAIL"`: 기타 이메일
  - `"MBM_EVENT"`: MBM 이벤트
  - 기타 (메인페이지, 체험하기, 솔루션 소개서, 도입문의 등)

- `action`: 액션 타입
  - `"PAGE_VISITED"`: 페이지 방문 (0.2~0.4점)
  - `"FORM_SUBMISSION"`: 폼 제출 (3~6점)
  - `"OPENED_EMAIL"`: 이메일 오픈 (0.5~1점)
  - `"CLICKED_LINK"`: 이메일 링크 클릭 (1~2점)
  - `"REGISTERED"`: 등록/신청 (3점)
  - `"ATTENDED"`: 참석 (10점)
  - `"NPS_SUBMITTED"`: 만족도 제출 (-5~+5점)

- `score`: Engagement Score 배점
- `url`: 콘텐츠 URL (선택적)
- `website`: 웹사이트 URL (MBM 이벤트에서 사용, 선택적)
- `introducedProduct`: 소개된 제품 (MBM 이벤트에서 사용, 선택적)

#### `fitScores[]` (Fit Score - 속성 기반 점수)
고객의 속성 기반 점수 내역 (배열)

- `type`: Fit Score 타입
  - `"SIGNUP"`: 에이치닷 회원가입 (30점)
  - `"NPS"`: [HDOT] NPS 점수 (-5~+5점)
  - `"EVENT_SATISFACTION"`: MBM 행사만족도 (-5~+5점)
  
- `date`: 발생 날짜 (YYYY-MM-DD 형식)
- `score`: Fit Score 배점
  - 회원가입: 30점
  - NPS/만족도: -5~+5점
- `description`: 추가 설명 (선택적, 예: "2024 Q4 NPS 설문")

## API 엔드포인트 예시

```
GET /dashboard/trust-change-detail?companyId=123&period=MONTH
```

### 요청 예시
```
GET /dashboard/trust-change-detail?companyId=4&period=MONTH
```

### 응답 예시
```json
{
  "companyId": 4,
  "companyName": "비전바이오켐",
  "manager": "이정호",
  "category": "채용",
  "companySize": "T0",
  "trustIndex": 40,
  "trustLevel": "P2",
  "changeAmount": 4,
  "changeDirection": "up",
  "engagementScores": [
    {
      "title": "2024 HR 테크 트렌드 리포트",
      "date": "2024-11-08",
      "mainCategory": "REPORT",
      "subCategory": "TOFU",
      "action": "PAGE_VISITED",
      "score": 0.2,
      "url": "https://hdot.co.kr/reports/hr-tech-2024"
    },
    {
      "title": "2024 HR 테크 트렌드 리포트",
      "date": "2024-11-08",
      "mainCategory": "REPORT",
      "subCategory": "TOFU",
      "action": "FORM_SUBMISSION",
      "score": 3.0,
      "url": "https://hdot.co.kr/reports/hr-tech-2024"
    },
    {
      "title": "영상면접 도입 기업 사례집",
      "date": "2024-11-15",
      "mainCategory": "ARTICLE",
      "subCategory": "MOFU",
      "action": "PAGE_VISITED",
      "score": 0.3,
      "url": "https://hdot.co.kr/articles/video-interview-cases"
    },
    {
      "title": "인사EAT 뉴스레터 11월호",
      "date": "2024-11-20",
      "mainCategory": "EDM",
      "subCategory": "NEWSLETTER_INSA",
      "action": "OPENED_EMAIL",
      "score": 0.5
    },
    {
      "title": "인사EAT 뉴스레터 11월호",
      "date": "2024-11-20",
      "mainCategory": "EDM",
      "subCategory": "NEWSLETTER_INSA",
      "action": "CLICKED_LINK",
      "score": 1.0
    },
    {
      "title": "HR Tech 트렌드와 채용 자동화",
      "date": "2024-11-07",
      "mainCategory": "MBM",
      "subCategory": "MBM_EVENT",
      "action": "REGISTERED",
      "score": 3.0,
      "website": "https://hdot.co.kr/mbm/1107",
      "introducedProduct": "영상면접 큐레이터"
    },
    {
      "title": "HR Tech 트렌드와 채용 자동화",
      "date": "2024-11-07",
      "mainCategory": "MBM",
      "subCategory": "MBM_EVENT",
      "action": "ATTENDED",
      "score": 10.0,
      "website": "https://hdot.co.kr/mbm/1107",
      "introducedProduct": "영상면접 큐레이터"
    },
    {
      "title": "영상면접 도입 ROI 분석 리포트",
      "date": "2024-12-08",
      "mainCategory": "REPORT",
      "subCategory": "BOFU",
      "action": "PAGE_VISITED",
      "score": 0.4,
      "url": "https://hdot.co.kr/reports/video-interview-roi"
    },
    {
      "title": "영상면접 도입 ROI 분석 리포트",
      "date": "2024-12-08",
      "mainCategory": "REPORT",
      "subCategory": "BOFU",
      "action": "FORM_SUBMISSION",
      "score": 6.0,
      "url": "https://hdot.co.kr/reports/video-interview-roi"
    }
  ],
  "fitScores": [
    {
      "type": "SIGNUP",
      "date": "2024-10-15",
      "score": 30,
      "description": "에이치닷 회원가입"
    },
    {
      "type": "NPS",
      "date": "2024-11-25",
      "score": 4,
      "description": "2024 Q4 NPS 설문"
    },
    {
      "type": "EVENT_SATISFACTION",
      "date": "2024-11-07",
      "score": 5,
      "description": "11/7 MBM 만족도"
    }
  ]
}
```

## 주요 규칙

### 1. Engagement Score (이벤트 기반 활동)
**콘텐츠 및 이벤트 활동별 배점** (실제 계산은 백엔드에서 수행)

#### 아티클
- TOFU/MOFU/BOFU 아티클 페이지 방문: 0.2 ~ 0.4점 (TOFU:MOFU:BOFU = 1:1.5:2)
- 사람경영 아티클 페이지 방문: 0.2점

#### 리포트
- TOFU 리포트: 페이지 방문 0.2점, 폼 제출 3.0점
- MOFU 리포트: 페이지 방문 0.3점, 폼 제출 4.5점
- BOFU 리포트: 페이지 방문 0.4점, 폼 제출 6.0점

#### eDM (이메일)
- 인사EAT/사람경영 뉴스레터: 오픈 0.5점, 링크 클릭 1.0점, 구독 신청 5.0점
- 프로모션 이메일: 오픈 1.0점, 링크 클릭 2.0점
- 기타 이메일: 오픈 0.5점, 링크 클릭 1.0점

#### 온에어
- 클래스/팟캐스트/인사이트: 페이지 방문 0.2점
- 클래스: 신청/자료 다운로드 3.0점

#### 툴즈/툴즈+/플래너
- 페이지 방문: 0.2점
- 폼 제출: 3.0점

#### MBM (별도 관리)
- 페이지 방문: 0.2점
- 등록: 3.0점
- 참석: 10.0점
- 만족도 제출: -5 ~ +5점

#### 기타 (에이치닷 페이지)
- 메인 페이지: 0.2점
- 체험하기/솔루션 소개서/도입문의: 페이지 방문 0.4점, 폼 제출 6.0점

### 2. Fit Score (속성 기반 점수)
**고객 속성 및 피드백 기반 배점**

#### 회원가입
- 에이치닷 회원가입: 30.0점 (1회성, Property 기반)

#### 피드백
- [HDOT] NPS: -5 ~ +5점
- MBM 행사만족도: -5 ~ +5점 (associated contact-event)

### 데이터 범위
- `engagementScores`: 요청된 기간(`period`)에 해당하는 Engagement Score 기록 반환
  - 대분류, 중분류, 액션 타입, 배점을 모두 포함
  - MBM 관련 활동(페이지 방문, 등록, 참석) 포함
  - 동일 콘텐츠/이벤트에 대한 여러 액션(예: 페이지 방문 + 폼 제출, MBM 등록 + 참석)은 각각 별도 항목으로 반환
  
- `fitScores`: 요청된 기간(`period`)에 해당하는 Fit Score 기록 반환
  - 회원가입, NPS, MBM 행사만족도 등 속성 기반 점수
  - 회원가입은 1회성이므로 해당 기간 내 발생한 경우에만 포함

### 정렬 순서
- `engagementScores`: 날짜 역순 정렬 권장 (최신순)
  - 동일 날짜의 경우, 액션 타입 우선순위: ATTENDED > REGISTERED > FORM_SUBMISSION > PAGE_VISITED
- `fitScores`: 날짜 역순 정렬 권장 (최신순)

### 특이사항
- 신뢰지수 변화량(`changeAmount`)은 절댓값으로 제공
- 변화 방향은 `changeDirection` 필드로 별도 제공 (`"up"`, `"down"`, `"none"`)
- Engagement Score가 없는 경우 빈 배열 `[]` 반환
- Fit Score가 없는 경우 빈 배열 `[]` 반환
- 신뢰레벨(P1/P2/P3)은 신뢰지수 범위에 따라 결정:
  - P1: 80 이상
  - P2: 40~79
  - P3: 40 미만
- 스코어(`score`)는 소수점 첫째 자리까지 표시 (예: 0.2, 3.0, 30.0)
- Engagement Score: 동일 콘텐츠/이벤트에 대한 여러 액션은 별도 항목으로 구분
  - 예: "리포트 페이지 방문" + "리포트 폼 제출" → 2개 항목
  - 예: "MBM 등록" + "MBM 참석" → 2개 항목
- Fit Score: 회원가입은 1회성, NPS/만족도는 여러 번 발생 가능
- MBM 관련 데이터는 engagementScores(활동)와 fitScores(만족도)에 분산되어 포함

## 화면 표시 가이드

### 모달 타이틀
```
[기업명] - 리드 스코어링 상세 (예: "비전바이오켐 - 리드 스코어링 상세")
```

### 모달 구조
모달은 두 개의 주요 섹션으로 구성됩니다:
1. Engagement Score (이벤트 기반 활동 - 콘텐츠, MBM 등)
2. Fit Score (속성 기반 점수 - 회원가입, NPS, 만족도)

### Engagement Score 섹션 (이벤트 기반 활동)
```
Engagement Score (9건)
고객의 콘텐츠 활동 및 이벤트 참여 내역입니다.

┌─────────────────────────────────────────────────────┐
│ 📖 영상면접 도입 ROI 분석 리포트                     │
│    2024-12-08   [리포트·BOFU]  폼 제출     +6.0p   │
├─────────────────────────────────────────────────────┤
│ 📖 영상면접 도입 ROI 분석 리포트                     │
│    2024-12-08   [리포트·BOFU]  페이지 방문  +0.4p  │
├─────────────────────────────────────────────────────┤
│ 📧 인사EAT 뉴스레터 11월호                           │
│    2024-11-20   [eDM·뉴스레터]  링크 클릭   +1.0p  │
├─────────────────────────────────────────────────────┤
│ 📧 인사EAT 뉴스레터 11월호                           │
│    2024-11-20   [eDM·뉴스레터]  이메일 오픈  +0.5p │
├─────────────────────────────────────────────────────┤
│ 📖 영상면접 도입 기업 사례집                         │
│    2024-11-15   [아티클·MOFU]  페이지 방문  +0.3p  │
├─────────────────────────────────────────────────────┤
│ 📖 2024 HR 테크 트렌드 리포트                        │
│    2024-11-08   [리포트·TOFU]  폼 제출     +3.0p   │
├─────────────────────────────────────────────────────┤
│ 📖 2024 HR 테크 트렌드 리포트                        │
│    2024-11-08   [리포트·TOFU]  페이지 방문  +0.2p  │
├─────────────────────────────────────────────────────┤
│ 🎯 HR Tech 트렌드와 채용 자동화                      │
│    2024-11-07   [MBM·이벤트]   참석       +10.0p  │
│    💡 소개 제품: 영상면접 큐레이터                   │
├─────────────────────────────────────────────────────┤
│ 🎯 HR Tech 트렌드와 채용 자동화                      │
│    2024-11-07   [MBM·이벤트]   등록        +3.0p   │
│    💡 소개 제품: 영상면접 큐레이터                   │
└─────────────────────────────────────────────────────┘

※ engagementScores가 빈 배열인 경우:
Engagement Score 활동 내역이 없습니다.
```

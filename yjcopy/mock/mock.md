# 고객 데이터 (Mock Data)

```json
[
  {
    "no": 4,
    "companyName": "비전바이오켐",
    "companySize": "T0",
    "category": "채용",
    "productUsage": "ATS/역검",
    "manager": "이정호",
    "renewalDate": "25.10.18",
    "contractAmount": 11000000,
    "hDot": true,
    "trustLevel": "P2",
    "trustIndex": 40,
    "changeAmount": 4,
    "changeDirection": "up",
    "rank": 5,
    "trustHistory": {
      "1104": { "trustIndex": 36, "trustLevel": "P3" },
      "1111": { "trustIndex": 37, "trustLevel": "P3" },
      "1118": { "trustIndex": 38, "trustLevel": "P3" },
      "1125": { "trustIndex": 38, "trustLevel": "P3" },
      "1202": { "trustIndex": 39, "trustLevel": "P3" },
      "1209": { "trustIndex": 40, "trustLevel": "P2" }
    },
    "attendance": { "1107": true },
    "salesActions": [
      {
        "type": "meeting",
        "content": "MBM 세미나 참석, 영상면접 큐레이터 관심 표명",
        "date": "2024-11-07",
        "possibility": "40%",
        "customerResponse": "중",
        "targetRevenue": null,
        "test": false,
        "quote": false,
        "approval": false,
        "contract": false
      },
      {
        "type": "call",
        "content": "추가 정보 요청 대응",
        "date": "2024-11-18",
        "possibility": "40%",
        "customerResponse": "중",
        "targetRevenue": 5000000,
        "test": true,
        "quote": false,
        "approval": false,
        "contract": false
      },
      {
        "type": "call",
        "content": "채용 예산 확인 요청, 1월 중 확정 후 연락 예정",
        "date": "2024-12-05",
        "possibility": "40%",
        "customerResponse": "중",
        "targetRevenue": 5000000,
        "test": true,
        "quote": true,
        "approval": false,
        "contract": false
      },
      {
        "type": "meeting",
        "content": "품의 진행 확정, 내부 승인 프로세스 시작",
        "date": "2024-12-09",
        "possibility": "90%",
        "customerResponse": "상",
        "targetRevenue": 5000000,
        "test": true,
        "quote": true,
        "approval": true,
        "contract": false
      }
    ],
    "contentEngagements": [
      {
        "title": "2024 HR 테크 트렌드 리포트",
        "date": "2024-11-08",
        "category": "TOFU"
      },
      {
        "title": "영상면접 도입 기업 사례집",
        "date": "2024-11-15",
        "category": "MOFU"
      },
      {
        "title": "AI 채용의 미래: 2025 전망",
        "date": "2024-11-22",
        "category": "TOFU"
      },
      {
        "title": "큐레이터 기능 상세 가이드",
        "date": "2024-12-03",
        "category": "MOFU"
      }
    ],
    "trustFormation": {
      "customerResponse": "중",
      "targetDate": "1월말",
      "targetRevenueMin": null,
      "targetRevenueMax": null,
      "detail": "11/7, 기존 : 총계약규모 1,100만원 + 홍보비용 (100만원) - 영상면접큐레이터, 담당자는 공감/흥미는 있으나, 내부적으로는 비용이슈가 있어서 내년에 다시 이야기를 해보겠음",
      "interestFunction": "영상면접 큐레이터"
    },
    "valueRecognition": {
      "customerResponse": "중",
      "possibility": "40%",
      "targetDate": "1월",
      "targetRevenue": null,
      "test": true,
      "quote": false,
      "approval": false,
      "contract": false,
      "simulation": null
    },
    "adoptionDecision": {
      "customerResponse": "중",
      "possibility": "40%",
      "targetDate": "1월",
      "targetRevenue": null,
      "test": true,
      "quote": false,
      "approval": false,
      "contract": false,
      "simulation": null
    }
  },
  {
    "no": 8,
    "companyName": "도쿄일렉트론코리아",
    "companySize": "T9",
    "category": "채용",
    "productUsage": "ATS/역검",
    "manager": "이정호",
    "renewalDate": "26.03.31",
    "contractAmount": 50000000,
    "hDot": true,
    "trustLevel": "P3",
    "trustIndex": 28,
    "changeAmount": 3,
    "changeDirection": "up",
    "rank": null,
    "trustHistory": {
      "1104": { "trustIndex": 25, "trustLevel": "P3" },
      "1111": { "trustIndex": 26, "trustLevel": "P3" },
      "1118": { "trustIndex": 26, "trustLevel": "P3" },
      "1125": { "trustIndex": 27, "trustLevel": "P3" },
      "1202": { "trustIndex": 27, "trustLevel": "P3" },
      "1209": { "trustIndex": 28, "trustLevel": "P3" }
    },
    "attendance": { "1107": true },
    "salesActions": [
      {
        "type": "meeting",
        "content": "MBM 세미나 참석, 영상면접 큐레이터 도입 적극 관심",
        "date": "2024-11-07",
        "possibility": "40%",
        "customerResponse": "중",
        "targetRevenue": null,
        "test": false,
        "quote": false,
        "approval": false,
        "contract": false
      },
      {
        "type": "call",
        "content": "견적서 요청 확인, 내년 공채 때 활용 예정",
        "date": "2024-11-15",
        "possibility": "40%",
        "customerResponse": "상",
        "targetRevenue": 5000000,
        "test": true,
        "quote": false,
        "approval": false,
        "contract": false
      },
      {
        "type": "meeting",
        "content": "영상면접 큐레이터 데모 시연 및 견적 논의",
        "date": "2024-11-28",
        "possibility": "90%",
        "customerResponse": "상",
        "targetRevenue": 5000000,
        "test": true,
        "quote": true,
        "approval": false,
        "contract": false
      },
      {
        "type": "call",
        "content": "견적서 발송 완료, 내부 검토 후 회신 예정",
        "date": "2024-12-03",
        "possibility": "90%",
        "customerResponse": "상",
        "targetRevenue": 5000000,
        "test": true,
        "quote": true,
        "approval": true,
        "contract": false
      },
      {
        "type": "meeting",
        "content": "계약서 서명 완료! 1월 도입 확정",
        "date": "2024-12-09",
        "possibility": "90%",
        "customerResponse": "상",
        "targetRevenue": 5000000,
        "test": true,
        "quote": true,
        "approval": true,
        "contract": true
      }
    ],
    "contentEngagements": [
      {
        "title": "2024 채용 시장 동향 분석",
        "date": "2024-11-09",
        "category": "TOFU"
      },
      {
        "title": "영상면접 큐레이터 ROI 분석",
        "date": "2024-11-16",
        "category": "BOFU"
      },
      {
        "title": "반도체 업계 채용 혁신 사례",
        "date": "2024-11-25",
        "category": "MOFU"
      }
    ],
    "trustFormation": {
      "customerResponse": "상",
      "targetDate": "12월말",
      "targetRevenueMin": 5000000,
      "targetRevenueMax": 32000000,
      "detail": "11/7, 기존계약 : 지원서 > 역검 1,000명 - 영상면접 큐레이터 도입을 위한 구체적 논의 진행 중, 견적 발송 예정",
      "interestFunction": "영상면접 큐레이터"
    },
    "valueRecognition": {
      "customerResponse": "상",
      "possibility": "90%",
      "targetDate": "12월",
      "targetRevenue": 5000000,
      "test": true,
      "quote": true,
      "approval": false,
      "contract": false,
      "simulation": 4500000
    },
    "adoptionDecision": {
      "customerResponse": "상",
      "possibility": "90%",
      "targetDate": "12월",
      "targetRevenue": 5000000,
      "test": true,
      "quote": true,
      "approval": false,
      "contract": false,
      "simulation": 4500000
    }
  },
  {
    "no": 24,
    "companyName": "서울도시가스",
    "companySize": "T5",
    "category": "채용",
    "productUsage": "ATS/역검",
    "manager": "이정호",
    "renewalDate": "26.06.30",
    "contractAmount": 41250000,
    "hDot": true,
    "trustLevel": "P2",
    "trustIndex": 55,
    "changeAmount": 7,
    "changeDirection": "up",
    "rank": null,
    "trustHistory": {
      "1104": { "trustIndex": 48, "trustLevel": "P2" },
      "1111": { "trustIndex": 50, "trustLevel": "P2" },
      "1118": { "trustIndex": 51, "trustLevel": "P2" },
      "1125": { "trustIndex": 52, "trustLevel": "P2" },
      "1202": { "trustIndex": 54, "trustLevel": "P2" },
      "1209": { "trustIndex": 55, "trustLevel": "P2" }
    },
    "attendance": { "1107": true },
    "salesActions": [
      {
        "type": "meeting",
        "content": "MBM 세미나 참석, 큐레이터 관심 높음. 조기재계약 논의 시작",
        "date": "2024-11-07",
        "possibility": "40%",
        "customerResponse": "상",
        "targetRevenue": null,
        "test": false,
        "quote": false,
        "approval": false,
        "contract": false
      },
      {
        "type": "meeting",
        "content": "조기재계약 미팅, 2년 5,800만원 조건 논의",
        "date": "2024-11-14",
        "possibility": "90%",
        "customerResponse": "상",
        "targetRevenue": 58000000,
        "test": true,
        "quote": true,
        "approval": false,
        "contract": false
      },
      {
        "type": "call",
        "content": "견적서 발송 후 내부 검토 현황 확인",
        "date": "2024-11-25",
        "possibility": "90%",
        "customerResponse": "상",
        "targetRevenue": 58000000,
        "test": true,
        "quote": true,
        "approval": true,
        "contract": false
      },
      {
        "type": "call",
        "content": "내부 검토 진행 상황 확인",
        "date": "2024-12-05",
        "possibility": "90%",
        "customerResponse": "상",
        "targetRevenue": 58000000,
        "test": true,
        "quote": true,
        "approval": true,
        "contract": false
      }
    ],
    "contentEngagements": [
      {
        "title": "2024 HR 테크 트렌드 리포트",
        "date": "2024-11-08",
        "category": "TOFU"
      },
      {
        "title": "영상면접 도입 기업 사례집",
        "date": "2024-11-12",
        "category": "MOFU"
      },
      {
        "title": "큐레이터 기능 상세 가이드",
        "date": "2024-11-18",
        "category": "MOFU"
      },
      {
        "title": "AI 면접 평가 정확도 백서",
        "date": "2024-11-25",
        "category": "TOFU"
      },
      {
        "title": "도입 프로세스 및 일정 안내",
        "date": "2024-12-02",
        "category": "BOFU"
      },
      {
        "title": "에너지 산업 HR 디지털 전환",
        "date": "2024-12-08",
        "category": "TOFU"
      },
      {
        "title": "영상면접 큐레이터 가격 안내서",
        "date": "2024-12-10",
        "category": "BOFU"
      }
    ],
    "trustFormation": {
      "customerResponse": "상",
      "targetDate": "12월말",
      "targetRevenueMin": 58000000,
      "targetRevenueMax": 58000000,
      "detail": "11/7, 미팅 했고, (26년 6월만료) > 조기재계약 > 큐레이터 관심이 많아서, 다음주 목요일 미팅 하면서, 조기재계약 영상면접 큐레이터 도입을 목적으로 조기재계약 검토 논의 중 2년에 5,800만원 (조기 재계약시, 잔여포인트 이월해줌)",
      "interestFunction": "영상면접 큐레이터"
    },
    "valueRecognition": {
      "customerResponse": "상",
      "possibility": "90%",
      "targetDate": "12월",
      "targetRevenue": 58000000,
      "test": true,
      "quote": true,
      "approval": false,
      "contract": false,
      "simulation": 52200000
    },
    "adoptionDecision": {
      "customerResponse": "상",
      "possibility": "90%",
      "targetDate": "12월",
      "targetRevenue": 58000000,
      "test": true,
      "quote": true,
      "approval": false,
      "contract": false,
      "simulation": 52200000
    }
  },
  {
    "no": 25,
    "companyName": "AJ네트웍스",
    "companySize": "T9",
    "category": "채용",
    "productUsage": "ATS/역검",
    "manager": "이정호",
    "renewalDate": "25.12.31",
    "contractAmount": 62400000,
    "hDot": true,
    "trustLevel": "P3",
    "trustIndex": 17,
    "changeAmount": 2,
    "changeDirection": "down",
    "rank": null,
    "trustHistory": {
      "1104": { "trustIndex": 19, "trustLevel": "P3" },
      "1111": { "trustIndex": 18, "trustLevel": "P3" },
      "1118": { "trustIndex": 18, "trustLevel": "P3" },
      "1125": { "trustIndex": 17, "trustLevel": "P3" },
      "1202": { "trustIndex": 17, "trustLevel": "P3" },
      "1209": { "trustIndex": 17, "trustLevel": "P3" }
    },
    "attendance": { "1107": true },
    "salesActions": [
      {
        "type": "meeting",
        "content": "MBM 세미나 참석, 뉴로우 온보딩 프로세스 관리 도구로 관심 표명",
        "date": "2024-11-07",
        "possibility": "0%",
        "customerResponse": "중",
        "targetRevenue": null,
        "test": false,
        "quote": false,
        "approval": false,
        "contract": false
      },
      {
        "type": "call",
        "content": "뉴로우 기능 관련 추가 문의",
        "date": "2024-11-19",
        "possibility": "40%",
        "customerResponse": "중",
        "targetRevenue": null,
        "test": true,
        "quote": false,
        "approval": false,
        "contract": false
      },
      {
        "type": "call",
        "content": "도입 검토 진행 상황 확인",
        "date": "2024-12-02",
        "possibility": "40%",
        "customerResponse": "중",
        "targetRevenue": null,
        "test": true,
        "quote": false,
        "approval": false,
        "contract": false
      }
    ],
    "contentEngagements": [
      {
        "title": "뉴로우 온보딩 솔루션 소개",
        "date": "2024-11-10",
        "category": "MOFU"
      },
      {
        "title": "온보딩 프로세스 자동화 가이드",
        "date": "2024-12-05",
        "category": "MOFU"
      }
    ],
    "trustFormation": {
      "customerResponse": "중",
      "targetDate": null,
      "targetRevenueMin": null,
      "targetRevenueMax": null,
      "detail": "11/7, 역검 기능에 관심이 다소 있으나 뉴로우에 대한 관심이 더 깊음 (뉴로우를 본인회사의 온보딩 프로세스 관리툴로 쓰고 싶어함) 솔루션에 대한 인식이 좋음 (8월에 임원도 참석희망)",
      "interestFunction": "뉴로우"
    },
    "valueRecognition": {
      "customerResponse": "중",
      "possibility": "40%",
      "targetDate": "1월",
      "targetRevenue": null,
      "test": false,
      "quote": false,
      "approval": false,
      "contract": false,
      "simulation": null
    },
    "adoptionDecision": {
      "customerResponse": "중",
      "possibility": "40%",
      "targetDate": "1월",
      "targetRevenue": null,
      "test": false,
      "quote": false,
      "approval": false,
      "contract": false,
      "simulation": null
    }
  },
  {
    "no": 30,
    "companyName": "(주)도루코",
    "companySize": "T1",
    "category": "채용",
    "productUsage": "ATS/역검",
    "manager": "이정호",
    "renewalDate": "28.03.06",
    "contractAmount": 15200000,
    "hDot": true,
    "trustLevel": "P2",
    "trustIndex": 66,
    "changeAmount": 8,
    "changeDirection": "down",
    "rank": null,
    "trustHistory": {
      "1104": { "trustIndex": 74, "trustLevel": "P2" },
      "1111": { "trustIndex": 72, "trustLevel": "P2" },
      "1118": { "trustIndex": 70, "trustLevel": "P2" },
      "1125": { "trustIndex": 68, "trustLevel": "P2" },
      "1202": { "trustIndex": 67, "trustLevel": "P2" },
      "1209": { "trustIndex": 66, "trustLevel": "P2" }
    },
    "attendance": { "1107": true },
    "salesActions": [
      {
        "type": "meeting",
        "content": "MBM 세미나 참석, 역검 SR + 큐레이터 사용 중",
        "date": "2024-11-07",
        "possibility": "40%",
        "customerResponse": "상",
        "targetRevenue": null,
        "test": true,
        "quote": false,
        "approval": false,
        "contract": false
      },
      {
        "type": "meeting",
        "content": "팀장 미팅, AI 도입 희망하나 팀장 망설임",
        "date": "2024-11-12",
        "possibility": "40%",
        "customerResponse": "중",
        "targetRevenue": null,
        "test": true,
        "quote": true,
        "approval": false,
        "contract": false
      },
      {
        "type": "call",
        "content": "AI 도입 관련 추가 자료 요청",
        "date": "2024-11-22",
        "possibility": "40%",
        "customerResponse": "중",
        "targetRevenue": null,
        "test": true,
        "quote": true,
        "approval": false,
        "contract": false
      },
      {
        "type": "call",
        "content": "AI 도입 관련 팀장 설득 진행 상황 확인",
        "date": "2024-12-10",
        "possibility": "40%",
        "customerResponse": "중",
        "targetRevenue": null,
        "test": true,
        "quote": true,
        "approval": false,
        "contract": false
      }
    ],
    "contentEngagements": [
      {
        "title": "2024 HR 테크 트렌드 리포트",
        "date": "2024-11-08",
        "category": "TOFU"
      },
      {
        "title": "역량검사 SR 활용 가이드",
        "date": "2024-11-10",
        "category": "MOFU"
      },
      {
        "title": "AI 채용의 미래: 2025 전망",
        "date": "2024-11-15",
        "category": "TOFU"
      },
      {
        "title": "제조업 AI 채용 도입 사례",
        "date": "2024-11-20",
        "category": "MOFU"
      },
      {
        "title": "큐레이터 기능 상세 가이드",
        "date": "2024-11-25",
        "category": "MOFU"
      },
      {
        "title": "AI 면접 평가 정확도 백서",
        "date": "2024-12-01",
        "category": "TOFU"
      },
      {
        "title": "역량검사 결과 해석 매뉴얼",
        "date": "2024-12-05",
        "category": "MOFU"
      },
      {
        "title": "도입 프로세스 및 일정 안내",
        "date": "2024-12-10",
        "category": "BOFU"
      }
    ],
    "trustFormation": {
      "customerResponse": "상",
      "targetDate": "12월말",
      "targetRevenueMin": null,
      "targetRevenueMax": null,
      "detail": "11/7 지원자 6,000명 역검SR 600 (3년) - 역검 SR + 큐레이터로 4~5년 정도 사용중 - 현장에 실무진이 와서, 지원서 쪽으로 보고 있음 11/12 - 팀장이랑 미팅, AI도입을 하고 싶어함. - 실무자는 너무 원하나, 팀장이 망설임 (제조업계의 특성)",
      "interestFunction": null
    },
    "valueRecognition": {
      "customerResponse": "중",
      "possibility": "40%",
      "targetDate": "2월",
      "targetRevenue": null,
      "test": false,
      "quote": false,
      "approval": false,
      "contract": false,
      "simulation": null
    },
    "adoptionDecision": {
      "customerResponse": "중",
      "possibility": "40%",
      "targetDate": "2월",
      "targetRevenue": null,
      "test": false,
      "quote": false,
      "approval": false,
      "contract": false,
      "simulation": null
    }
  },
  {
    "no": 43,
    "companyName": "대한제분",
    "companySize": "T1",
    "category": "채용",
    "productUsage": "ATS/역검",
    "manager": "이정호",
    "renewalDate": "26.02.28",
    "contractAmount": 10000000,
    "hDot": true,
    "trustLevel": "P3",
    "trustIndex": 39,
    "changeAmount": 9,
    "changeDirection": "down",
    "rank": null,
    "trustHistory": {
      "1104": { "trustIndex": 48, "trustLevel": "P2" },
      "1111": { "trustIndex": 45, "trustLevel": "P2" },
      "1118": { "trustIndex": 43, "trustLevel": "P2" },
      "1125": { "trustIndex": 41, "trustLevel": "P2" },
      "1202": { "trustIndex": 40, "trustLevel": "P2" },
      "1209": { "trustIndex": 39, "trustLevel": "P3" }
    },
    "attendance": { "1107": true },
    "salesActions": [
      {
        "type": "meeting",
        "content": "MBM 세미나 참석, 역검 사용 만족도 확인",
        "date": "2024-11-07",
        "possibility": "0%",
        "customerResponse": "하",
        "targetRevenue": null,
        "test": false,
        "quote": false,
        "approval": false,
        "contract": false
      },
      {
        "type": "call",
        "content": "12월 재계약 관련 사전 연락",
        "date": "2024-11-20",
        "possibility": "0%",
        "customerResponse": "하",
        "targetRevenue": null,
        "test": false,
        "quote": false,
        "approval": false,
        "contract": false
      },
      {
        "type": "meeting",
        "content": "재계약 논의 미팅, 임원 설득 필요",
        "date": "2024-12-05",
        "possibility": "0%",
        "customerResponse": "하",
        "targetRevenue": null,
        "test": false,
        "quote": true,
        "approval": false,
        "contract": false
      }
    ],
    "contentEngagements": [
      {
        "title": "2024 채용 시장 동향 분석",
        "date": "2024-11-09",
        "category": "TOFU"
      }
    ],
```

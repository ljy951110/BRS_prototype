// openapi로 가져올때 에러나는 타입들 (ex: 다 한글일 경우)


/**
 * 제품 타입
 * @export
 * @enum {string}
 */

export const ProductType = {
  ATS: 'ATS',
  SR: '역검SR',
  INHR: 'INHR+통합',
  ACC: '역검',
  OUTSOURCING: '이탈사'
} as const;

export type ProductType = typeof ProductType[keyof typeof ProductType];




/**
 * 기업 규모 (BigQuery companies.company_size 값과 일치)
 * @export
 * @enum {string}
 */

export const CompanySize = {
  T0: 'T0',
  T1: 'T1',
  T2: 'T2',
  T3: 'T3',
  T4: 'T4',
  T5: 'T5',
  T10: 'T10',
  UNKOWN: '미확인'
} as const;

export type CompanySize = typeof CompanySize[keyof typeof CompanySize];




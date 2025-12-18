import { Category, ProductType } from "@/repository/openapi/model";

export const CategoryLabel: Record<Category, string> = {
  recruit: '채용',
  performance: '성과',
  public: '공공'
} as const;

// ProductType에 대한 한글 라벨
export const ProductTypeLabel: Record<ProductType, string> = {
  ATS: 'ATS',
  ACCSR: '역검SR',
  INHR_PLUS: 'INHR+통합',
  ACC: '역검',
  CHURN: '이탈사'
} as const;


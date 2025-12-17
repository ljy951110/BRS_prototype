// React Query v5 기준
import { UseQueryOptions, QueryKey } from '@tanstack/react-query';
import { AxiosResponse } from 'axios';

export type CUSTOM_QUERY_OPTIONS<
  TQueryFnData,
  TError = unknown,
  TData = AxiosResponse<TQueryFnData>,
  TQueryKey extends QueryKey = QueryKey,
> = Omit<UseQueryOptions<AxiosResponse<TQueryFnData>, TError, TData, TQueryKey>, 'queryKey' | 'queryFn'>;

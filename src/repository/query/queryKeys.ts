import { mergeQueryKeys } from '@lukemorales/query-key-factory';

import { customerDetailQueryKeys } from './customerDetailApiController/queryKey';
import { dashboardQueryKeys } from './dashboardApiController/queryKey';

export const queryKeys = mergeQueryKeys(
  dashboardQueryKeys,
  customerDetailQueryKeys,
);

/**
 * queryKeys 도입 이유
 *
 *
 * 기존 코드(queryKeys 도입 전)
 *
 *
 * const {data , refetch}  = useQuery();
 *
 * const {mutate} = useMutation();
 *
 *
 *
 * const submit = () => {
 * mutate( {
 *
 * onSuccess : () => refetch();
 * });
 * }
 *
 *
 *
 *
 *
 * queryKeys 도입 후
 *
 *
 * const {data} = useQuery();
 *
 * const {muate} = useMutation();
 *
 *
 *
 * const submit = () => {
 * mutate( {
 *
 * onSuccess : () => queryClient.invalidateQueries({queryKey: queryKeys.dashboard.companiesList.queryKey}, {exact: true});
 * //  exact:true : 해당 쿼리 키 값과 정확히 동일한 키만 캐시를 갱신
 * });
 * }
 *
 *
 *
 *
 *
 * refetch : 실행시 즉시 api를 요청해 캐시를 갱신하는 방식
 * invalidateQueries : 해당 키를 참조할때 api를 호출해 캐시를 갱신하는 방식
 *
 *
 * 즉, refetch 방식은 바뀐 데이터가 필요 없는 경우에도 데이터를 요청하는 문제가 있음
 */

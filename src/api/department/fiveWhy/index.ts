import type { PageResult } from '@/api/types';
import type { AxiosPromise } from '@/utils/api-types';
import request from '@/utils/request';
import type { FiveWhyForm, FiveWhyQuery, FiveWhyVO, ReviewForm } from './types';

export const listFiveWhy = (query: FiveWhyQuery): AxiosPromise<PageResult<FiveWhyVO>> => request({ url: '/department/fiveWhy/list', method: 'get', params: query });
export const getFiveWhy = (id: string | number): AxiosPromise<FiveWhyVO> => request({ url: '/department/fiveWhy/' + id, method: 'get' });
export const addFiveWhy = (data: FiveWhyForm) => request({ url: '/department/fiveWhy', method: 'post', data });
export const updateFiveWhy = (data: FiveWhyForm & { id: string | number }) => request({ url: '/department/fiveWhy', method: 'put', data });
export const delFiveWhy = (ids: Array<string | number> | string | number) => request({ url: '/department/fiveWhy/' + ids, method: 'delete' });
export const reviewFiveWhy = (data: ReviewForm) => request({ url: '/department/fiveWhy/review', method: 'post', data });
export const exportFiveWhy = (id: string | number) => `/department/fiveWhy/export/${id}`;

export default { listFiveWhy, getFiveWhy, addFiveWhy, updateFiveWhy, delFiveWhy, reviewFiveWhy, exportFiveWhy };

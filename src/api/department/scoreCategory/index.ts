import type { AxiosPromise } from '@/utils/api-types';
import request from '@/utils/request';
import type { ScoreCategoryForm, ScoreCategoryVO } from './types';

export const listScoreCategory = (): AxiosPromise<ScoreCategoryVO[]> =>
  request({ url: '/department/scoreCategory/list', method: 'get' });

export const listScoreCategoryOptions = (): AxiosPromise<ScoreCategoryVO[]> =>
  request({ url: '/department/scoreCategory/options', method: 'get' });

export const getScoreCategory = (id: string | number): AxiosPromise<ScoreCategoryVO> =>
  request({ url: '/department/scoreCategory/' + id, method: 'get' });

export const addScoreCategory = (data: ScoreCategoryForm) =>
  request({ url: '/department/scoreCategory', method: 'post', data });

export const updateScoreCategory = (data: ScoreCategoryForm) =>
  request({ url: '/department/scoreCategory', method: 'put', data });

export const delScoreCategory = (ids: Array<string | number> | string | number) =>
  request({ url: '/department/scoreCategory/' + ids, method: 'delete' });

export default {
  listScoreCategory,
  listScoreCategoryOptions,
  getScoreCategory,
  addScoreCategory,
  updateScoreCategory,
  delScoreCategory
};

import type { PageResult } from '@/api/types';
import type { AxiosPromise } from '@/utils/api-types';
import request from '@/utils/request';
import type {
  OperationRecordForm,
  OperationRecordQuery,
  OperationRecordVO,
  OperationSummaryVO,
  OperationSystemForm,
  OperationSystemQuery,
  OperationSystemVO
} from './types';

export const listOperationRecord = (query: OperationRecordQuery): AxiosPromise<PageResult<OperationRecordVO>> =>
  request({ url: '/department/operationLedger/list', method: 'get', params: query });

export const getOperationRecord = (id: string | number): AxiosPromise<OperationRecordVO> =>
  request({ url: '/department/operationLedger/' + id, method: 'get' });

export const addOperationRecord = (data: OperationRecordForm) => request({ url: '/department/operationLedger', method: 'post', data });

export const updateOperationRecord = (data: OperationRecordForm) => request({ url: '/department/operationLedger', method: 'put', data });

export const delOperationRecord = (ids: Array<string | number> | string | number) =>
  request({ url: '/department/operationLedger/' + ids, method: 'delete' });

export const listOperationSystem = (query: OperationSystemQuery): AxiosPromise<PageResult<OperationSystemVO>> =>
  request({ url: '/department/operationLedger/system/list', method: 'get', params: query });

export const getOperationSystem = (id: string | number): AxiosPromise<OperationSystemVO> =>
  request({ url: '/department/operationLedger/system/' + id, method: 'get' });

export const addOperationSystem = (data: OperationSystemForm) => request({ url: '/department/operationLedger/system', method: 'post', data });

export const updateOperationSystem = (data: OperationSystemForm) => request({ url: '/department/operationLedger/system', method: 'put', data });

export const delOperationSystem = (ids: Array<string | number> | string | number) =>
  request({ url: '/department/operationLedger/system/' + ids, method: 'delete' });

export const getOperationSummary = (beginDate: string, endDate: string): AxiosPromise<OperationSummaryVO> =>
  request({ url: '/department/operationLedger/summary', method: 'get', params: { beginDate, endDate } });

export default {
  listOperationRecord,
  getOperationRecord,
  addOperationRecord,
  updateOperationRecord,
  delOperationRecord,
  listOperationSystem,
  getOperationSystem,
  addOperationSystem,
  updateOperationSystem,
  delOperationSystem,
  getOperationSummary
};

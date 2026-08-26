import type { PageResult } from '@/api/types';
import type { AxiosPromise } from '@/utils/api-types';
import request from '@/utils/request';
import type { WorkOrderDetailForm, WorkOrderDetailVO, WorkOrderForm, WorkOrderImportResultVO, WorkOrderQuery, WorkOrderSummaryVO, WorkOrderVO } from './types';

export const listWorkOrder = (query: WorkOrderQuery): AxiosPromise<PageResult<WorkOrderVO>> => {
  return request({ url: '/department/workOrder/list', method: 'get', params: query });
};

export const getWorkOrder = (id: string | number): AxiosPromise<WorkOrderVO> => {
  return request({ url: '/department/workOrder/' + id, method: 'get' });
};

export const previewWorkOrderPdf = (id: string | number): Promise<Blob> =>
  request({ url: '/department/workOrder/' + id + '/sourcePdf', method: 'get', responseType: 'blob' });

export const getWorkOrderDetails = (id: string | number): AxiosPromise<WorkOrderDetailVO[]> => {
  return request({ url: '/department/workOrder/' + id + '/details', method: 'get' });
};

export const updateWorkOrderDetail = (data: WorkOrderDetailForm) => request({ url: '/department/workOrder/detail', method: 'put', data });

export const delWorkOrderDetail = (ids: Array<string | number> | string | number) => request({ url: '/department/workOrder/detail/' + ids, method: 'delete' });

export const addWorkOrder = (data: WorkOrderForm) => request({ url: '/department/workOrder', method: 'post', data });

export const updateWorkOrder = (data: WorkOrderForm) => request({ url: '/department/workOrder', method: 'put', data });

export const delWorkOrder = (ids: Array<string | number> | string | number) => request({ url: '/department/workOrder/' + ids, method: 'delete' });

export const importWorkOrderPdf = (data: FormData): AxiosPromise<WorkOrderImportResultVO> => {
  return request({ url: '/department/workOrder/importPdf', method: 'post', data, headers: { 'Content-Type': 'multipart/form-data' } });
};

export const getWorkOrderSummary = (beginDate: string, endDate: string): AxiosPromise<WorkOrderSummaryVO> => {
  return request({ url: '/department/workOrder/summary', method: 'get', params: { beginDate, endDate } });
};

export default {
  listWorkOrder,
  getWorkOrder,
  previewWorkOrderPdf,
  getWorkOrderDetails,
  updateWorkOrderDetail,
  delWorkOrderDetail,
  addWorkOrder,
  updateWorkOrder,
  delWorkOrder,
  importWorkOrderPdf,
  getWorkOrderSummary
};

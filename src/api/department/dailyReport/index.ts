import type { PageResult } from '@/api/types';
import type { AxiosPromise } from '@/utils/api-types';
import request from '@/utils/request';
import type {
  DailyCalendarConfigForm,
  DailyCalendarConfigVO,
  DailyCalendarOverrideForm,
  DailyCalendarOverrideVO,
  DailyCalendarVO,
  DailyLeaveForm,
  DailyLeaveVO,
  DailyReportAttachmentVO,
  DailyReportForm,
  DailyReportQuery,
  DailyReportVO
} from './types';

export const listDailyReport = (query: DailyReportQuery): AxiosPromise<PageResult<DailyReportVO>> => {
  return request({
    url: '/department/dailyReport/list',
    method: 'get',
    params: query
  });
};

export const getDailyReport = (id: string | number): AxiosPromise<DailyReportVO> => {
  return request({
    url: '/department/dailyReport/' + id,
    method: 'get'
  });
};

export const addDailyReport = (data: DailyReportForm) => {
  return request({
    url: '/department/dailyReport',
    method: 'post',
    data
  });
};

export const updateDailyReport = (data: DailyReportForm) => {
  return request({
    url: '/department/dailyReport',
    method: 'put',
    data
  });
};

export const delDailyReport = (ids: Array<string | number> | string | number) => {
  return request({
    url: '/department/dailyReport/' + ids,
    method: 'delete'
  });
};

export const listDailyReportAttachments = (reportId: string | number): AxiosPromise<DailyReportAttachmentVO[]> => {
  return request({
    url: '/department/dailyReport/attachment/list/' + reportId,
    method: 'get'
  });
};

export const delDailyReportAttachment = (id: string | number) => {
  return request({
    url: '/department/dailyReport/attachment/' + id,
    method: 'delete'
  });
};

export const getDailyCalendar = (month?: string): AxiosPromise<DailyCalendarVO> => {
  return request({
    url: '/department/dailyReport/calendar',
    method: 'get',
    params: { month }
  });
};

export const getDailyCalendarConfig = (): AxiosPromise<DailyCalendarConfigVO> => {
  return request({
    url: '/department/dailyReport/calendar/config',
    method: 'get'
  });
};

export const listDailyCalendarConfigs = (): AxiosPromise<DailyCalendarConfigVO[]> => {
  return request({
    url: '/department/dailyReport/calendar/config/list',
    method: 'get'
  });
};

export const saveDailyCalendarConfig = (data: DailyCalendarConfigForm) => {
  return request({
    url: '/department/dailyReport/calendar/config',
    method: 'put',
    data
  });
};

export const listDailyCalendarOverrides = (beginDate: string, endDate: string): AxiosPromise<DailyCalendarOverrideVO[]> => {
  return request({
    url: '/department/dailyReport/calendar/override/list',
    method: 'get',
    params: { beginDate, endDate }
  });
};

export const addDailyCalendarOverride = (data: DailyCalendarOverrideForm) => {
  return request({
    url: '/department/dailyReport/calendar/override',
    method: 'post',
    data
  });
};

export const updateDailyCalendarOverride = (data: DailyCalendarOverrideForm) => {
  return request({
    url: '/department/dailyReport/calendar/override',
    method: 'put',
    data
  });
};

export const delDailyCalendarOverride = (ids: Array<string | number> | string | number) => {
  return request({
    url: '/department/dailyReport/calendar/override/' + ids,
    method: 'delete'
  });
};

export const listDailyLeaves = (beginDate: string, endDate: string, userId?: string | number): AxiosPromise<DailyLeaveVO[]> => {
  return request({
    url: '/department/dailyReport/calendar/leave/list',
    method: 'get',
    params: { beginDate, endDate, userId }
  });
};

export const addDailyLeave = (data: DailyLeaveForm) => {
  return request({
    url: '/department/dailyReport/calendar/leave',
    method: 'post',
    data
  });
};

export const updateDailyLeave = (data: DailyLeaveForm) => {
  return request({
    url: '/department/dailyReport/calendar/leave',
    method: 'put',
    data
  });
};

export const delDailyLeave = (ids: Array<string | number> | string | number) => {
  return request({
    url: '/department/dailyReport/calendar/leave/' + ids,
    method: 'delete'
  });
};

export default {
  listDailyReport,
  getDailyReport,
  addDailyReport,
  updateDailyReport,
  delDailyReport,
  listDailyReportAttachments,
  delDailyReportAttachment,
  getDailyCalendar,
  getDailyCalendarConfig,
  listDailyCalendarConfigs,
  saveDailyCalendarConfig,
  listDailyCalendarOverrides,
  addDailyCalendarOverride,
  updateDailyCalendarOverride,
  delDailyCalendarOverride,
  listDailyLeaves,
  addDailyLeave,
  updateDailyLeave,
  delDailyLeave
};

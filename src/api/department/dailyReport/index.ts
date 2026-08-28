import type { PageResult } from '@/api/types';
import type { AxiosPromise } from '@/utils/api-types';
import request from '@/utils/request';
import type {
  DailyCalendarOverrideForm,
  DailyCalendarOverrideVO,
  DailyCalendarVO,
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

/** 首页只展示今日成员状态，使用轻量接口避免加载整月日历。 */
export const getTodayDailyCalendar = (): AxiosPromise<DailyCalendarVO> => {
  return request({
    url: '/department/dailyReport/calendar/today',
    method: 'get'
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

export default {
  listDailyReport,
  getDailyReport,
  addDailyReport,
  updateDailyReport,
  delDailyReport,
  listDailyReportAttachments,
  delDailyReportAttachment,
  getDailyCalendar,
  getTodayDailyCalendar,
  listDailyCalendarOverrides,
  addDailyCalendarOverride,
  updateDailyCalendarOverride,
  delDailyCalendarOverride
};

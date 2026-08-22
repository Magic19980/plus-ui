import type { PageResult } from '@/api/types';
import type { AxiosPromise } from '@/utils/api-types';
import request from '@/utils/request';
import type { WeeklyReportGenerateForm, WeeklyReportQuery, WeeklyReportSummaryVO, WeeklyReportVO } from './types';

export const listWeeklyReport = (query: WeeklyReportQuery): AxiosPromise<PageResult<WeeklyReportVO>> => {
  return request({
    url: '/department/weeklyReport/list',
    method: 'get',
    params: query
  });
};

export const getWeeklyReport = (id: string | number): AxiosPromise<WeeklyReportVO> => {
  return request({
    url: '/department/weeklyReport/' + id,
    method: 'get'
  });
};

export const getWeeklyReportSummary = (weekStart: string): AxiosPromise<WeeklyReportSummaryVO> => {
  return request({
    url: '/department/weeklyReport/summary',
    method: 'get',
    params: { weekStart }
  });
};

export const generateWeeklyReport = (data: WeeklyReportGenerateForm): AxiosPromise<WeeklyReportVO> => {
  return request({
    url: '/department/weeklyReport/generate',
    method: 'post',
    data
  });
};

export default {
  listWeeklyReport,
  getWeeklyReport,
  getWeeklyReportSummary,
  generateWeeklyReport
};

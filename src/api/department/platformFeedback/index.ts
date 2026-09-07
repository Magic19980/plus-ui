import type { PageResult } from '@/api/types';
import type { AxiosPromise } from '@/utils/api-types';
import request from '@/utils/request';
import type {
  PlatformFeedbackActivityVO,
  PlatformFeedbackAttachmentVO,
  PlatformFeedbackCommentForm,
  PlatformFeedbackCommentVO,
  PlatformFeedbackForm,
  PlatformFeedbackProcessForm,
  PlatformFeedbackQuery,
  PlatformFeedbackSummaryVO,
  PlatformFeedbackUserOptionVO,
  PlatformFeedbackVO
} from './types';

export const listPlatformFeedback = (query: PlatformFeedbackQuery): AxiosPromise<PageResult<PlatformFeedbackVO>> =>
  request({ url: '/department/platformFeedback/list', method: 'get', params: query });

export const getPlatformFeedback = (id: string | number): AxiosPromise<PlatformFeedbackVO> =>
  request({ url: '/department/platformFeedback/' + id, method: 'get' });

export const addPlatformFeedback = (data: PlatformFeedbackForm) =>
  request({ url: '/department/platformFeedback', method: 'post', data });

export const processPlatformFeedback = (data: PlatformFeedbackProcessForm) =>
  request({ url: '/department/platformFeedback/process', method: 'put', data });

export const listPlatformFeedbackComments = (id: string | number, query: PageQuery): AxiosPromise<PageResult<PlatformFeedbackCommentVO>> =>
  request({ url: '/department/platformFeedback/' + id + '/comments', method: 'get', params: query });

export const addPlatformFeedbackComment = (id: string | number, data: PlatformFeedbackCommentForm) =>
  request({ url: '/department/platformFeedback/' + id + '/comments', method: 'post', data });

export const listPlatformFeedbackActivities = (id: string | number): AxiosPromise<PlatformFeedbackActivityVO[]> =>
  request({ url: '/department/platformFeedback/' + id + '/activities', method: 'get' });

export const getPlatformFeedbackSummary = (): AxiosPromise<PlatformFeedbackSummaryVO> =>
  request({ url: '/department/platformFeedback/summary', method: 'get' });

export const getPlatformFeedbackHandlers = (): AxiosPromise<PlatformFeedbackUserOptionVO[]> =>
  request({ url: '/department/platformFeedback/config/handlers', method: 'get' });

export const updatePlatformFeedbackHandlers = (userIds: Array<string | number>) =>
  request({ url: '/department/platformFeedback/config/handlers', method: 'put', data: { userIds } });

export const listPlatformFeedbackAssigneeOptions = (keyword?: string): AxiosPromise<PlatformFeedbackUserOptionVO[]> =>
  request({ url: '/department/platformFeedback/assignee-options', method: 'get', params: keyword ? { keyword } : undefined });

export const uploadPlatformFeedbackAttachment = (data: FormData): AxiosPromise<PlatformFeedbackAttachmentVO> =>
  request({ url: '/department/platformFeedback/attachment/upload', method: 'post', data, timeout: 60 * 60 * 1000 });

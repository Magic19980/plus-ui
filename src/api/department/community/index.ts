import type { PageResult } from '@/api/types';
import type { AxiosPromise } from '@/utils/api-types';
import request from '@/utils/request';
import type {
  DepartmentCommunityCommentForm,
  DepartmentCommunityCommentVO,
  DepartmentCommunityPostForm,
  DepartmentCommunityPostVO,
  DepartmentCommunityQuery,
  DepartmentCommunityReactionVO,
  DepartmentCommunityReportForm,
  DepartmentCommunityReportQuery,
  DepartmentCommunityReportVO,
  DepartmentCommunityMediaVO
} from './types';

export const listDepartmentCommunity = (query: DepartmentCommunityQuery): AxiosPromise<PageResult<DepartmentCommunityPostVO>> =>
  request({ url: '/department/community/list', method: 'get', params: query });

export const getDepartmentCommunity = (id: string | number): AxiosPromise<DepartmentCommunityPostVO> =>
  request({ url: '/department/community/' + id, method: 'get' });

export const addDepartmentCommunity = (data: DepartmentCommunityPostForm) =>
  request({ url: '/department/community/post', method: 'post', data });

export const updateDepartmentCommunity = (data: DepartmentCommunityPostForm) =>
  request({ url: '/department/community/post', method: 'put', data });

export const delDepartmentCommunity = (id: string | number) =>
  request({ url: '/department/community/post/' + id, method: 'delete' });

export const listDepartmentCommunityComments = (postId: string | number): AxiosPromise<DepartmentCommunityCommentVO[]> =>
  request({ url: '/department/community/' + postId + '/comments', method: 'get' });

export const addDepartmentCommunityComment = (postId: string | number, data: DepartmentCommunityCommentForm) =>
  request({ url: '/department/community/' + postId + '/comments', method: 'post', data });

export const delDepartmentCommunityComment = (id: string | number) =>
  request({ url: '/department/community/comment/' + id, method: 'delete' });

export const toggleDepartmentCommunityReaction = (postId: string | number, reactionType: 'LIKE' | 'FAVORITE'): AxiosPromise<DepartmentCommunityReactionVO> =>
  request({ url: '/department/community/' + postId + '/reaction/' + reactionType, method: 'post' });

export const resolveDepartmentCommunity = (postId: string | number, commentId: string | number) =>
  request({ url: '/department/community/' + postId + '/resolve/' + commentId, method: 'post' });

export const reportDepartmentCommunity = (postId: string | number, data: DepartmentCommunityReportForm) =>
  request({ url: '/department/community/' + postId + '/report', method: 'post', data });

export const listDepartmentCommunityReports = (query: DepartmentCommunityReportQuery): AxiosPromise<PageResult<DepartmentCommunityReportVO>> =>
  request({ url: '/department/community/report/list', method: 'get', params: query });

export const handleDepartmentCommunityReport = (data: DepartmentCommunityReportForm) =>
  request({ url: '/department/community/report', method: 'put', data });

export const uploadDepartmentCommunityMedia = (data: FormData): AxiosPromise<DepartmentCommunityMediaVO> =>
  request({ url: '/department/community/media/upload', method: 'post', data, timeout: 60 * 60 * 1000 });

export const uploadDepartmentCommunityCommentMedia = (data: FormData): AxiosPromise<DepartmentCommunityMediaVO> =>
  request({ url: '/department/community/comment/media/upload', method: 'post', data, timeout: 60 * 60 * 1000 });

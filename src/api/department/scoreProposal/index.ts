import type { PageResult } from '@/api/types';
import type { AxiosPromise } from '@/utils/api-types';
import request from '@/utils/request';
import type { ReviewForm, ScoreProposalMetricVO, ScoreProposalPayload, ScoreProposalMemberOptionVO, ScoreProposalQuery, ScoreProposalUserOptionQuery, ScoreProposalVO } from './types';

export const listScoreProposal = (query: ScoreProposalQuery): AxiosPromise<PageResult<ScoreProposalVO>> => request({ url: '/department/scoreProposal/list', method: 'get', params: query });
export const getScoreProposal = (id: string | number): AxiosPromise<ScoreProposalVO> => request({ url: '/department/scoreProposal/' + id, method: 'get' });
export const listScoreProposalMemberOptions = (): AxiosPromise<ScoreProposalMemberOptionVO[]> => request({ url: '/department/scoreProposal/memberOptions', method: 'get' });
export const listScoreProposalUserOptions = (): AxiosPromise<ScoreProposalMemberOptionVO[]> => request({ url: '/department/scoreProposal/userOptions', method: 'get' });
export const listScoreProposalUserOptionsPage = (query: ScoreProposalUserOptionQuery): AxiosPromise<PageResult<ScoreProposalMemberOptionVO>> => request({ url: '/department/scoreProposal/userOptions/page', method: 'get', params: query });
export const listScoreProposalUserOptionsByIds = (ids: Array<string | number>): AxiosPromise<ScoreProposalMemberOptionVO[]> => request({ url: '/department/scoreProposal/userOptions/selected', method: 'get', params: { ids: ids.join(',') } });
export const getScoreProposalMetric = (month?: string): AxiosPromise<ScoreProposalMetricVO> => request({ url: '/department/scoreProposal/metric', method: 'get', params: { month } });
export const addScoreProposal = (data: ScoreProposalPayload) => request({ url: '/department/scoreProposal', method: 'post', data });
export const updateScoreProposal = (data: ScoreProposalPayload & { id: string | number }) => request({ url: '/department/scoreProposal', method: 'put', data });
export const delScoreProposal = (ids: Array<string | number> | string | number) => request({ url: '/department/scoreProposal/' + ids, method: 'delete' });
export const reviewScoreProposal = (data: ReviewForm) => request({ url: '/department/scoreProposal/review', method: 'post', data });
export const exportScoreProposal = (id: string | number) => `/department/scoreProposal/export/${id}`;
export const previewScoreProposal = (id: string | number): Promise<Blob> => request({ url: '/department/scoreProposal/preview/' + id, method: 'get', responseType: 'blob' });

export default { listScoreProposal, listScoreProposalMemberOptions, listScoreProposalUserOptions, listScoreProposalUserOptionsPage, listScoreProposalUserOptionsByIds, getScoreProposalMetric, getScoreProposal, addScoreProposal, updateScoreProposal, delScoreProposal, reviewScoreProposal, exportScoreProposal, previewScoreProposal };

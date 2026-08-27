export interface ScoreProposalQuery extends PageQuery {
  proposerName?: string;
  mainCategory?: string;
  subCategory?: string;
  completionStatus?: string;
  reviewStatus?: string;
  beginDate?: string;
  endDate?: string;
}

/** 企业参与人员弹窗的分页筛选条件。 */
export interface ScoreProposalUserOptionQuery extends PageQuery {
  keyword?: string;
  deptId?: string | number;
  jobTitle?: string;
}

export interface ScoreProposalMetricVO {
  month: string;
  memberCount: number;
  monthlyTarget: number;
  approvedCount: number;
  totalCount: number;
  statusApprovedCount: number;
  pendingCount: number;
  pendingConfirmCount: number;
  rejectedCount: number;
  completionRate?: number;
  score: number;
}

export interface ScoreProposalVO {
  id: string | number;
  deptId?: string | number;
  companyName?: string;
  teamMemberUserIds?: Array<string | number>;
  employeeNo?: string;
  proposerName: string;
  proposerRole?: string;
  proposerLevel?: string;
  deptName?: string;
  mainCategoryId?: string | number;
  subCategoryId?: string | number;
  proposerUserId?: string | number;
  mainCategory?: string;
  subCategory?: string;
  problemDescription?: string;
  improvementMeasure?: string;
  implementerSupervisor?: string;
  implementerUserIds?: Array<string | number>;
  beforeOssId?: string | number;
  afterOssId?: string | number;
  startDate?: string;
  plannedCompletionDate?: string;
  actualCompletionDate?: string;
  completionStatus?: string;
  remark?: string;
  reviewStatus: string;
  reviewComment?: string;
  reviewedAt?: string;
  reviewFileOssId?: string | number;
  reviewFileName?: string;
  revisionNo?: number;
  submittedAt?: string;
  submittedBy?: string | number;
  confirmComment?: string;
  confirmerUserId?: string | number;
  confirmedAt?: string;
  createTime?: string;
  updateTime?: string;
}

export type ScoreProposalForm = Omit<ScoreProposalVO, 'id' | 'deptId' | 'reviewStatus' | 'reviewComment' | 'createTime' | 'updateTime' | 'beforeOssId' | 'afterOssId'> & { id?: string | number; beforeOssId?: string; afterOssId?: string; saveMode?: 'DRAFT' | 'SUBMIT' };

/** 岗位是用户管理中的实时派生字段，不随提案提交。 */
export type ScoreProposalPayload = Omit<ScoreProposalForm, 'proposerRole'>;

export interface ScoreProposalMemberOptionVO {
  userId: string | number;
  userName: string;
  nickName?: string;
  indonesianName?: string;
  deptName?: string;
  deptIndonesianName?: string;
  employeeNo?: string;
  jobTitle?: string;
  jobTitleIndonesianName?: string;
}

export interface ReviewForm {
  id: string | number;
  action: 'REVIEW_APPROVE' | 'REVIEW_REJECT' | 'CONFIRM_APPROVE' | 'CONFIRM_REJECT';
  reviewComment?: string;
}

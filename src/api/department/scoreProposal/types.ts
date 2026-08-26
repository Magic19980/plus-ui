export interface ScoreProposalQuery extends PageQuery {
  proposerName?: string;
  mainCategory?: string;
  subCategory?: string;
  completionStatus?: string;
  reviewStatus?: string;
  beginDate?: string;
  endDate?: string;
}

export interface ScoreProposalVO {
  id: string | number;
  deptId?: string | number;
  companyName?: string;
  teamMembers?: string;
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
  createTime?: string;
  updateTime?: string;
}

export type ScoreProposalForm = Omit<ScoreProposalVO, 'id' | 'deptId' | 'reviewStatus' | 'reviewComment' | 'createTime' | 'updateTime' | 'beforeOssId' | 'afterOssId'> & { id?: string | number; beforeOssId?: string; afterOssId?: string };

/** 岗位是用户管理中的实时派生字段，不随提案提交。 */
export type ScoreProposalPayload = Omit<ScoreProposalForm, 'proposerRole'>;

export interface ScoreProposalMemberOptionVO {
  userId: string | number;
  userName: string;
  nickName?: string;
  employeeNo?: string;
  jobTitle?: string;
}

export interface ReviewForm {
  id: string | number;
  reviewStatus: 'APPROVED' | 'REJECTED';
  reviewComment?: string;
}

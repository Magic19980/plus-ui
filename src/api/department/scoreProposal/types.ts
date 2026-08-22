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
  mainCategory?: string;
  subCategory?: string;
  problemDescription?: string;
  improvementMeasure?: string;
  implementerSupervisor?: string;
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

export interface ReviewForm {
  id: string | number;
  reviewStatus: 'APPROVED' | 'REJECTED';
  reviewComment?: string;
}

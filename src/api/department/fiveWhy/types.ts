export interface FiveWhyWhy {
  level?: number;
  question?: string;
  cause?: string;
}

export interface FiveWhyImprovement {
  kind?: string;
  measure?: string;
  responsible?: string;
  expectedDate?: string;
}

export interface FiveWhyQuery extends PageQuery {
  analystName?: string;
  problemName?: string;
  reviewStatus?: string;
  beginDate?: string;
  endDate?: string;
}

export interface FiveWhyVO {
  id: string | number;
  deptId?: string | number;
  companyDept?: string;
  employeeNo?: string;
  analystName: string;
  analysisDate: string;
  problemName: string;
  problemDescription?: string;
  impactScope?: string;
  whys: FiveWhyWhy[];
  improvements: FiveWhyImprovement[];
  beforeOssId?: string;
  afterOssId?: string;
  effectVerification?: string;
  standardizationPlan?: string;
  standardizationExecution?: string;
  reviewStatus: string;
  reviewComment?: string;
  createTime?: string;
  updateTime?: string;
}

export interface FiveWhyForm {
  id?: string | number;
  companyDept?: string;
  employeeNo?: string;
  analystName?: string;
  analysisDate?: string;
  problemName?: string;
  problemDescription?: string;
  impactScope?: string;
  whys: FiveWhyWhy[];
  improvements: FiveWhyImprovement[];
  beforeOssId?: string;
  afterOssId?: string;
  effectVerification?: string;
  standardizationPlan?: string;
  standardizationExecution?: string;
}

export interface ReviewForm {
  id: string | number;
  reviewStatus: 'APPROVED' | 'REJECTED';
  reviewComment?: string;
}

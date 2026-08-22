export interface DepartmentProjectQuery extends PageQuery {
  projectCode?: string;
  projectName?: string;
  projectType?: string;
  status?: string;
}

export interface DepartmentProjectVO {
  id: string | number;
  deptId?: string | number;
  projectCode?: string;
  projectName: string;
  projectType?: string;
  responsiblePerson?: string;
  status: string;
  sortNum?: number;
  remark?: string;
  operationRecordCount?: number;
  createTime?: string;
}

export type DepartmentProjectForm = Partial<Omit<DepartmentProjectVO, 'id'>> & { id?: string | number };

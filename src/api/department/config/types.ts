export interface DepartmentConfigQuery extends PageQuery {
  deptName?: string;
  status?: string;
}

export interface DepartmentConfigVO {
  deptId: string | number;
  deptName?: string;
  status?: string;
  managerUserId?: string | number;
  managerName?: string;
  sortNum?: number;
  memberCount?: number;
  remark?: string;
  createTime?: string;
  updateTime?: string;
}

export type DepartmentConfigForm = Partial<Omit<DepartmentConfigVO, 'deptId'>> & {
  id?: string | number;
  deptId?: string | number;
  status?: string;
};

/**
 * 部门查询参数
 */
export interface DeptQuery extends PageQuery {
  deptName?: string;
  deptCategory?: string;
  status?: number;
}

/**
 * 部门类型
 */
export interface DeptVO extends BaseEntity {
  id: number | string;
  parentName: string;
  parentId: number | string;
  children: DeptVO[];
  hasChildren?: boolean;
  deptId: number | string;
  deptName: string;
  oaSourceType?: string;
  oaSourceId?: string;
  indonesianName?: string;
  deptCategory: string;
  orderNum: number;
  leader: string;
  phone: string;
  email: string;
  status: string;
  delFlag: string;
  ancestors: string;
  menuId: string | number;
}

/**
 * 部门类型
 */
export interface DeptTreeVO extends BaseEntity {
  id: number | string;
  label: string;
  parentId: number | string;
  weight: number;
  children: DeptTreeVO[];
  disabled: boolean;
  isLeaf?: boolean;
}

/**
 * 部门表单类型
 */
export interface DeptForm {
  parentName?: string;
  parentId?: number | string;
  children?: DeptForm[];
  deptId?: number | string;
  deptName?: string;
  indonesianName?: string;
  deptCategory?: string;
  orderNum?: number;
  leader?: string;
  phone?: string;
  email?: string;
  status?: string;
  delFlag?: string;
  ancestors?: string;
}

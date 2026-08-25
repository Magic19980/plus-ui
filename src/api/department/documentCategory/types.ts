export interface DepartmentDocumentCategoryQuery extends PageQuery {
  categoryName?: string;
  status?: string;
}

export interface DepartmentDocumentCategoryVO {
  id: string | number;
  deptId?: string | number;
  parentId?: string | number;
  categoryName: string;
  sortNum?: number;
  status: string;
  remark?: string;
  documentCount?: number;
  createTime?: string;
  updateTime?: string;
  children?: DepartmentDocumentCategoryVO[];
}

export type DepartmentDocumentCategoryForm = Partial<Omit<DepartmentDocumentCategoryVO, 'id' | 'children'>> & { id?: string | number; parentId?: string | number };

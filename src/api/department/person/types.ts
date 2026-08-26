export interface PersonProfileVO {
  id: string | number;
  userId: string | number;
  userName?: string;
  nickName?: string;
  deptName?: string;
  employeeNo?: string;
  jobTitle?: string;
  remark?: string;
  joinDate?: string;
  leaveDate?: string;
  memberType?: string;
  memberStatus?: string;
  endReason?: string;
  endedAt?: string;
}

export interface PersonProfileForm {
  id?: string | number;
  userId?: string | number;
  userIds?: Array<string | number>;
  joinDate?: string;
  leaveDate?: string;
  memberType?: string;
  remark?: string;
}

export interface PersonProfileBatchForm {
  userIds: Array<string | number>;
  joinDate?: string;
  leaveDate?: string;
  memberType?: string;
  remark?: string;
}

export interface PersonProfileQuery extends PageQuery {
  userName?: string;
  jobTitle?: string;
  includeHistory?: boolean;
}

export interface PersonProfileEndForm {
  leaveDate: string;
  reason?: string;
}

export interface PersonDepartmentContextVO {
  deptId: string | number;
  deptName: string;
  memberType?: string;
  joinDate?: string;
  leaveDate?: string;
  current?: boolean;
}

export interface PersonUserOptionVO {
  userId: string | number;
  deptId?: string | number;
  userName: string;
  nickName?: string;
  deptName?: string;
  employeeNo?: string;
}

/** 分页选择系统用户时使用的筛选条件。 */
export interface PersonUserOptionQuery extends PageQuery {
  keyword?: string;
  deptId?: string | number;
}

export interface PersonLeaveVO {
  id: string | number;
  deptId?: string | number;
  userId: string | number;
  userName?: string;
  nickName?: string;
  startDate: string;
  endDate: string;
  leaveType?: string;
  reason?: string;
  status?: string;
}

export interface PersonLeaveForm {
  id?: string | number;
  userId?: string | number;
  startDate?: string;
  endDate?: string;
  leaveType?: string;
  reason?: string;
}

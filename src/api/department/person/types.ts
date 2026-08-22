export interface PersonProfileVO {
  id: string | number;
  userId: string | number;
  userName?: string;
  nickName?: string;
  deptName?: string;
  employeeNo?: string;
  jobTitle?: string;
  dailyReportEnabled?: string;
  reminderTime?: string;
  remark?: string;
}

export interface PersonProfileForm {
  id?: string | number;
  userId?: string | number;
  employeeNo?: string;
  jobTitle?: string;
  dailyReportEnabled?: string;
  reminderTime?: string;
  remark?: string;
}

export interface PersonProfileQuery extends PageQuery {
  userName?: string;
  jobTitle?: string;
  dailyReportEnabled?: string;
}

export interface PersonUserOptionVO {
  userId: string | number;
  deptId?: string | number;
  userName: string;
  nickName?: string;
  deptName?: string;
}

<template>
  <div class="p-2 app-container department-project-page">
    <el-card shadow="hover" class="search-panel">
      <el-form :model="queryParams" :inline="true" class="query-form" @submit.prevent>
        <el-form-item label="项目编码">
          <el-input v-model="queryParams.projectCode" clearable placeholder="项目编码" @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item label="项目名称">
          <el-input v-model="queryParams.projectName" clearable placeholder="项目名称" @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item label="项目类型">
          <el-input v-model="queryParams.projectType" clearable placeholder="项目类型" @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="queryParams.status" clearable placeholder="全部状态" style="width: 130px">
            <el-option label="启用" value="ENABLED" />
            <el-option label="停用" value="DISABLED" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="handleQuery">查询</el-button>
          <el-button icon="Refresh" @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="hover" class="table-panel mt-2">
      <template #header>
        <div class="toolbar-shell">
          <div class="table-heading">
            <span class="panel-kicker">Department Projects</span>
            <h3>项目管理</h3>
            <p>维护科室负责的项目主数据，运维工作记录需绑定到启用项目。</p>
          </div>
          <el-button v-hasPermi="['department:project:add']" type="primary" plain icon="Plus" @click="handleAdd">新增项目</el-button>
        </div>
      </template>

      <el-table v-loading="loading" border :data="projectList">
        <el-table-column label="项目编码" prop="projectCode" width="140" show-overflow-tooltip />
        <el-table-column label="项目名称" prop="projectName" min-width="180" show-overflow-tooltip />
        <el-table-column label="项目类型" prop="projectType" width="130" show-overflow-tooltip />
        <el-table-column label="负责人" prop="responsiblePerson" width="120" />
        <el-table-column label="运维工单数" prop="operationRecordCount" width="110" align="center" />
        <el-table-column label="状态" width="90" align="center">
          <template #default="scope">
            <el-tag :type="scope.row.status === 'ENABLED' ? 'success' : 'info'">{{ statusLabel(scope.row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="排序" prop="sortNum" width="80" align="center" />
        <el-table-column label="备注" prop="remark" min-width="180" show-overflow-tooltip />
        <el-table-column label="操作" fixed="right" width="130" align="center">
          <template #default="scope">
            <el-button v-hasPermi="['department:project:edit']" link type="primary" icon="Edit" @click="handleUpdate(scope.row)">编辑</el-button>
            <el-button v-hasPermi="['department:project:remove']" link type="danger" icon="Delete" @click="handleDelete(scope.row)" />
          </template>
        </el-table-column>
      </el-table>

      <pagination v-show="total > 0" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" :total="total" @pagination="getList" />
    </el-card>

    <el-dialog v-model="dialog.visible" :title="dialog.title" width="560px" append-to-body>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="项目编码">
          <el-input v-model="form.projectCode" maxlength="50" placeholder="可选，便于检索" />
        </el-form-item>
        <el-form-item label="项目名称" prop="projectName">
          <el-input v-model="form.projectName" maxlength="150" placeholder="如：计量系统、地磅系统、设备管理系统" />
        </el-form-item>
        <el-form-item label="项目类型">
          <el-input v-model="form.projectType" maxlength="50" placeholder="如：业务系统、基础设施" />
        </el-form-item>
        <el-form-item label="负责人">
          <el-input v-model="form.responsiblePerson" maxlength="100" placeholder="项目负责人" />
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="form.status">
            <el-radio label="ENABLED">启用</el-radio>
            <el-radio label="DISABLED">停用</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="排序号">
          <el-input-number v-model="form.sortNum" :min="0" :max="9999" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.remark" type="textarea" :rows="3" maxlength="1000" show-word-limit />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button :loading="buttonLoading" type="primary" @click="submitForm">保存</el-button>
        <el-button @click="dialog.visible = false">取消</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="DepartmentProject" lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { addDepartmentProject, delDepartmentProject, getDepartmentProject, listDepartmentProject, updateDepartmentProject } from '@/api/department/project';
import type { DepartmentProjectForm, DepartmentProjectQuery, DepartmentProjectVO } from '@/api/department/project/types';
import { useLoading } from '@/hooks/async/useLoading';
import modal from '@/plugins/modal';

const { loading, withLoading } = useLoading(true);
const projectList = ref<DepartmentProjectVO[]>([]);
const total = ref(0);
const buttonLoading = ref(false);
const formRef = ref<ElFormInstance>();
const queryParams = reactive<DepartmentProjectQuery>({ pageNum: 1, pageSize: 10, projectCode: undefined, projectName: undefined, projectType: undefined, status: undefined });
const form = reactive<DepartmentProjectForm>({ status: 'ENABLED', sortNum: 0 });
const dialog = reactive({ visible: false, title: '' });
const rules = { projectName: [{ required: true, message: '请输入项目名称', trigger: 'blur' }] };

const statusLabel = (status?: string) => (status === 'DISABLED' ? '停用' : '启用');

const getList = async () => {
  await withLoading(async () => {
    const res = await listDepartmentProject(queryParams);
    projectList.value = res.data?.rows || [];
    total.value = res.data?.total || 0;
  });
};

const handleQuery = () => {
  queryParams.pageNum = 1;
  getList();
};

const resetQuery = () => {
  queryParams.projectCode = undefined;
  queryParams.projectName = undefined;
  queryParams.projectType = undefined;
  queryParams.status = undefined;
  handleQuery();
};

const resetForm = () => {
  Object.assign(form, { id: undefined, projectCode: undefined, projectName: undefined, projectType: undefined, responsiblePerson: undefined, status: 'ENABLED', sortNum: 0, remark: undefined });
  formRef.value?.resetFields();
};

const handleAdd = () => {
  resetForm();
  dialog.title = '新增项目';
  dialog.visible = true;
};

const handleUpdate = async (row: DepartmentProjectVO) => {
  resetForm();
  const res = await getDepartmentProject(row.id);
  Object.assign(form, res.data);
  dialog.title = '编辑项目';
  dialog.visible = true;
};

const submitForm = () => {
  formRef.value?.validate(async (valid) => {
    if (!valid) return;
    buttonLoading.value = true;
    try {
      if (form.id) await updateDepartmentProject(form);
      else await addDepartmentProject(form);
      modal.msgSuccess('保存成功');
      dialog.visible = false;
      await getList();
    } finally {
      buttonLoading.value = false;
    }
  });
};

const handleDelete = async (row: DepartmentProjectVO) => {
  await modal.confirm(`确认删除项目“${row.projectName}”吗？`);
  await delDepartmentProject(row.id);
  modal.msgSuccess('删除成功');
  await getList();
};

onMounted(getList);
</script>

<style scoped lang="scss">
.department-project-page {
  .toolbar-shell { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
  .table-heading h3 { margin: 4px 0; }
  .table-heading p { margin: 0; color: var(--el-text-color-secondary); font-size: 13px; }
  @media (max-width: 700px) { .toolbar-shell { align-items: flex-start; flex-direction: column; } }
}
</style>

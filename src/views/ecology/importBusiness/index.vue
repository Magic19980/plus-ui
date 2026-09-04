<template>
  <div class="p-2 import-business-page" :class="{ 'is-embedded': props.embedded }">
    <el-card v-if="!props.embedded" shadow="never" class="intro-card">
      <div class="intro-content">
        <div>
          <div class="eyebrow"><span class="eyebrow-dot" /> IMPORT TO ECOLOGY</div>
          <h2>通用业务导入</h2>
          <p>选择已配置的业务模板，上传 Excel；系统自动匹配泛微组织、按分组生成附件并提交审批。</p>
        </div>
        <div class="intro-aside">
          <span class="intro-aside-label">WORKFLOW READY</span>
          <strong>泛微业务导入中心</strong>
          <el-tag type="success" effect="plain">人员来自泛微同步用户</el-tag>
        </div>
      </div>
    </el-card>

    <el-card shadow="never" class="main-card mt-2">
      <div class="workspace-heading">
        <div>
          <div class="panel-kicker"><span class="kicker-dot" /> IMPORT BATCHES</div>
          <h3>导入批次</h3>
          <p>按业务模板管理导入文件、组织匹配和泛微提交状态。</p>
        </div>
        <div class="workspace-badge">
          <span>当前模板</span>
          <strong>{{ selectedConfig?.businessName || '待选择业务模板' }}</strong>
        </div>
      </div>

      <div class="overview-grid">
        <div class="overview-item overview-item--blue"><span class="overview-icon">ALL</span><div><strong>{{ total }}</strong><span>全部批次</span></div><small>当前筛选结果</small></div>
        <div class="overview-item overview-item--orange"><span class="overview-icon">TODO</span><div><strong>{{ pendingCount }}</strong><span>待处理</span></div><small>需要继续处理</small></div>
        <div class="overview-item overview-item--green"><span class="overview-icon">DONE</span><div><strong>{{ submittedCount }}</strong><span>已提交</span></div><small>已进入泛微</small></div>
      </div>

      <div class="filter-panel">
        <div class="filter-heading"><strong>筛选批次</strong><span>先选择业务模板，再上传对应 Excel 文件</span></div>
        <el-form :model="query" :inline="true" @submit.prevent>
          <el-form-item label="业务模板" required><el-select v-model="query.configId" clearable filterable placeholder="必须先选择业务模板" style="width: 260px" @change="handleConfigChange"><el-option v-for="item in configs" :key="item.id" :label="item.businessName" :value="item.id"><div class="template-option"><span>{{ item.businessName }}</span><small v-if="item.remark">{{ item.remark }}</small></div></el-option></el-select></el-form-item>
          <el-form-item label="批次号"><el-input v-model="query.batchNo" clearable placeholder="导入批次号" @keyup.enter="search" /></el-form-item>
          <el-form-item label="状态"><el-select v-model="query.status" clearable placeholder="全部状态" style="width: 140px"><el-option v-for="item in statusOptions" :key="item.value" :label="item.label" :value="item.value" /></el-select></el-form-item>
          <el-form-item><el-button type="primary" icon="Search" @click="search">查询</el-button><el-button icon="Refresh" @click="resetQuery">重置</el-button></el-form-item>
        </el-form>
      </div>

      <div class="toolbar">
        <div class="toolbar-hint"><span class="toolbar-dot" />{{ selectedConfig ? `当前选择：${selectedConfig.businessName}。系统只按该业务模板解析 Excel。` : '请先选择明确的业务模板，再上传对应 Excel。' }}</div>
        <div>
          <el-button plain icon="Download" :disabled="!query.configId" @click="downloadTemplate">下载模板</el-button>
          <el-button v-hasPermi="['ecology:importBusiness:import']" type="primary" icon="Upload" :disabled="!query.configId" @click="openUpload">导入 Excel</el-button>
          <el-button icon="Refresh" @click="loadList">刷新</el-button>
        </div>
      </div>
      <el-table v-if="batches.length > 0 || loading" v-loading="loading" :data="batches" border class="batch-table">
        <el-table-column label="批次号" prop="batchNo" width="190" show-overflow-tooltip />
        <el-table-column label="业务" min-width="190"><template #default="scope"><div class="business-cell"><span class="business-mark">{{ businessInitial(scope.row.businessName || scope.row.businessType) }}</span><div><strong>{{ scope.row.businessName || scope.row.businessType }}</strong><small>{{ scope.row.businessType || '已配置业务模板' }}</small></div></div></template></el-table-column>
        <el-table-column label="来源文件" min-width="220" show-overflow-tooltip><template #default="scope"><div class="source-cell"><span class="source-icon">XLS</span><span>{{ scope.row.sourceFileName || '未记录文件名' }}</span></div></template></el-table-column>
        <el-table-column label="明细 / 分组" width="130"><template #default="scope"><div class="number-cell"><strong>{{ scope.row.totalCount || 0 }}</strong><span>条</span><i>/</i><strong class="is-muted">{{ scope.row.groupCount || 0 }}</strong><span>组</span></div></template></el-table-column>
        <el-table-column label="泛微申请数" width="115"><template #default="scope"><div class="application-cell"><strong>{{ scope.row.applicationCount || 0 }}</strong><span>份</span></div></template></el-table-column>
        <el-table-column label="状态" width="125" align="center"><template #default="scope"><span :class="['table-state', scope.row.status === 'SUBMITTED' ? 'is-success' : ['FAILED', 'PARTIAL_FAILED', 'NEED_MAPPING'].includes(scope.row.status) ? 'is-warning' : scope.row.status === 'SKIPPED' ? 'is-skipped' : 'is-muted']"><i />{{ statusLabel(scope.row.status) }}</span></template></el-table-column>
        <el-table-column label="处理提示" min-width="260" show-overflow-tooltip><template #default="scope"><span class="message-cell">{{ scope.row.message || '暂无处理提示' }}</span></template></el-table-column>
        <el-table-column label="操作" fixed="right" width="330" align="center">
          <template #default="scope">
            <div class="table-actions"><el-button link type="primary" @click="openDetail(scope.row)">查看明细</el-button><el-button v-if="canMap(scope.row)" v-hasPermi="['ecology:importBusiness:map']" link type="warning" @click="openMapping(scope.row)">处理组织</el-button><el-button v-if="canSubmit(scope.row)" v-hasPermi="['ecology:importBusiness:submit']" link type="success" @click="openSubmit(scope.row)">提交泛微</el-button><el-button v-if="canRemoveBatch(scope.row)" v-hasPermi="['ecology:importBusiness:remove']" link type="danger" @click="removeBatch(scope.row)">删除</el-button></div>
          </template>
        </el-table-column>
      </el-table>
      <div v-else class="table-empty empty-panel">
        <span class="empty-mark"><i /><i /><i /></span>
        <strong>暂无导入批次</strong>
        <p>{{ query.configId ? '导入 Excel 后，批次记录会显示在这里。' : '先选择业务模板，再开始导入 Excel。' }}</p>
        <el-button type="primary" plain icon="Upload" :disabled="!query.configId" @click="openUpload">导入第一批数据</el-button>
      </div>
      <pagination v-show="total > 0" v-model:page="query.pageNum" v-model:limit="query.pageSize" :total="total" @pagination="loadList" />
    </el-card>

    <el-dialog v-model="uploadDialog.visible" title="导入业务 Excel" width="560px" append-to-body destroy-on-close>
      <el-alert :title="selectedConfig ? `当前业务：${selectedConfig.businessName}` : '请先选择业务模板'" type="info" :closable="false" class="mb-3" />
      <el-upload ref="uploadRef" drag :limit="1" accept=".xlsx,.xls" :headers="globalHeaders()" :action="uploadUrl" :auto-upload="false" :disabled="uploadDialog.loading" :on-change="handleUploadChange" :on-remove="handleUploadRemove" :on-success="handleUploadSuccess" :on-error="handleUploadError">
        <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
        <div class="el-upload__text">拖拽 Excel 到这里，或点击选择文件</div>
        <template #tip><div class="el-upload__tip">系统会按业务模板配置的工作表和表头读取数据，单批次最多 20000 行。</div></template>
      </el-upload>
      <template #footer><el-button type="primary" :loading="uploadDialog.loading" @click="submitUpload">开始导入</el-button><el-button @click="uploadDialog.visible = false">取消</el-button></template>
    </el-dialog>

    <el-dialog v-model="detailDialog.visible" title="导入批次明细" width="1120px" append-to-body destroy-on-close>
      <div v-if="detail" class="detail-summary">
        <el-descriptions :column="7" border>
          <el-descriptions-item label="业务">{{ detail.businessName || detail.businessType }}</el-descriptions-item>
          <el-descriptions-item label="批次号">{{ detail.batchNo }}</el-descriptions-item>
          <el-descriptions-item label="数据量">{{ detail.totalCount || 0 }}</el-descriptions-item>
          <el-descriptions-item label="已跳过">{{ detail.skippedCount || 0 }}</el-descriptions-item>
          <el-descriptions-item label="分组数">{{ detail.groupCount || 0 }}</el-descriptions-item>
          <el-descriptions-item label="泛微申请数">{{ detail.applicationCount || 0 }}</el-descriptions-item>
          <el-descriptions-item label="失败分组">{{ detail.failedCount || 0 }}</el-descriptions-item>
        </el-descriptions>
        <el-alert v-if="detail.unmatchedDeptNames?.length" :title="`还有 ${detail.unmatchedDeptNames.length} 个来源组织未匹配：${detail.unmatchedDeptNames.join('、')}`" type="warning" show-icon :closable="false" class="mt-3" />
        <el-alert v-else-if="detail.skippedCount" :title="`已跳过 ${detail.skippedCount} 条明细，不会生成附件或提交泛微；其余明细可继续处理。`" type="info" show-icon :closable="false" class="mt-3" />
        <el-alert v-else :title="detail.message || '业务归属组织已全部匹配，可以提交泛微'" :type="detail.status === 'SUBMITTED' ? 'success' : 'info'" :closable="false" class="mt-3" />
      </div>
      <div class="detail-groups-tip"><el-icon><InfoFilled /></el-icon><span>以下按分组展示提交结果：每个分组对应一份泛微申请，分组下的明细统一继承该分组状态。</span></div>
      <el-table v-loading="detailDialog.loading" :data="detail?.groups || []" border max-height="560px" class="mt-3 detail-groups-table" row-key="groupKey">
        <el-table-column type="expand" width="52" fixed="left">
          <template #default="scope">
            <div class="group-records-panel">
              <div class="group-records-panel__heading"><strong>{{ scope.row.groupName || '未命名分组' }} · 明细数据</strong><span>{{ scope.row.recordCount || 0 }} 条明细，以下数据统一使用该分组的泛微提交结果</span></div>
              <el-table :data="groupRecords(scope.row.groupKey)" border size="small" class="group-records-table">
                <el-table-column label="行号" prop="rowNo" width="70" />
                <el-table-column label="泛微组织" prop="deptName" min-width="150" show-overflow-tooltip />
                <el-table-column v-for="field in detailFields" :key="field.code" :label="field.header" :min-width="field.header.length > 8 ? 150 : 110" show-overflow-tooltip><template #default="recordScope">{{ recordScope.row.data?.[field.code] ?? '—' }}</template></el-table-column>
                <el-table-column label="附件" width="100" align="center">
                  <template #default="recordScope">
                    <el-button v-if="recordScope.row.attachmentOssId" link type="primary" @click="downloadGeneratedAttachment(recordScope.row)">下载附件</el-button>
                    <span v-else>—</span>
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="分组" min-width="190" fixed="left" show-overflow-tooltip>
          <template #default="scope"><div class="group-summary-cell"><strong>{{ scope.row.groupName || '未命名分组' }}</strong><small v-if="scope.row.groupKey && scope.row.groupKey !== '__ALL__'">{{ scope.row.groupKey }}</small></div></template>
        </el-table-column>
        <el-table-column label="明细" width="100" align="center"><template #default="scope"><strong class="group-number">{{ scope.row.recordCount || 0 }}</strong><span> 条</span><span v-if="scope.row.skippedCount" class="group-skipped-count">含 {{ scope.row.skippedCount }} 条跳过</span></template></el-table-column>
        <el-table-column label="泛微申请" width="120" align="center"><template #default="scope"><el-tag v-if="scope.row.applicationCount" type="success" effect="plain">{{ scope.row.applicationCount }} 份</el-tag><span v-else class="group-muted">未提交</span></template></el-table-column>
        <el-table-column label="状态" width="110" align="center"><template #default="scope"><el-tag :type="recordStatusType(scope.row.status)">{{ recordStatusLabel(scope.row.status) }}</el-tag></template></el-table-column>
        <el-table-column label="处理说明" min-width="260" show-overflow-tooltip><template #default="scope">{{ groupStatusMessage(scope.row) }}</template></el-table-column>
      </el-table>
      <div v-if="detail && !(detail.groups || []).length && !detailDialog.loading" class="detail-groups-empty">暂无可展示的分组明细</div>
      <template #footer><el-button v-if="detail && canMap(detail)" type="warning" @click="openMapping(detail)">处理组织</el-button><el-button v-if="detail && canSubmit(detail)" type="primary" @click="openSubmit(detail)">提交泛微</el-button><el-button v-if="detail && canRemoveBatch(detail)" v-hasPermi="['ecology:importBusiness:remove']" type="danger" plain @click="removeBatch(detail)">删除批次</el-button><el-button @click="detailDialog.visible = false">关闭</el-button></template>
    </el-dialog>

    <el-dialog v-model="mappingDialog.visible" title="匹配来源组织" width="760px" append-to-body destroy-on-close class="mapping-dialog">
      <el-alert title="请输入关键字搜索对应的泛微组织，不会一次性加载全部组织；匹配结果会保存为当前业务类型的别名，后续相同名称会自动识别。" type="info" :closable="false" class="mb-3" />
      <div class="mapping-overview">
        <div class="mapping-overview__title"><span class="mapping-overview__icon"><el-icon><OfficeBuilding /></el-icon></span><div><strong>组织映射</strong><span>确认每个来源组织对应的泛微组织</span></div></div>
        <span class="mapping-overview__count">待处理 {{ mappingPendingCount }} 个<span v-if="mappingSkippedCount"> · 已跳过 {{ mappingSkippedCount }} 个</span></span>
      </div>
      <div class="mapping-list">
        <div v-for="(name, index) in mappingNames" :key="name" class="mapping-row">
          <div class="mapping-source">
            <span class="mapping-source__index">{{ mappingIndexLabel(index) }}</span>
            <div><small>来源组织 · {{ mappingStatusLabel(name) }}</small><strong :title="name">{{ name }}</strong></div>
          </div>
          <div class="mapping-connector"><span>→</span></div>
          <div class="mapping-target">
          <div class="mapping-control" :class="{ 'is-skipped': mappingSkipped[name] }">
            <button type="button" class="mapping-select" :class="{ 'is-selected': mappingValues[name], 'is-disabled': mappingSkipped[name] }" :disabled="mappingSkipped[name]" @click="openOrganizationPicker(name)">
              <span v-if="mappingValues[name]" class="mapping-selected">
                <span class="mapping-selected__icon">✓</span>
                <span class="mapping-selected__text">{{ mappingDisplayName(name) }}</span>
              </span>
              <span v-else-if="mappingSkipped[name]" class="mapping-placeholder mapping-placeholder--skipped"><span class="mapping-skip-icon">×</span><span>本批次跳过，不提交审批</span></span>
              <span v-else class="mapping-placeholder"><el-icon><OfficeBuilding /></el-icon><span>选择目标泛微组织</span></span>
              <el-icon class="mapping-select__arrow"><ArrowDown /></el-icon>
            </button>
            <el-button v-if="mappingValues[name]" link type="danger" class="mapping-clear" @click="clearMapping(name)">清除</el-button>
            <el-button v-else-if="!mappingSkipped[name]" link type="warning" class="mapping-skip" @click="skipSourceDepartment(name)">跳过本批次</el-button>
            <el-button v-else link type="primary" class="mapping-skip" @click="restoreSourceDepartment(name)">恢复处理</el-button>
          </div>
          <div v-if="mappingSkipped[name]" class="mapping-skip-note"><span>跳过原因</span><el-input v-model="mappingSkipReasons[name]" size="small" maxlength="500" show-word-limit placeholder="例如：组织暂未同步" /></div>
          </div>
        </div>
      </div>
      <template #footer><el-button type="primary" :loading="mappingDialog.loading" @click="saveMapping">保存处理结果</el-button><el-button @click="mappingDialog.visible = false">取消</el-button></template>
    </el-dialog>

    <el-dialog v-model="organizationPicker.visible" title="选择泛微组织" width="720px" append-to-body destroy-on-close class="organization-picker-dialog">
      <div class="picker-context">
        <span class="picker-context__label">正在匹配来源组织</span>
        <strong>{{ organizationPicker.sourceName }}</strong>
      </div>
      <div class="picker-search">
        <el-input v-model="organizationPicker.keyword" clearable placeholder="输入组织名称或印尼语名称" @keyup.enter="searchOrganizationOptions(organizationPicker.keyword)" @clear="restoreOrganizationTree">
          <template #prefix><el-icon><Search /></el-icon></template>
        </el-input>
        <el-button type="primary" icon="Search" :loading="organizationPicker.loading" @click="searchOrganizationOptions(organizationPicker.keyword)">搜索组织</el-button>
      </div>
      <div class="picker-tip"><el-icon><InfoFilled /></el-icon>搜索结果会直接显示在组织树中，并自动展开命中组织的上级路径；也可以逐级展开查看下级组织。</div>
      <div v-loading="organizationTreeLoading" class="organization-tree-panel">
        <div class="organization-tree-panel__heading">
          <div>
            <strong>泛微组织架构</strong>
            <span>{{ organizationPicker.mode === 'search' ? '当前显示搜索结果及其上级路径' : '展开节点查看下级组织，点击组织即可选中' }}</span>
          </div>
          <el-tag size="small" effect="plain" :type="organizationPicker.mode === 'search' ? 'warning' : 'info'">{{ organizationPicker.mode === 'search' ? '搜索结果' : '懒加载' }}</el-tag>
        </div>
        <el-tree
          v-if="organizationTreeInitialized"
          ref="organizationTreeRef"
          :key="organizationTreeRenderKey"
          class="organization-tree"
          node-key="deptId"
          :data="organizationTree"
          :props="organizationTreeProps"
          :lazy="organizationPicker.mode !== 'search'"
          :load="loadOrganizationTreeNode"
          :render-after-expand="false"
          :expand-on-click-node="false"
          highlight-current
          :default-expand-all="organizationPicker.mode === 'search'"
          :empty-text="organizationPicker.mode === 'search' ? '未找到匹配组织，请更换关键字' : '暂无可用泛微组织'"
          @node-click="selectOrganizationTreeNode"
        >
          <template #default="{ data }">
            <div class="organization-tree-node" :title="data.deptName">
              <span class="organization-tree-node__icon"><el-icon><OfficeBuilding /></el-icon></span>
              <span class="organization-tree-node__name">{{ data.deptName }}</span>
              <span v-if="String(organizationPicker.selectedDeptId) === String(data.deptId)" class="organization-tree-node__check">✓</span>
            </div>
          </template>
        </el-tree>
      </div>
      <template #footer><el-button type="primary" :disabled="!organizationPicker.selectedDeptId" @click="confirmOrganizationSelection">确认选择</el-button><el-button @click="organizationPicker.visible = false">取消</el-button></template>
    </el-dialog>

    <el-dialog v-model="submitDialog.visible" title="提交泛微审批" width="1080px" class="submit-dialog" append-to-body destroy-on-close>
      <div class="submit-dialog-content">
        <div class="submit-intro">
          <el-icon><InfoFilled /></el-icon>
          <span>请确认分组、附件和审批配置。系统会按结算部门分别生成泛微申请，某个分组失败不会影响其他分组。</span>
        </div>
        <el-alert v-if="submitAttachmentMode === 'TEMPLATE'" title="附件模板已配置，可先下载附件并在本地修改；上传修改版后，提交时将使用上传的文件。" type="success" :closable="false" class="submit-status-alert submit-status-alert--success" />
        <el-alert v-else-if="submitAttachmentMode === 'MISSING'" title="该业务启用了附件生成，但尚未配置附件模板，暂不能提交。" type="error" :closable="false" class="submit-status-alert" />
        <el-alert v-if="submitApprovalLoading" title="正在按结算部门检查审批方案和审批人员配置…" type="info" :closable="false" class="submit-status-alert" />
        <el-alert v-else-if="submitApprovalMissing.length" type="error" :closable="false" class="submit-status-alert submit-status-alert--error">
          <template #title>
            <div class="submit-status-alert__title">
              <strong>{{ submitApprovalMissing.length }} 个结算部门未完成审批配置</strong>
              <span>完成配置后才能提交</span>
            </div>
          </template>
          <div class="approval-missing-list">
            <span v-for="item in submitApprovalMissing" :key="item.groupKey" class="approval-missing-chip">
              {{ item.businessDeptName || item.groupName || '未指定部门' }}
            </span>
          </div>
        </el-alert>
        <el-alert v-else-if="!submitApprovalPreviews.length" title="未获取到结算部门审批配置，暂不能提交，请刷新重试或联系管理员。" type="error" :closable="false" class="submit-status-alert" />

        <div v-if="submitBatchRow" class="submit-summary">
          <div class="submit-summary__main">
            <span class="submit-summary__label">业务模板</span>
            <strong>{{ selectedConfig?.businessName || submitBatchRow.businessName }}</strong>
            <span class="submit-summary__file" :title="submitBatchRow.sourceFileName">{{ submitBatchRow.sourceFileName }}</span>
          </div>
          <div class="submit-summary__stats">
            <span><strong>{{ submitActiveCount }}</strong>条明细</span>
            <span><strong>{{ submitPreviewGroups.length }}</strong>个分组</span>
            <span v-if="submitSkippedCount"><strong>{{ submitSkippedCount }}</strong>条已跳过</span>
          </div>
        </div>

        <div v-if="submitPreviewRows.length" class="submit-preview-list mb-3">
          <article v-for="row in submitPreviewRows" :key="row.groupKey" class="submit-preview-card" :class="{ 'is-invalid': row.approval?.status !== 'MATCHED' }">
          <div class="submit-preview-card__header">
            <div class="submit-preview-card__title">
              <div class="submit-preview-card__dept"><span>结算部门</span><strong>{{ row.approval?.businessDeptName || row.deptName || '未指定部门' }}</strong></div>
              <div class="submit-preview-card__group">{{ row.groupName }} · {{ row.count }} 条明细</div>
            </div>
            <div class="submit-preview-card__actions">
              <el-tag :type="approvalStatusType(row.approval?.status)">{{ approvalStatusLabel(row.approval?.status) }}</el-tag>
              <template v-if="row.attachmentStatus === 'GENERATED' && row.attachmentOssId">
                <el-button link type="primary" @click="downloadGeneratedAttachment(row)">下载附件</el-button>
                <el-button v-if="!row.applicationId" link type="warning" :loading="attachmentUploadGroupKey === row.groupKey" @click="selectAttachmentUpload(row)">上传修改版</el-button>
              </template>
              <template v-else-if="row.attachmentStatus === 'PENDING'">
                <el-button link type="primary" :loading="attachmentDownloadGroupKey === row.groupKey" @click="downloadPendingAttachment(row)">生成并下载</el-button>
                <el-button link type="warning" :loading="attachmentUploadGroupKey === row.groupKey" @click="selectAttachmentUpload(row)">上传修改版</el-button>
              </template>
              <el-tag v-else :type="row.attachmentStatus === 'MISSING' ? 'danger' : row.attachmentStatus === 'NONE' ? 'info' : 'warning'">{{ attachmentStatusLabel(row.attachmentStatus) }}</el-tag>
            </div>
          </div>
          <div class="submit-preview-card__body">
            <div v-if="row.approval?.status === 'MATCHED'" class="submit-preview-meta">
              <div class="submit-preview-meta__item"><span>泛微表单</span><strong>{{ row.approval.formName || row.approval.workflowName || '—' }}</strong></div>
              <div class="submit-preview-meta__item"><span>审批方案</span><strong>{{ row.approval.planName || '—' }}</strong></div>
              <div class="submit-preview-meta__item"><span>审批方式</span><strong>{{ row.approval.approvalName || processTypeLabel(row.approval.approvalCode || row.approval.processType) }}</strong></div>
              <div class="submit-preview-meta__item submit-preview-meta__item--wide"><span>审批人</span><strong>{{ approvalUserNames(row.approval.approvers) }}</strong></div>
              <div class="submit-preview-meta__item submit-preview-meta__item--wide"><span>抄送人</span><strong>{{ approvalUserNames(row.approval.copyUsers) }}</strong></div>
            </div>
            <div v-else class="submit-preview-card__missing">
              <span class="submit-preview-card__missing-icon">!</span>
              <span>{{ row.approval?.message || '请先完成该结算部门的审批方案配置' }}</span>
            </div>
          </div>
        </article>
      </div>
        <div class="submit-rule-note">
          <el-icon><InfoFilled /></el-icon>
          <span>流程、审批方案、审批人和抄送人均按结算部门自动匹配。</span>
        </div>
      <el-form label-width="120px" class="submit-form">
        <el-form-item v-for="parameter in submitParameters" :key="parameter.code" :label="parameter.label || parameter.code" :required="parameter.required">
          <el-date-picker v-if="parameter.type === 'DATE'" v-model="parameterValues[parameter.code]" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
          <el-input-number v-else-if="parameter.type === 'NUMBER'" v-model="parameterValues[parameter.code]" controls-position="right" style="width: 100%" />
          <el-input v-else v-model="parameterValues[parameter.code]" :placeholder="parameter.defaultValue || `请输入${parameter.label || parameter.code}`" />
        </el-form-item>
        <el-checkbox v-model="submitConfirmed" class="submit-confirmation">我已确认业务模板、组织分组、明细数据、审批配置和附件无误，同意提交泛微审批</el-checkbox>
      </el-form>
      </div>
      <template #footer>
        <div class="submit-dialog__footer">
          <span v-if="!submitApprovalReady && !submitApprovalLoading" class="submit-dialog__footer-hint">请先完成所有结算部门的审批方案配置</span>
          <div class="submit-dialog__footer-actions">
            <el-button @click="submitDialog.visible = false">取消</el-button>
            <el-button type="primary" :loading="submitDialog.loading" :disabled="!submitConfirmed || submitApprovalLoading || !submitApprovalReady" @click="submitBatch">确认提交</el-button>
          </div>
        </div>
      </template>
    </el-dialog>

    <input ref="attachmentUploadInput" type="file" accept=".xls,.xlsx" class="attachment-upload-input" @change="handleAttachmentUploadChange" />
  </div>
</template>

<script setup name="EcologyImportBusiness" lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useRoute } from 'vue-router';
import { ArrowDown, InfoFilled, OfficeBuilding, Search, UploadFilled } from '@element-plus/icons-vue';
import modal from '@/plugins/modal';
import { globalHeaders } from '@/utils/request';
import { delOaImportBatch, downloadOaImportAttachment, downloadOaImportBusinessTemplate, getOaImportBatch, getOaImportBusinessConfig, listOaImportBatches, listAvailableOaImportBusinessConfigs, mapOaImportDepartments, previewOaImportApprovals, submitOaImportBatch, uploadOaImportAttachment } from '@/api/ecology';
import { download as requestDownload } from '@/utils/request';
import { saveBlob } from '@/utils/save';
import userApi from '@/api/system/user';
import type { DeptVO } from '@/api/system/dept/types';
import type { OaDepartmentApprovalUserVO } from '@/api/ecology/types';
import type { OaImportApprovalPreviewVO, OaImportBatchQuery, OaImportBatchVO, OaImportBusinessConfigVO, OaImportFieldDefinition, OaImportParameterDefinition, OaImportSubmitForm } from '@/api/ecology/importBusinessTypes';

const route = useRoute();
const props = withDefaults(defineProps<{ embedded?: boolean }>(), { embedded: false });
const loading = ref(false);
const configs = ref<OaImportBusinessConfigVO[]>([]);
const batches = ref<OaImportBatchVO[]>([]);
const total = ref(0);
const query = reactive<OaImportBatchQuery>({ pageNum: 1, pageSize: 10, configId: typeof route.query.configId === 'string' ? route.query.configId : undefined, batchNo: '', status: '' });
const selectedConfig = ref<OaImportBusinessConfigVO>();
const uploadRef = ref<ElUploadInstance>();
const uploadDialog = reactive({ visible: false, loading: false });
const uploadFile = ref<any>();
const detailDialog = reactive({ visible: false, loading: false });
const detail = ref<OaImportBatchVO>();
const mappingDialog = reactive({ visible: false, loading: false });
const mappingBatch = ref<OaImportBatchVO>();
const mappingValues = reactive<Record<string, string | number | undefined>>({});
const mappingTargetNames = reactive<Record<string, string | undefined>>({});
const mappingOptions = reactive<Record<string, DeptVO[]>>({});
const mappingSkipped = reactive<Record<string, boolean>>({});
const mappingSkipReasons = reactive<Record<string, string>>({});
const organizationOptions = ref<DeptVO[]>([]);
const organizationSearchRequestId = ref(0);
const organizationTree = ref<DeptVO[]>([]);
const organizationTreeLoading = ref(false);
const organizationTreeInitialized = ref(false);
const organizationTreeRenderKey = ref(0);
const organizationTreeRequestId = ref(0);
const organizationTreeRef = ref<ElTreeInstance>();
const organizationTreeProps = { label: 'deptName', children: 'children', isLeaf: (data: DeptVO) => data.hasChildren === false };
const organizationPicker = reactive({
  visible: false,
  loading: false,
  keyword: '',
  sourceName: '',
  mode: 'tree' as 'tree' | 'search',
  selectedDeptId: undefined as string | number | undefined,
  selectedDept: undefined as DeptVO | undefined
});
const submitDialog = reactive({ visible: false, loading: false });
const submitBatchRow = ref<OaImportBatchVO>();
const submitConfirmed = ref(false);
const submitApprovalLoading = ref(false);
const submitApprovalPreviews = ref<OaImportApprovalPreviewVO[]>([]);
const submitForm = reactive<OaImportSubmitForm>({ parameters: {}, approvalMode: 'AUTO_RULE', participants: [] });
const parameterValues = reactive<Record<string, any>>({});

const statusOptions = [
  { value: 'READY', label: '待提交' }, { value: 'NEED_MAPPING', label: '待匹配组织' }, { value: 'SUBMITTING', label: '提交中' },
  { value: 'SUBMITTED', label: '已提交' }, { value: 'PARTIAL_FAILED', label: '部分失败' }, { value: 'FAILED', label: '失败' }, { value: 'SKIPPED', label: '已跳过' }
];
const statusLabel = (value?: string) => statusOptions.find((item) => item.value === value)?.label || value || '未知';
const statusType = (value?: string) => ({ READY: 'info', NEED_MAPPING: 'warning', SUBMITTING: 'warning', SUBMITTED: 'success', PARTIAL_FAILED: 'warning', FAILED: 'danger', SKIPPED: 'info' }[value || ''] || 'info') as 'success' | 'warning' | 'danger' | 'info';
const businessInitial = (name?: string) => (name || 'B').trim().slice(0, 1).toUpperCase();
const pendingCount = computed(() => batches.value.filter((item) => ['READY', 'NEED_MAPPING', 'SUBMITTING', 'PARTIAL_FAILED', 'FAILED'].includes(item.status || '')).length);
const submittedCount = computed(() => batches.value.filter((item) => item.status === 'SUBMITTED').length);
const recordStatusLabel = (value?: string) => ({ MATCHED: '已匹配', UNMATCHED: '待匹配', SKIPPED: '已跳过', SUBMITTING: '提交中', SUBMITTED: '已提交', FAILED: '失败' }[value || ''] || value || '未知');
const recordStatusType = (value?: string) => ({ MATCHED: 'success', UNMATCHED: 'warning', SKIPPED: 'info', SUBMITTING: 'warning', SUBMITTED: 'success', FAILED: 'danger' }[value || ''] || 'info') as 'success' | 'warning' | 'danger' | 'info';
const attachmentUploadInput = ref<HTMLInputElement>();
const attachmentUploadGroupKey = ref<string>();
const attachmentUploadTargetGroupKey = ref<string>();
const attachmentDownloadGroupKey = ref<string>();
const uploadUrl = computed(() => query.configId ? `${import.meta.env.VITE_APP_BASE_API}/ecology/import-business/${query.configId}/import` : '');
const mappingItems = computed(() => mappingBatch.value?.mappingItems || []);
const mappingNames = computed(() => {
  if (mappingItems.value.length) return mappingItems.value.map((item) => item.sourceDeptName).filter(Boolean);
  return [...new Set([...(mappingBatch.value?.unmatchedDeptNames || []), ...(mappingBatch.value?.skippedDeptNames || [])])];
});
const mappingPendingCount = computed(() => mappingNames.value.filter((name) => !mappingSkipped[name] && !mappingValues[name]).length);
const mappingSkippedCount = computed(() => mappingNames.value.filter((name) => mappingSkipped[name]).length);
const detailFields = computed<OaImportFieldDefinition[]>(() => parseJson<OaImportFieldDefinition[]>(selectedConfig.value?.fieldDefinitionsJson, []));
const detailRecordsByGroup = computed(() => {
  const grouped = new Map<string, NonNullable<OaImportBatchVO['records']>>();
  (detail.value?.records || []).forEach((record) => {
    const key = String(record.groupKey || '__ALL__');
    const current = grouped.get(key) || [];
    current.push(record);
    grouped.set(key, current);
  });
  return grouped;
});
const groupRecords = (groupKey?: string) => detailRecordsByGroup.value.get(String(groupKey || '__ALL__')) || [];
const groupStatusMessage = (group: any) => {
  if (group.status === 'FAILED') return group.errorMessage || '泛微申请提交失败';
  if (group.status === 'SKIPPED') return group.skipReason || '本批次已跳过，不会提交泛微';
  if (group.status === 'SUBMITTING') return '正在提交泛微';
  if (group.status === 'SUBMITTED') return '已向泛微提交';
  if (group.status === 'UNMATCHED') return '等待完成组织匹配';
  return '待提交泛微';
};
const submitParameters = computed<OaImportParameterDefinition[]>(() => parseJson<OaImportParameterDefinition[]>(selectedConfig.value?.parameterDefinitionsJson, []));
const submitActiveCount = computed(() => (submitBatchRow.value?.records || []).filter((record) => record.status !== 'SKIPPED').length);
const submitSkippedCount = computed(() => (submitBatchRow.value?.records || []).filter((record) => record.status === 'SKIPPED').length);
const submitAttachmentMode = computed(() => {
  const config = parseJson<Record<string, any>>(selectedConfig.value?.attachmentConfigJson, {});
  if (config.mode !== 'GENERATED_TABLE') return 'NONE';
  return config.templateOssId ? 'TEMPLATE' : 'MISSING';
});
const attachmentStatusLabel = (value?: string) => ({ GENERATED: '附件已就绪', PENDING: '待生成附件', MISSING: '未配置模板', NONE: '不生成附件' }[value || ''] || '待确认');
const submitPreviewGroups = computed(() => {
  const groups = new Map<string, { groupKey: string; groupName: string; deptName: string; count: number; attachmentStatus: string; attachmentOssId?: string | number; applicationId?: string | number }>();
  (submitBatchRow.value?.records || []).filter((record) => record.status !== 'SKIPPED').forEach((record) => {
    const key = String(record.groupKey || record.groupName || record.deptName || '默认分组');
    const recordAttachmentStatus = record.attachmentOssId ? 'GENERATED' : submitAttachmentMode.value === 'TEMPLATE' ? 'PENDING' : submitAttachmentMode.value === 'MISSING' ? 'MISSING' : 'NONE';
    const current = groups.get(key) || { groupKey: key, groupName: record.groupName || key, deptName: record.deptName || '未指定', count: 0, attachmentStatus: recordAttachmentStatus, attachmentOssId: record.attachmentOssId, applicationId: record.applicationId };
    current.count += 1;
    if (!current.attachmentOssId && record.attachmentOssId) current.attachmentOssId = record.attachmentOssId;
    if (!current.applicationId && record.applicationId) current.applicationId = record.applicationId;
    if (current.attachmentStatus === 'GENERATED' && !record.attachmentOssId) current.attachmentStatus = recordAttachmentStatus;
    groups.set(key, current);
  });
  return [...groups.values()];
});
const submitApprovalByGroup = computed(() => new Map(submitApprovalPreviews.value.map((item) => [item.groupKey, item])));
const submitPreviewRows = computed(() => submitPreviewGroups.value.map((item) => ({ ...item, approval: submitApprovalByGroup.value.get(item.groupKey) })));
const submitApprovalMissing = computed(() => submitApprovalPreviews.value.filter((item) => item.status !== 'MATCHED'));
const submitApprovalReady = computed(() => submitApprovalPreviews.value.length > 0 && submitApprovalMissing.value.length === 0);
const approvalStatusLabel = (value?: string) => ({ MATCHED: '已匹配', MISSING_CONFIG: '未配置', INVALID_CONFIG: '配置无效', AMBIGUOUS_DEPT: '部门不唯一' }[value || ''] || '待检查');
const approvalStatusType = (value?: string) => ({ MATCHED: 'success', MISSING_CONFIG: 'danger', INVALID_CONFIG: 'danger', AMBIGUOUS_DEPT: 'warning' }[value || ''] || 'info') as 'success' | 'warning' | 'danger' | 'info';
const processTypeLabel = (value?: string) => ({ SEQUENTIAL: '依次签', COUNTERSIGN: '会签', MIXED: '混合节点' }[value || ''] || value || '—');
const approvalUserNames = (users?: OaDepartmentApprovalUserVO[]) => users?.length ? users.map((item) => item.nickName || item.userName || item.employeeNo || '未命名用户').join('、') : '—';

function parseJson<T>(value: string | undefined, fallback: T): T { if (!value) return fallback; try { return JSON.parse(value) as T; } catch { return fallback; } }
const canSubmit = (row: any) => ['READY', 'PARTIAL_FAILED', 'FAILED'].includes(row.status || '') && !(row.unmatchedDeptNames?.length) && Number(row.matchedCount || 0) > 0;
const canRemoveBatch = (row: any) => !['SUBMITTING', 'SUBMITTED'].includes(row.status || '') && Number(row.applicationCount || 0) === 0;
const hasMappingItems = (row: any) => Boolean(row?.mappingItems?.length || row?.unmatchedDeptNames?.length || row?.skippedDeptNames?.length);
const canMap = (row: any) => hasMappingItems(row) && !['SUBMITTING', 'SUBMITTED'].includes(row?.status || '') && Number(row?.applicationCount || 0) === 0;
const loadConfigs = async () => { const res = await listAvailableOaImportBusinessConfigs(); configs.value = res.data || []; if (query.configId) selectedConfig.value = configs.value.find((item) => String(item.id) === String(query.configId)); };
const loadList = async () => { loading.value = true; try { const res = await listOaImportBatches(query); batches.value = res.data?.rows || []; total.value = res.data?.total || 0; } finally { loading.value = false; } };
const handleConfigChange = () => { selectedConfig.value = configs.value.find((item) => String(item.id) === String(query.configId)); query.pageNum = 1; loadList(); };
const search = () => { query.pageNum = 1; loadList(); };
const resetQuery = () => { query.batchNo = ''; query.status = ''; query.pageNum = 1; loadList(); };
const openUpload = () => { if (!query.configId) return modal.msgWarning('请先选择业务模板'); uploadFile.value = undefined; uploadDialog.visible = true; uploadDialog.loading = false; uploadRef.value?.clearFiles(); };
const downloadTemplate = () => { if (!query.configId) return modal.msgWarning('请先选择业务模板'); requestDownload(downloadOaImportBusinessTemplate(query.configId), {}, `${selectedConfig.value?.businessName || '业务'}_导入模板.xlsx`); };
const handleUploadChange = (file: any, files: any[]) => { if (files.length > 1) files.splice(0, files.length - 1); uploadFile.value = file?.raw || files[0]?.raw; };
const handleUploadRemove = () => { uploadFile.value = undefined; uploadDialog.loading = false; };
const submitUpload = () => { if (!uploadFile.value) return modal.msgWarning('请选择 Excel 文件'); uploadDialog.loading = true; uploadRef.value?.submit(); };
const handleUploadSuccess = async (response: any) => { uploadDialog.loading = false; uploadDialog.visible = false; uploadRef.value?.clearFiles(); modal.msgSuccess(response?.msg || '导入完成'); await loadList(); if (response?.data?.id) await openDetail(response.data); };
const handleUploadError = () => { uploadDialog.loading = false; modal.msgError('导入失败，请检查模板和 Excel 表头是否一致'); };
const attachmentExtension = () => {
  const config = parseJson<Record<string, any>>(selectedConfig.value?.attachmentConfigJson, {});
  const templateFileName = String(config.templateFileName || '').toLowerCase();
  return templateFileName.endsWith('.xls') && !templateFileName.endsWith('.xlsx') ? '.xls' : '.xlsx';
};
const attachmentFileName = (row: any) => `${selectedConfig.value?.businessName || '业务'}-${row?.groupName || row?.groupKey || '分组'}${attachmentExtension()}`;
const attachmentBatchId = () => submitBatchRow.value?.id || detail.value?.id;
const downloadGeneratedAttachment = async (row: any) => {
  const batchId = attachmentBatchId();
  if (!batchId || !row?.attachmentOssId) return modal.msgWarning('附件不存在，请刷新后重试');
  await downloadAttachmentFile(batchId, row);
};
const downloadPendingAttachment = async (row: any) => {
  const batchId = attachmentBatchId();
  if (!batchId) return modal.msgWarning('导入批次不存在，请刷新后重试');
  await downloadAttachmentFile(batchId, row);
};
const downloadAttachmentFile = async (batchId: string | number, row: any) => {
  const groupKey = row?.groupKey || '__ALL__';
  attachmentDownloadGroupKey.value = groupKey;
  try {
    const blob = await downloadOaImportAttachment(batchId, { groupKey, parameters: { ...parameterValues } });
    saveBlob(blob, attachmentFileName(row));
  } finally {
    attachmentDownloadGroupKey.value = undefined;
  }
};
const selectAttachmentUpload = (row: any) => {
  if (!attachmentBatchId()) return modal.msgWarning('导入批次不存在，请刷新后重试');
  attachmentUploadTargetGroupKey.value = row?.groupKey || '__ALL__';
  attachmentUploadInput.value?.click();
};
const handleAttachmentUploadChange = async (event: Event) => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  const groupKey = attachmentUploadTargetGroupKey.value;
  attachmentUploadTargetGroupKey.value = undefined;
  const batchId = attachmentBatchId();
  input.value = '';
  if (!file || !groupKey || !batchId) return;
  attachmentUploadGroupKey.value = groupKey;
  try {
    const response = await uploadOaImportAttachment(batchId, groupKey, file);
    submitBatchRow.value = response.data;
    if (detail.value?.id === batchId) detail.value = response.data;
    modal.msgSuccess('修改后的附件已上传，提交时将使用该文件');
  } finally {
    attachmentUploadGroupKey.value = undefined;
  }
};

const openDetail = async (row: any) => {
  detailDialog.visible = true;
  detailDialog.loading = true;
  detail.value = undefined;
  selectedConfig.value = configs.value.find((item) => String(item.id) === String(row.configId));
  try {
    detail.value = (await getOaImportBatch(row.id)).data;
    const configId = detail.value?.configId || row.configId;
    if (!selectedConfig.value && configId) selectedConfig.value = (await getOaImportBusinessConfig(configId)).data;
  } catch (error) {
    console.error('加载导入批次详情失败', error);
    detailDialog.visible = false;
    modal.msgError('批次详情加载失败，请刷新后重试');
  } finally {
    detailDialog.loading = false;
  }
};
const removeBatch = async (row: any) => {
  if (!canRemoveBatch(row)) {
    modal.msgWarning('已创建泛微申请或正在提交的批次不能删除');
    return;
  }
  try {
    await modal.confirm(`确认删除导入批次“${row.batchNo || row.sourceFileName || '当前批次'}”吗？删除后该批次及其明细将不再显示。`);
  } catch {
    return;
  }
  await delOaImportBatch(row.id);
  modal.msgSuccess('导入批次已删除');
  if (detail.value?.id === row.id) {
    detailDialog.visible = false;
    detail.value = undefined;
  }
  await loadList();
};
const deptOptionLabel = (dept: DeptVO) => dept.parentName ? `${dept.deptName} · ${dept.parentName}` : dept.deptName;
const mappingIndexLabel = (index: number) => String(index + 1).padStart(2, '0');
const mappingStatusLabel = (sourceName: string) => {
  if (mappingSkipped[sourceName]) return '本批次跳过';
  return mappingValues[sourceName] ? '已映射' : '待处理';
};
const mappingDisplayName = (sourceName: string) => {
  const selectedId = mappingValues[sourceName];
  const selected = (mappingOptions[sourceName] || []).find((item) => String(item.deptId) === String(selectedId));
  return selected ? deptOptionLabel(selected) : mappingTargetNames[sourceName] || '已选择组织';
};
const openOrganizationPicker = (sourceName: string) => {
  organizationSearchRequestId.value += 1;
  organizationPicker.sourceName = sourceName;
  organizationPicker.keyword = '';
  organizationPicker.loading = false;
  organizationPicker.mode = 'tree';
  organizationPicker.selectedDeptId = mappingValues[sourceName];
  organizationPicker.selectedDept = mappingOptions[sourceName]?.[0];
  organizationOptions.value = mappingOptions[sourceName] ? [...mappingOptions[sourceName]] : [];
  organizationPicker.visible = true;
  organizationTree.value = [];
  organizationTreeInitialized.value = false;
  void loadOrganizationTreeRoots();
};

const toOrganizationTreeNode = (dept: DeptVO): DeptVO => ({ ...dept, children: [] });

const buildOrganizationSearchTree = (rows: DeptVO[]) => {
  const nodes = rows.map(toOrganizationTreeNode);
  const nodeMap = new Map(nodes.map((node) => [String(node.deptId), node]));
  const roots: DeptVO[] = [];
  nodes.forEach((node) => {
    const parent = nodeMap.get(String(node.parentId));
    if (parent && String(parent.deptId) !== String(node.deptId)) parent.children.push(node);
    else roots.push(node);
  });
  const updateChildrenState = (node: DeptVO) => {
    node.children.sort((left, right) => (left.orderNum || 0) - (right.orderNum || 0));
    node.hasChildren = node.children.length > 0;
    node.children.forEach(updateChildrenState);
  };
  roots.forEach(updateChildrenState);
  return roots;
};

/** 只加载组织树根节点，避免选择器打开时拉取全部组织。 */
const loadOrganizationTreeRoots = async () => {
  const requestId = ++organizationTreeRequestId.value;
  organizationTreeLoading.value = true;
  try {
    const res = await userApi.deptChildren(0);
    if (organizationTreeRequestId.value === requestId) {
      organizationTree.value = ((res.data || []) as DeptVO[]).map(toOrganizationTreeNode);
      organizationTreeRenderKey.value += 1;
    }
  } finally {
    if (organizationTreeRequestId.value === requestId) {
      organizationTreeInitialized.value = true;
      organizationTreeLoading.value = false;
    }
  }
};

/** 懒加载当前组织的直属下级，只请求用户展开的那一层。 */
const loadOrganizationTreeNode = async (node: any, resolve: (data: DeptVO[]) => void) => {
  if (node.level === 0) {
    resolve(organizationTree.value);
    return;
  }
  organizationTreeLoading.value = true;
  try {
    const res = await userApi.deptChildren(node.data.deptId);
    resolve(((res.data || []) as DeptVO[]).map(toOrganizationTreeNode));
  } finally {
    organizationTreeLoading.value = false;
  }
};

const restoreOrganizationTree = () => {
  organizationSearchRequestId.value += 1;
  organizationTreeRequestId.value += 1;
  organizationPicker.mode = 'tree';
  organizationTreeLoading.value = false;
  organizationTree.value = [];
  organizationTreeInitialized.value = false;
  void loadOrganizationTreeRoots();
};

const searchOrganizationOptions = async (keyword: string) => {
  const normalizedKeyword = String(keyword || '').trim();
  const requestId = ++organizationSearchRequestId.value;
  organizationTreeRequestId.value += 1;
  organizationTreeLoading.value = false;
  if (!normalizedKeyword) {
    organizationOptions.value = [];
    organizationPicker.loading = false;
    restoreOrganizationTree();
    return;
  }
  organizationPicker.loading = true;
  try {
    const res = await userApi.searchDept(normalizedKeyword);
    if (organizationSearchRequestId.value === requestId) {
      const rows = ((res.data || []) as DeptVO[]).filter((item) => item.status === '0' && ['SUBCOMPANY', 'DEPARTMENT'].includes(item.oaSourceType || ''));
      organizationOptions.value = rows;
      organizationTree.value = buildOrganizationSearchTree(rows);
      organizationTreeInitialized.value = true;
      organizationTreeRenderKey.value += 1;
      organizationPicker.mode = 'search';
    }
  } finally {
    if (organizationSearchRequestId.value === requestId) organizationPicker.loading = false;
  }
};
const selectOrganizationTreeNode = (dept: DeptVO) => {
  organizationPicker.selectedDeptId = dept.deptId;
  organizationPicker.selectedDept = dept;
};
const confirmOrganizationSelection = () => {
  if (!organizationPicker.selectedDeptId) return modal.msgWarning('请选择一个泛微组织');
  const sourceName = organizationPicker.sourceName;
  const selected = organizationPicker.selectedDept || organizationOptions.value.find((item) => String(item.deptId) === String(organizationPicker.selectedDeptId));
  if (!selected) return modal.msgWarning('请选择一个有效的泛微组织');
  mappingValues[sourceName] = selected.deptId;
  mappingTargetNames[sourceName] = deptOptionLabel(selected);
  mappingOptions[sourceName] = [selected];
  organizationPicker.visible = false;
};
const clearMapping = (sourceName: string) => {
  mappingValues[sourceName] = undefined;
  mappingTargetNames[sourceName] = undefined;
  mappingOptions[sourceName] = [];
};
const skipSourceDepartment = async (sourceName: string) => {
  try {
    await modal.confirm(`确认跳过“${sourceName}”在本批次中的全部数据吗？跳过后不会生成 Excel，也不会提交泛微审批。`);
  } catch {
    return;
  }
  mappingSkipped[sourceName] = true;
  mappingValues[sourceName] = undefined;
  mappingTargetNames[sourceName] = undefined;
  mappingOptions[sourceName] = [];
  mappingSkipReasons[sourceName] = mappingSkipReasons[sourceName] || '组织暂未同步';
};
const restoreSourceDepartment = (sourceName: string) => {
  mappingSkipped[sourceName] = false;
  mappingSkipReasons[sourceName] = '';
};
const openMapping = (row: any) => {
  mappingBatch.value = row;
  Object.keys(mappingValues).forEach((key) => delete mappingValues[key]);
  Object.keys(mappingTargetNames).forEach((key) => delete mappingTargetNames[key]);
  Object.keys(mappingOptions).forEach((key) => delete mappingOptions[key]);
  Object.keys(mappingSkipped).forEach((key) => delete mappingSkipped[key]);
  Object.keys(mappingSkipReasons).forEach((key) => delete mappingSkipReasons[key]);
  mappingNames.value.forEach((name: string) => {
    const item = mappingItems.value.find((mappingItem) => mappingItem.sourceDeptName === name);
    const skipped = item?.status === 'SKIPPED' || (row.skippedDeptNames || []).includes(name);
    mappingValues[name] = item?.targetDeptId;
    mappingTargetNames[name] = item?.targetDeptName;
    mappingOptions[name] = item?.targetDeptId && item.targetDeptName
      ? [{ deptId: item.targetDeptId, deptName: item.targetDeptName, parentName: '' } as DeptVO]
      : [];
    mappingSkipped[name] = skipped;
    mappingSkipReasons[name] = skipped ? item?.skipReason || '组织暂未同步' : '';
  });
  mappingDialog.visible = true;
};
const saveMapping = async () => {
  const mappings: Record<string, string | number> = {};
  Object.entries(mappingValues).forEach(([name, id]) => {
    if (!mappingSkipped[name] && id !== undefined && id !== null && id !== '') mappings[name] = id;
  });
  const skippedDeptReasons: Record<string, string> = {};
  Object.entries(mappingSkipped).forEach(([name, skipped]) => {
    if (skipped) skippedDeptReasons[name] = String(mappingSkipReasons[name] || '').trim() || '本批次跳过';
  });
  if (mappingPendingCount.value > 0) return modal.msgWarning(`还有 ${mappingPendingCount.value} 个来源组织未处理，请匹配或跳过后再保存`);
  if (!Object.keys(mappings).length && !Object.keys(skippedDeptReasons).length) return modal.msgWarning('请至少匹配或跳过一个来源组织');
  mappingDialog.loading = true;
  try {
    const res = await mapOaImportDepartments(mappingBatch.value!.id, { mappings, skippedDeptReasons });
    mappingDialog.visible = false;
    modal.msgSuccess(res.data?.message || '组织处理完成');
    await loadList();
    if (detail.value?.id === mappingBatch.value?.id) detail.value = (await getOaImportBatch(mappingBatch.value!.id)).data;
  } finally {
    mappingDialog.loading = false;
  }
};

const openSubmit = async (row: any) => {
  submitBatchRow.value = (await getOaImportBatch(row.id)).data;
  const config = configs.value.find((item) => String(item.id) === String(row.configId));
  selectedConfig.value = config || (row.configId ? (await getOaImportBusinessConfig(row.configId)).data : undefined);
  Object.keys(parameterValues).forEach((key) => delete parameterValues[key]);
  submitParameters.value.forEach((item) => { if (item.defaultValue !== undefined) parameterValues[item.code] = item.defaultValue; });
  Object.assign(submitForm, { workflowConfigId: undefined, approvalMode: 'AUTO_RULE', approvalPlanId: undefined, parameters: parameterValues, processType: undefined, participants: [] });
  submitApprovalPreviews.value = [];
  submitConfirmed.value = false;
  submitDialog.visible = true;
  submitApprovalLoading.value = true;
  try {
    submitApprovalPreviews.value = (await previewOaImportApprovals(row.id)).data || [];
  } finally {
    submitApprovalLoading.value = false;
  }
};
const submitBatch = async () => {
  if (!submitConfirmed.value) return modal.msgWarning('请先确认预览信息');
  if (submitApprovalLoading.value) return modal.msgWarning('审批配置仍在检查，请稍候');
  if (!submitApprovalReady.value) return modal.msgWarning('存在未配置可用审批方案的结算部门，请先完成审批方案配置');
  if (submitAttachmentMode.value === 'MISSING') return modal.msgError('当前业务已启用附件生成，但没有配置附件模板，请先到“导入业务模板”上传并保存模板');
  for (const item of submitParameters.value) { if (item.required && !String(parameterValues[item.code] ?? '').trim() && !item.defaultValue) return modal.msgWarning(`请填写${item.label || item.code}`); }
  submitForm.parameters = { ...parameterValues };
  submitForm.approvalMode = 'AUTO_RULE';
  submitForm.participants = [];
  submitDialog.loading = true;
  try {
    const res = await submitOaImportBatch(submitBatchRow.value!.id, submitForm);
    modal.msgSuccess(res.data?.message || '泛微提交完成');
    submitDialog.visible = false;
    await loadList();
    if (detail.value?.id === submitBatchRow.value?.id) detail.value = (await getOaImportBatch(submitBatchRow.value!.id)).data;
  } finally {
    submitDialog.loading = false;
  }
};

onMounted(async () => {
  await loadConfigs();
  await loadList();
  const batchId = typeof route.query.batchId === 'string' ? route.query.batchId : '';
  if (batchId) {
    const row = batches.value.find((item) => String(item.id) === batchId);
    await openDetail(row || { id: batchId, configId: route.query.configId });
  }
});
</script>

<style scoped lang="scss">
.import-business-page {
  --import-accent: var(--el-color-primary);
  --import-accent-soft: rgba(14, 165, 233, 0.09);
  --import-border: var(--app-surface-border);
  --import-shadow: 0 12px 30px rgba(15, 23, 42, 0.06);
  --import-shadow-hover: 0 16px 36px rgba(15, 23, 42, 0.09);
  --import-hero-bg: linear-gradient(120deg, var(--app-surface-bg), rgba(239, 246, 255, 0.72));
  --import-soft-surface: rgba(255, 255, 255, 0.58);
  --import-soft-surface-shadow: rgba(255, 255, 255, 0.72);
  --import-filter-bg: linear-gradient(120deg, rgba(239, 246, 255, 0.75), rgba(248, 250, 252, 0.8));
  --import-success-surface: linear-gradient(145deg, rgba(236, 253, 245, 0.75), rgba(255, 255, 255, 0.6));
  --import-success-text: #047857;
  --import-row-hover-bg: rgba(14, 165, 233, 0.035);
  --import-empty-bg: linear-gradient(135deg, rgba(239, 246, 255, 0.5), rgba(248, 250, 252, 0.75));
  --import-overview-bg: rgba(255, 255, 255, 0.35);
  --import-mapping-bg: linear-gradient(120deg, rgba(239, 246, 255, 0.78), rgba(248, 250, 252, 0.9));
  --import-mapping-hover-bg: rgba(255, 255, 255, 0.7);
  --import-picker-bg: linear-gradient(120deg, rgba(239, 246, 255, 0.78), rgba(248, 250, 252, 0.82));
  --import-tree-bg: linear-gradient(180deg, rgba(248, 250, 252, 0.92), rgba(255, 255, 255, 0.98));
  --import-tree-heading-bg: rgba(248, 250, 252, 0.96);
  --import-tree-current-bg: rgba(224, 242, 254, 0.74);
  --import-selected-bg: rgba(236, 253, 245, 0.5);
  --import-disabled-bg: rgba(248, 250, 252, 0.9);
  --import-success-color: #059669;
  --import-warning-color: #d97706;
  --import-warning-strong: #b45309;
  --import-application-color: #8b5cf6;

  .intro-card,
  .main-card {
    position: relative;
    overflow: hidden;
    border: 1px solid var(--import-border);
    border-radius: 18px;
    background: var(--app-surface-bg);
    box-shadow: var(--import-shadow);
    transition: border-color 0.25s ease, box-shadow 0.25s ease;

    &:hover {
      border-color: var(--app-accent-soft);
      box-shadow: var(--import-shadow-hover);
      transform: none;
    }
  }

  .intro-card {
    background:
      radial-gradient(circle at 96% 10%, rgba(14, 165, 233, 0.12), transparent 27%),
      var(--import-hero-bg);

    :deep(.el-card__body) {
      padding: 25px 28px !important;
    }
  }

  .intro-content,
  .workspace-heading,
  .toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 24px;
  }

  .intro-content > div:first-child,
  .workspace-heading > div:first-child {
    min-width: 0;
  }

  .eyebrow,
  .panel-kicker {
    display: flex;
    align-items: center;
    gap: 7px;
    color: var(--import-accent);
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.16em;
    line-height: 1;
  }

  .eyebrow-dot,
  .kicker-dot,
  .toolbar-dot {
    width: 6px;
    height: 6px;
    flex: 0 0 6px;
    border-radius: 50%;
    background: var(--import-accent);
    box-shadow: 0 0 0 4px var(--import-accent-soft);
  }

  .intro-content h2 {
    margin: 9px 0 7px;
    color: var(--app-text-title);
    font-size: 25px;
    font-weight: 700;
    letter-spacing: -0.03em;
    line-height: 1.2;
  }

  .intro-content p,
  .workspace-heading p {
    margin: 0;
    color: var(--el-text-color-secondary);
    font-size: 13px;
    line-height: 1.7;
  }

  .intro-aside,
  .workspace-badge {
    min-width: 210px;
    padding: 14px 16px;
    border: 1px solid rgba(14, 165, 233, 0.14);
    border-radius: 13px;
    background: var(--import-soft-surface);
    box-shadow: inset 0 1px 0 var(--import-soft-surface-shadow);
  }

  .intro-aside-label,
  .workspace-badge span {
    display: block;
    color: var(--el-text-color-secondary);
    font-size: 9px;
    font-weight: 800;
    letter-spacing: 0.14em;
  }

  .intro-aside strong,
  .workspace-badge strong {
    display: block;
    margin-top: 6px;
    overflow: hidden;
    color: var(--app-text-title);
    font-size: 14px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .intro-aside .el-tag {
    max-width: 100%;
    margin-top: 9px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .main-card :deep(.el-card__body) {
    padding: 23px 20px 18px !important;
  }

  .workspace-heading {
    align-items: flex-start;
    padding: 0 2px;
  }

  .workspace-heading h3 {
    margin: 8px 0 4px;
    color: var(--app-text-title);
    font-size: 19px;
    font-weight: 700;
    line-height: 1.3;
  }

  .workspace-badge {
    min-width: 185px;
    border-color: rgba(16, 185, 129, 0.16);
    background: var(--import-success-surface);

    strong {
      color: var(--import-success-text);
    }
  }

  .overview-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
    margin: 21px 0 19px;
  }

  .overview-item {
    position: relative;
    display: flex;
    align-items: center;
    min-height: 68px;
    gap: 11px;
    overflow: hidden;
    padding: 12px 14px;
    border: 1px solid var(--import-border);
    border-radius: 13px;
    background: var(--el-fill-color-lighter);

    &::after {
      position: absolute;
      right: -20px;
      bottom: -26px;
      width: 82px;
      height: 82px;
      border-radius: 50%;
      background: currentColor;
      content: '';
      opacity: 0.045;
    }

    &--blue { color: #3b82f6; }
    &--orange { color: #f59e0b; }
    &--green { color: #10b981; }
  }

  .overview-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 34px;
    height: 34px;
    flex: 0 0 34px;
    border: 1px solid currentColor;
    border-radius: 10px;
    background: var(--import-overview-bg);
    font-size: 9px;
    font-weight: 800;
    letter-spacing: 0.04em;
  }

  .overview-item > div {
    min-width: 0;
    display: flex;
    align-items: baseline;
    gap: 7px;
  }

  .overview-item strong {
    color: currentColor;
    font-size: 21px;
    font-weight: 700;
    line-height: 1;
  }

  .overview-item > div span {
    overflow: hidden;
    color: var(--app-text-title);
    font-size: 12px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .overview-item small {
    position: absolute;
    right: 13px;
    bottom: 11px;
    color: var(--el-text-color-secondary);
    font-size: 10px;
  }

  .filter-panel {
    margin-bottom: 17px;
    padding: 15px 16px 3px;
    border: 1px solid rgba(14, 165, 233, 0.13);
    border-radius: 13px;
    background: var(--import-filter-bg);
  }

  .filter-heading {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 12px;

    strong {
      color: var(--app-text-title);
      font-size: 13px;
    }

    span {
      color: var(--el-text-color-secondary);
      font-size: 11px;
    }
  }

  .filter-panel :deep(.el-form) {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0 12px;
  }

  .filter-panel :deep(.el-form-item) {
    margin-right: 0;
    margin-bottom: 12px;
  }

  .filter-panel :deep(.el-form-item__label) {
    min-width: 58px;
    flex: 0 0 auto;
    padding-right: 10px;
    color: var(--el-text-color-secondary);
    font-size: 12px;
    font-weight: 600;
    line-height: 32px;
    white-space: nowrap;
  }

  .filter-panel :deep(.el-form-item.is-required:not(.is-no-asterisk) > .el-form-item__label) {
    padding-left: 0;
  }

  .filter-panel :deep(.el-input__wrapper),
  .filter-panel :deep(.el-select__wrapper) {
    min-height: 32px;
    border-radius: 9px;
    box-shadow: 0 0 0 1px var(--import-border) inset;
  }

  .toolbar {
    margin-bottom: 11px;
    padding: 0 2px;
  }

  .toolbar-hint {
    display: flex;
    align-items: center;
    min-width: 0;
    gap: 8px;
    overflow: hidden;
    color: var(--el-text-color-secondary);
    font-size: 11px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .toolbar-dot {
    width: 5px;
    height: 5px;
    flex-basis: 5px;
    box-shadow: none;
  }

  .toolbar > div:last-child {
    display: flex;
    flex: 0 0 auto;
    gap: 8px;
  }

  .toolbar .el-button {
    min-height: 32px;
    border-radius: 9px;
  }

  .batch-table {
    overflow: hidden;
    border-radius: 12px;

    :deep(.el-table__inner-wrapper::before) {
      height: 0;
    }

    :deep(.el-table__header-wrapper th) {
      height: 44px;
      border-bottom: 1px solid var(--import-border);
      background: var(--el-fill-color-lighter);
      color: var(--el-text-color-secondary);
      font-size: 12px;
      font-weight: 700;
    }

    :deep(.el-table__body-wrapper td) {
      height: 72px;
      border-bottom-color: var(--import-border);
      color: var(--el-text-color-regular);
      font-size: 12px;
    }

    :deep(.el-table__row) {
      transition: background-color 0.2s ease;
    }

    :deep(.el-table__row:hover > td) {
      background: var(--import-row-hover-bg) !important;
    }

    :deep(.el-table__fixed-right) {
      z-index: 3;
      background: var(--el-bg-color, #fff);
      box-shadow: -8px 0 16px rgba(15, 23, 42, 0.08);
    }

    :deep(.el-table__fixed-right th),
    :deep(.el-table__fixed-right td),
    :deep(.el-table__fixed-right-patch) {
      background: var(--el-bg-color, #fff) !important;
    }

    :deep(.el-table__fixed-right .el-table__row:hover > td) {
      background: var(--import-row-hover-bg) !important;
    }
  }

  .business-cell,
  .source-cell,
  .number-cell,
  .application-cell {
    display: flex;
    align-items: center;
  }

  .business-cell {
    min-width: 0;
    gap: 11px;
    text-align: left;
  }

  .business-mark {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 34px;
    height: 34px;
    flex: 0 0 34px;
    border: 1px solid rgba(14, 165, 233, 0.16);
    border-radius: 10px;
    background: linear-gradient(145deg, var(--import-accent-soft), rgba(99, 102, 241, 0.1));
    color: var(--el-color-primary);
    font-size: 15px;
    font-weight: 800;
  }

  .business-cell > div {
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .business-cell strong,
  .business-cell small {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .business-cell strong {
    color: var(--app-text-title);
    font-size: 13px;
    font-weight: 700;
  }

  .business-cell small {
    color: var(--el-text-color-secondary);
    font-size: 10px;
  }

  .source-cell {
    min-width: 0;
    gap: 8px;
    color: var(--el-text-color-regular);
  }

  .source-cell > span:last-child {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .source-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 24px;
    flex: 0 0 28px;
    border: 1px solid rgba(16, 185, 129, 0.2);
    border-radius: 6px;
    background: rgba(16, 185, 129, 0.08);
    color: var(--import-success-color);
    font-size: 8px;
    font-weight: 800;
  }

  .number-cell,
  .application-cell {
    gap: 4px;
    color: var(--el-text-color-secondary);
    white-space: nowrap;

    strong {
      color: var(--el-color-primary);
      font-size: 17px;
      font-weight: 700;
    }

    strong.is-muted {
      color: var(--el-text-color-regular);
    }

    i {
      color: var(--el-text-color-placeholder);
      font-style: normal;
    }

    span {
      font-size: 11px;
    }
  }

  .application-cell strong {
    color: var(--import-application-color);
  }

  .table-state {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 5px 9px;
    border-radius: 7px;
    font-size: 11px;
    font-weight: 600;

    i {
      width: 5px;
      height: 5px;
      border-radius: 50%;
      background: currentColor;
    }

    &.is-success {
      background: rgba(16, 185, 129, 0.09);
      color: var(--import-success-color);
    }

    &.is-warning {
      background: rgba(245, 158, 11, 0.11);
      color: var(--import-warning-color);
    }

    &.is-muted {
      background: var(--el-fill-color-light);
      color: var(--el-text-color-secondary);
    }

    &.is-skipped {
      background: rgba(245, 158, 11, 0.09);
      color: var(--import-warning-strong);
    }
  }

  .message-cell {
    display: block;
    overflow: hidden;
    color: var(--el-text-color-secondary);
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .table-actions {
    display: inline-flex;
    align-items: center;
    flex-wrap: nowrap;
    gap: 5px;
    white-space: nowrap;

    .el-button {
      height: 28px;
      margin-left: 0;
      padding: 0 8px;
      border-radius: 7px;
      font-size: 12px;

      &:hover {
        background: var(--import-accent-soft);
      }
    }
  }

  .table-empty {
    display: flex;
    align-items: center;
    flex-direction: column;
    justify-content: center;
    min-height: 164px;
    box-sizing: border-box;
    margin-top: 4px;
    border: 1px dashed rgba(14, 165, 233, 0.2);
    border-radius: 12px;
    background: var(--import-empty-bg);
    color: var(--el-text-color-secondary);

    .empty-mark {
      position: relative;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 48px;
      height: 48px;
      margin-bottom: 13px;
      border: 1px solid rgba(14, 165, 233, 0.16);
      border-radius: 15px;
      background: rgba(14, 165, 233, 0.06);

      &::before {
        position: absolute;
        top: 12px;
        width: 17px;
        height: 21px;
        border: 1px solid rgba(14, 165, 233, 0.45);
        border-radius: 4px;
        content: '';
      }

      i {
        position: absolute;
        left: 17px;
        width: 9px;
        height: 2px;
        border-radius: 2px;
        background: rgba(14, 165, 233, 0.45);

        &:nth-child(1) { top: 20px; }
        &:nth-child(2) { top: 26px; width: 12px; }
        &:nth-child(3) { top: 32px; width: 7px; }
      }
    }

    strong {
      color: var(--app-text-title);
      font-size: 13px;
    }

    p {
      margin: 6px 0 14px;
      font-size: 12px;
    }

    .el-button {
      min-height: 32px;
      border-radius: 9px;
    }
  }

  .detail-summary {
    margin-bottom: 12px;
  }

  .detail-groups-tip {
    display: flex;
    align-items: center;
    gap: 7px;
    margin: 12px 0 -2px;
    padding: 9px 12px;
    border: 1px solid var(--import-border);
    border-radius: 9px;
    background: var(--import-filter-bg);
    color: var(--el-text-color-secondary);
    font-size: 12px;

    .el-icon {
      flex: 0 0 auto;
      color: var(--el-color-primary);
    }
  }

  .detail-groups-table {
    overflow: hidden;
    border-radius: 12px;

    :deep(.el-table__header-wrapper th) {
      background: var(--el-fill-color-lighter);
      color: var(--el-text-color-secondary);
      font-weight: 700;
    }

    :deep(.el-table__body-wrapper td) {
      height: 58px;
      border-bottom-color: var(--import-border);
      color: var(--el-text-color-regular);
      font-size: 12px;
    }

    :deep(.el-table__expanded-cell) {
      padding: 0;
      background: var(--el-fill-color-lighter);
    }
  }

  .group-summary-cell {
    display: flex;
    min-width: 0;
    flex-direction: column;
    gap: 3px;

    strong {
      overflow: hidden;
      color: var(--app-text-title);
      font-weight: 700;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    small {
      overflow: hidden;
      color: var(--el-text-color-secondary);
      font-size: 11px;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  .group-number {
    color: var(--el-color-primary);
    font-size: 15px;
  }

  .group-skipped-count {
    display: block;
    margin-top: 3px;
    color: var(--import-warning-color);
    font-size: 10px;
  }

  .group-muted {
    color: var(--el-text-color-placeholder);
    font-size: 12px;
  }

  .group-records-panel {
    padding: 12px 16px 15px;
    background: var(--import-empty-bg);
  }

  .group-records-panel__heading {
    display: flex;
    align-items: baseline;
    gap: 10px;
    margin-bottom: 9px;

    strong {
      color: var(--app-text-title);
      font-size: 12px;
    }

    span {
      color: var(--el-text-color-secondary);
      font-size: 11px;
    }
  }

  .group-records-table {
    overflow: hidden;
    border-radius: 9px;

    :deep(.el-table__body-wrapper) {
      max-height: 270px;
      overflow-y: auto;
    }
  }

  .detail-groups-empty {
    padding: 42px 0;
    color: var(--el-text-color-secondary);
    font-size: 12px;
    text-align: center;
  }
}

.attachment-upload-input {
  display: none;
}

.mapping-dialog {
    :deep(.el-dialog__body) {
      max-height: calc(100vh - 250px);
      overflow-y: auto;
    }

    :deep(.el-form-item) {
      align-items: flex-start;
      margin-bottom: 12px;
    }

    :deep(.el-form-item__label) {
      padding-top: 6px;
      overflow: hidden;
      color: var(--el-text-color-regular);
      font-size: 12px;
      font-weight: 600;
      line-height: 20px;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    :deep(.el-input__wrapper),
    :deep(.el-select__wrapper) {
      border-radius: 9px;
  }
}

.mapping-overview {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin: 14px 0 10px;
  padding: 12px 14px;
  border: 1px solid rgba(14, 165, 233, 0.15);
  border-radius: 12px;
  background: var(--import-mapping-bg);
}

.mapping-overview__title {
  display: flex;
  align-items: center;
  min-width: 0;
  gap: 10px;
}

.mapping-overview__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  flex: 0 0 32px;
  border-radius: 10px;
  background: rgba(14, 165, 233, 0.1);
  color: var(--el-color-primary);
  font-size: 17px;
}

.mapping-overview__title div {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.mapping-overview__title strong {
  color: var(--app-text-title);
  font-size: 13px;
}

.mapping-overview__title span:not(.mapping-overview__icon) {
  color: var(--el-text-color-secondary);
  font-size: 11px;
}

.mapping-overview__count {
  flex: 0 0 auto;
  padding: 5px 9px;
  border: 1px solid rgba(245, 158, 11, 0.2);
  border-radius: 7px;
  background: rgba(245, 158, 11, 0.08);
  color: var(--import-warning-strong);
  font-size: 11px;
  font-weight: 700;
}

.mapping-list {
  max-height: 430px;
  overflow-y: auto;
  padding: 3px;
  border: 1px solid var(--app-surface-border, var(--el-border-color-light));
  border-radius: 13px;
  background: var(--el-fill-color-lighter);
}

.mapping-row {
  display: grid;
  grid-template-columns: minmax(220px, 1fr) 34px minmax(340px, 1.45fr);
  align-items: center;
  min-height: 74px;
  gap: 10px;
  padding: 9px 10px;
  border: 1px solid transparent;
  border-radius: 10px;
  transition: border-color 0.2s ease, background-color 0.2s ease;

  &:not(:last-child) {
    margin-bottom: 3px;
  }

  &:hover {
    border-color: rgba(14, 165, 233, 0.14);
    background: var(--import-mapping-hover-bg);
  }
}

.mapping-source {
  display: flex;
  align-items: center;
  min-width: 0;
  gap: 10px;
}

.mapping-source__index {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  flex: 0 0 30px;
  border-radius: 9px;
  background: rgba(100, 116, 139, 0.1);
  color: var(--el-text-color-secondary);
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.04em;
}

.mapping-source > div {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.mapping-source small {
  color: var(--el-text-color-secondary);
  font-size: 10px;
}

.mapping-source strong {
  display: -webkit-box;
  overflow: hidden;
  color: var(--app-text-title);
  font-size: 13px;
  line-height: 1.35;
  overflow-wrap: anywhere;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.mapping-connector {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--el-color-primary);
  font-size: 19px;
  opacity: 0.62;
}

.mapping-control {
  display: flex;
  align-items: center;
  width: 100%;
  gap: 8px;
}

.mapping-control.is-skipped {
  align-items: flex-start;
}

  .mapping-select {
    display: flex;
    align-items: center;
    min-width: 0;
    min-height: 42px;
    flex: 1;
    gap: 8px;
    padding: 0 12px;
    border: 1px solid var(--el-border-color);
    border-radius: 10px;
    outline: none;
    background: var(--el-fill-color-blank);
    color: var(--el-text-color-regular);
    cursor: pointer;
    text-align: left;
    transition: border-color 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;

    &:hover,
    &:focus-visible {
      border-color: var(--el-color-primary);
      box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.09);
    }

    &.is-selected {
      border-color: rgba(16, 185, 129, 0.35);
      background: var(--import-selected-bg);
    }

    &.is-disabled,
    &:disabled {
      border-color: rgba(148, 163, 184, 0.3);
      background: var(--import-disabled-bg);
      color: var(--el-text-color-secondary);
      cursor: not-allowed;
      opacity: 1;
    }
  }

  .mapping-placeholder,
  .mapping-selected {
    display: flex;
    align-items: center;
    min-width: 0;
    flex: 1;
    gap: 8px;
  }

  .mapping-placeholder {
    color: var(--el-text-color-placeholder);
    font-size: 13px;
  }

  .mapping-placeholder--skipped {
    color: var(--import-warning-strong);
    font-size: 12px;
    font-weight: 600;
  }

  .mapping-skip-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    flex: 0 0 20px;
    border-radius: 50%;
    background: rgba(245, 158, 11, 0.14);
    color: var(--import-warning-color);
    font-size: 15px;
    font-weight: 700;
  }

  .mapping-selected__icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    flex: 0 0 20px;
    border-radius: 50%;
    background: rgba(16, 185, 129, 0.13);
    color: var(--import-success-color);
    font-size: 12px;
    font-weight: 800;
  }

  .mapping-selected__text {
    overflow: hidden;
    color: var(--import-success-text);
    font-size: 13px;
    font-weight: 600;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .mapping-select__arrow {
    flex: 0 0 auto;
    color: var(--el-text-color-placeholder);
  }

  .mapping-clear {
    flex: 0 0 auto;
    margin-left: 0;
    padding: 0 2px;
  }

  .mapping-skip {
    flex: 0 0 auto;
    margin-left: 0;
    padding: 0 2px;
    font-size: 12px;
  }

  .mapping-skip-note {
    display: flex;
    align-items: center;
    gap: 7px;
    margin-top: 7px;
    color: var(--el-text-color-secondary);
    font-size: 11px;

    > span {
      flex: 0 0 auto;
    }

    :deep(.el-input) {
      min-width: 0;
      flex: 1;
    }
  }

  .organization-picker-dialog {
    :deep(.el-dialog__body) {
      max-height: calc(100vh - 290px);
      overflow-y: auto;
    }
  }

  .picker-context {
    display: flex;
    align-items: baseline;
    gap: 9px;
    margin-bottom: 15px;
    padding: 13px 15px;
    border: 1px solid rgba(14, 165, 233, 0.14);
    border-radius: 11px;
    background: var(--import-picker-bg);
  }

  .picker-context__label {
    color: var(--el-text-color-secondary);
    font-size: 12px;
  }

  .picker-context strong {
    max-width: 70%;
    overflow: hidden;
    color: var(--app-text-title);
    font-size: 14px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .picker-search {
    display: flex;
    align-items: center;
    gap: 10px;

    .el-input {
      min-width: 0;
      flex: 1;
    }

    :deep(.el-input__wrapper) {
      min-height: 38px;
      border-radius: 10px;
    }

    .el-button {
      min-height: 38px;
      flex: 0 0 auto;
      border-radius: 10px;
    }
  }

  .picker-tip {
    display: flex;
    align-items: center;
    gap: 6px;
    margin: 11px 2px 13px;
    color: var(--el-text-color-secondary);
    font-size: 11px;
  }

  .organization-tree-panel {
    min-height: 322px;
    max-height: 370px;
    overflow: auto;
    padding: 5px;
    border: 1px solid var(--app-surface-border, var(--el-border-color-light));
    border-radius: 12px;
    background: var(--import-tree-bg);
  }

  .organization-tree-panel__heading {
    position: sticky;
    z-index: 1;
    top: 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin: -5px -5px 5px;
    padding: 11px 12px 9px;
    border-bottom: 1px solid rgba(148, 163, 184, 0.14);
    background: var(--import-tree-heading-bg);
    backdrop-filter: blur(8px);
  }

  .organization-tree-panel__heading div {
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 3px;
  }

  .organization-tree-panel__heading strong {
    color: var(--app-text-title);
    font-size: 12px;
  }

  .organization-tree-panel__heading span {
    color: var(--el-text-color-secondary);
    font-size: 11px;
  }

  .organization-tree {
    min-height: 270px;
    padding: 2px 4px 8px;
    background: transparent;
  }

  .organization-tree :deep(.el-tree-node__content) {
    height: 40px;
    border: 1px solid transparent;
    border-radius: 9px;
    transition: background-color 0.2s ease, border-color 0.2s ease;
  }

  .organization-tree :deep(.el-tree-node__content:hover) {
    background: rgba(14, 165, 233, 0.06);
  }

  .organization-tree :deep(.is-current > .el-tree-node__content) {
    border-color: rgba(14, 165, 233, 0.2);
    background: var(--import-tree-current-bg);
  }

  .organization-tree :deep(.el-tree-node__expand-icon) {
    color: var(--el-text-color-placeholder);
  }

  .organization-tree-node {
    display: flex;
    align-items: center;
    min-width: 0;
    width: 100%;
    gap: 8px;
    padding-right: 8px;
  }

  .organization-tree-node__icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 25px;
    height: 25px;
    flex: 0 0 25px;
    border-radius: 8px;
    background: rgba(14, 165, 233, 0.09);
    color: var(--el-color-primary);
    font-size: 14px;
  }

  .organization-tree-node__name {
    min-width: 0;
    flex: 1;
    overflow: hidden;
    color: var(--el-text-color-regular);
    font-size: 12px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .organization-tree-node__check {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    flex: 0 0 20px;
    border-radius: 50%;
    background: var(--import-success-color);
    color: #fff;
    font-size: 11px;
    font-weight: 800;
  }

@media (max-width: 720px) {
  .mapping-overview {
    align-items: flex-start;
    flex-direction: column;
  }

  .mapping-row {
    grid-template-columns: 1fr;
    gap: 6px;
  }

  .mapping-connector {
    justify-content: flex-start;
    height: 16px;
    padding-left: 14px;
    font-size: 16px;
    transform: rotate(90deg);
    transform-origin: left center;
  }
}

.import-business-page {
  .people-picker {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
  }

  .template-option {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .template-option small {
    color: var(--el-text-color-secondary);
  }

  @media (max-width: 1100px) {
    .filter-panel :deep(.el-form-item) {
      margin-bottom: 10px;
    }

    .toolbar {
      align-items: flex-start;
      flex-direction: column;
    }

    .toolbar > div:last-child {
      width: 100%;
      flex-wrap: wrap;
    }
  }

  @media (max-width: 900px) {
    .intro-content,
    .workspace-heading {
      align-items: flex-start;
      flex-direction: column;
    }

    .intro-aside,
    .workspace-badge {
      width: 100%;
      box-sizing: border-box;
    }

    .overview-grid {
      grid-template-columns: 1fr;
    }

    .filter-heading {
      align-items: flex-start;
      flex-direction: column;
      gap: 4px;
    }
  }
}

.import-business-page.is-embedded {
  padding: 0 !important;
}

.import-business-page.is-embedded .main-card {
  margin-top: 0 !important;
}

:deep(.submit-dialog.el-dialog) {
  max-width: calc(100vw - 32px);
  margin-top: 5vh;
  overflow: hidden;
  border-radius: 16px;
}

:deep(.submit-dialog .el-dialog__header) {
  margin-right: 0;
  padding: 18px 22px 14px;
  border-bottom: 1px solid var(--app-surface-border, var(--el-border-color-light));
}

:deep(.submit-dialog .el-dialog__title) {
  color: var(--app-text-title, var(--el-text-color-primary));
  font-size: 16px;
  font-weight: 700;
}

:deep(.submit-dialog .el-dialog__body) {
  max-height: min(70vh, 680px);
  padding: 14px 20px 10px;
  overflow-y: auto;
  scrollbar-color: var(--el-border-color) transparent;
  scrollbar-width: thin;
}

:deep(.submit-dialog .el-dialog__footer) {
  padding: 12px 20px 16px;
  border-top: 1px solid var(--app-surface-border, var(--el-border-color-light));
}

.submit-dialog-content {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 10px;
}

.submit-intro,
.submit-rule-note {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 34px;
  padding: 8px 11px;
  border-radius: 9px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 1.5;
}

.submit-intro {
  background: var(--el-fill-color-lighter);

  .el-icon {
    flex: 0 0 auto;
    color: var(--el-color-primary);
  }
}

.submit-status-alert {
  margin: 0;
  border-radius: 9px;

  :deep(.el-alert__content) {
    min-width: 0;
  }

  :deep(.el-alert__title) {
    line-height: 1.5;
  }
}

.submit-status-alert--success {
  --el-alert-bg-color: var(--el-color-success-light-9);
}

.submit-status-alert__title {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 6px;

  strong {
    color: var(--el-color-danger);
  }

  span {
    color: var(--el-color-danger-light-3);
    font-size: 12px;
    font-weight: 400;
  }
}

.approval-missing-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 7px;
}

.approval-missing-chip {
  max-width: 100%;
  padding: 3px 8px;
  overflow: hidden;
  border: 1px solid var(--el-color-danger-light-5);
  border-radius: 999px;
  background: var(--el-color-danger-light-9);
  color: var(--el-color-danger);
  font-size: 11px;
  line-height: 1.4;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.submit-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 11px 13px;
  border: 1px solid var(--app-surface-border, var(--el-border-color-light));
  border-radius: 10px;
  background: var(--el-bg-color);
}

.submit-summary__main,
.submit-summary__stats {
  display: flex;
  align-items: center;
  min-width: 0;
}

.submit-summary__main {
  gap: 8px;

  strong {
    flex: 0 0 auto;
    color: var(--app-text-title, var(--el-text-color-primary));
    font-size: 13px;
  }
}

.submit-summary__label {
  flex: 0 0 auto;
  color: var(--el-text-color-secondary);
  font-size: 11px;
}

.submit-summary__file {
  max-width: 300px;
  overflow: hidden;
  color: var(--el-text-color-secondary);
  font-size: 11px;
  text-overflow: ellipsis;
  white-space: nowrap;

  &::before {
    display: inline-block;
    width: 1px;
    height: 12px;
    margin-right: 8px;
    background: var(--el-border-color-lighter);
    content: '';
    vertical-align: -2px;
  }
}

.submit-summary__stats {
  flex: 0 0 auto;
  gap: 14px;
  color: var(--el-text-color-secondary);
  font-size: 11px;

  strong {
    margin-right: 2px;
    color: var(--el-color-primary);
    font-size: 15px;
    font-weight: 700;
  }
}

.submit-preview-list {
  display: grid;
  gap: 8px;
  margin-bottom: 0 !important;
}

.submit-preview-card {
  overflow: hidden;
  border: 1px solid var(--app-surface-border, var(--el-border-color-light));
  border-radius: 11px;
  background: var(--el-bg-color);
  transition: border-color 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    border-color: var(--el-color-primary-light-5);
    box-shadow: 0 4px 14px rgb(15 23 42 / 5%);
  }

  &.is-invalid {
    border-color: var(--el-color-danger-light-7);

    .submit-preview-card__header {
      background: var(--el-color-danger-light-9);
    }
  }
}

.submit-preview-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  min-height: 50px;
  padding: 8px 13px;
  border-bottom: 1px solid var(--app-surface-border, var(--el-border-color-light));
  background: var(--el-fill-color-lighter);
}

.submit-preview-card__title,
.submit-preview-card__actions,
.submit-preview-card__dept {
  display: flex;
  align-items: center;
}

.submit-preview-card__title {
  min-width: 0;
  flex-direction: column;
  align-items: flex-start;
  gap: 3px;
}

.submit-preview-card__dept {
  min-width: 0;
  gap: 7px;

  span {
    flex: 0 0 auto;
    color: var(--el-text-color-secondary);
    font-size: 11px;
  }

  strong {
    overflow: hidden;
    color: var(--app-text-title, var(--el-text-color-primary));
    font-size: 13px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.submit-preview-card__group {
  overflow: hidden;
  max-width: 100%;
  color: var(--el-text-color-secondary);
  font-size: 11px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.submit-preview-card__actions {
  flex: 0 0 auto;
  gap: 7px;

  :deep(.el-button) {
    padding: 4px 2px;
    font-size: 12px;
  }

  :deep(.el-tag) {
    border-radius: 999px;
  }
}

.submit-preview-card__body {
  padding: 10px 13px 11px;
}

.submit-preview-meta {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 9px 18px;
}

.submit-preview-meta__item {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 2px;

  span {
    color: var(--el-text-color-secondary);
    font-size: 11px;
  }

  strong {
    overflow-wrap: anywhere;
    color: var(--el-text-color-regular);
    font-size: 12px;
    font-weight: 600;
    line-height: 1.5;
  }
}

.submit-preview-meta__item--wide {
  grid-column: span 2;
}

.submit-preview-card__missing {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 8px;
  background: var(--el-color-danger-light-9);
  color: var(--el-color-danger);
  font-size: 12px;
  line-height: 1.5;
}

.submit-preview-card__missing-icon {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--el-color-danger);
  color: #fff;
  font-size: 11px;
  font-weight: 700;
}

.submit-rule-note {
  min-height: 30px;
  padding: 5px 10px;
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);

  .el-icon {
    flex: 0 0 auto;
  }
}

.submit-form {
  padding: 12px 13px 11px;
  border: 1px solid var(--app-surface-border, var(--el-border-color-light));
  border-radius: 10px;
  background: var(--el-fill-color-lighter);

  :deep(.el-form-item) {
    margin-bottom: 10px;
  }

  :deep(.el-form-item:last-of-type) {
    margin-bottom: 0;
  }
}

.submit-confirmation {
  margin-top: 2px;
  color: var(--el-text-color-regular);
  font-size: 12px;
}

.submit-dialog__footer,
.submit-dialog__footer-actions {
  display: flex;
  align-items: center;
}

.submit-dialog__footer {
  justify-content: space-between;
  gap: 16px;
}

.submit-dialog__footer-hint {
  color: var(--el-color-danger);
  font-size: 12px;
}

.submit-dialog__footer-actions {
  flex: 0 0 auto;
  gap: 8px;
}

@media (max-width: 800px) {
  :deep(.submit-dialog.el-dialog) {
    width: calc(100vw - 24px) !important;
    margin-top: 3vh;
  }

  :deep(.submit-dialog .el-dialog__body) {
    max-height: 72vh;
    padding-right: 14px;
    padding-left: 14px;
  }

  .submit-summary,
  .submit-dialog__footer {
    align-items: flex-start;
    flex-direction: column;
  }

  .submit-summary__main {
    align-items: flex-start;
    flex-direction: column;
    gap: 4px;
  }

  .submit-summary__file {
    max-width: 100%;

    &::before {
      display: none;
    }
  }

  .submit-summary__stats,
  .submit-dialog__footer-actions {
    width: 100%;
  }

  .submit-dialog__footer-actions {
    justify-content: flex-end;
  }

  .submit-preview-card__header {
    align-items: flex-start;
    flex-direction: column;
    gap: 7px;
  }

  .submit-preview-card__actions {
    width: 100%;
    justify-content: flex-end;
  }

  .submit-preview-meta {
    grid-template-columns: 1fr;
  }

  .submit-preview-meta__item--wide {
    grid-column: auto;
  }
}
</style>

<style lang="scss">
html.dark .import-business-page {
  --import-accent-soft: rgba(56, 189, 248, 0.16);
  --import-shadow: 0 12px 30px rgba(0, 0, 0, 0.28);
  --import-shadow-hover: 0 16px 36px rgba(0, 0, 0, 0.36);
  --import-hero-bg: linear-gradient(120deg, rgba(15, 23, 42, 0.96), rgba(30, 64, 175, 0.34));
  --import-soft-surface: rgba(15, 23, 42, 0.62);
  --import-soft-surface-shadow: rgba(255, 255, 255, 0.06);
  --import-filter-bg: linear-gradient(120deg, rgba(15, 23, 42, 0.92), rgba(30, 41, 59, 0.88));
  --import-success-surface: linear-gradient(145deg, rgba(31, 138, 90, 0.16), rgba(15, 23, 42, 0.72));
  --import-success-text: #c7f2df;
  --import-row-hover-bg: rgba(56, 189, 248, 0.1);
  --import-empty-bg: linear-gradient(135deg, rgba(14, 165, 233, 0.08), rgba(15, 23, 42, 0.72));
  --import-overview-bg: rgba(148, 163, 184, 0.12);
  --import-mapping-bg: linear-gradient(120deg, rgba(14, 165, 233, 0.12), rgba(30, 41, 59, 0.84));
  --import-mapping-hover-bg: rgba(30, 41, 59, 0.92);
  --import-picker-bg: linear-gradient(120deg, rgba(14, 165, 233, 0.12), rgba(30, 41, 59, 0.84));
  --import-tree-bg: linear-gradient(180deg, rgba(30, 41, 59, 0.94), rgba(15, 23, 42, 0.98));
  --import-tree-heading-bg: rgba(30, 41, 59, 0.96);
  --import-tree-current-bg: rgba(14, 165, 233, 0.2);
  --import-selected-bg: rgba(31, 138, 90, 0.18);
  --import-disabled-bg: rgba(71, 85, 105, 0.3);
  --import-success-color: #6ee7b7;
  --import-warning-color: #fbbf24;
  --import-warning-strong: #fcd34d;
  --import-application-color: #c4b5fd;
}

/* 提交泛微审批弹窗通过 append-to-body 渲染，提示条需要单独适配暗色主题。 */
html.dark .submit-dialog .submit-rule-note {
  border: 1px solid color-mix(in srgb, var(--app-accent-strong) 34%, var(--app-surface-border));
  background: color-mix(in srgb, var(--app-accent-strong) 14%, var(--app-surface-bg));
  color: #b9d7f8;
}

html.dark .submit-dialog .submit-rule-note .el-icon {
  color: #8fc8f3;
}
</style>

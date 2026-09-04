<template>
  <div class="p-2 import-config-page" :class="{ 'is-embedded': props.embedded }">
    <el-card v-if="!props.embedded" shadow="never" class="intro-card">
      <div class="intro-content">
        <div>
          <div class="eyebrow"><span class="eyebrow-dot" /> IMPORT BUSINESS CONFIGURATION</div>
          <h2>导入业务模板</h2>
          <p>管理员选择已配置的泛微业务类型并上传 Excel 模板，系统自动生成字段、组织匹配和分组配置。</p>
        </div>
        <div class="intro-aside">
          <span class="intro-aside-label">WORKFLOW READY</span>
          <strong>业务导入中心</strong>
          <el-tag type="info" effect="plain">普通用户只需选择业务并上传文件</el-tag>
        </div>
      </div>
    </el-card>

    <el-card shadow="never" class="main-card mt-2">
      <div class="card-heading">
        <div>
          <div class="panel-kicker">TEMPLATE CATALOG</div>
          <h3>业务模板目录</h3>
          <p>每个业务使用独立模板，停用模板不会影响历史导入批次。</p>
        </div>
        <el-button v-hasPermi="['ecology:importConfig:add']" type="primary" icon="Plus" class="add-button" @click="openAdd">新增业务模板</el-button>
      </div>
      <div class="overview-grid">
        <div class="overview-item overview-item--blue">
          <span class="overview-icon">01</span>
          <div><strong>{{ configs.length }}</strong><span>业务模板</span></div>
          <small>当前已配置</small>
        </div>
        <div class="overview-item overview-item--green">
          <span class="overview-icon">02</span>
          <div><strong>{{ enabledCount }}</strong><span>启用模板</span></div>
          <small>可供业务导入</small>
        </div>
        <div class="overview-item overview-item--orange">
          <span class="overview-icon">03</span>
          <div><strong>{{ matchedCount }}</strong><span>组织匹配</span></div>
          <small>自动识别业务组织</small>
        </div>
      </div>
      <div class="table-toolbar">
        <div class="table-toolbar-title"><span class="table-toolbar-dot" />已配置业务</div>
        <span class="table-toolbar-tip">模板字段、审批方式和组织匹配均可单独维护</span>
      </div>
      <el-table v-loading="loading" :data="configs" border class="template-table">
        <el-table-column label="业务名称" min-width="250" show-overflow-tooltip>
          <template #default="scope">
            <div class="business-cell">
              <span class="business-mark">{{ businessInitial(scope.row.businessName) }}</span>
              <div><strong>{{ scope.row.businessName }}</strong><small>{{ scope.row.businessType || '未设置业务标识' }}</small></div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="模板字段" width="118" align="center">
          <template #default="scope"><span class="field-count"><strong>{{ fieldCount(scope.row) }}</strong><em>个字段</em></span></template>
        </el-table-column>
        <el-table-column label="默认审批方式" min-width="220" show-overflow-tooltip>
          <template #default="scope"><div class="workflow-cell"><span class="workflow-dot" />{{ workflowLabel(scope.row.defaultWorkflowConfigId) || '提交时选择' }}</div></template>
        </el-table-column>
        <el-table-column label="组织匹配" width="110" align="center">
          <template #default="scope"><span :class="['table-state', scope.row.deptField ? 'is-success' : 'is-muted']"><i />{{ scope.row.deptField ? '自动匹配' : '不需要' }}</span></template>
        </el-table-column>
        <el-table-column label="附件模板" width="110" align="center">
          <template #default="scope"><span :class="['table-state', attachmentState(scope.row) === '已配置' ? 'is-success' : attachmentState(scope.row) === '待配置' ? 'is-warning' : 'is-muted']"><i />{{ attachmentState(scope.row) }}</span></template>
        </el-table-column>
        <el-table-column label="状态" width="90" align="center">
          <template #default="scope"><span :class="['table-state', scope.row.status === 'ENABLED' ? 'is-success' : 'is-muted']"><i />{{ scope.row.status === 'ENABLED' ? '启用' : '停用' }}</span></template>
        </el-table-column>
        <el-table-column label="备注" min-width="220" show-overflow-tooltip><template #default="scope"><span class="remark-cell">{{ scope.row.remark || '暂无备注' }}</span></template></el-table-column>
        <el-table-column label="操作" fixed="right" width="150" align="center">
          <template #default="scope">
            <div class="table-actions">
              <el-button v-hasPermi="['ecology:importConfig:edit']" link type="primary" @click="openEdit(scope.row)">编辑</el-button>
              <el-button v-hasPermi="['ecology:importConfig:remove']" link type="danger" @click="removeConfig(scope.row)">删除</el-button>
            </div>
          </template>
        </el-table-column>
        <template #empty>
          <div class="table-empty">
            <div class="empty-mark"><span /></div>
            <strong>暂无业务模板</strong>
            <p>创建业务模板后，即可按不同 Excel 结构执行导入。</p>
            <el-button v-hasPermi="['ecology:importConfig:add']" type="primary" plain icon="Plus" @click="openAdd">创建第一个模板</el-button>
          </div>
        </template>
      </el-table>
    </el-card>

    <el-dialog v-model="dialog.visible" width="1120px" top="4vh" append-to-body destroy-on-close class="config-dialog">
      <template #header>
        <div class="dialog-title">
          <span class="dialog-title-mark">01</span>
          <div>
            <strong>{{ dialog.title }}</strong>
            <span>配置业务模板、导入字段与审批附件规则</span>
          </div>
        </div>
      </template>
      <div class="dialog-summary">
        <div class="dialog-summary-mark">T</div>
        <div>
          <strong>一套模板，统一完成导入与审批配置</strong>
          <p>先选择业务类型并解析 Excel，再根据业务需要设置组织匹配、审批方式和附件模板。</p>
        </div>
        <span class="dialog-summary-badge">TEMPLATE SETUP</span>
      </div>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="112px" class="config-form">
        <section class="config-section">
          <div class="config-section-heading">
            <span class="section-index">01</span>
            <div><strong>基础信息</strong><span>选择业务类型，确认模板的使用状态</span></div>
          </div>
          <el-row :gutter="22">
            <el-col :span="12"><el-form-item label="泛微业务类型" prop="businessType"><el-select v-model="form.businessType" filterable placeholder="选择已配置的泛微业务类型" no-data-text="暂无已配置的泛微业务类型，请先维护业务类型" style="width: 100%" @change="handleBusinessTypeChange"><el-option v-for="item in businessTypes" :key="item.id" :label="businessTypeLabel(item)" :value="item.businessType" :disabled="item.status !== 'ENABLED' && item.businessType !== form.businessType" /></el-select><span class="field-tip">业务类型统一在“泛微审批中心 / 业务类型配置”维护。</span></el-form-item></el-col>
            <el-col :span="12"><el-form-item label="业务名称" prop="businessName"><el-input v-model="form.businessName" disabled placeholder="选择泛微业务类型后自动带出" /></el-form-item></el-col>
            <el-col :span="12"><el-form-item label="模板状态"><el-radio-group v-model="form.status"><el-radio label="ENABLED">启用</el-radio><el-radio label="DISABLED">停用</el-radio></el-radio-group></el-form-item></el-col>
          </el-row>
        </section>

        <section class="config-section">
          <div class="config-section-heading">
            <span class="section-index">02</span>
            <div><strong>导入模板</strong><span>上传 Excel 后自动读取工作表、表头和示例值</span></div>
          </div>
          <el-form-item label="Excel 模板" required>
            <div class="template-upload">
              <el-upload :limit="1" accept=".xlsx,.xls" :auto-upload="false" :show-file-list="true" :disabled="templateParsing" :on-change="handleTemplateChange" :on-remove="handleTemplateRemove">
                <el-button type="primary" plain icon="Upload">选择 Excel 模板</el-button>
              </el-upload>
              <el-button type="primary" :loading="templateParsing" :disabled="!templateFile" @click="parseTemplate">解析模板</el-button>
            </div>
            <span class="field-tip">上传空模板或样例文件即可，系统会自动读取工作表、表头、字段类型和示例值。</span>
          </el-form-item>
        </section>

        <section v-if="templateFields.length" class="config-section">
          <div class="config-section-heading">
            <span class="section-index">03</span>
            <div><strong>字段与组织</strong><span>确认字段用途，并设置组织匹配和明细分组规则</span></div>
          </div>
          <el-alert :title="`已解析：${form.sheetName || '第一个工作表'}，${templateFields.length} 个字段；以下配置由系统自动生成，可按业务需要确认。`" type="success" :closable="false" class="section-alert" />
          <el-table :data="templateFields" border max-height="260px" class="field-table">
            <el-table-column label="Excel 列名" prop="header" min-width="220" />
            <el-table-column label="系统识别用途" prop="role" width="150" />
            <el-table-column label="示例值" prop="sample" min-width="220" show-overflow-tooltip />
            <el-table-column label="必填" width="90" align="center"><template #default="scope"><el-switch v-model="scope.row.required" @change="syncFieldDefinitions" /></template></el-table-column>
          </el-table>
          <el-row :gutter="22" class="field-rule-row">
            <el-col :span="12">
              <el-form-item label="业务组织字段"><el-select v-model="form.deptField" clearable filterable style="width: 100%" placeholder="不按组织匹配"><el-option v-for="field in templateFields" :key="field.code" :label="field.header" :value="field.code" /></el-select></el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="分组字段"><el-select v-model="groupFields" multiple filterable collapse-tags style="width: 100%" placeholder="不分组" @change="syncGroupFields"><el-option v-for="field in templateFields" :key="field.code" :label="field.header" :value="field.code" /></el-select></el-form-item>
            </el-col>
          </el-row>
        </section>

        <section class="config-section">
          <div class="config-section-heading">
            <span class="section-index">04</span>
            <div><strong>审批与附件</strong><span>设置提交泛微时使用的默认流程与附件生成规则</span></div>
          </div>
          <el-row :gutter="22">
            <el-col :span="12"><el-form-item label="默认审批方式"><el-select v-model="form.defaultWorkflowConfigId" clearable filterable :disabled="!form.businessType" style="width: 100%" placeholder="先选择业务类型" @change="loadPlans"><el-option v-for="item in workflowConfigs" :key="item.id" :label="`${item.formName || '泛微表单'} · ${item.approvalName || item.workflowName}`" :value="item.id" /></el-select><span class="field-tip">仅显示该业务在业务配置中已启用的表单审批方式。</span></el-form-item></el-col>
            <el-col :span="12"><el-form-item label="默认审批方式"><el-select v-model="form.defaultApprovalMode" style="width: 100%"><el-option label="自动匹配审批方案" value="AUTO_RULE" /><el-option label="指定默认审批方案" value="PLAN" /><el-option label="每次临时指定人员" value="MANUAL" /></el-select></el-form-item></el-col>
            <el-col v-if="form.defaultApprovalMode === 'PLAN'" :span="12"><el-form-item label="默认审批方案"><el-select v-model="form.defaultApprovalPlanId" clearable filterable style="width: 100%" placeholder="选择审批方案"><el-option v-for="item in approvalPlans" :key="item.id" :label="item.planName" :value="item.id" /></el-select></el-form-item></el-col>
            <el-col :span="12"><el-form-item label="附件生成"><div class="switch-field"><el-switch v-model="attachmentEnabled" /><span>自动生成 Excel 明细附件</span></div></el-form-item></el-col>
          </el-row>
          <div v-if="attachmentEnabled" class="attachment-config-panel">
            <div class="attachment-config-heading">
              <div>
                <strong>附件模板配置</strong>
                <span>提交时按分组填充模板，保留原有样式、公式和固定尾部内容。</span>
              </div>
              <el-tag v-if="attachmentConfig.templateOssId" type="success" effect="plain">模板已配置</el-tag>
              <el-tag v-else type="warning" effect="plain">尚未上传模板</el-tag>
            </div>
            <el-form-item label="附件模板" required class="attachment-template-item">
              <div class="attachment-template-card">
                <div class="attachment-template-copy">
                  <div class="attachment-template-icon">XLSX</div>
                  <div>
                    <strong>上传最终附件模板</strong>
                    <span>请上传提交给泛微的 Excel 模板，不是业务导入文件。</span>
                    <small v-if="attachmentConfig.templateFileName">当前模板：{{ attachmentConfig.templateFileName }}</small>
                  </div>
                </div>
                <div class="attachment-upload">
                  <el-upload class="attachment-file-picker" :limit="1" accept=".xlsx,.xls" :auto-upload="false" :show-file-list="true" :disabled="attachmentTemplateUploading" :on-change="handleAttachmentTemplateChange" :on-remove="handleAttachmentTemplateRemove">
                    <el-button type="primary" plain icon="Upload">选择文件</el-button>
                  </el-upload>
                  <el-button type="primary" :loading="attachmentTemplateUploading" :disabled="!attachmentTemplateFile" @click="uploadAttachmentTemplate">上传并解析</el-button>
                  <el-button v-if="attachmentConfig.templateOssId" type="danger" plain @click="clearAttachmentTemplate">清除配置</el-button>
                </div>
              </div>
            </el-form-item>
            <div class="attachment-rule-group">
              <div class="attachment-rule-group-title"><strong>模板结构</strong><span>确认 Excel 中各行的位置，行号从 0 开始。</span></div>
              <div class="attachment-structure-grid">
                <div class="attachment-rule-item"><span class="attachment-rule-label">工作表</span><el-input v-model="attachmentConfig.sheetName" disabled /><small>按上传文件的第一个工作表解析和生成。</small></div>
                <div class="attachment-rule-item"><span class="attachment-rule-label">标题行</span><el-input-number v-model="attachmentConfig.titleRow" :min="0" controls-position="right" /></div>
                <div class="attachment-rule-item"><span class="attachment-rule-label">表头行</span><el-input-number v-model="attachmentConfig.headerRow" :min="0" controls-position="right" /></div>
                <div class="attachment-rule-item"><span class="attachment-rule-label">明细起始行</span><el-input-number v-model="attachmentConfig.dataStartRow" :min="0" controls-position="right" /></div>
              </div>
            </div>
            <div class="attachment-rule-group">
              <div class="attachment-rule-group-title"><strong>生成规则</strong><span>可选配置，留空时保留模板原有内容。</span></div>
              <div class="attachment-output-grid">
                <div class="attachment-rule-item"><span class="attachment-rule-label">合计行</span><el-input-number v-model="attachmentConfig.totalRow" :min="0" controls-position="right" placeholder="无合计行" /></div>
                <div class="attachment-rule-item"><span class="attachment-rule-label">标题模板</span><el-input v-model="attachmentConfig.titleTemplate" placeholder="如：{businessName}-{groupName}" /></div>
                <div class="attachment-rule-item"><span class="attachment-rule-label">文件名模板</span><el-input v-model="attachmentConfig.fileNameTemplate" placeholder="如：{businessType}-{batchNo}-{groupName}" /></div>
              </div>
            </div>
            <div v-if="attachmentConfig.templateOssId" class="attachment-fixed-area">
              <div class="attachment-columns-title">
                <div><strong>固定区域配置</strong><span>只扫描合计行之后的非空文本，候选项需确认后才会覆盖模板内容。</span></div>
                <el-tag type="success" effect="plain">已配置 {{ attachmentConfig.fixedMappings.length }} 个单元格</el-tag>
              </div>
              <el-alert title="请选择单元格并手动添加其中的多个标签；未配置的单元格会继续保留模板原内容。" type="info" :closable="false" class="fixed-area-alert" />
              <div v-if="attachmentTemplateCandidates.length" class="fixed-candidate-list">
                <div class="fixed-area-subtitle"><strong>待配置单元格</strong><span>发现 {{ attachmentTemplateCandidates.length }} 个固定内容候选，可在同一单元格内配置多个标签</span></div>
                <el-table :data="attachmentTemplateCandidates" border size="small">
                  <el-table-column label="位置" width="100" align="center"><template #default="scope"><code>{{ scope.row.cell }}</code></template></el-table-column>
                  <el-table-column label="单元格原内容" min-width="280" show-overflow-tooltip><template #default="scope">{{ scope.row.originalContent }}</template></el-table-column>
                  <el-table-column label="已配置标签" min-width="220" show-overflow-tooltip>
                    <template #default="scope">
                      <span v-if="fixedMappingForCandidate(scope.row)" class="fixed-label-summary">{{ fixedMappingSummary(fixedMappingForCandidate(scope.row)) }}</span>
                      <span v-else class="fixed-label-empty">尚未配置</span>
                    </template>
                  </el-table-column>
                  <el-table-column label="操作" width="140" align="center"><template #default="scope"><el-button link type="primary" @click="openFixedSegmentDialog(scope.row)">{{ hasFixedMapping(scope.row) ? '编辑标签配置' : '配置多标签' }}</el-button></template></el-table-column>
                </el-table>
              </div>
              <div v-else class="attachment-columns-empty">暂未识别到固定区域候选；如模板存在固定内容，请确认合计行位置后重新上传解析。</div>
              <div v-if="attachmentConfig.fixedMappings.length" class="fixed-mapping-list">
                <div class="fixed-area-subtitle"><strong>已确认单元格</strong><span>每个单元格可包含多个标签，生成时只替换对应标签后的内容。</span></div>
                <el-table :data="attachmentConfig.fixedMappings" border size="small">
                  <el-table-column label="位置" width="88" align="center"><template #default="scope"><code>{{ scope.row.cell || `${scope.row.column + 1}:${scope.row.row + 1}` }}</code></template></el-table-column>
                  <el-table-column label="单元格原内容" min-width="250" show-overflow-tooltip><template #default="scope">{{ scope.row.originalContent || '—' }}</template></el-table-column>
                  <el-table-column label="标签数量" width="100" align="center"><template #default="scope"><el-tag type="info" effect="plain">{{ scope.row.segments?.length || 0 }} 个</el-tag></template></el-table-column>
                  <el-table-column label="生成预览" min-width="360" show-overflow-tooltip><template #default="scope"><span class="fixed-preview-text">{{ fixedCellMappingPreview(scope.row) }}</span></template></el-table-column>
                  <el-table-column label="操作" width="160" align="center"><template #default="scope"><el-button link type="primary" @click="openFixedSegmentDialog(scope.row)">编辑</el-button><el-button link type="danger" @click="removeFixedMapping(scope.$index)">移除</el-button></template></el-table-column>
                </el-table>
              </div>
            </div>
            <div v-if="attachmentConfig.headers.length" class="attachment-columns">
              <div class="attachment-columns-title"><div><strong>附件列映射</strong><span>选择“不填充”可保留该列的模板公式。</span></div><el-tag type="info" effect="plain">{{ attachmentConfig.headers.length }} 列</el-tag></div>
              <el-table :data="attachmentConfig.headers" border size="small">
                <el-table-column label="附件列标题" min-width="260" show-overflow-tooltip>
                  <template #default="scope">{{ scope.row.label || `第${(scope.row.columnIndex ?? scope.$index) + 1}列（保留模板内容）` }}</template>
                </el-table-column>
                <el-table-column label="填充来源" min-width="320">
                  <template #default="scope">
                    <el-select v-model="scope.row.field" clearable filterable style="width: 100%" placeholder="不填充，保留模板内容/公式">
                      <el-option label="不填充（保留模板公式）" value="" />
                      <el-option v-for="field in templateFields" :key="field.code" :label="`${field.header}（${field.code}）`" :value="field.code" />
                    </el-select>
                  </template>
                </el-table-column>
              </el-table>
            </div>
            <div v-else class="attachment-columns-empty">上传并解析模板后，这里会显示附件列映射。</div>
          </div>
        </section>

        <div class="config-form-note"><span class="note-mark">i</span>申请标题、申请说明和内部字段映射由系统根据模板自动生成；审批人员由业务组织对应的审批方案自动匹配。</div>
        <el-form-item label="备注" class="remark-item"><el-input v-model="form.remark" type="textarea" :rows="2" maxlength="1000" placeholder="补充该业务模板的使用说明（可选）" /></el-form-item>
      </el-form>
      <template #footer><div class="dialog-footer-actions"><span>保存后即可在“通用业务导入”中使用</span><div><el-button @click="dialog.visible = false">取消</el-button><el-button type="primary" :loading="saving" @click="save">保存并发布</el-button></div></div></template>
    </el-dialog>
    <el-dialog v-model="fixedSegmentDialog.visible" width="920px" append-to-body destroy-on-close class="fixed-segment-dialog">
      <template #header>
        <div class="fixed-segment-dialog-title"><span class="fixed-segment-dialog-icon">A</span><div><strong>配置单元格多标签</strong><small>在同一个 Excel 单元格中分别配置多个标签的生成内容</small></div></div>
      </template>
      <div v-if="segmentDraft" class="fixed-segment-editor">
        <div class="fixed-segment-context"><div><span>目标单元格</span><code>{{ segmentDraft.cell }}</code></div><div class="fixed-segment-context-content"><span>模板原内容</span><strong>{{ segmentDraft.originalContent }}</strong></div></div>
        <el-alert title="请手动添加该单元格内需要处理的标签。系统按标签在原文中的位置替换值，并保留未配置的其他内容。" type="info" :closable="false" />
        <div class="fixed-segment-toolbar"><div><strong>标签配置</strong><span>例如：制单：、物流系统科：、结算单位负责人：</span></div><el-button type="primary" plain icon="Plus" @click="addFixedSegment">新增标签</el-button></div>
        <el-table :data="segmentDraft.segments" border class="fixed-segment-table">
          <el-table-column label="标签" min-width="220">
            <template #default="scope"><el-input v-model="scope.row.label" placeholder="输入完整标签，如：制单：" /></template>
          </el-table-column>
          <el-table-column label="填充方式" width="220">
            <template #default="scope"><el-select v-model="scope.row.mode" style="width: 100%" @change="handleFixedSegmentModeChange(scope.row)"><el-option v-for="item in fixedModeOptions" :key="item.value" :label="item.label" :value="item.value" /></el-select></template>
          </el-table-column>
          <el-table-column label="生成内容" min-width="300">
            <template #default="scope">
              <el-select v-if="scope.row.mode === 'FIELD'" v-model="scope.row.field" filterable clearable style="width: 100%" placeholder="选择导入字段"><el-option v-for="field in templateFields" :key="field.code" :label="`${field.header}（${field.code}）`" :value="field.code" /></el-select>
              <el-input v-else-if="scope.row.mode === 'CUSTOM'" v-model="scope.row.template" placeholder="输入标签后的生成内容" />
              <span v-else class="fixed-segment-generated-value">{{ fixedSegmentModeHint(scope.row) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="80" align="center"><template #default="scope"><el-button link type="danger" @click="removeFixedSegment(scope.$index)">删除</el-button></template></el-table-column>
        </el-table>
        <div v-if="segmentDraft.segments.length === 0" class="fixed-segment-empty">暂未添加标签，请点击“新增标签”。</div>
        <div class="fixed-segment-preview"><div><strong>生成预览</strong><span>仅替换已配置标签后的值</span></div><p>{{ fixedCellMappingPreview(segmentDraft) }}</p></div>
      </div>
      <template #footer><div class="fixed-segment-dialog-footer"><el-button @click="fixedSegmentDialog.visible = false">取消</el-button><el-button type="primary" @click="saveFixedSegmentMapping">保存标签配置</el-button></div></template>
    </el-dialog>
  </div>
</template>

<script setup name="EcologyImportConfig" lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import modal from '@/plugins/modal';
import { delOaImportBusinessConfig, getOaImportBusinessConfig, listOaBusinessTypes, listOaImportBusinessConfigs, listOaDepartmentApprovals, listOaWorkflowConfigs, parseOaImportTemplate, saveOaImportBusinessConfig, uploadOaImportAttachmentTemplate } from '@/api/ecology';
import type { OaImportAttachmentFixedCandidateVO, OaImportAttachmentTemplateVO, OaImportBusinessConfigForm, OaImportBusinessConfigVO, OaImportTemplateFieldVO, OaImportTemplatePreviewVO } from '@/api/ecology/importBusinessTypes';
import type { OaBusinessTypeVO, OaWorkflowConfigVO } from '@/api/ecology/types';

const props = withDefaults(defineProps<{ embedded?: boolean; businessType?: string }>(), { embedded: false });
const route = useRoute();

interface ConfigForm extends OaImportBusinessConfigForm {
  businessType: string;
  businessName: string;
  headerRow: number;
  fieldDefinitionsJson: string;
  parameterDefinitionsJson: string;
  groupByJson: string;
  deptField: string;
  companyField: string;
  aggregationJson: string;
  formMappingJson: string;
  attachmentConfigJson: string;
  requestNameTemplate: string;
  contentTemplate: string;
  defaultApprovalPlanId?: string | number;
  defaultApprovalMode: string;
  status: string;
  remark: string;
}

interface AttachmentColumnForm {
  columnIndex?: number;
  label: string;
  field: string;
}

type FixedMappingMode = 'KEEP' | 'CLEAR' | 'CURRENT_USER' | 'CURRENT_DEPT' | 'SETTLEMENT_DEPT' | 'SETTLEMENT_OWNER' | 'CUSTOM' | 'FIELD';

interface AttachmentFixedSegmentForm {
  label: string;
  mode: FixedMappingMode;
  template: string;
  field?: string;
}

interface AttachmentFixedMappingForm {
  cell: string;
  row: number;
  column: number;
  originalContent: string;
  segments: AttachmentFixedSegmentForm[];
  /** 兼容旧版单标签配置，打开编辑时会转换为 segments。 */
  label?: string;
  mode?: FixedMappingMode;
  template?: string;
  field?: string;
}

interface AttachmentConfigForm {
  mode: string;
  templateOssId?: string | number;
  templateFileName?: string;
  sheetName: string;
  titleTemplate: string;
  fileNameTemplate: string;
  totalLabel: string;
  titleRow: number;
  headerRow: number;
  dataStartRow: number;
  totalRow?: number;
  headers: AttachmentColumnForm[];
  fixedCandidates: OaImportAttachmentFixedCandidateVO[];
  fixedMappings: AttachmentFixedMappingForm[];
}

const newForm = (): ConfigForm => ({ businessType: '', businessName: '', sheetName: '', headerRow: 0, fieldDefinitionsJson: '', parameterDefinitionsJson: '', groupByJson: '', deptField: '', companyField: '', aggregationJson: '', formMappingJson: '', attachmentConfigJson: '', requestNameTemplate: '', contentTemplate: '', defaultWorkflowConfigId: undefined, defaultApprovalPlanId: undefined, defaultApprovalMode: 'AUTO_RULE', status: 'ENABLED', remark: '' });
const newAttachmentConfig = (): AttachmentConfigForm => ({ mode: 'GENERATED_TABLE', sheetName: '数据明细', titleTemplate: '', fileNameTemplate: '', totalLabel: '', titleRow: 0, headerRow: 1, dataStartRow: 2, totalRow: undefined, headers: [], fixedCandidates: [], fixedMappings: [] });
const loading = ref(false);
const saving = ref(false);
const templateParsing = ref(false);
const configs = ref<OaImportBusinessConfigVO[]>([]);
const businessTypes = ref<OaBusinessTypeVO[]>([]);
const workflowConfigs = ref<OaWorkflowConfigVO[]>([]);
const approvalPlans = ref<any[]>([]);
const templateFields = ref<OaImportTemplateFieldVO[]>([]);
const groupFields = ref<string[]>([]);
const templateFile = ref<File>();
const templateParsed = ref(false);
const attachmentEnabled = ref(false);
const attachmentTemplateFile = ref<File>();
const attachmentTemplateUploading = ref(false);
const attachmentTemplatePreview = ref<OaImportAttachmentTemplateVO>();
const attachmentTemplateCandidates = ref<OaImportAttachmentFixedCandidateVO[]>([]);
const formRef = ref<ElFormInstance>();
const dialog = reactive({ visible: false, title: '' });
const fixedSegmentDialog = reactive({ visible: false });
const segmentDraft = ref<AttachmentFixedMappingForm>();
const form = reactive<ConfigForm>(newForm());
const attachmentConfig = reactive<AttachmentConfigForm>(newAttachmentConfig());
const rules: ElFormRules = { businessType: [{ required: true, message: '请选择泛微业务类型', trigger: 'change' }], businessName: [{ required: true, message: '业务类型名称不能为空', trigger: 'change' }] };

const parseJson = <T,>(value: string | undefined, fallback: T): T => { if (!value) return fallback; try { return JSON.parse(value) as T; } catch { return fallback; } };
const fieldCount = (row: unknown) => parseJson<OaImportTemplateFieldVO[]>((row as OaImportBusinessConfigVO).fieldDefinitionsJson, []).length;
const businessInitial = (name?: string) => (name || 'B').trim().slice(0, 1).toUpperCase();
const enabledCount = computed(() => configs.value.filter((item) => item.status === 'ENABLED').length);
const matchedCount = computed(() => configs.value.filter((item) => Boolean(item.deptField)).length);
const attachmentState = (row: unknown) => {
  const item = row as OaImportBusinessConfigVO;
  const config = parseJson<Partial<AttachmentConfigForm>>(item.attachmentConfigJson, {});
  if (!item.attachmentConfigJson) return '不生成';
  return config.templateOssId ? '已配置' : '待配置';
};
const loadList = async () => { loading.value = true; try { const businessType = props.businessType || (typeof route.query.businessType === 'string' ? route.query.businessType : undefined); const res = await listOaImportBusinessConfigs(businessType, false); configs.value = res.data || []; } finally { loading.value = false; } };
const loadBusinessTypes = async () => { const res = await listOaBusinessTypes(undefined, false); businessTypes.value = res.data || []; };
const loadWorkflows = async (businessType = form.businessType) => { const res = await listOaWorkflowConfigs(businessType || undefined, true); workflowConfigs.value = res.data || []; };
const loadPlans = async () => { approvalPlans.value = form.defaultWorkflowConfigId ? ((await listOaDepartmentApprovals({ workflowConfigId: form.defaultWorkflowConfigId, businessType: form.businessType, enabledOnly: true })).data || []) : []; if (form.defaultApprovalPlanId && !approvalPlans.value.some((item) => String(item.id) === String(form.defaultApprovalPlanId))) form.defaultApprovalPlanId = undefined; };
const businessTypeLabel = (item: OaBusinessTypeVO) => `${item.businessName}（${item.businessType}）`;
const handleBusinessTypeChange = async () => { const selected = businessTypes.value.find((item) => item.businessType === form.businessType); if (selected) form.businessName = selected.businessName; form.defaultWorkflowConfigId = undefined; form.defaultApprovalPlanId = undefined; await loadWorkflows(form.businessType); await loadPlans(); };
const workflowLabel = (id?: string | number) => workflowConfigs.value.find((item) => String(item.id) === String(id))?.workflowName;
const resetForm = () => { Object.assign(form, newForm()); Object.assign(attachmentConfig, newAttachmentConfig()); templateFields.value = []; groupFields.value = []; templateFile.value = undefined; templateParsed.value = false; attachmentEnabled.value = false; attachmentTemplateFile.value = undefined; attachmentTemplatePreview.value = undefined; attachmentTemplateCandidates.value = []; fixedSegmentDialog.visible = false; segmentDraft.value = undefined; formRef.value?.resetFields(); };
const openAdd = async () => { resetForm(); dialog.title = '新增业务模板'; dialog.visible = true; if (!workflowConfigs.value.length) await loadWorkflows(); if (!businessTypes.value.length) await loadBusinessTypes(); };
const roleForHeader = (header: string) => { const value = header.replace(/[\s\u3000_\-（）()/:：]/g, '').toLowerCase(); if (value.includes('部门') || value.includes('组织')) return '业务组织'; if (value.includes('公司')) return '公司'; return '业务字段'; };
const openEdit = async (row: any) => { resetForm(); const res = await getOaImportBusinessConfig(row.id); Object.assign(form, newForm(), res.data || row); const selected = businessTypes.value.find((item) => item.businessType === form.businessType); if (selected) form.businessName = selected.businessName; templateFields.value = parseJson<OaImportTemplateFieldVO[]>(form.fieldDefinitionsJson, []).map((field) => ({ ...field, role: field.role || roleForHeader(field.header) })); groupFields.value = parseJson<string[]>(form.groupByJson, []); templateParsed.value = templateFields.value.length > 0; const existingAttachment = parseJson<Partial<AttachmentConfigForm>>(form.attachmentConfigJson, {}); Object.assign(attachmentConfig, newAttachmentConfig(), existingAttachment); attachmentConfig.headers = (existingAttachment.headers || []).map((column, index) => ({ columnIndex: column.columnIndex ?? index, label: column.label || '', field: column.field || '' })); attachmentConfig.fixedCandidates = existingAttachment.fixedCandidates || []; attachmentTemplateCandidates.value = attachmentConfig.fixedCandidates; attachmentConfig.fixedMappings = (existingAttachment.fixedMappings || []).map(normalizeFixedMapping); attachmentEnabled.value = Boolean(form.attachmentConfigJson); dialog.title = '编辑业务模板'; dialog.visible = true; if (!businessTypes.value.length) await loadBusinessTypes(); await loadWorkflows(form.businessType); await loadPlans(); };
const handleTemplateChange = (file: any) => { templateFile.value = file?.raw; templateParsed.value = false; };
const handleTemplateRemove = () => { templateFile.value = undefined; templateParsed.value = false; };
const parseTemplate = async () => { if (!templateFile.value) return modal.msgWarning('请先选择 Excel 模板'); templateParsing.value = true; try { const data = new FormData(); data.append('file', templateFile.value); const res = await parseOaImportTemplate(data); applyTemplatePreview(res.data); modal.msgSuccess('Excel 模板解析成功'); } finally { templateParsing.value = false; } };
const applyTemplatePreview = (preview?: OaImportTemplatePreviewVO) => { if (!preview) return; form.sheetName = preview.sheetName || ''; form.headerRow = preview.headerRow ?? 0; form.fieldDefinitionsJson = preview.fieldDefinitionsJson || ''; form.deptField = preview.deptField || ''; form.companyField = preview.companyField || ''; templateFields.value = (preview.fields || []).map((field) => ({ ...field, role: field.role || roleForHeader(field.header) })); groupFields.value = parseJson<string[]>(preview.groupByJson, preview.deptField ? [preview.deptField] : []); form.groupByJson = JSON.stringify(groupFields.value); templateParsed.value = templateFields.value.length > 0; };
const handleAttachmentTemplateChange = (file: any) => { attachmentTemplateFile.value = file?.raw; };
const handleAttachmentTemplateRemove = () => { attachmentTemplateFile.value = undefined; };
const uploadAttachmentTemplate = async () => { if (!attachmentTemplateFile.value) return modal.msgWarning('请先选择附件模板'); attachmentTemplateUploading.value = true; try { const data = new FormData(); data.append('file', attachmentTemplateFile.value); const res = await uploadOaImportAttachmentTemplate(data); const preview = res.data; if (!preview) return; attachmentTemplatePreview.value = preview; attachmentTemplateCandidates.value = preview.fixedCandidates || []; attachmentConfig.fixedCandidates = attachmentTemplateCandidates.value; attachmentConfig.templateOssId = preview.ossId; attachmentConfig.templateFileName = preview.fileName; attachmentConfig.sheetName = preview.sheetName; attachmentConfig.headerRow = preview.headerRow; attachmentConfig.dataStartRow = preview.dataStartRow; attachmentConfig.totalRow = preview.totalRow; attachmentConfig.titleRow = Math.max(0, preview.headerRow - 1); attachmentConfig.fixedMappings = []; attachmentConfig.headers = (preview.columns || (preview.headers || []).map((label, columnIndex) => ({ columnIndex, label }))).map((column) => ({ columnIndex: column.columnIndex, label: column.label || '', field: templateFields.value.find((field) => field.header === column.label)?.code || '' })); modal.msgSuccess('附件模板上传并解析成功，请确认固定区域候选'); } finally { attachmentTemplateUploading.value = false; } };
const clearAttachmentTemplate = () => { attachmentConfig.templateOssId = undefined; attachmentConfig.templateFileName = undefined; attachmentConfig.headers = []; attachmentConfig.fixedCandidates = []; attachmentConfig.fixedMappings = []; attachmentTemplatePreview.value = undefined; attachmentTemplateCandidates.value = []; attachmentTemplateFile.value = undefined; };
const fixedModeOptions: Array<{ label: string; value: FixedMappingMode }> = [
  { label: '保留模板原值', value: 'KEEP' },
  { label: '清空原值，仅保留标签', value: 'CLEAR' },
  { label: '当前登录用户', value: 'CURRENT_USER' },
  { label: '当前用户所属科室', value: 'CURRENT_DEPT' },
  { label: '结算部门', value: 'SETTLEMENT_DEPT' },
  { label: '结算部门负责人', value: 'SETTLEMENT_OWNER' },
  { label: '导入数据字段', value: 'FIELD' },
  { label: '自定义内容', value: 'CUSTOM' }
];
const fixedLabelFromContent = (content: string) => {
  const colonIndex = Math.max(content.indexOf('：'), content.indexOf(':'));
  return colonIndex >= 0 ? content.slice(0, colonIndex + 1).trim() : content;
};
const fixedModeToken: Record<Exclude<FixedMappingMode, 'KEEP' | 'CLEAR' | 'CUSTOM' | 'FIELD'>, string> = {
  CURRENT_USER: '{currentUserName}',
  CURRENT_DEPT: '{currentDeptName}',
  SETTLEMENT_DEPT: '{settlementDeptName}',
  SETTLEMENT_OWNER: '{settlementDeptOwner}'
};
const legacySegmentTemplate = (mapping: any, label: string) => {
  const value = String(mapping.template || '');
  return label && value.startsWith(label) ? value.slice(label.length) : value;
};
const normalizeFixedMapping = (mapping: any): AttachmentFixedMappingForm => {
  const segments = Array.isArray(mapping?.segments) && mapping.segments.length
    ? mapping.segments.map((segment: any) => ({ label: String(segment.label || '').trim(), mode: (segment.mode || 'CLEAR') as FixedMappingMode, template: String(segment.template || ''), field: segment.field || '' }))
    : (() => {
      const label = String(mapping?.label || fixedLabelFromContent(mapping?.originalContent || '')).trim();
      return label ? [{ label, mode: (mapping?.mode || 'CLEAR') as FixedMappingMode, template: legacySegmentTemplate(mapping, label), field: mapping?.field || '' }] : [];
    })();
  return { cell: mapping?.cell || '', row: Number(mapping?.row ?? 0), column: Number(mapping?.column ?? 0), originalContent: mapping?.originalContent || '', segments };
};
const hasFixedMapping = (candidate: unknown) => {
  const item = candidate as OaImportAttachmentFixedCandidateVO;
  return attachmentConfig.fixedMappings.some((mapping) => mapping.row === item.row && mapping.column === item.column);
};
const fixedMappingForCandidate = (candidate: unknown) => {
  const item = candidate as OaImportAttachmentFixedCandidateVO;
  return attachmentConfig.fixedMappings.find((mapping) => mapping.row === item.row && mapping.column === item.column);
};
const fixedMappingSummary = (mapping?: unknown) => {
  const item = mapping as AttachmentFixedMappingForm | undefined;
  return item?.segments?.length ? item.segments.map((segment) => segment.label).filter(Boolean).join('、') : '尚未添加标签';
};
const createFixedMapping = (candidate: OaImportAttachmentFixedCandidateVO): AttachmentFixedMappingForm => {
  const label = (candidate.label || '').trim();
  return { cell: candidate.cell, row: candidate.row, column: candidate.column, originalContent: candidate.originalContent, segments: label ? [{ label, mode: 'CLEAR', template: '', field: '' }] : [] };
};
const openFixedSegmentDialog = (candidateOrMapping: unknown) => {
  const value = candidateOrMapping as OaImportAttachmentFixedCandidateVO | AttachmentFixedMappingForm;
  const existing = 'segments' in value ? value : fixedMappingForCandidate(value);
  const source = existing || createFixedMapping(value as OaImportAttachmentFixedCandidateVO);
  segmentDraft.value = { ...source, segments: (source.segments || []).map((segment) => ({ ...segment })) };
  fixedSegmentDialog.visible = true;
};
const addFixedSegment = () => {
  segmentDraft.value?.segments.push({ label: '', mode: 'CLEAR', template: '', field: '' });
};
const removeFixedSegment = (index: number) => {
  segmentDraft.value?.segments.splice(index, 1);
};
const fixedSegmentModeHint = (segment: unknown) => {
  const item = segment as AttachmentFixedSegmentForm;
  if (item.mode === 'KEEP') return '保留模板原值';
  if (item.mode === 'CLEAR') return '清空标签后的值';
  if (item.mode === 'CURRENT_USER') return '当前登录用户';
  if (item.mode === 'CURRENT_DEPT') return '当前用户所属科室';
  if (item.mode === 'SETTLEMENT_DEPT') return '结算部门';
  if (item.mode === 'SETTLEMENT_OWNER') return '结算部门负责人';
  return '请选择生成内容';
};
const handleFixedSegmentModeChange = (segment: unknown) => {
  const item = segment as AttachmentFixedSegmentForm;
  if (item.mode === 'FIELD') item.template = '{value}';
  else if (item.mode === 'CUSTOM') item.template = '';
  else if (item.mode === 'KEEP' || item.mode === 'CLEAR') item.template = '';
  else item.template = fixedModeToken[item.mode];
};
const validateFixedSegments = (mapping: AttachmentFixedMappingForm) => {
  if (!mapping.segments?.length) return '请至少添加一个标签';
  const seen = new Set<string>();
  for (const segment of mapping.segments) {
    const label = segment.label.trim();
    if (!label) return '标签不能为空，请输入完整标签';
    if (seen.has(label)) return `标签“${label}”重复，请保留一项`;
    seen.add(label);
    if (!mapping.originalContent.includes(label)) return `标签“${label}”不在单元格原内容中，请检查输入`;
    if (segment.mode === 'FIELD' && !segment.field) return `请为标签“${label}”选择导入字段`;
    if (segment.mode === 'CUSTOM' && !segment.template.trim()) return `请填写标签“${label}”的自定义内容`;
  }
  return '';
};
const saveFixedSegmentMapping = () => {
  const draft = segmentDraft.value;
  if (!draft) return;
  const error = validateFixedSegments(draft);
  if (error) return modal.msgWarning(error);
  draft.segments = draft.segments.map((segment) => ({ ...segment, label: segment.label.trim() }));
  const index = attachmentConfig.fixedMappings.findIndex((mapping) => mapping.row === draft.row && mapping.column === draft.column);
  if (index >= 0) attachmentConfig.fixedMappings.splice(index, 1, draft);
  else attachmentConfig.fixedMappings.push(draft);
  fixedSegmentDialog.visible = false;
  segmentDraft.value = undefined;
};
const removeFixedMapping = (index: number) => { attachmentConfig.fixedMappings.splice(index, 1); };
const fixedSegmentPreviewValue = (segment: AttachmentFixedSegmentForm, originalValue: string) => {
  if (segment.mode === 'KEEP') return originalValue;
  if (segment.mode === 'CLEAR') return '';
  if (segment.mode === 'FIELD') return '导入字段值';
  const template = segment.template || fixedSegmentModeHint(segment);
  return template.replace('{currentUserName}', '当前登录用户').replace('{currentDeptName}', '当前用户所属科室').replace('{settlementDeptName}', '结算部门').replace('{settlementDeptOwner}', '结算部门负责人').replace('{value}', '导入字段值');
};
const fixedLabelBoundaryPositions = (content: string) => {
  const positions: number[] = [];
  const matcher = /[^\s:：]{1,32}[：:]/g;
  let match: RegExpExecArray | null;
  while ((match = matcher.exec(content)) !== null) positions.push(match.index);
  return positions;
};
const fixedCellMappingPreview = (mappingValue: unknown) => {
  const mapping = mappingValue as AttachmentFixedMappingForm;
  const content = mapping.originalContent || '';
  if (!mapping.segments?.length || !content) return content || '未配置标签';
  const used = new Set<number>();
  const resolved = mapping.segments.map((segment) => {
    const label = segment.label.trim();
    let start = content.indexOf(label);
    while (start >= 0 && used.has(start)) start = content.indexOf(label, start + 1);
    if (start >= 0) used.add(start);
    return { segment, label, start };
  });
  if (resolved.some((item) => !item.label || item.start < 0)) return `${content}（存在未匹配标签）`;
  resolved.sort((a, b) => a.start - b.start);
  const boundaries = fixedLabelBoundaryPositions(content);
  let cursor = 0;
  let result = '';
  for (const item of resolved) {
    result += content.slice(cursor, item.start);
    const labelEnd = item.start + item.label.length;
    const nextBoundary = boundaries.find((position) => position > labelEnd) ?? content.length;
    const originalValueWithSpacing = content.slice(labelEnd, nextBoundary);
    const spacing = originalValueWithSpacing.match(/\s*$/)?.[0] || '';
    const originalValue = spacing ? originalValueWithSpacing.slice(0, -spacing.length) : originalValueWithSpacing;
    result += item.label + fixedSegmentPreviewValue(item.segment, originalValue) + spacing;
    cursor = nextBoundary;
  }
  return result + content.slice(cursor);
};
const syncFieldDefinitions = () => { form.fieldDefinitionsJson = JSON.stringify(templateFields.value.map(({ code, header, type, required, uniqueKey }) => ({ code, header, type, required: Boolean(required), uniqueKey: Boolean(uniqueKey) }))); };
const syncGroupFields = () => { form.groupByJson = JSON.stringify(groupFields.value); };
const save = async () => { const selected = businessTypes.value.find((item) => item.businessType === form.businessType); if (!selected || selected.status !== 'ENABLED') return modal.msgWarning('请选择已启用的泛微业务类型'); form.businessName = selected.businessName; const valid = await formRef.value?.validate().catch(() => false); if (!valid) return; if (!templateFields.value.length || !form.fieldDefinitionsJson) return modal.msgWarning('请先上传并解析 Excel 模板'); syncFieldDefinitions(); syncGroupFields(); if (attachmentEnabled.value) { if (!attachmentConfig.templateOssId) return modal.msgWarning('已启用附件生成，请先上传附件模板'); if (!attachmentConfig.headers.length) return modal.msgWarning('附件模板没有可用列，请重新上传模板'); const invalidMapping = attachmentConfig.fixedMappings.find((mapping) => validateFixedSegments(mapping)); if (invalidMapping) return modal.msgWarning(`请完善固定区域单元格 ${invalidMapping.cell} 的标签配置`); form.attachmentConfigJson = JSON.stringify({ ...attachmentConfig, mode: 'GENERATED_TABLE' }); } else { form.attachmentConfigJson = ''; } if (form.defaultApprovalMode === 'PLAN' && !form.defaultApprovalPlanId) return modal.msgWarning('默认审批方式为指定方案时，请选择默认审批方案'); saving.value = true; try { await saveOaImportBusinessConfig({ ...form }); dialog.visible = false; modal.msgSuccess('业务模板保存成功'); await loadList(); } finally { saving.value = false; } };
const removeConfig = async (row: any) => { await modal.confirm(`确认删除“${row.businessName}”业务模板吗？历史导入批次不会被删除。`); await delOaImportBusinessConfig(row.id); modal.msgSuccess('删除成功'); await loadList(); };

watch(() => props.businessType, () => { void loadList(); });

onMounted(async () => { await Promise.all([loadList(), loadWorkflows(), loadBusinessTypes()]); });
</script>

<style scoped lang="scss">
:global(.config-dialog.el-dialog) {
  display: flex;
  max-height: calc(100vh - 36px);
  flex-direction: column;
  overflow: hidden;
  border: 1px solid var(--app-surface-border, #e5e7eb);
  border-radius: 22px;
  background: var(--el-bg-color, #fff);
  box-shadow: 0 24px 70px rgba(15, 23, 42, 0.2);
}

:global(.config-dialog .el-dialog__header) {
  flex: 0 0 auto;
  margin-right: 0;
  padding: 20px 26px 17px;
  border-bottom: 1px solid var(--app-surface-border, #e5e7eb);
  background: linear-gradient(180deg, var(--el-fill-color-lighter, #f8fafc), var(--el-bg-color, #fff));
}

:global(.config-dialog .el-dialog__headerbtn) {
  top: 22px;
  right: 24px;
  width: 32px;
  height: 32px;
  border-radius: 10px;
  background: var(--el-fill-color-light, #f1f5f9);
  transition: background-color 0.2s ease, transform 0.2s ease;
}

:global(.config-dialog .el-dialog__headerbtn:hover) {
  background: var(--el-fill-color, #e2e8f0);
  transform: rotate(90deg);
}

:global(.config-dialog .el-dialog__body) {
  display: flex;
  min-height: 0;
  flex: 1 1 auto;
  flex-direction: column;
  padding: 0 26px !important;
  overflow: hidden;
}

:global(.config-dialog .el-dialog__footer) {
  flex: 0 0 auto;
  padding: 15px 26px 20px;
  border-top: 1px solid var(--app-surface-border, #e5e7eb);
  background: var(--el-bg-color, #fff);
}

.import-config-page {
  --import-accent: var(--el-color-primary);
  --import-accent-soft: rgba(14, 165, 233, 0.09);
  --import-panel-border: var(--app-surface-border);

  .intro-card,
  .main-card {
    position: relative;
    overflow: hidden;
    border: 1px solid var(--import-panel-border);
    border-radius: 18px;
    background: var(--app-surface-bg);
    box-shadow: 0 12px 30px rgba(15, 23, 42, 0.06);
    transition: border-color 0.25s ease, box-shadow 0.25s ease;

    &:hover {
      border-color: var(--app-accent-soft);
      box-shadow: 0 16px 36px rgba(15, 23, 42, 0.09);
      transform: none;
    }
  }

  .intro-card {
    background:
      radial-gradient(circle at 96% 12%, rgba(14, 165, 233, 0.1), transparent 28%),
      linear-gradient(120deg, var(--app-surface-bg), color-mix(in srgb, var(--el-color-primary) 7%, var(--app-surface-bg)));

    :deep(.el-card__body) {
      padding: 25px 28px !important;
    }
  }

  .intro-content,
  .card-heading {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 24px;
  }

  .intro-content > div:first-child,
  .card-heading > div:first-child {
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
  .table-toolbar-dot {
    width: 6px;
    height: 6px;
    flex: 0 0 6px;
    border-radius: 50%;
    background: var(--import-accent);
    box-shadow: 0 0 0 4px rgba(14, 165, 233, 0.1);
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
  .card-heading p {
    margin: 0;
    color: var(--el-text-color-secondary);
    font-size: 13px;
    line-height: 1.7;
  }

  .intro-aside {
    min-width: 205px;
    padding: 14px 16px;
    border: 1px solid rgba(14, 165, 233, 0.14);
    border-radius: 13px;
    background: color-mix(in srgb, var(--app-surface-bg) 84%, transparent);
    box-shadow: inset 0 1px 0 color-mix(in srgb, var(--app-text-title) 10%, transparent);
    text-align: left;

    .el-tag {
      max-width: 100%;
      margin-top: 9px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  .intro-aside-label {
    display: block;
    color: var(--el-text-color-secondary);
    font-size: 9px;
    font-weight: 800;
    letter-spacing: 0.14em;
  }

  .intro-aside strong {
    display: block;
    margin-top: 6px;
    color: var(--app-text-title);
    font-size: 14px;
  }

  .main-card :deep(.el-card__body) {
    padding: 23px 20px 18px !important;
  }

  .card-heading {
    align-items: flex-start;
    padding: 0 2px;
  }

  .card-heading h3 {
    margin: 7px 0 4px;
    color: var(--app-text-title);
    font-size: 19px;
    font-weight: 700;
    line-height: 1.3;
  }

  .add-button {
    flex-shrink: 0;
    min-height: 36px;
    padding: 0 16px;
    border-radius: 10px;
    box-shadow: 0 7px 16px rgba(14, 165, 233, 0.16);
  }

  .overview-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
    margin: 22px 0 20px;
  }

  .overview-item {
    position: relative;
    display: flex;
    align-items: center;
    min-height: 68px;
    gap: 11px;
    overflow: hidden;
    padding: 12px 14px;
    border: 1px solid var(--app-surface-border);
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
    &--green { color: #10b981; }
    &--orange { color: #f59e0b; }
  }

  .overview-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 30px;
    height: 30px;
    flex: 0 0 30px;
    border: 1px solid currentColor;
    border-radius: 9px;
    background: color-mix(in srgb, var(--app-surface-bg) 68%, transparent);
    font-size: 9px;
    font-weight: 800;
    letter-spacing: 0.06em;
  }

  .overview-item > div {
    min-width: 0;
    display: flex;
    align-items: baseline;
    gap: 6px;
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

  .table-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 10px;
    padding: 0 2px;
  }

  .table-toolbar-title {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    color: var(--app-text-title);
    font-size: 13px;
    font-weight: 700;
  }

  .table-toolbar-dot {
    width: 5px;
    height: 5px;
    flex-basis: 5px;
    box-shadow: none;
  }

  .table-toolbar-tip {
    color: var(--el-text-color-secondary);
    font-size: 11px;
  }

  .template-table {
    overflow: hidden;
    border-radius: 12px;

    :deep(.el-table__inner-wrapper::before) {
      height: 0;
    }

    :deep(.el-table__header-wrapper th) {
      height: 44px;
      border-bottom: 1px solid var(--app-surface-border);
      background: var(--el-fill-color-lighter);
      color: var(--el-text-color-secondary);
      font-size: 12px;
      font-weight: 700;
    }

    :deep(.el-table__body-wrapper td) {
      height: 68px;
      border-bottom-color: var(--app-surface-border);
      color: var(--el-text-color-regular);
      font-size: 12px;
    }

    :deep(.el-table__row) {
      transition: background-color 0.2s ease;
    }

    :deep(.el-table__row:hover > td) {
      background: rgba(14, 165, 233, 0.035) !important;
    }
  }

  .business-cell {
    display: flex;
    align-items: center;
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
    background: linear-gradient(145deg, rgba(14, 165, 233, 0.16), rgba(99, 102, 241, 0.1));
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

  .business-cell strong {
    overflow: hidden;
    color: var(--app-text-title);
    font-size: 13px;
    font-weight: 700;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .business-cell small {
    overflow: hidden;
    color: var(--el-text-color-secondary);
    font-size: 10px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .field-count {
    display: inline-flex;
    align-items: baseline;
    gap: 4px;
    color: var(--el-text-color-secondary);

    strong {
      color: var(--el-color-primary);
      font-size: 18px;
      font-weight: 700;
    }

    em {
      font-size: 11px;
      font-style: normal;
    }
  }

  .workflow-cell {
    display: flex;
    align-items: center;
    gap: 8px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .workflow-dot {
    width: 6px;
    height: 6px;
    flex: 0 0 6px;
    border-radius: 50%;
    background: #818cf8;
    box-shadow: 0 0 0 3px rgba(129, 140, 248, 0.1);
  }

  .table-state {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 5px 8px;
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
      color: #059669;
    }

    &.is-muted {
      background: var(--el-fill-color-light);
      color: var(--el-text-color-secondary);
    }

    &.is-warning {
      background: rgba(245, 158, 11, 0.1);
      color: #d97706;
    }
  }

  .remark-cell {
    color: var(--el-text-color-secondary);
  }

  .table-actions {
    display: inline-flex;
    align-items: center;
    gap: 5px;

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
    min-height: 210px;
    color: var(--el-text-color-secondary);

    .empty-mark {
      position: relative;
      width: 46px;
      height: 46px;
      margin-bottom: 13px;
      border: 1px solid rgba(14, 165, 233, 0.16);
      border-radius: 14px;
      background: rgba(14, 165, 233, 0.06);

      &::before,
      &::after,
      span {
        position: absolute;
        right: 11px;
        left: 11px;
        height: 2px;
        border-radius: 2px;
        background: rgba(14, 165, 233, 0.42);
        content: '';
      }

      &::before { top: 15px; }
      &::after { top: 22px; right: 17px; }
      span { top: 29px; right: 14px; }
    }

    strong {
      color: var(--app-text-title);
      font-size: 13px;
    }

    p {
      margin: 6px 0 13px;
      font-size: 12px;
    }
  }

  .config-form {
    min-height: 0;
    flex: 1 1 auto;
    overflow-y: auto;
    padding: 20px 12px 4px 2px;
    scrollbar-gutter: stable;

    &::-webkit-scrollbar {
      width: 7px;
    }

    &::-webkit-scrollbar-thumb {
      border-radius: 99px;
      background: var(--el-border-color, #dbe3ee);
    }

    :deep(.el-form-item) {
      margin-bottom: 18px;
    }

    :deep(.el-form-item__label) {
      color: var(--el-text-color-regular);
      font-size: 12px;
      font-weight: 600;
    }

    :deep(.el-input__wrapper),
    :deep(.el-textarea__inner),
    :deep(.el-select .el-input__wrapper) {
      border-radius: 10px;
    }
  }

  .dialog-title {
    display: flex;
    align-items: center;
    gap: 12px;
    padding-right: 44px;
  }

  .dialog-title-mark,
  .section-index {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: var(--el-color-primary);
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 0.04em;
  }

  .dialog-title-mark {
    width: 34px;
    height: 34px;
    border: 1px solid rgba(14, 165, 233, 0.2);
    border-radius: 11px;
    background: rgba(14, 165, 233, 0.1);
  }

  .dialog-title strong,
  .dialog-title span,
  .dialog-summary strong,
  .dialog-summary p {
    display: block;
  }

  .dialog-title strong {
    color: var(--app-text-title);
    font-size: 16px;
    line-height: 1.2;
  }

  .dialog-title div span {
    margin-top: 4px;
    color: var(--el-text-color-secondary);
    font-size: 11px;
    line-height: 1.3;
  }

  .dialog-summary {
    display: flex;
    align-items: center;
    gap: 12px;
    margin: 18px 2px 2px;
    padding: 13px 15px;
    border: 1px solid rgba(14, 165, 233, 0.14);
    border-radius: 13px;
    background: linear-gradient(100deg, color-mix(in srgb, var(--el-color-primary) 9%, var(--app-surface-bg)), color-mix(in srgb, var(--el-color-primary) 3%, var(--app-surface-bg)));
  }

  .dialog-summary-mark {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 30px;
    height: 30px;
    flex: 0 0 30px;
    border-radius: 9px;
    background: var(--el-color-primary);
    color: #fff;
    font-size: 14px;
    font-weight: 800;
  }

  .dialog-summary > div:nth-child(2) {
    min-width: 0;
  }

  .dialog-summary strong {
    color: var(--app-text-title);
    font-size: 12px;
  }

  .dialog-summary p {
    margin: 4px 0 0;
    color: var(--el-text-color-secondary);
    font-size: 11px;
    line-height: 1.5;
  }

  .dialog-summary-badge {
    margin-left: auto;
    padding: 5px 8px;
    border: 1px solid rgba(14, 165, 233, 0.16);
    border-radius: 7px;
    color: var(--el-color-primary);
    font-size: 9px;
    font-weight: 800;
    letter-spacing: 0.08em;
    white-space: nowrap;
  }

  .config-section {
    margin-bottom: 14px;
    padding: 17px 17px 1px;
    border: 1px solid var(--app-surface-border);
    border-radius: 15px;
    background: var(--el-bg-color, #fff);
    box-shadow: 0 5px 16px rgba(15, 23, 42, 0.035);
  }

  .config-section-heading {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 16px;
  }

  .section-index {
    width: 28px;
    height: 28px;
    flex: 0 0 28px;
    border-radius: 9px;
    background: var(--el-fill-color-light);
  }

  .config-section-heading strong,
  .config-section-heading span {
    display: block;
  }

  .config-section-heading strong {
    color: var(--app-text-title);
    font-size: 13px;
    line-height: 1.2;
  }

  .config-section-heading div span {
    margin-top: 4px;
    color: var(--el-text-color-secondary);
    font-size: 11px;
    line-height: 1.3;
  }

  .section-alert {
    margin-bottom: 13px;
  }

  .field-table {
    margin-bottom: 16px;
    overflow: hidden;
    border-radius: 10px;

    :deep(.el-table__header-wrapper th) {
      height: 40px;
      background: var(--el-fill-color-lighter);
      color: var(--el-text-color-secondary);
      font-size: 11px;
    }

    :deep(.el-table__body-wrapper td) {
      height: 48px;
      font-size: 12px;
    }
  }

  .field-rule-row {
    margin-bottom: 0;
  }

  .switch-field {
    display: inline-flex;
    align-items: center;
    min-height: 32px;
    gap: 9px;
    color: var(--el-text-color-regular);
    font-size: 12px;
  }

  .template-upload {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 12px;

    :deep(.el-upload-list) {
      margin-top: 7px;
    }
  }

  .field-tip {
    display: block;
    color: var(--el-text-color-secondary);
    font-size: 12px;
    line-height: 18px;
  }

  .config-form-note {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    margin: 3px 2px 15px;
    padding: 10px 12px;
    border: 1px solid var(--app-surface-border);
    border-radius: 10px;
    background: var(--el-fill-color-lighter);
    color: var(--el-text-color-secondary);
    font-size: 11px;
    line-height: 1.6;
  }

  .note-mark {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 16px;
    flex: 0 0 16px;
    border-radius: 50%;
    background: rgba(14, 165, 233, 0.12);
    color: var(--el-color-primary);
    font-size: 10px;
    font-weight: 800;
  }

  .remark-item {
    margin: 0 2px 8px !important;
  }

  .dialog-footer-actions {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;

    > span {
      color: var(--el-text-color-secondary);
      font-size: 11px;
    }

    > div {
      display: inline-flex;
      gap: 8px;
    }

    .el-button {
      min-width: 86px;
      height: 34px;
      border-radius: 10px;
    }
  }

  .template-option {
    display: flex;
    flex-direction: column;
  }

  .template-option small {
    color: var(--el-text-color-secondary);
  }

  @media (max-width: 900px) {
    .intro-content,
    .card-heading {
      align-items: flex-start;
      flex-direction: column;
    }

    .intro-aside {
      width: 100%;
      box-sizing: border-box;
    }

    .overview-grid {
      grid-template-columns: 1fr;
    }

    .table-toolbar-tip {
      display: none;
    }

    .dialog-summary-badge {
      display: none;
    }

    .config-section {
      padding: 14px 12px 1px;
    }

    .attachment-config-panel {
      margin-right: 0;
      margin-left: 0;
    }

    .dialog-footer-actions {
      align-items: flex-end;
      flex-direction: column;
      gap: 10px;

      > div {
        width: 100%;

        .el-button {
          flex: 1;
        }
      }
    }
  }
}

@media (max-width: 900px) {
  :global(.config-dialog.el-dialog) {
    width: calc(100vw - 24px) !important;
    max-height: calc(100vh - 24px);
    margin-top: 12px !important;
  }

  :global(.config-dialog .el-dialog__header),
  :global(.config-dialog .el-dialog__footer) {
    padding-right: 18px;
    padding-left: 18px;
  }

  :global(.config-dialog .el-dialog__body) {
    padding-right: 18px !important;
    padding-left: 18px !important;
  }
}

/* el-dialog is teleported to body, so modal-internal styles must not depend on the page wrapper. */
:global(.config-dialog .dialog-title) {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-right: 44px;
}

:global(.config-dialog .dialog-title-mark) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  flex: 0 0 34px;
  border: 1px solid rgba(14, 165, 233, 0.2);
  border-radius: 11px;
  background: rgba(14, 165, 233, 0.1);
  color: var(--el-color-primary);
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.04em;
}

:global(.config-dialog .dialog-title > div),
:global(.config-dialog .dialog-summary > div:nth-child(2)),
:global(.config-dialog .config-section-heading > div),
:global(.config-dialog .attachment-config-heading > div) {
  min-width: 0;
}

:global(.config-dialog .dialog-title strong),
:global(.config-dialog .dialog-title div span),
:global(.config-dialog .dialog-summary strong),
:global(.config-dialog .dialog-summary p),
:global(.config-dialog .config-section-heading strong),
:global(.config-dialog .config-section-heading div span),
:global(.config-dialog .attachment-config-heading strong),
:global(.config-dialog .attachment-config-heading span) {
  display: block;
}

:global(.config-dialog .dialog-title strong) {
  color: var(--app-text-title);
  font-size: 16px;
  line-height: 1.2;
}

:global(.config-dialog .dialog-title div span) {
  margin-top: 4px;
  color: var(--el-text-color-secondary);
  font-size: 11px;
  line-height: 1.3;
}

:global(.config-dialog .dialog-summary) {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 18px 2px 2px;
  padding: 13px 15px;
  border: 1px solid rgba(14, 165, 233, 0.14);
  border-radius: 13px;
  background: linear-gradient(100deg, color-mix(in srgb, var(--el-color-primary) 9%, var(--app-surface-bg)), color-mix(in srgb, var(--el-color-primary) 3%, var(--app-surface-bg)));
}

:global(.config-dialog .dialog-summary-mark) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  flex: 0 0 30px;
  border-radius: 9px;
  background: var(--el-color-primary);
  color: #fff;
  font-size: 14px;
  font-weight: 800;
}

:global(.config-dialog .dialog-summary strong) {
  color: var(--app-text-title);
  font-size: 12px;
}

:global(.config-dialog .dialog-summary p) {
  margin: 4px 0 0;
  color: var(--el-text-color-secondary);
  font-size: 11px;
  line-height: 1.5;
}

:global(.config-dialog .dialog-summary-badge) {
  margin-left: auto;
  padding: 5px 8px;
  border: 1px solid rgba(14, 165, 233, 0.16);
  border-radius: 7px;
  color: var(--el-color-primary);
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.08em;
  white-space: nowrap;
}

:global(.config-dialog .config-form) {
  min-height: 0;
  flex: 1 1 auto;
  overflow-y: auto;
  padding: 20px 12px 4px 2px;
  scrollbar-gutter: stable;
}

:global(.config-dialog .config-form::-webkit-scrollbar) {
  width: 7px;
}

:global(.config-dialog .config-form::-webkit-scrollbar-thumb) {
  border-radius: 99px;
  background: var(--el-border-color, #dbe3ee);
}

:global(.config-dialog .config-form .el-form-item) {
  margin-bottom: 18px;
}

:global(.config-dialog .config-form .el-form-item__label) {
  color: var(--el-text-color-regular);
  font-size: 12px;
  font-weight: 600;
}

:global(.config-dialog .config-form .el-input__wrapper),
:global(.config-dialog .config-form .el-textarea__inner),
:global(.config-dialog .config-form .el-select .el-input__wrapper) {
  border-radius: 10px;
}

:global(.config-dialog .config-section) {
  margin-bottom: 14px;
  padding: 17px 17px 1px;
  border: 1px solid var(--app-surface-border);
  border-radius: 15px;
  background: var(--el-bg-color, #fff);
  box-shadow: 0 5px 16px rgba(15, 23, 42, 0.035);
}

:global(.config-dialog .config-section-heading) {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
}

:global(.config-dialog .section-index) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  flex: 0 0 28px;
  border-radius: 9px;
  background: var(--el-fill-color-light);
  color: var(--el-color-primary);
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.04em;
}

:global(.config-dialog .config-section-heading strong) {
  color: var(--app-text-title);
  font-size: 13px;
  line-height: 1.2;
}

:global(.config-dialog .config-section-heading div span) {
  margin-top: 4px;
  color: var(--el-text-color-secondary);
  font-size: 11px;
  line-height: 1.3;
}

:global(.config-dialog .section-alert) {
  margin-bottom: 13px;
}

:global(.config-dialog .field-table) {
  margin-bottom: 16px;
  overflow: hidden;
  border-radius: 10px;
}

:global(.config-dialog .field-table .el-table__header-wrapper th) {
  height: 40px;
  background: var(--el-fill-color-lighter);
  color: var(--el-text-color-secondary);
  font-size: 11px;
}

:global(.config-dialog .field-table .el-table__body-wrapper td) {
  height: 48px;
  font-size: 12px;
}

:global(.config-dialog .field-rule-row) {
  margin-bottom: 0;
}

:global(.config-dialog .switch-field) {
  display: inline-flex;
  align-items: center;
  min-height: 32px;
  gap: 9px;
  color: var(--el-text-color-regular);
  font-size: 12px;
}

:global(.config-dialog .template-upload) {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

:global(.config-dialog .template-upload .el-upload-list) {
  margin-top: 7px;
}

:global(.config-dialog .attachment-config-panel) {
  margin: 4px 0 20px;
  padding: 0;
  overflow: hidden;
  border: 1px solid rgba(14, 165, 233, 0.18);
  border-radius: 14px;
  background: var(--el-bg-color, #fff);
  box-shadow: 0 4px 14px rgba(15, 23, 42, 0.035);
}

:global(.config-dialog .attachment-config-heading) {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 15px 16px;
  border-bottom: 1px solid rgba(14, 165, 233, 0.12);
  background: linear-gradient(100deg, color-mix(in srgb, var(--el-color-primary) 7%, var(--app-surface-bg)), color-mix(in srgb, var(--app-text-title) 3%, var(--app-surface-bg)));
}

:global(.config-dialog .attachment-config-heading > div) {
  min-width: 0;
}

:global(.config-dialog .attachment-config-heading > div strong) {
  display: block;
  color: var(--app-text-title);
  font-size: 13px;
}

:global(.config-dialog .attachment-config-heading > div span) {
  display: block;
  margin-top: 4px;
  color: var(--el-text-color-secondary);
  font-size: 11px;
  line-height: 1.6;
}

:global(.config-dialog .attachment-config-heading .el-tag) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 28px;
  flex: 0 0 auto;
}

:global(.config-dialog .attachment-template-item) {
  display: block;
  margin: 0 !important;
  padding: 14px 16px 0;
}

:global(.config-dialog .attachment-config-panel .attachment-template-item .el-form-item__label) {
  display: block;
  width: auto !important;
  margin-bottom: 8px;
  padding: 0;
  line-height: 20px;
  text-align: left;
}

:global(.config-dialog .attachment-config-panel .attachment-template-item .el-form-item__content) {
  min-width: 0;
  margin-left: 0 !important;
}

:global(.config-dialog .attachment-template-card) {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  min-width: 0;
  padding: 12px 14px;
  border: 1px solid var(--app-surface-border);
  border-radius: 11px;
  background: var(--app-elevated-soft-bg, #fbfdff);
}

:global(.config-dialog .attachment-template-copy) {
  display: flex;
  align-items: center;
  flex: 1 1 auto;
  min-width: 0;
  gap: 10px;
}

:global(.config-dialog .attachment-template-icon) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  flex: 0 0 38px;
  border: 1px solid rgba(16, 185, 129, 0.2);
  border-radius: 10px;
  background: rgba(16, 185, 129, 0.09);
  color: #059669;
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.04em;
}

:global(.config-dialog .attachment-template-copy > div:last-child) {
  min-width: 0;
}

:global(.config-dialog .attachment-template-copy strong),
:global(.config-dialog .attachment-template-copy span),
:global(.config-dialog .attachment-template-copy small) {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

:global(.config-dialog .attachment-template-copy strong) {
  color: var(--app-text-title);
  font-size: 12px;
}

:global(.config-dialog .attachment-template-copy span) {
  margin-top: 4px;
  color: var(--el-text-color-secondary);
  font-size: 11px;
}

:global(.config-dialog .attachment-template-copy small) {
  margin-top: 4px;
  color: var(--el-color-success);
  font-size: 11px;
}

:global(.config-dialog .attachment-upload) {
  display: flex;
  align-items: center;
  flex: 0 0 auto;
  flex-wrap: nowrap;
  gap: 8px;
  white-space: nowrap;
}

:global(.config-dialog .attachment-file-picker) {
  display: flex;
  flex: 0 0 auto;
  min-width: 0;
  flex-direction: column;
  align-items: flex-start;
}

:global(.config-dialog .attachment-upload > .el-button) {
  flex: 0 0 auto;
  white-space: nowrap;
}

:global(.config-dialog .attachment-file-picker .el-upload-list) {
  width: 240px;
  max-width: 100%;
  margin-top: 6px;
}

:global(.config-dialog .attachment-rule-group) {
  margin: 0 16px 15px;
  padding-top: 14px;
  border-top: 1px solid var(--app-surface-border);
}

:global(.config-dialog .attachment-rule-group-title) {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 10px;
}

:global(.config-dialog .attachment-rule-group-title strong) {
  color: var(--app-text-title);
  font-size: 12px;
}

:global(.config-dialog .attachment-rule-group-title span) {
  color: var(--el-text-color-secondary);
  font-size: 11px;
}

:global(.config-dialog .attachment-structure-grid) {
  display: grid;
  grid-template-columns: minmax(190px, 1.45fr) repeat(3, minmax(110px, 1fr));
  gap: 10px;
}

:global(.config-dialog .attachment-output-grid) {
  display: grid;
  grid-template-columns: minmax(150px, 0.8fr) repeat(2, minmax(260px, 1.2fr));
  gap: 10px;
}

:global(.config-dialog .attachment-rule-item) {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 7px;
  padding: 10px 11px;
  border: 1px solid var(--app-surface-border);
  border-radius: 10px;
  background: var(--el-fill-color-lighter);
}

:global(.config-dialog .attachment-rule-label) {
  color: var(--el-text-color-regular);
  font-size: 11px;
  font-weight: 600;
}

:global(.config-dialog .attachment-rule-item .el-input),
:global(.config-dialog .attachment-rule-item .el-input-number) {
  width: 100%;
}

:global(.config-dialog .attachment-rule-item small) {
  min-height: 16px;
  color: var(--el-text-color-secondary);
  font-size: 10px;
  line-height: 1.5;
}

:global(.config-dialog .attachment-columns) {
  margin: 0 16px 16px;
  padding-top: 14px;
  border-top: 1px solid var(--app-surface-border);
}

:global(.config-dialog .attachment-fixed-area) {
  margin: 0 16px 16px;
  padding-top: 14px;
  border-top: 1px solid var(--app-surface-border);
}

:global(.config-dialog .fixed-area-alert) {
  margin-bottom: 10px;
}

:global(.config-dialog .fixed-area-alert .el-alert__title) {
  font-size: 11px;
  line-height: 18px;
}

:global(.config-dialog .fixed-candidate-list),
:global(.config-dialog .fixed-mapping-list) {
  margin-top: 10px;
}

:global(.config-dialog .fixed-area-subtitle) {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 8px;
}

:global(.config-dialog .fixed-area-subtitle strong) {
  color: var(--app-text-title);
  font-size: 11px;
}

:global(.config-dialog .fixed-area-subtitle span) {
  color: var(--el-text-color-secondary);
  font-size: 10px;
}

:global(.config-dialog .fixed-area-subtitle code),
:global(.config-dialog .attachment-fixed-area code) {
  padding: 2px 6px;
  border: 1px solid rgba(14, 165, 233, 0.15);
  border-radius: 5px;
  background: rgba(14, 165, 233, 0.06);
  color: var(--el-color-primary);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 10px;
}

:global(.config-dialog .fixed-preview-text) {
  color: var(--el-color-success);
  font-size: 11px;
}

:global(.config-dialog .fixed-label-summary) {
  display: inline-block;
  max-width: 100%;
  overflow: hidden;
  color: var(--el-color-primary);
  text-overflow: ellipsis;
  vertical-align: middle;
  white-space: nowrap;
}

:global(.config-dialog .fixed-label-empty) {
  color: var(--el-text-color-placeholder);
}

:global(.fixed-segment-dialog.el-dialog) {
  overflow: hidden;
  border: 1px solid var(--app-surface-border, #e5e7eb);
  border-radius: 18px;
  box-shadow: 0 22px 60px rgba(15, 23, 42, 0.2);
}

:global(.fixed-segment-dialog .el-dialog__header) {
  margin-right: 0;
  padding: 18px 22px 15px;
  border-bottom: 1px solid var(--app-surface-border, #e5e7eb);
  background: var(--el-fill-color-lighter, #f8fafc);
}

:global(.fixed-segment-dialog .el-dialog__body) {
  padding: 18px 22px 20px;
}

:global(.fixed-segment-dialog .el-dialog__footer) {
  padding: 14px 22px 18px;
  border-top: 1px solid var(--app-surface-border, #e5e7eb);
}

:global(.fixed-segment-dialog-title),
:global(.fixed-segment-dialog-footer),
:global(.fixed-segment-toolbar),
:global(.fixed-segment-context) {
  display: flex;
  align-items: center;
}

:global(.fixed-segment-dialog-title) {
  gap: 10px;
}

:global(.fixed-segment-dialog-title > div) {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

:global(.fixed-segment-dialog-title strong) {
  color: var(--app-text-title);
  font-size: 15px;
}

:global(.fixed-segment-dialog-title small) {
  color: var(--el-text-color-secondary);
  font-size: 11px;
}

:global(.fixed-segment-dialog-icon) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: 9px;
  background: rgba(14, 165, 233, 0.1);
  color: var(--el-color-primary);
  font-weight: 800;
}

:global(.fixed-segment-context) {
  gap: 22px;
  margin-bottom: 14px;
  padding: 11px 13px;
  border: 1px solid var(--app-surface-border);
  border-radius: 10px;
  background: var(--el-fill-color-lighter);
}

:global(.fixed-segment-context > div) {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 8px;
}

:global(.fixed-segment-context span),
:global(.fixed-segment-toolbar span),
:global(.fixed-segment-preview span) {
  color: var(--el-text-color-secondary);
  font-size: 11px;
}

:global(.fixed-segment-context code) {
  padding: 3px 7px;
  border-radius: 6px;
  background: rgba(14, 165, 233, 0.08);
  color: var(--el-color-primary);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 11px;
}

:global(.fixed-segment-context-content) {
  min-width: 0;
  flex: 1;
}

:global(.fixed-segment-context-content strong) {
  overflow: hidden;
  color: var(--app-text-title);
  font-size: 12px;
  font-weight: 500;
  text-overflow: ellipsis;
  white-space: nowrap;
}

:global(.fixed-segment-toolbar) {
  justify-content: space-between;
  gap: 12px;
  margin: 16px 0 9px;
}

:global(.fixed-segment-toolbar > div),
:global(.fixed-segment-preview > div) {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 3px;
}

:global(.fixed-segment-toolbar strong),
:global(.fixed-segment-preview strong) {
  color: var(--app-text-title);
  font-size: 12px;
}

:global(.fixed-segment-table) {
  overflow: hidden;
  border-radius: 10px;
}

:global(.fixed-segment-generated-value) {
  color: var(--el-text-color-secondary);
  font-size: 11px;
}

:global(.fixed-segment-empty) {
  padding: 18px;
  border: 1px dashed var(--app-surface-border);
  border-radius: 10px;
  color: var(--el-text-color-placeholder);
  font-size: 11px;
  text-align: center;
}

:global(.fixed-segment-preview) {
  margin-top: 14px;
  padding: 11px 13px;
  border: 1px solid rgba(16, 185, 129, 0.2);
  border-radius: 10px;
  background: rgba(16, 185, 129, 0.06);
}

:global(.fixed-segment-preview p) {
  margin: 8px 0 0;
  color: var(--el-color-success);
  font-size: 12px;
  line-height: 1.7;
  word-break: break-all;
}

:global(.fixed-segment-dialog-footer) {
  justify-content: flex-end;
  gap: 10px;
}

:global(.config-dialog .attachment-fixed-area .el-table) {
  overflow: hidden;
  border-radius: 10px;
}

:global(.config-dialog .attachment-columns-title) {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 9px;
}

:global(.config-dialog .attachment-columns-title > div) {
  min-width: 0;
}

:global(.config-dialog .attachment-columns-title strong),
:global(.config-dialog .attachment-columns-title span) {
  display: inline-block;
}

:global(.config-dialog .attachment-columns-title strong) {
  color: var(--app-text-title);
  font-size: 12px;
}

:global(.config-dialog .attachment-columns-title span) {
  margin-left: 8px;
  color: var(--el-text-color-secondary);
  font-size: 11px;
  font-weight: 400;
}

:global(.config-dialog .attachment-columns-title .el-tag) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 56px;
  height: 28px;
  padding: 0 10px;
  line-height: 1;
  white-space: nowrap;
}

:global(.config-dialog .attachment-columns .el-table) {
  overflow: hidden;
  border-radius: 10px;
}

:global(.config-dialog .attachment-columns-empty) {
  margin: 0 16px 16px;
  padding: 14px;
  border: 1px dashed var(--app-surface-border);
  border-radius: 10px;
  color: var(--el-text-color-secondary);
  font-size: 11px;
  text-align: center;
}

:global(.config-dialog .field-tip) {
  display: block;
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 18px;
}

:global(.config-dialog .config-form-note) {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin: 3px 2px 15px;
  padding: 10px 12px;
  border: 1px solid var(--app-surface-border);
  border-radius: 10px;
  background: var(--el-fill-color-lighter);
  color: var(--el-text-color-secondary);
  font-size: 11px;
  line-height: 1.6;
}

:global(.config-dialog .note-mark) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  flex: 0 0 16px;
  border-radius: 50%;
  background: rgba(14, 165, 233, 0.12);
  color: var(--el-color-primary);
  font-size: 10px;
  font-weight: 800;
}

:global(.config-dialog .remark-item) {
  margin: 0 2px 8px !important;
}

:global(.config-dialog .dialog-footer-actions) {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

:global(.config-dialog .dialog-footer-actions > span) {
  color: var(--el-text-color-secondary);
  font-size: 11px;
}

:global(.config-dialog .dialog-footer-actions > div) {
  display: inline-flex;
  gap: 8px;
}

:global(.config-dialog .dialog-footer-actions .el-button) {
  min-width: 86px;
  height: 34px;
  border-radius: 10px;
}

@media (max-width: 900px) {
  :global(.config-dialog .dialog-summary-badge) {
    display: none;
  }

  :global(.config-dialog .config-section) {
    padding: 14px 12px 1px;
  }

  :global(.config-dialog .attachment-config-panel) {
    margin-right: 0;
    margin-left: 0;
  }

  :global(.config-dialog .attachment-template-card) {
    align-items: stretch;
    flex-direction: column;
  }

  :global(.config-dialog .attachment-upload) {
    align-items: flex-start;
    flex-wrap: wrap;
    white-space: normal;
  }

  :global(.config-dialog .attachment-structure-grid),
  :global(.config-dialog .attachment-output-grid) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  :global(.config-dialog .attachment-columns-title) {
    align-items: flex-start;
    flex-direction: column;
  }

  :global(.config-dialog .attachment-columns-title span) {
    margin-top: 4px;
    margin-left: 0;
  }

  :global(.config-dialog .dialog-footer-actions) {
    align-items: flex-end;
    flex-direction: column;
    gap: 10px;
  }

  :global(.config-dialog .dialog-footer-actions > div) {
    width: 100%;
  }

  :global(.config-dialog .dialog-footer-actions > div .el-button) {
    flex: 1;
  }
}

@media (max-width: 600px) {
  :global(.config-dialog .attachment-structure-grid),
  :global(.config-dialog .attachment-output-grid) {
    grid-template-columns: 1fr;
  }

  :global(.config-dialog .attachment-template-copy span) {
    white-space: normal;
  }
}

/* el-dialog 会 teleport 到 body，深色主题需要在弹窗根节点上明确覆盖固定浅色区域。 */
:global(html.dark .config-dialog) {
  --config-dialog-surface: var(--app-surface-bg);
  --config-dialog-subtle: var(--app-elevated-soft-bg);
  --config-dialog-border: var(--app-surface-border);

  color: var(--el-text-color-primary);
  background: var(--config-dialog-surface);
  border-color: var(--config-dialog-border);
  box-shadow: var(--app-shadow-lg);
}

:global(html.dark .config-dialog .el-dialog__header),
:global(html.dark .config-dialog .el-dialog__footer) {
  border-color: var(--config-dialog-border);
  background: var(--config-dialog-subtle);
}

:global(html.dark .config-dialog .dialog-summary) {
  border-color: color-mix(in srgb, var(--el-color-primary) 30%, var(--config-dialog-border));
  background: linear-gradient(
    100deg,
    color-mix(in srgb, var(--el-color-primary) 16%, var(--config-dialog-surface)),
    color-mix(in srgb, var(--el-color-primary) 8%, var(--config-dialog-surface))
  );
}

:global(html.dark .config-dialog .config-section),
:global(html.dark .config-dialog .attachment-config-panel) {
  border-color: var(--config-dialog-border);
  background: var(--config-dialog-surface);
  box-shadow: 0 5px 16px rgba(0, 0, 0, 0.18);
}

:global(html.dark .config-dialog .attachment-config-heading) {
  border-bottom-color: var(--config-dialog-border);
  background: linear-gradient(
    100deg,
    color-mix(in srgb, var(--el-color-primary) 13%, var(--config-dialog-surface)),
    color-mix(in srgb, var(--app-text-title) 5%, var(--config-dialog-surface))
  );
}

:global(html.dark .config-dialog .attachment-template-card) {
  border-color: var(--config-dialog-border);
  background: var(--config-dialog-subtle);
}

:global(html.dark .config-dialog .attachment-rule-item),
:global(html.dark .config-dialog .config-form-note) {
  border-color: var(--config-dialog-border);
  background: color-mix(in srgb, var(--app-text-title) 4%, var(--config-dialog-surface));
}

:global(html.dark .config-dialog .attachment-rule-group),
:global(html.dark .config-dialog .attachment-columns),
:global(html.dark .config-dialog .attachment-fixed-area) {
  border-color: var(--config-dialog-border);
}

.import-config-page.is-embedded {
  padding: 0 !important;
}

.import-config-page.is-embedded .main-card {
  margin-top: 0 !important;
}
</style>

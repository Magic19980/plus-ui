<template>
  <div class="platform-feedback-page p-2 app-container">
    <section class="feedback-hero">
      <div class="hero-copy">
        <span class="hero-kicker"><el-icon><ChatDotRound /></el-icon> PLATFORM FEEDBACK</span>
        <h1>问题与建议中心</h1>
        <p>把使用中遇到的问题和改进想法集中记录、跟踪处理，让每一次反馈都有回应。</p>
        <div class="hero-pills">
          <span><el-icon><CircleCheck /></el-icon> 问题可追踪</span>
          <span><el-icon><User /></el-icon> 支持多人协作处理</span>
          <span><el-icon><ChatLineRound /></el-icon> 全程保留沟通记录</span>
        </div>
      </div>
      <div class="hero-actions">
        <div class="hero-mark"><el-icon><ChatDotRound /></el-icon></div>
        <div>
          <strong>一起把平台变得更好</strong>
          <span>你的反馈会被记录和跟进</span>
        </div>
      </div>
    </section>

    <section class="summary-grid">
      <div v-for="item in summaryCards" :key="item.key" class="summary-card" :class="`summary-card--${item.tone}`">
        <span class="summary-icon"><el-icon><component :is="item.icon" /></el-icon></span>
        <div class="summary-content">
          <strong>{{ item.value }}</strong>
          <span>{{ item.label }}</span>
        </div>
        <span class="summary-caption">{{ item.caption }}</span>
      </div>
    </section>

    <el-card shadow="never" class="feedback-workspace">
      <div class="workspace-heading">
        <div>
          <span class="section-kicker">FEEDBACK WORKSPACE</span>
          <h2>反馈记录</h2>
          <p>统一查看问题、数据、流程疑问和改进建议，按状态持续跟进。</p>
        </div>
        <div class="workspace-tools">
          <el-button plain @click="handleQuery"><el-icon><Refresh /></el-icon>刷新</el-button>
          <el-button v-hasPermi="['department:platformFeedback:manage']" plain @click="openHandlerDialog"><el-icon><Setting /></el-icon>配置处理人</el-button>
          <el-button v-hasPermi="['department:platformFeedback:add']" type="primary" @click="openCreate"><el-icon><Plus /></el-icon>提交反馈</el-button>
        </div>
      </div>

      <div class="feed-switcher">
        <button v-for="item in feedOptions" :key="item.value" type="button" class="feed-switch" :class="{ active: queryParams.feed === item.value }" @click="changeFeed(item.value)">
          <el-icon><component :is="item.icon" /></el-icon>
          <span>{{ item.label }}</span>
          <small v-if="item.value === 'TODO' && summary.processingCount">{{ summary.processingCount }}</small>
        </button>
      </div>

      <div class="filter-panel">
        <div class="filter-panel-title"><span><el-icon><Filter /></el-icon> 筛选反馈</span><small>支持按关键字、类型、状态和来源模块组合查询</small></div>
        <el-form :inline="true" class="feedback-filter-form" @submit.prevent>
          <el-form-item class="filter-keyword">
            <el-input v-model="queryParams.keyword" clearable placeholder="搜索编号、标题或描述" @keyup.enter="handleQuery">
              <template #prefix><el-icon><Search /></el-icon></template>
            </el-input>
          </el-form-item>
          <el-form-item>
            <el-select v-model="queryParams.feedbackType" clearable placeholder="全部类型">
              <el-option v-for="item in feedbackTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-select v-model="queryParams.priority" clearable placeholder="全部优先级">
              <el-option v-for="item in priorityOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-select v-model="queryParams.status" clearable placeholder="全部状态">
              <el-option v-for="item in allStatusOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
          <el-form-item class="filter-module">
            <el-input v-model="queryParams.moduleName" clearable placeholder="来源模块" />
          </el-form-item>
          <el-form-item class="filter-actions">
            <el-button type="primary" @click="handleQuery"><el-icon><Search /></el-icon>查询</el-button>
            <el-button @click="resetQuery"><el-icon><Refresh /></el-icon>重置</el-button>
          </el-form-item>
        </el-form>
      </div>

      <div class="list-toolbar">
        <div class="list-result"><span class="result-dot"></span> 共 {{ total }} 条反馈 <span v-if="queryParams.feed !== 'ALL'">· 当前为{{ currentFeedLabel }}</span></div>
        <div class="list-hint"><el-icon><InfoFilled /></el-icon> 点击记录查看详情和处理进展</div>
      </div>

        <el-table v-loading="listLoading" :data="feedbackList" class="feedback-table" row-class-name="feedback-table-row" @row-click="openDetail">
        <el-table-column label="反馈" min-width="330">
          <template #default="scope">
            <div class="feedback-title-cell">
              <span class="feedback-type-icon" :class="`feedback-type-icon--${scope.row.feedbackType.toLowerCase()}`"><el-icon><component :is="typeIcon(scope.row.feedbackType)" /></el-icon></span>
              <div class="feedback-title-copy">
                <strong>{{ scope.row.title }}</strong>
                <span>{{ scope.row.feedbackNo || '待生成编号' }}<i v-if="scope.row.moduleName"> · {{ scope.row.moduleName }}</i></span>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="类型" width="100" align="center">
          <template #default="scope"><el-tag :type="typeTag(scope.row.feedbackType)" effect="light" round>{{ typeLabel(scope.row.feedbackType) }}</el-tag></template>
        </el-table-column>
        <el-table-column label="优先级" width="105" align="center">
          <template #default="scope"><span class="priority-label" :class="`priority-label--${scope.row.priority?.toLowerCase()}`"><i></i>{{ priorityLabel(scope.row.priority) }}</span></template>
        </el-table-column>
        <el-table-column label="状态" width="125" align="center">
          <template #default="scope"><el-tag :type="statusTag(scope.row.status)" effect="light" round>{{ statusLabel(scope.row.status) }}</el-tag></template>
        </el-table-column>
        <el-table-column label="提交人" min-width="170">
          <template #default="scope">
            <div class="people-cell"><span><el-icon><User /></el-icon>{{ scope.row.reporterName || '匿名用户' }}</span></div>
          </template>
        </el-table-column>
        <el-table-column label="最近更新" width="160" align="right">
          <template #default="scope"><span class="update-time">{{ scope.row.updateTime || scope.row.createTime || '—' }}</span></template>
        </el-table-column>
        <el-table-column label="操作" width="90" fixed="right" align="center">
          <template #default="scope"><el-button link type="primary" @click.stop="openDetail(scope.row)">查看详情</el-button></template>
        </el-table-column>
        <template #empty><el-empty :image-size="76" description="还没有反馈记录，提交第一条问题或建议吧" /></template>
      </el-table>
      <pagination v-show="total > 0" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" :total="total" @pagination="getList" />
    </el-card>

    <el-dialog v-model="handlerDialog.visible" title="配置反馈处理人" width="min(620px, 94vw)" append-to-body destroy-on-close class="feedback-handler-dialog">
      <div v-loading="handlerDialog.loading" class="handler-config-body">
        <div class="handler-config-banner"><span class="handler-config-icon"><el-icon><Setting /></el-icon></span><div><strong>统一配置处理人</strong><p>配置 2–3 名处理人后，只有这些人员可以更新状态、填写处理说明并保存处理进展。</p></div></div>
        <el-form label-position="top" class="handler-config-form">
          <el-form-item label="反馈处理人（至少 2 人，最多 3 人）">
            <el-select v-model="handlerForm.userIds" multiple filterable remote reserve-keyword collapse-tags collapse-tags-tooltip :remote-method="searchHandlerOptions" :loading="handlerOptionsLoading" placeholder="输入姓名、账号或部门搜索" style="width: 100%">
              <el-option v-for="item in handlerOptions" :key="String(item.userId)" :label="item.deptName ? `${item.userName} · ${item.deptName}` : item.userName" :value="item.userId" />
            </el-select>
          </el-form-item>
        </el-form>
        <div class="handler-config-tip"><el-icon><InfoFilled /></el-icon><span>处理人变更立即生效；历史反馈不会被重新分派。</span></div>
      </div>
      <template #footer><el-button @click="handlerDialog.visible = false">取消</el-button><el-button type="primary" :loading="handlerDialog.saving" :disabled="handlerForm.userIds.length < 2 || handlerForm.userIds.length > 3" @click="saveHandlers">保存配置</el-button></template>
    </el-dialog>

    <el-dialog v-model="createDialog.visible" title="提交问题与建议" width="min(760px, 94vw)" append-to-body destroy-on-close class="feedback-create-dialog" @closed="resetCreateForm">
      <div v-if="sourceContext.title || sourceContext.path" class="source-context-banner">
        <span class="source-context-icon"><el-icon><Link /></el-icon></span>
        <div><strong>已带入当前页面上下文</strong><span>{{ sourceContext.title || sourceContext.module || '当前页面' }}<i v-if="sourceContext.path"> · {{ sourceContext.path }}</i></span></div>
        <el-button link type="primary" @click="clearSourceContext">清除</el-button>
      </div>
      <el-form ref="createFormRef" :model="createForm" :rules="createRules" label-position="top" class="feedback-create-form">
        <div class="form-section-intro"><span class="form-step">01</span><div><strong>先告诉我们反馈类型</strong><small>选择类型后，我们会用更合适的方式跟进</small></div></div>
        <el-form-item label="反馈类型" prop="feedbackType">
          <div class="type-choice-grid">
            <button v-for="item in feedbackTypeOptions" :key="item.value" type="button" class="type-choice" :class="{ active: createForm.feedbackType === item.value }" @click="createForm.feedbackType = item.value">
              <span class="type-choice-icon"><el-icon><component :is="item.icon" /></el-icon></span><span><strong>{{ item.label }}</strong><small>{{ item.description }}</small></span><el-icon v-if="createForm.feedbackType === item.value" class="type-choice-check"><CircleCheckFilled /></el-icon>
            </button>
          </div>
        </el-form-item>
        <div class="form-section-intro"><span class="form-step">02</span><div><strong>把问题说清楚</strong><small>信息越完整，处理和回复会越快</small></div></div>
        <el-row :gutter="18">
          <el-col :span="16"><el-form-item label="标题" prop="title"><el-input v-model="createForm.title" maxlength="200" show-word-limit placeholder="例如：导入批次页面无法选择组织" /></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="优先级"><el-select v-model="createForm.priority" style="width: 100%"><el-option v-for="item in priorityOptions" :key="item.value" :label="item.label" :value="item.value" /></el-select></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="来源模块"><el-input v-model="createForm.moduleName" clearable placeholder="例如：泛微同步、业务提交" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="业务编号（可选）"><el-input v-model="createForm.businessRef" clearable placeholder="方便定位的批次号、申请号等" /></el-form-item></el-col>
        </el-row>
        <el-form-item :label="createForm.feedbackType === 'SUGGESTION' ? '建议内容 / 当前痛点' : '问题描述'" prop="description"><el-input v-model="createForm.description" type="textarea" :rows="4" maxlength="10000" show-word-limit :placeholder="createForm.feedbackType === 'SUGGESTION' ? '描述当前做法、遇到的阻碍，以及你希望怎样改进' : '描述看到的现象、影响范围和发生频率'" /></el-form-item>
        <el-collapse-transition>
          <div v-if="createForm.feedbackType !== 'SUGGESTION'" class="issue-detail-fields">
            <el-form-item label="复现步骤（可选）"><el-input v-model="createForm.reproduceSteps" type="textarea" :rows="3" maxlength="5000" placeholder="按 1、2、3 写出可以稳定复现问题的操作步骤" /></el-form-item>
            <el-row :gutter="18"><el-col :span="12"><el-form-item label="期望结果（可选）"><el-input v-model="createForm.expectedResult" type="textarea" :rows="2" maxlength="2000" placeholder="本来应该发生什么" /></el-form-item></el-col><el-col :span="12"><el-form-item label="实际结果（可选）"><el-input v-model="createForm.actualResult" type="textarea" :rows="2" maxlength="2000" placeholder="现在实际发生了什么" /></el-form-item></el-col></el-row>
          </div>
        </el-collapse-transition>
        <el-form-item label="附件（可选）"><el-upload class="feedback-uploader" multiple :show-file-list="false" :http-request="handleAttachmentUpload" :disabled="attachmentUploading || attachments.length >= 5"><el-button plain><el-icon><Paperclip /></el-icon> 添加附件</el-button><span class="upload-tip">最多 5 个，每个不超过 50MB</span></el-upload><div v-if="attachments.length" class="attachment-draft-list"><div v-for="item in attachments" :key="String(item.ossId)" class="attachment-draft"><el-icon><Document /></el-icon><span>{{ item.originalName }}</span><el-button link type="danger" @click="removeAttachment(item)"><el-icon><Delete /></el-icon></el-button></div></div></el-form-item>
      </el-form>
      <template #footer><el-button @click="createDialog.visible = false">取消</el-button><el-button v-hasPermi="['department:platformFeedback:add']" type="primary" :loading="createSaving" :disabled="attachmentUploading" @click="submitCreate"><el-icon><Promotion /></el-icon>提交反馈</el-button></template>
    </el-dialog>

    <el-drawer v-model="detailDrawer.visible" title="反馈详情" direction="rtl" size="min(620px, 94vw)" class="feedback-detail-drawer" destroy-on-close>
      <div v-loading="detailDrawer.loading" class="feedback-detail" @click.stop>
        <template v-if="detail">
          <div class="detail-heading"><div class="detail-heading-main"><span class="detail-type-label" :class="`detail-type-label--${detail.feedbackType?.toLowerCase()}`"><el-icon><component :is="typeIcon(detail.feedbackType)" /></el-icon>{{ typeLabel(detail.feedbackType) }}</span><el-tag :type="statusTag(detail.status)" effect="light" round>{{ statusLabel(detail.status) }}</el-tag><el-tag :type="priorityTag(detail.priority)" effect="plain" round>{{ priorityLabel(detail.priority) }}</el-tag></div><h2>{{ detail.title }}</h2><p>{{ detail.feedbackNo }} · {{ detail.reporterName || '匿名用户' }} · {{ detail.createTime || '刚刚' }}</p></div>
          <div v-if="detail.moduleName || detail.pagePath || detail.businessRef" class="detail-source-card"><div v-if="detail.moduleName"><span>来源模块</span><strong>{{ detail.moduleName }}</strong></div><div v-if="detail.pageTitle || detail.pagePath"><span>来源页面</span><strong>{{ detail.pageTitle || detail.pagePath }}</strong><small v-if="detail.pagePath">{{ detail.pagePath }}</small></div><div v-if="detail.businessRef"><span>业务编号</span><strong>{{ detail.businessRef }}</strong></div></div>
          <section class="detail-section"><h3><span class="section-bar"></span>反馈内容</h3><div class="detail-description">{{ detail.description }}</div></section>
          <section v-if="detail.reproduceSteps || detail.expectedResult || detail.actualResult" class="detail-section"><h3><span class="section-bar"></span>问题补充</h3><dl class="detail-facts"><template v-if="detail.reproduceSteps"><dt>复现步骤</dt><dd>{{ detail.reproduceSteps }}</dd></template><template v-if="detail.expectedResult"><dt>期望结果</dt><dd>{{ detail.expectedResult }}</dd></template><template v-if="detail.actualResult"><dt>实际结果</dt><dd>{{ detail.actualResult }}</dd></template></dl></section>
          <section v-if="detail.resolutionNote" class="detail-section"><h3><span class="section-bar section-bar--green"></span>处理说明</h3><div class="resolution-note"><el-icon><CircleCheck /></el-icon><span>{{ detail.resolutionNote }}</span></div></section>
          <section v-if="detail.attachments?.length" class="detail-section"><h3><span class="section-bar section-bar--orange"></span>附件 <small>{{ detail.attachments.length }}</small></h3><div class="attachment-list"><a v-for="item in detail.attachments" :key="String(item.ossId)" :href="item.url" target="_blank" rel="noopener"><el-icon><Document /></el-icon><span>{{ item.originalName }}</span><el-icon><Download /></el-icon></a></div></section>
          <section class="detail-section"><h3><span class="section-bar section-bar--purple"></span>处理进展</h3><el-timeline class="feedback-timeline"><el-timeline-item v-for="item in detail.activities || []" :key="String(item.id)" :timestamp="item.createTime" placement="top"><strong>{{ activityLabel(item.actionType) }}</strong><span>{{ item.actionNote }}</span><small>{{ item.operatorName || '系统' }}</small></el-timeline-item><el-timeline-item v-if="!detail.activities?.length" timestamp="暂无记录"><span>提交后，处理进展会显示在这里</span></el-timeline-item></el-timeline></section>
          <section class="detail-section comments-section"><div class="section-heading-row"><h3><span class="section-bar section-bar--blue"></span>沟通记录 <small>{{ commentTotal }}</small></h3></div><div v-loading="commentsLoading" class="comment-list"> <div v-for="item in comments" :key="String(item.id)" class="comment-item"><el-avatar :size="32">{{ avatarText(item.authorName) }}</el-avatar><div><div class="comment-author"><strong>{{ item.authorName || '匿名用户' }}</strong><span>{{ item.createTime }}</span></div><p>{{ item.content }}</p></div></div><el-empty v-if="!comments.length && !commentsLoading" :image-size="54" description="还没有沟通记录" /></div><div v-hasPermi="['department:platformFeedback:comment']" class="comment-composer"><el-input v-model="commentForm.content" type="textarea" :rows="3" maxlength="4000" show-word-limit placeholder="补充信息、回复处理进展或提出新的建议" /><div><span>保持信息清晰，方便后续追踪</span><el-button type="primary" size="small" :loading="commentSaving" @click="submitComment">发送评论</el-button></div></div></section>
          <section class="detail-section process-section"><div class="section-heading-row"><h3><span class="section-bar section-bar--orange"></span>处理反馈</h3><span class="process-tip">仅已配置的处理人可保存</span></div><template v-if="detail.processAllowed"><el-form label-position="top" class="process-form"><el-form-item label="更新状态"><el-select v-model="processForm.status" style="width: 100%"><el-option v-for="item in detailStatusOptions" :key="item.value" :label="item.label" :value="item.value" /></el-select></el-form-item><el-form-item label="处理说明"><el-input v-model="processForm.note" type="textarea" :rows="3" maxlength="2000" placeholder="记录判断、处理结果或下一步计划" /></el-form-item><el-button type="primary" :loading="processSaving" @click="submitProcess">保存处理进展</el-button></el-form></template><el-alert v-else type="info" :closable="false" show-icon title="当前账号未配置为反馈处理人，暂无处理权限" /></section>
        </template>
      </div>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import type { FormInstance, FormRules, UploadRequestOptions } from 'element-plus';
import { ElMessage } from 'element-plus';
import { ChatDotRound, ChatLineRound, CircleCheck, CircleCheckFilled, CollectionTag, Delete, Document, Download, Filter, InfoFilled, Link, Message, Operation, Paperclip, Plus, Promotion, QuestionFilled, Refresh, Search, Setting, User, Warning } from '@element-plus/icons-vue';
import { addPlatformFeedback, addPlatformFeedbackComment, getPlatformFeedback, getPlatformFeedbackHandlers, getPlatformFeedbackSummary, listPlatformFeedback, listPlatformFeedbackActivities, listPlatformFeedbackAssigneeOptions, listPlatformFeedbackComments, processPlatformFeedback, updatePlatformFeedbackHandlers, uploadPlatformFeedbackAttachment } from '@/api/department/platformFeedback';
import type { PlatformFeedbackActivityVO, PlatformFeedbackAttachmentVO, PlatformFeedbackCommentVO, PlatformFeedbackForm, PlatformFeedbackProcessForm, PlatformFeedbackQuery, PlatformFeedbackSummaryVO, PlatformFeedbackUserOptionVO, PlatformFeedbackVO } from '@/api/department/platformFeedback/types';
import { useRoute } from 'vue-router';

const route = useRoute();
const listLoading = ref(false);
const total = ref(0);
const feedbackList = ref<PlatformFeedbackVO[]>([]);
const summary = reactive<PlatformFeedbackSummaryVO>({ totalCount: 0, pendingCount: 0, processingCount: 0, waitingCount: 0, closedCount: 0, suggestionCount: 0 });
const queryParams = reactive<PlatformFeedbackQuery>({ pageNum: 1, pageSize: 10, keyword: undefined, feedbackType: undefined, priority: undefined, status: undefined, moduleName: undefined, feed: 'ALL' });
const createFormRef = ref<FormInstance>();
const createSaving = ref(false);
const attachmentUploading = ref(false);
const attachments = ref<PlatformFeedbackAttachmentVO[]>([]);
const createDialog = reactive({ visible: false });
const createForm = reactive<PlatformFeedbackForm>(createEmptyForm());
const detailDrawer = reactive({ visible: false, loading: false });
const detail = ref<PlatformFeedbackVO>();
const comments = ref<PlatformFeedbackCommentVO[]>([]);
const commentTotal = ref(0);
const commentsLoading = ref(false);
const commentSaving = ref(false);
const commentForm = reactive({ content: '' });
const activitiesLoading = ref(false);
const processSaving = ref(false);
const processForm = reactive<PlatformFeedbackProcessForm>({ id: '', status: '', note: '' });
const handlerDialog = reactive({ visible: false, loading: false, saving: false });
const handlerForm = reactive<{ userIds: Array<string | number> }>({ userIds: [] });
const handlerOptions = ref<PlatformFeedbackUserOptionVO[]>([]);
const configuredHandlers = ref<PlatformFeedbackUserOptionVO[]>([]);
const handlerOptionsLoading = ref(false);
let handlerSearchSequence = 0;

const sourceContext = reactive({ title: '', module: '', path: '' });

const feedbackTypeOptions = [
  { value: 'SYSTEM', label: '系统问题', description: '功能异常、页面报错', icon: Warning },
  { value: 'DATA', label: '数据问题', description: '数据缺失、结果不正确', icon: CollectionTag },
  { value: 'PROCESS', label: '流程问题', description: '操作步骤、业务流转', icon: Operation },
  { value: 'QUESTION', label: '使用疑问', description: '不知道如何操作', icon: QuestionFilled },
  { value: 'SUGGESTION', label: '改进建议', description: '效率、体验和功能想法', icon: Message }
];
const priorityOptions = [{ value: 'LOW', label: '低优先级' }, { value: 'NORMAL', label: '普通' }, { value: 'HIGH', label: '高优先级' }, { value: 'URGENT', label: '紧急' }];
const issueStatusOptions = [{ value: 'PENDING', label: '待处理' }, { value: 'PROCESSING', label: '处理中' }, { value: 'WAITING_CONFIRM', label: '待确认' }, { value: 'CLOSED', label: '已关闭' }, { value: 'REJECTED', label: '不予处理' }, { value: 'DUPLICATE', label: '重复反馈' }];
const suggestionStatusOptions = [{ value: 'PENDING', label: '待处理' }, { value: 'EVALUATING', label: '评估中' }, { value: 'ACCEPTED', label: '已采纳' }, { value: 'DEFERRED', label: '暂缓处理' }, { value: 'NOT_ACCEPTED', label: '暂不采纳' }, { value: 'CLOSED', label: '已关闭' }];
const allStatusOptions = [...issueStatusOptions, ...suggestionStatusOptions.filter(item => !issueStatusOptions.some(existing => existing.value === item.value))];
const feedOptions = [{ value: 'ALL', label: '全部反馈', icon: CollectionTag }, { value: 'MINE', label: '我的提交', icon: User }, { value: 'TODO', label: '待我处理', icon: Warning }, { value: 'FOLLOWING', label: '我关注的', icon: ChatLineRound }];
const createRules: FormRules<PlatformFeedbackForm> = { feedbackType: [{ required: true, message: '请选择反馈类型', trigger: 'change' }], title: [{ required: true, message: '请输入反馈标题', trigger: 'blur' }], description: [{ required: true, message: '请描述问题或建议内容', trigger: 'blur' }] };

const summaryCards = computed(() => [
  { key: 'total', label: '全部反馈', value: summary.totalCount, caption: '当前可见记录', tone: 'blue', icon: CollectionTag },
  { key: 'pending', label: '待处理', value: summary.pendingCount, caption: '等待响应', tone: 'orange', icon: Warning },
  { key: 'processing', label: '处理中', value: summary.processingCount, caption: '正在跟进', tone: 'purple', icon: Setting },
  { key: 'waiting', label: '待确认', value: summary.waitingCount, caption: '等待反馈人确认', tone: 'teal', icon: CircleCheck },
  { key: 'closed', label: '已关闭', value: summary.closedCount, caption: '已完成闭环', tone: 'green', icon: CircleCheckFilled },
  { key: 'suggestion', label: '改进建议', value: summary.suggestionCount, caption: '持续收集想法', tone: 'pink', icon: Message }
]);
const currentFeedLabel = computed(() => feedOptions.find(item => item.value === queryParams.feed)?.label || '全部反馈');
const detailStatusOptions = computed(() => detail.value?.feedbackType === 'SUGGESTION' ? suggestionStatusOptions : issueStatusOptions);

function createEmptyForm(): PlatformFeedbackForm {
  return { feedbackType: 'SYSTEM', title: '', description: '', moduleName: '', pageTitle: '', pagePath: '', businessRef: '', reproduceSteps: '', expectedResult: '', actualResult: '', impactScope: 'SELF', priority: 'NORMAL', attachmentOssIds: '' };
}

function readRouteContext() {
  sourceContext.title = String(route.query.sourceTitle || '');
  sourceContext.module = String(route.query.sourceModule || '');
  sourceContext.path = String(route.query.sourcePath || '');
}

async function getList() {
  listLoading.value = true;
  try {
    const res = await listPlatformFeedback(queryParams);
    feedbackList.value = res.data?.rows || [];
    total.value = res.data?.total || 0;
  } finally {
    listLoading.value = false;
  }
}

async function getSummary() {
  try {
    const res = await getPlatformFeedbackSummary();
    Object.assign(summary, res.data || {});
  } catch {
    // 汇总失败不影响列表使用。
  }
}

function mergeHandlerOptions(items: PlatformFeedbackUserOptionVO[]) {
  const merged = [...configuredHandlers.value, ...items];
  const seen = new Set<string>();
  handlerOptions.value = merged.filter(item => {
    const key = String(item.userId);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 50);
}

async function searchHandlerOptions(keyword = '') {
  const sequence = ++handlerSearchSequence;
  handlerOptionsLoading.value = true;
  try {
    const res = await listPlatformFeedbackAssigneeOptions(keyword.trim());
    if (sequence === handlerSearchSequence) mergeHandlerOptions(res.data || []);
  } catch {
    if (sequence === handlerSearchSequence) mergeHandlerOptions([]);
  } finally {
    if (sequence === handlerSearchSequence) handlerOptionsLoading.value = false;
  }
}

async function openHandlerDialog() {
  handlerDialog.visible = true;
  handlerDialog.loading = true;
  try {
    const [configuredRes, optionsRes] = await Promise.all([getPlatformFeedbackHandlers(), listPlatformFeedbackAssigneeOptions('')]);
    configuredHandlers.value = configuredRes.data || [];
    handlerForm.userIds = configuredHandlers.value.map(item => item.userId);
    mergeHandlerOptions(optionsRes.data || []);
  } finally {
    handlerDialog.loading = false;
  }
}

async function saveHandlers() {
  if (handlerForm.userIds.length < 2 || handlerForm.userIds.length > 3) {
    ElMessage.warning('请配置2至3名反馈处理人');
    return;
  }
  handlerDialog.saving = true;
  try {
    await updatePlatformFeedbackHandlers(handlerForm.userIds);
    ElMessage.success('反馈处理人配置已保存');
    configuredHandlers.value = handlerOptions.value.filter(item => handlerForm.userIds.some(id => String(id) === String(item.userId)));
    handlerDialog.visible = false;
  } finally {
    handlerDialog.saving = false;
  }
}

function handleQuery() {
  queryParams.pageNum = 1;
  void getList();
}

function resetQuery() {
  Object.assign(queryParams, { pageNum: 1, keyword: undefined, feedbackType: undefined, priority: undefined, status: undefined, moduleName: undefined, feed: 'ALL' });
  void getList();
}

function changeFeed(feed: string) {
  queryParams.feed = feed as PlatformFeedbackQuery['feed'];
  handleQuery();
}

function openCreate() {
  Object.assign(createForm, createEmptyForm(), { moduleName: sourceContext.module, pageTitle: sourceContext.title, pagePath: sourceContext.path });
  attachments.value = [];
  createDialog.visible = true;
}

function resetCreateForm() {
  createFormRef.value?.resetFields();
  attachments.value = [];
}

function clearSourceContext() {
  Object.assign(sourceContext, { title: '', module: '', path: '' });
}

async function handleAttachmentUpload(options: UploadRequestOptions) {
  if (attachments.value.length >= 5) {
    ElMessage.warning('最多上传5个附件');
    return;
  }
  const file = options.file as File;
  if (file.size > 50 * 1024 * 1024) {
    ElMessage.error('附件不能超过50MB');
    return;
  }
  attachmentUploading.value = true;
  try {
    const formData = new FormData();
    formData.append('file', file);
    const res = await uploadPlatformFeedbackAttachment(formData);
    if (res.data) {
      attachments.value.push(res.data);
      options.onSuccess?.(res.data);
    }
  } catch (error) {
    options.onError?.(error as any);
    ElMessage.error('附件上传失败，请稍后重试');
  } finally {
    attachmentUploading.value = false;
  }
}

function removeAttachment(item: PlatformFeedbackAttachmentVO) {
  attachments.value = attachments.value.filter(existing => String(existing.ossId) !== String(item.ossId));
}

async function submitCreate() {
  const valid = await createFormRef.value?.validate().catch(() => false);
  if (!valid || attachmentUploading.value) return;
  createSaving.value = true;
  try {
    createForm.attachmentOssIds = attachments.value.map(item => String(item.ossId)).join(',');
    await addPlatformFeedback(createForm);
    ElMessage.success('反馈已提交，后续处理进展会在这里更新');
    createDialog.visible = false;
    await Promise.all([getList(), getSummary()]);
  } finally {
    createSaving.value = false;
  }
}

async function openDetail(row: PlatformFeedbackVO | Record<string, any>) {
  const feedback = row as PlatformFeedbackVO;
  const feedbackId = feedback?.id;
  if (feedbackId === undefined || feedbackId === null || feedbackId === '') {
    ElMessage.error('反馈记录缺少编号，无法查看详情');
    return;
  }

  detailDrawer.visible = true;
  // 列表数据已经足够支撑抽屉先打开，避免被详情接口的慢查询阻塞。
  detailDrawer.loading = false;
  detail.value = { ...feedback };
  commentForm.content = '';
  processForm.id = feedbackId;
  processForm.status = feedback.status || 'PENDING';
  processForm.note = '';

  const detailRequest = getPlatformFeedback(feedbackId)
    .then(res => {
      // 抽屉可能已经切换到另一条记录，旧请求不能覆盖当前详情。
      if (!detailDrawer.visible || String(detail.value?.id) !== String(feedbackId)) return;
      const loaded = res.data;
      if (!loaded) return;
      const activities = detail.value?.activities || [];
      detail.value = { ...detail.value, ...loaded, activities: loaded.activities?.length ? loaded.activities : activities };
      processForm.id = detail.value.id;
      processForm.status = detail.value.status || 'PENDING';
    })
    .catch(() => {
      // 请求失败时保留列表基础信息，避免详情接口异常导致页面无响应。
    });

  // 评论、操作记录与主体详情互不阻塞，分别显示各自的加载状态。
  void Promise.allSettled([detailRequest, loadComments(feedbackId), loadActivities(feedbackId)]);
}

async function loadComments(id: string | number) {
  commentsLoading.value = true;
  try {
    const res = await listPlatformFeedbackComments(id, { pageNum: 1, pageSize: 50 });
    if (String(detail.value?.id) !== String(id)) return;
    comments.value = res.data?.rows || [];
    commentTotal.value = res.data?.total || 0;
  } catch {
    if (String(detail.value?.id) !== String(id)) return;
    comments.value = [];
    commentTotal.value = 0;
  } finally {
    commentsLoading.value = false;
  }
}

async function loadActivities(id: string | number) {
  activitiesLoading.value = true;
  try {
    const res = await listPlatformFeedbackActivities(id);
    if (String(detail.value?.id) === String(id) && detail.value) detail.value.activities = res.data || [];
  } catch {
    if (String(detail.value?.id) === String(id) && detail.value) detail.value.activities = [];
  } finally {
    activitiesLoading.value = false;
  }
}

async function submitComment() {
  if (!detail.value || !commentForm.content.trim()) {
    ElMessage.warning('请输入评论内容');
    return;
  }
  commentSaving.value = true;
  try {
    await addPlatformFeedbackComment(detail.value.id, { content: commentForm.content.trim() });
    commentForm.content = '';
    await Promise.all([loadComments(detail.value.id), loadActivities(detail.value.id)]);
    ElMessage.success('评论已发送');
  } finally {
    commentSaving.value = false;
  }
}

async function submitProcess() {
  if (!detail.value) return;
  processSaving.value = true;
  try {
    await processPlatformFeedback({ ...processForm, id: detail.value.id });
    ElMessage.success('处理进展已保存');
    const id = detail.value.id;
    await Promise.all([openDetail({ id } as PlatformFeedbackVO), getList(), getSummary()]);
  } finally {
    processSaving.value = false;
  }
}

function typeLabel(type?: string) {
  return feedbackTypeOptions.find(item => item.value === type)?.label || '反馈';
}

function typeIcon(type?: string) {
  return feedbackTypeOptions.find(item => item.value === type)?.icon || ChatDotRound;
}

function typeTag(type?: string) {
  return type === 'SUGGESTION' ? 'success' : type === 'SYSTEM' ? 'danger' : type === 'QUESTION' ? 'warning' : 'primary';
}

function priorityLabel(priority?: string) {
  return priorityOptions.find(item => item.value === priority)?.label || '普通';
}

function priorityTag(priority?: string) {
  return priority === 'URGENT' ? 'danger' : priority === 'HIGH' ? 'warning' : 'info';
}

function statusLabel(status?: string) {
  return allStatusOptions.find(item => item.value === status)?.label || '待处理';
}

function statusTag(status?: string) {
  if (['CLOSED', 'ACCEPTED'].includes(status || '')) return 'success';
  if (['REJECTED', 'NOT_ACCEPTED', 'DUPLICATE'].includes(status || '')) return 'info';
  if (['WAITING_CONFIRM', 'DEFERRED'].includes(status || '')) return 'warning';
  return 'primary';
}

function activityLabel(action?: string) {
  return ({ CREATED: '提交反馈', ASSIGNED: '负责人变更', STATUS_CHANGED: '状态更新', NOTE: '补充处理说明', COMMENT: '新增沟通记录' } as Record<string, string>)[action || ''] || '更新记录';
}

function avatarText(name?: string) {
  return (name || '匿').slice(0, 1);
}

onMounted(async () => {
  readRouteContext();
  await Promise.all([getList(), getSummary()]);
  if (String(route.query.mode || '') === 'create') openCreate();
  if (route.query.id && feedbackList.value.length) {
    const row = feedbackList.value.find(item => String(item.id) === String(route.query.id));
    if (row) await openDetail(row);
  }
});
</script>

<style lang="scss" scoped>
.platform-feedback-page {
  min-height: calc(100vh - 84px);
  color: var(--app-text-title, #172b4d);
  background: transparent;
  --feedback-blue: #3b82f6;
  --feedback-blue-soft: #eaf4ff;
  --feedback-border: #e7edf5;
  --feedback-muted: #8a99ad;
}

.feedback-hero {
  min-height: 215px;
  padding: 32px 38px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 30px;
  overflow: hidden;
  border: 1px solid rgba(92, 151, 228, 0.18);
  border-radius: 22px;
  color: #f8fbff;
  background: radial-gradient(circle at 86% 12%, rgba(119, 202, 255, 0.32), transparent 23%), radial-gradient(circle at 78% 90%, rgba(75, 211, 192, 0.22), transparent 28%), linear-gradient(115deg, #142949 0%, #245285 54%, #28717b 100%);
  box-shadow: 0 18px 38px rgba(38, 79, 122, 0.16);
  position: relative;
}

.feedback-hero::after { content: ''; position: absolute; width: 310px; height: 310px; right: 21%; top: -180px; border: 1px solid rgba(255, 255, 255, 0.12); border-radius: 50%; box-shadow: 0 0 0 30px rgba(255, 255, 255, 0.035), 0 0 0 60px rgba(255, 255, 255, 0.025); pointer-events: none; }
.hero-copy, .hero-actions { position: relative; z-index: 1; }
.hero-copy { max-width: 680px; }
.hero-kicker, .section-kicker { display: inline-flex; align-items: center; gap: 7px; font-size: 11px; letter-spacing: 1.8px; font-weight: 800; }
.hero-kicker { color: #9dd5ff; }
.hero-copy h1 { margin: 12px 0 8px; color: #fff; font-size: 30px; line-height: 1.2; letter-spacing: -0.7px; }
.hero-copy p { margin: 0; color: rgba(229, 243, 255, 0.78); font-size: 14px; line-height: 1.8; }
.hero-pills { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 24px; }
.hero-pills span { display: inline-flex; align-items: center; gap: 6px; padding: 6px 11px; color: rgba(239, 248, 255, 0.82); border: 1px solid rgba(255, 255, 255, 0.16); border-radius: 20px; background: rgba(255, 255, 255, 0.08); font-size: 12px; }
.hero-actions { min-width: 310px; padding: 20px; display: grid; grid-template-columns: auto 1fr; gap: 10px 14px; align-items: center; border: 1px solid rgba(255, 255, 255, 0.2); border-radius: 17px; background: rgba(255, 255, 255, 0.1); backdrop-filter: blur(12px); }
.hero-actions > div:nth-child(2) { display: flex; flex-direction: column; gap: 4px; }
.hero-actions strong { font-size: 15px; }
.hero-actions div span { color: rgba(237, 248, 255, 0.68); font-size: 12px; }
.hero-mark { width: 44px; height: 44px; display: inline-flex; align-items: center; justify-content: center; color: #c5e8ff; border-radius: 13px; background: rgba(185, 229, 255, 0.18); font-size: 21px; }

.summary-grid { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 12px; margin: 16px 0; }
.summary-card { min-height: 96px; padding: 16px 15px; display: flex; align-items: center; gap: 11px; position: relative; overflow: hidden; border: 1px solid var(--feedback-border); border-radius: 15px; background: var(--app-surface-bg, #fff); box-shadow: 0 6px 18px rgba(38, 71, 105, 0.04); }
.summary-card::after { content: ''; width: 74px; height: 74px; position: absolute; right: -23px; bottom: -30px; border-radius: 50%; background: currentColor; opacity: .05; }
.summary-icon { width: 36px; height: 36px; flex: 0 0 36px; display: inline-flex; align-items: center; justify-content: center; border-radius: 11px; background: currentColor; color: inherit; font-size: 18px; }
.summary-icon .el-icon { color: #fff; }
.summary-content { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
.summary-content strong { color: inherit; font-size: 25px; line-height: 1; }
.summary-content span { color: var(--app-text-regular, #53657a); font-size: 12px; white-space: nowrap; }
.summary-caption { margin-left: auto; align-self: flex-end; color: var(--feedback-muted); font-size: 10px; white-space: nowrap; }
.summary-card--blue { color: #4585df; } .summary-card--orange { color: #dc9637; } .summary-card--purple { color: #8c70d7; } .summary-card--teal { color: #2caaa5; } .summary-card--green { color: #4eaa73; } .summary-card--pink { color: #d46191; }

.feedback-workspace { border: 1px solid var(--feedback-border); border-radius: 20px; background: var(--app-surface-bg, #fff); }
.workspace-heading { min-height: 79px; display: flex; align-items: center; justify-content: space-between; gap: 20px; padding: 3px 4px 20px; border-bottom: 1px solid var(--feedback-border); }
.section-kicker { color: #65a9ec; }
.workspace-heading h2 { margin: 6px 0 3px; font-size: 21px; }
.workspace-heading p { margin: 0; color: var(--feedback-muted); font-size: 12px; }
.workspace-tools { display: flex; gap: 10px; }
.feed-switcher { display: flex; gap: 4px; margin: 18px 0; padding: 5px; border: 1px solid var(--feedback-border); border-radius: 13px; background: var(--app-elevated-soft-bg, #f7f9fc); }
.feed-switch { height: 38px; padding: 0 17px; display: inline-flex; align-items: center; gap: 8px; border: 0; border-radius: 9px; color: var(--feedback-muted); background: transparent; cursor: pointer; font-size: 13px; transition: all .2s ease; }
.feed-switch:hover { color: var(--feedback-blue); background: rgba(59, 130, 246, .06); }
.feed-switch.active { color: var(--feedback-blue); background: var(--app-surface-bg, #fff); box-shadow: 0 4px 12px rgba(49, 91, 142, .09); font-weight: 700; }
.feed-switch small { min-width: 18px; padding: 2px 5px; color: #fff; border-radius: 9px; background: #f19a4a; font-size: 10px; }
.filter-panel { padding: 16px 17px 8px; border: 1px solid #dfeaf6; border-radius: 15px; background: linear-gradient(135deg, #f7fbff, #f9fbfd); }
.filter-panel-title { display: flex; align-items: center; gap: 11px; margin-bottom: 13px; color: #385873; }
.filter-panel-title > span { display: inline-flex; align-items: center; gap: 7px; font-size: 13px; font-weight: 700; }
.filter-panel-title small { color: var(--feedback-muted); font-size: 11px; }
.feedback-filter-form { display: flex; flex-wrap: wrap; gap: 0 10px; align-items: center; }
.feedback-filter-form .el-form-item { margin: 0 0 9px; }
.feedback-filter-form .el-input, .feedback-filter-form .el-select { width: 170px; }
.feedback-filter-form .filter-keyword .el-input { width: 260px; }
.feedback-filter-form .filter-module .el-input { width: 145px; }
.feedback-filter-form .filter-actions { margin-left: auto; }
.list-toolbar { min-height: 42px; display: flex; align-items: center; justify-content: space-between; color: var(--feedback-muted); font-size: 12px; }
.list-result { display: inline-flex; align-items: center; gap: 6px; }.result-dot { width: 6px; height: 6px; border-radius: 50%; background: #65b8ee; box-shadow: 0 0 0 4px #eaf6ff; }.list-hint { display: inline-flex; align-items: center; gap: 5px; }
.feedback-table { width: 100%; border: 1px solid var(--feedback-border); border-radius: 14px; overflow: hidden; }
.feedback-title-cell { display: flex; align-items: center; gap: 12px; min-width: 0; }.feedback-type-icon { width: 36px; height: 36px; flex: 0 0 36px; display: inline-flex; align-items: center; justify-content: center; border-radius: 11px; font-size: 17px; }.feedback-type-icon--system { color: #e26b6b; background: #fff0ef; }.feedback-type-icon--data { color: #5e8fe5; background: #eef5ff; }.feedback-type-icon--process { color: #9a70d5; background: #f4efff; }.feedback-type-icon--question { color: #d99539; background: #fff7e8; }.feedback-type-icon--suggestion { color: #46a878; background: #ecfaf3; }
.feedback-title-copy { display: flex; flex-direction: column; gap: 5px; min-width: 0; }.feedback-title-copy strong { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--app-text-title, #1e3554); font-size: 13px; }.feedback-title-copy span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--feedback-muted); font-size: 11px; }.feedback-title-copy i { font-style: normal; }
.priority-label { display: inline-flex; align-items: center; gap: 5px; color: #8090a3; font-size: 12px; }.priority-label i { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }.priority-label--urgent { color: #e05c68; }.priority-label--high { color: #e49a3b; }.priority-label--normal { color: #5b9ce0; }.priority-label--low { color: #8da0b4; }
.people-cell { display: flex; flex-direction: column; gap: 5px; font-size: 12px; }.people-cell span { display: inline-flex; align-items: center; gap: 5px; color: var(--app-text-regular, #53657a); }.people-cell .assignee { color: #6a88ac; }.people-cell .unassigned { color: #aab5c1; }.update-time { color: var(--feedback-muted); font-size: 11px; }

.source-context-banner { min-height: 54px; padding: 10px 13px; display: flex; align-items: center; gap: 10px; margin-bottom: 18px; border: 1px solid #cfe6fb; border-radius: 12px; background: #f3f9ff; }.source-context-icon { width: 31px; height: 31px; display: inline-flex; align-items: center; justify-content: center; color: #4e9de4; border-radius: 9px; background: #e1f1ff; }.source-context-banner > div { flex: 1; display: flex; flex-direction: column; gap: 3px; }.source-context-banner strong { color: #37618b; font-size: 12px; }.source-context-banner span { overflow: hidden; color: #8094a9; font-size: 11px; text-overflow: ellipsis; white-space: nowrap; }.source-context-banner i { font-style: normal; }
.form-section-intro { display: flex; align-items: center; gap: 10px; margin: 8px 0 14px; }.form-step { width: 28px; height: 28px; display: inline-flex; align-items: center; justify-content: center; color: #539ce4; border-radius: 9px; background: #edf6ff; font-size: 11px; font-weight: 800; }.form-section-intro div { display: flex; flex-direction: column; gap: 3px; }.form-section-intro strong { font-size: 13px; }.form-section-intro small { color: var(--feedback-muted); font-size: 11px; }
.type-choice-grid { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 9px; width: 100%; }.type-choice { min-height: 87px; padding: 11px 9px; display: flex; flex-direction: column; align-items: flex-start; gap: 8px; position: relative; border: 1px solid var(--feedback-border); border-radius: 12px; color: var(--app-text-regular, #53657a); background: var(--app-surface-bg, #fff); text-align: left; cursor: pointer; transition: all .2s ease; }.type-choice:hover, .type-choice.active { border-color: #79b9f2; background: #f3f9ff; box-shadow: 0 5px 14px rgba(74, 145, 216, .1); }.type-choice-icon { width: 27px; height: 27px; display: inline-flex; align-items: center; justify-content: center; color: #5d9de0; border-radius: 8px; background: #edf6ff; }.type-choice:nth-child(1) .type-choice-icon { color: #df6b6b; background: #fff0ef; }.type-choice:nth-child(2) .type-choice-icon { color: #5d8fe0; background: #edf4ff; }.type-choice:nth-child(3) .type-choice-icon { color: #966ed0; background: #f4efff; }.type-choice:nth-child(4) .type-choice-icon { color: #d4963c; background: #fff7e8; }.type-choice:nth-child(5) .type-choice-icon { color: #48a779; background: #ecfaf3; }.type-choice > span:nth-child(2) { display: flex; flex-direction: column; gap: 3px; }.type-choice strong { font-size: 12px; }.type-choice small { color: var(--feedback-muted); font-size: 10px; white-space: nowrap; }.type-choice-check { position: absolute; top: 9px; right: 8px; color: #4b9ce5; }
.feedback-uploader { display: flex; align-items: center; gap: 10px; }.upload-tip { color: var(--feedback-muted); font-size: 11px; }.attachment-draft-list { display: flex; flex-direction: column; gap: 6px; margin-top: 9px; }.attachment-draft { min-height: 32px; padding: 3px 7px 3px 10px; display: flex; align-items: center; gap: 7px; border: 1px solid var(--feedback-border); border-radius: 8px; color: var(--app-text-regular, #53657a); background: var(--app-elevated-soft-bg, #f8fafc); font-size: 12px; }.attachment-draft span { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }.feedback-create-form :deep(.el-form-item__label) { color: var(--app-text-regular, #53657a); font-size: 12px; font-weight: 600; }.feedback-create-form :deep(.el-input__wrapper), .feedback-create-form :deep(.el-textarea__inner) { border-radius: 10px; }

.feedback-detail { min-height: 100%; padding-bottom: 25px; }.detail-heading { padding-bottom: 17px; border-bottom: 1px solid var(--feedback-border); }.detail-heading-main { display: flex; align-items: center; gap: 8px; }.detail-type-label { display: inline-flex; align-items: center; gap: 5px; color: #5d9ee0; font-size: 12px; font-weight: 700; }.detail-type-label--system { color: #df6b6b; }.detail-type-label--suggestion { color: #45a777; }.detail-heading h2 { margin: 13px 0 7px; font-size: 20px; line-height: 1.45; }.detail-heading p { margin: 0; color: var(--feedback-muted); font-size: 11px; }.detail-source-card { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; margin-top: 17px; padding: 13px; border: 1px solid #e1ebf5; border-radius: 12px; background: #f7fbff; }.detail-source-card div { display: flex; flex-direction: column; gap: 4px; min-width: 0; }.detail-source-card span { color: var(--feedback-muted); font-size: 10px; }.detail-source-card strong, .detail-source-card small { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 11px; }.detail-source-card small { color: #8ea0b2; font-size: 10px; }.detail-section { margin-top: 21px; }.detail-section h3 { display: flex; align-items: center; gap: 8px; margin: 0 0 11px; font-size: 14px; }.detail-section h3 small { color: var(--feedback-muted); font-size: 11px; font-weight: 400; }.section-bar { width: 3px; height: 16px; display: inline-block; border-radius: 4px; background: #5da8e8; }.section-bar--green { background: #59b47f; }.section-bar--orange { background: #e8a34e; }.section-bar--purple { background: #9676d7; }.section-bar--blue { background: #4f9fe4; }.detail-description { color: var(--app-text-regular, #53657a); font-size: 13px; line-height: 1.85; white-space: pre-wrap; }.detail-facts { margin: 0; display: grid; grid-template-columns: 78px 1fr; gap: 9px 11px; color: var(--app-text-regular, #53657a); font-size: 12px; }.detail-facts dt { color: var(--feedback-muted); }.detail-facts dd { margin: 0; white-space: pre-wrap; line-height: 1.6; }.resolution-note { padding: 11px 13px; display: flex; gap: 8px; color: #3a8a60; border: 1px solid #d4efdf; border-radius: 10px; background: #f1fbf5; font-size: 12px; line-height: 1.6; }.attachment-list { display: flex; flex-direction: column; gap: 7px; }.attachment-list a { padding: 8px 10px; display: flex; align-items: center; gap: 8px; color: #568bbd; border: 1px solid var(--feedback-border); border-radius: 8px; text-decoration: none; font-size: 12px; }.attachment-list a span { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }.feedback-timeline { padding-left: 3px; }.feedback-timeline :deep(.el-timeline-item__timestamp) { color: var(--feedback-muted); font-size: 10px; }.feedback-timeline strong, .feedback-timeline span, .feedback-timeline small { display: block; }.feedback-timeline strong { margin-bottom: 4px; font-size: 12px; }.feedback-timeline span { color: var(--app-text-regular, #53657a); font-size: 12px; line-height: 1.6; }.feedback-timeline small { margin-top: 4px; color: var(--feedback-muted); font-size: 10px; }.comment-list { min-height: 40px; display: flex; flex-direction: column; gap: 12px; }.comment-item { display: flex; gap: 9px; }.comment-item :deep(.el-avatar) { flex: 0 0 auto; color: #4d94d5; background: #eaf5ff; }.comment-author { display: flex; align-items: center; gap: 9px; }.comment-author strong { font-size: 12px; }.comment-author span { color: var(--feedback-muted); font-size: 10px; }.comment-item p { margin: 4px 0 0; color: var(--app-text-regular, #53657a); font-size: 12px; line-height: 1.6; white-space: pre-wrap; }.comment-composer { margin-top: 15px; padding: 11px; border: 1px solid var(--feedback-border); border-radius: 10px; background: var(--app-elevated-soft-bg, #f8fafc); }.comment-composer > div { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-top: 8px; color: var(--feedback-muted); font-size: 10px; }.comment-composer :deep(.el-textarea__inner) { border: 0; background: transparent; box-shadow: none; }.process-section { padding: 15px; border: 1px solid #f0e2cc; border-radius: 13px; background: #fffaf3; }.section-heading-row { display: flex; align-items: center; justify-content: space-between; gap: 10px; }.process-tip { color: #b3926d; font-size: 10px; }.process-form :deep(.el-form-item) { margin-bottom: 9px; }.process-form :deep(.el-form-item__label) { margin-bottom: 4px; color: #8e7556; font-size: 11px; }.process-form :deep(.el-input__wrapper), .process-form :deep(.el-textarea__inner) { border-color: #efdfc7; border-radius: 9px; }

@media (max-width: 1280px) { .summary-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }.feedback-filter-form .filter-actions { margin-left: 0; } }
@media (max-width: 900px) { .feedback-hero { align-items: flex-start; flex-direction: column; padding: 25px; }.hero-actions { width: 100%; min-width: 0; box-sizing: border-box; }.workspace-heading { align-items: flex-start; flex-direction: column; }.workspace-tools { width: 100%; }.workspace-tools .el-button { flex: 1; }.type-choice-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }.filter-panel-title small, .list-hint { display: none; }.feedback-filter-form .el-input, .feedback-filter-form .filter-keyword .el-input, .feedback-filter-form .el-select, .feedback-filter-form .filter-module .el-input { width: 100%; }.feedback-filter-form .el-form-item { flex: 1 1 180px; }.feedback-filter-form .filter-actions { flex: 0 0 auto; } }
@media (max-width: 600px) { .summary-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }.summary-caption { display: none; }.hero-pills { gap: 6px; }.hero-pills span { font-size: 11px; }.feed-switch { padding: 0 10px; }.feed-switch span { font-size: 12px; }.type-choice-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }.detail-source-card { grid-template-columns: 1fr; }.detail-facts { grid-template-columns: 66px 1fr; } }

:global(html.dark .platform-feedback-page) {
  --feedback-border: rgba(100, 116, 139, 0.34);
  --feedback-muted: #94a3b8;
  color: #e5edf8;
}

:global(html.dark .platform-feedback-page .summary-card),
:global(html.dark .platform-feedback-page .feedback-workspace) {
  border-color: var(--feedback-border);
  background: var(--app-surface-bg, #111827);
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.15);
}

:global(html.dark .platform-feedback-page .summary-content span),
:global(html.dark .platform-feedback-page .workspace-heading p),
:global(html.dark .platform-feedback-page .feedback-title-copy span),
:global(html.dark .platform-feedback-page .people-cell span),
:global(html.dark .platform-feedback-page .detail-description),
:global(html.dark .platform-feedback-page .detail-facts),
:global(html.dark .platform-feedback-page .comment-item p),
:global(html.dark .platform-feedback-page .feedback-timeline span) {
  color: #aab8ca;
}

:global(html.dark .platform-feedback-page .feed-switcher) {
  border-color: var(--feedback-border);
  background: rgba(30, 41, 59, 0.72);
}

:global(html.dark .platform-feedback-page .feed-switch.active) {
  background: rgba(51, 65, 85, 0.9);
}

:global(html.dark .platform-feedback-page .filter-panel) {
  border-color: rgba(75, 113, 151, 0.42);
  background: linear-gradient(135deg, rgba(23, 47, 72, 0.72), rgba(15, 31, 50, 0.82));
}

:global(html.dark .platform-feedback-page .filter-panel-title) {
  color: #c2d8ec;
}

:global(html.dark .platform-feedback-page .feedback-filter-form .el-input__wrapper),
:global(html.dark .platform-feedback-page .feedback-filter-form .el-select__wrapper) {
  border: 0;
  background: rgba(15, 23, 42, 0.78);
  box-shadow: 0 0 0 1px var(--feedback-border) inset;
}

:global(html.dark .platform-feedback-page .feedback-filter-form .el-input__wrapper:hover),
:global(html.dark .platform-feedback-page .feedback-filter-form .el-select__wrapper:hover),
:global(html.dark .platform-feedback-page .feedback-filter-form .el-input__wrapper.is-focus),
:global(html.dark .platform-feedback-page .feedback-filter-form .el-select__wrapper.is-focused) {
  box-shadow: 0 0 0 1px var(--el-color-primary) inset;
}

:global(html.dark .platform-feedback-page .feedback-filter-form .el-input__inner),
:global(html.dark .platform-feedback-page .feedback-filter-form .el-select__selected-item) {
  color: #e5edf8;
}

:global(html.dark .platform-feedback-page .feedback-filter-form .el-input__inner::placeholder),
:global(html.dark .platform-feedback-page .feedback-filter-form .el-select__placeholder) {
  color: #7f91a8;
}

:global(html.dark .platform-feedback-page .result-dot) {
  box-shadow: 0 0 0 4px rgba(101, 184, 238, 0.16);
}

:global(html.dark .platform-feedback-page .feedback-table) {
  --el-table-bg-color: #111827;
  --el-table-tr-bg-color: #111827;
  --el-table-header-bg-color: #18263a;
  --el-table-row-hover-bg-color: rgba(59, 130, 246, 0.1);
  --el-table-border-color: var(--feedback-border);
  --el-table-text-color: #c2d0e4;
  --el-table-header-text-color: #dbe8f7;
  border-color: var(--feedback-border);
}

:global(html.dark .platform-feedback-page .feedback-table .el-table__header-wrapper th.el-table__cell) {
  color: #dbe8f7;
  border-color: var(--feedback-border);
  background: #18263a !important;
}

:global(html.dark .platform-feedback-page .feedback-table .el-table__body tr),
:global(html.dark .platform-feedback-page .feedback-table .el-table__body td.el-table__cell) {
  color: #c2d0e4;
  border-color: var(--feedback-border);
  background: #111827;
}

:global(html.dark .platform-feedback-page .feedback-table .el-table__body tr:hover > td.el-table__cell) {
  background: rgba(59, 130, 246, 0.1) !important;
}

:global(html.dark .platform-feedback-page .feedback-table .el-table__inner-wrapper::before) {
  background: var(--feedback-border);
}

:global(html.dark .platform-feedback-page .feedback-table .el-table__fixed-right),
:global(html.dark .platform-feedback-page .feedback-table .el-table__fixed-right-patch) {
  background: #111827;
}

:global(html.dark .platform-feedback-page .feedback-title-copy strong) {
  color: #e7eff9;
}

:global(html.dark .platform-feedback-page .feedback-type-icon--system) { background: rgba(226, 107, 107, 0.16); }
:global(html.dark .platform-feedback-page .feedback-type-icon--data) { background: rgba(94, 143, 229, 0.16); }
:global(html.dark .platform-feedback-page .feedback-type-icon--process) { background: rgba(154, 112, 213, 0.18); }
:global(html.dark .platform-feedback-page .feedback-type-icon--question) { background: rgba(217, 149, 57, 0.18); }
:global(html.dark .platform-feedback-page .feedback-type-icon--suggestion) { background: rgba(70, 168, 120, 0.18); }

/* Dialogs and drawers are teleported to body, so they need independent dark selectors. */
:global(html.dark .feedback-handler-dialog.el-dialog),
:global(html.dark .feedback-create-dialog.el-dialog) {
  --el-bg-color: #111827;
  --el-bg-color-overlay: #111827;
  --el-fill-color-blank: #111827;
  --el-text-color-primary: #e5edf8;
  --el-text-color-regular: #aab8ca;
  --el-text-color-placeholder: #7f91a8;
  border: 1px solid var(--app-surface-border);
  background: #111827;
}

:global(html.dark .feedback-handler-dialog .el-dialog__header),
:global(html.dark .feedback-handler-dialog .el-dialog__body),
:global(html.dark .feedback-handler-dialog .el-dialog__footer),
:global(html.dark .feedback-create-dialog .el-dialog__header),
:global(html.dark .feedback-create-dialog .el-dialog__body),
:global(html.dark .feedback-create-dialog .el-dialog__footer) {
  border-color: var(--app-surface-border);
  background: #111827;
}

:global(html.dark .feedback-handler-dialog .el-dialog__title),
:global(html.dark .feedback-create-dialog .el-dialog__title),
:global(html.dark .feedback-create-dialog .el-form-item__label),
:global(html.dark .feedback-handler-dialog .el-form-item__label) {
  color: #e5edf8;
}

:global(html.dark .feedback-create-dialog .source-context-banner) {
  border-color: rgba(73, 143, 207, 0.38);
  background: rgba(25, 64, 97, 0.45);
}

:global(html.dark .feedback-create-dialog .source-context-banner strong) { color: #b8ddfa; }
:global(html.dark .feedback-create-dialog .source-context-banner span) { color: #9bb0c6; }

:global(html.dark .feedback-create-dialog .type-choice) {
  border-color: var(--feedback-border);
  color: #aab8ca;
  background: rgba(15, 23, 42, 0.65);
}

:global(html.dark .feedback-create-dialog .type-choice:hover),
:global(html.dark .feedback-create-dialog .type-choice.active) {
  border-color: rgba(92, 168, 235, 0.65);
  background: rgba(34, 71, 108, 0.46);
}

:global(html.dark .feedback-create-dialog .type-choice-icon) { background: rgba(93, 157, 224, 0.14); }
:global(html.dark .feedback-create-dialog .type-choice:nth-child(1) .type-choice-icon) { background: rgba(223, 107, 107, 0.16); }
:global(html.dark .feedback-create-dialog .type-choice:nth-child(2) .type-choice-icon) { background: rgba(93, 143, 224, 0.16); }
:global(html.dark .feedback-create-dialog .type-choice:nth-child(3) .type-choice-icon) { background: rgba(150, 110, 208, 0.16); }
:global(html.dark .feedback-create-dialog .type-choice:nth-child(4) .type-choice-icon) { background: rgba(212, 150, 60, 0.16); }
:global(html.dark .feedback-create-dialog .type-choice:nth-child(5) .type-choice-icon) { background: rgba(72, 167, 121, 0.16); }

:global(html.dark .feedback-create-dialog .el-input__wrapper),
:global(html.dark .feedback-create-dialog .el-select__wrapper),
:global(html.dark .feedback-create-dialog .el-textarea__inner),
:global(html.dark .feedback-handler-dialog .el-select__wrapper) {
  border-color: var(--app-surface-border);
  color: #e5edf8;
  background: rgba(15, 23, 42, 0.78);
  box-shadow: 0 0 0 1px var(--app-surface-border) inset;
}

:global(html.dark .feedback-create-dialog .el-input__inner),
:global(html.dark .feedback-create-dialog .el-select__selected-item),
:global(html.dark .feedback-create-dialog .el-select__placeholder),
:global(html.dark .feedback-create-dialog .el-textarea__inner),
:global(html.dark .feedback-handler-dialog .el-select__selected-item),
:global(html.dark .feedback-handler-dialog .el-select__placeholder) {
  color: #e5edf8;
}

:global(html.dark .feedback-create-dialog .el-input__inner::placeholder),
:global(html.dark .feedback-create-dialog .el-textarea__inner::placeholder),
:global(html.dark .feedback-handler-dialog .el-select__placeholder) {
  color: #7f91a8;
}

:global(html.dark .feedback-detail-drawer.el-drawer) {
  --el-bg-color: #0f172a;
  --el-bg-color-overlay: #0f172a;
  --el-text-color-primary: #e5edf8;
  --el-text-color-regular: #aab8ca;
  border-left: 1px solid var(--app-surface-border);
  color: #e5edf8;
  background: #0f172a;
}

:global(html.dark .feedback-detail-drawer .el-drawer__header),
:global(html.dark .feedback-detail-drawer .el-drawer__body) {
  color: #e5edf8;
  background: #0f172a;
}

:global(html.dark .feedback-detail-drawer .el-drawer__header) { border-bottom: 1px solid var(--feedback-border); }
:global(html.dark .feedback-detail-drawer .detail-heading) { border-color: var(--feedback-border); }
:global(html.dark .feedback-detail-drawer .detail-source-card) { border-color: rgba(75, 113, 151, 0.38); background: rgba(25, 50, 75, 0.48); }
:global(html.dark .feedback-detail-drawer .detail-source-card strong) { color: #deebf8; }
:global(html.dark .feedback-detail-drawer .attachment-list a) { border-color: var(--feedback-border); color: #8cc5f5; }
:global(html.dark .feedback-detail-drawer .comment-composer) { border-color: var(--feedback-border); background: rgba(30, 41, 59, 0.65); }
    :global(html.dark .feedback-detail-drawer .comment-item .el-avatar) { color: #b9ddff; background: rgba(77, 148, 213, 0.2); }
:global(html.dark .feedback-detail-drawer .resolution-note) { border-color: rgba(70, 160, 105, 0.35); background: rgba(29, 84, 55, 0.32); }
:global(html.dark .feedback-detail-drawer .process-section) { border-color: rgba(171, 125, 65, 0.38); background: rgba(85, 59, 26, 0.25); }
:global(html.dark .feedback-detail-drawer .process-tip),
    :global(html.dark .feedback-detail-drawer .process-form .el-form-item__label) { color: #c4a87d; }
:global(html.dark .feedback-detail-drawer .process-form .el-input__wrapper),
:global(html.dark .feedback-detail-drawer .process-form .el-select__wrapper),
:global(html.dark .feedback-detail-drawer .process-form .el-textarea__inner) { border-color: var(--feedback-border); background: rgba(15, 23, 42, 0.78); box-shadow: 0 0 0 1px var(--feedback-border) inset; }
:global(html.dark .feedback-detail-drawer .process-form .el-input__inner),
:global(html.dark .feedback-detail-drawer .process-form .el-select__selected-item),
:global(html.dark .feedback-detail-drawer .process-form .el-textarea__inner) { color: #e5edf8; }
</style>

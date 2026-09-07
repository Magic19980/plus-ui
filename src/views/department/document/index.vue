<template>
  <div class="app-container department-document-page">
    <el-card shadow="never" class="document-hero">
      <div class="hero-content">
        <div>
          <span class="hero-kicker">DEPARTMENT KNOWLEDGE HUB</span>
          <h2>科室资料中心</h2>
          <p>统一沉淀制度规范、项目资料和系统运维文档，让每一份资料都能被找到、被追溯、被复用。</p>
        </div>
        <div class="hero-stats">
          <div><strong>{{ total }}</strong><span>{{ activeTab === 'recycle' ? '回收站资料' : '当前资料' }}</span></div>
          <div><strong>{{ categoryCount }}</strong><span>资料分类</span></div>
          <div><strong>{{ projectOptions.length }}</strong><span>关联项目</span></div>
        </div>
      </div>
    </el-card>

    <el-card shadow="never" class="document-card mt-2">
      <template #header>
        <DepartmentPanelHeader kicker="DOCUMENT LIBRARY" :title="activeTab === 'category' ? '资料分类配置' : '资料库'" :description="activeTab === 'category' ? '维护资料库使用的多级分类，启用后即可用于资料归档。' : '支持项目归档、版本管理和权限保护的科室资料空间。'">
            <template v-if="activeTab === 'category'">
              <el-button v-hasPermi="['department:documentCategory:add']" type="primary" icon="Plus" @click="handleAddCategory">新增顶级分类</el-button>
            </template>
            <template v-else>
              <el-button v-hasPermi="['department:document:add']" type="primary" icon="Upload" @click="handleAdd">上传资料</el-button>
              <el-button v-hasPermi="['department:document:query']" plain icon="Refresh" @click="getList">刷新</el-button>
            </template>
        </DepartmentPanelHeader>
      </template>

      <DepartmentPageTabs v-model="activeTab" @tab-change="handleTabChange">
        <el-tab-pane label="资料库" name="active" />
        <el-tab-pane label="回收站" name="recycle" />
        <el-tab-pane v-hasPermi="['department:documentCategory:list']" name="category" lazy>
          <template #label><span class="document-tab-label"><el-icon><CollectionTag /></el-icon>资料分类配置</span></template>
          <DepartmentDocumentCategoryPanel ref="categoryPanelRef" embedded />
        </el-tab-pane>
      </DepartmentPageTabs>

      <template v-if="activeTab !== 'category'">
      <el-form :inline="true" :model="queryParams" class="query-form">
        <el-form-item label="关键词">
          <el-input v-model="queryParams.title" clearable placeholder="标题或标签" @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item label="分类">
          <el-tree-select v-model="queryParams.categoryId" :data="categories" node-key="id" check-strictly clearable filterable style="width: 190px" :props="{ label: 'categoryName', children: 'children' }" placeholder="全部分类" />
        </el-form-item>
        <el-form-item label="项目">
          <el-select v-model="queryParams.projectId" clearable filterable placeholder="全部项目" style="width: 190px">
            <el-option v-for="item in projectOptions" :key="item.id" :label="item.projectName" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="queryParams.fileSuffix" clearable placeholder="全部类型" style="width: 130px">
            <el-option v-for="item in fileTypes" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="queryParams.status" clearable placeholder="全部状态" style="width: 130px">
            <el-option label="已发布" value="PUBLISHED" />
            <el-option label="草稿" value="DRAFT" />
            <el-option label="已归档" value="ARCHIVED" />
          </el-select>
        </el-form-item>
        <el-form-item label="排序">
          <el-select v-model="queryParams.sortBy" placeholder="最近更新" style="width: 140px" @change="handleQuery">
            <el-option label="最近更新" value="updatedDesc" />
            <el-option label="最早更新" value="updatedAsc" />
            <el-option label="名称升序" value="nameAsc" />
            <el-option label="文件从大到小" value="sizeDesc" />
          </el-select>
        </el-form-item>
        <div class="query-actions">
          <el-button type="primary" icon="Search" @click="handleQuery">查询</el-button>
          <el-button icon="Refresh" @click="resetQuery">重置</el-button>
        </div>
      </el-form>

      <div class="library-layout">
        <aside class="library-sidebar">
          <div class="sidebar-heading">
            <div>
              <span class="sidebar-kicker">BROWSE</span>
              <strong>资料导航</strong>
            </div>
            <el-tag size="small" effect="plain">{{ categoryCount }} 个分类</el-tag>
          </div>
          <div class="quick-nav">
            <button class="quick-nav-item" :class="{ active: !queryParams.categoryId && !queryParams.status }" type="button" @click="selectQuickFilter(undefined)">
              <el-icon><Files /></el-icon><span>全部资料</span><small>{{ total }}</small>
            </button>
            <button class="quick-nav-item" :class="{ active: queryParams.status === 'PUBLISHED' }" type="button" @click="selectQuickFilter('PUBLISHED')">
              <el-icon><CircleCheck /></el-icon><span>已发布</span>
            </button>
            <button class="quick-nav-item" :class="{ active: queryParams.status === 'DRAFT' }" type="button" @click="selectQuickFilter('DRAFT')">
              <el-icon><EditPen /></el-icon><span>草稿</span>
            </button>
            <button class="quick-nav-item" :class="{ active: queryParams.status === 'ARCHIVED' }" type="button" @click="selectQuickFilter('ARCHIVED')">
              <el-icon><Box /></el-icon><span>已归档</span>
            </button>
          </div>

          <div class="sidebar-divider" />
          <div class="category-heading">
            <span>资料分类</span>
          </div>
          <el-tree
            v-if="categories.length"
            class="category-tree"
            :data="categories"
            node-key="id"
            highlight-current
            :current-node-key="queryParams.categoryId"
            :props="{ label: 'categoryName', children: 'children' }"
            @node-click="handleCategoryNodeClick"
          >
            <template #default="{ data }">
              <div class="category-tree-node">
                <el-icon><FolderOpened /></el-icon>
                <span class="category-tree-label">{{ data.categoryName }}</span>
                <small v-if="data.documentCount !== undefined" class="category-tree-count">{{ data.documentCount }}</small>
              </div>
            </template>
          </el-tree>
          <div v-else class="category-empty">
            <el-icon><FolderOpened /></el-icon>
            <span>暂无可用分类</span>
            <el-button v-hasPermi="['department:documentCategory:add']" link type="primary" @click="handleAddCategory">创建分类</el-button>
          </div>
        </aside>

        <main class="library-main">
          <div v-if="documentList.length || selectedIds.length" class="selection-toolbar">
            <div class="selection-summary">
              <el-checkbox :model-value="allPageSelected" :indeterminate="somePageSelected && !allPageSelected" @change="toggleSelectAllPage">全选当前页</el-checkbox>
              <span v-if="selectedIds.length">已选择 {{ selectedIds.length }} 份资料</span>
            </div>
            <div v-if="selectedIds.length" class="selection-actions">
              <el-button v-if="activeTab === 'active'" v-hasPermi="['department:document:remove']" size="small" type="danger" plain @click="batchDelete">移入回收站</el-button>
              <el-button v-else v-hasPermi="['department:document:restore']" size="small" type="primary" plain @click="batchRestore">批量恢复</el-button>
              <el-button size="small" link @click="clearSelection">取消选择</el-button>
            </div>
          </div>
          <div class="library-toolbar">
            <div class="library-breadcrumb">
              <el-icon><FolderOpened /></el-icon>
              <span>资料库</span>
              <template v-for="(segment, index) in breadcrumbSegments" :key="index">
                <el-icon class="breadcrumb-arrow"><ArrowRight /></el-icon>
                <strong v-if="index === breadcrumbSegments.length - 1">{{ segment }}</strong>
                <span v-else class="breadcrumb-parent">{{ segment }}</span>
              </template>
            </div>
            <div class="library-toolbar-tools">
              <span class="result-count">共 {{ total }} 份资料</span>
              <el-button-group class="view-switch">
                <el-button :type="viewMode === 'grid' ? 'primary' : 'default'" title="卡片视图" @click="viewMode = 'grid'"><el-icon><Grid /></el-icon></el-button>
                <el-button :type="viewMode === 'list' ? 'primary' : 'default'" title="列表视图" @click="viewMode = 'list'"><el-icon><List /></el-icon></el-button>
              </el-button-group>
            </div>
          </div>

          <div v-if="viewMode === 'grid'" v-loading="loading" class="document-grid">
            <article v-for="row in documentList" :key="row.id" class="document-card-item" :class="{ selected: isSelected(row.id) }" @click="openQuickView(row)">
              <div class="document-cover" :class="fileIconClass(row.currentFileSuffix)">
                <div class="card-select" @click.stop><el-checkbox :model-value="isSelected(row.id)" @change="(checked: boolean) => toggleSelection(row.id, checked)" /></div>
                <div class="cover-glow" />
                <div class="cover-file-mark">
                  <el-icon v-if="isVideoFile(row.currentFileSuffix)"><VideoCamera /></el-icon>
                  <el-icon v-else-if="['.jpg', '.jpeg', '.png', '.gif'].includes((row.currentFileSuffix || '').toLowerCase())"><Picture /></el-icon>
                  <el-icon v-else><Document /></el-icon>
                  <span>{{ fileIconText(row.currentFileSuffix) }}</span>
                </div>
                <div class="cover-footer"><span>{{ mediaKindLabel(row.currentFileSuffix) }}</span><span>v{{ row.versionNo || 1 }}</span></div>
                <div class="cover-hover"><el-button type="primary" circle title="预览" @click.stop="handlePreview(row)"><el-icon><View /></el-icon></el-button></div>
              </div>
              <div class="document-card-body">
                <div class="document-card-title" :title="row.title">{{ row.title }}</div>
                <div class="document-card-file" :title="row.currentOriginalName">{{ row.currentOriginalName || '未命名文件' }}</div>
                <div v-if="expiryState(row) !== 'normal'" class="document-card-expiry" :class="expiryState(row)"><el-icon><WarningFilled /></el-icon>{{ expiryLabel(row) }}</div>
                <div v-if="tagList(row.tags).length" class="document-card-tags">
                  <el-tag v-for="tag in tagList(row.tags).slice(0, 2)" :key="tag" size="small" effect="plain">{{ tag }}</el-tag>
                  <span v-if="tagList(row.tags).length > 2" class="more-tags">+{{ tagList(row.tags).length - 2 }}</span>
                </div>
                <div class="document-card-meta"><span>{{ row.categoryName || '未分类' }}</span><i /><span>{{ row.updateTime || '暂无更新记录' }}</span></div>
                <div class="document-card-footer">
                  <span><el-icon><User /></el-icon>{{ row.createByName || '未知上传人' }}</span>
                  <el-tag :type="statusTagType(row.status)" effect="light" size="small">{{ statusLabel(row.status) }}</el-tag>
                </div>
              </div>
            </article>
            <el-empty v-if="!loading && !documentList.length" class="grid-empty" description="当前分类暂无资料" />
          </div>

          <div v-else v-loading="loading" class="document-list-view">
            <div v-for="row in documentList" :key="row.id" class="document-list-item" :class="{ selected: isSelected(row.id) }" @click="openQuickView(row)">
              <div class="list-select" @click.stop><el-checkbox :model-value="isSelected(row.id)" @change="(checked: boolean) => toggleSelection(row.id, checked)" /></div>
              <div class="list-file-icon" :class="fileIconClass(row.currentFileSuffix)">{{ fileIconText(row.currentFileSuffix) }}</div>
              <div class="list-file-main">
                <div class="list-file-title" :title="row.title">{{ row.title }}</div>
                <div class="list-file-name" :title="row.currentOriginalName">{{ row.currentOriginalName || '未命名文件' }}</div>
                <div class="list-file-meta"><span>{{ row.categoryName || '未分类' }}</span><i /><span>{{ row.projectName || '公共资料' }}</span><i /><span>v{{ row.versionNo || 1 }}</span><i /><span>{{ formatFileSize(row.currentFileSize) }}</span></div>
              </div>
              <div class="list-file-owner"><span>{{ row.createByName || '未知上传人' }}</span><small>{{ row.updateTime || '—' }}</small></div>
              <span v-if="expiryState(row) !== 'normal'" class="list-expiry" :class="expiryState(row)"><el-icon><WarningFilled /></el-icon>{{ expiryLabel(row) }}</span>
              <el-tag :type="statusTagType(row.status)" effect="light">{{ statusLabel(row.status) }}</el-tag>
              <div class="list-file-actions" @click.stop>
                <template v-if="activeTab === 'active'">
                  <el-button v-hasPermi="['department:document:query']" link type="primary" @click="handlePreview(row)">预览</el-button>
                  <el-button v-hasPermi="['department:document:download']" link type="primary" @click="handleDownload(row)">下载</el-button>
                  <el-dropdown v-hasPermi="['department:document:edit']" @command="(command: string) => handleMoreCommand(command, row)">
                    <el-button link type="primary">更多<el-icon class="el-icon--right"><ArrowDown /></el-icon></el-button>
                    <template #dropdown><el-dropdown-menu><el-dropdown-item command="version">上传新版本</el-dropdown-item><el-dropdown-item command="edit">编辑信息</el-dropdown-item></el-dropdown-menu></template>
                  </el-dropdown>
                  <el-button v-hasPermi="['department:document:remove']" link type="danger" @click="handleDelete(row)">删除</el-button>
                </template>
                <el-button v-else v-hasPermi="['department:document:restore']" link type="primary" @click="handleRestore(row)">恢复</el-button>
              </div>
            </div>
            <el-empty v-if="!loading && !documentList.length" description="当前分类暂无资料" />
          </div>

          <pagination v-show="total > 0" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" :total="total" @pagination="getList" />
        </main>
      </div>

      </template>
    </el-card>

    <el-drawer v-model="quickView.visible" class="document-quick-view" size="420px" append-to-body :with-header="false" @close="closeQuickView">
      <div v-if="quickView.row" class="quick-view-content">
        <div class="quick-view-header">
          <div>
            <span class="quick-view-kicker">QUICK PREVIEW</span>
            <h3>资料信息</h3>
          </div>
          <el-button text circle aria-label="关闭详情" @click="closeQuickView"><el-icon><Close /></el-icon></el-button>
        </div>
        <div v-if="quickPreviewUrl && isQuickPreviewMedia(quickView.row.currentFileSuffix)" class="quick-view-media" @click="handlePreview(quickView.row)">
          <video v-if="isVideoFile(quickView.row.currentFileSuffix)" :key="quickPreviewUrl" :src="quickPreviewUrl" class="quick-view-media-video" muted autoplay loop playsinline preload="auto" @error="handleQuickPreviewError" />
          <img v-else :src="quickPreviewUrl" :alt="quickView.row.title" class="quick-view-media-image" @error="handleQuickPreviewError" />
          <div class="quick-view-media-gradient" />
          <div class="quick-view-media-badge"><el-icon><component :is="quickViewIcon(quickView.row.currentFileSuffix)" /></el-icon><span>{{ mediaKindLabel(quickView.row.currentFileSuffix) }}</span></div>
          <div class="quick-view-media-play"><el-icon><View /></el-icon><span>打开完整预览</span></div>
        </div>
        <div v-else-if="quickPreviewLoading" class="quick-view-cover quick-view-cover-loading">
          <el-icon class="is-loading"><Loading /></el-icon>
          <span>正在加载预览…</span>
        </div>
        <div v-else class="quick-view-cover" :class="fileIconClass(quickView.row.currentFileSuffix)" @click="handlePreview(quickView.row)">
          <div class="quick-cover-pattern" />
          <div class="quick-cover-mark"><el-icon><component :is="quickViewIcon(quickView.row.currentFileSuffix)" /></el-icon><strong>{{ fileIconText(quickView.row.currentFileSuffix) }}</strong></div>
          <div v-if="quickPreviewError" class="quick-cover-status"><el-icon><WarningFilled /></el-icon><span>{{ quickPreviewError }}</span></div>
          <div class="quick-cover-action"><el-icon><View /></el-icon><span>点击在线预览</span></div>
        </div>
        <div class="quick-view-title-row">
          <div class="quick-view-title" :title="quickView.row.title">{{ quickView.row.title }}</div>
          <div class="quick-view-statuses">
            <el-tag :type="statusTagType(quickView.row.status)" effect="light" size="small">{{ statusLabel(quickView.row.status) }}</el-tag>
            <el-tag v-if="expiryState(quickView.row) !== 'normal'" :type="expiryTagType(quickView.row)" effect="light" size="small">{{ expiryLabel(quickView.row) }}</el-tag>
          </div>
        </div>
        <div class="quick-view-file-name" :title="quickView.row.currentOriginalName">{{ quickView.row.currentOriginalName || '未命名文件' }}</div>
        <div v-if="tagList(quickView.row.tags).length" class="quick-view-tags">
          <el-tag v-for="tag in tagList(quickView.row.tags)" :key="tag" size="small" effect="plain">{{ tag }}</el-tag>
        </div>
        <div class="quick-view-actions">
          <el-button v-hasPermi="['department:document:query']" type="primary" @click="handlePreview(quickView.row)"><el-icon><View /></el-icon>在线预览</el-button>
          <el-button v-hasPermi="['department:document:download']" @click="handleDownload(quickView.row)"><el-icon><Download /></el-icon>下载资料</el-button>
        </div>
        <div class="quick-view-divider" />
        <dl class="quick-view-meta">
          <div><dt>资料分类</dt><dd>{{ quickView.row.categoryName || '未分类' }}</dd></div>
          <div><dt>关联项目</dt><dd>{{ quickView.row.projectName || '公共资料' }}</dd></div>
          <div><dt>当前版本</dt><dd>v{{ quickView.row.versionNo || 1 }}</dd></div>
          <div><dt>文件大小</dt><dd>{{ formatFileSize(quickView.row.currentFileSize) }}</dd></div>
          <div><dt>上传人</dt><dd>{{ quickView.row.createByName || '未知上传人' }}</dd></div>
          <div><dt>更新时间</dt><dd>{{ quickView.row.updateTime || '—' }}</dd></div>
          <div v-if="quickView.row.expireDate"><dt>失效日期</dt><dd>{{ quickView.row.expireDate }}</dd></div>
        </dl>
        <div class="quick-view-description">
          <span>资料说明</span>
          <p>{{ quickView.row.description || '暂无资料说明' }}</p>
        </div>
        <div class="quick-view-footer-actions">
          <el-button v-hasPermi="['department:document:query']" link type="primary" @click="handleDetail(quickView.row)">查看版本记录</el-button>
          <el-dropdown v-hasPermi="['department:document:edit']" @command="handleQuickMoreCommand">
            <el-button link type="primary">更多<el-icon class="el-icon--right"><ArrowDown /></el-icon></el-button>
            <template #dropdown><el-dropdown-menu><el-dropdown-item command="version">上传新版本</el-dropdown-item><el-dropdown-item command="edit">编辑信息</el-dropdown-item></el-dropdown-menu></template>
          </el-dropdown>
        </div>
      </div>
    </el-drawer>

    <el-dialog v-model="editDialog.visible" :title="editDialog.title" width="620px" append-to-body>
      <el-form ref="editFormRef" :model="editForm" label-width="100px">
        <el-form-item label="资料标题" required><el-input v-model="editForm.title" maxlength="200" show-word-limit placeholder="请输入资料标题" /></el-form-item>
        <el-form-item label="资料分类" required>
          <el-tree-select v-model="editForm.categoryId" :data="categories" node-key="id" check-strictly filterable style="width: 100%" :props="{ label: 'categoryName', children: 'children' }" placeholder="请选择资料分类" />
        </el-form-item>
        <el-alert v-if="!categories.length" title="请先在“资料分类配置”标签中创建并启用分类" type="warning" :closable="false" show-icon />
        <el-form-item label="关联项目">
          <el-select v-model="editForm.projectId" clearable filterable placeholder="不关联项目" style="width: 100%">
            <el-option v-for="item in projectOptions" :key="item.id" :label="item.projectName" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="资料状态">
          <el-radio-group v-model="editForm.status">
            <el-radio value="PUBLISHED">已发布</el-radio>
            <el-radio value="DRAFT">草稿</el-radio>
            <el-radio value="ARCHIVED">已归档</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="失效日期"><el-date-picker v-model="editForm.expireDate" type="date" value-format="YYYY-MM-DD" clearable style="width: 100%" /></el-form-item>
        <el-form-item label="标签"><el-input v-model="editForm.tags" maxlength="500" placeholder="多个标签用逗号分隔" /></el-form-item>
        <el-form-item label="资料说明"><el-input v-model="editForm.description" type="textarea" :rows="3" maxlength="1000" show-word-limit placeholder="补充资料用途、适用范围或注意事项" /></el-form-item>
        <el-form-item v-if="!editForm.id" label="选择文件" required>
          <el-upload drag :auto-upload="false" :limit="1" :file-list="editFileList" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.jpg,.jpeg,.png,.gif,.zip,.rar,.7z,.mp4,.webm,.ogg" :on-change="handleEditFileChange" :on-remove="clearEditFile">
            <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
            <div class="el-upload__text">拖拽文件到这里，或点击选择</div>
            <template #tip><div class="el-upload__tip">普通资料不超过 50MB，视频不超过 500MB；支持常见文档、图片、压缩包和 MP4/WebM/Ogg 视频。</div></template>
          </el-upload>
        </el-form-item>
      </el-form>
      <el-progress v-if="buttonLoading && uploadProgress > 0" :percentage="uploadProgress" :stroke-width="6" class="upload-progress" />
      <template #footer><el-button v-if="uploadingFile" @click="cancelUpload">取消上传</el-button><el-button type="primary" :loading="buttonLoading" :disabled="buttonLoading" @click="submitEdit">保存</el-button><el-button :disabled="buttonLoading" @click="editDialog.visible = false">取消</el-button></template>
    </el-dialog>

    <el-dialog v-model="versionDialog.visible" title="上传资料新版本" width="520px" append-to-body>
      <div class="version-tip">当前版本：v{{ versionTarget?.versionNo || 1 }}，上传后将生成 v{{ (versionTarget?.versionNo || 1) + 1 }}。</div>
      <el-form label-width="90px">
        <el-form-item label="版本说明"><el-input v-model="versionForm.versionNote" type="textarea" :rows="3" maxlength="500" show-word-limit placeholder="说明本次版本的修改内容" /></el-form-item>
        <el-form-item label="新文件" required>
          <el-upload drag :auto-upload="false" :limit="1" :file-list="versionFileList" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.jpg,.jpeg,.png,.gif,.zip,.rar,.7z,.mp4,.webm,.ogg" :on-change="handleVersionFileChange" :on-remove="clearVersionFile">
            <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
            <div class="el-upload__text">选择新版本文件</div>
          </el-upload>
        </el-form-item>
      </el-form>
      <el-progress v-if="buttonLoading && uploadProgress > 0" :percentage="uploadProgress" :stroke-width="6" class="upload-progress" />
      <template #footer><el-button v-if="uploadingFile" @click="cancelUpload">取消上传</el-button><el-button type="primary" :loading="buttonLoading" :disabled="buttonLoading" @click="submitVersion">上传版本</el-button><el-button :disabled="buttonLoading" @click="versionDialog.visible = false">取消</el-button></template>
    </el-dialog>

    <el-dialog v-model="detailDialog.visible" title="资料详情" width="760px" append-to-body>
      <el-descriptions v-if="detailData" :column="2" border>
        <el-descriptions-item label="资料标题">{{ detailData.title }}</el-descriptions-item>
        <el-descriptions-item label="资料分类">{{ detailData.categoryName }}</el-descriptions-item>
        <el-descriptions-item label="关联项目">{{ detailData.projectName || '科室公共资料' }}</el-descriptions-item>
        <el-descriptions-item label="当前版本">v{{ detailData.versionNo || 1 }}</el-descriptions-item>
        <el-descriptions-item label="当前文件" :span="2">{{ detailData.currentOriginalName }}</el-descriptions-item>
        <el-descriptions-item label="标签" :span="2">{{ detailData.tags || '—' }}</el-descriptions-item>
        <el-descriptions-item label="资料说明" :span="2"><div class="detail-description">{{ detailData.description || '—' }}</div></el-descriptions-item>
      </el-descriptions>
      <el-divider content-position="left">版本记录</el-divider>
      <DepartmentDataTable v-loading="detailLoading" border :data="versions" size="small">
        <el-table-column label="版本" width="80" align="center"><template #default="scope">v{{ scope.row.versionNo }}</template></el-table-column>
        <el-table-column label="文件名" prop="originalName" min-width="220" show-overflow-tooltip />
        <el-table-column label="大小" width="100" align="center"><template #default="scope">{{ formatFileSize(scope.row.fileSize) }}</template></el-table-column>
        <el-table-column label="上传人" prop="createByName" width="100" align="center" />
        <el-table-column label="版本说明" prop="versionNote" min-width="160" show-overflow-tooltip />
        <el-table-column label="时间" prop="createTime" width="165" align="center" />
        <el-table-column label="操作" width="90" align="center">
          <template #default="scope">
            <el-button v-if="isVideoFile(scope.row.fileSuffix)" v-hasPermi="['department:document:query']" link type="primary" @click="handleVersionPreview(toVersion(scope.row))">预览</el-button>
            <span v-else class="version-operation-placeholder">—</span>
          </template>
        </el-table-column>
      </DepartmentDataTable>
      <template #footer><el-button @click="detailDialog.visible = false">关闭</el-button></template>
    </el-dialog>

    <el-dialog v-model="previewDialog.visible" :title="previewDialog.title" class="document-preview-dialog" width="min(1120px, 92vw)" append-to-body destroy-on-close>
      <template #header>
        <div class="preview-dialog-header">
          <div class="preview-file-icon" :class="fileIconClass(previewFileSuffix)">{{ fileIconText(previewFileSuffix) }}</div>
          <div class="preview-file-text">
            <div class="preview-file-title" :title="previewFileName">{{ previewFileName || previewDialog.title }}</div>
            <div class="preview-file-meta"><span>{{ previewKindLabel }}</span><i /><span>{{ previewVersionLabel }}</span><i /><span>{{ formatFileSize(previewFileSize) }}</span></div>
          </div>
        </div>
      </template>
      <div class="preview-shell">
        <div v-loading="previewDialog.loading" class="preview-container" :class="{ 'preview-video-stage': previewKind === 'video' }">
          <video v-if="previewKind === 'video' && previewUrl && previewMediaState !== 'error'" :key="previewUrl" controls playsinline preload="metadata" class="preview-video" @loadedmetadata="handleVideoReady" @canplay="handleVideoReady" @error="handleVideoError">
            <source :src="previewUrl" :type="previewContentType || undefined" />
          </video>
          <div v-else-if="previewKind === 'video' && previewMediaState === 'error'" class="preview-error-state">
            <div class="preview-error-icon"><el-icon><WarningFilled /></el-icon></div>
            <strong>视频暂时无法播放</strong>
            <p>{{ previewErrorMessage }}</p>
            <span>{{ previewErrorHint }}</span>
            <el-button type="primary" plain @click="retryPreview">重新加载</el-button>
          </div>
          <img v-else-if="previewKind === 'image' && previewUrl" :src="previewUrl" alt="资料预览" class="preview-image" />
          <iframe v-else-if="previewKind === 'pdf' && previewUrl" :src="previewUrl" title="资料预览" class="preview-frame" />
          <div v-else-if="previewDialog.loading" class="preview-loading-state"><el-icon class="is-loading"><Loading /></el-icon><span>正在准备预览…</span></div>
          <el-empty v-else description="当前文件格式暂不支持页面内预览，请下载后查看" />
        </div>
      </div>
      <template #footer><el-button v-if="previewDialog.row && !previewDialog.versionId" type="primary" @click="handleDownload(previewDialog.row)">下载文件</el-button><el-button @click="closePreview">关闭</el-button></template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts" name="DepartmentDocument">
import type { FormInstance, UploadFile, UploadFiles } from 'element-plus';
import { ArrowDown, ArrowRight, Box, CircleCheck, Close, CollectionTag, Document, Download, EditPen, Files, FolderOpened, Grid, List, Loading, Picture, UploadFilled, User, VideoCamera, View, WarningFilled } from '@element-plus/icons-vue';
import type { Component } from 'vue';
import { computed, onMounted, reactive, ref } from 'vue';
import { listDepartmentDocumentCategoryOptions } from '@/api/department/documentCategory';
import type { DepartmentDocumentCategoryVO } from '@/api/department/documentCategory/types';
import { listDepartmentProjectOptions } from '@/api/department/project';
import type { DepartmentProjectVO } from '@/api/department/project/types';
import DepartmentPageTabs from '@/components/Department/PageTabs.vue';
import DepartmentDataTable from '@/components/Department/DataTable.vue';
import DepartmentPanelHeader from '@/components/Department/PanelHeader.vue';
import DepartmentTableActions from '@/components/Department/TableActions.vue';
import DepartmentDocumentCategoryPanel from '../documentCategory/CategoryPanel.vue';
import {
  delDepartmentDocument,
  downloadDepartmentDocument,
  getDepartmentDocumentVideoPreview,
  getDepartmentDocumentVideoVersionPreview,
  getDepartmentDocument,
  listDepartmentDocument,
  listDepartmentDocumentRecycle,
  listDepartmentDocumentVersions,
  previewDepartmentDocument,
  restoreDepartmentDocument,
  updateDepartmentDocument,
  uploadDepartmentDocument,
  uploadDepartmentDocumentVersion
} from '@/api/department/document';
import type { DepartmentDocumentForm, DepartmentDocumentQuery, DepartmentDocumentVersionVO, DepartmentDocumentVO } from '@/api/department/document/types';
import modal from '@/plugins/modal';
import { saveBlob } from '@/utils/save';

const fileTypes = [
  { label: 'PDF', value: '.pdf' },
  { label: 'Word', value: '.docx' },
  { label: 'Excel', value: '.xlsx' },
  { label: 'PPT', value: '.pptx' },
  { label: '图片', value: '.png' },
  { label: '视频（MP4）', value: '.mp4' },
  { label: '视频（WebM）', value: '.webm' },
  { label: '视频（Ogg）', value: '.ogg' }
];
const supportedFileSuffixes = new Set([
  '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.csv',
  '.jpg', '.jpeg', '.png', '.gif', '.zip', '.rar', '.7z', '.mp4', '.webm', '.ogg'
]);
const videoSuffixes = new Set(['.mp4', '.webm', '.ogg']);
const maxFileSize = 50 * 1024 * 1024;
const maxVideoFileSize = 500 * 1024 * 1024;

const loading = ref(false);
const buttonLoading = ref(false);
const uploadProgress = ref(0);
const uploadingFile = ref(false);
const uploadAbortController = ref<AbortController>();
const uploadCancelled = ref(false);
const detailLoading = ref(false);
const activeTab = ref('active');
const documentList = ref<DepartmentDocumentVO[]>([]);
const categories = ref<DepartmentDocumentCategoryVO[]>([]);
const projectOptions = ref<DepartmentProjectVO[]>([]);
const total = ref(0);
const selectedIds = ref<Array<string | number>>([]);
const queryParams = reactive<DepartmentDocumentQuery>({ pageNum: 1, pageSize: 12, title: undefined, categoryId: undefined, projectId: undefined, fileSuffix: undefined, status: undefined, sortBy: 'updatedDesc' });
const editForm = reactive<DepartmentDocumentForm>({ categoryId: undefined, status: 'PUBLISHED', visibility: 'DEPT' });
const editFile = ref<UploadFile>();
const editFileList = ref<any[]>([]);
const versionFile = ref<UploadFile>();
const versionFileList = ref<any[]>([]);
const versionForm = reactive({ versionNote: '' });
const versionTarget = ref<DepartmentDocumentVO>();
const detailData = ref<DepartmentDocumentVO>();
const versions = ref<DepartmentDocumentVersionVO[]>([]);
const editFormRef = ref<FormInstance>();
const editDialog = reactive({ visible: false, title: '' });
const versionDialog = reactive({ visible: false });
const detailDialog = reactive({ visible: false });
const quickView = reactive({ visible: false, row: undefined as DepartmentDocumentVO | undefined });
const viewMode = ref<'grid' | 'list'>('grid');
const quickPreviewUrl = ref('');
const quickPreviewObjectUrl = ref(false);
const quickPreviewLoading = ref(false);
const quickPreviewError = ref('');
const quickPreviewRequestId = ref(0);
const previewDialog = reactive({ visible: false, loading: false, title: '', row: undefined as DepartmentDocumentVO | undefined, versionId: undefined as string | number | undefined });
const categoryPanelRef = ref<{ handleAdd: () => void }>();
const previewUrl = ref('');
const previewContentType = ref('');
const previewFileName = ref('');
const previewFileSuffix = ref('');
const previewFileSize = ref<number>();
const previewObjectUrl = ref(false);
const previewKind = ref<'video' | 'image' | 'pdf' | 'none'>('none');
const previewRequestId = ref(0);
const previewMediaState = ref<'idle' | 'loading' | 'ready' | 'error'>('idle');
const previewErrorMessage = ref('');
const previewErrorHint = ref('');
const previewVersion = ref<DepartmentDocumentVersionVO>();
const previewLoadingTimer = ref<ReturnType<typeof setTimeout>>();

const countCategories = (nodes: DepartmentDocumentCategoryVO[]): number => nodes.reduce((count, node) => count + 1 + countCategories(node.children || []), 0);
const categoryCount = computed(() => countCategories(categories.value));
const allPageSelected = computed(() => documentList.value.length > 0 && documentList.value.every((row) => isSelected(row.id)));
const somePageSelected = computed(() => documentList.value.some((row) => isSelected(row.id)));
const breadcrumbSegments = computed(() => {
  if (activeTab.value === 'recycle') return ['回收站'];
  if (!queryParams.categoryId) return [queryParams.status ? statusLabel(queryParams.status) : '全部资料'];
  const findPath = (nodes: DepartmentDocumentCategoryVO[], parents: string[] = []): string[] | undefined => {
    for (const node of nodes) {
      const currentPath = [...parents, node.categoryName];
      if (String(node.id) === String(queryParams.categoryId)) return currentPath;
      const childPath = findPath(node.children || [], currentPath);
      if (childPath) return childPath;
    }
    return undefined;
  };
  return findPath(categories.value) || ['当前分类'];
});
const previewKindLabel = computed(() => ({ video: '视频预览', image: '图片预览', pdf: 'PDF 预览', none: '暂不支持' })[previewKind.value]);
const previewVersionLabel = computed(() => {
  if (previewVersion.value) return `历史版本 v${previewVersion.value.versionNo}`;
  return `当前版本 v${previewDialog.row?.versionNo || 1}`;
});
const toVersion = (row: unknown) => row as DepartmentDocumentVersionVO;

const tagList = (tags?: string) => (tags || '').split(/[,，]/).map((tag) => tag.trim()).filter(Boolean);
const mediaKindLabel = (suffix?: string) => {
  const value = (suffix || '').toLowerCase();
  if (isVideoFile(value)) return '视频资料';
  if (['.jpg', '.jpeg', '.png', '.gif'].includes(value)) return '图片资料';
  if (value === '.pdf') return 'PDF 文档';
  if (['.doc', '.docx'].includes(value)) return 'Word 文档';
  if (['.xls', '.xlsx', '.csv'].includes(value)) return '表格资料';
  return '其他资料';
};
const quickViewIcon = (suffix?: string): Component => {
  const value = (suffix || '').toLowerCase();
  if (isVideoFile(value)) return VideoCamera;
  if (['.jpg', '.jpeg', '.png', '.gif'].includes(value)) return Picture;
  return Document;
};

const getList = async () => {
  clearSelection();
  loading.value = true;
  try {
    const res = activeTab.value === 'recycle' ? await listDepartmentDocumentRecycle(queryParams) : await listDepartmentDocument(queryParams);
    documentList.value = res.data?.rows || [];
    total.value = res.data?.total || 0;
  } finally {
    loading.value = false;
  }
};

const getProjectOptions = async () => {
  const res = await listDepartmentProjectOptions();
  projectOptions.value = res.data || [];
};

const getCategoryOptions = async () => {
  const res = await listDepartmentDocumentCategoryOptions();
  categories.value = res.data || [];
};

const handleQuery = () => {
  queryParams.pageNum = 1;
  getList();
};

const selectQuickFilter = (status?: string) => {
  queryParams.categoryId = undefined;
  queryParams.status = status;
  handleQuery();
};

const handleCategoryNodeClick = (data: DepartmentDocumentCategoryVO) => {
  queryParams.categoryId = data.id;
  queryParams.status = undefined;
  handleQuery();
};

const isSelected = (id: string | number) => selectedIds.value.some((selectedId) => String(selectedId) === String(id));

const toggleSelection = (id: string | number, checked: boolean) => {
  if (checked) {
    if (!isSelected(id)) selectedIds.value.push(id);
    return;
  }
  selectedIds.value = selectedIds.value.filter((selectedId) => String(selectedId) !== String(id));
};

const toggleSelectAllPage = (checked: boolean) => {
  if (checked) {
    const pageIds = documentList.value.map((row) => row.id);
    selectedIds.value = [...new Map([...selectedIds.value, ...pageIds].map((id) => [String(id), id])).values()];
  } else {
    const pageIdSet = new Set(documentList.value.map((row) => String(row.id)));
    selectedIds.value = selectedIds.value.filter((id) => !pageIdSet.has(String(id)));
  }
};

const clearSelection = () => {
  selectedIds.value = [];
};

const batchDelete = async () => {
  if (!selectedIds.value.length) return;
  await modal.confirm(`确认将选中的 ${selectedIds.value.length} 份资料移入回收站吗？`);
  await delDepartmentDocument(selectedIds.value);
  modal.msgSuccess('资料已批量移入回收站');
  await getList();
};

const batchRestore = async () => {
  if (!selectedIds.value.length) return;
  await modal.confirm(`确认恢复选中的 ${selectedIds.value.length} 份资料吗？`);
  await restoreDepartmentDocument(selectedIds.value);
  modal.msgSuccess('资料已批量恢复');
  await getList();
};

const releaseQuickPreviewUrl = () => {
  if (quickPreviewObjectUrl.value && quickPreviewUrl.value) URL.revokeObjectURL(quickPreviewUrl.value);
  quickPreviewUrl.value = '';
  quickPreviewObjectUrl.value = false;
};

const isImageFile = (suffix?: string) => ['.jpg', '.jpeg', '.png', '.gif'].includes((suffix || '').toLowerCase());
const isQuickPreviewMedia = (suffix?: string) => isVideoFile(suffix) || isImageFile(suffix);

const loadQuickPreview = async (row: DepartmentDocumentVO) => {
  const requestId = ++quickPreviewRequestId.value;
  releaseQuickPreviewUrl();
  quickPreviewError.value = '';
  quickPreviewLoading.value = false;
  if (!isQuickPreviewMedia(row.currentFileSuffix)) return;

  quickPreviewLoading.value = true;
  try {
    if (isVideoFile(row.currentFileSuffix)) {
      const response = await getDepartmentDocumentVideoPreview(row.id);
      if (requestId === quickPreviewRequestId.value) quickPreviewUrl.value = response.data?.playbackUrl || '';
    } else {
      const blob = await previewDepartmentDocument(row.id);
      if (requestId === quickPreviewRequestId.value) {
        quickPreviewUrl.value = URL.createObjectURL(blob);
        quickPreviewObjectUrl.value = true;
      }
    }
    if (requestId === quickPreviewRequestId.value && !quickPreviewUrl.value) quickPreviewError.value = '暂无可用预览';
  } catch {
    if (requestId === quickPreviewRequestId.value) quickPreviewError.value = '预览内容加载失败';
  } finally {
    if (requestId === quickPreviewRequestId.value) quickPreviewLoading.value = false;
  }
};

const closeQuickView = () => {
  quickPreviewRequestId.value += 1;
  releaseQuickPreviewUrl();
  quickPreviewLoading.value = false;
  quickPreviewError.value = '';
  quickView.visible = false;
};

const handleQuickPreviewError = () => {
  quickPreviewRequestId.value += 1;
  releaseQuickPreviewUrl();
  quickPreviewLoading.value = false;
  quickPreviewError.value = '视频预览暂不可用，请打开完整预览或下载查看';
};

const openQuickView = (row: DepartmentDocumentVO) => {
  quickView.row = row;
  quickView.visible = true;
  loadQuickPreview(row);
};

const handleQuickMoreCommand = (command: string) => {
  if (quickView.row) handleMoreCommand(command, quickView.row);
};

const resetQuery = () => {
  Object.assign(queryParams, { pageNum: 1, title: undefined, categoryId: undefined, projectId: undefined, fileSuffix: undefined, status: undefined, sortBy: 'updatedDesc' });
  getList();
};

const handleTabChange = () => {
  queryParams.pageNum = 1;
  if (activeTab.value === 'category') return;
  getList();
};

const handleAddCategory = () => categoryPanelRef.value?.handleAdd();

const resetEdit = () => {
  Object.assign(editForm, { id: undefined, projectId: undefined, categoryId: categories.value[0]?.id, title: undefined, description: undefined, tags: undefined, visibility: 'DEPT', status: 'PUBLISHED', expireDate: undefined });
  editFile.value = undefined;
  editFileList.value = [];
  uploadProgress.value = 0;
  editFormRef.value?.resetFields();
};

const handleAdd = () => {
  resetEdit();
  editDialog.title = '上传科室资料';
  editDialog.visible = true;
};

const handleEdit = async (row: DepartmentDocumentVO) => {
  const res = await getDepartmentDocument(row.id);
  Object.assign(editForm, res.data);
  editFile.value = undefined;
  editFileList.value = [];
  editDialog.title = '编辑资料信息';
  editDialog.visible = true;
};

const handleEditFileChange = (file: UploadFile, files: UploadFiles) => {
  editFile.value = file;
  editFileList.value = files.slice(-1);
};

const clearEditFile = () => {
  editFile.value = undefined;
  editFileList.value = [];
};

const appendIfPresent = (data: FormData, key: string, value: unknown) => {
  if (value !== undefined && value !== null && value !== '') data.append(key, String(value));
};

const fileSuffix = (file: UploadFile) => {
  const name = file.raw?.name || file.name || '';
  const lastDot = name.lastIndexOf('.');
  return lastDot >= 0 ? name.slice(lastDot).toLowerCase() : '';
};

const validateUploadFile = (file: UploadFile) => {
  const suffix = fileSuffix(file);
  if (!supportedFileSuffixes.has(suffix)) {
    modal.msgWarning(`不支持的资料文件类型：${suffix || '无后缀'}`);
    return false;
  }
  const size = file.raw?.size || 0;
  const isVideo = videoSuffixes.has(suffix);
  const limit = isVideo ? maxVideoFileSize : maxFileSize;
  if (size > limit) {
    modal.msgWarning(isVideo ? '视频文件不能超过500MB' : '普通资料文件不能超过50MB');
    return false;
  }
  return true;
};

const handleUploadProgress = (event: { loaded: number; total?: number }) => {
  if (event.total) uploadProgress.value = Math.min(99, Math.round((event.loaded / event.total) * 100));
};

const beginFileUpload = () => {
  uploadProgress.value = 0;
  uploadCancelled.value = false;
  uploadAbortController.value = new AbortController();
  uploadingFile.value = true;
};

const endFileUpload = () => {
  uploadAbortController.value = undefined;
  uploadingFile.value = false;
};

const cancelUpload = () => {
  if (!uploadingFile.value) return;
  uploadCancelled.value = true;
  uploadAbortController.value?.abort();
  modal.msgWarning('已取消上传');
};

const submitEdit = async () => {
  if (!editForm.title?.trim()) return modal.msgWarning('请输入资料标题');
  if (!editForm.categoryId) return modal.msgWarning(categories.value.length ? '请选择资料分类' : '请先在“资料分类配置”标签中创建并启用分类');
  uploadProgress.value = 0;
  uploadCancelled.value = false;
  buttonLoading.value = true;
  try {
    if (editForm.id) {
      await updateDepartmentDocument(editForm);
    } else {
      if (!editFile.value?.raw) return modal.msgWarning('请选择要上传的文件');
      if (!validateUploadFile(editFile.value)) return;
      const data = new FormData();
      appendIfPresent(data, 'title', editForm.title);
      appendIfPresent(data, 'categoryId', editForm.categoryId);
      appendIfPresent(data, 'projectId', editForm.projectId);
      appendIfPresent(data, 'description', editForm.description);
      appendIfPresent(data, 'tags', editForm.tags);
      appendIfPresent(data, 'visibility', editForm.visibility);
      appendIfPresent(data, 'status', editForm.status);
      appendIfPresent(data, 'expireDate', editForm.expireDate);
      data.append('file', editFile.value.raw);
      beginFileUpload();
      await uploadDepartmentDocument(data, { onUploadProgress: handleUploadProgress, signal: uploadAbortController.value?.signal });
      endFileUpload();
      uploadProgress.value = 100;
    }
    modal.msgSuccess(editForm.id ? '资料信息已更新' : '资料上传成功');
    editDialog.visible = false;
    await getList();
  } catch (error) {
    if (!uploadCancelled.value) throw error;
  } finally {
    endFileUpload();
    buttonLoading.value = false;
  }
};

const handleMoreCommand = (command: string, row: DepartmentDocumentVO) => {
  if (command === 'version') handleVersion(row);
  if (command === 'edit') handleEdit(row);
};

const handleDetail = async (row: DepartmentDocumentVO) => {
  detailLoading.value = true;
  detailDialog.visible = true;
  try {
    const [detailRes, versionRes] = await Promise.all([getDepartmentDocument(row.id), listDepartmentDocumentVersions(row.id)]);
    detailData.value = detailRes.data;
    versions.value = versionRes.data || [];
  } finally {
    detailLoading.value = false;
  }
};

const handleVersion = (row: DepartmentDocumentVO) => {
  versionTarget.value = row;
  versionForm.versionNote = '';
  versionFile.value = undefined;
  versionFileList.value = [];
  uploadProgress.value = 0;
  versionDialog.visible = true;
};

const handleVersionFileChange = (file: UploadFile, files: UploadFiles) => {
  versionFile.value = file;
  versionFileList.value = files.slice(-1);
};

const clearVersionFile = () => {
  versionFile.value = undefined;
  versionFileList.value = [];
};

const submitVersion = async () => {
  if (!versionTarget.value || !versionFile.value?.raw) return modal.msgWarning('请选择新版本文件');
  if (!validateUploadFile(versionFile.value)) return;
  uploadProgress.value = 0;
  uploadCancelled.value = false;
  buttonLoading.value = true;
  try {
    const data = new FormData();
    appendIfPresent(data, 'versionNote', versionForm.versionNote);
    data.append('file', versionFile.value.raw);
    beginFileUpload();
    await uploadDepartmentDocumentVersion(versionTarget.value.id, data, { onUploadProgress: handleUploadProgress, signal: uploadAbortController.value?.signal });
    endFileUpload();
    uploadProgress.value = 100;
    modal.msgSuccess('新版本上传成功');
    versionDialog.visible = false;
    await getList();
  } catch (error) {
    if (!uploadCancelled.value) throw error;
  } finally {
    endFileUpload();
    buttonLoading.value = false;
  }
};

const handleDelete = async (row: DepartmentDocumentVO) => {
  await modal.confirm(`确认将资料“${row.title}”移入回收站吗？`);
  await delDepartmentDocument(row.id);
  modal.msgSuccess('资料已移入回收站');
  await getList();
};

const handleRestore = async (row: DepartmentDocumentVO) => {
  await modal.confirm(`确认恢复资料“${row.title}”吗？`);
  await restoreDepartmentDocument(row.id);
  modal.msgSuccess('资料已恢复');
  await getList();
};

const handleDownload = async (row: DepartmentDocumentVO) => {
  const blob = await downloadDepartmentDocument(row.id);
  saveBlob(blob, row.currentOriginalName || `${row.title}${row.currentFileSuffix || ''}`);
};

const releasePreviewUrl = () => {
  if (previewObjectUrl.value && previewUrl.value) URL.revokeObjectURL(previewUrl.value);
  previewUrl.value = '';
  previewContentType.value = '';
  previewObjectUrl.value = false;
};

const resetPreviewState = () => {
  if (previewLoadingTimer.value) clearTimeout(previewLoadingTimer.value);
  previewLoadingTimer.value = undefined;
  releasePreviewUrl();
  previewFileName.value = '';
  previewFileSuffix.value = '';
  previewFileSize.value = undefined;
  previewMediaState.value = 'idle';
  previewErrorMessage.value = '';
  previewErrorHint.value = '';
  previewVersion.value = undefined;
};

const setPreviewError = (message: string, hint: string) => {
  if (previewLoadingTimer.value) clearTimeout(previewLoadingTimer.value);
  previewLoadingTimer.value = undefined;
  previewMediaState.value = 'error';
  previewErrorMessage.value = message;
  previewErrorHint.value = hint;
  previewDialog.loading = false;
};

const isVideoFile = (suffix?: string) => videoSuffixes.has((suffix || '').toLowerCase());

const schedulePreviewTimeout = (requestId: number) => {
  if (previewLoadingTimer.value) clearTimeout(previewLoadingTimer.value);
  previewLoadingTimer.value = setTimeout(() => {
    if (requestId === previewRequestId.value && previewMediaState.value === 'loading') {
      setPreviewError('视频响应超时，浏览器没有拿到媒体内容', '请检查 OSS 地址是否可从浏览器访问，以及对象存储是否返回 200/206 和 Accept-Ranges: bytes。');
    }
  }, 12000);
};

const handlePreview = async (row: DepartmentDocumentVO) => {
  const requestId = ++previewRequestId.value;
  const suffix = (row.currentFileSuffix || '').toLowerCase();
  resetPreviewState();
  previewKind.value = ['.mp4', '.webm', '.ogg'].includes(suffix)
    ? 'video'
    : suffix === '.pdf'
      ? 'pdf'
      : ['.jpg', '.jpeg', '.png', '.gif'].includes(suffix)
        ? 'image'
        : 'none';
  const isVideoPreview = previewKind.value === 'video';
  previewDialog.title = `预览：${row.title}`;
  previewDialog.row = row;
  previewDialog.versionId = undefined;
  previewVersion.value = undefined;
  previewFileName.value = row.currentOriginalName || row.title;
  previewFileSuffix.value = suffix;
  previewFileSize.value = row.currentFileSize;
  previewMediaState.value = previewKind.value === 'video' ? 'loading' : 'idle';
  previewDialog.visible = true;
  previewDialog.loading = true;
  try {
    if (isVideoPreview) {
      const response = await getDepartmentDocumentVideoPreview(row.id);
      if (requestId === previewRequestId.value) {
        previewUrl.value = response.data?.playbackUrl || '';
        previewContentType.value = response.data?.contentType || '';
        previewFileName.value = response.data?.fileName || previewFileName.value;
        previewFileSize.value = response.data?.fileSize || previewFileSize.value;
        if (!previewUrl.value) {
          setPreviewError('没有获取到有效的播放地址', '请检查对象存储配置，或重新上传该视频。');
        } else {
          schedulePreviewTimeout(requestId);
        }
      }
    } else if (previewKind.value !== 'none') {
      const blob = await previewDepartmentDocument(row.id);
      if (requestId === previewRequestId.value) {
        previewUrl.value = URL.createObjectURL(blob);
        previewObjectUrl.value = true;
        previewMediaState.value = 'ready';
      }
    }
  } catch {
    if (requestId === previewRequestId.value && isVideoPreview) {
      setPreviewError('播放地址获取失败', '可能是临时链接、对象存储地址或当前登录权限已失效。');
    }
  } finally {
    if (requestId === previewRequestId.value && !isVideoPreview) {
      previewDialog.loading = false;
    }
  }
};

const handleVersionPreview = async (version: DepartmentDocumentVersionVO) => {
  if (!isVideoFile(version.fileSuffix) || !version.id || !version.documentId) return;
  const requestId = ++previewRequestId.value;
  resetPreviewState();
  previewKind.value = 'video';
  previewVersion.value = version;
  previewDialog.title = `预览：${detailData.value?.title || '资料'} · v${version.versionNo}`;
  previewDialog.row = undefined;
  previewDialog.versionId = version.id;
  previewFileName.value = version.originalName;
  previewFileSuffix.value = (version.fileSuffix || '').toLowerCase();
  previewFileSize.value = version.fileSize;
  previewMediaState.value = 'loading';
  previewDialog.visible = true;
  previewDialog.loading = true;
  try {
    const response = await getDepartmentDocumentVideoVersionPreview(version.documentId, version.id);
    if (requestId === previewRequestId.value) {
      previewUrl.value = response.data?.playbackUrl || '';
      previewContentType.value = response.data?.contentType || '';
      previewFileName.value = response.data?.fileName || previewFileName.value;
      previewFileSize.value = response.data?.fileSize || previewFileSize.value;
      if (!previewUrl.value) {
        setPreviewError('没有获取到有效的播放地址', '请检查对象存储配置，或重新上传该视频。');
      } else {
        schedulePreviewTimeout(requestId);
      }
    }
  } catch {
    if (requestId === previewRequestId.value) {
      setPreviewError('播放地址获取失败', '可能是临时链接、对象存储地址或当前登录权限已失效。');
    }
  }
};

const closePreview = () => {
  previewRequestId.value += 1;
  resetPreviewState();
  previewDialog.visible = false;
};

const handleVideoReady = () => {
  if (previewLoadingTimer.value) clearTimeout(previewLoadingTimer.value);
  previewLoadingTimer.value = undefined;
  previewMediaState.value = 'ready';
  previewDialog.loading = false;
};

const handleVideoError = (event: Event) => {
  if (previewMediaState.value === 'error') return;
  const media = event.target as HTMLVideoElement;
  const errorCode = media.error?.code;
  const message = errorCode === MediaError.MEDIA_ERR_NETWORK
    ? '视频地址无法访问或对象存储未返回完整内容'
    : errorCode === MediaError.MEDIA_ERR_DECODE
      ? '视频编码无法解码，或文件内容已损坏'
      : errorCode === MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED
        ? '当前浏览器不支持该视频编码或响应类型'
        : '浏览器未能加载该视频';
  const hint = errorCode === MediaError.MEDIA_ERR_DECODE || errorCode === MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED
    ? '建议转换为 H.264 + AAC 的 MP4；如果是网络问题，请检查 OSS 的 CORS、Range 和 Content-Type。'
    : '请检查 OSS 临时地址是否可从浏览器访问、是否已过期，以及 Nginx 是否允许 Range 请求。';
  setPreviewError(message, hint);
  modal.msgError(message);
};

const retryPreview = () => {
  if (previewVersion.value) {
    handleVersionPreview(previewVersion.value);
  } else if (previewDialog.row) {
    handlePreview(previewDialog.row);
  }
};

const formatFileSize = (size?: number) => {
  if (!size) return '—';
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  if (size < 1024 * 1024 * 1024) return `${(size / 1024 / 1024).toFixed(1)} MB`;
  return `${(size / 1024 / 1024 / 1024).toFixed(1)} GB`;
};

const statusLabel = (status?: string) => ({ DRAFT: '草稿', ARCHIVED: '已归档', PUBLISHED: '已发布' })[status || ''] || '已发布';
const statusTagType = (status?: string) => (status === 'DRAFT' ? 'warning' : status === 'ARCHIVED' ? 'info' : 'success');
const expiryState = (row: DepartmentDocumentVO) => {
  if (!row.expireDate) return 'normal';
  const expireTime = new Date(`${row.expireDate}T23:59:59`).getTime();
  if (Number.isNaN(expireTime)) return 'normal';
  const days = Math.ceil((expireTime - Date.now()) / (24 * 60 * 60 * 1000));
  if (days < 0) return 'expired';
  if (days <= 30) return 'expiring';
  return 'normal';
};
const expiryLabel = (row: DepartmentDocumentVO) => {
  const state = expiryState(row);
  if (state === 'expired') return `已于 ${row.expireDate} 失效`;
  if (state === 'expiring') {
    const expireTime = new Date(`${row.expireDate}T23:59:59`).getTime();
    const days = Math.max(0, Math.ceil((expireTime - Date.now()) / (24 * 60 * 60 * 1000)));
    return days === 0 ? '今日失效' : `${days} 天后失效`;
  }
  return '';
};
const expiryTagType = (row: DepartmentDocumentVO) => (expiryState(row) === 'expired' ? 'danger' : 'warning');
const fileIconText = (suffix?: string) => (suffix || '').replace('.', '').slice(0, 4).toUpperCase() || 'FILE';
const fileIconClass = (suffix?: string) => {
  const value = (suffix || '').toLowerCase();
  if (value === '.pdf') return 'pdf';
  if (['.doc', '.docx'].includes(value)) return 'word';
  if (['.xls', '.xlsx', '.csv'].includes(value)) return 'excel';
  if (['.mp4', '.webm', '.ogg'].includes(value)) return 'video';
  if (['.jpg', '.jpeg', '.png', '.gif'].includes(value)) return 'image';
  return 'other';
};

onMounted(() => {
  getCategoryOptions();
  getProjectOptions();
  getList();
});
</script>

<style scoped lang="scss">
.department-document-page {
  .document-hero { border: 0; background: linear-gradient(135deg, #12233d 0%, #1e4d75 52%, #228b9b 100%); color: #fff; }
  .hero-content { display: flex; align-items: center; justify-content: space-between; gap: 24px; }
  .hero-content { min-height: 126px; padding: 4px 8px; }
  .hero-kicker { letter-spacing: 0.14em; font-size: 12px; font-weight: 700; }
  .hero-kicker { color: #8ddcf0; }
  h2 { margin: 10px 0 8px; font-size: 28px; }
  h3 { margin: 4px 0; }
  .hero-content p { margin: 0; color: var(--el-text-color-secondary); font-size: 13px; }
  .hero-content p { color: rgba(255, 255, 255, 0.72); max-width: 660px; }
  .hero-stats { display: flex; gap: 34px; padding-right: 14px; }
  .hero-stats div { min-width: 74px; text-align: center; }
  .hero-stats strong, .hero-stats span { display: block; }
  .hero-stats strong { font-size: 28px; line-height: 1.15; }
  .hero-stats span { margin-top: 8px; color: rgba(255, 255, 255, 0.66); font-size: 12px; }
  .document-card { border-radius: 12px; }
  .library-layout { display: grid; grid-template-columns: 228px minmax(0, 1fr); gap: 20px; min-width: 0; }
  .library-sidebar { min-height: 540px; padding: 18px 12px; border: 1px solid var(--app-surface-border); border-radius: 16px; background: var(--app-surface-bg); }
  .sidebar-heading, .category-heading, .library-toolbar, .document-card-footer, .list-file-meta, .list-file-owner { display: flex; align-items: center; }
  .sidebar-heading, .category-heading, .library-toolbar { justify-content: space-between; }
  .sidebar-heading { padding: 0 8px 14px; }
  .sidebar-heading strong, .category-heading { color: var(--app-text-title); font-size: 14px; font-weight: 700; }
  .sidebar-kicker, .quick-view-kicker { display: block; color: var(--el-color-primary); font-size: 10px; font-weight: 800; letter-spacing: 0.14em; line-height: 1.4; }
  .sidebar-kicker { margin-bottom: 3px; }
  .quick-nav { display: grid; gap: 4px; }
  .quick-nav-item { display: flex; align-items: center; gap: 10px; width: 100%; padding: 10px 10px; border: 0; border-radius: 10px; color: var(--app-text-muted); background: transparent; font-size: 13px; text-align: left; cursor: pointer; transition: 0.18s ease; }
  .quick-nav-item:hover { color: var(--app-text-title); background: var(--el-fill-color-light); }
  .quick-nav-item.active { color: var(--el-color-primary); background: var(--el-color-primary-light-9); font-weight: 600; }
  .quick-nav-item .el-icon { font-size: 17px; }
  .quick-nav-item small { margin-left: auto; color: var(--app-text-muted); font-size: 11px; }
  .sidebar-divider, .quick-view-divider { height: 1px; margin: 18px 8px; background: var(--app-surface-border); }
  .category-heading { padding: 0 8px 8px; }
  .category-tree { padding: 0 2px; background: transparent; }
  .category-tree :deep(.el-tree-node__content) { height: 40px; padding-right: 8px; border-radius: 9px; color: var(--app-text-muted); }
  .category-tree :deep(.el-tree-node__content:hover), .category-tree :deep(.is-current > .el-tree-node__content) { color: var(--el-color-primary); background: var(--el-color-primary-light-9); }
  .category-tree :deep(.el-tree-node__expand-icon) { color: var(--app-text-muted); }
  .category-tree-node { display: flex; align-items: center; gap: 8px; min-width: 0; width: 100%; }
  .category-tree-node .el-icon { flex: 0 0 auto; color: var(--el-color-warning); }
  .category-tree-label { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .category-tree-count { margin-left: auto; color: var(--app-text-muted); font-size: 11px; }
  .category-empty { display: flex; align-items: center; justify-content: center; flex-direction: column; gap: 8px; padding: 34px 8px; color: var(--app-text-muted); font-size: 12px; text-align: center; }
  .category-empty .el-icon { color: var(--el-color-warning); font-size: 28px; }
  .library-main { min-width: 0; }
  .selection-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 12px; min-height: 42px; margin-bottom: 10px; padding: 7px 10px 7px 14px; border: 1px solid color-mix(in srgb, var(--el-color-primary) 22%, var(--app-surface-border)); border-radius: 11px; background: var(--el-color-primary-light-9); }
  .selection-summary, .selection-actions { display: flex; align-items: center; gap: 12px; }
  .selection-summary > span { color: var(--el-color-primary); font-size: 12px; font-weight: 600; }
  .card-select { position: absolute; z-index: 3; top: 11px; right: 11px; padding: 4px 6px; border: 1px solid rgba(255, 255, 255, 0.2); border-radius: 8px; background: rgba(8, 15, 30, 0.28); box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); backdrop-filter: blur(4px); }
  .card-select :deep(.el-checkbox), .list-select :deep(.el-checkbox) { margin: 0; }
  .card-select :deep(.el-checkbox__label), .list-select :deep(.el-checkbox__label) { display: none; }
  .card-select :deep(.el-checkbox__inner) { border-color: rgba(255, 255, 255, 0.84); background: transparent; }
  .card-select :deep(.el-checkbox__input.is-checked .el-checkbox__inner) { border-color: var(--el-color-primary); background: var(--el-color-primary); }
  .library-toolbar { gap: 16px; min-height: 40px; margin-bottom: 14px; }
  .library-breadcrumb { display: flex; align-items: center; gap: 8px; min-width: 0; color: var(--app-text-muted); font-size: 13px; }
  .library-breadcrumb > .el-icon:first-child { color: var(--el-color-primary); font-size: 17px; }
  .breadcrumb-parent { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .library-breadcrumb strong { overflow: hidden; color: var(--app-text-title); text-overflow: ellipsis; white-space: nowrap; }
  .breadcrumb-arrow { color: var(--app-text-muted); font-size: 13px; }
  .library-toolbar-tools { display: flex; align-items: center; gap: 12px; flex: 0 0 auto; }
  .result-count { color: var(--app-text-muted); font-size: 12px; }
  .view-switch .el-button { width: 34px; height: 32px; padding: 0; }
  .document-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 320px)); align-content: start; align-items: stretch; gap: 18px; min-height: 260px; padding: 2px; }
  .document-card-item { position: relative; display: flex; min-width: 0; min-height: 326px; flex-direction: column; overflow: hidden; border: 1px solid var(--app-surface-border); border-radius: 16px; background: linear-gradient(180deg, var(--app-surface-bg) 0%, color-mix(in srgb, var(--app-surface-bg) 88%, var(--el-color-primary-light-9)) 100%); box-shadow: 0 6px 16px rgba(15, 23, 42, 0.05); cursor: pointer; transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease; }
  .document-card-item::before { position: absolute; z-index: 1; top: 0; right: 18px; left: 18px; height: 3px; border-radius: 0 0 6px 6px; background: color-mix(in srgb, var(--el-color-primary) 72%, transparent); content: ''; opacity: 0.7; }
  .document-card-item:hover { border-color: color-mix(in srgb, var(--el-color-primary) 48%, var(--app-surface-border)); box-shadow: 0 14px 30px rgba(15, 23, 42, 0.14); transform: translateY(-2px); }
  .document-card-item.selected { border-color: var(--el-color-primary); box-shadow: 0 0 0 2px color-mix(in srgb, var(--el-color-primary) 20%, transparent), 0 14px 30px rgba(15, 23, 42, 0.14); }
  .document-cover, .quick-view-cover { position: relative; overflow: hidden; }
  .document-cover { display: flex; align-items: center; justify-content: center; height: 156px; flex: 0 0 156px; color: #fff; }
  .document-cover.pdf, .quick-view-cover.pdf { background: linear-gradient(135deg, #b5475b, #ef7d66); }
  .document-cover.word, .quick-view-cover.word { background: linear-gradient(135deg, #2864bd, #59a2f2); }
  .document-cover.excel, .quick-view-cover.excel { background: linear-gradient(135deg, #147451, #3dc18d); }
  .document-cover.video, .quick-view-cover.video { background: linear-gradient(135deg, #a8444c, #f5a84a); }
  .document-cover.image, .quick-view-cover.image { background: linear-gradient(135deg, #5b54b2, #b27cf3); }
  .document-cover.other, .quick-view-cover.other { background: linear-gradient(135deg, #44546d, #8495ad); }
  .cover-glow, .quick-cover-pattern { position: absolute; inset: -35%; opacity: 0.42; background: radial-gradient(circle at 26% 24%, rgba(255,255,255,0.44) 0 2px, transparent 3px), radial-gradient(circle at 72% 68%, rgba(255,255,255,0.3) 0 1px, transparent 2px), linear-gradient(125deg, transparent 44%, rgba(255,255,255,0.1) 45%, transparent 58%); transform: rotate(-12deg); }
  .cover-file-mark { position: relative; z-index: 1; display: flex; align-items: center; flex-direction: column; gap: 8px; padding: 13px 20px 12px; border: 1px solid rgba(255, 255, 255, 0.24); border-radius: 17px; background: rgba(12, 22, 42, 0.16); box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.16), 0 10px 24px rgba(12, 20, 40, 0.12); text-shadow: 0 2px 8px rgba(0, 0, 0, 0.2); backdrop-filter: blur(4px); }
  .cover-file-mark .el-icon { display: inline-flex; align-items: center; justify-content: center; width: 48px; height: 48px; border: 1px solid rgba(255, 255, 255, 0.28); border-radius: 14px; background: rgba(255, 255, 255, 0.16); font-size: 28px; }
  .cover-file-mark span { font-size: 16px; font-weight: 800; letter-spacing: 0.08em; }
  .cover-footer { position: absolute; z-index: 1; right: 13px; bottom: 11px; left: 13px; display: flex; justify-content: space-between; color: rgba(255, 255, 255, 0.84); font-size: 11px; }
  .cover-footer span { padding: 4px 7px; border: 1px solid rgba(255, 255, 255, 0.18); border-radius: 999px; background: rgba(9, 18, 34, 0.16); backdrop-filter: blur(3px); }
  .cover-hover { position: absolute; z-index: 2; inset: 0; display: flex; align-items: center; justify-content: center; opacity: 0; background: linear-gradient(180deg, rgba(8, 15, 30, 0.12), rgba(8, 15, 30, 0.5)); transition: opacity 0.2s ease; }
  .document-card-item:hover .cover-hover { opacity: 1; }
  .cover-hover .el-button { width: 44px; height: 44px; border: 1px solid rgba(255, 255, 255, 0.5); color: #fff; background: rgba(255, 255, 255, 0.18); box-shadow: 0 8px 20px rgba(0, 0, 0, 0.18); backdrop-filter: blur(5px); }
  .document-card-body { display: flex; min-width: 0; flex: 1; flex-direction: column; padding: 15px 16px 14px; }
  .document-card-title, .document-card-file, .document-card-meta { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .document-card-title { color: var(--app-text-title); font-size: 14px; font-weight: 700; }
  .document-card-file { margin-top: 5px; color: var(--app-text-muted); font-size: 11px; }
  .document-card-expiry { display: flex; align-items: center; gap: 4px; margin-top: 9px; font-size: 11px; }
  .document-card-expiry.expiring { color: var(--el-color-warning); }
  .document-card-expiry.expired { color: var(--el-color-danger); }
  .document-card-tags { display: flex; align-items: center; gap: 5px; min-height: 24px; margin-top: 11px; overflow: hidden; }
  .document-card-tags .el-tag { max-width: 96px; overflow: hidden; text-overflow: ellipsis; }
  .more-tags { color: var(--app-text-muted); font-size: 11px; }
  .document-card-meta { display: flex; align-items: center; gap: 7px; margin-top: 11px; color: var(--app-text-muted); font-size: 11px; }
  .document-card-meta i, .list-file-meta i { width: 3px; height: 3px; flex: 0 0 auto; border-radius: 50%; background: var(--app-text-muted); }
  .document-card-footer { justify-content: space-between; gap: 8px; margin-top: auto; padding-top: 14px; color: var(--app-text-muted); font-size: 11px; }
  .document-card-footer > span { display: inline-flex; align-items: center; gap: 5px; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .grid-empty { grid-column: 1 / -1; min-height: 260px; }
  .document-list-view { display: grid; align-content: start; gap: 10px; min-height: 260px; }
  .document-list-item { position: relative; display: flex; align-items: center; gap: 14px; min-width: 0; min-height: 88px; padding: 11px 14px; border: 1px solid var(--app-surface-border); border-radius: 14px; background: var(--app-surface-bg); box-shadow: 0 4px 12px rgba(15, 23, 42, 0.04); cursor: pointer; transition: 0.18s ease; }
  .document-list-item::before { position: absolute; top: 50%; left: 0; width: 3px; height: 30px; border-radius: 0 4px 4px 0; background: color-mix(in srgb, var(--el-color-primary) 72%, transparent); content: ''; opacity: 0.8; transform: translateY(-50%); }
  .document-list-item:hover { border-color: color-mix(in srgb, var(--el-color-primary) 44%, var(--app-surface-border)); background: var(--el-fill-color-light); box-shadow: 0 8px 20px rgba(15, 23, 42, 0.09); transform: translateY(-1px); }
  .document-list-item.selected { border-color: var(--el-color-primary); box-shadow: 0 0 0 2px color-mix(in srgb, var(--el-color-primary) 17%, transparent), 0 8px 20px rgba(15, 23, 42, 0.09); }
  .list-select { flex: 0 0 auto; }
  .list-file-icon { display: inline-flex; align-items: center; justify-content: center; width: 48px; height: 54px; flex: 0 0 auto; border-radius: 13px; color: #fff; font-size: 10px; font-weight: 800; box-shadow: 0 6px 12px rgba(15, 23, 42, 0.12); }
  .list-file-icon.pdf { background: linear-gradient(135deg, #ef5757, #b72745); }
  .list-file-icon.word { background: linear-gradient(135deg, #3b82f6, #2554ae); }
  .list-file-icon.excel { background: linear-gradient(135deg, #23a86c, #15744d); }
  .list-file-icon.video { background: linear-gradient(135deg, #ef8b3a, #bd4d34); }
  .list-file-icon.image { background: linear-gradient(135deg, #9b7af5, #6351b9); }
  .list-file-icon.other { background: linear-gradient(135deg, #76869a, #445064); }
  .list-file-main { min-width: 0; flex: 1; }
  .list-file-title, .list-file-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .list-file-title { color: var(--app-text-title); font-size: 14px; font-weight: 700; }
  .list-file-name { margin-top: 4px; color: var(--app-text-muted); font-size: 11px; }
  .list-file-meta { gap: 7px; margin-top: 8px; color: var(--app-text-muted); font-size: 11px; }
  .list-file-owner { align-items: flex-end; flex: 0 0 132px; flex-direction: column; gap: 4px; color: var(--app-text-title); font-size: 12px; }
  .list-file-owner small { color: var(--app-text-muted); font-size: 11px; }
  .list-expiry { display: inline-flex; align-items: center; gap: 4px; flex: 0 0 auto; font-size: 11px; white-space: nowrap; }
  .list-expiry.expiring { color: var(--el-color-warning); }
  .list-expiry.expired { color: var(--el-color-danger); }
  .list-file-actions { display: flex; align-items: center; flex: 0 0 auto; gap: 1px; opacity: 0.82; transition: opacity 0.18s ease; }
  .document-list-item:hover .list-file-actions, .document-list-item:focus-within .list-file-actions { opacity: 1; }
  .list-file-actions .el-button { padding: 6px 7px; font-size: 12px; }
  .document-list-view > .el-empty { grid-column: 1 / -1; }
  .document-tab-label { display: inline-flex; align-items: center; gap: 6px; }
  :deep(.department-document-category-panel.is-embedded .table-panel) { border: 0; box-shadow: none; }
  .toolbar-actions, .query-actions { display: flex; flex-wrap: wrap; gap: 8px; }
  .query-form { display: grid; grid-template-columns: minmax(230px, 1.3fr) repeat(5, minmax(130px, 1fr)) auto; align-items: center; gap: 12px 14px; margin-bottom: 16px; padding: 12px 14px; border: 1px solid color-mix(in srgb, var(--app-surface-border) 82%, transparent); border-radius: 12px; background: var(--el-fill-color-light); }
  :deep(.query-form .el-form-item) { min-width: 0; margin: 0; }
  :deep(.query-form .el-form-item__label) { flex: 0 0 auto; padding-right: 8px; white-space: nowrap; }
  :deep(.query-form .el-form-item__content) { min-width: 0; flex: 1; }
  :deep(.query-form .el-input), :deep(.query-form .el-select), :deep(.query-form .el-tree-select) { width: 100% !important; }
  .query-actions { align-items: center; justify-content: flex-end; margin: 0; }
  .title-cell { display: flex; align-items: center; gap: 10px; min-width: 0; }
  .file-icon { display: inline-flex; flex: 0 0 42px; align-items: center; justify-content: center; width: 42px; height: 46px; border-radius: 10px; color: #fff; font-size: 10px; font-weight: 800; }
  .file-icon.pdf { background: linear-gradient(135deg, #ef5757, #b72745); }
  .file-icon.word { background: linear-gradient(135deg, #3b82f6, #2554ae); }
  .file-icon.excel { background: linear-gradient(135deg, #23a86c, #15744d); }
  .file-icon.video { background: linear-gradient(135deg, #ef8b3a, #bd4d34); }
  .file-icon.image { background: linear-gradient(135deg, #9b7af5, #6351b9); }
  .file-icon.other { background: linear-gradient(135deg, #76869a, #445064); }
  .document-title, .document-file-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .document-title { color: var(--el-text-color-primary); font-weight: 600; }
  .document-file-name { margin-top: 4px; color: var(--el-text-color-secondary); font-size: 12px; }
  .version-tip { margin-bottom: 18px; padding: 12px 14px; border-radius: 8px; color: var(--el-color-primary); background: var(--el-color-primary-light-9); }
  .upload-progress { margin: 0 0 8px; }
  .detail-description { white-space: pre-wrap; line-height: 1.7; }
  .version-operation-placeholder { color: var(--el-text-color-placeholder); }
  @media (max-width: 900px) {
    .library-layout { grid-template-columns: 1fr; }
    .library-sidebar { min-height: 0; }
    .quick-nav { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .category-tree { max-height: 230px; overflow-y: auto; }
    .hero-content { align-items: flex-start; flex-direction: column; }
    .hero-stats { width: 100%; justify-content: space-between; padding-right: 0; }
    .query-form { grid-template-columns: repeat(3, minmax(0, 1fr)); }
    .query-actions { grid-column: 1 / -1; justify-content: flex-end; }
  }
  @media (max-width: 700px) {
    .selection-toolbar { align-items: flex-start; flex-direction: column; }
    .library-toolbar { align-items: flex-start; flex-direction: column; }
    .library-toolbar-tools { justify-content: space-between; width: 100%; }
    .query-form { grid-template-columns: 1fr; gap: 10px; }
    .query-actions { grid-column: auto; justify-content: flex-start; }
    .document-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
    .document-cover { height: 124px; flex-basis: 124px; }
    .document-card-body { padding: 11px; }
    .document-list-item { align-items: flex-start; flex-wrap: wrap; }
    .list-file-main { min-width: calc(100% - 106px); }
    .list-file-owner { flex: 1; align-items: flex-start; margin-left: 60px; }
    .list-file-actions { margin-left: auto; }
    .list-expiry { margin-left: 60px; }
  }
}

:global(.el-drawer.document-quick-view) { background: var(--el-bg-color); }
:global(.document-quick-view .el-drawer__body) { padding: 0 !important; }
.quick-view-content { min-height: 100%; padding: 24px; color: var(--app-text-title); background: var(--el-bg-color); }
.quick-view-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
.quick-view-header h3 { margin: 4px 0 0; color: var(--app-text-title); font-size: 20px; }
.quick-view-cover { display: flex; align-items: center; justify-content: center; height: 190px; margin-top: 22px; border-radius: 16px; color: #fff; cursor: pointer; }
.quick-view-cover.pdf { background: linear-gradient(135deg, #b5475b, #ef7d66); }
.quick-view-cover.word { background: linear-gradient(135deg, #2864bd, #59a2f2); }
.quick-view-cover.excel { background: linear-gradient(135deg, #147451, #3dc18d); }
.quick-view-cover.video { background: linear-gradient(135deg, #a8444c, #f5a84a); }
.quick-view-cover.image { background: linear-gradient(135deg, #5b54b2, #b27cf3); }
.quick-view-cover.other { background: linear-gradient(135deg, #44546d, #8495ad); }
.quick-view-cover-loading { gap: 10px; border: 1px solid var(--app-surface-border); color: var(--app-text-muted); background: var(--el-fill-color-light); cursor: default; }
.quick-view-cover-loading .el-icon { color: var(--el-color-primary); font-size: 24px; }
.quick-view-media { position: relative; display: flex; align-items: center; justify-content: center; aspect-ratio: 16 / 9; min-height: 190px; margin-top: 22px; overflow: hidden; border: 1px solid rgba(22, 38, 64, 0.14); border-radius: 16px; background: #0b1220; box-shadow: 0 10px 24px rgba(15, 23, 42, 0.12); cursor: pointer; }
.quick-view-media-video, .quick-view-media-image { display: block; width: 100%; height: 100%; object-fit: cover; background: #0b1220; }
.quick-view-media-image { object-fit: contain; }
.quick-view-media-gradient { position: absolute; inset: 0; pointer-events: none; background: linear-gradient(180deg, rgba(4, 10, 21, 0.08) 35%, rgba(4, 10, 21, 0.7) 100%); }
.quick-view-media-badge { position: absolute; top: 12px; left: 12px; display: inline-flex; align-items: center; gap: 6px; padding: 6px 9px; border: 1px solid rgba(255, 255, 255, 0.22); border-radius: 999px; color: rgba(255, 255, 255, 0.92); background: rgba(8, 15, 30, 0.46); box-shadow: 0 6px 16px rgba(0, 0, 0, 0.14); backdrop-filter: blur(8px); font-size: 11px; }
.quick-view-media-play { position: absolute; right: 14px; bottom: 12px; left: 14px; display: flex; align-items: center; justify-content: center; gap: 6px; padding: 9px; border: 1px solid rgba(255, 255, 255, 0.26); border-radius: 10px; color: #fff; background: rgba(8, 15, 30, 0.48); box-shadow: 0 7px 18px rgba(0, 0, 0, 0.16); backdrop-filter: blur(8px); font-size: 12px; transition: background 0.18s ease, transform 0.18s ease; }
.quick-view-media:hover .quick-view-media-play { background: rgba(34, 116, 194, 0.78); transform: translateY(-1px); }
.quick-cover-mark { position: relative; display: flex; align-items: center; flex-direction: column; gap: 10px; }
.quick-cover-mark .el-icon { font-size: 40px; }
.quick-cover-mark strong { font-size: 25px; letter-spacing: 0.12em; }
.quick-cover-pattern { position: absolute; inset: -35%; opacity: 0.42; background: radial-gradient(circle at 26% 24%, rgba(255,255,255,0.44) 0 2px, transparent 3px), radial-gradient(circle at 72% 68%, rgba(255,255,255,0.3) 0 1px, transparent 2px), linear-gradient(125deg, transparent 44%, rgba(255,255,255,0.1) 45%, transparent 58%); transform: rotate(-12deg); }
.quick-cover-status { position: absolute; top: 13px; right: 13px; left: 13px; display: flex; align-items: center; justify-content: center; gap: 5px; padding: 7px 9px; border: 1px solid rgba(255, 255, 255, 0.22); border-radius: 9px; color: rgba(255, 255, 255, 0.9); background: rgba(8, 15, 30, 0.26); font-size: 11px; }
.quick-cover-action { position: absolute; right: 14px; bottom: 12px; left: 14px; display: flex; align-items: center; justify-content: center; gap: 6px; padding: 8px; border: 1px solid rgba(255, 255, 255, 0.24); border-radius: 9px; color: rgba(255, 255, 255, 0.88); background: rgba(0, 0, 0, 0.15); font-size: 12px; }
.quick-view-title-row { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; margin-top: 20px; }
.quick-view-statuses { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 5px; }
.quick-view-title { min-width: 0; color: var(--app-text-title); font-size: 18px; font-weight: 750; line-height: 1.45; }
.quick-view-file-name { margin-top: 5px; overflow: hidden; color: var(--app-text-muted); font-size: 12px; text-overflow: ellipsis; white-space: nowrap; }
.quick-view-tags { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 14px; }
.quick-view-actions { display: flex; gap: 10px; margin-top: 20px; }
.quick-view-actions .el-button { flex: 1; }
.quick-view-divider { margin: 22px 0; }
.quick-view-meta { display: grid; grid-template-columns: 1fr 1fr; gap: 18px 14px; margin: 0; }
.quick-view-meta div { min-width: 0; }
.quick-view-meta dt { color: var(--app-text-muted); font-size: 11px; }
.quick-view-meta dd { margin: 5px 0 0; overflow: hidden; color: var(--app-text-title); font-size: 13px; text-overflow: ellipsis; white-space: nowrap; }
.quick-view-description { margin-top: 24px; padding-top: 18px; border-top: 1px solid var(--app-surface-border); }
.quick-view-description > span { color: var(--app-text-muted); font-size: 11px; }
.quick-view-description p { margin: 8px 0 0; color: var(--app-text-title); font-size: 13px; line-height: 1.7; white-space: pre-wrap; }
.quick-view-footer-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 24px; }

// el-dialog with append-to-body is teleported outside the page scope. Keep its
// shell selectors global while the inner preview nodes retain the component scope id.
:global(.el-dialog.document-preview-dialog) { padding: 0 !important; overflow: hidden; border-radius: 18px; background: var(--el-bg-color); }
:global(.document-preview-dialog .el-dialog__header) { margin-right: 0; padding: 20px 26px 16px; border-bottom: 1px solid #e8edf5; background: rgba(255, 255, 255, 0.96); }
:global(.document-preview-dialog .el-dialog__headerbtn) { top: 20px; right: 22px; width: 34px; height: 34px; border-radius: 50%; background: #eef2f7; }
:global(.document-preview-dialog .el-dialog__headerbtn .el-dialog__close) { color: #6b778c; }
:global(.el-dialog.document-preview-dialog .el-dialog__body) { padding: 0 20px !important; }
:global(.el-dialog.document-preview-dialog .el-dialog__footer) { padding: 14px 20px !important; border-top: 0; background: transparent; }
.preview-dialog-header { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding-right: 42px; }
.preview-dialog-eyebrow { color: #8b98aa; font-size: 11px; font-weight: 800; letter-spacing: 0.16em; }
.preview-dialog-title { margin-top: 4px; color: #1c2a3d; font-size: 20px; font-weight: 750; line-height: 1.2; }
.preview-shell { padding: 0; }
.preview-file-summary { display: flex; align-items: center; gap: 14px; min-height: 68px; margin-bottom: 16px; padding: 10px 14px; border: 1px solid #e5ebf3; border-radius: 14px; background: #fff; box-shadow: 0 5px 18px rgba(25, 45, 75, 0.04); }
.preview-file-icon { display: inline-flex; flex: 0 0 40px; align-items: center; justify-content: center; width: 40px; height: 44px; border-radius: 10px; color: #fff; font-size: 11px; font-weight: 700; }
.preview-file-icon.pdf { background: linear-gradient(145deg, #f06a6a, #b72e4e); }
.preview-file-icon.word { background: linear-gradient(145deg, #4d91f7, #2b5cb7); }
.preview-file-icon.excel { background: linear-gradient(145deg, #34b77b, #18744f); }
.preview-file-icon.video { background: linear-gradient(145deg, #f0a04a, #c74a31); }
.preview-file-icon.image { background: linear-gradient(145deg, #a589f6, #6553b7); }
.preview-file-icon.other { background: linear-gradient(145deg, #8292a8, #4d5b70); }
.preview-file-text { min-width: 0; flex: 1; }
.preview-file-title { overflow: hidden; color: #26364c; font-size: 15px; font-weight: 700; text-overflow: ellipsis; white-space: nowrap; }
.preview-file-meta { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; margin-top: 6px; color: #8a96a8; font-size: 12px; }
.preview-file-meta i { display: inline-block; width: 3px; height: 3px; border-radius: 50%; background: #b4bfcc; }
.preview-container { position: relative; display: flex; align-items: center; justify-content: center; width: 100%; height: min(60vh, calc(100dvh - 210px), 600px); min-height: 0; padding: 0; overflow: hidden; border-radius: 12px; background: #f0f3f8; }
.preview-video-stage { background: #090d14; }
.preview-video { display: block; flex: 1 1 auto; width: 100%; min-width: 0; height: 100%; min-height: 0; object-fit: contain; background: #090d14; }
.preview-image { max-width: 100%; max-height: 100%; object-fit: contain; border-radius: 10px; box-shadow: 0 10px 28px rgba(25, 45, 75, 0.12); }
.preview-frame { width: 100%; height: 100%; border: 0; border-radius: 10px; background: #fff; }
.preview-loading-state, .preview-error-state { display: flex; align-items: center; justify-content: center; flex-direction: column; text-align: center; }
.preview-loading-state { gap: 10px; color: rgba(255, 255, 255, 0.72); font-size: 14px; }
.preview-loading-state .el-icon { color: #66b1ff; font-size: 26px; }
.preview-error-state { width: min(560px, 100%); min-height: 250px; padding: 30px; border: 1px solid rgba(255, 255, 255, 0.12); border-radius: 16px; color: #fff; background: rgba(10, 18, 32, 0.76); box-shadow: 0 18px 42px rgba(0, 0, 0, 0.22); }
.preview-error-icon { display: flex; align-items: center; justify-content: center; width: 48px; height: 48px; margin-bottom: 14px; border-radius: 50%; color: #ffb366; background: rgba(240, 160, 74, 0.16); font-size: 24px; }
.preview-error-state strong { font-size: 17px; }
.preview-error-state p { margin: 10px 0 6px; color: rgba(255, 255, 255, 0.86); font-size: 14px; }
.preview-error-state span { max-width: 470px; margin-bottom: 20px; color: rgba(255, 255, 255, 0.58); font-size: 12px; line-height: 1.7; }
@media (max-width: 900px) {
  :global(.document-preview-dialog .el-dialog__body) { padding: 0 14px 14px; }
  :global(.document-preview-dialog .el-dialog__footer) { padding: 12px 14px 16px; }
  .preview-container { height: min(56vh, calc(100dvh - 190px)); min-height: 0; padding: 0; border-radius: 10px; }
  .preview-file-summary { gap: 10px; margin-bottom: 12px; }
  .preview-file-summary > .el-tag { display: none; }
  .preview-file-meta span:last-child { max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
}
</style>

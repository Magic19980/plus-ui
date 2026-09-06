<template>
  <div class="community-tiptap-editor" :class="{ 'is-readonly': readOnly, 'is-uploading': uploading }">
    <div v-if="!readOnly" class="tiptap-toolbar" role="toolbar" aria-label="正文排版工具">
      <div class="toolbar-group toolbar-history-group">
        <button type="button" class="toolbar-button toolbar-icon-button" title="撤销" aria-label="撤销" :disabled="!editor?.can().undo()" @click="editor?.chain().focus().undo().run()"><TiptapToolbarIcon name="undo" /></button>
        <button type="button" class="toolbar-button toolbar-icon-button" title="重做" aria-label="重做" :disabled="!editor?.can().redo()" @click="editor?.chain().focus().redo().run()"><TiptapToolbarIcon name="redo" /></button>
      </div>
      <span class="toolbar-divider" />
      <el-dropdown class="toolbar-heading-dropdown" trigger="click" @command="handleBlockTypeCommand">
        <button type="button" class="toolbar-dropdown-trigger" aria-label="打开段落与标题菜单"><TiptapToolbarIcon name="heading" /><span>{{ blockTypeLabel }}</span><TiptapToolbarIcon name="chevron-down" :size="13" /></button>
        <template #dropdown>
          <el-dropdown-menu class="community-heading-menu">
            <el-dropdown-item command="paragraph" :class="{ 'is-current': currentBlockType === 'paragraph' }">正文</el-dropdown-item>
            <el-dropdown-item v-for="level in 6" :key="level" :command="`heading-${level}`" :class="{ 'is-current': currentBlockType === `heading-${level}` }">标题 {{ level }}</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
      <el-dropdown class="toolbar-list-dropdown" trigger="click" @command="handleListCommand">
        <button type="button" class="toolbar-dropdown-trigger" :class="{ active: editor?.isActive('bulletList') || editor?.isActive('orderedList') || editor?.isActive('taskList') }" title="列表" aria-label="打开列表菜单"><TiptapToolbarIcon name="list" /><TiptapToolbarIcon name="chevron-down" :size="13" /></button>
        <template #dropdown>
          <el-dropdown-menu class="community-list-menu">
            <el-dropdown-item command="bullet"><TiptapToolbarIcon name="list" />无序列表</el-dropdown-item>
            <el-dropdown-item command="ordered"><TiptapToolbarIcon name="ordered-list" />有序列表</el-dropdown-item>
            <el-dropdown-item command="task"><TiptapToolbarIcon name="todo-list" />待办列表</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
      <div class="toolbar-group">
        <button type="button" class="toolbar-button" :class="{ active: editor?.isActive('blockquote') }" title="引用" aria-label="引用" @click="toggleBlockquote"><TiptapToolbarIcon name="blockquote" /></button>
        <button type="button" class="toolbar-button" :class="{ active: editor?.isActive('codeBlock') }" title="代码块" aria-label="代码块" @click="toggleCodeBlock"><TiptapToolbarIcon name="code-block" /></button>
      </div>
      <span class="toolbar-divider" />
      <div class="toolbar-group">
        <button type="button" class="toolbar-button" :class="{ active: editor?.isActive('bold') }" title="加粗" aria-label="加粗" @click="toggleBold"><TiptapToolbarIcon name="bold" /></button>
        <button type="button" class="toolbar-button" :class="{ active: editor?.isActive('italic') }" title="斜体" aria-label="斜体" @click="toggleItalic"><TiptapToolbarIcon name="italic" /></button>
        <button type="button" class="toolbar-button" :class="{ active: editor?.isActive('strike') }" title="删除线" aria-label="删除线" @click="toggleStrike"><TiptapToolbarIcon name="strike" /></button>
        <button type="button" class="toolbar-button" :class="{ active: editor?.isActive('code') }" title="行内代码" aria-label="行内代码" @click="toggleCode"><TiptapToolbarIcon name="code" /></button>
        <button type="button" class="toolbar-button" :class="{ active: editor?.isActive('underline') }" title="下划线" aria-label="下划线" @click="toggleUnderline"><TiptapToolbarIcon name="underline" /></button>
      </div>
      <span class="toolbar-divider" />
      <div class="toolbar-group">
        <el-dropdown class="toolbar-highlight-dropdown" trigger="click" @command="handleHighlightCommand">
          <button type="button" class="toolbar-button" :class="{ active: editor?.isActive('highlight') }" title="高亮" aria-label="打开高亮颜色菜单"><TiptapToolbarIcon name="highlighter" /></button>
          <template #dropdown>
            <el-dropdown-menu class="community-highlight-menu">
              <el-dropdown-item v-for="color in highlightColors" :key="color.value" :command="color.value" :class="{ 'is-current': activeHighlightColor === color.value }"><span class="highlight-color-swatch" :style="{ backgroundColor: color.value }" />{{ color.label }}</el-dropdown-item>
              <el-dropdown-item command="clear">清除高亮</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        <el-popover v-model:visible="linkPopoverOpen" trigger="manual" placement="bottom-start" :width="300" :show-arrow="false">
          <div class="community-link-popover">
            <div class="community-link-popover-title">链接地址</div>
            <input ref="linkInputRef" v-model="linkHref" class="community-link-input" type="url" placeholder="https://example.com" aria-label="链接地址" @keydown.enter.prevent="applyLink" />
            <div class="community-link-popover-actions"><button type="button" class="link-popover-secondary" @click="removeLink">移除链接</button><button type="button" class="link-popover-primary" @click="applyLink">应用</button></div>
          </div>
          <template #reference>
            <button type="button" class="toolbar-button" :class="{ active: editor?.isActive('link') || linkPopoverOpen }" title="插入或编辑链接" aria-label="插入或编辑链接" @mousedown.prevent @click="openLinkPopover"><TiptapToolbarIcon name="link" /></button>
          </template>
        </el-popover>
      </div>
      <span class="toolbar-divider" />
      <div class="toolbar-group">
        <button type="button" class="toolbar-button" :class="{ active: editor?.isActive('superscript') }" title="上标" aria-label="上标" @click="toggleSuperscript"><TiptapToolbarIcon name="superscript" /></button>
        <button type="button" class="toolbar-button" :class="{ active: editor?.isActive('subscript') }" title="下标" aria-label="下标" @click="toggleSubscript"><TiptapToolbarIcon name="subscript" /></button>
      </div>
      <span class="toolbar-divider" />
      <div class="toolbar-group">
        <button type="button" class="toolbar-button toolbar-align-button" :class="{ active: editor?.isActive({ textAlign: 'left' }) }" title="左对齐" aria-label="左对齐" @click="setTextAlign('left')"><TiptapToolbarIcon name="align-left" /></button>
        <button type="button" class="toolbar-button toolbar-align-button" :class="{ active: editor?.isActive({ textAlign: 'center' }) }" title="居中" aria-label="居中" @click="setTextAlign('center')"><TiptapToolbarIcon name="align-center" /></button>
        <button type="button" class="toolbar-button toolbar-align-button" :class="{ active: editor?.isActive({ textAlign: 'right' }) }" title="右对齐" aria-label="右对齐" @click="setTextAlign('right')"><TiptapToolbarIcon name="align-right" /></button>
        <button type="button" class="toolbar-button toolbar-align-button" :class="{ active: editor?.isActive({ textAlign: 'justify' }) }" title="两端对齐" aria-label="两端对齐" @click="setTextAlign('justify')"><TiptapToolbarIcon name="align-justify" /></button>
      </div>
      <span class="toolbar-divider" />
      <div class="toolbar-group">
        <el-dropdown class="toolbar-insert-dropdown" trigger="click" @command="handleInsertCommand">
          <button type="button" class="toolbar-dropdown-trigger toolbar-insert-button" title="插入内容" aria-label="打开插入内容菜单" :disabled="uploading"><TiptapToolbarIcon name="image-plus" /><span>添加</span><TiptapToolbarIcon name="chevron-down" :size="13" /></button>
          <template #dropdown>
            <el-dropdown-menu class="community-insert-menu">
              <el-dropdown-item command="image"><TiptapToolbarIcon name="image-plus" />图片</el-dropdown-item>
              <el-dropdown-item command="table"><TiptapToolbarIcon name="table" />表格</el-dropdown-item>
              <el-dropdown-item command="code-block"><TiptapToolbarIcon name="code-block" />代码块</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        <el-dropdown v-if="isInTable" class="toolbar-table-dropdown" trigger="click" @command="handleTableCommand">
          <button type="button" class="toolbar-dropdown-trigger toolbar-table-button active" title="表格操作" aria-label="打开表格操作菜单"><TiptapToolbarIcon name="table" /><span>表格</span><TiptapToolbarIcon name="chevron-down" :size="13" /></button>
          <template #dropdown>
            <el-dropdown-menu class="community-table-menu">
              <el-dropdown-item command="add-row-before">上方插入行</el-dropdown-item>
              <el-dropdown-item command="add-row-after">下方插入行</el-dropdown-item>
              <el-dropdown-item command="add-column-before">左侧插入列</el-dropdown-item>
              <el-dropdown-item command="add-column-after">右侧插入列</el-dropdown-item>
              <el-dropdown-item divided command="delete-row">删除当前行</el-dropdown-item>
              <el-dropdown-item command="delete-column">删除当前列</el-dropdown-item>
              <el-dropdown-item divided command="merge-cells">合并单元格</el-dropdown-item>
              <el-dropdown-item command="split-cell">拆分单元格</el-dropdown-item>
              <el-dropdown-item command="toggle-header-row">切换表头行</el-dropdown-item>
              <el-dropdown-item divided command="delete-table">删除表格</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        <el-dropdown v-if="editor?.isActive('image')" class="toolbar-image-dropdown" trigger="click" @command="handleImageSizeCommand">
          <button type="button" class="toolbar-dropdown-trigger toolbar-image-size-button" title="调整图片大小" aria-label="调整图片大小"><span>大小</span><TiptapToolbarIcon name="chevron-down" :size="13" /></button>
          <template #dropdown>
            <el-dropdown-menu class="community-image-size-menu">
              <el-dropdown-item command="50%" :class="{ 'is-current': selectedImageWidth === '50%' }">较小 <span>50%</span></el-dropdown-item>
              <el-dropdown-item command="70%" :class="{ 'is-current': selectedImageWidth === '70%' }">标准 <span>70%</span></el-dropdown-item>
              <el-dropdown-item command="100%" :class="{ 'is-current': selectedImageWidth === '100%' }">铺满 <span>100%</span></el-dropdown-item>
              <el-dropdown-item command="original" :class="{ 'is-current': !selectedImageWidth }">原始比例</el-dropdown-item>
              <el-dropdown-item command="custom">自定义宽度…</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
      <span class="toolbar-divider" />
      <span class="toolbar-spacer" />
      <button type="button" class="toolbar-button toolbar-icon-button toolbar-search-button" :class="{ active: searchOpen }" title="查找和替换" aria-label="查找和替换" @click="toggleSearch"><TiptapToolbarIcon name="search" /></button>
      <span class="toolbar-count"><strong>{{ characterCount }}</strong><span>/{{ maxLength }}</span></span>
    </div>

    <div v-if="searchOpen" class="tiptap-search-panel" role="search">
      <div class="tiptap-search-field"><TiptapToolbarIcon name="search" :size="15" /><input v-model="searchTerm" type="search" placeholder="查找正文" aria-label="查找正文" @input="updateSearchMatches" @keydown.enter.prevent="findNext(1)" /><span v-if="searchTerm" class="tiptap-search-count">{{ searchMatches.length ? `${searchIndex + 1}/${searchMatches.length}` : '无匹配' }}</span></div>
      <button type="button" class="search-action-button" title="上一个" aria-label="上一个匹配项" :disabled="!searchMatches.length" @click="findNext(-1)">↑</button>
      <button type="button" class="search-action-button" title="下一个" aria-label="下一个匹配项" :disabled="!searchMatches.length" @click="findNext(1)">↓</button>
      <input v-model="replaceText" class="tiptap-replace-input" type="text" placeholder="替换为" aria-label="替换为" @keydown.enter.prevent="replaceCurrent" />
      <button type="button" class="search-text-button" :disabled="!searchMatches.length" @click="replaceCurrent">替换</button>
      <button type="button" class="search-text-button" :disabled="!searchMatches.length" @click="replaceAll">全部替换</button>
      <button type="button" class="search-close-button" title="关闭查找和替换" aria-label="关闭查找和替换" @click="searchOpen = false">×</button>
    </div>

    <div class="tiptap-content-shell" :style="contentShellStyle">
      <EditorContent :editor="editor" />
      <div v-if="uploading" class="tiptap-uploading-indicator"><span class="upload-spinner" />正在插入图片…</div>
    </div>
    <div v-if="!readOnly" class="tiptap-editor-hint">点击正文中的图片，可在工具栏调整显示宽度；图片会保持原比例。</div>

    <input ref="imageInputRef" class="tiptap-image-input" type="file" accept="image/jpeg,image/png,image/gif,image/webp" multiple @change="handleImageChange" />
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue';
import { EditorContent, useEditor } from '@tiptap/vue-3';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { TableKit } from '@tiptap/extension-table';
import TextAlign from '@tiptap/extension-text-align';
import CharacterCount from '@tiptap/extension-character-count';
import Underline from '@tiptap/extension-underline';
import TiptapToolbarIcon from './TiptapToolbarIcon.vue';
import { uploadDepartmentCommunityMedia } from '@/api/department/community';
import modal from '@/plugins/modal';
import { getToken } from '@/utils/auth';

const OSS_MARKER_RE = /oss:\/\/([\w-]+)/g;
const baseUrl = import.meta.env.VITE_APP_BASE_API;

const ResizableImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        parseHTML: element => element.getAttribute('width') || element.style.width || null,
        renderHTML: attributes => (attributes.width ? { style: `width: ${attributes.width}; height: auto;` } : {})
      }
    };
  }
});

const Highlight = Underline.extend({
  name: 'highlight',
  addAttributes() {
    return {
      color: {
        default: '#fff2a8',
        parseHTML: element => element.getAttribute('data-color') || element.style.backgroundColor || '#fff2a8',
        renderHTML: attributes => ({ 'data-color': attributes.color, style: `background-color: ${attributes.color}; border-radius: 2px;` })
      }
    };
  },
  parseHTML() {
    return [{ tag: 'mark' }];
  },
  renderHTML({ HTMLAttributes }) {
    return ['mark', HTMLAttributes, 0];
  }
});

const Superscript = Underline.extend({
  name: 'superscript',
  parseHTML() {
    return [{ tag: 'sup' }];
  },
  renderHTML() {
    return ['sup', 0];
  }
});

const Subscript = Underline.extend({
  name: 'subscript',
  parseHTML() {
    return [{ tag: 'sub' }];
  },
  renderHTML() {
    return ['sub', 0];
  }
});

const TaskItem = Image.extend({
  name: 'taskItem',
  content: 'paragraph block*',
  group: 'block',
  defining: true,
  draggable: false,
  addOptions() {
    return {};
  },
  addAttributes() {
    return {
      checked: {
        default: false,
        parseHTML: element => element.getAttribute('data-checked') === 'true',
        renderHTML: attributes => ({ 'data-checked': String(Boolean(attributes.checked)) })
      }
    };
  },
  parseHTML() {
    return [{ tag: 'li[data-type="taskItem"]' }];
  },
  renderHTML({ HTMLAttributes }) {
    return ['li', { ...HTMLAttributes, 'data-type': 'taskItem' }, 0];
  },
  addNodeView() {
    return ({ node, getPos, editor }) => {
      let currentNode = node;
      const dom = document.createElement('li');
      const label = document.createElement('label');
      const input = document.createElement('input');
      const contentDOM = document.createElement('div');

      label.className = 'community-task-checkbox';
      label.contentEditable = 'false';
      input.type = 'checkbox';
      input.disabled = !editor.isEditable;
      contentDOM.className = 'community-task-content';
      dom.dataset.type = 'taskItem';
      label.append(input);
      dom.append(label, contentDOM);

      const syncNodeState = () => {
        const checked = Boolean(currentNode.attrs.checked);
        dom.dataset.checked = String(checked);
        input.checked = checked;
        input.disabled = !editor.isEditable;
      };
      syncNodeState();

      input.addEventListener('click', event => {
        event.stopPropagation();
        if (!editor.isEditable || typeof getPos !== 'function') return;
        const position = getPos();
        const latestNode = editor.state.doc.nodeAt(position);
        if (!latestNode) return;
        editor.view.dispatch(editor.state.tr.setNodeMarkup(position, undefined, { ...latestNode.attrs, checked: input.checked }));
      });

      return {
        dom,
        contentDOM,
        update: updatedNode => {
          if (updatedNode.type !== currentNode.type) return false;
          currentNode = updatedNode;
          syncNodeState();
          return true;
        }
      };
    };
  }
});

const TaskList = Image.extend({
  name: 'taskList',
  content: 'taskItem+',
  group: 'block',
  defining: true,
  addOptions() {
    return {};
  },
  addAttributes() {
    return {};
  },
  parseHTML() {
    return [{ tag: 'ul[data-type="taskList"]' }];
  },
  renderHTML({ HTMLAttributes }) {
    return ['ul', { ...HTMLAttributes, 'data-type': 'taskList' }, 0];
  }
});

const props = withDefaults(
  defineProps<{
    modelValue?: string;
    minHeight?: number;
    maxLength?: number;
    readOnly?: boolean;
  }>(),
  {
    modelValue: '',
    minHeight: 300,
    maxLength: 10000,
    readOnly: false
  }
);

const emit = defineEmits<{
  (event: 'update:modelValue', value: string): void;
  (event: 'update:mediaOssIds', value: string): void;
  (event: 'update:uploading', value: boolean): void;
}>();

const imageInputRef = ref<HTMLInputElement>();
const uploading = ref(false);
const selectedImageWidth = ref<string | null>(null);
const editorStateTick = ref(0);
const searchOpen = ref(false);
const searchTerm = ref('');
const replaceText = ref('');
const searchMatches = ref<Array<{ from: number; to: number }>>([]);
const searchIndex = ref(-1);
const highlightColors = [
  { value: '#fff2a8', label: '浅黄色' },
  { value: '#c7f3d0', label: '浅绿色' },
  { value: '#c9e7ff', label: '浅蓝色' },
  { value: '#ffd4d4', label: '浅红色' }
];
const linkPopoverOpen = ref(false);
const linkHref = ref('');
const linkInputRef = ref<HTMLInputElement>();
const isResolvingContent = ref(false);
const lastEncodedValue = ref('');
const ossUrlToId = new Map<string, string>();

const contentShellStyle = computed(() => ({
  minHeight: props.minHeight ? `${props.minHeight}px` : undefined
}));

const currentBlockType = computed(() => {
  editorStateTick.value;
  if (!editor.value) return 'paragraph';
  const headingLevel = [1, 2, 3, 4, 5, 6].find(level => editor.value?.isActive('heading', { level }));
  return headingLevel ? `heading-${headingLevel}` : 'paragraph';
});

const blockTypeLabel = computed(() => (currentBlockType.value === 'paragraph' ? '正文' : currentBlockType.value.replace('heading-', 'H')));
const activeHighlightColor = computed(() => {
  editorStateTick.value;
  return editor.value?.getAttributes('highlight').color || '#fff2a8';
});
const isInTable = computed(() => {
  editorStateTick.value;
  return Boolean(editor.value?.isActive('table'));
});

const editor = useEditor({
  editable: !props.readOnly,
  extensions: [
    StarterKit.configure({
      link: false,
      underline: false
    }),
    Underline,
    Highlight,
    Superscript,
    Subscript,
    TaskList,
    TaskItem,
    TableKit.configure({
      table: {
        resizable: true,
        cellMinWidth: 72,
        HTMLAttributes: { class: 'community-tiptap-table' }
      },
      tableCell: { HTMLAttributes: { class: 'community-tiptap-table-cell' } },
      tableHeader: { HTMLAttributes: { class: 'community-tiptap-table-header' } },
      tableRow: { HTMLAttributes: { class: 'community-tiptap-table-row' } }
    }),
    Link.configure({
      autolink: true,
      linkOnPaste: true,
      openOnClick: false
    }),
    ResizableImage.configure({
      allowBase64: false,
      inline: false,
      HTMLAttributes: {
        class: 'community-inline-image'
      }
    }),
    TextAlign.configure({ types: ['heading', 'paragraph'] }),
    Placeholder.configure({ placeholder: '描述背景、现象、你的想法或希望得到的帮助…' }),
    CharacterCount.configure({ limit: props.maxLength })
  ],
  content: '',
  onUpdate: ({ editor: currentEditor }) => {
    if (isResolvingContent.value) return;
    syncSelectedImageWidth();
    emitEncodedContent(currentEditor.getHTML());
  },
  onSelectionUpdate: () => {
    syncSelectedImageWidth();
  },
  onCreate: () => {
    void syncExternalContent();
  }
});

const characterCount = computed(() => editor.value?.storage.characterCount?.characters() || 0);

const buildPreviewUrl = (ossId: string | number) => {
  const query = new URLSearchParams({
    Authorization: `Bearer ${getToken()}`,
    clientid: import.meta.env.VITE_APP_CLIENT_ID
  });
  return `${baseUrl}/resource/oss/preview/${ossId}?${query.toString()}`;
};

const encodeOssContent = (html: string) => {
  let result = html || '';
  for (const [url, ossId] of ossUrlToId) {
    result = result.replaceAll(url, `oss://${ossId}`);
  }
  return result;
};

const decodeOssContent = (value: string) => {
  if (!value) return '';
  let result = value;
  const matches = Array.from(value.matchAll(OSS_MARKER_RE));
  for (const ossId of Array.from(new Set(matches.map(match => match[1])))) {
    const previewUrl = buildPreviewUrl(ossId);
    ossUrlToId.set(previewUrl, ossId);
    result = result.replaceAll(`oss://${ossId}`, previewUrl);
  }
  return result;
};

const extractOssIds = (html: string) => [...new Set([...html.matchAll(OSS_MARKER_RE)].map(match => match[1]))];

const emitEncodedContent = (html: string) => {
  const encoded = encodeOssContent(html);
  lastEncodedValue.value = encoded;
  emit('update:modelValue', encoded);
  emit('update:mediaOssIds', extractOssIds(encoded).join(','));
};

const normalizeExternalContent = (value: string) => {
  if (!value || /<\/?[a-z][\s\S]*>/i.test(value)) return value;
  const escapeHtml = (text: string) => text.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char] || char);
  return `<p>${escapeHtml(value).replace(/\r?\n/g, '<br>')}</p>`;
};

const syncExternalContent = async () => {
  if (!editor.value) return;
  const nextValue = props.modelValue || '';
  const currentValue = encodeOssContent(editor.value.getHTML());
  if (nextValue === lastEncodedValue.value || nextValue === currentValue) return;
  isResolvingContent.value = true;
  try {
    editor.value.commands.setContent(normalizeExternalContent(decodeOssContent(nextValue)), { emitUpdate: false });
    lastEncodedValue.value = nextValue;
    emit('update:mediaOssIds', extractOssIds(nextValue).join(','));
  } finally {
    isResolvingContent.value = false;
  }
};

const toggleBold = () => editor.value?.chain().focus().toggleBold().run();
const toggleItalic = () => editor.value?.chain().focus().toggleItalic().run();
const toggleStrike = () => editor.value?.chain().focus().toggleStrike().run();
const toggleCode = () => editor.value?.chain().focus().toggleCode().run();
const toggleCodeBlock = () => editor.value?.chain().focus().toggleCodeBlock().run();
const toggleUnderline = () => editor.value?.chain().focus().toggleUnderline().run();
const toggleBulletList = () => editor.value?.chain().focus().toggleBulletList().run();
const toggleOrderedList = () => editor.value?.chain().focus().toggleOrderedList().run();
const toggleTaskList = () => {
  if (!editor.value) return;
  if (editor.value.isActive('taskList')) {
    editor.value.chain().focus().liftListItem('taskItem').run();
    return;
  }
  editor.value.chain().focus().insertContent({ type: 'taskList', content: [{ type: 'taskItem', attrs: { checked: false }, content: [{ type: 'paragraph' }] }] }).run();
};
const toggleBlockquote = () => editor.value?.chain().focus().toggleBlockquote().run();
const setTextAlign = (align: 'left' | 'center' | 'right' | 'justify') => editor.value?.chain().focus().setTextAlign(align).run();
const handleBlockTypeCommand = (command: string | number) => {
  const value = String(command);
  if (value.startsWith('heading-')) {
    editor.value?.chain().focus().setHeading({ level: Number(value.replace('heading-', '')) as 1 | 2 | 3 | 4 | 5 | 6 }).run();
  } else {
    editor.value?.chain().focus().setParagraph().run();
  }
};
const handleListCommand = (command: string | number) => {
  if (command === 'ordered') toggleOrderedList();
  else if (command === 'task') toggleTaskList();
  else toggleBulletList();
};
const handleInsertCommand = (command: string | number) => {
  if (command === 'image') openImagePicker();
  if (command === 'table') editor.value?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  if (command === 'code-block') toggleCodeBlock();
};
const handleTableCommand = (command: string | number) => {
  if (!editor.value) return;
  const tableCommand = String(command);
  const chain = editor.value.chain().focus();
  if (tableCommand === 'add-row-before') chain.addRowBefore();
  else if (tableCommand === 'add-row-after') chain.addRowAfter();
  else if (tableCommand === 'add-column-before') chain.addColumnBefore();
  else if (tableCommand === 'add-column-after') chain.addColumnAfter();
  else if (tableCommand === 'delete-row') chain.deleteRow();
  else if (tableCommand === 'delete-column') chain.deleteColumn();
  else if (tableCommand === 'merge-cells') chain.mergeCells();
  else if (tableCommand === 'split-cell') chain.splitCell();
  else if (tableCommand === 'toggle-header-row') chain.toggleHeaderRow();
  else if (tableCommand === 'delete-table') chain.deleteTable();
  else return;
  chain.run();
};
const handleHighlightCommand = (command: string | number) => {
  if (!editor.value) return;
  if (command === 'clear') editor.value.chain().focus().unsetMark('highlight').run();
  else editor.value.chain().focus().setMark('highlight', { color: String(command) }).run();
};
const toggleSuperscript = () => {
  if (!editor.value) return;
  editor.value.chain().focus().toggleMark('superscript').run();
};
const toggleSubscript = () => {
  if (!editor.value) return;
  editor.value.chain().focus().toggleMark('subscript').run();
};
const openLinkPopover = () => {
  if (!editor.value) return;
  if (editor.value.state.selection.empty && !editor.value.isActive('link')) {
    modal.msgWarning('请先选中需要添加链接的文字');
    return;
  }
  linkHref.value = editor.value.getAttributes('link').href || '';
  linkPopoverOpen.value = true;
  void nextTick(() => linkInputRef.value?.focus());
};
const applyLink = () => {
  if (!editor.value) return;
  const href = linkHref.value.trim();
  if (!href) {
    modal.msgWarning('请输入链接地址');
    return;
  }
  const normalizedHref = /^(https?:\/\/|mailto:|tel:)/i.test(href) ? href : `https://${href}`;
  editor.value.chain().focus().setLink({ href: normalizedHref }).run();
  linkPopoverOpen.value = false;
};
const removeLink = () => {
  editor.value?.chain().focus().unsetLink().run();
  linkPopoverOpen.value = false;
};

const collectSearchMatches = (query: string) => {
  if (!editor.value || !query) return [];
  const matches: Array<{ from: number; to: number }> = [];
  const normalizedQuery = query.toLocaleLowerCase();
  editor.value.state.doc.descendants((node, position) => {
    if (!node.isText || !node.text) return;
    const normalizedText = node.text.toLocaleLowerCase();
    let offset = 0;
    while (offset < normalizedText.length) {
      const index = normalizedText.indexOf(normalizedQuery, offset);
      if (index < 0) break;
      matches.push({ from: position + index, to: position + index + query.length });
      offset = index + Math.max(query.length, 1);
    }
  });
  return matches;
};

const updateSearchMatches = () => {
  searchMatches.value = collectSearchMatches(searchTerm.value.trim());
  searchIndex.value = -1;
};
const findNext = (direction: 1 | -1) => {
  if (!editor.value) return;
  updateSearchMatches();
  if (!searchMatches.value.length) return;
  const currentPosition = editor.value.state.selection.from;
  let nextIndex = direction > 0 ? searchMatches.value.findIndex(match => match.from > currentPosition) : searchMatches.value.toReversed().findIndex(match => match.to < currentPosition);
  if (nextIndex < 0) nextIndex = direction > 0 ? 0 : searchMatches.value.length - 1;
  if (direction < 0) nextIndex = searchMatches.value.length - 1 - nextIndex;
  const match = searchMatches.value[nextIndex];
  editor.value.chain().focus().setTextSelection(match).run();
  searchIndex.value = nextIndex;
};
const replaceCurrent = () => {
  if (!editor.value || !searchTerm.value.trim()) return;
  const selectedText = editor.value.state.doc.textBetween(editor.value.state.selection.from, editor.value.state.selection.to, '');
  if (selectedText.toLocaleLowerCase() !== searchTerm.value.trim().toLocaleLowerCase()) {
    findNext(1);
    return;
  }
  editor.value.chain().focus().insertContent(replaceText.value).run();
  updateSearchMatches();
  findNext(1);
};
const replaceAll = () => {
  if (!editor.value || !searchTerm.value.trim() || !searchMatches.value.length) return;
  const replacement = replaceText.value;
  editor.value.chain().focus().command(({ tr }) => {
    for (const match of searchMatches.value.toReversed()) tr.insertText(replacement, match.from, match.to);
    return true;
  }).run();
  updateSearchMatches();
  searchIndex.value = -1;
};
const toggleSearch = () => {
  searchOpen.value = !searchOpen.value;
  if (searchOpen.value) {
    void nextTick(() => document.querySelector<HTMLInputElement>('.tiptap-search-field input')?.focus());
  }
};

const syncSelectedImageWidth = () => {
  editorStateTick.value += 1;
  selectedImageWidth.value = editor.value?.isActive('image') ? editor.value.getAttributes('image').width || null : null;
};

const setImageWidth = (width: string | null) => {
  if (!editor.value?.isActive('image')) return;
  editor.value.chain().focus().updateAttributes('image', { width }).run();
  selectedImageWidth.value = width;
};

const handleImageSizeCommand = (command: string | number) => {
  if (command === 'original') {
    setImageWidth(null);
  } else if (command === 'custom') {
    setCustomImageWidth();
  } else {
    setImageWidth(String(command));
  }
};

const setCustomImageWidth = () => {
  if (!editor.value?.isActive('image')) return;
  const currentWidth = selectedImageWidth.value || '70%';
  const width = window.prompt('请输入图片宽度，例如 60% 或 480px', currentWidth)?.trim();
  if (!width) return;
  if (!/^(?:\d+(?:\.\d+)?%|\d+(?:\.\d+)?px|auto)$/.test(width)) {
    modal.msgWarning('宽度请填写百分比或像素值，例如 60% 或 480px');
    return;
  }
  setImageWidth(width);
};

const openImagePicker = () => imageInputRef.value?.click();

const uploadInlineImage = async (file: File) => {
  const suffix = file.name.includes('.') ? file.name.slice(file.name.lastIndexOf('.')).toLowerCase() : '';
  if (!['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(suffix)) {
    throw new Error('正文图片仅支持 JPG、PNG、GIF、WEBP 格式');
  }
  if (file.size > 10 * 1024 * 1024) {
    throw new Error('正文图片不能超过10MB');
  }
  const formData = new FormData();
  formData.append('file', file);
  const res = await uploadDepartmentCommunityMedia(formData);
  const media = res.data;
  if (!media?.ossId || !media.previewUrl) throw new Error('图片上传响应不完整');
  ossUrlToId.set(media.previewUrl, String(media.ossId));
  return {
    type: 'image',
    attrs: {
      src: media.previewUrl,
      alt: media.fileName || file.name,
      title: media.fileName || file.name,
      width: '70%'
    }
  };
};

const handleImageChange = async (event: Event) => {
  const input = event.target as HTMLInputElement;
  const files = Array.from(input.files || []);
  input.value = '';
  if (!files.length || !editor.value) return;
  uploading.value = true;
  emit('update:uploading', true);
  try {
    const imageNodes = [];
    for (const file of files) {
      try {
        imageNodes.push(await uploadInlineImage(file));
      } catch (error) {
        modal.msgError(error instanceof Error ? error.message : '图片上传失败，请稍后重试');
      }
    }
    if (imageNodes.length) {
      editor.value.chain().focus().insertContent(imageNodes).createParagraphNear().run();
    }
  } finally {
    uploading.value = false;
    emit('update:uploading', false);
    await nextTick();
  }
};

watch(() => props.modelValue, () => {
  void syncExternalContent();
});
</script>

<style scoped lang="scss">
.community-tiptap-editor { width: 100%; box-sizing: border-box; overflow: hidden; border: 1px solid #dce5f0; border-radius: 12px; background: #fff; transition: border-color .2s, box-shadow .2s; }
.community-tiptap-editor:focus-within { border-color: #70a9e8; box-shadow: 0 0 0 3px rgba(83, 151, 226, .12); }
.community-tiptap-editor.is-readonly { border: 0; border-radius: 0; background: transparent; }
.tiptap-toolbar { display: flex; min-height: 48px; flex-wrap: wrap; align-items: center; align-content: center; gap: 2px; padding: 6px 10px; border-bottom: 1px solid #e8eef6; background: #fbfcfe; white-space: nowrap; }
.toolbar-group { display: inline-flex; align-items: center; gap: 1px; }
.toolbar-button, .toolbar-dropdown-trigger { display: inline-flex; width: 30px; height: 30px; align-items: center; justify-content: center; gap: 5px; padding: 0; border: 1px solid transparent; border-radius: 7px; color: #66768c; background: transparent; cursor: pointer; font-size: 12px; font-weight: 600; line-height: 1; transition: color .2s, border-color .2s, background .2s; }
.toolbar-button:hover:not(:disabled), .toolbar-button.active, .toolbar-dropdown-trigger:hover:not(:disabled), .toolbar-dropdown-trigger.active { border-color: #d9e9f8; color: #3d8ddd; background: #eef6ff; }
.toolbar-button:disabled, .toolbar-dropdown-trigger:disabled { color: #c3ccd8; cursor: not-allowed; }
.toolbar-button .tiptap-toolbar-icon, .toolbar-dropdown-trigger .tiptap-toolbar-icon { width: 16px; height: 16px; }
.toolbar-dropdown-trigger { min-width: 30px; padding: 0 7px; }
.toolbar-dropdown-trigger .tiptap-toolbar-icon:last-child { color: #94a3b8; }
.toolbar-dropdown-trigger span { white-space: nowrap; }
.toolbar-heading-dropdown, .toolbar-list-dropdown, .toolbar-insert-dropdown, .toolbar-image-dropdown { display: inline-flex; }
.toolbar-heading-dropdown .toolbar-dropdown-trigger { min-width: 74px; }
.toolbar-list-dropdown .toolbar-dropdown-trigger { min-width: 48px; }
.toolbar-insert-button { width: auto; min-width: 68px; }
.toolbar-image-size-button { min-width: 50px; }
.toolbar-align-button { width: 29px; padding: 0; }
.toolbar-divider { width: 1px; height: 18px; margin: 0 5px; background: #dce5f0; }
.toolbar-spacer { flex: 1 1 12px; min-width: 12px; }
.toolbar-search-button { margin-left: auto; }
.toolbar-count { display: inline-flex; align-items: baseline; gap: 1px; height: 24px; padding: 0 7px; border: 1px solid #e6edf5; border-radius: 6px; color: #a1adbc; background: #f7f9fc; font-size: 11px; font-variant-numeric: tabular-nums; }
.toolbar-count strong { color: #60748f; font-size: 11px; font-weight: 700; }
.community-heading-menu, .community-list-menu, .community-insert-menu { min-width: 136px; padding: 5px; border-radius: 10px; }
.community-heading-menu .el-dropdown-menu__item, .community-list-menu .el-dropdown-menu__item, .community-insert-menu .el-dropdown-menu__item { display: flex; align-items: center; gap: 9px; border-radius: 6px; font-size: 12px; line-height: 30px; }
.community-heading-menu .el-dropdown-menu__item.is-current, .community-list-menu .el-dropdown-menu__item:hover, .community-insert-menu .el-dropdown-menu__item:hover { color: #3d8ddd; background: #eef6ff; }
.community-list-menu .tiptap-toolbar-icon, .community-insert-menu .tiptap-toolbar-icon { width: 15px; height: 15px; color: #7890aa; }
.community-highlight-menu { min-width: 118px; padding: 5px; border-radius: 10px; }
.community-highlight-menu .el-dropdown-menu__item { display: flex; align-items: center; gap: 8px; border-radius: 6px; font-size: 12px; line-height: 30px; }
.community-highlight-menu .el-dropdown-menu__item:hover, .community-highlight-menu .el-dropdown-menu__item.is-current { color: #3d8ddd; background: #eef6ff; }
.highlight-color-swatch { width: 14px; height: 14px; border: 1px solid rgba(73, 93, 119, .18); border-radius: 4px; box-sizing: border-box; }
.community-link-popover { display: flex; flex-direction: column; gap: 10px; }
.community-link-popover-title { color: #344a68; font-size: 12px; font-weight: 700; }
.community-link-input { width: 100%; height: 32px; box-sizing: border-box; padding: 0 9px; border: 1px solid #dfe7f1; border-radius: 7px; outline: 0; color: #52647e; background: #fbfcfe; font-size: 12px; }
.community-link-input:focus { border-color: #70a9e8; box-shadow: 0 0 0 2px rgba(83, 151, 226, .12); }
.community-link-popover-actions { display: flex; justify-content: flex-end; gap: 7px; }
.link-popover-secondary, .link-popover-primary { height: 28px; padding: 0 10px; border-radius: 6px; cursor: pointer; font-size: 12px; }
.link-popover-secondary { border: 1px solid #dfe7f1; color: #66768c; background: #fff; }
.link-popover-primary { border: 1px solid #4d99e3; color: #fff; background: #4d99e3; }
.link-popover-secondary:hover { border-color: #bcd7f2; color: #3d8ddd; background: #f1f8ff; }
.link-popover-primary:hover { border-color: #3789d6; background: #3789d6; }
.community-image-size-menu { min-width: 156px; padding: 5px; border-radius: 10px; }
.community-image-size-menu .el-dropdown-menu__item { display: flex; align-items: center; justify-content: space-between; gap: 20px; border-radius: 6px; font-size: 12px; line-height: 30px; }
.community-image-size-menu .el-dropdown-menu__item span { color: #99a7b8; font-size: 11px; }
.community-image-size-menu .el-dropdown-menu__item.is-current { color: #3d8ddd; background: #eef6ff; }
.community-image-size-menu .el-dropdown-menu__item.is-current span { color: #3d8ddd; }
.toolbar-table-dropdown { display: inline-flex; }
.toolbar-table-button { width: auto; min-width: 68px; }
.community-table-menu { min-width: 148px; padding: 5px; border-radius: 10px; }
.community-table-menu .el-dropdown-menu__item { border-radius: 6px; font-size: 12px; line-height: 30px; }
.community-table-menu .el-dropdown-menu__item:hover { color: #3d8ddd; background: #eef6ff; }
.community-table-menu .el-dropdown-menu__item.is-divided { margin-top: 5px; border-top-color: #e8eef6; }
.tiptap-search-panel { display: flex; align-items: center; gap: 5px; padding: 7px 10px; border-bottom: 1px solid #e8eef6; background: #fff; }
.tiptap-search-field { display: flex; min-width: 180px; height: 30px; align-items: center; gap: 6px; padding: 0 8px; border: 1px solid #dfe7f1; border-radius: 7px; color: #8b9aae; background: #fbfcfe; }
.tiptap-search-field input, .tiptap-replace-input { min-width: 0; border: 0; outline: 0; color: #52647e; background: transparent; font-size: 12px; }
.tiptap-search-field input { flex: 1; }
.tiptap-search-count { flex: none; color: #9aa9ba; font-size: 11px; }
.tiptap-replace-input { width: 150px; height: 30px; padding: 0 8px; border: 1px solid #dfe7f1; border-radius: 7px; }
.search-action-button, .search-text-button, .search-close-button { height: 30px; border: 1px solid #dfe7f1; border-radius: 7px; color: #66768c; background: #fff; cursor: pointer; font-size: 12px; }
.search-action-button { width: 30px; font-size: 15px; }
.search-text-button { padding: 0 9px; }
.search-close-button { width: 30px; margin-left: auto; color: #94a3b8; font-size: 18px; line-height: 1; }
.search-action-button:hover:not(:disabled), .search-text-button:hover:not(:disabled), .search-close-button:hover { border-color: #bcd7f2; color: #3d8ddd; background: #f1f8ff; }
.search-action-button:disabled, .search-text-button:disabled { color: #c5ced9; cursor: not-allowed; }
.tiptap-content-shell { position: relative; }
.tiptap-editor-hint { padding: 0 22px 12px; color: #91a0b3; font-size: 11px; line-height: 1.5; }
.tiptap-image-input { display: none; }
.tiptap-uploading-indicator { position: absolute; right: 16px; bottom: 14px; display: inline-flex; align-items: center; gap: 6px; padding: 7px 10px; border: 1px solid #cfe3f9; border-radius: 8px; color: #4a8ed2; background: rgba(244, 249, 255, .95); font-size: 12px; }
.upload-spinner { width: 12px; height: 12px; border: 2px solid #b9d7f3; border-top-color: #4d99e3; border-radius: 50%; animation: tiptap-spin .8s linear infinite; }

:deep(.tiptap) { min-height: inherit; box-sizing: border-box; padding: 20px 22px; outline: none; color: #43536c; font-size: 15px; line-height: 1.9; overflow-wrap: anywhere; }
.is-readonly :deep(.tiptap) { min-height: 0; padding: 0; color: #52647e; }
:deep(.tiptap p) { margin: 0 0 12px; }
:deep(.tiptap p:last-child) { margin-bottom: 0; }
:deep(.tiptap h2) { margin: 20px 0 10px; color: #263956; font-size: 22px; line-height: 1.4; }
:deep(.tiptap h3) { margin: 15px 0 7px; color: #314662; font-size: 17px; line-height: 1.45; }
:deep(.tiptap ul), :deep(.tiptap ol) { margin: 8px 0 12px; padding-left: 26px; }
:deep(.tiptap li p) { margin: 0; }
:deep(.tiptap ul[data-type='taskList']) { padding-left: 0; list-style: none; }
:deep(.tiptap li[data-type='taskItem']) { display: flex; align-items: flex-start; gap: 8px; list-style: none; }
:deep(.tiptap li[data-type='taskItem'] > .community-task-content) { flex: 1; min-width: 0; }
:deep(.community-task-checkbox) { display: inline-flex; width: 18px; height: 26px; align-items: center; justify-content: center; cursor: pointer; }
:deep(.community-task-checkbox input) { width: 14px; height: 14px; margin: 0; accent-color: #4d99e3; cursor: pointer; }
:deep(.tiptap li[data-checked='true'] > .community-task-content) { color: #9aa8b9; text-decoration: line-through; }
:deep(.tiptap blockquote) { margin: 12px 0; padding: 7px 14px; border-left: 3px solid #73a9df; border-radius: 0 8px 8px 0; color: #6d7e97; background: #f4f8fd; }
:deep(.tiptap a) { color: #3789df; text-decoration: underline; }
:deep(.tiptap code) { padding: 2px 5px; border-radius: 4px; color: #3c5877; background: #eef3f8; font-family: 'SFMono-Regular', Consolas, monospace; font-size: .9em; }
:deep(.tiptap pre) { margin: 14px 0; padding: 14px 16px; overflow-x: auto; border: 1px solid #dbe4ee; border-radius: 8px; color: #35475e; background: #f5f7fa; font-family: 'SFMono-Regular', Consolas, monospace; font-size: 13px; line-height: 1.65; }
:deep(.tiptap pre code) { padding: 0; color: inherit; background: transparent; }
:deep(.tiptap mark) { padding: 0 2px; }
:deep(.tiptap sup), :deep(.tiptap sub) { line-height: 0; }
:deep(.tiptap img) { display: block; max-width: 100%; max-height: 420px; height: auto; margin: 12px auto; border-radius: 9px; object-fit: contain; box-shadow: 0 6px 18px rgba(37, 71, 111, .12); }
.is-readonly :deep(.tiptap img) { max-height: 680px; }
:deep(.tiptap img.ProseMirror-selectednode) { outline: 2px solid #5a9fe6; outline-offset: 3px; }
:deep(.tiptap .tableWrapper) { margin: 15px 0; overflow-x: auto; }
:deep(.tiptap .tableWrapper > table), :deep(.tiptap > table) { width: 100%; max-width: 100%; border: 1px solid #d8e2ed; border-radius: 9px; border-spacing: 0; background: #fff; table-layout: fixed; overflow: hidden; }
:deep(.tiptap .tableWrapper > table th), :deep(.tiptap .tableWrapper > table td), :deep(.tiptap > table th), :deep(.tiptap > table td) { min-width: 72px; padding: 9px 11px; border-right: 1px solid #e1e8f0; border-bottom: 1px solid #e1e8f0; color: #52647e; vertical-align: top; text-align: left; line-height: 1.55; }
:deep(.tiptap .tableWrapper > table th), :deep(.tiptap > table th) { color: #2c4668; background: #f3f7fc; font-weight: 700; }
:deep(.tiptap .tableWrapper > table td), :deep(.tiptap > table td) { background: #fff; }
:deep(.tiptap .tableWrapper > table tr:last-child td), :deep(.tiptap .tableWrapper > table tr:last-child th), :deep(.tiptap > table tr:last-child td), :deep(.tiptap > table tr:last-child th) { border-bottom: 0; }
:deep(.tiptap .tableWrapper > table th:last-child), :deep(.tiptap .tableWrapper > table td:last-child), :deep(.tiptap > table th:last-child), :deep(.tiptap > table td:last-child) { border-right: 0; }
:deep(.tiptap .selectedCell:after) { position: absolute; z-index: 2; background: rgba(83, 151, 226, .16); content: ''; pointer-events: none; }
:deep(.tiptap .is-empty::before) { float: left; height: 0; color: #aab6c6; content: attr(data-placeholder); pointer-events: none; }

@keyframes tiptap-spin { to { transform: rotate(360deg); } }

@media (max-width: 640px) {
  .tiptap-toolbar { flex-wrap: wrap; }
  .toolbar-spacer { display: none; }
  .toolbar-count { margin-left: auto; }
}
</style>

<style lang="scss">
html.dark .community-tiptap-editor { border-color: #31415a; background: #141e31; }
html.dark .community-tiptap-editor:focus-within { border-color: #4e8bc9; box-shadow: 0 0 0 3px rgba(78, 139, 201, .16); }
html.dark .community-tiptap-editor.is-readonly { border: 0; background: transparent; }
html.dark .community-tiptap-editor .tiptap-toolbar { border-bottom-color: #2a3951; background: #19263b; }
html.dark .community-tiptap-editor .toolbar-button { color: #a9b9cf; }
html.dark .community-tiptap-editor .toolbar-button:hover:not(:disabled), html.dark .community-tiptap-editor .toolbar-button.active { color: #83bdf2; background: #223b5a; }
html.dark .community-tiptap-editor .toolbar-button:disabled { color: #53647d; }
html.dark .community-tiptap-editor .toolbar-dropdown-trigger { color: #a9b9cf; }
html.dark .community-tiptap-editor .toolbar-dropdown-trigger:hover:not(:disabled), html.dark .community-tiptap-editor .toolbar-dropdown-trigger.active { border-color: #355a7f; color: #9bd0ff; background: #203d61; }
html.dark .community-tiptap-editor .toolbar-dropdown-trigger:disabled { color: #53647d; }
html.dark .community-tiptap-editor .toolbar-divider { background: #31415a; }
html.dark .community-tiptap-editor .toolbar-dropdown-trigger .tiptap-toolbar-icon:last-child { color: #7f94ae; }
html.dark .community-tiptap-editor .toolbar-count { border-color: #2d4059; color: #7f94ae; background: #19263b; }
html.dark .community-tiptap-editor .toolbar-count strong { color: #c0d0e3; }
html.dark .community-tiptap-editor .tiptap-search-panel { border-bottom-color: #2a3951; background: #141e31; }
html.dark .community-tiptap-editor .tiptap-search-field, html.dark .community-tiptap-editor .tiptap-replace-input { border-color: #31415a; color: #c0d0e3; background: #19263b; }
html.dark .community-tiptap-editor .tiptap-search-field input, html.dark .community-tiptap-editor .tiptap-replace-input { color: #c0d0e3; }
html.dark .community-tiptap-editor .search-action-button, html.dark .community-tiptap-editor .search-text-button, html.dark .community-tiptap-editor .search-close-button { border-color: #31415a; color: #a9b9cf; background: #19263b; }
html.dark .community-tiptap-editor .search-action-button:hover:not(:disabled), html.dark .community-tiptap-editor .search-text-button:hover:not(:disabled), html.dark .community-tiptap-editor .search-close-button:hover { border-color: #4676a6; color: #9bd0ff; background: #203d61; }
html.dark .community-tiptap-editor .tiptap-editor-hint { color: #8193ac; }
html.dark .community-tiptap-editor .tiptap { color: #b8c7da; background: #141e31; }
html.dark .community-tiptap-editor .tiptap h2 { color: #e4edf9; }
html.dark .community-tiptap-editor .tiptap h3 { color: #cbdcf1; }
html.dark .community-tiptap-editor .tiptap blockquote { border-left-color: #5b9edb; color: #a7b8cf; background: #1b2a40; }
html.dark .community-tiptap-editor .tiptap a { color: #86c5ff; }
html.dark .community-tiptap-editor .tiptap code { color: #c8ddf4; background: #20324b; }
html.dark .community-tiptap-editor .tiptap pre { color: #d9e7f7; background: #0d1727; }
html.dark .community-tiptap-editor .tiptap mark { color: #27354a; }
html.dark .community-tiptap-editor .tiptap-uploading-indicator { border-color: #315b82; color: #9acbfa; background: rgba(25, 46, 72, .96); }
html.dark .community-tiptap-editor .community-link-popover-title { color: #dbe8f7; }
html.dark .community-tiptap-editor .community-link-input { border-color: #31415a; color: #c0d0e3; background: #19263b; }
html.dark .community-tiptap-editor .community-link-input:focus { border-color: #4e8bc9; box-shadow: 0 0 0 2px rgba(78, 139, 201, .16); }
html.dark .community-tiptap-editor .link-popover-secondary { border-color: #31415a; color: #a9b9cf; background: #19263b; }
html.dark .community-tiptap-editor .link-popover-secondary:hover { border-color: #4676a6; color: #9bd0ff; background: #203d61; }
html.dark .community-highlight-menu { border-color: #2d4059; background: #19263b; }
html.dark .community-highlight-menu .el-dropdown-menu__item { color: #b8c7da; }
html.dark .community-highlight-menu .el-dropdown-menu__item:hover, html.dark .community-highlight-menu .el-dropdown-menu__item.is-current { color: #9bd0ff; background: #203d61; }
html.dark .community-heading-menu, html.dark .community-list-menu, html.dark .community-insert-menu, html.dark .community-image-size-menu, html.dark .community-table-menu { border-color: #2d4059; background: #19263b; }
html.dark .community-heading-menu .el-dropdown-menu__item, html.dark .community-list-menu .el-dropdown-menu__item, html.dark .community-insert-menu .el-dropdown-menu__item, html.dark .community-image-size-menu .el-dropdown-menu__item, html.dark .community-table-menu .el-dropdown-menu__item { color: #b8c7da; }
html.dark .community-heading-menu .el-dropdown-menu__item.is-current, html.dark .community-list-menu .el-dropdown-menu__item:hover, html.dark .community-insert-menu .el-dropdown-menu__item:hover, html.dark .community-image-size-menu .el-dropdown-menu__item.is-current, html.dark .community-table-menu .el-dropdown-menu__item:hover { color: #9bd0ff; background: #203d61; }
html.dark .community-list-menu .tiptap-toolbar-icon, html.dark .community-insert-menu .tiptap-toolbar-icon { color: #9eb3cc; }
html.dark .community-image-size-menu .el-dropdown-menu__item span { color: #8193ac; }
html.dark .community-image-size-menu .el-dropdown-menu__item.is-current span { color: #9bd0ff; }
html.dark .community-table-menu .el-dropdown-menu__item.is-divided { border-top-color: #2d4059; }
html.dark .community-tiptap-editor .tiptap .tableWrapper { scrollbar-color: #49627e #17243a; }
html.dark .community-tiptap-editor .tiptap .tableWrapper > table, html.dark .community-tiptap-editor .tiptap > table { border-color: #31415a; background: #141e31; }
html.dark .community-tiptap-editor .tiptap .tableWrapper > table th, html.dark .community-tiptap-editor .tiptap .tableWrapper > table td, html.dark .community-tiptap-editor .tiptap > table th, html.dark .community-tiptap-editor .tiptap > table td { border-color: #31415a; }
html.dark .community-tiptap-editor .tiptap .tableWrapper > table th, html.dark .community-tiptap-editor .tiptap > table th { color: #dbe8f7; background: #20324b; }
html.dark .community-tiptap-editor .tiptap .tableWrapper > table td, html.dark .community-tiptap-editor .tiptap > table td { color: #b8c7da; background: #141e31; }
html.dark .community-tiptap-editor .tiptap .selectedCell:after { background: rgba(89, 160, 235, .24); }
</style>

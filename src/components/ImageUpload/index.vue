<template>
  <div class="component-upload-image">
    <el-upload
      ref="imageUploadRef"
      multiple
      :action="uploadImgUrl"
      list-type="picture-card"
      :on-success="handleUploadSuccess"
      :before-upload="handleBeforeUpload"
      :data="uploadData"
      :limit="limit"
      :accept="fileAccept"
      :on-error="handleUploadError"
      :on-exceed="handleExceed"
      :before-remove="handleDelete"
      :show-file-list="true"
      :headers="headers"
      :file-list="fileList"
      :on-preview="handlePictureCardPreview"
      :class="{ hide: fileList.length >= limit }"
    >
      <el-icon class="avatar-uploader-icon">
        <plus />
      </el-icon>
    </el-upload>
    <!-- 上传提示 -->
    <div v-if="showTip" class="el-upload__tip">
      请上传
      <template v-if="fileSize">
        大小不超过
        <b style="color: #f56c6c">{{ fileSize }}MB</b>
      </template>
      <template v-if="fileType">
        格式为
        <b style="color: #f56c6c">{{ fileType.join('/') }}</b>
      </template>
      的文件
    </div>

    <el-dialog v-model="dialogVisible" title="预览" width="800px" append-to-body>
      <img :src="dialogImageUrl" style="display: block; max-width: 100%; margin: 0 auto" />
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { compressAccurately } from 'image-conversion';
import { listByIds, delOss } from '@/api/system/oss';
import type { OssVO, SysOssExt } from '@/api/system/oss/types';
import modal from '@/plugins/modal';
import { propTypes } from '@/utils/propTypes';
import { globalHeaders } from '@/utils/request';
import { getToken } from '@/utils/auth';

const props = defineProps({
  modelValue: {
    type: [String, Object, Array],
    default: () => []
  },
  // 图片数量限制
  limit: propTypes.number.def(5),
  // 大小限制(MB)
  fileSize: propTypes.number.def(5),
  // 文件类型, 例如['png', 'jpg', 'jpeg']
  fileType: propTypes.array.def(['png', 'jpg', 'jpeg']),
  // 是否显示提示
  isShowTip: {
    type: Boolean,
    default: true
  },
  // 是否支持压缩，默认否
  compressSupport: {
    type: Boolean,
    default: false
  },
  // 压缩目标大小，单位KB。默认300KB以上文件才压缩，并压缩至300KB以内
  compressTargetSize: propTypes.number.def(300),
  // 上传扩展属性
  ossExt: {
    type: Object as PropType<SysOssExt>,
    default: undefined
  }
});

const emit = defineEmits(['update:modelValue']);
const number = ref(0);
const uploadList = ref<any[]>([]);
const dialogImageUrl = ref('');
const dialogVisible = ref(false);

const baseUrl = import.meta.env.VITE_APP_BASE_API;
const uploadImgUrl = ref(baseUrl + '/resource/oss/upload'); // 上传的图片服务器地址
const headers = computed(() => globalHeaders());

// 图片标签无法添加 Authorization 请求头，改由后端预览接口转发图片内容。
const buildPreviewUrl = (ossId: string | number) => {
  const query = new URLSearchParams({
    Authorization: `Bearer ${getToken()}`,
    clientid: import.meta.env.VITE_APP_CLIENT_ID
  });
  return `${baseUrl}/resource/oss/preview/${ossId}?${query.toString()}`;
};

const resolvePreviewUrl = (item: OssVO | { url?: string; ossId?: string | number } | string) => {
  if (typeof item === 'string') return item;
  if (item.ossId !== undefined && item.ossId !== null) return buildPreviewUrl(item.ossId);
  return item.url;
};

const fileList = ref<any[]>([]);
const showTip = computed(() => props.isShowTip && (props.fileType || props.fileSize));

const imageUploadRef = ref<ElUploadInstance>();
// 防止删除/清空后，之前发出的 listByIds 请求返回旧数据又把图片恢复出来。
const modelValueVersion = ref(0);

// 上传附加数据（ossExt 扩展属性）
const uploadData = computed(() => {
  if (!props.ossExt) return {};
  return {
    ossExt: JSON.stringify(props.ossExt)
  }
});

// 监听 fileType 变化，更新 fileAccept
const fileAccept = computed(() => props.fileType.map(type => `.${type}`).join(','));

watch(
  () => props.modelValue,
  async (val: unknown) => {
    const currentVersion = ++modelValueVersion.value;
    // 先清空当前显示，避免旧图片在异步查询期间继续留在界面上。
    fileList.value = [];
    if (!val) return;

    let list: OssVO[] = [];
    try {
      if (Array.isArray(val)) {
        list = val as OssVO[];
      } else if (typeof val === 'object') {
        list = [val as OssVO];
      } else if (typeof val === 'string' || typeof val === 'number') {
        const res = await listByIds(val);
        list = Array.isArray(res.data) ? res.data : [];
      }
    } catch {
      // 查询失败时不恢复旧文件，保留当前绑定值，避免网络抖动导致错误清空。
      return;
    }

    // 只有最后一次值对应的请求可以更新列表，避免旧请求覆盖删除结果。
    if (currentVersion !== modelValueVersion.value) return;

    // 然后将数组转为对象数组
    fileList.value = list.map(item => {
      // 字符串回显处理 如果此处存的是url可直接回显 如果存的是id需要调用接口查出来
      if (typeof item === 'string') {
        return { name: item, url: item };
      }
      // 此处name使用ossId 防止删除出现重名
      return { name: item.ossId, url: resolvePreviewUrl(item), ossId: item.ossId };
    });

    // OSS 记录已不存在时，清除表单中的失效关联，避免保存时再次带回破图。
    if (list.length === 0 && props.modelValue === val) {
      emit('update:modelValue', '');
    }
  },
  { deep: true, immediate: true }
);

/** 上传前loading加载 */
const handleBeforeUpload = (file: any) => {
  let isImg = false;
  if (props.fileType.length) {
    let fileExtension = '';
    if (file.name.lastIndexOf('.') > -1) {
      fileExtension = file.name.slice(file.name.lastIndexOf('.') + 1);
    }
    isImg = props.fileType.some((type: any) => {
      if (file.type.indexOf(type) > -1) return true;
      if (fileExtension && fileExtension.indexOf(type) > -1) return true;
      return false;
    });
  } else {
    isImg = file.type.indexOf('image') > -1;
  }
  if (!isImg) {
    modal.msgError(`文件格式不正确, 请上传${props.fileType.join('/')}图片格式文件!`);
    return false;
  }
  if (file.name.includes(',')) {
    modal.msgError('文件名不正确，不能包含英文逗号!');
    return false;
  }
  if (props.fileSize) {
    const isLt = file.size / 1024 / 1024 < props.fileSize;
    if (!isLt) {
      modal.msgError(`上传头像图片大小不能超过 ${props.fileSize} MB!`);
      return false;
    }
  }

  //压缩图片，开启压缩并且大于指定的压缩大小时才压缩
  if (props.compressSupport && file.size / 1024 > props.compressTargetSize) {
    modal.loading('正在上传图片，请稍候...');
    number.value++;
    return compressAccurately(file, props.compressTargetSize);
  } else {
    modal.loading('正在上传图片，请稍候...');
    number.value++;
  }
};

// 文件个数超出
const handleExceed = () => {
  modal.msgError(`上传文件数量不能超过 ${props.limit} 个!`);
};

// 上传成功回调
const handleUploadSuccess = (res: any, file: UploadFile) => {
  if (res.code === 200) {
    uploadList.value.push({
      name: res.data.fileName,
      url: buildPreviewUrl(res.data.ossId),
      ossId: res.data.ossId
    });
    uploadedSuccessfully();
  } else {
    number.value--;
    modal.closeLoading();
    modal.msgError(res.msg);
    imageUploadRef.value?.handleRemove(file);
    uploadedSuccessfully();
  }
};

// 删除图片
const handleDelete = (file: UploadFile): boolean => {
  const findex = fileList.value.map(f => f.name).indexOf(file.name);
  if (findex > -1) {
    const ossId = fileList.value[findex]?.ossId;
    // 返回 true 让 Element Plus 同步移除内部文件项；这里同步更新受控列表和 v-model。
    fileList.value = fileList.value.filter((_, index) => index !== findex);
    emit('update:modelValue', listToString(fileList.value));
    if (ossId !== undefined && ossId !== null) {
      void delOss(ossId).catch(() => modal.msgError('图片文件删除失败，请稍后重试'));
    }
  }
  return true;
};

// 上传结束处理
const uploadedSuccessfully = () => {
  if (number.value > 0 && uploadList.value.length === number.value) {
    fileList.value = fileList.value.filter(f => f.url !== undefined).concat(uploadList.value);
    uploadList.value = [];
    number.value = 0;
    emit('update:modelValue', listToString(fileList.value));
    modal.closeLoading();
  }
};

// 上传失败
const handleUploadError = () => {
  modal.msgError('上传图片失败');
  modal.closeLoading();
};

// 预览
const handlePictureCardPreview = (file: any) => {
  dialogImageUrl.value = file.url;
  dialogVisible.value = true;
};

// 对象转成指定字符串分隔
const listToString = (list: any[], separator?: string) => {
  let strs = '';
  separator = separator || ',';
  for (const i in list) {
    if (list[i]?.ossId !== undefined && list[i]?.ossId !== null && (!list[i].url || !String(list[i].url).startsWith('blob:'))) {
      strs += list[i].ossId + separator;
    }
  }
  return strs != '' ? strs.substring(0, strs.length - 1) : '';
};
</script>

<style lang="scss" scoped>
// .el-upload--picture-card 控制加号部分
:deep(.hide .el-upload--picture-card) {
  display: none;
}
</style>

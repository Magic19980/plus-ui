import HighLight from '@highlightjs/vue-plugin';
import { ElDialog } from 'element-plus';
import { createApp } from 'vue';
import VxeUIPlugin, { VxeUI } from 'vxe-pc-ui';
import VxeTablePlugin from 'vxe-table';
import 'virtual:uno.css';
import 'element-plus/theme-chalk/dark/css-vars.css';
import '@/assets/styles/index.scss';
import 'highlight.js/styles/atom-one-dark.css';
import 'highlight.js/lib/common';
import 'virtual:svg-icons-register';
import 'vxe-pc-ui/lib/style.css';
import 'vxe-table/lib/style.css';
import i18n from '@/lang/index';
import ElementIcons from '@/plugins/svgicon';
import App from './App.vue';
import directive from './directive';
import plugins from './plugins/index';
import './permission';
import router from './router';
import store from './store';

VxeUI.setConfig({
  zIndex: 999999
});

ElDialog.props.closeOnClickModal.default = false;

const app = createApp(App);

app.use(HighLight);
app.use(ElementIcons);
app.use(store);
app.use(router);
app.use(i18n);
app.use(VxeUIPlugin);
app.use(VxeTablePlugin);
app.use(plugins);
directive(app);

app.mount('#app');

// VXE 默认会在组件加载时固定为浅色，需要与应用的 html.dark 状态保持同步。
// 监听 class 变化可覆盖首次加载和运行时切换两种场景，避免选择器等弹层继续使用白色表格。
let currentVxeTheme: 'light' | 'dark' | undefined;
const syncVxeTheme = () => {
  const nextTheme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
  if (currentVxeTheme !== nextTheme) {
    currentVxeTheme = nextTheme;
    VxeUI.setTheme(nextTheme);
  }
};

syncVxeTheme();
const vxeThemeObserver = new MutationObserver(syncVxeTheme);
vxeThemeObserver.observe(document.documentElement, {
  attributes: true,
  attributeFilter: ['class']
});

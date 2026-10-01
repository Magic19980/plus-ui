const DEFAULT_PRIMARY_COLOR = '#409eff';

/**
 * 规范化主题色，避免配置被清空或传入非法值后生成无效的 rgba / Hex CSS。
 * 主题色来自设置面板和持久化存储，不能假设每次读取到的值都完整可靠。
 */
const normalizeHexColor = (color: string, fallback = DEFAULT_PRIMARY_COLOR) => {
  const value = color?.trim() || '';
  if (/^#[\da-f]{6}$/i.test(value)) return value;
  if (/^#[\da-f]{3}$/i.test(value)) {
    return `#${value
      .slice(1)
      .split('')
      .map((part) => `${part}${part}`)
      .join('')}`;
  }
  return fallback;
};

// 处理主题样式
export const handleThemeStyle = (theme: string) => {
  const safeTheme = normalizeHexColor(theme);
  const rgb = hexToRgb(safeTheme);

  document.documentElement.style.setProperty('--el-color-primary', safeTheme);
  for (let i = 1; i <= 9; i++) {
    document.documentElement.style.setProperty(`--el-color-primary-light-${i}`, `${getLightColor(safeTheme, i / 10)}`);
  }
  for (let i = 1; i <= 9; i++) {
    document.documentElement.style.setProperty(`--el-color-primary-dark-${i}`, `${getDarkColor(safeTheme, i / 10)}`);
  }
  // 同时更新应用层的高亮色变量，使其跟随主色变化
  document.documentElement.style.setProperty('--app-accent-r', rgb[0]);
  document.documentElement.style.setProperty('--app-accent-g', rgb[1]);
  document.documentElement.style.setProperty('--app-accent-b', rgb[2]);
  document.documentElement.style.setProperty('--app-accent-strong', safeTheme);
  document.documentElement.style.setProperty('--app-accent-soft', `rgba(${rgb.join(',')}, 0.08)`);
  // 计算按钮交互态颜色（hover ≈ 暗 15%，active ≈ 暗 25%）
  document.documentElement.style.setProperty('--app-button-hover', getDarkColor(safeTheme, 0.15));
  document.documentElement.style.setProperty('--app-button-active', getDarkColor(safeTheme, 0.25));
};

// hex颜色转rgb颜色
export const hexToRgb = (str: string): string[] => {
  str = str.replace('#', '');
  const hexs = str.match(/../g);
  for (let i = 0; i < 3; i++) {
    if (hexs) {
      hexs[i] = String(parseInt(hexs[i], 16));
    }
  }
  return hexs ? hexs : [];
};

// rgb颜色转Hex颜色
export const rgbToHex = (r: string, g: string, b: string) => {
  const hexs = [Number(r).toString(16), Number(g).toString(16), Number(b).toString(16)];
  for (let i = 0; i < 3; i++) {
    if (hexs[i].length == 1) {
      hexs[i] = `0${hexs[i]}`;
    }
  }
  return `#${hexs.join('')}`;
};

// 变浅颜色值
export const getLightColor = (color: string, level: number) => {
  const rgb = hexToRgb(color);
  for (let i = 0; i < 3; i++) {
    const s = (255 - Number(rgb[i])) * level + Number(rgb[i]);
    rgb[i] = String(Math.floor(s));
  }
  return rgbToHex(rgb[0], rgb[1], rgb[2]);
};

// 变深颜色值
export const getDarkColor = (color: string, level: number) => {
  const rgb = hexToRgb(color);
  for (let i = 0; i < 3; i++) {
    rgb[i] = String(Math.floor(Number(rgb[i]) * (1 - level)));
  }
  return rgbToHex(rgb[0], rgb[1], rgb[2]);
};

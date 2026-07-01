// 处理主题样式
export const handleThemeStyle = (theme: string) => {
  document.documentElement.style.setProperty('--el-color-primary', theme);
  for (let i = 1; i <= 9; i++) {
    document.documentElement.style.setProperty(`--el-color-primary-light-${i}`, `${getLightColor(theme, i / 10)}`);
  }
  for (let i = 1; i <= 9; i++) {
    document.documentElement.style.setProperty(`--el-color-primary-dark-${i}`, `${getDarkColor(theme, i / 10)}`);
  }
  // 同时更新应用层的高亮色变量，使其跟随主色变化
  const rgb = hexToRgb(theme);
  if (rgb?.length >= 3) {
    document.documentElement.style.setProperty('--app-accent-r', rgb[0]);
    document.documentElement.style.setProperty('--app-accent-g', rgb[1]);
    document.documentElement.style.setProperty('--app-accent-b', rgb[2]);
  }
  document.documentElement.style.setProperty('--app-accent-strong', theme);
  document.documentElement.style.setProperty('--app-accent-soft', `rgba(${rgb.join(',')}, 0.08)`);
  // 计算按钮交互态颜色（hover ≈ 暗 15%，active ≈ 暗 25%）
  document.documentElement.style.setProperty('--app-button-hover', getDarkColor(theme, 0.15));
  document.documentElement.style.setProperty('--app-button-active', getDarkColor(theme, 0.25));
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

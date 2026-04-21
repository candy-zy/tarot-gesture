# 星月塔罗 · 无形之手

> 以无形之手，触碰命运的低语

一款基于 **手势识别** 的沉浸式塔罗牌占卜 Web 应用。通过 MediaPipe 实时捕捉手部动作，让用户以「空中画圆」「手掌旋转」「捏合手指」等隐形手势完成整个占卜仪式，无需鼠标或键盘。

🔗 **[在线体验 Demo](#)** | 技术栈：React · TypeScript · Vite · MediaPipe · Framer Motion

---

## ✨ 核心交互设计

| 阶段 | 手势 | 效果 |
|------|------|------|
| 唤醒法阵 | 食指在空中画圆 | 法阵图像随画圆进度逐步发光点亮 |
| 旋转命运之轮 | 左右移动手掌 | 法阵与卡牌跟随手势实时旋转 |
| 进入选牌 | 捏合并保持 | 进度条填满后进入下一阶段 |
| 悬停选牌 | 手掌停留对准 | 牌面发光高亮 |
| 确认选牌 | 稳定停留后捏合 | 选中该牌 |
| 阅读解读 | 捏合上下拖动 | 滚动解读文本 |

所有操作均可通过**点击**完成，摄像头为可选增强体验。

---

## 🚀 本地运行

```bash
npm install
npm run dev
# 访问 http://localhost:5173
```

## 部署到 GitHub Pages

```bash
npm run build
# 将 dist/ 目录内容推送到 gh-pages 分支
```

---

## 🏗 技术架构

```
src/
├── components/
│   ├── HomePage.tsx        # 首页入口，法阵动画展示
│   ├── ReadingPage.tsx     # 主占卜页面，四阶段状态机
│   ├── TarotCard.tsx       # 塔罗牌组件，含翻转动画
│   ├── SpreadLayout.tsx    # 三牌阵布局
│   ├── ResultPanel.tsx     # 占卜解读结果面板
│   └── GestureIndicator.tsx # 手势状态 HUD
├── hooks/
│   ├── useHandTracking.ts  # MediaPipe 手势识别 Hook
│   └── useTarotReading.ts  # 占卜流程状态机
├── lib/
│   ├── circleGesture.ts    # 画圆手势算法（轨迹分析）
│   └── tarotEngine.ts      # 抽牌引擎与解读生成
└── data/tarotData.ts       # 22 张大阿尔卡那完整数据
```

### 关键技术点

- **画圈识别**：基于轨迹的几何分析算法，计算圆形度、封闭性、旋转角等特征分数
- **RAF 旋转控制**：requestAnimationFrame 循环读取手势 X 坐标，实现法阵的流畅实时旋转
- **状态机设计**：`intro → preview → selecting → revealing → reading` 五阶段流程
- **零后端**：纯前端实现，无需服务器，可直接部署静态托管

---

## 📋 浏览器兼容

| 浏览器 | 支持 |
|--------|------|
| Chrome 90+ | ✅ 推荐 |
| Edge 90+ | ✅ 良好 |
| Firefox 88+ | ⚠️ 可用 |
| Safari 15+ | ⚠️ 需允许摄像头 |

> 若摄像头权限被拒绝，所有操作均可通过点击完成。

---

## 🃏 牌库

包含完整 22 张大阿尔卡那，含正逆位判断、关键词、详细中文解读。

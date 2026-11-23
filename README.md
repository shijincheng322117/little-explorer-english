# Little Explorer English 小探险家英语

面向 3 岁男宝宝的英语启蒙小工具：纯静态 PWA，无后端、无广告，部署到 GitHub Pages / Vercel 后可在 iPhone Safari 中“添加到主屏幕”，全屏、离线、稳定运行。

## 1. 本地测试

不能直接双击 `index.html`，因为 `fetch words.json` 和 Service Worker 需要 HTTP 环境：

```bash
cd little-explorer-english
python -m http.server 8000
```

浏览器访问：http://localhost:8000

## 2. 生成音频

```bash
pip install edge-tts
python generate_audio.py
```

脚本会读取 `words.json`，为每个词条生成题目语音和单词发音，外加表扬语和可选音效。已存在的文件会自动跳过。

## 3. 替换图片

1. 将真实图片（PNG/WebP）放入 `assets/images/`。
2. 修改 `words.json` 中对应词条的 `image` 路径。
3. 图片缺失时 App 会自动降级显示 emoji，不会白屏。

PWA 图标：把 180px 和 512px 的 PNG 分别放为 `assets/icons/icon-180.png` 和 `assets/icons/icon-512.png`（当前为占位文件，请替换）。

## 4. 部署

1. 整个文件夹上传到 GitHub Pages 或 Vercel，必须使用 HTTPS。
2. iPhone Safari 打开链接，点击分享 → 添加到主屏幕。
3. 从主屏幕图标进入即全屏无地址栏，可离线使用。

## 5. 家长扩展词库

1. 编辑 `words.json`，按现有格式新增词条（注意 `id`、`station`、`difficulty` 字段）。
2. 运行 `python generate_audio.py` 生成新音频。
3. 重新部署即可。

## 6. 注意事项

- iOS 首次播放音频需要一次用户点击解锁，首页有 Start 按钮处理。
- 单次使用建议不超过 10 分钟，8 分钟时会自动弹出休息界面，请家长陪同。
- 主题边界：Cars 学日常交通工具与 Road / Rail / Sky / Water 场景；Construction 学工程车与 Dig / Haul / Roll / Mix / Lift 工地动作。
- 所有拖拽已降级为点击大图标，iPhone 上操作稳定。

# 安全 / Security

Spec Bifrost 处理本地产品需求资产。

Spec Bifrost handles local product requirement assets.

## 本地文件 / Local Files

插件读取当前项目中的 `spec-bifrost.json`。

The plugin reads the current project `spec-bifrost.json`.

当用户要求创建或修改原型时，Claude 可以创建或修改 `spec-bifrost.json`。

Claude may create or modify `spec-bifrost.json` when the user asks to create or change a prototype.

导出 skill 会写入：

The export skill writes:

```txt
docs/spec-bifrost/frontend-requirements.md
docs/spec-bifrost/backend-requirements.md
```

## 本地预览 / Local Preview

预览服务默认绑定到 `127.0.0.1`。

The preview service binds to `127.0.0.1` by default.

预览中的输入值只保存在浏览器内存中，不会写回 JSON。

Preview input values stay in browser memory and are not written back to JSON.

## 网络 / Network

插件不会上传 `spec-bifrost.json` 或导出的文档。

The plugin does not upload `spec-bifrost.json` or exported documents.

## Hooks 与 Renderer / Hooks And Renderer

校验 hook 只报告错误事实。

The validation hook reports error facts only.

renderer 只报告渲染错误事实。

The renderer reports render error facts only.

hook 和 renderer 都不会写入 `spec-bifrost.json`。

Neither hook nor renderer writes `spec-bifrost.json`.

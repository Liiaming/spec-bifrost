## 变更内容 / Summary

- 

## 验证 / Validation

- [ ] `npm run check`
- [ ] 插件元数据、命令或 marketplace-facing 文件变化时，运行 `claude plugin validate plugins/spec-bifrost`
- [ ] marketplace 文件变化时，运行 `claude plugin validate .`
- [ ] renderer 可见变化已附截图或说明人工预览结果

## 风险 / Risk

- 

## 检查清单 / Checklist

- [ ] 变更保持聚焦，没有包含无关重构。
- [ ] 行为变化已新增或更新测试。
- [ ] 变更保持产品边界：需求原型和需求文档，不生成生产代码。
- [ ] README 变化已按需同步 `README.md`、`README.en.md` 和 `plugins/spec-bifrost/README.md`。
- [ ] 发布元数据变化已保持根 package、Claude manifest 和 Codex manifest 版本一致。
- [ ] 未提交 secrets、私有配置或真实客户数据。

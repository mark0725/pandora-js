# pandora-js
pandora app ui


## TODO
- [ ] 国际化
- [ ] 动态图标服务
- [ ] 个人中心
- [ ] Oauth登录
- [ ] FilterBar
  - [ ] Filterbar区间筛选组件支持
  - [ ] 标签筛选组件支持
  - [ ] radio button 筛选组件支持
- [ ] 表单
    - [ ] 表单字段校验
    - [ ] 表单字段高亮,多种背景色
    - [ ] 表单帮助提示
    - [ ] 表单错误提示
    - [ ] 复制到剪贴板
- [ ] 表格
    - [ ] 表格字段显示和隐藏
    - [ ] 表格字段复制到剪贴板
    - [ ] 表格头支持排序
    - [ ] 表格头支持过滤
    - [ ] 表格支持分组
    - [ ] 表格当前行
    - [ ] 表格支持设置：显示列、顺序、高度
- [ ] 下拉框
    - [x] 下拉框搜索支持label
    - [ ] 下拉框支持表格风格
    - [ ] 下拉框数据动态加载
- [ ] tag组件
  - [ ] 实现多种tag样式
  - [ ] tag搜索支持
- [ ] 多主题支持
- [ ] 高级筛选
- [ ] 权限
- [ ] 系统管理


## 校验
```
{
  "state": {
    "badInput": false,
    "customError": false,
    "patternMismatch": false,
    "rangeOverflow": false,
    "rangeUnderflow": false,
    "stepMismatch": false,
    "tooLong": false,
    "tooShort": false,
    "typeMismatch": false,
    "valid": null,
    "valueMissing": false
  },
  "error": "",
  "errors": [],
  "value": null,
  "initialValue": "",
  "validity": {
    "badInput": false,
    "customError": false,
    "patternMismatch": false,
    "rangeOverflow": false,
    "rangeUnderflow": false,
    "stepMismatch": false,
    "tooLong": false,
    "tooShort": false,
    "typeMismatch": false,
    "valid": null,
    "valueMissing": false
  }
}
```
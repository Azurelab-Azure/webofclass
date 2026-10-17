# 语言

我的课表支持 20 种语言，随时切换，互不影响数据。

## 支持的语言

| 语言 | 本地名称 | 代码 |
|------|----------|------|
| 简体中文 | 简体中文 | zh-CN |
| 繁体中文 | 繁體中文 | zh-TW |
| 英语 | English | en |
| 日语 | 日本語 | ja |
| 韩语 | 한국어 | ko |
| 法语 | Français | fr |
| 德语 | Deutsch | de |
| 西班牙语 | Español | es |
| 葡萄牙语 | Português | pt |
| 意大利语 | Italiano | it |
| 荷兰语 | Nederlands | nl |
| 波兰语 | Polski | pl |
| 俄语 | Русский | ru |
| 土耳其语 | Türkçe | tr |
| 阿拉伯语 | العربية | ar |
| 泰语 | ไทย | th |
| 越南语 | Tiếng Việt | vi |
| 印尼语 | Bahasa Indonesia | id |
| 印地语 | हिन्दी | hi |
| 希伯来语 | עברית | he |

## 怎么切换

### 桌面软件

1. 打开 **设置**
2. 进入 **语言**
3. 从列表中选择

切换后立即生效，无需重启。

### 官网

官网目前只提供中文，未来会支持多语言。

## 语言与数据

**切换语言不影响数据。** 课程名称、学生姓名、成绩等用户输入的内容保持原样，只翻译界面文字。

例如：把语言从中文切到英文后：

- 界面按钮变成英文
- 你录入的课程「高等数学」保持不变

## 社区贡献

如果你想把我的课表翻译成新语言，或者改进现有翻译：

1. 前往 [GitHub 仓库](https://github.com/Azurelab-Azure/myclassroom)
2. 找到 `lang` 文件夹
3. 复制 `zh-CN.json` 作为模板
4. 翻译内容
5. 提交 Pull Request

翻译文件格式：

```json
{
  "app.name": "MyClassroom",
  "menu.file": "File",
  "menu.edit": "Edit",
  "button.save": "Save",
  "button.cancel": "Cancel"
}
```

下一步

- [备份与恢复](backup.md)
- [备份与恢复](themes.md)
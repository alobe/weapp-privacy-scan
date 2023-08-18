# weapp privacy scan

## 介绍
针对微信小程序8月10号公布的[隐私保护指引](https://developers.weixin.qq.com/community/develop/doc/00042e3ef54940ce8520e38db61801)改造的开发者使用的cli分析工具，用于检查小程序构建包是否有使用隐私保护指引改造涉及的组件或接口。

## 使用

```shell
npx weapp-privacy-scan@latest -p=[微信小程序构建包路径] [-d](可选，是否输出详细信息)

//例如
sudo npx weapp-privacy-scan@latest -p=/Users/your/workspace/project/dist/build/mp-weixin -d
```
## 输出
会在脚本执行目录下生成一个`privacy-pages.json`文件，里面记录了扫描结果。包含需要做隐私保护改造的页面列表needPrivacySettingPages及其具体分析详情details。
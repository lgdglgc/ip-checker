# IP 分流 & AI 可用性检测系统 (支持 Google Gemini / ChatGPT / Claude)

复刻自 `ip.net.coffee` 并升级拓展，支持检测当前网络分流规则下各主流 AI（Google Gemini、OpenAI ChatGPT、Anthropic Claude）的出口 IP、地理位置、住宅/机房属性及网络连通性。

## ✨ 特性

- **✨ Google Gemini 专属检测**：
  - 智能识别 Gemini 官方服务限制地区（对香港 HK、澳门 MO、大陆 CN 等进行针对性风险警示与标红）。
  - 基于 Google 全球集群节点的延迟连通性实测。
- **🤖 ChatGPT & Claude 分流出口探测**：
  - 利用官方 `/cdn-cgi/trace` 精准提取实际出口 IP。
- **🏠 IP 属性判别**：
  - 自动识别住宅原生 IP（Residential）与数据中心机房 IP（Hosting/Data Center），排查封控风险。
- **🛡 浏览器指纹防护排查**：
  - 读取 Canvas 与 WebGL 显卡渲染器硬件指纹。
- **⚡ 零成本极速部署**：
  - 完美适配 **Vercel** Serverless Functions 与纯静态托管，一键免费上线。

---

## 🚀 一键部署到 Vercel

1. 将本项目推送到你的 GitHub 仓库。
2. 登录 [Vercel 官网](https://vercel.com/)。
3. 点击 **"Add New..."** -> **"Project"**，导入你的 GitHub 仓库。
4. 无需修改任何构建命令（根目录下已配置 `vercel.json`），直接点击 **"Deploy"** 即可！

---

## 🛠 本地开发运行

```bash
# 进入项目目录
cd ip-checker

# 启动本地服务（原生 Node.js，零第三方 npm 依赖）
node server.js
```

浏览器访问：`http://localhost:3000`

# 米莱婚礼邀请函 · Той шақыруы · Свадебное приглашение

一个**三语（哈/俄/中）、移动优先、纯静态**的婚礼邀请单页。
回执自动收集到 Google 表格，0 后端 0 费用，部署到 GitHub Pages 即可。

---

## 1. 目录结构

```
米莱婚礼邀请函/
├── index.html        ← 页面结构
├── styles.css        ← 视觉（草原金 + 深绿 + 哈萨克 ою 纹饰）
├── app.js            ← 倒计时 / 语言切换 / 日历 / RSVP / 留言 / 地图
├── config.js         ← ⭐ 所有可改信息都在这里
├── i18n.js           ← 三语文案
├── assets/
│   └── music.mp3     ← （可选）背景音乐，不放就自动隐藏音乐按钮
└── google-apps-script.js   ← 复制到 Apps Script 的后台代码模板
```

---

## 2. 改信息：只需要动一个文件

打开 [`config.js`](config.js)，按里面的中文注释逐项填即可：

- 新郎 / 新娘三语姓名
- 婚礼时间（**Almaty 时区 +06**，格式 `2026-06-13T18:00:00+06:00`）
- 宴会厅名称、地址（三语）
- **2GIS 链接**：在 2GIS 网站找到宴会厅，复制详情页地址
- **经纬度**：在 2GIS 或 Google Maps 右键即可复制
- 主人联系方式
- Dress code 文案
- 默认语言（`kk` / `ru` / `zh`）

文案要改？打开 [`i18n.js`](i18n.js)，对照三种语言改。

---

## 3. 部署 RSVP 收集（Google Apps Script → Sheet）

**5 分钟搞定，永久免费，无服务器。**

### 步骤

1. 打开 [sheets.new](https://sheets.new) 新建一个 Google 表格，命名 `Wedding RSVP`
2. 表格顶部菜单：**扩展程序 → Apps Script**
3. 把项目里 [`google-apps-script.js`](google-apps-script.js) 的全部内容粘贴进去，替换掉默认代码
4. 顶部点 **部署 → 新建部署 → 类型选 Web 应用**
5. 配置：
   - **执行身份**：我（你自己的账号）
   - **谁有权访问**：所有人 (Anyone)
6. 点 **部署**，授权后会得到一个长链接，形如：
   `https://script.google.com/macros/s/AKfycb..../exec`
7. **把这个链接粘到 [`config.js`](config.js) 的 `rsvpEndpoint`**

> 测试：在网页 RSVP 表单提交一次 → 打开你的 Google 表格，会看到自动新增一行。

如果留空 `rsvpEndpoint`，网页会自动进入"演示模式"：回执只保存在本机 localStorage，留言区只显示当前设备提交过的内容，方便先在本地测样式。

---

## 4. 部署网页（GitHub Pages）

### 方法 A · 网页拖拽（不会 git 也能用）

1. 浏览器打开 https://github.com/new，新建一个仓库（例如 `wedding`），**勾选 "Add README"**
2. 进入仓库 → 点 **Add file → Upload files**
3. 把本目录里的 **所有文件**拖进去（含 `index.html`、`styles.css`、`app.js`、`config.js`、`i18n.js`、`assets/`），提交
4. 仓库菜单 **Settings → Pages**
5. **Source** 选 `Deploy from a branch`，分支选 `main` / `/ (root)`，**Save**
6. 一两分钟后页面顶部会显示 `Your site is live at https://<你的用户名>.github.io/wedding/`
7. 用手机扫这条链接，或者直接发给客人

### 方法 B · git 命令行

```bash
cd 米莱婚礼邀请函
git init
git add .
git commit -m "wedding invitation"
git branch -M main
git remote add origin https://github.com/<你>/wedding.git
git push -u origin main
```

然后同样在 **Settings → Pages** 开启即可。

---

## 5. 可选 · 背景音乐

往 `assets/music.mp3` 里放一段你喜欢的 mp3（dombyra 演奏、纯音乐均可，建议 < 3 MB，循环不刺耳）。
没放也没关系 —— 右上角音乐按钮会自动隐藏。

> 受浏览器限制，音乐**不会自动播放**，必须客人手动点一下按钮。这是有意的，避免页面打开就吵到人。

---

## 6. 自检清单

发出去之前，用手机打开链接，确认：

- [ ] 顶部三语切换正常（КАЗ / РУС / 中文）
- [ ] 倒计时秒数在跳
- [ ] "加入日历" 按钮 → 手机日历能添加上
- [ ] "在 2GIS 中打开" 按钮 → 跳到正确的宴会厅
- [ ] 中间小地图缩略图位置正确
- [ ] RSVP 提交一次 → 你的 Google 表格自动多了一行
- [ ] 留言区显示出新留言（刷新后）
- [ ] 不同手机型号（iPhone / Android）UI 没错位
- [ ] 顶部 og:image 之类的可以稍后补，分享到微信/Telegram 也能看

---

## 7. 一些细节

- **不放照片**：按你的要求，整个网站没有任何人像图片，只用哈萨克 ою 纹饰、金色与深绿，体现婚礼的庄重感。
- **哈萨克元素**：
  - 内嵌 SVG 的 *Кошкармүйіз*（公羊角）纹饰，作为 Hero 上下边框
  - 中央圆形 *медальон* 作为新人姓名之间的连接符
  - 哈萨克传统贺词（Бата），三语对照
- **地图**：免费版 2GIS 不允许第三方嵌入，所以用 **OpenStreetMap** 作为预览缩略图，点击直接跳转 2GIS app/网页。
- **离线友好**：所有 JS 内联在站内，唯一外部依赖是 Google Fonts。需要更稳可以把字体也下载本地。
- **性能**：整站 < 60 KB（不含字体），首屏秒开。

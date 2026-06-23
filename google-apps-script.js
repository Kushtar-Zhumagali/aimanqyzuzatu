/* ============================================================================
 * Google Apps Script · Wedding RSVP backend
 * ----------------------------------------------------------------------------
 * 步骤：
 *   1. 在 Google Sheet 里点：扩展程序 → Apps Script
 *   2. 把这段代码完整粘贴进去（替换掉默认的 myFunction）
 *   3. 顶部 → 部署 → 新建部署 → Web 应用
 *        - 执行身份：我
 *        - 谁有权访问：所有人（Anyone）
 *   4. 部署后复制 /exec 链接 → 粘到 config.js 的 rsvpEndpoint
 *
 * 表格会自动出现两个 Sheet：RSVP（出席回执）+ Wishes（留言）
 * ========================================================================== */

const SHEET_RSVP    = 'RSVP';
const SHEET_WISHES  = 'Wishes';

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.getActive();
    const rsvp = getOrCreateSheet_(ss, SHEET_RSVP, [
      'Timestamp', 'Name', 'Attending', 'Count', 'Message', 'Language',
    ]);
    rsvp.appendRow([
      new Date(),
      data.name || '',
      data.attending || '',
      Number(data.count || 0),
      data.message || '',
      data.lang || '',
    ]);
    // mirror message into Wishes if any
    if (data.message) {
      const wishes = getOrCreateSheet_(ss, SHEET_WISHES, ['Timestamp', 'Name', 'Message', 'Language']);
      wishes.appendRow([new Date(), data.name || '', data.message, data.lang || '']);
    }
    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

function doGet(e) {
  const params = e.parameter || {};
  let payload;
  if (params.action === 'wishes') {
    const ss = SpreadsheetApp.getActive();
    const sh = ss.getSheetByName(SHEET_WISHES);
    const rows = sh ? sh.getDataRange().getValues().slice(1) : []; // skip header
    payload = rows
      .filter((r) => r[2])           // has message
      .map((r) => ({ name: r[1], message: r[2], ts: r[0] }));
  } else {
    payload = { ok: true, hint: 'Use POST for RSVP, GET ?action=wishes for guestbook.' };
  }
  const json = JSON.stringify(payload);
  // JSONP — the website reads wishes via <script> tag to bypass CORS
  if (params.callback) {
    return ContentService
      .createTextOutput(params.callback + '(' + json + ')')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(json).setMimeType(ContentService.MimeType.JSON);
}

function getOrCreateSheet_(ss, name, headers) {
  let sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    sh.appendRow(headers);
    sh.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    sh.setFrozenRows(1);
  }
  return sh;
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

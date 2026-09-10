#!/usr/bin/env node
/**
 * build-assets.js — 内容指纹版本号构建脚本
 * ---------------------------------------------------------------
 * 背景：站点 _headers 已把 /js/* 、/css/* 设为 immutable 长缓存(1年)。
 *       这要求“资源 URL 必须随内容变化”，否则浏览器/CDN 会一直用旧代码。
 *       手写日期版本号(?v=20260910) 容易漏改，子目录页面更是完全没加。
 *
 * 本脚本对项目内每个 .html 中引用的【本地】css/js，按【文件字节内容】
 * 计算短哈希并回填为  ?v=<sha1前10位>  。
 *   - 文件内容一变 → 哈希自动变 → 浏览器自动拉到新版本，永不漏、无需人肉记日期。
 *   - 同一文件被多处引用 → 内容相同哈希相同 → 缓存共用一份，不浪费。
 *   - 外链/CDN(data:/http(s):/协议相对)不处理；引用的第三方库(libs/*)同样加指纹。
 *
 * 用法：  node build-assets.js           # 全量扫描并回填，输出变更报告
 *        node build-assets.js --dry     # 只打印将发生什么，不写文件
 *        node build-assets.js <path…>   # 只处理指定 html
 *
 * 部署前跑一次即可。脚本幂等：重复执行结果稳定(同内容同哈希)。
 */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = __dirname;
const args = process.argv.slice(2);
const DRY = args.includes('--dry');
const targets = args.filter(a => a !== '--dry');

/* ---------- 收集要处理的 html ---------- */
function collectHtml(root) {
  if (targets.length) {
    return targets.map(t => path.resolve(root, t)).filter(f => fs.existsSync(f));
  }
  const out = [];
  // 根目录所有 html
  for (const f of fs.readdirSync(root)) {
    if (f.endsWith('.html') && fs.statSync(path.join(root, f)).isFile()) out.push(path.join(root, f));
  }
  // 常用子目录/整理目录，避免落入 node_modules/.workbuddy 等
  const subDirs = ['相关文件'];
  for (const d of subDirs) {
    const dp = path.join(root, d);
    if (!fs.existsSync(dp) || !fs.statSync(dp).isDirectory()) continue;
    for (const f of fs.readdirSync(dp)) {
      if (f.endsWith('.html') && fs.statSync(path.join(dp, f)).isFile()) out.push(path.join(dp, f));
    }
  }
  return out;
}

/* ---------- 将引用解析为物理文件：html目录优先，回退站点根 ---------- */
function resolveRef(absHtml, ref) {
  // 剥掉 query
  const clean = ref.split('?')[0].replace(/^\.\//, '');
  const cands = [
    ['htmlDir', path.resolve(path.dirname(absHtml), clean)],
    ['siteRoot', path.resolve(ROOT, clean)],
  ];
  for (const [, p] of cands) {
    try {
      if (fs.statSync(p).isFile()) return p;
    } catch (_) { /* not found */ }
  }
  return null;
}

const LOCAL_EXT = /\.(css|js)$/i;

function processHtml(absHtml, report) {
  const orig = fs.readFileSync(absHtml, 'utf8');
  const base = path.basename(absHtml);
  // 只重写 引号 双引号/单引号 内的本地资源；跳过外链
  const out = orig.replace(/((?:src|href)\s*=\s*)(["'])([^"']+?)(\2)/g, (whole, attr, q, url) => {
    const withoutHash = url.split('#')[0];
    const pathPart = withoutHash.split('?')[0];
    if (/^(?:https?:|data:|blob:|\/\/)/i.test(pathPart)) return whole;      // 外部资源不动
    if (!LOCAL_EXT.test(pathPart)) return whole;                            // 非本地css/js不动
    const file = resolveRef(absHtml, url);
    if (!file) {
      report.unresolved.push(`${path.relative(ROOT, absHtml)} -> ${url}`);
      return whole;
    }
    const content = fs.readFileSync(file);
    const hash = crypto.createHash('sha1').update(content).digest('hex').slice(0, 10);
    const relUrl = url.split('?')[0];                                        // 丢弃旧版本号
    const newUrl = `${relUrl}?v=${hash}`;
    if (newUrl !== url) {
      report.changed.push({
        html: path.relative(ROOT, absHtml),
        file: path.relative(ROOT, file),
        old: url,
        new: newUrl,
      });
      return `${attr}${q}${newUrl}${q}`;
    }
    return whole;
  });
  if (out !== orig && !DRY) {
    fs.writeFileSync(absHtml, out, 'utf8');
    report.written++;
  } else if (out !== orig && DRY) {
    report.wouldWrite++;
  }
  report.total++;
}

/* ---------- 主流程 ---------- */
const report = { total: 0, written: 0, wouldWrite: 0, changed: [], unresolved: [] };
const htmls = collectHtml(ROOT);
if (!htmls.length) { console.error('未找到待处理 html'); process.exit(1); }

for (const h of htmls) processHtml(h, report);

/* ---------- 输出报告 ---------- */
const byHtml = {};
for (const c of report.changed) (byHtml[c.html] = byHtml[c.html] || []).push(c);
console.log(`\n已扫描 HTML 文件：${report.total}`);
console.log(DRY ? `(dry-run) 将改写 ${report.wouldWrite} 个文件的资源版本号：` : `改写 ${report.written} 个文件：`);
const list = report.changed;
for (const html of [...new Set(list.map(c => c.html))].sort()) {
  console.log(`\n  📄 ${html}`);
  for (const c of list.filter(x => x.html === html)) {
    console.log(`      ${c.old}  ➜  ${c.new}`);
  }
}
if (report.unresolved.length) {
  console.log(`\n⚠️  ${report.unresolved.length} 处引用未解析到本地文件（保持原样，请人工确认）：`);
  report.unresolved.forEach(u => console.log('  - ' + u));
}
if (!report.changed.length && !report.unresolved.length) console.log('\n✅ 所有本地资源已带内容指纹版本号，无需改动。');
console.log(DRY ? '\n（dry-run 结束，未写入任何文件）' : '\n✅ 完成。部署前请确保跑过本脚本。');

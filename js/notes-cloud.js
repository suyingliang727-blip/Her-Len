/* ============================================================
 * 感想记事本 · 云端同步层  (notes-cloud.js)
 * 对应建表脚本：supabase/notes_board.sql
 *
 * 职责：只做「store ↔ 数据库」的转换与读写，不含任何 UI 逻辑。
 * 未登录 / SDK 未加载 / 网络异常时一律静默降级，前端继续用本地缓存。
 *
 * 暴露 window.NBCloud
 * ============================================================ */
(function () {
  'use strict';

  var SUPABASE_URL = 'https://tydbvpmigvzsnlmsjuby.supabase.co';
  var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5ZGJ2cG1pZ3Z6c25sbXNqdWJ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE3MjkwMTIsImV4cCI6MjA5NzMwNTAxMn0.AyMX8M24S3biHmmE2DMEPk9Ti93w0VHooQl5ox5YL2g';
  var BUCKET = 'note-images';

  var sb = null, sessionUser = null, booted = false, sessionChecked = false;

  function boot() {
    if (booted) return sb;
    booted = true;
    if (typeof window.supabase === 'undefined' || !window.supabase.createClient) return null;
    try {
      sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
      });
    } catch (e) { sb = null; }
    return sb;
  }

  function on() { return !!sb && !!sessionUser; }
  function userId() { return sessionUser ? sessionUser.id : null; }
  function userEmail() { return sessionUser ? (sessionUser.email || '') : ''; }

  function refreshSession() {
    var c = boot();
    if (!c) { sessionChecked = true; return Promise.resolve(null); }
    return c.auth.getSession().then(function (r) {
      sessionUser = (r && r.data && r.data.session && r.data.session.user) || null;
      sessionChecked = true;
      return sessionUser;
    }, function () { sessionUser = null; sessionChecked = true; return null; });
  }

  function signOut() {
    var c = boot(); if (!c) return Promise.resolve();
    return c.auth.signOut().then(function () { sessionUser = null; }, function () { sessionUser = null; });
  }

  // ---------- 行 ↔ 前端对象 ----------
  // 写入兜底：老库可能没有后加的列（theme/material、variant/rot、hanger/annotation…），
  // 也可能列类型不符（如 int 列收到 13.5）。PostgREST 一次只报一个问题，
  // 所以不能"修一次就完事"，必须循环补修，否则先修好一个又会撞上下一个，整批同步被打挂。
  //   ① 缺列  → 报错点名了列名，剔掉该列重试
  //   ② 类型不符 → 报错体里【不含列名】（只有 invalid input syntax ... "13.5"），
  //                只能拿报错中的字面值反查行内数值列，四舍五入后重试
  function upsertSafe(c, table, rows, keys) {
    var drop = [], rounded = [], guard = 0;
    function payload() {
      if (!drop.length && !rounded.length) return rows;
      return rows.map(function (x) {
        var o = {};
        for (var k in x) {
          if (drop.indexOf(k) >= 0) continue;
          o[k] = (rounded.indexOf(k) >= 0 && typeof x[k] === 'number') ? Math.round(x[k]) : x[k];
        }
        return o;
      });
    }
    function attempt() {
      return c.from(table).upsert(payload(), { onConflict: 'id' }).then(function (r) {
        if (!r.error) return;
        if (++guard > 24) throw r.error;
        var msg = (r.error.message || '') + ' ' + (r.error.details || '') + ' ' + (r.error.hint || '');
        // ① 缺失的列：优先采纳 PostgREST 点名的列（未登记的列也能兜住）
        var miss = [];
        var m = msg.match(/Could not find the '([^']+)' column/i) ||
                msg.match(/column "?([A-Za-z0-9_]+)"? does not exist/i);
        if (m && m[1]) miss.push(m[1]);
        //   再兜一层：调用方登记的列名若出现在报错里，也一并剔除
        (keys || []).forEach(function (k) {
          if (miss.indexOf(k) < 0 && new RegExp('\\b' + k + '\\b').test(msg)) miss.push(k);
        });
        miss = miss.filter(function (k) { return drop.indexOf(k) < 0; });
        if (miss.length) {
          drop = drop.concat(miss);
          return attempt();
        }
        // ② 类型不符（22P02 / 22003）：消息里没有列名，用字面值反查
        if (/invalid input syntax|out of range/i.test(msg)) {
          var lit = (msg.match(/"([^"]+)"/) || [])[1];
          var hits = [];
          if (lit) {
            rows.forEach(function (x) {
              for (var k in x) {
                if (typeof x[k] === 'number' && String(x[k]) === lit && hits.indexOf(k) < 0) hits.push(k);
              }
            });
          }
          hits = hits.filter(function (k) { return rounded.indexOf(k) < 0; });
          if (hits.length) {
            rounded = rounded.concat(hits);
            return attempt();
          }
        }
        throw r.error;
      });
    }
    return attempt();
  }
  function boardToRow(b, i) {
    return {
      id: b.id, title: b.title || '未命名画板', game_title: b.gameTitle || '',
      game_id: (b.gameId == null || b.gameId === '') ? null : Number(b.gameId) || null,
      accent: b.accent || '#B86FD8', bg: b.bg || 'dots',
      theme: b.theme || null, material: b.material || b.bg || null, card_style: b.cardStyle || 'clean',
      cam_x: (b.cam && b.cam.x) || 0, cam_y: (b.cam && b.cam.y) || 0,
      cam_scale: (b.cam && b.cam.scale) || 1, sort_order: i || 0,
      created_at: ts2iso(b.createdAt)
    };
  }
  function rowToBoard(r) {
    return {
      id: r.id, title: r.title, gameTitle: r.game_title || '',
      gameId: r.game_id == null ? '' : String(r.game_id),
      accent: r.accent || '#B86FD8', bg: r.bg || 'dots',
      theme: r.theme || null, material: r.material || r.bg || null, cardStyle: r.card_style || 'clean',
      cam: { x: r.cam_x || 0, y: r.cam_y || 0, scale: r.cam_scale || 1 },
      createdAt: iso2ts(r.created_at), notes: [], clusters: [], diaries: [], stages: []
    };
  }
  function noteToRow(n, boardId, i) {
    return {
      id: n.id, board_id: boardId, type: n.type || 'sticky',
      pos_x: n.x || 0, pos_y: n.y || 0, width: n.w || 210, height: n.h || 140,
      title: n.title || '', body: n.body || '',
      img_url: isHttpUrl(n.img) ? n.img : '',          // 只上传 URL，绝不回传 base64
      // 字号是设计值，模板里刻意为小数（13.5 / 14.5）。库列已改 double precision，
      // 这里仍做一次数值化，防止字符串 / null 混进来污染写入。
      base_size: (n.baseSize == null || n.baseSize === '' || !isFinite(Number(n.baseSize))) ? null : Number(n.baseSize),
      color: n.color || null, pinned: !!n.pinned,
      mood: n.mood || null, kind: n.kind || null,
      stage_id: n.stageId || null,
      variant: n.variant || null, rot: (n.rot == null ? null : Number(n.rot)),
      game_card_data: n.gameCardData ? JSON.stringify(n.gameCardData) : null,
      frame: n.type === 'text' ? !!n.frame : null,    // 仅 text 便签的"有框/无框"标记
      hanger: n.hanger || null,                        // 实物挂件：tape|pin|clip|string
      annotation: n.annotation || null,                // 金句墙：翻面后的批注
      sort_order: i || 0,
      created_at: ts2iso(n.createdAt)
    };
  }
  function rowToNote(r) {
    return {
      id: r.id, type: r.type || 'sticky', x: r.pos_x || 0, y: r.pos_y || 0,
      w: r.width || 210, h: r.height || 140,
      title: r.title || '', body: r.body || '', img: r.img_url || '',
      baseSize: r.base_size || undefined, color: r.color || undefined,
      pinned: !!r.pinned, mood: r.mood || '', kind: r.kind || '',
      variant: r.variant || undefined, rot: (r.rot == null ? undefined : Number(r.rot)),
      gameCardData: r.game_card_data ? safeJSON(r.game_card_data) : undefined,
      frame: r.frame == null ? undefined : !!r.frame,
      hanger: r.hanger || undefined,
      annotation: r.annotation || undefined,
      stageId: r.stage_id || '', createdAt: iso2ts(r.created_at)
    };
  }
  function safeJSON(s) { try { return JSON.parse(s); } catch (e) { return undefined; } }
  function clusterToRow(c, boardId, i) {
    return {
      id: c.id, board_id: boardId, name: c.name || '主题簇',
      color: c.color || '#B86FD8', sort_order: i || 0, created_at: ts2iso(c.createdAt)
    };
  }
  function rowToCluster(r, members) {
    return { id: r.id, name: r.name, color: r.color, createdAt: iso2ts(r.created_at), members: members || [] };
  }
  function diaryToRow(d, boardId) {
    return {
      id: d.id, board_id: boardId, title: d.title || '', tpl: d.tpl || 'literary',
      template_name: d.templateName || '', content: d.html || '',
      note_count: d.noteCount || 0, created_at: ts2iso(d.createdAt)
    };
  }
  function rowToDiary(r) {
    return {
      id: r.id, title: r.title || '', tpl: r.tpl || 'literary',
      templateName: r.template_name || '', html: r.content || '',
      noteCount: r.note_count || 0, createdAt: iso2ts(r.created_at)
    };
  }

  function ts2iso(ts) { try { return new Date(ts || Date.now()).toISOString(); } catch (e) { return new Date().toISOString(); } }
  function iso2ts(v) { if (!v) return Date.now(); var t = new Date(v).getTime(); return isNaN(t) ? Date.now() : t; }
  function isHttpUrl(s) { return !!s && /^https?:\/\//i.test(s); }

  // ---------- 拉取：云端 → store ----------
  function pull() {
    var c = boot();
    if (!c || !sessionUser) return Promise.reject(new Error('未登录'));
    var uidStr = sessionUser.id;
    var out = { boards: [], activeId: null };

    return c.from('note_boards').select('*').eq('user_id', uidStr).order('sort_order', { ascending: true })
      .then(function (rb) {
        if (rb.error) throw rb.error;
        var boards = (rb.data || []).map(rowToBoard);
        var ids = boards.map(function (b) { return b.id; });
        out.boards = boards;
        if (!ids.length) return { items: [], clusters: [], clusterItems: [], diaries: [], stages: [] };

        return Promise.all([
          c.from('note_items').select('*').eq('user_id', uidStr).order('created_at', { ascending: true }),
          c.from('note_clusters').select('*').eq('user_id', uidStr).order('sort_order', { ascending: true }),
          c.from('note_diaries').select('*').eq('user_id', uidStr).order('created_at', { ascending: false }),
          c.from('note_stages').select('*').eq('user_id', uidStr).order('sort_order', { ascending: true })
        ]).then(function (rs) {
          if (rs[0].error) throw rs[0].error;
          if (rs[1].error) throw rs[1].error;
          if (rs[2].error) throw rs[2].error;
          if (rs[3].error) throw rs[3].error;
          var cids = (rs[1].data || []).map(function (x) { return x.id; });
          var q = cids.length
            ? c.from('note_cluster_items').select('*').in('cluster_id', cids)
            : Promise.resolve({ data: [], error: null });
          return q.then(function (rc) {
            if (rc.error) throw rc.error;
            return { items: rs[0].data || [], clusters: rs[1].data || [], clusterItems: rc.data || [], diaries: rs[2].data || [], stages: rs[3].data || [] };
          });
        });
      })
      .then(function (agg) {
        var byId = {};
        out.boards.forEach(function (b) { byId[b.id] = b; });
        (agg.items || []).forEach(function (r) { if (byId[r.board_id]) byId[r.board_id].notes.push(rowToNote(r)); });
        (agg.clusters || []).forEach(function (r) {
          if (!byId[r.board_id]) return;
          var mem = (agg.clusterItems || []).filter(function (x) { return x.cluster_id === r.id; })
            .map(function (x) { return x.note_id; });
          byId[r.board_id].clusters.push(rowToCluster(r, mem));
        });
        (agg.diaries || []).forEach(function (r) { if (byId[r.board_id]) byId[r.board_id].diaries.push(rowToDiary(r)); });
        (agg.stages || []).forEach(function (r) { if (byId[r.board_id]) byId[r.board_id].stages.push({ id: r.id, name: r.name, sort: r.sort_order }); });
        out.activeId = out.boards.length ? out.boards[0].id : null;
        return out;
      });
  }

  // ---------- 推送：store → 云端 ----------
  // 支持两种模式：
  //   ① push(store, deletes)                      全量推送（保留：一键上传 / 首次登录）
  //   ② push(store, deletes, dirty)               增量推送：只写 dirty 里点名的行
  // dirty 形状（由 notes-board.js 维护）：
  //   { boards:{id:1}, notes:{id:1}, clusters:{id:1}, diaries:{id:1}, stages:{id:1} }
  //   —— 值为 truthy 即"已改动"；同一批里同时出现 id 与删除 id 时，以删除为准。
  //   省略 dirty（undefined）→ 退回全量，保证任何调用方都不会漏数据。
  function push(store, deletes, dirty) {
    var c = boot();
    if (!c || !sessionUser) return Promise.reject(new Error('未登录'));
    var uidStr = sessionUser.id;
    deletes = deletes || {};
    var incremental = !!dirty;

    function del(table, ids, col) {
      if (!ids || !ids.length) return Promise.resolve();
      return c.from(table).delete().in(col || 'id', ids).then(function (r) {
        if (r.error) throw r.error;
      });
    }
    // 该 id 是否属于本次要写入的集合
    function hit(kind, id) {
      if (!incremental) return true;          // 全量模式：全都写
      return !!(dirty[kind] && dirty[kind][id]);
    }
    // 已删除的 id 不再 upsert，避免"刚删又写回"（upsert 会复活整行）
    function alive(kind, id) {
      return !(deletes[kind] && deletes[kind].indexOf(id) >= 0);
    }
    function changed(kind, id) { return hit(kind, id) && alive(kind, id); }

    return del('note_cluster_items', deletes.clusters, 'cluster_id')
      .then(function () { return del('note_items', deletes.notes); })
      .then(function () { return del('note_clusters', deletes.clusters); })
      .then(function () { return del('note_diaries', deletes.diaries); })
      .then(function () { return del('note_stages', deletes.stages); })
      .then(function () { return del('note_boards', deletes.boards); })
      .then(function () {
        var boards = (store.boards || []).filter(function (b) {
          return b && b.id && changed('boards', b.id);
        });
        if (!boards.length) return null;
        var rows = boards.map(function (b) {
          var i = (store.boards || []).indexOf(b);
          var r = boardToRow(b, i < 0 ? 0 : i); r.user_id = uidStr; return r;
        });
        return upsertSafe(c, 'note_boards', rows, ['theme','material','card_style','sort_order']);
      })
      .then(function () {
        var itemRows = [], clRows = [], diRows = [], memRows = [], stageRows = [];
        // 本次涉及成员关系重建的簇（含被删除的簇）
        var memCids = [];
        (deletes.clusters || []).forEach(function (id) { if (memCids.indexOf(id) < 0) memCids.push(id); });

        (store.boards || []).forEach(function (b) {
          (b.notes || []).forEach(function (n, i) {
            if (!n || !n.id || !changed('notes', n.id)) return;
            var r = noteToRow(n, b.id, i); r.user_id = uidStr; itemRows.push(r);
          });
          (b.stages || []).forEach(function (s, i) {
            if (!s || !s.id || !changed('stages', s.id)) return;
            var r = { id: s.id, board_id: b.id, name: s.name || ('节点 ' + (i + 1)), sort_order: i };
            r.user_id = uidStr; stageRows.push(r);
          });
          (b.clusters || []).forEach(function (cl, i) {
            var touch = changed('clusters', cl.id);
            if (!touch) return;
            var r = clusterToRow(cl, b.id, i); r.user_id = uidStr; clRows.push(r);
            if (memCids.indexOf(cl.id) < 0) memCids.push(cl.id);   // 簇有改动 → 成员关系重建
            // 前端主模型是 note.clusterId；cluster.members 仅作兼容
            var mem = (cl.members && cl.members.length)
              ? cl.members
              : (b.notes || []).filter(function (n) { return n.clusterId === cl.id; })
                  .map(function (n) { return n.id; });
            mem.forEach(function (mid) { memRows.push({ cluster_id: cl.id, note_id: mid }); });
          });
          (b.diaries || []).forEach(function (d) {
            if (!d || !d.id || !changed('diaries', d.id)) return;
            var r = diaryToRow(d, b.id); r.user_id = uidStr; diRows.push(r);
          });
        });

        return Promise.resolve()
          .then(function () {
            if (!itemRows.length) return null;
            return upsertSafe(c, 'note_items', itemRows, ['variant','rot','game_card_data','frame','hanger','annotation','sort_order']);
          })
          .then(function () {
            if (!clRows.length) return null;
            return c.from('note_clusters').upsert(clRows, { onConflict: 'id' }).then(function (r) { if (r.error) throw r.error; });
          })
          .then(function () {
            // 成员关系整体重建：先清掉本次涉及簇的旧关系（增量模式下只清"有改动"的簇）
            if (!memCids.length) return null;
            return c.from('note_cluster_items').delete().in('cluster_id', memCids).then(function (r) {
              if (r.error) throw r.error;
              if (!memRows.length) return null;
              return c.from('note_cluster_items').upsert(memRows, { onConflict: 'cluster_id,note_id' })
                .then(function (r2) { if (r2.error) throw r2.error; });
            });
          })
          .then(function () {
            if (!diRows.length) return null;
            return c.from('note_diaries').upsert(diRows, { onConflict: 'id' }).then(function (r) { if (r.error) throw r.error; });
          })
          .then(function () {
            if (!stageRows.length) return null;
            return c.from('note_stages').upsert(stageRows, { onConflict: 'id' }).then(function (r) { if (r.error) throw r.error; });
          });
      })
      .then(function () { return { ok: true }; });
  }

  // ---------- 图片：上传 Storage，返回公共 URL ----------
  function dataURLtoBlob(u) {
    var arr = String(u).split(',');
    var mime = (arr[0].match(/:(.*?);/) || [])[1] || 'image/jpeg';
    var bin = arr[1] || '';
    try {
      var raw = atob(bin), n = raw.length, u8 = new Uint8Array(n);
      for (var i = 0; i < n; i++) u8[i] = raw.charCodeAt(i);
      return new Blob([u8], { type: mime });
    } catch (e) { return null; }
  }
  function uploadImage(dataUrl, boardId, noteId) {
    var c = boot();
    if (!c || !sessionUser) return Promise.resolve(null);
    var blob = dataURLtoBlob(dataUrl);
    if (!blob) return Promise.resolve(null);
    var path = sessionUser.id + '/' + (boardId || 'board') + '_' + (noteId || Date.now().toString(36)) + '.jpg';
    return c.storage.from(BUCKET).upload(path, blob, { contentType: 'image/jpeg', upsert: true })
      .then(function (r) {
        if (r.error) throw r.error;
        var pub = c.storage.from(BUCKET).getPublicUrl(path);
        return (pub && pub.data && pub.data.publicUrl) || null;
      })
      .catch(function () { return null; });
  }

  window.NBCloud = {
    boot: boot,
    refreshSession: refreshSession,
    signOut: signOut,
    on: on,
    userId: userId,
    userEmail: userEmail,
    isChecked: function () { return sessionChecked; },
    pull: pull,
    push: push,
    uploadImage: uploadImage
  };
})();

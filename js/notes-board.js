/* ============================================================
 * 感想记事本 · 自由便签画板  (notes-board.js)
 * 纯原生 JS：无限画布 + 自由便签 + 多字体/配色 + 移动端手势
 * 多画板容器：每款游戏一个画板，可自由开多个；数据保存在 localStorage: herlens_boards_v1
 * 旧单画板 key (herlens_notes_board_v1) 启动时可一次性迁移；更早的 herlens_notes_v1 保留不动，可回滚。
 * ============================================================ */
(function () {
  'use strict';

  var STORE_KEY = 'herlens_boards_v1';
  var DIRTY_KEY = 'herlens_boards_dirty_v1';    // 未同步的增量记账：刷新页面后仍能续传
  var LEGACY_KEY = 'herlens_notes_board_v1';   // 旧单画板数据，启动时可一次迁移
  var ACCENTS = ['#B86FD8', '#7C6FE8', '#4FB3A8', '#E08BB5', '#F0A05A', '#6AA9E0'];

  var ZOOM_MIN = 0.3, ZOOM_MAX = 2.5;

  var FONTS = [
    { id: 'sans',   label: '默认',   sub: '无衬线 · 日常', sample: '游戏感想' },
    { id: 'serif',  label: '宋体',   sub: '衬线 · 雅致',   sample: '游戏感想' },
    { id: 'kai',    label: '楷体',   sub: '手写 · 温润',   sample: '游戏感想' },
    { id: 'round',  label: '圆体',   sub: '圆润 · 可爱',   sample: '游戏感想' },
    { id: 'mono',   label: '等宽',   sub: '代码 · 整齐',   sample: 'GAME LOG' },
    { id: 'script', label: '手写',   sub: '随性 · 灵动',   sample: '游戏感想' }
  ];
  var BG_THEMES = ['kraft', 'paper', 'water', 'grid', 'dots', 'linen', 'cork', 'soft', 'night'];   // 旧字段名 bg，语义=材质

  // ============================================================
  // 材质（背景）：只负责「画布表面的质感」——纸纤维、水波、网格、软木颗粒……
  // 颜色由「主题」决定，两者互不干扰，可自由组合。
  // 全部用 CSS 多层渐变 + SVG feTurbulence 噪点实现，不依赖任何图片资源。
  // ============================================================
  function svgNoise(freq, octaves, opacity, size) {
    var s = size || 140;
    var svg = "<svg xmlns='http://www.w3.org/2000/svg' width='" + s + "' height='" + s + "'>" +
      "<filter id='n'><feTurbulence type='fractalNoise' baseFrequency='" + freq + "' numOctaves='" + octaves + "' stitchTiles='stitch'/>" +
      "<feColorMatrix type='saturate' values='0'/></filter>" +
      "<rect width='" + s + "' height='" + s + "' filter='url(#n)' opacity='" + opacity + "'/></svg>";
    return 'url("data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg) + '")';
  }
  function svgFiber(gap, color, opacity) {     // 纸纤维：极淡的斜向细线
    return 'repeating-linear-gradient(58deg, ' + color + ' 0 1px, transparent 1px ' + gap + 'px)';
  }
  var MATERIALS = [
    {
      id: 'kraft', name: '牛皮纸', hint: '复古厚实',
      img: svgNoise('0.85', 4, '.30', 160) + ',' +
           svgNoise('0.06', 2, '.16', 300) + ',' +
           'linear-gradient(122deg, rgba(120,80,40,.13), transparent 42%, rgba(255,240,210,.16) 78%)',
      size: '160px 160px, 300px 300px, 100% 100%'
    },
    {
      id: 'paper', name: '纸质', hint: '细腻温润',
      img: svgNoise('1.1', 3, '.15', 140) + ',' + svgFiber(7, 'rgba(120,105,80,.05)', 1) + ',' +
           'radial-gradient(120% 90% at 50% 0%, rgba(255,255,255,.7), transparent 70%)',
      size: '140px 140px, auto, 100% 100%'
    },
    {
      id: 'water', name: '水波', hint: '清透流动',
      img: 'repeating-radial-gradient(circle at 22% 18%, rgba(255,255,255,.18) 0 2px, transparent 2px 16px),' +
           'repeating-radial-gradient(circle at 78% 82%, rgba(255,255,255,.14) 0 2px, transparent 2px 22px),' +
           'repeating-radial-gradient(circle at 60% 30%, rgba(120,170,200,.10) 0 1px, transparent 1px 30px),' +
           'linear-gradient(160deg, rgba(255,255,255,.30), transparent 55%)',
      size: '100% 100%, 100% 100%, 100% 100%, 100% 100%'
    },
    {
      id: 'grid', name: '网格', hint: '工整清晰',
      img: 'linear-gradient(var(--nb-line) 1px, transparent 1px),' +
           'linear-gradient(90deg, var(--nb-line) 1px, transparent 1px),' +
           'linear-gradient(rgba(0,0,0,.035) 1px, transparent 1px),' +
           'linear-gradient(90deg, rgba(0,0,0,.035) 1px, transparent 1px)',
      size: '104px 104px, 104px 104px, 26px 26px, 26px 26px'
    },
    {
      id: 'dots', name: '点阵', hint: '轻快干净',
      img: 'radial-gradient(var(--nb-line) 1.4px, transparent 1.7px)',
      size: '26px 26px'
    },
    {
      id: 'linen', name: '布纹', hint: '织物肌理',
      img: 'repeating-linear-gradient(0deg, rgba(0,0,0,.045) 0 1px, transparent 1px 3px),' +
           'repeating-linear-gradient(90deg, rgba(0,0,0,.045) 0 1px, transparent 1px 3px),' +
           svgNoise('1.4', 2, '.10', 120),
      size: 'auto, auto, 120px 120px'
    },
    {
      id: 'cork', name: '软木', hint: '颗粒粗粝',
      img: svgNoise('0.55', 5, '.42', 180) + ',' + svgNoise('2.2', 2, '.16', 90) + ',' +
           'radial-gradient(90% 70% at 40% 20%, rgba(255,225,190,.14), transparent 70%)',
      size: '180px 180px, 90px 90px, 100% 100%'
    },
    {
      id: 'soft', name: '柔光', hint: '朦胧光晕',
      img: 'radial-gradient(1100px 560px at 18% 10%, var(--nb-glow-a), transparent 62%),' +
           'radial-gradient(900px 640px at 86% 88%, var(--nb-glow-b), transparent 62%)',
      size: '100% 100%, 100% 100%'
    },
    {
      id: 'night', name: '夜色', hint: '沉静深色',
      img: 'radial-gradient(rgba(255,255,255,.07) 1.3px, transparent 1.7px),' +
           svgNoise('1.6', 2, '.07', 130) + ',' +
           'radial-gradient(100% 80% at 50% 0%, rgba(255,255,255,.05), transparent 60%)',
      size: '26px 26px, 130px 130px, 100% 100%'
    }
  ];
  function materialOf(id) {
    return MATERIALS.filter(function (m) { return m.id === id; })[0] || MATERIALS[3];
  }

  // ============================================================
  // 主题（外观）：只负责「颜色」——主色、画布底色、便签底色、文字色、便签配色板。
  // 与材质自由组合：换主题不动质感，换材质不动配色。
  // ============================================================
  var THEMES = [
    {
      id: 'cream', name: '奶油紫', accent: '#9B7FD4', accent2: '#C9A7F0',
      canvas: '#FBF8F4', card: '#FFFDF8', card2: '#F6F0FB', ink: '#3A3346', ink2: '#7A7189',
      line: 'rgba(155,127,212,.30)', glowA: 'rgba(155,127,212,.20)', glowB: 'rgba(201,167,240,.18)',
      shadow: '0 6px 18px rgba(58,40,80,.13), 0 1px 3px rgba(58,40,80,.07)',
      palette: ['#FFFDF8', '#F3EBFF', '#FFEFF6', '#EEF6FF', '#FFF6E5', '#EEFBF4']
    },
    {
      id: 'morandi', name: '莫兰迪', accent: '#8C9A9E', accent2: '#B4A79C',
      canvas: '#F2F0EC', card: '#FAF8F5', card2: '#EDEAE4', ink: '#46423D', ink2: '#86807A',
      line: 'rgba(140,154,158,.30)', glowA: 'rgba(140,154,158,.20)', glowB: 'rgba(180,167,156,.18)',
      shadow: '0 6px 18px rgba(60,55,50,.13), 0 1px 3px rgba(60,55,50,.07)',
      palette: ['#FAF8F5', '#E8E4DE', '#E4E9E7', '#EFE7E2', '#DFE3E6', '#EAE6DF']
    },
    {
      id: 'sunset', name: '落日', accent: '#F0803C', accent2: '#FF9E6B',
      canvas: '#FDF5EF', card: '#FFFBF6', card2: '#FBE9DA', ink: '#4A3225', ink2: '#96705A',
      line: 'rgba(240,128,60,.28)', glowA: 'rgba(255,158,107,.22)', glowB: 'rgba(240,128,60,.16)',
      shadow: '0 6px 18px rgba(90,50,30,.14), 0 1px 3px rgba(90,50,30,.07)',
      palette: ['#FFFBF6', '#FDE9D7', '#FFE3D3', '#FFF0DC', '#F8E3E0', '#FBEEDC']
    },
    {
      id: 'mint', name: '薄荷', accent: '#3FA894', accent2: '#79D3C0',
      canvas: '#EFF8F6', card: '#FBFFFE', card2: '#E2F2EE', ink: '#26423D', ink2: '#5F8A82',
      line: 'rgba(63,168,148,.30)', glowA: 'rgba(121,211,192,.24)', glowB: 'rgba(63,168,148,.16)',
      shadow: '0 6px 18px rgba(20,70,62,.13), 0 1px 3px rgba(20,70,62,.07)',
      palette: ['#FBFFFE', '#E2F2EE', '#DFF0E8', '#E9F6FB', '#FDF7E7', '#F0EAF8']
    },
    {
      id: 'ocean', name: '深海', accent: '#4377AE', accent2: '#7BA6D6',
      canvas: '#EFF4FA', card: '#FCFDFF', card2: '#E4EDF8', ink: '#27384C', ink2: '#5F7690',
      line: 'rgba(67,119,174,.28)', glowA: 'rgba(123,166,214,.24)', glowB: 'rgba(67,119,174,.16)',
      shadow: '0 6px 18px rgba(24,48,76,.13), 0 1px 3px rgba(24,48,76,.07)',
      palette: ['#FCFDFF', '#E4EDF8', '#E9F1FA', '#E6F4F6', '#FFF6E6', '#EFEAF7']
    },
    {
      id: 'retro', name: '复古', accent: '#B3673A', accent2: '#D69A62',
      canvas: '#F5EADC', card: '#FDF6E9', card2: '#EDDFC9', ink: '#453122', ink2: '#8A6A51',
      line: 'rgba(179,103,58,.28)', glowA: 'rgba(214,154,98,.24)', glowB: 'rgba(179,103,58,.16)',
      shadow: '0 6px 18px rgba(80,50,26,.15), 0 1px 3px rgba(80,50,26,.08)',
      palette: ['#FDF6E9', '#F0E0C6', '#E9DCC4', '#F3E7D2', '#E4DCC8', '#F6EAD8']
    },
    {
      id: 'noir', name: '夜行', accent: '#B98CF0', accent2: '#7C7BE8',
      canvas: '#1D1A26', card: '#2B2738', card2: '#353044', ink: '#EDE8F5', ink2: '#A79FC0',
      line: 'rgba(185,140,240,.34)', glowA: 'rgba(185,140,240,.18)', glowB: 'rgba(124,123,232,.16)',
      shadow: '0 8px 24px rgba(0,0,0,.42), 0 1px 3px rgba(0,0,0,.3)',
      palette: ['#2B2738', '#33293F', '#2A2D42', '#3A2C34', '#26353A', '#2F2A3C']
    },
    {
      id: 'sakura', name: '樱花', accent: '#DE7FA8', accent2: '#F5A9C8',
      canvas: '#FDF3F6', card: '#FFFBFC', card2: '#FBE8EF', ink: '#472F3A', ink2: '#9A7385',
      line: 'rgba(222,127,168,.30)', glowA: 'rgba(245,169,200,.24)', glowB: 'rgba(222,127,168,.16)',
      shadow: '0 6px 18px rgba(88,48,66,.13), 0 1px 3px rgba(88,48,66,.07)',
      palette: ['#FFFBFC', '#FBE8EF', '#FDEEF3', '#F6ECFA', '#FFF4E9', '#F0F0FB']
    }
  ];
  function themeOf(id) {
    return THEMES.filter(function (t) { return t.id === id; })[0] || THEMES[0];
  }

  // 便签卡片风格：与主题/材质并列的一种「外观」。切换会往 <body> 挂 nb-cs-<id>，
  // 由 CSS 用一套变量把 .nb-note 及各个变体 remap 成对应观感。默认 clean = 现代笔记。
  var CARDSTYLES = [
    { id: 'clean',  name: '现代笔记',  hint: '清爽纸感 · 克制圆角',   sw: 'linear-gradient(135deg,#ffffff,#eef1ff)' },
    { id: 'hilight',name: '荧光手写',  hint: '便利贴 · 饱和高亮',     sw: 'linear-gradient(135deg,#fff6a8,#ffd6ec)' },
    { id: 'glass',  name: '玻璃拟态',  hint: '半透明 · 渐变点缀',     sw: 'linear-gradient(135deg,rgba(255,255,255,.75),rgba(180,150,255,.35))' },
    { id: 'retro',  name: '复古打字',  hint: '暖纸 · 等宽文艺',       sw: 'linear-gradient(135deg,#f4e6c8,#e8d5a8)' }
  ];
  function cardStyleOf(id) {
    return CARDSTYLES.filter(function (c) { return c.id === id; })[0] || CARDSTYLES[0];
  }

  // 字号档位（正文 px；标题按比例放大）。A⁻ / A⁺ 在这些档位间跳动
  var SIZE_STEPS = [11, 12, 14, 16, 18, 21, 24, 28, 34, 42, 52];
  var SIZE_MIN = SIZE_STEPS[0], SIZE_MAX = SIZE_STEPS[SIZE_STEPS.length - 1];
  var SIZE_DEFAULT = 14;

  // 新建画板模板：给用户起手参考，同时保留「完全白板」自定义式。
  // 坐标以 (0,0) 为画布中心（新建画板时相机置于视口中心）。text 型便签只显示 body，标题类请放 body。
  // 便签可选「外观变体」：title 主标题卡 / heading 标题条 / sub 小标题 / card 卡片 /
  // quote 引用 / photo 拍立得 / tag 胶囊 / divider 分隔线 / taped 胶带装饰
  // 用法：text 类型 + 变体 = 装饰性文字件；sticky 类型 + 变体 = 带标题的卡片。
  var TEMPLATES = {
    blank: {
      name: '完全白板', icon: '🗒️', desc: '空画布，自由发挥', theme: 'cream', material: 'dots', cardStyle: 'clean', notes: []
    },
    journal: {
      name: '手账式', icon: '📔', desc: '一天一页的心情手记', cardStyle: 'hilight',
      theme: 'sakura', material: 'paper',
      notes: [
        { type: 'text', variant: 'title', x: -250, y: -344, w: 500, h: 86, baseSize: 27, body: '📔 我的游戏手账' },
        { type: 'text', x: -250, y: -246, w: 500, h: 24, baseSize: 13, body: '记录那些值得停下来写一句的瞬间' },
        { type: 'text', variant: 'tag', x: -250, y: -206, w: 118, h: 32, baseSize: 13, body: '☀️ 今天' },
        { type: 'sticky', variant: 'taped', x: -250, y: -156, w: 242, h: 128, color: '#FBE8EF', kind: 'idea', title: '今日心情', body: '开场就被配色治愈了，玩到不想睡。' },
        { type: 'sticky', variant: 'taped', rot: 1, x: 8, y: -156, w: 242, h: 128, color: '#FDEEF3', kind: 'scene', title: '今日高光', body: '雨里那场对话，我截图存了三张。' },
        { type: 'text', variant: 'sub', x: -250, y: -12, w: 500, h: 32, baseSize: 14, body: '💭 碎碎念' },
        { type: 'text', variant: 'card', x: -250, y: 32, w: 500, h: 96, body: '支线比主线还上头；NPC 的吐槽精准到让我怀疑它在监视我。' },
        { type: 'text', variant: 'quote', rot: 1, x: 8, y: 32, w: 242, h: 96, body: '“有些游戏是用来通关的，\n这一款是用来住进去的。”' },
        { type: 'sticky', variant: 'photo', rot: -2, x: -250, y: 150, w: 242, h: 196, body: '📷 贴一张今天的名场面' },
        { type: 'text', x: 8, y: 150, w: 242, h: 196, baseSize: 14, frame: false, color: '#C26A8E', body: '想用纯文本随手写点什么？\n点它就能改，落笔即所见。' }
      ]
    },
    mindmap: {
      name: '思维导图式', icon: '🧠', desc: '从一个点发散到全部', cardStyle: 'clean',
      theme: 'cream', material: 'dots',
      notes: [
        { type: 'sticky', variant: 'title', x: -120, y: -70, w: 240, h: 140, baseSize: 19, title: '🎮 游戏名', body: '把名字写这里，再往四周发散' },
        { type: 'sticky', x: -470, y: -252, w: 200, h: 124, color: '#F3EBFF', kind: 'idea', title: '🕹 玩法机制', body: '核心循环是什么？哪里上瘾？' },
        { type: 'sticky', x: -500, y: -62, w: 200, h: 124, color: '#EEF6FF', kind: 'scene', title: '📖 剧情世界', body: '世界观、伏笔、结局' },
        { type: 'sticky', x: -340, y: 128, w: 200, h: 124, color: '#FFEFF6', kind: 'char', title: '👤 角色设定', body: '最喜欢谁？为什么？' },
        { type: 'sticky', x: 140, y: 128, w: 200, h: 124, color: '#FFF6E5', title: '🎨 美术与音乐', body: '哪一段 BGM 循环了一整天？' },
        { type: 'sticky', x: 300, y: -62, w: 200, h: 124, color: '#EEFBF4', kind: 'roast', title: '⚡ 槽点与亮点', body: '最想改进的地方' },
        { type: 'sticky', x: 270, y: -252, w: 200, h: 124, color: '#F3EBFF', kind: 'decide', title: '✅ 是否推荐', body: '会推荐给谁？' }
      ]
    },
    document: {
      name: '文档式', icon: '📄', desc: '结构化的完整长评', cardStyle: 'retro',
      theme: 'morandi', material: 'paper',
      notes: [
        { type: 'text', variant: 'heading', x: -280, y: -364, w: 560, h: 52, baseSize: 25, body: '游戏体验记录' },
        { type: 'text', variant: 'divider', x: -280, y: -300, w: 560, h: 22, body: '· · ·' },
        { type: 'text', variant: 'sub', x: -280, y: -256, w: 560, h: 32, baseSize: 14, body: '一、基本信息' },
        { type: 'text', variant: 'card', x: -280, y: -214, w: 560, h: 62, body: '《游戏名》 · Switch · 通关 42 小时 · 角色扮演' },
        { type: 'text', variant: 'sub', x: -280, y: -132, w: 560, h: 32, baseSize: 14, body: '二、核心体验' },
        { type: 'text', variant: 'card', x: -280, y: -90, w: 560, h: 92, body: '写一段真正让你停下来的地方——某个场景、某句台词、某个决定。' },
        { type: 'text', variant: 'sub', x: -280, y: 22, w: 560, h: 32, baseSize: 14, body: '三、优点与缺点' },
        { type: 'text', variant: 'card', x: -280, y: 64, w: 560, h: 92, body: '优点：美术统一、音乐抓耳、支线有诚意。\n缺点：前期节奏慢，教程略冗长。' },
        { type: 'text', variant: 'sub', x: -280, y: 176, w: 560, h: 32, baseSize: 14, body: '四、总结与推荐' },
        { type: 'text', variant: 'card', x: -280, y: 218, w: 560, h: 92, body: '一句话结论 + 你会把它推荐给谁。' }
      ]
    },
    character: {
      name: '角色卡', icon: '🎭', desc: '给喜欢的人建档案', cardStyle: 'glass',
      theme: 'mint', material: 'grid',
      notes: [
        { type: 'text', variant: 'heading', x: -230, y: -336, w: 460, h: 52, baseSize: 25, body: '🎭 角色档案' },
        { type: 'text', variant: 'sub', x: -230, y: -270, w: 460, h: 32, baseSize: 14, body: '🪪 基本资料' },
        { type: 'sticky', x: -230, y: -226, w: 225, h: 108, color: '#E2F2EE', kind: 'char', title: '姓名 / 身份', body: '？？？ · 四处旅行的商人' },
        { type: 'sticky', x: 5, y: -226, w: 225, h: 108, color: '#E9F6FB', kind: 'char', title: '外貌', body: '灰白长发，永远笑着，斗篷上有补丁。' },
        { type: 'text', variant: 'sub', x: -230, y: -100, w: 460, h: 32, baseSize: 14, body: '💗 内在' },
        { type: 'sticky', x: -230, y: -56, w: 225, h: 128, color: '#FDF7E7', title: '性格与动机', body: '嘴上全是生意，其实一直在还一笔旧债。' },
        { type: 'sticky', x: 5, y: -56, w: 225, h: 128, color: '#F0EAF8', title: '成长与转变', body: '从旁观者，慢慢变成了参与者。' },
        { type: 'text', variant: 'sub', x: -230, y: 90, w: 460, h: 32, baseSize: 14, body: '💬 经典台词' },
        { type: 'text', x: -230, y: 134, w: 460, h: 62, baseSize: 15, frame: true, color: '#F0EAF8', body: '“有些路，只能一个人走完。”' },
        { type: 'text', variant: 'sub', x: -230, y: 214, w: 460, h: 32, baseSize: 14, body: '🔗 人物关系' },
        { type: 'fields', x: -230, y: 258, w: 460, h: 150, fields: [{ label: '与主角', value: '亦师亦友，最后替他挡了一刀' }, { label: '所属', value: '四处流浪的行商会' }, { label: '执念', value: '找到十年前那封信的主人' }] }
      ]
    },
    review: {
      name: '测评式', icon: '📊', desc: '打分 + 优缺点复盘', cardStyle: 'clean',
      theme: 'sunset', material: 'dots',
      notes: [
        { type: 'text', variant: 'title', x: -240, y: -336, w: 480, h: 84, baseSize: 26, body: '📊 游戏测评' },
        { type: 'text', variant: 'sub', x: -240, y: -238, w: 480, h: 32, baseSize: 14, body: '⭐ 综合评分 —— 用模式条「⭐评分」打分' },
        { type: 'sticky', x: -300, y: -186, w: 290, h: 138, color: '#FDE9D7', kind: 'idea', cluster: 'c1', title: '👍 优点', body: '美术风格统一，音乐抓耳，支线有诚意。' },
        { type: 'sticky', x: 10, y: -186, w: 290, h: 138, color: '#F8E3E0', kind: 'roast', cluster: 'c1', title: '👎 缺点', body: '前期节奏偏慢，教程略显冗长。' },
        { type: 'sticky', x: -300, y: -28, w: 290, h: 126, color: '#FFF0DC', cluster: 'c1', title: '🎯 适合人群', body: '喜欢慢节奏叙事、能接受刷素材的人。' },
        { type: 'sticky', x: 10, y: -28, w: 290, h: 126, color: '#FBEEDC', kind: 'decide', cluster: 'c1', title: '🏁 一句话结论', body: '值得一玩，但别指望它节奏快。' },
        { type: 'text', variant: 'divider', x: -240, y: 118, w: 480, h: 22, body: '· · ·' },
        { type: 'text', x: -240, y: 156, w: 480, h: 64, baseSize: 14, frame: true, color: '#FDE9D7', body: '“它不完美，但我记住了它。”' }
      ],
      clusters: [{ id: 'c1', name: '测评四宫格', color: '#F0803C' }]
    },
    gallery: {
      name: '名场面相册', icon: '📷', desc: '舍不得删的几张截图', cardStyle: 'glass',
      theme: 'ocean', material: 'linen',
      notes: [
        { type: 'text', variant: 'heading', x: -300, y: -306, w: 600, h: 52, baseSize: 25, body: '📷 名场面相册' },
        { type: 'text', variant: 'sub', x: -300, y: -240, w: 600, h: 32, baseSize: 14, body: '把舍不得删的瞬间，一张张贴在这里' },
        { type: 'sticky', variant: 'photo', rot: -3, x: -300, y: -192, w: 190, h: 186, body: '📷 开场\n第一眼看到的世界' },
        { type: 'sticky', variant: 'photo', rot: 1, x: -95, y: -192, w: 190, h: 186, body: '📷 转折\n一切都变了的那幕' },
        { type: 'sticky', variant: 'photo', rot: -1, x: 110, y: -192, w: 190, h: 186, body: '📷 结局\n通关后久久没退出' },
        { type: 'text', variant: 'quote', x: -300, y: 16, w: 600, h: 84, body: '“后来的每一次重新开始，都会想起这一幕。”' }
      ]
    },
    checklist: {
      name: '通关清单', icon: '🎯', desc: '想做的事一件件划掉', cardStyle: 'retro',
      theme: 'retro', material: 'kraft',
      notes: [
        { type: 'text', variant: 'heading', x: -250, y: -306, w: 500, h: 52, baseSize: 25, body: '🎯 通关清单' },
        { type: 'text', variant: 'sub', x: -250, y: -240, w: 500, h: 32, baseSize: 14, body: '想做的事，一件件划掉它' },
        { type: 'text', variant: 'card', x: -250, y: -192, w: 500, h: 46, body: '☐ 主线通关' },
        { type: 'text', variant: 'card', x: -250, y: -136, w: 500, h: 46, body: '☐ 全支线完成' },
        { type: 'text', variant: 'card', x: -250, y: -80, w: 500, h: 46, body: '☐ 收集全图鉴' },
        { type: 'text', variant: 'card', x: -250, y: -24, w: 500, h: 46, body: '☐ 困难难度二周目' },
        { type: 'text', variant: 'card', x: -250, y: 32, w: 500, h: 46, body: '☑ 第一次被感动到按下暂停' },
        { type: 'sticky', variant: 'taped', x: -250, y: 96, w: 500, h: 104, color: '#F3E7D2', body: '通关那天，记得回来写一句总结。' }
      ]
    },
    quote: {
      name: '金句墙', icon: '💬', desc: '攒住一句句难忘的话', cardStyle: 'retro',
      theme: 'morandi', material: 'paper',
      notes: [
        { type: 'text', variant: 'heading', x: -300, y: -306, w: 600, h: 52, baseSize: 25, body: '💬 金句墙' },
        { type: 'text', variant: 'sub', x: -300, y: -240, w: 600, h: 32, baseSize: 14, body: '把它们贴起来，慢慢回味' },
        { type: 'text', frame: true, color: '#EEF4FA', rot: -2, x: -300, y: -190, w: 280, h: 120, baseSize: 14, body: '“有些游戏是用来通关的,\n这一款是用来住进去的。”' },
        { type: 'text', frame: true, color: '#F3EEFB', rot: 1, x: 20, y: -190, w: 280, h: 120, baseSize: 14, body: '“它不完美，但我记住了它。”' },
        { type: 'text', frame: true, color: '#EAF4EF', x: -300, y: -48, w: 600, h: 88, baseSize: 14, body: '“后来的每一次重新开始，都会想起这一幕。”' },
        { type: 'text', variant: 'divider', x: -300, y: 52, w: 600, h: 22, body: '· · ·' },
        { type: 'text', x: -300, y: 92, w: 600, h: 80, baseSize: 14, frame: false, color: '#7A7189', body: '把最戳中你的那一句台词/旁白，用「文字气泡」贴上；\n想随手记点想法，就拖一个「纯文本」出来写。' }
      ]
    },
    dialogue: {
      name: '对白剧场', icon: '🎬', desc: '甲 / 乙的某段名场面对白', cardStyle: 'glass',
      theme: 'cream', material: 'grid',
      notes: [
        { type: 'text', variant: 'heading', x: -300, y: -368, w: 600, h: 52, baseSize: 25, body: '🎬 对白剧场' },
        { type: 'text', x: -300, y: -304, w: 600, h: 26, baseSize: 13.5, frame: false, color: '#6E9BCB', body: '把两个人（或两个「我」）之间最戳的一段话，一左一右排开。' },
        { type: 'text', x: -300, y: -258, w: 150, h: 24, baseSize: 13, frame: false, color: '#4377AE', body: '—— 甲' },
        { type: 'text', x: 60, y: -258, w: 150, h: 24, baseSize: 13, frame: false, color: '#C26A8E', body: '—— 乙' },
        { type: 'text', frame: true, color: '#E6F0FF', x: -300, y: -222, w: 250, h: 92, baseSize: 14.5, body: '“有些话，隔着屏幕\n说不出口。”' },
        { type: 'text', frame: true, color: '#FBE8EF', x: 60, y: -222, w: 250, h: 92, baseSize: 14.5, body: '“那现在说，\n我好好听着。”' },
        { type: 'text', frame: true, color: '#E6F0FF', x: -300, y: -108, w: 250, h: 92, baseSize: 14.5, body: '“如果当时没有转身，\n一切会不会不一样？”' },
        { type: 'text', frame: true, color: '#FBE8EF', x: 60, y: -108, w: 250, h: 92, baseSize: 14.5, body: '“会，\n但我还是会转身。”' },
        { type: 'text', variant: 'divider', x: -300, y: 6, w: 610, h: 22, body: '· · ·' },
        { type: 'text', variant: 'card', x: -300, y: 40, w: 610, h: 120, body: '🎙 旁白 / 舞台提示：\n一句可以写的视角。谁先开口、谁先沉默，都记在这里。\n\n点任何一句「气泡」都能改字；想换色，选中后用下面的色板即可。' },
        { type: 'text', x: -300, y: 178, w: 610, h: 40, baseSize: 13, frame: false, color: '#7A7189', body: '空白的一侧是「纯文本」，可以拖来随手批注，永远没有底。' }
      ]
    },
    trip: {
      name: '旅程散记', icon: '🧭', desc: '沿着一条路的里程碑', cardStyle: 'clean',
      theme: 'mint', material: 'dots',
      notes: [
        { type: 'text', variant: 'heading', x: -300, y: -396, w: 600, h: 52, baseSize: 25, body: '🧭 旅程散记' },
        { type: 'text', x: -300, y: -332, w: 600, h: 26, baseSize: 13.5, frame: false, color: '#3FA894', body: '从一个起点走到结局，把每一站都留一个脚印。' },
        { type: 'text', x: -300, y: -292, w: 130, h: 26, baseSize: 13, frame: false, color: '#3FA894', body: 'Day 1 · 出发' },
        { type: 'text', frame: true, color: '#E7F5F0', x: -160, y: -300, w: 460, h: 66, baseSize: 14, body: '拿到手的第一天，光是建好角色就花了一个晚上。' },
        { type: 'text', x: -300, y: -210, w: 130, h: 26, baseSize: 13, frame: false, color: '#3FA894', body: 'Day 7 · 转折' },
        { type: 'text', frame: true, color: '#E7F5F0', x: -160, y: -218, w: 460, h: 66, baseSize: 14, body: '那句台词的瞬间，我突然明白他为什么一直站在窗边。' },
        { type: 'text', x: -300, y: -128, w: 130, h: 26, baseSize: 13, frame: false, color: '#3FA894', body: 'Day 21 · 结局' },
        { type: 'text', frame: true, color: '#E7F5F0', x: -160, y: -136, w: 460, h: 66, baseSize: 14, body: '结尾出字幕时我没按跳过，把它看完了。' },
        { type: 'text', x: -300, y: -46, w: 600, h: 60, baseSize: 14, frame: false, color: '#5F8A82', body: '右侧这些淡绿的「文字气泡」专门记某一天的此刻感受；\n左侧的日期是「纯文本」，可以随手删掉或改写成别的节点。' }
      ]
    },
    timelineH: {
      name: '时间线 · 横向', icon: '🕐', desc: '沿一条横轴按顺序记心路', cardStyle: 'clean',
      theme: 'sunset', material: 'dots',
      // 预置 5 段心路进度分章
      stages: [
        { id: 's1', name: '序章 · 初见' },
        { id: 's2', name: '深入 · 沉迷' },
        { id: 's3', name: '转折 · 高光' },
        { id: 's4', name: '结局 · 通关' },
        { id: 's5', name: '余韵 · 回望' }
      ],
      notes: [
        // 顶部标题（纯文字居中，无填充卡）
        { type: 'text', x: -560, y: -500, w: 1120, h: 56, baseSize: 28, frame: false, color: '#4a3a55', body: '我的游戏心路' },
        { type: 'text', x: -560, y: -442, w: 1120, h: 26, baseSize: 13.5, frame: false, color: '#9080a0', body: '上上下下，从「初见」记到「通关之后」 —— 每一站，写下那一刻你会记住多久的感受。' },

        // 主轴：一条平缓优雅的二行交错波浪线（横向贯穿整个画布）
        { type: 'text', variant: 'axis-h', x: -780, y: -50, w: 1560, h: 110, baseSize: 12, body: '' },

        // 5 站交错排布 —— 奇数站(1/3/5)在波浪下方、偶数站(2/4)在波浪上方，每站都是「阶段小标题 + 纯文字正文」两行
        // 站1 序章 · 初见（在轴下方）
        { type: 'text', variant: 'tl-phase', x: -780 + 78, y: 70, w: 240, h: 30, baseSize: 14, frame: false, color: '#d6896a', body: '序章 · 初见', stage: 's1' },
        { type: 'text', variant: 'tl-text', x: -780 + 78, y: 100, w: 240, h: 88, baseSize: 14, frame: false, color: '#5f4a6e', body: '第一眼的心动：\n美术、音乐、氛围——\n是什么让你决定留下来？', stage: 's1' },

        // 站2 深入 · 沉迷（在轴上方）
        { type: 'text', variant: 'tl-phase', x: -390 + 78, y: -260, w: 240, h: 30, baseSize: 14, frame: false, color: '#d6896a', body: '深入 · 沉迷', stage: 's2' },
        { type: 'text', variant: 'tl-text', x: -390 + 78, y: -228, w: 240, h: 88, baseSize: 14, frame: false, color: '#5f4a6e', body: '哪个系统最上瘾？\n那几天玩到几点？\n记一个具体的瞬间。', stage: 's2' },

        // 站3 转折 · 高光（轴下方）
        { type: 'text', variant: 'tl-phase', x: 0 + 78, y: 70, w: 240, h: 30, baseSize: 14, frame: false, color: '#d6896a', body: '转折 · 高光', stage: 's3' },
        { type: 'text', variant: 'tl-text', x: 0 + 78, y: 100, w: 240, h: 88, baseSize: 14, frame: false, color: '#5f4a6e', body: '某个场景 / 一句台词 /\n一个决定 / 一次战斗——\n写下来，之后还会回看。', stage: 's3' },

        // 站4 结局 · 通关（轴上方）
        { type: 'text', variant: 'tl-phase', x: 390 + 78, y: -260, w: 240, h: 30, baseSize: 14, frame: false, color: '#d6896a', body: '结局 · 通关', stage: 's4' },
        { type: 'text', variant: 'tl-text', x: 390 + 78, y: -228, w: 240, h: 88, baseSize: 14, frame: false, color: '#5f4a6e', body: '是哭、是鼓掌、\n还是沉默着看完字幕？\n对结局满意吗？', stage: 's4' },

        // 站5 余韵 · 回望（轴下方）
        { type: 'text', variant: 'tl-phase', x: 780 - 78 - 240, y: 70, w: 240, h: 30, baseSize: 14, frame: false, color: '#d6896a', body: '余韵 · 回望', stage: 's5' },
        { type: 'text', variant: 'tl-text', x: 780 - 78 - 240, y: 100, w: 240, h: 88, baseSize: 14, frame: false, color: '#5f4a6e', body: '还会想起哪一幕？\n想二周目吗？\n会把它推荐给谁？', stage: 's5' },

        // 底部小提示（可删）
        { type: 'text', x: -560, y: 240, w: 1120, h: 40, baseSize: 12.5, frame: false, color: '#8a7a98', body: '提示：波浪线 = 时间主轴；上下的两行文字交错是 5 个阶段；选中文字后可拖到任意位置，或双击直接改写。' }
      ]
    },
    timelineV: {
      name: '时间线 · 纵向', icon: '🕐', desc: '沿一条纵轴从上往下记心路', cardStyle: 'clean',
      theme: 'mint', material: 'linen',
      stages: [
        { id: 's1', name: '序章 · 初见' },
        { id: 's2', name: '深入 · 沉迷' },
        { id: 's3', name: '转折 · 高光' },
        { id: 's4', name: '结局 · 通关' },
        { id: 's5', name: '余韵 · 回望' }
      ],
      notes: [
        // 顶部居中标题（纯文字）
        { type: 'text', x: -260, y: -780, w: 520, h: 56, baseSize: 26, frame: false, color: '#3F7A6E', body: '我的游戏心路' },
        { type: 'text', x: -260, y: -722, w: 520, h: 26, baseSize: 13, frame: false, color: '#6a8a82', body: '从上往下，沿着波浪记一场完整的沉浸。' },

        // 主轴：纵向的二行交错波浪线（左侧贯通到底）
        { type: 'text', variant: 'axis-v', x: -55, y: -640, w: 110, h: 1280, baseSize: 12, body: '' },

        // 5 站交错：奇数站(1/3/5)文字在轴的右侧、偶数站(2/4)文字在轴的左侧
        // 站1 序章 · 初见（右侧）
        { type: 'text', variant: 'tl-phase', x: 90, y: -642 + 28, w: 280, h: 30, baseSize: 14, frame: false, color: '#3F7A6E', body: '序章 · 初见', stage: 's1' },
        { type: 'text', variant: 'tl-text', x: 90, y: -642 + 58, w: 380, h: 100, baseSize: 14, frame: false, color: '#3F4A55', body: '第一眼的感觉：美术、音乐、氛围。\n是什么让你决定留下，开始这一场冒险？', stage: 's1' },

        // 站2 深入 · 沉迷（左侧）
        { type: 'text', variant: 'tl-phase', x: -370, y: -642 + 252, w: 280, h: 30, baseSize: 14, frame: false, color: '#3F7A6E', body: '深入 · 沉迷', stage: 's2' },
        { type: 'text', variant: 'tl-text', x: -380 - 380, y: -642 + 282, w: 380, h: 100, baseSize: 14, frame: false, color: '#3F4A55', body: '哪个系统/支线把你彻底留住？\n那几天玩到几点？记一个具体片段。', stage: 's2' },

        // 站3 转折 · 高光（右侧）
        { type: 'text', variant: 'tl-phase', x: 90, y: -642 + 476, w: 280, h: 30, baseSize: 14, frame: false, color: '#3F7A6E', body: '转折 · 高光', stage: 's3' },
        { type: 'text', variant: 'tl-text', x: 90, y: -642 + 506, w: 380, h: 100, baseSize: 14, frame: false, color: '#3F4A55', body: '最亮的那一刻：某段剧情/战斗/抉择。\n写下来，之后你会想回来重读。', stage: 's3' },

        // 站4 结局 · 通关（左侧）
        { type: 'text', variant: 'tl-phase', x: -370, y: -642 + 700, w: 280, h: 30, baseSize: 14, frame: false, color: '#3F7A6E', body: '结局 · 通关', stage: 's4' },
        { type: 'text', variant: 'tl-text', x: -380 - 380, y: -642 + 730, w: 380, h: 100, baseSize: 14, frame: false, color: '#3F4A55', body: '看完结局是什么心情？落泪/鼓掌/沉默。\n你给这段旅程打几分？', stage: 's4' },

        // 站5 余韵 · 回望（右侧）
        { type: 'text', variant: 'tl-phase', x: 90, y: -642 + 924, w: 280, h: 30, baseSize: 14, frame: false, color: '#3F7A6E', body: '余韵 · 回望', stage: 's5' },
        { type: 'text', variant: 'tl-text', x: 90, y: -642 + 954, w: 380, h: 100, baseSize: 14, frame: false, color: '#3F4A55', body: '还会想起哪一幕？会二周目吗？\n会把这款推荐给谁？', stage: 's5' },

        // 底部小提示
        { type: 'text', x: -260, y: 540, w: 520, h: 30, baseSize: 12.5, frame: false, color: '#6a8a82', body: '提示：选中文字后可拖到任意位置，或双击直接改写。' }
      ]
    }
  };

  // 关联游戏下拉：优先读站点游戏库缓存，读不到则回退内置清单（均可自由填写）
  var GAME_FALLBACK = ['星露谷物语', '集合啦！动物森友会', '火焰纹章：风花雪月', '塞尔达传说：王国之泪',
    '极乐迪斯科', '逆转裁判', '女神异闻录5', '空洞骑士', '尼尔：自动人形', '极限脱出'];
  function getGameLibrary() {
    var list = [];
    try {
      var raw = localStorage.getItem('heroineGamesDataV2');
      if (raw) {
        var arr = JSON.parse(raw);
        if (Array.isArray(arr)) arr.forEach(function (g) {
          if (g && g.title && typeof g.title === 'string' && g.title.indexOf('__') !== 0) list.push(g.title.trim());
        });
      }
    } catch (e) {}
    GAME_FALLBACK.forEach(function (t) { list.push(t); });
    var seen = {}, out = [];
    list.forEach(function (t) { if (t && !seen[t]) { seen[t] = 1; out.push(t); } });
    return out;
  }
  // 取完整游戏对象：优先按 id（来自云端 note_boards.game_id），否则按 title（用户自由填写）。
  function findGameByTitle(title) {
    if (!title) return null;
    try {
      var raw = localStorage.getItem('heroineGamesDataV2');
      if (raw) {
        var arr = JSON.parse(raw);
        if (Array.isArray(arr)) {
          for (var i = 0; i < arr.length; i++) {
            var g = arr[i];
            if (g && g.title === title) return g;
          }
        }
      }
    } catch (e) {}
    return { title: title };    // 没找到时返回只含标题的占位对象
  }
  // 取游戏关键字段的快照，用于插入画板后稳定显示（避免游戏库变化导致卡片不一致）
  function snapshotGameCard(g) {
    if (!g) return null;
    return {
      gameId: g.id != null ? String(g.id) : null,
      title: g.title || '',
      englishName: g.englishName || '',
      cover: g.cover || '',
      genre: Array.isArray(g.genre) ? g.genre.slice(0, 3) : [],
      gameplay: Array.isArray(g.gameplay) ? g.gameplay.slice(0, 2) : [],
      platforms: Array.isArray(g.platforms) ? g.platforms.slice(0, 2) : [],
      releaseDate: g.releaseDate || '',
      hasChinese: g.hasChinese || '',
      heroineType: g.heroineType || '',
      description: g.description || ''
    };
  }
  // 竖版游戏卡封面上的小胶囊角标
  function tagChip(txt, kind) {
    var s = document.createElement('span');
    s.className = 'nb-gc-chip' + (kind ? ' ' + kind : '');
    s.textContent = txt; return s;
  }
  // 在当前画板放一张游戏卡片：自动找画布空位、可拖动/编辑
  function insertGameCardFromBoard() {
    if (!board || !board.gameTitle) { toast('这个画板还没关联游戏', 'err'); return; }
    var g = findGameByTitle(board.gameTitle);
    var snap = snapshotGameCard(g);
    if (!snap) { toast('没找到该游戏信息', 'err'); return; }
    // 自动找空白处：随机小幅偏移避免和现有便签重叠
    // 自动找空白处：在画板视口居中位置 + 小幅随机偏移
    var cx = board.cam ? (board.cam.x || 0) : 0;
    var cy = board.cam ? (board.cam.y || 0) : 0;
    var dx = 80 + Math.floor(Math.random() * 60);
    var dy = 60 + Math.floor(Math.random() * 60);
    var n = {
      id: uid(), type: 'gamecard',
      title: snap.title || board.gameTitle, body: '',
      x: cx + dx, y: cy + dy,
      w: 200, h: 214, baseSize: 14, variant: null, color: null, rot: 0,
      ar: 200 / 214,   // 整体锁比例（竖版画廊卡）≈0.935
      pinned: false, kind: '', stageId: null,
      gameCardData: snap
    };
    pushHistory(); board.notes.push(n);
    renderAll(); selectNote(n.id); markDirty('notes', n.id); scheduleSave(); updateCount();
    toast('已引用游戏卡片：' + snap.title, 'ok');
  }

  // ---------- DOM ----------
  var viewport = document.getElementById('viewport');
  var world = document.getElementById('world');
  var emptyState = document.getElementById('emptyState');
  var countEl = document.getElementById('nbCount');
  var zoomLabel = document.getElementById('zoomLabel');
  // 富文本工具栏内置在便签内，无全局字体/配色面板
  var imgInput = document.getElementById('imgInput');

  // ---------- 状态 ----------
  var store = { activeId: null, boards: [] };   // 多画板容器
  var board = null;          // 当前激活画板（指向 store.boards 中某一项）
  var noteEls = {};          // id -> element
  var selectedId = null;
  var selectedIds = [];      // 多选（含 1 个时与 selectedId 同步）
  var saveTimer = null;
  var _pendingSave = false;   // 有尚未落盘的改动时置真，用于离开页面提醒（防误关丢改动）

  function activeBoard() { return store.boards.filter(function (b) { return b.id === store.activeId; })[0] || store.boards[0]; }
  function newBoard(title) {
    var th = THEMES[store.boards.length % THEMES.length];
    return {
      id: uid(), title: title || '未命名画板', gameTitle: '',
      accent: th.accent, theme: th.id, material: 'dots', bg: 'dots', cardStyle: 'clean',
      createdAt: Date.now(), cam: { x: 0, y: 0, scale: 1 },
      notes: [], clusters: [], diaries: [], tpl: 'blank', links: [], ratings: {},
      stages: []
    };
  }

  // ---------- 模板：把选中模板的种子便签灌入新画板 ----------
  var selectedTpl = 'blank';        // 当前新建弹窗中选中的模板（默认完全白板）
  function applyTemplate(b, key) {
    var t = TEMPLATES[key]; if (!t) return;
    b.tpl = key;                    // 记录画板模式，驱动专属新功能
    b.links = []; b.ratings = {};
    if (t.theme) { b.theme = t.theme; b.accent = themeOf(t.theme).accent; }   // 主题 = 整套颜色
    if (t.material) { b.material = t.material; b.bg = t.material; }           // 材质 = 画布质感
    if (t.cardStyle) b.cardStyle = t.cardStyle;                               // 卡片风格 = 便签质感
    var cmap = {};
    b.clusters = (t.clusters || []).map(function (c) {
      var id = uid(); cmap[c.id] = id;
      return { id: id, name: c.name, color: c.color || b.accent };
    });
    // 时间线等模板可预置「进度分章」节点(stages)：种子便签按 stage 归类，便于建板后用「章节」快速归整
    var smap = {};
    b.stages = (t.stages || []).map(function (s, i) {
      var id = uid(); smap[s.id] = id;
      return { id: id, name: s.name, color: s.color || b.accent, idx: s.idx != null ? s.idx : i };
    });
    var todayStr = dateStr(new Date());
    b.notes = (t.notes || []).map(function (s) {
      var n = {}; for (var k in s) n[k] = s[k];
      n.id = uid(); n.createdAt = Date.now();
      if (key === 'journal') n.date = todayStr;       // 手账：种子便签默认记在「今天」
      if (s.cluster && cmap[s.cluster]) n.clusterId = cmap[s.cluster];
      delete n.cluster;
      if (s.stage && smap[s.stage]) n.stageId = smap[s.stage];   // 阶段归类
      delete n.stage;
      return n;
    });
    // 让模板一建好就体现「专属新功能」：思维导图自动从中心连出分支，文档自动标标题层级
    if (key === 'mindmap' && b.notes.length > 1) {
      for (var mi = 1; mi < b.notes.length; mi++) b.links.push({ id: uid(), from: b.notes[0].id, to: b.notes[mi].id });
    }
    if (key === 'document') {
      b.notes.forEach(function (n) {
        var txt = (n.body || '').toString();
        if (/^[一二三四五六七八九十]、/.test(txt) || /^第.+章/.test(txt) || /^# /.test(txt)) n.level = 1;
      });
    }
  }
  // ===== 模板选择器 · 活预览 =====
  // 场景分组 + 能力徽标 + 从模板种子便签缩绘的微缩画布（建板前就能看到长什么样）
  var TPL_GROUPS = ['随手记', '整理向', '回忆向', '自由'];
  var TPL_META = {
    journal:   { g: '随手记', b: ['📅 日期带'] },
    mindmap:   { g: '整理向', b: ['🔗 连线', '➕ 子节点'] },
    document:  { g: '整理向', b: ['📑 文档流', '☰ 大纲', '⬇ 导出MD'] },
    character: { g: '整理向', b: ['🧩 字段卡'] },
    review:    { g: '整理向', b: ['⭐ 评分'] },
    checklist: { g: '整理向', b: ['🎯 勾选通关', '🎉 通关烟花'] },
    gallery:   { g: '回忆向', b: ['▶ 全屏放映', '🖼 相纸三态', '▦ 拼贴成册'] },
    quote:     { g: '回忆向', b: ['🔄 翻面写批注'] },
    dialogue:  { g: '回忆向', b: ['🎬 逐句播放'] },
    trip:      { g: '回忆向', b: ['🧭 行程轨', '▶ 旅程回放'] },
    timelineH: { g: '回忆向', b: ['🎞 阶段带', '⚖ 疏密切换'] },
    timelineV: { g: '回忆向', b: ['🎞 阶段带', '⚖ 疏密切换'] },
    blank:     { g: '自由',   b: ['🧩 完全自由'] }
  };
  function tplPreviewSVG(t) {
    var W = 120, H = 64, pad = 5;
    var notes = (t && t.notes) || [];
    var th = themeOf(t.theme);
    var accent = th.accent || '#B86FD8';
    if (!notes.length) {                       // 白板：虚框 + 加号
      return '<svg viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="xMidYMid meet" aria-hidden="true">' +
        '<rect class="nb-tpv-bg" x="0" y="0" width="' + W + '" height="' + H + '" fill="' + th.canvas + '" opacity=".6"/>' +
        '<rect x="14.5" y="12.5" width="' + (W - 29) + '" height="' + (H - 25) + '" rx="4" fill="none" stroke="' + accent +
        '" stroke-opacity=".32" stroke-dasharray="4 4"/>' +
        '<path d="M' + (W / 2 - 8) + ' ' + (H / 2) + 'h16M' + (W / 2) + ' ' + (H / 2 - 8) + 'v16" stroke="' + accent +
        '" stroke-opacity=".5" stroke-width="2" stroke-linecap="round"/></svg>';
    }
    var minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    notes.forEach(function (n) {
      var w = n.w || 200, h = n.h || (n.type === 'text' ? 70 : 130);
      var rot = (n.rot || 0) * Math.PI / 180;
      var ex = Math.abs(Math.cos(rot)) * w / 2 + Math.abs(Math.sin(rot)) * h / 2;
      var ey = Math.abs(Math.sin(rot)) * w / 2 + Math.abs(Math.cos(rot)) * h / 2;
      var cx = (n.x || 0) + w / 2, cy = (n.y || 0) + h / 2;
      minX = Math.min(minX, cx - ex); minY = Math.min(minY, cy - ey);
      maxX = Math.max(maxX, cx + ex); maxY = Math.max(maxY, cy + ey);
    });
    var bw = Math.max(1, maxX - minX), bh = Math.max(1, maxY - minY);
    var s = Math.min((W - pad * 2) / bw, (H - pad * 2) / bh);
    var ox = pad + ((W - pad * 2) - bw * s) / 2, oy = pad + ((H - pad * 2) - bh * s) / 2;
    var rects = notes.slice(0, 60).map(function (n, i) {
      var w = n.w || 200, h = n.h || (n.type === 'text' ? 70 : 130);
      var x = ((n.x || 0) - minX) * s + ox, y = ((n.y || 0) - minY) * s + oy;
      return '<rect class="nb-tpv-n" style="--i:' + i + '" x="' + x.toFixed(1) + '" y="' + y.toFixed(1) +
        '" width="' + Math.max(2, w * s).toFixed(1) + '" height="' + Math.max(2, h * s).toFixed(1) +
        '" rx="1.4" fill="' + (n.color || accent) + '"/>';
    }).join('');
    return '<svg viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="xMidYMid meet" aria-hidden="true">' +
      '<rect class="nb-tpv-bg" x="0" y="0" width="' + W + '" height="' + H + '" fill="' + th.canvas + '" opacity=".62"/>' +
      rects + '</svg>';
  }
  function renderTplGrid() {
    var grid = document.getElementById('tplGrid'); if (!grid) return;
    grid.innerHTML = '';
    var buckets = {};
    TPL_GROUPS.forEach(function (g) { buckets[g] = []; });
    Object.keys(TEMPLATES).forEach(function (k) {
      var meta = TPL_META[k] || { g: '自由', b: [] };
      (buckets[meta.g] || buckets['自由']).push(k);
    });
    TPL_GROUPS.forEach(function (g) {
      var list = buckets[g]; if (!list.length) return;
      var hd = document.createElement('div');
      hd.className = 'nb-tpl-group'; hd.textContent = g;
      grid.appendChild(hd);
      list.forEach(function (key) {
        var t = TEMPLATES[key];
        var meta = TPL_META[key] || { b: [] };
        var c = document.createElement('div');
        c.className = 'nb-tpl-card' + (key === selectedTpl ? ' on' : '');
        c.innerHTML =
          '<div class="nb-tpl-prev">' + tplPreviewSVG(t) + '</div>' +
          '<div class="nb-tpl-head"><span class="nb-tpl-ico">' + (t.icon || '') + '</span>' +
            '<span class="nb-tpl-name">' + t.name + '</span></div>' +
          '<div class="nb-tpl-desc">' + t.desc + '</div>' +
          (meta.b.length
            ? '<div class="nb-tpl-badges">' + meta.b.map(function (x) { return '<span class="nb-tpl-badge">' + x + '</span>'; }).join('') + '</div>'
            : '');
        c.addEventListener('click', function () {
          selectedTpl = key;
          for (var i = 0; i < grid.children.length; i++) grid.children[i].classList.remove('on');
          c.classList.add('on');
        });
        grid.appendChild(c);
      });
    });
  }

  // ---------- 工具函数 ----------
  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
  function uid() {
    // 云端主键为 text，但新 id 统一用 uuid，便于以后与站点其它表对齐
    if (window.crypto && typeof window.crypto.randomUUID === 'function') {
      try { return window.crypto.randomUUID(); } catch (e) {}
    }
    var r;
    try { r = window.crypto.getRandomValues(new Uint8Array(16)); } catch (e) { r = null; }
    if (!r) { r = new Uint8Array(16); for (var i = 0; i < 16; i++) r[i] = Math.floor(Math.random() * 256); }
    r[6] = (r[6] & 0x0f) | 0x40; r[8] = (r[8] & 0x3f) | 0x80;   // v4
    var h = []; for (var j = 0; j < 16; j++) h.push((r[j] + 0x100).toString(16).slice(1));
    return h.slice(0, 4).join('') + '-' + h.slice(4, 6).join('') + '-' +
           h.slice(6, 8).join('') + '-' + h.slice(8, 10).join('') + '-' + h.slice(10, 16).join('');
  }
  function $(sel, root) { return (root || document).querySelector(sel); }

  // ---------- 持久化（多画板容器） ----------
  // 旧画板补齐 theme / material：从旧的 accent 推断最接近的主题，bg 直接映射为材质
  function colorDist(a, b) {
    function rgb(h) { var x = (h || '#000').replace('#', ''); if (x.length === 3) x = x[0] + x[0] + x[1] + x[1] + x[2] + x[2]; var n = parseInt(x, 16) || 0; return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
    var p = rgb(a), q = rgb(b);
    return Math.abs(p[0] - q[0]) + Math.abs(p[1] - q[1]) + Math.abs(p[2] - q[2]);
  }
  function normalizeBoard(b) {
    if (!b) return;
    if (!b.theme) {
      var best = THEMES[0], bd = 1e9;
      THEMES.forEach(function (t) {
        var d = colorDist(t.accent, b.accent || ACCENTS[0]);
        if (d < bd) { bd = d; best = t; }
      });
      b.theme = best.id;
    }
    if (!b.material) {
      var m = b.bg || 'dots';
      if (m === 'dark') m = 'night';
      if (BG_THEMES.indexOf(m) < 0) m = 'dots';
      b.material = m;
    }
    b.bg = b.material;
    b.accent = themeOf(b.theme).accent;
    if (!b.cardStyle) b.cardStyle = 'clean';
    b.notes = b.notes || [];
    b.clusters = b.clusters || [];
    b.diaries = b.diaries || [];
    b.links = b.links || [];
    b.ratings = b.ratings || {};
    b.stages = b.stages || [];
    if (Array.isArray(b.stages)) b.stages.forEach(function (s, i) { if (s && typeof s === 'object') { if (s.id == null) s.id = uid(); if (s.idx == null) s.idx = i; } });
    else b.stages = [];
    b.cam = b.cam || { x: 0, y: 0, scale: 1 };
    // 迁移旧划线便签：早期 ar 误存为 w/h（>1），纠正为 h/w，供缩放手柄等比缩放
    if (Array.isArray(b.notes)) b.notes.forEach(function (n) {
      if (n && n.type === 'sticker' && n.stickId && n.stickId.indexOf('line-') === 0) {
        var w = n.w || 200, h = n.h || 60;
        if (!(n.ar > 0 && n.ar <= 1.2)) n.ar = h / w;   // ar 应为 h/w(<=1)；异常则重算
        if (!n.h) n.h = 60;
      }
    });
  }
  function load() {
    // 1) 已有多画板数据
    try {
      var raw = localStorage.getItem(STORE_KEY);
      if (raw) {
        var d = JSON.parse(raw);
        if (d && d.boards && d.boards.length) {
          store = d;
          if (!store.activeId || !store.boards.some(function (b) { return b.id === store.activeId; })) store.activeId = store.boards[0].id;
          store.boards.forEach(normalizeBoard);
          board = activeBoard();
          board.cam = board.cam || { x: 0, y: 0, scale: 1 };
          board.notes = board.notes || [];
          board.clusters = board.clusters || [];
          return;
        }
      }
    } catch (e) {}
    // 2) 迁移旧单画板数据（herlens_notes_board_v1）→ 包成第一个画板
    try {
      var legacy = localStorage.getItem(LEGACY_KEY);
      if (legacy) {
        var ob = JSON.parse(legacy);
        if (ob && ob.notes) {
          var nb = newBoard('我的画板');
          nb.cam = ob.cam || { x: 0, y: 0, scale: 1 };
          nb.material = nb.bg = ob.bg || 'dots';
          nb.notes = ob.notes;
          normalizeBoard(nb);
          store = { activeId: nb.id, boards: [nb] };
          board = nb; save(); return;
        }
      }
    } catch (e) {}
    // 3) 全新：建一个默认画板
    var fb = newBoard('我的画板');
    store = { activeId: fb.id, boards: [fb] };
    board = fb;
  }
  function scheduleSave() {
    _pendingSave = true;
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(function () { _pendingSave = false; save(); scheduleSync(); }, 350);
  }
  // 离开页面草稿保护：有尚未落盘的改动时，关闭/刷新给系统确认（仅在有挂起保存时提示，云端后台刷新不误伤）
  try {
    window.addEventListener('beforeunload', function (e) {
      if (!_pendingSave) return;
      e.preventDefault();
      e.returnValue = '';
    });
  } catch (_) {}
  // ---------- 数据安全：告警 / 配额 / 图片压缩 / 备份 ----------
  var QUOTA_BYTES = 5 * 1024 * 1024;             // 浏览器单站点约 5 MB
  var nbAlert = document.getElementById('nbAlert');
  var nbAlertTitle = document.getElementById('nbAlertTitle');
  var nbAlertText = document.getElementById('nbAlertText');
  var nbAlertAct = document.getElementById('nbAlertAct');
  var alertTimer = null;
  function hideAlert() { if (nbAlert) nbAlert.classList.remove('show'); }
  function showAlert(title, text, actText, onAct, sticky) {
    if (!nbAlert) return;
    nbAlertTitle.textContent = title;
    nbAlertText.textContent = text;
    nbAlertAct.textContent = actText || '知道了';
    nbAlertAct.onclick = function () { hideAlert(); if (onAct) onAct(); };
    nbAlert.classList.add('show');
    if (alertTimer) clearTimeout(alertTimer);
    if (!sticky) alertTimer = setTimeout(hideAlert, 4200);
  }
  function isQuotaErr(e) {
    if (!e) return false;
    return e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
      e.code === 22 || e.code === 1014;
  }
  var quotaWarned = false;
  function save() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(store));
      saveDirty();
      quotaWarned = false;
      updateUsage();
      flashSaved();
      return true;
    } catch (e) {
      console.warn('保存失败：', e);
      if (isQuotaErr(e)) {
        if (!quotaWarned) {
          quotaWarned = true;
          if (cloudOn) {
            showAlert('本机缓存写满了', '浏览器给本站点的空间约 5 MB。已登录，改动仍会同步到云端，但刷新后本机可能读不到，请确保处于联网状态。', '知道了', null, true);
          } else {
            showAlert('本地存储已满，最新改动没能保存', '浏览器给本站点的空间约 5 MB，图片便签最占地方。请登录以启用云端同步，或导出一份 JSON。', '去导出', function () { toggleBoardPanel(true); exportBackup(); }, true);
          }
        }
      } else {
        showAlert('保存失败', '数据没能写入本地存储：' + ((e && e.message) || '未知错误'), '知道了', null, false);
      }
      return false;
    }
  }
  function fmtBytes(b) {
    if (b < 1024) return b + ' B';
    if (b < 1024 * 1024) return (b / 1024).toFixed(0) + ' KB';
    return (b / 1024 / 1024).toFixed(2) + ' MB';
  }
  var usageFill = document.getElementById('usageFill');
  var usageText = document.getElementById('usageText');
  function storeBytes() {
    try { return new Blob([JSON.stringify(store)]).size; } catch (e) { return 0; }
  }
  // 空间占用 = 本机缓存（localStorage）用量，对所有人显示。
  // 注意：这里的 5 MB 是「浏览器给单个站点的额度」，与云端（Supabase）容量无关，
  // 面板里的说明文案负责把这点讲清楚；下方文案也带上「本机缓存」前缀避免误读。
  function updateUsage() {
    if (!usageFill || !usageText) return;
    var b = storeBytes();
    var pct = Math.min(100, b / QUOTA_BYTES * 100);
    usageFill.style.width = pct.toFixed(1) + '%';
    usageFill.className = 'nb-usage-fill' + (pct > 85 ? ' danger' : (pct > 60 ? ' warn' : ''));
    usageText.textContent = '本机缓存已用 ' + fmtBytes(b) + ' / 约 5 MB（' + pct.toFixed(0) + '%）' + (pct > 85 ? ' · 空间紧张' : '');
  }

  var IMG_MAX_EDGE = 1400, IMG_QUALITY = 0.82;
  function compressImage(src, cb) {               // 截图最占空间：缩到最长边 1400 + JPEG，通常能压掉 90%
    var img = new Image();
    img.onload = function () {
      var out = src;
      try {
        var w = img.naturalWidth || 0, h = img.naturalHeight || 0;
        if (w && h) {
          var k = Math.min(1, IMG_MAX_EDGE / Math.max(w, h));
          var nw = Math.max(1, Math.round(w * k)), nh = Math.max(1, Math.round(h * k));
          var cv = document.createElement('canvas'); cv.width = nw; cv.height = nh;
          var ctx = cv.getContext('2d');
          ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, nw, nh);      // JPEG 无透明通道，先铺白底
          ctx.drawImage(img, 0, 0, nw, nh);
          var jpg = cv.toDataURL('image/jpeg', IMG_QUALITY);
          if (jpg && jpg.length < src.length) out = jpg;
        }
      } catch (e) {}
      cb(out);
    };
    img.onerror = function () { cb(src); };
    img.src = src;
  }

  var exportBtn = document.getElementById('exportBtn');
  var importBtn = document.getElementById('importBtn');
  var importInput = document.getElementById('importInput');
  var compressBtn = document.getElementById('compressBtn');
  function exportBackup() {
    try {
      var payload = { app: 'herlens-notes', version: 2, exportedAt: new Date().toISOString(), store: store };
      var blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = 'herlens-游戏感想备份-' + new Date().toISOString().slice(0, 10) + '.json';
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 1500);
    } catch (e) { showAlert('导出失败', '无法生成备份文件：' + ((e && e.message) || '未知错误'), '知道了', null, false); }
  }
  function compressAllImages() {                 // 抢救已经存进去的历史大图（压缩前的数据不会自动变小）
    var targets = [];
    store.boards.forEach(function (b) {
      (b.notes || []).forEach(function (n) {
        if (n.type === 'image' && n.img && n.img.length > 120000) targets.push(n);
      });
    });
    if (!targets.length) {
      showAlert('没有需要压缩的图片', '所有图片便签都已经在合理大小内了。', '好的', null, false); return;
    }
    confirmDialog('压缩图片', '发现 ' + targets.length + ' 张较大的图片。压缩后会显著降低占用（画质略降，文字内容不变）。建议先导出一次备份。', {
      okText: '开始压缩', onOk: function () { runCompress(targets); }
    });
  }
  function runCompress(targets) {
    var before = storeBytes();
    if (compressBtn) compressBtn.disabled = true;
    var i = 0, done = 0;
    function next() {
      if (i >= targets.length) {
        if (compressBtn) compressBtn.disabled = false;
        renderAll(); updateUsage();
        if (!save()) return;
        showAlert('压缩完成', '已处理 ' + done + ' 张图片，占用从 ' + fmtBytes(before) + ' 降到 ' + fmtBytes(storeBytes()) + '。', '好的', null, false);
        return;
      }
      var n = targets[i++];
      compressImage(n.img, function (out) {
        if (out !== n.img) { n.img = out; done++; }
        next();
      });
    }
    next();
  }
  function importBackup(file) {
    var fr = new FileReader();
    fr.onload = function () {
      var d = null;
      try { d = JSON.parse(fr.result); } catch (e) { showAlert('导入失败', '这不是有效的 JSON 备份文件。', '知道了', null, false); return; }
      var s = (d && d.store) ? d.store : d;
      if (!s || !s.boards || !s.boards.length) { showAlert('导入失败', '文件里没有找到画板数据。', '知道了', null, false); return; }
      confirmDialog('导入备份', '导入会覆盖当前内容：现有 ' + store.boards.length + ' 个画板 → 备份里 ' + s.boards.length + ' 个画板。建议先导出当前备份。', {
        okText: '覆盖导入', danger: true, onOk: function () { doImport(s); }
      });
    };
    fr.readAsText(file);
  }
  function doImport(s) {
    store = s;
    store.boards.forEach(function (b) {
      b.notes = b.notes || []; b.cam = b.cam || { x: 0, y: 0, scale: 1 };
      b.bg = b.bg || 'dots'; b.clusters = b.clusters || []; b.diaries = b.diaries || [];
    });
    if (!store.activeId || !store.boards.some(function (b) { return b.id === store.activeId; })) store.activeId = store.boards[0].id;
    board = activeBoard();
    if (!save()) return;
    applyBg(); applyAccent(); renderBoardPanel(); updateGameBanner(); updateBoardName();
    renderAll(); renderDiaryLib(); updateUsage(); enterMode();
    toast('已导入 ' + store.boards.length + ' 个画板', 'ok');
  }

  // ---------- 云端同步（Supabase） ----------
  // 本地 localStorage 始终是「即时缓存」，保证离线可用、操作不卡顿；
  // 登录后改动会防抖推送到云端，启动优先取云端数据。
  var cloud = window.NBCloud || null;
  var cloudRow = document.getElementById('cloudRow');
  var cloudDot = document.getElementById('cloudDot');
  var cloudText = document.getElementById('cloudText');
  var cloudChip = document.getElementById('cloudChip');
  var syncNowBtn = document.getElementById('syncNowBtn');
  var uploadAllBtn = document.getElementById('uploadAllBtn');
  var syncTimer = null, syncing = false, cloudOn = false, lastSyncAt = 0;
  var pendingDel = { boards: [], notes: [], clusters: [], diaries: [], stages: [] };
  // 增量同步记账：只把"真正改动过"的行写回云端，避免大画板每次拖拽都整板重传。
  //   dirty      = { kind: { id: 1 } }      待写入的行
  //   dirtyAll   = true                     放弃增量（历史回退 / 首次上传 / 换板），下次同步走全量
  var dirty = { boards: {}, notes: {}, clusters: {}, diaries: {}, stages: {} };
  var dirtyAll = false;

  function markDel(kind, id) {                 // 删除必须显式记账：本地 splice 后云端无从得知
    if (!id || !pendingDel[kind]) return;
    if (pendingDel[kind].indexOf(id) < 0) pendingDel[kind].push(id);
    if (dirty[kind]) delete dirty[kind][id];   // 已删除的 id 不必再写，省一次无用的 upsert
  }
  function markDirty(kind, id) {               // 单行改动：便签编辑 / 拖动 / 改名…
    if (kind && dirty[kind]) { if (id) dirty[kind][id] = 1; else dirtyAll = true; }
    else dirtyAll = true;
  }
  function markDirtyAll() { dirtyAll = true; }
  // 拷贝一份待写集合：同步是异步的，途中用户还在编辑，
  // 若直接把 dirty 的引用交给 push，成功后整表清空会把"途中的新改动"一起抹掉。
  function cloneDirty() {
    var o = {};
    ['boards', 'notes', 'clusters', 'diaries', 'stages'].forEach(function (k) {
      o[k] = {}; for (var id in dirty[k]) o[k][id] = 1;
    });
    return o;
  }
  // 只清掉"本次确实写上去"的项，期间新增的保留等下一轮
  function subtractDirty(snap) {
    if (!snap) { resetDirty(); return; }
    ['boards', 'notes', 'clusters', 'diaries', 'stages'].forEach(function (k) {
      for (var id in snap[k]) delete dirty[k][id];
    });
    dirtyAll = false;
    saveDirty();
  }
  function hasPendingDel() {
    for (var k in pendingDel) { if (pendingDel[k] && pendingDel[k].length) return true; }
    return false;
  }
  function resetDirty() {
    dirty = { boards: {}, notes: {}, clusters: {}, diaries: {}, stages: {} };
    dirtyAll = false;
    saveDirty();
  }
  // 记账落盘：刷新 / 关页后未同步的改动仍能续传（否则 dirty 是内存态，一刷新就丢）
  function saveDirty() {
    try {
      if (!hasDirty() && !Object.keys(pendingDel).some(function (k) { return pendingDel[k].length; })) {
        localStorage.removeItem(DIRTY_KEY); return;
      }
      localStorage.setItem(DIRTY_KEY, JSON.stringify({ dirty: dirty, dirtyAll: dirtyAll, pendingDel: pendingDel }));
    } catch (_) {}
  }
  function loadDirty() {
    try {
      var raw = localStorage.getItem(DIRTY_KEY); if (!raw) return;
      var d = JSON.parse(raw); if (!d) return;
      if (d.dirty) { ['boards','notes','clusters','diaries','stages'].forEach(function (k) { if (d.dirty[k]) dirty[k] = d.dirty[k]; }); }
      dirtyAll = !!d.dirtyAll;
      if (d.pendingDel) { ['boards','notes','clusters','diaries','stages'].forEach(function (k) { if (Array.isArray(d.pendingDel[k])) pendingDel[k] = d.pendingDel[k]; }); }
    } catch (_) {}
  }
  function hasDirty() {
    if (dirtyAll) return true;
    for (var k in dirty) { for (var _ in dirty[k]) return true; }
    return false;
  }
  // 历史回退（撤销/重做）会整体换掉 board.notes / clusters，
  // 无法逐条比对"谁被删了、谁被复活了"，只能让本板走一次全量重写：
  // 全量模式下云端按当前 store 覆盖写入，本板已被撤销掉的便签会自然消失。
  // 同时清掉本板相关的删除记账，避免"撤销复活"的便签又被删一次。
  function markHistoryDirty() {
    if (!board) { dirtyAll = true; return; }
    var aliveIds = {};
    (board.notes || []).forEach(function (n) { if (n && n.id) aliveIds[n.id] = 1; });
    pendingDel.notes = pendingDel.notes.filter(function (id) { return aliveIds[id]; });
    var aliveCl = {};
    (board.clusters || []).forEach(function (c) { if (c && c.id) aliveCl[c.id] = 1; });
    pendingDel.clusters = pendingDel.clusters.filter(function (id) { return aliveCl[id]; });
    var aliveSt = {};
    (board.stages || []).forEach(function (s) { if (s && s.id) aliveSt[s.id] = 1; });
    pendingDel.stages = pendingDel.stages.filter(function (id) { return aliveSt[id]; });
    dirtyAll = true;                             // 整店全量：最稳，撤销不丢数据
  }
  function clsOf(state) {
    return state === 'ok' ? 'is-ok' : state === 'sync' ? 'is-sync' : state === 'err' ? 'is-err' : 'is-off';
  }
  function setCloudUI(state, text) {
    var cls = clsOf(state);
    if (cloudRow) cloudRow.className = 'nb-cloud-row ' + cls;
    if (cloudText && text) cloudText.textContent = text;
    if (cloudChip) {
      cloudChip.className = 'nb-cloud-chip ' + cls;
      cloudChip.textContent = state === 'ok' ? '已同步' : state === 'sync' ? '同步中…'
        : state === 'err' ? '同步失败' : '仅本机';
      cloudChip.title = text || '';
    }
  }
  function hhmm(ts) { var d = new Date(ts); return pad2(d.getHours()) + ':' + pad2(d.getMinutes()); }

  function uploadPendingImages() {             // base64 → Storage URL，避免把几 MB 图塞进数据库
    if (!cloud || !cloudOn) return Promise.resolve(0);
    var jobs = [];
    store.boards.forEach(function (b) {
      (b.notes || []).forEach(function (n) {
        if (n.type === 'image' && n.img && !/^https?:/i.test(n.img) && !n._upFail) jobs.push({ b: b, n: n });
      });
    });
    if (!jobs.length) return Promise.resolve(0);
    var ok = 0;
    return Promise.all(jobs.map(function (j) {
      return cloud.uploadImage(j.n.img, j.b.id, j.n.id).then(function (url) {
        if (url) { j.n.img = url; ok++; } else { j.n._upFail = 1; }
      });
    })).then(function () { return ok; });
  }

  function scheduleSync() {
    if (!cloudOn) return;
    if (syncTimer) clearTimeout(syncTimer);
    syncTimer = setTimeout(syncNow, 900);
  }
  function syncNow(retry) {
    if (!cloud || !cloudOn || syncing) return Promise.resolve(false);
    syncing = true;
    setCloudUI('sync', '正在同步…');
    var submitted = null, snap = null;
    return uploadPendingImages().then(function (k) {
      if (k > 0) save();                       // 图片已换成 URL，立即落盘
      // 没有待写 / 待删的改动时直接跳过，省一次无意义的网络往返
      if (!hasPendingDel() && !hasDirty()) {
        syncing = false;
        setCloudUI('ok', '已是最新 · ' + hhmm(lastSyncAt || Date.now()));
        return null;                           // null = 本轮没干活，别走下面的清理
      }
      submitted = {
        boards: pendingDel.boards.slice(), notes: pendingDel.notes.slice(),
        clusters: pendingDel.clusters.slice(), diaries: pendingDel.diaries.slice(),
        stages: pendingDel.stages.slice()
      };
      snap = dirtyAll ? 'ALL' : cloneDirty();   // 拷贝快照，不用引用
      return cloud.push(store, submitted, snap === 'ALL' ? null : snap);
    }).then(function (r) {
      if (r === null) return true;
      // 只清本次已提交的记账，同步途中新产生的改动留到下一轮
      ['boards', 'notes', 'clusters', 'diaries', 'stages'].forEach(function (k) {
        if (!submitted[k] || !submitted[k].length) return;
        pendingDel[k] = pendingDel[k].filter(function (id) { return submitted[k].indexOf(id) < 0; });
      });
      if (snap === 'ALL') resetDirty(); else subtractDirty(snap);
      lastSyncAt = Date.now(); syncing = false;
      setCloudUI('ok', '已同步 · ' + hhmm(lastSyncAt));
      // 同步途中又产生了新改动 → 自动补推一次（只补一轮，避免连环递归）
      if (!retry && (hasDirty() || hasPendingDel())) return syncNow(true);
      return true;
    }, function (err) {
      syncing = false;
      setCloudUI('err', '同步失败：' + ((err && err.message) || '网络异常，改动已存本机'));
      return false;
    });
  }

  function applyCloudData(data) {
    if (!data || !data.boards) return;
    store.boards = data.boards;
    store.activeId = data.activeId || (data.boards[0] && data.boards[0].id) || null;
    board = activeBoard();
    if (!board) board = store.boards[0];
    board.cam = board.cam || { x: 0, y: 0, scale: 1 };
    board.bg = board.bg || 'dots';
    board.notes = board.notes || [];
    board.clusters = board.clusters || [];
    board.diaries = board.diaries || [];
    deselect(); applyBg(); applyCam(); renderAll(); renderClusters();
    renderBoardPanel(); renderDiaryLib(); updateGameBanner(); updateUsage();
    updateEmpty(); updateCount(); save();
  }

  function cloudBoot() {
    if (!cloud) { setCloudUI('off', '云端组件未加载，数据只存本机'); return; }
    cloud.refreshSession().then(function (u) {
      if (!u) { cloudOn = false; setCloudUI('off', '未登录 · 数据只存在这台设备的浏览器里'); return null; }
      cloudOn = true;
      return cloud.pull().then(function (data) {
        var cloudBoards = (data && data.boards) ? data.boards.length : 0;
        var localCount = store.boards.reduce(function (a, b) {
          return a + (b.notes || []).length + (b.diaries || []).length;
        }, 0);
        var localHasAny = localCount > 0;
        if (cloudBoards && !localHasAny) {
          // 本地空、云端有 → 拉取覆盖（最常见场景：换设备登录）
          applyCloudData(data);
          resetDirty();                        // 刚从云端拉全量，本地无未上传改动
          setCloudUI('ok', '已同步 · 云端 ' + cloudBoards + ' 个画板');
        } else if (cloudBoards && localHasAny) {
          // 都有 → 不自动覆盖，避免本地未同步内容被静默吞掉
          setCloudUI('off', '云端 ' + cloudBoards + ' 个画板 · 本地还有 ' + localCount + ' 条未上传 · 选「↑ 上传」或继续在本地记');
          if (uploadAllBtn) uploadAllBtn.classList.add('hl');
        } else if (localCount > 0) {
          setCloudUI('off', '已登录 ' + (cloud.userEmail() ? '（' + cloud.userEmail() + '）' : '') + ' · 云端还是空的，可一键上传本地数据');
          if (uploadAllBtn) uploadAllBtn.classList.add('hl');
        } else {
          setCloudUI('ok', '已连接云端' + (cloud.userEmail() ? ' · ' + cloud.userEmail() : ''));
        }
      });
    }).catch(function (err) {
      cloudOn = false;
      setCloudUI('err', '云端不可用，已切换为本机存储：' + ((err && err.message) || '未知错误'));
    });
  }
  function uploadAll() {
    if (!cloudOn) {
      showAlert('需要登录', '云端同步要在主站登录后才能使用。未登录期间记录的便签会留在本机，登录后可以一键上传。', '知道了', null, false);
      return;
    }
    markDirtyAll();                            // 一键上传 = 全量，确保本机所有内容都上去
    syncNow().then(function (ok) {
      showAlert(ok ? '已上传到云端' : '上传失败', ok ? '本地数据已同步到你的账号，换设备打开也会看到。' : '改动已安全保存在本机，稍后会自动重试。', '好的', null, false);
    });
  }

  // ---------- 相机 ----------
  function applyCam() {
    world.style.transform = 'translate3d(' + board.cam.x + 'px,' + board.cam.y + 'px,0) scale(' + board.cam.scale + ')';
    zoomLabel.textContent = Math.round(board.cam.scale * 100) + '%';
    if (floatbar && floatbar.classList.contains('show')) positionFloatbar();
    requestMiniUpdate();
  }
  function screenToWorld(sx, sy) {
    var r = viewport.getBoundingClientRect();
    return {
      x: (sx - r.left - board.cam.x) / board.cam.scale,
      y: (sy - r.top - board.cam.y) / board.cam.scale
    };
  }
  function zoomAt(factor, sx, sy) {
    var r = viewport.getBoundingClientRect();
    var px = sx - r.left, py = sy - r.top;
    var ns = clamp(board.cam.scale * factor, ZOOM_MIN, ZOOM_MAX);
    if (ns === board.cam.scale) return;
    board.cam.x = px - (px - board.cam.x) * (ns / board.cam.scale);
    board.cam.y = py - (py - board.cam.y) * (ns / board.cam.scale);
    board.cam.scale = ns;
    markDirty('boards', board.id);
    applyCam(); scheduleSave();
  }
  function fitView() {
    if (!board.notes.length) {
      board.cam = { x: viewport.clientWidth / 2, y: viewport.clientHeight / 2, scale: 1 };
      markDirty('boards', board.id);
      applyCam(); scheduleSave(); return;
    }
    var minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    board.notes.forEach(function (n) {
      minX = Math.min(minX, n.x); minY = Math.min(minY, n.y);
      maxX = Math.max(maxX, n.x + (n.w || 200)); maxY = Math.max(maxY, n.y + (n.h || 140));
    });
    var pad = 60;
    var bw = (maxX - minX) + pad * 2, bh = (maxY - minY) + pad * 2;
    var vw = viewport.clientWidth, vh = viewport.clientHeight;
    var s = clamp(Math.min(vw / bw, vh / bh), ZOOM_MIN, 1.2);
    board.cam.scale = s;
    board.cam.x = vw / 2 - (minX + (maxX - minX) / 2) * s;
    board.cam.y = vh / 2 - (minY + (maxY - minY) / 2) * s;
    markDirty('boards', board.id);
    applyCam(); scheduleSave();
  }

  // ---------- 便签渲染 ----------
  // 便签定位 transform：位置 + 可选倾斜角。统一走这里，导出图片时也能还原倾斜。
  function noteTransform(n) {
    return 'translate3d(' + (n.x || 0) + 'px,' + (n.y || 0) + 'px,0)' + (n.rot ? ' rotate(' + n.rot + 'deg)' : '');
  }
  // ---------- 手感层：动效（统一在这里，尊重系统「减少动态效果」） ----------
  function motionOK() {
    try { return !window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (_) { return true; }
  }
  // 便签「落下回弹」：从略小 + 透明 → 轻微过冲 → 归位。用 Web Animations，
  // 把缩放追加在 transform 末尾（先缩放后旋转平移），因此不会打乱已有的 x/y/rot。
  function dropIn(el, n, delay) {
    if (!el || !el.animate || !motionOK()) return;
    var base = noteTransform(n);
    try {
      var a = el.animate([
        { transform: base + ' scale(.84)', opacity: 0 },
        { transform: base + ' scale(1.045)', opacity: 1, offset: .58 },
        { transform: base, opacity: 1 }
      ], { duration: 380, delay: delay || 0, easing: 'cubic-bezier(.22,.9,.3,1.2)', fill: 'backwards' });
      el._dropAnim = a;
      a.onfinish = function () { if (el._dropAnim === a) el._dropAnim = null; };
      a.oncancel = a.onfinish;
    } catch (_) {}
  }
  // 便签「揉纸飘走」：先揉小打个旋儿，再向右上飞出淡出；结束后回调移除 DOM。
  function crushOut(el, n, done) {
    var fin = function () { if (el) el._crushAnim = null; done && done(); };
    if (!el || !el.animate || !motionOK()) { fin(); return; }
    var base = noteTransform(n);
    try {
      if (el._dropAnim) { el._dropAnim.cancel(); el._dropAnim = null; }
      el.classList.add('crush');
      var a = el.animate([
        { transform: base, opacity: 1, filter: 'blur(0px)' },
        { transform: base + ' scale(.82) rotate(-4deg)', opacity: 1, filter: 'blur(0px)', offset: .28 },
        { transform: base + ' translate3d(26px,-34px,0) scale(.2) rotate(26deg)', opacity: 0, filter: 'blur(2.5px)' }
      ], { duration: 420, easing: 'cubic-bezier(.5,0,.85,.45)' });
      el._crushAnim = a;
      a.onfinish = fin; a.oncancel = fin;
      setTimeout(fin, 520);              // 兜底：动画事件丢失也不至于让便签钉在页面上
    } catch (_) { fin(); }
  }

  function renderAll() {
    world.innerHTML = '';
    noteEls = {};
    guidesLayer = null;                                  // 重建便签会把参考线层一并清掉，下次拖动再建
    board.notes.forEach(function (n) { world.appendChild(buildNote(n)); });
    syncStageMarks();
    renderClusters();
    renderModeLayer();
    ensureGuides();
    updateEmpty();
    updateCount();
    requestMiniUpdate();
  }
  // 把 note 的 hanger 状态同步到已存在的 DOM 上（增删挂件、切类名）
  function syncHanger(el, n) {
    if (!el) return;
    el.classList.remove('nb-h-tape', 'nb-h-pin', 'nb-h-clip', 'nb-h-string');
    var old = el.querySelector('.nb-hanger');
    if (old && old.parentNode) old.parentNode.removeChild(old);
    var h = n && n.hanger;
    if (!h || h === 'none') return;
    el.classList.add('nb-h-' + h);
    var hanger = document.createElement('div');
    hanger.className = 'nb-hanger';
    hanger.setAttribute('aria-hidden', 'true');
    var grain = el.querySelector('.nb-grain');
    if (grain && grain.nextSibling) el.insertBefore(hanger, grain.nextSibling);
    else el.appendChild(hanger);
  }
  function buildNote(n) {
    var el = document.createElement('div');
    el.className = 'nb-note nb-type-' + (n.type || 'sticky') + (n.pinned ? ' pinned' : '');
    el.dataset.id = n.id;
    if (n.baseSize) el.style.setProperty('--nb-fs', n.baseSize + 'px');   // 整张便签基准字号

    // 质感层：纸纤维噪点（纯装饰，不参与编辑、不影响导出内容）
    var grain = document.createElement('div');
    grain.className = 'nb-grain';
    grain.setAttribute('aria-hidden', 'true');
    el.appendChild(grain);
    // 实物挂件：胶带 tape / 图钉 pin / 回形针 clip / 麻绳 string
    syncHanger(el, n);

    // 位置：用 transform 定位（GPU 合成，拖拽不重排/不重绘）；rot 为模板给的轻微倾斜（拍立得/手账感）
    if (n.variant) el.classList.add('nb-v-' + n.variant);
    if (n.color) { el.classList.add('nb-has-color'); el.style.setProperty('--nb-note-color', n.color); }
    if (n.type === 'text' && n.frame) el.classList.add('nb-text-frame');
    el.style.transform = noteTransform(n);
    el.style.width = (n.w || 200) + 'px';
    if (n.type === 'sticker') {
      el.style.height = (n.h || 150) + 'px';
      el.style.minHeight = '0';
      el.style.setProperty('--nb-stk-w', (n.w || 168) + 'px');
      el.style.setProperty('--nb-stk-h', (n.h || 150) + 'px');
    }
    else if (n.type !== 'text' && n.type !== 'image') el.style.minHeight = (n.h || 130) + 'px';
    else if (n.type === 'text' && n.variant === 'axis-h') { el.style.height = (n.h || 110) + 'px'; }
    else if (n.type === 'text' && n.variant === 'axis-v') { el.style.height = (n.h || 110) + 'px'; }
    if (n.type === 'image') el.style.height = (n.h || 160) + 'px';

    // 图片
    if (n.type === 'image') {
      var grip = document.createElement('div'); grip.className = 'nb-grip'; el.appendChild(grip);
      var img = document.createElement('img');
      img.className = 'nb-img'; img.alt = '便签图片';
      img.addEventListener('load', function () {
        if (img.naturalWidth && img.naturalHeight) {
          var ratio = img.naturalHeight / img.naturalWidth;
          n.h = Math.max(100, Math.round((n.w || 220) * ratio));   // 按原图比例自适应高度，避免裁切
          el.style.height = n.h + 'px';
          if (selectedId === n.id) positionFloatbar();
        }
      });
      img.src = n.img || '';
      el.appendChild(img);
    } else if (n.type === 'sticker') {
      // 装饰贴纸：内容在 .nb-stk 中按 note 尺寸自动缩放，无文字编辑
      var gripS = document.createElement('div'); gripS.className = 'nb-grip'; el.appendChild(gripS);
      var stkBox = document.createElement('div'); stkBox.className = 'nb-stk';
      var st = stickerById(n.stickId);
      // 划线工具产物（源自 LINESTYLES）→ 描边色跟随画板强调色 accent
      if (st && st.id && st.id.indexOf('line-') === 0) { el.classList.add('nb-stk-line'); el.style.setProperty('--nb-stk', 'var(--accent)'); }
      var content = st ? buildStickerContent(st, n.w, n.h) : null;
      if (content) stkBox.appendChild(content);
      el.appendChild(stkBox);
      if (st && isRepeatLine(st)) el.classList.add('nb-stk-repeat');
    } else if (n.type === 'fields') {
      // 角色卡：结构化字段卡（带标签的 key-value 字段行）
      el.style.minHeight = (n.h || 180) + 'px';
      var grip = document.createElement('div'); grip.className = 'nb-grip'; el.appendChild(grip);
      var fb = document.createElement('div'); fb.className = 'nb-fields'; el.appendChild(fb);
      renderFields(el, n);
    } else if (n.type === 'gamecard') {
      // 引用游戏卡：照 index 主站的「竖版画廊卡」——顶部宽幅封面 + 下方标题/题材/描述
      el.style.height = (n.h || 214) + 'px';
      var grip2 = document.createElement('div'); grip2.className = 'nb-grip'; el.appendChild(grip2);
      var gc = document.createElement('div'); gc.className = 'nb-gc';
      var d = n.gameCardData || {};
      // 封面带（约 2.05:1 的宽幅横带，可内含中文/平台角标胶囊）
      var cover = document.createElement('div'); cover.className = 'nb-gc-cover';
      var badgeWrap = document.createElement('div'); badgeWrap.className = 'nb-gc-badges';
      var ch = d.hasChinese;
      if (ch === '有中文') badgeWrap.appendChild(tagChip('中文', 'accent'));
      else if (ch === '无中文') badgeWrap.appendChild(tagChip('无中文', 'muted'));
      (d.genre || []).slice(0, 2).forEach(function (t) { badgeWrap.appendChild(tagChip(t, 'plain')); });
      var plat = (d.platforms || []);
      var platTxt = plat.slice(0, 2).join(' ');
      if (platTxt) badgeWrap.appendChild(tagChip(platTxt, 'muted'));
      // 女主类型悬浮章（heroineType，位于封面左上，参照 index 的 card-heroine-tag）
      if (d.heroineType) {
        var hTag = document.createElement('div'); hTag.className = 'nb-gc-htag';
        hTag.textContent = d.heroineType; cover.appendChild(hTag);
      }
      cover.appendChild(badgeWrap);
      // 封面图 / 占位（占位层置于 badge/htag 之下，不覆盖它们）
      if (d.cover) {
        var coverImg = document.createElement('img'); coverImg.alt = ''; coverImg.src = d.cover;
        coverImg.addEventListener('error', function () { coverImg.remove(); });
        cover.appendChild(coverImg);
      } else {
        var ph = document.createElement('span'); ph.className = 'nb-gc-ph'; ph.textContent = '🎮';
        cover.appendChild(ph);
      }
      gc.appendChild(cover);
      // 下方正文区：标题 + 英名 + 两行描述
      var bodyArea = document.createElement('div'); bodyArea.className = 'nb-gc-body';
      var titleEl = document.createElement('div'); titleEl.className = 'nb-gc-title';
      titleEl.textContent = d.title || n.title || '未命名游戏'; bodyArea.appendChild(titleEl);
      var en = document.createElement('div'); en.className = 'nb-gc-en';
      en.textContent = d.englishName || ''; bodyArea.appendChild(en);
      var desc = document.createElement('div'); desc.className = 'nb-gc-desc';
      var descTxt = (d.description || '').replace(/\s+/g, ' ').trim();
      desc.textContent = descTxt || '（暂无简介）'; bodyArea.appendChild(desc);
      var release = document.createElement('div'); release.className = 'nb-gc-release';
      if (d.releaseDate) release.textContent = String(d.releaseDate).slice(0, 7);
      bodyArea.appendChild(release);
      gc.appendChild(bodyArea);
      el.appendChild(gc);
      // 竖版画廊卡为紧凑引用：不再附带可写备注区
    } else {
      var grip = document.createElement('div'); grip.className = 'nb-grip'; el.appendChild(grip);
      // 相纸家族（拍立得 / 相纸 / 胶片）：顶部一块真实图片，无图时给虚线占位；正文退到底部当手写说明
      if (PHOTO_VARIANTS.indexOf(n.variant) >= 0) {
        var media;
        if (n.img) {
          media = document.createElement('img'); media.className = 'nb-photo-img';
          media.alt = ''; media.src = n.img;
          media.addEventListener('error', function () { if (media.parentNode) media.parentNode.removeChild(media); });
        } else {
          media = document.createElement('div'); media.className = 'nb-photo-ph';
          media.textContent = '🖼';
        }
        el.appendChild(media);
      }
      var title = document.createElement('div');
      title.className = 'nb-title'; title.contentEditable = 'true';
      title.setAttribute('data-ph', '标题'); setHtml(title, n.title);
      el.appendChild(title);
      var body = document.createElement('div');
      body.className = 'nb-body'; body.contentEditable = 'true';
      body.setAttribute('data-ph', '写点什么…'); setHtml(body, n.body);
      el.appendChild(body);
      bindEdit(title, function () { n.title = title.innerHTML; markDirty('notes', n.id); scheduleSave(); });
      bindEdit(body, function () { n.body = body.innerHTML; markDirty('notes', n.id); scheduleSave(); });
    }

    // 文档：标题层级徽标
    if (n.level === 1) el.classList.add('lv1'); else if (n.level === 2) el.classList.add('lv2');
    var lvBadge = document.createElement('div'); lvBadge.className = 'nb-lv-badge';
    lvBadge.textContent = n.level === 1 ? 'H1' : (n.level === 2 ? 'H2' : '');
    el.appendChild(lvBadge);

    // 缩放手柄（所有类型均可调整大小）
    var rs = document.createElement('div'); rs.className = 'nb-resize'; el.appendChild(rs);
    bindResize(rs, el, n);

    // 进度章节色点（归属哪一章，颜色由 syncStageMarks 更新）
    var stdot = document.createElement('div'); stdot.className = 'nb-stdot'; el.appendChild(stdot);
    // 章节名标签（选中便签时随 .selected 显露，文本由 syncStageMarks 同步）
    var sttag = document.createElement('div'); sttag.className = 'nb-sttag'; el.appendChild(sttag);
    if (n.stageId) {
      var st0 = stageById(n.stageId);
      if (st0) {
        var sc0 = stageColor(stageIndex(st0.id));
        stdot.style.background = sc0; stdot.title = st0.name;
        sttag.textContent = st0.name; sttag.style.setProperty('--sc', sc0);
      }
    }
    if (n.stageId && stageById(n.stageId)) el.classList.add('has-stage');
    // 类型标签（kind）：左下角小色片，默认隐藏，有值才显
    var kindChip = document.createElement('div'); kindChip.className = 'nb-kind'; kindChip.style.display = 'none';
    el.appendChild(kindChip);
    if (n.kind) {
      var k0 = kindById(n.kind);
      if (k0) { kindChip.style.display = ''; kindChip.textContent = k0.label; kindChip.style.setProperty('--kc', k0.color); }
    }

    // 选择 / 拖动
    bindNotePointer(el, n);

    // ===== 模板专属交互 =====
    // ① 金句墙：给文字便签备一张「背面」，翻面写批注（正面 title/body 保留不动）
    if (n.type === 'text') {
      var back = document.createElement('div');
      back.className = 'nb-back';
      back.setAttribute('contenteditable', 'true');
      back.setAttribute('spellcheck', 'false');
      back.setAttribute('data-ph', '写下这句为什么戳中你…');
      back.textContent = '';
      back.innerHTML = n.annotation || '';
      back.addEventListener('input', function () {
        if (editSnap && !editPushed) { try { undoStack.push(editSnap); redoStack.length = 0; } catch (_) {} editPushed = true; editSnap = null; }
        if (back.textContent.trim() === '') back.innerHTML = '';      // 清空后恢复占位提示
        n.annotation = back.innerHTML; markDirty('notes', n.id); scheduleSave();
      });
      back.addEventListener('pointerdown', function (e) { e.stopPropagation(); });
      back.addEventListener('focus', function () { selectNote(n.id); editSnap = snap(); editPushed = false; });
      el.appendChild(back);
      // 背面右上角的「翻回正面」小按钮（只在翻开时出现）
      var flipBtn = document.createElement('button');
      flipBtn.type = 'button'; flipBtn.className = 'nb-flip-back';
      flipBtn.textContent = '↩'; flipBtn.title = '翻回正面';
      flipBtn.setAttribute('aria-label', '翻回正面');
      flipBtn.addEventListener('pointerdown', function (e) { e.stopPropagation(); e.preventDefault(); });
      flipBtn.addEventListener('click', function (e) { e.stopPropagation(); if (el.classList.contains('flipped')) flipNote(n.id); });
      el.appendChild(flipBtn);
      if (flipMode && isFlipTarget(n)) el.classList.add('nb-flipmode');
    }
    // ③ 通关清单：可勾选的条目直接带一个勾选钮 + 完成态划线
    if (modeOf() === 'checklist') {
      var cb = checklistStateOf(n);
      if (cb.checkable) {
        el.classList.add('nb-checkable');
        if (cb.done) el.classList.add('done');
        var cbtn = document.createElement('button');
        cbtn.type = 'button'; cbtn.className = 'nb-check';
        cbtn.textContent = cb.done ? '✓' : '';
        cbtn.title = cb.done ? '取消勾选' : '标记为已完成';
        cbtn.setAttribute('aria-label', cbtn.title);
        cbtn.addEventListener('pointerdown', function (e) { e.stopPropagation(); e.preventDefault(); });
        cbtn.addEventListener('click', function (e) { e.stopPropagation(); toggleChecklistNote(n.id); });
        el.appendChild(cbtn);
      }
    }

    noteEls[n.id] = el;
    return el;
  }
  function bindEdit(node, onVal) {
    node.addEventListener('input', function () {
      if (editSnap && !editPushed) { try { undoStack.push(editSnap); redoStack.length = 0; } catch (_) {} editPushed = true; editSnap = null; }
      if (node.textContent.trim() === '') node.innerHTML = '';   // 清空后显示占位符
      onVal(node.innerHTML);
    });
    node.addEventListener('pointerdown', function (e) { e.stopPropagation(); selectNote(node.closest('.nb-note').dataset.id); });
    node.addEventListener('focus', function () { selectNote(node.closest('.nb-note').dataset.id); editSnap = snap(); editPushed = false; });
    // 把“可编辑区 + 选区”缓存在便签元素上，供浮动工具条恢复选区
    function cacheSel() {
      var s = window.getSelection(); if (!s || !s.rangeCount) return;
      var rng = s.getRangeAt(0);
      var noteEl = node.closest('.nb-note');
      if (!noteEl.contains(rng.commonAncestorContainer)) return;
      var ed = document.activeElement;
      if (ed && noteEl.contains(ed) && ed.isContentEditable) { noteEl._ed = ed; noteEl._range = rng.cloneRange(); }
    }
    ['keyup', 'mouseup', 'touchend', 'select'].forEach(function (ev) { node.addEventListener(ev, cacheSel); });
  }
  function setHtml(node, v) {
    if (v && /<[a-z][\s\S]*>/i.test(v)) node.innerHTML = v;     // 富文本
    else node.textContent = v || '';                            // 旧数据纯文本兼容
  }
  function fontFamilyOf(id) {
    return ({ sans: '"PingFang SC","Microsoft YaHei",system-ui,sans-serif',
      serif: '"Songti SC","SimSun",Georgia,serif',
      kai: '"Kaiti SC","KaiTi",cursive',
      round: '"Yuanti SC","Hiragino Sans GB",sans-serif',
      mono: 'Consolas,Menlo,monospace',
      script: '"Xingkai SC","Comic Sans MS",cursive' })[id] || 'inherit';
  }
  // 选中便签的浮动工具条（只建一次，跟随选中便签定位在便签上方；便签卡片本身保持纯净）
  var floatbar = document.getElementById('floatbar');
  var fbBold = null, fbPin = null, fbStageSel = null, fbKindSel = null, fbFrame = null;
  var fbSizeMinus = null, fbSizePlus = null, fbSizeVal = null;
  var lineThickGroup = null, ltMinus = null, ltPlus = null, ltVal = null;   // 划线便签的独立线粗控制
  var colorGroup = null;   // 底色预设/自定义色板（模块级，applyNoteColor 也引用）
  // 实物挂件（贴在便签上的小物件）：id 与 CSS .nb-h-{id} 对应；ic 决定选择器里的迷你预览
  var HANGERS = [
    { id: 'none',   label: '无' },
    { id: 'tape',   label: '胶带' },
    { id: 'pin',    label: '图钉' },
    { id: 'clip',   label: '回形针' },
    { id: 'string', label: '麻绳' }
  ];
  var hangerPop = null, fbHanger = null;
  function buildFloatbar() {
    if (!floatbar) return;
    function stop(e) { e.stopPropagation(); }                 // 不触发画布平移
    function mkBtn(txt, tip, cls) { var b = document.createElement('button'); b.textContent = txt; b.title = tip; if (cls) b.className = cls; return b; }

    // 格式控件统一放进一个分组，图片便签时整体隐藏
    var fmtGroup = document.createElement('div');
    fmtGroup.className = 'nb-fb-group-format';
    fmtGroup.style.cssText = 'display:flex;align-items:center;gap:3px;';

    // 加粗
    fbBold = mkBtn('B', '加粗', 'nb-fb-b');
    fbBold.addEventListener('mousedown', function (e) { e.preventDefault(); });   // 保住选区
    fbBold.addEventListener('click', function (e) { stop(e); try { document.execCommand('bold'); } catch (_) {} syncDataSel(); });
    fmtGroup.appendChild(fbBold);

    // 字号：A⁻ / 数值 / A⁺（有选区 → 作用于选中文字；无选区 → 作用于整张便签基准字号）
    var sizeWrap = document.createElement('div'); sizeWrap.className = 'nb-fb-size';
    fbSizeMinus = document.createElement('button'); fbSizeMinus.textContent = 'A⁻'; fbSizeMinus.title = '缩小字号';
    fbSizeVal = document.createElement('span'); fbSizeVal.className = 'nb-fb-size-val'; fbSizeVal.title = '当前字号';
    fbSizePlus = document.createElement('button'); fbSizePlus.textContent = 'A⁺'; fbSizePlus.title = '放大字号';
    [fbSizeMinus, fbSizePlus].forEach(function (b) {
      b.addEventListener('mousedown', function (e) { e.preventDefault(); });   // 保住选区
      b.addEventListener('click', function (e) { stop(e); applyFontSize(nextSize(currentSize(), b === fbSizePlus ? 1 : -1)); });
    });
    sizeWrap.appendChild(fbSizeMinus); sizeWrap.appendChild(fbSizeVal); sizeWrap.appendChild(fbSizePlus);
    fmtGroup.appendChild(sizeWrap);

    // 字体
    var sel = document.createElement('select'); sel.title = '字体';
    FONTS.forEach(function (f) { var o = document.createElement('option'); o.value = f.id; o.textContent = f.label; sel.appendChild(o); });
    sel.addEventListener('pointerdown', stop);
    sel.addEventListener('change', function (e) { stop(e); withSel('fontName', fontFamilyOf(sel.value)); });
    fmtGroup.appendChild(sel);

    // 文字颜色
    var fc = document.createElement('input'); fc.type = 'color'; fc.title = '文字颜色'; fc.value = '#3a3340';
    fc.addEventListener('pointerdown', stop);
    fc.addEventListener('input', function (e) { stop(e); withSel('foreColor', fc.value); });
    var fcl = document.createElement('label'); fcl.appendChild(fc); fmtGroup.appendChild(fcl);

    // 标色（高亮背景）
    var hc = document.createElement('input'); hc.type = 'color'; hc.title = '标色'; hc.value = '#FFE9A8';
    hc.addEventListener('pointerdown', stop);
    hc.addEventListener('input', function (e) { stop(e); withSelHilite(hc.value); });
    var hcl = document.createElement('label'); hcl.appendChild(hc); fmtGroup.appendChild(hcl);

    // 清除格式
    var clr = mkBtn('清除', '清除格式', 'nb-fb-clear');
    clr.addEventListener('mousedown', function (e) { e.preventDefault(); });
    clr.addEventListener('click', function (e) {
      stop(e); restoreSel();
      try { document.execCommand('removeFormat'); } catch (_) {}
      try { document.execCommand('styleWithCSS', false, true); document.execCommand('hiliteColor', false, 'transparent'); } catch (_) {}
      syncDataSel();
    });
    fmtGroup.appendChild(clr);
    floatbar.appendChild(fmtGroup);

    // 元信息（始终可见，含图片便签）——只保留「章节」归类
    var metaGroup = document.createElement('div');
    metaGroup.className = 'nb-fb-group-meta';

    // 章节（进度分章）：把便签归到游戏进程的某一章
    fbStageSel = document.createElement('select'); fbStageSel.className = 'nb-stage-sel'; fbStageSel.title = '章节（进度分章）';
    fbStageSel.addEventListener('pointerdown', stop);
    fbStageSel.addEventListener('change', function (e) {
      stop(e); var n = selectedNote(); if (!n) return;
      pushHistory();
      n.stageId = fbStageSel.value || null;
      markDirty('notes', n.id);
      syncStageMarks();          // 色点 + 章节名标签一起同步
      scheduleSave(); syncModeMarks();
    });
    // 类型标签（kind）：给便签归一个轻量「类型」，供画布内筛选
    fbKindSel = document.createElement('select'); fbKindSel.className = 'nb-kind-sel'; fbKindSel.title = '类型标签（可按类型筛选）';
    fbKindSel.addEventListener('pointerdown', stop);
    var ko0 = document.createElement('option'); ko0.value = ''; ko0.textContent = '类型'; fbKindSel.appendChild(ko0);
    KINDS.forEach(function (k) { var o = document.createElement('option'); o.value = k.id; o.textContent = k.label; fbKindSel.appendChild(o); });
    fbKindSel.addEventListener('change', function (e) {
      stop(e); var n = selectedNote(); if (!n) return;
      pushHistory();
      n.kind = fbKindSel.value || '';
      markDirty('notes', n.id); syncKindMark(n); scheduleSave();
    });
    metaGroup.appendChild(fbKindSel);
    metaGroup.appendChild(fbStageSel);
    floatbar.appendChild(metaGroup);

    // 文字气泡「有框 / 无框」：给纯文本套 / 去一层卡片背景（装饰性变体不参与）
    var frameGroup = document.createElement('div');
    frameGroup.className = 'nb-fb-group-frame';
    frameGroup.style.cssText = 'display:none;align-items:center;gap:2px;';
    fbFrame = mkBtn('▢', '有框 / 无框：给文字套一层卡片背景', 'nb-fb-act');
    fbFrame.addEventListener('click', function (e) {
      stop(e); var n = selectedNote(); if (!n || !canFrame(n)) return;
      pushHistory();
      n.frame = !n.frame;
      var el = noteEls[n.id]; if (el) el.classList.toggle('nb-text-frame', !!n.frame);
      fbFrame.textContent = n.frame ? '▣' : '▢';
      markDirty('notes', n.id); scheduleSave(); positionFloatbar();
    });
    frameGroup.appendChild(fbFrame);
    floatbar.appendChild(frameGroup);

    // 划线便签专属：线粗 A⁻/A⁺（只改线带高度 h，不动长度 w）
    lineThickGroup = document.createElement('div');
    lineThickGroup.className = 'nb-fb-group-line thick';
    lineThickGroup.style.cssText = 'display:none;align-items:center;gap:3px;';
    var ltLabel = document.createElement('span');
    ltLabel.className = 'nb-fb-lt-label'; ltLabel.textContent = '线粗';
    ltLabel.title = '线条粗度（只变粗度，不变长度）';
    lineThickGroup.appendChild(ltLabel);
    ltMinus = document.createElement('button'); ltMinus.textContent = 'A⁻'; ltMinus.title = '变细';
    ltVal = document.createElement('span'); ltVal.className = 'nb-fb-size-val'; ltVal.title = '当前线粗';
    ltPlus = document.createElement('button'); ltPlus.textContent = 'A⁺'; ltPlus.title = '变粗';
    [ltMinus, ltPlus].forEach(function (b) {
      b.addEventListener('mousedown', function (e) { e.preventDefault(); });
      b.addEventListener('click', function (e) { stop(e); nudgeLineThickness(b === ltPlus ? 1 : -1); });
    });
    var ltWrap = document.createElement('div'); ltWrap.className = 'nb-fb-size nb-fb-lt-size';
    ltWrap.appendChild(ltMinus); ltWrap.appendChild(ltVal); ltWrap.appendChild(ltPlus);
    lineThickGroup.appendChild(ltWrap);
    floatbar.appendChild(lineThickGroup);

    // 分隔 + 图层（z-序）：置顶 / 上移一层 / 下移一层 / 置底
    var sep = document.createElement('span'); sep.className = 'nb-sep'; floatbar.appendChild(sep);

    var layerGroup = document.createElement('div');
    layerGroup.className = 'nb-fb-group-layer';
    layerGroup.style.cssText = 'display:flex;align-items:center;gap:2px;';
    function mkLayerBtn(svgInner, tip) {
      var b = document.createElement('button');
      b.className = 'nb-fb-act'; b.title = tip; b.innerHTML = svgInner;
      return b;
    }
    var svgFront = '<svg viewBox="0 0 24 24" aria-hidden="true" width="16" height="16"><rect x="4" y="7" width="16" height="4" rx="1" fill="currentColor"/><rect x="4" y="13" width="16" height="4" rx="1" fill="currentColor" opacity=".75"/><rect x="4" y="19" width="16" height="4" rx="1" fill="currentColor" opacity=".45"/><path d="M11 3l-3 4h6z" fill="currentColor" stroke="none"/></svg>';
    var svgBack = '<svg viewBox="0 0 24 24" aria-hidden="true" width="16" height="16"><rect x="4" y="1" width="16" height="4" rx="1" fill="currentColor" opacity=".45"/><rect x="4" y="7" width="16" height="4" rx="1" fill="currentColor" opacity=".75"/><rect x="4" y="13" width="16" height="4" rx="1" fill="currentColor"/><path d="M11 23l-3-4h6z" fill="currentColor" stroke="none"/></svg>';
    var svgUp = '<svg viewBox="0 0 24 24" aria-hidden="true" width="16" height="16"><path d="M6 11l6-6 6 6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 5v14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';
    var svgDown = '<svg viewBox="0 0 24 24" aria-hidden="true" width="16" height="16"><path d="M6 13l6 6 6-6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 5v14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';

    var bFront = mkLayerBtn(svgFront, '置顶：把选中便签/便签组放到最上层');
    bFront.addEventListener('click', function (e) { stop(e); moveSelectedLayer('front'); positionFloatbar(); });
    layerGroup.appendChild(bFront);
    var bUp = mkLayerBtn(svgUp, '上移一层');
    bUp.addEventListener('click', function (e) { stop(e); moveSelectedLayer('forward'); positionFloatbar(); });
    layerGroup.appendChild(bUp);
    var bDown = mkLayerBtn(svgDown, '下移一层');
    bDown.addEventListener('click', function (e) { stop(e); moveSelectedLayer('backward'); positionFloatbar(); });
    layerGroup.appendChild(bDown);
    var bBack = mkLayerBtn(svgBack, '置底：把选中便签/便签组放到最下层');
    bBack.addEventListener('click', function (e) { stop(e); moveSelectedLayer('back'); positionFloatbar(); });
    layerGroup.appendChild(bBack);
    floatbar.appendChild(layerGroup);

    // 便签底色：预设色板 + 自定义色 + 清除。修改后会写入 n.color 并实时应用。
    var NOTE_COLORS = ['#FFE7C2', '#FCE0E5', '#E6F0FF', '#F2E6FF', '#D6F2E3', '#FFF6B0', '#F4DCE0', '#DDEEF7'];
    colorGroup = document.createElement('div');
    colorGroup.className = 'nb-fb-group-color';
    colorGroup.style.cssText = 'display:flex;align-items:center;gap:2px;';
    NOTE_COLORS.forEach(function (c) {
      var s = document.createElement('button');
      s.className = 'nb-fb-swatch'; s.title = c;
      s.style.cssText = 'width:18px;height:18px;border-radius:6px;border:1px solid var(--nb-hairline);background:' + c + ';cursor:pointer;padding:0;';
      s.addEventListener('click', function (e) {
        stop(e); applyNoteColor(c);
      });
      colorGroup.appendChild(s);
    });
    var cc = document.createElement('input'); cc.type = 'color'; cc.title = '自定义底色'; cc.value = '#FFE7C2';
    cc.addEventListener('input', function (e) { stop(e); applyNoteColor(cc.value); });
    var ccl = document.createElement('label'); ccl.appendChild(cc); ccl.className = 'nb-fb-color';
    colorGroup.appendChild(ccl);
    var ccClear = document.createElement('button');
    ccClear.className = 'nb-fb-act'; ccClear.title = '清除自定义底色，恢复默认'; ccClear.textContent = '⌫';
    ccClear.style.cssText = 'font-size:.85rem;';
    ccClear.addEventListener('click', function (e) {
      stop(e); applyNoteColor(null);
    });
    colorGroup.appendChild(ccClear);
    floatbar.appendChild(colorGroup);

    // 实物挂件：点开选择器，给便签"贴"上一件小物件（胶带/图钉/回形针/麻绳）
    var hangerGroup = document.createElement('div');
    hangerGroup.className = 'nb-fb-group-hanger';
    hangerGroup.style.cssText = 'display:flex;align-items:center;gap:2px;position:relative;';
    fbHanger = mkBtn('📎', '实物挂件：胶带 / 图钉 / 回形针 / 麻绳', 'nb-fb-act');
    fbHanger.addEventListener('click', function (e) { stop(e); toggleHangerPop(); });
    hangerGroup.appendChild(fbHanger);

    hangerPop = document.createElement('div');
    hangerPop.className = 'nb-hanger-pop';
    HANGERS.forEach(function (h) {
      var b = document.createElement('button');
      b.className = 'nb-hanger-opt'; b.type = 'button';
      b.setAttribute('data-hanger', h.id);
      b.title = h.label;
      b.innerHTML = '<span class="nb-ho-prev nb-h-ic-' + h.id + '"><i></i></span><span>' + h.label + '</span>';
      b.addEventListener('click', function (e) { stop(e); applyHanger(h.id); });
      hangerPop.appendChild(b);
    });
    hangerGroup.appendChild(hangerPop);
    floatbar.appendChild(hangerGroup);

    // 分隔
    var sep2 = document.createElement('span'); sep2.className = 'nb-sep'; floatbar.appendChild(sep2);

    // 操作：固定 / 复制 / 删除
    fbPin = mkBtn('📍', '固定', 'nb-fb-act');
    fbPin.addEventListener('click', function (e) {
      stop(e); var n = selectedNote(); if (!n) return;
      n.pinned = !n.pinned;
      var el = noteEls[n.id]; if (el) el.classList.toggle('pinned', n.pinned);
      fbPin.textContent = n.pinned ? '📌' : '📍';
      markDirty('notes', n.id); scheduleSave();
    });
    floatbar.appendChild(fbPin);
    var cp = mkBtn('⧉', '复制', 'nb-fb-act');
    cp.addEventListener('click', function (e) { stop(e); duplicateNote(selectedId); });
    floatbar.appendChild(cp);
    var dl = mkBtn('🗑', '删除', 'nb-fb-act danger');
    dl.addEventListener('click', function (e) { stop(e); deleteNote(selectedId); });
    floatbar.appendChild(dl);

    // 整条工具条不触发画布平移
    floatbar.addEventListener('pointerdown', stop);
    // 点击工具条之外收起挂件选择器（工具条内部 pointerdown 已被 stop，不会冒泡到此）
    document.addEventListener('pointerdown', function (e) {
      if (!hangerPop || !hangerPop.classList.contains('show')) return;
      if (e.target.closest && e.target.closest('.nb-fb-group-hanger')) return;
      closeHangerPop();
    }, true);
  }
  function selectedNote() { return board.notes.find(function (n) { return n.id === selectedId; }); }
  function selEditors() {
    var el = noteEls[selectedId]; if (!el) return null;
    return { title: el.querySelector('.nb-title'), body: el.querySelector('.nb-body'), el: el };
  }
  function restoreSel() {
    var s = window.getSelection();
    // 当前已有活选区且焦点在选中便签内 → 直接用
    if (s && s.rangeCount && !s.getRangeAt(0).collapsed &&
        document.activeElement && document.activeElement.closest && document.activeElement.closest('.nb-note') === noteEls[selectedId]) return;
    var e = selEditors(); if (!e) return;
    var ed = e.el._ed || (e.title && e.title.isContentEditable ? e.title : e.body);
    if (!ed) return;
    ed.focus();
    if (e.el._range) { var s2 = window.getSelection(); s2.removeAllRanges(); s2.addRange(e.el._range); }
  }
  function syncDataSel() {
    var e = selEditors(); if (!e) return;
    var n = selectedNote(); if (!n) return;
    if (e.title) n.title = e.title.innerHTML;
    if (e.body) n.body = e.body.innerHTML;
    markDirty('notes', n.id);
    scheduleSave(); syncBold(); syncFontSize();
  }
  function withSel(cmd, val) {                  // styleWithCSS → 生成 <span style> 而非 <font face>，字体栈才生效
    restoreSel();
    try { document.execCommand('styleWithCSS', false, true); } catch (_) {}
    try { document.execCommand(cmd, false, val); } catch (_) {}
    syncDataSel();
  }
  function withSelHilite(val) {
    restoreSel();
    try { document.execCommand('styleWithCSS', false, true); } catch (_) {}
    try { document.execCommand('hiliteColor', false, val); } catch (_) { try { document.execCommand('backColor', false, val); } catch (_) {} }
    syncDataSel();
  }

  // ---------- 图层（z-序）控制：board.notes 数组顺序即 DOM 叠放顺序 ----------
  // 单张操作
  function stepForward(id) {
    var i = board.notes.findIndex(function (n) { return n.id === id; });
    if (i < 0 || i === board.notes.length - 1) return false;
    var tmp = board.notes[i + 1]; board.notes[i + 1] = board.notes[i]; board.notes[i] = tmp;
    return true;
  }
  function stepBackward(id) {
    var i = board.notes.findIndex(function (n) { return n.id === id; });
    if (i <= 0) return false;
    var tmp = board.notes[i - 1]; board.notes[i - 1] = board.notes[i]; board.notes[i] = tmp;
    return true;
  }
  // 多选：保留相对顺序，整体上下/前后移
  function moveSelectedLayer(dir) {
    var ids = (selectedIds && selectedIds.length ? selectedIds : (selectedId ? [selectedId] : []));
    if (!ids.length) return false;
    var positions = ids.map(function (id) { return board.notes.findIndex(function (n) { return n.id === id; }); })
      .filter(function (i) { return i >= 0; }).sort(function (a, b) { return a - b; });
    if (!positions.length) return false;
    var changed = false;
    if (dir === 'forward' || dir === 'backward') {
      // 单步：按对整体边界的判定决定是否需要反转遍历顺序，避免一次只移动最早/最晚的一张
      var sortedIds = positions.map(function (i) { return board.notes[i].id; });
      if (dir === 'forward') {
        // 已经是最后一张则不动；否则按从后往前的顺序 stepForward
        if (positions[positions.length - 1] === board.notes.length - 1) { toast('这张便签已经是最上层了', ''); return false; }
        sortedIds.reverse().forEach(function (id) { if (stepForward(id)) changed = true; });
      } else {
        // 已经在最前则不动；按从前往后 stepBackward
        if (positions[0] === 0) { toast('这张便签已经在最下层了', ''); return false; }
        sortedIds.forEach(function (id) { if (stepBackward(id)) changed = true; });
      }
    } else if (dir === 'front') {
      // 整体置顶：已经是最后位置则不动；否则把组取出，按原顺序追加到末尾
      if (positions[positions.length - 1] === board.notes.length - 1) { toast('已是最上层，无法再置顶', ''); return false; }
      pushHistory();
      var picked = positions.map(function (i) { return board.notes[i]; });
      // 倒序从后往前 splice，保持前面 index 不失效
      positions.slice().reverse().forEach(function (i) { board.notes.splice(i, 1); });
      picked.forEach(function (n) { board.notes.push(n); });
      changed = true;
    } else if (dir === 'back') {
      if (positions[0] === 0) { toast('已是最底层，无法再置底', ''); return false; }
      pushHistory();
      var picked2 = positions.map(function (i) { return board.notes[i]; });
      positions.slice().reverse().forEach(function (i) { board.notes.splice(i, 1); });
      picked2.reverse().forEach(function (n) { board.notes.unshift(n); });
      changed = true;
    }
    if (!changed) return false;
    if (dir === 'front' || dir === 'back') {} // pushHistory already done in branch
    else pushHistory();
    renderAll();
    // 重渲染会清掉 .selected，重新挂上选中态（视觉一致）
    if (selectedIds && selectedIds.length) setSelection(selectedIds);
    else if (selectedId) selectNote(selectedId);
    ids.forEach(function (id) { markDirty('notes', id); });   // 层级调整会改变 sort_order
    scheduleSave();
    return true;
  }

  // ---------- 便签底色：自定义 / 预设 / 清除 ----------
  // 对单张或多张选中便签设置/清除底色。null 表示清除自定义色（恢复主题默认卡片色）。
  function applyNoteColor(val) {
    var ids = (selectedIds && selectedIds.length ? selectedIds : (selectedId ? [selectedId] : []));
    if (!ids.length) return;
    pushHistory();
    var changed = false;
    ids.forEach(function (id) {
      var n = board.notes.find(function (x) { return x.id === id; });
      if (!n) return;
      var el = noteEls[id]; if (!el) return;
      if (val) {
        if (n.color !== val) { n.color = val; changed = true; }
        el.classList.add('nb-has-color');
        el.style.setProperty('--nb-note-color', val);
      } else {
        if ('color' in n) { delete n.color; changed = true; }
        el.classList.remove('nb-has-color');
        el.style.removeProperty('--nb-note-color');
      }
    });
    if (changed) {
      ids.forEach(function (id) { markDirty('notes', id); });
      scheduleSave();
    }
    // 同步自定义色 picker 的当前值
    var n = selectedNote();
    var cc = colorGroup && colorGroup.querySelector('input[type=color]');
    if (cc && n && n.color) cc.value = n.color;
  }

  // ---------- 实物挂件 ----------
  function toggleHangerPop() {
    if (!hangerPop) return;
    hangerPop.classList.contains('show') ? closeHangerPop() : openHangerPop();
  }
  function openHangerPop() {
    if (!hangerPop) return;
    syncHangerPop();
    hangerPop.classList.add('show');
  }
  function closeHangerPop() { if (hangerPop) hangerPop.classList.remove('show'); }
  function syncHangerPop() {
    if (!hangerPop) return;
    var n = selectedNote();
    var cur = n && n.hanger ? n.hanger : 'none';
    var opts = hangerPop.querySelectorAll('.nb-hanger-opt');
    for (var i = 0; i < opts.length; i++) {
      opts[i].classList.toggle('on', opts[i].getAttribute('data-hanger') === cur);
    }
  }
  // h 为 'none' 或挂件 id：写入选中便签并即时更新 DOM（可撤销）
  function applyHanger(h) {
    var ids = (selectedIds && selectedIds.length ? selectedIds : (selectedId ? [selectedId] : []));
    if (!ids.length) return;
    pushHistory();
    var changed = false;
    ids.forEach(function (id) {
      var n = board.notes.find(function (x) { return x.id === id; });
      if (!n) return;
      var next = (h === 'none' ? null : h);
      if ((n.hanger || null) !== next) { n.hanger = next; changed = true; }
      syncHanger(noteEls[id], n);
    });
    if (changed) {
      ids.forEach(function (id) { markDirty('notes', id); });
      scheduleSave();
    }
    syncHangerPop();
  }

  // ---------- 字号控制 ----------
  function liveSelEditor() {                    // 选中便签内、且落在同一可编辑区（标题或正文）的非折叠文字选区
    var s = window.getSelection(); if (!s || !s.rangeCount) return null;
    var r = s.getRangeAt(0); if (r.collapsed) return null;
    var el = noteEls[selectedId]; if (!el) return null;
    var a = r.commonAncestorContainer;
    var node = a.nodeType === 1 ? a : a.parentElement;
    if (!node || !el.contains(node)) return null;
    return node.closest('.nb-title, .nb-body');
  }
  function hasLiveSel() { return !!liveSelEditor(); }
  function currentSize() {
    var ed = liveSelEditor();
    if (ed) {
      var a = window.getSelection().getRangeAt(0).commonAncestorContainer;
      var node = a.nodeType === 1 ? a : a.parentElement;
      var fs = parseFloat(window.getComputedStyle(node || ed).fontSize);
      if (fs) return fs;
    }
    var n = selectedNote();
    return (n && n.baseSize) || SIZE_DEFAULT;
  }
  function nextSize(cur, dir) {
    if (dir > 0) {
      for (var i = 0; i < SIZE_STEPS.length; i++) if (SIZE_STEPS[i] > cur + 0.5) return SIZE_STEPS[i];
      return SIZE_MAX;
    }
    for (var j = SIZE_STEPS.length - 1; j >= 0; j--) if (SIZE_STEPS[j] < cur - 0.5) return SIZE_STEPS[j];
    return SIZE_MIN;
  }
  function stripFontSize(root) {                // 清理旧字号，避免反复叠加嵌套 <span>
    if (root.nodeType !== 1) return;
    if (root.style && root.style.fontSize) root.style.fontSize = '';
    if (root.tagName === 'FONT') root.removeAttribute('size');
    if ((root.tagName === 'SPAN' || root.tagName === 'FONT') && !root.getAttribute('style')) {
      var p = root.parentNode; if (!p) return;
      while (root.firstChild) p.insertBefore(root.firstChild, root);
      p.removeChild(root);
      return;
    }
    Array.prototype.slice.call(root.childNodes).forEach(stripFontSize);
  }
  function setBaseSize(px) {                    // 整张便签基准字号（写在 --nb-fs 上，标题按比例联动）
    var n = selectedNote(); if (!n) return;
    n.baseSize = px;
    var el = noteEls[n.id];
    if (el) el.style.setProperty('--nb-fs', px + 'px');
    markDirty('notes', n.id);
    scheduleSave();
  }
  function applyFontSize(px) {
    var n = selectedNote(); if (!n) return;
    if (hasLiveSel()) {
      restoreSel();
      var s = window.getSelection();
      if (!s || !s.rangeCount) return;
      var r = s.getRangeAt(0);
      if (r.collapsed) { setBaseSize(px); syncFontSize(); return; }
      try {
        var frag = r.extractContents();
        stripFontSize(frag);
        var span = document.createElement('span');
        span.style.fontSize = px + 'px';
        span.appendChild(frag);
        r.insertNode(span);
        var nr = document.createRange(); nr.selectNodeContents(span);
        s.removeAllRanges(); s.addRange(nr);
        var el = noteEls[n.id]; if (el) el._range = nr.cloneRange();   // 保持选区，可连续点 A⁺
        syncDataSel();
      } catch (e) { setBaseSize(px); }
      markDirty('notes', n.id);
      scheduleSave();
    } else {
      setBaseSize(px);
    }
    syncFontSize();
  }
  function syncFontSize() {
    if (!fbSizeVal) return;
    var cur = currentSize();
    fbSizeVal.textContent = String(Math.round(cur));
    if (fbSizeMinus) fbSizeMinus.disabled = cur <= SIZE_MIN + 0.5;
    if (fbSizePlus) fbSizePlus.disabled = cur >= SIZE_MAX - 0.5;
  }
  var fsSyncRAF = 0;
  function scheduleSyncFontSize() {
    if (fsSyncRAF) return;
    fsSyncRAF = requestAnimationFrame(function () { fsSyncRAF = 0; syncFontSize(); });
  }
  function syncBold() {
    var on = false;
    try { var s = window.getSelection(); if (s && s.queryCommandState) on = s.queryCommandState('bold'); } catch (_) {}
    if (fbBold) fbBold.classList.toggle('on', !!on);
  }
  function fillStageOptions() {
    if (!fbStageSel) return;
    var cur = fbStageSel.value;
    fbStageSel.innerHTML = '';
    var o0 = document.createElement('option'); o0.value = ''; o0.textContent = '章节：未分章'; fbStageSel.appendChild(o0);
    (board.stages || []).forEach(function (s, i) {
      var o = document.createElement('option'); o.value = s.id;
      o.textContent = '📖 ' + s.name;
      fbStageSel.appendChild(o);
    });
    fbStageSel.value = cur;
  }
  // 是否为「固定粗度」的横向线带（划线工具产物，带 band）
  function isBandLineNote(n) {
    if (!n || n.type !== 'sticker' || !n.stickId) return false;
    var st = lineStyleById(n.stickId);
    return !!st && !!st.band;
  }
  // 更新线带 note 的实际尺寸（改粗度只动 h；也可由拖角缩放调整体）
  function applyLineNoteSize(n) {
    if (!noteEls[n.id]) return;
    var el = noteEls[n.id];
    el.style.height = n.h + 'px';
    el.style.minHeight = n.h + 'px';
    el.style.width = n.w + 'px';
    el.style.setProperty('--nb-stk-w', n.w + 'px');
    el.style.setProperty('--nb-stk-h', n.h + 'px');
    var st = stickerById(n.stickId);
    refreshRepeatSvg(el, st, n.w, n.h);          // repeat 线随尺寸重排单元
  }
  function syncLineThickVal() {
    if (ltVal) ltVal.textContent = '—';
  }
  function nudgeLineThickness(dir) {
    var n = selectedNote(); if (!isBandLineNote(n)) return;
    pushHistory();
    var st = lineStyleById(n.stickId);
    // 线带高 = 粗度：以当前高度为基准增减；带形线初始高度就是 band
    var base = st ? st.band : 60;
    var step = Math.max(4, Math.round((n.h || base) * 0.24));
    var lo = st && st.minBand ? st.minBand : 14;   // A⁻ 可调到的最细带高（允许更细）
    var hi = 300;
    var next = (n.h || base) + dir * step;
    n.h = Math.round(clamp(next, lo, hi));
    applyLineNoteSize(n);
    renderClusters();
    markDirty('notes', n.id);
    scheduleSave();
    positionFloatbar();
  }
  function showFloatbar() {
    var n = selectedNote(); if (!n || !floatbar) { hideFloatbar(); return; }
    floatbar.classList.add('show');
    floatbar.classList.toggle('is-image', n.type === 'image' || n.type === 'sticker' || n.type === 'gamecard');
    if (fbPin) fbPin.textContent = n.pinned ? '📌' : '📍';
    fillStageOptions();
    if (fbStageSel) fbStageSel.value = n.stageId || '';
    if (fbKindSel) fbKindSel.value = n.kind || '';
    // 有框/无框：只有可加框的文字便签才显示这个开关
    if (fbFrame) {
      var fg = floatbar.querySelector('.nb-fb-group-frame');
      if (fg) fg.style.display = canFrame(n) ? 'flex' : 'none';
      fbFrame.textContent = n.frame ? '▣' : '▢';
    }
    // 划线便签（带形/固定粗度类）→ 显示独立的「线粗」步进
    var isBandLine = isBandLineNote(n);
    if (lineThickGroup) { lineThickGroup.style.display = isBandLine ? 'flex' : 'none'; }
    if (isBandLine) syncLineThickVal();
    // 自定义底色 picker 与当前 n.color 同步
    var cc = floatbar.querySelector('.nb-fb-group-color input[type=color]');
    if (cc) cc.value = n.color || '#FFE7C2';
    syncFontSize();
    syncHangerPop();
    closeHangerPop();          // 换选中即收起挂件选择器，避免残留
    positionFloatbar();
  }
  function hideFloatbar() { if (floatbar) floatbar.classList.remove('show'); closeHangerPop(); }
  function positionFloatbar() {
    if (!floatbar || !floatbar.classList.contains('show')) return;
    var n = selectedNote(); if (!n) { hideFloatbar(); return; }
    var scale = board.cam.scale;
    var left = board.cam.x + (n.x || 0) * scale;
    var top = board.cam.y + (n.y || 0) * scale;
    var w = (n.w || 200) * scale, h = (n.h || 130) * scale;
    var bw = floatbar.offsetWidth, bh = floatbar.offsetHeight;
    var tx = clamp(left + w / 2 - bw / 2, 8, window.innerWidth - bw - 8);
    var ty = top - bh - 12;
    if (ty < 56 + 8) ty = top + h + 12;          // 上方空间不足则置于便签下方
    floatbar.style.left = tx + 'px';
    floatbar.style.top = ty + 'px';
  }

  // ---------- 便签交互（拖动 / 选择 / 缩放） ----------
  function bindNotePointer(el, n) {
    var state = 'idle';            // idle | pending | dragging
    var sx = 0, sy = 0, ox = 0, oy = 0, raf = 0, pid = null;
    var TH = 6;                    // 拖拽阈值（屏幕像素）：区分"单击选中"与"拖动"
    // 拖动惯性：按水平速度给便签一个轻微倾斜（甩得快 → 倾得多），松手回正
    var tilt = 0, vx = 0, lastX = 0, lastT = 0;
    function tiltSuffix() { return tilt ? ' rotate(' + tilt.toFixed(2) + 'deg)' : ''; }
    // 悬停便签 → 高亮与它相连的线（思维导图）
    el.addEventListener('mouseenter', function () { hoverNoteId = n.id; highlightLinksFor(); });
    el.addEventListener('mouseleave', function () { if (hoverNoteId === n.id) { hoverNoteId = null; highlightLinksFor(); } });

    function onWinUp(e) { if (!e || e.pointerId === pid) finish(); }

    function onDown(e) {
      var t = e.target;
      if (t.closest && t.closest('.nb-resize')) return;   // 缩放手柄自行处理
      if (t.classList && t.classList.contains('nb-img')) return;
      // 金句墙 · 翻面模式：点文字便签正面 → 翻到背面写批注（背面编辑时不再翻）
      if (flipMode && isFlipTarget(n) && !el.classList.contains('flipped')) {
        e.stopPropagation();
        selectNote(n.id);
        flipNote(n.id);
        hideFloatbar();                        // 翻面写批注时收起浮动条，别挡住背面
        return;
      }
      e.stopPropagation();                       // 阻止冒泡到画布平移
      selectNote(n.id);                          // 点便签即选中（显示工具栏）
      if (n.pinned) return;                      // 固定便签不可拖动
      if (!t.closest || !t.closest('.nb-grip')) return;   // 仅顶部把手可拖动；正文用于编辑/选中文字
      state = 'pending';
      sx = e.clientX; sy = e.clientY; ox = n.x; oy = n.y; pid = e.pointerId;
      tilt = 0; vx = 0; lastX = e.clientX; lastT = e.timeStamp || performance.now();
      window.addEventListener('pointerup', onWinUp);
      window.addEventListener('pointercancel', onWinUp);
    }

    function onMove(e) {
      if (state === 'idle' || e.pointerId !== pid) return;
      if (state === 'pending') {
        if (Math.abs(e.clientX - sx) + Math.abs(e.clientY - sy) < TH) return;
        // 超过阈值 → 正式进入拖动
        state = 'dragging';
        el.classList.add('dragging');
        if (world) world.classList.add('nb-lift');  // 景深：拖动时其余再退一档，手里这张更跳
        pushHistory();                              // 拖动前记录，便于撤销
        try { el.setPointerCapture(pid); } catch (_) {}
        afterNoteDragStart(n);                      // 时间线：冻结分段判定基准
        // 拖动优先：若从可编辑区发起，先取消文本焦点，避免误选文字
        if (document.activeElement && document.activeElement.isContentEditable) {
          try { document.activeElement.blur(); } catch (_) {}
        }
        e.preventDefault();
      }
      // 速度采样（px/ms）→ 目标倾角，做一次低通滤波避免逐帧抖动
      var now = e.timeStamp || performance.now();
      var dt = now - lastT;
      if (dt > 0 && dt < 120) {
        var inst = (e.clientX - lastX) / dt;
        vx = vx * 0.72 + inst * 0.28;
        var target = clamp(vx * 5, -4.5, 4.5);
        tilt = tilt * 0.7 + target * 0.3;
      }
      lastX = e.clientX; lastT = now;
      n.x = ox + (e.clientX - sx) / board.cam.scale;
      n.y = oy + (e.clientY - sy) / board.cam.scale;
      if (modeOf() === 'mindmap') {
        // 思维导图下不抢吸附，连线更自由
      } else if (isTimeline()) {
        clearGuides();                              // 时间线：参考线让位给阶段带高亮
        afterNoteMove(n);
      } else {
        var al = computeAlign(n);
        if (al.has) { n.x += al.dx; n.y += al.dy; drawGuides(al.lines, al.bb); } else { clearGuides(); }
      }
      if (!raf) raf = requestAnimationFrame(function () {
        el.style.transform = noteTransform(n) + tiltSuffix(); raf = 0;
        positionFloatbar();
      });
    }

    function onUp(e) {
      if (state === 'idle') return;
      if (e && e.pointerId !== pid) return;
      finish();
    }

    function finish() {
      var wasDragging = (state === 'dragging');
      state = 'idle'; pid = null;
      el.classList.remove('dragging');
      if (world) world.classList.remove('nb-lift');   // 景深：抬起即恢复层次
      if (raf) { cancelAnimationFrame(raf); raf = 0; }
      if (wasDragging) {
        // 先摘掉 dragging（恢复 transform 过渡），再把倾角归零 → 自然回正
        el.style.transform = noteTransform(n) + tiltSuffix();
        tilt = 0;
        requestAnimationFrame(function () { el.style.transform = noteTransform(n); });
        clearGuides();
        renderClusters();
        renderModeLayer();
        afterNoteDragEnd(n);                 // 时间线跨段改归属 / 旅程站点吸附轨道
        requestMiniUpdate();
        markDirty('notes', n.id);
        scheduleSave();
      }
      window.removeEventListener('pointerup', onWinUp);
      window.removeEventListener('pointercancel', onWinUp);
    }

    // 捕获阶段接管 pointerdown：先于标题/正文等子元素的 listener 判定是否拖拽
    el.addEventListener('pointerdown', onDown, true);
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerup', onUp);
    el.addEventListener('pointercancel', onUp);
  }

  function bindResize(handle, el, n) {
    handle.addEventListener('pointerdown', function (e) {
      e.stopPropagation();
      pushHistory();                       // 缩放前记录，便于撤销
      var sx = e.clientX, sy = e.clientY, ow = n.w || 200, oh = (n.h || (n.type === 'text' ? 90 : 130));
      var ratio = oh / ow;                 // 图片等比缩放
      // 连续重复线（波浪/折线/点虚线）：拖角=只拉长，粗度不变（厚度只由 A⁻/A⁺ 调节）
      var isRepLine = !!(n.type === 'sticker' && el.classList.contains('nb-stk-repeat'));
      var raf = 0;
      try { handle.setPointerCapture(e.pointerId); } catch (_) {}
      el.classList.add('resizing');
      function mv(ev) {
        var dw = (ev.clientX - sx) / board.cam.scale;
        var dh = (ev.clientY - sy) / board.cam.scale;
        if (!raf) raf = requestAnimationFrame(function () {
          // 贴纸是纯点缀，允许缩得很小；图片/游戏卡保留可读下限
          var minW = (n.type === 'sticker') ? 44 : 120;
          var nw = Math.max(minW, ow + dw);
          n.w = nw;
          if (isRepLine) { n.h = oh; }                          // 只拉长，不动粗度
          else if (n.type === 'image') n.h = Math.max(100, nw * ratio);
          else if (n.type === 'gamecard') n.h = Math.max(140, Math.round(nw / (n.ar || ratio)));
          else if (n.type === 'sticker') n.h = Math.max(32, Math.round(nw * (n.ar || 1)));
          else n.h = Math.max(90, oh + dh);
          el.style.width = n.w + 'px';
          el.style.minHeight = n.h + 'px';
          if (n.type === 'image') el.style.height = n.h + 'px';
          else if (n.type === 'gamecard') el.style.height = n.h + 'px';
          else if (n.type === 'sticker') { el.style.height = n.h + 'px'; el.style.setProperty('--nb-stk-w', n.w + 'px'); el.style.setProperty('--nb-stk-h', n.h + 'px'); refreshRepeatSvg(el, stickerById(n.stickId), n.w, n.h); }
          raf = 0;
          positionFloatbar();
        });
      }
      function up() {
        if (raf) cancelAnimationFrame(raf);
        handle.removeEventListener('pointermove', mv);
        handle.removeEventListener('pointerup', up);
        handle.removeEventListener('pointercancel', up);
        el.classList.remove('resizing');
        renderClusters();
        renderModeLayer();
        requestMiniUpdate();
        markDirty('notes', n.id);
        scheduleSave();
      }
      handle.addEventListener('pointermove', mv);
      handle.addEventListener('pointerup', up);
      handle.addEventListener('pointercancel', up);
    });
  }

  function selectNote(id) {
    selectedId = id;
    selectedIds = [id];
    editSnap = null; editPushed = false;          // 切换便签时重置编辑快照，避免跨便签串味
    Object.keys(noteEls).forEach(function (k) { noteEls[k].classList.toggle('selected', k === id); });
    if (world) world.classList.add('nb-focus');    // 景深：焦点这张提亮，其余轻退
    hideClusterBar();
    showFloatbar();
    highlightLinksFor();                           // 选中一张 → 点亮它的连线
    maybeLinkOnSelect(id);
  }
  function deselect() {
    selectedId = null;
    selectedIds = [];
    editSnap = null; editPushed = false;
    Object.keys(noteEls).forEach(function (k) { noteEls[k].classList.remove('selected'); });
    if (world) world.classList.remove('nb-focus');
    hideFloatbar();
    hideClusterBar();
    highlightLinksFor();
  }

  // ---------- 增 / 删 / 改 ----------
  function addNote(type, opts) {
    opts = opts || {};
    var c = screenToWorld(viewport.clientWidth / 2, viewport.clientHeight / 2);
    var base = { id: uid(), x: Math.round(c.x - 100), y: Math.round(c.y - 65), type: type, pinned: false, createdAt: Date.now() };
    if (type === 'sticky') { base.w = 210; base.h = 140; base.title = ''; base.body = ''; }
    else if (type === 'text') {
      base.w = 240; base.h = 90; base.title = ''; base.body = '';
      // 文字分两种：纯文本（无底） / 文字气泡（卡片底）。气泡由 frame=true 表达。
      base.frame = opts.frame ? true : false;
      // 清单模式「加一条」：直接带上未勾选的方框，落笔即成待办
      if (opts.checkable) { base.body = '☐ '; base.variant = 'card'; }
    }
    else if (type === 'image') { base.w = 220; base.h = 170; base.img = ''; }
    else if (type === 'fields') { base.w = 300; base.h = 200; base.fields = []; }
    // 模式专属默认值
    if (modeOf() === 'journal') base.date = journalFilter || dateStr(new Date());
    if (modeOf() === 'character' && type === 'fields') addFieldNoteDefault(base);
    pushHistory();
    board.notes.push(base);
    var el = buildNote(base); world.appendChild(el); dropIn(el, base);
    renderClusters();
    updateEmpty(); updateCount();
    selectNote(base.id);
    if (type === 'image') { pendingImageId = base.id; imgInput.click(); }
    else if (type === 'fields') { var f0 = el.querySelector('.nb-fl'); if (f0) setTimeout(function () { f0.focus(); }, 30); }
    else { var t = $('.nb-title', el) || $('.nb-body', el); if (t) setTimeout(function () { t.focus(); }, 30); }
    if (modeOf() === 'document' && docFlow) reflowDoc();
    markDirty('notes', base.id);
    scheduleSave();
  }
  var pendingImageId = null;
  function duplicateNote(id) {
    var src = board.notes.find(function (n) { return n.id === id; }); if (!src) return;
    var copy = JSON.parse(JSON.stringify(src));
    copy.id = uid(); copy.x += 24; copy.y += 24;
    pushHistory();
    board.notes.push(copy);
    var el = buildNote(copy); world.appendChild(el); dropIn(el, copy);
    renderClusters();
    updateEmpty(); updateCount(); selectNote(copy.id);
    markDirty('notes', copy.id); scheduleSave();
  }
  // —— 会话级「撤销删除」：便签被删后短暂可一键还原（人性化防误删）——
  var _undoNote = null, _undoNoteTimer = null, _undoEl = null;
  // 带按钮的轻提示（材质复用 .nb-toast，仅当前删除用，一次只存在一个）
  function undoToast(msg, actionText, onAction) {
    if (!toastWrap) return;
    if (_undoEl && _undoEl.parentNode) { _undoEl.parentNode.removeChild(_undoEl); _undoEl = null; }
    if (_undoNoteTimer) { clearTimeout(_undoNoteTimer); _undoNoteTimer = null; }
    var t = document.createElement('div');
    t.className = 'nb-toast nb-undo';
    t.innerHTML = '<span class="nb-toast-msg">' + esc(msg) + '</span>' +
      '<button type="button" class="nb-undo-btn">' + esc(actionText || '撤销') + '</button>';
    toastWrap.appendChild(t); _undoEl = t;
    var btn = t.querySelector('.nb-undo-btn');
    var dismiss = function () { t.classList.remove('show'); setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); if (_undoEl === t) _undoEl = null; }, 240); };
    if (btn) btn.addEventListener('click', function (e) { e.stopPropagation(); if (onAction) onAction(); dismiss(); });
    requestAnimationFrame(function () { t.classList.add('show'); });
    var tm = setTimeout(function () { if (_undoEl === t) _undoEl = null; if (_undoNote) _undoNote = null; dismiss(); }, 4500);
    _undoNoteTimer = tm;
  }
  function restoreDeleted() {
    var note = _undoNote; _undoNote = null;
    if (_undoNoteTimer) { clearTimeout(_undoNoteTimer); _undoNoteTimer = null; }
    if (!note) return;
    if (board.notes.some(function (n) { return n.id === note.id; })) return;
    pushHistory();
    board.notes.push(note);
    var el = buildNote(note); if (el) { world.appendChild(el); dropIn(el, note); }
    renderClusters(); renderModeLayer(); updateEmpty(); updateCount();
    selectNote(note.id); markDirty('notes', note.id); scheduleSave();
  }
  function deleteNote(id) {
    var i = board.notes.findIndex(function (n) { return n.id === id; }); if (i < 0) return;
    pushHistory();
    var removed = board.notes[i];
    board.notes.splice(i, 1);
    // 数据层立刻删除；DOM 层留着「揉纸飘走」动画跑完再摘除
    var el = noteEls[id];
    if (el) {
      delete noteEls[id];
      crushOut(el, removed, function () { if (el.parentNode) el.parentNode.removeChild(el); });
    }
    if (selectedId === id) deselect();
    deleteLinksOf(id);
    markDel('notes', id);
    renderClusters(); renderModeLayer();
    updateEmpty(); updateCount(); scheduleSave();
    // 提供撤销入口
    if (_undoNoteTimer) { clearTimeout(_undoNoteTimer); _undoNoteTimer = null; }
    _undoNote = removed;
    undoToast('已删除便签', '撤销', restoreDeleted);
  }
  // ---------- 画布手势（平移 / 缩放 / 捏合） ----------
  var panning = false, panSX = 0, panSY = 0, panOX = 0, panOY = 0, panRAF = 0;
  var pointers = {};
  var pinch = null;

  viewport.addEventListener('pointerdown', function (e) {
    if (lineArmed) {                          // 划线待画态：落在便签上则退出待画，落在空处开始划线
      if (e.target.closest && e.target.closest('.nb-note')) { disarmLine(); return; }
      if (Object.keys(pointers).length === 0) { linePointerDown(e); return; }
    }
    if (e.target.closest('.nb-note')) return;     // 便签自己处理
    pointers[e.pointerId] = { x: e.clientX, y: e.clientY };
    if (Object.keys(pointers).length === 2) {
      // 第二指落下：从框选切到双指捏合
      panning = false; cancelMarquee();
      var ids2 = Object.keys(pointers);
      var a2 = pointers[ids2[0]], b2 = pointers[ids2[1]];
      pinch = { dist: dist(a2, b2), scale: board.cam.scale, cx: (a2.x + b2.x) / 2, cy: (a2.y + b2.y) / 2 };
      return;
    }
    if (selMode) { startMarquee(e); return; }    // 框选模式：单指 = 框选
    deselect();
    panning = true; panSX = e.clientX; panSY = e.clientY; panOX = board.cam.x; panOY = board.cam.y;
    viewport.classList.add('panning');
    viewport.setPointerCapture(e.pointerId);
  });
  viewport.addEventListener('pointermove', function (e) {
    if (lineDragging) { linePointerMove(e); return; }
    if (pointers[e.pointerId]) { pointers[e.pointerId].x = e.clientX; pointers[e.pointerId].y = e.clientY; }
    if (marqueeState) { moveMarquee(e); return; }
    if (pinch && Object.keys(pointers).length >= 2) {
      var ids = Object.keys(pointers);
      var a = pointers[ids[0]], b = pointers[ids[1]];
      var d = dist(a, b);
      var ns = clamp(pinch.scale * (d / pinch.dist), ZOOM_MIN, ZOOM_MAX);
      var r = viewport.getBoundingClientRect();
      var cx = (a.x + b.x) / 2 - r.left, cy = (a.y + b.y) / 2 - r.top;   // 当前双指中点作锚点
      var oldScale = board.cam.scale;
      var wx = (cx - board.cam.x) / oldScale, wy = (cy - board.cam.y) / oldScale;
      board.cam.x = cx - wx * ns;
      board.cam.y = cy - wy * ns;
      board.cam.scale = ns; applyCam();
      return;
    }
    if (!panning) return;
    board.cam.x = panOX + (e.clientX - panSX);
    board.cam.y = panOY + (e.clientY - panSY);
    if (!panRAF) panRAF = requestAnimationFrame(function () { applyCam(); panRAF = 0; });
  });
  function endPointer(e) {
    if (lineDragging) { linePointerUp(e); }
    if (marqueeState && marqueeState.pid === e.pointerId) { endMarquee(e); }
    delete pointers[e.pointerId];
    if (pinch && Object.keys(pointers).length < 2) { pinch = null; markDirty('boards', board.id); scheduleSave(); }
    if (Object.keys(pointers).length === 0) {
      panning = false; viewport.classList.remove('panning');
      if (panRAF) { cancelAnimationFrame(panRAF); panRAF = 0; }
      markDirty('boards', board.id);
      scheduleSave();
    }
  }
  viewport.addEventListener('pointerup', endPointer);
  viewport.addEventListener('pointercancel', function (e) {
    if (marqueeState && marqueeState.pid === e.pointerId) { cancelMarquee(); return; }
    endPointer(e);
  });
  viewport.addEventListener('wheel', function (e) {
    if (e.target.closest('.nb-note')) return;
    e.preventDefault();
    var factor = e.deltaY < 0 ? 1.12 : 1 / 1.12;
    zoomAt(factor, e.clientX, e.clientY);
  }, { passive: false });
  function dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }

  // ---------- 顶栏 / 工具条 ----------
  // ✎文字：点一下弹出两种文字——纯文本（无底自由文字） / 文字气泡（卡片底）
  var textChooserEl = null, textChooserShown = false;
  function textChooserHTML() {
    return '<div class="nb-txc" role="menu">'
      + '<div class="nb-txc-title">添加文字</div>'
      + '<button class="nb-txc-item" data-frame="0" role="menuitem">'
      +   '<span class="nb-txc-ico nb-txc-plain">✎</span>'
      +   '<span class="nb-txc-txt"><b>纯文本</b><em>自由摆放的文字，无底色</em></span>'
      + '</button>'
      + '<button class="nb-txc-item" data-frame="1" role="menuitem">'
      +   '<span class="nb-txc-ico nb-txc-bub">✎</span>'
      +   '<span class="nb-txc-txt"><b>文字气泡</b><em>带卡片底色的一句话/引用</em></span>'
      + '</button>'
      + '</div>';
  }
  function closeTextChooser() {
    if (!textChooserEl || !textChooserShown) return;
    textChooserEl.classList.remove('show'); textChooserShown = false;
  }
  function openTextChooser() {
    disarmLine();
    if (!textChooserEl) {
      textChooserEl = document.createElement('div');
      textChooserEl.className = 'nb-txc-wrap';
      textChooserEl.innerHTML = textChooserHTML();
      textChooserEl.addEventListener('click', function (e) {
        e.stopPropagation();
        var item = e.target.closest && e.target.closest('.nb-txc-item');
        if (!item) return;                                   // 面板留白点击不关
        closeTextChooser();
        addNote('text', { frame: item.getAttribute('data-frame') === '1' });
      });
      document.body.appendChild(textChooserEl);
      // 点击画布其它区域 / 滚动关闭（pointerdown 比 click 更快，避免误触发）
      viewport.addEventListener('pointerdown', function (e) { if (!textChooserEl.contains(e.target)) closeTextChooser(); });
      window.addEventListener('scroll', closeTextChooser, true);
    }
    textChooserEl.classList.add('show'); textChooserShown = true;
  }
  // =====================================================================
  // 划线工具（线条样式集）：不是贴纸，而是"拖拽画线、松手定稿"。
  // 每条同贴纸一样是内联 SVG（viewBox 200x200，currentColor 描边）。
  // isDot 类（点划线等）在预览里用辅助端点线提示拖动方向。
  // =====================================================================
  // 每类：par='none' 横向带形线（stroke 随 note 高度伸缩，可单独调粗度）；
  //      band=默认线带高度(world px)，拖拽划线时高度固定=band，宽度=拖拽横向长度 → 只拉长不变粗
  // 手绘圈(scribble) 用 par='xMidYMid meet'（无 band）→ 保持方形两向缩放，粗细随大小等比。
  // rep: wave|zig|dash → “连续重复”线：拉长=重复更多起伏/间断，单元不变形（见 makeRepeatSVGString）。
  var LINESTYLES = [
    { id: 'line-underline',  label: '下划线',   band: 54, minBand: 18, par: 'none', s: '<g fill="none" stroke="currentColor" stroke-width="10" stroke-linecap="round"><path d="M16 122H184"/><path d="M16 122c0-10 8-18 20-18s22 8 34 8 22-8 34-8 20 8 34 8 20-8 34-8 20 8 30 8" opacity=".55" stroke-width="6"/></g>' },
    { id: 'line-double',    label: '双下划线', band: 54, minBand: 18, par: 'none', s: '<g fill="none" stroke="currentColor" stroke-width="8" stroke-linecap="round"><path d="M16 112H184"/><path d="M16 142H184" opacity=".6"/></g>' },
    { id: 'line-arrow',     label: '箭头',     band: 72, minBand: 30, par: 'none', s: '<g fill="none" stroke="currentColor" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"><path d="M20 160 L172 44"/><path d="M172 44 H96 M172 44 v78"/></g>' },
    { id: 'line-wave',      label: '波浪线',   band: 32, minBand: 12, par: 'none', rep: 'wave', s: '<path d="M12 120 Q38 72 64 120 T116 120 T168 120" fill="none" stroke="currentColor" stroke-width="11" stroke-linecap="round"/>' },
    { id: 'line-scribble',  label: '手绘圈',   par: 'xMidYMid meet', s: '<path d="M100 40 C160 40 172 74 158 102 C142 134 92 148 66 128 C38 106 52 54 92 44 C128 35 152 52 150 84 C148 112 122 134 96 138" fill="none" stroke="currentColor" stroke-width="9" stroke-linecap="round"/>' },
    { id: 'line-zig',       label: '折线',     band: 34, minBand: 14, par: 'none', rep: 'zig', s: '<path d="M12 132 L48 76 L88 150 L128 66 L172 138" fill="none" stroke="currentColor" stroke-width="11" stroke-linecap="round" stroke-linejoin="round"/>' },
    { id: 'line-highlight', label: '高亮横条', band: 56, minBand: 14, par: 'none', rep: 'highlight', s: '<g><rect x="14" y="92" width="172" height="34" rx="17" fill="currentColor" opacity=".30"/><rect x="14" y="92" width="172" height="34" rx="17" fill="none" stroke="currentColor" stroke-width="7" stroke-linecap="round"/></g>' },
    { id: 'line-dash',      label: '点虚线',   band: 30, minBand: 12, par: 'none', rep: 'dash', s: '<path d="M12 120 H188" stroke="currentColor" stroke-width="10" stroke-linecap="round" stroke-dasharray="3 26"/>' }
  ];
  function lineStyleById(id) { return LINESTYLES.filter(function (x) { return x.id === id; })[0]; }

  // 是否“连续/延伸”线型（wave|zig|dash 重复单元；highlight 为整条延伸的圆角高亮条）。
  // 统一走 1:1 像素 viewBox，拉长不改变单段形状与粗度。
  function isRepeatLine(st) { return !!(st && st.rep); }
  // 渲染“延伸/重复”线：按当前 note 实际宽 W / 高 H（世界像素）生成像素精确的 SVG 字符串。
  // 关键：viewBox 直接取 0 0 W H（1:1，无横向拉伸），拉长只增加重复单元 / 只延伸长度。
  function makeRepeatSVGString(st, W, H) {
    var cy = H / 2;
    var inner = '', sw = '';
    if (st.rep === 'wave') {
      // 细波浪：线宽小、周期长（平缓）；宽度增加 → 波浪个数增多，单元形状/粗细不变
      var t = Math.max(2, Math.round(H * 0.17));       // ~5px @ H32
      var amp = Math.max(3, Math.round((H - t) * 0.40));
      var P = 76, step = 7, s = [], x;
      for (x = 0; x <= W; x += step) s.push(x.toFixed(1) + ' ' + (cy - amp * Math.sin(2 * Math.PI * x / P)).toFixed(1));
      s.push(W.toFixed(1) + ' ' + (cy - amp * Math.sin(2 * Math.PI * W / P)).toFixed(1));
      inner = '<path d="M' + s.join(' L') + '" fill="none" stroke="currentColor" stroke-width="' + t + '" stroke-linecap="round" stroke-linejoin="round"/>';
    } else if (st.rep === 'zig') {
      // 细折线：单齿较宽、起伏平缓
      var tz = Math.max(2, Math.round(H * 0.17));      // ~6px @ H34
      var ampz = Math.max(3, Math.round((H - tz) * 0.42));
      var half = 34, n = Math.ceil(W / half) + 1, s2 = 'M0 ' + cy.toFixed(1), i;
      for (i = 0; i < n; i++) {
        var yy2 = (i % 2 === 0) ? cy - ampz : cy + ampz;
        var xx2 = Math.min(W, i * half);
        s2 += ' L' + xx2.toFixed(1) + ' ' + yy2.toFixed(1);
      }
      inner = '<path d="' + s2 + '" fill="none" stroke="currentColor" stroke-width="' + tz + '" stroke-linecap="round" stroke-linejoin="round"/>';
    } else if (st.rep === 'dash') {
      // 细点虚线：固定点/隙，拉长自动等距出更多点
      var td = Math.max(2, Math.round(H * 0.26));      // ~8px @ H30
      var dd = Math.max(4, Math.round(td * 1.2));
      var gg = Math.max(9, Math.round(td * 2.7));
      var x0 = Math.min(W * 0.4, td);
      inner = '<path d="M' + x0.toFixed(1) + ' ' + cy.toFixed(1) + ' H' + (W - x0).toFixed(1)
        + '" fill="none" stroke="currentColor" stroke-width="' + td + '" stroke-linecap="round"'
        + ' stroke-dasharray="' + dd + ' ' + gg + '"/>';
    } else if (st.rep === 'highlight') {
      // 高亮横条：整条延伸的圆角胶囊条（fill 半透明 + 细描边），高度=带高固定、仅随宽度延伸，
      // rx 固定为胶囊半圆角 → 拉长不会把圆角拉成椭圆（避免原 200×200 拉伸的变形）。
      var inset = Math.max(1, H * 0.06);
      var top = inset, bh = Math.max(6, H - inset * 2), rx = bh / 2;
      var xl = Math.max(rx, H * 0.6), xr = Math.max(rx, W - H * 0.6);
      inner = '<rect x="' + xl.toFixed(1) + '" y="' + top.toFixed(1) + '" width="' + Math.max(1, (xr - xl)).toFixed(1)
        + '" height="' + bh.toFixed(1) + '" rx="' + rx.toFixed(1) + '" fill="currentColor" opacity=".30"/>'
        + '<rect x="' + xl.toFixed(1) + '" y="' + top.toFixed(1) + '" width="' + Math.max(1, (xr - xl)).toFixed(1)
        + '" height="' + bh.toFixed(1) + '" rx="' + rx.toFixed(1) + '" fill="none" stroke="currentColor" stroke-width="1.5"/>';
    }
    return '<svg viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none" aria-hidden="true">' + inner + '</svg>';
  }

  // ---------- 装饰贴纸（图案 / 表情） ----------
  // 每条：cat=shape|emoji；ar=高/宽比；s=内联 SVG(viewBox 200x200, 用 currentColor 描边) 或 e=emoji 字符
  var STICKERS = [
    // —— 图案 · 小图形 ——
    { id: 'shp-star',     cat: 'shape', label: '星形',   ar: 1, s: '<path d="M100 26 L120 82 H180 L130 116 L148 174 L100 142 L52 174 L70 116 L20 82 H80 Z" fill="none" stroke="currentColor" stroke-width="10" stroke-linejoin="round"/>' },
    { id: 'shp-starfill', cat: 'shape', label: '实心星', ar: 1, s: '<path d="M100 26 L120 82 H180 L130 116 L148 174 L100 142 L52 174 L70 116 L20 82 H80 Z" fill="currentColor"/>' },
    { id: 'shp-heart',    cat: 'shape', label: '爱心',   ar: 0.92, s: '<path d="M100 168 C38 116 28 66 60 44 C86 26 100 50 100 50 C100 50 114 26 140 44 C172 66 162 116 100 168 Z" fill="none" stroke="currentColor" stroke-width="10" stroke-linejoin="round"/>' },
    { id: 'shp-spark',    cat: 'shape', label: '闪光',   ar: 1, s: '<g fill="currentColor"><path d="M100 30 l14 40 40 14 -40 14 -14 40 -14-40 -40-14 40-14 Z"/><circle cx="162" cy="52" r="8"/><circle cx="44" cy="148" r="7"/></g>' },
    { id: 'shp-flower',   cat: 'shape', label: '小花',   ar: 1, s: '<g fill="none" stroke="currentColor" stroke-width="9"><circle cx="100" cy="100" r="16" fill="currentColor"/><ellipse cx="100" cy="52" rx="20" ry="28"/><ellipse cx="100" cy="148" rx="20" ry="28"/><ellipse cx="52" cy="100" rx="28" ry="20"/><ellipse cx="148" cy="100" rx="28" ry="20"/></g>' },
    { id: 'shp-exclaim',  cat: 'shape', label: '注意',   ar: 1, s: '<g fill="none" stroke="currentColor" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"><path d="M100 32 L170 168 H30 Z"/><path d="M100 88 V126"/><circle cx="100" cy="150" r="4" fill="currentColor"/></g>' },
    { id: 'shp-question', cat: 'shape', label: '疑问',   ar: 1, s: '<g fill="none" stroke="currentColor" stroke-width="12" stroke-linecap="round"><path d="M52 66 a40 40 0 1 1 68 34 c-10 8 -14 16 -14 28"/><circle cx="100" cy="154" r="5" fill="currentColor"/></g>' },
    { id: 'shp-check',    cat: 'shape', label: '对勾',   ar: 1, s: '<g fill="none" stroke="currentColor" stroke-width="13" stroke-linecap="round" stroke-linejoin="round"><circle cx="100" cy="100" r="72"/><path d="M62 102 l24 24 52-60"/></g>' },
    { id: 'shp-cloud',    cat: 'shape', label: '云朵',   ar: 0.9, s: '<g fill="none" stroke="currentColor" stroke-width="9" stroke-linejoin="round"><path d="M54 152 a28 28 0 0 1 -6-55 40 40 0 0 1 76-12 26 26 0 0 1 34 22 24 24 0 0 1 -8 45 Z"/></g>' },
    { id: 'shp-bub',      cat: 'shape', label: '对话泡', ar: 0.72, s: '<g fill="none" stroke="currentColor" stroke-width="9" stroke-linejoin="round"><path d="M36 46 h128 a16 16 0 0 1 16 16 v70 a16 16 0 0 1 -16 16 H98 l-26 22 v-22 H36 a16 16 0 0 1 -16-16 V62 a16 16 0 0 1 16-16 Z"/><path d="M52 78 h76 M52 102 h52" stroke-width="8" stroke-linecap="round"/></g>' },
    // —— 表情 · 游戏日记情绪/事件 ——
    { id: 'emo-heart', cat: 'emoji', label: '脸红',   e: '😍' },
    { id: 'emo-wow',   cat: 'emoji', label: '惊艳',   e: '🤩' },
    { id: 'emo-cry',   cat: 'emoji', label: '泪目',   e: '😭' },
    { id: 'emo-sad',   cat: 'emoji', label: '难过',   e: '😢' },
    { id: 'emo-gasp',  cat: 'emoji', label: '震惊',   e: '😱' },
    { id: 'emo-game',  cat: 'emoji', label: '手柄',   e: '🎮' },
    { id: 'emo-angry', cat: 'emoji', label: '生气',   e: '😠' },
    { id: 'emo-laugh', cat: 'emoji', label: '笑死',   e: '😂' },
    { id: 'emo-grin',  cat: 'emoji', label: '好笑',   e: '😆' },
    { id: 'emo-cool',  cat: 'emoji', label: '好帅',   e: '😎' },
    { id: 'emo-happy', cat: 'emoji', label: '开心',   e: '😊' },
    { id: 'emo-love',  cat: 'emoji', label: '心动',   e: '💕' },
    { id: 'emo-shy',   cat: 'emoji', label: '害羞',   e: '😳' },
    { id: 'emo-bleh',  cat: 'emoji', label: '平淡',   e: '😐' },
    { id: 'emo-zzz',   cat: 'emoji', label: '好困',   e: '🥱' },
    { id: 'emo-pout',  cat: 'emoji', label: '气鼓鼓', e: '😤' },
    { id: 'emo-skull', cat: 'emoji', label: '被虐',   e: '💀' },
    { id: 'emo-ghost', cat: 'emoji', label: '吓到',   e: '👻' },
    { id: 'emo-fire',  cat: 'emoji', label: '上头',   e: '🔥' },
    { id: 'emo-spark', cat: 'emoji', label: '闪亮',   e: '✨' },
    { id: 'emo-bulb',  cat: 'emoji', label: '灵感',   e: '💡' },
    { id: 'emo-crown', cat: 'emoji', label: '神作',   e: '👑' },
    { id: 'emo-star',  cat: 'emoji', label: '五星',   e: '⭐' },
    { id: 'emo-heart2',cat: 'emoji', label: '本命',   e: '❤️' },
    { id: 'emo-ok',    cat: 'emoji', label: '庆祝',   e: '🎉' },
    { id: 'emo-heart3',cat: 'emoji', label: '治愈',   e: '🌸' },
    { id: 'emo-rain',  cat: 'emoji', label: '破防',   e: '😭✨' },
    { id: 'emo-clap',  cat: 'emoji', label: '鼓掌',   e: '👏' },
    { id: 'emo-muscle',cat: 'emoji', label: '支棱',   e: '💪' },
    { id: 'emo-fight', cat: 'emoji', label: '开战',   e: '⚔️' },
    { id: 'emo-quest', cat: 'emoji', label: '支线',   e: '📜' },
    { id: 'emo-map',   cat: 'emoji', label: '探索',   e: '🗺️' },
    { id: 'emo-trophy',cat: 'emoji', label: '成就',   e: '🏆' },
    { id: 'emo-flag',  cat: 'emoji', label: '通关',   e: '🏁' },
    { id: 'emo-music', cat: 'emoji', label: '配乐神', e: '🎵' },
    { id: 'emo-art',   cat: 'emoji', label: '画风',   e: '🎨' },
    { id: 'emo-cam',   cat: 'emoji', label: '拍照',   e: '📸' },
    { id: 'emo-bug',   cat: 'emoji', label: '吐槽',   e: '🐛' },
    { id: 'emo-egg',   cat: 'emoji', label: '彩蛋',   e: '🥚' },
    { id: 'emo-clock', cat: 'emoji', label: '熬夜',   e: '⏰' }
  ];
  function stickerById(id) { return STICKERS.filter(function (x) { return x.id === id; })[0] || lineStyleById(id) || badgeById(id); }
  // 渲染贴纸内容：返回一个放进 .nb-stk 的子元素（repeat 线需给 W/H 以生成连续重复几何）
  function buildStickerContent(st, W, H) {
    if (!st) return null;
    if (st.e) {
      var sp = document.createElement('span');
      sp.className = 'nb-stk-emoji'; sp.textContent = st.e; return sp;
    }
    var holder = document.createElement('div');
    // 连续重复线（波浪/折线/点虚线）：按实际宽高生成 1:1 平铺，拉长=重复不变形
    if (isRepeatLine(st)) {
      holder.innerHTML = makeRepeatSVGString(st, Math.max(40, W || 240), Math.max(8, H || st.band || 60));
    } else {
      // 线条类贴纸默认 none（拉伸铺满 note 长宽），图案类 meet（保持方形居中），可用 st.par 覆盖
      var par = st.par || (st.cat === 'line' ? 'none' : 'xMidYMid meet');
      holder.innerHTML = '<svg viewBox="0 0 200 200" preserveAspectRatio="' + par + '" aria-hidden="true">' + st.s + '</svg>';
    }
    var wrap = holder.firstChild;
    wrap.setAttribute('width', '100%'); wrap.setAttribute('height', '100%');
    return wrap;
  }
  // 从底部工具条加一张贴纸
  function addStickerNote(stickId) {
    var st = stickerById(stickId); if (!st) return;
    var c = screenToWorld(viewport.clientWidth / 2, viewport.clientHeight / 2);
    // 默认尺寸调小（贴纸做点缀用），仍可选中右下角拖动手柄继续放大缩小
    var w = st.cat === 'emoji' ? 60 : 104;
    var h = Math.round(w * (st.ar || 1));
    if (st.ar && st.ar < 0.45) { h = Math.max(30, Math.round(w * st.ar)); }
    var n = { id: uid(), x: Math.round(c.x - w / 2), y: Math.round(c.y - h / 2), type: 'sticker', pinned: false,
      createdAt: Date.now(), w: w, h: h, baseSize: 14, rot: 0, variant: null, color: null,
      stickId: st.id, ar: st.ar || 1, kind: '', stageId: null };
    pushHistory(); board.notes.push(n);
    var el = buildNote(n); world.appendChild(el); dropIn(el, n);
    renderClusters(); updateEmpty(); updateCount();
    selectNote(n.id); markDirty('notes', n.id); scheduleSave();
  }
  // —— 贴纸选择器 ——
  var stickerChooserEl = null, stickerChooserShown = false, stickerCat = 'shape';
  function stickerTabHTML() {
    var map = { shape: '图案', emoji: '表情' };
    var h = '';
    ['shape', 'emoji'].forEach(function (k) {
      h += '<button class="nb-stktab' + (k === stickerCat ? ' on' : '') + '" data-cat="' + k + '">' + (map[k] || k) + '</button>';
    });
    return h;
  }
  function stickerThumb(st) {
    if (st.e) return '<span class="nb-stkemoji">' + st.e + '</span>';
    var par = st.par || (st.cat === 'line' ? 'none' : 'xMidYMid meet');
    return '<svg viewBox="0 0 200 200" preserveAspectRatio="' + par + '" aria-hidden="true">' + st.s + '</svg>';
  }
  function stickerGridHTML() {
    var arr = STICKERS.filter(function (x) { return x.cat === stickerCat; });
    return arr.map(function (st) { return '<button class="nb-stkitem" data-sid="' + st.id + '" title="' + st.label + '">' + stickerThumb(st) + '</button>'; }).join('');
  }
  function renderStickerPanel() {
    if (!stickerChooserEl) return;
    var grid = stickerChooserEl.querySelector('.nb-stkgrid');
    var tabs = stickerChooserEl.querySelector('.nb-stktabs');
    if (tabs) tabs.innerHTML = stickerTabHTML();
    if (grid) grid.innerHTML = stickerGridHTML();
  }
  function openStickerChooser() {
    disarmLine();
    if (!stickerChooserEl) {
      stickerChooserEl = document.createElement('div');
      stickerChooserEl.className = 'nb-stkwrap';
      stickerChooserEl.innerHTML = '<div class="nb-stkpanel">'
        + '<div class="nb-stktabs"></div><div class="nb-stkgrid"></div></div>';
      stickerChooserEl.addEventListener('click', function (e) {
        e.stopPropagation();
        var tab = e.target.closest('.nb-stktab');
        if (tab) { stickerCat = tab.getAttribute('data-cat'); renderStickerPanel(); return; }
        var it = e.target.closest('.nb-stkitem');
        if (it) { closeStickerChooser(); addStickerNote(it.getAttribute('data-sid')); }
      });
      document.body.appendChild(stickerChooserEl);
      viewport.addEventListener('pointerdown', function (e) { if (!stickerChooserEl.contains(e.target)) closeStickerChooser(); });
      window.addEventListener('scroll', closeStickerChooser, true);
    }
    renderStickerPanel();
    stickerChooserEl.classList.add('show'); stickerChooserShown = true;
  }
  function closeStickerChooser() {
    if (!stickerChooserEl || !stickerChooserShown) return;
    stickerChooserEl.classList.remove('show'); stickerChooserShown = false;
  }

  // =====================================================================
  // 划线工具：在样式面板挑一种线型后，「在画布上按住拖动」画出一条线，松手定稿。
  // 落点为一条 type:'sticker'、stickId∈LINESTYLES 的 note，可再次拖动/缩放/删除，
  // 描边色跟随画板强调色 accent。
  // =====================================================================
  var lineChooserEl = null, lineChooserShown = false;
  var lineArmed = false, lineStyleId = null;   // 已选线型，进入待画态
  var lineDragging = false;                     // 正在拖拽画线
  var lineG = null;                             // 画线手势快照
  var linePreviewEl = null;                     // 拖拽中的橡皮筋预览
  var lineHintEl = null;                        // 顶部"拖动画线"提示胶囊

  function lineThumbHTML(st) {
    var par = st.par || 'none';
    return '<svg viewBox="0 0 200 200" preserveAspectRatio="' + par + '" aria-hidden="true">' + st.s + '</svg>';
  }
  function renderLinePanel() {
    if (!lineChooserEl) return;
    var grid = lineChooserEl.querySelector('.nb-linegrid');
    if (grid) grid.innerHTML = LINESTYLES.map(function (st) {
      return '<button class="nb-lineitem" data-sid="' + st.id + '" title="' + st.label + '">'
        + lineThumbHTML(st) + '<span>' + st.label + '</span></button>';
    }).join('');
  }
  function openLineChooser() {
    if (!lineChooserEl) {
      lineChooserEl = document.createElement('div');
      lineChooserEl.className = 'nb-stkwrap';
      lineChooserEl.innerHTML = '<div class="nb-stkpanel nb-linepanel">'
        + '<div class="nb-linehead"><b>✒ 划线工具</b><em>选一种线型后在画布上沿任意方向拖动即可画线：线条朝鼠标拖拽的方向倾斜，长短随拖动距离而定；想画横线就横向拖、竖线就竖向拖。松手定稿后可单独调「线粗」</em></div>'
        + '<div class="nb-linegrid"></div></div>';
      lineChooserEl.addEventListener('click', function (e) {
        e.stopPropagation();
        var it = e.target.closest('.nb-lineitem');
        if (!it) return;
        closeLineChooser();
        armLine(it.getAttribute('data-sid'));
      });
      document.body.appendChild(lineChooserEl);
      window.addEventListener('scroll', closeLineChooser, true);
    }
    renderLinePanel();
    lineChooserEl.classList.add('show'); lineChooserShown = true;
  }
  function closeLineChooser() {
    if (!lineChooserEl || !lineChooserShown) return;
    lineChooserEl.classList.remove('show'); lineChooserShown = false;
  }
  // 点击划线按钮：开面板 or 关面板
  function toggleLineChooser() {
    closeStickerChooser(); closeTextChooser();
    if (lineChooserShown) { closeLineChooser(); return; }
    openLineChooser();
  }
  // 选型后进入待画态：高亮按钮、给提示、改光标
  function armLine(sid) {
    var st = lineStyleById(sid); if (!st) return;
    disarmLine();
    lineStyleId = sid; lineArmed = true;
    document.body.classList.add('nb-line-armed');
    var b = document.getElementById('addLine'); if (b) b.classList.add('on');
    ensureLineHint();
    lineHintEl.textContent = '拖「' + st.label + '」：沿任意方向拖动决定线条的斜向与长短，松手定稿；如需改粗度，点中它用「线粗」调节。Esc 退出。';
    showLineHint(true);
    closeStickerChooser();
    deselect();
  }
  function disarmLine() {
    lineArmed = false; lineDragging = false; lineG = null;
    removeLinePreview();
    document.body.classList.remove('nb-line-armed');
    var b = document.getElementById('addLine'); if (b) b.classList.remove('on');
    showLineHint(false);
  }
  function ensureLineHint() {
    if (lineHintEl) return;
    lineHintEl = document.createElement('div');
    lineHintEl.className = 'nb-linehint';
    var k = document.createElement('kbd'); k.textContent = 'Esc';
    lineHintEl.appendChild(document.createTextNode(''));
    document.body.appendChild(lineHintEl);
  }
  function showLineHint(v) {
    if (!lineHintEl) return;
    lineHintEl.classList.toggle('show', !!v);
  }
  function removeLinePreview() {
    if (linePreviewEl && linePreviewEl.parentNode) linePreviewEl.parentNode.removeChild(linePreviewEl);
    linePreviewEl = null;
  }
  // 拖拽开始（由 viewport pointerdown 在 armed 时调用）
  function linePointerDown(e) {
    if (e.target.closest && e.target.closest('.nb-note')) return;   // 落在便签上不划线
    var w = screenToWorld(e.clientX, e.clientY);
    lineDragging = true;
    lineG = { ax: w.x, ay: w.y, bx: w.x, by: w.y };
    try { viewport.setPointerCapture(e.pointerId); } catch (_) {}
    e.preventDefault(); e.stopPropagation();
    makeLinePreview();
    updateLinePreview(w.x, w.y);
  }
  function makeLinePreview() {
    removeLinePreview();
    linePreviewEl = document.createElement('div');
    linePreviewEl.className = 'nb-note nb-type-sticker nb-stk-line nb-line-preview';
    linePreviewEl.style.setProperty('--nb-stk', 'var(--accent)');
    var box = document.createElement('div'); box.className = 'nb-stk';
    var st = lineStyleById(lineStyleId);
    // repeat 线首次给个起始尺寸，几何随后续拖拽刷新
    var content = st ? buildStickerContent(st, 56, (st.band || 60)) : null;
    if (content) box.appendChild(content);
    linePreviewEl.appendChild(box);
    world.appendChild(linePreviewEl);
  }
  // 按新的宽 W/高 H 刷新一个已存在便签/预览里的 repeat 线 SVG 几何（拉长=加重复单元）
  function refreshRepeatSvg(el, st, W, H) {
    if (!el || !st || !isRepeatLine(st)) return;
    var stk = el.querySelector && el.querySelector('.nb-stk');
    if (!stk) return;
    stk.innerHTML = makeRepeatSVGString(st, Math.max(40, Math.round(W)), Math.max(8, Math.round(H)));
    var sv = stk.firstChild; if (sv) { sv.setAttribute('width', '100%'); sv.setAttribute('height', '100%'); }
  }

  // 拖拽是否带形（band=固定粗度线带）：有 band 字段即是；手绘圈无 band → 两向缩放
  function lineIsBand(st) { return !!(st && st.band); }
  // 由 lineG + 线型算出最终摆放框 {x,y,w,h,rot}：
  //  带形线 → 沿拖拽矢量方向自由倾斜：长度 = 按下点→当前点 的直线距离，
  //           粗度(带高)固定 = band，角度 = atan2(dy,dx)，note 中心对齐线段中点 →
  //           线条从按下点指向当前点，可任意斜向（横向拖=水平线，斜拖=斜线，竖拖=竖线）。
  //  手绘圈 → 保持两向缩放（宽高随拖拽），不强调方向，不旋转
  function lineDrawBox(st) {
    var ax = lineG.ax, ay = lineG.ay, bx = lineG.bx, by = lineG.by;
    if (lineIsBand(st)) {
      var dx = bx - ax, dy = by - ay;
      var len = Math.max(56, Math.hypot(dx, dy));       // 长度=拖拽直线距离（含最小下限）
      var h = st.band;                                   // 粗度（带高）固定，可用「线粗」A⁻/A⁺ 调节
      var ang = Math.atan2(dy, dx) * 180 / Math.PI;      // 指向按下点→当前点 的方向角(度)
      var cx = (ax + bx) / 2, cy = (ay + by) / 2;        // 线段中点 = 旋转中心（note 绕中心旋转）
      return { x: cx - len / 2, y: cy - h / 2, w: len, h: h, rot: ang };
    }
    // 手绘圈等两向：近似方形，取较长的拖拽方向
    var side = Math.max(48, Math.abs(bx - ax), Math.abs(by - ay));
    return { x: ax - side / 2, y: ay - side / 2, w: side, h: side, rot: 0 };
  }
  function applyLineBox(el, box) {
    if (!el) return;
    // 带形线可带旋转角(rot)：translate 后绕元素自身中心旋转 → 线条沿线段矢量方向倾斜
    el.style.transform = 'translate(' + box.x + 'px,' + box.y + 'px)' + (box.rot ? ' rotate(' + box.rot + 'deg)' : '');
    el.style.width = box.w + 'px';
    el.style.height = box.h + 'px';
    el.style.minHeight = box.h + 'px';
    el.style.setProperty('--nb-stk-w', box.w + 'px');
    el.style.setProperty('--nb-stk-h', box.h + 'px');
  }
  function updateLinePreview(wx, wy) {
    if (!lineG || !linePreviewEl) return;
    lineG.bx = wx; lineG.by = wy;
    var st = lineStyleById(lineStyleId);
    var box = lineDrawBox(st);
    // repeat 线随拖拽不断刷新单元几何（否则会整体拉伸变形）
    refreshRepeatSvg(linePreviewEl, st, box.w, box.h);
    applyLineBox(linePreviewEl, box);
  }
  function linePointerMove(e) {
    if (!lineDragging || !lineG) return;
    var w = screenToWorld(e.clientX, e.clientY);
    updateLinePreview(w.x, w.y);
    e.preventDefault();
  }
  function linePointerUp(e) {
    if (!lineDragging) return;
    var w = screenToWorld(e.clientX, e.clientY);
    lineG.bx = w.x; lineG.by = w.y;
    var moved = lineG && (Math.abs(lineG.bx - lineG.ax) > 8 || Math.abs(lineG.by - lineG.ay) > 8);
    if (moved) commitDrawnLine();
    lineDragging = false; lineG = null;
    removeLinePreview();
  }
  function commitDrawnLine() {
    if (!lineG) return;
    var st = lineStyleById(lineStyleId); if (!st) return;
    var box = lineDrawBox(st);
    // 注意：stickId 为线的便签，ar 记 h/w，供右下角拖拽手柄等比缩放
    var ar = box.h / box.w;
    var n = { id: uid(), x: Math.round(box.x), y: Math.round(box.y), type: 'sticker', pinned: false,
      createdAt: Date.now(), w: Math.round(box.w), h: Math.round(box.h), baseSize: 14, rot: Math.round(box.rot || 0), variant: null, color: null,
      stickId: st.id, ar: ar, kind: '', stageId: null };
    pushHistory();                          // 定稿前记录，便于撤销
    board.notes.push(n);
    var el = buildNote(n); world.appendChild(el); dropIn(el, n);
    renderClusters(); updateEmpty(); updateCount();
    selectNote(n.id); markDirty('notes', n.id); scheduleSave();
    disarmLine();                      // 一条定稿后自动退出，便于连续换位置再画
  }
  var addLineBtn = document.getElementById('addLine');
  if (addLineBtn) addLineBtn.addEventListener('click', function (e) {
    e.stopPropagation();
    if (lineArmed) { disarmLine(); return; }
    toggleLineChooser();
  });
  // Esc 退出待画 / 取消画线
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      if (lineDragging) { lineDragging = false; lineG = null; removeLinePreview(); }
      else disarmLine();
    }
  });

  document.getElementById('addSticker').addEventListener('click', function (e) {
    e.stopPropagation(); closeTextChooser(); disarmLine();
    if (stickerChooserShown) { closeStickerChooser(); return; }
    openStickerChooser();
  });

  document.getElementById('addSticky').addEventListener('click', function () { closeTextChooser(); closeStickerChooser(); disarmLine(); addNote('sticky'); });
  var emptyCta = document.getElementById('emptyCta');
  if (emptyCta) emptyCta.addEventListener('click', function () { closeTextChooser(); closeStickerChooser(); disarmLine(); addNote('sticky'); });
  document.getElementById('addText').addEventListener('click', function (e) { e.stopPropagation(); closeStickerChooser(); disarmLine(); if (textChooserShown) { closeTextChooser(); return; } openTextChooser(); });
  document.getElementById('addImage').addEventListener('click', function () { closeTextChooser(); closeStickerChooser(); disarmLine(); addNote('image'); });
  // 游戏卡入口：已关联→直接插入；未关联→指引并打开当前画板编辑弹窗（含关联游戏下拉）
  var addGameCardBtn = document.getElementById('addGameCard');
  if (addGameCardBtn) addGameCardBtn.addEventListener('click', function () {
    closeTextChooser(); closeStickerChooser(); disarmLine();
    if (!board || !board.gameTitle) {
      toast('先给这个画板关联一款游戏，再点「游戏卡」', 'err');
      openBoardModal(board ? board.id : null);
      return;
    }
    insertGameCardFromBoard();
  });
  // 注：缩放按钮的平滑动画版在 enhanceInit() 中绑定（zoomAnimated），此处不再重复绑定
  document.getElementById('bgBtn').addEventListener('click', function () {
    var i = BG_THEMES.indexOf(board.material || board.bg);
    board.material = board.bg = BG_THEMES[(i + 1) % BG_THEMES.length];
    pushHistory();
    applyMaterial(); markAppearance();
    markDirty('boards', board.id); scheduleSave();
    toast('材质：' + materialOf(board.material).name);
  });

  // 注：Delete / Esc / Ctrl+Z 等全局快捷键统一在 setupKeys()（enhanceInit 内）处理，此处不再重复监听

  // 图片导入
  imgInput.addEventListener('change', function () {
    var id = pendingImageId || selectedId; pendingImageId = null;
    var file = imgInput.files && imgInput.files[0]; imgInput.value = '';
    if (!file || !id) return;
    var reader = new FileReader();
    reader.onload = function () {
      var n = board.notes.find(function (x) { return x.id === id; }); if (!n) return;
      compressImage(reader.result, function (out) {
        n.img = out;
        // 重建该便签以显示图片
        if (noteEls[id]) { noteEls[id].remove(); }
        var el = buildNote(n); world.appendChild(el); selectNote(id);
        markDirty('notes', n.id); scheduleSave();
      });
    };
    reader.readAsDataURL(file);
  });

  // 剪贴板粘贴截图 → 直接生成图片便签（游玩中最常用的采集方式）
  function createImageNoteFromSrc(src) {
    compressImage(src, function (out) {
      var c = screenToWorld(viewport.clientWidth / 2, viewport.clientHeight / 2);
      var n = { id: uid(), x: Math.round(c.x - 110), y: Math.round(c.y - 80), type: 'image', pinned: false, createdAt: Date.now(), w: 220, h: 170, img: out };
      board.notes.push(n);
      var el = buildNote(n); world.appendChild(el); dropIn(el, n);
      updateEmpty(); updateCount(); selectNote(n.id);
      markDirty('notes', n.id); scheduleSave();
    });
  }
  document.addEventListener('paste', function (e) {
    var ae = document.activeElement;
    if (ae && (ae.isContentEditable || ae.tagName === 'INPUT' || ae.tagName === 'TEXTAREA' || ae.tagName === 'SELECT')) return;  // 正在编辑文字时不拦截
    var cd = e.clipboardData || window.clipboardData;
    if (!cd || !cd.items) return;
    for (var i = 0; i < cd.items.length; i++) {
      if (cd.items[i].type && cd.items[i].type.indexOf('image') === 0) {
        var blob = cd.items[i].getAsFile(); if (!blob) return;
        var reader = new FileReader();
        reader.onload = function () { createImageNoteFromSrc(reader.result); };
        reader.readAsDataURL(blob);
        e.preventDefault();
        return;
      }
    }
  });

  // ---------- 杂项 ----------
  // ---------- 材质（背景质感） + 主题（颜色） ----------
  // 两者解耦：材质只画表面纹理，主题只给颜色，可任意组合。
  function applyMaterial() {
    var m = materialOf(board.material || board.bg);
    var root = document.documentElement.style;
    root.setProperty('--nb-mat-img', m.img);
    root.setProperty('--nb-mat-size', m.size);
  }
  function applyTheme() {
    var t = themeOf(board.theme);
    var root = document.documentElement.style;
    root.setProperty('--accent', t.accent);
    root.setProperty('--accent2', t.accent2);
    root.setProperty('--accent-light', hexA(t.accent, .15));
    root.setProperty('--nb-canvas', t.canvas);
    root.setProperty('--nb-card', t.card);
    root.setProperty('--nb-card-2', t.card2);
    root.setProperty('--nb-ink', t.ink);
    root.setProperty('--nb-ink-2', t.ink2);
    root.setProperty('--nb-line', t.line);
    root.setProperty('--nb-glow-a', t.glowA);
    root.setProperty('--nb-glow-b', t.glowB);
    root.setProperty('--nb-shadow', t.shadow);
    root.setProperty('--nb-sheen', t.id === 'noir' ? 'rgba(255,255,255,.06)' : 'rgba(255,255,255,.45)');
    document.body.classList.toggle('nb-dark', t.id === 'noir');
  }
  function applyBg() { applyTheme(); applyMaterial(); applyCardStyle(); }   // 统一入口（历史调用点保持不变）
  function applyCardStyle() {
    var cs = cardStyleOf(board.cardStyle);
    ['clean', 'hilight', 'glass', 'retro'].forEach(function (id) { document.body.classList.remove('nb-cs-' + id); });
    document.body.classList.add('nb-cs-' + cs.id);
  }
  // 空态起手式：按模板给一句「这个模板怎么开始写」，空画板不再是一片空白
  var TPL_EMPTY = {
    blank:     { k: '🗒️ 完全白板', t: '这里还空着，正好留给你', s: '想起什么就写下来——文字、图片、贴纸都能放。也可以点左上角 <b>▤</b> 新建画板，挑个模板直接上手。', c: '＋ 写一张便签' },
    journal:   { k: '📔 手账式', t: '今天还没记一页', s: '先写「今日心情」或「今日高光」，顶部 <b>日期带</b> 会自动按天归拢，想回看哪天就点哪天。', c: '＋ 写今天这一页' },
    mindmap:   { k: '🧠 思维导图式', t: '从一个点开始发散', s: '先写中心主题，再用模式条 <b>➕ 加子节点</b> 往外长分支；<b>🔗 连线</b> 可以手动画关系。', c: '＋ 写下中心主题' },
    document:  { k: '📄 文档式', t: '把长评写成一篇文档', s: '用 <b>📑 文档排版</b> 自动排成上下连贯的文档流，<b>H1/H2</b> 标层级，<b>☰ 大纲</b> 跳转，<b>⬇ 导出MD</b> 带走。', c: '＋ 写第一段' },
    character: { k: '🎭 角色卡', t: '给喜欢的人建一份档案', s: '用 <b>＋ 字段卡</b> 拉出带标签的资料栏（姓名 / 外貌 / 动机），再配几张普通便签写细节。', c: '＋ 加一张字段卡' },
    review:    { k: '📊 测评式', t: '这次打个分', s: '点模式条 <b>⭐ 评分</b> 给画面 / 剧情 / 玩法 / 音乐各自打分，再写下优点与缺点。', c: '＋ 开始测评' },
    checklist: { k: '🎯 通关清单', t: '把想做的事一件件列出来', s: '用 <b>＋ 加一条</b> 列目标，点每条左边的圆钮勾掉它——全部勾完会放烟花 🎉', c: '＋ 加一条待办' },
    quote:     { k: '💬 金句墙', t: '先把那句念念不忘的话贴上来', s: '开 <b>🔄 翻面写批注</b>，点卡片就能翻到背面写「为什么戳中你」。', c: '＋ 加一句金句' },
    dialogue:  { k: '🎬 对白剧场', t: '让两个人说点什么', s: '用 <b>＋ 加一句</b> 左右交错排对白，点 <b>▶ 播放对白</b> 会一句句亮出来。', c: '＋ 加一句对白' },
    gallery:   { k: '📷 名场面相册', t: '第一张舍不得删的截图', s: '把照片拖进来，再用模式条切 <b>相纸样式</b>（拍立得 / 相纸 / 胶片）；<b>▦ 拼贴成册</b> 一键排齐，<b>▶ 放映</b> 全屏看一遍。', c: '＋ 添加第一张' },
    trip:      { k: '🧭 旅程散记', t: '从「Day 1」出发', s: '写一句以 <b>Day 1</b> 开头的文字，左侧会自动长出 <b>行程轨</b>；用 <b>＋ 下一站</b> 一路写下去，<b>▶ 回放</b> 沿着旅程走一遍。', c: '＋ 写下 Day 1' },
    timelineH: { k: '🕐 时间线 · 横向', t: '沿一条轴记下这段心路', s: '把便签拖到对应的 <b>阶段带</b> 上——跨过分界线就自动归入那一章；<b>⚖ 等距 / 📏 按时间</b> 可切换疏密。', c: '＋ 写下第一站' },
    timelineV: { k: '🕐 时间线 · 纵向', t: '从上往下记一场沉浸', s: '把便签拖到对应的 <b>阶段带</b> 上——跨过分界线就自动归入那一章；<b>⚖ 等距 / 📏 按时间</b> 可切换疏密。', c: '＋ 写下第一站' }
  };
  function applyEmptyCopy() {
    if (!emptyState) return;
    var cfg = TPL_EMPTY[modeOf()] || TPL_EMPTY.blank;
    var k = emptyState.querySelector('.nb-empty-kicker');
    if (!k) {
      k = document.createElement('div'); k.className = 'nb-empty-kicker';
      emptyState.insertBefore(k, emptyState.firstChild);
    }
    k.textContent = cfg.k;
    var t = emptyState.querySelector('.nb-empty-title'); if (t) t.textContent = cfg.t;
    var s = emptyState.querySelector('.nb-empty-sub'); if (s) s.innerHTML = cfg.s;
    var c = document.getElementById('emptyCta'); if (c) c.textContent = cfg.c;
  }
  function updateEmpty() {
    var isEmpty = board.notes.length === 0;
    emptyState.classList.toggle('hide', !isEmpty);
    if (isEmpty) applyEmptyCopy();
    if (minimapEl) minimapEl.classList.toggle('hidden', isEmpty);
  }
  function updateCount() { countEl.textContent = board.notes.length + ' 张便签'; updateStreakChip(); }

  // ---------- 画板管理（多画板：每款游戏一个画板，自由开多个） ----------
  var boardToggle = document.getElementById('boardToggle');
  var boardPanel = document.getElementById('boardPanel');
  var boardBackdrop = document.getElementById('boardBackdrop');
  var boardList = document.getElementById('boardList');
  var newBoardBtn = document.getElementById('newBoardBtn');
  var boardClose = document.getElementById('boardClose');
  var gameBanner = document.getElementById('gameBanner');
  var insertGameCardBtn = document.getElementById('insertGameCardBtn');
  var boardModal = document.getElementById('boardModal');
  var boardModalTitle = document.getElementById('boardModalTitle');
  var boardTitleInput = document.getElementById('boardTitleInput');
  var gameCombo = document.getElementById('gameCombo');
  var gamePanel = document.getElementById('gamePanel');
  var boardGameInput = document.getElementById('boardGameInput');
  var boardModalOk = document.getElementById('boardModalOk');
  var boardModalCancel = document.getElementById('boardModalCancel');
  var tplSection = document.getElementById('tplSection');
  var editingId = null;

  // 顶栏画板名点开的"画板库"下拉（独立于侧栏 boardPanel：让历史画板更显眼）
  var boardPopover = document.getElementById('boardPopover');
  var boardPopList = document.getElementById('boardPopList');
  var boardPopCount = document.getElementById('boardPopCount');
  var boardPopNew = document.getElementById('boardPopNew');
  var boardPopAll = document.getElementById('boardPopAll');
  function openBoardPopover() {
    if (!boardPopover || !boardNameBtn) return;
    renderBoardPopover();
    boardPopover.hidden = false;
    boardPopover.classList.add('show');
    boardNameBtn.setAttribute('aria-expanded', 'true');
    // 定位到画板名按钮下方（与浮层风格统一）
    var r = boardNameBtn.getBoundingClientRect();
    boardPopover.style.left = Math.min(r.left, window.innerWidth - boardPopover.offsetWidth - 12) + 'px';
    boardPopover.style.top = (r.bottom + 8) + 'px';
    // Esc 关闭
    setTimeout(function () { document.addEventListener('keydown', escClosePop, true); }, 0);
  }
  function escClosePop(e) { if (e.key === 'Escape') { closeBoardPopover(); document.removeEventListener('keydown', escClosePop, true); } }
  function closeBoardPopover() {
    if (!boardPopover) return;
    boardPopover.classList.remove('show');
    boardPopover.hidden = true;
    if (boardNameBtn) boardNameBtn.setAttribute('aria-expanded', 'false');
    document.removeEventListener('keydown', escClosePop, true);
  }
  function toggleBoardPopover() {
    if (!boardPopover) return;
    if (boardPopover.classList.contains('show')) closeBoardPopover(); else openBoardPopover();
  }
  // 画板封面缩略：把该板所有便签按包围盒等比缩进 48×36 的小框里，
  // 用色块还原「版面疏密 + 便签底色」，一眼认板。
  function boardThumbHTML(b) {
    var W = 48, H = 36, pad = 4;
    var notes = (b && b.notes) || [];
    var accent = (b && b.accent) || '#B86FD8';
    var count = '<span class="nb-bi-count">' + notes.length + '</span>';
    if (!notes.length) {
      return '<span class="nb-bi-thumbwrap"><span class="nb-bi-thumb empty" title="空画板"><i></i></span>' + count + '</span>';
    }
    var minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    notes.forEach(function (n) {
      var w = n.w || 200, h = n.h || (n.type === 'image' ? 160 : (n.type === 'text' ? 90 : 130));
      var rot = (n.rot || 0) * Math.PI / 180;
      var ex = Math.abs(Math.cos(rot)) * w / 2 + Math.abs(Math.sin(rot)) * h / 2;
      var ey = Math.abs(Math.sin(rot)) * w / 2 + Math.abs(Math.cos(rot)) * h / 2;
      var cx = (n.x || 0) + w / 2, cy = (n.y || 0) + h / 2;
      if (cx - ex < minX) minX = cx - ex;
      if (cy - ey < minY) minY = cy - ey;
      if (cx + ex > maxX) maxX = cx + ex;
      if (cy + ey > maxY) maxY = cy + ey;
    });
    var bw = Math.max(1, maxX - minX), bh = Math.max(1, maxY - minY);
    var s = Math.min((W - pad * 2) / bw, (H - pad * 2) / bh);
    var ox = pad + ((W - pad * 2) - bw * s) / 2, oy = pad + ((H - pad * 2) - bh * s) / 2;
    var rects = notes.slice(0, 70).map(function (n) {
      var w = n.w || 200, h = n.h || (n.type === 'image' ? 160 : (n.type === 'text' ? 90 : 130));
      var x = (n.x - minX) * s + ox, y = (n.y - minY) * s + oy;
      var rw = Math.max(1.6, w * s), rh = Math.max(1.6, h * s);
      var fill = n.color ? n.color : (n.type === 'image' ? 'rgba(40,20,60,.30)' : accent);
      var op = n.color ? .95 : (n.type === 'image' ? .8 : .45);
      return '<rect x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" width="' + rw.toFixed(1) +
        '" height="' + rh.toFixed(1) + '" rx="1.2" fill="' + fill + '" opacity="' + op + '"/>';
    }).join('');
    return '<span class="nb-bi-thumbwrap"><span class="nb-bi-thumb">' +
      '<svg viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="xMidYMid meet" aria-hidden="true">' + rects + '</svg>' +
      '</span>' + count + '</span>';
  }
  function renderBoardPopover() {
    if (!boardPopList) return;
    if (boardPopCount) boardPopCount.textContent = '共 ' + store.boards.length + ' 个';
    boardPopList.innerHTML = '';
    // 按更新时间倒序，最近活跃的画板排最前
    var sorted = store.boards.slice().sort(function (a, b) { return (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0); });
    sorted.forEach(function (b) {
      var it = document.createElement('div');
      it.className = 'nb-bpop-item' + (b.id === store.activeId ? ' active' : '');
      it.setAttribute('role', 'option');
      it.innerHTML =
        boardThumbHTML(b) +
        '<div class="nb-bi-main">' +
          '<div class="nb-bi-name"></div>' +
          '<div class="nb-bi-game"></div>' +
        '</div>';
      it.querySelector('.nb-bi-name').textContent = b.title || '未命名画板';
      var gEl = it.querySelector('.nb-bi-game');
      gEl.textContent = b.gameTitle ? ('🎮 ' + b.gameTitle) : '未关联游戏';
      if (!b.gameTitle) gEl.classList.add('empty');
      it.addEventListener('click', function () { closeBoardPopover(); if (b.id !== store.activeId) switchBoard(b.id); });
      // 长按 / 双击 / 右键 → 重命名（与下拉的"快速切换"语义区分）
      it.addEventListener('dblclick', function (e) {
        e.stopPropagation();
        if (e.target.closest && e.target.closest('.nb-bi-actions')) return;   // 双击 ✎/🗑 不该弹重命名
        closeBoardPopover(); openBoardModal(b.id);
      });
      // 右侧行内操作：重命名 + 删除（hover 浮现，避免误触）
      var acts = document.createElement('span');
      acts.className = 'nb-bi-actions';
      acts.style.cssText = 'display:flex;align-items:center;gap:1px;flex:0 0 auto;';
      var renameBtn = document.createElement('button');
      renameBtn.className = 'nb-bpop-iact'; renameBtn.title = '重命名 / 改关联'; renameBtn.textContent = '✎';
      renameBtn.addEventListener('click', function (e) { e.stopPropagation(); closeBoardPopover(); openBoardModal(b.id); });
      acts.appendChild(renameBtn);
      var delBtn = document.createElement('button');
      delBtn.className = 'nb-bpop-iact nb-bpop-del'; delBtn.title = '删除画板'; delBtn.textContent = '🗑';
      delBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        confirmDialog('删除画板', '删除「' + (b.title || '未命名画板') + '」？其中的便签会一并删除，此操作不可撤销。', {
          okText: '删除', danger: true, onOk: function () {
            closeBoardPopover();
            deleteBoard(b.id);
            renderBoardPopover();
            if (boardPopCount) boardPopCount.textContent = '共 ' + store.boards.length + ' 个';
          }
        });
      });
      acts.appendChild(delBtn);
      it.appendChild(acts);
      boardPopList.appendChild(it);
    });
  }
  function buildBoardUI() {
    if (!boardToggle) return;
    boardToggle.addEventListener('click', function () { toggleBoardPanel(); });
    boardClose.addEventListener('click', function () { toggleBoardPanel(false); });
    boardBackdrop.addEventListener('click', function () { toggleBoardPanel(false); });
    newBoardBtn.addEventListener('click', function () { openBoardModal(null); });
    boardModalCancel.addEventListener('click', function () { closeBoardModal(); });
    boardModal.addEventListener('click', function (e) { if (e.target === boardModal) closeBoardModal(); });
    boardModalOk.addEventListener('click', function () { commitBoardModal(); });
    boardTitleInput.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); commitBoardModal(); } });
    setupGameCombo();
  }
  // 关联游戏：可搜索组合框（输入即过滤游戏库，也支持自由填写）
  function openGamePanel() { renderGamePanel(); if (gameCombo) gameCombo.classList.add('open'); }
  function closeGamePanel() { if (gameCombo) gameCombo.classList.remove('open'); }
  function mkGameOpt(text, val, isNew) {
    var d = document.createElement('div');
    d.className = 'nb-game-opt' + (isNew ? ' new' : '');
    d.textContent = text;
    d.addEventListener('mousedown', function (e) { e.preventDefault(); pickGame(val); });  // 抢在 blur 前
    return d;
  }
  function pickGame(val) {
    if (val === '__new__') { /* 保留当前输入文本 */ }
    else if (val === '') { boardGameInput.value = ''; }
    else { boardGameInput.value = val; }
    closeGamePanel();
    setTimeout(function () { try { boardGameInput.focus(); } catch (_) {} }, 0);
  }
  function renderGamePanel() {
    if (!gamePanel) return;
    var all = getGameLibrary();
    var q = (boardGameInput.value || '').trim().toLowerCase();
    var list = all.filter(function (t) { return !q || t.toLowerCase().indexOf(q) >= 0; });
    var exact = all.some(function (t) { return t.toLowerCase() === q; });
    gamePanel.innerHTML = '';
    gamePanel.appendChild(mkGameOpt('— 不关联 —', '', false));
    list.forEach(function (t) { gamePanel.appendChild(mkGameOpt(t, t, false)); });
    if (q && !exact) gamePanel.appendChild(mkGameOpt('使用「' + boardGameInput.value.trim() + '」（自由填写）', '__new__', true));
  }
  function setupGameCombo() {
    if (!gameCombo) return;
    boardGameInput.addEventListener('focus', openGamePanel);
    boardGameInput.addEventListener('click', openGamePanel);
    boardGameInput.addEventListener('input', openGamePanel);
    boardGameInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); closeGamePanel(); commitBoardModal(); }
      else if (e.key === 'Escape') { closeGamePanel(); }
    });
    document.addEventListener('pointerdown', function (e) {
      if (gameCombo && !gameCombo.contains(e.target)) closeGamePanel();
    });
  }
  function toggleBoardPanel(force) {
    var show = (typeof force === 'boolean') ? force : !boardPanel.classList.contains('show');
    boardPanel.classList.toggle('show', show);
    boardBackdrop.classList.toggle('show', show);
  }
  function renderBoardPanel() {
    if (!boardList) return;
    boardList.innerHTML = '';
    store.boards.forEach(function (b) {
      var item = document.createElement('div');
      item.className = 'nb-board-item' + (b.id === store.activeId ? ' active' : '');
      item.innerHTML =
        '<div class="nb-bi-top">' +
          '<span class="nb-bi-dot" style="background:' + (b.accent || '#B86FD8') + '"></span>' +
          '<span class="nb-bi-title"></span>' +
          // 操作按钮放进标题行（真实 flex 子元素）：标题自然省略号截断，永远不重叠；
          // 平时 opacity:0 但占据布局，hover / 键盘聚焦 / 当前板时浮现（见 CSS）。
          '<span class="nb-bi-actions">' +
            '<button class="nb-rename" title="重命名" aria-label="重命名画板">✎</button>' +
            '<button class="nb-del danger" title="删除" aria-label="删除画板">🗑</button>' +
          '</span>' +
        '</div>' +
        '<div class="nb-bi-game' + (b.gameTitle ? '' : ' empty') + '"></div>' +
        '<div class="nb-bi-count"></div>';
      item.querySelector('.nb-bi-title').textContent = b.title || '未命名画板';
      item.querySelector('.nb-bi-game').textContent = b.gameTitle ? b.gameTitle : '未关联游戏';
      item.querySelector('.nb-bi-count').textContent = (b.notes ? b.notes.length : 0) + ' 张便签';
      item.addEventListener('click', function (e) {
        if (e.target.closest('.nb-bi-actions')) return;     // 操作按钮不触发切换
        switchBoard(b.id);
      });
      item.querySelector('.nb-rename').addEventListener('click', function (e) { e.stopPropagation(); openBoardModal(b.id); });
      item.querySelector('.nb-del').addEventListener('click', function (e) {
        e.stopPropagation();
        confirmDialog('删除画板', '删除「' + (b.title || '未命名画板') + '」？其中的便签会一并删除，此操作不可撤销。', {
          okText: '删除', danger: true, onOk: function () { deleteBoard(b.id); }
        });
      });
      boardList.appendChild(item);
    });
  }
  function switchBoard(id) {
    if (id === store.activeId && board) { toggleBoardPanel(false); return; }
    store.activeId = id; board = activeBoard();
    undoStack.length = 0; redoStack.length = 0;        // 历史只针对单个画板，换板即清空
    deselect(); applyBg(); applyAccent(); applyCam(); renderAll();
    enterMode();
    renderBoardPanel(); updateGameBanner(); updateBoardName(); markAppearance();
    renderDiaryLib(); markDirtyAll(); scheduleSave(); requestMiniUpdate();
    toggleBoardPanel(false);
  }
  function openBoardModal(id, tplKey) {
    // 画板可能刚被删掉（列表重渲染前的残留点击 / 延迟触发的双击）：
    // 此时若继续走重命名分支，会开出一个标题写「重命名画板」、输入框却是空白的弹窗。
    if (id && !store.boards.some(function (x) { return x.id === id; })) return;
    editingId = id || null;
    var g = '';
    if (id) {
      var b = store.boards.filter(function (x) { return x.id === id; })[0];
      boardModalTitle.textContent = '重命名画板';
      boardTitleInput.value = b ? b.title : '';
      g = b ? (b.gameTitle || '') : '';
      if (tplSection) tplSection.classList.add('hide');   // 重命名时不显示模板
    } else {
      boardModalTitle.textContent = '新建画板';
      boardTitleInput.value = '';
      selectedTpl = tplKey || 'blank';                    // 每次新建默认回到完全白板；命令面板可直接预选模板
      renderTplGrid();
      if (tplSection) tplSection.classList.remove('hide');
    }
    boardGameInput.value = g;             // 组合框直接显示当前关联（可搜索/可改）
    boardModal.classList.add('show');
    setTimeout(function () { boardTitleInput.focus(); }, 30);
  }
  function closeBoardModal() { boardModal.classList.remove('show'); editingId = null; }
  function commitBoardModal() {
    var t = boardTitleInput.value.trim() || (editingId ? '' : '未命名画板');
    var g = boardGameInput.value.trim();
    if (editingId) {
      var b = store.boards.filter(function (x) { return x.id === editingId; })[0];
      if (b) { if (t) b.title = t; b.gameTitle = g; board = b; markDirty('boards', b.id); }
      renderBoardPanel(); updateGameBanner(); updateBoardName(); save(); toast('已重命名', 'ok');
    } else {
      var nb = newBoard(t); nb.gameTitle = g;
      applyTemplate(nb, selectedTpl);     // 灌入选中模板的种子便签 / 背景 / 主题色
      store.boards.push(nb); store.activeId = nb.id; board = nb;
      board.cam = { x: viewport.clientWidth / 2, y: viewport.clientHeight / 2, scale: 1 };
      deselect(); applyBg(); applyAccent(); applyCam(); renderAll();
      enterMode();                        // 进入模板专属模式（连线 / 日期带 / 排版…）
      if (board.notes.length) fitView();  // 让模板内容自动适配到视口内
      // 模板种子便签依次「落下」：错开 34ms，像纸片一张张铺到桌面上
      if (motionOK()) board.notes.forEach(function (n, idx) {
        var dn = noteEls[n.id]; if (dn) dropIn(dn, n, Math.min(idx * 34, 460));
      });
      playUnbox();                        // 开箱序列：招牌元素生长 + 落定后浮出「第一步」提示
      renderBoardPanel(); updateGameBanner(); updateBoardName(); markAppearance();
      markDirty('boards', nb.id);
      (nb.notes || []).forEach(function (n) { if (n && n.id) markDirty('notes', n.id); });
      (nb.stages || []).forEach(function (s) { if (s && s.id) markDirty('stages', s.id); });
      (nb.clusters || []).forEach(function (cl) { if (cl && cl.id) markDirty('clusters', cl.id); });
      scheduleSave(); requestMiniUpdate();
      toast('已创建画板「' + nb.title + '」', 'ok');
    }
    closeBoardModal();
  }
  function deleteBoard(id) {
    if (store.boards.length <= 1) {
      // 至少保留一个画板：清空当前而非删除
      var b = store.boards[0];
      (b.notes || []).forEach(function (n) { if (n && n.id) markDel('notes', n.id); });
      (b.stages || []).forEach(function (s) { if (s && s.id) markDel('stages', s.id); });
      (b.clusters || []).forEach(function (cl) { if (cl && cl.id) markDel('clusters', cl.id); });
      (b.diaries || []).forEach(function (d) { if (d && d.id) markDel('diaries', d.id); });
      // 必须与上面的 markDel 一一对应：只记删除却不清本地，会出现"云端已删、本地还在"，
      // 之后一旦该 id 被 markDirty 就会重新 upsert 回云端（删了又复活）。
      b.notes = []; b.stages = []; b.clusters = []; b.diaries = []; b.links = [];
      b.title = '我的画板'; b.gameTitle = '';
      board = b; deselect(); applyBg(); applyCam(); renderAll(); enterMode();
      renderBoardPanel(); updateGameBanner(); updateBoardName();
      markDirty('boards', b.id); scheduleSave();
      toast('已清空画板（至少保留一个）');
      return;
    }
    var idx = store.boards.findIndex(function (x) { return x.id === id; });
    if (idx < 0) return;
    var gone = store.boards[idx];
    store.boards.splice(idx, 1);
    markDel('boards', id);              // 子表由云端级联删除（on delete cascade）
    if (editingId === id) closeBoardModal();   // 别给已删除的画板留着「重命名」弹窗
    if (store.activeId === id) {
      var next = store.boards[Math.max(0, idx - 1)];
      store.activeId = next.id; board = next;
      deselect(); applyBg(); applyAccent(); applyCam(); renderAll(); enterMode();
    }
    renderBoardPanel(); updateGameBanner(); updateBoardName(); markAppearance();
    renderDiaryLib(); scheduleSave(); requestMiniUpdate();
    toast('已删除画板「' + (gone.title || '未命名画板') + '」');
  }
  function updateGameBanner() {
    if (!gameBanner || !board) return;
    if (board.gameTitle) {
      gameBanner.classList.remove('empty');
      gameBanner.textContent = '🎮 ' + board.gameTitle;
      if (insertGameCardBtn) insertGameCardBtn.style.display = '';
    } else {
      gameBanner.classList.add('empty');
      gameBanner.textContent = '未关联游戏';
      if (insertGameCardBtn) insertGameCardBtn.style.display = 'none';
    }
  }
  if (insertGameCardBtn) insertGameCardBtn.addEventListener('click', function () { insertGameCardFromBoard(); });

  // ---------- 进度分章（给便签归类到游戏进程章节） ----------
  var stageBtn = document.getElementById('stageBtn');
  var stageModal = document.getElementById('stageModal');
  var stageList = document.getElementById('stageList');
  var stageNewInput = document.getElementById('stageNewInput');
  var stageAddBtn = document.getElementById('stageAddBtn');
  var stageQuick = document.getElementById('stageQuick');
  var stageModalClose = document.getElementById('stageModalClose');

  function pad2(n) { return (n < 10 ? '0' : '') + n; }
  function fmtDate(d) { return d.getFullYear() + '年' + (d.getMonth() + 1) + '月' + d.getDate() + '日'; }
  function esc(s) { return (s || '').replace(/[&<>]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]; }); }

  // ---------- P1：框选成簇 ----------
  var selModeBtn = document.getElementById('selModeBtn');
  var selMode = false;
  var clusterBar = document.getElementById('clusterBar');
  var cbCount = document.getElementById('cbCount');
  var cbCluster = document.getElementById('cbCluster');
  var cbClear = document.getElementById('cbClear');
  var marquee = document.getElementById('marquee');
  var marqueeState = null;

  function showClusterBar() { if (!clusterBar) return; cbCount.textContent = '已选 ' + selectedIds.length + ' 张'; clusterBar.classList.add('show'); }
  function hideClusterBar() { if (clusterBar) clusterBar.classList.remove('show'); }
  function setSelection(ids) {
    selectedId = ids.length ? ids[0] : null;
    selectedIds = ids.slice();
    Object.keys(noteEls).forEach(function (k) { noteEls[k].classList.toggle('selected', selectedIds.indexOf(k) >= 0); });
    if (selectedIds.length > 1) { hideFloatbar(); showClusterBar(); }
    else if (selectedIds.length === 1) { hideClusterBar(); showFloatbar(); }
    else { hideFloatbar(); hideClusterBar(); }
  }
  function toggleSelMode(force) {
    selMode = (typeof force === 'boolean') ? force : !selMode;
    if (selModeBtn) selModeBtn.classList.toggle('active', selMode);
    if (!selMode) {
      cancelMarquee();
      if (selectedIds.length > 1) {
        selectedIds = [];
        Object.keys(noteEls).forEach(function (k) { noteEls[k].classList.remove('selected'); });
        hideClusterBar();
      }
    }
  }
  function startMarquee(e) {
    cancelMarquee();
    var r = viewport.getBoundingClientRect();
    marqueeState = { x0: e.clientX - r.left, y0: e.clientY - r.top, r: r, pid: e.pointerId };
    try { viewport.setPointerCapture(e.pointerId); } catch (_) {}
    if (marquee) {
      marquee.style.left = marqueeState.x0 + 'px';
      marquee.style.top = marqueeState.y0 + 'px';
      marquee.style.width = '0px'; marquee.style.height = '0px';
      marquee.classList.add('show');
    }
    selectedIds = [];
    Object.keys(noteEls).forEach(function (k) { noteEls[k].classList.remove('selected'); });
    hideFloatbar(); hideClusterBar();
  }
  function moveMarquee(e) {
    if (!marqueeState || !marquee) return;
    var x1 = e.clientX - marqueeState.r.left, y1 = e.clientY - marqueeState.r.top;
    var x = Math.min(x1, marqueeState.x0), y = Math.min(y1, marqueeState.y0);
    var w = Math.abs(x1 - marqueeState.x0), h = Math.abs(y1 - marqueeState.y0);
    marquee.style.left = x + 'px'; marquee.style.top = y + 'px';
    marquee.style.width = w + 'px'; marquee.style.height = h + 'px';
  }
  function endMarquee(e) {
    if (!marqueeState) return;
    var r = marqueeState.r;
    var sxa = Math.min(marqueeState.x0, e.clientX - r.left);
    var sya = Math.min(marqueeState.y0, e.clientY - r.top);
    var exa = Math.max(marqueeState.x0, e.clientX - r.left);
    var eya = Math.max(marqueeState.y0, e.clientY - r.top);
    var a = screenToWorld(r.left + sxa, r.top + sya);
    var b = screenToWorld(r.left + exa, r.top + eya);
    var hits = board.notes.filter(function (n) {
      var nx = n.x || 0, ny = n.y || 0, nw = n.w || 200, nh = n.h || (n.type === 'text' ? 90 : 130);
      return nx < b.x && nx + nw > a.x && ny < b.y && ny + nh > a.y;
    }).map(function (n) { return n.id; });
    try { viewport.releasePointerCapture(marqueeState.pid); } catch (_) {}
    cancelMarquee();
    if (hits.length) setSelection(hits);
  }
  function cancelMarquee() {
    if (marqueeState && marqueeState.pid != null) { try { viewport.releasePointerCapture(marqueeState.pid); } catch (_) {} }
    marqueeState = null; if (marquee) marquee.classList.remove('show');
  }
  function hexA(hex, a) {                    // #rgb / #rrggbb → rgba()，给簇描边、主题色浅色用
    var h = (hex || '#B86FD8').replace('#', '');
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    var n = parseInt(h, 16);
    if (isNaN(n)) n = 0xB86FD8;
    return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')';
  }
  function renderClusters() {
    if (!world) return;
    if (!board.clusters) board.clusters = [];
    Array.prototype.slice.call(world.querySelectorAll('.nb-cluster')).forEach(function (el) { el.remove(); });
    board.clusters.forEach(function (cl) {
      var members = board.notes.filter(function (n) { return n.clusterId === cl.id; });
      if (!members.length) return;
      var minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      members.forEach(function (n) {
        var nx = n.x || 0, ny = n.y || 0, nw = n.w || 200, nh = n.h || (n.type === 'text' ? 90 : 130);
        minX = Math.min(minX, nx); minY = Math.min(minY, ny);
        maxX = Math.max(maxX, nx + nw); maxY = Math.max(maxY, ny + nh);
      });
      var pad = 30;
      var el = document.createElement('div'); el.className = 'nb-cluster';
      el.style.left = (minX - pad) + 'px'; el.style.top = (minY - pad) + 'px';
      el.style.width = (maxX - minX + pad * 2) + 'px';
      el.style.height = (maxY - minY + pad * 2) + 'px';
      el.style.borderColor = cl.color; el.style.background = hexA(cl.color, .08);
      var lab = document.createElement('div'); lab.className = 'nb-cluster-label'; lab.style.background = cl.color;
      lab.innerHTML = esc(cl.name) + ' <span class="nb-cl-x" title="解散簇">✕</span>';
      lab.addEventListener('click', function (ev) {
        ev.stopPropagation();
        if (ev.target.classList.contains('nb-cl-x')) { removeCluster(cl.id); return; }
        setSelection(members.map(function (n) { return n.id; }));
      });
      el.appendChild(lab);
      world.insertBefore(el, world.firstChild);
    });
  }
  function createCluster(name) {
    if (!board.clusters) board.clusters = [];
    pushHistory();
    var cl = { id: uid(), name: name || ('主题簇' + (board.clusters.length + 1)), color: ACCENTS[board.clusters.length % ACCENTS.length] };
    board.clusters.push(cl);
    selectedIds.forEach(function (id) { var n = board.notes.find(function (x) { return x.id === id; }); if (n) n.clusterId = cl.id; });
    selectedIds = [];
    Object.keys(noteEls).forEach(function (k) { noteEls[k].classList.remove('selected'); });
    hideClusterBar();
    markDirty('clusters', cl.id);
    board.notes.forEach(function (n) { if (n.clusterId === cl.id) markDirty('notes', n.id); });
    renderClusters(); scheduleSave();
  }
  function removeCluster(id) {
    pushHistory();
    board.clusters = (board.clusters || []).filter(function (c) { return c.id !== id; });
    board.notes.forEach(function (n) { if (n.clusterId === id) { delete n.clusterId; markDirty('notes', n.id); } });
    markDel('clusters', id);
    renderClusters(); scheduleSave();
  }

  // ---------- 生成画板图片：忠实还原用户摆好的布局（不总结、不重排，只截取内容范围，不截整张无限画布） ----------
  var diaryBtn = document.getElementById('diaryBtn');
  var diaryModal = document.getElementById('diaryModal');
  var diaryContent = document.getElementById('diaryContent');
  var diaryStatus = document.getElementById('diaryStatus');
  var diaryClose = document.getElementById('diaryClose');
  var diaryCopy = document.getElementById('diaryCopy');
  var diaryDownload = document.getElementById('diaryDownload');
  var diarySave = document.getElementById('diarySave');
  var editingDiaryId = null;                // 非空 = 正在查看已保存的日记图片
  var currentDiaryImg = null;               // 最新生成的画板图片 dataURL（用于下载/复制/保存）

  // 背景样式（与 .nb-viewport.bg-* 对应，直接内联到离屏画布）
  // 出图用的画布底色 + 材质（与屏幕上的材质完全同源，保证「所见即所得」）
  function boardBgStyle() {
    var m = materialOf(board.material || board.bg), t = themeOf(board.theme);
    return { backgroundColor: t.canvas, backgroundImage: m.img, backgroundSize: m.size };
  }
  // 把当前画板「原样」渲染成一张 PNG：便签位置/大小/样式、簇框、背景都照搬，只截取内容包围盒
  function renderBoardImage(cb) {
    if (!diaryContent) { if (cb) cb(null); return; }
    if (window.html2canvas) go(); else loadHtml2Canvas(go);
    function go() {
      var notes = board.notes;
      diaryContent.innerHTML = '';
      if (!notes.length) { setDiaryStatus('这个画板还没有便签，先去记下一些再生成图片'); if (cb) cb(null); return; }
      // 内容包围盒（世界坐标）—— 旋转便签的角会超出 w×h 矩形，按展开后的外接矩形并入包围盒
      var minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      notes.forEach(function (n) {
        var w = n.w || 200, h = n.h || (n.type === 'image' ? 160 : (n.type === 'text' ? 90 : 130));
        var cx = (n.x || 0) + w / 2, cy = (n.y || 0) + h / 2;          // 旋转中心 = 便签中心
        var rad = ((n.rot || 0) * Math.PI) / 180;
        var ex = Math.abs(Math.cos(rad)) * w / 2 + Math.abs(Math.sin(rad)) * h / 2;  // 外接矩形半宽
        var ey = Math.abs(Math.sin(rad)) * w / 2 + Math.abs(Math.cos(rad)) * h / 2;  // 外接矩形半高
        minX = Math.min(minX, cx - ex); minY = Math.min(minY, cy - ey);
        maxX = Math.max(maxX, cx + ex); maxY = Math.max(maxY, cy + ey);
      });
      var pad = 48;
      var BRAND_H = 54;                        // 底部 herlens 品牌落款带高
      var W = Math.ceil(maxX - minX + pad * 2), H = Math.ceil(maxY - minY + pad * 2);
      var totalH = H + BRAND_H;

      var stage = document.createElement('div');
      stage.style.cssText = 'position:fixed;left:-99999px;top:0;overflow:hidden;box-sizing:border-box;width:' + W + 'px;height:' + totalH + 'px;';
      var bg = boardBgStyle();
      for (var k in bg) if (bg.hasOwnProperty(k)) stage.style[k] = bg[k];

      // 簇框（照搬用户画的圈）
      (board.clusters || []).forEach(function (cl) {
        var mem = notes.filter(function (n) { return n.clusterId === cl.id; });
        if (!mem.length) return;
        var cMinX = Infinity, cMinY = Infinity, cMaxX = -Infinity, cMaxY = -Infinity;
        mem.forEach(function (n) {
          var w = n.w || 200, h = n.h || (n.type === 'image' ? 160 : (n.type === 'text' ? 90 : 130));
          cMinX = Math.min(cMinX, n.x || 0); cMinY = Math.min(cMinY, n.y || 0);
          cMaxX = Math.max(cMaxX, (n.x || 0) + w); cMaxY = Math.max(cMaxY, (n.y || 0) + h);
        });
        var cpad = 30;
        var box = document.createElement('div');
        box.style.cssText = 'position:absolute;left:' + (cMinX - cpad - minX + pad) + 'px;top:' + (cMinY - cpad - minY + pad) + 'px;' +
          'width:' + (cMaxX - cMinX + cpad * 2) + 'px;height:' + (cMaxY - cMinY + cpad * 2) + 'px;' +
          'border:2px solid ' + cl.color + ';border-radius:16px;background:' + hexA(cl.color, .08) + ';box-sizing:border-box;';
        var lab = document.createElement('div');
        lab.textContent = cl.name || '主题簇';
        lab.style.cssText = 'position:absolute;left:10px;top:-12px;background:' + cl.color + ';color:#fff;font-size:12px;font-weight:600;padding:2px 10px;border-radius:10px;';
        box.appendChild(lab);
        stage.appendChild(box);
      });

      // 便签：克隆真实 DOM，去掉拖拽手柄/缩放钮/选中态，按原坐标摆放
      notes.forEach(function (n) {
        var src = noteEls[n.id]; if (!src) return;
        var clone = src.cloneNode(true);
        clone.classList.remove('selected');
        clone.removeAttribute('contenteditable');
        Array.prototype.forEach.call(clone.querySelectorAll('.nb-grip, .nb-resize'), function (g) { g.remove(); });
        Array.prototype.forEach.call(clone.querySelectorAll('[contenteditable]'), function (e) { e.removeAttribute('contenteditable'); });
        clone.style.position = 'absolute';
        clone.style.left = ((n.x || 0) - minX + pad) + 'px';
        clone.style.top = ((n.y || 0) - minY + pad) + 'px';
        clone.style.transform = n.rot ? 'rotate(' + n.rot + 'deg)' : 'none';   // 保留模板给的轻微倾斜
        clone.style.margin = '0';
        stage.appendChild(clone);
      });

      // 底部 herlens 品牌落款（仿主站分享图：居中渐变细线 + 小字 logo）
      var brandFoot = document.createElement('div');
      brandFoot.style.cssText = 'position:absolute;left:0;right:0;top:' + H + 'px;text-align:center;padding:10px 0 6px;box-sizing:border-box;';
      var bLine = document.createElement('div');
      bLine.style.cssText = 'width:60%;height:1px;margin:0 auto 12px;background:linear-gradient(90deg,transparent,rgba(155,138,189,0.4),transparent);';
      var bText = document.createElement('div');
      bText.style.cssText = 'font-size:11px;color:rgba(155,138,189,0.85);font-weight:500;letter-spacing:0.12em;text-align:center;';
      bText.textContent = '·  HER LENS · 女性主角游戏收录';
      brandFoot.appendChild(bLine);
      brandFoot.appendChild(bText);
      stage.appendChild(brandFoot);

      document.body.appendChild(stage);
      setDiaryStatus('正在生成图片…');
      var scale = (W * H > 2200000) ? 1 : 2;
      window.html2canvas(stage, { scale: scale, backgroundColor: null, useCORS: true, logging: false })
        .then(function (canvas) {
          currentDiaryImg = canvas.toDataURL('image/png');
          document.body.removeChild(stage);
          if (diaryContent) diaryContent.innerHTML = '<img class="d-board-img" src="' + currentDiaryImg + '" alt="画板图片"/>';
          setDiaryStatus('已生成图片 ✓ 可直接下载或保存');
          // 生成一张画板图 → 打赏轻提示（点击回主站弹打赏窗）
          try {
            if (window.HerLensTip) window.HerLensTip.consider('img', {
              title: '欢迎使用HerLens',
              sub: '喜欢网站的姊妹可以奖励努力工作的比格一个鸡腿吗？',
              action: '投喂比格',
              onOpen: function () { try { window.location.href = '../index.html?tip=1'; } catch (e) {} }
            });
          } catch (e) {}
          if (cb) cb(currentDiaryImg);
        })
        .catch(function (err) {
          try { document.body.removeChild(stage); } catch (e) {}
          // 尽量给出可诊断的原因；最常见的几类在下文按特征提示
          var why = err && (err.message || String(err));
          var hint = '图片生成失败，请重试';
          var m = (why || '').toLowerCase();
          if (/tainted|cross.?origin|corrupt|drawimage/i.test(m)) hint = '生成失败：便签里有些外链图片无法跨域读取，请稍后再试';
          else if (why) { try { console.error('[boardImg]', why); } catch (_) {} hint = '生成失败（' + String(why).slice(0, 60) + '）'; }
          setDiaryStatus(hint);
          if (cb) cb(null);
        });
    }
  }
  function setDiaryStatus(t) { if (diaryStatus) diaryStatus.textContent = t || ''; }
  function toggleDiary(force) {
    var show = (typeof force === 'boolean') ? force : !diaryModal.classList.contains('show');
    diaryModal.classList.toggle('show', show);
    if (show && !editingDiaryId) { renderBoardImage(); }
    if (!show) { editingDiaryId = null; if (diarySave) diarySave.textContent = '保存到日记库'; currentDiaryImg = null; setDiaryStatus(''); }
  }

  // ---------- 日记库：生成结果以图片形式保存、回看 ----------
  var diaryList = document.getElementById('diaryList');
  var diaryLibCount = document.getElementById('diaryLibCount');
  function diariesOf() { return board.diaries || (board.diaries = []); }
  // 相对时间：今天 / 昨天 / N 天前 / 具体日期 —— 让「什么时候写的」一眼有感
  function relTime(ts) {
    var d = new Date(ts || Date.now()); d.setHours(0, 0, 0, 0);
    var t = new Date(); t.setHours(0, 0, 0, 0);
    var n = Math.round((t - d) / 86400000);
    if (n <= 0) return '今天';
    if (n === 1) return '昨天';
    if (n < 7) return n + ' 天前';
    if (n < 30) return Math.floor(n / 7) + ' 周前';
    if (d.getFullYear() === t.getFullYear()) return (d.getMonth() + 1) + ' 月 ' + d.getDate() + ' 日';
    return d.getFullYear() + ' 年 ' + (d.getMonth() + 1) + ' 月 ' + d.getDate() + ' 日';
  }
  function renderDiaryLib() {
    if (!diaryList) return;
    var ds = diariesOf();
    if (diaryLibCount) diaryLibCount.textContent = ds.length ? '（' + ds.length + ' 篇）' : '';
    diaryList.innerHTML = '';
    if (!ds.length) {
      var em = document.createElement('div'); em.className = 'nb-usage-text';
      em.textContent = '还没有保存过图片。点顶栏 📖 生成后，可以直接下载或保存到这里的日记库。';
      diaryList.appendChild(em); return;
    }
    ds.slice().sort(function (a, b) { return (b.createdAt || 0) - (a.createdAt || 0); }).forEach(function (d) {
      var when = new Date(d.createdAt || Date.now());
      var it = document.createElement('div'); it.className = 'nb-diary-item';
      var main = document.createElement('div'); main.className = 'nb-diary-item-main';
      main.style.cssText = 'display:flex;align-items:center;gap:8px;';
      var thumb = document.createElement('img'); thumb.className = 'nb-diary-thumb'; thumb.src = d.img || ''; thumb.alt = '';
      var stamp = document.createElement('div'); stamp.className = 'nb-diary-when';
      stamp.innerHTML = '<b>' + when.getDate() + '</b><span>' + (when.getMonth() + 1) + '月</span>';
      stamp.title = fmtDate(when);
      var txt = document.createElement('div'); txt.style.flex = '1'; txt.style.minWidth = '0';
      var nm = document.createElement('div'); nm.className = 'nb-diary-item-name'; nm.textContent = d.title || '未命名日记';
      var sb = document.createElement('div'); sb.className = 'nb-diary-item-sub';
      sb.innerHTML = '<span class="nb-rel">' + esc(relTime(d.createdAt)) + '</span> · ' + (d.noteCount || 0) + ' 张便签';
      txt.appendChild(nm); txt.appendChild(sb);
      main.appendChild(thumb); main.appendChild(stamp); main.appendChild(txt);
      var del = document.createElement('button'); del.className = 'nb-diary-item-del'; del.textContent = '✕'; del.title = '删除这篇日记';
      del.addEventListener('click', function (e) {
        e.stopPropagation();
        confirmDialog('删除日记', '删除这篇日记？此操作不可撤销。', {
          okText: '删除', danger: true, onOk: function () {
            board.diaries = diariesOf().filter(function (x) { return x.id !== d.id; });
            markDel('diaries', d.id);
            scheduleSave(); renderDiaryLib(); toast('已删除日记');
          }
        });
      });
      it.appendChild(main); it.appendChild(del);
      it.addEventListener('click', function () { openSavedDiary(d.id); });
      diaryList.appendChild(it);
    });
  }
  function openSavedDiary(id) {
    var d = diariesOf().filter(function (x) { return x.id === id; })[0];
    if (!d) return;
    editingDiaryId = d.id;
    if (diaryContent) diaryContent.innerHTML = '<img class="d-board-img" src="' + (d.img || '') + '" alt="已保存的日记"/>';
    if (diarySave) diarySave.textContent = '更新这篇日记';
    currentDiaryImg = d.img || null;
    setDiaryStatus('这是已保存的日记图片');
    toggleBoardPanel(false);
    toggleDiary(true);
  }
  function saveDiary() {
    if (!currentDiaryImg) {
      showAlert('还没生成图片', '图片正在生成中，请稍候再点保存；或重新打开日记。', '知道了', null, false); return;
    }
    var tplName = '画板';
    var ds = diariesOf();
    var exist = editingDiaryId ? ds.filter(function (x) { return x.id === editingDiaryId; })[0] : null;
    var rec;
    if (exist) {
      exist.img = currentDiaryImg; exist.tpl = 'board'; exist.templateName = tplName;
      exist.noteCount = board.notes.length; exist.updatedAt = Date.now();
      rec = exist;
    } else {
      rec = {
        id: uid(),
        title: (board.gameTitle || board.title || '我的游戏') + ' · 画板图片',
        img: currentDiaryImg, tpl: 'board', templateName: tplName,
        noteCount: board.notes.length, createdAt: Date.now()
      };
      ds.push(rec);
      editingDiaryId = rec.id;
    }
    markDirty('diaries', rec.id);
    if (save()) {
      renderDiaryLib();
      if (diarySave) diarySave.textContent = '更新这篇日记';
      showAlert('已保存到日记库', '在画板面板的「日记库」里可以随时回看这张图片。', '好的', null, false);
    }
  }
  function loadHtml2Canvas(cb) {
    if (window.html2canvas) { cb(); return; }
    // 本地优先（随页面一起发布，国内可用），随后用国内/CDN 多镜像兜底。
    // jsdelivr 在国内常被墙或返回空 body，会导致 html2canvas 加载失败 → “图片生成失败”。
    var srcs = [
      (document.currentScript ? document.currentScript.getAttribute('data-base') : null), // 预留：由页面注入的本地路径
      new URL('libs/html2canvas.min.js', document.baseURI).href,   // 相对当前页面：libs/html2canvas.min.js
      'https://unpkg.com/html2canvas@1.4.1/dist/html2canvas.min.js',
      'https://registry.npmmirror.com/html2canvas/1.4.1/files/dist/html2canvas.min.js',
      'https://cdn.staticfile.org/html2canvas/1.4.1/html2canvas.min.js',
      'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js'
    ].filter(Boolean);
    var i = 0;
    function next() {
      if (window.html2canvas) { cb(); return; }
      if (i >= srcs.length) { setDiaryStatus('图片组件加载失败，请检查网络后重试'); return; }
      var s = document.createElement('script');
      s.src = srcs[i++];
      s.onload = next;                                  // 加载完即便没成功(空文件)，继续尝试下一个
      s.onerror = next;
      document.head.appendChild(s);
    }
    next();
  }
  // 复制图片到剪贴板（不支持时退化为下载）
  function copyImageToClipboard(dataUrl, btn) {
    var revert = function (label) { if (btn) { var o = btn.textContent; btn.textContent = label; setTimeout(function () { btn.textContent = o; }, 1300); } };
    if (navigator.clipboard && navigator.clipboard.write && window.ClipboardItem) {
      try {
        fetch(dataUrl).then(function (r) { return r.blob(); }).then(function (blob) {
          navigator.clipboard.write([new window.ClipboardItem({ 'image/png': blob })])
            .then(function () { revert('已复制 ✓'); })
            .catch(function () { fallbackImgDownload(dataUrl, revert); });
        }).catch(function () { fallbackImgDownload(dataUrl, revert); });
      } catch (e) { fallbackImgDownload(dataUrl, revert); }
    } else { fallbackImgDownload(dataUrl, revert); }
  }
  function fallbackImgDownload(dataUrl, revert) {
    var a = document.createElement('a');
    a.download = (board.gameTitle || '游戏') + '_画板图片.png';
    a.href = dataUrl; a.click();
    if (revert) revert('已下载');
    showAlert('已改为下载', '当前环境不支持直接复制图片到剪贴板，已帮你下载到本地。', '好的', null, false);
  }

  // ---------- 零摩擦采集：热键速记浮层 + 游玩天数 ----------
  var quickNote = document.getElementById('quickNote');
  var quickInput = document.getElementById('quickInput');
  var quickMeta = document.getElementById('quickMeta');

  function firstTsOf() {
    var ts = board.notes.map(function (n) { return n.createdAt || 0; }).filter(function (t) { return t > 0; });
    return ts.length ? Math.min.apply(null, ts) : Date.now();
  }
  function dayIndexOf(ts) {                     // 相对这个画板第一条感想的天数，从 1 起算
    var a = new Date(firstTsOf()); a.setHours(0, 0, 0, 0);
    var b = new Date(ts || Date.now()); b.setHours(0, 0, 0, 0);
    return Math.max(1, Math.round((b - a) / 86400000) + 1);
  }
  function dayLabel(ts) { return '第 ' + dayIndexOf(ts) + ' 天'; }

  function toggleQuick(force) {
    if (!quickNote) return;
    var show = (typeof force === 'boolean') ? force : !quickNote.classList.contains('show');
    if (show) {
      if (quickMeta) quickMeta.textContent = (board.gameTitle || board.title || '当前画板') + ' · ' + dayLabel(Date.now()) + ' · 随手记';
      quickNote.classList.add('show');
      setTimeout(function () { if (quickInput) quickInput.focus(); }, 30);
    } else {
      quickNote.classList.remove('show');
      if (quickInput) { quickInput.value = ''; if (document.activeElement === quickInput) quickInput.blur(); }
    }
  }
  function quickAdd() {
    if (!quickInput) return;
    var v = quickInput.value.replace(/\s+$/, '');
    if (!v) { toggleQuick(false); return; }
    var c = screenToWorld(viewport.clientWidth / 2, viewport.clientHeight / 2);
    var j = board.notes.length % 6;                        // 轻微错开，避免连记多条完全重叠
    var n = {
      id: uid(),
      x: Math.round(c.x - 105 + j * 13), y: Math.round(c.y - 55 + j * 11),
      type: 'sticky', pinned: false, createdAt: Date.now(),
      w: 210, h: 130, title: '', body: esc(v).replace(/\n/g, '<br>')
    };
    board.notes.push(n);
    var el = buildNote(n); world.appendChild(el); dropIn(el, n);
    updateEmpty(); updateCount(); selectNote(n.id);
    markDirty('notes', n.id); scheduleSave();
    quickInput.value = '';
    if (quickMeta) quickMeta.textContent = '已记下 · ' + dayLabel(Date.now()) + ' · 可以继续写';
    quickInput.focus();
  }
  document.addEventListener('keydown', function (e) {
    if (e.altKey && !e.ctrlKey && !e.metaKey && (e.key === 'n' || e.key === 'N')) {
      e.preventDefault();
      var ae = document.activeElement;
      if (ae && (ae.isContentEditable || ae.tagName === 'INPUT' || ae.tagName === 'TEXTAREA')) return;  // 正在打字时不抢
      toggleQuick();
      return;
    }
    if (!quickNote || !quickNote.classList.contains('show')) return;
    if (document.activeElement !== quickInput) return;
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); quickAdd(); }
    else if (e.key === 'Escape') { e.preventDefault(); toggleQuick(false); }
  });

  // ============================================================
  // 模板模式专属新功能（思维导图 / 文档 / 手账 / 角色卡 / 测评）
  // 每个模板不再是「预置便签」，而是带专属交互的「模式」
  // ============================================================
  var SVGNS = 'http://www.w3.org/2000/svg';
  var modeBar = null, linkSrc = null, linking = false, docFlow = false, journalFilter = null, tocEl = null, ratingEl = null;
  var RATE_KEYS = [{ k: 'art', l: '画面' }, { k: 'story', l: '剧情' }, { k: 'gameplay', l: '玩法' }, { k: 'music', l: '音乐' }];

  function dateStr(d) {
    var y = d.getFullYear(), m = ('0' + (d.getMonth() + 1)).slice(-2), day = ('0' + d.getDate()).slice(-2);
    return y + '-' + m + '-' + day;
  }
  function modeOf() { return (board && board.tpl) || 'blank'; }

  function ensureModeBar() {
    if (modeBar) return;
    modeBar = document.createElement('div'); modeBar.className = 'nb-modebar'; modeBar.id = 'modeBar';
    document.body.appendChild(modeBar);
  }
  function clearModeBar() { if (modeBar) modeBar.innerHTML = ''; }
  function showModeBar(v) { if (modeBar) modeBar.classList.toggle('show', !!v); }
  function mkMbBtn(ico, label, title, onClick, on) {
    var b = document.createElement('button');
    b.className = 'nb-mb-btn' + (on ? ' on' : '');
    b.innerHTML = (ico ? '<span class="nb-mb-ico">' + ico + '</span>' : '') + '<span>' + label + '</span>';
    b.title = title || '';
    b.addEventListener('click', function (e) { e.stopPropagation(); onClick(b); });
    return b;
  }

  // 模式工具条：按当前画板模式渲染
  // ===== P3 · 开箱序列 & 第一步提示 =====
  // 新建画板后给一句「这一款怎么玩」的起手提示：只浮出一次、点 ✕ 收起、7 秒自动收，
  // 用户第一次按下指针 / 按键时也立刻收起（不打扰真正开始玩的人）。
  var NB_FIRST_TIP = {
    blank: '双击空白处就能落一张便签；底部工具条也能加图片、贴纸和游戏卡。',
    journal: '先写下今天玩到哪儿，右侧的日期带会自动按天接上。',
    mindmap: '点模式条「连线」，再依次点两个便签，就能拉出一条关系线。',
    document: '点「文档排版」把便签排成上下连贯的一篇；选中便签再用 H1 / H2 分级。',
    character: '点「＋字段卡」建一张角色卡，点任意字段就能直接改。',
    review: '点「评分」给画面 / 剧情 / 玩法 / 音乐打分，会自动算总分。',
    checklist: '点便签左边的圆钮勾掉一条，顶部进度条就会往前流。',
    quote: '开「翻面写批注」，点任意金句翻到背面，写下它为什么戳中你。',
    dialogue: '点「播放对白」，每句话会按版面顺序依次亮出来，像回放一场戏。',
    gallery: '点「🖼」切换相纸样式（拍立得 / 相纸 / 胶片），再点「▶ 放映」全屏看一遍。',
    trip: '把「Day 1」「Day 7」这样的标题排成一列，会自动连成行程轨；拖站点会自动吸附。',
    timelineH: '拖动便签跨过阶段分界线，归属会自动改；「⚖ 等距」可一键把阶段排齐。',
    timelineV: '拖动便签跨过阶段分界线，归属会自动改；「⚖ 等距」可一键把阶段排齐。'
  };
  var hintEl = null, hintTimer = null, unboxTimer = null;

  function hideFirstHint() {
    if (hintTimer) { clearTimeout(hintTimer); hintTimer = null; }
    var el = hintEl; hintEl = null;
    if (!el) return;
    el.classList.add('out');
    setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 340);
  }
  function showFirstHint(tplKey) {
    hideFirstHint();
    var txt = NB_FIRST_TIP[tplKey];
    if (!txt) return;
    var el = document.createElement('div');
    el.className = 'nb-hint'; el.id = 'nbHint';
    el.setAttribute('role', 'status');
    el.innerHTML = '<span class="nb-hint-i">👋</span><span class="nb-hint-t">' + esc(txt) +
      '</span><span class="nb-hint-x" role="button" tabindex="0" aria-label="收起提示">✕</span>';
    document.body.appendChild(el);
    hintEl = el;
    var x = el.querySelector('.nb-hint-x');
    x.addEventListener('click', hideFirstHint);
    x.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); hideFirstHint(); } });
    // 用户一动手就收（capture 阶段监听，任何交互都算）
    var off = function () {
      window.removeEventListener('pointerdown', off, true);
      window.removeEventListener('keydown', off, true);
      hideFirstHint();
    };
    window.addEventListener('pointerdown', off, true);
    window.addEventListener('keydown', off, true);
    hintTimer = setTimeout(hideFirstHint, 7000);
  }
  function clearUnbox() {
    if (unboxTimer) { clearTimeout(unboxTimer); unboxTimer = null; }
    if (world) world.classList.remove('nb-unbox');
  }
  // 新建画板的分镜入场：招牌元素（行程轨 / 阶段带 / 模式条）生长 → 便签依次落下 → 第一步提示
  function playUnbox() {
    clearUnbox();
    if (motionOK() && world) {
      world.classList.add('nb-unbox');
      unboxTimer = setTimeout(clearUnbox, 1500);
    }
    setTimeout(function () { showFirstHint(modeOf()); }, motionOK() ? 900 : 80);
  }

  function renderModeBar() {
    ensureModeBar(); clearModeBar();
    var m = modeOf();
    // 只有带专属交互的模板才显示模式条
    if (m === 'blank' || ['mindmap', 'document', 'journal', 'character', 'review', 'checklist', 'quote', 'dialogue',
        'gallery', 'trip', 'timelineH', 'timelineV'].indexOf(m) < 0) { showModeBar(false); return; }
    showModeBar(true);
    if (m === 'mindmap') {
      modeBar.appendChild(mkMbBtn('🔗', linking ? '点便签连线…' : '连线', '连线模式：开启后依次点两个便签即可连一条线', function () { toggleLink(); }, linking));
      modeBar.appendChild(mkMbBtn('➕', '加子节点', '给选中的中心便签添加一个相连的子节点', function () { addChildNote(); }));
      var tip = document.createElement('span'); tip.className = 'nb-mb-hint'; tip.textContent = '选中中心便签再「加子节点」'; modeBar.appendChild(tip);
    } else if (m === 'document') {
      modeBar.appendChild(mkMbBtn('📑', '文档排版', '把便签排成上下连贯的文档流', function () { toggleDocFlow(); }, docFlow));
      modeBar.appendChild(mkMbBtn('', 'H1', '把选中便签设为一级标题', function () { setLevel(1); }));
      modeBar.appendChild(mkMbBtn('', 'H2', '把选中便签设为二级标题', function () { setLevel(2); }));
      modeBar.appendChild(mkMbBtn('', '正文', '把选中便签设为普通正文', function () { setLevel(0); }));
      modeBar.appendChild(mkMbBtn('☰', '大纲', '显示标题大纲，点标题跳转', function () { toggleToc(); }));
      modeBar.appendChild(mkMbBtn('⬇', '导出MD', '导出 Markdown 文档', function () { exportDocMD(); }));
    } else if (m === 'journal') {
      renderDateBar();
    } else if (m === 'character') {
      modeBar.appendChild(mkMbBtn('＋', '字段卡', '新增一张带标签字段的角色卡', function () { addNote('fields'); }));
      modeBar.appendChild(mkMbBtn('✎', '普通便签', '新增一张普通便签', function () { addNote('sticky'); }));
    } else if (m === 'review') {
      modeBar.appendChild(mkMbBtn('⭐', '评分', '给画面/剧情/玩法/音乐打分', function () { openRatings(); }));
    } else if (m === 'checklist') {
      // 进度条：勾选后流动，全勾完变强调色
      var st = checklistStats();
      var pct = st.total ? Math.round(st.done / st.total * 100) : 0;
      var prog = document.createElement('div');
      prog.className = 'nb-cl-prog' + (dlgPlaying ? '' : '') + (st.total && st.done === st.total ? ' all flow' : '');
      prog.innerHTML = '<span class="nb-cl-txt">已通关 ' + st.done + ' / ' + st.total + '</span>' +
        '<span class="nb-cl-track"><span class="nb-cl-fill" style="width:' + pct + '%"></span></span>';
      prog.title = '每勾掉一条，进度就往前流一点';
      modeBar.appendChild(prog);
      modeBar.appendChild(mkMbBtn('☑', '勾选 / 取消', '切换选中条目的勾选状态（也可以直接点便签左侧的圆钮）', function () { toggleCheck(); }));
      modeBar.appendChild(mkMbBtn('＋', '加一条', '新增一条待办（自带勾选框）', function () { addNote('text', { checkable: true }); renderModeBar(); }));
      var ctip = document.createElement('span'); ctip.className = 'nb-mb-hint'; ctip.textContent = '点便签左边的圆钮即可勾选'; modeBar.appendChild(ctip);
    } else if (m === 'quote') {
      modeBar.appendChild(mkMbBtn('🔄', flipMode ? '退出翻面' : '翻面写批注', '开启后：点任意文字便签，翻到背面写「为什么戳中你」', function () { toggleFlipMode(); }, flipMode));
      modeBar.appendChild(mkMbBtn('＋', '加一句', '新增一张带框的金句卡', function () { addQuoteNote(); }));
      var qtip = document.createElement('span'); qtip.className = 'nb-mb-hint';
      qtip.textContent = flipMode ? '点便签翻面写批注，再点翻回正面' : '开「翻面写批注」后，点便签即可翻面';
      modeBar.appendChild(qtip);
    } else if (m === 'dialogue') {
      modeBar.appendChild(mkMbBtn('▶', dlgPlaying ? '播放中…' : '播放对白', '按版面顺序，让每句对白气泡依次亮出来', function () { dlgPlaying ? stopDialogue() : playDialogue(); }, dlgPlaying));
      modeBar.appendChild(mkMbBtn('⏹', '全部显示', '立即结束播放并显示所有气泡', function () { stopDialogue(); }));
      modeBar.appendChild(mkMbBtn('＋', '加一句', '新增一个对白气泡', function () { addDialogueNote(); }));
      var dtip = document.createElement('span'); dtip.className = 'nb-mb-hint';
      dtip.textContent = dlgPlaying ? '正在逐句播放…' : '共 ' + dialogueBubbles().length + ' 句对白';
      modeBar.appendChild(dtip);
    } else if (m === 'gallery') {
      var style = currentPhotoStyle();
      modeBar.appendChild(mkMbBtn('▶', '放映', '全屏逐张放映这个相册（← → 翻页，Esc 退出）', function () { openShow(); }));
      modeBar.appendChild(mkMbBtn('🖼', PHOTO_LABEL[style], '切换相纸样式：拍立得 → 相纸 → 胶片', function () { cyclePhotoStyle(); }));
      modeBar.appendChild(mkMbBtn('▦', '拼贴成册', '把散落的照片按接触印相网格等距排好', function () { tilePhotos(); }));
      var gtip = document.createElement('span'); gtip.className = 'nb-mb-hint';
      gtip.textContent = '共 ' + photoNotes().length + ' 张照片';
      modeBar.appendChild(gtip);
    } else if (m === 'trip') {
      modeBar.appendChild(mkMbBtn('▶', tripPlaying ? '回放中…' : '旅程回放', '相机沿行程轨依次聚焦每一站', function () { playTrip(); }, tripPlaying));
      modeBar.appendChild(mkMbBtn('＋', '下一站', '自动续上 Day N+1 的站点标签与一个空白气泡', function () { addTripStop(); }));
      modeBar.appendChild(mkMbBtn('⇲', '重排行程', '把所有站点沿行程轨等距对齐，气泡跟着走', function () { reflowTrip(); }));
      var ttip = document.createElement('span'); ttip.className = 'nb-mb-hint';
      ttip.textContent = tripStations().length + ' 站 · 拖站点会自动吸附轨道';
      modeBar.appendChild(ttip);
    } else if (m === 'timelineH' || m === 'timelineV') {
      modeBar.appendChild(mkMbBtn('🗂', '章节', '打开进度分章面板（与阶段带是同一份数据）', function () { toggleStageModal(true); }));
      modeBar.appendChild(mkMbBtn('⚖', '等距', '把各阶段沿主轴等距排列', function () { spreadTimeline('even'); }));
      modeBar.appendChild(mkMbBtn('📏', '按时间', '各阶段间距按便签创建时间成比例排布', function () { spreadTimeline('time'); }));
      var htip = document.createElement('span'); htip.className = 'nb-mb-hint';
      htip.textContent = (board.stages || []).length + ' 个阶段 · 拖便签跨过分界线即改归属';
      modeBar.appendChild(htip);
    }
    // 类型筛选：按便签「类型」标签把不相关的变暗（对全部带模式条的模板生效）
    var kf = document.createElement('select');
    kf.className = 'nb-kind-filter' + (kindFilter ? ' on' : '');
    kf.title = '按便签「类型」筛选（在浮标给便签选「类型」后生效）';
    [{ v: '', t: '🏷 全部' }].concat(KINDS.map(function (k) { return { v: k.id, t: k.label }; })).forEach(function (o) {
      var op = document.createElement('option'); op.value = o.v; op.textContent = o.t;
      if ((kindFilter || '') === o.v) op.selected = true;
      kf.appendChild(op);
    });
    kf.addEventListener('pointerdown', function (e) { e.stopPropagation(); });
    kf.addEventListener('change', function (e) { e.stopPropagation(); kindFilter = kf.value || null; updateDims(); renderModeBar(); });
    modeBar.appendChild(kf);

    // 模板专属导出（放在最后，作为这一套交互的收尾动作）
    if (EXPORT_TIP[m]) {
      modeBar.appendChild(mkMbBtn('📤', '导出', EXPORT_TIP[m], function () { exportByTemplate(); }));
    }
  }
  // 金句墙「加一句」：带框的文字气泡（翻面才有批注）
  function addQuoteNote() {
    var c = screenToWorld(viewport.clientWidth / 2, viewport.clientHeight / 2);
    var n = { id: uid(), x: Math.round(c.x - 140), y: Math.round(c.y - 60), type: 'text', pinned: false,
      createdAt: Date.now(), w: 280, h: 120, baseSize: 14, frame: true, title: '', body: '',
      rot: (Math.random() * 3 - 1.5).toFixed(1) * 1, kind: '', stageId: null };
    pushHistory(); board.notes.push(n);
    var el = buildNote(n); world.appendChild(el); dropIn(el, n);
    renderClusters(); updateEmpty(); updateCount(); selectNote(n.id);
    var t = el.querySelector('.nb-body'); if (t) setTimeout(function () { t.focus(); }, 40);
    markDirty('notes', n.id); scheduleSave();
  }
  // 对白剧场「加一句」：有框气泡（自动进播放序列）
  function addDialogueNote() {
    var list = dialogueBubbles();
    var last = list[list.length - 1];
    var c = screenToWorld(viewport.clientWidth / 2, viewport.clientHeight / 2);
    var x = last ? ((last.x > 0) ? -300 : 60) : -300;
    var y = last ? (last.y + 118) : -60;
    var even = list.length % 2 === 0;
    var n = { id: uid(), type: 'text', x: x, y: y, w: 250, h: 92, baseSize: 14.5, frame: true,
      title: '', body: '', color: even ? '#E6F0FF' : '#FBE8EF', pinned: false, createdAt: Date.now(), rot: 0, stageId: null };
    pushHistory(); board.notes.push(n);
    var el = buildNote(n); world.appendChild(el); dropIn(el, n);
    renderClusters(); updateEmpty(); updateCount(); selectNote(n.id);
    var t = el.querySelector('.nb-body'); if (t) setTimeout(function () { t.focus(); }, 40);
    markDirty('notes', n.id); scheduleSave(); renderModeBar();
  }
  // 清单：切换选中条目的勾选状态（没有勾选框的普通便签会被转成一条待办）
  function toggleCheck() {
    var n = selectedNote();
    if (!n) { toast('先选中一条待办', 'err'); return; }
    var s = checklistStateOf(n);
    if (s.checkable) { toggleChecklistNote(n.id); return; }
    pushHistory();
    n.body = '☐ ' + (n.body || '');
    if (!n.variant) n.variant = 'card';
    renderAll(); selectNote(n.id);
    markDirty('notes', n.id); scheduleSave(); renderModeBar();
  }

  // =====================================================================
  // 模板专属交互
  // ① 金句墙：点便签翻面写批注　② 对白剧场：气泡逐个播放　③ 通关清单：勾选进度条 + 通关烟花
  // =====================================================================
  var flipMode = false;
  // 只有「正文类」文字便签才可翻面，标题/副标题/分隔线等版式件不参与
  function isFlipTarget(n) { return modeOf() === 'quote' && n && n.type === 'text' && !n.variant; }
  function applyFlipMode() {
    Object.keys(noteEls).forEach(function (id) {
      var n = board.notes.filter(function (x) { return x.id === id; })[0];
      if (!n || !noteEls[id]) return;
      noteEls[id].classList.toggle('nb-flipmode', flipMode && isFlipTarget(n));
    });
  }
  function toggleFlipMode() {
    flipMode = !flipMode;
    if (!flipMode) {                                   // 关掉翻面模式时把所有便签翻回正面
      Object.keys(noteEls).forEach(function (id) { noteEls[id].classList.remove('flipped'); });
    }
    applyFlipMode();
    renderModeBar();
    toast(flipMode ? '翻面模式：点便签看/写批注' : '已退出翻面模式', 'ok');
  }
  // 两段式 Y 轴翻转：先转出再换面再转回，视觉上像真的把卡片翻过来
  function flipNote(id) {
    var n = board.notes.filter(function (x) { return x.id === id; })[0];
    var el = noteEls[id]; if (!n || !el) return;
    var toBack = !el.classList.contains('flipped');
    var apply = function () { el.classList.toggle('flipped', toBack); };
    if (!el.animate || !motionOK()) { apply(); return; }
    var base = noteTransform(n);
    try {
      var a = el.animate([
        { transform: base + ' perspective(900px) rotateY(0deg)' },
        { transform: base + ' perspective(900px) rotateY(88deg)' }
      ], { duration: 150, easing: 'ease-in' });
      a.onfinish = function () {
        apply();
        el.animate([
          { transform: base + ' perspective(900px) rotateY(-88deg)' },
          { transform: base + ' perspective(900px) rotateY(0deg)' }
        ], { duration: 180, easing: 'ease-out' });
      };
    } catch (_) { apply(); }
  }

  // ② 对白剧场：把「有框的文字气泡」按版面顺序逐个亮出来
  var dlgPlaying = false, dlgTimers = [];
  function dialogueBubbles() {
    return board.notes.filter(function (n) { return n.type === 'text' && n.frame; })
      .sort(function (a, b) { return (a.y - b.y) || ((a.x || 0) - (b.x || 0)); });
  }
  function stopDialogue() {
    dlgTimers.forEach(clearTimeout); dlgTimers = [];
    if (!dlgPlaying && !dlgTimers.length) { /* 允许直接清理 */ }
    dlgPlaying = false;
    board.notes.forEach(function (n) { var el = noteEls[n.id]; if (el) el.classList.remove('dlg-hide', 'dlg-in'); });
    renderModeBar();
  }
  function playDialogue() {
    var list = dialogueBubbles();
    if (!list.length) { toast('还没有对白气泡', 'err'); return; }
    dlgTimers.forEach(clearTimeout); dlgTimers = [];
    dlgPlaying = true;
    list.forEach(function (n) { var el = noteEls[n.id]; if (el) el.classList.remove('dlg-hide', 'dlg-in'); });
    renderModeBar();
    // 先全部隐藏，再按顺序逐条淡入，制造「一句一句读下来」的节奏
    requestAnimationFrame(function () {
      list.forEach(function (n) { var el = noteEls[n.id]; if (el) el.classList.add('dlg-hide'); });
      list.forEach(function (n, i) {
        dlgTimers.push(setTimeout(function () {
          var el = noteEls[n.id]; if (!el) return;
          el.classList.remove('dlg-hide');
          el.classList.add('dlg-in');
          dlgTimers.push(setTimeout(function () { el.classList.remove('dlg-in'); }, 520));
          if (i === list.length - 1) {
            dlgTimers.push(setTimeout(function () { dlgPlaying = false; renderModeBar(); }, 700));
          }
        }, 260 + i * 520));
      });
    });
  }

  // ③ 通关清单：勾选 + 进度条 + 通关烟花
  function checklistStateOf(n) {
    if (!n || n.type !== 'text') return { checkable: false, done: false };
    var b = (n.body != null ? n.body : '').toString();
    if (b.indexOf('☐') === 0) return { checkable: true, done: false };
    if (b.indexOf('☑') === 0) return { checkable: true, done: true };
    return { checkable: false, done: false };
  }
  function checklistStats() {
    var total = 0, done = 0;
    board.notes.forEach(function (n) {
      if (modeOf() !== 'checklist') return;
      var s = checklistStateOf(n);
      if (!s.checkable) return;
      total++; if (s.done) done++;
    });
    return { total: total, done: done };
  }
  function toggleChecklistNote(id) {
    var n = board.notes.filter(function (x) { return x.id === id; })[0];
    if (!n) return;
    var s = checklistStateOf(n); if (!s.checkable) return;
    pushHistory();
    var b = n.body.toString();
    n.body = s.done ? b.replace('☑', '☐') : b.replace('☐', '☑');
    var el = noteEls[id];
    if (el) {
      el.classList.toggle('done', !s.done);
      var cb = el.querySelector('.nb-check');
      if (cb) { cb.textContent = (!s.done) ? '✓' : ''; cb.title = (!s.done) ? '取消勾选' : '标记为已完成'; }
      var body = el.querySelector('.nb-body'); if (body) body.innerHTML = n.body;
      el.classList.remove('nb-checkpop'); void el.offsetWidth; el.classList.add('nb-checkpop');
    }
    markDirty('notes', id); scheduleSave();
    renderModeBar();
    var st = checklistStats();
    if (st.total > 0 && st.done === st.total && !s.done) {    // 刚好全部勾完 → 放烟花
      fireworks();
      toast('全部通关，了不起！🎉', 'ok');
    }
  }
  // 通关烟花：从两三个点炸开一圈彩色粒子（纯 DOM + CSS 动画，跑完自清）
  function fireworks() {
    if (!motionOK()) return;
    var host = document.createElement('div');
    host.className = 'nb-fw';
    document.body.appendChild(host);
    var cols = [];
    try {
      var cs = getComputedStyle(document.documentElement);
      cols = [cs.getPropertyValue('--accent').trim(), cs.getPropertyValue('--accent2').trim(), '#FFD166', '#FF8FA3', '#8FD9C4'];
    } catch (_) { cols = ['#B86FD8', '#F0803C', '#FFD166', '#FF8FA3', '#8FD9C4']; }
    var centers = [
      { x: window.innerWidth * 0.5, y: window.innerHeight * 0.36 },
      { x: window.innerWidth * 0.28, y: window.innerHeight * 0.5 },
      { x: window.innerWidth * 0.72, y: window.innerHeight * 0.44 }
    ];
    centers.forEach(function (c, ci) {
      setTimeout(function () {
        for (var i = 0; i < 26; i++) {
          var ang = (Math.PI * 2 * i) / 26 + (ci * 0.3);
          var dist = 70 + Math.random() * 110;
          var p = document.createElement('i');
          p.style.left = c.x + 'px'; p.style.top = c.y + 'px';
          p.style.background = cols[i % cols.length];
          p.style.setProperty('--dx', (Math.cos(ang) * dist).toFixed(0) + 'px');
          p.style.setProperty('--dy', (Math.sin(ang) * dist + 40).toFixed(0) + 'px');
          p.style.setProperty('--dur', (0.9 + Math.random() * 0.6).toFixed(2) + 's');
          p.style.animationDelay = (Math.random() * 0.12).toFixed(2) + 's';
          host.appendChild(p);
        }
      }, ci * 260);
    });
    setTimeout(function () { if (host.parentNode) host.parentNode.removeChild(host); }, 2400);
  }

  // =====================================================================
  // 模板专属交互 · 第二批
  // ① 名场面相册：相纸三态 / 全屏放映 / 拼贴成册
  // ② 旅程散记：行程轨 / 下一站 / 旅程回放
  // ③ 时间线 H·V：阶段带 / 跨段吸附 / 疏密切换
  // =====================================================================

  // ---------- 通用：一键整理的平滑归位（只改坐标，DOM 位置过渡） ----------
  var _tidyTimer = 0;
  function moveNotesAnimated(moves) {                 // moves: [{ n, x, y }]
    if (!moves || !moves.length) return;
    var anim = motionOK();
    if (anim) world.classList.add('nb-tidy');
    moves.forEach(function (mv) {
      mv.n.x = Math.round(mv.x); mv.n.y = Math.round(mv.y);
      var el = noteEls[mv.n.id];
      if (el) el.style.transform = noteTransform(mv.n);
      markDirty('notes', mv.n.id);
    });
    scheduleSave();
    if (anim) {
      clearTimeout(_tidyTimer);
      _tidyTimer = setTimeout(function () { world.classList.remove('nb-tidy'); }, 560);
    }
    renderClusters(); renderModeLayer();
    try { positionFloatbar(); } catch (_) {}
    requestMiniUpdate();
  }

  // ---------- 便签「类型」标签（kind）：轻量归类，供浮标选择 + 画布内筛选 ----------
  var KINDS = [
    { id: 'idea',   label: '想法', color: '#7C6FE8' },
    { id: 'scene',  label: '场景', color: '#4FB3A8' },
    { id: 'char',   label: '角色', color: '#E08BB5' },
    { id: 'roast',  label: '槽点', color: '#F0A05A' },
    { id: 'decide', label: '结论', color: '#6AA9E0' }
  ];
  function kindById(id) { for (var i = 0; i < KINDS.length; i++) if (KINDS[i].id === id) return KINDS[i]; return null; }
  var kindFilter = null;                         // 当前类型筛选（null = 全部；不持久化，只是视图态）
  // 文字便签可切换「有框/无框」；装饰性变体（标题/分隔/副标题/轴）不参与
  var FRAME_SKIP = ['title', 'heading', 'divider', 'sub', 'tag', 'axis-h', 'axis-v'];
  function canFrame(n) { return !!n && n.type === 'text' && FRAME_SKIP.indexOf(n.variant || '') < 0; }
  function syncKindMark(n) {
    var el = noteEls[n.id]; if (!el) return;
    var chip = el.querySelector('.nb-kind'); if (!chip) return;
    var k = n.kind ? kindById(n.kind) : null;
    if (!k) { chip.style.display = 'none'; chip.textContent = ''; chip.style.removeProperty('--kc'); return; }
    chip.style.display = ''; chip.textContent = k.label; chip.style.setProperty('--kc', k.color);
  }

  // ---------- ① 名场面相册 ----------
  // 相纸三态：拍立得 photo（底部宽留白）/ 相纸 print（四面白边）/ 胶片 film（黑底齿孔）
  var PHOTO_VARIANTS = ['photo', 'print', 'film'];
  var PHOTO_LABEL = { photo: '拍立得', print: '相纸', film: '胶片' };
  function isPhotoNote(n) { return !!n && (n.type === 'image' || PHOTO_VARIANTS.indexOf(n.variant) >= 0); }
  function photoNotes() {
    return board.notes.filter(isPhotoNote).sort(function (a, b) {
      return ((a.y || 0) - (b.y || 0)) || ((a.x || 0) - (b.x || 0));
    });
  }
  function currentPhotoStyle() {
    var hit = board.notes.filter(function (n) { return PHOTO_VARIANTS.indexOf(n.variant) >= 0; })[0];
    return hit ? hit.variant : 'photo';
  }
  function cyclePhotoStyle() {
    var list = board.notes.filter(function (n) { return PHOTO_VARIANTS.indexOf(n.variant) >= 0; });
    if (!list.length) { toast('这个画板还没有照片便签', 'err'); return; }
    var next = PHOTO_VARIANTS[(PHOTO_VARIANTS.indexOf(list[0].variant) + 1) % PHOTO_VARIANTS.length];
    pushHistory();
    list.forEach(function (n) { n.variant = next; markDirty('notes', n.id); });
    renderAll(); scheduleSave(); renderModeBar(); requestMiniUpdate();
    toast('相纸样式：' + PHOTO_LABEL[next], 'ok');
  }
  // 拼贴成册：按接触印相网格等距排好（沿用各自尺寸，只挪位置；轻微倾斜保留）
  function tilePhotos() {
    var list = photoNotes();
    if (list.length < 2) { toast('至少要有两张照片才能拼贴', 'err'); return; }
    var cols = Math.min(4, Math.max(2, Math.round(Math.sqrt(list.length))));
    var cw = 0, ch = 0;
    list.forEach(function (n) { cw = Math.max(cw, n.w || 190); ch = Math.max(ch, n.h || 190); });
    var gx = Math.round(cw * 0.16), gy = Math.round(ch * 0.18);
    var x0 = list.reduce(function (m, n) { return Math.min(m, n.x || 0); }, Infinity);
    var y0 = list.reduce(function (m, n) { return Math.min(m, n.y || 0); }, Infinity);
    pushHistory();
    moveNotesAnimated(list.map(function (n, i) {
      return { n: n, x: x0 + (i % cols) * (cw + gx), y: y0 + Math.floor(i / cols) * (ch + gy) };
    }));
    toast('已拼贴成册 · ' + cols + ' 列 × ' + Math.ceil(list.length / cols) + ' 行', 'ok');
  }
  // 全屏放映
  var showEl = null, showIdx = 0, showList = [];
  function ensureShow() {
    if (showEl) return;
    showEl = document.createElement('div');
    showEl.className = 'nb-show';
    showEl.id = 'nb-show';
    showEl.setAttribute('role', 'dialog');
    showEl.setAttribute('aria-label', '相册放映');
    showEl.innerHTML =
      '<div class="nb-show-count" id="nbShowCount"></div>' +
      '<button class="nb-show-x" id="nbShowX" type="button" title="退出放映（Esc）" aria-label="退出放映">✕</button>' +
      '<button class="nb-show-arrow prev" id="nbShowPrev" type="button" title="上一张（←）" aria-label="上一张">‹</button>' +
      '<button class="nb-show-arrow next" id="nbShowNext" type="button" title="下一张（→）" aria-label="下一张">›</button>' +
      '<div class="nb-show-stage" id="nbShowStage"></div>' +
      '<div class="nb-show-tip">← → 翻页 · Esc 退出</div>';
    document.body.appendChild(showEl);
    showEl.querySelector('#nbShowX').addEventListener('click', closeShow);
    showEl.querySelector('#nbShowPrev').addEventListener('click', function () { showStep(-1); });
    showEl.querySelector('#nbShowNext').addEventListener('click', function () { showStep(1); });
    showEl.addEventListener('click', function (e) { if (e.target === showEl) closeShow(); });
  }
  function isShowOpen() { return !!(showEl && showEl.classList.contains('show')); }
  function openShow() {
    var list = photoNotes();
    if (!list.length) { toast('这个画板还没有照片', 'err'); return; }
    ensureShow();
    showList = list; showIdx = 0;
    showEl.classList.add('show');
    document.body.classList.add('nb-show-open');
    renderShow();
  }
  function closeShow() {
    if (!showEl) return;
    showEl.classList.remove('show');
    document.body.classList.remove('nb-show-open');
    showList = []; showIdx = 0;
  }
  function showStep(d) {
    if (!showList.length) return;
    showIdx = (showIdx + d + showList.length) % showList.length;
    renderShow();
  }
  function renderShow() {
    if (!showEl || !showList.length) return;
    var n = showList[showIdx];
    var stage = showEl.querySelector('#nbShowStage');
    var img = n.img || '';
    var txt = plainOf(n, 'body').replace(/^📷\s*/, '');
    if (img) {
      stage.innerHTML = '<div class="nb-show-card"><img class="nb-show-img" alt="" src="' +
        String(img).replace(/"/g, '&quot;') + '">' +
        (txt ? '<div class="nb-show-cap">' + esc(txt) + '</div>' : '') + '</div>';
    } else {
      stage.innerHTML = '<div class="nb-show-card"><div class="nb-show-text">' + (esc(txt) || '（空白）') + '</div></div>';
    }
    var card = stage.firstChild;
    var im = card.querySelector('img');
    if (im) im.addEventListener('error', function () { im.style.display = 'none'; });
    requestAnimationFrame(function () { if (card) card.classList.add('in'); });
    showEl.querySelector('#nbShowCount').textContent = (showIdx + 1) + ' / ' + showList.length;
    var one = showList.length < 2;
    showEl.querySelector('#nbShowPrev').disabled = one;
    showEl.querySelector('#nbShowNext').disabled = one;
  }

  // ---------- ② 旅程散记 ----------
  // 站点 = 无底纯文字、正文以「Day N」或「YYYY-MM-DD / M.D」开头
  function isTripStation(n) {
    if (!n || n.type !== 'text' || n.frame) return false;
    var t = plainOf(n, 'body');
    return /^day\s*\d+/i.test(t) || /^\d{1,4}[-\/.]\d{1,2}/.test(t);
  }
  function stationKey(n) {
    var t = plainOf(n, 'body');
    var m = t.match(/^day\s*(\d+)/i);
    if (m) return parseInt(m[1], 10);
    var d = t.match(/^(\d{1,4})[-\/.](\d{1,2})/);
    if (d) return parseInt(d[1], 10) * 1000 + parseInt(d[2], 10);
    return 1e9;
  }
  function tripStations() {
    return board.notes.filter(isTripStation).sort(function (a, b) {
      return (stationKey(a) - stationKey(b)) || ((a.y || 0) - (b.y || 0));
    });
  }
  // 与站点同行、位于其右侧的第一个「有框气泡」= 这一站的正文
  function pairedBubble(n) {
    var cy = (n.y || 0) + (n.h || 26) / 2;
    var best = null, bd = 52;
    board.notes.forEach(function (o) {
      if (o === n || !o.frame) return;
      if ((o.x || 0) <= (n.x || 0)) return;
      var d = Math.abs(((o.y || 0) + (o.h || 66) / 2) - cy);
      if (d < bd) { bd = d; best = o; }
    });
    return best;
  }
  var RAIL_GAP = 34, TRIP_STEP = 92;
  function railCol(st) { return Math.round(Math.min.apply(null, st.map(function (n) { return n.x || 0; }))) ; }
  var railLayer = null;
  function renderRail() {
    if (modeOf() !== 'trip') {
      if (railLayer && railLayer.parentNode) railLayer.parentNode.removeChild(railLayer);
      railLayer = null; return;
    }
    if (!world) return;
    if (railLayer && !world.contains(railLayer)) railLayer = null;
    if (!railLayer) { railLayer = document.createElement('div'); railLayer.className = 'nb-rail'; world.appendChild(railLayer); }
    var st = tripStations();
    if (st.length < 2) { railLayer.innerHTML = ''; return; }
    var lx = railCol(st) - RAIL_GAP;
    var colX = railCol(st);
    var ys = st.map(function (n) { return (n.y || 0) + (n.h || 26) / 2; });
    var top = Math.min.apply(null, ys) - 18, bot = Math.max.apply(null, ys) + 18;
    var h = '<div class="nb-rail-line nb-rail-spine" style="left:' + lx + 'px;top:' + top + 'px;height:' + (bot - top) + 'px"></div>';
    st.forEach(function (n, i) {
      var cy = (n.y || 0) + (n.h || 26) / 2;
      h += '<div class="nb-rail-node' + (i === 0 ? ' on' : '') + '" style="left:' + (lx - 6) + 'px;top:' + (cy - 6) + 'px;--i:' + i + '"></div>';
      // 站点名右侧的短连接线（把标签和气泡串起来）
      var L = Math.max(0, colX - lx - 14);
      if (L > 4) h += '<div class="nb-rail-line nb-rail-tie" style="left:' + (lx + 12) + 'px;top:' + (cy - 1) + 'px;width:' + L + 'px;height:2px;--i:' + i + ';background:repeating-linear-gradient(90deg,' + 'color-mix(in srgb, var(--accent) 42%, transparent) 0 4px, transparent 4px 8px)' + '"></div>';
    });
    railLayer.innerHTML = h;
  }
  // 重排行程：站点沿轨道等距对齐，各自的气泡跟着走
  function reflowTrip() {
    var st = tripStations();
    if (st.length < 2) { toast('至少要有两站才能重排', 'err'); return; }
    var colX = railCol(st);
    var top = Math.min.apply(null, st.map(function (n) { return (n.y || 0) + (n.h || 26) / 2; }));
    var claims = {}, moves = [];
    st.forEach(function (n, i) {
      var cy = top + i * TRIP_STEP;
      moves.push({ n: n, x: colX, y: Math.round(cy - (n.h || 26) / 2) });
      var b = pairedBubble(n);
      if (b && !claims[b.id]) { claims[b.id] = 1; moves.push({ n: b, x: b.x, y: Math.round(cy - (b.h || 66) / 2) }); }
    });
    pushHistory();
    moveNotesAnimated(moves);
    toast('行程已重排 · ' + st.length + ' 站', 'ok');
  }
  // 下一站：自动续 Day N+1 的站点标签 + 一个空白气泡
  function addTripStop() {
    var st = tripStations();
    var last = st[st.length - 1];
    var k = last ? stationKey(last) : 0;
    var day = (last && k < 1e9) ? (k + 1) : (st.length + 1);
    var colX = last ? (last.x || -300) : -300;
    var y = last ? ((last.y || 0) + TRIP_STEP) : -292;
    var from = pairedBubble(last);
    var bx = from ? (from.x || 0) : (colX + 140);
    var col = (last && last.color) || '#3FA894';
    pushHistory();
    var items = [
      { id: uid(), type: 'text', x: colX, y: y, w: 130, h: 26, baseSize: 13, frame: false,
        color: col, title: '', body: 'Day ' + day + ' · 新的一站', rot: 0, pinned: false, createdAt: Date.now(), stageId: null },
      { id: uid(), type: 'text', x: bx, y: y - 8, w: 460, h: 66, baseSize: 14, frame: true,
        color: '#E7F5F0', title: '', body: '', rot: 0, pinned: false, createdAt: Date.now(), stageId: null }
    ];
    items.forEach(function (m) {
      board.notes.push(m);
      var el = buildNote(m); world.appendChild(el); dropIn(el, m);
      markDirty('notes', m.id);
    });
    renderClusters(); updateEmpty(); updateCount(); renderModeLayer(); scheduleSave(); renderModeBar();
    selectNote(items[1].id);
    var t = noteEls[items[1].id] && noteEls[items[1].id].querySelector('.nb-body');
    if (t) setTimeout(function () { t.focus(); }, 60);
    toast('已加上第 ' + day + ' 站', 'ok');
  }
  // 旅程回放：相机沿轨道逐站推进
  var tripPlaying = false, tripTimer = 0;
  function stopTrip(silent) {
    tripPlaying = false;
    clearTimeout(tripTimer); tripTimer = 0;
    if (!silent) renderModeBar();
  }
  function camTo(cx, cy, dur) {
    var nx = viewport.clientWidth / 2 - cx * board.cam.scale;
    var ny = viewport.clientHeight / 2 - cy * board.cam.scale;
    if (!motionOK() || !dur) { board.cam.x = nx; board.cam.y = ny; applyCam(); return; }
    var sx = board.cam.x, sy = board.cam.y, t0 = performance.now();
    (function tick() {
      var k = Math.min(1, (performance.now() - t0) / dur);
      var e = 1 - Math.pow(1 - k, 3);
      board.cam.x = sx + (nx - sx) * e;
      board.cam.y = sy + (ny - sy) * e;
      applyCam();
      if (k < 1) requestAnimationFrame(tick);
    })();
  }
  function playTrip() {
    if (tripPlaying) { stopTrip(); return; }
    var st = tripStations();
    if (!st.length) { toast('还没有站点（写一句「Day 1」就会出现行程轨）', 'err'); return; }
    tripPlaying = true; renderModeBar();
    var i = 0;
    (function step() {
      if (!tripPlaying) return;
      if (i >= st.length) { stopTrip(); toast('旅程回放结束 · 共 ' + st.length + ' 站', 'ok'); return; }
      var n = st[i++];
      camTo((n.x || 0) + (n.w || 200) / 2 + 190, (n.y || 0) + (n.h || 26) / 2, 700);
      flashNote(n.id); selectNote(n.id);
      tripTimer = setTimeout(step, 1220);
    })();
  }

  // ---------- ③ 时间线：阶段带 ----------
  function isTimeline() { var m = modeOf(); return m === 'timelineH' || m === 'timelineV'; }
  function timelineAxis() {
    var want = (modeOf() === 'timelineV') ? 'axis-v' : 'axis-h';
    var ax = board.notes.filter(function (n) { return n.variant === want; })[0];
    if (ax) return ax;
    if (!board.notes.length) return null;                    // 退化：按便签包围盒虚构一条主轴
    var vert = (modeOf() === 'timelineV');
    var lo = Infinity, hi = -Infinity;
    board.notes.forEach(function (n) {
      var a = vert ? (n.y || 0) : (n.x || 0);
      var b = a + (vert ? (n.h || 90) : (n.w || 200));
      if (a < lo) lo = a; if (b > hi) hi = b;
    });
    return vert ? { x: 0, y: lo, w: 110, h: hi - lo } : { x: lo, y: 0, w: hi - lo, h: 110 };
  }
  function stageProject(n, vert) {
    return vert ? ((n.y || 0) + (n.h || 90) / 2) : ((n.x || 0) + (n.w || 200) / 2);
  }
  // 阶段段：每段的中心 = 该阶段成员的投影中位数（无成员则落在均分位），
  // 边界 = 相邻中心的次中点 → 天然平铺、随内容自动伸缩。
  // excludeId：拖动中要排除被拖的那张，否则「自己撑起自己那一段」→ 永远跨不出去。
  function stageSegments(excludeId) {
    if (!isTimeline()) return null;
    var ax = timelineAxis(); if (!ax) return null;
    var sts = board.stages || []; if (!sts.length) return null;
    var vert = (modeOf() === 'timelineV');
    var lo = vert ? (ax.y || 0) : (ax.x || 0);
    var hi = vert ? ((ax.y || 0) + (ax.h || 600)) : ((ax.x || 0) + (ax.w || 1000));
    if (!(hi > lo)) return null;
    var N = sts.length;
    var minGap = (hi - lo) / (N * 4);
    var last = lo - 1e9;
    var cen = [];
    sts.forEach(function (s, i) {
      var ps = board.notes.filter(function (n) { return n.stageId === s.id && n.id !== excludeId; })
        .map(function (n) { return stageProject(n, vert); }).sort(function (a, b) { return a - b; });
      var c = ps.length ? ps[Math.floor(ps.length / 2)] : (lo + (hi - lo) * (i + 0.5) / N);
      if (c < last + minGap) c = last + minGap;
      last = c; cen.push(c);
    });
    var segs = [];
    for (var i = 0; i < N; i++) {
      var a = (i === 0) ? lo : (cen[i - 1] + cen[i]) / 2;
      var b = (i === N - 1) ? hi : (cen[i] + cen[i + 1]) / 2;
      if (b - a < 16) b = a + 16;
      segs.push({ id: sts[i].id, name: sts[i].name, i: i, a: a, b: b, color: stageColor(i) });
    }
    return { vert: vert, lo: lo, hi: hi, segs: segs, ax: ax };
  }
  var bandLayer = null, bandHot = null, bandFreeze = null;   // bandFreeze：拖动期间的「冻结分段」，保证判定基准不随拖动漂移
  function renderBand() {
    if (!isTimeline()) {
      if (bandLayer && bandLayer.parentNode) bandLayer.parentNode.removeChild(bandLayer);
      bandLayer = null; bandHot = null; bandFreeze = null; return;
    }
    if (!world) return;
    if (bandLayer && !world.contains(bandLayer)) bandLayer = null;
    if (!bandLayer) { bandLayer = document.createElement('div'); bandLayer.className = 'nb-band'; world.appendChild(bandLayer); }
    var seg = bandFreeze || stageSegments();
    if (!seg) { bandLayer.innerHTML = ''; return; }
    var vert = seg.vert, ax = seg.ax;
    var cross = vert ? ((ax.x || 0) + (ax.w || 110) / 2) : ((ax.y || 0) + (ax.h || 110) / 2);
    var TH = 46, half = TH / 2, h = '';
    seg.segs.forEach(function (s, si) {
      var len = Math.max(16, s.b - s.a);
      var box = vert
        ? ('left:' + (cross - half) + 'px;top:' + s.a + 'px;width:' + TH + 'px;height:' + len + 'px;--i:' + si + ';')
        : ('left:' + s.a + 'px;top:' + (cross - half) + 'px;width:' + len + 'px;height:' + TH + 'px;--i:' + si + ';');
      h += '<div class="nb-band-seg' + (bandHot === s.id ? ' on' : '') + '" data-sid="' + esc(s.id) + '" style="' + box +
        'background:' + hexA(s.color, .16) + ';box-shadow:inset 0 0 0 1px ' + hexA(s.color, .34) + '"></div>';
      var lab = vert
        ? ('left:' + (cross + half + 8) + 'px;top:' + (s.a + 2) + 'px;--i:' + si + ';')
        : ('left:' + (s.a + 8) + 'px;top:' + (cross - half - 20) + 'px;--i:' + si + ';');
      h += '<div class="nb-band-lab" style="' + lab + 'color:' + s.color + '">' + esc(s.name) + '</div>';
    });
    bandLayer.innerHTML = h;
  }
  function bandHitAt(pt, seg) {
    var hit = null;
    seg.segs.forEach(function (s) { if (pt >= s.a && pt < s.b) hit = s.id; });
    return hit || seg.segs[seg.segs.length - 1].id;
  }
  function bandHover(n) {
    if (!isTimeline()) return;
    var seg = bandFreeze || stageSegments(n.id); if (!seg) return;
    var hit = bandHitAt(stageProject(n, seg.vert), seg);
    if (hit === bandHot) return;
    bandHot = hit;
    if (bandLayer) Array.prototype.forEach.call(bandLayer.querySelectorAll('.nb-band-seg'), function (el) {
      el.classList.toggle('on', el.getAttribute('data-sid') === hit);
    });
  }
  // 拖动结束时按主轴投影判定归属：跨过分界线就改 stageId（可撤销，走增量同步）
  function bandCommit(n) {
    if (!isTimeline()) return;
    var seg = bandFreeze || stageSegments(n.id); if (!seg) return;
    bandFreeze = null;
    var hit = bandHitAt(stageProject(n, seg.vert), seg);
    bandHot = null;
    if (!hit || n.stageId === hit) { renderBand(); return; }
    n.stageId = hit;                     // 位置与阶段归属共用拖动前的那次 pushHistory，撤销一步即可回退
    markDirty('notes', n.id);
    syncStageMarks(); scheduleSave(); renderBand();
    toast('已归入「' + (stageNameOf(hit) || '') + '」', 'ok');
  }
  // 疏密切换：沿主轴把各阶段整体平移（紧凑=等距 / 真实=按创建时间成比例）
  function spreadTimeline(kind) {
    var seg = stageSegments();
    if (!seg || seg.segs.length < 2) { toast('这个时间线还没有可调整的阶段', 'err'); return; }
    var vert = seg.vert, sts = seg.segs, N = sts.length, span = seg.hi - seg.lo;
    var minW = Math.min(span / (N * 2.4), 160);
    var widths = [];
    if (kind === 'time') {
      var t0 = sts.map(function (s) {
        var ms = board.notes.filter(function (n) { return n.stageId === s.id; })
          .map(function (n) { return n.createdAt || 0; }).filter(function (v) { return v > 0; });
        return ms.length ? Math.min.apply(null, ms) : null;
      });
      var w = [1];
      for (var i = 1; i < N; i++) {
        var a = t0[i - 1], b = t0[i];
        w.push((a && b && b > a) ? (b - a) : (w[i - 1] * 1.7));
      }
      var sum = w.reduce(function (x, y) { return x + y; }, 0) || 1;
      var usable = Math.max(1, span - minW * N);
      w.forEach(function (x) { widths.push(minW + x / sum * usable); });
    } else {
      for (var j = 0; j < N; j++) widths.push(span / N);
    }
    var cur = seg.lo, centers = [];
    widths.forEach(function (wd) { centers.push(cur + wd / 2); cur += wd; });
    var moves = [];
    sts.forEach(function (s, i) {
      var shift = centers[i] - (s.a + s.b) / 2;
      if (!shift) return;
      board.notes.forEach(function (n) {
        if (n.stageId !== s.id || !noteEls[n.id]) return;
        moves.push({ n: n, x: vert ? n.x : ((n.x || 0) + shift), y: vert ? ((n.y || 0) + shift) : n.y });
      });
    });
    if (!moves.length) { toast('没有可移动的便签（阶段下还没有内容）', 'err'); return; }
    pushHistory();
    moveNotesAnimated(moves);
    toast(kind === 'time' ? '已按创建时间疏密排布' : '已沿主轴等距排列', 'ok');
  }

  // ---------- ④ 模板专属导出：让导出的东西真的对这个模板有意义 ----------
  function downloadText(name, text) {
    var blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a'); a.href = url; a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1200);
  }
  function exportBoardImage(name) {
    if (typeof renderBoardImage !== 'function') { toast('出图模块不可用', 'err'); return; }
    toast('正在生成长图…', 'ok');
    renderBoardImage(function (dataUrl) {
      if (!dataUrl) { toast('生成失败，稍后再试', 'err'); return; }
      var a = document.createElement('a');
      a.download = name + '.png'; a.href = dataUrl; a.click();
      toast('长图已保存', 'ok');
    });
  }
  var EXPORT_TIP = {
    gallery: '导出一张相册长图（PNG）',
    timelineH: '导出一张单页心路长图（PNG）',
    timelineV: '导出一张单页心路长图（PNG）',
    checklist: '导出勾选结果（txt：进度 + 每条完成情况）',
    quote: '导出全部金句与批注（txt）',
    trip: '导出完整行程（txt：每站 + 正文）'
  };
  function exportByTemplate() {
    var m = modeOf();
    var base = (board.title || '画板').replace(/[\\\/:*?"<>|]/g, '');
    if (m === 'checklist') {
      var st = checklistStats();
      if (!st.total) { toast('还没有可勾选的条目', 'err'); return; }
      var rows = board.notes.filter(function (n) { return checklistStateOf(n).checkable; })
        .map(function (n) { var s = checklistStateOf(n); return (s.done ? '[x] ' : '[ ] ') + plainOf(n, 'body').replace(/^[☐☑]\s*/, ''); });
      downloadText(base + '_通关清单.txt',
        '🎯 ' + (board.title || '通关清单') + '\n已通关 ' + st.done + ' / ' + st.total +
        '（' + Math.round(st.done / st.total * 100) + '%）\n\n' + rows.join('\n') + '\n');
      toast('已导出清单 · ' + st.done + '/' + st.total, 'ok');
      return;
    }
    if (m === 'quote') {
      var qs = board.notes.filter(function (n) { return n.type === 'text' && !n.variant && plainOf(n, 'body'); });
      if (!qs.length) { toast('还没有可导出的金句', 'err'); return; }
      downloadText(base + '_金句墙.txt',
        '💬 ' + (board.title || '金句墙') + '\n\n' + qs.map(function (n, i) {
          var b = plainOf(n, 'body'), an = plainOf(n, 'annotation');
          return (i + 1) + '. ' + b + (an ? '\n   ↳ ' + an : '');
        }).join('\n\n') + '\n');
      toast('已导出 ' + qs.length + ' 句金句', 'ok');
      return;
    }
    if (m === 'trip') {
      var sts = tripStations();
      if (!sts.length) { toast('还没有站点（写一句 Day 1 就会生成）', 'err'); return; }
      downloadText(base + '_行程.txt',
        '🧭 ' + (board.title || '旅程散记') + '\n\n' + sts.map(function (n) {
          var b = pairedBubble(n);
          return '【' + plainOf(n, 'body') + '】\n' + (b ? plainOf(b, 'body') : '');
        }).join('\n\n') + '\n');
      toast('已导出行程 · ' + sts.length + ' 站', 'ok');
      return;
    }
    exportBoardImage(base + (m === 'gallery' ? '_相册长图' : '_心路长图'));
  }

  // ---------- 拖动钩子：时间线跨段吸附 / 旅程站点吸附 ----------
  // 拖动开始：把当前分段「冻结」下来当判定基准（否则被拖的那张自己撑起自己那一段，永远跨不出去）
  function afterNoteDragStart(n) {
    bandHot = null;
    bandFreeze = isTimeline() ? stageSegments(n.id) : null;
  }
  function afterNoteMove(n) { if (isTimeline()) bandHover(n); }
  function afterNoteDragEnd(n) {
    if (isTimeline()) bandCommit(n);
    else if (modeOf() === 'trip') snapStation(n);
    bandFreeze = null;
  }
  function snapStation(n) {
    if (!isTripStation(n)) return;
    var st = tripStations();
    if (st.length < 2 || st.indexOf(n) < 0) { renderRail(); return; }
    var colX = railCol(st);
    var cy = (n.y || 0) + (n.h || 26) / 2;
    var near = Math.round(cy / TRIP_STEP) * TRIP_STEP;
    var ny = (Math.abs(near - cy) <= 24) ? (near - (n.h || 26) / 2) : (n.y || 0);
    var moved = [];
    var dx = Math.abs(colX - (n.x || 0)), dy = Math.abs(ny - (n.y || 0));
    if (dx > .5 || dy > .5) {
      moved.push({ n: n, x: colX, y: ny });
      var b = pairedBubble(n);
      if (b) moved.push({ n: b, x: b.x, y: Math.round((ny + (n.h || 26) / 2) - (b.h || 66) / 2) });
    }
    if (moved.length) moveNotesAnimated(moved); else renderRail();
  }

  // 画布上的模式层：思维导图连线 / 手账非当日变暗
  function renderModeLayer() {
    if (!world) return;
    var m = modeOf();
    var svg = world.querySelector('.nb-links');
    if (m === 'mindmap' && board.links && board.links.length) {
      if (!svg) { svg = document.createElementNS(SVGNS, 'svg'); svg.setAttribute('class', 'nb-links'); world.insertBefore(svg, world.firstChild); }
      svg.innerHTML = '';
      board.links.forEach(function (l) {
        var a = board.notes.find(function (n) { return n.id === l.from; });
        var b = board.notes.find(function (n) { return n.id === l.to; });
        if (!a || !b) return;
        var ln = document.createElementNS(SVGNS, 'line');
        ln.setAttribute('class', 'nb-link');
        ln.setAttribute('data-from', l.from);
        ln.setAttribute('data-to', l.to);
        ln.setAttribute('x1', a.x + (a.w || 200) / 2); ln.setAttribute('y1', a.y + (a.h || 130) / 2);
        ln.setAttribute('x2', b.x + (b.w || 200) / 2); ln.setAttribute('y2', b.y + (b.h || 130) / 2);
        svg.appendChild(ln);
      });
    } else if (svg) { svg.remove(); }

    renderBand();          // ③ 时间线：阶段带
    renderRail();          // ② 旅程：行程轨
    updateDims();
  }

  // 连线高亮：鼠标悬停 / 选中便签时，把与它相连的线加粗点亮
  var hoverNoteId = null;
  function highlightLinksFor() {
    if (!world) return;
    var svg = world.querySelector('.nb-links'); if (!svg) return;
    var act = {};
    if (hoverNoteId) act[hoverNoteId] = 1;
    if (selectedId) act[selectedId] = 1;
    Array.prototype.forEach.call(svg.querySelectorAll('line.nb-link'), function (ln) {
      var on = !!(act[ln.getAttribute('data-from')] || act[ln.getAttribute('data-to')]);
      ln.classList.toggle('nb-link-hi', on);
    });
  }

  // 切换画板 / 新建画板后进入对应模式
  function enterMode() {
    board.links = board.links || [];
    board.ratings = board.ratings || {};
    linking = false; linkSrc = null; docFlow = false; journalFilter = null;
    stopTrip(true); closeShow(); bandHot = null;
    hideFirstHint(); clearUnbox();          // 换画板 / 重进模式时收掉开箱序列与起手提示
    if (world) world.classList.remove('nb-focus', 'nb-lift');   // 保险：别把上一个画板的景深状态带过来
    document.body.classList.toggle('nb-tpl-document', modeOf() === 'document');
    renderModeBar(); renderModeLayer();
    if (modeOf() === 'journal') renderDateBar();
    if (modeOf() === 'document' && docFlow) reflowDoc();
  }

  // ===== 思维导图 =====
  function toggleLink() {
    linking = !linking; linkSrc = null;
    if (world) board.notes.forEach(function (n) { var el = noteEls[n.id]; if (el) el.classList.remove('linking'); });
    renderModeBar();
  }
  function maybeLinkOnSelect(id) {
    if (!linking) return;
    if (!linkSrc) { linkSrc = id; var el = noteEls[id]; if (el) el.classList.add('linking'); }
    else { if (linkSrc !== id) addLink(linkSrc, id); var pe = noteEls[linkSrc]; if (pe) pe.classList.remove('linking'); linkSrc = null; linking = false; renderModeBar(); }
  }
  function addLink(from, to) {
    board.links = board.links || [];
    if (board.links.some(function (l) { return (l.from === from && l.to === to) || (l.from === to && l.to === from); })) return;
    pushHistory();
    board.links.push({ id: uid(), from: from, to: to });
    markDirty('boards', board.id);
    renderModeLayer(); scheduleSave();
  }
  function addChildNote() {
    var p = selectedNote(); if (!p) { showAlert('先选中节点', '请先点选一个中心便签，再点「加子节点」。', '知道了', null, false); return; }
    var child = { id: uid(), type: 'sticky', x: p.x + (p.w || 200) + 70, y: p.y, w: 180, h: 120, title: '新节点', body: '', createdAt: Date.now() };
    board.notes.push(child);
    var el = buildNote(child); world.appendChild(el); dropIn(el, child);
    board.links = board.links || [];
    board.links.push({ id: uid(), from: p.id, to: child.id });
    renderModeLayer(); renderClusters(); updateEmpty(); updateCount(); selectNote(child.id);
    markDirty('notes', child.id); markDirty('boards', board.id); scheduleSave();
  }
  function deleteLinksOf(id) {
    if (!board.links) return;
    board.links = board.links.filter(function (l) { return l.from !== id && l.to !== id; });
  }

  // ===== 文档 =====
  function setLevel(lv) {
    var n = selectedNote(); if (!n) { showAlert('先选中便签', '选中一张便签后再设置标题层级。', '知道了', null, false); return; }
    pushHistory();
    n.level = lv;
    var el = noteEls[n.id]; if (el) { el.classList.remove('lv1', 'lv2'); if (lv === 1) el.classList.add('lv1'); if (lv === 2) el.classList.add('lv2'); syncLvBadge(el, n); }
    markDirty('notes', n.id);
    scheduleSave();
  }
  function syncLvBadge(el, n) {
    var b = el.querySelector('.nb-lv-badge'); if (!b) return;
    b.textContent = n.level === 1 ? 'H1' : (n.level === 2 ? 'H2' : '');
  }
  function toggleDocFlow() { pushHistory(); docFlow = !docFlow; renderModeBar(); if (docFlow) reflowDoc(); else renderAll(); }
  function reflowDoc() {
    if (modeOf() !== 'document' || !docFlow) return;
    var ordered = board.notes.slice().sort(function (a, b) { return (a.createdAt || 0) - (b.createdAt || 0); });
    var x = -260, y = 0, gap = 22;
    ordered.forEach(function (n) {
      n.x = x; n.y = y;
      var h = n.h || (n.type === 'text' ? 80 : (n.type === 'image' ? 160 : 130));
      y += h + gap;
      var el = noteEls[n.id]; if (el) el.style.transform = noteTransform(n);
    });
    fitView();
  }
  function toggleToc() { ensureToc(); tocEl.classList.toggle('show'); if (tocEl.classList.contains('show')) renderToc(); }
  function ensureToc() { if (tocEl) return; tocEl = document.createElement('div'); tocEl.className = 'nb-toc'; document.body.appendChild(tocEl); }
  function renderToc() {
    if (!tocEl) return; tocEl.innerHTML = '<h4>大纲</h4>';
    var heads = board.notes.filter(function (n) { return n.level === 1 || n.level === 2; });
    if (!heads.length) { var e = document.createElement('div'); e.style.cssText = 'font-size:.74rem;color:var(--text3);padding:4px;'; e.textContent = '还没有标题，选中便签点 H1/H2 添加'; tocEl.appendChild(e); return; }
    heads.sort(function (a, b) { return (a.createdAt || 0) - (b.createdAt || 0); });
    heads.forEach(function (n) {
      var a = document.createElement('a'); a.className = n.level === 2 ? 'lv2' : '';
      a.textContent = (n.title || n.body || '').toString().replace(/<[^>]+>/g, '').slice(0, 22) || '（空）';
      a.addEventListener('click', function () { focusNote(n.id); tocEl.classList.remove('show'); });
      tocEl.appendChild(a);
    });
  }
  function focusNote(id) {
    var n = board.notes.find(function (x) { return x.id === id; }); if (!n) return;
    board.cam.x = viewport.clientWidth / 2 - (n.x + (n.w || 200) / 2) * board.cam.scale;
    board.cam.y = viewport.clientHeight / 2 - (n.y + (n.h || 130) / 2) * board.cam.scale;
    applyCam(); selectNote(id);
  }
  function exportDocMD() {
    var ordered = board.notes.slice().sort(function (a, b) { return (a.createdAt || 0) - (b.createdAt || 0); });
    var md = '# ' + (board.title || '游戏文档') + '\n\n';
    ordered.forEach(function (n) {
      var t = (n.title || '').toString().replace(/<[^>]+>/g, '');
      var b = (n.body || '').toString().replace(/<[^>]+>/g, '');
      var line = (t + (t && b ? '：' : '') + b).trim();
      if (!line) return;
      if (n.level === 1) md += '\n## ' + line + '\n';
      else if (n.level === 2) md += '\n### ' + line + '\n';
      else md += line + '\n';
    });
    var blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a'); a.href = url; a.download = (board.title || 'game-doc') + '.md';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  // ===== 手账：日期系统 =====
  function renderDateBar() {
    ensureModeBar(); clearModeBar();
    var wrap = document.createElement('div'); wrap.className = 'nb-datebar';
    var dates = {}; board.notes.forEach(function (n) { if (n.date) dates[n.date] = 1; });
    var list = Object.keys(dates).sort().reverse();
    var todayStr = dateStr(new Date());
    if (!list.length) list = [todayStr];
    if (list.indexOf(todayStr) < 0) list.unshift(todayStr);
    wrap.appendChild(mkDateChip('全部', '', null));
    list.forEach(function (d) {
      var parts = d.split('-'); var wd = ['日', '一', '二', '三', '四', '五', '六'][new Date(d + 'T00:00:00').getDay()];
      wrap.appendChild(mkDateChip(parts[1] + '/' + parts[2], '周' + wd, d));
    });
    modeBar.appendChild(wrap);
  }
  function mkDateChip(lbl, sub, d) {
    var c = document.createElement('div'); c.className = 'nb-date-chip' + (journalFilter === d ? ' on' : '');
    c.innerHTML = '<span class="nb-dn">' + lbl + '</span>' + (sub ? '<small>' + sub + '</small>' : '');
    c.addEventListener('click', function () { journalFilter = d; renderDateBar(); renderModeLayer(); });
    return c;
  }

  // ===== 角色卡：字段卡 =====
  function renderFields(el, n) {
    var box = el.querySelector('.nb-fields'); if (!box) return;
    box.innerHTML = '';
    (n.fields || []).forEach(function (f, i) {
      var row = document.createElement('div'); row.className = 'nb-field-row';
      var fl = document.createElement('input'); fl.className = 'nb-fl'; fl.value = f.label || ''; fl.placeholder = '字段';
      var fv = document.createElement('input'); fv.className = 'nb-fv'; fv.value = f.value || ''; fv.placeholder = '内容';
      fl.addEventListener('input', function () { n.fields[i].label = fl.value; markDirty('notes', n.id); scheduleSave(); });
      fv.addEventListener('input', function () { n.fields[i].value = fv.value; markDirty('notes', n.id); scheduleSave(); });
      var del = document.createElement('button'); del.textContent = '✕'; del.title = '删除字段';
      del.style.cssText = 'border:none;background:transparent;color:var(--text3);cursor:pointer;font-size:.8rem;';
      del.addEventListener('click', function () { n.fields.splice(i, 1); renderFields(el, n); markDirty('notes', n.id); scheduleSave(); });
      row.appendChild(fl); row.appendChild(fv); row.appendChild(del); box.appendChild(row);
    });
    var add = document.createElement('button'); add.className = 'nb-field-add'; add.textContent = '＋ 添加字段';
    add.addEventListener('click', function () { n.fields = n.fields || []; n.fields.push({ label: '', value: '' }); renderFields(el, n); markDirty('notes', n.id); scheduleSave(); });
    box.appendChild(add);
  }
  function addFieldNoteDefault(n) {
    n.fields = [{ label: '姓名', value: '' }, { label: '身份', value: '' }, { label: '外貌', value: '' }, { label: '性格', value: '' }];
  }

  // ===== 测评：评分（打分与平均分） =====
  function ensureRating() {
    if (ratingEl) return;
    ratingEl = document.createElement('div'); ratingEl.className = 'nb-rating'; ratingEl.innerHTML =
      '<div class="nb-rating-card"><h3>⭐ 游戏评分</h3><div id="nbRateBody"></div>' +
      '<div class="nb-rate-avg" id="nbRateAvg"></div>' +
      '<div class="nb-rating-actions"><button class="nb-ok" id="nbRateCancel">完成</button></div></div>';
    document.body.appendChild(ratingEl);
    ratingEl.addEventListener('click', function (e) { if (e.target === ratingEl) closeRatings(); });
    ratingEl.querySelector('#nbRateCancel').addEventListener('click', closeRatings);
  }
  function openRatings() {
    ensureRating();
    var body = ratingEl.querySelector('#nbRateBody'); body.innerHTML = '';
    board.ratings = board.ratings || {};
    RATE_KEYS.forEach(function (r) {
      var row = document.createElement('div'); row.className = 'nb-rate-row';
      var lab = document.createElement('label'); lab.textContent = r.l;
      var inp = document.createElement('input'); inp.type = 'range'; inp.min = '0'; inp.max = '5'; inp.step = '0.5'; inp.value = (board.ratings[r.k] != null ? board.ratings[r.k] : 0);
      var val = document.createElement('span'); val.className = 'nb-rate-val'; val.textContent = inp.value;
      inp.addEventListener('input', function () { val.textContent = inp.value; board.ratings[r.k] = parseFloat(inp.value); markDirty('boards', board.id); updateRateAvg(); scheduleSave(); });
      row.appendChild(lab); row.appendChild(inp); row.appendChild(val); body.appendChild(row);
    });
    updateRateAvg(); ratingEl.classList.add('show');
  }
  function updateRateAvg() {
    var sum = 0, cnt = 0;
    RATE_KEYS.forEach(function (r) { if (board.ratings[r.k] != null) { sum += board.ratings[r.k]; cnt++; } });
    var avg = cnt ? (sum / cnt) : 0;
    ratingEl.querySelector('#nbRateAvg').innerHTML = '综合评分：<b>' + avg.toFixed(1) + '</b> / 5（' + cnt + ' 项）';
  }
  function closeRatings() { if (ratingEl) ratingEl.classList.remove('show'); }

  // ============================================================
  // 成熟度提升模块：Toast / 确认弹窗 / 搜索 / 撤销重做 / 小地图 / 对齐参考线 / 外观 / 快捷键帮助
  // ============================================================
  var toastWrap = $('#toastWrap');
  var confirmModal = $('#confirmModal'), confirmTitle = $('#confirmTitle'), confirmText = $('#confirmText');
  var confirmInput = $('#confirmInput'), confirmOk = $('#confirmOk'), confirmCancel = $('#confirmCancel');
  var helpModal = $('#helpModal'), helpClose = $('#helpClose');
  var boardNameBtn = $('#boardName'), saveTick = $('#saveTick');
  var searchBtn = $('#searchBtn'), searchBar = $('#searchBar'), searchInput = $('#searchInput'), searchCount = $('#searchCount'), searchClear = $('#searchClear');
  var themeRow = $('#themeRow'), matRow = $('#matRow'), csRow = $('#csRow');
  var minimapEl = $('#minimap'), miniCanvas = $('#miniCanvas'), miniCtx = null;
  var guidesLayer = null;

  // ---------- Toast 轻提示 ----------
  function toast(msg, type) {
    if (!toastWrap) return;
    var t = document.createElement('div'); t.className = 'nb-toast' + (type ? ' ' + type : '');
    t.innerHTML = (type === 'ok' ? '<span class="nb-toast-ico">✓</span>' : type === 'err' ? '<span class="nb-toast-ico">!</span>' : '') + '<span>' + esc(msg) + '</span>';
    toastWrap.appendChild(t);
    requestAnimationFrame(function () { t.classList.add('show'); });
    setTimeout(function () { t.classList.remove('show'); setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 240); }, 1900);
  }
  // 确认弹窗：confirmDialog(标题, 正文, {okText, danger, onOk})；promptDialog(标题, 默认, onOk)
  var _confirmCb = null, _confirmShownAt = 0;
  // 遮罩是 inset:0 的全屏层。若用户在弹出瞬间又点了一下（双击习惯、鼠标连点、抖动），
  // 第二下会落在遮罩上把弹窗立刻关掉 —— 表现为「一个空白弹窗闪一下就没了」。
  // 所以刚弹出的一小段时间内忽略遮罩点击；取消/确定按钮不受影响。
  var CONFIRM_GRACE_MS = 480;
  function confirmDialog(title, text, opts) {
    opts = opts || {};
    if (!confirmModal) { if (opts.onOk) opts.onOk(); return; }
    confirmTitle.textContent = title || '提示';
    confirmText.textContent = text || ''; confirmText.style.display = text ? '' : 'none';
    confirmInput.style.display = 'none'; confirmInput.value = '';
    confirmOk.textContent = opts.okText || '确定';
    confirmOk.className = 'nb-c-ok' + (opts.danger ? ' danger' : '');
    _confirmCb = opts.onOk || null;
    openConfirm();
  }
  function promptDialog(title, def, onOk) {
    if (!confirmModal) return;
    confirmTitle.textContent = title || '输入';
    confirmText.style.display = 'none';
    confirmInput.style.display = ''; confirmInput.value = def || '';
    confirmOk.textContent = '确定'; confirmOk.className = 'nb-c-ok';
    _confirmCb = function () { if (onOk) onOk(confirmInput.value.trim()); };
    openConfirm();
    setTimeout(function () { try { confirmInput.focus(); confirmInput.select(); } catch (_) {} }, 40);
  }
  function openConfirm() { _confirmShownAt = Date.now(); confirmModal.classList.add('show'); }
  function closeConfirm() { confirmModal.classList.remove('show'); _confirmCb = null; }
  if (confirmCancel) confirmCancel.addEventListener('click', function () { closeConfirm(); });
  if (confirmModal) confirmModal.addEventListener('click', function (e) {
    if (e.target !== confirmModal) return;                         // 只认「点遮罩」
    if (Date.now() - _confirmShownAt < CONFIRM_GRACE_MS) return;   // 刚弹出的误触，忽略
    closeConfirm();
  });
  if (confirmOk) confirmOk.addEventListener('click', function () { var cb = _confirmCb; closeConfirm(); if (cb) cb(); });

  // ---------- 撤销 / 重做（快照式） ----------
  var undoStack = [], redoStack = [], HMAX = 60;
  var editSnap = null, editPushed = false;
  function snap() {
    var b = board;
    return JSON.parse(JSON.stringify({
      id: b.id, title: b.title, gameTitle: b.gameTitle, accent: b.accent, bg: b.bg, cam: b.cam,
      theme: b.theme, material: b.material, cardStyle: b.cardStyle,
      tpl: b.tpl, links: b.links || [], ratings: b.ratings || {}, clusters: b.clusters || [], notes: b.notes
    }));
  }
  function applySnap(s) {
    board.title = s.title; board.gameTitle = s.gameTitle; board.accent = s.accent; board.bg = s.bg;
    board.theme = s.theme || board.theme; board.material = s.material || board.material; board.cardStyle = s.cardStyle || board.cardStyle;
    board.cam = s.cam; board.tpl = s.tpl; board.links = s.links; board.ratings = s.ratings;
    board.clusters = s.clusters; board.notes = s.notes;
  }
  function pushHistory() {
    try { undoStack.push(snap()); if (undoStack.length > HMAX) undoStack.shift(); redoStack.length = 0; } catch (_) {}
  }
  function afterBoardChange() {
    deselect(); applyBg(); applyAccent(); applyCam(); renderAll(); enterMode();
    updateGameBanner(); updateBoardName(); markAppearance(); requestMiniUpdate(); scheduleSave();
  }
  function undo() {
    if (!undoStack.length) { toast('没有可撤销的操作'); return; }
    redoStack.push(snap()); applySnap(undoStack.pop()); markHistoryDirty(); afterBoardChange(); toast('已撤销');
  }
  function redo() {
    if (!redoStack.length) { toast('没有可重做的操作'); return; }
    undoStack.push(snap()); applySnap(redoStack.pop()); markHistoryDirty(); afterBoardChange(); toast('已重做');
  }

  // ---------- 搜索 / 筛选 ----------
  var searchTerm = '';
  function noteMatchesSearch(n) {
    var q = (searchTerm || '').trim().toLowerCase(); if (!q) return true;
    return noteHay(n).toLowerCase().indexOf(q) >= 0;   // noteHay 已去 HTML 标签、并含字段/日期
  }
  // 统一控制便签变暗：手账日期过滤 OR 搜索未命中
  function updateDims() {
    var jf = (modeOf() === 'journal') ? journalFilter : null;
    var q = (searchTerm || '').trim();
    var total = board.notes.length, hit = 0;
    board.notes.forEach(function (n) {
      var el = noteEls[n.id]; if (!el) return;
      var dimJournal = !!(jf && n.date !== jf);
      var dimSearch = !!(q && !noteMatchesSearch(n));
      var dimKind = !!(kindFilter && (n.kind || '') !== kindFilter);
      el.classList.toggle('nb-dim', dimJournal || dimSearch || dimKind);
      if (!dimJournal && !dimSearch) hit++;
    });
    if (searchCount) searchCount.textContent = q ? (hit + ' / ' + total + ' 匹配') : '';
    renderSearchResults();
  }
  // 便签纯文本摘要（去掉富文本标签）
  function plainOf(n, key) { return ((n && n[key]) || '').toString().replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(); }
  function noteHay(n) {
    return [plainOf(n, 'title'), plainOf(n, 'body'), n.date || '',
      (n.fields || []).map(function (f) { return (f.label || '') + ' ' + (f.value || ''); }).join(' ')].join(' ');
  }
  function escRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
  // 高亮命中片段：把 q 包成 <mark>，其余转义
  function hl(text, q) {
    var s = esc(text || '');
    if (!q) return s;
    try { return s.replace(new RegExp('(' + escRe(esc(q)) + ')', 'gi'), '<mark>$1</mark>'); }
    catch (_) { return s; }
  }
  function noteIcon(n) {
    if (n.type === 'image') return '🖼';
    if (n.type === 'sticker') return '✨';
    if (n.type === 'gamecard') return '🎮';
    if (n.type === 'fields') return '🧩';
    if (n.type === 'text') return '¶';
    return '▪';
  }
  var sresEl = null, sresList = null;
  function ensureSearchResults() {
    if (sresEl) return;
    sresEl = document.createElement('div');
    sresEl.className = 'nb-sresults';
    sresEl.innerHTML = '<div class="nb-sres"><div class="nb-sres-list"></div></div>';
    sresList = sresEl.querySelector('.nb-sres-list');
    document.body.appendChild(sresEl);
    sresEl.addEventListener('pointerdown', function (e) { e.stopPropagation(); });
  }
  function renderSearchResults() {
    if (!sresEl) return;
    var q = (searchTerm || '').trim();
    if (!q) { sresEl.classList.remove('show'); sresList.innerHTML = ''; return; }
    var hits = board.notes.filter(noteMatchesSearch).slice(0, 40);
    sresEl.classList.toggle('show', true);
    if (!hits.length) {
      sresList.innerHTML = '<div class="nb-sres-empty">没有便签包含「' + esc(q) + '」</div>';
      return;
    }
    sresList.innerHTML = hits.map(function (n) {
      var t = plainOf(n, 'title'), b = plainOf(n, 'body');
      var title = t || (b ? '' : '（空便签）');
      var sub = t ? b : b;
      return '<div class="nb-sres-item" data-nid="' + esc(n.id) + '" role="option">' +
        '<span class="nb-sres-ico">' + noteIcon(n) + '</span>' +
        '<div class="nb-sres-main">' +
          (title ? '<div class="nb-sres-t">' + hl(title, q) + '</div>' : '') +
          (sub ? '<div class="nb-sres-b">' + hl(sub.slice(0, 90), q) + '</div>' : '') +
        '</div></div>';
    }).join('');
  }
  function closeSearchResults() { if (sresEl) { sresEl.classList.remove('show'); } }
  // 飞达后闪一圈光环，让「就是这张」被看见
  function flashNote(id) {
    var el = noteEls[id]; if (!el) return;
    el.classList.remove('flash');
    void el.offsetWidth;                       // 强制重排，保证重复触发也能重播动画
    el.classList.add('flash');
    setTimeout(function () { el.classList.remove('flash'); }, 1900);
  }
  function setupSearch() {
    if (!searchBtn) return;
    ensureSearchResults();
    searchBtn.addEventListener('click', function () { toggleSearchBar(); });
    if (searchInput) {
      searchInput.addEventListener('input', function () { searchTerm = searchInput.value; updateDims(); });
      searchInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') { e.preventDefault(); focusFirstMatch(); }
        if (e.key === 'Escape') { e.preventDefault(); toggleSearchBar(false); }
      });
    }
    if (searchClear) searchClear.addEventListener('click', function () {
      searchTerm = ''; if (searchInput) searchInput.value = '';
      updateDims(); closeSearchResults(); searchBar.classList.remove('show');
    });
    // 点结果 → 飞过去 + 高亮
    sresList.addEventListener('click', function (e) {
      var it = e.target.closest ? e.target.closest('.nb-sres-item') : null;
      if (!it) return;
      var id = it.getAttribute('data-nid');
      var n = board.notes.filter(function (x) { return x.id === id; })[0];
      if (!n) return;
      focusNote(id); flashNote(id);
      toast('已定位到便签', 'ok');
    });
    // 点搜索区之外 → 收起结果下拉（搜索栏本身保留）
    document.addEventListener('pointerdown', function (e) {
      if (!sresEl || !sresEl.classList.contains('show')) return;
      if (e.target.closest && (e.target.closest('.nb-sresults') || e.target.closest('.nb-searchbar'))) return;
      closeSearchResults();
    }, true);
  }
  function toggleSearchBar(force) {
    if (!searchBar) return;
    var show = (typeof force === 'boolean') ? force : !searchBar.classList.contains('show');
    searchBar.classList.toggle('show', show);
    if (show) setTimeout(function () { try { searchInput.focus(); searchInput.select(); } catch (_) {} }, 30);
    if (show) renderSearchResults(); else closeSearchResults();
  }
  function focusFirstMatch() {                 // 回车跳到第一个命中的便签并居中
    var n = board.notes.filter(noteMatchesSearch)[0];
    if (!n) { toast('没有匹配的便签', 'err'); return; }
    focusNote(n.id); flashNote(n.id);
  }

  // =====================================================================
  // 命令面板（⌘/Ctrl + K）：一处搜遍「画板 / 模板 / 常用操作」。
  // 键盘流：↑↓ 选择、Enter 执行、Esc 关闭；也可直接点。
  // =====================================================================
  var cmdWrap = null, cmdInput = null, cmdList = null, cmdRows = [], cmdIdx = 0;
  function switchThemeById(id) {
    var t = THEMES.filter(function (x) { return x.id === id; })[0]; if (!t) return;
    pushHistory();
    board.theme = t.id; board.accent = t.accent;
    applyTheme(); markAppearance(); renderAll();
    markDirty('boards', board.id); scheduleSave();
    toast('主题：' + t.name, 'ok');
  }
  function buildCmdRows(q) {
    var ql = (q || '').trim().toLowerCase();
    function hit(text) { return !ql || (text || '').toLowerCase().indexOf(ql) >= 0; }
    var groups = [];

    var ops = [
      { ico: '＋', t: '新建便签', s: '在画布中央放一张便签', run: function () { addNote('sticky'); } },
      { ico: '¶', t: '新建文字', s: '无底纯文字，可自由染色', run: function () { addNote('text'); } },
      { ico: '✨', t: '打开贴纸 / 划线', s: '图案 · 表情 · 手绘线', run: function () { var b = document.getElementById('addSticker'); if (b) b.click(); } },
      { ico: '🎮', t: '插入游戏卡', s: '把游戏卡片引用到画板', run: function () { if (insertGameCardBtn) insertGameCardBtn.click(); } },
      { ico: '🖼', t: '生成画板图片', s: '把整块画板导出为一张长图', run: function () { toggleDiary(true); } },
      { ico: '📄', t: '导出 Markdown', s: '便签按时间顺序导出为 .md', run: exportDocMD },
      { ico: '🔍', t: '搜索便签', s: '在当前画板里找内容', key: '⌘F', run: function () { toggleSearchBar(true); } },
      { ico: '🌱', t: '记录回顾', s: '连续记录 · 徽章 · 节奏曲线 · 一年前的今天', run: function () { openReview(); } },
      { ico: '🎨', t: '切换主题', s: '改变整套配色', key: '▸', run: null },
      { ico: '🗂', t: '新建画板', s: '挑一个模板开块新板', run: function () { openBoardModal(null); } },
      { ico: '⌨', t: '快捷键与帮助', s: '查看全部操作说明', key: '?', run: function () { toggleHelp(true); } }
    ].filter(function (c) { return hit(c.t + ' ' + c.s); })
     .map(function (c) { return { ico: c.ico, t: c.t, s: c.s, key: c.key, run: c.run }; });
    if (ops.length) groups.push({ name: '操作', rows: ops });

    // 主题（展开成可执行项，便于快速换肤）
    if (hit('主题') || hit('配色') || hit('theme')) {
      var ths = THEMES.map(function (t) {
        return { ico: '●', dot: t.accent, t: '主题 · ' + t.name, s: (board.theme === t.id ? '当前主题' : '切换到这套配色'),
          run: function () { switchThemeById(t.id); }, on: board.theme === t.id };
      });
      groups.push({ name: '主题', rows: ths });
    }

    // 画板
    var bs = store.boards.filter(function (b) { return hit(b.title || '') || hit(b.gameTitle || ''); })
      .sort(function (a, c) { return (c.updatedAt || 0) - (a.updatedAt || 0); })
      .slice(0, 20).map(function (b) {
        return { ico: '▦', thumb: true, board: b, t: b.title || '未命名画板',
          s: (b.gameTitle ? '🎮 ' + b.gameTitle + ' · ' : '') + (b.notes ? b.notes.length : 0) + ' 张便签',
          run: function () { if (b.id !== store.activeId) switchBoard(b.id); }, on: b.id === store.activeId };
      });
    if (bs.length) groups.push({ name: '切换到画板', rows: bs });

    // 模板（新建板）
    var tps = (typeof TEMPLATES === 'object') ? Object.keys(TEMPLATES).filter(function (k) {
      var t = TEMPLATES[k];
      return hit(t.name || '') || hit(t.desc || '') || hit(k);
    }).slice(0, 14).map(function (k) {
      var t = TEMPLATES[k];
      return { ico: '✧', t: '新建 · ' + (t.name || k), s: t.desc || '套用这个模板开一块新板',
        run: function () { openBoardModal(null, k); } };
    }) : [];
    if (tps.length) groups.push({ name: '模板 · 新建画板', rows: tps });

    return groups;
  }
  function renderCmd(q) {
    if (!cmdList) return;
    var groups = buildCmdRows(q);
    cmdRows = [];
    var html = '';
    groups.forEach(function (g) {
      html += '<div class="nb-cmd-group">' + esc(g.name) + '</div>';
      g.rows.forEach(function (r) {
        var i = cmdRows.length; cmdRows.push(r);
        var ico = r.thumb ? '<span class="nb-ci-ico" style="padding:0;overflow:hidden;background:transparent">' + boardThumbHTML(r.board) + '</span>'
          : (r.dot ? '<span class="nb-ci-ico"><i style="width:11px;height:11px;border-radius:50%;background:' + r.dot + '"></i></span>'
                   : '<span class="nb-ci-ico">' + r.ico + '</span>');
        html += '<div class="nb-cmd-item' + (r.on ? ' on' : '') + '" data-i="' + i + '">' + ico +
          '<div class="nb-ci-main"><div class="nb-ci-t">' + esc(r.t) + '</div>' +
          (r.s ? '<div class="nb-ci-s">' + esc(r.s) + '</div>' : '') + '</div>' +
          (r.key ? '<span class="nb-ci-key">' + esc(r.key) + '</span>' : '') + '</div>';
      });
    });
    cmdList.innerHTML = html || '<div class="nb-cmd-empty">没有匹配的命令</div>';
    cmdIdx = 0;
    highlightCmd();
  }
  function highlightCmd() {
    if (!cmdList) return;
    var items = cmdList.querySelectorAll('.nb-cmd-item');
    for (var i = 0; i < items.length; i++) items[i].classList.toggle('on', i === cmdIdx);
    var cur = items[cmdIdx];
    if (cur && cur.scrollIntoView) cur.scrollIntoView({ block: 'nearest' });
  }
  function moveCmd(d) {
    if (!cmdRows.length) return;
    cmdIdx = (cmdIdx + d + cmdRows.length) % cmdRows.length;
    highlightCmd();
  }
  function runCmd(i) {
    var r = cmdRows[i]; if (!r || !r.run) { if (r && r.thumb) { /* 画板项有 run */ } }
    if (!r || typeof r.run !== 'function') return;
    closeCmdPalette();
    setTimeout(function () { try { r.run(); } catch (e) { console.warn(e); } }, 60);
  }
  function ensureCmdPalette() {
    if (cmdWrap) return;
    cmdWrap = document.createElement('div');
    cmdWrap.className = 'nb-cmd-wrap';
    cmdWrap.innerHTML =
      '<div class="nb-cmd" role="dialog" aria-modal="true" aria-label="命令面板">' +
        '<div class="nb-cmd-head">' +
          '<span class="nb-cmd-ico"><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M10 3a7 7 0 1 0 4.2 12.6L20 21.4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></span>' +
          '<input class="nb-cmd-input" type="text" placeholder="搜索画板 / 模板 / 操作…" aria-label="命令搜索" />' +
          '<span class="nb-cmd-esc">Esc</span>' +
        '</div>' +
        '<div class="nb-cmd-list" role="listbox"></div>' +
        '<div class="nb-cmd-foot"><span><kbd>↑</kbd><kbd>↓</kbd> 选择</span><span><kbd>Enter</kbd> 执行</span><span><kbd>Esc</kbd> 关闭</span></div>' +
      '</div>';
    document.body.appendChild(cmdWrap);
    cmdInput = cmdWrap.querySelector('.nb-cmd-input');
    cmdList = cmdWrap.querySelector('.nb-cmd-list');
    cmdInput.addEventListener('input', function () { renderCmd(cmdInput.value); });
    cmdInput.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown') { e.preventDefault(); moveCmd(1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); moveCmd(-1); }
      else if (e.key === 'Enter') { e.preventDefault(); runCmd(cmdIdx); }
      else if (e.key === 'Escape') { e.preventDefault(); closeCmdPalette(); }
      // 面板内吞掉其余快捷键，避免误触画布
      e.stopPropagation();
    });
    cmdList.addEventListener('click', function (e) {
      var it = e.target.closest ? e.target.closest('.nb-cmd-item') : null;
      if (!it) return;
      runCmd(parseInt(it.getAttribute('data-i'), 10) || 0);
    });
    cmdList.addEventListener('pointermove', function (e) {
      var it = e.target.closest ? e.target.closest('.nb-cmd-item') : null;
      if (!it) return;
      var i = parseInt(it.getAttribute('data-i'), 10) || 0;
      if (i !== cmdIdx) { cmdIdx = i; highlightCmd(); }
    });
    cmdWrap.addEventListener('pointerdown', function (e) { if (e.target === cmdWrap) closeCmdPalette(); });
  }
  function openCmdPalette() {
    ensureCmdPalette();
    cmdWrap.classList.add('show');
    if (cmdInput) { cmdInput.value = ''; }
    renderCmd('');
    setTimeout(function () { try { cmdInput.focus(); } catch (_) {} }, 30);
  }
  function closeCmdPalette() {
    if (!cmdWrap) return;
    cmdWrap.classList.remove('show');
    if (cmdInput) cmdInput.value = '';
  }
  function toggleCmdPalette() {
    if (cmdWrap && cmdWrap.classList.contains('show')) closeCmdPalette(); else openCmdPalette();
  }

  // =====================================================================
  // 时间情感层：记录回顾（连续记录徽章 / 近 30 天节奏曲线 / 一年前的今天）
  // 时间线以「全站所有画板」的便签 createdAt 为素材——记录习惯是跨画板的。
  // =====================================================================
  var BADGES = [
    { d: 3,   label: '起步', ico: '🌱' },
    { d: 7,   label: '一周', ico: '🌿' },
    { d: 14,  label: '半月', ico: '🍃' },
    { d: 30,  label: '满月', ico: '🌳' },
    { d: 100, label: '百日', ico: '🏆' }
  ];
  var BADGE_KEY = 'herlens_notes_badges_v1';
  function loadBadgeStore() {
    try { return JSON.parse(localStorage.getItem(BADGE_KEY)) || {}; } catch (_) { return {}; }
  }
  function saveBadgeStore(o) { try { localStorage.setItem(BADGE_KEY, JSON.stringify(o)); } catch (_) {} }
  // 徽章图案：金色奖章 + 天数（做成贴纸后可贴到画板上）
  function badgeStickerSVG(d) {
    return '<g>' +
      '<path d="M76 140 L60 188 L100 168 L140 188 L124 140 Z" style="fill:#E8A93E;stroke:#D08F27;stroke-width:4;stroke-linejoin:round"/>' +
      '<circle cx="100" cy="86" r="66" style="fill:#FFE0A0;stroke:#E8A93E;stroke-width:7"/>' +
      '<circle cx="100" cy="86" r="53" style="fill:none;stroke:#fff;stroke-width:3;stroke-opacity:.8"/>' +
      '<text x="100" y="100" text-anchor="middle" style="font-size:50px;font-weight:800;fill:#8A5410;font-family:inherit">' + d + '</text>' +
      '</g>';
  }
  function badgeById(id) {
    var m = /^bdg-(\d+)$/.exec(id || ''); if (!m) return null;
    var d = parseInt(m[1], 10);
    var b = BADGES.filter(function (x) { return x.d === d; })[0];
    if (!b) return null;
    return { id: 'bdg-' + d, cat: 'badge', label: '连续记录 ' + d + ' 天', ar: 1, par: 'xMidYMid meet', s: badgeStickerSVG(d) };
  }
  // 收集全站便签时间
  function allNoteTimes() {
    var out = [];
    (store.boards || []).forEach(function (b) {
      (b.notes || []).forEach(function (n) { if (n && n.createdAt) out.push({ boardId: b.id, boardTitle: b.title || '未命名画板', n: n, t: n.createdAt }); });
    });
    return out;
  }
  function shiftDay(d, delta) { var x = new Date(d.getTime()); x.setDate(x.getDate() + delta); x.setHours(0, 0, 0, 0); return x; }
  function computeReview() {
    var all = allNoteTimes();
    var days = {};
    all.forEach(function (x) { days[dateStr(new Date(x.t))] = (days[dateStr(new Date(x.t))] || 0) + 1; });
    var today = new Date(); today.setHours(0, 0, 0, 0);
    // 当前连续：今天有记 → 从今天往上数；今天没记 → 从昨天往上数（当天还没结束时不算断）
    var cur = 0, cursor = new Date(today);
    if (!days[dateStr(cursor)]) cursor = shiftDay(cursor, -1);
    while (days[dateStr(cursor)]) { cur++; cursor = shiftDay(cursor, -1); }
    // 历史最长连续
    var keys = Object.keys(days).sort();
    var best = 0, run = 0, prev = null;
    keys.forEach(function (k) {
      var d = new Date(k + 'T00:00:00');
      if (prev) {
        var gap = Math.round((d - prev) / 86400000);
        run = (gap === 1) ? run + 1 : 1;
      } else { run = 1; }
      if (run > best) best = run;
      prev = d;
    });
    // 近 30 天每日计数
    var counts = [], labels = [];
    for (var i = 29; i >= 0; i--) {
      var dd = shiftDay(today, -i);
      counts.push(days[dateStr(dd)] || 0);
      labels.push((dd.getMonth() + 1) + '/' + dd.getDate());
    }
    // 一年前的今天（往年同月同日）
    var mm = ('0' + (today.getMonth() + 1)).slice(-2), dd2 = ('0' + today.getDate()).slice(-2);
    var memories = all.filter(function (x) {
      var d = new Date(x.t);
      return d.getFullYear() < today.getFullYear() && ('0' + (d.getMonth() + 1)).slice(-2) === mm && ('0' + d.getDate()).slice(-2) === dd2;
    }).sort(function (a, b) { return b.t - a.t; });
    return { total: all.length, dayCount: keys.length, streak: cur, best: Math.max(best, cur), counts: counts, labels: labels, memories: memories, all: all };
  }
  function reviewCurveSVG(counts) {
    var W = 300, H = 84, pl = 6, pr = 6, pt = 12, pb = 16;
    var n = counts.length;
    var max = Math.max(1, Math.max.apply(null, counts));
    var step = (W - pl - pr) / Math.max(1, n - 1);
    var pts = counts.map(function (c, i) {
      return [pl + i * step, pt + (H - pt - pb) * (1 - c / max)];
    });
    var line = pts.map(function (p, i) { return (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join(' ');
    var area = line + ' L' + (pl + (n - 1) * step).toFixed(1) + ' ' + (H - pb) + ' L' + pl + ' ' + (H - pb) + ' Z';
    var dots = counts.map(function (c, i) {
      return c > 0 ? '<circle cx="' + pts[i][0].toFixed(1) + '" cy="' + pts[i][1].toFixed(1) + '" r="2.3" style="fill:var(--accent)"/>' : '';
    }).join('');
    return '<svg viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none" role="img" aria-label="近 30 天记录节奏">' +
      '<defs><linearGradient id="nbRvG" x1="0" y1="0" x2="0" y2="1">' +
        '<stop offset="0" style="stop-color:var(--accent);stop-opacity:.32"/>' +
        '<stop offset="1" style="stop-color:var(--accent);stop-opacity:0"/>' +
      '</linearGradient></defs>' +
      '<path d="' + area + '" style="fill:url(#nbRvG)"/>' +
      '<path d="' + line + '" style="fill:none;stroke:var(--accent);stroke-width:2;stroke-linejoin:round;stroke-linecap:round"/>' +
      dots + '</svg>';
  }
  var reviewModal = null, reviewBody = null;
  function renderReview() {
    if (!reviewBody) return;
    var R = computeReview();
    var bs = loadBadgeStore();
    // 徽章按「历史最长连续」永久解锁（打破连续也不会收回）
    bs.best = Math.max(bs.best || 0, R.best);
    bs.unlocked = bs.unlocked || {};
    BADGES.forEach(function (b) { if (bs.best >= b.d && !bs.unlocked[b.d]) bs.unlocked[b.d] = Date.now(); });
    saveBadgeStore(bs);

    var html = '';
    // ① 连续记录
    html += '<div class="nb-rv-sec"><div class="nb-rv-h">连续记录</div>' +
      '<div class="nb-rv-streak"><span class="nb-rv-num">' + R.streak + '</span><span class="nb-rv-unit">天</span></div>' +
      '<div class="nb-rv-sub">历史最长 <b>' + R.best + '</b> 天 · 累计记录 <b>' + R.dayCount + '</b> 天 · 共 <b>' + R.total + '</b> 张便签</div></div>';

    // ② 徽章
    html += '<div class="nb-rv-sec"><div class="nb-rv-h">坚持徽章</div><div class="nb-rv-badges">';
    BADGES.forEach(function (b) {
      var un = !!bs.unlocked[b.d];
      html += '<div class="nb-rv-badge' + (un ? ' un' : '') + '" data-badge="' + b.d + '" title="' + (un ? '已解锁 · 点击贴到当前画板' : '连续记录满 ' + b.d + ' 天解锁') + '">' +
        '<span class="nb-rv-medal">' + b.ico + '</span>' +
        '<span class="nb-rv-bl">' + b.label + '</span>' +
        '<span class="nb-rv-bp">' + (un ? b.d + ' 天 ✓' : b.d + ' 天') + '</span></div>';
    });
    html += '</div>';
    var next = BADGES.filter(function (b) { return !bs.unlocked[b.d]; })[0];
    html += '<div class="nb-rv-sub">' + (next
      ? '再连续记录 <b>' + Math.max(0, next.d - R.streak) + '</b> 天即可解锁「' + next.label + '」徽章'
      : '全部徽章已点亮，了不起 🌟') + '</div></div>';

    // ③ 节奏曲线
    var sum = R.counts.reduce(function (a, b) { return a + b; }, 0);
    html += '<div class="nb-rv-sec"><div class="nb-rv-h">近 30 天记录节奏</div>' +
      '<div class="nb-rv-curve">' + reviewCurveSVG(R.counts) +
      '<div class="nb-rv-curve-foot"><span>' + R.labels[0] + '</span><span>共 ' + sum + ' 张</span><span>' + R.labels[R.labels.length - 1] + ' · 今天</span></div>' +
      '</div></div>';

    // ④ 一年前的今天
    html += '<div class="nb-rv-sec"><div class="nb-rv-h">一年前的今天</div>';
    if (!R.memories.length) {
      html += '<div class="nb-rv-empty">还没有往年同一天的记录。<br>明年今日，这里会长出你今天的想法 🌱</div>';
    } else {
      R.memories.slice(0, 5).forEach(function (m) {
        var y = new Date(m.t).getFullYear();
        var t = plainOf(m.n, 'title') || plainOf(m.n, 'body').slice(0, 30) || '（空便签）';
        var s = plainOf(m.n, 'body').slice(0, 40);
        html += '<div class="nb-rv-mem" data-mem="' + esc(m.n.id) + '" data-mem-board="' + esc(m.boardId) + '">' +
          '<span class="nb-rv-mem-ico">🕰</span>' +
          '<div class="nb-rv-mem-main"><div class="nb-rv-mem-t">' + esc(t) + '</div>' +
          '<div class="nb-rv-mem-s">' + y + ' 年的今天 · ' + esc(m.boardTitle) + (s ? ' · ' + esc(s) : '') + '</div></div>' +
          '<span class="nb-rv-mem-go">去看看 ›</span></div>';
      });
    }
    html += '</div>';

    reviewBody.innerHTML = html;
  }
  // 把已解锁徽章做成贴纸贴到当前画板
  function putBadgeOnBoard(d) {
    var bs = loadBadgeStore();
    if (!(bs.unlocked && bs.unlocked[d])) { toast('还没解锁这枚徽章', 'err'); return; }
    var b = BADGES.filter(function (x) { return x.d === d; })[0];
    var c = screenToWorld(viewport.clientWidth / 2, viewport.clientHeight / 2);
    var w = 104, h = 104;
    var n = { id: uid(), x: Math.round(c.x - w / 2), y: Math.round(c.y - h / 2), type: 'sticker', pinned: false,
      createdAt: Date.now(), w: w, h: h, baseSize: 14, rot: 0, variant: null, color: null,
      stickId: 'bdg-' + d, ar: 1, kind: '', stageId: null };
    pushHistory(); board.notes.push(n);
    var el = buildNote(n); world.appendChild(el); dropIn(el, n);
    renderClusters(); updateEmpty(); updateCount();
    selectNote(n.id); markDirty('notes', n.id); scheduleSave();
    closeReview();
    toast('徽章已贴到画板「' + (b ? b.label : d) + '」', 'ok');
  }
  function gotoMemory(noteId, boardId) {
    closeReview();
    var go = function () { focusNote(noteId); flashNote(noteId); };
    if (boardId && boardId !== store.activeId) { switchBoard(boardId); setTimeout(go, 220); }
    else { go(); }
  }
  function updateStreakChip() {
    var chip = document.getElementById('streakChip'), num = document.getElementById('streakNum');
    if (!chip || !num) return;
    if (!store || !store.boards) return;          // 启动早期 store 还没就绪
    var R = computeReview();
    num.textContent = R.streak;
    chip.classList.toggle('hot', R.streak >= 3);
    chip.title = '记录回顾：已连续记录 ' + R.streak + ' 天（最长 ' + R.best + ' 天）';
  }
  function ensureReview() {
    if (reviewModal) return;
    reviewModal = document.getElementById('reviewModal');
    reviewBody = document.getElementById('reviewBody');
    if (!reviewModal) return;
    var closeBtn = document.getElementById('reviewClose');
    if (closeBtn) closeBtn.addEventListener('click', function () { closeReview(); });
    reviewModal.addEventListener('pointerdown', function (e) { if (e.target === reviewModal) closeReview(); });
    reviewBody.addEventListener('click', function (e) {
      var bd = e.target.closest ? e.target.closest('.nb-rv-badge') : null;
      if (bd) { putBadgeOnBoard(parseInt(bd.getAttribute('data-badge'), 10)); return; }
      var mem = e.target.closest ? e.target.closest('.nb-rv-mem') : null;
      if (mem) gotoMemory(mem.getAttribute('data-mem'), mem.getAttribute('data-mem-board'));
    });
    var chip = document.getElementById('streakChip');
    if (chip) chip.addEventListener('click', function () { openReview(); });
  }
  function openReview() { ensureReview(); renderReview(); if (reviewModal) { reviewModal.classList.add('show'); reviewModal.setAttribute('aria-hidden', 'false'); } }
  function closeReview() { if (reviewModal) { reviewModal.classList.remove('show'); reviewModal.setAttribute('aria-hidden', 'true'); } }

  // ---------- 小地图 ----------
  var miniView = { ox: 0, oy: 0, s: 1, minX: 0, minY: 0, W: 168, H: 116 };
  var miniDragging = false, miniDirty = false, miniRAF = 0;
  function roundRect(c, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r);
    c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
  }
  function renderMinimap() {
    if (!miniCtx) return;
    var W = miniView.W, H = miniView.H;
    miniCtx.clearRect(0, 0, W, H);
    miniCtx.fillStyle = (board.bg === 'dark') ? '#211b27' : (board.bg === 'paper' ? '#f6f1e7' : '#f3eef8');
    miniCtx.fillRect(0, 0, W, H);
    if (!board.notes.length) {
      miniCtx.fillStyle = '#b3a7c0'; miniCtx.font = '11px sans-serif'; miniCtx.textAlign = 'center';
      miniCtx.fillText('空画板', W / 2, H / 2); return;
    }
    var minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    board.notes.forEach(function (n) {
      var w = n.w || 200, h = n.h || (n.type === 'image' ? 160 : (n.type === 'text' ? 90 : 130));
      minX = Math.min(minX, n.x); minY = Math.min(minY, n.y); maxX = Math.max(maxX, n.x + w); maxY = Math.max(maxY, n.y + h);
    });
    var vw = viewport.clientWidth, vh = viewport.clientHeight, sc = board.cam.scale;
    var vx0 = (0 - board.cam.x) / sc, vy0 = (0 - board.cam.y) / sc, vx1 = vx0 + vw / sc, vy1 = vy0 + vh / sc;
    minX = Math.min(minX, vx0); minY = Math.min(minY, vy0); maxX = Math.max(maxX, vx1); maxY = Math.max(maxY, vy1);
    var pad = 14, bw = Math.max(1, maxX - minX), bh = Math.max(1, maxY - minY);
    var s = Math.min((W - pad * 2) / bw, (H - pad * 2) / bh);
    var ox = (W - bw * s) / 2, oy = (H - bh * s) / 2;
    miniView.ox = ox; miniView.oy = oy; miniView.s = s; miniView.minX = minX; miniView.minY = minY;
    function tx(x) { return ox + (x - minX) * s; }
    function ty(y) { return oy + (y - minY) * s; }
    var acc = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#B86FD8';
    board.notes.forEach(function (n) {
      var w = n.w || 200, h = n.h || (n.type === 'image' ? 160 : (n.type === 'text' ? 90 : 130));
      miniCtx.fillStyle = n.pinned ? '#ffb04d' : acc;
      roundRect(miniCtx, tx(n.x), ty(n.y), Math.max(2, w * s), Math.max(2, h * s), 2); miniCtx.fill();
    });
    miniCtx.strokeStyle = '#ff4d6d'; miniCtx.lineWidth = 1.5;
    miniCtx.strokeRect(tx(vx0), ty(vy0), (vx1 - vx0) * s, (vy1 - vy0) * s);
  }
  function requestMiniUpdate() {
    if (miniDirty) return; miniDirty = true;
    if (miniRAF) return;
    miniRAF = requestAnimationFrame(function () { miniDirty = false; miniRAF = 0; renderMinimap(); });
  }
  function miniGoto(clientX, clientY) {
    var rect = miniCanvas.getBoundingClientRect();
    var wx = miniView.minX + (clientX - rect.left - miniView.ox) / miniView.s;
    var wy = miniView.minY + (clientY - rect.top - miniView.oy) / miniView.s;
    var vw = viewport.clientWidth, vh = viewport.clientHeight, sc = board.cam.scale;
    board.cam.x = vw / 2 - wx * sc; board.cam.y = vh / 2 - wy * sc;
    markDirty('boards', board.id);
    applyCam(); scheduleSave();
  }
  function setupMinimap() {
    if (!minimapEl || !miniCanvas) return;
    miniCtx = miniCanvas.getContext('2d');
    minimapEl.addEventListener('pointerdown', function (e) { miniDragging = true; try { minimapEl.setPointerCapture(e.pointerId); } catch (_) {} miniGoto(e.clientX, e.clientY); });
    minimapEl.addEventListener('pointermove', function (e) { if (miniDragging) miniGoto(e.clientX, e.clientY); });
    minimapEl.addEventListener('pointerup', function () { miniDragging = false; });
    minimapEl.addEventListener('pointercancel', function () { miniDragging = false; });
  }

  // ---------- 对齐参考线 ----------
  // 参考线改为「常驻两条」：垂直/水平各一，靠显隐切换。
  // 好处：拖动高速刷新时不再每帧重建 DOM，且能让「吸附脉冲」连续播放而不被打断。
  function ensureGuides() {
    if (guidesLayer) return;
    guidesLayer = document.createElement('div'); guidesLayer.className = 'nb-guides';
    var gv = document.createElement('div'); gv.className = 'nb-g-line nb-g-v';
    var gh = document.createElement('div'); gh.className = 'nb-g-line nb-g-h';
    guidesLayer.appendChild(gv); guidesLayer.appendChild(gh);
    guidesLayer._v = gv; guidesLayer._h = gh;
    world.appendChild(guidesLayer);
  }
  function clearGuides() {
    if (!guidesLayer) return;
    guidesLayer._v.style.display = 'none';
    guidesLayer._h.style.display = 'none';
  }
  function drawGuides(lines, bb) {
    if (!guidesLayer) return;
    var gv = guidesLayer._v, gh = guidesLayer._h;
    gv.style.display = 'none'; gh.style.display = 'none';
    lines.forEach(function (l) {
      if (l.t === 'v') {
        gv.style.display = 'block'; gv.style.left = l.at + 'px';
        gv.style.top = bb.minY + 'px'; gv.style.height = (bb.maxY - bb.minY) + 'px';
        gv.style.borderLeftWidth = '1px';
      } else {
        gh.style.display = 'block'; gh.style.top = l.at + 'px';
        gh.style.left = bb.minX + 'px'; gh.style.width = (bb.maxX - bb.minX) + 'px';
        gh.style.borderTopWidth = '1px';
      }
    });
  }
  function computeAlign(n) {
    var w = n.w || 200, h = n.h || (n.type === 'image' ? 160 : (n.type === 'text' ? 90 : 130));
    var dL = n.x, dR = n.x + w, dT = n.y, dB = n.y + h, dCx = (dL + dR) / 2, dCy = (dT + dB) / 2;
    var bestX = { d: 1e9, dx: 0, at: 0 }, bestY = { d: 1e9, dy: 0, at: 0 };
    var T = 7 / board.cam.scale;
    var minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    board.notes.forEach(function (o) {
      if (o.id === n.id) return;
      var ow = o.w || 200, oh = o.h || (o.type === 'image' ? 160 : (o.type === 'text' ? 90 : 130));
      var oL = o.x, oR = oL + ow, oT = o.y, oB = oT + oh, oCx = (oL + oR) / 2, oCy = (oT + oB) / 2;
      [[dL, oL], [dR, oR], [dCx, oCx]].forEach(function (p) { var dd = Math.abs(p[0] - p[1]); if (dd < bestX.d) { bestX.d = dd; bestX.dx = p[1] - p[0]; bestX.at = p[1]; } });
      [[dT, oT], [dB, oB], [dCy, oCy]].forEach(function (p) { var dd = Math.abs(p[0] - p[1]); if (dd < bestY.d) { bestY.d = dd; bestY.dy = p[1] - p[0]; bestY.at = p[1]; } });
      minX = Math.min(minX, oL); minY = Math.min(minY, oT); maxX = Math.max(maxX, oR); maxY = Math.max(maxY, oB);
    });
    var dx = 0, dy = 0, lines = [];
    if (bestX.d <= T) { dx = bestX.dx; lines.push({ t: 'v', at: bestX.at }); }
    if (bestY.d <= T) { dy = bestY.dy; lines.push({ t: 'h', at: bestY.at }); }
    var bb = isFinite(minX) ? { minX: minX, minY: minY, maxX: Math.max(maxX, dR), maxY: Math.max(maxY, dB) } : { minX: dL, minY: dT, maxX: dR, maxY: dB };
    return { dx: dx, dy: dy, lines: lines, has: !!(dx || dy), bb: bb };
  }

  // ---------- 外观：主题色 / 背景 ----------
  function applyAccent() { applyTheme(); }               // 兼容旧调用：主题已包含 accent
  function updateBoardName() { if (boardNameBtn) boardNameBtn.textContent = board.title || '未命名画板'; }
  function markAppearance() {
    if (themeRow) {
      Array.prototype.forEach.call(themeRow.children, function (sw) { sw.classList.toggle('on', sw.dataset.k === board.theme); });
    }
    if (matRow) {
      Array.prototype.forEach.call(matRow.children, function (sw) { sw.classList.toggle('on', sw.dataset.k === (board.material || board.bg)); });
    }
    if (csRow) {
      Array.prototype.forEach.call(csRow.children, function (sw) { sw.classList.toggle('on', sw.dataset.k === board.cardStyle); });
    }
  }
  function setupAppearance() {
    // 主题（颜色）：每张卡片自带配色预览条
    if (themeRow) {
      THEMES.forEach(function (t) {
        var sw = document.createElement('button');
        sw.className = 'nb-theme-card'; sw.dataset.k = t.id; sw.title = t.name;
        sw.innerHTML =
          '<span class="nb-theme-dots">' +
            '<i style="background:' + t.accent + '"></i>' +
            '<i style="background:' + t.accent2 + '"></i>' +
            '<i style="background:' + t.canvas + '"></i>' +
            '<i style="background:' + t.card + '"></i>' +
          '</span>' +
          '<span class="nb-theme-name">' + t.name + '</span>';
        sw.addEventListener('click', function () {
          board.theme = t.id; board.accent = t.accent;
          pushHistory(); applyTheme(); markAppearance(); renderAll();
          markDirty('boards', board.id); scheduleSave();
          toast('主题：' + t.name, 'ok');
        });
        themeRow.appendChild(sw);
      });
    }
    // 材质（背景质感）：缩略图直接用真实材质渲染
    if (matRow) {
      MATERIALS.forEach(function (m) {
        var sw = document.createElement('button');
        sw.className = 'nb-mat-card'; sw.dataset.k = m.id; sw.title = m.name + ' · ' + m.hint;
        var prev = document.createElement('span');
        prev.className = 'nb-mat-prev';
        prev.style.backgroundImage = m.img;
        prev.style.backgroundSize = m.size;
        sw.appendChild(prev);
        var nm = document.createElement('span'); nm.className = 'nb-mat-name'; nm.textContent = m.name;
        sw.appendChild(nm);
        sw.addEventListener('click', function () {
          board.material = m.id; board.bg = m.id;
          pushHistory(); applyMaterial(); markAppearance();
          markDirty('boards', board.id); scheduleSave();
          toast('材质：' + m.name, 'ok');
        });
        matRow.appendChild(sw);
      });
    }
    // 便签卡片风格：真实小卡预览 + 名字 + 说明
    if (csRow) {
      CARDSTYLES.forEach(function (cs) {
        var sw = document.createElement('button');
        sw.className = 'nb-cs-card'; sw.dataset.k = cs.id; sw.title = cs.name + ' · ' + cs.hint;
        var swatch = document.createElement('span'); swatch.className = 'nb-cs-swatch'; swatch.style.backgroundImage = cs.sw;
        sw.appendChild(swatch);
        var nm = document.createElement('div'); nm.className = 'nb-cs-name'; nm.textContent = cs.name;
        sw.appendChild(nm);
        var hi = document.createElement('div'); hi.className = 'nb-cs-hint'; hi.textContent = cs.hint;
        sw.appendChild(hi);
        sw.addEventListener('click', function () {
          board.cardStyle = cs.id;
          pushHistory(); applyCardStyle(); markAppearance(); renderAll();
          markDirty('boards', board.id); scheduleSave();
          toast('卡片风格：' + cs.name, 'ok');
        });
        csRow.appendChild(sw);
      });
    }
  }

  // ---------- 帮助 / 快捷键 / 保存指示 / 平滑缩放 ----------
  function toggleHelp(force) { if (!helpModal) return; var s = (typeof force === 'boolean') ? force : !helpModal.classList.contains('show'); helpModal.classList.toggle('show', s); }
  function setupHelp() {
    if (helpClose) helpClose.addEventListener('click', function () { toggleHelp(false); });
    if (helpModal) helpModal.addEventListener('click', function (e) { if (e.target === helpModal) toggleHelp(false); });
  }
  function flashSaved() {
    if (!saveTick) return;
    saveTick.classList.add('show');
    if (flashSaved._t) clearTimeout(flashSaved._t);
    flashSaved._t = setTimeout(function () { saveTick.classList.remove('show'); }, 1400);
  }
  function zoomAnimated(factor, sx, sy) {
    var r = viewport.getBoundingClientRect();
    if (sx == null) { sx = r.left + r.width / 2; sy = r.top + r.height / 2; }
    world.classList.add('nb-anim');
    zoomAt(factor, sx, sy);
    setTimeout(function () { world.classList.remove('nb-anim'); }, 200);
  }
  function centerZoom(f) { var r = viewport.getBoundingClientRect(); zoomAnimated(f, r.left + r.width / 2, r.top + r.height / 2); }
  function setupKeys() {
    document.addEventListener('keydown', function (e) {
      var ae = document.activeElement;
      var typing = ae && (ae.isContentEditable || ae.tagName === 'INPUT' || ae.tagName === 'TEXTAREA' || ae.tagName === 'SELECT');
      var mod = e.ctrlKey || e.metaKey;
      if (mod && (e.key === 'z' || e.key === 'Z')) { e.preventDefault(); if (e.shiftKey) redo(); else undo(); return; }
      if (mod && (e.key === 'y' || e.key === 'Y')) { e.preventDefault(); redo(); return; }
      if (mod && (e.key === 'd' || e.key === 'D')) { if (selectedId && !typing) { e.preventDefault(); pushHistory(); duplicateNote(selectedId); } return; }
      if (mod && (e.key === 'f' || e.key === 'F')) { if (!typing) { e.preventDefault(); toggleSearchBar(true); } return; }
      if (mod && (e.key === 'k' || e.key === 'K')) { e.preventDefault(); toggleCmdPalette(); return; }
      if (e.key === '?') { if (!typing) { e.preventDefault(); toggleHelp(); } return; }
      // 相册放映中：方向键 / 空格翻页
      if (isShowOpen()) {
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === ' ') { e.preventDefault(); showStep(1); return; }
        if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); showStep(-1); return; }
      }
      if (e.key === 'Escape') {
        // 逐层关闭：相册放映 → 旅程回放 → 回顾 → 命令面板 → 搜索 → 帮助/确认 → 弹窗 → 取消选中
        if (isShowOpen()) { closeShow(); return; }
        if (tripPlaying) { stopTrip(); return; }
        if (reviewModal && reviewModal.classList.contains('show')) { closeReview(); return; }
        if (cmdWrap && cmdWrap.classList.contains('show')) { closeCmdPalette(); return; }
        if (searchBar && searchBar.classList.contains('show') && document.activeElement === searchInput) { toggleSearchBar(false); return; }
        if (confirmModal && confirmModal.classList.contains('show')) { closeConfirm(); return; }
        if (helpModal && helpModal.classList.contains('show')) { toggleHelp(false); return; }
        if (diaryModal && diaryModal.classList.contains('show')) { toggleDiary(false); return; }
        if (stageModal && stageModal.classList.contains('show')) { toggleStageModal(false); return; }
        if (boardModal && boardModal.classList.contains('show')) { closeBoardModal(); return; }
        if (boardPanel && boardPanel.classList.contains('show')) { toggleBoardPanel(false); return; }
        if (selectedId) deselect();
        return;
      }
      if (!typing && (e.key === 'Delete' || e.key === 'Backspace')) {
        if (selectedId) { e.preventDefault(); deleteNote(selectedId); }
        return;
      }
      if (!typing && (e.key === '=' || e.key === '+')) { e.preventDefault(); centerZoom(1.15); return; }
      if (!typing && (e.key === '-' || e.key === '_')) { e.preventDefault(); centerZoom(1 / 1.15); return; }
      // 注：Alt+N 速记浮层在原有监听里处理，这里不重复
    });
  }
  function enhanceInit() {
    applyAccent(); updateBoardName(); markAppearance();
    setupSearch(); setupAppearance(); setupMinimap(); setupHelp(); setupKeys();
    ensureReview(); updateStreakChip();
    if (minimapEl && board.notes.length) minimapEl.classList.remove('hidden');
    requestMiniUpdate();

    // 顶栏：撤销 / 重做 / 帮助 / 画板重命名
    var undoBtn = $('#undoBtn'), redoBtn = $('#redoBtn'), helpBtn = $('#helpBtn');
    if (undoBtn) undoBtn.addEventListener('click', function () { undo(); });
    if (redoBtn) redoBtn.addEventListener('click', function () { redo(); });
    if (helpBtn) helpBtn.addEventListener('click', function () { toggleHelp(true); });
    if (boardNameBtn) {
      // 点击画板名 → 弹出"画板库"下拉（让你一眼看到所有历史画板，可快速切换 / 新建 / 改名）
      // 双击画板名 → 打开重命名弹窗（保留原"点击改名"入口）
      boardNameBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        toggleBoardPopover();
      });
      boardNameBtn.addEventListener('dblclick', function (e) {
        e.preventDefault(); e.stopPropagation();
        closeBoardPopover();
        openBoardModal(store.activeId);
      });
    }
    if (boardPopNew) boardPopNew.addEventListener('click', function () { closeBoardPopover(); openBoardModal(null); });
    if (boardPopAll) boardPopAll.addEventListener('click', function () { closeBoardPopover(); toggleBoardPanel(true); });
    // 点画板库外面任意位置收起
    document.addEventListener('pointerdown', function (e) {
      if (!boardPopover || !boardPopover.classList.contains('show')) return;
      if (boardPopover.contains(e.target) || (boardNameBtn && boardNameBtn.contains(e.target))) return;
      closeBoardPopover();
    }, true);

    // 缩放按钮改为带过渡的平滑缩放
    var zi = $('#zoomIn'), zo = $('#zoomOut'), fb = $('#fitBtn');
    if (zi) zi.addEventListener('click', function () { centerZoom(1.15); });
    if (zo) zo.addEventListener('click', function () { centerZoom(1 / 1.15); });
    if (fb) fb.addEventListener('click', function () { world.classList.add('nb-anim'); fitView(); setTimeout(function () { world.classList.remove('nb-anim'); }, 220); });
  }

  // ============================================================
  // 进度分章（给便签归类到游戏进程章节）
  // 数据：board.stages = [{id,name}]（有序）；便签 n.stageId = stage.id
  // ============================================================
  var STAGE_COLORS = ['#9B7FD4', '#E07BA4', '#4FB3A8', '#F0A05A', '#6AA9E0', '#7CC576', '#C78AE0', '#E0B95C', '#E0655A', '#58B6C9'];
  function stageColor(i) { return STAGE_COLORS[((i % STAGE_COLORS.length) + STAGE_COLORS.length) % STAGE_COLORS.length]; }
  function stageById(id) { var s = board.stages || []; for (var i = 0; i < s.length; i++) if (s[i].id === id) return s[i]; return null; }
  function stageNameOf(id) { var s = stageById(id); return s ? s.name : ''; }
  function stageIndex(id) { var s = board.stages || []; for (var i = 0; i < s.length; i++) if (s[i].id === id) return i; return -1; }
  function ensureStages() { if (!Array.isArray(board.stages)) board.stages = []; return board.stages; }
  // 把每个便签的章节色点/高亮同步到 DOM（renderAll 之后与章节改动后调用）
  function syncStageMarks() {
    if (!world) return;
    (board.notes || []).forEach(function (n) {
      var el = noteEls[n.id]; if (!el) return;
      var dot = el.querySelector('.nb-stdot'); if (!dot) return;
      var tag = el.querySelector('.nb-sttag');
      var st = n.stageId ? stageById(n.stageId) : null;
      if (!st) {
        el.classList.remove('has-stage'); dot.style.background = ''; dot.title = '';
        if (tag) { tag.textContent = ''; tag.style.removeProperty('--sc'); }
        return;
      }
      el.classList.add('has-stage');
      var c = stageColor(stageIndex(st.id));
      dot.style.background = c; dot.title = st.name;
      if (tag) { tag.textContent = st.name; tag.style.setProperty('--sc', c); }
    });
  }

  // ---- 章节管理 ----
  var _stageEditingRow = null;
  function toggleStageModal(force) {
    if (!stageModal) return;
    var show = (typeof force === 'boolean') ? force : !stageModal.classList.contains('show');
    stageModal.classList.toggle('show', show);
    if (show) renderStageModal();
  }
  function addStage(name) {
    name = (name || '').replace(/\s+/g, ' ').trim();
    if (!name) { toast('请输入章节名', 'err'); return false; }
    pushHistory();
    var _ns = { id: uid(), name: name };
    ensureStages().push(_ns);
    markDirty('stages', _ns.id);
    scheduleSave(); renderStageModal(); syncStageMarks();
    toast('已添加章节「' + name + '」', 'ok');
    return true;
  }
  function deleteStage(id) {
    var st = stageById(id); if (!st) return;
    var cnt = (board.notes || []).filter(function (n) { return n.stageId === id; }).length;
    confirmDialog('删除「' + st.name + '」？', (cnt ? '该章节下有 ' + cnt + ' 条便签，会一并移回「未分章」。' : '删除后该章节的便签归到「未分章」。'), {
      danger: true, okText: '删除',
      onOk: function () {
        pushHistory();
        board.stages = ensureStages().filter(function (s) { return s.id !== id; });
        (board.notes || []).forEach(function (n) { if (n.stageId === id) { n.stageId = null; markDirty('notes', n.id); } });
        markDel('stages', id);   // 云端同步时从 note_stages 表删除
        scheduleSave(); renderStageModal(); renderAll(); renderBoardPanel();
        toast('已删除章节');
      }
    });
  }
  function moveStage(id, dir) {
    var arr = ensureStages(); var i = arr.findIndex(function (s) { return s.id === id; }); if (i < 0) return;
    var j = i + dir; if (j < 0 || j >= arr.length) return;
    pushHistory();
    var t = arr[i]; arr[i] = arr[j]; arr[j] = t;
    markDirty('stages', arr[i].id); markDirty('stages', arr[j].id);
    scheduleSave(); renderStageModal(); renderAll(); requestMiniUpdate();
  }
  function renderStageModal() {
    if (!stageList) return;
    stageList.innerHTML = '';
    var arr = ensureStages();
    if (!arr.length) {
      var e = document.createElement('div'); e.className = 'nb-in-null';
      e.style.cssText = 'font-size:.82rem;color:var(--text3);padding:8px 2px 12px;line-height:1.7;';
      e.textContent = '还没有章节。可以在下面自己输入，或一键铺几个常用节点。';
      stageList.appendChild(e);
    }
    arr.forEach(function (s, i) {
      var row = document.createElement('div'); row.className = 'nb-stage-row'; row.dataset.id = s.id;
      row.style.setProperty('--sc', stageColor(i));
      var dot = document.createElement('span'); dot.className = 'nb-sr-dot';
      var inp = document.createElement('input'); inp.className = 'nb-sr-name'; inp.value = s.name; inp.maxLength = 24;
      inp.addEventListener('click', function (e) { e.stopPropagation(); inp.select(); });
      inp.addEventListener('focus', function () { if (_stageEditingRow && _stageEditingRow !== row) _stageEditingRow.classList.remove('editing'); _stageEditingRow = row; row.classList.add('editing'); });
      inp.addEventListener('blur', commitStageRename);
      inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); commitStageRename(); stageNewInput && stageNewInput.focus(); } });
      var cnt = (board.notes || []).filter(function (n) { return n.stageId === s.id; }).length;
      var cntEl = document.createElement('span'); cntEl.className = 'nb-sr-cnt'; cntEl.textContent = cnt + ' 条';
      var up = document.createElement('button'); up.className = 'nb-sr-ico'; up.textContent = '↑'; up.title = '上移';
      var dn = document.createElement('button'); dn.className = 'nb-sr-ico'; dn.textContent = '↓'; dn.title = '下移';
      var del = document.createElement('button'); del.className = 'nb-sr-ico danger'; del.textContent = '🗑'; del.title = '删除章节';
      up.addEventListener('click', function (e) { e.stopPropagation(); moveStage(s.id, -1); });
      dn.addEventListener('click', function (e) { e.stopPropagation(); moveStage(s.id, 1); });
      del.addEventListener('click', function (e) { e.stopPropagation(); deleteStage(s.id); });
      row.appendChild(dot); row.appendChild(inp); row.appendChild(cntEl); row.appendChild(up); row.appendChild(dn); row.appendChild(del);
      stageList.appendChild(row);
    });
    // 快捷常用节点
    if (stageQuick) {
      stageQuick.innerHTML = '';
      ['序章', '第一章', '第二章', '第三章', '终章', '结局'].forEach(function (qn) {
        var b = document.createElement('button'); b.className = 'nb-sq'; b.textContent = '+ ' + qn;
        b.addEventListener('click', function () { if (ensureStages().some(function (s) { return s.name === qn; })) { toast('已有同名章节', 'err'); return; } addStage(qn); });
        stageQuick.appendChild(b);
      });
    }
  }
  function commitStageRename() {
    var row = _stageEditingRow; if (!row) return;
    _stageEditingRow = null; row.classList.remove('editing');
    var inp = row.querySelector('.nb-sr-name'); if (!inp) return;
    var id = row.dataset.id; var st = stageById(id); if (!st) return;
    var v = (inp.value || '').replace(/\s+/g, ' ').trim();
    if (v && v !== st.name) { pushHistory(); st.name = v; markDirty('stages', st.id); scheduleSave(); renderStageModal(); renderAll(); }
    else if (!v) { inp.value = st.name; }
    else { renderStageModal(); }   // 名字没变也重绘，去掉编辑态
  }
  function setupStageModal() {
    if (stageAddBtn) stageAddBtn.addEventListener('click', function () {
      var v = stageNewInput ? stageNewInput.value : '';
      if (addStage(v)) { if (stageNewInput) { stageNewInput.value = ''; stageNewInput.focus(); } }
    });
    if (stageNewInput) stageNewInput.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); stageAddBtn && stageAddBtn.click(); } });
    if (stageModalClose) stageModalClose.addEventListener('click', function () { toggleStageModal(false); });
    if (stageModal) stageModal.addEventListener('click', function (e) { if (e.target === stageModal) toggleStageModal(false); });
  }

  // 组装全部事件绑定（进度分章）
  function setupStageInsight() {
    setupStageModal();
    if (stageBtn) stageBtn.addEventListener('click', function () { toggleStageModal(); });
  }

  // 首次上手引导：从未写过任何便签 + 没看过 → 出现一次；看过即存标记不再打扰
  var TOUR_KEY = 'herlens_notes_tour_v1';
  function maybeShowTour() {
    try {
      if (localStorage.getItem(TOUR_KEY) === '1') return;
      // 只要曾写过便签（任一画板）就不再当"首次"弹
      var everWrote = (store.boards || []).some(function (b) { return (b.notes && b.notes.length) > 0; });
      if (everWrote) { localStorage.setItem(TOUR_KEY, '1'); return; }
      var tour = document.getElementById('nbTour');
      if (!tour) return;
      setTimeout(function () {
        tour.classList.add('show'); tour.setAttribute('aria-hidden', 'false');
      }, 600);
      var done = function () {
        tour.classList.remove('show'); tour.setAttribute('aria-hidden', 'true');
        try { localStorage.setItem(TOUR_KEY, '1'); } catch (_) {}
      };
      var c = document.getElementById('nbTourClose'), s = document.getElementById('nbTourSkip');
      if (c) c.addEventListener('click', done);
      if (s) s.addEventListener('click', done);
      tour.addEventListener('click', function (e) { if (e.target === tour) done(); });
    } catch (e) {}
  }

  // ---------- 初始化 ----------
  function init() {
    load();
    loadDirty();   // 恢复上次未同步的增量记账（刷新/关页后续传，避免改动丢在本地）
    applyBg();
    buildFloatbar();
    buildBoardUI();
    renderBoardPanel();
    renderDiaryLib();
    updateUsage();
    updateGameBanner();
    applyCam();
    renderAll();
    enterMode();   // 进入当前画板的专属模式（模板板会显示对应模式工具条 / 连线层 / 日期带）
    enhanceInit(); // Toast / 确认弹窗 / 搜索 / 撤销重做 / 小地图 / 外观 / 快捷键
    setupStageInsight(); // 进度分章（给便签归类到章节）
    maybeShowTour();     // 首次上手引导（从未写过便签时出现一次，可跳过）

    // 深链：URL hash 控制默认打开的浮层 / 面板（方便分享或截图回归）
    try {
      var h = (location.hash || '').replace(/^#/, '');
      if (h) {
        if (h === 'panel' && boardToggle) toggleBoardPanel(true);
        else if (h === 'diary' && diaryBtn) toggleDiary(true);
        else if (h === 'help' && helpBtn) toggleHelp(true);
        else if (h === 'bpop' && typeof openBoardPopover === 'function') setTimeout(openBoardPopover, 50);
        else if (/^sel.+$/.test(h)) {
          // 选中指定便签（按 id 全等、按 title/body 子串、或按序号 selN 选中第 N 张）
          var target = decodeURIComponent(h.slice(3));
          var n = null;
          if (/^sel\d+$/.test(h)) { n = board.notes[parseInt(target, 10) - 1]; }
          if (!n) n = board.notes.find(function (x) { return x.id === target || (x.title && x.title.indexOf(target) >= 0) || (x.body && x.body.indexOf(target) >= 0); });
          if (n) { setTimeout(function () { selectNote(n.id); }, 30); }
        }
      }
    } catch (e) {}

    // 初次进入若空白，给个友好的初始位置
    if (!board.notes.length && board.cam.x === 0 && board.cam.y === 0) {
      board.cam.x = viewport.clientWidth / 2; board.cam.y = viewport.clientHeight / 2; applyCam();
    }
    window.addEventListener('resize', positionFloatbar);
    // 选区变化（拖动选择文字 / 移动光标）时同步字号读数
    document.addEventListener('selectionchange', function () {
      if (floatbar && floatbar.classList.contains('show')) scheduleSyncFontSize();
    });

    // P1 / P2 事件绑定
    if (selModeBtn) selModeBtn.addEventListener('click', function () { toggleSelMode(); });
    if (cbCluster) cbCluster.addEventListener('click', function () {
      var def = '主题簇' + ((board.clusters && board.clusters.length || 0) + 1);
      promptDialog('给这个主题簇起个名字', def, function (v) { createCluster(v || undefined); });
    });
    if (cbClear) cbClear.addEventListener('click', function () { setSelection([]); });
    if (diaryBtn) diaryBtn.addEventListener('click', function () {
      editingDiaryId = null;                       // 重新生成一篇新的
      if (diarySave) diarySave.textContent = '保存到日记库';
      toggleDiary(true);
    });
    if (diarySave) diarySave.addEventListener('click', saveDiary);
    if (diaryClose) diaryClose.addEventListener('click', function () { toggleDiary(false); });
    if (diaryDownload) diaryDownload.addEventListener('click', function () {
      if (!currentDiaryImg) { showAlert('还没生成好', '图片正在生成，请稍候再点下载。', '知道了', null, false); return; }
      var a = document.createElement('a');
      a.download = (board.gameTitle || '游戏') + '_游戏日记.png';
      a.href = currentDiaryImg; a.click();
    });
    if (diaryCopy) diaryCopy.addEventListener('click', function () {
      if (!currentDiaryImg) { showAlert('还没生成好', '图片正在生成，请稍候再点复制。', '知道了', null, false); return; }
      copyImageToClipboard(currentDiaryImg, diaryCopy);
    });

    // 数据安全：备份导出 / 导入
    if (exportBtn) exportBtn.addEventListener('click', exportBackup);
    if (importBtn && importInput) {
      importBtn.addEventListener('click', function () { importInput.click(); });
      importInput.addEventListener('change', function () {
        var f = importInput.files && importInput.files[0]; importInput.value = '';
        if (f) importBackup(f);
      });
    }
    if (compressBtn) compressBtn.addEventListener('click', compressAllImages);

    // 云端同步
    if (syncNowBtn) syncNowBtn.addEventListener('click', function () {
      if (!cloudOn) { showAlert('需要登录', '云端同步要在主站登录后才能使用。', '知道了', null, false); return; }
      syncNow().then(function (ok) {
        showAlert(ok ? '已同步' : '同步失败', ok ? '改动已保存到云端。' : '改动已安全保存在本机，稍后会自动重试。', '好的', null, false);
      });
    });
    if (uploadAllBtn) uploadAllBtn.addEventListener('click', uploadAll);
    if (cloudChip) cloudChip.addEventListener('click', function () { toggleBoardPanel(true); });
    cloudBoot();
    // 切到后台 / 关页面前补一次同步，避免刚写完就走人
    document.addEventListener('visibilitychange', function () { if (document.hidden) syncNow(); });
  }
  init();

  /* ============ 手机端「爽用档」UI（仅 ≤680px 生效，不影响 iPad/PC） ============
     init() 已把所有顶部按钮的事件绑好。这里不改动那些按钮的 DOM，而是把它们的
     图标「克隆」进底部「更多」抽屉；点克隆项 = 触发原按钮 .click()，事件依旧走原逻辑，
     因此无重复绑定、无 resize 搬移开销，桌面端完全不受影响。 */
  (function initMobileUI() {
    var mq = window.matchMedia('(max-width: 680px)');
    var backdrop = document.getElementById('nbMoreBackdrop');
    var sheet = document.getElementById('nbMoreSheet');
    var grid = document.getElementById('nbMoreGrid');
    var closeBtn = document.getElementById('nbMoreClose');
    var launchers = [document.getElementById('nbMoreBtn'), document.getElementById('nbMoreToolBtn')].filter(Boolean);
    var built = false;

    // 抽屉里展示哪些顶栏/低频动作（顺序即展示顺序）。key=按钮 id；若找不到则自动跳过。
    var ACTIONS = [
      { run: function () { openCmdPalette(); }, label: '命令面板', ico: '⌘' },
      { run: function () { openReview(); }, label: '记录回顾', ico: '🌱' },
      { id: 'searchBtn', label: '搜索' },
      { id: 'undoBtn', label: '撤销' },
      { id: 'redoBtn', label: '重做' },
      { id: 'stageBtn', label: '进度分章' },
      { id: 'diaryBtn', label: '游戏日记' },
      { id: 'bgBtn', label: '背景' },
      { id: 'fitBtn', label: '适应内容' },
      { id: 'helpBtn', label: '帮助' },
      { id: 'cloudChip', label: '云端' }
    ];

    function openMore() {
      if (!built) buildGrid();
      if (backdrop) backdrop.classList.add('show');
      if (sheet) sheet.classList.add('show');
    }
    function closeMore() {
      if (backdrop) backdrop.classList.remove('show');
      if (sheet) sheet.classList.remove('show');
    }
    function toggleMore() {
      if (sheet && sheet.classList.contains('show')) closeMore(); else openMore();
    }

    function buildGrid() {
      built = true;
      if (!grid) return;
      grid.innerHTML = '';
      ACTIONS.forEach(function (a) {
        var src = a.id ? document.getElementById(a.id) : null;
        if (a.id && !src) return;
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'nb-more-act';
        b.setAttribute('title', a.label);
        // 图标：克隆原按钮里的 svg；命令面板这类无源按钮直接给字符图标
        var icon = src && src.querySelector('svg');
        if (icon) {
          var ic = document.createElement('span');
          ic.className = 'nb-more-ico';
          ic.appendChild(icon.cloneNode(true));
          b.appendChild(ic);
        } else {
          var dot = document.createElement('span');
          dot.className = 'nb-more-ico nb-more-dot';
          dot.textContent = a.ico || '•';
          b.appendChild(dot);
        }
        var lab = document.createElement('span');
        lab.className = 'nb-more-lab';
        lab.textContent = a.label;
        b.appendChild(lab);
        b.addEventListener('click', function (e) {
          e.stopPropagation();
          closeMore();
          try { if (a.run) a.run(); else src.click(); } catch (_) {}
        });
        grid.appendChild(b);
      });
    }

    function applyPhone() {
      var phone = mq.matches;
      launchers.forEach(function (b) { if (b) b.style.display = phone ? '' : 'none'; });
      if (!phone) closeMore();
    }

    if (backdrop) backdrop.addEventListener('click', closeMore);
    if (closeBtn) closeBtn.addEventListener('click', function (e) { e.stopPropagation(); closeMore(); });
    launchers.forEach(function (b) { if (b) b.addEventListener('click', function (e) { e.stopPropagation(); toggleMore(); }); });
    // 抽屉内容点击不冒泡关掉
    if (sheet) sheet.addEventListener('click', function (e) { e.stopPropagation(); });

    applyPhone();
    if (mq.addEventListener) mq.addEventListener('change', applyPhone);
    else if (mq.addListener) mq.addListener(applyPhone);
    window.addEventListener('resize', function () { if (!mq.matches) closeMore(); });

    /* 手机端「点便签直接进编辑」：桌面是单击选中 + 双击编辑；
       手机统一为：点击便签即进入编辑（自动聚焦第一个 contenteditable）。
       不拦截 grip/resize/img 点击，保留既有拖拽/缩放/图片交互。 */
    document.addEventListener('click', function (e) {
      if (!mq.matches) return;
      var t = e.target;
      if (!t || !t.closest || !t.closest('.nb-note')) return;
      if (t.closest('.nb-resize')) return;
      if (t.closest('.nb-grip')) return;
      if (t.classList && t.classList.contains('nb-img')) return;
      var noteEl = t.closest('.nb-note');
      if (!noteEl) return;
      var ed = noteEl.querySelector('[contenteditable="true"]');
      if (! ed) return;
      // 如果点击目标本身就是 editable，那浏览器已经/将要自然聚焦；其它区域则显式聚焦一次
      if (e.target !== ed && !ed.contains(e.target)) {
        try { ed.focus({ preventScroll: true }); } catch (_) { try { ed.focus(); } catch (__) {} }
      }
    }, true);
  })();
})();

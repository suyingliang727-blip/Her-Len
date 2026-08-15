        (function () {
            'use strict';

            // ================================================================
            // 配置与状态
            // ================================================================
            const SUPABASE_URL = 'https://tydbvpmigvzsnlmsjuby.supabase.co';
            const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5ZGJ2cG1pZ3Z6c25sbXNqdWJ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE3MjkwMTIsImV4cCI6MjA5NzMwNTAxMn0.AyMX8M24S3biHmmE2DMEPk9Ti93w0VHooQl5ox5YL2g';
            const SUPABASE_ENABLED = SUPABASE_URL.includes('supabase.co') && SUPABASE_ANON_KEY.length > 10;
            const DEFAULT_GENRE_OPTIONS = ['丧尸', '悬疑/推理', '恐怖/生存恐怖', '乙女/女性向', '后末日', '百合', '权谋', '魔法', '偶像/娱乐圈',
                '日常/生活', '校园', '职场', '战争/军事', '犯罪/黑帮', '体育', '艺术/音乐', '烹饪', '动物', '童话/寓言', '神话', '机械生物',
                '蒸汽朋克', '赛博朋克', '奇幻', '古代', '现代', '黑暗', '超现实', '自然环境', '民间传说', '寻宝', '西幻', '科幻', '宗教',
                '和风', '复仇', '侠盗', '心理', '狩猎', '惊悚', '中世纪', '医疗模拟', '历史', '钓鱼', '西部', '心理恐怖', '唯美', '克苏鲁',
                '治愈', '氛围', '古希腊', '喜剧', '洛夫克拉夫特式', '密室逃脱', '探险', '黑色幽默', '公路', 'LGBTQ+', '灵异', '机甲',
                '吸血鬼', '青春', '医院', '超英', '反乌托邦', '龙', '手绘风', '经营', '迷幻'
            ];
            const DEFAULT_GAMEPLAY_OPTIONS = ['动作', '角色扮演', '冒险', '生物收集', '射击', '策略', '模拟', '休闲', '解谜', '益智', '格斗',
                '竞速', '音乐/节奏', '视觉小说', '生存', 'Roguelike', '类银河恶魔城', '开放世界', '潜行', '多人联机', '弹幕射击', '选择取向',
                '魂/类魂', '指向点击', '养成', '建造', '种地', '卡牌', '回合制', '走路模拟器', '隐藏物品', '平台', 'VR', '沙盒', '装饰',
                '整理', '砍杀', '塔防', '跑酷', '跳跃', '赛车/驾驶', '探索', '烹饪', '牌组构建', '自走棋', '刷宝', '弹幕', '密室逃脱'
            ];
            const PLATFORM_OPTIONS = ['PC', 'PS', 'Xbox', '移动端', 'NS1', 'NS2', '全平台', 'nds/3ds'];
            const HEROINE_TYPE_OPTIONS = ['固定女主', '可选女主', '动物女主', '双女主', '多主角含女主', '无明确性别默认女'];
            const COSTUME_TYPE_OPTIONS = ['服设合理', '服设不合理', '含恶俗设计', '服设可自选'];
            const PERSPECTIVE_OPTIONS = ['第一人称', '第三人称', '可切换人称', '横版'];
            const CHINESE_OPTIONS = ['有中文', '无中文'];
            const DEMO_OPTIONS = ['有Demo', '无Demo'];

            const ACHIEVEMENTS = [
                { id: 'first_played', name: '🎯 新手保护期', desc: '标记 1 款游戏为玩过', threshold: 1, icon: '🎯' },
                { id: 'three_played', name: '🌟 全平台等等党', desc: '标记 10 款游戏为玩过', threshold: 10, icon: '🌟' },
                { id: 'six_played', name: '🎮 DLC补完计划', desc: '标记 25 款游戏为玩过', threshold: 25, icon: '🎮' },
                { id: 'ten_played', name: '🏆 全平台买买买战士', desc: '标记 50 款游戏为玩过', threshold: 50, icon: '🏆' },
                { id: 'fifteen_played', name: '👑 Steam喜加一圣骑士', desc: '标记 75 款游戏为玩过', threshold: 75, icon: '👑' },
                { id: 'twenty_played', name: '💎 电子游戏活化石', desc: '标记 100 款游戏为玩过', threshold: 100, icon: '💎' },
            ];

            // ========== 头衔系统定义（60+） ==========
            // 分类：1-评论量型(12)  2-表态行为型(12)  3-社交互动型(12)  4-偏好型(12)
            const TITLES = [
                // ========== 一、评论数量头衔（6）1 / 10 / 50 / 100 / 500 / 1000 ==========
                { id: 'comment_1',    category: '评论数量', name: '初啼',     tier: 'bronze',  icon: '🌱', cond: { type: 'totalReviews', value: 1 },    desc: '发表第 1 条评论' },
                { id: 'comment_10',   category: '评论数量', name: '碎语',     tier: 'bronze',  icon: '💬', cond: { type: 'totalReviews', value: 10 },   desc: '累计 10 条评论' },
                { id: 'comment_50',   category: '评论数量', name: '笔底生花', tier: 'silver',  icon: '📝', cond: { type: 'totalReviews', value: 50 },   desc: '累计 50 条评论' },
                { id: 'comment_100',  category: '评论数量', name: '评席常驻', tier: 'silver',  icon: '📜', cond: { type: 'totalReviews', value: 100 },  desc: '累计 100 条评论' },
                { id: 'comment_500',  category: '评论数量', name: '评述等身', tier: 'gold',    icon: '📚', cond: { type: 'totalReviews', value: 500 },  desc: '累计 500 条评论' },
                { id: 'comment_1000', category: '评论数量', name: '千言共鸣', tier: 'diamond', icon: '👑', cond: { type: 'totalReviews', value: 1000 }, desc: '累计 1000 条评论' },

                // ========== 二、表态专属头衔（5 路线 × 5 = 25）==========
                // 避雷路线 verdict=1：3/10/30/100/300
                { id: 'avoid_3',   category: '表态专属', name: '试毒勇者', tier: 'bronze',  icon: '🛡️', cond: { type: 'verdictCount', verdict: 1, value: 3 },   desc: '3 次强烈避雷' },
                { id: 'avoid_10',  category: '表态专属', name: '破雷先锋', tier: 'bronze',  icon: '⚡', cond: { type: 'verdictCount', verdict: 1, value: 10 },  desc: '10 次强烈避雷' },
                { id: 'avoid_30',  category: '表态专属', name: '辟险明灯', tier: 'silver',  icon: '⚔️', cond: { type: 'verdictCount', verdict: 1, value: 30 },  desc: '30 次强烈避雷' },
                { id: 'avoid_100', category: '表态专属', name: '镇雷统帅', tier: 'gold',    icon: '🗡️', cond: { type: 'verdictCount', verdict: 1, value: 100 }, desc: '100 次强烈避雷' },
                { id: 'avoid_300', category: '表态专属', name: '风暴守望', tier: 'diamond', icon: '🌩️', cond: { type: 'verdictCount', verdict: 1, value: 300 }, desc: '300 次强烈避雷' },
                // 推荐路线 verdict=5：3/10/30/100/300
                { id: 'rec_3',   category: '表态专属', name: '拾光者',   tier: 'bronze',  icon: '🌱', cond: { type: 'verdictCount', verdict: 5, value: 3 },   desc: '3 次大力推荐' },
                { id: 'rec_10',  category: '表态专属', name: '寻珠人',   tier: 'bronze',  icon: '📣', cond: { type: 'verdictCount', verdict: 5, value: 10 },  desc: '10 次大力推荐' },
                { id: 'rec_30',  category: '表态专属', name: '甄光师',   tier: 'silver',  icon: '🎯', cond: { type: 'verdictCount', verdict: 5, value: 30 },  desc: '30 次大力推荐' },
                { id: 'rec_100', category: '表态专属', name: '荟珍师',   tier: 'gold',    icon: '💎', cond: { type: 'verdictCount', verdict: 5, value: 100 }, desc: '100 次大力推荐' },
                { id: 'rec_300', category: '表态专属', name: '星河领航', tier: 'diamond', icon: '👑', cond: { type: 'verdictCount', verdict: 5, value: 300 }, desc: '300 次大力推荐' },
                // 亮点路线 verdict=4：3/10/30/100/300
                { id: 'hl_3',   category: '表态专属', name: '微光拾者', tier: 'bronze',  icon: '✨', cond: { type: 'verdictCount', verdict: 4, value: 3 },   desc: '3 次颇具亮点' },
                { id: 'hl_10',  category: '表态专属', name: '慧眼识光', tier: 'bronze',  icon: '🔍', cond: { type: 'verdictCount', verdict: 4, value: 10 },  desc: '10 次颇具亮点' },
                { id: 'hl_30',  category: '表态专属', name: '亮点鉴赏', tier: 'silver',  icon: '🌟', cond: { type: 'verdictCount', verdict: 4, value: 30 },  desc: '30 次颇具亮点' },
                { id: 'hl_100', category: '表态专属', name: '珠玑捕手', tier: 'gold',    icon: '💫', cond: { type: 'verdictCount', verdict: 4, value: 100 }, desc: '100 次颇具亮点' },
                { id: 'hl_300', category: '表态专属', name: '星辉发掘', tier: 'diamond', icon: '👑', cond: { type: 'verdictCount', verdict: 4, value: 300 }, desc: '300 次颇具亮点' },
                // 中庸路线 verdict=3：3/10/30/100/300
                { id: 'mid_3',   category: '表态专属', name: '初探均衡', tier: 'bronze',  icon: '⚖️', cond: { type: 'verdictCount', verdict: 3, value: 3 },   desc: '3 次中规中矩' },
                { id: 'mid_10',  category: '表态专属', name: '公允之声', tier: 'bronze',  icon: '📏', cond: { type: 'verdictCount', verdict: 3, value: 10 },  desc: '10 次中规中矩' },
                { id: 'mid_30',  category: '表态专属', name: '客观丈量', tier: 'silver',  icon: '🎯', cond: { type: 'verdictCount', verdict: 3, value: 30 },  desc: '30 次中规中矩' },
                { id: 'mid_100', category: '表态专属', name: '中道行者', tier: 'gold',    icon: '⚖️', cond: { type: 'verdictCount', verdict: 3, value: 100 }, desc: '100 次中规中矩' },
                { id: 'mid_300', category: '表态专属', name: '平衡之秤', tier: 'diamond', icon: '👑', cond: { type: 'verdictCount', verdict: 3, value: 300 }, desc: '300 次中规中矩' },
                // 谨慎路线 verdict=2：3/10/30/100/300
                { id: 'caut_3',   category: '表态专属', name: '试探前行', tier: 'bronze',  icon: '🧭', cond: { type: 'verdictCount', verdict: 2, value: 3 },   desc: '3 次谨慎选择' },
                { id: 'caut_10',  category: '表态专属', name: '理智天平', tier: 'bronze',  icon: '🔍', cond: { type: 'verdictCount', verdict: 2, value: 10 },  desc: '10 次谨慎选择' },
                { id: 'caut_30',  category: '表态专属', name: '审慎参谋', tier: 'silver',  icon: '📊', cond: { type: 'verdictCount', verdict: 2, value: 30 },  desc: '30 次谨慎选择' },
                { id: 'caut_100', category: '表态专属', name: '慎思明辨', tier: 'gold',    icon: '🧠', cond: { type: 'verdictCount', verdict: 2, value: 100 }, desc: '100 次谨慎选择' },
                { id: 'caut_300', category: '表态专属', name: '洞察之眼', tier: 'diamond', icon: '👁️', cond: { type: 'verdictCount', verdict: 2, value: 300 }, desc: '300 次谨慎选择' },

                // ========== 三、社交互动头衔（6）==========
                { id: 'soc_reply_10',    category: '社交互动', name: '回音使者', tier: 'bronze',  icon: '💬', cond: { type: 'repliesSent', value: 10 },   desc: '发送 10 条回复' },
                { id: 'soc_replied_10',  category: '社交互动', name: '话题播种', tier: 'silver',  icon: '💌', cond: { type: 'repliesReceived', value: 10 }, desc: '评论被回复 10 次' },
                { id: 'soc_reply_50',    category: '社交互动', name: '互动桥梁', tier: 'silver',  icon: '🤝', cond: { type: 'repliesSent', value: 50 },   desc: '发送 50 条回复' },
                { id: 'soc_replied_30',  category: '社交互动', name: '焦点中心', tier: 'gold',    icon: '🌟', cond: { type: 'repliesReceived', value: 30 }, desc: '评论被回复 30 次' },
                { id: 'soc_like_100',    category: '社交互动', name: '共鸣磁场', tier: 'gold',    icon: '🔥', cond: { type: 'totalLikesReceived', value: 100 }, desc: '累计获赞 100 个' },
                { id: 'soc_reply_200',   category: '社交互动', name: '社区之心', tier: 'diamond', icon: '🫂', cond: { type: 'repliesSent', value: 200 },  desc: '发送 200 条回复' },

                // ========== 四、游戏类型头衔（6 类 × 3 = 18）==========
                // 百合题材
                { id: 'type_yuri_5',    category: '游戏类型', name: '初识百合', tier: 'bronze', icon: '🌸', cond: { type: 'genreReviews', genre: '百合', value: 5 },   desc: '5 条百合题材评论' },
                { id: 'type_yuri_20',   category: '游戏类型', name: '百合园丁', tier: 'silver', icon: '💕', cond: { type: 'genreReviews', genre: '百合', value: 20 },  desc: '20 条百合题材评论' },
                { id: 'type_yuri_50',   category: '游戏类型', name: '百合知音', tier: 'gold',   icon: '🐡', cond: { type: 'genreReviews', genre: '百合', value: 50 },  desc: '50 条百合题材评论' },
                // 动作玩法
                { id: 'type_action_5',  category: '游戏类型', name: '初执利刃', tier: 'bronze', icon: '⚔️', cond: { type: 'gameplayReviews', gameplay: '动作', value: 5 },   desc: '5 条动作玩法评论' },
                { id: 'type_action_20', category: '游戏类型', name: '动作好手', tier: 'silver', icon: '🔥', cond: { type: 'gameplayReviews', gameplay: '动作', value: 20 },  desc: '20 条动作玩法评论' },
                { id: 'type_action_50', category: '游戏类型', name: '武技宗师', tier: 'gold',   icon: '💪', cond: { type: 'gameplayReviews', gameplay: '动作', value: 50 },  desc: '50 条动作玩法评论' },
                // 角色扮演玩法
                { id: 'type_rpg_5',     category: '游戏类型', name: '初入角色', tier: 'bronze', icon: '🎭', cond: { type: 'gameplayReviews', gameplay: '角色扮演', value: 5 },  desc: '5 条角色扮演评论' },
                { id: 'type_rpg_20',    category: '游戏类型', name: '幻境旅人', tier: 'silver', icon: '📖', cond: { type: 'gameplayReviews', gameplay: '角色扮演', value: 20 }, desc: '20 条角色扮演评论' },
                { id: 'type_rpg_50',    category: '游戏类型', name: '幻境编织', tier: 'gold',   icon: '🧙', cond: { type: 'gameplayReviews', gameplay: '角色扮演', value: 50 }, desc: '50 条角色扮演评论' },
                // 心理恐怖题材
                { id: 'type_horror_5',  category: '游戏类型', name: '勇闯心渊', tier: 'bronze', icon: '🧠', cond: { type: 'genreReviews', genre: '心理恐怖', value: 5 },   desc: '5 条心理恐怖评论' },
                { id: 'type_horror_20', category: '游戏类型', name: '深渊漫步', tier: 'silver', icon: '👁️', cond: { type: 'genreReviews', genre: '心理恐怖', value: 20 },  desc: '20 条心理恐怖评论' },
                { id: 'type_horror_50', category: '游戏类型', name: '深渊凝视', tier: 'gold',   icon: '🖤', cond: { type: 'genreReviews', genre: '心理恐怖', value: 50 },  desc: '50 条心理恐怖评论' },
                // 选择取向玩法
                { id: 'type_choice_5',  category: '游戏类型', name: '初临岔路', tier: 'bronze', icon: '🔀', cond: { type: 'gameplayReviews', gameplay: '选择取向', value: 5 },  desc: '5 条选择取向评论' },
                { id: 'type_choice_20', category: '游戏类型', name: '命运探索', tier: 'silver', icon: '🛤️', cond: { type: 'gameplayReviews', gameplay: '选择取向', value: 20 }, desc: '20 条选择取向评论' },
                { id: 'type_choice_50', category: '游戏类型', name: '命运编织', tier: 'gold',   icon: '🎲', cond: { type: 'gameplayReviews', gameplay: '选择取向', value: 50 }, desc: '50 条选择取向评论' },
                // 视觉小说玩法
                { id: 'type_vn_5',      category: '游戏类型', name: '初翻书页', tier: 'bronze', icon: '📖', cond: { type: 'gameplayReviews', gameplay: '视觉小说', value: 5 },  desc: '5 条视觉小说评论' },
                { id: 'type_vn_20',     category: '游戏类型', name: '文本漫步', tier: 'silver', icon: '📚', cond: { type: 'gameplayReviews', gameplay: '视觉小说', value: 20 }, desc: '20 条视觉小说评论' },
                { id: 'type_vn_50',     category: '游戏类型', name: '叙事收藏', tier: 'gold',   icon: '✍️', cond: { type: 'gameplayReviews', gameplay: '视觉小说', value: 50 }, desc: '50 条视觉小说评论' },

                // ========== 五、特殊成就头衔（5）==========
                { id: 'sp_long_comment',   category: '特殊成就', name: '字斟句酌', tier: 'bronze', icon: '🗨️', cond: { type: 'maxCommentLength', value: 200 }, desc: '单条评论达 200 字上限' },
                { id: 'sp_all_verdicts',   category: '特殊成就', name: '五味品鉴', tier: 'silver', icon: '🌈', cond: { type: 'allVerdictsUsed' },              desc: '使用过全部 5 种表态' },
                { id: 'sp_single_like_10', category: '特殊成就', name: '人心所向', tier: 'silver', icon: '❤️', cond: { type: 'singleReviewMaxLikes', value: 10 }, desc: '单条评论获 10 赞' },
                { id: 'sp_tags_50',        category: '特殊成就', name: '标签收藏家', tier: 'silver', icon: '🏷️', cond: { type: 'totalTagsUsed', value: 50 },       desc: '累计使用 50 个评价标签' },
                { id: 'sp_single_like_50', category: '特殊成就', name: '众星捧月', tier: 'gold',   icon: '🔥', cond: { type: 'singleReviewMaxLikes', value: 50 }, desc: '单条评论获 50 赞' },
            ];

            let customGenres = [];
            let customGameplays = [];
            let supabaseClient = null;
            if (SUPABASE_ENABLED && typeof supabase !== 'undefined') {
                try {
                    supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
                        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
                        realtime: { params: { eventsPerSecond: 2 } },
                        global: {
                            // 为所有请求注入超时，避免 Supabase 不可达时请求无限挂起
                            // 分页每页 1000 条 20+ 字段 payload 较大，30s 兼顾慢网络与容错
                            fetch: (url, opts = {}) => {
                                const timeoutMs = 30000;
                                const timeoutErr = new DOMException(`请求超时 (>${timeoutMs / 1000}s)`, 'AbortError');
                                const timeoutController = new AbortController();
                                const timeoutId = setTimeout(() => timeoutController.abort(timeoutErr), timeoutMs);
                                let finalSignal = timeoutController.signal;
                                // 如果上游已经传了 signal，合并两个 signal（任意一个触发都会取消）
                                if (opts && opts.signal) {
                                    const upstream = opts.signal;
                                    if (upstream.aborted) {
                                        clearTimeout(timeoutId);
                                        return fetch(url, opts);
                                    }
                                    if (typeof AbortSignal.any === 'function') {
                                        finalSignal = AbortSignal.any([upstream, timeoutController.signal]);
                                    } else {
                                        const combo = new AbortController();
                                        const onUpstream = () => combo.abort(upstream.reason);
                                        const onTimeout = () => combo.abort(timeoutErr);
                                        upstream.addEventListener('abort', onUpstream, { once: true });
                                        timeoutController.signal.addEventListener('abort', onTimeout, { once: true });
                                        finalSignal = combo.signal;
                                    }
                                }
                                const merged = Object.assign({}, opts, { signal: finalSignal });
                                return fetch(url, merged).finally(() => clearTimeout(timeoutId));
                            }
                        }
                    });
                } catch (e) { supabaseClient = null; }
                // 后台静默迁移本地回复数据到云端（仅执行一次）；延迟执行，避免与首屏数据加载竞争网络
                setTimeout(() => migrateLocalRepliesToCloud().catch(e => console.warn('[Migration] 异常:', e)), 3000);
            }

            let games = [];
            let activeFilters = {};
            let activeFilterCat = null;
            let currentTheme = 'light';
            let currentView = 'released';
            let currentSort = 'default';
            let searchQuery = '';
            let wishlistMode = false;
            let excludePlayedMode = false;
            let showAdultContent = false;
            let excludedTags = { genre: [], gameplay: [], platforms: [], heroineType: [], costumeType: [], perspective: [] };
            let blockOpenDims = new Set(['genre']);
            let blockSearchQuery = '';
            let userData = { wishlist: [], played: [], achievements: [], reviews: [], titles: [], equippedTitle: null };
            let searchTimeout = null;
            let cardObserver = null;
            let card3DListeners = [];
            let isTouchDevice = false;

            let currentUser = null;
            let isAdmin = false;
            let isAdminMode = false;
            let editingGameId = null;
            const ADMIN_USER_ID = 'a7be3d14-7228-4f25-bf4e-00ff67a8894d';
            let currentAvatarFile = null;
            let avatarPreviewUrl = null;
            let _dropdownCloseHandler = null;

            // 缓存相关
            let _ratingStatsCache = {};
            let _reviewPage = {};
            const REVIEW_PAGE_SIZE = 10;
            let _batchRpcBroken = false;
            // ★ 评论回复分页：每条评论默认只渲染前 REPLY_CHUNK 个根回复，超出显示"加载更多"
            const REPLY_CHUNK = 3;
            // ★ 记录每条评论当前已展开的根回复数：{ [reviewId]: number }
            let _replyReveal = {};
            // ★ 评论区 Realtime 订阅状态
            let _commentRealtimeListener = null;
            let _commentRtDebounce = null;
            // ★ 评论列表短期缓存：避免短时间内重复打开同一游戏详情页时重复拉取
            //   结构：{ [gameId]: { ts, reviews, repliesMap, stats } }，TTL 2分钟
            let _reviewsListCache = {};
            const REVIEWS_LIST_CACHE_TTL = 120000; // 2分钟
            let _ratingBatchTimer = null;
            let _ratingBatchPending = [];

            // 分享相关
            let shareQRInstance = null;

            if (('ontouchstart' in window) || (navigator.maxTouchPoints > 0)) {
                isTouchDevice = true;
            }

            // ================================================================
            // 安全初始化
            // ================================================================
            (function initSecurity() {
                // 防止点击劫持
                if (window.self !== window.top) {
                    document.body.innerHTML = '<div style="text-align:center;padding:50px;font-family:sans-serif;"><h1>安全提示</h1><p>该页面不允许在iframe中显示。</p></div>';
                    throw new Error('iframe clickjacking blocked');
                }

                // 防止覆盖关键函数
                const originalAlert = window.alert;
                const originalConfirm = window.confirm;
                const originalPrompt = window.prompt;
                Object.defineProperty(window, 'alert', {
                    value: originalAlert,
                    writable: false,
                    configurable: false
                });
                Object.defineProperty(window, 'confirm', {
                    value: originalConfirm,
                    writable: false,
                    configurable: false
                });
                Object.defineProperty(window, 'prompt', {
                    value: originalPrompt,
                    writable: false,
                    configurable: false
                });

                // 清除URL中的危险参数
                try {
                    const url = new URL(window.location.href);
                    const dangerousParams = ['javascript', 'data', 'vbscript'];
                    let hasDangerous = false;
                    url.searchParams.forEach(function (value) {
                        if (dangerousParams.some(function (p) { return String(value).toLowerCase().includes(p); })) {
                            hasDangerous = true;
                        }
                    });
                    if (hasDangerous) {
                        window.history.replaceState({}, document.title, url.pathname);
                    }
                } catch (e) { }

                // 防止localStorage被恶意脚本读取
                const originalGetItem = Storage.prototype.getItem;
                Storage.prototype.getItem = function (key) {
                    if (typeof key !== 'string') return null;
                    return originalGetItem.call(this, key);
                };
            })();

            // ================================================================
            // 工具函数
            // ================================================================
            function escapeHTML(s) {
                if (!s) return '';
                return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/`/g, '&#96;');
            }

            // ========== 头衔系统工具函数 ==========
            function renderTitleBadge(title, opts) {
                opts = opts || {};
                if (!title) return '';
                const sizeClass = opts.small ? ' style="font-size:0.62rem;padding:1px 6px;"' : '';
                const iconSize = opts.small ? ' style="font-size:0.66rem;"' : '';
                return `<span class="title-badge ${escapeHTML(title.tier)}" title="${escapeHTML(title.desc || title.name)}"${sizeClass}>` +
                    `<span class="badge-icon"${iconSize}>${escapeHTML(title.icon || '🎖️')}</span>` +
                    `<span class="badge-text">${escapeHTML(title.name)}</span>` +
                    `</span>`;
            }

            function getUserTitles(userId) {
                // 返回指定用户的头衔列表，兼容从 userData 或 comment author 读取
                if (!userId) return { unlocked: [], equipped: null };
                // 当前登录用户自己
                if (currentUser && currentUser.id === userId) {
                    const unlocked = (userData.titles || []).map(id => TITLES.find(t => t.id === id)).filter(Boolean);
                    const equipped = TITLES.find(t => t.id === userData.equippedTitle);
                    return { unlocked, equipped };
                }
                return { unlocked: [], equipped: null };
            }

            function equipTitle(titleId) {
                if (!currentUser) { showToast('请先登录', 1200); return; }
                // 如果传 null，表示取消佩戴
                if (titleId === null) {
                    userData.equippedTitle = null;
                    saveUserData();
                    refreshTitleDisplays();
                    syncTitlesAndAchievementsToMetadata({ debounceMs: 100, silent: true });
                    return;
                }
                const title = TITLES.find(t => t.id === titleId);
                if (!title) { showToast('头衔不存在', 1000); return; }
                if (!(userData.titles || []).includes(titleId)) {
                    showToast('该头衔尚未解锁，继续加油吧～', 1600);
                    return;
                }
                userData.equippedTitle = titleId;
                saveUserData();
                refreshTitleDisplays();
                syncTitlesAndAchievementsToMetadata({ debounceMs: 100, silent: true });
            }

            function refreshTitleDisplays() {
                // 刷新下拉菜单和评论渲染（通过重新渲染评论列表触发）
                if (currentUser && typeof updateUIForLoggedIn === 'function') {
                    try { updateUIForLoggedIn(currentUser); } catch (e) {}
                }
                const activeMod = document.getElementById('detailModalOverlay');
                if (activeMod && activeMod.classList.contains('show')) {
                    const gid = activeMod.getAttribute('data-game-id');
                    if (gid && typeof loadCommunityReviews === 'function') loadCommunityReviews(Number(gid));
                }
                // 若成就弹窗已打开且在头衔 tab，则实时刷新头衔展示柜（佩戴立即看得到）
                const achvMod = document.getElementById('achievementModalOverlay');
                if (achvMod && achvMod.classList.contains('show')) {
                    const titlesBtn = document.querySelector('.achievement-tab-btn[data-tab="titles"]');
                    if (titlesBtn && titlesBtn.classList.contains('active')) {
                        try { renderTitlesCabinet(); } catch (e) {}
                    }
                }
            }

            // 计算解锁条件所需的统计数据
            function _buildTitleStats() {
                const stats = {
                    totalReviews: 0,
                    // 表态计数（key=1~5，设计稿中 1=避雷 2=谨慎 3=中庸 4=亮点 5=推荐）
                    verdictCounts: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
                    verdictsUsed: new Set(),
                    // 社交：本地可统计字段
                    repliesSent: 0,
                    repliesReceived: 0,
                    totalLikesReceived: 0,
                    singleReviewMaxLikes: 0,
                    totalTagsUsed: 0,
                    maxCommentLength: 0,
                    // 基于评论 JOIN 游戏类型的计数
                    genreReviews: {},
                    gameplayReviews: {}
                };

                const gameMap = {};
                (games || []).forEach(g => { gameMap[g.id] = g; });

                (userData.reviews || []).forEach(r => {
                    stats.totalReviews++;
                    // 表态计数：verdict 为数字 1-5
                    const v = Number(r.verdict);
                    if (v >= 1 && v <= 5) {
                        stats.verdictCounts[v] = (stats.verdictCounts[v] || 0) + 1;
                        stats.verdictsUsed.add(v);
                    }
                    // 点赞
                    const likes = typeof r.likes === 'number' ? r.likes : 0;
                    stats.totalLikesReceived += likes;
                    if (likes > stats.singleReviewMaxLikes) stats.singleReviewMaxLikes = likes;
                    // 标签
                    if (Array.isArray(r.selected_tags)) stats.totalTagsUsed += r.selected_tags.length;
                    // 评论文本最长字数
                    const text = r.content ? stripCommentHTML(r.content) : '';
                    if (text.length > stats.maxCommentLength) stats.maxCommentLength = text.length;
                    // 游戏类型计数（基于评论关联的游戏 genre / gameplay）
                    const game = r.game_id ? gameMap[r.game_id] : null;
                    if (game) {
                        (game.genre || []).forEach(gr => {
                            stats.genreReviews[gr] = (stats.genreReviews[gr] || 0) + 1;
                        });
                        (game.gameplay || []).forEach(gp => {
                            stats.gameplayReviews[gp] = (stats.gameplayReviews[gp] || 0) + 1;
                        });
                    }
                });

                // 【兼容】repliesSent / repliesReceived：如果后续接入 comment_replies / review_replies
                // 表本地缓存，可在这里填充。当前默认 0，避免误判解锁。
                return stats;
            }

            function checkTitleUnlocks() {
                if (!currentUser) return [];
                const stats = _buildTitleStats();
                const prev = new Set(userData.titles || []);
                const newlyUnlocked = [];

                TITLES.forEach(t => {
                    if (prev.has(t.id)) return;
                    const c = t.cond;
                    let ok = false;
                    try {
                        switch (c.type) {
                            case 'totalReviews':
                                ok = stats.totalReviews >= c.value;
                                break;
                            case 'verdictCount':
                                ok = (stats.verdictCounts[c.verdict] || 0) >= c.value;
                                break;
                            case 'repliesSent':
                                ok = stats.repliesSent >= c.value;
                                break;
                            case 'repliesReceived':
                                ok = stats.repliesReceived >= c.value;
                                break;
                            case 'totalLikesReceived':
                                ok = stats.totalLikesReceived >= c.value;
                                break;
                            case 'maxCommentLength':
                                ok = stats.maxCommentLength >= c.value;
                                break;
                            case 'singleReviewMaxLikes':
                                ok = stats.singleReviewMaxLikes >= c.value;
                                break;
                            case 'totalTagsUsed':
                                ok = stats.totalTagsUsed >= c.value;
                                break;
                            case 'allVerdictsUsed':
                                // 5 种表态全部使用过
                                ok = stats.verdictsUsed.size >= 5 && stats.totalReviews >= 5;
                                break;
                            case 'genreReviews':
                                // 兼容模糊匹配：游戏题材字段名有差异时优先精确，否则 substring
                                let gExact = stats.genreReviews[c.genre] || 0;
                                if (gExact === 0) {
                                    for (const grKey of Object.keys(stats.genreReviews)) {
                                        if (grKey && String(grKey).includes(String(c.genre))) gExact += stats.genreReviews[grKey];
                                    }
                                }
                                ok = gExact >= c.value;
                                break;
                            case 'gameplayReviews':
                                let gpExact = stats.gameplayReviews[c.gameplay] || 0;
                                if (gpExact === 0) {
                                    for (const gpKey of Object.keys(stats.gameplayReviews)) {
                                        if (gpKey && String(gpKey).includes(String(c.gameplay))) gpExact += stats.gameplayReviews[gpKey];
                                    }
                                }
                                ok = gpExact >= c.value;
                                break;
                            default:
                                ok = false;
                        }
                    } catch (e) { ok = false; }
                    if (ok) {
                        userData.titles = userData.titles || [];
                        userData.titles.push(t.id);
                        newlyUnlocked.push(t);
                    }
                });

                if (newlyUnlocked.length > 0) {
                    saveUserData();
                    newlyUnlocked.forEach((t, i) => setTimeout(() => showTitleToast(t), i * 900));
                    if (!userData.equippedTitle) {
                        const diamond = newlyUnlocked.find(t => t.tier === 'diamond');
                        const gold = newlyUnlocked.find(t => t.tier === 'gold');
                        const silver = newlyUnlocked.find(t => t.tier === 'silver');
                        const best = diamond || gold || silver || newlyUnlocked[0];
                        if (best) equipTitle(best.id);
                    } else {
                        syncTitlesAndAchievementsToMetadata({ silent: true });
                    }
                }
                return newlyUnlocked;
            }

            function showTitleToast(title) {
                let toast = document.getElementById('toast-notification');
                if (!toast) {
                    toast = document.createElement('div');
                    toast.id = 'toast-notification';
                    toast.className = 'toast-notification';
                    document.body.appendChild(toast);
                }
                toast.className = 'toast-notification title-toast show';
                toast.innerHTML =
                    `<div style="text-align:center;">` +
                    `<span class="toast-title-icon">🎖️</span>` +
                    `<div style="font-size:0.92rem;font-weight:700;margin-bottom:4px;">解锁新头衔</div>` +
                    `<div class="toast-title-badge">${renderTitleBadge(title)}</div>` +
                    `<div class="toast-title-subtitle">${escapeHTML(title.desc || '')}</div>` +
                    `</div>`;
                clearTimeout(toast._timer);
                toast._timer = setTimeout(() => { toast.classList.remove('show'); }, 2800);
            }

            function sanitizeCommentHTML(html) {
                if (!html) return '';
                const div = document.createElement('div');
                div.innerHTML = html;
                const allowed = ['B', 'U', 'S', 'FONT', 'DIV'];
                (function walk(node) {
                    [...node.childNodes].forEach(child => {
                        if (child.nodeType === 1) {
                            if (!allowed.includes(child.tagName)) {
                                node.replaceChild(document.createTextNode(child.textContent), child);
                            } else {
                                [...child.attributes].forEach(attr => {
                                    if (child.tagName === 'FONT' && attr.name === 'size') return;
                                    if (child.tagName === 'DIV' && attr.name === 'style' && /^text-align\s*:\s*(left|center|right|justify)\s*;?$/i.test(attr.value.trim())) return;
                                    child.removeAttribute(attr.name);
                                });
                                walk(child);
                            }
                        }
                    });
                })(div);
                return div.innerHTML;
            }

            function stripCommentHTML(html) {
                if (!html) return '';
                const div = document.createElement('div');
                div.innerHTML = html;
                div.querySelectorAll('div').forEach(d => {
                    d.insertAdjacentText('beforebegin', '\n');
                });
                return div.textContent || '';
            }

            // 解析 [spoiler]...[/spoiler] 标记，生成可点击展开的剧透遮挡（Steam风格）
            function renderCommentWithSpoilers(text) {
                if (!text) return '';
                // 先 escapeHTML 防止 XSS
                const escaped = escapeHTML(text);
                // 解析 [spoiler]...[/spoiler] 标记（大小写不敏感）
                return escaped.replace(/\[spoiler\]([\s\S]*?)\[\/spoiler\]/gi, function (match, content) {
                    return `<span class="comment-spoiler" tabindex="0" role="button" aria-label="剧透内容，点击查看">${content}</span>`;
                });
            }

            // 在 textarea 中包裹选中文字为 [spoiler]...[/spoiler]
            function wrapSelectionWithSpoiler(textarea) {
                if (!textarea) return;
                const start = textarea.selectionStart;
                const end = textarea.selectionEnd;
                const selected = textarea.value.substring(start, end);
                const before = textarea.value.substring(0, start);
                const after = textarea.value.substring(end);
                const spoilerText = selected || '剧透内容';
                const wrapped = `[spoiler]${spoilerText}[/spoiler]`;
                textarea.value = before + wrapped + after;
                // 选中包裹后的内容（方便用户直接替换）
                const newStart = start + 9; // [spoiler] 的长度
                const newEnd = newStart + spoilerText.length;
                textarea.setSelectionRange(newStart, newEnd);
                textarea.focus();
                // 触发 input 事件更新字数统计
                textarea.dispatchEvent(new Event('input'));
            }

            // URL转义 - 只转义HTML实体，不转义URL特殊字符
            function escapeURL(s) {
                if (!s) return '';
                return String(s).replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            }

            // 验证URL是否安全
            function isValidURL(url) {
                if (!url) return false;
                try {
                    const parsed = new URL(url);
                    const allowedProtocols = ['http:', 'https:', 'mailto:', 'tel:'];
                    return allowedProtocols.includes(parsed.protocol);
                } catch (e) {
                    return false;
                }
            }

            // 验证是否为javascript:协议攻击
            function isDangerousURL(url) {
                if (!url) return true;
                const trimmed = url.trim().toLowerCase();
                return /^javascript\s*:/i.test(trimmed) || /^data\s*:/i.test(trimmed) || /^vbscript\s*:/i.test(trimmed);
            }

            // 清理用户输入（去除危险字符）
            function sanitizeInput(input) {
                if (!input) return '';
                return String(input)
                    .replace(/[<>]/g, '')
                    .replace(/['"]/g, '')
                    .replace(/javascript:/gi, '')
                    .replace(/data:/gi, '')
                    .trim();
            }

            // 限制输入长度
            function truncateInput(input, maxLength) {
                if (!input) return '';
                return String(input).slice(0, maxLength);
            }

            // ================================================================
            // 自定义标签
            // ================================================================
            async function loadCustomTagsFromStorage() {
                const defaultFallbackGenres = ['太空', '乐高'];
                const defaultFallbackGameplays = ['自定义角色', '调查', '打字'];
                let fallbackGenres = [...defaultFallbackGenres];
                let fallbackGameplays = [...defaultFallbackGameplays];
                try {
                    const s = localStorage.getItem('heroineCustomTags');
                    if (s) {
                        const d = JSON.parse(s);
                        if (d.genres && Array.isArray(d.genres) && d.genres.length) fallbackGenres = d.genres;
                        if (d.gameplays && Array.isArray(d.gameplays) && d.gameplays.length) fallbackGameplays = d.gameplays;
                    }
                } catch (_) { }

                // 立即使用本地缓存/默认值（不阻塞初始化）
                customGenres = fallbackGenres.length > 0 ? fallbackGenres : defaultFallbackGenres;
                customGameplays = fallbackGameplays.length > 0 ? fallbackGameplays : defaultFallbackGameplays;
                try {
                    if (!localStorage.getItem('heroineCustomTags')) {
                        localStorage.setItem('heroineCustomTags', JSON.stringify({
                            genres: customGenres,
                            gameplays: customGameplays
                        }));
                    }
                } catch (_) { }

                // 后台静默从云端刷新，完成后刷新筛选 UI
                if (supabaseClient) {
                    refreshCustomTagsFromCloud().catch(e => console.warn('⚠️ 自定义标签云端刷新失败', e.message || e));
                }
            }

            async function refreshCustomTagsFromCloud() {
                const isRetryable = (e) => {
                    if (!e) return false;
                    if (e.name === 'AbortError') return true;
                    const msg = String(e.message || e).toLowerCase();
                    return msg.includes('network') || msg.includes('connection') || msg.includes('closed')
                        || msg.includes('timeout') || msg.includes('econn') || msg.includes('fetch')
                        || msg.includes('abort');
                };
                const doFetch = async () => {
                    const { data, error } = await supabaseClient
                        .from('games')
                        .select('id, genre, gameplay')
                        .in('id', [1, 2]);
                    if (error) throw error;
                    if (!data || !Array.isArray(data)) throw new Error('返回数据格式异常');
                    return data;
                };
                try {
                    let data;
                    try {
                        data = await doFetch();
                    } catch (e1) {
                        if (!isRetryable(e1)) {
                            console.warn('⚠️ 从数据库读取自定义标签失败（不可重试），使用缓存数据', e1?.message || e1);
                            return;
                        }
                        console.warn('⚠️ 首次读取自定义标签失败，800ms 后重试：', e1?.message || e1);
                        await new Promise(r => setTimeout(r, 800));
                        try {
                            data = await doFetch();
                        } catch (e2) {
                            console.warn('⚠️ 从数据库读取自定义标签失败（已重试），使用缓存数据', e2?.message || e2);
                            return;
                        }
                    }
                    let changed = false;
                    const genreRecord = data.find(r => r.id === 1);
                    const gameplayRecord = data.find(r => r.id === 2);
                    if (genreRecord && genreRecord.genre && Array.isArray(genreRecord.genre) && genreRecord.genre.length > 0) {
                        customGenres = genreRecord.genre; changed = true;
                    } else {
                        console.warn('⚠️ 自定义题材标签记录(id=1)缺失或格式异常，使用缓存/默认值');
                    }
                    if (gameplayRecord && gameplayRecord.gameplay && Array.isArray(gameplayRecord.gameplay) && gameplayRecord.gameplay.length > 0) {
                        customGameplays = gameplayRecord.gameplay; changed = true;
                    } else {
                        console.warn('⚠️ 自定义玩法标签记录(id=2)缺失或格式异常，使用缓存/默认值');
                    }
                    try {
                        localStorage.setItem('heroineCustomTags', JSON.stringify({
                            genres: customGenres,
                            gameplays: customGameplays
                        }));
                    } catch (_) { }
                    console.log('✅ 自定义标签已从数据库同步');
                    if (changed && typeof updateFilterUI === 'function') {
                        updateFilterUI();
                    }
                } catch (e) {
                    console.warn('⚠️ 数据库读取异常，使用缓存数据', e);
                }
            }

            function getAllGenres() { return [...new Set([...DEFAULT_GENRE_OPTIONS, ...customGenres])]; }

            function getAllGameplays() { return [...new Set([...DEFAULT_GAMEPLAY_OPTIONS, ...customGameplays])]; }

            function saveCustomTagsToStorage() {
                customGenres = customGenres.filter(tag => !DEFAULT_GENRE_OPTIONS.includes(tag));
                customGameplays = customGameplays.filter(tag => !DEFAULT_GAMEPLAY_OPTIONS.includes(tag));
                customGenres = [...new Set(customGenres)];
                customGameplays = [...new Set(customGameplays)];
                localStorage.setItem('heroineCustomTags', JSON.stringify({ genres: customGenres, gameplays: customGameplays }));
                if (supabaseClient) {
                    Promise.all([
                        supabaseClient.from('games').upsert({ id: 1, title: '__custom_genres__', genre: customGenres, isReleased: true }, { onConflict: 'id' }),
                        supabaseClient.from('games').upsert({ id: 2, title: '__custom_gameplays__', gameplay: customGameplays, isReleased: true }, { onConflict: 'id' })
                    ]).catch(() => { });
                }
            }

            // ================================================================
            // 用户数据
            // ================================================================
            const USER_DATA_KEY = 'heroineUserData';

            function loadUserData() {
                try {
                    const raw = localStorage.getItem(USER_DATA_KEY);
                    if (raw) {
                        const parsed = JSON.parse(raw);
                        userData.wishlist = (parsed.wishlist || []).map(id => Math.round(Number(id))).filter(id => Number.isInteger(id) && id > 0);
                        userData.played = (parsed.played || []).map(id => Math.round(Number(id))).filter(id => Number.isInteger(id) && id > 0);
                        userData.achievements = parsed.achievements || [];
                        userData.reviews = (parsed.reviews || []).map(r => ({
                            ...r,
                            game_id: Math.round(Number(r.game_id))
                        }));
                        userData.titles = parsed.titles || [];
                        userData.equippedTitle = parsed.equippedTitle || null;
                    } else { userData = { wishlist: [], played: [], achievements: [], reviews: [], titles: [], equippedTitle: null }; }
                } catch (_) { userData = { wishlist: [], played: [], achievements: [], reviews: [], titles: [], equippedTitle: null }; }
            }

            let _saveUserDataTimer = null;
            function saveUserData() {
                if (_saveUserDataTimer) clearTimeout(_saveUserDataTimer);
                _saveUserDataTimer = setTimeout(function () {
                    _saveUserDataTimer = null;
                    localStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));
                    updateAchievementDot();
                }, 30);
            }

            // ================================================================
            // 云端操作
            // ================================================================
            let _pendingCloudOps = [];

            function _processPendingCloudOps() {
                if (!currentUser || !supabaseClient) return;
                const ops = _pendingCloudOps.splice(0);
                let hasMetadataSync = false;
                ops.forEach(op => {
                    if (op.type === 'push') pushToCloud(op.table, op.gameId);
                    else if (op.type === 'delete') deleteFromCloud(op.table, op.gameId);
                    else if (op.type === 'syncMetadata') hasMetadataSync = true;
                });
                if (hasMetadataSync) syncTitlesAndAchievementsToMetadata({ silent: true, debounceMs: 200 });
            }

            async function deleteFromCloud(table, gameId) {
                if (!currentUser || !supabaseClient) {
                    _pendingCloudOps.push({ type: 'delete', table, gameId });
                    return;
                }
                const gameIdNum = Number(gameId);
                if (!Number.isInteger(gameIdNum) || gameIdNum <= 0) return;
                try {
                    const { error } = await supabaseClient
                        .from(table)
                        .delete()
                        .eq('user_id', currentUser.id)
                        .eq('game_id', gameIdNum);
                    if (error) {
                        console.error(`❌ 云端删除失败 [${table}]:`, error);
                        showToast('⚠️ 删除失败，请检查网络', 2000);
                    } else {
                        console.log(`✅ 云端删除成功 [${table}] game_id: ${gameIdNum}`);
                    }
                } catch (e) {
                    console.error('❌ 云端删除异常:', e);
                }
            }

            async function pushToCloud(table, gameId) {
                if (!currentUser || !supabaseClient) {
                    _pendingCloudOps.push({ type: 'push', table, gameId });
                    return;
                }
                const gameIdNum = Number(gameId);
                if (!Number.isInteger(gameIdNum) || gameIdNum <= 0) return;
                try {
                    const { error } = await supabaseClient.from(table).insert({ user_id: currentUser.id, game_id: gameIdNum });
                    if (error) {
                        if (error.code === '23505') { console.log(`📌 ${table} 已存在 (game_id: ${gameIdNum})，跳过`); return; }
                        // 外键约束：可能是 games 表 RLS 导致 FK check 不可见，跳过本次同步但保留本地数据
                        if (error.code === '23503' && typeof error.message === 'string' && error.message.includes('foreign key constraint')) {
                            console.warn(`⚠️ 跳过同步：game_id ${gameIdNum} 在 FK 校验中不可见（可能被 games 表 RLS 屏蔽），保留本地数据`);
                            return;
                        }
                        console.error(`❌ 云端写入失败 [${table}]:`, error);
                        showToast('⚠️ 数据未同步到云端，请检查网络', 2000);
                        setSyncStatus('error', '未同步');
                    } else {
                        console.log(`✅ 云端写入成功 [${table}] game_id: ${gameIdNum}`);
                        if (document.getElementById('syncStatus').classList.contains('error')) {
                            setSyncStatus('synced', '已同步');
                        }
                    }
                } catch (e) {
                    console.error('❌ 云端写入异常:', e);
                }
            }

            // ========== 头衔 + 成就：统一同步到 auth.user_metadata ==========
            let _titlesSyncTimer = null;
            function syncTitlesAndAchievementsToMetadata(opts) {
                opts = opts || {};
                if (!currentUser || !supabaseClient) {
                    _pendingCloudOps.push({ type: 'syncMetadata' });
                    return Promise.resolve();
                }
                // 防抖：避免连续解锁多个头衔时频繁调用
                return new Promise(resolve => {
                    clearTimeout(_titlesSyncTimer);
                    _titlesSyncTimer = setTimeout(async () => {
                        try {
                            const titles = Array.from(new Set(userData.titles || [])).filter(Boolean);
                            const achievements = Array.from(new Set(userData.achievements || [])).filter(Boolean);
                            const equipped_title = userData.equippedTitle || null;
                            const { error } = await supabaseClient.auth.updateUser({
                                data: { titles, achievements, equipped_title }
                            });
                            if (error) {
                                console.error('❌ 头衔/成就同步到 metadata 失败:', error);
                                if (!opts.silent) showToast('⚠️ 成就/头衔未同步到云端，请检查网络', 2000);
                            } else {
                                // 同步成功后刷新内存中的 currentUser.user_metadata 引用
                                if (currentUser && currentUser.user_metadata) {
                                    currentUser.user_metadata.titles = titles;
                                    currentUser.user_metadata.achievements = achievements;
                                    currentUser.user_metadata.equipped_title = equipped_title;
                                }
                                console.log(`✅ 头衔/成就同步完成：${titles.length} 个头衔，${achievements.length} 个成就，佩戴=${equipped_title || '无'}`);
                            }
                        } catch (e) {
                            console.error('❌ 头衔/成就同步异常:', e);
                        }
                        resolve();
                    }, opts.debounceMs != null ? opts.debounceMs : 400);
                });
            }

            function mergeTitlesAndAchievementsFromMetadata() {
                // 从云端 user_metadata 读取 titles / achievements / equipped_title，与本地取并集合并
                if (!currentUser || !currentUser.user_metadata) return false;
                const meta = currentUser.user_metadata;
                let changed = false;

                const cloudTitles = Array.isArray(meta.titles) ? meta.titles.filter(t => typeof t === 'string') : [];
                const localTitles = Array.isArray(userData.titles) ? userData.titles : [];
                const mergedTitles = Array.from(new Set([...localTitles, ...cloudTitles])).filter(Boolean);
                if (mergedTitles.length !== localTitles.length || mergedTitles.some((t, i) => t !== localTitles[i])) {
                    userData.titles = mergedTitles;
                    changed = true;
                }

                const cloudAchs = Array.isArray(meta.achievements) ? meta.achievements.filter(a => typeof a === 'string') : [];
                const localAchs = Array.isArray(userData.achievements) ? userData.achievements : [];
                const mergedAchs = Array.from(new Set([...localAchs, ...cloudAchs])).filter(Boolean);
                if (mergedAchs.length !== localAchs.length || mergedAchs.some((a, i) => a !== localAchs[i])) {
                    userData.achievements = mergedAchs;
                    changed = true;
                }

                // equipped_title：本地优先（用户当前设备主动选择的佩戴 > 云端上次同步值）
                // —— 只有当本地为空时才采用云端，避免 merge 在 UI 刷新时把用户刚佩戴的选择覆盖掉
                if (!userData.equippedTitle && meta.equipped_title) {
                    userData.equippedTitle = meta.equipped_title;
                    changed = true;
                }

                return changed;
            }

            // ================================================================
            // 愿望单与玩过
            // ================================================================

            // 功能栏 / 占位图标使用 inline SVG，便于精确控制宽高（替代 emoji 渲染不一致问题）
            const SVG_ICONS = {
                heartFilled: '<svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor" aria-hidden="true"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>',
                heartOutline: '<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>',
                checkFilled: '<svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor" aria-hidden="true"><path d="M9 16.17L4.83 12l-1.41 1.41L9 19 21 7l-1.41-1.41z"/></svg>',
                squareOutline: '<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="3"/></svg>',
                gamepad: '<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 12h4M8 10v4"/><circle cx="15.5" cy="11.5" r="0.6" fill="currentColor" stroke="none"/><circle cx="17.5" cy="13.5" r="0.6" fill="currentColor" stroke="none"/><rect x="2" y="6" width="20" height="12" rx="4"/></svg>'
            };

            function toggleWishlist(gameId) {
                const id = Number(gameId);
                if (!Number.isInteger(id) || id <= 0) return console.error('无效 ID:', gameId);
                const idx = userData.wishlist.indexOf(id);
                if (idx >= 0) {
                    userData.wishlist.splice(idx, 1);
                    deleteFromCloud('user_wishlist', id);
                } else {
                    userData.wishlist.push(id);
                    pushToCloud('user_wishlist', id);
                }
                saveUserData();
                if (wishlistMode) {
                    renderGallery();
                } else {
                    updateCardButtonState(id);
                }
            }

            function togglePlayed(gameId) {
                const id = Number(gameId);
                if (!Number.isInteger(id) || id <= 0) return console.error('无效 ID:', gameId);
                const idx = userData.played.indexOf(id);
                if (idx >= 0) {
                    userData.played.splice(idx, 1);
                    deleteFromCloud('user_played', id);
                } else {
                    userData.played.push(id);
                    checkAchievements();
                    setTimeout(() => { try { checkTitleUnlocks(); } catch (e) {} }, 50);
                    pushToCloud('user_played', id);
                }
                saveUserData();
                updateCardButtonState(id);
            }

            function isInWishlist(gameId) { return userData.wishlist.includes(Number(gameId)); }

            function isPlayed(gameId) { return userData.played.includes(Number(gameId)); }

            function updateCardButtonState(gameId) {
                let card = _cardMap.get(Number(gameId));
                // 系列视图等未注册到 _cardMap 的卡片，回退到 DOM 查询
                if (!card) {
                    card = document.querySelector(`.gallery-card[data-game-id="${Number(gameId)}"]`);
                }
                if (!card) return;
                const wishBtn = card.querySelector('.action-wish');
                const playBtn = card.querySelector('.action-play');
                if (wishBtn) {
                    const inW = isInWishlist(gameId);
                    wishBtn.className = 'action-btn action-wish' + (inW ? ' active-wish' : '');
                    wishBtn.innerHTML = `<span class="icon">${inW ? SVG_ICONS.heartFilled : SVG_ICONS.heartOutline}</span><span class="action-label">${inW ? '已加入' : '加入愿望单'}</span>`;
                }
                if (playBtn) {
                    const inP = isPlayed(gameId);
                    playBtn.className = 'action-btn action-play' + (inP ? ' active-played' : '');
                    playBtn.innerHTML = `<span class="icon">${inP ? SVG_ICONS.checkFilled : SVG_ICONS.squareOutline}</span><span class="action-label">${inP ? '已玩过' : '标记玩过'}</span>`;
                }
            }

            // ================================================================
            // 成就系统
            // ================================================================
            function checkAchievements() {
                const playedCount = userData.played.length;
                let newUnlocked = [];
                ACHIEVEMENTS.forEach(ach => {
                    if (playedCount >= ach.threshold && !userData.achievements.includes(ach.id)) {
                        userData.achievements.push(ach.id);
                        newUnlocked.push(ach);
                    }
                });
                if (newUnlocked.length > 0) {
                    saveUserData();
                    newUnlocked.forEach(ach => showAchievementToast(ach));
                    syncTitlesAndAchievementsToMetadata({ silent: true });
                } else { saveUserData(); }
                updateAchievementDot();
            }

            function getUnlockedAchievements() { return ACHIEVEMENTS.filter(a => userData.achievements.includes(a.id)); }

            function getLockedAchievements() { return ACHIEVEMENTS.filter(a => !userData.achievements.includes(a.id)); }

            function getAchievementProgress() {
                const total = ACHIEVEMENTS.length;
                const unlocked = userData.achievements.length;
                return { total, unlocked, percent: total > 0 ? (unlocked / total) * 100 : 0 };
            }

            function updateAchievementDot() {
                const dot = document.getElementById('achievementDot');
                if (!dot) return;
                const locked = getLockedAchievements();
                const playedCount = userData.played.length;
                const hasAvailable = locked.some(a => playedCount >= a.threshold);
                dot.style.display = (hasAvailable && locked.length > 0) ? 'inline-block' : 'none';
            }

            function showAchievementToast(ach) {
                const existing = document.querySelector('.toast-notification');
                if (existing) existing.remove();
                const toast = document.createElement('div');
                toast.className = 'toast-notification achievement-toast';
                toast.innerHTML = `🎉 成就解锁：${ach.icon} <strong>${ach.name}</strong> — ${ach.desc}`;
                document.body.appendChild(toast);
                requestAnimationFrame(() => { toast.classList.add('show'); });
                celebrate();
                setTimeout(() => {
                    toast.classList.remove('show');
                    setTimeout(() => toast.remove(), 500);
                }, 4000);
            }

            // ================================================================
            // 成就弹窗
            // ================================================================
            function renderAchievementModal() {
                const container = document.getElementById('achievementContent');
                if (!container) return;
                const unlocked = getUnlockedAchievements();
                const locked = getLockedAchievements();
                const progress = getAchievementProgress();
                const playedCount = userData.played.length;
                let html =
                    `<div class="achievement-progress"><div class="progress-text">已解锁 <strong>${unlocked.length}</strong> / ${ACHIEVEMENTS.length} 项成就（已标记 <strong>${playedCount}</strong> 款游戏为玩过）</div><div class="progress-bar"><div class="fill" style="width:${progress.percent}%;"></div></div></div><div class="achievement-list">`;
                unlocked.forEach(ach => {
                    html +=
                        `<div class="achievement-item unlocked"><div class="ach-icon">${ach.icon}</div><div class="ach-info"><div class="ach-name">${ach.name}</div><div class="ach-desc">${ach.desc}</div></div><div class="ach-status unlocked">✅ 已解锁</div></div>`;
                });
                locked.forEach(ach => {
                    const isReachable = playedCount >= ach.threshold;
                    html +=
                        `<div class="achievement-item"><div class="ach-icon">${ach.icon}</div><div class="ach-info"><div class="ach-name" style="${isReachable ? 'color:var(--gold);' : ''}">${ach.name}</div><div class="ach-desc">${ach.desc}</div></div><div class="ach-status locked">${isReachable ? '🔓 可解锁' : '🔒 未解锁'}</div></div>`;
                });
                html += `</div>`;
                container.innerHTML = html;
                renderPlayedGrid();
            }

            function renderPlayedGrid() {
                const container = document.getElementById('playedContent');
                if (!container) return;
                const playedIds = userData.played || [];
                const playedGames = playedIds.map(id => games.find(g => g.id === id)).filter(g => g !== undefined);
                if (playedGames.length === 0) {
                    container.innerHTML =
                        `<div class="played-grid-empty"><span class="empty-icon">📭</span>还没有标记任何游戏，快去体验吧！</div>`;
                    return;
                }
                let gridHtml =
                    `<div class="played-grid-header">🎮 我的游戏足迹 · 共 ${playedGames.length} 款</div><div class="played-grid">`;
                playedGames.forEach(game => {
                    const coverHtml = game.cover ?
                        `<img class="item-cover" src="${escapeHTML(game.cover)}" alt="${escapeHTML(game.title)}" loading="lazy" referrerpolicy="no-referrer" />` :
                        `<div class="item-cover-placeholder">${SVG_ICONS.gamepad}</div>`;
                    gridHtml +=
                        `<div class="played-grid-item" data-game-id="${game.id}">${coverHtml}<div class="item-title">${escapeHTML(game.title)}</div></div>`;
                });
                gridHtml += `</div><div class="played-footer">Her-Lens</div>`;
                container.innerHTML = gridHtml;
                container.querySelectorAll('.played-grid-item').forEach(item => {
                    item.addEventListener('click', function () {
                        const id = Number(this.dataset.gameId);
                        if (!isNaN(id)) {
                            const game = games.find(g => g.id === id);
                            if (game) {
                                window._detailFrom = 'played';
                                const modal = document.querySelector('#achievementModalOverlay .modal');
                                if (modal) window._playedScrollPos = modal.scrollTop;
                                closeAchievementModal();
                                setTimeout(() => showDetailModal(game, { from: 'played' }), 100);
                            }
                        }
                    });
                });
            }

            function renderTitlesCabinet() {
                const container = document.getElementById('titlesContent');
                if (!container) return;
                // 先刷新头衔解锁情况（但不弹 Toast，避免打开弹窗被打断）
                const _prevToast = window.showTitleToast;
                try {
                    // 临时禁用 Toast，仅静默更新解锁列表
                    window.showTitleToast = function () {};
                    checkTitleUnlocks();
                } finally {
                    window.showTitleToast = _prevToast;
                }

                const unlockedIds = new Set(userData.titles || []);
                const equippedId = userData.equippedTitle;
                const unlockedCount = unlockedIds.size;
                const totalCount = TITLES.length;

                // 按分类分组
                const categories = {};
                TITLES.forEach(t => {
                    if (!categories[t.category]) categories[t.category] = [];
                    categories[t.category].push(t);
                });

                let html = '';
                // 顶部：当前佩戴 + 进度
                const equippedTitle = equippedId ? TITLES.find(t => t.id === equippedId) : null;
                html += `<div style="margin-bottom:14px;">`;
                if (equippedTitle) {
                    html += `<div class="profile-equipped-label">✨ 当前佩戴的头衔</div>`;
                    html += `<div class="profile-header-titles">${renderTitleBadge(equippedTitle)}</div>`;
                } else {
                    html += `<div class="profile-equipped-label" style="margin-bottom:8px;">尚未佩戴任何头衔（点击下方已解锁的头衔即可佩戴）</div>`;
                }
                html += `</div>`;
                html += `<div class="title-cabinet-section" style="margin-top:0;padding-top:0;border-top:none;">
                    <div class="title-cabinet-header">
                        <div class="title-cabinet-title">🎖️ 头衔展示柜</div>
                        <div class="title-cabinet-progress">已解锁 ${unlockedCount} / ${totalCount}</div>
                    </div>
                </div>`;

                // 稀有度配色说明
                const tierLegend = [
                    { t: 'bronze', n: '青铜', c: 'linear-gradient(135deg,#a08068,#c0a488)' },
                    { t: 'silver', n: '白银', c: 'linear-gradient(135deg,#828a96,#aab2bc)' },
                    { t: 'gold', n: '黄金', c: 'linear-gradient(135deg,#b89648,#d4b870)' },
                    { t: 'diamond', n: '钻石', c: 'linear-gradient(135deg,#8a82a8,#7ea8a4)' },
                ];
                html += `<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px;">` +
                    tierLegend.map(tl =>
                        `<span style="display:inline-flex;align-items:center;gap:5px;font-size:0.7rem;color:var(--text3);">` +
                        `<span style="display:inline-block;width:14px;height:14px;border-radius:4px;background:${tl.c};"></span>${tl.n}</span>`
                    ).join('') + `</div>`;

                // 按分类渲染展示柜
                Object.keys(categories).forEach(cat => {
                    const list = categories[cat];
                    const catUnlocked = list.filter(t => unlockedIds.has(t.id)).length;
                    html += `<div class="title-category-label">${escapeHTML(cat)} · ${catUnlocked}/${list.length}</div>`;
                    html += `<div class="title-cabinet">`;
                    list.forEach(t => {
                        const isUnlocked = unlockedIds.has(t.id);
                        const isEquipped = equippedId === t.id;
                        const cls = 'cabinet-slot ' + (isUnlocked ? 'unlocked' : 'locked') + (isEquipped ? ' equipped' : '');
                        const equipTag = isEquipped ? `<span class="equip-tag">佩戴中</span>` : '';
                        html += `<div class="${cls}" data-title-id="${escapeHTML(t.id)}" title="${isUnlocked ? (isEquipped ? '点击取消佩戴' : '点击佩戴这个头衔') : '未解锁：' + escapeHTML(t.desc)}">` +
                            equipTag +
                            `<div class="slot-icon">${escapeHTML(t.icon || '🎖️')}</div>` +
                            `<div class="slot-name">${escapeHTML(t.name)}</div>` +
                            `<div class="slot-cond">${isUnlocked ? '<span style="color:var(--accent2);">✓ 已解锁</span>' : escapeHTML(t.desc)}</div>` +
                            `</div>`;
                    });
                    html += `</div>`;
                });

                container.innerHTML = html;

                // ⚠️ 事件委托（只绑定一次）：在 titlesContent 上监听点击，避免每次 re-render 后重绑导致的问题
                if (!container.dataset.delegated) {
                    container.dataset.delegated = '1';
                    container.addEventListener('click', function (e) {
                        const slot = e.target.closest('.cabinet-slot');
                        if (!slot) return;
                        const titleId = slot.dataset.titleId;
                        const title = TITLES.find(t => t.id === titleId);
                        if (!title) { showToast('头衔不存在', 1000); return; }
                        const unlockedIds = new Set(userData.titles || []);
                        const equippedId = userData.equippedTitle;
                        if (!unlockedIds.has(titleId)) { showToast('该头衔尚未解锁，继续加油吧～', 1600); return; }
                        if (equippedId === titleId) {
                            equipTitle(null);
                            showToast('已取消佩戴头衔', 1200);
                        } else {
                            equipTitle(titleId);
                            showToast(`已佩戴头衔「${title.name}」`, 1400);
                        }
                    });
                }
            }

            function openAchievementModal() {
                const overlay = document.getElementById('achievementModalOverlay');
                renderAchievementModal();
                renderTitlesCabinet();
                switchAchievementTab('achievements');
                overlay.classList.add('show');
                document.body.style.overflow = 'hidden';
            }

            function closeAchievementModal() {
                document.getElementById('achievementModalOverlay').classList.remove('show');
                document.body.style.overflow = '';
            }

            function switchAchievementTab(tabId) {
                document.querySelectorAll('.achievement-tab-btn').forEach(btn => {
                    btn.classList.toggle('active', btn.dataset.tab === tabId);
                });
                document.querySelectorAll('.achievement-tab-content').forEach(content => {
                    content.classList.toggle('active', content.id === 'tab' + tabId.charAt(0).toUpperCase() + tabId.slice(1));
                });
                // 切换到头衔页时刷新展示柜
                if (tabId === 'titles') renderTitlesCabinet();
                const modal = document.querySelector('#achievementModalOverlay .modal');
                if (modal) modal.scrollTop = 0;
            }

            // ================================================================
            // 标签词库常量
            // ================================================================
            const REVIEW_TAG_LIBRARY = [{"id":"gameplay","label":"游戏性","pairs":[{"pos":"运行流畅","neg":"Bug频发"},{"pos":"优化出色","neg":"优化稀烂"},{"pos":"操作丝滑","neg":"操作别扭"},{"pos":"战斗过瘾","neg":"战斗枯燥"}]},{"id":"story","label":"故事性","pairs":[{"pos":"文笔扎实","neg":"文笔稀烂"},{"pos":"叙事流畅","neg":"节奏拖沓"},{"pos":"角色出彩","neg":"人设崩塌"}]},{"id":"audiovisual","label":"视听","pairs":[{"pos":"沉浸感强","neg":"氛围空洞"},{"pos":"美术惊艳","neg":"画质拉胯"},{"pos":"音乐动听","neg":"音乐违和"}]},{"id":"female_friendly","label":"女性友好","pairs":[{"pos":"含女量足","neg":"含女量低"},{"pos":"女性视角真实","neg":"女性视角失真"},{"pos":"女性塑造好","neg":"女性塑造差"},{"pos":"情节合理","neg":"含恶俗情节（性暴力/色情内容）"}]},{"id":"general","label":"综合","pairs":[{"pos":"后劲十足","neg":"玩得疲惫"},{"pos":"体验超值","neg":"定价过高"},{"pos":"值得二刷","neg":"货不对板"}]}];

            // 表态档位信息表
            const VERDICT_MAP = {
                1: { emoji: '⚠️', label: '强烈避雷', color: '#d63031' },
                2: { emoji: '⚡', label: '谨慎选择', color: '#e17055' },
                3: { emoji: '⭐', label: '中规中矩', color: '#fdcb6e' },
                4: { emoji: '✨', label: '颇具亮点', color: '#00897b' },
                5: { emoji: '💎', label: '大力推荐', color: '#00cec9' }
            };

            function getVerdictInfo(val) {
                return VERDICT_MAP[val] || null;
            }

            function renderVerdictDisplay(verdict) {
                const info = getVerdictInfo(verdict);
                if (!info) return '<span style="color:var(--text3);font-size:0.85rem;">未评分</span>';
                return `<span class="comment-verdict" style="color:${info.color}">${info.emoji} ${info.label}</span>`;
            }

            function renderVerdictPanelHTML(currentVerdict, currentTags, opts) {
                const showSaveBtn = !(opts && opts.showSaveBtn === false);
                let html = '<div class="verdict-strip">';
                for (let v = 1; v <= 5; v++) {
                    const info = VERDICT_MAP[v];
                    const on = currentVerdict === v ? ' on' : '';
                    html += `<div class="verdict-pill${on}" data-verdict="${v}"><span class="verdict-emoji">${info.emoji}</span>${info.label}</div>`;
                }
                html += '</div>';

                const tagSet = new Set(currentTags || []);
                for (const cat of REVIEW_TAG_LIBRARY) {
                    html += `<div class="tag-dimension-label">${cat.label}</div><div class="tag-pool" data-category="${cat.id}">`;
                    for (const pair of cat.pairs) {
                        const on = tagSet.has(pair.pos) ? ' on' : '';
                        const negOn = tagSet.has(pair.neg) ? ' on' : '';
                        const muted = negOn ? ' muted' : '';
                        html += `<span class="tag-chip pos${on}${muted}" data-tag="${pair.pos}" data-opposite="${pair.neg}">${pair.pos}</span>`;
                    }
                    for (const pair of cat.pairs) {
                        const on = tagSet.has(pair.neg) ? ' on' : '';
                        const posOn = tagSet.has(pair.pos) ? ' on' : '';
                        const muted = posOn ? ' muted' : '';
                        html += `<span class="tag-chip neg${on}${muted}" data-tag="${pair.neg}" data-opposite="${pair.pos}">${pair.neg}</span>`;
                    }
                    html += '</div>';
                }

                if (showSaveBtn) {
                    html += '<div style="font-size:0.75rem;color:var(--text3);margin:4px 0 2px;">💡 标签可选，仅选择评价亦可保存</div>';
                    html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-top:6px;gap:8px;">';
                    html += '<span id="ratingStatus" style="font-size:0.85rem;color:var(--text3);">请先选择评价</span>';
                    html += '<button class="btn btn-sm btn-accent" id="saveRatingBtn" disabled>保存评价</button>';
                    html += '</div>';
                } else {
                    html += '<span id="ratingStatus" style="display:block;font-size:0.85rem;color:var(--text3);margin:4px 0 0;">请先选择评价</span>';
                }

                return html;
            }

            function renderTagsDisplay(tags) {
                if (!tags || tags.length === 0) return '';
                const allPairs = REVIEW_TAG_LIBRARY.flatMap(c => c.pairs);
                const tagInfo = {};
                for (const p of allPairs) { tagInfo[p.pos] = 'pos'; tagInfo[p.neg] = 'neg'; }
                let html = '<div class="tags-display">';
                for (const t of tags) {
                    const polarity = tagInfo[t] || 'pos';
                    html += `<span class="tag-chip ${polarity}">${t}</span>`;
                }
                return html + '</div>';
            }

            function bindTagSelection(container, onChange) {
                container.querySelectorAll('.verdict-pill').forEach(pill => {
                    pill.addEventListener('click', function () {
                        container.querySelectorAll('.verdict-pill').forEach(p => p.classList.remove('on'));
                        this.classList.add('on');
                        if (onChange) onChange('verdict', parseInt(this.dataset.verdict));
                    });
                });

                container.querySelectorAll('.tag-chip').forEach(chip => {
                    chip.addEventListener('click', function () {
                        if (this.classList.contains('muted')) return;

                        const tag = this.dataset.tag;
                        const opposite = this.dataset.opposite;
                        const isOn = this.classList.contains('on');

                        // 切换当前标签
                        this.classList.toggle('on');

                        // 处理对立面：如果当前被选中，对立面变灰
                        const pool = this.closest('.tag-pool');
                        if (pool) {
                            const oppEl = pool.querySelector(`.tag-chip[data-tag="${opposite}"]`);
                            if (oppEl) {
                                if (this.classList.contains('on')) {
                                    oppEl.classList.add('muted');
                                    oppEl.classList.remove('on');
                                } else {
                                    oppEl.classList.remove('muted');
                                }
                            }
                        }

                        if (onChange) onChange('tag');
                    });
                });
            }

            function getSelectedTagsFromPanel(container) {
                const tags = [];
                container.querySelectorAll('.tag-chip.on').forEach(chip => {
                    tags.push(chip.dataset.tag);
                });
                return tags;
            }

            function getSelectedVerdictFromPanel(container) {
                const pill = container.querySelector('.verdict-pill.on');
                return pill ? parseInt(pill.dataset.verdict) : null;
            }

            function getCurrentComment(gameId) {
                const textarea = document.getElementById('commentInput');
                if (textarea && textarea.value && textarea.value.trim()) {
                    return textarea.value.trim();
                }
                const reviewText = document.querySelector(`.review-text[data-game-id="${gameId}"]`);
                if (reviewText) {
                    const text = reviewText.textContent || '';
                    if (text && text !== '点击此处写下你的评论...') {
                        return sanitizeCommentHTML(reviewText.innerHTML).trim();
                    }
                }
                return null;
            }

            function getCurrentVerdictAndTags() {
                const panel = document.getElementById('verdictPanelContainer');
                if (panel) {
                    const v = getSelectedVerdictFromPanel(panel);
                    const tags = getSelectedTagsFromPanel(panel);
                    if (v !== null) return { verdict: v, tags };
                }
                return null;
            }

            function setupVerdictPanelHandlers(container, gameId, existingComment) {
                const updateStatus = () => {
                    const v = getSelectedVerdictFromPanel(container);
                    const tags = getSelectedTagsFromPanel(container);
                    const status = container.querySelector('#ratingStatus');
                    const saveBtn = container.querySelector('#saveRatingBtn');
                    if (v !== null) {
                        const info = VERDICT_MAP[v];
                        const tagCount = tags.length;
                        let text = `已选择：${info.emoji}${info.label}`;
                        if (tagCount > 0) text += ` + ${tagCount}个标签`;
                        if (status) status.textContent = text;
                        if (saveBtn) saveBtn.disabled = false;
                    } else {
                        if (status) status.textContent = '请先选择评价';
                        if (saveBtn) saveBtn.disabled = true;
                    }
                };

                bindTagSelection(container, updateStatus);

                const saveBtn = container.querySelector('#saveRatingBtn');
                if (saveBtn) {
                    saveBtn.addEventListener('click', function () {
                        const v = getSelectedVerdictFromPanel(container);
                        const tags = getSelectedTagsFromPanel(container);
                        if (v === null) { showToast('请先选择评价', 1500); return; }
                        const currentComment = getCurrentComment(gameId) || existingComment;
                        guardSubmitBtn(this, () => saveReview(Number(gameId), v, tags, currentComment), '保存中...');
                    });
                }

                updateStatus();
            }

            // 构建折叠的评分/评论编辑区（默认隐藏，点击按钮展开）
            function buildReviewEditorHTML(gameId, hasVerdict, hasComment) {
                const both = !hasVerdict && !hasComment;
                let editorParts = '';
                if (!hasVerdict) {
                    editorParts += `
                                <div id="verdictPanelContainer" data-game="${gameId}" style="margin-bottom:6px;">
                                    <div style="font-weight:600;margin-bottom:4px;">我的评价：</div>
                                    ${renderVerdictPanelHTML(null, [], { showSaveBtn: both ? false : true })}
                                </div>`;
                }
                if (!hasComment) {
                    const btnLabel = both ? '保存' : '提交评论';
                    const btnId = both ? 'unifiedSaveBtn' : 'submitCommentBtn';
                    editorParts += `
                                <div style="margin-top:6px;">
                                    <div style="display:flex;gap:4px;margin-bottom:3px;">
                                        <button type="button" class="comment-spoiler-btn" id="spoilerBtn" title="选中文字后点击，用剧透遮挡包裹（也可手动输入 [spoiler]...[/spoiler]）">⚠️ 剧透</button>
                                    </div>
                                    <textarea id="commentInput" placeholder="写下你的评价（最多500字）… 选中文字后点「剧透」可标记剧透内容" maxlength="500" class="comment-input"></textarea>
                                    <div style="display:flex;justify-content:space-between;align-items:center;margin-top:4px;">
                                        <span class="comment-char-count"><span id="commentCharCount">0</span>/500</span>
                                        <button class="btn btn-sm btn-accent" id="${btnId}">${btnLabel}</button>
                                    </div>
                                </div>`;
                }
                if (!editorParts) return '';
                let label = '✏️ 我要评价';
                if (hasVerdict && !hasComment) label = '✏️ 写评论';
                else if (!hasVerdict && hasComment) label = '✏️ 我要评分';
                return `
                            <button class="btn btn-sm btn-accent" id="writeReviewBtn" style="padding:2px 10px;">${label}</button>
                            <div id="reviewEditorArea" style="display:none;">${editorParts}</div>`;
            }

            // 绑定“我要评价”展开/收起按钮
            function bindWriteReviewToggle(area) {
                const writeBtn = area.querySelector('#writeReviewBtn');
                const editorArea = area.querySelector('#reviewEditorArea');
                if (writeBtn && editorArea) {
                    writeBtn.dataset.closedLabel = writeBtn.textContent;
                    writeBtn.addEventListener('click', function () {
                        const visible = editorArea.style.display !== 'none';
                        editorArea.style.display = visible ? 'none' : '';
                        this.textContent = visible ? this.dataset.closedLabel : '✏️ 收起';
                        if (!visible) {
                            const ta = editorArea.querySelector('textarea');
                            if (ta) ta.focus();
                        }
                    });
                }
            }

            // 绑定统一保存按钮：同时读取 verdict+tags+comment，一次 saveReview 提交
            function bindUnifiedSaveBtn(root, gameId, fallbackVerdict, fallbackTags) {
                const unifiedBtn = root.querySelector('#unifiedSaveBtn');
                if (!unifiedBtn) return;
                unifiedBtn.addEventListener('click', function () {
                    const commentInput = root.querySelector('#commentInput');
                    const comment = commentInput ? commentInput.value.trim() : '';
                    const verdictPanel = root.querySelector('#verdictPanelContainer');
                    const vt = verdictPanel ? {
                        verdict: getSelectedVerdictFromPanel(verdictPanel),
                        tags: getSelectedTagsFromPanel(verdictPanel)
                    } : null;
                    const verdict = vt && vt.verdict !== null && vt.verdict !== undefined ? vt.verdict : fallbackVerdict;
                    const tags = vt && vt.tags ? vt.tags : fallbackTags;
                    if (verdict === null && !comment) {
                        showToast('请至少选择评价或填写评论', 1500);
                        return;
                    }
                    guardSubmitBtn(this, () => saveReview(Number(gameId), verdict, tags, comment || null), '保存中...');
                });
                const commentInput = root.querySelector('#commentInput');
                if (commentInput) {
                    commentInput.addEventListener('keydown', function (e) {
                        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                            e.preventDefault();
                            unifiedBtn.click();
                        }
                    });
                }
            }

            // ================================================================
            // 评分与评论
            // ================================================================

            async function saveReview(gameId, verdict, selectedTags, comment) {
                if (!currentUser) { showToast('请先登录才能评分和评论', 2000); return; }
                if (verdict === null && !comment) {
                    await deleteReview(gameId);
                    return;
                }
                const existingReview = userData.reviews.find(r => r.game_id === gameId);
                const playHours = existingReview?.play_hours || 0;
                const reviewData = {
                    game_id: Math.round(Number(gameId)),
                    user_id: currentUser.id,
                    verdict: verdict,
                    selected_tags: selectedTags || [],
                    comment: comment || null,
                    play_date: existingReview?.play_date || new Date().toISOString().split('T')[0],
                    play_hours: playHours,
                    display_name: currentUser.user_metadata?.display_name || currentUser.email || '用户',
                    avatar_url: currentUser.user_metadata?.avatar_url || null,
                    custom_id: currentUser.user_metadata?.custom_id || null
                };
                // 保留旧 rating 字段用于回退兼容：若 verdict 有值则折算
                if (verdict !== null) {
                    reviewData.rating = verdict * 2;
                }
                const existingIdx = userData.reviews.findIndex(r => r.game_id === gameId);
                const isNewReview = existingIdx < 0;

                // 先保存到云端，成功后再更新本地状态与 UI，避免云端失败时 UI 误显示"已保存"
                if (supabaseClient) {
                    try {
                        // 优先尝试 upsert（onConflict 去掉空格，避免 PostgREST 解析问题）
                        let upsertOk = false;
                        try {
                            const { error: upErr } = await supabaseClient
                                .from('user_reviews')
                                .upsert(reviewData, { onConflict: 'user_id,game_id' });
                            if (!upErr) { upsertOk = true; }
                            else { throw upErr; }
                        } catch (upE) {
                            // upsert 失败时降级：先查再 insert/update
                            console.warn('upsert 失败，尝试降级 insert/update:', upE?.message || upE);
                            const { data: existRow, error: selErr } = await supabaseClient
                                .from('user_reviews')
                                .select('id')
                                .eq('user_id', currentUser.id)
                                .eq('game_id', reviewData.game_id)
                                .maybeSingle();
                            if (selErr) throw selErr;
                            if (existRow) {
                                const { error: updErr } = await supabaseClient
                                    .from('user_reviews')
                                    .update(reviewData)
                                    .eq('user_id', currentUser.id)
                                    .eq('game_id', reviewData.game_id);
                                if (updErr) throw updErr;
                            } else {
                                const { error: insErr } = await supabaseClient
                                    .from('user_reviews')
                                    .insert(reviewData);
                                if (insErr) throw insErr;
                            }
                            upsertOk = true;
                        }
                        if (!upsertOk) throw new Error('保存失败');
                    } catch (e) {
                        console.error('❌ 保存评论失败:', e);
                        const errMsg = (e && (e.message || e.details || e.hint)) ? (e.message || e.details || e.hint) : '未知错误';
                        showToast('⚠️ 保存失败：' + errMsg, 3000);
                        return false;
                    }
                }

                if (existingIdx >= 0) {
                    userData.reviews[existingIdx] = {
                        ...userData.reviews[existingIdx],
                        verdict: verdict,
                        selected_tags: selectedTags || [],
                        comment: comment || null,
                        updated_at: new Date().toISOString()
                    };
                } else {
                    userData.reviews.push({
                        game_id: Number(gameId),
                        verdict: verdict,
                        selected_tags: selectedTags || [],
                        comment: comment || null,
                        play_date: new Date().toISOString().split('T')[0],
                        play_hours: 0,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    });
                }
                saveUserData();
                // 评论保存后检测头衔解锁
                setTimeout(() => { try { checkTitleUnlocks(); } catch (e) { console.warn('头衔检测异常:', e); } }, 60);

                const detailOverlay = document.getElementById('detailModalOverlay');
                if (detailOverlay && detailOverlay.classList.contains('show')) {
                    const currentGameId = detailOverlay.dataset.gameId;
                    if (currentGameId && Number(currentGameId) === Number(gameId)) {
                        const detailModal = document.getElementById('detailModal');
                        const reviewUserArea = detailModal?.querySelector('.review-user-area');
                        if (reviewUserArea) {
                            const savedReview = userData.reviews.find(r => r.game_id === Number(gameId));
                            const savedVerdict = savedReview?.verdict ?? null;
                            const savedTags = savedReview?.selected_tags ?? [];
                            const savedComment = savedReview?.comment ?? null;

                            let summaryHTML = '';
                            if (savedVerdict !== null) {
                                summaryHTML += `
                                    <div style="margin-bottom:6px;">
                                        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
                                            <span style="font-weight:600;">我的评价：</span>
                                            ${renderVerdictDisplay(savedVerdict)}
                                            <button class="btn btn-sm" id="editRatingBtn" style="padding:2px 10px;">修改</button>
                                        </div>
                                        ${renderTagsDisplay(savedTags)}
                                    </div>`;
                            }
                            if (savedComment) {
                                summaryHTML += `
                                    <div style="margin-top:6px;">
                                        <div style="display:flex;gap:8px;align-items:flex-start;flex-wrap:wrap;">
                                            <span style="font-weight:600;">我的评论：</span>
                                            <span style="flex:1;word-break:break-word;">${stripCommentHTML(savedComment)}</span>
                                            <button class="btn btn-sm" id="editCommentBtn" style="padding:2px 10px;">编辑</button>
                                            <button class="btn btn-sm" id="deleteCommentBtn" style="padding:2px 10px;color:var(--danger);border-color:var(--danger);">删除</button>
                                        </div>
                                    </div>`;
                            }
                            reviewUserArea.innerHTML = summaryHTML + buildReviewEditorHTML(gameId, savedVerdict !== null, !!savedComment);

                            const editRatingBtn = reviewUserArea.querySelector('#editRatingBtn');
                            if (editRatingBtn) {
                                editRatingBtn.addEventListener('click', function () {
                                    const body = this.closest('.review-user-area');
                                    if (!body) return;
                                    const container = document.createElement('div');
                                    container.id = 'verdictPanelContainer';
                                    container.dataset.game = gameId;
                                    container.innerHTML = '<div style="font-weight:600;margin-bottom:4px;">修改评价：</div>' + renderVerdictPanelHTML(savedVerdict, savedTags);
                                    this.closest('div').replaceWith(container);
                                    setupVerdictPanelHandlers(container, gameId, savedComment);
                                });
                            }
                            const verdictContainer = reviewUserArea.querySelector('#verdictPanelContainer');
                            if (verdictContainer) {
                                setupVerdictPanelHandlers(verdictContainer, gameId, savedComment);
                            }
                            bindWriteReviewToggle(reviewUserArea);
                            const newCommentInput = reviewUserArea.querySelector('#commentInput');
                            const newCharCount = reviewUserArea.querySelector('#commentCharCount');
                            if (newCommentInput && newCharCount) {
                                newCommentInput.addEventListener('input', function () {
                                    newCharCount.textContent = this.value.length;
                                });
                            }
                            // 绑定剧透按钮
                            const newSpoilerBtn = reviewUserArea.querySelector('#spoilerBtn');
                            if (newSpoilerBtn && newCommentInput) {
                                newSpoilerBtn.addEventListener('click', function () {
                                    wrapSelectionWithSpoiler(newCommentInput);
                                });
                            }
                            // 绑定统一保存按钮（评价+评论共用时存在），不存在则绑定独立提交评论按钮
                            bindUnifiedSaveBtn(reviewUserArea, gameId, savedVerdict, savedTags);
                            const newSubmitBtn = reviewUserArea.querySelector('#submitCommentBtn');
                            if (newSubmitBtn && newCommentInput && !reviewUserArea.querySelector('#unifiedSaveBtn')) {
                                newSubmitBtn.addEventListener('click', function () {
                                    const text = newCommentInput.value.trim();
                                    if (!text) { showToast('评论内容不能为空', 1500); return; }
                                    const vt = getCurrentVerdictAndTags();
                                    guardSubmitBtn(this, () => saveReview(Number(gameId), vt?.verdict ?? savedVerdict, vt?.tags ?? savedTags, text), '提交中...');
                                });
                                newCommentInput.addEventListener('keydown', function (e) {
                                    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                                        e.preventDefault();
                                        newSubmitBtn.click();
                                    }
                                });
                            }
                            const editCommentBtn = reviewUserArea.querySelector('#editCommentBtn');
                            if (editCommentBtn) {
                                editCommentBtn.addEventListener('click', function () {
                                    const body = this.closest('.review-user-area');
                                    if (!body) return;
                                    const exist = body.querySelector('.comment-edit-area');
                                    if (exist) { exist.remove(); return; }
                                    const ea = document.createElement('div');
                                    ea.className = 'comment-edit-area';
                                    ea.innerHTML = '<div style="margin-bottom:3px;"><button type="button" class="comment-spoiler-btn" title="选中文字后点击，用剧透遮挡包裹">⚠️ 剧透</button></div><textarea maxlength="500">' + stripCommentHTML(savedComment) + '</textarea><div class="comment-edit-actions"><button class="btn btn-sm" id="cancelEditBtn">取消</button><button class="btn btn-sm btn-accent" id="saveEditBtn">保存</button></div>';
                                    body.appendChild(ea);
                                    const ta = ea.querySelector('textarea');
                                    ta.focus();
                                    ta.setSelectionRange(ta.value.length, ta.value.length);
                                    ea.querySelector('#cancelEditBtn').addEventListener('click', function () { ea.remove(); });
                                    ea.querySelector('.comment-spoiler-btn')?.addEventListener('click', function () { wrapSelectionWithSpoiler(ta); });
                                    ea.querySelector('#saveEditBtn').addEventListener('click', function () {
                                        const text = ta.value.trim();
                                        if (!text) { showToast('评论不能为空', 1500); return; }
                                        guardSubmitBtn(this, () => saveReview(Number(gameId), savedVerdict, savedTags, text), '保存中...');
                                    });
                                    ta.addEventListener('keydown', function (e) {
                                        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                                            e.preventDefault();
                                            ea.querySelector('#saveEditBtn').click();
                                        }
                                    });
                                });
                            }
                            const deleteCommentBtn = reviewUserArea.querySelector('#deleteCommentBtn');
                            if (deleteCommentBtn) {
                                deleteCommentBtn.addEventListener('click', function () {
                                    if (confirm('确定要删除这条评论吗？')) {
                                        deleteReview(Number(gameId));
                                    }
                                });
                            }
                        }

                        const commentsList = detailModal.querySelector('#communityCommentsList');
                        if (commentsList && isNewReview && comment) {
                            const tempReview = {
                                avatar_url: currentUser.user_metadata?.avatar_url || null,
                                display_name: currentUser.user_metadata?.display_name || currentUser.email || '用户',
                                verdict: verdict,
                                selected_tags: selectedTags || [],
                                comment: comment,
                                created_at: new Date().toISOString()
                            };
                            const placeholder = commentsList.querySelector('div[style*="text-align:center"]');
                            if (placeholder && placeholder.textContent.includes('暂无评论')) {
                                commentsList.innerHTML = '';
                            }
                            const tempDiv = document.createElement('div');
                            tempDiv.innerHTML = await renderReviewItem(tempReview, gameId);
                            const newEl = tempDiv.firstElementChild;
                            newEl.style.opacity = '0.6';
                            newEl.style.transition = 'opacity 0.5s ease';
                            if (commentsList.firstChild) {
                                commentsList.insertBefore(newEl, commentsList.firstChild);
                            } else {
                                commentsList.appendChild(newEl);
                            }
                            bindReviewShareButtons(newEl);
                            bindGameCommentReplyEvents(newEl);
                            setTimeout(function () { newEl.style.opacity = '1'; }, 50);
                        }
                    }
                }

                // 刷新社区评分与评论列表
                if (supabaseClient) {
                    _ratingStatsCache[String(gameId)] = null;
                    invalidateReviewsListCache(gameId); // ★ 清除评论列表缓存，强制下次拉取最新数据
                    setTimeout(() => { loadCommunityReviews(Number(gameId)); }, 300);
                }
                invalidateReviewCountCache();
                showToast('✅ 评价保存成功', 1500);
                return true;
            }

            async function deleteReview(gameId) {
                if (!currentUser) { showToast('请先登录', 2000); return; }
                userData.reviews = userData.reviews.filter(r => r.game_id !== gameId);
                saveUserData();
                invalidateReviewCountCache();
                invalidateReviewsListCache(gameId); // ★ 清除评论列表缓存
                const detailOverlay = document.getElementById('detailModalOverlay');
                if (detailOverlay && detailOverlay.classList.contains('show')) {
                    const currentGameId = detailOverlay.dataset.gameId;
                    if (currentGameId && Number(currentGameId) === Number(gameId)) {
                        const game = games.find(g => g.id === Number(gameId));
                        if (game) showDetailModal(game);
                    }
                }
                if (!supabaseClient) return;
                try {
                    const { error } = await supabaseClient.from('user_reviews').delete().eq('user_id', currentUser.id).eq(
                        'game_id', Number(gameId));
                    if (error) {
                        console.error('❌ 删除评论失败:', error);
                        showToast('⚠️ 删除失败，请重试', 2000);
                    } else {
                        console.log('✅ 评论删除成功');
                    }
                } catch (e) { console.error('❌ 删除评论异常:', e); }
            }

            async function fetchGameReviews(gameId, page) {
                if (!supabaseClient) return [];
                page = page || 0;
                try {
                    const from = page * REVIEW_PAGE_SIZE;
                    const to = from + REVIEW_PAGE_SIZE - 1;
                    let { data, error } = await supabaseClient.from('user_reviews')
                        .select('id, game_id, user_id, verdict, selected_tags, rating, comment, play_date, play_hours, display_name, avatar_url, custom_id, created_at, updated_at')
                        .eq('game_id', Number(gameId))
                        .order('created_at', { ascending: false }).range(from, to);
                    // custom_id 列不存在时回退（兼容未迁移的数据库）
                    if (error && /custom_id/i.test(error.message || '')) {
                        const fallback = await supabaseClient.from('user_reviews')
                            .select('id, game_id, user_id, verdict, selected_tags, rating, comment, play_date, play_hours, display_name, avatar_url, created_at, updated_at')
                            .eq('game_id', Number(gameId))
                            .order('created_at', { ascending: false }).range(from, to);
                        data = fallback.data;
                        error = fallback.error;
                    }
                    if (error) throw error;

                    // 修复历史评论 custom_id 不同步：
                    // custom_id 功能是后加的，之前保存的评论行 custom_id 为 null → 这里回填
                    if (data && data.length) {
                        // ① 当前登录用户自己的评论：直接从会话拿（不需要查库）
                        const myId = currentUser?.id;
                        const needLookupIds = [];
                        data.forEach(row => {
                            if (!row.custom_id) {
                                if (myId && row.user_id === myId) {
                                    row.custom_id = currentUser.user_metadata?.custom_id || null;
                                } else if (row.user_id) {
                                    needLookupIds.push(row.user_id);
                                }
                            }
                        });
                        // ② 其他历史评论用户：批量查 user_profiles 表拿到 custom_id 后回填
                        if (needLookupIds.length) {
                            const uniqueIds = [...new Set(needLookupIds)];
                            try {
                                const { data: profiles } = await supabaseClient
                                    .from('user_profiles')
                                    .select('id, custom_id')
                                    .in('id', uniqueIds);
                                if (profiles) {
                                    const idToCid = {};
                                    profiles.forEach(p => { if (p.custom_id) idToCid[p.id] = p.custom_id; });
                                    data.forEach(row => {
                                        if (!row.custom_id && row.user_id && idToCid[row.user_id]) {
                                            row.custom_id = idToCid[row.user_id];
                                        }
                                    });
                                }
                            } catch (pfErr) { /* ignore */ }
                        }
                    }

                    return data || [];
                } catch (e) { console.error('❌ 获取评论失败:', e); return []; }
            }

            async function fetchGameRatingStats(gameId) {
                if (!supabaseClient) return { average: null, count: 0 };
                const cacheKey = String(gameId);
                const cached = _ratingStatsCache[cacheKey];
                if (cached && (Date.now() - cached.ts < 1800000)) {
                    return { average: cached.average, count: cached.count };
                }
                try {
                    // ★ 优化：优先使用 batch_rating_stats RPC（聚合查询，只返回1行结果）
                    //   避免拉取所有 verdict/rating 行到客户端再聚合
                    try {
                        const { data: rpcData, error: rpcError } = await supabaseClient
                            .rpc('batch_rating_stats', { game_ids: [Number(gameId)] });
                        if (!rpcError && rpcData && rpcData.length > 0) {
                            const row = rpcData[0];
                            const average = row.rating_count > 0 ? row.rating_sum / row.rating_count : null;
                            _ratingStatsCache[cacheKey] = { average, count: row.rating_count, ts: Date.now() };
                            return { average, count: row.rating_count };
                        }
                    } catch (_) {}

                    // 回退：基于 verdict 计算（保留原逻辑作为兜底）
                    const { data, error } = await supabaseClient.from('user_reviews').select('verdict, rating').eq('game_id', Number(
                        gameId));
                    if (error) throw error;
                    const verdicts = data.map(r => r.verdict).filter(v => v !== null && v !== undefined);
                    const count = verdicts.length;
                    let average = null;
                    if (count > 0) {
                        average = verdicts.reduce((a, b) => a + b, 0) / count;
                    } else {
                        // 回退：使用旧 rating 折算
                        const ratings = data.map(r => r.rating).filter(r => r !== null);
                        if (ratings.length > 0) {
                            const sum = ratings.reduce((a, b) => a + b, 0);
                            const rawAvg = sum / ratings.length;
                            average = Math.round(rawAvg / 2 * 10) / 10; // 折算到 1-5 保留1位小数
                        }
                    }
                    _ratingStatsCache[cacheKey] = { average, count: count || (data.length > 0 ? data.filter(r => r.rating !== null).length : 0), ts: Date.now() };
                    return { average, count: count || (data.length > 0 ? data.filter(r => r.rating !== null).length : 0) };
                } catch (e) { console.error('❌ 获取评分统计失败:', e); return { average: null, count: 0 }; }
            }

            async function fetchBatchRatingStats(gameIds) {
                if (!supabaseClient || !gameIds.length) return {};
                const result = {};
                const needFetch = [];
                const now = Date.now();

                for (const id of gameIds) {
                    const cacheKey = String(id);
                    const cached = _ratingStatsCache[cacheKey];
                    if (cached && (now - cached.ts < 1800000)) {
                        result[id] = { average: cached.average, count: cached.count };
                    } else {
                        needFetch.push(id);
                    }
                }

                if (needFetch.length === 0) return result;

                let batchFetched = false;

                if (!_batchRpcBroken) {
                    try {
                        const { data, error } = await supabaseClient
                            .rpc('batch_rating_stats', { game_ids: needFetch });
                        if (error) throw error;

                        const fetchedMap = {};
                        if (data) {
                            for (const row of data) {
                                fetchedMap[row.game_id] = {
                                    average: row.avg_rating,
                                    count: Number(row.rating_count)
                                };
                            }
                        }

                        for (const id of needFetch) {
                            const stats = fetchedMap[id] || { average: null, count: 0 };
                            _ratingStatsCache[String(id)] = { ...stats, ts: now };
                            result[id] = stats;
                        }
                        batchFetched = true;
                    } catch (e) {
                        _batchRpcBroken = true;
                        console.warn('[Batch] RPC 不可用，后续使用单查询批量拉取');
                    }
                }

                if (!batchFetched) {
                    try {
                        const { data, error } = await supabaseClient
                            .from('user_reviews')
                            .select('game_id, verdict, rating')
                            .in('game_id', needFetch);
                        if (error) throw error;

                        const grouped = {};
                        for (const row of (data || [])) {
                            const gid = row.game_id;
                            if (!grouped[gid]) grouped[gid] = { verdicts: [], ratings: [] };
                            if (row.verdict != null) grouped[gid].verdicts.push(row.verdict);
                            if (row.rating != null) grouped[gid].ratings.push(row.rating);
                        }

                        for (const id of needFetch) {
                            const g = grouped[id] || { verdicts: [], ratings: [] };
                            let count = 0;
                            let average = null;
                            if (g.verdicts.length > 0) {
                                count = g.verdicts.length;
                                average = g.verdicts.reduce((a, b) => a + b, 0) / count;
                            } else if (g.ratings.length > 0) {
                                count = g.ratings.length;
                                average = Math.round(g.ratings.reduce((a, b) => a + b, 0) / count / 2 * 10) / 10;
                            }
                            _ratingStatsCache[String(id)] = { average, count, ts: now };
                            result[id] = { average, count };
                        }
                        batchFetched = true;
                    } catch (e2) {
                        console.warn('[Batch] 单查询失败，回退逐条:', e2.message);
                    }
                }

                if (!batchFetched) {
                    for (const id of needFetch) {
                        result[id] = await fetchGameRatingStats(id);
                    }
                }

                return result;
            }

            function loadCardRatingStats() {
                const els = document.querySelectorAll('.card-rating-count');
                if (!els.length) return;

                const now = Date.now();

                els.forEach(el => {
                    const gameId = Number(el.dataset.gameId);
                    if (!gameId) return;
                    const cacheKey = String(gameId);
                    const cached = _ratingStatsCache[cacheKey];
                    if (cached && (now - cached.ts < 1800000)) {
                        if (cached.count > 0) {
                            el.textContent = '📝 ' + cached.count + '人评价';
                        }
                        el.dataset.loaded = '1';
                    } else {
                        _ratingBatchPending.push({ el, gameId });
                    }
                });

                if (_ratingBatchPending.length === 0) return;

                if (_ratingBatchTimer) return;

                _ratingBatchTimer = setTimeout(async () => {
                    const pending = _ratingBatchPending.splice(0);
                    _ratingBatchTimer = null;

                    const uniqueIds = [...new Set(pending.map(p => p.gameId))];
                    const batchResult = await fetchBatchRatingStats(uniqueIds);

                    pending.forEach(({ el, gameId }) => {
                        const stats = batchResult[gameId] || { average: null, count: 0 };
                        if (stats.count > 0) {
                            el.textContent = '📝 ' + stats.count + '人评价';
                        }
                        el.dataset.loaded = '1';
                    });
                }, 200);
            }

            // ================================================================
            // 数据加载
            // ================================================================
            const STORAGE_KEY = 'heroineGamesDataV2';
            const SETTINGS_KEY = 'heroineGamesSettingsV2';
            const SYNC_META_KEY = 'heroineGamesSyncMetaV2';
            const SYNC_TTL = 5 * 60 * 1000;
            // isDraft 列不存在时（尚未执行 add_is_draft_column.sql），降级为不带该字段的查询，避免同步报错
            let _isDraftColumnMissing = false;

            function invalidateSyncCache() {
                try { localStorage.removeItem(SYNC_META_KEY); } catch (_) {}
            }

            function getSupabase() {
                if (!supabaseClient || !SUPABASE_ENABLED) return null;
                return supabaseClient;
            }

            function setSyncStatus(status, msg) {
                const el = document.getElementById('syncStatus');
                if (!el) return;
                el.className = 'sync-status';
                if (status === 'synced') {
                    el.classList.add('synced');
                    el.textContent = '☁️ 已同步';
                } else if (status === 'syncing') {
                    el.classList.add('syncing');
                    el.textContent = '⏳ ' + (msg || '正在展开地图');
                } else if (status === 'error') {
                    el.classList.add('error');
                    el.textContent = '⚠️ ' + (msg || '同步失败');
                } else { el.textContent = '☁️ ' + (msg || '就绪'); }
            }

            async function loadFromSupabase() {
                const client = getSupabase();
                if (!client) return null;
                setSyncStatus('syncing', '正在展开地图');
                const PAGE_SIZE = 1000;
                const isRetryable = (e) => {
                    if (!e) return false;
                    if (e.name === 'AbortError') return true;
                    const msg = String(e.message || e).toLowerCase();
                    return msg.includes('network') || msg.includes('connection') || msg.includes('closed')
                        || msg.includes('timeout') || msg.includes('econn') || msg.includes('fetch')
                        || msg.includes('abort') || msg.includes('reset');
                };
                // 单页查询 + 最多 3 次渐进重试（500ms / 1200ms / 2500ms），单页失败不影响已拉取到的页
                const BASE_SELECT = 'id, title, englishName, description, cover, genre, gameplay, platforms, releaseDate, isReleased, heroineType, perspective, costumeType, hasChinese, hasDemo, hasMacSupport, isPSExclusive, isNSExclusive, steamLink, steamAppId, otherLinks, mainStoryDuration, lowestPrice, series, seriesOrder, screenshots';
                const runPageQuery = async (offset) => {
                    const select = _isDraftColumnMissing ? BASE_SELECT : BASE_SELECT + ', isDraft';
                    const { data, error } = await client.from('games')
                        .select(select)
                        .not('id', 'in', '(1,2)')
                        .order('id', { ascending: true })
                        .range(offset, offset + PAGE_SIZE - 1);
                    if (error) throw error;
                    return data || [];
                };
                const fetchPageWithRetry = async (offset, attempt = 0) => {
                    try {
                        // ★ 轻量列表查询：fullDescription / videos 字段不在列表展示，从列表中排除以降低 payload，
                        //   详情页打开时通过 loadGameDetailFromSupabase 按需懒加载补齐（只查这两个字段）。
                        //   screenshots 保留在列表中：详情弹窗一打开就要立即显示截图，避免等待。
                        //   搜索函数 gameMatchesSearch() 不再匹配 fullDescription（已不在列表数据中）。
                        return await runPageQuery(offset);
                    } catch (e) {
                        // isDraft 列尚未添加（需执行 add_is_draft_column.sql）→ 降级为不带该字段的查询，保证正常加载
                        if (!_isDraftColumnMissing && /column\s+games\.is[Dd]raft\s+does not exist|is[Dd]raft.*(does not exist|not exist)|could not find.*is[Dd]raft/i.test(e?.message || '')) {
                            _isDraftColumnMissing = true;
                            console.warn('[Sync] games.isDraft 列不存在，已降级加载（如需缓冲区功能，请在 Supabase 执行 add_is_draft_column.sql）');
                            try {
                                return await runPageQuery(offset);
                            } catch (e2) {
                                if (attempt >= 3 || !isRetryable(e2)) throw e2;
                                await new Promise(r => setTimeout(r, [500, 1200, 2500][attempt]));
                                return fetchPageWithRetry(offset, attempt + 1);
                            }
                        }
                        const delays = [500, 1200, 2500];
                        if (attempt >= delays.length || !isRetryable(e)) throw e;
                        const wait = delays[attempt];
                        console.warn(`[Sync] 第${attempt + 1}页(offset=${offset})加载失败，${wait}ms 后第${attempt + 1}次重试：`, e?.message || e);
                        await new Promise(r => setTimeout(r, wait));
                        return fetchPageWithRetry(offset, attempt + 1);
                    }
                };
                const doFetchAll = async () => {
                    let allData = [];
                    let offset = 0;
                    while (true) {
                        const page = await fetchPageWithRetry(offset);
                        console.log(`[Sync] 从云端获取到 ${page.length} 条数据 (offset=${offset})`);
                        allData = allData.concat(page);
                        if (page.length < PAGE_SIZE) break;
                        offset += PAGE_SIZE;
                    }
                    console.log(`[Sync] 分页完成，共计 ${allData.length} 条原始数据`);
                    return allData;
                };
                try {
                    let data;
                    try {
                        data = await doFetchAll();
                    } catch (e1) {
                        // 整体兜底重试：用于「所有分页的单页重试都失败」或非分页阶段异常；非可重试错误直接抛出
                        if (!isRetryable(e1)) {
                            setSyncStatus('error', e1.message || '同步失败');
                            return null;
                        }
                        console.warn('[Sync] 首次加载失败，1s 后整体重试一次：', e1.message || e1);
                        await new Promise(r => setTimeout(r, 1000));
                        data = await doFetchAll();
                    }
                    if (data && data.length > 0) {
                        // 兜底过滤掉 id<=2 的特殊行（存储自定义分类用），防止漏网
                        const filtered = data.filter(row => Number(row.id) > 2);
                        const parsed = filtered.map(row => ({
                            ...row,
                            id: Number(row.id),
                            englishName: row.englishName || '',
                            heroineType: row.heroineType === '无性别默认女' ? '无明确性别默认女' : (row.heroineType || ''),
                            genre: row.genre || [],
                            gameplay: row.gameplay || [],
                            platforms: row.platforms || [],
                            isReleased: row.isReleased !== undefined ? row.isReleased : true,
                            isDraft: row.isDraft === true,
                            hasDemo: row.hasDemo || false,
                            hasMacSupport: row.hasMacSupport || '不支持Mac',
                            isPSExclusive: row.isPSExclusive || false,
                            isNSExclusive: row.isNSExclusive || false,
                            series: row.series || '',
                            seriesOrder: row.seriesOrder || 0,
                            videos: row.videos || [],
                            screenshots: row.screenshots || [],
                        }));
                        setSyncStatus('synced');
                        return parsed;
                    }
                    setSyncStatus('synced');
                    return null;
                } catch (e) { setSyncStatus('error', e.message || '网络异常'); return null; }
            }

            async function loadGameDetailFromSupabase(gameId) {
                const client = getSupabase();
                if (!client) return null;
                try {
                    const { data, error } = await client.from('games')
                        .select('id, fullDescription, screenshots, videos')
                        .eq('id', gameId)
                        .single();
                    if (error || !data) return null;
                    return data;
                } catch (_) { return null; }
            }

            async function loadGames() {
                // 1. 先从本地缓存加载（立即显示），不等待云端
                const local = localStorage.getItem(STORAGE_KEY);
                if (local) {
                    try {
                        const parsed = JSON.parse(local);
                        games = parsed.map(g => ({
                            ...g,
                            id: Number(g.id),
                            heroineType: g.heroineType === '无性别默认女' ? '无明确性别默认女' : (g.heroineType || '')
                        }));
                        games = games.filter(g => Number(g.id) !== 1 && Number(g.id) !== 2);
                        if (currentView === 'series') renderSeriesView(); else renderGallery(); // 立即渲染缓存数据
                    } catch (_) { games = []; }
                }

                // 2. 从云端刷新数据（后台静默更新），仅当缓存过期时执行
                //    不阻塞 init：立即返回缓存数据，云端到达后再重新渲染
                if (SUPABASE_ENABLED && supabaseClient) {
                    let shouldSync = true;
                    try {
                        const lastSync = Number(localStorage.getItem(SYNC_META_KEY) || 0);
                        if (lastSync > 0 && (Date.now() - lastSync) < SYNC_TTL) shouldSync = false;
                    } catch (_) {}
                    if (shouldSync) {
                        refreshGamesFromCloud().catch(e => console.warn('[Sync] 游戏数据云端刷新失败：', e.message || e));
                    }
                }

                games = games.filter(g => Number(g.id) !== 1 && Number(g.id) !== 2);
                return games;
            }

            async function refreshGamesFromCloud() {
                const freshData = await loadFromSupabase();
                if (freshData && freshData.length > 0) {
                    games = freshData;
                    try {
                        localStorage.setItem(STORAGE_KEY, JSON.stringify(games));
                        localStorage.setItem(SYNC_META_KEY, String(Date.now()));
                    } catch (_) {}
                    if (currentView === 'series') renderSeriesView(); else renderGallery(); // 用新数据重新渲染
                    syncAutoReleasedGames(); // 管理员：把到期未标记的游戏落库为已发售
                }
            }

            // ================================================================
            // 设置管理
            // ================================================================
            function loadSettings() {
                const s = localStorage.getItem(SETTINGS_KEY);
                if (s) {
                    try {
                        const d = JSON.parse(s);
                        currentTheme = d.theme || 'system';
                        if (!['light', 'dark', 'system'].includes(currentTheme)) currentTheme = 'system';
                        currentView = d.currentView || 'released';
                        if (currentView === 'series') currentView = 'released';
                        currentSort = d.currentSort || 'default';
                        if (!['default', 'newest', 'oldest', 'reviewCount'].includes(currentSort)) currentSort = 'default';
                        isAdminMode = d.isAdminMode || false;
                        // 屏蔽内容设置
                        showAdultContent = d.contentSettings?.showAdultContent === true;
                        const savedExcluded = d.contentSettings?.excludedTags || {};
                        excludedTags = {
                            genre: Array.isArray(savedExcluded.genre) ? savedExcluded.genre : [],
                            gameplay: Array.isArray(savedExcluded.gameplay) ? savedExcluded.gameplay : [],
                            platforms: Array.isArray(savedExcluded.platforms) ? savedExcluded.platforms : [],
                            heroineType: Array.isArray(savedExcluded.heroineType) ? savedExcluded.heroineType : [],
                            costumeType: Array.isArray(savedExcluded.costumeType) ? savedExcluded.costumeType : [],
                            perspective: Array.isArray(savedExcluded.perspective) ? savedExcluded.perspective : []
                        };
                    } catch (_) { }
                }
                applyTheme();
                updateViewTabs();
                resetActiveFilters();
                updateSortButtons();
            }

            function saveSettings() {
                localStorage.setItem(SETTINGS_KEY, JSON.stringify({
                    theme: currentTheme, currentView, currentSort, isAdminMode,
                    contentSettings: { showAdultContent, excludedTags }
                }));
            }

            function resetActiveFilters() {
                activeFilters = {};
                const map = currentView === 'released' ? getReleasedFilterCats() : getUnreleasedFilterCats();
                Object.keys(map).forEach(k => activeFilters[k] = new Set());
            }

            // ================================================================
            // 筛选分类
            // ================================================================
            function getReleasedFilterCats() {
                return {
                    genre: { label: '题材', options: getAllGenres().sort((a, b) => a.localeCompare(b, 'zh')), field: 'genre' },
                    gameplay: { label: '玩法', options: getAllGameplays().sort((a, b) => a.localeCompare(b, 'zh')), field: 'gameplay' },
                    platforms: { label: '平台', options: PLATFORM_OPTIONS.sort((a, b) => a.localeCompare(b, 'zh')), field: 'platforms' },
                    heroineType: { label: '主角分类', options: HEROINE_TYPE_OPTIONS, field: 'heroineType' },
                    costumeType: { label: '服设分类', options: COSTUME_TYPE_OPTIONS, field: 'costumeType' },
                    hasChinese: { label: '中文', options: CHINESE_OPTIONS, field: 'hasChinese' },
                    perspective: { label: '视角', options: PERSPECTIVE_OPTIONS, field: 'perspective' },
                    hasMacSupport: { label: 'Mac适配', options: ['支持Mac', '不支持Mac'], field: 'hasMacSupport' }
                };
            }

            function getUnreleasedFilterCats() {
                return {
                    genre: { label: '题材', options: getAllGenres().sort((a, b) => a.localeCompare(b, 'zh')), field: 'genre' },
                    gameplay: { label: '玩法', options: getAllGameplays().sort((a, b) => a.localeCompare(b, 'zh')), field: 'gameplay' },
                    platforms: { label: '平台', options: PLATFORM_OPTIONS.sort((a, b) => a.localeCompare(b, 'zh')), field: 'platforms' },
                    heroineType: { label: '主角分类', options: HEROINE_TYPE_OPTIONS, field: 'heroineType' },
                    perspective: { label: '视角', options: PERSPECTIVE_OPTIONS, field: 'perspective' },
                    hasDemo: { label: 'Demo试玩', options: DEMO_OPTIONS, field: 'hasDemo' },
                    hasChinese: { label: '中文', options: CHINESE_OPTIONS, field: 'hasChinese' }
                };
            }

            // ================================================================
            // 主题
            // ================================================================
            function applyTheme() {
                if (currentTheme === 'system') {
                    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                    document.body.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
                } else {
                    document.body.setAttribute('data-theme', currentTheme);
                }
                const btn = document.getElementById('btnThemeToggle');
                if (btn) {
                    if (currentTheme === 'system') btn.textContent = '🌓';
                    else if (currentTheme === 'dark') btn.textContent = '☀️';
                    else btn.textContent = '🌙';
                }
            }

            function toggleTheme() {
                const order = ['light', 'dark', 'system'];
                const idx = order.indexOf(currentTheme);
                currentTheme = order[(idx + 1) % order.length];
                applyTheme();
                saveSettings();
                const labels = { light: '浅色模式', dark: '深色模式', system: '跟随系统' };
                showToast('🎨 ' + labels[currentTheme], 1500);
            }

            function initSystemThemeListener() {
                window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function () {
                    if (currentTheme === 'system') applyTheme();
                });
            }

            // ================================================================
            // 视图、排序、搜索
            // ================================================================
            function switchView(view) {
                if (currentView === view) return;
                currentView = view;
                updateViewTabs();
                resetActiveFilters();
                activeFilterCat = null;
                updateFilterUI();
                if (view === 'series') {
                    renderSeriesView();
                } else {
                    renderGallery();
                }
                saveSettings();
            }

            function updateViewTabs() {
                document.querySelectorAll('.view-tab').forEach(t =>
                    t.classList.toggle('active', t.dataset.view === currentView));
            }

            function updateSortButtons() {
                // 新版：select 下拉控件（方案A）
                const sel = document.getElementById('sortSelect');
                if (sel && sel.value !== currentSort) {
                    sel.value = currentSort;
                }
                // 旧版：分段按钮（兼容可能的残留节点）
                document.querySelectorAll('.sort-btn').forEach(btn => {
                    btn.classList.toggle('active', btn.dataset.sort === currentSort);
                });
            }

            function setSort(sort) {
                if (currentSort === sort) return;
                currentSort = sort;
                updateSortButtons();
                renderGallery();
                saveSettings();
            }

            // ================================================================
            // 评论数排序：预取全部游戏的评论数（batch_rating_stats），缓存在内存
            //  命中：先读 cache；未命中：批量 RPC；RPC 失败回退本地 userData.reviews
            // ================================================================
            let _reviewCountCache = null; // { [gameId]: number }
            let _reviewCountCacheTs = 0;
            let _reviewCountCacheLoading = false;
            const REVIEW_COUNT_TTL = 5 * 60 * 1000; // 5 分钟

            async function getReviewCountMap() {
                const now = Date.now();
                if (_reviewCountCache && (now - _reviewCountCacheTs < REVIEW_COUNT_TTL)) {
                    return _reviewCountCache;
                }
                const client = getSupabase();
                const result = {};
                // 1. 本地 reviews（当前用户自己的评价一定能拿到）
                for (const r of (userData.reviews || [])) {
                    const gid = Number(r.game_id);
                    if (gid > 0) result[gid] = (result[gid] || 0) + 1;
                }
                if (client) {
                    try {
                        // 仅查询已有的统计数据（batch_rating_stats 返回所有存在评价的 game_id 对应 count）
                        // 传空数组不行——RPC 无过滤条件，直接全量统计最准确（后续可再做分页裁剪）
                        const allIds = (typeof games !== 'undefined' ? (games || []) : []).map(g => Number(g.id)).filter(id => id > 2);
                        if (allIds.length) {
                            const { data, error } = await client.rpc('batch_rating_stats', { game_ids: allIds });
                            if (!error && Array.isArray(data)) {
                                for (const row of data) {
                                    const gid = Number(row.game_id);
                                    if (gid > 0) {
                                        // 实际字段名为 rating_count（与现有 fetchBatchRatingStats 一致），
                                        //  保留 count_reviews / count 兜底以防 RPC 后续版本变更
                                        const cloudCount = Number(row.rating_count ?? row.count_reviews ?? row.count ?? 0);
                                        // 云侧统计通常包含当前用户评价，直接覆盖本地
                                        result[gid] = Math.max(result[gid] || 0, cloudCount);
                                    }
                                }
                            }
                        }
                    } catch (_) {
                        // RPC 失败：降级使用本地已有数据
                    }
                }
                _reviewCountCache = result;
                _reviewCountCacheTs = now;
                return result;
            }

            function invalidateReviewCountCache() {
                _reviewCountCache = null;
                _reviewCountCacheTs = 0;
            }

            // ★ 清除指定游戏的评论列表缓存（评论保存/删除/回复变更后调用）
            function invalidateReviewsListCache(gameId) {
                if (gameId != null) {
                    delete _reviewsListCache[String(gameId)];
                } else {
                    _reviewsListCache = {};
                }
            }

            function sortGames(gameList) {
                const sorted = [...gameList];
                if (currentSort === 'default') {
                    sorted.sort((a, b) => b.id - a.id);
                } else if (currentSort === 'newest') {
                    sorted.sort((a, b) => (b.releaseDate || '1970-01-01').localeCompare(a.releaseDate || '1970-01-01'));
                } else if (currentSort === 'oldest') {
                    sorted.sort((a, b) => (a.releaseDate || '1970-01-01').localeCompare(b.releaseDate || '1970-01-01'));
                } else if (currentSort === 'reviewCount') {
                    // ★ 评论数从多到少；无评论的按游戏 id 从大到小
                    //  如果云侧统计尚未加载完成：先用本地 userData.reviews + cache 预估排序，
                    //   云数据回来后会触发 renderGallery() 再排一次，不会出错
                    const countMap = _reviewCountCache || {};
                    const localMap = {};
                    for (const r of (userData.reviews || [])) {
                        const gid = Number(r.game_id);
                        if (gid > 0) localMap[gid] = 1; // 本地只知道「自己是否评价过」
                    }
                    sorted.sort((a, b) => {
                        const aid = Number(a.id), bid = Number(b.id);
                        const ca = Number(countMap[aid] ?? localMap[aid] ?? 0);
                        const cb = Number(countMap[bid] ?? localMap[bid] ?? 0);
                        if (cb !== ca) return cb - ca;
                        return bid - aid;
                    });
                    // 非阻塞加载云侧统计，拿到后如果当前仍是评论数排序则重渲染
                    if (!_reviewCountCache || _reviewCountCacheLoading) {
                        // 只触发一次，不阻塞本次渲染
                        if (!_reviewCountCacheLoading) {
                            _reviewCountCacheLoading = true;
                            getReviewCountMap().then(() => {
                                _reviewCountCacheLoading = false;
                                if (currentSort === 'reviewCount' && currentView !== 'series') {
                                    renderGallery();
                                } else if (currentSort === 'reviewCount' && currentView === 'series') {
                                    renderSeriesView();
                                }
                            }).catch(() => { _reviewCountCacheLoading = false; });
                        }
                    }
                }
                return sorted;
            }

            function gameMatchesSearch(game, query) {
                if (!query) return true;
                const q = query.toLowerCase();
                if (q === '免费' || q === 'free') {
                    return game.lowestPrice && game.lowestPrice.includes('免费');
                }
                const fields = [game.title, game.englishName, game.description,
                game.heroineType, game.perspective, game.costumeType, game.lowestPrice,
                ...(game.genre || []), ...(game.gameplay || []), ...(game.platforms || [])
                ];
                return fields.some(f => f && f.toLowerCase().includes(q));
            }

            function getFilteredGames() {
                const map = currentView === 'released' ? getReleasedFilterCats() : getUnreleasedFilterCats();
                const filtered = games.filter(game => {
                    const id = Number(game.id);
                    if (id === 1 || id === 2) return false;
                    if (game.isDraft) return false; // 导入缓冲区中的草稿不进总览
                    if (isGameReleased(game) !== (currentView === 'released')) return false;
                    if (searchQuery && !gameMatchesSearch(game, searchQuery)) return false;
                    if (wishlistMode && !isInWishlist(game.id)) return false;
                    if (excludePlayedMode && isPlayed(game.id)) return false;
                    // 屏蔽内容：恶俗设计
                    if (!showAdultContent && game.costumeType === '含恶俗设计') return false;
                    // 屏蔽内容：排除标签（单值字段）
                    if (excludedTags.heroineType.includes(game.heroineType)) return false;
                    if (excludedTags.costumeType.includes(game.costumeType)) return false;
                    if (excludedTags.perspective.includes(game.perspective)) return false;
                    // 屏蔽内容：排除标签（数组字段）
                    for (const t of (game.genre || [])) { if (excludedTags.genre.includes(t)) return false; }
                    for (const t of (game.gameplay || [])) { if (excludedTags.gameplay.includes(t)) return false; }
                    for (const t of (game.platforms || [])) { if (excludedTags.platforms.includes(t)) return false; }
                    for (const [cat, sel] of Object.entries(activeFilters)) {
                        if (sel.size === 0) continue;
                        const field = map[cat]?.field;
                        if (!field) continue;
                        if (cat === 'hasChinese' || cat === 'hasMacSupport' ||
                            cat === 'heroineType' || cat === 'costumeType' || cat === 'perspective') {
                            if (!sel.has(game[field])) return false;
                        } else if (cat === 'hasDemo') {
                            if (!sel.has(game.hasDemo ? '有Demo' : '无Demo')) return false;
                        } else if (cat === 'platforms' || cat === 'genre' || cat === 'gameplay') {
                            const arr = game[field] || [];
                            let ok = false;
                            for (const v of sel) { if (arr.includes(v)) { ok = true; break; } }
                            if (!ok) return false;
                        }
                    }
                    return true;
                });
                return sortGames(filtered);
            }

            function clearAllFilters() {
                Object.values(activeFilters).forEach(s => s.clear());
                activeFilterCat = null;
                updateFilterUI();
                renderGallery();
            }
            window.clearAllFilters = clearAllFilters;

            function removeFilter(cat, val) {
                if (activeFilters[cat]) activeFilters[cat].delete(val);
                updateFilterUI();
                renderGallery();
            }

            function toggleFilterOption(cat, val) {
                const s = activeFilters[cat];
                if (s.has(val)) s.delete(val);
                else s.add(val);
                updateFilterUI();
                renderGallery();
            }

            function updateFilterUI() {
                const map = currentView === 'released' ? getReleasedFilterCats() : getUnreleasedFilterCats();

                const row = document.getElementById('filterCategoryRow');
                row.innerHTML = Object.entries(map).map(([cat, info]) => {
                    const has = activeFilters[cat] && activeFilters[cat].size > 0;
                    let cls = 'filter-cat-btn';
                    if (cat === activeFilterCat) cls += ' active';
                    if (has) cls += ' has-selection';
                    return `<button class="${cls}" data-cat="${cat}">${info.label}</button>`;
                }).join('');

                const panel = document.getElementById('filterOptionsPanel');
                if (activeFilterCat && map[activeFilterCat]) {
                    const info = map[activeFilterCat],
                        sel = activeFilters[activeFilterCat];
                    panel.innerHTML = info.options.map(o =>
                        `<span class="filter-option-tag${sel.has(o) ? ' selected' : ''}" data-cat="${activeFilterCat}" data-value="${escapeHTML(o)}">${o}</span>`
                    ).join('');
                    panel.classList.add('show');
                } else {
                    panel.innerHTML = '';
                    panel.classList.remove('show');
                }

                const bar = document.getElementById('activeFiltersBar');
                let chips = [];
                for (const [cat, sel] of Object.entries(activeFilters)) {
                    if (sel.size === 0) continue;
                    const label = map[cat]?.label || cat;
                    sel.forEach(v => chips.push(
                        `<span class="active-filter-chip">${label}: ${v}<span class="remove-chip" data-cat="${cat}" data-value="${escapeHTML(v)}">×</span></span>`
                    ));
                }
                if (chips.length > 0) chips.push('<span class="clear-all-filters" id="clearAllFilters">清除全部筛选</span>');
                bar.innerHTML = chips.join('');

                panel.querySelectorAll('.filter-option-tag').forEach(t =>
                    t.addEventListener('click', function () {
                        toggleFilterOption(this.dataset.cat, this.dataset.value);
                    })
                );
                bar.querySelectorAll('.remove-chip').forEach(c =>
                    c.addEventListener('click', function (e) {
                        e.stopPropagation();
                        removeFilter(this.dataset.cat, this.dataset.value);
                    })
                );
                const clr = document.getElementById('clearAllFilters');
                if (clr) clr.addEventListener('click', clearAllFilters);

                row.querySelectorAll('.filter-cat-btn').forEach(b =>
                    b.addEventListener('click', function () {
                        const c = this.dataset.cat;
                        activeFilterCat = activeFilterCat === c ? null : c;
                        updateFilterUI();
                    })
                );
            }

            // ================================================================
            // 系列作品视图
            // ================================================================
            function renderSeriesView() {
                const grid = document.getElementById('galleryGrid');
                const no = document.getElementById('noResults');
                const countNum = document.getElementById('countNumber');

                // 收集所有有系列的游戏（应用屏蔽内容过滤）
                const seriesMap = {};
                games.forEach(g => {
                    if (g.isDraft) return; // 导入缓冲区中的草稿不进系列视图
                    if (g.series && g.series.trim()) {
                        // 屏蔽内容过滤
                        if (!showAdultContent && g.costumeType === '含恶俗设计') return;
                        if (excludedTags.heroineType.includes(g.heroineType)) return;
                        if (excludedTags.costumeType.includes(g.costumeType)) return;
                        if (excludedTags.perspective.includes(g.perspective)) return;
                        if ((g.genre || []).some(t => excludedTags.genre.includes(t))) return;
                        if ((g.gameplay || []).some(t => excludedTags.gameplay.includes(t))) return;
                        if ((g.platforms || []).some(t => excludedTags.platforms.includes(t))) return;
                        if (!seriesMap[g.series]) seriesMap[g.series] = [];
                        seriesMap[g.series].push(g);
                    }
                });

                // 按系列名排序，系列内按 seriesOrder 排序
                const seriesNames = Object.keys(seriesMap).sort((a, b) => a.localeCompare(b, 'zh'));
                seriesNames.forEach(name => {
                    seriesMap[name].sort((a, b) => (a.seriesOrder || 0) - (b.seriesOrder || 0));
                });

                const totalSeries = seriesNames.length;
                const totalGames = seriesNames.reduce((sum, name) => sum + seriesMap[name].length, 0);
                countNum.textContent = totalGames;

                if (totalSeries === 0) {
                    grid.innerHTML = '';
                    no.style.display = 'block';
                    no.innerHTML = `
                        <div class="series-view-empty">
                            <span class="empty-icon">📚</span>
                            <div style="font-size:1.1rem;font-weight:600;margin-bottom:8px;">暂无系列作品</div>
                            <div style="font-size:0.85rem;">在编辑游戏时填写「所属系列」字段，游戏就会自动归类到这里</div>
                        </div>`;
                    return;
                }

                no.style.display = 'none';

                let html = '';
                seriesNames.forEach(name => {
                    const list = seriesMap[name];
                    const cardsHtml = list.map(g => {
                        const coverHtml = g.cover
                            ? `<img class="card-cover" src="${escapeHTML(g.cover)}" referrerpolicy="no-referrer" loading="lazy" decoding="async" onload="this.classList.add('loaded');const ph=this.closest('.card-cover-wrap')?.querySelector('.card-cover-placeholder');if(ph)ph.classList.add('hidden');" onerror="const ph=this.closest('.card-cover-wrap')?.querySelector('.card-cover-placeholder');if(ph)ph.classList.remove('hidden');" />`
                            : '';
                        const placeholderCls = g.cover ? '' : ' style="position:relative;z-index:2;"';
                        const placeholderHtml = `<div class="card-cover-placeholder"${placeholderCls}>${SVG_ICONS.gamepad}</div>`;
                        const metaSpans = [];
                        if (g.hasChinese === '有中文') {
                            metaSpans.push('<span class="accent-tag">中文</span>');
                        } else if (g.hasChinese === '无中文') {
                            metaSpans.push('<span class="tag-muted">无中文</span>');
                        }
                        if (isGameReleased(g)) {
                            (g.genre || []).slice(0, 3).forEach(t => metaSpans.push(`<span>${escapeHTML(t)}</span>`));
                            (g.gameplay || []).slice(0, 2).forEach(t => metaSpans.push(`<span>${escapeHTML(t)}</span>`));
                        } else {
                            if (g.hasDemo) metaSpans.push('<span class="accent-tag">有Demo</span>');
                            (g.genre || []).slice(0, 3).forEach(t => metaSpans.push(`<span>${escapeHTML(t)}</span>`));
                            (g.gameplay || []).slice(0, 2).forEach(t => metaSpans.push(`<span>${escapeHTML(t)}</span>`));
                        }
                        if (g.releaseDate) metaSpans.push(`<span>${escapeHTML(g.releaseDate)}</span>`);
                        const heroineTag = g.heroineType ? `<div class="card-heroine-tag">${escapeHTML(g.heroineType)}</div>` : '';
                        const inWish = isInWishlist(g.id);
                        const inPlay = isPlayed(g.id);
                        return `
                            <div class="gallery-card visible" data-game-id="${g.id}" onclick="openSeriesGameDetail(${g.id})">
                                <div class="card-cover-wrap">
                                    ${coverHtml}
                                    ${placeholderHtml}
                                    ${heroineTag}
                                </div>
                                <div class="card-body">
                                    <div class="card-title">${escapeHTML(g.title)}</div>
                                    <div class="card-desc">${escapeHTML(g.description || '')}</div>
                                    <div class="card-meta">${metaSpans.join('')}</div>
                                </div>
                                <div class="card-user-actions ${isGameReleased(g) ? '' : 'only-wish'}">
                                    <button class="action-btn action-wish ${inWish ? 'active-wish' : ''}" data-game-id="${g.id}" onclick="event.stopPropagation();toggleWishlist(${g.id});"><span class="icon">${inWish ? SVG_ICONS.heartFilled : SVG_ICONS.heartOutline}</span><span class="action-label">${inWish ? '已加入' : '加入愿望单'}</span></button>
                                    ${isGameReleased(g) ? `<button class="action-btn action-play ${inPlay ? 'active-played' : ''}" data-game-id="${g.id}" onclick="event.stopPropagation();togglePlayed(${g.id});"><span class="icon">${inPlay ? SVG_ICONS.checkFilled : SVG_ICONS.squareOutline}</span><span class="action-label">${inPlay ? '已玩过' : '标记玩过'}</span></button>` : ''}
                                </div>
                            </div>`;
                    }).join('');

                    html += `
                        <div class="series-group">
                            <div class="series-group-title">📚 ${escapeHTML(name)} <span class="series-group-badge">${list.length} 部作品</span></div>
                            <div class="series-group-cards">${cardsHtml}</div>
                        </div>`;
                });

                grid.innerHTML = html;
                loadCardRatingStats();
            }

            window.openSeriesGameDetail = function(gameId) {
                const game = games.find(g => g.id === gameId);
                if (game) {
                    showDetailModal(game, { from: 'series' });
                }
            };

            function updateSearchClearBtn() {
                const btn = document.getElementById('searchClearBtn');
                if (!btn) return;
                btn.classList.toggle('visible', searchQuery.length > 0);
            }

            function setSearchQuery(q) {
                if (searchTimeout) clearTimeout(searchTimeout);
                const raw = q.trim();
                if (raw.length === 0) {
                    searchQuery = '';
                    updateSearchClearBtn();
                    renderGallery();
                    return;
                }
                searchTimeout = setTimeout(() => {
                    searchQuery = raw;
                    updateSearchClearBtn();
                    renderGallery();
                    searchTimeout = null;
                }, 280);
            }

            let _toastTimer = null;
            let _toastRemoveTimer = null;
            function showToast(msg, duration) {
                duration = duration || 2600;
                const existing = document.querySelector('.toast-notification:not(.achievement-toast)');
                if (existing) {
                    if (_toastTimer) clearTimeout(_toastTimer);
                    if (_toastRemoveTimer) clearTimeout(_toastRemoveTimer);
                    existing.remove();
                }
                const toast = document.createElement('div');
                toast.className = 'toast-notification';
                toast.textContent = msg;
                document.body.appendChild(toast);
                requestAnimationFrame(() => { toast.classList.add('show'); });
                _toastTimer = setTimeout(() => {
                    toast.classList.remove('show');
                    _toastRemoveTimer = setTimeout(() => toast.remove(), 500);
                }, duration);
            }

            function toggleWishlistMode() {
                wishlistMode = !wishlistMode;
                const btn = document.getElementById('btnWishlistToggle');
                if (btn) {
                    btn.classList.toggle('active', wishlistMode);
                    btn.innerHTML = `<span class="heart-icon">${SVG_ICONS.heartFilled}</span> 愿望单${wishlistMode ? ' (开)' : ''}`;
                }
                renderGallery();
                if (wishlistMode) {
                    const count = getFilteredGames().length;
                    showToast(`📋 愿望单中 ${count} 款游戏`, 1800);
                }
            }

            function toggleExcludePlayedMode() {
                excludePlayedMode = !excludePlayedMode;
                const btn = document.getElementById('btnExcludePlayed');
                if (btn) {
                    btn.classList.toggle('active', excludePlayedMode);
                    btn.innerHTML = `<span class="check-icon">${SVG_ICONS.checkFilled}</span> 排除已玩${excludePlayedMode ? ' (开)' : ''}`;
                }
                renderGallery();
                if (excludePlayedMode) {
                    const count = getFilteredGames().length;
                    showToast(`🎮 排除已玩后剩余 ${count} 款游戏`, 1800);
                }
            }

            // ================================================================
            // 渲染卡片 (性能优化：复用已有DOM节点)
            // ================================================================
            let _cardMap = new Map();
            let _cardEventBound = new WeakSet();

            function renderGallery() {
                if (currentView === 'series') { renderSeriesView(); return; }
                const filtered = getFilteredGames();
                const grid = document.getElementById('galleryGrid');
                const no = document.getElementById('noResults');
                const countNum = document.getElementById('countNumber');

                countNum.textContent = filtered.length;
                countNum.classList.remove('pop');
                void countNum.offsetWidth;
                countNum.classList.add('pop');

                if (filtered.length === 0) {
                    grid.innerHTML = '';
                    _cardMap.clear();
                    no.style.display = 'block';

                    if (wishlistMode) {
                        no.innerHTML = `
                            <div class="empty-state-guide">
                                <span class="empty-icon">💝</span>
                                <div class="empty-title">愿望单是空的</div>
                                <div class="empty-desc">去发现喜欢的游戏，把它们加入愿望单吧！</div>
                                <button class="empty-action" onclick="toggleWishlistMode()">🎮 浏览游戏</button>
                            </div>`;
                    } else if (searchQuery) {
                        no.innerHTML = `
                            <div class="empty-state-guide">
                                <span class="empty-icon">🔍</span>
                                <div class="empty-title">没有找到"${escapeHTML(searchQuery)}"相关的游戏</div>
                                <div class="empty-desc">试试换个关键词，或清除筛选条件</div>
                                <button class="empty-action" onclick="document.getElementById('searchInput').value='';setSearchQuery('');">✕ 清除搜索</button>
                            </div>`;
                    } else {
                        no.innerHTML = `
                            <div class="empty-state-guide">
                                <span class="empty-icon">📭</span>
                                <div class="empty-title">没有匹配的游戏</div>
                                <div class="empty-desc">请调整筛选条件，或<span class="clear-all-filters" onclick="clearAllFilters()" style="color:var(--accent);cursor:pointer;">清除全部筛选</span></div>
                            </div>`;
                    }
                    if (cardObserver) {
                        cardObserver.disconnect();
                        cardObserver = null;
                    }
                    card3DListeners.forEach(({ el, handler, leave }) => {
                        el.removeEventListener('mousemove', handler);
                        el.removeEventListener('mouseleave', leave);
                    });
                    card3DListeners = [];
                    return;
                }
                no.style.display = 'none';

                const filteredIds = new Set(filtered.map(g => g.id));
                const frag = document.createDocumentFragment();
                const newCards = [];

                filtered.forEach(g => {
                    let card = _cardMap.get(g.id);
                    if (card) {
                        frag.appendChild(card);
                    } else {
                        card = createCardElement(g);
                        _cardMap.set(g.id, card);
                        frag.appendChild(card);
                        newCards.push(card);
                    }
                });

                for (const [id, card] of _cardMap) {
                    if (!filteredIds.has(id)) {
                        card.remove();
                        _cardEventBound.delete(card);
                        _cardMap.delete(id);
                    }
                }

                grid.innerHTML = '';
                grid.appendChild(frag);

                if (cardObserver) { cardObserver.disconnect(); } else {
                    cardObserver = new IntersectionObserver((entries) => {
                        entries.forEach(entry => {
                            if (entry.isIntersecting) {
                                entry.target.classList.add('visible');
                                cardObserver.unobserve(entry.target);
                                const img = entry.target.querySelector('.card-cover');
                                if (img && !img.dataset.loaded) {
                                    img.dataset.loaded = '1';
                                    if (img.complete) {
                                        img.classList.add('loaded');
                                        const ph = entry.target.querySelector('.card-cover-placeholder');
                                        if (ph) ph.classList.add('hidden');
                                    } else {
                                        img.onload = function () {
                                            this.classList.add('loaded');
                                            const ph = this.closest('.gallery-card')?.querySelector('.card-cover-placeholder');
                                            if (ph) ph.classList.add('hidden');
                                        };
                                        img.onerror = function () {
                                            const ph = this.closest('.gallery-card')?.querySelector('.card-cover-placeholder');
                                            if (ph) ph.classList.remove('hidden');
                                        };
                                    }
                                }
                            }
                        });
                    }, { threshold: 0.08, rootMargin: '0px 0px -20px 0px' });
                }

                const cards = grid.querySelectorAll('.gallery-card');
                cards.forEach((card) => {
                    const rect = card.getBoundingClientRect();
                    const winHeight = window.innerHeight || document.documentElement.clientHeight;
                    if (rect.top < winHeight - 40) {
                        card.classList.add('visible');
                        const img = card.querySelector('.card-cover');
                        if (img && !img.dataset.loaded) {
                            img.dataset.loaded = '1';
                            if (img.complete) {
                                img.classList.add('loaded');
                                const ph = card.querySelector('.card-cover-placeholder');
                                if (ph) ph.classList.add('hidden');
                            } else {
                                img.onload = function () {
                                    this.classList.add('loaded');
                                    const ph = this.closest('.gallery-card')?.querySelector('.card-cover-placeholder');
                                    if (ph) ph.classList.add('hidden');
                                };
                                img.onerror = function () {
                                    const ph = this.closest('.gallery-card')?.querySelector('.card-cover-placeholder');
                                    if (ph) ph.classList.remove('hidden');
                                };
                            }
                        }
                    } else { cardObserver.observe(card); }
                    if (!isTouchDevice && window.matchMedia('(hover: hover)').matches) {
                        setupCard3D(card);
                    }
                });

                cards.forEach(card => {
                    if (_cardEventBound.has(card)) return;
                    _cardEventBound.add(card);

                    const wishBtn = card.querySelector('.action-wish');
                    const playBtn = card.querySelector('.action-play');
                    if (wishBtn) {
                        wishBtn.addEventListener('click', function (e) {
                            e.stopPropagation();
                            const id = Number(this.dataset.gameId);
                            if (!isNaN(id)) toggleWishlist(id);
                        });
                        wishBtn.addEventListener('pointerdown', function (e) {
                            e.stopPropagation();
                        });
                    }
                    if (playBtn) {
                        playBtn.addEventListener('click', function (e) {
                            e.stopPropagation();
                            const id = Number(this.dataset.gameId);
                            if (!isNaN(id)) togglePlayed(id);
                        });
                        playBtn.addEventListener('pointerdown', function (e) {
                            e.stopPropagation();
                        });
                    }

                    const id = Number(card.dataset.gameId);
                    if (!isNaN(id)) {
                        card.addEventListener('click', function (e) {
                            if (e.target.closest('.card-user-actions') || e.target.closest('.card-admin-actions')) return;
                            const g = games.find(g => g.id === id);
                            if (g) {
                                window._detailFrom = 'gallery';
                                showDetailModal(g, { from: 'gallery' });
                            }
                        });
                    }
                });

                updateAchievementDot();
                loadCardRatingStats();
            }

            function createCardElement(game) {
                const inWish = isInWishlist(game.id);
                const inPlay = isPlayed(game.id);

                const metaParts = [];
                if (game.hasChinese === '有中文') metaParts.push('<span class="accent-tag">中文</span>');
                else if (game.hasChinese === '无中文') metaParts.push('<span class="tag-muted">无中文</span>');
                const metaGenres = (game.genre || []).slice(0, 3);
                const metaGameplays = (game.gameplay || []).slice(0, 2);
                if (isGameReleased(game)) {
                    metaGenres.forEach(t => metaParts.push('<span>' + escapeHTML(t) + '</span>'));
                    metaGameplays.forEach(t => metaParts.push('<span>' + escapeHTML(t) + '</span>'));
                } else {
                    if (game.hasDemo) metaParts.push('<span class="accent-tag">有Demo</span>');
                    metaGenres.forEach(t => metaParts.push('<span>' + escapeHTML(t) + '</span>'));
                    metaGameplays.forEach(t => metaParts.push('<span>' + escapeHTML(t) + '</span>'));
                }
                if (game.releaseDate) metaParts.push('<span>' + escapeHTML(game.releaseDate) + '</span>');

                const coverImg = game.cover
                    ? `<img class="card-cover" src="${escapeHTML(game.cover)}" alt="${escapeHTML(game.title)} 封面图" loading="lazy" decoding="async" onload="this.classList.add('loaded');const ph=this.closest('.card-cover-wrap')?.querySelector('.card-cover-placeholder');if(ph)ph.classList.add('hidden');" onerror="const ph=this.closest('.card-cover-wrap')?.querySelector('.card-cover-placeholder');if(ph)ph.classList.remove('hidden');" /><div class="card-cover-placeholder">${SVG_ICONS.gamepad}</div>`
                    : '<div class="card-cover-placeholder" style="position:relative;z-index:2;">' + SVG_ICONS.gamepad + '</div>';

                const heroineTag = game.heroineType ? `<div class="card-heroine-tag">${escapeHTML(game.heroineType)}</div>` : '';

                const adminBtns = (isAdmin && isAdminMode)
                    ? `<div class="card-admin-actions"><button class="btn-edit-card" data-game-id="${game.id}">✏️ 编辑</button><button class="btn-del-card" data-game-id="${game.id}">🗑 删除</button></div>`
                    : '';

                const wrapper = document.createElement('div');
                wrapper.innerHTML = `
                    <div class="gallery-card" data-game-id="${game.id}">
                        <div class="card-parallax-bg"></div>
                        <div class="card-cover-wrap">
                            ${coverImg}
                            ${heroineTag}
                        </div>
                        <div class="card-body">
                            <div class="card-title">${escapeHTML(game.title || '')}</div>
                            <div class="card-desc">${escapeHTML(game.description || '')}</div>
                            <div class="card-meta">${metaParts.join('')}<div class="card-rating-count" data-game-id="${game.id}"></div></div>
                        </div>
                        <div class="card-user-actions ${isGameReleased(game) ? '' : 'only-wish'}">
                            <button class="action-btn action-wish ${inWish ? 'active-wish' : ''}" data-game-id="${game.id}"><span class="icon">${inWish ? SVG_ICONS.heartFilled : SVG_ICONS.heartOutline}</span><span class="action-label">${inWish ? '已加入' : '加入愿望单'}</span></button>
                            ${isGameReleased(game) ? `<button class="action-btn action-play ${inPlay ? 'active-played' : ''}" data-game-id="${game.id}"><span class="icon">${inPlay ? SVG_ICONS.checkFilled : SVG_ICONS.squareOutline}</span><span class="action-label">${inPlay ? '已玩过' : '标记玩过'}</span></button>` : ''}
                        </div>
                        ${adminBtns}
                    </div>`;
                const card = wrapper.firstElementChild;

                if (isAdmin && isAdminMode) {
                    card.querySelector('.btn-edit-card')?.addEventListener('click', function (e) {
                        e.stopPropagation();
                        const g = games.find(g => g.id === Number(this.dataset.gameId));
                        if (g) showEditModal(g);
                    });
                    card.querySelector('.btn-del-card')?.addEventListener('click', async function (e) {
                        e.stopPropagation();
                        const id = Number(this.dataset.gameId);
                        if (!confirm('确定删除这款游戏吗？此操作不可恢复。')) return;
                        await deleteGame(id);
                    });
                }

                return card;
            }

            // ================================================================
            // 管理员功能
            // ================================================================
            let _dbAdminConfirmed = null; // null=未查, true=DB确认管理员, false=DB非管理员

            function checkIsAdmin() {
                if (_dbAdminConfirmed === true) return true;
                return currentUser && currentUser.id === ADMIN_USER_ID;
            }

            // 异步从 admins 表校正管理员状态（部署 supabase_security.sql 后生效，否则回退硬编码）
            let _adminStatusRefreshing = false;
            async function refreshAdminStatus() {
                if (_adminStatusRefreshing) return;
                if (!currentUser || !supabaseClient) return;
                _adminStatusRefreshing = true;
                try {
                    const { data, error } = await supabaseClient.rpc('is_admin', { check_user_id: currentUser.id });
                    if (error) throw error;
                    const rpcAdmin = !!data;
                    const hardcodeAdmin = currentUser && currentUser.id === ADMIN_USER_ID;
                    const newIsAdmin = rpcAdmin || hardcodeAdmin;
                    _dbAdminConfirmed = rpcAdmin;
                    if (newIsAdmin !== isAdmin) {
                        isAdmin = newIsAdmin;
                        applyAdminUI();
                    }
                } catch (e) {
                    console.warn('查询管理员状态失败，使用硬编码:', e.message);
                } finally {
                    _adminStatusRefreshing = false;
                }
            }

            function applyAdminUI() {
                const addBtn = document.getElementById('btnAddGame');
                const impBtn = document.getElementById('btnImportCSV');
                const adminBtn = document.getElementById('btnToggleAdmin');
                const bufBtn = document.getElementById('btnBuffer');
                if (isAdmin) {
                    if (addBtn) addBtn.style.display = '';
                    if (impBtn) impBtn.style.display = '';
                    if (bufBtn) bufBtn.style.display = '';
                    if (adminBtn) {
                        adminBtn.style.display = '';
                        if (isAdminMode) {
                            adminBtn.textContent = '🔧 管理(开)';
                            adminBtn.classList.add('btn-accent');
                        } else {
                            adminBtn.textContent = '🔧 管理';
                            adminBtn.classList.remove('btn-accent');
                        }
                    }
                } else {
                    if (addBtn) addBtn.style.display = 'none';
                    if (impBtn) impBtn.style.display = 'none';
                    if (bufBtn) bufBtn.style.display = 'none';
                    if (adminBtn) adminBtn.style.display = 'none';
                    isAdminMode = false;
                }
                renderGallery();
            }

            function updateAdminUI() {
                isAdmin = checkIsAdmin();
                applyAdminUI();
                refreshAdminStatus();
            }

            // ============================================================
            // 用户拉黑功能（需先在 Supabase 执行 supabase_security.sql）
            // ============================================================

            // 检查当前登录用户是否被拉黑（发布前预检；数据库触发器是最终防线）
            async function isCurrentUserBanned() {
                if (!currentUser || !supabaseClient) return false;
                try {
                    const { data, error } = await supabaseClient.rpc('is_user_banned', { check_user_id: currentUser.id });
                    if (error) throw error;
                    return !!data;
                } catch (e) {
                    // RPC 未部署则视为未拉黑，由触发器/RLS 兜底
                    return false;
                }
            }

            // 管理员拉黑用户（传 user_id，RPC 内部自动从 auth.users 取邮箱写入 banned_users）
            async function banUser(targetUserId, reason) {
                if (!isAdmin) { showToast('⚠️ 仅管理员可拉黑', 1500); return false; }
                if (!supabaseClient) { showToast('数据库未连接', 1500); return false; }
                if (!targetUserId) { showToast('目标用户无效', 1500); return false; }
                if (targetUserId === currentUser.id) { showToast('⚠️ 不能拉黑自己', 1500); return false; }
                try {
                    const { data, error } = await supabaseClient.rpc('ban_user', {
                        target_user_id: targetUserId,
                        reason: reason || null
                    });
                    if (error) throw error;
                    showToast('✅ 已拉黑该用户，其将无法再发布内容', 2000);
                    return true;
                } catch (e) {
                    console.error('❌ 拉黑失败:', e);
                    showToast('⚠️ 拉黑失败：' + (e.message || '请重试'), 2500);
                    return false;
                }
            }

            // 管理员解除拉黑
            async function unbanUser(targetUserId) {
                if (!isAdmin) { showToast('⚠️ 仅管理员可操作', 1500); return false; }
                if (!supabaseClient) { showToast('数据库未连接', 1500); return false; }
                if (!targetUserId) { showToast('目标用户无效', 1500); return false; }
                try {
                    const { data, error } = await supabaseClient.rpc('unban_user', {
                        target_user_id: targetUserId
                    });
                    if (error) throw error;
                    showToast('✅ 已解除拉黑', 1800);
                    return true;
                } catch (e) {
                    console.error('❌ 解除拉黑失败:', e);
                    showToast('⚠️ 解除失败：' + (e.message || '请重试'), 2500);
                    return false;
                }
            }

            // 管理员查看拉黑名单
            async function getBannedList() {
                if (!isAdmin || !supabaseClient) return [];
                try {
                    const { data, error } = await supabaseClient.rpc('get_banned_list');
                    if (error) throw error;
                    return data || [];
                } catch (e) {
                    console.error('❌ 获取拉黑名单失败:', e);
                    return [];
                }
            }

            function toggleAdminMode() {
                if (!isAdmin) { showToast('⚠️ 仅管理员可使用', 1500); return; }
                isAdminMode = !isAdminMode;
                updateAdminUI();
                _cardMap.clear();
                renderGallery();
                showToast(isAdminMode ? '🔧 管理模式已开启' : '🔧 管理模式已关闭', 1500);
            }

            const EDIT_GAME_FIELDS = [
                { key: 'title', label: '游戏名称 *', type: 'text', required: true },
                { key: 'cover', label: '封面URL', type: 'text' },
                { key: 'steamAppId', label: 'Steam App ID', type: 'text' },
                { key: 'steamLink', label: 'Steam链接', type: 'text' },
                { key: 'description', label: '简介', type: 'textarea', rows: 2 },
                { key: 'fullDescription', label: '详细简介', type: 'textarea', rows: 3 },
                { key: 'releaseDate', label: '发售日期', type: 'date' },
                { key: 'isReleased', label: '已发售', type: 'checkbox' },
                { key: 'hasDemo', label: '有Demo', type: 'checkbox' },
                { key: 'hasChinese', label: '中文', type: 'select', options: ['有中文', '无中文'] },
                { key: 'perspective', label: '视角', type: 'select', options: ['第一人称', '第三人称', '可切换人称', '横版'] },
                { key: 'heroineType', label: '主角分类', type: 'select', options: ['固定女主', '可选女主', '动物女主', '双女主', '多主角含女主', '无明确性别默认女'] },
                { key: 'costumeType', label: '服设分类', type: 'select', options: ['服设合理', '服设不合理', '含恶俗设计', '服设可自选'] },
                { key: 'mainStoryDuration', label: '主线时长', type: 'text' },
                { key: 'lowestPrice', label: '最低价', type: 'text' },
                { key: 'otherLinks', label: '其他链接', type: 'textarea', rows: 2 },
            ];

            const EDIT_GENRE_OPTIONS = ['丧尸', '悬疑/推理', '恐怖/生存恐怖', '乙女/女性向', '后末日', '百合', '权谋', '魔法', '偶像/娱乐圈', '日常/生活', '校园', '职场', '战争/军事', '犯罪/黑帮', '体育', '艺术/音乐', '烹饪', '动物', '童话/寓言', '神话', '机械生物', '蒸汽朋克', '赛博朋克', '奇幻', '古代', '现代', '黑暗', '超现实', '自然环境', '民间传说', '寻宝', '西幻', '科幻', '宗教', '和风', '复仇', '侠盗', '心理', '狩猎', '惊悚', '中世纪', '医疗模拟', '历史', '钓鱼', '西部', '心理恐怖', '唯美', '克苏鲁', '治愈', '氛围', '古希腊', '喜剧', '洛夫克拉夫特式', '密室逃脱', '探险', '黑色幽默', '公路', 'LGBTQ+', '灵异', '机甲', '吸血鬼', '青春', '医院', '超英', '反乌托邦', '龙', '手绘风', '经营', '迷幻'];
            const EDIT_GAMEPLAY_OPTIONS = ['动作', '角色扮演', '冒险', '生物收集', '射击', '策略', '模拟', '休闲', '解谜', '益智', '格斗', '竞速', '音乐/节奏', '视觉小说', '生存', 'Roguelike', '类银河恶魔城', '开放世界', '潜行', '多人联机', '弹幕射击', '选择取向', '魂/类魂', '指向点击', '养成', '建造', '种地', '卡牌', '回合制', '走路模拟器', '隐藏物品', '平台', 'VR', '沙盒', '装饰', '整理', '砍杀', '塔防', '跑酷', '跳跃', '赛车/驾驶', '探索', '烹饪', '牌组构建', '自走棋', '刷宝', '弹幕', '密室逃脱'];
            const EDIT_PLATFORM_OPTIONS = ['PC', 'PS', 'Xbox', '移动端', 'NS1', 'NS2', '全平台', 'nds/3ds'];

            function getDefaultGameData() {
                return {
                    id: null, title: '', englishName: '', cover: '', description: '', fullDescription: '',
                    genre: [], gameplay: [], perspective: '第三人称', releaseDate: '',
                    hasChinese: '有中文', platforms: ['PC'], heroineType: '固定女主',
                    costumeType: '服设合理', hasMacSupport: '不支持Mac', steamLink: '',
                    steamAppId: '', isPSExclusive: false, isNSExclusive: false,
                    hasDemo: false, mainStoryDuration: '', lowestPrice: '', videos: [],
                    screenshots: [], otherLinks: '', isReleased: true,
                    series: '', seriesOrder: 0
                };
            }

            function getNextId() {
                if (!games || games.length === 0) return 3;
                const ids = games.map(g => Number(g.id)).filter(id => !isNaN(id));
                if (ids.length === 0) return 3;
                return Math.max(...ids) + 1;
            }

            function showEditModal(game) {
                if (!isAdmin) { showToast('⚠️ 仅管理员可编辑', 1500); return; }
                const overlay = document.getElementById('editModalOverlay');
                const modal = document.getElementById('editModal');
                if (!overlay || !modal) return;

                const isNew = !game;
                let data = game || getDefaultGameData();
                editingGameId = game ? game.id : null;

                const renderEditForm = (formData) => {
                    const genreTags = getAllGenres().sort((a, b) => a.localeCompare(b, 'zh')).map(g =>
                        `<span class="tag-option${(formData.genre || []).includes(g) ? ' selected' : ''}" data-field="genre" data-value="${escapeHTML(g)}">${escapeHTML(g)}</span>`
                    ).join('');
                    const gameplayTags = getAllGameplays().sort((a, b) => a.localeCompare(b, 'zh')).map(g =>
                        `<span class="tag-option${(formData.gameplay || []).includes(g) ? ' selected' : ''}" data-field="gameplay" data-value="${escapeHTML(g)}">${escapeHTML(g)}</span>`
                    ).join('');
                    const platformTags = EDIT_PLATFORM_OPTIONS.map(p =>
                        `<span class="tag-option${(formData.platforms || []).includes(p) ? ' selected' : ''}" data-field="platforms" data-value="${escapeHTML(p)}">${escapeHTML(p)}</span>`
                    ).join('');

                    modal.innerHTML = `
                        <button class="modal-close" onclick="closeEditModal()">✕</button>
                        <h2 style="margin-bottom:14px;color:var(--accent);">${isNew ? '➕ 添加新游戏' : '✏️ 编辑游戏'}</h2>
                        <div class="form-row">
                            <div class="form-group" style="flex:2;"><label>游戏名称 *</label><input type="text" id="efTitle" value="${escapeHTML(formData.title || '')}" required></div>
                            <div class="form-group"><label>${formData.isReleased ? '发售日期' : '预计发售日'}</label><input type="date" id="efReleaseDate" value="${escapeHTML(formData.releaseDate || '')}"></div>
                        </div>
                        <div class="form-row">
                            <div class="form-group" style="flex:2;"><label>英文名</label><input type="text" id="efEnglishName" value="${escapeHTML(formData.englishName || '')}" placeholder="Mages of Mystralia"></div>
                        </div>
                        <div class="checkbox-group" style="margin:8px 0;"><label><input type="checkbox" id="efIsReleased" ${formData.isReleased ? 'checked' : ''}> 已发售游戏</label></div>
                        <div class="form-group"><label>Steam App ID</label><input type="text" id="efSteamAppId" value="${escapeHTML(formData.steamAppId || '')}">
                        <button type="button" class="btn btn-sm" id="btnFetchCover" style="margin-top:4px;">🖼 从Steam获取封面</button></div>
                        <div class="form-group"><label>封面URL</label><input type="text" id="efCover" value="${escapeHTML(formData.cover || '')}"></div>
                        <div class="form-group"><label>简介</label><textarea id="efDescription" rows="2">${escapeHTML(formData.description || '')}</textarea></div>
                        <div class="form-group"><label>详细简介</label><textarea id="efFullDescription" rows="3">${escapeHTML(formData.fullDescription || '')}</textarea></div>
                        <div class="form-group"><label>📖 题材</label><div class="tag-select-panel" id="efGenrePanel">${genreTags}</div>
                        <div class="add-tag-row"><input type="text" id="efNewGenre" placeholder="自定义题材"><button type="button" class="btn btn-sm" id="btnAddGenre">＋</button></div></div>
                        <div class="form-group"><label>🎮 玩法</label><div class="tag-select-panel" id="efGameplayPanel">${gameplayTags}</div>
                        <div class="add-tag-row"><input type="text" id="efNewGameplay" placeholder="自定义玩法"><button type="button" class="btn btn-sm" id="btnAddGameplay">＋</button></div></div>
                        <div class="form-row">
                            <div class="form-group"><label>👁 视角</label><select id="efPerspective">${['第一人称', '第三人称', '可切换人称', '横版'].map(p => `<option value="${p}" ${formData.perspective === p ? 'selected' : ''}>${p}</option>`).join('')}</select></div>
                            <div class="form-group"><label>👤 主角分类</label><select id="efHeroineType">${['固定女主', '可选女主', '动物女主', '双女主', '多主角含女主', '无明确性别默认女'].map(h => `<option value="${h}" ${formData.heroineType === h ? 'selected' : ''}>${h}</option>`).join('')}</select></div>
                            <div class="form-group"><label>👕 服设分类</label><select id="efCostumeType">${['服设合理', '服设不合理', '含恶俗设计', '服设可自选'].map(c => `<option value="${c}" ${formData.costumeType === c ? 'selected' : ''}>${c}</option>`).join('')}</select></div>
                        </div>
                        <div class="form-row">
                            <div class="form-group"><label>📚 所属系列</label><input type="text" id="efSeries" value="${escapeHTML(formData.series || '')}" placeholder="如：地平线、猎天使魔女（留空=无系列）"></div>
                            <div class="form-group" style="max-width:120px;"><label>系列排序</label><input type="number" id="efSeriesOrder" value="${formData.seriesOrder || 0}" min="0" placeholder="0"></div>
                        </div>
                        <div class="form-group"><label>🌐 中文</label><select id="efHasChinese">${['有中文', '无中文'].map(c => `<option value="${c}" ${formData.hasChinese === c ? 'selected' : ''}>${c}</option>`).join('')}</select></div>
                        <div class="form-group" id="efMacRow"><label>🍎 Mac适配</label><select id="efHasMacSupport"><option value="支持Mac" ${formData.hasMacSupport === '支持Mac' ? 'selected' : ''}>支持Mac</option><option value="不支持Mac" ${formData.hasMacSupport === '不支持Mac' ? 'selected' : ''}>不支持Mac</option></select></div>
                        <div class="form-row">
                            <div class="form-group"><label>🎮 Demo</label><select id="efHasDemo"><option value="0" ${!formData.hasDemo ? 'selected' : ''}>暂无</option><option value="1" ${formData.hasDemo ? 'selected' : ''}>有Demo</option></select></div>
                            <div class="form-group" id="efDurationPriceGroup"><label>⏱ 时长</label><input type="text" id="efMainStoryDuration" value="${escapeHTML(formData.mainStoryDuration || '')}"></div>
                            <div class="form-group" id="efPriceGroup"><label>💰 最低价</label><input type="text" id="efLowestPrice" value="${escapeHTML(formData.lowestPrice || '')}"></div>
                        </div>
                        <div class="form-group"><label>🖥 平台</label><div class="tag-select-panel" id="efPlatformsPanel">${platformTags}</div></div>
                        <div class="form-group"><label>Steam链接</label><input type="text" id="efSteamLink" value="${escapeHTML(formData.steamLink || '')}"></div>
                        <div class="form-group"><label>其他链接</label><textarea id="efOtherLinks" rows="2">${escapeHTML(formData.otherLinks || '')}</textarea></div>
                        <div class="checkbox-group"><label><input type="checkbox" id="efPSExclusive" ${formData.isPSExclusive ? 'checked' : ''}> PS独占</label>
                        <label><input type="checkbox" id="efNSExclusive" ${formData.isNSExclusive ? 'checked' : ''}> NS独占</label></div>
                        <div class="form-group"><label>视频链接</label><textarea id="efVideos" rows="2">${(formData.videos || []).join('\n')}</textarea></div>
                        <div class="form-group"><label>截图URL</label><textarea id="efScreenshots" rows="2">${(formData.screenshots || []).join('\n')}</textarea></div>
                        <div style="display:flex;gap:10px;margin-top:16px;">
                            <button type="button" class="btn btn-accent" id="btnSaveGame">💾 保存</button>
                            <button type="button" class="btn" onclick="closeEditModal()">取消</button>
                        </div>`;

                    overlay.classList.add('show');
                    document.body.style.overflow = 'hidden';
                };

                const bindEditFormEvents = () => {
                    modal.querySelectorAll('.tag-select-panel').forEach(p => {
                        p.addEventListener('click', function (e) {
                            const t = e.target.closest('.tag-option');
                            if (t) t.classList.toggle('selected');
                        });
                    });

                    const btnAddGenre = modal.querySelector('#btnAddGenre');
                    if (btnAddGenre) {
                        btnAddGenre.addEventListener('click', function () {
                            const inp = modal.querySelector('#efNewGenre');
                            const tag = (inp.value || '').trim();
                            if (!tag) return;
                            if (getAllGenres().includes(tag)) { showToast('该题材已存在', 1200); return; }
                            customGenres.push(tag);
                            saveCustomTagsToStorage();
                            const panel = modal.querySelector('#efGenrePanel');
                            const sp = document.createElement('span');
                            sp.className = 'tag-option selected';
                            sp.dataset.field = 'genre';
                            sp.dataset.value = tag;
                            sp.textContent = tag;
                            panel.appendChild(sp);
                            inp.value = '';
                            showToast('✅ 已添加自定义题材', 1200);
                        });
                    }

                    const btnAddGameplay = modal.querySelector('#btnAddGameplay');
                    if (btnAddGameplay) {
                        btnAddGameplay.addEventListener('click', function () {
                            const inp = modal.querySelector('#efNewGameplay');
                            const tag = (inp.value || '').trim();
                            if (!tag) return;
                            if (getAllGameplays().includes(tag)) { showToast('该玩法已存在', 1200); return; }
                            customGameplays.push(tag);
                            saveCustomTagsToStorage();
                            const panel = modal.querySelector('#efGameplayPanel');
                            const sp = document.createElement('span');
                            sp.className = 'tag-option selected';
                            sp.dataset.field = 'gameplay';
                            sp.dataset.value = tag;
                            sp.textContent = tag;
                            panel.appendChild(sp);
                            inp.value = '';
                            showToast('✅ 已添加自定义玩法', 1200);
                        });
                    }

                    const btnFetch = modal.querySelector('#btnFetchCover');
                    if (btnFetch) {
                        btnFetch.addEventListener('click', function () {
                            const id = (modal.querySelector('#efSteamAppId') || {}).value || '';
                            if (!id.trim()) { showToast('请输入App ID', 1200); return; }
                            modal.querySelector('#efCover').value = `https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/${id.trim()}/header.jpg`;
                        });
                    }

                    const isReleasedCheck = modal.querySelector('#efIsReleased');
                    if (isReleasedCheck) {
                        isReleasedCheck.addEventListener('change', function () {
                            toggleReleasedFields(modal, this.checked);
                        });
                        toggleReleasedFields(modal, isReleasedCheck.checked);
                    }

                    const dateInput = modal.querySelector('#efReleaseDate');
                    if (dateInput) {
                        dateInput.addEventListener('paste', function (e) {
                            e.preventDefault();
                            const text = (e.clipboardData || window.clipboardData).getData('text') || '';
                            const parsed = parseDateInput(text.trim());
                            this.value = parsed || text.trim();
                        });
                        dateInput.addEventListener('blur', function () {
                            const v = this.value.trim();
                            if (!v || /^\d{4}-\d{2}-\d{2}$/.test(v)) return;
                            const parsed = parseDateInput(v);
                            if (parsed) this.value = parsed;
                        });
                    }

                    const btnSave = modal.querySelector('#btnSaveGame');
                    if (btnSave) {
                        btnSave.addEventListener('click', function () { saveGameFromForm(modal); });
                    }
                };

                // 编辑且列表查询缺失详细字段时，先从云端补齐（防止保存时把旧数据覆盖成空）
                // ★ 列表查询已包含 screenshots，但旧缓存可能缺失，补拉时一起查
                const hasFullFields = !!data.fullDescription
                    && Array.isArray(data.screenshots) && Array.isArray(data.videos);
                if (isNew || hasFullFields) {
                    renderEditForm(data);
                    bindEditFormEvents();
                } else {
                    overlay.classList.add('show');
                    document.body.style.overflow = 'hidden';
                    modal.innerHTML = `<div style="padding:40px 20px;text-align:center;color:var(--text2);">
                        <div style="font-size:2rem;margin-bottom:10px;">⏳</div>
                        <div>正在加载完整编辑数据…</div>
                        <div style="font-size:0.8rem;margin-top:8px;color:var(--text3);">（从云端获取详细简介、截图和视频链接）</div>
                    </div>`;
                    loadGameDetailFromSupabase(editingGameId).then(detail => {
                        if (detail) {
                            if (detail.fullDescription) data.fullDescription = detail.fullDescription;
                            if (Array.isArray(detail.screenshots)) data.screenshots = detail.screenshots;
                            if (Array.isArray(detail.videos)) data.videos = detail.videos;
                        }
                        renderEditForm(data);
                        bindEditFormEvents();
                    }).catch(() => {
                        renderEditForm(data);
                        bindEditFormEvents();
                        showToast('⚠️ 补充加载失败，编辑缺少的字段可能为空', 2000);
                    });
                }
            }

            function closeEditModal() {
                const overlay = document.getElementById('editModalOverlay');
                if (overlay) overlay.classList.remove('show');
                document.body.style.overflow = '';
                editingGameId = null;
            }
            window.closeEditModal = closeEditModal;

            function parseDateInput(s) {
                if (!s) return '';
                if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
                const m = s.match(/(\d{4})\s*[年.\-\/\s]\s*(\d{1,2})\s*[月.\-\/\s]\s*(\d{1,2})\s*[日号]?/);
                if (m) return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`;
                return '';
            }

            function toggleReleasedFields(modal, isReleased) {
                const costume = modal.querySelector('#efCostumeType')?.closest('.form-group');
                const macRow = modal.querySelector('#efMacRow');
                const dur = modal.querySelector('#efDurationPriceGroup');
                const price = modal.querySelector('#efPriceGroup');
                if (costume) costume.style.display = isReleased ? '' : 'none';
                if (macRow) macRow.style.display = isReleased ? '' : 'none';
                if (dur) dur.style.display = isReleased ? '' : 'none';
                if (price) price.style.display = isReleased ? '' : 'none';
                const dateLabel = modal.querySelector('#efReleaseDate')?.closest('.form-group')?.querySelector('label');
                if (dateLabel) dateLabel.textContent = isReleased ? '发售日期' : '预计发售日';
            }

            async function saveGameFromForm(modal) {
                if (!isAdmin) { showToast('⚠️ 仅管理员可操作', 1500); return; }
                const getVal = id => (modal.querySelector('#' + id) || {}).value || '';
                const getCheck = id => (modal.querySelector('#' + id) || {}).checked || false;
                const getTags = id => {
                    const p = modal.querySelector('#' + id);
                    return p ? Array.from(p.querySelectorAll('.tag-option.selected')).map(t => t.dataset.value) : [];
                };
                const title = getVal('efTitle').trim();
                if (!title) { showToast('⚠️ 请输入游戏名称', 1500); return; }

                const gameData = {
                    id: editingGameId || getNextId(),
                    title,
                    englishName: getVal('efEnglishName').trim(),
                    cover: getVal('efCover').trim(),
                    description: getVal('efDescription').trim(),
                    fullDescription: getVal('efFullDescription').trim(),
                    genre: getTags('efGenrePanel'),
                    gameplay: getTags('efGameplayPanel'),
                    perspective: getVal('efPerspective') || '第三人称',
                    releaseDate: getVal('efReleaseDate').trim(),
                    hasChinese: getVal('efHasChinese') || '有中文',
                    platforms: getTags('efPlatformsPanel'),
                    heroineType: getVal('efHeroineType') || '固定女主',
                    costumeType: getVal('efCostumeType') || '服设合理',
                    hasMacSupport: getVal('efHasMacSupport') || '不支持Mac',
                    steamLink: getVal('efSteamLink').trim(),
                    steamAppId: getVal('efSteamAppId').trim(),
                    isPSExclusive: getCheck('efPSExclusive'),
                    isNSExclusive: getCheck('efNSExclusive'),
                    hasDemo: getVal('efHasDemo') === '1',
                    mainStoryDuration: getVal('efMainStoryDuration').trim(),
                    lowestPrice: getVal('efLowestPrice').trim(),
                    videos: getVal('efVideos').split('\n').filter(l => l.trim()),
                    screenshots: getVal('efScreenshots').split('\n').filter(l => l.trim()),
                    otherLinks: getVal('efOtherLinks').trim(),
                    isReleased: getCheck('efIsReleased'),
                    series: getVal('efSeries').trim(),
                    seriesOrder: parseInt(getVal('efSeriesOrder')) || 0
                };

                // 保留草稿标记：缓冲区中的游戏编辑保存后仍为草稿，上架由缓冲区「上架」按钮触发
                const _editExisting = games.find(g => g.id === gameData.id);
                if (_editExisting && _editExisting.isDraft) gameData.isDraft = true;

                for (const field of ['cover', 'steamLink']) {
                    const val = gameData[field];
                    if (val) { try { new URL(val); } catch (_) { showToast('⚠️ ' + field + ' 格式无效', 1500); return; } }
                }
                for (const field of ['videos', 'screenshots']) {
                    for (const url of (gameData[field] || [])) {
                        if (url) { try { new URL(url); } catch (_) { showToast('⚠️ ' + field + ' 中包含无效URL', 1500); return; } }
                    }
                }

                const client = getSupabase();
                if (client) {
                    setSyncStatus('syncing');
                    const { error } = await client.from('games').upsert(gameData, { onConflict: 'id' });
                    if (error) {
                        setSyncStatus('error', error.message);
                        showToast('❌ 保存失败: ' + error.message, 2500);
                        return;
                    }
                }

                const idx = games.findIndex(g => g.id === gameData.id);
                if (idx >= 0) games[idx] = gameData;
                else games.push(gameData);

                const oldCard = _cardMap.get(gameData.id);
                if (oldCard) {
                    const old3d = card3DListeners.find(item => item.el === oldCard);
                    if (old3d) {
                        oldCard.removeEventListener('mousemove', old3d.handler);
                        oldCard.removeEventListener('mouseleave', old3d.leave);
                        card3DListeners = card3DListeners.filter(item => item.el !== oldCard);
                    }
                    _cardMap.delete(gameData.id);
                    _cardEventBound.delete(oldCard);
                }
                closeEditModal();
                renderGallery();
                if (document.getElementById('bufferModalOverlay')?.classList.contains('show')) renderBuffer();
                try { localStorage.setItem(STORAGE_KEY, JSON.stringify(games)); } catch (_) {}
                invalidateSyncCache();
                showToast(`✅ "${title}" 已保存`, 2000);
                setSyncStatus('synced');
            }

            async function deleteGame(gameId) {
                if (!isAdmin) { showToast('⚠️ 仅管理员可操作', 1500); return; }
                const client = getSupabase();
                if (client) {
                    setSyncStatus('syncing');
                    const { error } = await client.from('games').delete().eq('id', gameId);
                    if (error) {
                        setSyncStatus('error', error.message);
                        showToast('❌ 删除失败: ' + error.message, 2500);
                        return;
                    }
                }
                games = games.filter(g => g.id !== gameId);
                renderGallery();
                invalidateSyncCache();
                showToast('✅ 已删除', 1500);
                setSyncStatus('synced');
            }

            // ================================================================
            // 导入缓冲区（草稿区）：仅管理员可见
            //   CSV 导入 → 缓冲区 → 完善信息 → 「上架」→ 按发售日自动分流总览
            // ================================================================
            function getDraftGames() {
                return (games || []).filter(g => g.isDraft);
            }

            function computeReleased(releaseDate) {
                const d = (releaseDate || '').trim();
                if (!d) return true;
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const rd = new Date(String(d).replace(/-/g, '/'));
                if (isNaN(rd.getTime())) return true;
                return rd <= today;
            }

            // 有效发售状态：手动标记已发售，或发售日已到期（未发售板块的游戏到期自动视为已发售）
            function isGameReleased(game) {
                if (!game) return false;
                if (game.isReleased) return true;
                const d = (game.releaseDate || '').trim();
                if (!d) return false;
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const rd = new Date(String(d).replace(/-/g, '/'));
                if (isNaN(rd.getTime())) return false;
                return rd <= today;
            }

            // 管理员加载时：把「发售日已到期但未标记」的游戏落库为已发售，保持数据库/编辑表单/admin.html 一致
            let _autoReleasedSyncing = false;
            async function syncAutoReleasedGames() {
                if (!isAdmin || _autoReleasedSyncing) return;
                const flips = (games || []).filter(g => !g.isDraft && !g.isReleased && isGameReleased(g));
                if (flips.length === 0) return;
                _autoReleasedSyncing = true;
                try {
                    flips.forEach(g => g.isReleased = true);
                    const client = getSupabase();
                    if (client) {
                        for (let i = 0; i < flips.length; i += 50) {
                            const batch = flips.slice(i, i + 50).map(g => ({ id: g.id, isReleased: true }));
                            const { error } = await client.from('games').upsert(batch, { onConflict: 'id' });
                            if (error) { console.warn('[Sync] 自动上架同步失败:', error.message); return; }
                        }
                    }
                    saveGamesToLocal();
                    invalidateSyncCache();
                    console.log(`[Sync] 自动上架：已将 ${flips.length} 款到期游戏标记为已发售`);
                } finally {
                    _autoReleasedSyncing = false;
                }
            }

            function saveGamesToLocal() {
                try { localStorage.setItem(STORAGE_KEY, JSON.stringify(games)); } catch (_) {}
            }

            function renderBuffer() {
                const modal = document.getElementById('bufferModal');
                if (!modal) return;
                const drafts = getDraftGames();
                if (drafts.length === 0) {
                    modal.innerHTML = `
                        <button class="modal-close" onclick="closeBuffer()">✕</button>
                        <h2 style="margin-bottom:14px;color:var(--accent);">🗂 导入缓冲区</h2>
                        <div style="padding:30px 10px;text-align:center;color:var(--text3);">
                            <div style="font-size:2rem;margin-bottom:10px;">📭</div>
                            <div>缓冲区为空</div>
                            <div style="font-size:0.82rem;margin-top:6px;">CSV 导入的游戏会先到这里，完善信息后点击「上架」</div>
                        </div>`;
                    return;
                }
                modal.innerHTML = `
                    <button class="modal-close" onclick="closeBuffer()">✕</button>
                    <h2 style="margin-bottom:4px;color:var(--accent);">🗂 导入缓冲区</h2>
                    <div style="font-size:0.82rem;color:var(--text3);margin-bottom:14px;">共 ${drafts.length} 款待完善 · 完善后点「上架」即按发售日自动进入总览（已发售/未发售）</div>
                    <div class="buffer-list">
                        ${drafts.map(g => `
                            <div class="buffer-item">
                                <div class="buffer-info">
                                    <div class="buffer-title">${escapeHTML(g.title || '未命名')}</div>
                                    <div class="buffer-meta">${escapeHTML((g.genre || []).slice(0, 3).join(' · ') || '暂无题材')}${g.releaseDate ? ' · 发售日 ' + escapeHTML(g.releaseDate) : ''}</div>
                                </div>
                                <div class="buffer-actions">
                                    <button class="btn btn-sm" onclick="editDraft(${g.id})">✏️ 编辑</button>
                                    <button class="btn btn-sm btn-accent" onclick="publishDraft(${g.id})">🚀 上架</button>
                                    <button class="btn btn-sm" onclick="deleteDraft(${g.id})">🗑 删除</button>
                                </div>
                            </div>`).join('')}
                    </div>
                    <div class="buffer-footer" style="display:flex;gap:10px;margin-top:16px;flex-wrap:wrap;">
                        <button type="button" class="btn btn-accent" onclick="publishAllDrafts()">🚀 全部上架</button>
                        <button type="button" class="btn" onclick="closeBuffer()">关闭</button>
                        <button type="button" class="btn" style="margin-left:auto;color:var(--danger);" onclick="clearBuffer()">🗑 清空缓冲区</button>
                    </div>`;
            }

            function openBuffer() {
                if (!isAdmin) { showToast('⚠️ 仅管理员可查看缓冲区', 1500); return; }
                renderBuffer();
                const overlay = document.getElementById('bufferModalOverlay');
                if (overlay) {
                    overlay.classList.add('show');
                    document.body.style.overflow = 'hidden';
                }
            }
            window.openBuffer = openBuffer;

            function closeBuffer() {
                const overlay = document.getElementById('bufferModalOverlay');
                if (overlay) overlay.classList.remove('show');
                document.body.style.overflow = '';
            }
            window.closeBuffer = closeBuffer;

            window.editDraft = function (id) {
                const g = games.find(x => x.id === id);
                if (!g) return;
                showEditModal(g);
            };

            window.publishDraft = async function (id) {
                if (!isAdmin) { showToast('⚠️ 仅管理员可操作', 1500); return; }
                const g = games.find(x => x.id === id);
                if (!g) return;
                const title = g.title || '未命名';
                if (!g.cover && !g.description && (g.genre || []).length === 0) {
                    if (!confirm(`「${title}」信息还不完整（无封面/简介/题材），确定要上架吗？`)) return;
                }
                g.isDraft = false;
                g.isReleased = computeReleased(g.releaseDate);
                const client = getSupabase();
                if (client) {
                    setSyncStatus('syncing');
                    const { error } = await client.from('games').upsert(g, { onConflict: 'id' });
                    if (error) {
                        setSyncStatus('error', error.message);
                        showToast('❌ 上架失败: ' + error.message, 2500);
                        return;
                    }
                }
                saveGamesToLocal();
                invalidateSyncCache();
                renderGallery();
                if (document.getElementById('bufferModalOverlay')?.classList.contains('show')) renderBuffer();
                setSyncStatus('synced');
                showToast(`🚀 "${title}" 已上架，按发售日进入${g.isReleased ? '已发售' : '未发售'}`, 2400);
            };

            window.publishAllDrafts = async function () {
                if (!isAdmin) { showToast('⚠️ 仅管理员可操作', 1500); return; }
                const drafts = getDraftGames();
                if (drafts.length === 0) { showToast('缓冲区为空', 1500); return; }
                drafts.forEach(g => {
                    g.isDraft = false;
                    g.isReleased = computeReleased(g.releaseDate);
                });
                const client = getSupabase();
                if (client) {
                    setSyncStatus('syncing');
                    for (let i = 0; i < drafts.length; i += 50) {
                        const batch = drafts.slice(i, i + 50);
                        const { error } = await client.from('games').upsert(batch, { onConflict: 'id' });
                        if (error) {
                            setSyncStatus('error', error.message);
                            showToast('❌ 上架失败: ' + error.message, 2500);
                            return;
                        }
                    }
                }
                saveGamesToLocal();
                invalidateSyncCache();
                renderGallery();
                if (document.getElementById('bufferModalOverlay')?.classList.contains('show')) renderBuffer();
                setSyncStatus('synced');
                showToast(`🚀 已上架 ${drafts.length} 款游戏`, 2200);
            };

            window.deleteDraft = function (id) {
                const g = games.find(x => x.id === id);
                if (!g) return;
                if (!confirm(`确定从缓冲区删除「${g.title || '未命名'}」？将同时从云端删除该记录。`)) return;
                deleteGame(id).then(() => {
                    if (document.getElementById('bufferModalOverlay')?.classList.contains('show')) renderBuffer();
                });
            };

            window.clearBuffer = function () {
                const drafts = getDraftGames();
                if (drafts.length === 0) { showToast('缓冲区为空', 1500); return; }
                if (!confirm(`确定清空缓冲区（共 ${drafts.length} 款）？将同时从云端删除这些记录，且无法恢复。`)) return;
                (async () => {
                    const client = getSupabase();
                    if (client) {
                        setSyncStatus('syncing');
                        for (const g of drafts) {
                            const { error } = await client.from('games').delete().eq('id', g.id);
                            if (error) {
                                setSyncStatus('error', error.message);
                                showToast('❌ 清空失败: ' + error.message, 2500);
                                return;
                            }
                        }
                    }
                    games = games.filter(g => !g.isDraft);
                    saveGamesToLocal();
                    invalidateSyncCache();
                    renderGallery();
                    if (document.getElementById('bufferModalOverlay')?.classList.contains('show')) renderBuffer();
                    setSyncStatus('synced');
                    showToast('🗑 缓冲区已清空', 1500);
                })();
            };

            // ================================================================
            // 网页内投稿：用户提交 → 缓冲区（isDraft）→ 管理员补全后上架
            // ================================================================
            const SUBMIT_THROTTLE_KEY = 'heroineSubmitThrottle';
            const SUBMIT_THROTTLE_MS = 30000;

            function submitThrottleLeft() {
                try {
                    const last = Number(localStorage.getItem(SUBMIT_THROTTLE_KEY) || 0);
                    return Math.max(0, SUBMIT_THROTTLE_MS - (Date.now() - last));
                } catch (_) { return 0; }
            }

            function openSubmitModal() {
                const overlay = document.getElementById('submitModalOverlay');
                if (!overlay) {
                    // 兜底：弹窗缺失时退回原飞书问卷入口
                    const link = document.getElementById('navSubmit');
                    if (link && link.href) window.open(link.href, '_blank', 'noopener,noreferrer');
                    return;
                }
                const left = submitThrottleLeft();
                if (left > 0) {
                    showToast(`⏳ 请 ${Math.ceil(left / 1000)} 秒后再投稿`, 2000);
                    return;
                }
                overlay.classList.add('show');
                document.body.style.overflow = 'hidden';
                const titleInput = document.getElementById('sfTitle');
                if (titleInput) setTimeout(() => titleInput.focus(), 120);
            }
            window.openSubmitModal = openSubmitModal;

            function closeSubmitModal() {
                const overlay = document.getElementById('submitModalOverlay');
                if (overlay) overlay.classList.remove('show');
                document.body.style.overflow = '';
            }
            window.closeSubmitModal = closeSubmitModal;

            async function submitGameFromForm() {
                const getVal = id => (document.getElementById(id) || {}).value || '';
                const title = getVal('sfTitle').trim();
                if (!title) { showToast('⚠️ 请输入游戏名称', 1800); return; }
                // 精确重名拦截（含缓冲区草稿）：中文名或英文名任一匹配即拦截
                const dupTitle = title.toLowerCase();
                const dupExact = games.find(g => {
                    if (g.id === 1 || g.id === 2 || !g.title) return false;
                    return g.title.trim().toLowerCase() === dupTitle ||
                        (g.englishName && g.englishName.trim().toLowerCase() === dupTitle);
                });
                if (dupExact) { showToast('⚠️ 该游戏已在库中，请勿重复投稿', 2400); return; }
                const steamLink = getVal('sfSteamLink').trim();
                if (steamLink) {
                    try { new URL(steamLink); } catch (_) { showToast('⚠️ Steam链接格式无效', 1800); return; }
                }
                if (currentUser) {
                    const banned = await isCurrentUserBanned();
                    if (banned) { showToast('🚫 您已被限制投稿', 2000); return; }
                }
                // 安全取 id：以本地最大值为基准，同时参考云端当前最大 id，避免陈旧缓存导致覆盖已有记录
                let nextId = getNextId();
                const client = getSupabase();
                if (client) {
                    try {
                        const { data: maxRows } = await client.from('games')
                            .select('id')
                            .order('id', { ascending: false })
                            .limit(1);
                        const maxId = maxRows && maxRows.length > 0 ? Number(maxRows[0].id) : 0;
                        if (maxId >= nextId) nextId = maxId + 1;
                    } catch (_) {}
                }
                const game = {
                    id: nextId,
                    title,
                    perspective: getVal('sfPerspective') || '第三人称',
                    costumeType: getVal('sfCostumeType') || '服设合理',
                    heroineType: getVal('sfHeroineType') || '固定女主',
                    steamLink,
                    description: '', fullDescription: '',
                    genre: [], gameplay: [], platforms: ['PC'],
                    hasChinese: '无中文', releaseDate: '',
                    lowestPrice: '', hasDemo: false, mainStoryDuration: '',
                    cover: '', steamAppId: '', isPSExclusive: false, isNSExclusive: false,
                    hasMacSupport: '不支持Mac', videos: [], screenshots: [],
                    otherLinks: '', isReleased: false,
                    isDraft: true, // ★ 用户投稿先进缓冲区，管理员补全后上架
                    series: '', seriesOrder: 0
                };
                if (client) {
                    const { error } = await client.from('games').upsert(game, { onConflict: 'id' });
                    if (error) {
                        if (/isDraft|is_draft|column|permission|policy|row-level|new row violates/i.test(error.message)) {
                            showToast('⚠️ 投稿暂时不可用，请稍后再试', 2800);
                        } else {
                            showToast('❌ 投稿提交失败: ' + error.message, 2500);
                        }
                        return;
                    }
                }
                games.push(game);
                saveGamesToLocal();
                invalidateSyncCache();
                if (document.getElementById('bufferModalOverlay')?.classList.contains('show')) renderBuffer();
                try { localStorage.setItem(SUBMIT_THROTTLE_KEY, String(Date.now())); } catch (_) {}
                ['sfTitle', 'sfSteamLink'].forEach(id => {
                    const el = document.getElementById(id);
                    if (el) el.value = '';
                });
                closeSubmitModal();
                showToast('✅ 投稿成功！管理员补全信息后即会出现在总览', 2600);
            }
            window.submitGameFromForm = submitGameFromForm;

            // 投稿时输入游戏名自动提示库内已有游戏，防止重复投稿
            function setupSubmitTitleAutocomplete() {
                const input = document.getElementById('sfTitle');
                if (!input) return;
                let listEl = input.parentNode.querySelector('.mod-autocomplete-list');
                if (!listEl) {
                    listEl = document.createElement('div');
                    listEl.className = 'mod-autocomplete-list';
                    input.parentNode.appendChild(listEl);
                }
                input.addEventListener('input', function () {
                    const q = this.value.trim().toLowerCase();
                    if (q.length < 1) { listEl.classList.remove('show'); return; }
                    const matches = games.filter(g =>
                        g.id !== 1 && g.id !== 2 &&
                        (
                            (g.title && g.title.toLowerCase().includes(q)) ||
                            (g.englishName && g.englishName.toLowerCase().includes(q))
                        )
                    ).slice(0, 6);
                    if (matches.length === 0) { listEl.classList.remove('show'); return; }
                    listEl.innerHTML = matches.map(g => {
                        const draftTag = g.isDraft ? ' <span class="submit-draft-tag">缓冲区</span>' : '';
                        const enSub = g.englishName && g.englishName.toLowerCase() !== q ?
                            ` <span class="submit-name-sub">${escapeHTML(g.englishName)}</span>` : '';
                        return `<div class="mod-autocomplete-item" data-id="${g.id}" data-title="${escapeHTML(g.title)}">${escapeHTML(g.title)}${enSub}${draftTag}</div>`;
                    }).join('');
                    listEl.classList.add('show');
                    listEl.querySelectorAll('.mod-autocomplete-item').forEach(item => {
                        item.addEventListener('click', function () {
                            input.value = this.dataset.title;
                            listEl.classList.remove('show');
                            showToast('⚠️ 该游戏已在库中，请勿重复投稿', 2200);
                        });
                    });
                });
                input.addEventListener('blur', function () {
                    setTimeout(() => listEl.classList.remove('show'), 200);
                });
            }

            function importCSV(file) {
                if (!isAdmin) { showToast('⚠️ 仅管理员可导入', 1500); return; }
                const reader = new FileReader();
                reader.onload = function (ev) {
                    Papa.parse(ev.target.result, {
                        header: true, skipEmptyLines: true, trimHeaders: true,
                        complete: async function (results) {
                            if (results.errors && results.errors.length) {
                                showToast('⚠️ CSV 解析出错', 2000);
                                return;
                            }
                            let added = 0;
                            const maxImport = 500;
                            for (const row of results.data) {
                                if (added >= maxImport) { showToast('⚠️ 单次最多导入 ' + maxImport + ' 条', 2000); break; }
                                const title = (row['游戏名'] || '').trim();
                                if (!title) continue;
                                const game = {
                                    id: getNextId(),
                                    title,
                                    description: (row['游戏简介'] || '').trim(),
                                    fullDescription: (row['游戏简介'] || '').trim(),
                                    genre: (row['题材'] || '').split(',').map(s => s.trim()).filter(Boolean),
                                    gameplay: (row['类型'] || '').split(',').map(s => s.trim()).filter(Boolean),
                                    perspective: (row['游玩视角'] || '第三人称').trim() || '第三人称',
                                    hasChinese: (row['是否支持中文（简/繁中）'] || '').includes('支持') ? '有中文' : '无中文',
                                    heroineType: (row['主角性别'] || '固定女主').trim() || '固定女主',
                                    releaseDate: (row['发售日'] || '').replace(/\//g, '-').trim(),
                                    costumeType: (row['服饰是否合理'] || '服设合理').includes('恶俗') ? '含恶俗设计' : (row['服饰是否合理'] || '').includes('不合理') ? '服设不合理' : (row['服饰是否合理'] || '').includes('自选') ? '服设可自选' : '服设合理',
                                    lowestPrice: (row['史低（含cdk售卖价格）'] || '').trim(),
                                    hasDemo: (row['Demo试玩'] || '').trim() === '有',
                                    mainStoryDuration: (row['主线通关时长'] || '').trim(),
                                    platforms: (row['游玩平台'] || 'PC').split(',').map(s => s.trim()).filter(Boolean),
                                    cover: '', steamLink: '', steamAppId: '',
                                    isPSExclusive: false, isNSExclusive: false,
                                    hasMacSupport: '', videos: [], screenshots: [],
                                    otherLinks: '', isReleased: true,
                                    isDraft: true, // ★ CSV 导入一律先进入缓冲区，完善后上架
                                    series: (row['系列名'] || '').trim(),
                                    seriesOrder: parseInt(row['系列排序']) || 0
                                };
                                games.push(game);
                                added++;
                            }
                            if (added > 0) {
                                const client = getSupabase();
                                if (client) {
                                    setSyncStatus('syncing');
                                    let upsertError = null;
                                    for (let i = 0; i < games.length; i += 50) {
                                        const batch = games.slice(i, i + 50);
                                        const { error } = await client.from('games').upsert(batch, { onConflict: 'id' });
                                        if (error) { upsertError = error; break; }
                                    }
                                    if (upsertError) {
                                        setSyncStatus('error', upsertError.message);
                                        if (/is_draft|isDraft|column/i.test(upsertError.message || '')) {
                                            showToast('⚠️ 云端缺少 isDraft 列，请在 Supabase 执行 add_is_draft_column.sql', 3500);
                                        } else {
                                            showToast('❌ 同步失败: ' + upsertError.message, 2500);
                                        }
                                    } else {
                                        setSyncStatus('synced');
                                    }
                                }
                                try { localStorage.setItem(STORAGE_KEY, JSON.stringify(games)); } catch (_) {}
                                renderGallery();
                                if (document.getElementById('bufferModalOverlay')?.classList.contains('show')) renderBuffer();
                                invalidateSyncCache();
                                showToast(`📥 已导入 ${added} 款到缓冲区，完善后点击「上架」`, 2500);
                            } else {
                                showToast('⚠️ 没有导入任何游戏', 2000);
                            }
                        }
                    });
                };
                reader.readAsText(file);
                document.getElementById('csvFileInput').value = '';
            }

            // ================================================================
            // 3D 卡片交互
            // ================================================================
            function setupCard3D(card) {
                if (!window.matchMedia('(hover: hover)').matches) return;

                const old = card3DListeners.find(item => item.el === card);
                if (old) {
                    card.removeEventListener('mousemove', old.handler);
                    card.removeEventListener('mouseleave', old.leave);
                    card3DListeners = card3DListeners.filter(item => item.el !== card);
                }

                const parallax = card.querySelector('.card-parallax-bg');
                let rafId = null;

                const handleMove = function (e) {
                    if (rafId) {
                        cancelAnimationFrame(rafId);
                        rafId = null;
                    }
                    rafId = requestAnimationFrame(() => {
                        const rect = card.getBoundingClientRect();
                        const x = (e.clientX - rect.left) / rect.width;
                        const y = (e.clientY - rect.top) / rect.height;
                        const clampedX = Math.max(0, Math.min(1, x));
                        const clampedY = Math.max(0, Math.min(1, y));

                        const rotateX = (clampedY - 0.5) * 2 * -6;
                        const rotateY = (clampedX - 0.5) * 2 * 6;
                        card.style.transform =
                            `translateY(-8px) scale(1.015) perspective(var(--card-perspective)) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;

                        if (parallax) {
                            parallax.style.setProperty('--parallax-x', clampedX * 100 + '%');
                            parallax.style.setProperty('--parallax-y', clampedY * 100 + '%');
                        }
                        rafId = null;
                    });
                };

                const handleLeave = function () {
                    if (rafId) {
                        cancelAnimationFrame(rafId);
                        rafId = null;
                    }
                    card.style.transform = '';
                    if (parallax) {
                        parallax.style.setProperty('--parallax-x', '50%');
                        parallax.style.setProperty('--parallax-y', '50%');
                    }
                };

                card.addEventListener('mousemove', handleMove);
                card.addEventListener('mouseleave', handleLeave);

                card3DListeners.push({
                    el: card,
                    handler: handleMove,
                    leave: handleLeave
                });
            }

            // ================================================================
            // ★ 图片查看器
            // ================================================================
            function openImageViewer(src) {
                const overlay = document.getElementById('imageViewerOverlay');
                const img = document.getElementById('imageViewerImg');
                img.src = src;
                overlay.classList.add('show');
                document.body.style.overflow = 'hidden';
            }

            function closeImageViewer() {
                document.getElementById('imageViewerOverlay').classList.remove('show');
                document.body.style.overflow = '';
            }

            // ================================================================
            // ★ 分享功能 — 生成图片，显示在浮层中 (移动端长按保存)
            // ★ 优化速度：使用更简洁的 DOM，减少等待时间
            // ★ 新增评论分享：生成带评论内容的图片
            // ================================================================

            let currentShareGame = null;
            let _shareOverlayBound = false;
            let shareImageDataURL = null;

            // 快速生成分享卡片 DOM (用于截图)
            async function buildShareCardDOM(game, extraComment) {
                const wrapper = document.createElement('div');
                wrapper.style.cssText =
                    'width:100%;max-width:400px;background:#ffffff;border-radius:20px;overflow:hidden;font-family:Segoe UI,PingFang SC,Microsoft YaHei,sans-serif;color:#1e1822;box-shadow:0 8px 32px rgba(0,0,0,0.12);padding:0;box-sizing:border-box;';

                // 获取评分信息
                let ratingInfo = null;
                try {
                    ratingInfo = await fetchGameRatingStats(game.id);
                } catch (_) { }

                // 如果有评论，在顶部显示
                if (extraComment) {
                    const isReviewObj = typeof extraComment === 'object' && extraComment.comment;
                    const commentArea = document.createElement('div');
                    commentArea.style.cssText =
                        'padding:16px 16px 12px;background:#f8f5fc;border-bottom:2px solid #f0ebf5;';
                    const commentLabel = document.createElement('div');
                    commentLabel.style.cssText =
                        'font-size:0.7rem;font-weight:600;color:#9b8abd;letter-spacing:0.04em;margin-bottom:8px;';
                    commentLabel.textContent = '💬 评论分享';
                    commentArea.appendChild(commentLabel);

                    if (isReviewObj) {
                        const reviewer = extraComment;
                        const reviewerRow = document.createElement('div');
                        reviewerRow.style.cssText = 'display:flex;align-items:center;gap:10px;margin-bottom:10px;';
                        const avatarWrap = document.createElement('div');
                        avatarWrap.style.cssText = 'width:36px;height:36px;border-radius:50%;overflow:hidden;flex-shrink:0;background:#e8e2ee;display:flex;align-items:center;justify-content:center;';
                        if (reviewer.avatarUrl) {
                            const avImg = document.createElement('img');
                            avImg.src = reviewer.avatarUrl;
                            avImg.style.cssText = 'width:100%;height:100%;object-fit:cover;';
                            avImg.crossOrigin = 'anonymous';
                            avImg.referrerPolicy = 'no-referrer';
                            avImg.onerror = function () { this.style.display = 'none'; };
                            avatarWrap.appendChild(avImg);
                        } else {
                            const avPh = document.createElement('span');
                            avPh.style.cssText = 'font-size:1.2rem;';
                            avPh.textContent = '👤';
                            avatarWrap.appendChild(avPh);
                        }
                        reviewerRow.appendChild(avatarWrap);

                        const infoCol = document.createElement('div');
                        infoCol.style.cssText = 'flex:1;min-width:0;';
                        const nameLine = document.createElement('div');
                        nameLine.style.cssText = 'font-size:0.85rem;font-weight:600;color:#1e1822;';
                        nameLine.textContent = reviewer.displayName || '用户';
                        infoCol.appendChild(nameLine);

                        const metaLine = document.createElement('div');
                        metaLine.style.cssText = 'display:flex;align-items:center;gap:8px;margin-top:2px;';
                        if (reviewer.verdict) {
                            const vInfo = getVerdictInfo(reviewer.verdict);
                            if (vInfo) {
                                const verdictSpan = document.createElement('span');
                                verdictSpan.style.cssText = 'font-size:0.8rem;font-weight:600;color:' + vInfo.color + ';';
                                verdictSpan.textContent = vInfo.emoji + ' ' + vInfo.label;
                                metaLine.appendChild(verdictSpan);
                            }
                        }
                        if (reviewer.createdAt) {
                            const dateSpan = document.createElement('span');
                            dateSpan.style.cssText = 'font-size:0.7rem;color:#8c8099;';
                            dateSpan.textContent = new Date(reviewer.createdAt).toLocaleDateString('zh-CN', {
                                year: 'numeric', month: 'long', day: 'numeric'
                            });
                            metaLine.appendChild(dateSpan);
                        }
                        infoCol.appendChild(metaLine);
                        reviewerRow.appendChild(infoCol);
                        commentArea.appendChild(reviewerRow);
                    }

                    const commentText = document.createElement('div');
                    commentText.style.cssText =
                        'font-size:0.9rem;color:#1e1822;line-height:1.6;word-break:break-word;white-space:pre-wrap;';
                    commentText.textContent = isReviewObj ? extraComment.comment : extraComment;
                    commentArea.appendChild(commentText);
                    wrapper.appendChild(commentArea);
                }

                // 封面
                const coverWrap = document.createElement('div');
                coverWrap.style.cssText = 'width:100%;aspect-ratio:460/215;background:#e8e2ee;position:relative;';
                if (game.cover) {
                    const img = document.createElement('img');
                    img.src = game.cover;
                    img.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block;';
                    img.crossOrigin = 'anonymous';
                    coverWrap.appendChild(img);
                } else {
                    const ph = document.createElement('div');
                    ph.style.cssText =
                        'width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:3rem;color:#8c8099;background:#e8e2ee;';
                    ph.innerHTML = SVG_ICONS.gamepad;
                    coverWrap.appendChild(ph);
                }
                if (game.heroineType) {
                    const tag = document.createElement('div');
                    tag.style.cssText =
                        'position:absolute;top:8px;left:8px;background:linear-gradient(135deg,#6b5a8a,#4a3a66);color:#fff;padding:2px 12px;border-radius:20px;font-size:0.65rem;font-weight:700;letter-spacing:0.04em;border:1px solid rgba(255,255,255,0.2);box-shadow:0 2px 14px rgba(60,40,80,0.45);text-shadow:0 1px 3px rgba(0,0,0,0.25);text-transform:uppercase;';
                    tag.textContent = game.heroineType;
                    coverWrap.appendChild(tag);
                }
                wrapper.appendChild(coverWrap);

                // 信息区
                const body = document.createElement('div');
                body.style.cssText = 'padding:14px 16px 10px;';
                const title = document.createElement('div');
                title.style.cssText = 'font-size:1.15rem;font-weight:700;color:#1e1822;line-height:1.3;margin-bottom:2px;';
                title.textContent = game.title || '';
                body.appendChild(title);

                const desc = document.createElement('div');
                desc.style.cssText =
                    'font-size:0.78rem;color:#665c72;line-height:1.5;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;margin-bottom:4px;';
                desc.textContent = game.description || '';
                body.appendChild(desc);

                const meta = document.createElement('div');
                meta.style.cssText = 'display:flex;flex-wrap:wrap;gap:4px;';
                if (game.hasChinese === '有中文') {
                    const sp = document.createElement('span');
                    sp.style.cssText =
                        'font-size:0.6rem;padding:1px 8px;border-radius:10px;background:#9b8abd;color:#fff;font-weight:500;';
                    sp.textContent = '中文';
                    meta.appendChild(sp);
                } else if (game.hasChinese === '无中文') {
                    const sp = document.createElement('span');
                    sp.style.cssText =
                        'font-size:0.6rem;padding:1px 8px;border-radius:10px;background:#8c8099;color:#fff;font-weight:500;';
                    sp.textContent = '无中文';
                    meta.appendChild(sp);
                }
                if (isGameReleased(game)) {
                    (game.genre || []).slice(0, 3).forEach(t => {
                        const sp = document.createElement('span');
                        sp.style.cssText =
                            'font-size:0.6rem;padding:1px 8px;border-radius:10px;background:#f0ebf5;color:#5a4e66;';
                        sp.textContent = t;
                        meta.appendChild(sp);
                    });
                    (game.gameplay || []).slice(0, 2).forEach(t => {
                        const sp = document.createElement('span');
                        sp.style.cssText =
                            'font-size:0.6rem;padding:1px 8px;border-radius:10px;background:#f0ebf5;color:#5a4e66;';
                        sp.textContent = t;
                        meta.appendChild(sp);
                    });
                } else {
                    if (game.hasDemo) {
                        const sp = document.createElement('span');
                        sp.style.cssText =
                            'font-size:0.6rem;padding:1px 8px;border-radius:10px;background:#9b8abd;color:#fff;font-weight:500;';
                        sp.textContent = '有Demo';
                        meta.appendChild(sp);
                    }
                    (game.genre || []).slice(0, 3).forEach(t => {
                        const sp = document.createElement('span');
                        sp.style.cssText =
                            'font-size:0.6rem;padding:1px 8px;border-radius:10px;background:#f0ebf5;color:#5a4e66;';
                        sp.textContent = t;
                        meta.appendChild(sp);
                    });
                }
                if (game.releaseDate) {
                    const sp = document.createElement('span');
                    sp.style.cssText =
                        'font-size:0.6rem;padding:1px 8px;border-radius:10px;background:#f0ebf5;color:#5a4e66;';
                    sp.textContent = game.releaseDate;
                    meta.appendChild(sp);
                }
                body.appendChild(meta);

                // 社区评分
                if (ratingInfo && ratingInfo.average !== null && ratingInfo.count > 0) {
                    const ratingRow = document.createElement('div');
                    ratingRow.style.cssText = 'margin-top:8px;display:flex;align-items:center;gap:8px;';
                    ratingRow.innerHTML = '<span style="font-size:0.9rem;color:#f5a623;">⭐</span><span style="font-size:0.75rem;color:#665c72;">' + ratingInfo.average.toFixed(1) + '/5（' + ratingInfo.count + '人评价）</span>';
                    body.appendChild(ratingRow);
                }

                wrapper.appendChild(body);

                // 底部：二维码 + 品牌
                const footer = document.createElement('div');
                footer.style.cssText =
                    'display:flex;align-items:center;justify-content:space-between;padding:10px 16px 14px;border-top:1px solid #f0ebf5;gap:12px;background:#faf7fd;';

                const qrWrap = document.createElement('div');
                qrWrap.style.cssText = 'display:flex;align-items:center;gap:10px;';
                const qrContainer = document.createElement('div');
                qrContainer.id = 'shareCardQRContainer';
                qrContainer.style.cssText = 'width:72px;height:72px;border-radius:8px;background:#fff;border:1px solid #ddd6e4;flex-shrink:0;overflow:hidden;line-height:0;';
                qrWrap.appendChild(qrContainer);

                const qrLabel = document.createElement('span');
                qrLabel.style.cssText =
                    'font-size:0.6rem;color:#8c8099;line-height:1.3;max-width:80px;text-align:left;';
                qrLabel.textContent = '扫码查看\n游戏详情';
                qrWrap.appendChild(qrLabel);
                footer.appendChild(qrWrap);

                const brand = document.createElement('span');
                brand.style.cssText =
                    'font-size:0.65rem;color:#9b8abd;font-weight:600;letter-spacing:0.04em;text-align:right;flex-shrink:0;';
                brand.textContent = 'Her-Lens · 女性主角游戏';
                footer.appendChild(brand);

                wrapper.appendChild(footer);

                // 生成二维码
                const shareUrl = window.location.origin + window.location.pathname + '?game=' + game.id;
                const qrEl = qrContainer;
                try {
                    const QRCodeLib = await window._loadQRCode();
                    new QRCodeLib(qrEl, {
                        text: shareUrl,
                        width: 72,
                        height: 72,
                        colorDark: '#1e1822',
                        colorLight: '#ffffff',
                        correctLevel: QRCodeLib.CorrectLevel.H
                    });
                    // 强制清除 QRCode.js 添加的内联 margin/padding
                    qrEl.querySelectorAll('img, canvas').forEach(function (el) {
                        el.style.margin = '0';
                        el.style.padding = '0';
                        el.style.maxWidth = '100%';
                        el.style.maxHeight = '100%';
                    });
                } catch (e) {
                    qrEl.innerHTML =
                        `<div style="width:72px;height:72px;display:flex;align-items:center;justify-content:center;font-size:0.5rem;color:#999;background:#f5f0f8;border-radius:8px;">二维码<br/>加载失败</div>`;
                }

                return wrapper;
            }

            // 快速截图（带超时保护）
            async function captureShareCard(wrapper) {
                await new Promise(r => requestAnimationFrame(r));
                await new Promise(r => setTimeout(r, 50));

                const timeoutMs = 20000;
                let timeoutId;
                const timeoutPromise = new Promise(function (_, reject) {
                    timeoutId = setTimeout(function () {
                        reject(new Error('截图生成超时'));
                    }, timeoutMs);
                });

                try {
                    const html2canvasLib = await window._loadHtml2Canvas();
                    const actualWidth = wrapper.offsetWidth || 400;
                    const isMobile = window.innerWidth <= 768 || isTouchDevice;
                    const renderPromise = html2canvasLib(wrapper, {
                        scale: isMobile ? 2 : 2.5,
                        useCORS: true,
                        logging: false,
                        backgroundColor: '#ffffff',
                        allowTaint: true,
                        foreignObjectRendering: false,
                        width: actualWidth,
                        height: wrapper.scrollHeight,
                    });
                    const canvas = await Promise.race([renderPromise, timeoutPromise]);
                    clearTimeout(timeoutId);
                    return canvas.toDataURL('image/png');
                } catch (err) {
                    clearTimeout(timeoutId);
                    console.error('生成分享图片失败:', err);
                    showToast('⚠️ 生成图片失败: ' + (err.message || '未知错误'), 3000);
                    return null;
                }
            }

            // 显示分享浮层
            async function buildShareFloat(game, extraComment) {
                currentShareGame = game;
                const overlay = document.getElementById('shareFloatOverlay');
                const container = document.getElementById('shareImageContainer');

                container.innerHTML = '<div style="padding:40px;text-align:center;color:var(--text3);"><div id="shareProgressText">⏳ 正在加载依赖库...</div><div style="margin-top:12px;width:120px;height:4px;background:var(--border);border-radius:2px;overflow:hidden;margin:12px auto 0;"><div id="shareProgressBar" style="width:0%;height:100%;background:var(--accent);border-radius:2px;transition:width 0.3s;"></div></div></div>';
                overlay.classList.add('show');
                document.body.style.overflow = 'hidden';

                // 先绑定关闭按钮，确保无论生成成功还是失败都能关闭
                const closeBtn = document.getElementById('shareFloatClose');
                const newClose = closeBtn.cloneNode(true);
                closeBtn.parentNode.replaceChild(newClose, closeBtn);
                newClose.addEventListener('click', closeShareFloat);
                if (!_shareOverlayBound) {
                    _shareOverlayBound = true;
                    overlay.addEventListener('click', function (e) {
                        if (e.target === overlay) {
                            closeShareFloat();
                        }
                    });
                }

                const progressText = document.getElementById('shareProgressText');
                const progressBar = document.getElementById('shareProgressBar');

                try {
                    if (progressText) progressText.textContent = '⏳ 正在加载二维码库...';
                    if (progressBar) progressBar.style.width = '20%';
                    const wrapper = await buildShareCardDOM(game, extraComment);

                    if (progressText) progressText.textContent = '⏳ 正在渲染分享卡片...';
                    if (progressBar) progressBar.style.width = '50%';
                    wrapper.style.position = 'fixed';
                    wrapper.style.left = '-9999px';
                    wrapper.style.top = '0';
                    wrapper.style.zIndex = '-1';
                    wrapper.style.pointerEvents = 'none';
                    wrapper.style.width = 'min(400px, calc(100vw - 40px))';
                    document.body.appendChild(wrapper);

                    if (progressText) progressText.textContent = '⏳ 正在生成图片...';
                    if (progressBar) progressBar.style.width = '75%';
                    const dataUrl = await captureShareCard(wrapper);
                    wrapper.remove();

                    if (!dataUrl) {
                        container.innerHTML =
                            '<div style="padding:40px;text-align:center;color:var(--danger);">⚠️ 生成失败，请重试</div><div style="text-align:center;margin-top:12px;"><button class="btn" onclick="closeShareFloat()" style="padding:8px 24px;">关闭</button></div>';
                        return;
                    }

                    if (progressBar) progressBar.style.width = '100%';

                    shareImageDataURL = dataUrl;
                    const img = document.createElement('img');
                    img.src = dataUrl;
                    img.alt = `${game.title} 分享图片`;
                    img.style.cssText = 'width:100%;height:auto;display:block;border-radius:16px;';
                    img.setAttribute('draggable', 'false');
                    container.innerHTML = '';
                    container.appendChild(img);
                } catch (err) {
                    console.error('分享浮层构建失败:', err);
                    container.innerHTML = '<div style="padding:40px;text-align:center;color:var(--danger);">⚠️ 生成失败，请重试</div><div style="text-align:center;margin-top:12px;"><button class="btn" onclick="closeShareFloat()" style="padding:8px 24px;">关闭</button></div>';
                    return;
                }

                const downloadBtn = document.getElementById('shareFloatDownloadBtn');
                const hint = document.getElementById('longPressHint');

                // 判断是否为移动端
                const isMobile = window.innerWidth <= 768 || isTouchDevice;
                if (isMobile) {
                    hint.style.display = 'block';
                    downloadBtn.textContent = '📥 下载图片 (备用)';
                } else {
                    hint.style.display = 'none';
                    downloadBtn.textContent = '📥 下载分享图片';
                }

                // 绑定下载按钮
                const newBtn = downloadBtn.cloneNode(true);
                downloadBtn.parentNode.replaceChild(newBtn, downloadBtn);
                newBtn.addEventListener('click', function () {
                    if (shareImageDataURL) {
                        const link = document.createElement('a');
                        link.download = `HerLens_分享_${game.title || 'game'}_${Date.now()}.png`;
                        link.href = shareImageDataURL;
                        link.click();
                        showToast('✅ 图片已下载！', 2000);
                    }
                });
            }

            function closeShareFloat() {
                const overlay = document.getElementById('shareFloatOverlay');
                overlay.classList.remove('show');
                document.body.style.overflow = '';
                currentShareGame = null;
                shareImageDataURL = null;
                document.getElementById('shareImageContainer').innerHTML = '';
            }
            window.closeShareFloat = closeShareFloat;

            // ================================================================
            // ★ 详情页
            // ================================================================

            function buildDetailScreenshotsHTML(game) {
                const shots = game.screenshots || [];
                if (shots.length === 0) return '<div style="color:var(--text3);font-size:0.85rem;padding:8px 0;">暂无截图</div>';
                return shots.map((url, idx) => {
                    const isVideo = /\.(mp4|webm|mov|avi)(\?|$)/i.test(url);
                    const isGif = !isVideo && /\.gif(\?|$)/i.test(url);
                    if (isVideo) {
                        return `<div class="screenshot-wrap video-wrap"><video src="${escapeHTML(url)}" autoplay loop muted playsinline onclick="this.paused?this.play():this.pause()" /></div>`;
                    }
                    const wrapClass = 'screenshot-wrap' + (isGif ? ' gif-img' : '');
                    const badge = isGif ? '<span class="gif-badge">GIF</span>' : '';
                    const loadingAttr = isGif ? '' : 'loading="lazy"';
                    return `<div class="${wrapClass}"><img ${loadingAttr} src="${escapeHTML(url)}" alt="${escapeHTML(game.title || '游戏')} 截图 ${idx + 1}" data-src="${escapeHTML(url)}" onclick="openImageViewer(this.dataset.src)" />${badge}</div>`;
                }).join('');
            }

            function buildDetailVideosHTML(videos) {
                if (!videos || videos.length === 0) return '';
                return `<div style="margin-top:10px;display:flex;flex-wrap:wrap;gap:6px;">${videos.map(url => `<a class="detail-video-link" href="${escapeHTML(url)}" target="_blank" rel="noopener noreferrer">▶️ ${extractVideoTitle(url)}</a>`).join('')}</div>`;
            }

            async function showDetailModal(game, options) {
                if (!game) return;
                const from = options && options.from ? options.from : 'gallery';
                window._detailFrom = from;

                const overlay = document.getElementById('detailModalOverlay');
                const modal = document.getElementById('detailModal');

                const url = new URL(window.location);
                url.searchParams.set('game', game.id);
                window.history.pushState({ gameId: game.id }, '', url.toString());
                document.title = `${game.title} · Her Lens`;

                const genres = (game.genre || []).map(g => `<span class="detail-tag">${escapeHTML(g)}</span>`).join('');
                const gameplays = (game.gameplay || []).map(g => `<span class="detail-tag">${escapeHTML(g)}</span>`).join('');

                const platforms = (game.platforms || []).map(p => `<span>${escapeHTML(p)}</span>`).join('');
                let otherRows = '';
                if (isGameReleased(game)) {
                    otherRows =
                        `<tr><td>📖 题材</td><td><div class="detail-tags">${genres || '—'}</div></td></tr>
                          <tr><td>🎮 玩法</td><td><div class="detail-tags">${gameplays || '—'}</div></td></tr>
                          <tr><td>👁 视角</td><td>${escapeHTML(game.perspective || '—')}</td></tr>
                          <tr><td>📅 发售日</td><td>${escapeHTML(game.releaseDate || '—')}</td></tr>
                          <tr><td>🌐 中文</td><td>${escapeHTML(game.hasChinese || '—')}</td></tr>
                          <tr><td>🖥 平台</td><td><div class="detail-tags">${platforms || '—'}</div></td></tr>
                          <tr><td>🍎 Mac</td><td>${game.hasMacSupport === '支持Mac' ? '✅ 支持' : '❌ 不支持'}</td></tr>
                          <tr><td>👤 主角</td><td>${escapeHTML(game.heroineType || '—')}</td></tr>
                          <tr><td>👕 服设</td><td>${escapeHTML(game.costumeType || '—')}</td></tr>
                          <tr><td>🎮 Demo</td><td>${game.hasDemo ? '✅ 提供' : '❌ 暂无'}</td></tr>
                          ${game.mainStoryDuration ? `<tr><td>⏱ 游戏时长</td><td>${escapeHTML(game.mainStoryDuration)}</td></tr>` : ''}
                          ${game.lowestPrice ? `<tr><td>💸 史低价格</td><td>${escapeHTML(game.lowestPrice)}</td></tr>` : ''}`;
                } else {
                    otherRows =
                        `<tr><td>📖 题材</td><td><div class="detail-tags">${genres || '—'}</div></td></tr>
                          <tr><td>🎮 玩法</td><td><div class="detail-tags">${gameplays || '—'}</div></td></tr>
                          <tr><td>👁 视角</td><td>${escapeHTML(game.perspective || '—')}</td></tr>
                          <tr><td>👤 主角</td><td>${escapeHTML(game.heroineType || '—')}</td></tr>
                          <tr><td>🖥 平台</td><td><div class="detail-tags">${platforms || '—'}</div></td></tr>
                          <tr><td>🍎 Mac</td><td>${game.hasMacSupport === '支持Mac' ? '✅ 支持' : '❌ 不支持'}</td></tr>
                          <tr><td>🎮 Demo</td><td>${game.hasDemo ? '✅ 提供' : '❌ 暂无'}</td></tr>
                          <tr><td>📅 预计发售</td><td>${escapeHTML(game.releaseDate || '—')}</td></tr>
                          ${game.mainStoryDuration ? `<tr><td>⏱ 游戏时长</td><td>${escapeHTML(game.mainStoryDuration)}</td></tr>` : ''}
                          ${game.lowestPrice ? `<tr><td>💸 史低价格</td><td>${escapeHTML(game.lowestPrice)}</td></tr>` : ''}`;
                }

                const screenshotCount = (game.screenshots || []).length;
                let screenshotsHTML = buildDetailScreenshotsHTML(game);
                let screenshotsGridClass = 'detail-screenshots-grid';
                if (screenshotCount === 2) {
                    screenshotsGridClass += ' screenshots-2';
                }

                let videosHTML = buildDetailVideosHTML(game.videos);

                const links = [];
                if (game.steamLink) links.push(
                    `<a class="detail-link-btn" href="${escapeHTML(game.steamLink)}" target="_blank">🔗 Steam</a>`);
                if (game.otherLinks) game.otherLinks.split('\n').filter(l => l.trim()).forEach(l => {
                    const p = l.split('|');
                    links.push(
                        `<a class="detail-link-btn" href="${escapeHTML(p[0].trim())}" target="_blank">🔗 ${escapeHTML(p[1] ? p[1].trim() : '链接')}</a>`
                    );
                });
                const linksHTML = links.length > 0 ?
                    `<div class="detail-links">${links.join(' ')}</div>` :
                    '';

                const userReview = userData.reviews.find(r => r.game_id === game.id);
                const userVerdict = userReview?.verdict ?? null;
                const userTags = userReview?.selected_tags ?? [];
                const userComment = userReview?.comment ?? null;

                let reviewHTML = '';
                let userAreaHTML = '';
                if (!currentUser) {
                    userAreaHTML = `<div class="review-login-prompt">🔑 登录后即可评分和评论</div>`;
                } else {
                    let userRatingHtml = '';
                    if (userVerdict !== null) {
                        userRatingHtml = `
                                <div style="margin-bottom:6px;">
                                    <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
                                        <span style="font-weight:600;">我的评价：</span>
                                        ${renderVerdictDisplay(userVerdict)}
                                        <button class="btn btn-sm" id="editRatingBtn" style="padding:2px 10px;">修改</button>
                                    </div>
                                    ${renderTagsDisplay(userTags)}
                                </div>
                            `;
                    }

                    let userCommentHtml = '';
                    if (userComment) {
                        userCommentHtml = `
                                <div style="margin-top:6px;">
                                    <div style="display:flex;gap:8px;align-items:flex-start;flex-wrap:wrap;">
                                        <span style="font-weight:600;">我的评论：</span>
                                        <span style="flex:1;word-break:break-word;">${stripCommentHTML(userComment)}</span>
                                        <button class="btn btn-sm" id="editCommentBtn" style="padding:2px 10px;">编辑</button>
                                        <button class="btn btn-sm" id="deleteCommentBtn" style="padding:2px 10px;color:var(--danger);border-color:var(--danger);">删除</button>
                                    </div>
                                </div>
                            `;
                    }

                    const editorHTML = buildReviewEditorHTML(game.id, userVerdict !== null, !!userComment);

                    userAreaHTML = `
                            <div class="review-user-area">
                                ${userRatingHtml}
                                ${userCommentHtml}
                                ${editorHTML}
                            </div>
                        `;
                }

                reviewHTML = `
                        ${userAreaHTML}
                        <div class="review-community-area">
                            <div class="review-community-header">
                                <span>📊 社区评分</span>
                                <span class="review-stats" id="ratingStatsDisplay">⏳ 加载中...</span>
                            </div>
                            <div id="communityCommentsList" style="margin-top:6px;max-height:clamp(420px,65vh,750px);overflow-y:auto;">
                                <div style="text-align:center;color:var(--text3);padding:12px;">⏳ 加载评论中...</div>
                            </div>
                        </div>
                    `;

                const detailPlayBtnHtml = isGameReleased(game) ?
                    `<button class="btn btn-sm" data-game-id="${game.id}" id="detailPlayBtn"><span class="icon">${isPlayed(game.id) ? SVG_ICONS.checkFilled : SVG_ICONS.squareOutline}</span> ${isPlayed(game.id) ? '取消玩过标记' : '标记为玩过'}</button>` :
                    '';

                // 构建系列作品区块HTML
                let seriesSectionHtml = '';
                if (game.series && game.series.trim()) {
                    const seriesGames = games.filter(g => !g.isDraft && g.series === game.series).sort((a, b) => (a.seriesOrder || 0) - (b.seriesOrder || 0));
                    if (seriesGames.length > 1) {
                        const seriesItemsHtml = seriesGames.map(g => {
                            const isCurrent = g.id === game.id;
                            const coverHtml = g.cover
                                ? `<img src="${escapeHTML(g.cover)}" referrerpolicy="no-referrer" loading="lazy" onload="this.classList.add('loaded');const ph=this.closest('.detail-series-item-cover')?.querySelector('.card-cover-placeholder');if(ph)ph.style.display='none';" />`
                                : '';
                            const placeholderHtml = g.cover ? '' : `<div class="card-cover-placeholder" style="position:relative;z-index:2;">${SVG_ICONS.gamepad}</div>`;
                            return `
                                <div class="detail-series-item${isCurrent ? ' current' : ''}" ${!isCurrent ? `onclick="openSeriesGameDetail(${g.id})"` : ''}>
                                    <div class="detail-series-item-cover">${coverHtml}${placeholderHtml}</div>
                                    <div class="detail-series-item-body">
                                        <div class="detail-series-item-title">${escapeHTML(g.title)}</div>
                                        <div class="detail-series-item-date">${escapeHTML(g.releaseDate || '未知')}</div>
                                    </div>
                                </div>`;
                        }).join('');

                        seriesSectionHtml = `
                            <div class="detail-series-section">
                                <h3>📚 系列作品 · ${escapeHTML(game.series)}</h3>
                                <div class="detail-series-list">${seriesItemsHtml}</div>
                            </div>`;
                    }
                }

                modal.innerHTML = `
                        <div class="detail-container">

                            <div class="detail-header">
                                <button class="detail-back-btn" id="detailBackBtn">
                                    <span class="back-icon">←</span> 返回列表
                                </button>
                                <span class="detail-status-label">${isGameReleased(game) ? '📀 已发售' : '⏳ 未发售'}</span>
                                <span class="detail-id">#${game.id}</span>
                                <button class="detail-share-btn" id="detailShareBtn">📤 分享</button>
                            </div>

                            <div class="detail-main">
                                <div class="detail-cover-wrapper">
                                    ${game.cover ? `<img src="${escapeHTML(game.cover)}" alt="${escapeHTML(game.title)}" onerror="this.style.display='none';" />` : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:var(--text3);font-size:3rem;">${SVG_ICONS.gamepad}</div>`}
                                </div>
                                <div class="detail-info-wrapper">
                                    <h1 class="detail-title">${escapeHTML(game.title)}</h1>
                                    ${game.englishName ? `<div class="detail-title-en">${escapeHTML(game.englishName)}</div>` : ''}
                                    <div class="detail-tags-row">
                                        ${genres}
                                        ${gameplays}
                                    </div>
                                    <div class="detail-meta-block">
                                        <div class="detail-meta-row">
                                            <span>📅 ${escapeHTML(game.releaseDate || '未知')}</span>
                                            <span>🌐 ${escapeHTML(game.hasChinese || '未知')}</span>
                                            ${game.hasDemo ? '<span>🎮 有Demo</span>' : ''}
                                            ${game.isPSExclusive ? '<span>🔵 PS独占</span>' : ''}
                                            ${game.isNSExclusive ? '<span>🔴 NS独占</span>' : ''}
                                        </div>
                                        <div class="detail-actions">
                                            <button class="btn btn-sm" data-game-id="${game.id}" id="detailWishBtn"><span class="icon">${isInWishlist(game.id) ? SVG_ICONS.heartFilled : SVG_ICONS.heartOutline}</span> ${isInWishlist(game.id) ? '从愿望单移除' : '加入愿望单'}</button>
                                            ${detailPlayBtnHtml}
                                        </div>
                                    </div>
                                    <div class="detail-short-desc">${escapeHTML(game.description || '')}</div>
                                </div>
                            </div>

                            <div class="detail-description texture-card">
                                ${escapeHTML(game.fullDescription || game.description || '暂无简介')}
                            </div>

                            <div class="detail-other-info texture-card">
                                <table class="detail-info-table">
                                    ${otherRows}
                                </table>
                                ${videosHTML}
                                ${linksHTML}
                            </div>

                            <div class="detail-screenshots texture-card">
                                <h3>📸 游戏截图</h3>
                                <div class="${screenshotsGridClass}">
                                    ${screenshotsHTML}
                                </div>
                            </div>

                            <div class="review-section">
                                <div class="review-section-title">✏️ 评价</div>
                                ${reviewHTML}
                            </div>

                            <div class="detail-related-mods" id="detailRelatedMods">
                                <div class="detail-related-mods-title">🔧 相关MOD分享</div>
                                <div id="detailRelatedModsList" style="text-align:center;color:var(--text3);padding:8px 0;font-size:0.85rem;">加载中...</div>
                            </div>

                            ${seriesSectionHtml}

                        </div>
                    `;

                window._detailScrollBeforeOpen = window.scrollY;
                overlay.dataset.gameId = game.id;
                overlay.classList.add('show');
                document.body.style.overflow = 'hidden';
                overlay.scrollTop = 0;

                modal.querySelector('#detailBackBtn').addEventListener('click', function (e) {
                    e.preventDefault();
                    closeDetailModal();
                });

                modal.querySelector('#detailShareBtn').addEventListener('click', function (e) {
                    e.stopPropagation();
                    buildShareFloat(game, null);
                });

                modal.querySelector('#detailWishBtn').addEventListener('click', function (e) {
                    e.stopPropagation();
                    const id = Number(this.dataset.gameId);
                    if (!isNaN(id)) {
                        toggleWishlist(id);
                        const isWished = userData.wishlist.includes(id);
                        this.textContent = isWished ? '❤️ 已收藏' : '🤍 收藏';
                    }
                });
                modal.querySelector('#detailWishBtn').addEventListener('pointerdown', function (e) {
                    e.stopPropagation();
                });

                const detailPlayBtn = modal.querySelector('#detailPlayBtn');
                if (detailPlayBtn) {
                    detailPlayBtn.addEventListener('click', function (e) {
                        e.stopPropagation();
                        const id = Number(this.dataset.gameId);
                        if (!isNaN(id)) {
                            togglePlayed(id);
                            const isPlayed = userData.played.includes(id);
                            this.textContent = isPlayed ? '✅ 已玩过' : '🎮 玩过';
                        }
                    });
                    detailPlayBtn.addEventListener('pointerdown', function (e) {
                        e.stopPropagation();
                    });
                }

                if (currentUser) {
                    const verdictContainer = modal.querySelector('#verdictPanelContainer');
                    if (verdictContainer) {
                        setupVerdictPanelHandlers(verdictContainer, game.id, userComment);
                    }

                    bindWriteReviewToggle(modal);

                    const editRatingBtn = modal.querySelector('#editRatingBtn');
                    if (editRatingBtn) {
                        editRatingBtn.addEventListener('click', function () {
                            const reviewArea = this.closest('.review-user-area');
                            if (!reviewArea) return;
                            const container = document.createElement('div');
                            container.id = 'verdictPanelContainer';
                            container.dataset.game = game.id;
                            container.innerHTML = '<div style="font-weight:600;margin-bottom:4px;">修改评价：</div>' + renderVerdictPanelHTML(userVerdict, userTags);
                            this.closest('div').replaceWith(container);
                            setupVerdictPanelHandlers(container, game.id, userComment);
                        });
                    }

                    const commentInput = modal.querySelector('#commentInput');
                    const charCount = modal.querySelector('#commentCharCount');
                    if (commentInput && charCount) {
                        commentInput.addEventListener('input', function () {
                            charCount.textContent = this.value.length;
                        });
                    }

                    // 绑定剧透按钮
                    const spoilerBtn = modal.querySelector('#spoilerBtn');
                    if (spoilerBtn && commentInput) {
                        spoilerBtn.addEventListener('click', function () {
                            wrapSelectionWithSpoiler(commentInput);
                        });
                    }

                    // 绑定统一保存按钮（评价+评论共用时存在），不存在则绑定独立提交评论按钮
                    bindUnifiedSaveBtn(modal, game.id, userVerdict, userTags);
                    const submitBtn = modal.querySelector('#submitCommentBtn');
                    if (submitBtn && !modal.querySelector('#unifiedSaveBtn')) {
                        submitBtn.addEventListener('click', function () {
                            const text = commentInput ? commentInput.value.trim() : '';
                            if (!text) {
                                showToast('请填写评论内容', 1500);
                                return;
                            }
                            const vt = getCurrentVerdictAndTags();
                            guardSubmitBtn(this, () => saveReview(game.id, vt?.verdict ?? userVerdict, vt?.tags ?? userTags, text || null), '提交中...');
                        });
                        if (commentInput) {
                            commentInput.addEventListener('keydown', function (e) {
                                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                                    e.preventDefault();
                                    submitBtn.click();
                                }
                            });
                        }
                    }

                    const editCommentBtn = modal.querySelector('#editCommentBtn');
                    if (editCommentBtn) {
                        editCommentBtn.addEventListener('click', function () {
                            const reviewBody = this.closest('.review-user-area');
                            if (!reviewBody) return;
                            const existing = reviewBody.querySelector('.comment-edit-area');
                            if (existing) { existing.remove(); return; }
                            const editArea = document.createElement('div');
                            editArea.className = 'comment-edit-area';
                            editArea.innerHTML = `
                                <div style="margin-bottom:3px;"><button type="button" class="comment-spoiler-btn" title="选中文字后点击，用剧透遮挡包裹">⚠️ 剧透</button></div>
                                <textarea maxlength="500">${stripCommentHTML(userComment)}</textarea>
                                <div class="comment-edit-actions">
                                    <button class="btn btn-sm" id="cancelEditBtn">取消</button>
                                    <button class="btn btn-sm btn-accent" id="saveEditBtn">保存</button>
                                </div>`;
                            reviewBody.appendChild(editArea);
                            const ta = editArea.querySelector('textarea');
                            ta.focus();
                            ta.setSelectionRange(ta.value.length, ta.value.length);
                            editArea.querySelector('#cancelEditBtn').addEventListener('click', function () { editArea.remove(); });
                            editArea.querySelector('.comment-spoiler-btn')?.addEventListener('click', function () { wrapSelectionWithSpoiler(ta); });
                            editArea.querySelector('#saveEditBtn').addEventListener('click', function () {
                                const text = ta.value.trim();
                                if (!text) { showToast('评论不能为空', 1500); return; }
                                const vt = getCurrentVerdictAndTags();
                                guardSubmitBtn(this, () => saveReview(game.id, vt?.verdict ?? userVerdict, vt?.tags ?? userTags, text), '保存中...');
                            });
                            ta.addEventListener('keydown', function (e) {
                                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                                    e.preventDefault();
                                    editArea.querySelector('#saveEditBtn').click();
                                }
                            });
                        });
                    }

                    const deleteCommentBtn = modal.querySelector('#deleteCommentBtn');
                    if (deleteCommentBtn) {
                        deleteCommentBtn.addEventListener('click', function () {
                            if (confirm('确定要删除这条评论吗？')) {
                                deleteReview(game.id);
                            }
                        });
                    }
                }

                loadCommunityReviews(game.id);
                loadDetailRelatedMods(game);

                // 后台补齐详细简介/视频，不阻塞弹窗打开
                // ★ 列表查询已包含 screenshots，正常情况下不触发补拉；
                //   仅旧缓存数据（screenshots 为空）会补拉一次，拿到后更新 localStorage
                const hasFullDesc = !!game.fullDescription;
                const hasShots = Array.isArray(game.screenshots) && game.screenshots.length > 0;
                const hasVideos = Array.isArray(game.videos) && game.videos.length > 0;
                // ★ 优化：screenshots 已经在列表数据中，绝大多数情况下 hasShots=true，
                //   只有 fullDescription 或 videos 缺失时才补拉，且不阻塞截图显示
                if (!hasFullDesc || !hasVideos) {
                    // 截图缺失时也补拉（但不阻塞当前显示）
                    const needShots = !hasShots;
                    loadGameDetailFromSupabase(game.id).then(detail => {
                        if (!detail) return;
                        let changed = false;
                        if (detail.fullDescription && !game.fullDescription) {
                            game.fullDescription = detail.fullDescription;
                            changed = true;
                        }
                        if (detail.screenshots && detail.screenshots.length > 0 && needShots) {
                            game.screenshots = detail.screenshots;
                            changed = true;
                        }
                        if (detail.videos && detail.videos.length > 0 && !hasVideos) {
                            game.videos = detail.videos;
                            changed = true;
                        }
                        if (!changed) return;
                        const descEl = modal.querySelector('.detail-description');
                        if (descEl && game.fullDescription) descEl.innerHTML = escapeHTML(game.fullDescription);
                        const gridEl = modal.querySelector('.detail-screenshots-grid');
                        if (gridEl && game.screenshots && game.screenshots.length > 0) {
                            gridEl.className = 'detail-screenshots-grid' + (game.screenshots.length === 2 ? ' screenshots-2' : '');
                            gridEl.innerHTML = buildDetailScreenshotsHTML(game);
                        }
                        const otherInfoEl = modal.querySelector('.detail-other-info');
                        if (otherInfoEl && game.videos && game.videos.length > 0 && !otherInfoEl.querySelector('.detail-video-link')) {
                            const tableEl = otherInfoEl.querySelector('.detail-info-table');
                            if (tableEl) {
                                tableEl.insertAdjacentHTML('afterend', buildDetailVideosHTML(game.videos));
                            } else {
                                otherInfoEl.insertAdjacentHTML('beforeend', buildDetailVideosHTML(game.videos));
                            }
                        }
                        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(games)); } catch (_) {}
                    }).catch(() => {});
                }
            }

            function closeDetailModal() {
                const overlay = document.getElementById('detailModalOverlay');
                overlay.classList.remove('show');
                document.body.style.overflow = '';

                const url = new URL(window.location);
                url.searchParams.delete('game');
                window.history.pushState({ gameId: null }, '', url.toString());
                document.title = 'Her Lens · 女性主角游戏';

                closeShareFloat();

                if (window._detailFrom === 'played') {
                    setTimeout(() => {
                        const overlayAch = document.getElementById('achievementModalOverlay');
                        if (!overlayAch.classList.contains('show')) {
                            openAchievementModal();
                            switchAchievementTab('played');
                        } else {
                            switchAchievementTab('played');
                        }
                        const savedScroll = window._playedScrollPos;
                        if (typeof savedScroll === 'number' && savedScroll > 0) {
                            requestAnimationFrame(function () {
                                const modal = document.querySelector('#achievementModalOverlay .modal');
                                if (modal) modal.scrollTop = savedScroll;
                            });
                        }
                        window._detailFrom = 'gallery';
                    }, 200);
                } else if (window._detailFrom === 'mod') {
                    window._detailFrom = 'gallery';
                    setTimeout(() => switchMainView('mod'), 100);
                } else {
                    const savedScroll = window._detailScrollBeforeOpen;
                    if (typeof savedScroll === 'number' && savedScroll > 0) {
                        requestAnimationFrame(function () {
                            window.scrollTo(0, savedScroll);
                        });
                    }
                    window._detailScrollBeforeOpen = null;
                }
            }

            function handleRouteFromURL() {
                const params = new URLSearchParams(window.location.search);
                const gameId = params.get('game');
                if (gameId) {
                    const id = Number(gameId);
                    if (!isNaN(id) && id > 0) {
                        const game = games.find(g => g.id === id);
                        if (game) {
                            setTimeout(() => {
                                showDetailModal(game, { from: 'gallery' });
                            }, 200);
                            return true;
                        } else {
                            const url = new URL(window.location);
                            url.searchParams.delete('game');
                            window.history.replaceState({ gameId: null }, '', url.toString());
                        }
                    }
                }
                // 支持通过游戏标题跳转（来自人格测试推荐）
                const gameTitle = params.get('gameTitle');
                if (gameTitle) {
                    const decoded = decodeURIComponent(gameTitle);
                    const game = games.find(g => g.title === decoded);
                    if (game) {
                        const url = new URL(window.location);
                        url.searchParams.delete('gameTitle');
                        url.searchParams.set('game', game.id);
                        window.history.replaceState({ gameId: game.id }, '', url.toString());
                        setTimeout(() => {
                            showDetailModal(game, { from: 'gallery' });
                        }, 200);
                        return true;
                    } else {
                        const url = new URL(window.location);
                        url.searchParams.delete('gameTitle');
                        window.history.replaceState({ gameId: null }, '', url.toString());
                    }
                }
                return false;
            }

            // ================================================================
            // 社区评论 (带分享按钮 + 分页)
            // ================================================================
            // ===== 游戏评论点赞（云端 review_likes 表 + localStorage 回退） =====
            const REVIEW_LIKES_KEY = 'heroine_review_likes_v1';
            // 缓存：{ [reviewDbId]: { count: number, liked: boolean, ts: number } }
            let _reviewLikesCache = {};

            function getReviewLikesLocal() {
                try { return JSON.parse(localStorage.getItem(REVIEW_LIKES_KEY) || '{}'); }
                catch (_) { return {}; }
            }
            function saveReviewLikesLocal(likes) {
                try { localStorage.setItem(REVIEW_LIKES_KEY, JSON.stringify(likes)); } catch (_) {}
            }
            function isReviewLikedLocal(reviewDbId) {
                if (!currentUser) return false;
                const likes = getReviewLikesLocal();
                return (likes[reviewDbId] || []).includes(currentUser.id);
            }

            // 批量获取评论点赞数 + 当前用户点赞状态，填充缓存
            async function fetchReviewLikesBatch(reviewDbIds) {
                if (!supabaseClient || !reviewDbIds.length) return;
                try {
                    const { data, error } = await supabaseClient.from('review_likes')
                        .select('review_id, user_id')
                        .in('review_id', reviewDbIds);
                    if (error) throw error;
                    const now = Date.now();
                    const map = {};
                    (data || []).forEach(function (row) {
                        if (!map[row.review_id]) map[row.review_id] = { count: 0, liked: false };
                        map[row.review_id].count++;
                        if (currentUser && row.user_id === currentUser.id) map[row.review_id].liked = true;
                    });
                    reviewDbIds.forEach(function (id) {
                        const info = map[id] || { count: 0, liked: false };
                        // 本地点赞状态作为兜底（云端未同步时）
                        if (!info.liked && isReviewLikedLocal(id)) info.liked = true;
                        _reviewLikesCache[id] = { count: info.count, liked: info.liked, ts: now };
                    });
                } catch (e) {
                    console.warn('获取评论点赞失败，使用本地缓存:', e.message);
                    const now = Date.now();
                    reviewDbIds.forEach(function (id) {
                        const liked = isReviewLikedLocal(id);
                        _reviewLikesCache[id] = { count: liked ? 1 : 0, liked: liked, ts: now };
                    });
                }
            }

            // 切换点赞：乐观更新本地，云端 insert/delete，失败回滚
            async function toggleReviewLike(reviewDbId) {
                if (!currentUser) return null;
                if (!reviewDbId) return null;
                const wasLiked = (_reviewLikesCache[reviewDbId] && _reviewLikesCache[reviewDbId].liked) || isReviewLikedLocal(reviewDbId);
                // 1. 本地缓存立即更新
                const likes = getReviewLikesLocal();
                if (!likes[reviewDbId]) likes[reviewDbId] = [];
                const idx = likes[reviewDbId].indexOf(currentUser.id);
                if (idx === -1) likes[reviewDbId].push(currentUser.id);
                else likes[reviewDbId].splice(idx, 1);
                saveReviewLikesLocal(likes);
                if (!_reviewLikesCache[reviewDbId]) _reviewLikesCache[reviewDbId] = { count: 0, liked: false, ts: Date.now() };
                _reviewLikesCache[reviewDbId].liked = !wasLiked;
                _reviewLikesCache[reviewDbId].count += (!wasLiked ? 1 : -1);
                if (_reviewLikesCache[reviewDbId].count < 0) _reviewLikesCache[reviewDbId].count = 0;
                // 2. 云端同步
                if (supabaseClient) {
                    try {
                        // 优先使用 RPC（原子化：单次往返完成插入/删除+计数）
                        const { data: newCount, error: rpcErr } = await supabaseClient
                            .rpc('toggle_review_like', { p_review_id: reviewDbId, p_user_id: currentUser.id });
                        if (!rpcErr && typeof newCount === 'number') {
                            _reviewLikesCache[reviewDbId].count = newCount;
                            return !wasLiked;
                        }
                        throw (rpcErr || new Error('rpc no data'));
                    } catch (_e) {
                        try {
                            if (!wasLiked) {
                                const { error } = await supabaseClient.from('review_likes')
                                    .insert({ review_id: reviewDbId, user_id: currentUser.id });
                                // 23505 = 唯一约束冲突（已点过），忽略
                                if (error && error.code !== '23505') throw error;
                            } else {
                                const { error } = await supabaseClient.from('review_likes')
                                    .delete().eq('review_id', reviewDbId).eq('user_id', currentUser.id);
                                if (error) throw error;
                            }
                        } catch (e) {
                            console.error('评论点赞云端同步失败:', e);
                            // 回滚本地
                            const likes2 = getReviewLikesLocal();
                            if (likes2[reviewDbId]) {
                                const i = likes2[reviewDbId].indexOf(currentUser.id);
                                if (!wasLiked && i >= 0) likes2[reviewDbId].splice(i, 1);
                                else if (wasLiked && i === -1) likes2[reviewDbId].push(currentUser.id);
                                saveReviewLikesLocal(likes2);
                            }
                            _reviewLikesCache[reviewDbId].liked = wasLiked;
                            _reviewLikesCache[reviewDbId].count += (wasLiked ? 1 : -1);
                            if (_reviewLikesCache[reviewDbId].count < 0) _reviewLikesCache[reviewDbId].count = 0;
                            showToast('⚠️ 操作失败，请重试', 1500);
                            return wasLiked;
                        }
                    }
                }
                return !wasLiked;
            }

            async function renderReviewItem(r, gameId, preloadedReplies) {
                const avatar = r.avatar_url ?
                    `<img src="${escapeHTML(r.avatar_url)}" class="comment-avatar" referrerpolicy="no-referrer" />` :
                    `<span class="comment-avatar" style="display:inline-flex;align-items:center;justify-content:center;font-size:1rem;background:var(--tag-bg);">👤</span>`;
                const verdictDisplay = r.verdict ? renderVerdictDisplay(r.verdict) : '';
                const tagsDisplay = r.selected_tags && r.selected_tags.length > 0 ? renderTagsDisplay(r.selected_tags) : '';
                const time = r.created_at ? new Date(r.created_at).toLocaleDateString('zh-CN', {
                    year: 'numeric', month: 'long', day: 'numeric'
                }) : '';
                const commentText = r.comment || '';
                const reviewId = `${gameId}_${r.user_id}`;
                const reviewDbId = r.id; // 数据库主键，用于点赞关联
                // 点赞信息（从预加载缓存读取）
                const likeInfo = (reviewDbId && _reviewLikesCache[reviewDbId]) || { count: 0, liked: false };
                const isLiked = likeInfo.liked || isReviewLikedLocal(reviewDbId);
                const likeCount = likeInfo.count || 0;
                const likeBtnHtml = (reviewDbId && currentUser) ?
                    `<button class="comment-like-btn${isLiked ? ' liked' : ''}" data-review-db-id="${reviewDbId}" data-review-id="${reviewId}">${isLiked ? '❤️' : '🤍'} <span class="like-count">${likeCount > 0 ? likeCount : ''}</span></button>` : '';
                const shareBtnHtml =
                    `<button class="comment-share-btn" data-game-id="${gameId}" data-comment="${escapeHTML(stripCommentHTML(commentText))}" data-username="${escapeHTML(r.display_name || '用户')}" data-avatar="${escapeHTML(r.avatar_url || '')}" data-verdict="${r.verdict || ''}" data-tags="${escapeHTML(r.selected_tags ? r.selected_tags.join(',') : '')}" data-date="${escapeHTML(r.created_at || '')}">📤 分享</button>`;
                const replyBtnHtml = `<button class="comment-reply-btn" data-review-id="${reviewId}">💬 回复</button>`;

                // 获取回复树（优先使用预加载数据，避免每条评论都发一次网络请求）
                let flatReplies;
                // 兼容两种存的 key：评论主键 id（老数据）或 gameId_userId（新数据）
                const preloadedReplyList = preloadedReplies
                    ? (preloadedReplies[reviewId] || preloadedReplies[reviewDbId] || null)
                    : null;
                if (preloadedReplyList) {
                    // ★ 优化：预加载数据命中时，纯同步路径，不触发 await
                    flatReplies = preloadedReplyList;
                } else if (preloadedReplies) {
                    // 预加载Map存在但本条评论无回复：直接空数组，避免无谓的 await
                    flatReplies = [];
                } else {
                    // 仅在没有预加载数据时才走单独查询（兜底路径）
                    flatReplies = await getGameCommentRepliesForReview(reviewId);
                }
                const replyTree = buildGameReplyTree([...flatReplies]);
                let repliesHtml = '';
                if (replyTree.length > 0) {
                    // ★ 回复分页：默认只渲染前 REPLY_CHUNK 个根回复（含其全部子回复），
                    //   超出部分通过"加载更多"展开，减少首屏 DOM 与渲染开销
                    const revealed = _replyReveal[reviewId] || REPLY_CHUNK;
                    let treeForRender = replyTree;
                    let hiddenRoots = 0;
                    if (replyTree.length > revealed) {
                        treeForRender = replyTree.slice(0, revealed);
                        hiddenRoots = replyTree.length - revealed;
                    }
                    repliesHtml = '<div class="comment-reply-list">' + renderGameReplyTree(treeForRender, reviewId, 0, flatReplies) + '</div>';
                    if (hiddenRoots > 0) {
                        repliesHtml += `<div class="comment-replies-more" style="text-align:center;padding:6px 0;">
                            <button class="btn btn-sm comment-replies-more-btn" data-review-id="${reviewId}" data-reveal="${revealed + REPLY_CHUNK}">展开更多回复（${hiddenRoots}）</button>
                        </div>`;
                    }
                }

                const customIdHtml = r.custom_id
                    ? `<span class="comment-custom-id">@${escapeHTML(r.custom_id)}</span>`
                    : '';

                // 头衔徽章：优先显示作者佩戴的头衔（容器支持多个徽章并排）
                let titleBadgesHtml = '';
                try {
                    const badges = [];
                    // 当前登录用户自己的佩戴头衔
                    if (r.user_id && currentUser && currentUser.id === r.user_id) {
                        const equipped = TITLES.find(t => t.id === userData.equippedTitle);
                        if (equipped) badges.push(renderTitleBadge(equipped));
                    } else if (r.user_id && r._equipped_title && typeof r._equipped_title === 'object') {
                        // 兼容云端扩展：评论作者数据自带头衔
                        badges.push(renderTitleBadge(r._equipped_title));
                    }
                    titleBadgesHtml = badges.length
                        ? `<div class="comment-header-titles">${badges.join('')}</div>`
                        : '';
                } catch (e) { titleBadgesHtml = ''; }

                return `
                    <div class="comment-item" data-review-id="${reviewId}">
                        <div class="comment-header">
                            ${avatar}
                            <span class="comment-name">${escapeHTML(r.display_name || '用户')}</span>
                            ${customIdHtml}
                            ${titleBadgesHtml}
                        </div>
                        ${(verdictDisplay || tagsDisplay) ? `
                            <div class="comment-verdict-tags-row">
                                ${verdictDisplay}
                                ${tagsDisplay}
                            </div>
                        ` : ''}
                        ${commentText ? `<div class="comment-text">${renderCommentWithSpoilers(stripCommentHTML(commentText))}</div>` : ''}
                        <div class="comment-actions">
                            <span class="comment-time">${time}</span>
                            ${likeBtnHtml}
                            ${replyBtnHtml}
                            <span style="flex:1"></span>
                            ${shareBtnHtml}
                        </div>
                        ${repliesHtml}
                        <div class="comment-reply-compose" id="gameReplyCompose-${reviewId}" style="display:none;">
                            <textarea id="gameReplyInput-${reviewId}" placeholder="写下你的回复..." maxlength="200"></textarea>
                            <div class="comment-reply-compose-actions">
                                <button class="btn btn-sm game-reply-cancel-btn" data-review-id="${reviewId}">取消</button>
                                <button class="btn btn-sm btn-accent game-reply-submit-btn" data-review-id="${reviewId}" data-reply-to-user-id="${r.user_id}">发送</button>
                            </div>
                        </div>
                    </div>`;
            }

            function bindReviewShareButtons(container) {
                container.querySelectorAll('.comment-share-btn').forEach(btn => {
                    btn.addEventListener('click', function (e) {
                        e.stopPropagation();
                        const gameIdNum = Number(this.dataset.gameId);
                        const comment = this.dataset.comment;
                        if (!gameIdNum || !comment) return;
                        const game = games.find(g => g.id === gameIdNum);
                        if (!game) { showToast('未找到游戏信息', 1500); return; }
                        const tagsStr = this.dataset.tags || '';
                        const reviewData = {
                            comment: comment,
                            displayName: this.dataset.username || '用户',
                            avatarUrl: this.dataset.avatar || '',
                            verdict: this.dataset.verdict ? Number(this.dataset.verdict) : 0,
                            selected_tags: tagsStr ? tagsStr.split(',') : [],
                            createdAt: this.dataset.date || ''
                        };
                        buildShareFloat(game, reviewData);
                    });
                });
            }

            // ★ 展开更多回复：增加该评论的根回复展示数并局部重渲染
            async function revealMoreReplies(btn) {
                const reviewId = btn.dataset.reviewId;
                const reveal = Number(btn.dataset.reveal) || 0;
                _replyReveal[reviewId] = reveal;
                const gameId = Number(String(reviewId).split('_')[0]);
                if (!gameId) return;
                const cached = _reviewsListCache[String(gameId)];
                if (!cached) { loadCommunityReviews(gameId); return; }
                const review = cached.reviews.find(x => x.id === reviewId || `${gameId}_${x.user_id}` === reviewId);
                if (!review) return;
                const itemEl = document.querySelector('.comment-item[data-review-id="' + reviewId + '"]');
                if (!itemEl) return;
                const html = await renderReviewItem(review, gameId, cached.repliesMap);
                const wrap = document.createElement('div');
                wrap.innerHTML = html;
                const newItem = wrap.firstElementChild;
                if (!newItem) return;
                itemEl.replaceWith(newItem);
                bindReviewShareButtons(newItem);
                bindGameCommentReplyEvents(newItem);
            }

            function bindGameCommentReplyEvents(container) {
                // 回复分页：展开更多
                container.querySelectorAll('.comment-replies-more-btn').forEach(btn => {
                    btn.addEventListener('click', function () {
                        revealMoreReplies(this);
                    });
                });
                // 回复按钮（含嵌套回复）
                container.querySelectorAll('.comment-reply-btn').forEach(btn => {
                    btn.addEventListener('click', function () {
                        if (!currentUser) { showToast('请先登录', 1500); return; }
                        const reviewId = this.dataset.reviewId;
                        const replyId = this.dataset.replyId;

                        // 先隐藏同级其他输入框
                        const parent = this.closest('.comment-reply-item') || this.closest('.comment-item');
                        if (parent) {
                            parent.querySelectorAll('.comment-nested-reply-compose, .comment-reply-compose').forEach(c => {
                                c.style.display = 'none';
                            });
                        }

                        if (replyId) {
                            // 嵌套回复
                            const composeEl = document.getElementById('gameNestedReplyCompose-' + reviewId + '-' + replyId);
                            if (composeEl) {
                                composeEl.style.display = 'block';
                                document.getElementById('gameNestedReplyInput-' + reviewId + '-' + replyId)?.focus();
                            }
                        } else {
                            // 一级回复
                            const composeEl = document.getElementById('gameReplyCompose-' + reviewId);
                            if (composeEl) {
                                composeEl.style.display = 'block';
                                document.getElementById('gameReplyInput-' + reviewId)?.focus();
                            }
                        }
                    });
                });

                // 一级回复取消按钮
                container.querySelectorAll('.game-reply-cancel-btn').forEach(btn => {
                    btn.addEventListener('click', function () {
                        const reviewId = this.dataset.reviewId;
                        const composeEl = document.getElementById('gameReplyCompose-' + reviewId);
                        if (composeEl) composeEl.style.display = 'none';
                    });
                });

                // 一级回复提交按钮
                container.querySelectorAll('.game-reply-submit-btn').forEach(btn => {
                    btn.addEventListener('click', function () {
                        if (!currentUser) { showToast('请先登录', 1500); return; }
                        const reviewId = this.dataset.reviewId;
                        const replyToUserId = this.dataset.replyToUserId;
                        const input = document.getElementById('gameReplyInput-' + reviewId);
                        if (!input) return;
                        const text = input.value.trim();
                        if (!text) { showToast('回复内容不能为空', 1500); return; }
                        guardSubmitBtn(this, async () => {
                            await addGameCommentReply(String(reviewId), text, replyToUserId);

                            // 发送通知
                            if (supabaseClient) {
                                try {
                                    await createReplyNotification(replyToUserId, 'game_comment', reviewId, '游戏评论', text);
                                } catch (_) {}
                            }

                            showToast('✅ 回复成功', 1500);
                            // 重新渲染评论列表
                            const gameId = reviewId.split('_')[0];
                            loadCommunityReviews(Number(gameId));
                        });
                    });
                });

                // 嵌套回复取消按钮
                container.querySelectorAll('.game-nested-reply-cancel-btn').forEach(btn => {
                    btn.addEventListener('click', function () {
                        const reviewId = this.dataset.reviewId;
                        const replyId = this.dataset.replyId;
                        const composeEl = document.getElementById('gameNestedReplyCompose-' + reviewId + '-' + replyId);
                        if (composeEl) composeEl.style.display = 'none';
                    });
                });

                // 嵌套回复提交按钮
                container.querySelectorAll('.game-nested-reply-submit-btn').forEach(btn => {
                    btn.addEventListener('click', function () {
                        if (!currentUser) { showToast('请先登录', 1500); return; }
                        const reviewId = this.dataset.reviewId;
                        const parentReplyId = this.dataset.parentReplyId;
                        const replyToUserId = this.dataset.replyToUserId;
                        const input = document.getElementById('gameNestedReplyInput-' + reviewId + '-' + parentReplyId);
                        if (!input) return;
                        const text = input.value.trim();
                        if (!text) { showToast('回复内容不能为空', 1500); return; }
                        guardSubmitBtn(this, async () => {
                            await addGameCommentReply(String(reviewId), text, replyToUserId, parentReplyId);

                            // 发送通知
                            if (supabaseClient) {
                                try {
                                    await createReplyNotification(replyToUserId, 'game_comment', reviewId, '游戏评论', text);
                                } catch (_) {}
                            }

                            showToast('✅ 回复成功', 1500);
                            const gameId = reviewId.split('_')[0];
                            loadCommunityReviews(Number(gameId));
                        });
                    });
                });

                // 回复删除按钮
                container.querySelectorAll('.comment-reply-delete-btn').forEach(btn => {
                    btn.addEventListener('click', async function () {
                        const reviewId = this.dataset.reviewId;
                        const replyId = this.dataset.replyId;
                        if (!confirm('确定删除这条回复吗？')) return;
                        await deleteGameCommentReply(String(reviewId), replyId);
                        showToast('✅ 回复已删除', 1500);
                        const gameId = reviewId.split('_')[0];
                        loadCommunityReviews(Number(gameId));
                    });
                });

                // 主评论点赞按钮事件
                container.querySelectorAll('.comment-like-btn').forEach(btn => {
                    // 防止 loadMore 追加时重复绑定
                    if (btn.dataset.bound === '1') return;
                    btn.dataset.bound = '1';
                    btn.addEventListener('click', async function () {
                        if (!currentUser) { showToast('请先登录', 1500); return; }
                        const reviewDbId = this.dataset.reviewDbId; // UUID 字符串，直接使用
                        if (!reviewDbId) return;
                        // 拉黑用户预检（数据库 RLS 也会拦截）
                        if (await isCurrentUserBanned()) {
                            showToast('⚠️ 您的账号已被限制操作', 2500);
                            return;
                        }
                        // 防重
                        if (this.dataset.submitting === 'true') return;
                        this.dataset.submitting = 'true';
                        const wasLiked = this.classList.contains('liked');
                        const oldCount = Number(this.querySelector('.like-count')?.textContent || 0);
                        // 乐观更新 UI
                        this.classList.toggle('liked');
                        const newCount = wasLiked ? (oldCount > 1 ? oldCount - 1 : 0) : oldCount + 1;
                        this.innerHTML = (wasLiked ? '🤍' : '❤️') + ` <span class="like-count">${newCount > 0 ? newCount : ''}</span>`;
                        try {
                            await toggleReviewLike(reviewDbId);
                        } finally {
                            this.dataset.submitting = 'false';
                        }
                    });
                });

                // 剧透遮挡点击展开/收起（事件委托）
                container.querySelectorAll('.comment-spoiler').forEach(spoiler => {
                    if (spoiler.dataset.bound === '1') return;
                    spoiler.dataset.bound = '1';
                    spoiler.addEventListener('click', function (e) {
                        e.stopPropagation();
                        this.classList.toggle('revealed');
                    });
                    // 支持键盘展开
                    spoiler.addEventListener('keydown', function (e) {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            this.classList.toggle('revealed');
                        }
                    });
                });
            }

            // ★ 评论区 Realtime：新回复/点赞实时刷新（订阅一次，全局复用）
            function initCommentRealtime() {
                if (!supabaseClient || _commentRealtimeListener) return;
                try {
                    _commentRealtimeListener = supabaseClient
                        .channel('comment-changes')
                        .on('postgres_changes', {
                            event: 'INSERT',
                            schema: 'public',
                            table: 'game_comment_replies'
                        }, (payload) => {
                            const row = payload.new || {};
                            const gameId = row.game_id;
                            if (gameId == null) return;
                            const overlay = document.getElementById('detailModalOverlay');
                            if (!overlay || !overlay.classList.contains('show')) return;
                            const openGameId = overlay.dataset.gameId;
                            if (openGameId && String(openGameId) === String(gameId)) {
                                invalidateReviewsListCache(Number(gameId));
                                clearTimeout(_commentRtDebounce);
                                _commentRtDebounce = setTimeout(() => {
                                    try { loadCommunityReviews(Number(gameId)); } catch (_) {}
                                }, 800);
                            }
                        })
                        .on('postgres_changes', {
                            event: '*',
                            schema: 'public',
                            table: 'review_likes'
                        }, (payload) => {
                            if (payload.eventType !== 'INSERT' && payload.eventType !== 'DELETE') return;
                            const row = payload.eventType === 'INSERT' ? payload.new : payload.old;
                            const reviewDbId = row ? row.review_id : null;
                            const userId = row ? row.user_id : null;
                            if (!reviewDbId) return;
                            // 自己触发的点赞变化已由 toggleReviewLike 本地处理，跳过避免重复计数
                            if (userId && currentUser && userId === currentUser.id) return;
                            const entry = _reviewLikesCache[reviewDbId];
                            if (!entry) return;
                            const delta = payload.eventType === 'INSERT' ? 1 : -1;
                            entry.count = Math.max(0, (entry.count || 0) + delta);
                            document.querySelectorAll('.comment-like-btn[data-review-db-id="' + reviewDbId + '"]').forEach(btn => {
                                const span = btn.querySelector('.like-count');
                                if (span) span.textContent = entry.count > 0 ? entry.count : '';
                            });
                        })
                        .subscribe();
                } catch (_) { }
            }

            async function loadCommunityReviews(gameId) {
                const statsDisplay = document.getElementById('ratingStatsDisplay');
                const commentsList = document.getElementById('communityCommentsList');
                if (!statsDisplay || !commentsList) return;

                initCommentRealtime();
                _reviewPage[gameId] = 0;
                _replyReveal = {};

                // ★ 优化：优先使用短期缓存（2分钟内重复打开同一详情页直接复用数据）
                const cacheKey = String(gameId);
                const cached = _reviewsListCache[cacheKey];
                if (cached && (Date.now() - cached.ts < REVIEWS_LIST_CACHE_TTL)) {
                    // 立即渲染缓存数据
                    renderReviewsIntoDOM(cached.reviews, cached.stats, cached.repliesMap, gameId, statsDisplay, commentsList);
                    return;
                }

                // ★ 优化：先并行发起所有网络请求（4个请求同时进行，总耗时≈最慢的那个）
                const [
                    statsResult,
                    reviewsResult
                ] = await Promise.all([
                    fetchGameRatingStats(gameId),
                    fetchGameReviews(gameId, 0)
                ]);

                const reviews = reviewsResult;
                const reviewDbIds = reviews.map(r => r.id).filter(Boolean);

                // ★ 优化：并行拉取点赞和回复（依赖reviewDbIds，但两者互不依赖可并行）
                const [likesResult, repliesResult] = await Promise.all([
                    fetchReviewLikesBatch(reviewDbIds).then(() => true).catch(() => false),
                    (async () => {
                        let gameRepliesMap = {};
                        try {
                            if (supabaseClient && reviewDbIds.length > 0) {
                                // 兼容两种存的 review_id：评论主键 id（老数据）或 gameId_userId（新数据）
                                const compositeIds = reviews
                                    .map(rev => `${gameId}_${rev.user_id}`)
                                    .filter(Boolean);
                                const matchIds = [...new Set([...reviewDbIds, ...compositeIds])];
                                const { data, error } = await supabaseClient
                                    .from('game_comment_replies')
                                    .select('*')
                                    .in('review_id', matchIds)
                                    .order('created_at', { ascending: true });
                                if (!error && data) {
                                    data.forEach(r => {
                                        if (!gameRepliesMap[r.review_id]) gameRepliesMap[r.review_id] = [];
                                        gameRepliesMap[r.review_id].push({
                                            id: r.id, review_id: r.review_id, user_id: r.user_id,
                                            content: r.content, display_name: r.display_name || '用户',
                                            avatar_url: r.avatar_url || null, custom_id: r.custom_id || null,
                                            reply_to: r.reply_to,
                                            parent_reply_id: r.parent_reply_id, created_at: r.created_at
                                        });
                                    });
                                }
                            }
                        } catch (_) {}
                        return gameRepliesMap;
                    })()
                ]);

                const gameRepliesMap = repliesResult;

                // 写入短期缓存
                _reviewsListCache[cacheKey] = {
                    ts: Date.now(),
                    reviews: reviews,
                    stats: statsResult,
                    repliesMap: gameRepliesMap
                };

                renderReviewsIntoDOM(reviews, statsResult, gameRepliesMap, gameId, statsDisplay, commentsList);
            }

            // 抽取渲染逻辑（缓存命中和首次加载共用）
            async function renderReviewsIntoDOM(reviews, stats, gameRepliesMap, gameId, statsDisplay, commentsList) {
                // 渲染评分统计
                if (stats.average !== null) {
                    statsDisplay.innerHTML = `⭐ <strong>${stats.average.toFixed(1)}</strong> / 5 （共 <strong>${stats.count}</strong> 人评价）`;
                } else {
                    statsDisplay.textContent = '暂无评价';
                }

                // 渲染评论列表
                if (reviews.length === 0) {
                    commentsList.innerHTML =
                        `<div style="text-align:center;color:var(--text3);padding:12px;">暂无评论，快来写下你的第一条吧！</div>`;
                    return;
                }

                // ★ 优化：renderReviewItem 在有 preloadedReplies 时是纯同步操作，
                //   用 Promise.all 并行执行避免串行 await 开销
                const htmlParts = await Promise.all(
                    reviews.map(r => renderReviewItem(r, gameId, gameRepliesMap))
                );
                let html = htmlParts.join('');

                const hasMore = reviews.length >= REVIEW_PAGE_SIZE;
                if (hasMore) {
                    html += `<div class="review-load-more" style="text-align:center;padding:10px 0;">
                        <button class="btn btn-sm" id="reviewLoadMoreBtn" data-game-id="${gameId}">加载更多评论</button>
                    </div>`;
                }

                commentsList.innerHTML = html;
                bindReviewShareButtons(commentsList);
                bindGameCommentReplyEvents(commentsList);

                const loadMoreBtn = commentsList.querySelector('#reviewLoadMoreBtn');
                if (loadMoreBtn) {
                    loadMoreBtn.addEventListener('click', async function () {
                        const gid = Number(this.dataset.gameId);
                        const nextPage = (_reviewPage[gid] || 0) + 1;
                        this.disabled = true;
                        this.textContent = '加载中...';
                        const moreReviews = await fetchGameReviews(gid, nextPage);
                        _reviewPage[gid] = nextPage;
                        if (moreReviews.length > 0) {
                            const ids = moreReviews.map(r => r.id).filter(Boolean);
                            // ★ 优化：并行拉取点赞和回复
                            const [moreLikesResult, moreRepliesResult] = await Promise.all([
                                fetchReviewLikesBatch(ids).then(() => true).catch(() => false),
                                (async () => {
                                    let moreRepliesMap = {};
                                    try {
                                        if (supabaseClient && ids.length > 0) {
                                            // 兼容两种存的 review_id：评论主键 id（老数据）或 gameId_userId（新数据）
                                            const compositeIds = moreReviews
                                                .map(rev => `${gid}_${rev.user_id}`)
                                                .filter(Boolean);
                                            const matchIds = [...new Set([...ids, ...compositeIds])];
                                            const { data, error } = await supabaseClient
                                                .from('game_comment_replies')
                                                .select('*')
                                                .in('review_id', matchIds)
                                                .order('created_at', { ascending: true });
                                            if (!error && data) {
                                                data.forEach(r => {
                                                    if (!moreRepliesMap[r.review_id]) moreRepliesMap[r.review_id] = [];
                                                    moreRepliesMap[r.review_id].push({
                                                        id: r.id, review_id: r.review_id, user_id: r.user_id,
                                                        content: r.content, display_name: r.display_name || '用户',
                                                        avatar_url: r.avatar_url || null, custom_id: r.custom_id || null,
                                                        reply_to: r.reply_to,
                                                        parent_reply_id: r.parent_reply_id, created_at: r.created_at
                                                    });
                                                });
                                            }
                                        }
                                    } catch (_) {}
                                    return moreRepliesMap;
                                })()
                            ]);

                            const moreWrap = document.createElement('div');
                            const moreHtmlParts = await Promise.all(
                                moreReviews.map(r => renderReviewItem(r, gid, moreRepliesResult))
                            );
                            moreWrap.innerHTML = moreHtmlParts.join('');
                            const existingLoadMore = commentsList.querySelector('.review-load-more');
                            while (moreWrap.firstChild) {
                                commentsList.insertBefore(moreWrap.firstChild, existingLoadMore);
                            }
                            bindReviewShareButtons(commentsList);
                            bindGameCommentReplyEvents(commentsList);
                        }
                        if (moreReviews.length < REVIEW_PAGE_SIZE) {
                            const lm = commentsList.querySelector('.review-load-more');
                            if (lm) lm.remove();
                        } else {
                            this.disabled = false;
                            this.textContent = '加载更多评论';
                        }
                    });
                }
            }

            function extractVideoTitle(url) {
                if (!url) return '🔗 视频链接';
                try {
                    const u = new URL(url);
                    const host = u.hostname.toLowerCase();
                    if (host.includes('bilibili.com') || host.includes('b23.tv')) { const p = new URLSearchParams(u.search); return `📺 B站视频 P${p.get('p') || '1'}`; }
                    if (host.includes('youtube.com') || host.includes('youtu.be')) return '▶️ YouTube';
                    if (host.includes('vimeo.com')) return '🎬 Vimeo';
                    if (host.includes('dailymotion.com')) return '🎥 Dailymotion';
                    if (host.includes('nicovideo.jp') || host.includes('niconico')) return '🎌 Niconico';
                    if (host.includes('twitch.tv')) return '🎮 Twitch';
                    if (host.includes('douyin.com')) return '🎵 抖音';
                    if (host.includes('kuaishou.com')) return '📱 快手';
                    if (host.includes('weibo.com') || host.includes('weibo.cn')) return '📱 微博';
                    if (host.includes('xiaohongshu.com') || host.includes('xhslink.com')) return '📕 小红书';
                    if (host.includes('zhihu.com')) return '📘 知乎';
                    if (host.includes('tiktok.com')) return '🎵 TikTok';
                    if (host.includes('instagram.com')) return '📷 Instagram';
                    if (host.includes('facebook.com') || host.includes('fb.watch')) return '📘 Facebook';
                    if (host.includes('x.com') || host.includes('twitter.com')) return '🐦 X / Twitter';
                    if (host.includes('reddit.com')) return '🤖 Reddit';
                    if (host.includes('discord.com') || host.includes('discord.gg')) return '💬 Discord';
                    if (host.includes('telegram.org') || host.includes('t.me')) return '✈️ Telegram';
                    if (host.includes('mastodon')) return '🐘 Mastodon';
                    if (host.includes('threads.net')) return '🧵 Threads';
                    if (host.includes('bluesky')) return '🦋 Bluesky';
                    if (host.includes('steampowered.com') || host.includes('steamcommunity.com')) return '🎮 Steam';
                    if (host.includes('epicgames.com')) return '🛒 Epic Games';
                    if (host.includes('gog.com')) return '🛒 GOG';
                    if (host.includes('itch.io')) return '🎮 Itch.io';
                    if (host.includes('indienova.com')) return '🎮 Indienova';
                    if (host.includes('gamejolt.com')) return '🎮 Game Jolt';
                    if (host.includes('github.com')) return '🐙 GitHub';
                    if (host.includes('notion.so') || host.includes('notion.site')) return '📝 Notion';
                    if (host.includes('feishu.cn') || host.includes('larksuite.com')) return '📝 飞书';
                    const pathSegments = u.pathname.split('/').filter(s => s.length > 0);
                    const lastSegment = pathSegments[pathSegments.length - 1] || '';
                    if (lastSegment && lastSegment.includes('.')) {
                        const name = lastSegment.substring(0, lastSegment.lastIndexOf('.'));
                        if (name && name.length > 3) return `🔗 ${name.replace(/[-_]/g, ' ')}`;
                    }
                    const displayName = host.replace(/^www\./, '').replace(/\.(com|cn|net|org|tv|io|app|xyz|top)$/, '')
                        .replace(/[-_]/g, ' ');
                    if (displayName && displayName.length > 2) return `🔗 ${displayName.charAt(0).toUpperCase() + displayName.slice(1)}`;
                    return `🔗 视频链接`;
                } catch (_) {
                    if (url.includes('bilibili') || url.includes('b23.tv')) return '📺 B站视频';
                    if (url.includes('youtube') || url.includes('youtu.be')) return '▶️ YouTube';
                    if (url.includes('vimeo')) return '🎬 Vimeo';
                    if (url.includes('douyin')) return '🎵 抖音';
                    if (url.includes('weibo')) return '📱 微博';
                    if (url.includes('x.com') || url.includes('twitter')) return '🐦 X / Twitter';
                    return '🔗 视频链接';
                }
            }

            // ================================================================
            // ★ 游戏日记
            // ================================================================

            function openDiaryModal() {
                if (!currentUser) {
                    showToast('请先登录查看你的游戏日记', 1500);
                    return;
                }
                const diaryPage = document.getElementById('diaryPage');
                showDiaryCover();
                diaryPage.style.display = 'flex';
                document.body.style.overflow = 'hidden';
            }

            function closeDiaryModal() {
                const diaryPage = document.getElementById('diaryPage');
                if (diaryPage) diaryPage.style.display = 'none';
                document.body.style.overflow = '';
                const mobileDropdown = document.getElementById('diaryMobileDropdown');
                if (mobileDropdown) mobileDropdown.style.display = 'none';
            }

            function showDiaryCover() {
                const coverView = document.getElementById('diaryCoverView');
                const contentView = document.getElementById('diaryContentView');
                contentView.classList.add('diary-slide-out-right');
                const mobileDropdown = document.getElementById('diaryMobileDropdown');
                if (mobileDropdown) mobileDropdown.style.display = 'none';
                setTimeout(() => {
                    contentView.style.display = 'none';
                    contentView.classList.remove('diary-slide-out-right');
                    coverView.classList.add('diary-slide-in-left');
                    coverView.style.display = '';
                    setTimeout(() => coverView.classList.remove('diary-slide-in-left'), 400);
                }, 300);
                
                const reviews = userData.reviews || [];
                const played = userData.played || [];
                const unlockedAchievements = (userData.achievements || []);
                const totalAchievements = typeof ACHIEVEMENTS !== 'undefined' ? ACHIEVEMENTS.length : 0;
                const avatar = document.getElementById('diaryCoverAvatar');
                const username = document.getElementById('diaryCoverUsername');
                const stats = document.getElementById('diaryCoverStats');
                const achievementEl = document.getElementById('diaryCoverAchievement');
                
                if (currentUser) {
                    avatar.innerHTML = currentUser.user_metadata?.avatar_url ? 
                        `<img src="${escapeHTML(currentUser.user_metadata.avatar_url)}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;" />` : '👤';
                    username.textContent = currentUser.user_metadata?.display_name || currentUser.email?.split('@')[0] || '用户';
                }
                stats.innerHTML = `已记录 ${reviews.length} 款游戏 · 标记玩过 ${played.length} 款 · 成就 ${unlockedAchievements.length}/${totalAchievements}`;
                
                // 显示最高成就名称
                if (unlockedAchievements.length > 0 && typeof ACHIEVEMENTS !== 'undefined') {
                    const highestAchievement = ACHIEVEMENTS.filter(a => unlockedAchievements.includes(a.id)).pop();
                    achievementEl.textContent = highestAchievement ? `🏆 ${highestAchievement.name}` : '';
                    achievementEl.style.display = '';
                } else {
                    achievementEl.textContent = '🎯 暂无成就';
                    achievementEl.style.display = '';
                }

                // ★ 渲染封面统计饼图
                _renderCoverStatsChart(reviews);
            }

            // 渲染封面统计饼图
            function _renderCoverStatsChart(reviews) {
                const block = document.getElementById('diaryCoverStatsBlock');
                if (!block) return;
                if (!reviews || reviews.length === 0) {
                    block.style.display = 'none';
                    return;
                }
                // 表态分布：5大力推荐 / 4颇具亮点 / 3中规中矩 / 2谨慎选择 / 1强烈避雷
                let s5 = 0, s4 = 0, s3 = 0, s2 = 0, s1 = 0, totalHours = 0;
                reviews.forEach(r => {
                    const v = r.verdict || Math.round((r.rating || 0) / 2);
                    if (v >= 5) s5++;
                    else if (v >= 4) s4++;
                    else if (v >= 3) s3++;
                    else if (v >= 2) s2++;
                    else s1++;
                    totalHours += parseFloat(r.play_hours) || 0;
                });
                const total = reviews.length;
                const p5_ = s5 / total * 100;
                const p4_ = p5_ + s4 / total * 100;
                const p3_ = p4_ + s3 / total * 100;
                const p2_ = p3_ + s2 / total * 100;

                block.style.display = 'flex';
                block.innerHTML = `
                    <div class="diary-stats-chart">
                        <div class="diary-pie" style="background: conic-gradient(
                            #e74c3c 0% ${p5_}%,
                            #e67e22 ${p5_}% ${p4_}%,
                            #f1c40f ${p4_}% ${p3_}%,
                            #2ecc71 ${p3_}% ${p2_}%,
                            #1a8a1a ${p2_}% 100%
                        );">
                            <div class="diary-pie-center">
                                <div class="num">${total}</div>
                                <div class="lbl">款游戏</div>
                            </div>
                        </div>
                        <div class="diary-pie-legend">
                            <div class="lg-item"><span class="lg-dot" style="background:#e74c3c"></span>🔥大力推荐<span class="lg-count">${s5}</span></div>
                            <div class="lg-item"><span class="lg-dot" style="background:#e67e22"></span>✨颇具亮点<span class="lg-count">${s4}</span></div>
                            <div class="lg-item"><span class="lg-dot" style="background:#f1c40f"></span>⭐中规中矩<span class="lg-count">${s3}</span></div>
                            <div class="lg-item"><span class="lg-dot" style="background:#2ecc71"></span>⚡谨慎选择<span class="lg-count">${s2}</span></div>
                            <div class="lg-item"><span class="lg-dot" style="background:#1a8a1a"></span>⚠️强烈避雷<span class="lg-count">${s1}</span></div>
                        </div>
                    </div>
                    ${totalHours > 0 ? `
                    <div class="diary-stats-chart">
                        <div class="diary-pie" style="background: conic-gradient(var(--accent) 0% 100%);">
                            <div class="diary-pie-center">
                                <div class="num">${Math.round(totalHours)}</div>
                                <div class="lbl">总时长(h)</div>
                            </div>
                        </div>
                        <div class="diary-pie-legend">
                            <div class="lg-item"><span class="lg-dot" style="background:var(--accent)"></span>总游玩<span class="lg-count">${Math.round(totalHours)}h</span></div>
                            <div class="lg-item"><span class="lg-dot" style="background:var(--accent2)"></span>平均<span class="lg-count">${(totalHours/total).toFixed(1)}h</span></div>
                        </div>
                    </div>
                    ` : ''}
                `;
            }

            function showDiaryContent() {
                const coverView = document.getElementById('diaryCoverView');
                const contentView = document.getElementById('diaryContentView');
                coverView.classList.add('diary-slide-out-left');
                setTimeout(() => {
                    coverView.style.display = 'none';
                    coverView.classList.remove('diary-slide-out-left');
                    contentView.classList.add('diary-slide-in-right');
                    contentView.style.display = '';
                    renderDiaryContent();
                    setTimeout(() => contentView.classList.remove('diary-slide-in-right'), 400);
                }, 300);
            }

            // 构建左页内容 HTML
            function buildDiaryLeftPageHTML(r, game) {
                const gameTitle = game.title || `游戏 #${r.game_id}`;
                const gameCover = game.cover || null;
                const gameDesc = game.description || '';
                const gameGenre = Array.isArray(game.genre) ? game.genre.join('、') : (game.genre || '');
                const gamePlaystyle = Array.isArray(game.gameplay) ? game.gameplay.join('、') : (game.gameplay || '');
                const gamePerspective = game.perspective || '';
                const gameChinese = game.hasChinese || '';
                const gameRelease = game.releaseDate || '';
                const gamePlatforms = Array.isArray(game.platforms) ? game.platforms.join('、') : (game.platforms || '');
                const gameScreenshots = Array.isArray(game.screenshots) ? game.screenshots.slice(0, 2) : [];

                const coverHtml = gameCover ?
                    `<img src="${gameCover}" alt="${escapeHTML(gameTitle)}" loading="lazy" />` :
                    `<div class="game-cover-placeholder">${SVG_ICONS.gamepad}</div>`;

                let screenshotsHtml = '';
                if (gameScreenshots.length > 0) {
                    screenshotsHtml = gameScreenshots.map((s, idx) => {
                        const isGif = /\.gif(\?|$)/i.test(s);
                        const isVideo = /\.(mp4|webm|mov|avi)(\?|$)/i.test(s);
                        if (isVideo) {
                            return `<div class="screenshot-wrap video-wrap"><video src="${escapeURL(s)}" autoplay loop muted playsinline onclick="this.paused?this.play():this.pause()" /></div>`;
                        }
                        const wrapClass = 'screenshot-wrap' + (isGif ? ' gif-img' : '');
                        const badge = isGif ? '<span class="gif-badge">GIF</span>' : '';
                        const loadingAttr = isGif ? '' : 'loading="lazy"';
                        const src = escapeURL(s);
                        return `<div class="${wrapClass}"><img ${loadingAttr} src="${src}" alt="游戏截图 ${idx + 1}" />${badge}</div>`;
                    }).join('');
                    screenshotsHtml = `
                        <div class="game-screenshots">
                            <div class="screenshots-title">📸 游戏截图</div>
                            <div class="detail-screenshots-grid">
                                ${screenshotsHtml}
                            </div>
                        </div>
                    `;
                }

                let infoItems = '';
                if (gameGenre) infoItems += `<div class="game-info-item"><span class="game-info-label">🎭 题材</span><span class="game-info-value">${escapeHTML(gameGenre)}</span></div>`;
                if (gamePlaystyle) infoItems += `<div class="game-info-item"><span class="game-info-label">🎮 玩法</span><span class="game-info-value">${escapeHTML(gamePlaystyle)}</span></div>`;
                if (gamePerspective) infoItems += `<div class="game-info-item"><span class="game-info-label">👁 视角</span><span class="game-info-value">${escapeHTML(gamePerspective)}</span></div>`;
                if (gameChinese) infoItems += `<div class="game-info-item"><span class="game-info-label">🌐 中文</span><span class="game-info-value">${escapeHTML(gameChinese)}</span></div>`;
                if (gameRelease) infoItems += `<div class="game-info-item"><span class="game-info-label">📅 发行日期</span><span class="game-info-value">${escapeHTML(gameRelease)}</span></div>`;
                if (gamePlatforms) infoItems += `<div class="game-info-item"><span class="game-info-label">🖥 平台</span><span class="game-info-value">${escapeHTML(gamePlatforms)}</span></div>`;

                return `
                    <div class="page-header">
                        <div class="page-brand">Her Lens</div>
                        <div class="page-title">📖 游戏信息</div>
                    </div>
                    <div class="game-cover">${coverHtml}</div>
                    <div class="game-name">${escapeHTML(gameTitle)}</div>
                    ${gameGenre ? `<div class="game-tags">${escapeHTML(gameGenre).split('、').map(g => `<span class="tag">${g}</span>`).join('')}</div>` : ''}
                    ${gameDesc ? `<div class="game-description">${escapeHTML(gameDesc)}</div>` : ''}
                    ${infoItems ? `<div class="game-info">${infoItems}</div>` : ''}
                    ${screenshotsHtml}
                `;
            }

            // 构建右页内容 HTML
            function buildDiaryRightPageHTML(r, game) {
                const verdictInfo = getVerdictInfo(r.verdict);
                const verdictHtml = verdictInfo ?
                    `<span style="font-weight:600;font-size:1.1rem;color:${verdictInfo.color}">${verdictInfo.emoji} ${verdictInfo.label}</span>` :
                    '<span style="color:var(--text3);font-size:0.9rem;">未评分</span>';
                const tagsHtml = renderTagsDisplay(r.selected_tags);
                const timeStr = r.created_at ?
                    new Date(r.created_at).toLocaleDateString('zh-CN', {
                        year: 'numeric', month: 'short', day: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                    }) : '';
                const playDate = r.play_date || '';
                const playHours = r.play_hours || '';

                // 优先加载草稿（如果存在且未过期）
                const draftHtml = loadDraft(r.game_id);
                const reviewDisplay = draftHtml || (r.comment ? sanitizeCommentHTML(r.comment) : '点击此处写下你的评论...');

                return `
                    <div class="page-header">
                        <div class="page-brand">Her Lens</div>
                        <div class="page-title">✍️ 我的评价</div>
                    </div>
                    <div class="review-section">
                        <div class="review-rating">
                            <div>${verdictHtml}</div>
                            ${tagsHtml ? `<div>${tagsHtml}</div>` : ''}
                        </div>
                        <div class="review-meta">
                            <div class="meta-item">
                                <span class="meta-icon">📅</span>
                                <span>游玩日期：</span>
                                <input type="date" class="diary-date-input" value="${playDate}" data-game-id="${r.game_id}" />
                            </div>
                            <div class="meta-item">
                                <span class="meta-icon">🕐</span>
                                <span>评论时间：${timeStr}</span>
                            </div>
                            <div class="playtime-input-row">
                                <span class="meta-icon">⏱️</span>
                                <span>游玩时长：</span>
                                <input type="number" min="0" step="0.5" value="${playHours}" placeholder="0" data-game-id="${r.game_id}" /> 小时
                            </div>
                        </div>
                        <div class="review-content">
                            <div class="review-label">
                                📝 我的评论
                                <button class="toolbar-toggle-btn" data-game-id="${r.game_id}" title="显示/隐藏排版工具">🎨</button>
                            </div>
                            <div class="text-format-toolbar" data-game-id="${r.game_id}">
                                <button class="format-btn" data-cmd="bold" title="加粗"><b>B</b></button>
                                <button class="format-btn" data-cmd="underline" title="下划线"><u>U</u></button>
                                <button class="format-btn" data-cmd="strikeThrough" title="删除线"><s>S</s></button>
                                <span class="toolbar-divider"></span>
                                <button class="format-btn" data-cmd="justifyLeft" title="左对齐"><span class="align-icon">≡</span></button>
                                <button class="format-btn" data-cmd="justifyCenter" title="居中"><span class="align-icon center">≡</span></button>
                                <button class="format-btn" data-cmd="justifyRight" title="右对齐"><span class="align-icon right">≡</span></button>
                                <span class="toolbar-divider"></span>
                                <select class="font-size-select" title="字号">
                                    <option value="1">小号</option>
                                    <option value="3" selected>正常</option>
                                    <option value="5">大号</option>
                                </select>
                            </div>
                            <div class="review-text" contenteditable="true" data-game-id="${r.game_id}">${reviewDisplay}</div>
                        </div>
                    </div>
                `;
            }

            // 自然翻书动效 - 双面纸张翻页
            let diaryFlipping = false;

            function isMobileView() {
                return window.innerWidth <= 768;
            }

            // 检查当前日记页是否有未保存的编辑内容
            function hasUnsavedDiaryChanges() {
                const reviewText = document.querySelector('.review-text[data-game-id]');
                if (!reviewText) return false;
                const gameId = Number(reviewText.dataset.gameId);
                const currentHtml = reviewText.innerHTML;
                const savedComment = userData.reviews.find(r => r.game_id === gameId)?.comment || '';
                const draftHtml = loadDraft(gameId);
                const savedHtml = sanitizeCommentHTML(savedComment);
                // 有草稿且草稿与已保存内容不同 → 未保存
                if (draftHtml && draftHtml !== savedHtml) return true;
                // 无草稿但当前内容与已保存内容不同（且不是占位符）→ 未保存
                if (!draftHtml && currentHtml !== savedHtml && currentHtml !== '点击此处写下你的评论...') return true;
                return false;
            }

            function flipDiaryPage(direction) {
                if (diaryFlipping) return;
                // 翻页前检查未保存内容
                if (hasUnsavedDiaryChanges()) {
                    if (!confirm('你还有未保存的评论内容，确定要翻页吗？未保存的内容将保留在草稿中。')) return;
                }
                const spread = document.querySelector('.diary-spread');
                const rightPage = document.querySelector('.diary-page-right');
                const leftPage = document.querySelector('.diary-page-left');
                const flipSheet = document.querySelector('.diary-flip-sheet');
                const castShadow = document.querySelector('.diary-cast-shadow');
                const spineHighlight = document.querySelector('.diary-spine-highlight');
                if (!flipSheet || !rightPage || !leftPage) return;

                const nextIdx = direction === 'next' ? diaryCurrentPage + 1 : diaryCurrentPage - 1;
                if (nextIdx < 0 || nextIdx >= diarySortedReviews.length) return;

                playDiaryFlipSound();

                diaryFlipping = true;
                const front = flipSheet.querySelector('.flip-face-front');
                const back = flipSheet.querySelector('.flip-face-back');
                const nextReview = diarySortedReviews[nextIdx];
                const nextGame = games.find(g => g.id === Number(nextReview.game_id));

                if (direction === 'next') {
                    // 正面=当前右页内容，背面=下一页左页内容
                    front.innerHTML = rightPage.innerHTML;
                    if (nextGame) back.innerHTML = buildDiaryLeftPageHTML(nextReview, nextGame);
                    // 定位翻页层在右页位置
                    flipSheet.style.right = '0';
                    flipSheet.style.left = '';
                    flipSheet.style.transformOrigin = 'left center';
                    front.style.borderRadius = '0 20px 20px 0';
                    back.style.borderRadius = '20px 0 0 20px';
                    // 重置位置
                    flipSheet.style.transition = 'none';
                    flipSheet.classList.add('active');
                    flipSheet.classList.remove('flipping', 'flipping-back');
                    flipSheet.style.transform = 'rotateY(0deg)';
                    castShadow.classList.add('active');
                    spineHighlight.classList.add('active');
                    rightPage.style.visibility = 'hidden';
                    // 触发翻转
                    requestAnimationFrame(() => {
                        flipSheet.style.transition = '';
                        flipSheet.classList.add('flipping');
                        castShadow.classList.add('show');
                    });
                    // 动画中途更新底层内容
                    setTimeout(() => {
                        diaryCurrentPage = nextIdx;
                        renderDiaryPage();
                    }, 450);
                    // 动画结束重置
                    setTimeout(() => {
                        flipSheet.classList.remove('active', 'flipping');
                        flipSheet.style.transform = '';
                        castShadow.classList.remove('active', 'show');
                        spineHighlight.classList.remove('active');
                        diaryFlipping = false;
                    }, 950);
                } else {
                    // 往回翻：正面=当前左页内容，背面=上一页右页内容
                    front.innerHTML = leftPage.innerHTML;
                    if (nextGame) back.innerHTML = buildDiaryRightPageHTML(nextReview, nextGame);
                    // 定位翻页层在左页位置
                    flipSheet.style.left = '0';
                    flipSheet.style.right = '';
                    flipSheet.style.transformOrigin = 'right center';
                    front.style.borderRadius = '20px 0 0 20px';
                    back.style.borderRadius = '0 20px 20px 0';
                    // 先无动画地把翻页层放到已翻状态
                    flipSheet.style.transition = 'none';
                    flipSheet.classList.add('active');
                    flipSheet.classList.remove('flipping', 'flipping-back');
                    flipSheet.style.transform = 'rotateY(-180deg)';
                    leftPage.style.visibility = 'hidden';
                    castShadow.classList.add('active');
                    spineHighlight.classList.add('active');
                    // 触发翻回动画
                    requestAnimationFrame(() => {
                        flipSheet.style.transition = '';
                        flipSheet.classList.add('flipping-back');
                        castShadow.classList.add('show');
                    });
                    // 动画中途更新底层内容
                    setTimeout(() => {
                        diaryCurrentPage = nextIdx;
                        renderDiaryPage();
                    }, 450);
                    // 动画结束重置
                    setTimeout(() => {
                        flipSheet.classList.remove('active', 'flipping-back');
                        flipSheet.style.transform = '';
                        flipSheet.style.transition = '';
                        flipSheet.style.left = '';
                        flipSheet.style.right = '';
                        flipSheet.style.transformOrigin = '';
                        castShadow.classList.remove('active', 'show');
                        spineHighlight.classList.remove('active');
                        diaryFlipping = false;
                    }, 950);
                }
            }

            // 当前日记页码
            let diaryCurrentPage = 0;
            let diarySortedReviews = [];

            // ★ 新功能整合状态
            const DIARY_PREFS_KEY = 'heroine_diary_prefs_v1';
            const DIARY_DRAFT_KEY = 'heroine_diary_draft_v1';
            const DIARY_READING_KEY = 'heroine_diary_reading_v1';
            let diaryBookmarkCustomOrder = [];      // 自定义顺序的 game_id 数组
            let _diaryDraftTimer = null;            // 草稿保存定时器
            let _diaryLastTouchX = 0;               // 触摸起点 X
            let _diaryLastTouchY = 0;               // 触摸起点 Y
            let _diaryLastTapTime = 0;              // 上次点击时间（双击检测）

            // 加载偏好设置
            function loadDiaryPrefs() {
                try {
                    const p = JSON.parse(localStorage.getItem(DIARY_PREFS_KEY) || '{}');
                    diaryBookmarkCustomOrder = Array.isArray(p.customOrder) ? p.customOrder : [];
                } catch (_) {}
            }
            function saveDiaryPrefs() {
                try {
                    localStorage.setItem(DIARY_PREFS_KEY, JSON.stringify({
                        customOrder: diaryBookmarkCustomOrder
                    }));
                } catch (_) {}
            }
            loadDiaryPrefs();

            function renderDiaryContent() {
                const container = document.getElementById('diaryContent');
                if (!container) return;

                const reviews = userData.reviews || [];
                if (reviews.length === 0) {
                    container.innerHTML = `
                        <div class="diary-empty-fancy">
                            <span class="empty-icon-big">📖</span>
                            <div class="empty-title-big">还没有写过游戏日记</div>
                            <div class="empty-desc-big">记录第一款你玩过的女性主角游戏<br/>开启你的专属游戏日记吧~</div>
                            <button class="empty-cta-btn" onclick="closeDiaryModal()">✍️ 去写第一篇日记</button>
                        </div>
                    `;
                    const rail = document.getElementById('diaryBookmarkRail');
                    if (rail) rail.innerHTML = '';
                    updateDiaryProgress();
                    return;
                }

                // 骨架屏（短暂展示，提升加载感）
                container.innerHTML = `
                    <div class="diary-skeleton">
                        <div class="diary-skeleton-page">
                            <div class="sk-cover"></div>
                            <div class="sk-line medium"></div>
                            <div class="sk-line short"></div>
                            <div class="sk-line long"></div>
                            <div class="sk-line long"></div>
                        </div>
                        <div class="diary-skeleton-page">
                            <div class="sk-line short"></div>
                            <div class="sk-line long"></div>
                            <div class="sk-line long"></div>
                            <div class="sk-line medium"></div>
                            <div class="sk-line long"></div>
                        </div>
                    </div>
                `;

                // 短延时后渲染真实内容
                setTimeout(() => _renderDiaryContentReal(reviews), 200);
            }

            function _renderDiaryContentReal(reviews) {
                const container = document.getElementById('diaryContent');
                if (!container) return;

                const sortBy = document.getElementById('diarySortSelect')?.value || 'play_date';
                if (sortBy === 'custom' && diaryBookmarkCustomOrder.length > 0) {
                    // 自定义顺序：先按 customOrder 排，未在列表中的追加到末尾
                    const orderMap = new Map();
                    diaryBookmarkCustomOrder.forEach((gid, i) => orderMap.set(Number(gid), i));
                    diarySortedReviews = [...reviews].sort((a, b) => {
                        const ia = orderMap.has(Number(a.game_id)) ? orderMap.get(Number(a.game_id)) : 99999;
                        const ib = orderMap.has(Number(b.game_id)) ? orderMap.get(Number(b.game_id)) : 99999;
                        return ia - ib;
                    });
                } else {
                    diarySortedReviews = [...reviews].sort((a, b) => {
                        if (sortBy === 'play_date') {
                            const da = a.play_date || a.created_at || '';
                            const db = b.play_date || b.created_at || '';
                            return db.localeCompare(da);
                        } else if (sortBy === 'rating') {
                            const aVal = (a.verdict != null ? a.verdict : (a.rating ? Math.round(a.rating / 2) : 0));
                            const bVal = (b.verdict != null ? b.verdict : (b.rating ? Math.round(b.rating / 2) : 0));
                            return bVal - aVal;
                        } else {
                            const da = a.created_at || '';
                            const db = b.created_at || '';
                            return db.localeCompare(da);
                        }
                    });
                }

                if (diaryCurrentPage >= diarySortedReviews.length) {
                    diaryCurrentPage = 0;
                }

                // 恢复阅读进度
                _restoreReadingProgress();

                renderDiaryPage();
                renderDiaryBookmarks();
                updateDiaryProgress();
            }

            // 更新翻页进度条
            function updateDiaryProgress() {
                const total = diarySortedReviews.length;
                const cur = diaryCurrentPage + 1;
                const fill = document.getElementById('diaryProgressBarFill');
                const text = document.getElementById('diaryProgressText');
                if (fill) fill.style.width = total > 0 ? `${(cur / total) * 100}%` : '0%';
                if (text) text.innerHTML = total > 0 ? `第 <strong>${cur}</strong> 页 / 共 ${total} 页` : '';
                const mobileLabel = document.getElementById('diaryMobilePageLabel');
                if (mobileLabel) mobileLabel.textContent = total > 0 ? `${cur}/${total}` : '0/0';
                // 保存阅读进度
                if (total > 0) _saveReadingProgress();
            }

            function _saveReadingProgress() {
                try {
                    const r = diarySortedReviews[diaryCurrentPage];
                    if (!r) return;
                    localStorage.setItem(DIARY_READING_KEY, JSON.stringify({
                        gameId: Number(r.game_id),
                        page: diaryCurrentPage,
                        ts: Date.now()
                    }));
                } catch (_) {}
            }
            function _restoreReadingProgress() {
                try {
                    const saved = JSON.parse(localStorage.getItem(DIARY_READING_KEY) || 'null');
                    if (!saved || !saved.gameId) return;
                    // 7天内有效
                    if (Date.now() - (saved.ts || 0) > 7 * 24 * 3600 * 1000) return;
                    const idx = diarySortedReviews.findIndex(r => Number(r.game_id) === Number(saved.gameId));
                    if (idx >= 0) diaryCurrentPage = idx;
                } catch (_) {}
            }

            // 翻页音效已移除
            function playDiaryFlipSound() {}

            // 草稿自动保存
            function autoSaveDraft(gameId, html) {
                try {
                    const drafts = JSON.parse(localStorage.getItem(DIARY_DRAFT_KEY) || '{}');
                    drafts[String(gameId)] = { html, ts: Date.now() };
                    localStorage.setItem(DIARY_DRAFT_KEY, JSON.stringify(drafts));
                    // 显示提示
                    let tip = document.querySelector('.draft-save-tip');
                    if (!tip) {
                        const editor = document.querySelector(`.review-text[data-game-id="${gameId}"]`);
                        if (editor) {
                            const parent = editor.parentElement;
                            if (parent) {
                                parent.style.position = parent.style.position || 'relative';
                                tip = document.createElement('div');
                                tip.className = 'draft-save-tip';
                                parent.appendChild(tip);
                            }
                        }
                    }
                    if (tip) {
                        tip.innerHTML = '<span class="dot"></span> 草稿已自动保存';
                        tip.classList.add('show');
                        clearTimeout(_diaryDraftTimer);
                        _diaryDraftTimer = setTimeout(() => tip.classList.remove('show'), 1500);
                    }
                } catch (_) {}
            }
            function loadDraft(gameId) {
                try {
                    const drafts = JSON.parse(localStorage.getItem(DIARY_DRAFT_KEY) || '{}');
                    const d = drafts[String(gameId)];
                    if (d && d.html) {
                        // 1天内有效
                        if (Date.now() - (d.ts || 0) < 24 * 3600 * 1000) return d.html;
                    }
                } catch (_) {}
                return null;
            }
            function clearDraft(gameId) {
                try {
                    const drafts = JSON.parse(localStorage.getItem(DIARY_DRAFT_KEY) || '{}');
                    delete drafts[String(gameId)];
                    localStorage.setItem(DIARY_DRAFT_KEY, JSON.stringify(drafts));
                } catch (_) {}
            }

            // 渲染桌面端书签丝带
            function renderDiaryBookmarks() {
                const rail = document.getElementById('diaryBookmarkRail');
                if (!rail) return;
                if (diarySortedReviews.length === 0) {
                    rail.innerHTML = '';
                    return;
                }

                rail.innerHTML = diarySortedReviews.map((r, i) => {
                    const game = games.find(g => g.id === Number(r.game_id));
                    const title = game ? game.title : `游戏 #${r.game_id}`;
                    const verdictVal = r.verdict || Math.round((r.rating || 0) / 2);
                    const vInfo = getVerdictInfo(verdictVal);
                    const verdictIcon = vInfo ? vInfo.emoji + vInfo.label : '未评分';
                    const date = (r.play_date || '').slice(5);
                    const gid = Number(r.game_id);

                    return `
                        <div class="diary-ribbon ${i === diaryCurrentPage ? 'active' : ''}" data-page="${i}" data-game-id="${gid}" draggable="true">
                            <span class="ribbon-drag-handle" title="拖拽排序">⋮⋮</span>
                            <div class="ribbon-label">
                                <span class="ribbon-name">${escapeHTML(title)}</span>
                                <span class="ribbon-sub">${verdictIcon}　📅 ${date}</span>
                            </div>
                            <div class="ribbon-tip">${escapeHTML(title)} <strong>${verdictIcon}</strong> · 📅 ${r.play_date || ''}</div>
                        </div>
                    `;
                }).join('');

                rail.querySelectorAll('.diary-ribbon').forEach(rb => {
                    rb.addEventListener('click', (e) => {
                        if (e.target.classList.contains('ribbon-drag-handle')) return;
                        if (diaryFlipping) return;
                        const target = parseInt(rb.dataset.page);
                        if (target === diaryCurrentPage) return;
                        if (hasUnsavedDiaryChanges()) {
                            if (!confirm('你还有未保存的评论内容，确定要跳转吗？未保存的内容将保留在草稿中。')) return;
                        }
                        if (isMobileView()) {
                            playDiaryFlipSound();
                            diaryCurrentPage = target;
                            renderDiaryPage();
                        } else if (Math.abs(target - diaryCurrentPage) === 1) {
                            const direction = target > diaryCurrentPage ? 'next' : 'prev';
                            flipDiaryPage(direction);
                        } else {
                            playDiaryFlipSound();
                            diaryCurrentPage = target;
                            renderDiaryPage();
                        }
                        document.getElementById('diaryPage').scrollTo({ top: 0, behavior: 'smooth' });
                    });

                    // 拖拽排序
                    rb.addEventListener('dragstart', (e) => {
                        rb.classList.add('dragging');
                        e.dataTransfer.effectAllowed = 'move';
                        e.dataTransfer.setData('text/plain', rb.dataset.page);
                    });
                    rb.addEventListener('dragend', () => {
                        rb.classList.remove('dragging');
                        rail.querySelectorAll('.diary-ribbon').forEach(r => r.classList.remove('drag-over'));
                    });
                    rb.addEventListener('dragover', (e) => {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = 'move';
                        rb.classList.add('drag-over');
                    });
                    rb.addEventListener('dragleave', () => rb.classList.remove('drag-over'));
                    rb.addEventListener('drop', (e) => {
                        e.preventDefault();
                        rb.classList.remove('drag-over');
                        const fromIdx = parseInt(e.dataTransfer.getData('text/plain'));
                        const toIdx = parseInt(rb.dataset.page);
                        if (isNaN(fromIdx) || fromIdx === toIdx) return;
                        const moved = diarySortedReviews.splice(fromIdx, 1)[0];
                        diarySortedReviews.splice(toIdx, 0, moved);
                        _syncCustomOrderFromCurrent();
                        const sortSel = document.getElementById('diarySortSelect');
                        if (sortSel) sortSel.value = 'custom';
                        diaryCurrentPage = toIdx;
                        saveDiaryPrefs();
                        renderDiaryBookmarks();
                        renderDiaryPage();
                        showToast('✅ 已调整顺序（自定义排序已保存）', 1500);
                    });
                });
            }

            // 同步当前排序到 customOrder
            function _syncCustomOrderFromCurrent() {
                diaryBookmarkCustomOrder = diarySortedReviews.map(r => Number(r.game_id));
                saveDiaryPrefs();
            }

            // 更新书签高亮
            function updateBookmarkActive() {
                document.querySelectorAll('.diary-ribbon').forEach((rb, i) => {
                    rb.classList.toggle('active', i === diaryCurrentPage);
                });
                const mobileLabel = document.getElementById('diaryMobilePageLabel');
                if (mobileLabel) {
                    mobileLabel.textContent = `${diaryCurrentPage + 1}/${diarySortedReviews.length}`;
                }
            }

            // 渲染移动端书签列表
            function renderMobileBookmarkList(filter) {
                const list = document.getElementById('diaryMobileList');
                if (!list) return;
                const f = (filter || '').trim().toLowerCase();
                const items = diarySortedReviews.map((r, i) => {
                    const game = games.find(g => g.id === Number(r.game_id));
                    const title = game ? game.title : `游戏 #${r.game_id}`;
                    const verdictVal = r.verdict || Math.round((r.rating || 0) / 2);
                    const vInfo = getVerdictInfo(verdictVal);
                    return { r, i, title, rating: r.rating || 0, verdictIcon: vInfo ? vInfo.emoji : '', game };
                }).filter(({ title }) => {
                    if (f && !title.toLowerCase().includes(f)) return false;
                    return true;
                });

                if (items.length === 0) {
                    list.innerHTML = '<div style="padding:20px;text-align:center;color:var(--text3);font-size:0.8rem;">无匹配结果</div>';
                    return;
                }
                list.innerHTML = items.map(({ title, verdictIcon, i }) => `
                    <div class="diary-mobile-item ${i === diaryCurrentPage ? 'active' : ''}" data-page="${i}">
                        <div class="diary-mobile-idx">${i + 1}</div>
                        <div class="diary-mobile-item-name">${escapeHTML(title)}</div>
                        <div class="diary-mobile-item-score">${verdictIcon}</div>
                    </div>
                `).join('');
                list.querySelectorAll('.diary-mobile-item').forEach(it => {
                    it.addEventListener('click', () => {
                        const target = parseInt(it.dataset.page);
                        document.getElementById('diaryMobileDropdown').style.display = 'none';
                        if (target === diaryCurrentPage) return;
                        if (hasUnsavedDiaryChanges()) {
                            if (!confirm('你还有未保存的评论内容，确定要跳转吗？未保存的内容将保留在草稿中。')) return;
                        }
                        playDiaryFlipSound();
                        diaryCurrentPage = target;
                        renderDiaryPage();
                        document.getElementById('diaryPage').scrollTo({ top: 0, behavior: 'smooth' });
                    });
                });
            }

            function renderDiaryPage() {
                const container = document.getElementById('diaryContent');
                if (!container || diarySortedReviews.length === 0) return;

                const r = diarySortedReviews[diaryCurrentPage];
                const game = games.find(g => g.id === Number(r.game_id));
                if (!game) return;

                const leftHTML = buildDiaryLeftPageHTML(r, game);
                const rightHTML = buildDiaryRightPageHTML(r, game);

                const html = `
                    <div class="diary-entry-wrapper">
                        <div class="diary-spread" data-game-id="${r.game_id}">
                            <!-- 左页 - 游戏信息 -->
                            <div class="diary-page-left texture-card">
                                ${leftHTML}
                            </div>
                            <!-- 右页 - 评论内容 -->
                            <div class="diary-page-right texture-card">
                                ${rightHTML}
                            </div>
                            <!-- 书脊高光 -->
                            <div class="diary-spine-highlight"></div>
                            <!-- 投射阴影 -->
                            <div class="diary-cast-shadow"></div>
                            <!-- 翻页层（双面纸张） -->
                            <div class="diary-flip-sheet">
                                <div class="flip-face flip-face-front"></div>
                                <div class="flip-face flip-face-back"></div>
                            </div>
                        </div>
                        <!-- 底部操作栏 -->
                        <div class="diary-bottom-bar">
                            <div class="diary-bottom-actions">
                                <button class="action-btn diary-delete-btn" data-game-id="${r.game_id}">🗑️ 删除</button>
                                <button class="action-btn primary diary-save-btn" data-game-id="${r.game_id}">💾 保存</button>
                            </div>
                            <div class="diary-page-nav-inline">
                                <button class="diary-page-nav-btn" id="diaryPrevBtnInline">◀</button>
                                <span class="diary-page-info">${diaryCurrentPage + 1} / ${diarySortedReviews.length}</span>
                                <button class="diary-page-nav-btn" id="diaryNextBtnInline">▶</button>
                            </div>
                        </div>
                    </div>
                `;

                container.innerHTML = html;

                bindDiaryEvents();
                updateBookmarkActive();
                updateDiaryProgress();

                document.getElementById('diaryPrevBtnInline')?.addEventListener('click', () => {
                    if (diaryCurrentPage > 0) {
                        if (hasUnsavedDiaryChanges()) {
                            if (!confirm('你还有未保存的评论内容，确定要翻页吗？未保存的内容将保留在草稿中。')) return;
                        }
                        playDiaryFlipSound();
                        if (isMobileView()) {
                            diaryCurrentPage--;
                            renderDiaryPage();
                        } else {
                            flipDiaryPage('prev');
                        }
                        document.getElementById('diaryPage').scrollTo({ top: 0, behavior: 'smooth' });
                    }
                });
                document.getElementById('diaryNextBtnInline')?.addEventListener('click', () => {
                    if (diaryCurrentPage < diarySortedReviews.length - 1) {
                        if (hasUnsavedDiaryChanges()) {
                            if (!confirm('你还有未保存的评论内容，确定要翻页吗？未保存的内容将保留在草稿中。')) return;
                        }
                        playDiaryFlipSound();
                        if (isMobileView()) {
                            diaryCurrentPage++;
                            renderDiaryPage();
                        } else {
                            flipDiaryPage('next');
                        }
                        document.getElementById('diaryPage').scrollTo({ top: 0, behavior: 'smooth' });
                    }
                });
            }

            function bindDiaryEvents() {
                document.querySelectorAll('.format-btn').forEach(btn => {
                    btn.addEventListener('click', function() {
                        document.execCommand(this.dataset.cmd, false, null);
                    });
                });

                document.querySelectorAll('.font-size-select').forEach(select => {
                    select.addEventListener('change', function() {
                        document.execCommand('fontSize', false, this.value);
                    });
                });

                document.querySelectorAll('.toolbar-toggle-btn').forEach(btn => {
                    const gameId = btn.dataset.gameId;
                    const toolbar = document.querySelector(`.text-format-toolbar[data-game-id="${gameId}"]`);
                    if (!toolbar) return;
                    const saved = localStorage.getItem('diary_toolbar_' + gameId);
                    if (saved === 'collapsed') {
                        toolbar.classList.add('collapsed');
                        btn.classList.remove('active');
                    } else {
                        btn.classList.add('active');
                    }
                    btn.addEventListener('click', function() {
                        toolbar.classList.toggle('collapsed');
                        this.classList.toggle('active');
                        localStorage.setItem('diary_toolbar_' + gameId, toolbar.classList.contains('collapsed') ? 'collapsed' : 'expanded');
                    });
                });

                document.querySelectorAll('.review-text[data-game-id]').forEach(el => {
                    el.addEventListener('focus', function() {
                        if (this.textContent === '点击此处写下你的评论...') {
                            this.innerHTML = '';
                        }
                    });
                    el.addEventListener('blur', function(e) {
                        const related = e.relatedTarget;
                        if (related && (related.classList.contains('diary-save-btn') || related.classList.contains('diary-delete-btn'))) return;
                        if (!this.textContent.trim()) {
                            this.innerHTML = '点击此处写下你的评论...';
                        }
                    });
                    // ★ 草稿自动保存
                    const gameId = Number(el.dataset.gameId);
                    el.addEventListener('input', function() {
                        const text = this.textContent || '';
                        if (text && text !== '点击此处写下你的评论...') {
                            autoSaveDraft(gameId, this.innerHTML);
                        }
                    });
                });

                // ★ 游戏时长输入
                document.querySelectorAll('.playtime-input-row input').forEach(input => {
                    input.addEventListener('change', async function() {
                        const gameId = Number(this.dataset.gameId);
                        const hours = parseFloat(this.value) || 0;
                        const review = userData.reviews.find(r => r.game_id === gameId);
                        if (review) {
                            review.play_hours = hours;
                            saveUserData();
                            if (SUPABASE_ENABLED && supabaseClient && currentUser) {
                                try {
                                    await supabaseClient.from('user_reviews')
                                        .update({ play_hours: hours })
                                        .eq('user_id', currentUser.id)
                                        .eq('game_id', gameId);
                                } catch (_) {}
                            }
                            showToast(hours > 0 ? `⏱️ 已记录 ${hours}h` : '已清除时长', 1200);
                        }
                    });
                });

                document.querySelectorAll('.diary-date-input').forEach(input => {
                    input.addEventListener('change', async function() {
                        const gameId = Number(this.dataset.gameId);
                        const review = userData.reviews.find(r => r.game_id === gameId);
                        if (review) {
                            review.play_date = this.value;
                            saveUserData();
                            if (SUPABASE_ENABLED && supabaseClient && currentUser) {
                                const { error } = await supabaseClient.from('user_reviews')
                                    .update({ play_date: this.value })
                                    .eq('user_id', currentUser.id)
                                    .eq('game_id', gameId);
                                if (error) {
                                    showToast('日期同步失败', 1500);
                                }
                            }
                        }
                    });
                });

                document.querySelectorAll('.diary-save-btn').forEach(btn => {
                    btn.addEventListener('click', async function() {
                        const btn = this;
                        const gameId = Number(btn.dataset.gameId);
                        const el = document.querySelector(`.review-text[data-game-id="${gameId}"]`);
                        if (!el) { showToast('⚠️ 未找到编辑区', 1500); return; }
                        const rawHtml = el.innerHTML || '';
                        const textContent = el.textContent || '';
                        const isPlaceholder = textContent === '点击此处写下你的评论...';
                        const cleanText = isPlaceholder ? null : sanitizeCommentHTML(rawHtml).trim() || null;
                        const review = userData.reviews.find(r => r.game_id === gameId);
                        if (!review) { showToast('⚠️ 未找到评论数据', 1500); return; }

                        const origText = btn.textContent;
                        btn.disabled = true;
                        btn.textContent = '⏳ 保存中...';

                        try {
                            review.comment = cleanText;
                            review.updated_at = new Date().toISOString();
                            saveUserData();

                            let cloudOk = true;
                            if (SUPABASE_ENABLED && supabaseClient && currentUser) {
                                const { error } = await supabaseClient.from('user_reviews')
                                    .update({ comment: cleanText, updated_at: review.updated_at, play_hours: review.play_hours || 0 })
                                    .eq('user_id', currentUser.id)
                                    .eq('game_id', gameId);
                                if (error) { cloudOk = false; console.error('云端同步失败:', error); }
                            }

                            btn.textContent = '✅ 已保存';
                            // ★ 清除草稿
                            clearDraft(gameId);
                            showToast(cloudOk ? '✅ 保存成功（已云端同步）' : '✅ 本地已保存（云端同步失败）', 2000);
                            setTimeout(() => { btn.textContent = origText; btn.disabled = false; }, 1500);
                        } catch (e) {
                            console.error('保存失败:', e);
                            btn.textContent = '❌ 失败';
                            showToast('❌ 保存失败: ' + (e.message || '未知错误'), 2500);
                            setTimeout(() => { btn.textContent = origText; btn.disabled = false; }, 2000);
                        }
                    });
                });

                document.querySelectorAll('.diary-delete-btn').forEach(btn => {
                    btn.addEventListener('click', async function() {
                        const gameId = Number(this.dataset.gameId);
                        if (!confirm('确定要删除这条游戏日记吗？')) return;
                        await deleteReview(gameId);
                        diaryCurrentPage = 0;
                        showDiaryCover();
                    });
                });

                // 导出功能已删除
                // document.querySelectorAll('.diary-export-btn').forEach(btn => { ... });
            }

            // ================================================================
            // ★★★ 新功能整合模块 ★★★
            // ================================================================

            // —— 分享导出图片 ——
            async function shareDiaryAsImage() {
                const overlay = document.getElementById('shareFloatOverlay');
                const container = document.getElementById('shareImageContainer');
                if (!overlay || !container) return;

                container.innerHTML = '<div style="padding:40px;text-align:center;color:var(--text3);"><div id="shareProgressText">⏳ 准备生成图片...</div><div style="margin-top:12px;width:120px;height:4px;background:var(--border);border-radius:2px;overflow:hidden;margin:12px auto 0;"><div id="shareProgressBar" style="width:0%;height:100%;background:var(--accent);border-radius:2px;transition:width 0.3s;"></div></div></div>';
                overlay.classList.add('show');
                document.body.style.overflow = 'hidden';

                const closeBtn = document.getElementById('shareFloatClose');
                const newClose = closeBtn.cloneNode(true);
                closeBtn.parentNode.replaceChild(newClose, closeBtn);
                newClose.addEventListener('click', closeShareFloat);
                if (!_shareOverlayBound) {
                    _shareOverlayBound = true;
                    overlay.addEventListener('click', function (e) {
                        if (e.target === overlay) {
                            closeShareFloat();
                        }
                    });
                }

                const progressText = document.getElementById('shareProgressText');
                const progressBar = document.getElementById('shareProgressBar');
                const hint = document.getElementById('longPressHint');
                if (hint) hint.style.display = 'none';

                const wrapper = document.querySelector('.diary-entry-wrapper');
                if (!wrapper) {
                    container.innerHTML = '<div style="padding:40px;text-align:center;color:var(--danger);">⚠️ 未找到日记内容</div><div style="text-align:center;margin-top:12px;"><button class="btn" onclick="closeShareFloat()" style="padding:8px 24px;">关闭</button></div>';
                    return;
                }

                try {
                    if (progressText) progressText.textContent = '⏳ 正在加载图片库...';
                    if (progressBar) progressBar.style.width = '20%';

                    let html2canvasLib;
                    try {
                        html2canvasLib = await window._loadHtml2Canvas();
                    } catch (loadErr) {
                        const isFileProtocol = window.location.protocol === 'file:';
                        if (isFileProtocol) {
                            throw new Error('图片库无法加载（file://协议限制）<br/><br/>💡 请使用 VS Code Live Server 或其他本地 HTTP 服务器打开本页面，以启用分享图片功能。');
                        } else {
                            throw new Error('图片库加载失败，请检查网络连接');
                        }
                    }

                    if (progressText) progressText.textContent = '⏳ 正在加载跨域图片...';
                    if (progressBar) progressBar.style.width = '35%';

                    const allImgs = wrapper.querySelectorAll('img');
                    const srcMap = new Map();
                    const gifToPng = (blob) => new Promise((res) => {
                        const blobUrl = URL.createObjectURL(blob);
                        const im = new Image();
                        im.onload = () => {
                            const c = document.createElement('canvas');
                            c.width = im.naturalWidth; c.height = im.naturalHeight;
                            c.getContext('2d').drawImage(im, 0, 0);
                            URL.revokeObjectURL(blobUrl);
                            res(c.toDataURL('image/png'));
                        };
                        im.onerror = () => { URL.revokeObjectURL(blobUrl); res(null); };
                        im.src = blobUrl;
                    });
                    await Promise.all(Array.from(allImgs).map(async (img) => {
                        const src = img.getAttribute('src') || img.src;
                        if (!src || src.startsWith('data:')) return;
                        const isGif = /\.gif(\?|$)/i.test(src);
                        try {
                            const resp = await fetch(src, { mode: 'cors' });
                            const blob = await resp.blob();
                            if (isGif) {
                                const pngDataUrl = await gifToPng(blob);
                                if (pngDataUrl) {
                                    srcMap.set(img, img.src);
                                    img.src = pngDataUrl;
                                    return;
                                }
                            }
                            const dataUrl = await new Promise((res, rej) => {
                                const reader = new FileReader();
                                reader.onloadend = () => res(reader.result);
                                reader.onerror = rej;
                                reader.readAsDataURL(blob);
                            });
                            srcMap.set(img, img.src);
                            img.src = dataUrl;
                        } catch (e) { /* skip failed images */ }
                    }));

                    if (progressText) progressText.textContent = '⏳ 正在渲染日记页面...';
                    if (progressBar) progressBar.style.width = '50%';

                    wrapper.classList.add('export-mode');
                    await new Promise(r => setTimeout(r, 200));

                    if (progressText) progressText.textContent = '⏳ 正在生成图片...';
                    if (progressBar) progressBar.style.width = '75%';

                    const canvas = await html2canvasLib(wrapper, {
                        backgroundColor: '#faf7fd',
                        scale: 2,
                        logging: false
                    });

                    const dataUrl = canvas.toDataURL('image/png');
                    srcMap.forEach((origSrc, img) => { img.src = origSrc; });

                    if (progressBar) progressBar.style.width = '100%';

                    shareImageDataURL = dataUrl;
                    const img = document.createElement('img');
                    img.src = dataUrl;
                    img.alt = '日记分享图片';
                    img.style.cssText = 'width:100%;height:auto;display:block;border-radius:16px;';
                    img.setAttribute('draggable', 'false');
                    container.innerHTML = '';
                    container.appendChild(img);

                    const downloadBtn = document.getElementById('shareFloatDownloadBtn');
                    const isMobile = window.innerWidth <= 768 || isTouchDevice;
                    if (hint) hint.style.display = isMobile ? 'block' : 'none';
                    downloadBtn.textContent = isMobile ? '📥 下载图片 (备用)' : '📥 下载分享图片';

                    const newBtn = downloadBtn.cloneNode(true);
                    downloadBtn.parentNode.replaceChild(newBtn, downloadBtn);
                    newBtn.addEventListener('click', function () {
                        if (shareImageDataURL) {
                            const link = document.createElement('a');
                            link.download = `her-lens-diary-${Date.now()}.png`;
                            link.href = shareImageDataURL;
                            link.click();
                            showToast('✅ 图片已下载！', 2000);
                        }
                    });
                } catch (e) {
                    console.error('分享失败:', e);
                    container.innerHTML = '<div style="padding:40px;text-align:center;color:var(--danger);">⚠️ 生成失败：' + (e.message || '未知错误') + '</div><div style="text-align:center;margin-top:12px;"><button class="btn" onclick="closeShareFloat()" style="padding:8px 24px;">关闭</button></div>';
                } finally {
                    wrapper.classList.remove('export-mode');
                }
            }

            // —— 移动端手势 ——
            function initDiaryMobileGestures() {
                const diaryPage = document.getElementById('diaryPage');
                if (!diaryPage) return;
                let startX = 0, startY = 0, startT = 0;
                let pullStartY = 0, pulling = false;

                diaryPage.addEventListener('touchstart', (e) => {
                    if (!isMobileView()) return;
                    if (document.getElementById('diaryPage').style.display !== 'flex') return;
                    const t = e.touches[0];
                    startX = t.clientX;
                    startY = t.clientY;
                    startT = Date.now();
                    _diaryLastTouchX = t.clientX;
                    _diaryLastTouchY = t.clientY;
                    // 下拉刷新检测：滚动到顶部
                    if (diaryPage.scrollTop <= 0) {
                        pullStartY = t.clientY;
                        pulling = true;
                    } else {
                        pulling = false;
                    }
                }, { passive: true });

                diaryPage.addEventListener('touchmove', (e) => {
                    if (!isMobileView()) return;
                    const t = e.touches[0];
                    const dx = t.clientX - _diaryLastTouchX;
                    const dy = t.clientY - _diaryLastTouchY;
                    _diaryLastTouchX = t.clientX;
                    _diaryLastTouchY = t.clientY;
                    // 显示滑动方向指示
                    if (Math.abs(dx) > Math.abs(dy) * 1.5 && Math.abs(dx) > 30) {
                        let hint = document.querySelector('.swipe-hint-indicator.show');
                        if (!hint) {
                            hint = document.createElement('div');
                            hint.className = 'swipe-hint-indicator ' + (dx > 0 ? 'left' : 'right');
                            hint.textContent = dx > 0 ? '◀' : '▶';
                            const contentView = document.getElementById('diaryContentView');
                            if (contentView) {
                                contentView.style.position = contentView.style.position || 'relative';
                                contentView.appendChild(hint);
                                requestAnimationFrame(() => hint.classList.add('show'));
                                setTimeout(() => { hint.classList.remove('show'); setTimeout(() => hint.remove(), 300); }, 500);
                            }
                        }
                    }
                }, { passive: true });

                diaryPage.addEventListener('touchend', (e) => {
                    if (!isMobileView()) return;
                    const t = e.changedTouches[0];
                    const dx = t.clientX - startX;
                    const dy = t.clientY - startY;
                    const dt = Date.now() - startT;

                    // 水平滑动翻页（距离够、时间短、垂直距离小）
                    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5 && dt < 600) {
                        if (hasUnsavedDiaryChanges()) {
                            if (!confirm('你还有未保存的评论内容，确定要翻页吗？未保存的内容将保留在草稿中。')) return;
                        }
                        if (dx < 0) {
                            // 向左滑：下一页
                            if (diaryCurrentPage < diarySortedReviews.length - 1) {
                                playDiaryFlipSound();
                                diaryCurrentPage++;
                                renderDiaryPage();
                            }
                        } else {
                            // 向右滑：上一页 或 左滑返回封面
                            if (diaryCurrentPage > 0) {
                                playDiaryFlipSound();
                                diaryCurrentPage--;
                                renderDiaryPage();
                            } else if (diaryCurrentPage === 0 && dx > 100) {
                                // 第一页时向右滑，退回封面
                                showDiaryCover();
                            }
                        }
                        return;
                    }

                    // 下拉刷新
                    if (pulling && dy > 80 && Math.abs(dx) < 40 && diaryPage.scrollTop <= 0) {
                        showToast('🔄 刷新中...', 1000);
                        setTimeout(() => {
                            renderDiaryContent();
                            showToast('✅ 已刷新', 1200);
                        }, 400);
                    }

                    // 双击回顶部（顶部区域双击）
                    const now = Date.now();
                    if (dt < 300 && Math.abs(dx) < 10 && Math.abs(dy) < 10) {
                        if (now - _diaryLastTapTime < 350) {
                            // 双击
                            if (startY < 120) {
                                // 顶部双击 → 回到第一页
                                if (diaryCurrentPage !== 0) {
                                    if (hasUnsavedDiaryChanges()) {
                                        if (!confirm('你还有未保存的评论内容，确定要回到第一页吗？未保存的内容将保留在草稿中。')) {
                                            _diaryLastTapTime = 0;
                                            return;
                                        }
                                    }
                                    diaryCurrentPage = 0;
                                    renderDiaryPage();
                                    showToast('⏫ 回到第一页', 1000);
                                }
                                diaryPage.scrollTo({ top: 0, behavior: 'smooth' });
                            } else {
                                // 其他位置双击 → 滚动到顶部
                                diaryPage.scrollTo({ top: 0, behavior: 'smooth' });
                            }
                            _diaryLastTapTime = 0;
                        } else {
                            _diaryLastTapTime = now;
                        }
                    }
                }, { passive: true });
            }

            // ===== 游戏评论回复功能（本地存储） =====
            const GAME_COMMENT_REPLIES_KEY = 'heroine_game_comment_replies_v1';

            function getGameCommentReplies() {
                try {
                    return JSON.parse(localStorage.getItem(GAME_COMMENT_REPLIES_KEY) || '{}');
                } catch (_) {
                    return {};
                }
            }

            function saveGameCommentReplies(replies) {
                try {
                    localStorage.setItem(GAME_COMMENT_REPLIES_KEY, JSON.stringify(replies));
                } catch (_) {}
            }

            async function addGameCommentReply(reviewId, content, replyTo = null, parentReplyId = null) {
                if (!currentUser) return null;
                const metadata = currentUser.user_metadata || {};
                const replyData = {
                    review_id: String(reviewId),
                    game_id: Number(reviewId.split('_')[0]) || null,
                    user_id: currentUser.id,
                    content: content,
                    reply_to: replyTo || null,
                    parent_reply_id: parentReplyId || null,
                    display_name: metadata.display_name || currentUser.email || '用户',
                    avatar_url: metadata.avatar_url || null,
                    custom_id: metadata.custom_id || null
                };

                // 云端写入
                if (supabaseClient) {
                    try {
                        const { data, error } = await supabaseClient
                            .from('game_comment_replies')
                            .insert(replyData)
                            .select('id, created_at')
                            .single();
                        if (!error && data) {
                            // ★ 清除该游戏评论列表缓存（回复数变化）
                            const gameIdFromReview = Number(String(reviewId).split('_')[0]);
                            if (!isNaN(gameIdFromReview)) invalidateReviewsListCache(gameIdFromReview);
                            return {
                                id: data.id,
                                review_id: replyData.review_id,
                                user_id: replyData.user_id,
                                content: replyData.content,
                                display_name: metadata.display_name || currentUser.email || '用户',
                                avatar_url: metadata.avatar_url || null,
                                custom_id: metadata.custom_id || null,
                                reply_to: replyTo,
                                parent_reply_id: parentReplyId || null,
                                created_at: data.created_at
                            };
                        }
                    } catch (_) {}
                }

                // 本地存储（云端失败或无 Supabase 时走这里）
                const replies = getGameCommentReplies();
                if (!replies[reviewId]) replies[reviewId] = [];
                const newReply = {
                    id: Date.now(),
                    user_id: currentUser.id,
                    content: content,
                    display_name: metadata.display_name || currentUser.email || '用户',
                    avatar_url: metadata.avatar_url || null,
                    custom_id: metadata.custom_id || null,
                    reply_to: replyTo,
                    parent_reply_id: parentReplyId || null,
                    created_at: new Date().toISOString()
                };
                replies[reviewId].push(newReply);
                saveGameCommentReplies(replies);
                // ★ 清除该游戏评论列表缓存（回复数变化）
                const gameIdFromReview = Number(String(reviewId).split('_')[0]);
                if (!isNaN(gameIdFromReview)) invalidateReviewsListCache(gameIdFromReview);
                return newReply;
            }

            async function deleteGameCommentReply(reviewId, replyId) {
                // 云端删除（CASCADE 会自动清理子回复）
                if (supabaseClient) {
                    try {
                        await supabaseClient.from('game_comment_replies').delete().eq('id', String(replyId));
                    } catch (_) {}
                }

                // localStorage 回退：递归收集要删除的所有ID（统一按字符串比较，兼容云端 uuid 与本地数字 id）
                const replies = getGameCommentReplies();
                if (replies[reviewId]) {
                    function collectChildIds(targetId, items) {
                        const ids = [String(targetId)];
                        let found = true;
                        while (found) {
                            found = false;
                            items.forEach(r => {
                                const rid = String(r.id);
                                const pid = r.parent_reply_id != null ? String(r.parent_reply_id) : null;
                                if (pid && ids.includes(pid) && !ids.includes(rid)) {
                                    ids.push(rid);
                                    found = true;
                                }
                            });
                        }
                        return ids;
                    }
                    const idsToDelete = collectChildIds(replyId, replies[reviewId]);
                    replies[reviewId] = replies[reviewId].filter(r => !idsToDelete.includes(String(r.id)));
                    saveGameCommentReplies(replies);
                }
                // ★ 清除该游戏评论列表缓存
                const gameIdFromReview = Number(String(reviewId).split('_')[0]);
                if (!isNaN(gameIdFromReview)) invalidateReviewsListCache(gameIdFromReview);
            }

            async function getGameCommentRepliesForReview(reviewId) {
                // 优先云端
                if (supabaseClient) {
                    try {
                        const { data, error } = await supabaseClient
                            .from('game_comment_replies')
                            .select('*')
                            .eq('review_id', String(reviewId))
                            .order('created_at', { ascending: true });
                        if (!error && data) {
                            return data.map(r => ({
                                id: r.id,
                                review_id: r.review_id,
                                user_id: r.user_id,
                                content: r.content,
                                display_name: r.display_name || '用户',
                                avatar_url: r.avatar_url || null,
                                custom_id: r.custom_id || null,
                                reply_to: r.reply_to,
                                parent_reply_id: r.parent_reply_id,
                                created_at: r.created_at
                            }));
                        }
                    } catch (_) {}
                }
                // localStorage 回退
                const replies = getGameCommentReplies();
                return replies[String(reviewId)] || [];
            }

            function formatGameCommentReplyTime(isoStr) {
                const d = new Date(isoStr);
                const now = new Date();
                const diffMs = now - d;
                const diffMin = Math.floor(diffMs / 60000);
                if (diffMin < 1) return '刚刚';
                if (diffMin < 60) return diffMin + '分钟前';
                const diffH = Math.floor(diffMin / 60);
                if (diffH < 24) return diffH + '小时前';
                const diffD = Math.floor(diffH / 24);
                if (diffD < 30) return diffD + '天前';
                return d.toLocaleDateString('zh-CN');
            }

            function buildGameReplyTree(flatReplies) {
                const map = {};
                const roots = [];
                flatReplies.forEach(r => {
                    r._children = [];
                    map[String(r.id)] = r;
                });
                flatReplies.forEach(r => {
                    const pid = r.parent_reply_id != null ? String(r.parent_reply_id) : null;
                    if (pid && map[pid]) {
                        map[pid]._children.push(r);
                    } else {
                        roots.push(r);
                    }
                });
                return roots;
            }

            function renderGameReplyTree(nodes, reviewId, depth, flatReplies) {
                const maxDepth = 4;
                const isTooDeep = depth >= maxDepth;
                let html = '';
                nodes.forEach(reply => {
                    const isReplyOwn = currentUser && reply.user_id === currentUser.id;
                    const replyAvatar = reply.avatar_url ?
                        `<img src="${escapeHTML(reply.avatar_url)}" class="comment-reply-item-avatar" referrerpolicy="no-referrer" />` :
                        `<div class="comment-reply-item-avatar" style="display:flex;align-items:center;justify-content:center;font-size:0.5rem;">👤</div>`;
                    const replyTime = formatGameCommentReplyTime(reply.created_at);
                    let replyToLabel = '';
                    if (reply.reply_to && flatReplies) {
                        const target = flatReplies.find(r => r.user_id === reply.reply_to);
                        if (target) {
                            replyToLabel = `<span class="comment-reply-to-label">@${escapeHTML(target.display_name)}</span>`;
                        }
                    }
                    const deleteHtml = (isReplyOwn || isAdmin) ?
                        `<button class="comment-reply-delete-btn" data-review-id="${reviewId}" data-reply-id="${reply.id}">删除</button>` : '';
                    const showReplyBtn = !isTooDeep ?
                        `<button class="comment-reply-btn" data-review-id="${reviewId}" data-reply-id="${reply.id}">💬 回复</button>` : '';
                    const replyCustomIdHtml = reply.custom_id
                        ? `<span class="comment-custom-id">@${escapeHTML(reply.custom_id)}</span>`
                        : '';

                    html += `
                        <div class="comment-reply-item" data-reply-id="${reply.id}">
                            <div class="comment-reply-item-header">
                                ${replyAvatar}
                                <span class="comment-reply-item-name">${escapeHTML(reply.display_name || '用户')}</span>
                                ${replyCustomIdHtml}
                                <span class="comment-reply-item-time">${replyTime}</span>
                            </div>
                            <div class="comment-reply-item-content">${replyToLabel}${escapeHTML(reply.content)}</div>
                            ${showReplyBtn || deleteHtml ? `<div class="comment-reply-item-actions">${showReplyBtn}${deleteHtml}</div>` : ''}
                            ${!isTooDeep ? `
                                <div class="comment-nested-reply-compose" id="gameNestedReplyCompose-${reviewId}-${reply.id}" style="display:none;">
                                    <textarea id="gameNestedReplyInput-${reviewId}-${reply.id}" placeholder="写下你的回复..." maxlength="200"></textarea>
                                    <div class="comment-reply-compose-actions">
                                        <button class="btn btn-sm game-nested-reply-cancel-btn" data-review-id="${reviewId}" data-reply-id="${reply.id}">取消</button>
                                        <button class="btn btn-sm btn-accent game-nested-reply-submit-btn" data-review-id="${reviewId}" data-parent-reply-id="${reply.id}" data-reply-to-user-id="${reply.user_id}">发送</button>
                                    </div>
                                </div>
                            ` : ''}
                            ${reply._children && reply._children.length > 0 ? `
                                <div class="comment-nested-reply-list">${renderGameReplyTree(reply._children, reviewId, depth + 1, flatReplies)}</div>
                            ` : ''}
                        </div>`;
                });
                return html;
            }

            // 通用提交防重：点击后立即禁用按钮并给出"发送中"反馈，避免 await 期间重复点击导致重复上传。
            // asyncFn 抛错时会恢复按钮并提示；成功时由后续列表重渲染重建按钮，无需手动恢复。
            function guardSubmitBtn(btn, asyncFn, busyText) {
                if (!btn || btn.dataset.submitting === '1') return;
                btn.dataset.submitting = '1';
                const oldText = btn.textContent;
                btn.disabled = true;
                btn.textContent = busyText || '发送中...';
                Promise.resolve().then(asyncFn).catch(e => {
                    console.warn('[Submit] 提交失败:', e.message || e);
                    showToast('提交失败，请重试', 1500);
                }).finally(() => {
                    btn.dataset.submitting = '0';
                    btn.disabled = false;
                    btn.textContent = oldText;
                });
            }

            // ===== localStorage → Supabase 一次性迁移 =====
            async function migrateLocalRepliesToCloud() {
                if (!supabaseClient) return;
                const MIGRATION_FLAG_KEY = 'heroine_replies_migrated_v1';
                if (localStorage.getItem(MIGRATION_FLAG_KEY)) return;

                console.log('[Migration] 开始将本地回复数据迁移到云端...');

                // 1. MOD评论回复迁移
                try {
                    const modReplies = getModCommentReplies();
                    const modRows = [];
                    for (const [commentId, items] of Object.entries(modReplies)) {
                        for (const r of items) {
                            modRows.push({
                                comment_id: Number(commentId),
                                user_id: r.user_id,
                                content: r.content,
                                reply_to: r.reply_to || null,
                                parent_reply_id: r.parent_reply_id || null,
                                display_name: r.display_name || '用户',
                                avatar_url: r.avatar_url || null,
                                created_at: r.created_at
                            });
                        }
                    }
                    if (modRows.length > 0) {
                        const { error } = await supabaseClient.from('mod_comment_replies').insert(modRows);
                        if (!error) {
                            console.log(`[Migration] MOD评论回复：成功迁移 ${modRows.length} 条`);
                        } else {
                            console.warn('[Migration] MOD评论回复迁移失败:', error.message);
                        }
                    }
                } catch (e) {
                    console.warn('[Migration] MOD评论回复迁移异常:', e);
                }

                // 2. 游戏评论回复迁移
                try {
                    const gameReplies = getGameCommentReplies();
                    const gameRows = [];
                    for (const [reviewId, items] of Object.entries(gameReplies)) {
                        for (const r of items) {
                            const gameId = Number(String(reviewId).split('_')[0]) || null;
                            gameRows.push({
                                review_id: String(reviewId),
                                game_id: gameId,
                                user_id: r.user_id,
                                content: r.content,
                                reply_to: r.reply_to || null,
                                parent_reply_id: r.parent_reply_id || null,
                                display_name: r.display_name || '用户',
                                avatar_url: r.avatar_url || null,
                                created_at: r.created_at
                            });
                        }
                    }
                    if (gameRows.length > 0) {
                        const { error } = await supabaseClient.from('game_comment_replies').insert(gameRows);
                        if (!error) {
                            console.log(`[Migration] 游戏评论回复：成功迁移 ${gameRows.length} 条`);
                        } else {
                            console.warn('[Migration] 游戏评论回复迁移失败:', error.message);
                        }
                    }
                } catch (e) {
                    console.warn('[Migration] 游戏评论回复迁移异常:', e);
                }

                // 标记迁移完成（即使部分失败也标记，避免重复尝试导致冲突）
                localStorage.setItem(MIGRATION_FLAG_KEY, 'done');
                console.log('[Migration] 迁移流程结束');
            }

            // ===== MOD评论回复和点赞功能（本地存储） =====
            const MOD_COMMENT_REPLIES_KEY = 'heroine_mod_comment_replies_v1';
            const MOD_COMMENT_LIKES_KEY = 'heroine_mod_comment_likes_v1';

            function getModCommentReplies() {
                try {
                    return JSON.parse(localStorage.getItem(MOD_COMMENT_REPLIES_KEY) || '{}');
                } catch (_) {
                    return {};
                }
            }

            function saveModCommentReplies(replies) {
                try {
                    localStorage.setItem(MOD_COMMENT_REPLIES_KEY, JSON.stringify(replies));
                } catch (_) {}
            }

            async function addModCommentReply(commentId, content, replyTo = null, parentReplyId = null) {
                if (!currentUser) return null;
                const metadata = currentUser.user_metadata || {};
                const replyData = {
                    comment_id: Number(commentId),
                    user_id: currentUser.id,
                    content: content,
                    reply_to: replyTo || null,
                    parent_reply_id: parentReplyId || null,
                    display_name: metadata.display_name || currentUser.email || '用户',
                    avatar_url: metadata.avatar_url || null
                };

                // 云端写入
                if (supabaseClient) {
                    try {
                        const { data, error } = await supabaseClient
                            .from('mod_comment_replies')
                            .insert(replyData)
                            .select('id, created_at')
                            .single();
                        if (!error && data) {
                            return {
                                id: data.id,
                                comment_id: replyData.comment_id,
                                user_id: replyData.user_id,
                                content: replyData.content,
                                display_name: metadata.display_name || currentUser.email || '用户',
                                avatar_url: metadata.avatar_url || null,
                                reply_to: replyTo,
                                parent_reply_id: parentReplyId || null,
                                created_at: data.created_at
                            };
                        }
                    } catch (_) {}
                }

                // localStorage 回退
                const replies = getModCommentReplies();
                if (!replies[commentId]) replies[commentId] = [];
                const newReply = {
                    id: Date.now(),
                    user_id: currentUser.id,
                    content: content,
                    display_name: metadata.display_name || currentUser.email || '用户',
                    avatar_url: metadata.avatar_url || null,
                    reply_to: replyTo,
                    parent_reply_id: parentReplyId || null,
                    created_at: new Date().toISOString()
                };
                replies[commentId].push(newReply);
                saveModCommentReplies(replies);
                return newReply;
            }

            async function deleteModCommentReply(commentId, replyId) {
                // 云端删除（CASCADE 会自动清理子回复）
                if (supabaseClient) {
                    try {
                        await supabaseClient.from('mod_comment_replies').delete().eq('id', String(replyId));
                    } catch (_) {}
                }

                // localStorage 回退：递归收集要删除的所有ID（统一按字符串比较，兼容云端 uuid 与本地数字 id）
                const replies = getModCommentReplies();
                if (replies[commentId]) {
                    function collectChildIds(targetId, items) {
                        const ids = [String(targetId)];
                        let found = true;
                        while (found) {
                            found = false;
                            items.forEach(r => {
                                const rid = String(r.id);
                                const pid = r.parent_reply_id != null ? String(r.parent_reply_id) : null;
                                if (pid && ids.includes(pid) && !ids.includes(rid)) {
                                    ids.push(rid);
                                    found = true;
                                }
                            });
                        }
                        return ids;
                    }
                    const idsToDelete = collectChildIds(replyId, replies[commentId]);
                    replies[commentId] = replies[commentId].filter(r => !idsToDelete.includes(String(r.id)));
                    saveModCommentReplies(replies);
                }
            }

            async function getModCommentRepliesForComment(commentId) {
                // 优先云端
                if (supabaseClient) {
                    try {
                        const { data, error } = await supabaseClient
                            .from('mod_comment_replies')
                            .select('*')
                            .eq('comment_id', Number(commentId))
                            .order('created_at', { ascending: true });
                        if (!error && data) {
                            return data.map(r => ({
                                id: r.id,
                                comment_id: r.comment_id,
                                user_id: r.user_id,
                                content: r.content,
                                display_name: r.display_name || '用户',
                                avatar_url: r.avatar_url || null,
                                reply_to: r.reply_to,
                                parent_reply_id: r.parent_reply_id,
                                created_at: r.created_at
                            }));
                        }
                    } catch (_) {}
                }
                // localStorage 回退
                const replies = getModCommentReplies();
                return replies[String(commentId)] || [];
            }

            // 构建MOD评论回复树
            function buildModReplyTree(flatReplies) {
                const map = {};
                const roots = [];
                flatReplies.forEach(r => {
                    r._children = [];
                    map[String(r.id)] = r;
                });
                flatReplies.forEach(r => {
                    const pid = r.parent_reply_id != null ? String(r.parent_reply_id) : null;
                    if (pid && map[pid]) {
                        map[pid]._children.push(r);
                    } else {
                        roots.push(r);
                    }
                });
                return roots;
            }

            // 递归渲染MOD评论回复树
            function renderModReplyTree(nodes, commentId, depth, flatReplies) {
                const maxDepth = 4;
                const isTooDeep = depth >= maxDepth;
                let html = '';
                nodes.forEach(reply => {
                    const isReplyOwn = currentUser && reply.user_id === currentUser.id;
                    const replyAvatar = reply.avatar_url ?
                        `<img src="${escapeHTML(reply.avatar_url)}" class="mod-reply-item-avatar" referrerpolicy="no-referrer" />` :
                        `<div class="mod-reply-item-avatar" style="display:flex;align-items:center;justify-content:center;font-size:0.5rem;">👤</div>`;
                    const replyTime = formatModTime(reply.created_at);
                    let replyToLabel = '';
                    if (reply.reply_to && flatReplies) {
                        const target = flatReplies.find(r => r.user_id === reply.reply_to);
                        if (target) {
                            replyToLabel = `<span class="mod-reply-to-label">@${escapeHTML(target.display_name)}</span>`;
                        }
                    }
                    const deleteHtml = (isReplyOwn || isAdmin) ?
                        `<button class="mod-comment-delete" data-comment-id="${commentId}" data-reply-id="${reply.id}">删除</button>` : '';
                    const showReplyBtn = !isTooDeep ?
                        `<button class="mod-comment-reply-btn" data-comment-id="${commentId}" data-reply-id="${reply.id}">💬 回复</button>` : '';

                    html += `
                        <div class="mod-reply-item" data-reply-id="${reply.id}">
                            <div class="mod-reply-item-header">
                                ${replyAvatar}
                                <span class="mod-reply-item-name">${escapeHTML(reply.display_name || '用户')}</span>
                                <span class="mod-reply-item-time">${replyTime}</span>
                            </div>
                            <div class="mod-reply-item-content">${replyToLabel}${escapeHTML(reply.content)}</div>
                            ${showReplyBtn || deleteHtml ? `<div class="mod-reply-item-actions">${showReplyBtn}${deleteHtml}</div>` : ''}
                            ${!isTooDeep ? `
                                <div class="mod-nested-reply-compose mod-reply-compose" id="modNestedReplyCompose-${commentId}-${reply.id}" style="display:none;">
                                    <textarea id="modNestedReplyInput-${commentId}-${reply.id}" placeholder="写下你的回复..." maxlength="200"></textarea>
                                    <div class="mod-reply-compose-actions">
                                        <button class="btn btn-sm mod-nested-reply-cancel-btn" data-comment-id="${commentId}" data-reply-id="${reply.id}">取消</button>
                                        <button class="btn btn-sm btn-accent mod-nested-reply-submit-btn" data-comment-id="${commentId}" data-parent-reply-id="${reply.id}" data-reply-to-user-id="${reply.user_id}">发送</button>
                                    </div>
                                </div>
                            ` : ''}
                            ${reply._children && reply._children.length > 0 ? `
                                <div class="mod-nested-reply-list">${renderModReplyTree(reply._children, commentId, depth + 1, flatReplies)}</div>
                            ` : ''}
                        </div>`;
                });
                return html;
            }

            function getModCommentLikes() {
                try {
                    return JSON.parse(localStorage.getItem(MOD_COMMENT_LIKES_KEY) || '{}');
                } catch (_) {
                    return {};
                }
            }

            function saveModCommentLikes(likes) {
                try {
                    localStorage.setItem(MOD_COMMENT_LIKES_KEY, JSON.stringify(likes));
                } catch (_) {}
            }

            function toggleModCommentLike(commentId) {
                if (!currentUser) return false;
                const likes = getModCommentLikes();
                if (!likes[commentId]) likes[commentId] = [];
                const userId = currentUser.id;
                const idx = likes[commentId].indexOf(userId);
                if (idx === -1) {
                    likes[commentId].push(userId);
                } else {
                    likes[commentId].splice(idx, 1);
                }
                saveModCommentLikes(likes);
                return idx === -1;
            }

            function isModCommentLiked(commentId) {
                if (!currentUser) return false;
                const likes = getModCommentLikes();
                return (likes[commentId] || []).includes(currentUser.id);
            }

            function getModCommentLikeCount(commentId) {
                const likes = getModCommentLikes();
                return (likes[commentId] || []).length;
            }

            // ================================================================
            // ★★★ 公告系统 ★★★
            // ================================================================
            let announcements = [];
            let editingAnnouncementId = null;

            function formatDate(dateStr) {
                if (!dateStr) return '';
                const d = new Date(dateStr);
                return d.getFullYear() + '-' +
                    String(d.getMonth() + 1).padStart(2, '0') + '-' +
                    String(d.getDate()).padStart(2, '0');
            }

            async function loadAnnouncements() {
                const listEl = document.getElementById('announcementsList');
                if (!listEl) return;

                listEl.innerHTML = '<div class="announcements-empty">加载中...</div>';

                if (!supabaseClient) {
                    listEl.innerHTML = '<div class="announcements-empty">数据库连接不可用</div>';
                    return;
                }

                try {
                    const { data, error } = await supabaseClient
                        .from('site_announcements')
                        .select('id, title, content, created_at, updated_at, pinned, display_date')
                        .order('pinned', { ascending: false })
                        .order('display_date', { ascending: false, nullsFirst: false })
                        .order('created_at', { ascending: false })
                        .limit(50);

                    if (error) throw error;

                    announcements = data || [];
                    renderAnnouncements();
                } catch (e) {
                    console.error('加载公告失败:', e);
                    // 如果表不存在，显示空状态
                    if (e.message && e.message.includes('does not exist')) {
                        announcements = [];
                        renderAnnouncements();
                    } else {
                        listEl.innerHTML = '<div class="announcements-empty">加载失败，请刷新重试</div>';
                    }
                }
            }

            function renderAnnouncements() {
                const listEl = document.getElementById('announcementsList');
                const addBtn = document.getElementById('btnAddAnnouncement');
                if (!listEl) return;

                // 显示/隐藏发布按钮
                if (addBtn) {
                    addBtn.style.display = isAdmin ? '' : 'none';
                }

                if (announcements.length === 0) {
                    listEl.innerHTML = '<div class="announcements-empty">暂无公告</div>';
                    return;
                }

                listEl.innerHTML = announcements.map(item => {
                    const safeId = String(item.id).replace(/'/g, '');
                    const isPinned = item.pinned;
                    const pinnedClass = isPinned ? ' pinned' : '';
                    const pinnedBadge = isPinned ? '<span class="announcement-card-pin-badge">📌 置顶</span>' : '';
                    const pinBtn = isAdmin ? `<button class="announcement-card-action-btn pin-btn" onclick="togglePinAnnouncement('${safeId}', ${!isPinned})">${isPinned ? '取消置顶' : '置顶'}</button>` : '';
                    const adminActions = isAdmin ? `
                        <div class="announcement-card-actions">
                            ${pinBtn}
                            <button class="announcement-card-action-btn" onclick="editAnnouncement('${safeId}')">编辑</button>
                            <button class="announcement-card-action-btn danger" onclick="deleteAnnouncement('${safeId}')">删除</button>
                        </div>
                    ` : '';

                    const displayDate = item.display_date || item.created_at;

                    return `
                        <div class="announcement-card${pinnedClass}">
                            ${adminActions}
                            <div class="announcement-card-title">${escapeHTML(item.title || '')}${pinnedBadge}</div>
                            <div class="announcement-card-meta">
                                <span class="announcement-card-date">📅 ${formatDate(displayDate)}</span>
                            </div>
                            <div class="announcement-card-body" id="annBody-${safeId}">${escapeHTML(item.content || '')}</div>
                            <button class="announcement-expand-btn" onclick="toggleAnnouncement('${safeId}')">
                                <span>展开详情</span>
                                <span class="arrow">▼</span>
                            </button>
                        </div>
                    `;
                }).join('');
            }

            function openAnnouncementEditModal(id) {
                editingAnnouncementId = id || null;

                // 创建弹窗HTML
                let overlay = document.getElementById('announcementEditOverlay');
                if (!overlay) {
                    overlay = document.createElement('div');
                    overlay.id = 'announcementEditOverlay';
                    overlay.className = 'announcement-edit-overlay';
                    overlay.innerHTML = `
                        <div class="announcement-edit-modal">
                            <div class="announcement-edit-title" id="announcementEditTitle">发布公告</div>
                            <form class="announcement-edit-form" id="announcementEditForm">
                                <div class="form-group">
                                    <label>标题</label>
                                    <input type="text" id="announcementTitleInput" placeholder="请输入公告标题" maxlength="100" required />
                                </div>
                                <div class="form-group">
                                    <label>正文</label>
                                    <textarea id="announcementContentInput" placeholder="请输入公告内容" required></textarea>
                                </div>
                                <div class="form-row">
                                    <div class="form-group">
                                        <label>显示日期</label>
                                        <input type="date" id="announcementDateInput" />
                                    </div>
                                    <div class="form-group" style="display:flex;align-items:flex-end;">
                                        <label class="pin-toggle">
                                            <input type="checkbox" id="announcementPinInput" />
                                            <span class="pin-toggle-label">📌 置顶公告</span>
                                        </label>
                                    </div>
                                </div>
                                <div class="announcement-edit-actions">
                                    <button type="button" class="btn" id="announcementCancelBtn">取消</button>
                                    <button type="submit" class="btn btn-accent" id="announcementSubmitBtn">发布</button>
                                </div>
                            </form>
                        </div>
                    `;
                    document.body.appendChild(overlay);

                    // 绑定事件
                    overlay.addEventListener('click', function (e) {
                        if (e.target === overlay) {
                            closeAnnouncementEditModal();
                        }
                    });

                    document.getElementById('announcementCancelBtn').addEventListener('click', closeAnnouncementEditModal);

                    document.getElementById('announcementEditForm').addEventListener('submit', async function (e) {
                        e.preventDefault();
                        await saveAnnouncement();
                    });
                }

                const titleEl = document.getElementById('announcementEditTitle');
                const titleInput = document.getElementById('announcementTitleInput');
                const contentInput = document.getElementById('announcementContentInput');
                const dateInput = document.getElementById('announcementDateInput');
                const pinInput = document.getElementById('announcementPinInput');
                const submitBtn = document.getElementById('announcementSubmitBtn');

                if (id) {
                    const item = announcements.find(a => a.id === id);
                    if (item) {
                        titleEl.textContent = '编辑公告';
                        titleInput.value = item.title || '';
                        contentInput.value = item.content || '';
                        dateInput.value = item.display_date || '';
                        pinInput.checked = !!item.pinned;
                        submitBtn.textContent = '保存';
                    }
                } else {
                    titleEl.textContent = '发布公告';
                    titleInput.value = '';
                    contentInput.value = '';
                    dateInput.value = '';
                    pinInput.checked = false;
                    submitBtn.textContent = '发布';
                }

                overlay.classList.add('show');
            }

            function closeAnnouncementEditModal() {
                const overlay = document.getElementById('announcementEditOverlay');
                if (overlay) {
                    overlay.classList.remove('show');
                }
                editingAnnouncementId = null;
            }

            async function saveAnnouncement() {
                if (!supabaseClient || !isAdmin) return;

                const titleInput = document.getElementById('announcementTitleInput');
                const contentInput = document.getElementById('announcementContentInput');
                const dateInput = document.getElementById('announcementDateInput');
                const pinInput = document.getElementById('announcementPinInput');
                const submitBtn = document.getElementById('announcementSubmitBtn');

                const title = titleInput.value.trim();
                const content = contentInput.value.trim();
                const display_date = dateInput.value || null;
                const pinned = pinInput.checked;

                if (!title || !content) {
                    showToast('请填写标题和正文', 2000);
                    return;
                }

                submitBtn.disabled = true;
                submitBtn.textContent = '保存中...';

                try {
                    if (editingAnnouncementId) {
                        // 更新
                        const { error } = await supabaseClient
                            .from('site_announcements')
                            .update({ title, content, display_date, pinned, updated_at: new Date().toISOString() })
                            .eq('id', editingAnnouncementId);
                        if (error) throw error;
                        showToast('公告已更新', 2000);
                    } else {
                        // 新建
                        const { error } = await supabaseClient
                            .from('site_announcements')
                            .insert([{ title, content, display_date, pinned }]);
                        if (error) throw error;
                        showToast('公告已发布', 2000);
                    }

                    closeAnnouncementEditModal();
                    loadAnnouncements();
                } catch (e) {
                    console.error('保存公告失败:', e);
                    showToast('保存失败：' + (e.message || '未知错误'), 3000);
                } finally {
                    submitBtn.disabled = false;
                    submitBtn.textContent = editingAnnouncementId ? '保存' : '发布';
                }
            }

            function toggleAnnouncement(id) {
                const body = document.getElementById('annBody-' + id);
                if (!body) return;
                const btn = body.nextElementSibling;
                const isExpanded = body.classList.contains('expanded');
                body.classList.toggle('expanded');
                if (btn) {
                    btn.classList.toggle('expanded');
                    btn.querySelector('span:first-child').textContent = isExpanded ? '展开详情' : '收起详情';
                }
            }
            window.toggleAnnouncement = toggleAnnouncement;

            async function deleteAnnouncement(id) {
                if (!supabaseClient || !isAdmin) return;

                if (!confirm('确定要删除这条公告吗？')) return;

                try {
                    const { error } = await supabaseClient
                        .from('site_announcements')
                        .delete()
                        .eq('id', id);
                    if (error) throw error;
                    showToast('公告已删除', 2000);
                    loadAnnouncements();
                } catch (e) {
                    console.error('删除公告失败:', e);
                    showToast('删除失败：' + (e.message || '未知错误'), 3000);
                }
            }

            async function togglePinAnnouncement(id, pin) {
                if (!supabaseClient || !isAdmin) return;

                try {
                    const { error } = await supabaseClient
                        .from('site_announcements')
                        .update({ pinned: pin, updated_at: new Date().toISOString() })
                        .eq('id', id);
                    if (error) throw error;
                    showToast(pin ? '已置顶' : '已取消置顶', 1500);
                    loadAnnouncements();
                } catch (e) {
                    console.error('置顶操作失败:', e);
                    showToast('操作失败：' + (e.message || '未知错误'), 3000);
                }
            }

            // 绑定发布按钮
            function initAnnouncementEvents() {
                const addBtn = document.getElementById('btnAddAnnouncement');
                if (addBtn) {
                    addBtn.addEventListener('click', function () {
                        openAnnouncementEditModal();
                    });
                }
            }

            // 全局暴露
            window.editAnnouncement = function (id) { openAnnouncementEditModal(id); };
            window.deleteAnnouncement = function (id) { deleteAnnouncement(id); };
            window.togglePinAnnouncement = function (id, pin) { togglePinAnnouncement(id, pin); };

            // ================================================================
            // ★★★ MOD 板块 ★★★
            // ================================================================
            const MOD_PAGE_SIZE = 20;
            let modPosts = [];
            let modPage = 0;
            let modSort = 'newest';
            let modFilter = 'all';
            let modTotalCount = 0;
            let currentMainView = 'games';
            let modListener = null;
            let _modDebounce = null;

            const MOD_TYPES = ['翻译补丁', '模型MOD', '美化MOD', '功能MOD', '剧情MOD', '其他'];
            const MOD_TYPE_ICONS = {
                '翻译补丁': '🌐', '模型MOD': '🧱', '美化MOD': '✨',
                '功能MOD': '⚙️', '剧情MOD': '📖', '其他': '📦'
            };
            const MOD_TYPE_CLASSES = {
                '翻译补丁': 'translation', '模型MOD': 'model', '美化MOD': 'graphics',
                '功能MOD': 'function', '剧情MOD': 'story', '其他': 'other'
            };

            function switchMainView(view) {
                if (currentMainView === view) return;
                currentMainView = view;

                const galleryContainer = document.getElementById('galleryContainer');
                const modSection = document.getElementById('modSection');
                const announcementsSection = document.getElementById('announcementsSection');
                const filterSticky = document.getElementById('filterSticky');
                const toolbar = document.getElementById('toolbar');
                const noResults = document.getElementById('noResults');

                // 更新顶部导航激活状态
                document.querySelectorAll('.top-nav-item[data-nav]').forEach(item => {
                    item.classList.toggle('active', item.dataset.nav === view);
                });

                const viewTabs = document.getElementById('viewTabs');
                const searchRow = document.getElementById('searchRow');
                const filterCategoryRow = document.getElementById('filterCategoryRow');
                const filterOptionsPanel = document.getElementById('filterOptionsPanel');
                const activeFiltersBar = document.getElementById('activeFiltersBar');

                // 先全部隐藏
                if (galleryContainer) galleryContainer.style.display = 'none';
                if (modSection) modSection.classList.remove('show');
                if (announcementsSection) announcementsSection.classList.remove('show');
                if (viewTabs) viewTabs.style.display = 'none';
                if (searchRow) searchRow.style.display = 'none';
                if (filterCategoryRow) filterCategoryRow.style.display = 'none';
                if (filterOptionsPanel) filterOptionsPanel.style.display = 'none';
                if (activeFiltersBar) activeFiltersBar.style.display = 'none';
                if (toolbar) toolbar.style.display = 'none';
                if (noResults) noResults.style.display = 'none';
                if (filterSticky) filterSticky.style.display = '';

                if (view === 'games') {
                    if (galleryContainer) { galleryContainer.style.display = ''; galleryContainer.classList.remove('show'); }
                    if (viewTabs) viewTabs.style.display = '';
                    if (searchRow) searchRow.style.display = '';
                    if (filterCategoryRow) filterCategoryRow.style.display = '';
                    if (filterOptionsPanel) filterOptionsPanel.style.display = '';
                    if (activeFiltersBar) activeFiltersBar.style.display = '';
                    if (toolbar) toolbar.style.display = '';
                    document.title = 'Her Lens · 女性主角游戏';
                    renderGallery();
                    window.scrollTo(0, 0);
                } else if (view === 'mods') {
                    if (modSection) modSection.classList.add('show');
                    document.title = 'Her Lens · MOD分享区';
                    renderModSection();
                    window.scrollTo(0, 0);
                } else if (view === 'announcements') {
                    if (announcementsSection) announcementsSection.classList.add('show');
                    document.title = 'Her Lens · 网站公告';
                    loadAnnouncements();
                    window.scrollTo(0, 0);
                }
            }

            function initTopNavEvents() {
                // 导航栏点击切换
                document.querySelectorAll('.top-nav-item[data-nav]').forEach(item => {
                    item.addEventListener('click', function (e) {
                        e.stopPropagation();
                        const nav = this.dataset.nav;
                        if (nav === 'test') {
                            window.open('taste-test-scenario.html', '_blank');
                            return;
                        }
                        switchMainView(nav);
                    });
                });

                // 用户菜单下拉
                const navUserBtn = document.getElementById('navUserBtn');
                const navUserDropdown = document.getElementById('navUserDropdown');
                if (navUserBtn && navUserDropdown) {
                    navUserBtn.addEventListener('click', function (e) {
                        e.stopPropagation();
                        const isOpen = navUserDropdown.classList.contains('show');
                        navUserDropdown.classList.toggle('show');
                    });
                    document.addEventListener('click', function (e) {
                        if (!navUserDropdown.contains(e.target) && !navUserBtn.contains(e.target)) {
                            navUserDropdown.classList.remove('show');
                        }
                    });
                }
            }

            async function fetchModPosts() {
                if (!supabaseClient) return [];
                try {
                    let query = supabaseClient.from('mod_posts').select('*', { count: 'exact' });
                    if (modFilter !== 'all') {
                        query = query.eq('mod_type', modFilter);
                    }
                    if (modSort === 'newest') {
                        query = query.order('created_at', { ascending: false });
                    } else {
                        query = query.order('likes_count', { ascending: false });
                        query = query.order('created_at', { ascending: false });
                    }
                    const from = 0;
                    const to = (modPage + 1) * MOD_PAGE_SIZE - 1;
                    query = query.range(from, to);
                    const { data, error, count } = await query;
                    if (error) throw error;
                    modTotalCount = count || 0;
                    return data || [];
                } catch (e) {
                    console.error('❌ 获取MOD列表失败:', e);
                    return [];
                }
            }

            async function createModPost(postData) {
                if (!currentUser || !supabaseClient) return null;
                const metadata = currentUser.user_metadata || {};
                const record = {
                    user_id: currentUser.id,
                    display_name: metadata.display_name || currentUser.email || '用户',
                    avatar_url: metadata.avatar_url || null,
                    game_name: postData.gameName,
                    title: postData.title,
                    content: postData.content || null,
                    mod_link: postData.modLink,
                    mod_type: postData.modType || '其他'
                };
                try {
                    const { data, error } = await supabaseClient.from('mod_posts')
                        .insert(record).select().single();
                    if (error) throw error;
                    showToast('✅ MOD发布成功！', 2000);
                    return data;
                } catch (e) {
                    console.error('❌ 发布MOD失败:', e);
                    showToast('⚠️ 发布失败，请重试', 2000);
                    return null;
                }
            }

            async function deleteModPost(postId) {
                if (!currentUser || !supabaseClient) return;
                try {
                    let query = supabaseClient.from('mod_posts').delete().eq('id', postId);
                    if (!isAdmin) { query = query.eq('user_id', currentUser.id); }
                    const { error } = await query;
                    if (error) throw error;
                    showToast('✅ 已删除', 1500);
                } catch (e) {
                    console.error('❌ 删除MOD失败:', e);
                    showToast('⚠️ 删除失败', 2000);
                }
            }

            async function updateModPost(postId, updates) {
                if (!currentUser || !supabaseClient) return false;
                try {
                    const { error } = await supabaseClient.from('mod_posts')
                        .update(updates).eq('id', postId).eq('user_id', currentUser.id);
                    if (error) throw error;
                    return true;
                } catch (e) {
                    console.error('❌ 更新MOD失败:', e);
                    return false;
                }
            }

            function openModEdit(post) {
                if (!post || !currentUser) return;
                const overlay = document.getElementById('modEditOverlay');
                document.getElementById('modEditGameName').value = post.game_name || '';
                document.getElementById('modEditType').value = post.mod_type || '其他';
                document.getElementById('modEditTitle').value = post.title || '';
                document.getElementById('modEditLink').value = post.mod_link || '';
                document.getElementById('modEditContent').value = post.content || '';
                overlay.dataset.postId = post.id;
                overlay.classList.add('show');

                const closeBtn = document.getElementById('modEditCloseBtn');
                const cancelBtn = document.getElementById('modEditCancelBtn');
                const onClose = function (e) {
                    e.stopPropagation();
                    closeModEdit();
                };
                closeBtn.onclick = onClose;
                cancelBtn.onclick = onClose;
                overlay.onclick = function (e) {
                    if (e.target === overlay) closeModEdit();
                };

                const saveBtn = document.getElementById('modEditSaveBtn');
                saveBtn.onclick = async function () {
                    const title = document.getElementById('modEditTitle').value.trim();
                    const gameName = document.getElementById('modEditGameName').value.trim();
                    const modLink = document.getElementById('modEditLink').value.trim();
                    if (!title) { showToast('请输入标题', 1500); return; }
                    if (!gameName) { showToast('请输入游戏名称', 1500); return; }
                    if (!modLink) { showToast('请输入MOD链接', 1500); return; }
                    saveBtn.disabled = true;
                    saveBtn.textContent = '保存中...';
                    const ok = await updateModPost(post.id, {
                        title,
                        game_name: gameName,
                        mod_type: document.getElementById('modEditType').value,
                        mod_link: modLink,
                        content: document.getElementById('modEditContent').value.trim() || null
                    });
                    saveBtn.disabled = false;
                    saveBtn.textContent = '💾 保存修改';
                    if (ok) {
                        showToast('✅ 修改已保存', 1500);
                        closeModEdit();
                        Object.assign(post, {
                            title, game_name: gameName,
                            mod_type: document.getElementById('modEditType').value,
                            mod_link: modLink,
                            content: document.getElementById('modEditContent').value.trim() || null
                        });
                        await renderModPostList();
                    } else {
                        showToast('⚠️ 保存失败，请重试', 2000);
                    }
                };
            }

            function closeModEdit() {
                const overlay = document.getElementById('modEditOverlay');
                overlay.classList.remove('show');
                delete overlay.dataset.postId;
            }

            async function toggleForceBadge(postId, field) {
                if (!isAdmin || !supabaseClient) {
                    showToast('⚠️ 管理员未登录', 2000);
                    return;
                }
                const post = modPosts.find(p => p.id === postId);
                if (!post) {
                    showToast('⚠️ 找不到帖子', 2000);
                    return;
                }
                const newVal = !post[field];
                const label = field === 'force_hot' ? '热榜' : '精选';
                try {
                    const { data, error } = await supabaseClient.from('mod_posts')
                        .update({ [field]: newVal }).eq('id', postId).select();
                    if (error) throw error;
                    post[field] = newVal;
                    showToast(newVal ? `✅ 已设为${label}` : `✅ 已取消${label}`, 1500);
                    await renderModPostList();
                } catch (e) {
                    console.error('❌ 更新徽章失败:', e);
                    const msg = e.message || e.error?.message || '未知错误';
                    showToast(`⚠️ 操作失败: ${msg}`, 3000);
                }
            }
            window.toggleForceBadge = toggleForceBadge;

            async function toggleModLike(postId) {
                if (!currentUser || !supabaseClient) {
                    showToast('请先登录', 1500);
                    return;
                }
                // ★ 优先使用 RPC：单次往返完成 判断+插入/删除+计数更新
                let likedNow = null;
                try {
                    const { data, error } = await supabaseClient
                        .rpc('toggle_mod_like', { p_post_id: postId, p_user_id: currentUser.id });
                    if (!error) likedNow = !!data;
                } catch (_) {}
                if (likedNow !== null) {
                    if (likedNow) {
                        const post = modPosts.find(p => p.id === postId);
                        if (post && post.user_id && post.user_id !== currentUser.id) {
                            createModNotification(post.user_id, 'like', postId);
                        }
                    }
                    return;
                }
                // 回退：老逻辑（select 后 insert/delete + 计数RPC）
                try {
                    const { data: existing } = await supabaseClient.from('mod_likes')
                        .select('id').eq('post_id', postId).eq('user_id', currentUser.id).maybeSingle();
                    
                    // 并行执行删除/插入和计数更新
                    if (existing) {
                        await Promise.all([
                            supabaseClient.from('mod_likes').delete().eq('id', existing.id),
                            supabaseClient.rpc('decrement_mod_likes', { pid: postId })
                        ]);
                    } else {
                        const post = modPosts.find(p => p.id === postId);
                        await Promise.all([
                            supabaseClient.from('mod_likes').insert({
                                post_id: postId, user_id: currentUser.id
                            }),
                            supabaseClient.rpc('increment_mod_likes', { pid: postId }),
                            // 通知发送并行执行，不阻塞主流程
                            (post && post.user_id) ? createModNotification(post.user_id, 'like', postId) : Promise.resolve()
                        ]);
                    }
                } catch (e) {
                    console.error('❌ 点赞操作失败:', e);
                }
            }

            async function checkUserModLike(postId) {
                if (!currentUser || !supabaseClient) return false;
                try {
                    const { data } = await supabaseClient.from('mod_likes')
                        .select('id').eq('post_id', postId).eq('user_id', currentUser.id).maybeSingle();
                    return !!data;
                } catch (_) { return false; }
            }

            async function checkUserModThanks(postId) {
                if (!currentUser || !supabaseClient) return false;
                try {
                    const { data } = await supabaseClient.from('mod_thanks')
                        .select('id').eq('post_id', postId).eq('user_id', currentUser.id).maybeSingle();
                    return !!data;
                } catch (_) { return false; }
            }

            async function toggleModThanks(postId) {
                if (!currentUser || !supabaseClient) {
                    showToast('请先登录', 1500);
                    return;
                }
                // ★ 优先使用 RPC：单次往返完成 判断+插入/删除+计数更新
                let thankedNow = null;
                try {
                    const { data, error } = await supabaseClient
                        .rpc('toggle_mod_thanks', { p_post_id: postId, p_user_id: currentUser.id });
                    if (!error) thankedNow = !!data;
                } catch (_) {}
                if (thankedNow !== null) {
                    if (thankedNow) {
                        const post = modPosts.find(p => p.id === postId);
                        if (post && post.user_id && post.user_id !== currentUser.id) {
                            createModNotification(post.user_id, 'thanks', postId);
                        }
                    }
                    return;
                }
                // 回退：老逻辑（select 后 insert/delete + 计数RPC）
                try {
                    const { data: existing } = await supabaseClient.from('mod_thanks')
                        .select('id').eq('post_id', postId).eq('user_id', currentUser.id).maybeSingle();
                    
                    // 并行执行删除/插入和计数更新
                    if (existing) {
                        await Promise.all([
                            supabaseClient.from('mod_thanks').delete().eq('id', existing.id),
                            supabaseClient.rpc('decrement_mod_thanks', { pid: postId })
                        ]);
                    } else {
                        const metadata = currentUser.user_metadata || {};
                        const post = modPosts.find(p => p.id === postId);
                        await Promise.all([
                            supabaseClient.from('mod_thanks').insert({
                                post_id: postId,
                                user_id: currentUser.id,
                                display_name: metadata.display_name || currentUser.email || '用户',
                                avatar_url: metadata.avatar_url || null
                            }),
                            supabaseClient.rpc('increment_mod_thanks', { pid: postId }),
                            // 通知发送并行执行，不阻塞主流程
                            (post && post.user_id && post.user_id !== currentUser.id) ? 
                                createModNotification(post.user_id, 'thanks', postId) : Promise.resolve()
                        ]);
                    }
                } catch (e) {
                    console.error('❌ 感谢操作失败:', e);
                }
            }

            async function fetchAuthorStats(userId) {
                if (!supabaseClient) return null;
                try {
                    const { data } = await supabaseClient.from('mod_author_stats')
                        .select('*').eq('user_id', userId).maybeSingle();
                    return data;
                } catch (_) { return null; }
            }

            async function fetchModThanksList(postId) {
                if (!supabaseClient) return [];
                try {
                    const { data } = await supabaseClient.from('mod_thanks')
                        .select('display_name, avatar_url, created_at')
                        .eq('post_id', postId)
                        .order('created_at', { ascending: false });
                    return data || [];
                } catch (_) { return []; }
            }

            async function fetchModComments(postId) {
                if (!supabaseClient) return [];
                try {
                    const { data, error } = await supabaseClient.from('mod_comments')
                        .select('id, post_id, user_id, display_name, avatar_url, content, created_at')
                        .eq('post_id', postId)
                        .order('created_at', { ascending: true })
                        .limit(100);
                    if (error) throw error;
                    return data || [];
                } catch (e) {
                    console.error('❌ 获取MOD评论失败:', e);
                    return [];
                }
            }

            async function addModComment(postId, content) {
                if (!currentUser || !supabaseClient) return null;
                const metadata = currentUser.user_metadata || {};
                try {
                    const { data, error } = await supabaseClient.from('mod_comments').insert({
                        post_id: postId,
                        user_id: currentUser.id,
                        display_name: metadata.display_name || currentUser.email || '用户',
                        avatar_url: metadata.avatar_url || null,
                        content: content
                    }).select().single();
                    if (error) throw error;
                    await supabaseClient.rpc('increment_mod_comments', { pid: postId });
                    const post = modPosts.find(p => p.id === postId);
                    if (post && post.user_id) {
                        await createModNotification(post.user_id, 'comment', postId, content);
                    }
                    return data;
                } catch (e) {
                    console.error('❌ 添加MOD评论失败:', e);
                    return null;
                }
            }

            async function deleteModComment(commentId) {
                if (!currentUser || !supabaseClient) return;
                try {
                    let fetchQuery = supabaseClient.from('mod_comments')
                        .select('post_id').eq('id', commentId);
                    if (!isAdmin) { fetchQuery = fetchQuery.eq('user_id', currentUser.id); }
                    const { data: comment } = await fetchQuery.maybeSingle();
                    let deleteQuery = supabaseClient.from('mod_comments').delete().eq('id', commentId);
                    if (!isAdmin) { deleteQuery = deleteQuery.eq('user_id', currentUser.id); }
                    const { error } = await deleteQuery;
                    if (error) throw error;
                    if (comment && comment.post_id) {
                        await supabaseClient.rpc('decrement_mod_comments', { pid: comment.post_id });
                    }
                } catch (e) {
                    console.error('❌ 删除MOD评论失败:', e);
                }
            }

            function formatModTime(iso) {
                if (!iso) return '';
                const d = new Date(iso);
                const now = new Date();
                const diffMs = now - d;
                const diffMin = Math.floor(diffMs / 60000);
                if (diffMin < 1) return '刚刚';
                if (diffMin < 60) return diffMin + '分钟前';
                const diffHour = Math.floor(diffMin / 60);
                if (diffHour < 24) return diffHour + '小时前';
                const diffDay = Math.floor(diffHour / 24);
                if (diffDay < 7) return diffDay + '天前';
                return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
            }

            async function renderModSection() {
                renderModCompose();
                await renderModPostList();
                initModFilterEvents();
                initModSortEvents();
                if (supabaseClient && !modListener) {
                    try {
                        modListener = supabaseClient
                            .channel('mod-changes')
                            .on('postgres_changes', { event: '*', schema: 'public', table: 'mod_posts' }, () => {
                                clearTimeout(_modDebounce);
                                _modDebounce = setTimeout(() => {
                                    if (currentMainView === 'mods') renderModPostList();
                                }, 1000);
                            })
                            .subscribe();
                    } catch (_) { }
                }
                initNotifSystem();
            }

            // ================================================================
            // MOD 通知系统
            // ================================================================
            let _notifListener = null;
            let _unreadCount = 0;
            let _notifEventsBound = false;

            function initNotifSystem() {
                if (!currentUser || !supabaseClient) {
                    document.getElementById('notifBellWrap').style.display = 'none';
                    return;
                }
                document.getElementById('notifBellWrap').style.display = '';
                loadUnreadCount();
                subscribeNotifRealtime();
                setupNotifEvents();
            }

            function setupNotifEvents() {
                if (_notifEventsBound) return;
                _notifEventsBound = true;
                const bellBtn = document.getElementById('notifBellBtn');
                const panel = document.getElementById('notifPanel');
                const markAll = document.getElementById('notifMarkAll');

                bellBtn.addEventListener('click', function (e) {
                    e.stopPropagation();
                    const isOpen = panel.classList.contains('show');
                    panel.classList.toggle('show');
                    if (!isOpen) loadNotifications();
                });

                document.addEventListener('click', function (e) {
                    if (!panel.contains(e.target) && e.target !== bellBtn) {
                        panel.classList.remove('show');
                    }
                });

                markAll.addEventListener('click', async function () {
                    if (!supabaseClient || !currentUser) return;
                    if (this.dataset.submitting === '1') return;
                    this.dataset.submitting = '1';
                    // 乐观更新：立即清零角标并移除未读样式，无需等待 DB 响应
                    _unreadCount = 0;
                    updateNotifBadge();
                    const listEl = document.getElementById('notifList');
                    if (listEl) listEl.querySelectorAll('.notif-item.unread').forEach(item => item.classList.remove('unread'));
                    // 后台执行 DB 更新，失败时重新拉取未读数回滚
                    try {
                        const { error } = await supabaseClient.from('notifications')
                            .update({ is_read: true })
                            .eq('user_id', currentUser.id)
                            .eq('is_read', false);
                        if (error) throw error;
                    } catch (e) {
                        console.warn('[Notif] 全部已读失败，回滚未读数：', e.message || e);
                        loadUnreadCount();
                    } finally {
                        this.dataset.submitting = '0';
                    }
                });
            }

            async function loadUnreadCount() {
                if (!supabaseClient || !currentUser) return;
                try {
                    const { count } = await supabaseClient.from('notifications')
                        .select('*', { count: 'exact', head: true })
                        .eq('user_id', currentUser.id)
                        .eq('is_read', false);
                    _unreadCount = count || 0;
                    updateNotifBadge();
                } catch (_) { }
            }

            function updateNotifBadge() {
                const badge = document.getElementById('notifBadge');
                if (!badge) return;
                if (_unreadCount > 0) {
                    badge.style.display = '';
                    badge.textContent = _unreadCount > 99 ? '99+' : _unreadCount;
                } else {
                    badge.style.display = 'none';
                }
            }

            async function loadNotifications() {
                if (!supabaseClient || !currentUser) return;
                try {
                    const { data } = await supabaseClient.from('notifications')
                        .select('id, user_id, actor_id, actor_name, actor_avatar, type, target_type, target_id, target_title, content, is_read, created_at')
                        .eq('user_id', currentUser.id)
                        .order('created_at', { ascending: false })
                        .limit(30);
                    renderNotifList(data || []);
                } catch (_) { }
            }

            function renderNotifList(notifs) {
                const listEl = document.getElementById('notifList');
                if (!listEl) return;
                if (notifs.length === 0) {
                    listEl.innerHTML = '<div class="notif-empty">暂无通知</div>';
                    return;
                }
                listEl.innerHTML = notifs.map(n => {
                    const avatarHtml = n.actor_avatar ?
                        `<img class="notif-item-avatar" src="${escapeHTML(n.actor_avatar)}" referrerpolicy="no-referrer" />` :
                        `<div class="notif-item-avatar-placeholder">👤</div>`;
                    
                    let typeText = '';
                    let preview = '';
                    switch (n.type) {
                        case 'like':
                            typeText = '赞了你的 MOD 分享';
                            break;
                        case 'thanks':
                            typeText = '感谢了你的 MOD 分享';
                            break;
                        case 'comment':
                            typeText = '评论了你的 MOD 分享';
                            preview = n.content ? `<div class="notif-item-preview">"${escapeHTML(n.content.substring(0, 60))}"</div>` : '';
                            break;
                        case 'reply':
                            typeText = '回复了你的评论';
                            preview = n.content ? `<div class="notif-item-preview">"${escapeHTML(n.content.substring(0, 60))}"</div>` : '';
                            break;
                        case 'comment_like':
                            typeText = '赞了你的评论';
                            break;
                        default:
                            typeText = '与你互动';
                    }

                    const time = formatModTime(n.created_at);
                    const unreadCls = n.is_read ? '' : ' unread';
                    return `<div class="notif-item${unreadCls}" data-notif-id="${n.id}" data-target-type="${n.target_type}" data-target-id="${n.target_id}">
                        ${avatarHtml}
                        <div class="notif-item-body">
                            <div class="notif-item-text"><strong>${escapeHTML(n.actor_name || '用户')}</strong> ${typeText}</div>
                            ${preview}
                            <div class="notif-item-time">${time}</div>
                        </div>
                    </div>`;
                }).join('');

                listEl.querySelectorAll('.notif-item').forEach(item => {
                    item.addEventListener('click', async function () {
                        const notifId = Number(this.dataset.notifId);
                        const targetType = this.dataset.targetType;
                        const targetId = Number(this.dataset.targetId);
                        if (supabaseClient && currentUser) {
                            await supabaseClient.from('notifications')
                                .update({ is_read: true })
                                .eq('id', notifId)
                                .eq('user_id', currentUser.id);
                            _unreadCount = Math.max(0, _unreadCount - 1);
                            updateNotifBadge();
                        }
                        document.getElementById('notifPanel').classList.remove('show');
                        
                        // 根据目标类型跳转
                        if (targetType === 'mod_post') {
                            if (currentMainView !== 'mods') switchMainView('mods');
                            const post = modPosts.find(p => p.id === targetId);
                            if (post) setTimeout(() => openModDetail(post), 200);
                        }
                    });
                });
            }

            function subscribeNotifRealtime() {
                if (!supabaseClient || !currentUser || _notifListener) return;
                try {
                    _notifListener = supabaseClient
                        .channel('notif-' + currentUser.id)
                        .on('postgres_changes', {
                            event: 'INSERT',
                            schema: 'public',
                            table: 'notifications',
                            filter: `user_id=eq.${currentUser.id}`
                        }, (payload) => {
                            _unreadCount++;
                            updateNotifBadge();
                            showToast('🔔 收到新通知', 2000);
                            const panel = document.getElementById('notifPanel');
                            if (panel && panel.classList.contains('show')) {
                                loadNotifications();
                            }
                        })
                        .subscribe();
                } catch (_) { }
            }

            async function createModNotification(postOwnerId, type, postId, commentContent) {
                if (!supabaseClient || !currentUser) return;
                if (postOwnerId === currentUser.id) return;
                const metadata = currentUser.user_metadata || {};
                const displayName = metadata.display_name || currentUser.email || '用户';
                const avatarUrl = metadata.avatar_url || null;
                try {
                    await supabaseClient.from('notifications').insert({
                        user_id: postOwnerId,
                        actor_id: currentUser.id,
                        actor_name: displayName,
                        actor_avatar: avatarUrl,
                        type: type,
                        target_type: 'mod_post',
                        target_id: postId,
                        content: commentContent || ''
                    });
                } catch (e) {
                    console.error('❌ 通知发送失败:', e);
                }
            }

            async function createReplyNotification(targetUserId, targetType, targetId, targetTitle, replyContent) {
                if (!supabaseClient || !currentUser) return;
                if (targetUserId === currentUser.id) return;
                const metadata = currentUser.user_metadata || {};
                const displayName = metadata.display_name || currentUser.email || '用户';
                const avatarUrl = metadata.avatar_url || null;
                try {
                    await supabaseClient.from('notifications').insert({
                        user_id: targetUserId,
                        actor_id: currentUser.id,
                        actor_name: displayName,
                        actor_avatar: avatarUrl,
                        type: 'reply',
                        target_type: targetType,
                        target_id: targetId,
                        target_title: targetTitle || '',
                        content: replyContent || ''
                    });
                } catch (e) {
                    console.error('❌ 回复通知发送失败:', e);
                }
            }

            async function createCommentLikeNotification(targetUserId, targetId, targetType) {
                if (!supabaseClient || !currentUser) return;
                if (targetUserId === currentUser.id) return;
                const metadata = currentUser.user_metadata || {};
                const displayName = metadata.display_name || currentUser.email || '用户';
                const avatarUrl = metadata.avatar_url || null;
                try {
                    await supabaseClient.from('notifications').insert({
                        user_id: targetUserId,
                        actor_id: currentUser.id,
                        actor_name: displayName,
                        actor_avatar: avatarUrl,
                        type: 'comment_like',
                        target_type: targetType,
                        target_id: targetId,
                        content: ''
                    });
                } catch (e) {
                    console.error('❌ 点赞通知发送失败:', e);
                }
            }

            function renderModCompose() {
                const area = document.getElementById('modComposeArea');
                if (!area) return;
                const hasBtn = area.querySelector('.mod-compose-trigger-btn');
                const hasLoginHint = area.querySelector('.mod-login-hint');
                if (hasBtn || hasLoginHint) return;
                if (currentUser) {
                    const metadata = currentUser.user_metadata || {};
                    const avatarUrl = metadata.avatar_url || '';
                    const displayName = metadata.display_name || currentUser.email || '用户';
                    area.innerHTML = `
                        <button class="mod-compose-trigger-btn" onclick="toggleModComposeForm()">✍️ 发布MOD</button>
                        <div class="mod-compose" style="display:none;">
                            <div class="mod-compose-header">
                                ${avatarUrl ?
                            `<img src="${escapeHTML(avatarUrl)}" class="mod-compose-avatar" referrerpolicy="no-referrer" />` :
                            `<div class="mod-compose-avatar-placeholder">👤</div>`}
                                <span class="mod-compose-name">${escapeHTML(displayName)}</span>
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label>游戏名称 *</label>
                                    <input type="text" id="modGameName" placeholder="例如：Stardew Valley" maxlength="100" />
                                </div>
                                <div class="form-group">
                                    <label>MOD类型 *</label>
                                    <select id="modType">${MOD_TYPES.map(t => `<option value="${t}">${MOD_TYPE_ICONS[t] || ''} ${t}</option>`).join('')}</select>
                                </div>
                            </div>
                            <div class="form-group" style="margin-bottom:10px;">
                                <label>标题 *</label>
                                <input type="text" id="modTitle" placeholder="给你的MOD分享起个标题" maxlength="100" />
                            </div>
                            <div class="form-group" style="margin-bottom:10px;">
                                <label>MOD下载/分享链接 *</label>
                                <input type="url" id="modLink" placeholder="https://..." />
                            </div>
                            <textarea id="modContent" placeholder="简单描述一下这个MOD的内容、使用方法、注意事项等（选填）" maxlength="1000"></textarea>
                            <div class="mod-compose-footer">
                                <span class="char-count"><span id="modCharCount">0</span>/1000</span>
                                <div style="display:flex;gap:8px;">
                                    <button class="btn btn-sm btn-secondary" onclick="toggleModComposeForm()">取消</button>
                                    <button class="btn btn-sm btn-accent" id="modSubmitBtn">发布MOD</button>
                                </div>
                            </div>
                        </div>`;
                    const content = document.getElementById('modContent');
                    const charCount = document.getElementById('modCharCount');
                    const submitBtn = document.getElementById('modSubmitBtn');
                    if (content && charCount) {
                        content.addEventListener('input', function () {
                            charCount.textContent = this.value.length;
                            charCount.classList.toggle('warn', this.value.length >= 980);
                        });
                    }
                    if (submitBtn) {
                        let lastModSubmitTime = 0;
                        submitBtn.addEventListener('click', async function () {
                            const now = Date.now();
                            if (now - lastModSubmitTime < 5000) { showToast('操作太频繁，请稍后再试', 1500); return; }
                            const gameName = document.getElementById('modGameName')?.value.trim();
                            const modType = document.getElementById('modType')?.value;
                            const title = document.getElementById('modTitle')?.value.trim();
                            const modLink = document.getElementById('modLink')?.value.trim();
                            const contentText = document.getElementById('modContent')?.value.trim();
                            if (!gameName) { showToast('请输入游戏名称', 1500); return; }
                            if (gameName.length > 100) { showToast('游戏名称过长', 1500); return; }
                            if (!title) { showToast('请输入标题', 1500); return; }
                            if (title.length > 100) { showToast('标题过长', 1500); return; }
                            if (!modLink) { showToast('请输入MOD链接', 1500); return; }
                            if (isDangerousURL(modLink)) { showToast('⚠️ 不允许该协议链接', 1500); return; }
                            if (!isValidURL(modLink)) { showToast('请输入有效的链接地址', 1500); return; }
                            if (contentText && contentText.length > 1000) { showToast('内容过长', 1500); return; }
                            if (contentText && (/<script/i.test(contentText) || /javascript\s*:/i.test(contentText))) { showToast('内容包含不允许的字符', 1500); return; }
                            lastModSubmitTime = now;
                            submitBtn.disabled = true;
                            submitBtn.textContent = '发布中...';
                            const result = await createModPost({
                                gameName: truncateInput(gameName, 100), modType, title: truncateInput(title, 100), modLink, content: contentText ? truncateInput(contentText, 1000) : null
                            });
                            if (result) {
                                document.getElementById('modGameName').value = '';
                                document.getElementById('modTitle').value = '';
                                document.getElementById('modLink').value = '';
                                document.getElementById('modContent').value = '';
                                if (charCount) charCount.textContent = '0';
                                modPage = 0;
                                toggleModComposeForm();
                                await renderModPostList();
                            }
                            submitBtn.disabled = false;
                            submitBtn.textContent = '发布MOD';
                        });
                    }
                } else {
                    area.innerHTML = `
                        <div class="mod-login-hint">
                            🔑 <a id="modLoginLink">登录</a> 后即可发布MOD分享
                        </div>`;
                    document.getElementById('modLoginLink')?.addEventListener('click', function () {
                        openAuthModal();
                    });
                }
            }

            function toggleModComposeForm() {
                const area = document.getElementById('modComposeArea');
                if (!area) return;
                const form = area.querySelector('.mod-compose');
                const btn = area.querySelector('.mod-compose-trigger-btn');
                if (!form) return;
                const isVisible = form.style.display !== 'none';
                form.style.display = isVisible ? 'none' : '';
                if (btn) btn.style.display = isVisible ? '' : 'none';
            }
            window.toggleModComposeForm = toggleModComposeForm;

            async function renderModPostList() {
                const listEl = document.getElementById('modPostList');
                const emptyEl = document.getElementById('modEmpty');
                const statsEl = document.getElementById('modStats');
                const loadMoreEl = document.getElementById('modLoadMore');
                if (!listEl) return;

                const posts = await fetchModPosts();
                modPosts = posts;

                // 合并所有查询为单个并行批次（从2批次优化为1批次）
                if (posts.length > 0 && supabaseClient) {
                    try {
                        const postIds = posts.map(p => p.id);
                        const [likesRes, thanksRes, commentsRes, userLikesRes, userThanksRes] = await Promise.all([
                            // 计数查询
                            supabaseClient.from('mod_likes').select('post_id').in('post_id', postIds),
                            supabaseClient.from('mod_thanks').select('post_id').in('post_id', postIds),
                            supabaseClient.from('mod_comments').select('post_id').in('post_id', postIds),
                            // 用户状态查询
                            currentUser ? supabaseClient.from('mod_likes')
                                .select('post_id').eq('user_id', currentUser.id).in('post_id', postIds) : { data: null },
                            currentUser ? supabaseClient.from('mod_thanks')
                                .select('post_id').eq('user_id', currentUser.id).in('post_id', postIds) : { data: null }
                        ]);
                        
                        // 处理计数
                        const likesMap = {};
                        const thanksMap = {};
                        const commentsMap = {};
                        if (likesRes.data) likesRes.data.forEach(l => { likesMap[l.post_id] = (likesMap[l.post_id] || 0) + 1; });
                        if (thanksRes.data) thanksRes.data.forEach(t => { thanksMap[t.post_id] = (thanksMap[t.post_id] || 0) + 1; });
                        if (commentsRes.data) commentsRes.data.forEach(c => { commentsMap[c.post_id] = (commentsMap[c.post_id] || 0) + 1; });
                        posts.forEach(p => {
                            p.likes_count = likesMap[p.id] || p.likes_count || 0;
                            p.thanks_count = thanksMap[p.id] || p.thanks_count || 0;
                            p.comments_count = commentsMap[p.id] || p.comments_count || 0;
                        });
                        
                        // 处理用户状态
                        let likedSet = new Set();
                        let thankedSet = new Set();
                        if (userLikesRes.data) userLikesRes.data.forEach(l => likedSet.add(l.post_id));
                        if (userThanksRes.data) userThanksRes.data.forEach(t => thankedSet.add(t.post_id));
                        
                        // 存储用户状态供后续使用
                        window._modLikedSet = likedSet;
                        window._modThankedSet = thankedSet;
                    } catch (_) { }
                } else {
                    window._modLikedSet = new Set();
                    window._modThankedSet = new Set();
                }

                if (posts.length === 0 && modPage === 0) {
                    listEl.innerHTML = '';
                    if (emptyEl) emptyEl.style.display = '';
                    if (loadMoreEl) loadMoreEl.style.display = 'none';
                    if (statsEl) statsEl.innerHTML = '共 <strong>0</strong> 个MOD';
                    return;
                }
                if (emptyEl) emptyEl.style.display = 'none';
                if (statsEl) statsEl.innerHTML = `共 <strong>${modTotalCount}</strong> 个MOD`;

                // 使用已获取的用户状态（在前面的并行查询中已获取）
                const likedSet = window._modLikedSet || new Set();
                const thankedSet = window._modThankedSet || new Set();

                let html = '';
                for (const post of posts) {
                    const isOwn = currentUser && post.user_id === currentUser.id;
                    const avatarHtml = post.avatar_url ?
                        `<img src="${escapeHTML(post.avatar_url)}" class="mod-post-item-avatar" referrerpolicy="no-referrer" />` :
                        `<div class="mod-post-item-avatar-placeholder">👤</div>`;
                    const typeClass = MOD_TYPE_CLASSES[post.mod_type] || 'other';
                    const typeIcon = MOD_TYPE_ICONS[post.mod_type] || '📦';
                    const liked = likedSet.has(post.id);
                    const thanked = thankedSet.has(post.id);
                    const editHtml = isOwn ?
                        `<button class="mod-post-edit-btn" data-post-id="${post.id}">✏️ 编辑</button>` : '';
                    const deleteHtml = isOwn ?
                        `<button class="mod-post-delete-btn" data-post-id="${post.id}">🗑 删除</button>` : '';
                    const reportHtml = !isOwn ?
                        `<button class="mod-post-report-btn" data-post-id="${post.id}">🚩 举报</button>` : '';

                    let badgesHtml = '';
                    const isHot = post.force_hot || (post.likes_count || 0) >= 10;
                    const isFeatured = post.force_featured || (post.comments_count || 0) >= 10;
                    const isStar = (post.likes_count || 0) >= 20;
                    if (isStar) badgesHtml += '<span class="mod-badge badge-star" title="万众瞩目">⭐</span>';
                    else if (isHot) badgesHtml += '<span class="mod-badge badge-hot" title="热榜">🔥</span>';
                    if (isFeatured) badgesHtml += '<span class="mod-badge badge-featured" title="精选">✨</span>';

                    let adminBadgeMenu = '';
                    if (isAdmin) {
                        adminBadgeMenu = `
                            <div class="mod-admin-badge-menu">
                                <button class="mod-admin-badge-btn" onclick="event.stopPropagation();this.nextElementSibling.classList.toggle('show');">⚙️</button>
                                <div class="mod-admin-badge-dropdown">
                                    <button class="badge-toggle-item" onclick="event.stopPropagation();toggleForceBadge(${post.id},'force_hot');this.closest('.mod-admin-badge-dropdown').classList.remove('show');">
                                        <span class="badge-toggle-label">🔥 热榜</span>
                                        <span class="badge-toggle-status ${post.force_hot ? 'on' : 'off'}">${post.force_hot ? '强制' : '自动'}</span>
                                    </button>
                                    <button class="badge-toggle-item" onclick="event.stopPropagation();toggleForceBadge(${post.id},'force_featured');this.closest('.mod-admin-badge-dropdown').classList.remove('show');">
                                        <span class="badge-toggle-label">✨ 精选</span>
                                        <span class="badge-toggle-status ${post.force_featured ? 'on' : 'off'}">${post.force_featured ? '强制' : '自动'}</span>
                                    </button>
                                </div>
                            </div>`;
                    }

                    html += `
                        <div class="mod-post-item" data-post-id="${post.id}">
                            <div class="mod-post-item-header">
                                ${avatarHtml}
                                <span class="mod-post-item-user" data-user-id="${post.user_id}" style="cursor:pointer;">${escapeHTML(post.display_name || '用户')}</span>
                                ${badgesHtml}
                                ${adminBadgeMenu}
                                <span class="mod-post-item-time">${formatModTime(post.created_at)}</span>
                            </div>
                            <div class="mod-post-item-title">${escapeHTML(post.title)}</div>
                            <div class="mod-post-item-game">🎮 ${escapeHTML(post.game_name)}</div>
                            <span class="mod-tag ${typeClass}">${typeIcon} ${escapeHTML(post.mod_type || '其他')}</span>
                            ${post.content ? `<div class="mod-post-item-content">${escapeHTML(post.content)}</div>` : ''}
                            <div class="mod-post-item-footer">
                                <button class="mod-post-action-btn like-btn${liked ? ' liked' : ''}" data-post-id="${post.id}">
                                    ${liked ? '❤️' : '🤍'} <span class="count">${post.likes_count || 0}</span>
                                </button>
                                <button class="mod-post-action-btn thanks-btn${thanked ? ' thanked' : ''}" data-post-id="${post.id}">
                                    ${thanked ? '💖' : '🤍'} 感谢 <span class="count">${post.thanks_count || 0}</span>
                                </button>
                                <button class="mod-post-action-btn comment-btn" data-post-id="${post.id}">
                                    💬 <span class="count">${post.comments_count || 0}</span>
                                </button>
                                <a class="mod-post-link-btn" href="${escapeHTML(post.mod_link)}" target="_blank" rel="noopener noreferrer" onclick="event.stopPropagation();">
                                    🔗 查看MOD
                                </a>
                                ${reportHtml}
                                ${editHtml}
                                ${deleteHtml}
                            </div>
                        </div>`;
                }
                listEl.innerHTML = html;

                const hasMore = posts.length < modTotalCount;
                if (loadMoreEl) loadMoreEl.style.display = hasMore ? 'block' : 'none';

                listEl.querySelectorAll('.mod-post-item').forEach(item => {
                    item.addEventListener('click', function (e) {
                        if (e.target.closest('.mod-post-action-btn') || e.target.closest('.mod-post-link-btn') || e.target.closest('.mod-post-delete-btn') || e.target.closest('.mod-post-edit-btn')) return;
                        const postId = Number(this.dataset.postId);
                        const post = modPosts.find(p => p.id === postId);
                        if (post) openModDetail(post);
                    });
                });

                listEl.querySelectorAll('.like-btn').forEach(btn => {
                    btn.addEventListener('click', async function (e) {
                        e.stopPropagation();
                        if (!currentUser) { showToast('请先登录', 1500); return; }
                        const postId = Number(this.dataset.postId);
                        const wasLiked = this.classList.contains('liked');
                        const countEl = this.querySelector('.count');
                        const oldCount = Number(countEl?.textContent || 0);
                        this.classList.toggle('liked');
                        this.innerHTML = (wasLiked ? '🤍' : '❤️') + ` <span class="count">${wasLiked ? oldCount - 1 : oldCount + 1}</span>`;
                        const post = modPosts.find(p => p.id === postId);
                        if (post) post.likes_count = wasLiked ? oldCount - 1 : oldCount + 1;
                        await toggleModLike(postId);
                    });
                });

                listEl.querySelectorAll('.thanks-btn').forEach(btn => {
                    btn.addEventListener('click', async function (e) {
                        e.stopPropagation();
                        if (!currentUser) { showToast('请先登录', 1500); return; }
                        const postId = Number(this.dataset.postId);
                        const wasThanked = this.classList.contains('thanked');
                        const countEl = this.querySelector('.count');
                        const oldCount = Number(countEl?.textContent || 0);
                        this.classList.toggle('thanked');
                        this.innerHTML = (wasThanked ? '🤍' : '💖') + ` 感谢 <span class="count">${wasThanked ? oldCount - 1 : oldCount + 1}</span>`;
                        const post = modPosts.find(p => p.id === postId);
                        if (post) post.thanks_count = wasThanked ? oldCount - 1 : oldCount + 1;
                        await toggleModThanks(postId);
                    });
                });

                listEl.querySelectorAll('.mod-post-item-user').forEach(el => {
                    el.addEventListener('click', async function (e) {
                        e.stopPropagation();
                        const userId = this.dataset.userId;
                        if (!userId) return;
                        await showAuthorCard(userId, this);
                    });
                });

                listEl.querySelectorAll('.mod-post-edit-btn').forEach(btn => {
                    btn.addEventListener('click', function (e) {
                        e.stopPropagation();
                        const postId = Number(this.dataset.postId);
                        const post = modPosts.find(p => p.id === postId);
                        if (post) openModEdit(post);
                    });
                });

                listEl.querySelectorAll('.mod-post-delete-btn').forEach(btn => {
                    btn.addEventListener('click', async function (e) {
                        e.stopPropagation();
                        if (!confirm('确定删除这个MOD分享吗？')) return;
                        const postId = Number(this.dataset.postId);
                        await deleteModPost(postId);
                        await renderModPostList();
                    });
                });

                listEl.querySelectorAll('.mod-post-report-btn').forEach(btn => {
                    btn.addEventListener('click', function (e) {
                        e.stopPropagation();
                        const postId = Number(this.dataset.postId);
                        openModReport(postId);
                    });
                });
            }

            // ================================================================
            // 作者贡献卡片
            // ================================================================
            let _authorCardEl = null;
            async function showAuthorCard(userId, anchorEl) {
                if (_authorCardEl) { _authorCardEl.remove(); _authorCardEl = null; }
                const stats = await fetchAuthorStats(userId);
                if (!stats) return;

                const card = document.createElement('div');
                card.className = 'author-card-popup';
                const avatarHtml = stats.avatar_url ?
                    `<img src="${escapeHTML(stats.avatar_url)}" class="author-card-avatar" referrerpolicy="no-referrer" />` :
                    `<div class="author-card-avatar-placeholder">👤</div>`;

                let badges = '';
                const totalMods = stats.total_mods || 0;
                const totalLikes = stats.total_likes || 0;
                const totalComments = stats.total_comments || 0;
                if (totalMods >= 1) badges += '🌱';
                if (totalLikes >= 10) badges += '🔥';
                if (totalComments >= 20) badges += '💬';
                if (totalMods >= 5) badges += '🏆';

                card.innerHTML = `
                    <div class="author-card-header">
                        ${avatarHtml}
                        <div>
                            <div class="author-card-name">${escapeHTML(stats.display_name || '用户')}</div>
                            ${badges ? `<div class="author-card-badges">${badges}</div>` : ''}
                        </div>
                    </div>
                    <div class="author-card-stats">
                        <span>📦 <strong>${totalMods}</strong> MOD</span>
                        <span>❤️ <strong>${totalLikes}</strong> 赞</span>
                        <span>💬 <strong>${totalComments}</strong> 评论</span>
                    </div>`;

                document.body.appendChild(card);
                _authorCardEl = card;

                const rect = anchorEl.getBoundingClientRect();
                let top = rect.bottom + 8;
                let left = rect.left;
                if (top + 160 > window.innerHeight) top = rect.top - 160;
                if (left + 260 > window.innerWidth) left = window.innerWidth - 270;
                if (left < 10) left = 10;
                card.style.top = top + 'px';
                card.style.left = left + 'px';

                const closeHandler = (e) => {
                    if (!card.contains(e.target) && !anchorEl.contains(e.target)) {
                        card.remove();
                        _authorCardEl = null;
                        document.removeEventListener('click', closeHandler);
                    }
                };
                setTimeout(() => document.addEventListener('click', closeHandler), 10);
            }

            // ================================================================
            // MOD举报功能
            // ================================================================
            let _reportTargetPostId = null;

            window.openModReport = function (postId) {
                _reportTargetPostId = postId;
                const overlay = document.getElementById('modReportOverlay');
                if (overlay) {
                    document.querySelectorAll('input[name="modReportCat"]').forEach(r => r.checked = false);
                    const desc = document.getElementById('modReportDesc');
                    if (desc) desc.value = '';
                    overlay.classList.add('show');
                }
            };

            window.closeModReport = function () {
                _reportTargetPostId = null;
                const overlay = document.getElementById('modReportOverlay');
                if (overlay) overlay.classList.remove('show');
            };

            window.submitModReport = async function () {
                const checked = document.querySelector('input[name="modReportCat"]:checked');
                if (!checked) { showToast('⚠️ 请选择举报原因', 1500); return; }
                if (!supabaseClient) { showToast('⚠️ 数据库未连接', 1500); return; }
                const desc = (document.getElementById('modReportDesc') || {}).value || '';
                const { error } = await supabaseClient.from('mod_reports').insert({
                    post_id: _reportTargetPostId,
                    category: checked.value,
                    description: desc.trim(),
                    reporter_id: currentUser ? currentUser.id : null,
                    reporter_name: currentUser ? (currentUser.display_name || currentUser.email || '用户') : '匿名'
                });
                if (error) { showToast('❌ 举报提交失败: ' + error.message, 2500); return; }
                closeModReport();
                showToast('✅ 举报已提交，感谢反馈', 2000);
            };

            async function openModDetail(post) {
                const overlay = document.getElementById('modDetailOverlay');
                const container = document.getElementById('modDetailContainer');
                if (!overlay || !container) return;

                // ★ 优化：计数与用户状态优先走 RPC（单次往返），失败回退到多条查询
                const fetchDetailData = async () => {
                    if (!supabaseClient) return { counts: [null, null, null], userState: [false, false] };
                    try {
                        const countsRes = await supabaseClient.rpc('get_mod_post_counts', { p_post_ids: [post.id] });
                        if (!countsRes.error && countsRes.data && countsRes.data.length > 0) {
                            let liked = false;
                            let thanked = false;
                            if (currentUser) {
                                const stateRes = await supabaseClient.rpc('get_mod_user_state', { p_post_id: post.id, p_user_id: currentUser.id });
                                if (!stateRes.error && stateRes.data && stateRes.data[0]) {
                                    liked = !!stateRes.data[0].liked;
                                    thanked = !!stateRes.data[0].thanked;
                                }
                            }
                            const row = countsRes.data[0];
                            return {
                                counts: [{ count: row.likes_count }, { count: row.thanks_count }, { count: row.comments_count }],
                                userState: [liked, thanked]
                            };
                        }
                    } catch (_) {}
                    // 回退：分多条查询
                    const counts = await Promise.all([
                        supabaseClient.from('mod_likes').select('id', { count: 'exact', head: true }).eq('post_id', post.id),
                        supabaseClient.from('mod_thanks').select('id', { count: 'exact', head: true }).eq('post_id', post.id),
                        supabaseClient.from('mod_comments').select('id', { count: 'exact', head: true }).eq('post_id', post.id)
                    ]).catch(() => [null, null, null]);
                    let userState = [false, false];
                    if (currentUser) {
                        userState = await Promise.all([
                            checkUserModLike(post.id),
                            checkUserModThanks(post.id)
                        ]).catch(() => [false, false]);
                    }
                    return { counts, userState };
                };

                // 并行执行所有独立查询
                const [detail, thanksList, comments] = await Promise.all([
                    fetchDetailData(),
                    // 感谢列表
                    fetchModThanksList(post.id).catch(() => []),
                    // 评论列表
                    fetchModComments(post.id).catch(() => [])
                ]);

                const { counts, userState } = detail;

                // 更新计数
                if (counts[0]) post.likes_count = counts[0].count || post.likes_count || 0;
                if (counts[1]) post.thanks_count = counts[1].count || post.thanks_count || 0;
                if (counts[2]) post.comments_count = counts[2].count || post.comments_count || 0;

                const isOwn = currentUser && post.user_id === currentUser.id;
                const typeClass = MOD_TYPE_CLASSES[post.mod_type] || 'other';
                const typeIcon = MOD_TYPE_ICONS[post.mod_type] || '📦';
                const [liked, thanked] = userState;

                let thanksListHtml = '';
                if (thanksList.length > 0) {
                    const avatars = thanksList.slice(0, 10).map(t => {
                        return t.avatar_url ?
                            `<img src="${escapeHTML(t.avatar_url)}" class="mod-thanks-avatar" referrerpolicy="no-referrer" title="${escapeHTML(t.display_name || '用户')}" />` :
                            `<span class="mod-thanks-avatar-placeholder" title="${escapeHTML(t.display_name || '用户')}">👤</span>`;
                    }).join('');
                    const extra = thanksList.length > 10 ? `<span class="mod-thanks-extra">+${thanksList.length - 10}</span>` : '';
                    thanksListHtml = `<div class="mod-thanks-list"><span class="mod-thanks-label">💖 感谢作者：</span>${avatars}${extra}</div>`;
                }

                let commentsHtml = '';
                // 批量拉取所有 MOD 评论的回复
                const modCommentIds = comments.map(c => c.id);
                let modRepliesMap = {};
                try {
                    if (supabaseClient && modCommentIds.length > 0) {
                        const { data, error } = await supabaseClient
                            .from('mod_comment_replies')
                            .select('*')
                            .in('comment_id', modCommentIds)
                            .order('created_at', { ascending: true });
                        if (!error && data) {
                            data.forEach(r => {
                                if (!modRepliesMap[r.comment_id]) modRepliesMap[r.comment_id] = [];
                                modRepliesMap[r.comment_id].push({
                                    id: r.id, comment_id: r.comment_id, user_id: r.user_id,
                                    content: r.content, display_name: r.display_name || '用户',
                                    avatar_url: r.avatar_url || null, reply_to: r.reply_to,
                                    parent_reply_id: r.parent_reply_id, created_at: r.created_at
                                });
                            });
                        }
                    }
                } catch (_) {}

                for (const c of comments) {
                    const isCommentOwn = currentUser && c.user_id === currentUser.id;
                    const cAvatar = c.avatar_url ?
                        `<img src="${escapeHTML(c.avatar_url)}" class="mod-comment-avatar" referrerpolicy="no-referrer" loading="lazy" />` :
                        `<div class="mod-comment-avatar-placeholder">👤</div>`;
                    const deleteBtn = (isCommentOwn || isAdmin) ?
                        `<button class="mod-comment-delete" data-comment-id="${c.id}">删除</button>` : '';

                    // 从批量数据取回复
                    const flatModReplies = modRepliesMap[c.id] || [];
                    const modReplyTree = buildModReplyTree([...flatModReplies]);
                    let repliesHtml = '';
                    if (modReplyTree.length > 0) {
                        repliesHtml = '<div class="mod-reply-list">' + renderModReplyTree(modReplyTree, c.id, 0, flatModReplies) + '</div>';
                    }

                    // 点赞信息
                    const likeCount = getModCommentLikeCount(c.id);
                    const isLiked = isModCommentLiked(c.id);

                    commentsHtml += `
                        <div class="mod-comment-item" data-comment-id="${c.id}">
                            ${cAvatar}
                            <div class="mod-comment-body">
                                <div class="mod-comment-header">
                                    <span class="mod-comment-name">${escapeHTML(c.display_name || '用户')}</span>
                                    <span class="mod-comment-time">${formatModTime(c.created_at)}</span>
                                    ${deleteBtn}
                                </div>
                                <div class="mod-comment-text">${escapeHTML(c.content)}</div>
                                <div class="mod-comment-actions">
                                    <button class="mod-comment-like-btn${isLiked ? ' liked' : ''}" data-comment-id="${c.id}">
                                        ${isLiked ? '❤️' : '🤍'} <span class="like-count">${likeCount > 0 ? likeCount : ''}</span>
                                    </button>
                                    <button class="mod-comment-reply-btn" data-comment-id="${c.id}">💬 回复</button>
                                </div>
                                ${repliesHtml}
                                <div class="mod-reply-compose" id="modReplyCompose-${c.id}" style="display:none;">
                                    <textarea id="modReplyInput-${c.id}" placeholder="写下你的回复..." maxlength="200"></textarea>
                                    <div class="mod-reply-compose-actions">
                                        <button class="btn btn-sm mod-reply-cancel-btn" data-comment-id="${c.id}">取消</button>
                                        <button class="btn btn-sm btn-accent mod-reply-submit-btn" data-comment-id="${c.id}">发送</button>
                                    </div>
                                </div>
                            </div>
                        </div>`;
                }

                const commentArea = currentUser ? `
                    <div class="mod-comment-compose">
                        <textarea id="modCommentInput" placeholder="写下你的评论..." maxlength="500"></textarea>
                        <button class="btn btn-sm btn-accent" id="modCommentSubmitBtn">发送</button>
                    </div>` : `
                    <div style="text-align:center;color:var(--text3);padding:10px 0;font-size:0.85rem;">
                        🔑 <a style="color:var(--accent);cursor:pointer;text-decoration:underline;" onclick="closeModDetail();openAuthModal();">登录</a> 后即可评论
                    </div>`;

                const editHtml = isOwn ?
                    `<button class="btn btn-sm" id="modDetailEditBtn" style="color:var(--accent);border-color:var(--accent);">✏️ 编辑</button>` : '';
                const deleteHtml = (isOwn || isAdmin) ?
                    `<button class="btn btn-sm" id="modDetailDeleteBtn" style="color:var(--danger);border-color:var(--danger);">🗑 删除</button>` : '';

                container.innerHTML = `
                    <div class="mod-detail-header">
                        <button class="mod-detail-back-btn" id="modDetailBackBtn">
                            <span>←</span> 返回列表
                        </button>
                    </div>
                    <h1 class="mod-detail-title">${escapeHTML(post.title)}</h1>
                    <div class="mod-detail-meta">
                        <span class="mod-detail-meta-item mod-detail-author" data-user-id="${post.user_id}" style="cursor:pointer;">👤 ${escapeHTML(post.display_name || '用户')}</span>
                        <span class="mod-detail-meta-item">📅 ${formatModTime(post.created_at)}</span>
                        <span class="mod-detail-game-tag">🎮 ${escapeHTML(post.game_name)}</span>
                        <span class="mod-tag ${typeClass}">${typeIcon} ${escapeHTML(post.mod_type || '其他')}</span>
                    </div>
                    ${post.content ? `<div class="mod-detail-content">${escapeHTML(post.content)}</div>` : '<div style="border-bottom:1px solid var(--border);margin-bottom:16px;"></div>'}
                    <div class="mod-detail-link-section">
                        <div>
                            <div class="mod-detail-link-label">MOD下载/分享链接</div>
                            <a class="mod-detail-link-url" href="${escapeHTML(post.mod_link)}" target="_blank" rel="noopener noreferrer">${escapeHTML(post.mod_link)}</a>
                        </div>
                        <a class="mod-detail-link-open" href="${escapeHTML(post.mod_link)}" target="_blank" rel="noopener noreferrer">🔗 前往下载</a>
                    </div>
                    <div class="mod-detail-actions">
                        <button class="mod-post-action-btn like-btn${liked ? ' liked' : ''}" data-post-id="${post.id}">
                            ${liked ? '❤️' : '🤍'} <span class="count">${post.likes_count || 0}</span> 赞
                        </button>
                        <button class="mod-post-action-btn thanks-btn${thanked ? ' thanked' : ''}" data-post-id="${post.id}">
                            ${thanked ? '💖' : '🤍'} 感谢 <span class="count">${post.thanks_count || 0}</span>
                        </button>
                        <button class="mod-post-action-btn">
                            💬 <span class="count">${post.comments_count || 0}</span> 评论
                        </button>
                        ${isAdmin ? `
                        <div class="mod-admin-badge-menu">
                            <button class="mod-admin-badge-btn" onclick="event.stopPropagation();this.nextElementSibling.classList.toggle('show');">⚙️ 管理徽章</button>
                            <div class="mod-admin-badge-dropdown">
                                <button class="badge-toggle-item" onclick="event.stopPropagation();toggleForceBadge(${post.id},'force_hot');this.closest('.mod-admin-badge-dropdown').classList.remove('show');">
                                    <span class="badge-toggle-label">🔥 热榜</span>
                                    <span class="badge-toggle-status ${post.force_hot ? 'on' : 'off'}">${post.force_hot ? '强制开启' : '自动判定'}</span>
                                </button>
                                <button class="badge-toggle-item" onclick="event.stopPropagation();toggleForceBadge(${post.id},'force_featured');this.closest('.mod-admin-badge-dropdown').classList.remove('show');">
                                    <span class="badge-toggle-label">✨ 精选</span>
                                    <span class="badge-toggle-status ${post.force_featured ? 'on' : 'off'}">${post.force_featured ? '强制开启' : '自动判定'}</span>
                                </button>
                            </div>
                        </div>` : ''}
                        ${editHtml}
                        ${deleteHtml}
                    </div>
                    ${thanksListHtml}
                    <div class="mod-detail-comments-title">💬 评论区 (${comments.length})</div>
                    ${commentArea}
                    <div id="modDetailCommentsList">${commentsHtml}</div>
                `;

                overlay.classList.add('show');
                document.body.style.overflow = 'hidden';
                overlay.scrollTop = 0;

                container.querySelector('#modDetailBackBtn').addEventListener('click', closeModDetail);

                const likeBtn = container.querySelector('.like-btn');
                if (likeBtn) {
                    likeBtn.addEventListener('click', async function () {
                        if (!currentUser) { showToast('请先登录', 1500); return; }
                        await toggleModLike(post.id);
                        closeModDetail();
                        const updatedPosts = await fetchModPosts();
                        modPosts = updatedPosts;
                        const updated = modPosts.find(p => p.id === post.id);
                        if (updated) openModDetail(updated);
                    });
                }

                const thanksBtn = container.querySelector('.thanks-btn');
                if (thanksBtn) {
                    thanksBtn.addEventListener('click', async function () {
                        if (!currentUser) { showToast('请先登录', 1500); return; }
                        await toggleModThanks(post.id);
                        closeModDetail();
                        const updatedPosts = await fetchModPosts();
                        modPosts = updatedPosts;
                        const updated = modPosts.find(p => p.id === post.id);
                        if (updated) openModDetail(updated);
                    });
                }

                const authorEl = container.querySelector('.mod-detail-author');
                if (authorEl) {
                    authorEl.addEventListener('click', async function () {
                        const userId = this.dataset.userId;
                        if (userId) await showAuthorCard(userId, this);
                    });
                }

                const editBtn = container.querySelector('#modDetailEditBtn');
                if (editBtn) {
                    editBtn.addEventListener('click', function () {
                        openModEdit(post);
                    });
                }

                const deleteBtn = container.querySelector('#modDetailDeleteBtn');
                if (deleteBtn) {
                    deleteBtn.addEventListener('click', async function () {
                        if (!confirm('确定删除这个MOD分享吗？')) return;
                        await deleteModPost(post.id);
                        closeModDetail();
                        await renderModPostList();
                    });
                }

                const commentInput = container.querySelector('#modCommentInput');
                const commentSubmitBtn = container.querySelector('#modCommentSubmitBtn');
                if (commentSubmitBtn && commentInput) {
                    commentSubmitBtn.addEventListener('click', async function () {
                        const text = commentInput.value.trim();
                        if (!text) { showToast('评论内容不能为空', 1500); return; }
                        commentSubmitBtn.disabled = true;
                        commentSubmitBtn.textContent = '发送中...';
                        const result = await addModComment(post.id, text);
                        if (result) {
                            commentInput.value = '';
                            showToast('✅ 评论成功', 1500);
                            closeModDetail();
                            const updated = modPosts.find(p => p.id === post.id);
                            if (updated) openModDetail(updated);
                            await renderModPostList();
                        }
                        commentSubmitBtn.disabled = false;
                        commentSubmitBtn.textContent = '发送';
                    });
                    commentInput.addEventListener('keydown', function (e) {
                        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                            e.preventDefault();
                            commentSubmitBtn.click();
                        }
                    });
                }

                // 评论回复按钮事件（含嵌套回复）
                container.querySelectorAll('.mod-comment-reply-btn').forEach(btn => {
                    btn.addEventListener('click', function () {
                        if (!currentUser) { showToast('请先登录', 1500); return; }
                        const commentId = this.dataset.commentId;
                        const replyId = this.dataset.replyId; // 嵌套回复时有值

                        // 先隐藏同级其他输入框
                        const parent = this.closest('.mod-reply-item') || this.closest('.mod-comment-item');
                        if (parent) {
                            parent.querySelectorAll('.mod-nested-reply-compose, .mod-reply-compose').forEach(c => {
                                c.style.display = 'none';
                            });
                        }

                        if (replyId) {
                            // 嵌套回复
                            const composeEl = document.getElementById('modNestedReplyCompose-' + commentId + '-' + replyId);
                            if (composeEl) {
                                composeEl.style.display = 'block';
                                document.getElementById('modNestedReplyInput-' + commentId + '-' + replyId)?.focus();
                            }
                        } else {
                            // 一级回复
                            const composeEl = document.getElementById('modReplyCompose-' + commentId);
                            if (composeEl) {
                                composeEl.style.display = 'block';
                                document.getElementById('modReplyInput-' + commentId)?.focus();
                            }
                        }
                    });
                });

                // 嵌套回复取消按钮
                container.querySelectorAll('.mod-nested-reply-cancel-btn').forEach(btn => {
                    btn.addEventListener('click', function () {
                        const commentId = this.dataset.commentId;
                        const replyId = this.dataset.replyId;
                        const composeEl = document.getElementById('modNestedReplyCompose-' + commentId + '-' + replyId);
                        if (composeEl) composeEl.style.display = 'none';
                    });
                });

                // 嵌套回复提交按钮
                container.querySelectorAll('.mod-nested-reply-submit-btn').forEach(btn => {
                    btn.addEventListener('click', function () {
                        if (!currentUser) { showToast('请先登录', 1500); return; }
                        const commentId = this.dataset.commentId;
                        const parentReplyId = this.dataset.parentReplyId;
                        const replyToUserId = this.dataset.replyToUserId;
                        const input = document.getElementById('modNestedReplyInput-' + commentId + '-' + parentReplyId);
                        if (!input) return;
                        const text = input.value.trim();
                        if (!text) { showToast('回复内容不能为空', 1500); return; }
                        guardSubmitBtn(this, async () => {
                            await addModCommentReply(String(commentId), text, replyToUserId, parentReplyId);

                            // 发送通知
                            if (supabaseClient) {
                                try {
                                    await createReplyNotification(replyToUserId, 'mod_comment', Number(commentId), post.title, text);
                                } catch (_) {}
                            }

                            showToast('✅ 回复成功', 1500);
                            closeModDetail();
                            const updated = modPosts.find(p => p.id === post.id);
                            if (updated) openModDetail(updated);
                        });
                    });
                });

                // 评论回复取消按钮事件
                container.querySelectorAll('.mod-reply-cancel-btn').forEach(btn => {
                    btn.addEventListener('click', function () {
                        const commentId = this.dataset.commentId;
                        const composeEl = document.getElementById('modReplyCompose-' + commentId);
                        if (composeEl) composeEl.style.display = 'none';
                    });
                });

                // 评论回复提交按钮事件（一级回复）
                container.querySelectorAll('.mod-reply-submit-btn').forEach(btn => {
                    btn.addEventListener('click', function () {
                        if (!currentUser) { showToast('请先登录', 1500); return; }
                        const commentId = this.dataset.commentId;
                        const input = document.getElementById('modReplyInput-' + commentId);
                        if (!input) return;
                        const text = input.value.trim();
                        if (!text) { showToast('回复内容不能为空', 1500); return; }
                        guardSubmitBtn(this, async () => {
                            await addModCommentReply(String(commentId), text);

                            // 发送通知给评论作者
                            if (supabaseClient) {
                                try {
                                    const { data: comment } = await supabaseClient.from('mod_comments')
                                        .select('user_id')
                                        .eq('id', commentId)
                                        .single();
                                    if (comment && comment.user_id) {
                                        await createReplyNotification(comment.user_id, 'mod_comment', commentId, post.title, text);
                                    }
                                } catch (_) {}
                            }

                            showToast('✅ 回复成功', 1500);
                            closeModDetail();
                            const updated = modPosts.find(p => p.id === post.id);
                            if (updated) openModDetail(updated);
                        });
                    });
                });

                // 评论点赞按钮事件
                container.querySelectorAll('.mod-comment-like-btn').forEach(btn => {
                    btn.addEventListener('click', async function () {
                        if (!currentUser) { showToast('请先登录', 1500); return; }
                        const commentId = this.dataset.commentId;
                        const wasLiked = this.classList.contains('liked');
                        const countEl = this.querySelector('.like-count');
                        const oldCount = Number(countEl?.textContent || 0);
                        this.classList.toggle('liked');
                        this.innerHTML = (wasLiked ? '🤍' : '❤️') + ` <span class="like-count">${wasLiked ? (oldCount > 1 ? oldCount - 1 : '') : oldCount + 1}</span>`;
                        toggleModCommentLike(String(commentId));
                        
                        // 发送通知给评论作者（仅点赞时发送）
                        if (!wasLiked && supabaseClient) {
                            try {
                                const { data: comment } = await supabaseClient.from('mod_comments')
                                    .select('user_id')
                                    .eq('id', commentId)
                                    .single();
                                if (comment && comment.user_id) {
                                    await createCommentLikeNotification(comment.user_id, commentId, 'mod_comment');
                                }
                            } catch (_) {}
                        }
                    });
                });

                // 评论删除按钮事件（包括回复删除）
                container.querySelectorAll('.mod-comment-delete').forEach(btn => {
                    btn.addEventListener('click', async function () {
                        const commentId = this.dataset.commentId;
                        const replyId = this.dataset.replyId;
                        if (replyId) {
                            // 删除回复
                            if (!confirm('确定删除这条回复吗？')) return;
                            await deleteModCommentReply(String(commentId), replyId);
                            showToast('✅ 回复已删除', 1500);
                            closeModDetail();
                            const updated = modPosts.find(p => p.id === post.id);
                            if (updated) openModDetail(updated);
                        } else {
                            // 删除母评论
                            if (!confirm('确定删除这条评论吗？')) return;
                            await deleteModComment(Number(commentId));
                            showToast('✅ 评论已删除', 1500);
                            closeModDetail();
                            const updated = modPosts.find(p => p.id === post.id);
                            if (updated) openModDetail(updated);
                        }
                    });
                });
            }

            function closeModDetail() {
                document.getElementById('modDetailOverlay')?.classList.remove('show');
                document.body.style.overflow = '';
            }

            let _modFilterSortBound = false;
            function initModFilterEvents() {
                if (_modFilterSortBound) return;
                _modFilterSortBound = true;
                document.querySelectorAll('.mod-filter-btn').forEach(btn => {
                    btn.addEventListener('click', async function () {
                        const filter = this.dataset.modFilter;
                        if (modFilter === filter) return;
                        modFilter = filter;
                        document.querySelectorAll('.mod-filter-btn').forEach(b =>
                            b.classList.toggle('active', b.dataset.modFilter === filter));
                        modPage = 0;
                        await renderModPostList();
                    });
                });
            }

            function initModSortEvents() {
                document.querySelectorAll('.mod-sort-btn').forEach(btn => {
                    btn.addEventListener('click', async function () {
                        const sort = this.dataset.modSort;
                        if (modSort === sort) return;
                        modSort = sort;
                        document.querySelectorAll('.mod-sort-btn').forEach(b =>
                            b.classList.toggle('active', b.dataset.modSort === sort));
                        modPage = 0;
                        await renderModPostList();
                    });
                });
            }

            function initModLoadMoreEvent() {
                document.getElementById('modLoadMoreBtn')?.addEventListener('click', async function () {
                    modPage++;
                    const morePosts = await fetchModPosts();
                    if (morePosts.length > 0) {
                        modPosts = modPosts.concat(morePosts);
                        renderModPostList();
                    }
                    if (morePosts.length < MOD_PAGE_SIZE) {
                        document.getElementById('modLoadMore').style.display = 'none';
                    }
                });
            }

            // ================================================================
            // ★★★ MOD 与游戏关联功能 ★★★
            // ================================================================

            async function loadDetailRelatedMods(game) {
                const listEl = document.getElementById('detailRelatedModsList');
                if (!listEl) return;
                if (!supabaseClient) {
                    listEl.innerHTML = '<div class="detail-mods-empty">未连接数据库</div>';
                    return;
                }
                try {
                    const { data, error } = await supabaseClient.from('mod_posts')
                        .select('*')
                        .eq('game_name', game.title)
                        .order('created_at', { ascending: false })
                        .limit(5);
                    if (error) throw error;
                    if (!data || data.length === 0) {
                        listEl.innerHTML = '<div class="detail-mods-empty">暂无相关MOD，来做第一个分享的人吧！</div>';
                        return;
                    }
                    listEl.innerHTML = data.map(post => {
                        const typeClass = MOD_TYPE_CLASSES[post.mod_type] || 'other';
                        const typeIcon = MOD_TYPE_ICONS[post.mod_type] || '📦';
                        return `
                            <div class="detail-mod-item" onclick="openModPostFromDetail('${escapeHTML(post.mod_link)}', ${post.id})">
                                <div class="detail-mod-item-icon ${typeClass}">${typeIcon}</div>
                                <div class="detail-mod-item-body">
                                    <div class="detail-mod-item-title">${escapeHTML(post.title)}</div>
                                    <div class="detail-mod-item-meta">
                                        <span>${escapeHTML(post.display_name || '用户')}</span>
                                        <span>❤️ ${post.likes_count || 0}</span>
                                        <span>💬 ${post.comments_count || 0}</span>
                                    </div>
                                </div>
                                <span class="detail-mod-item-link" onclick="event.stopPropagation();">查看</span>
                            </div>`;
                    }).join('');
                } catch (e) {
                    listEl.innerHTML = '<div class="detail-mods-empty">加载失败</div>';
                }
            }

            window.openModPostFromDetail = function (link, postId) {
                window.open(link, '_blank', 'noopener,noreferrer');
            };

            function findGameByName(name) {
                if (!name) return null;
                const q = name.trim().toLowerCase();
                return games.find(g => g.title && g.title.toLowerCase() === q) ||
                    games.find(g => g.title && g.title.toLowerCase().includes(q));
            }

            function setupGameNameAutocomplete() {
                const input = document.getElementById('modGameName');
                if (!input) return;
                let listEl = input.parentNode.querySelector('.mod-autocomplete-list');
                if (!listEl) {
                    listEl = document.createElement('div');
                    listEl.className = 'mod-autocomplete-list';
                    input.parentNode.appendChild(listEl);
                }
                input.addEventListener('input', function () {
                    const q = this.value.trim().toLowerCase();
                    if (q.length < 1) { listEl.classList.remove('show'); return; }
                    const matches = games.filter(g =>
                        !g.isDraft && g.title && g.title.toLowerCase().includes(q)
                    ).slice(0, 6);
                    if (matches.length === 0) { listEl.classList.remove('show'); return; }
                    listEl.innerHTML = matches.map(g => {
                        const coverHtml = g.cover ?
                            `<img src="${escapeHTML(g.cover)}" alt="" />` : '';
                        return `<div class="mod-autocomplete-item" data-title="${escapeHTML(g.title)}">${coverHtml} ${escapeHTML(g.title)}</div>`;
                    }).join('');
                    listEl.classList.add('show');
                    listEl.querySelectorAll('.mod-autocomplete-item').forEach(item => {
                        item.addEventListener('click', function () {
                            input.value = this.dataset.title;
                            listEl.classList.remove('show');
                        });
                    });
                });
                input.addEventListener('blur', function () {
                    setTimeout(() => listEl.classList.remove('show'), 200);
                });
            }

            // 重写 renderModCompose 以加入自动补全
            const _originalRenderModCompose = renderModCompose;
            renderModCompose = function () {
                _originalRenderModCompose();
                setTimeout(setupGameNameAutocomplete, 50);
            };

            // 重写 renderModPostList 使游戏名可点击
            const _originalRenderModPostList = renderModPostList;
            renderModPostList = async function () {
                await _originalRenderModPostList();
                document.querySelectorAll('.mod-post-item-game').forEach(el => {
                    const name = el.textContent.replace(/^🎮\s*/, '').trim();
                    const game = findGameByName(name);
                    if (game) {
                        el.innerHTML = `🎮 <a class="game-name-link" onclick="event.stopPropagation();openGameFromMod(${game.id});" title="查看游戏详情">${escapeHTML(name)}</a>`;
                        el.style.cursor = 'pointer';
                    }
                });
            };

            window.openGameFromMod = function (gameId) {
                const game = games.find(g => g.id === gameId);
                if (!game) { showToast('⚠️ 未找到该游戏', 1500); return; }
                closeModDetail();
                if (currentMainView !== 'games') {
                    currentMainView = 'games';
                    const galleryContainer = document.getElementById('galleryContainer');
                    const modSection = document.getElementById('modSection');
                    const filterSticky = document.getElementById('filterSticky');
                    const toolbar = document.getElementById('toolbar');
                    if (galleryContainer) galleryContainer.style.display = '';
                    if (modSection) modSection.classList.remove('show');
                    if (filterSticky) filterSticky.style.display = '';
                    if (toolbar) toolbar.style.display = '';
                    document.title = 'Her Lens · 女性主角游戏';
                    document.querySelectorAll('.top-nav-item[data-nav]').forEach(item => {
                        item.classList.toggle('active', item.dataset.nav === 'games');
                    });
                    renderGallery();
                    showDetailModal(game, { from: 'mod' });
                } else {
                    showDetailModal(game, { from: 'gallery' });
                }
            };

            // ================================================================
            // 公告栏
            // ================================================================
            const ANNOUNCEMENT_STORAGE_KEY = 'heroineAnnouncementClosed';

            function initAnnouncementBar() {
                const bar = document.getElementById('announcementBar');
                const toggle = document.getElementById('announcementToggle');
                const closeBtn = document.getElementById('announcementClose');
                if (!bar || !toggle || !closeBtn) return;

                const isClosed = localStorage.getItem(ANNOUNCEMENT_STORAGE_KEY) === 'true';
                if (isClosed) {
                    bar.classList.add('hidden');
                    toggle.style.display = 'block';
                }

                closeBtn.addEventListener('click', function () {
                    bar.classList.add('hidden');
                    toggle.style.display = 'block';
                    localStorage.setItem(ANNOUNCEMENT_STORAGE_KEY, 'true');
                });

                toggle.addEventListener('click', function () {
                    bar.classList.remove('hidden');
                    toggle.style.display = 'none';
                    localStorage.setItem(ANNOUNCEMENT_STORAGE_KEY, 'false');
                });
            }

            // ================================================================
            // 打赏弹窗
            // ================================================================
            function openTipModal() {
                document.getElementById('tipModalOverlay').classList.add('show');
                document.body.style.overflow = 'hidden';
            }

            function closeTipModal() {
                document.getElementById('tipModalOverlay').classList.remove('show');
                document.body.style.overflow = '';
            }

            // ================================================================
            // 返回顶部 + 滚动进度
            // ================================================================
            function initBackToTop() {
                const btn = document.getElementById('backToTop');
                if (!btn) return;
                let ticking = false;
                let glowPaused = false;
                let glowResumeTimer = null;
                window.addEventListener('scroll', function () {
                    // 滚动时暂停背景光晕动画，释放 GPU 资源给滚动渲染
                    if (!glowPaused) {
                        glowPaused = true;
                        document.documentElement.style.setProperty('--glow-play-state', 'paused');
                    }
                    if (glowResumeTimer) clearTimeout(glowResumeTimer);
                    glowResumeTimer = setTimeout(() => {
                        glowPaused = false;
                        document.documentElement.style.setProperty('--glow-play-state', 'running');
                    }, 300);

                    if (!ticking) {
                        window.requestAnimationFrame(function () {
                            const scrollY = window.scrollY;
                            if (scrollY > 400) { btn.classList.add('show'); } else { btn.classList.remove('show'); }
                            const docHeight = document.documentElement.scrollHeight - window.innerHeight;
                            const progress = docHeight > 0 ? (scrollY / docHeight) * 100 : 0;
                            const progressEl = document.getElementById('scrollProgress');
                            if (progressEl) { progressEl.style.width = progress + '%'; }
                            ticking = false;
                        });
                        ticking = true;
                    }
                }, { passive: true });

                btn.addEventListener('click', function (e) {
                    e.preventDefault();
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                });
            }

            // ================================================================
            // 认证相关
            // ================================================================

            function handleLogin() {
                const email = document.getElementById('loginEmail').value.trim();
                const password = document.getElementById('loginPassword').value;
                const errorEl = document.getElementById('authErrorMsg');

                if (!email || !password) { errorEl.textContent = '请填写完整信息'; return; }

                errorEl.textContent = '';
                const loginBtn = document.getElementById('loginBtn');
                loginBtn.disabled = true;
                loginBtn.textContent = '登录中...';

                if (!supabaseClient) {
                    errorEl.textContent = 'Supabase 未初始化';
                    loginBtn.disabled = false;
                    loginBtn.textContent = '登录';
                    return;
                }

                supabaseClient.auth.signInWithPassword({
                    email,
                    password
                }).then(({ data, error }) => {
                    loginBtn.disabled = false;
                    loginBtn.textContent = '登录';
                    if (error) {
                        errorEl.textContent = error.message;
                    } else {
                        closeAuthModal();
                        showToast('👋 登录成功！', 2000);
                    }
                }).catch(err => {
                    loginBtn.disabled = false;
                    loginBtn.textContent = '登录';
                    errorEl.textContent = err.message || '登录失败，请重试';
                });
            }

            function handleRegister() {
                const email = document.getElementById('registerEmail').value.trim();
                const password = document.getElementById('registerPassword').value;
                const errorEl = document.getElementById('authErrorMsg');

                if (!email || !password) { errorEl.textContent = '请填写完整信息'; return; }
                if (password.length < 6) { errorEl.textContent = '密码至少6位'; return; }

                errorEl.textContent = '';
                const registerBtn = document.getElementById('registerBtn');
                registerBtn.disabled = true;
                registerBtn.textContent = '注册中...';

                if (!supabaseClient) {
                    errorEl.textContent = 'Supabase 未初始化';
                    registerBtn.disabled = false;
                    registerBtn.textContent = '注册';
                    return;
                }

                supabaseClient.auth.signUp({
                    email,
                    password,
                    options: {
                        emailRedirectTo: window.location.origin
                    }
                }).then(({ data, error }) => {
                    registerBtn.disabled = false;
                    registerBtn.textContent = '注册';
                    if (error) {
                        errorEl.textContent = error.message;
                    } else {
                        document.getElementById('registerForm').style.display = 'none';
                        document.getElementById('loginForm').style.display = 'none';
                        document.getElementById('emailConfirmMessage').style.display = 'block';
                        showToast('📨 验证邮件已发送，请查收邮箱', 3000);
                    }
                }).catch(err => {
                    registerBtn.disabled = false;
                    registerBtn.textContent = '注册';
                    errorEl.textContent = err.message || '注册失败，请重试';
                });
            }

            function handleLogout() {
                if (!supabaseClient) return;
                _dbAdminConfirmed = null;
                isAdmin = false;
                supabaseClient.auth.signOut().then(() => {
                    showToast('已登出', 1500);
                }).catch(() => {
                    showToast('登出失败', 1500);
                });
            }

            // ================================================================
            // 忘记密码（发送重置邮件）
            // ================================================================
            function openForgotForm() {
                if (!supabaseClient) { showToast('Supabase 未初始化', 1500); return; }
                const forgotForm = document.getElementById('forgotPasswordForm');
                const wrap = document.getElementById('forgotFormWrap');
                const sentMsg = document.getElementById('forgotSentMsg');
                if (wrap) wrap.style.display = 'block';
                if (sentMsg) sentMsg.style.display = 'none';
                if (document.getElementById('forgotEmail')) document.getElementById('forgotEmail').value = '';
                document.getElementById('loginForm').style.display = 'none';
                document.getElementById('registerForm').style.display = 'none';
                document.getElementById('emailConfirmMessage').style.display = 'none';
                document.getElementById('authErrorMsg').textContent = '';
                forgotForm.style.display = 'block';
            }

            function backToLoginFromForgot() {
                document.getElementById('forgotPasswordForm').style.display = 'none';
                switchAuthTab('login');
            }

            function handleForgotPassword() {
                const email = document.getElementById('forgotEmail').value.trim();
                const errorEl = document.getElementById('authErrorMsg');
                if (!email) { errorEl.textContent = '请输入邮箱地址'; return; }
                if (!supabaseClient) { errorEl.textContent = 'Supabase 未初始化'; return; }

                errorEl.textContent = '';
                const btn = document.getElementById('forgotSendBtn');
                btn.disabled = true;
                btn.textContent = '发送中...';

                supabaseClient.auth.resetPasswordForEmail(email, {
                    redirectTo: window.location.origin + window.location.pathname
                }).then(({ error }) => {
                    btn.disabled = false;
                    btn.textContent = '发送重置链接';
                    if (error) {
                        errorEl.textContent = error.message;
                    } else {
                        const wrap = document.getElementById('forgotFormWrap');
                        const sentMsg = document.getElementById('forgotSentMsg');
                        if (wrap) wrap.style.display = 'none';
                        if (sentMsg) sentMsg.style.display = 'block';
                        showToast('📨 重置链接已发送，请查收邮箱', 3000);
                    }
                }).catch(err => {
                    btn.disabled = false;
                    btn.textContent = '发送重置链接';
                    errorEl.textContent = err.message || '发送失败，请重试';
                });
            }

            // ================================================================
            // 重置密码（邮件链接落地页）
            // ================================================================
            function openResetPwModal() {
                document.getElementById('resetPwMsg').textContent = '';
                document.getElementById('resetPwInput').value = '';
                document.getElementById('resetPwConfirm').value = '';
                document.getElementById('resetPwModalOverlay').classList.add('show');
                document.body.style.overflow = 'hidden';
                setTimeout(() => document.getElementById('resetPwInput')?.focus(), 50);
            }

            function closeResetPwModal() {
                document.getElementById('resetPwModalOverlay').classList.remove('show');
                document.body.style.overflow = '';
            }

            function handleResetPassword() {
                const pw = document.getElementById('resetPwInput').value;
                const confirmPw = document.getElementById('resetPwConfirm').value;
                const msg = document.getElementById('resetPwMsg');
                if (!pw) { msg.textContent = '请输入新密码'; return; }
                if (pw.length < 6) { msg.textContent = '密码至少6位'; return; }
                if (pw !== confirmPw) { msg.textContent = '两次输入的密码不一致'; return; }
                if (!supabaseClient) { msg.textContent = 'Supabase 未初始化'; return; }

                msg.textContent = '';
                const btn = document.getElementById('resetPwBtn');
                btn.disabled = true;
                btn.textContent = '保存中...';

                supabaseClient.auth.updateUser({ password: pw }).then(({ error }) => {
                    btn.disabled = false;
                    btn.textContent = '保存新密码';
                    if (error) {
                        msg.textContent = error.message;
                    } else {
                        closeResetPwModal();
                        showToast('✅ 密码已更新', 2500);
                        // 清除 URL 中的恢复令牌，避免刷新页面时重复触发
                        if (window.history && window.history.replaceState) {
                            window.history.replaceState({}, document.title, window.location.pathname);
                        }
                    }
                }).catch(err => {
                    btn.disabled = false;
                    btn.textContent = '保存新密码';
                    msg.textContent = err.message || '保存失败，请重试';
                });
            }

            // ================================================================
            // 更改邮箱
            // ================================================================
            async function changeEmail() {
                if (!currentUser) { showToast('请先登录', 1500); return; }
                if (!supabaseClient) { showToast('Supabase 未初始化', 1500); return; }
                const input = document.getElementById('profileNewEmail');
                const msg = document.getElementById('profileEmailMsg');
                const newEmail = input.value.trim();
                if (!newEmail) {
                    msg.textContent = '请输入新邮箱地址';
                    msg.style.color = 'var(--danger)';
                    return;
                }
                if (newEmail === currentUser.email) {
                    msg.textContent = '新邮箱与当前邮箱相同';
                    msg.style.color = 'var(--danger)';
                    return;
                }

                const btn = document.getElementById('profileChangeEmailBtn');
                btn.disabled = true;
                btn.textContent = '发送中...';
                msg.textContent = '';

                try {
                    const { error } = await supabaseClient.auth.updateUser(
                        { email: newEmail },
                        { emailRedirectTo: window.location.origin }
                    );
                    if (error) {
                        msg.textContent = error.message;
                        msg.style.color = 'var(--danger)';
                    } else {
                        msg.textContent = '📨 验证邮件已发送到新邮箱，请点击邮件中的链接完成更换（原邮箱也会收到通知）';
                        msg.style.color = 'var(--success, #4caf50)';
                    }
                } catch (e) {
                    msg.textContent = e.message || '发送失败，请重试';
                    msg.style.color = 'var(--danger)';
                }
                btn.disabled = false;
                btn.textContent = '📧 更换邮箱';
            }

            function openAuthModal() {
                const overlay = document.getElementById('authModalOverlay');
                overlay.classList.add('show');
                document.body.style.overflow = 'hidden';
                switchAuthTab('login');
                document.getElementById('authErrorMsg').textContent = '';
                document.getElementById('emailConfirmMessage').style.display = 'none';
                const forgotForm = document.getElementById('forgotPasswordForm');
                if (forgotForm) {
                    forgotForm.style.display = 'none';
                    const wrap = document.getElementById('forgotFormWrap');
                    const sentMsg = document.getElementById('forgotSentMsg');
                    if (wrap) wrap.style.display = 'block';
                    if (sentMsg) sentMsg.style.display = 'none';
                }
                document.getElementById('loginForm').style.display = 'block';
                document.getElementById('registerForm').style.display = 'none';
            }

            function closeAuthModal() {
                document.getElementById('authModalOverlay').classList.remove('show');
                document.body.style.overflow = '';
            }

            function switchAuthTab(tab) {
                const loginTab = document.getElementById('authTabLogin');
                const registerTab = document.getElementById('authTabRegister');
                const loginForm = document.getElementById('loginForm');
                const registerForm = document.getElementById('registerForm');
                const confirmMsg = document.getElementById('emailConfirmMessage');
                const forgotForm = document.getElementById('forgotPasswordForm');
                const errorEl = document.getElementById('authErrorMsg');
                errorEl.textContent = '';
                if (forgotForm) forgotForm.style.display = 'none';

                if (tab === 'login') {
                    loginTab.classList.add('active');
                    registerTab.classList.remove('active');
                    loginForm.style.display = 'block';
                    registerForm.style.display = 'none';
                    confirmMsg.style.display = 'none';
                } else {
                    registerTab.classList.add('active');
                    loginTab.classList.remove('active');
                    registerForm.style.display = 'block';
                    loginForm.style.display = 'none';
                    confirmMsg.style.display = 'none';
                }
            }

            // ================================================================
            // 个人资料
            // ================================================================

            function openProfileModal() {
                if (!currentUser) {
                    showToast('请先登录', 1500);
                    return;
                }
                const overlay = document.getElementById('profileModalOverlay');
                const nameInput = document.getElementById('profileDisplayName');
                const avatarImg = document.getElementById('profileAvatarPreview');
                const customIdInput = document.getElementById('profileCustomId');
                const customIdMsg = document.getElementById('profileCustomIdMsg');
                const displayNameMsg = document.getElementById('profileDisplayNameMsg');

                const metadata = currentUser.user_metadata || {};
                nameInput.value = metadata.display_name || '';
                customIdInput.value = metadata.custom_id || '';

                // 邮箱字段
                const emailCurrent = document.getElementById('profileEmailCurrent');
                if (emailCurrent) emailCurrent.textContent = currentUser.email ? `（当前：${currentUser.email}）` : '';
                const emailInput = document.getElementById('profileNewEmail');
                if (emailInput) emailInput.value = '';
                const emailMsg = document.getElementById('profileEmailMsg');
                if (emailMsg) emailMsg.textContent = '';

                // 初始化显示名称状态
                displayNameMsg.textContent = '';
                displayNameMsg.style.color = 'var(--text3)';
                if (metadata.display_name) {
                    displayNameMsg.textContent = '✓ 当前显示名称';
                    displayNameMsg.style.color = 'var(--success, #4caf50)';
                }

                // 初始化专属ID状态
                customIdMsg.textContent = '';
                customIdMsg.style.color = 'var(--text3)';
                if (metadata.custom_id) {
                    customIdMsg.textContent = '✓ 当前专属ID';
                    customIdMsg.style.color = 'var(--success, #4caf50)';
                }
                if (metadata.avatar_url) {
                    avatarImg.src = metadata.avatar_url;
                } else {
                    avatarImg.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"%3E%3Ccircle cx="50" cy="50" r="50" fill="%23ddd"/%3E%3Ctext x="50" y="58" font-size="40" text-anchor="middle" fill="%23999"%3E👤%3C/text%3E%3C/svg%3E';
                }
                document.getElementById('avatarInput').value = '';
                currentAvatarFile = null;
                if (avatarPreviewUrl) {
                    URL.revokeObjectURL(avatarPreviewUrl);
                    avatarPreviewUrl = null;
                }
                document.getElementById('profileErrorMsg').textContent = '';

                overlay.classList.add('show');
                document.body.style.overflow = 'hidden';
            }

            function closeProfileModal() {
                document.getElementById('profileModalOverlay').classList.remove('show');
                document.body.style.overflow = '';
                if (avatarPreviewUrl) {
                    URL.revokeObjectURL(avatarPreviewUrl);
                    avatarPreviewUrl = null;
                }
                currentAvatarFile = null;
            }

            // ================================================================
            // ★ 屏蔽内容管理
            // ================================================================
            function openBlockModal() {
                if (!currentUser) {
                    showToast('请先登录', 1500);
                    return;
                }
                const overlay = document.getElementById('blockModalOverlay');
                overlay.classList.add('show');
                document.body.style.overflow = '';

                // 回填恶俗开关
                const toggle = document.getElementById('blockAdultToggle');
                toggle.classList.toggle('on', showAdultContent);

                // 重置搜索
                blockSearchQuery = '';
                document.getElementById('blockTagSearch').value = '';
                blockOpenDims = new Set(['genre']);

                renderBlockSettings();
            }

            function closeBlockModal() {
                document.getElementById('blockModalOverlay').classList.remove('show');
            }

            // 主界面屏蔽提示条显示控制（恶俗屏蔽 + 用户排除标签 chips）
            function updateAdultContentBanner() {
                const banner = document.getElementById('adultContentBanner');
                if (!banner) return;

                // 1. 恶俗内容 chip（独立逻辑：showAdultContent 控制显隐）
                const adultChip = document.getElementById('adultContentChip');
                const adultTooltip = document.getElementById('adultContentTooltip');
                if (adultChip) adultChip.style.display = !showAdultContent ? '' : 'none';
                if (adultTooltip) adultTooltip.style.display = !showAdultContent ? '' : 'none';

                // 2. 用户排除的其他标签（排除 costumeType.含恶俗设计 避免与上面重复）
                const wrap = document.getElementById('excludedTagsChipsWrap');
                let html = '';
                let chipCount = 0;
                const catLabelMap = { genre: '题材', gameplay: '玩法', platforms: '平台', heroineType: '主角', costumeType: '服设', perspective: '视角' };
                const MAX_VISIBLE_CHIPS = 3;
                let restList = [];

                for (const [cat, tags] of Object.entries(excludedTags)) {
                    for (const tag of tags) {
                        // 恶俗设计已由上方 chip 承担，不在此处重复
                        if (cat === 'costumeType' && tag === '含恶俗设计') continue;
                        if (chipCount < MAX_VISIBLE_CHIPS) {
                            html += `<span class="excluded-tag-chip" data-cat="${cat}" data-val="${escapeHTML(tag)}" title="点击取消排除 · ${catLabelMap[cat]}标签">
                                🚫 ${escapeHTML(tag)}
                                <span class="x-remove">✕</span>
                            </span>`;
                        } else {
                            restList.push(`[${catLabelMap[cat]}] ${escapeHTML(tag)}`);
                        }
                        chipCount++;
                    }
                }

                if (chipCount > MAX_VISIBLE_CHIPS) {
                    html += `<span class="excluded-tag-more" id="excludedTagMore" title="点击查看全部 / 管理">+${chipCount - MAX_VISIBLE_CHIPS}</span>`;
                }

                if (wrap) wrap.innerHTML = html;

                // 点击 chip → 直接取消该排除
                if (wrap) {
                    wrap.querySelectorAll('.excluded-tag-chip').forEach(c => {
                        c.addEventListener('click', function () {
                            const cat = this.dataset.cat;
                            const val = this.dataset.val;
                            const list = excludedTags[cat];
                            const idx = list.indexOf(val);
                            if (idx >= 0) {
                                list.splice(idx, 1);
                                saveSettings();
                                renderGallery();
                                updateAdultContentBanner();
                                showToast(`已取消排除「${val}」`, 1200);
                            }
                        });
                    });
                    const moreBtn = document.getElementById('excludedTagMore');
                    if (moreBtn) {
                        moreBtn.addEventListener('click', function () {
                            if (!currentUser) { showToast('请先登录', 1500); openAuthModal(); return; }
                            openBlockModal();
                        });
                        moreBtn.title = `共排除 ${chipCount} 个标签：\n` + restList.join('\n') + `\n\n点击打开屏蔽内容管理`;
                    }
                }

                // 3. 整体 banner 是否展示
                const hasAny = !showAdultContent || chipCount > 0;
                if (hasAny) banner.classList.add('show');
                else banner.classList.remove('show');
            }

            function renderBlockSettings() {
                // 统计
                const count = Object.values(excludedTags).reduce((s, arr) => s + arr.length, 0);
                document.getElementById('blockExcludeCount').textContent = count > 0 ? `（已排除 ${count} 个）` : '';
                const clearBtn = document.getElementById('blockClearAll');
                clearBtn.disabled = count === 0;
                clearBtn.style.opacity = count === 0 ? '0.4' : '1';
                clearBtn.style.cursor = count === 0 ? 'not-allowed' : 'pointer';

                // 维度配置（复用已有常量）
                const dims = {
                    genre: { label: '题材', icon: '📖', options: getAllGenres().sort((a, b) => a.localeCompare(b, 'zh')) },
                    gameplay: { label: '玩法', icon: '🎮', options: getAllGameplays().sort((a, b) => a.localeCompare(b, 'zh')) },
                    platforms: { label: '平台', icon: '💻', options: [...PLATFORM_OPTIONS].sort((a, b) => a.localeCompare(b, 'zh')) },
                    heroineType: { label: '主角分类', icon: '👩', options: [...HEROINE_TYPE_OPTIONS] },
                    costumeType: { label: '服设分类', icon: '👗', options: [...COSTUME_TYPE_OPTIONS] },
                    perspective: { label: '视角', icon: '👁️', options: [...PERSPECTIVE_OPTIONS] }
                };

                const container = document.getElementById('blockDimContainer');
                let html = '';

                for (const [cat, info] of Object.entries(dims)) {
                    const excludedInCat = excludedTags[cat].length;
                    const isOpen = blockOpenDims.has(cat);
                    const filteredOpts = blockSearchQuery
                        ? info.options.filter(o => o.toLowerCase().includes(blockSearchQuery.toLowerCase()))
                        : info.options;
                    if (blockSearchQuery && filteredOpts.length === 0) continue;

                    html += `<div class="block-dim-group ${isOpen ? 'open' : ''}" data-cat="${cat}">
                        <div class="block-dim-header">
                            <div class="block-dim-name">
                                <span>${info.icon}</span>
                                <span>${info.label}</span>
                                ${excludedInCat > 0 ? `<span class="block-dim-badge">${excludedInCat}</span>` : ''}
                            </div>
                            <span class="block-dim-arrow">▼</span>
                        </div>
                        <div class="block-dim-body">
                            ${filteredOpts.map(opt => {
                                const excluded = excludedTags[cat].includes(opt);
                                return `<span class="block-tag-toggle ${excluded ? 'excluded' : ''}" data-cat="${cat}" data-val="${escapeHTML(opt)}">
                                    <span class="check-dot"></span>
                                    ${escapeHTML(opt)}
                                </span>`;
                            }).join('')}
                        </div>
                    </div>`;
                }

                if (blockSearchQuery && html === '') {
                    html = '<p style="text-align:center; color:var(--text3); font-size:0.82rem; padding:16px 0;">未找到匹配的标签</p>';
                }
                container.innerHTML = html;

                // 绑定折叠
                container.querySelectorAll('.block-dim-header').forEach(h => {
                    h.addEventListener('click', function () {
                        const cat = this.closest('.block-dim-group').dataset.cat;
                        if (blockOpenDims.has(cat)) blockOpenDims.delete(cat);
                        else blockOpenDims.add(cat);
                        renderBlockSettings();
                    });
                });
                // 绑定标签切换
                container.querySelectorAll('.block-tag-toggle').forEach(t => {
                    t.addEventListener('click', function () {
                        const cat = this.dataset.cat;
                        const val = this.dataset.val;
                        const list = excludedTags[cat];
                        const idx = list.indexOf(val);
                        if (idx >= 0) {
                            list.splice(idx, 1);
                            showToast(`已取消排除「${val}」`, 1200);
                        } else {
                            list.push(val);
                            showToast(`已排除「${val}」`, 1200);
                        }
                        saveSettings();
                        renderBlockSettings();
                        renderGallery();
                        updateAdultContentBanner();
                    });
                });
            }

            // 检查显示名称是否可用（防重名）
            async function checkDisplayNameAvailable(displayName) {
                const msgEl = document.getElementById('profileDisplayNameMsg');
                const checkBtn = document.getElementById('profileCheckNameBtn');

                if (!displayName || displayName.trim().length < 2) {
                    msgEl.textContent = '❌ 至少2个字符';
                    msgEl.style.color = 'var(--danger, #e53935)';
                    return false;
                }
                const trimmedName = displayName.trim();

                // 未修改则跳过检查
                if (trimmedName === (currentUser.user_metadata?.display_name || '')) {
                    msgEl.textContent = '✓ 当前显示名称';
                    msgEl.style.color = 'var(--success, #4caf50)';
                    return true;
                }

                if (!supabaseClient) {
                    msgEl.textContent = '❌ 系统未连接';
                    msgEl.style.color = 'var(--danger, #e53935)';
                    return false;
                }

                checkBtn.disabled = true;
                checkBtn.textContent = '检查中...';
                try {
                    const { data, error } = await supabaseClient.rpc('check_display_name_available', {
                        name_to_check: trimmedName
                    });
                    if (error) throw error;
                    if (data === true) {
                        msgEl.textContent = '✓ 该名称可用';
                        msgEl.style.color = 'var(--success, #4caf50)';
                        return true;
                    } else {
                        msgEl.textContent = '❌ 该名称已被占用';
                        msgEl.style.color = 'var(--danger, #e53935)';
                        return false;
                    }
                } catch (e) {
                    // RPC 未部署时，回退到查询 user_profiles 表
                    try {
                        const { data: existing, error: qErr } = await supabaseClient
                            .from('user_profiles')
                            .select('display_name')
                            .eq('display_name', trimmedName)
                            .neq('user_id', currentUser.id)
                            .maybeSingle();
                        if (qErr) throw qErr;
                        if (existing) {
                            msgEl.textContent = '❌ 该名称已被占用';
                            msgEl.style.color = 'var(--danger, #e53935)';
                            return false;
                        }
                        msgEl.textContent = '✓ 该名称可用';
                        msgEl.style.color = 'var(--success, #4caf50)';
                        return true;
                    } catch (e2) {
                        msgEl.textContent = '⚠️ 无法验证，稍后重试';
                        msgEl.style.color = 'var(--text3)';
                        return false;
                    }
                } finally {
                    checkBtn.disabled = false;
                    checkBtn.textContent = '检查可用';
                }
            }

            // 检查专属ID是否可用
            async function checkCustomIdAvailable(customId) {
                const msgEl = document.getElementById('profileCustomIdMsg');
                const checkBtn = document.getElementById('profileCheckIdBtn');

                if (!customId || customId.length < 3) {
                    msgEl.textContent = '❌ 至少3个字符';
                    msgEl.style.color = 'var(--danger, #e53935)';
                    return false;
                }
                if (!/^[a-z0-9_]+$/.test(customId)) {
                    msgEl.textContent = '❌ 仅限小写字母、数字、下划线';
                    msgEl.style.color = 'var(--danger, #e53935)';
                    return false;
                }

                // 未修改则跳过检查
                if (customId === (currentUser.user_metadata?.custom_id || '')) {
                    msgEl.textContent = '✓ 当前专属ID';
                    msgEl.style.color = 'var(--success, #4caf50)';
                    return true;
                }

                if (!supabaseClient) {
                    msgEl.textContent = '❌ 系统未连接';
                    msgEl.style.color = 'var(--danger, #e53935)';
                    return false;
                }

                checkBtn.disabled = true;
                checkBtn.textContent = '检查中...';
                try {
                    const { data, error } = await supabaseClient.rpc('check_custom_id_available', {
                        id_to_check: customId
                    });
                    if (error) throw error;
                    if (data === true) {
                        msgEl.textContent = '✓ 该ID可用';
                        msgEl.style.color = 'var(--success, #4caf50)';
                        return true;
                    } else {
                        msgEl.textContent = '❌ 该ID已被占用';
                        msgEl.style.color = 'var(--danger, #e53935)';
                        return false;
                    }
                } catch (e) {
                    // RPC 未部署时，回退到查询 user_profiles 表
                    try {
                        const { data: existing, error: qErr } = await supabaseClient
                            .from('user_profiles')
                            .select('custom_id')
                            .eq('custom_id', customId)
                            .maybeSingle();
                        if (qErr) throw qErr;
                        if (existing) {
                            msgEl.textContent = '❌ 该ID已被占用';
                            msgEl.style.color = 'var(--danger, #e53935)';
                            return false;
                        }
                        msgEl.textContent = '✓ 该ID可用';
                        msgEl.style.color = 'var(--success, #4caf50)';
                        return true;
                    } catch (e2) {
                        msgEl.textContent = '⚠️ 无法验证，稍后重试';
                        msgEl.style.color = 'var(--text3)';
                        return false;
                    }
                } finally {
                    checkBtn.disabled = false;
                    checkBtn.textContent = '检查可用';
                }
            }

            function handleAvatarFileSelect(file) {
                const errorEl = document.getElementById('profileErrorMsg');
                if (file.size > 2 * 1024 * 1024) {
                    errorEl.textContent = '❌ 图片大小超过 2MB，请压缩后重新上传';
                    document.getElementById('avatarInput').value = '';
                    return;
                }
                const validTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
                if (!validTypes.includes(file.type)) {
                    errorEl.textContent = '❌ 不支持的图片格式，请上传 JPG / PNG / WebP / GIF';
                    document.getElementById('avatarInput').value = '';
                    return;
                }
                errorEl.textContent = '';
                currentAvatarFile = file;

                if (avatarPreviewUrl) URL.revokeObjectURL(avatarPreviewUrl);
                avatarPreviewUrl = URL.createObjectURL(file);
                document.getElementById('profileAvatarPreview').src = avatarPreviewUrl;
            }

            async function saveProfile() {
                const errorEl = document.getElementById('profileErrorMsg');
                const saveBtn = document.getElementById('profileSaveBtn');
                const displayName = document.getElementById('profileDisplayName').value.trim();
                const customIdInput = document.getElementById('profileCustomId');
                const customId = customIdInput.value.trim().toLowerCase();
                const customIdMsg = document.getElementById('profileCustomIdMsg');

                if (!displayName) {
                    errorEl.textContent = '❌ 请输入显示名称';
                    return;
                }
                if (!supabaseClient) {
                    errorEl.textContent = '❌ 系统未连接';
                    return;
                }

                // 校验显示名称唯一性
                if (displayName !== (currentUser.user_metadata?.display_name || '')) {
                    const nameAvailable = await checkDisplayNameAvailable(displayName);
                    if (!nameAvailable) {
                        errorEl.textContent = '❌ 该显示名称已被占用，请更换';
                        return;
                    }
                }

                // 校验专属ID格式
                if (customId) {
                    if (customId.length < 3 || customId.length > 16) {
                        errorEl.textContent = '❌ 专属ID需3-16个字符';
                        return;
                    }
                    if (!/^[a-z0-9_]+$/.test(customId)) {
                        errorEl.textContent = '❌ 专属ID仅限小写字母、数字、下划线';
                        return;
                    }
                    // 如果修改了ID，需先检查可用性
                    if (customId !== (currentUser.user_metadata?.custom_id || '')) {
                        const available = await checkCustomIdAvailable(customId);
                        if (!available) {
                            errorEl.textContent = '❌ 专属ID已被占用，请更换';
                            return;
                        }
                    }
                }

                saveBtn.disabled = true;
                saveBtn.textContent = '保存中...';
                errorEl.textContent = '';

                try {
                    let avatarUrl = currentUser.user_metadata?.avatar_url || null;

                    if (currentAvatarFile) {
                        const fileExt = currentAvatarFile.name.split('.').pop();
                        const fileName = `${currentUser.id}/${Date.now()}.${fileExt}`;

                        const { data: uploadData, error: uploadError } = await supabaseClient.storage
                            .from('avatars')
                            .upload(fileName, currentAvatarFile, {
                                cacheControl: '3600',
                                upsert: true,
                            });

                        if (uploadError) {
                            errorEl.textContent = '❌ 头像上传失败：' + uploadError.message;
                            saveBtn.disabled = false;
                            saveBtn.textContent = '💾 保存资料';
                            return;
                        }

                        const { data: urlData } = supabaseClient.storage
                            .from('avatars')
                            .getPublicUrl(fileName);
                        avatarUrl = urlData.publicUrl;
                    }

                    // 保存资料到 user_profiles 表（同步 display_name 和 custom_id）
                    const profileData = {
                        user_id: currentUser.id,
                        display_name: displayName,
                        avatar_url: avatarUrl,
                        updated_at: new Date().toISOString()
                    };

                    if (customId && customId !== (currentUser.user_metadata?.custom_id || '')) {
                        // 设置新专属ID
                        profileData.custom_id = customId;
                    } else if (!customId && currentUser.user_metadata?.custom_id) {
                        // 清除专属ID
                        profileData.custom_id = null;
                    }

                    const { error: profileError } = await supabaseClient
                        .from('user_profiles')
                        .upsert(profileData, { onConflict: 'user_id' });

                    if (profileError) {
                        if (profileError.code === '23505') {
                            if (profileError.message && /custom_id/i.test(profileError.message)) {
                                errorEl.textContent = '❌ 该专属ID已被占用，请更换';
                            } else {
                                errorEl.textContent = '❌ 该显示名称已被占用，请更换';
                            }
                        } else {
                            errorEl.textContent = '❌ 资料保存失败：' + profileError.message;
                        }
                        saveBtn.disabled = false;
                        saveBtn.textContent = '💾 保存资料';
                        return;
                    }

                    const { data, error } = await supabaseClient.auth.updateUser({
                        data: {
                            display_name: displayName,
                            avatar_url: avatarUrl,
                            custom_id: customId || null,
                        }
                    });

                    if (error) {
                        errorEl.textContent = '❌ 更新资料失败：' + error.message;
                        saveBtn.disabled = false;
                        saveBtn.textContent = '💾 保存资料';
                        return;
                    }

                    if (data && data.user) {
                        currentUser = data.user;
                        updateUIForLoggedIn(currentUser);
                        updateAdminUI();
                    }

                    showToast('✅ 个人资料已更新！', 2000);
                    closeProfileModal();

                } catch (err) {
                    errorEl.textContent = '❌ 操作异常：' + (err.message || '未知错误');
                } finally {
                    saveBtn.disabled = false;
                    saveBtn.textContent = '💾 保存资料';
                }
            }

            // ================================================================
            // UI 更新函数
            // ================================================================

            function updateUIForLoggedIn(user) {
                const container = document.getElementById('authStatusContainer');
                const navUserText = document.getElementById('navUserText');
                const navUserDropdownInner = document.getElementById('navUserDropdownInner');
                const navUserBtn = document.getElementById('navUserBtn');

                // 从云端 user_metadata 合并头衔和成就（取云端 ∪ 本地并集）
                try {
                    const changed = mergeTitlesAndAchievementsFromMetadata();
                    if (changed) {
                        saveUserData();
                        // 合并后如果本地比云端多（之前本地有新增但没同步），再推送一次
                        syncTitlesAndAchievementsToMetadata({ silent: true, debounceMs: 1000 });
                    }
                } catch (e) { console.warn('合并头衔/成就元数据失败:', e); }

                const metadata = user.user_metadata || {};
                const displayName = metadata.display_name || user.email || '用户';
                const customId = metadata.custom_id || '';
                const avatarUrl = metadata.avatar_url || null;

                let avatarHTML = '';
                if (avatarUrl) {
                    avatarHTML =
                        `<img src="${escapeHTML(avatarUrl)}" alt="头像" class="user-avatar" referrerpolicy="no-referrer" style="width:28px;height:28px;border-radius:50%;object-fit:cover;" />`;
                } else {
                    avatarHTML = `<span class="nav-user-icon">👤</span>`;
                }

                // 更新导航栏用户按钮
                if (navUserText && navUserBtn) {
                    navUserBtn.onclick = null;
                    const iconSpan = navUserBtn.querySelector('.nav-user-icon');
                    if (iconSpan && avatarUrl) {
                        iconSpan.outerHTML = `<span class="nav-user-icon">${avatarHTML}</span>`;
                    }
                    navUserText.textContent = displayName.length > 6 ? displayName.slice(0, 6) + '…' : displayName;
                }

                // 更新导航栏下拉菜单
                if (navUserDropdownInner) {
                    const customIdHTML = customId
                        ? `<span class="nav-user-dropdown-customid" style="margin-left:0;">@${escapeHTML(customId)}</span>`
                        : '';
                    const titleBadgeHtml = (() => {
                        try {
                            const equipped = TITLES.find(t => t.id === (userData.equippedTitle || null));
                            if (equipped) return renderTitleBadge(equipped, { small: true });
                        } catch (e) {}
                        return '';
                    })();
                    navUserDropdownInner.innerHTML = `
                        <div class="nav-user-dropdown-header">
                            <div class="nav-user-menu-header-row">
                                ${titleBadgeHtml}
                                <div class="nav-user-dropdown-username">${escapeHTML(displayName)}</div>
                                ${customIdHTML}
                            </div>
                            <div class="nav-user-dropdown-email">${escapeHTML(user.email || '')}</div>
                        </div>
                        <div class="nav-user-dropdown-item" id="navProfileEditBtn">
                            <span class="item-icon">✏️</span> 编辑资料
                        </div>
                        <div class="nav-user-dropdown-item" id="navDiaryBtn">
                            <span class="item-icon">📖</span> 游戏日记
                        </div>
                        <div class="nav-user-dropdown-item" id="navAchievementBtn">
                            <span class="item-icon">🏆</span> 成就 / 头衔
                        </div>
                        <div class="nav-user-dropdown-item" id="navBlockManageBtn">
                            <span class="item-icon">🚫</span> 屏蔽内容管理
                        </div>
                        <div class="nav-user-dropdown-divider"></div>
                        <div class="nav-user-dropdown-item danger" id="navLogoutBtn">
                            <span class="item-icon">🚪</span> 登出
                        </div>
                    `;

                    document.getElementById('navProfileEditBtn').addEventListener('click', function (e) {
                        e.stopPropagation();
                        document.getElementById('navUserDropdown').classList.remove('show');
                        openProfileModal();
                    });

                    document.getElementById('navDiaryBtn').addEventListener('click', function (e) {
                        e.stopPropagation();
                        document.getElementById('navUserDropdown').classList.remove('show');
                        openDiaryModal();
                    });

                    document.getElementById('navAchievementBtn').addEventListener('click', function (e) {
                        e.stopPropagation();
                        document.getElementById('navUserDropdown').classList.remove('show');
                        openAchievementModal();
                    });

                    document.getElementById('navBlockManageBtn').addEventListener('click', function (e) {
                        e.stopPropagation();
                        document.getElementById('navUserDropdown').classList.remove('show');
                        openBlockModal();
                    });

                    document.getElementById('navLogoutBtn').addEventListener('click', function (e) {
                        e.stopPropagation();
                        document.getElementById('navUserDropdown').classList.remove('show');
                        handleLogout();
                    });
                }

                // 保留原来的 authStatusContainer 渲染（兼容）
                if (container) {
                    container.innerHTML = `
                        <div class="user-menu-wrapper" id="userMenuWrapper">
                            ${avatarHTML}
                            <span class="user-name" title="${escapeHTML(displayName)}">${escapeHTML(displayName)}</span>
                            <span class="dropdown-arrow" id="dropdownArrow">▼</span>
                            <div id="userDropdownMenu">
                                <button class="dropdown-item" id="profileEditBtn">✏️ 编辑资料</button>
                                <button class="dropdown-item" id="diaryBtn">📖 游戏日记</button>
                                <button class="dropdown-item" id="blockManageBtn">🚫 屏蔽内容管理</button>
                                <hr class="divider" />
                                <button class="dropdown-item danger" id="logoutBtn">🚪 登出</button>
                            </div>
                        </div>
                    `;

                    const wrapper = document.getElementById('userMenuWrapper');
                    const dropdown = document.getElementById('userDropdownMenu');
                    const arrow = document.getElementById('dropdownArrow');

                    if (wrapper && dropdown) {
                        wrapper.addEventListener('click', function (e) {
                            e.stopPropagation();
                            const isOpen = dropdown.classList.contains('show');
                            dropdown.classList.toggle('show');
                            if (arrow) arrow.classList.toggle('open');
                        });
                        if (_dropdownCloseHandler) {
                            document.removeEventListener('click', _dropdownCloseHandler);
                        }
                        _dropdownCloseHandler = function closeDropdown(e) {
                            if (!wrapper.contains(e.target)) {
                                dropdown.classList.remove('show');
                                if (arrow) arrow.classList.remove('open');
                            }
                        };
                        document.addEventListener('click', _dropdownCloseHandler);
                    }

                    document.getElementById('profileEditBtn').addEventListener('click', function (e) {
                        e.stopPropagation();
                        document.getElementById('userDropdownMenu').classList.remove('show');
                        if (arrow) arrow.classList.remove('open');
                        openProfileModal();
                    });

                    document.getElementById('diaryBtn').addEventListener('click', function (e) {
                        e.stopPropagation();
                        document.getElementById('userDropdownMenu').classList.remove('show');
                        if (arrow) arrow.classList.remove('open');
                        openDiaryModal();
                    });

                    document.getElementById('blockManageBtn').addEventListener('click', function (e) {
                        e.stopPropagation();
                        document.getElementById('userDropdownMenu').classList.remove('show');
                        if (arrow) arrow.classList.remove('open');
                        openBlockModal();
                    });

                    document.getElementById('logoutBtn').addEventListener('click', function (e) {
                        e.stopPropagation();
                        document.getElementById('userDropdownMenu').classList.remove('show');
                        if (arrow) arrow.classList.remove('open');
                        handleLogout();
                    });
                }
            }

            function updateUIForLoggedOut() {
                const container = document.getElementById('authStatusContainer');
                const navUserText = document.getElementById('navUserText');
                const navUserBtn = document.getElementById('navUserBtn');
                const navUserDropdownInner = document.getElementById('navUserDropdownInner');

                // 更新导航栏用户按钮
                if (navUserText) {
                    navUserText.textContent = '登录';
                }
                if (navUserBtn) {
                    const iconSpan = navUserBtn.querySelector('.nav-user-icon');
                    if (iconSpan) {
                        iconSpan.innerHTML = '👤';
                    }
                    // 点击打开登录弹窗
                    navUserBtn.onclick = function (e) {
                        e.stopPropagation();
                        openAuthModal();
                    };
                }
                if (navUserDropdownInner) {
                    navUserDropdownInner.innerHTML = `
                        <div class="nav-user-dropdown-item" id="navShowLoginBtn">
                            <span class="item-icon">🔑</span> 登录 / 注册
                        </div>
                    `;
                    document.getElementById('navShowLoginBtn').addEventListener('click', function (e) {
                        e.stopPropagation();
                        document.getElementById('navUserDropdown').classList.remove('show');
                        openAuthModal();
                    });
                }

                // 保留原来的 authStatusContainer 渲染（兼容）
                if (container) {
                    container.innerHTML = `
                        <button class="login-btn-header" id="showLoginBtn">🔑 登录</button>
                    `;
                    document.getElementById('showLoginBtn').addEventListener('click', openAuthModal);
                }

                isAdmin = false;
                isAdminMode = false;
                updateAdminUI();
            }

            // ================================================================
            // 全局事件绑定
            // ================================================================
            function bindGlobalEvents() {
                document.getElementById('btnThemeToggle').addEventListener('click', toggleTheme);

                document.querySelectorAll('.view-tab').forEach(t =>
                    t.addEventListener('click', function () { switchView(this.dataset.view); })
                );
                document.querySelectorAll('.sort-btn').forEach(btn => {
                    btn.addEventListener('click', function () { setSort(this.dataset.sort); });
                });
                // 新版：排序 select 下拉（方案A）
                const sortSelectEl = document.getElementById('sortSelect');
                if (sortSelectEl) {
                    sortSelectEl.addEventListener('change', function () {
                        setSort(this.value);
                        // 让下拉收起后立刻失焦，避免在移动端/Safari 保持边框高亮
                        try { this.blur(); } catch (_) {}
                    });
                }

                const searchInput = document.getElementById('searchInput');
                const clearBtn = document.getElementById('searchClearBtn');
                if (searchInput) {
                    searchInput.addEventListener('input', function () {
                        const val = this.value.replace(/[<>]/g, '').slice(0, 100);
                        this.value = val;
                        setSearchQuery(val);
                    });
                    if (clearBtn) {
                        clearBtn.addEventListener('click', function () {
                            searchInput.value = '';
                            setSearchQuery('');
                            searchInput.focus();
                        });
                    }
                    searchInput.addEventListener('keydown', function (e) {
                        if (e.key === 'Escape') {
                            this.value = '';
                            setSearchQuery('');
                            this.blur();
                        }
                    });
                }

                document.addEventListener('keydown', function (e) {
                    if (e.key === 'Escape') {
                        if (document.getElementById('modDetailOverlay').classList.contains('show')) {
                            closeModDetail();
                            return;
                        }
                        if (document.getElementById('detailModalOverlay').classList.contains('show')) {
                            closeDetailModal();
                            return;
                        }
                        if (document.getElementById('imageViewerOverlay').classList.contains('show')) {
                            closeImageViewer();
                            return;
                        }
                        if (document.getElementById('diaryPage').style.display === 'flex') {
                            if (hasUnsavedDiaryChanges()) {
                                if (!confirm('你还有未保存的评论内容，确定要关闭日记吗？未保存的内容将保留在草稿中。')) return;
                            }
                            closeDiaryModal();
                            return;
                        }
                        closeTipModal();
                        closeAchievementModal();
                        closeAuthModal();
                        closeProfileModal();
                        closeShareFloat();
                    }
                });

                document.getElementById('navTip').addEventListener('click', openTipModal);
                document.getElementById('tipModalClose').addEventListener('click', closeTipModal);
                document.getElementById('tipModalOverlay').addEventListener('click', function (e) {
                    if (e.target === this) closeTipModal();
                });

                document.getElementById('btnRandomPick').addEventListener('click', randomPick);
                document.getElementById('btnWishlistToggle').addEventListener('click', function() {
                    toggleWishlistMode();
                });
                document.getElementById('btnExcludePlayed').addEventListener('click', function() {
                    toggleExcludePlayedMode();
                });
                document.getElementById('achievementModalClose').addEventListener('click', closeAchievementModal);

                document.querySelectorAll('.achievement-tab-btn').forEach(btn => {
                    btn.addEventListener('click', function () {
                        switchAchievementTab(this.dataset.tab);
                    });
                });

                document.getElementById('authModalClose').addEventListener('click', closeAuthModal);
                document.getElementById('authModalOverlay').addEventListener('click', function (e) {
                    if (e.target === this) closeAuthModal();
                });
                document.getElementById('authTabLogin').addEventListener('click', () => switchAuthTab('login'));
                document.getElementById('authTabRegister').addEventListener('click', () => switchAuthTab('register'));
                document.getElementById('switchToRegister').addEventListener('click', (e) => {
                    e.preventDefault();
                    switchAuthTab('register');
                });
                document.getElementById('switchToLogin').addEventListener('click', (e) => {
                    e.preventDefault();
                    switchAuthTab('login');
                });
                document.getElementById('loginBtn').addEventListener('click', handleLogin);
                document.getElementById('registerBtn').addEventListener('click', handleRegister);
                document.getElementById('resendConfirmBtn').addEventListener('click', function () {
                    const email = document.getElementById('registerEmail').value.trim();
                    if (!email) { showToast('请先输入邮箱地址', 2000); return; }
                    if (!supabaseClient) { showToast('Supabase 未初始化', 2000); return; }
                    supabaseClient.auth.resend({
                        type: 'signup',
                        email: email,
                        options: { emailRedirectTo: window.location.origin }
                    }).then(() => {
                        showToast('验证邮件已重新发送，请查收', 2000);
                    }).catch((err) => {
                        showToast('发送失败：' + (err.message || '请稍后重试'), 2000);
                    });
                });
                document.getElementById('loginPassword').addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') handleLogin();
                });
                document.getElementById('registerPassword').addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') handleRegister();
                });

                // 忘记密码
                document.getElementById('loginForgotLink').addEventListener('click', (e) => {
                    e.preventDefault();
                    openForgotForm();
                });
                document.getElementById('forgotSendBtn').addEventListener('click', handleForgotPassword);
                document.getElementById('forgotBackToLogin').addEventListener('click', (e) => {
                    e.preventDefault();
                    backToLoginFromForgot();
                });
                document.getElementById('forgotEmail').addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') handleForgotPassword();
                });

                // 设置新密码弹窗
                document.getElementById('resetPwModalClose').addEventListener('click', closeResetPwModal);
                document.getElementById('resetPwModalOverlay').addEventListener('click', function (e) {
                    if (e.target === this) closeResetPwModal();
                });
                document.getElementById('resetPwBtn').addEventListener('click', handleResetPassword);
                document.getElementById('resetPwInput').addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') handleResetPassword();
                });
                document.getElementById('resetPwConfirm').addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') handleResetPassword();
                });

                document.getElementById('profileModalClose').addEventListener('click', closeProfileModal);
                document.getElementById('profileModalOverlay').addEventListener('click', function (e) {
                    if (e.target === this) closeProfileModal();
                });

                // 屏蔽内容管理弹窗事件（仅X和保存可退出，不响应外部点击）
                document.getElementById('blockModalClose').addEventListener('click', closeBlockModal);
                document.getElementById('blockAdultToggle').addEventListener('click', function () {
                    showAdultContent = !showAdultContent;
                    this.classList.toggle('on', showAdultContent);
                    saveSettings();
                    renderGallery();
                    updateAdultContentBanner();
                    showToast(showAdultContent ? '已开启恶俗内容显示' : '已屏蔽恶俗内容', 1200);
                });
                document.getElementById('blockTagSearch').addEventListener('input', function () {
                    blockSearchQuery = this.value.trim();
                    if (blockSearchQuery) {
                        const dims = ['genre', 'gameplay', 'platforms', 'heroineType', 'costumeType', 'perspective'];
                        dims.forEach(c => blockOpenDims.add(c));
                    }
                    renderBlockSettings();
                });
                document.getElementById('blockClearAll').addEventListener('click', function () {
                    if (this.disabled) return;
                    excludedTags = { genre: [], gameplay: [], platforms: [], heroineType: [], costumeType: [], perspective: [] };
                    saveSettings();
                    renderBlockSettings();
                    renderGallery();
                    updateAdultContentBanner();
                    showToast('已清空全部排除标签', 1200);
                });
                document.getElementById('blockSaveBtn').addEventListener('click', function () {
                    saveSettings();
                    closeBlockModal();
                    renderGallery();
                    updateAdultContentBanner();
                    showToast('屏蔽设置已保存', 1200);
                });

                // 主界面恶俗内容屏蔽提示条（极简chip）
                const chipEl = document.getElementById('adultContentChip');
                const tooltipEl = document.getElementById('adultContentTooltip');
                if (chipEl) {
                    // 点击打开屏蔽内容管理弹窗
                    chipEl.addEventListener('click', function () {
                        if (!currentUser) {
                            showToast('请先登录 · 登录后可前往 下拉菜单 › 屏蔽内容管理 解锁', 2200);
                            openAuthModal();
                            return;
                        }
                        openBlockModal();
                    });

                    // 移动端长按显示 tooltip
                    let pressTimer = null;
                    const startPress = function (e) {
                        if (pressTimer) clearTimeout(pressTimer);
                        pressTimer = setTimeout(function () {
                            chipEl.classList.add('pressing');
                            if (tooltipEl) tooltipEl.classList.add('show');
                        }, 400);
                    };
                    const endPress = function (e) {
                        if (pressTimer) { clearTimeout(pressTimer); pressTimer = null; }
                        chipEl.classList.remove('pressing');
                        // 延迟隐藏 tooltip，提升感知
                        setTimeout(function () { if (tooltipEl) tooltipEl.classList.remove('show'); }, 1200);
                    };
                    chipEl.addEventListener('touchstart', startPress, { passive: true });
                    chipEl.addEventListener('touchend', endPress);
                    chipEl.addEventListener('touchcancel', endPress);
                    chipEl.addEventListener('touchmove', endPress);
                }
                // 初始显示状态
                updateAdultContentBanner();

                document.getElementById('avatarInput').addEventListener('change', function (e) {
                    if (this.files && this.files.length > 0) {
                        handleAvatarFileSelect(this.files[0]);
                    }
                });
                document.getElementById('profileSaveBtn').addEventListener('click', saveProfile);
                document.getElementById('profileChangeEmailBtn').addEventListener('click', changeEmail);
                document.getElementById('profileDisplayName').addEventListener('keydown', function (e) {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        saveProfile();
                    }
                });

                // 显示名称检查
                document.getElementById('profileCheckNameBtn').addEventListener('click', function () {
                    const val = document.getElementById('profileDisplayName').value.trim();
                    checkDisplayNameAvailable(val);
                });
                document.getElementById('profileDisplayName').addEventListener('input', function () {
                    const msgEl = document.getElementById('profileDisplayNameMsg');
                    msgEl.textContent = '';
                    msgEl.style.color = 'var(--text3)';
                });
                document.getElementById('profileDisplayName').addEventListener('keydown', function (e) {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        const val = this.value.trim();
                        checkDisplayNameAvailable(val);
                    }
                });

                // 专属ID检查
                document.getElementById('profileCheckIdBtn').addEventListener('click', function () {
                    const val = document.getElementById('profileCustomId').value.trim().toLowerCase();
                    checkCustomIdAvailable(val);
                });
                document.getElementById('profileCustomId').addEventListener('input', function () {
                    this.value = this.value.toLowerCase().replace(/[^a-z0-9_]/g, '');
                    const msgEl = document.getElementById('profileCustomIdMsg');
                    msgEl.textContent = '';
                    msgEl.style.color = 'var(--text3)';
                });
                document.getElementById('profileCustomId').addEventListener('keydown', function (e) {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        const val = this.value.trim().toLowerCase();
                        checkCustomIdAvailable(val);
                    }
                });

                document.getElementById('btnToggleAdmin').addEventListener('click', toggleAdminMode);
                document.getElementById('btnAddGame').addEventListener('click', function () {
                    if (!isAdmin) { showToast('⚠️ 仅管理员可操作', 1500); return; }
                    showEditModal(null);
                });
                document.getElementById('btnImportCSV').addEventListener('click', function () {
                    if (!isAdmin) { showToast('⚠️ 仅管理员可操作', 1500); return; }
                    document.getElementById('csvFileInput').click();
                });
                document.getElementById('csvFileInput').addEventListener('change', function (e) {
                    const file = this.files[0];
                    if (file) importCSV(file);
                });
                const bufferBtn = document.getElementById('btnBuffer');
                if (bufferBtn) bufferBtn.addEventListener('click', openBuffer);
                const bufferOverlay = document.getElementById('bufferModalOverlay');
                if (bufferOverlay) {
                    bufferOverlay.addEventListener('click', function (e) {
                        if (e.target === bufferOverlay) closeBuffer();
                    });
                }
                const navSubmit = document.getElementById('navSubmit');
                if (navSubmit) {
                    navSubmit.addEventListener('click', function (e) {
                        e.preventDefault();
                        openSubmitModal();
                    });
                }
                const submitBtn = document.getElementById('btnSubmitGame');
                if (submitBtn) submitBtn.addEventListener('click', submitGameFromForm);
                setupSubmitTitleAutocomplete();
                const submitOverlay = document.getElementById('submitModalOverlay');
                if (submitOverlay) {
                    submitOverlay.addEventListener('click', function (e) {
                        if (e.target === submitOverlay) closeSubmitModal();
                    });
                    submitOverlay.addEventListener('keydown', function (e) {
                        if (e.target && (e.target.id === 'sfTitle' || e.target.id === 'sfSteamLink') && e.key === 'Enter') {
                            e.preventDefault();
                            submitGameFromForm();
                        }
                    });
                }
                document.getElementById('editModalOverlay').addEventListener('click', function (e) {
                    // 不允许点击遮罩关闭编辑弹窗，避免误触导致填写内容丢失
                });

                document.getElementById('diaryOpenBtn').addEventListener('click', showDiaryContent);
                document.getElementById('diaryBackBtn').addEventListener('click', () => {
                    if (hasUnsavedDiaryChanges()) {
                        if (!confirm('你还有未保存的评论内容，确定要返回封面吗？未保存的内容将保留在草稿中。')) return;
                    }
                    showDiaryCover();
                });
                document.getElementById('diaryCloseCoverBtn').addEventListener('click', closeDiaryModal);
                document.getElementById('diarySortSelect').addEventListener('change', function() {
                    diaryCurrentPage = 0;
                    renderDiaryContent();
                });

                // 移动端书签按钮：展开/收起下拉面板
                const mobileBmBtn = document.getElementById('diaryMobileBmBtn');
                if (mobileBmBtn) {
                    mobileBmBtn.addEventListener('click', function() {
                        const dropdown = document.getElementById('diaryMobileDropdown');
                        if (!dropdown) return;
                        const isOpen = dropdown.style.display === 'block';
                        if (isOpen) {
                            dropdown.style.display = 'none';
                        } else {
                            dropdown.style.display = 'block';
                            renderMobileBookmarkList('');
                            const search = document.getElementById('diaryMobileSearch');
                            if (search) search.value = '';
                        }
                    });
                }
                // 移动端搜索框：实时过滤
                const mobileSearch = document.getElementById('diaryMobileSearch');
                if (mobileSearch) {
                    mobileSearch.addEventListener('input', function(e) {
                        renderMobileBookmarkList(e.target.value);
                    });
                }

                // ★ 新功能事件绑定
                // 分享导出按钮
                document.getElementById('diaryShareBtn')?.addEventListener('click', shareDiaryAsImage);
                // 翻页进度条点击跳转
                document.getElementById('diaryProgressBar')?.addEventListener('click', function(e) {
                    if (diarySortedReviews.length === 0) return;
                    const rect = this.getBoundingClientRect();
                    const ratio = (e.clientX - rect.left) / rect.width;
                    const target = Math.floor(ratio * diarySortedReviews.length);
                    if (target >= 0 && target < diarySortedReviews.length && target !== diaryCurrentPage) {
                        if (hasUnsavedDiaryChanges()) {
                            if (!confirm('你还有未保存的评论内容，确定要跳转吗？未保存的内容将保留在草稿中。')) return;
                        }
                        playDiaryFlipSound();
                        diaryCurrentPage = target;
                        renderDiaryPage();
                        document.getElementById('diaryPage').scrollTo({ top: 0, behavior: 'smooth' });
                    }
                });

                // 初始化移动端手势
                initDiaryMobileGestures();

                document.getElementById('imageViewerClose').addEventListener('click', closeImageViewer);
                document.getElementById('imageViewerOverlay').addEventListener('click', function (e) {
                    if (e.target === this) closeImageViewer();
                });

                document.getElementById('modDetailOverlay').addEventListener('click', function (e) {
                    if (e.target === this) closeModDetail();
                });

                window.addEventListener('popstate', function (event) {
                    const overlay = document.getElementById('detailModalOverlay');
                    const isOpen = overlay.classList.contains('show');

                    const gameId = event.state?.gameId || null;
                    if (gameId) {
                        const game = games.find(g => g.id === Number(gameId));
                        if (game) {
                            if (!isOpen) {
                                showDetailModal(game, { from: 'gallery' });
                            } else {
                                closeDetailModal();
                                setTimeout(() => showDetailModal(game, { from: 'gallery' }), 50);
                            }
                            return;
                        }
                    }

                    if (isOpen) {
                        closeDetailModal();
                    }
                });

                updateFilterUI();
            }

            // ================================================================
            // 云端同步
            // ================================================================
            let _syncInProgress = false;
            async function syncUserDataWithCloud(retryCount = 0) {
                if (!currentUser || !supabaseClient) {
                    console.warn('未登录或 Supabase 未初始化，跳过同步');
                    return;
                }
                if (_syncInProgress) return;
                _syncInProgress = true;

                const userId = currentUser.id;
                setSyncStatus('syncing', '正在展开地图');

                try {
                    // 步骤 -1：用内存里的 games 集合（已从 localStorage/Supabase 加载，不受 RLS 影响）
                    //          清理本地 userData 里的孤儿 game_id，从源头避免 FK 外键错误刷屏
                    if (Array.isArray(games) && games.length > 0 && userData) {
                        const validGameIds = new Set(games.map(g => Number(g.id)));
                        let cleaned = false;
                        const cleanArr = (arr, name) => {
                            if (!Array.isArray(arr)) return arr;
                            const before = arr.length;
                            const next = arr.filter(id => validGameIds.has(Number(id)));
                            if (next.length !== before) {
                                console.warn(`🧹 清理本地 ${name} 中 ${before - next.length} 个无效 game_id：`, arr.filter(id => !validGameIds.has(Number(id))));
                                cleaned = true;
                            }
                            return next;
                        };
                        const cleanReviewArr = (arr) => {
                            if (!Array.isArray(arr)) return arr;
                            const before = arr.length;
                            const next = arr.filter(r => validGameIds.has(Number(r.game_id)));
                            if (next.length !== before) {
                                const removed = arr.filter(r => !validGameIds.has(Number(r.game_id))).map(r => r.game_id);
                                console.warn(`🧹 清理本地 reviews 中 ${before - next.length} 个无效 game_id：`, removed);
                                cleaned = true;
                            }
                            return next;
                        };
                        userData.wishlist = cleanArr(userData.wishlist, 'wishlist');
                        userData.played = cleanArr(userData.played, 'played');
                        userData.reviews = cleanReviewArr(userData.reviews);
                        if (cleaned) saveUserData();
                    }

                    // 步骤 0：先从云端 user_metadata 合并头衔+成就（都是单向解锁）
                    try { mergeTitlesAndAchievementsFromMetadata(); } catch (e) { console.warn(e); }

                    // 批量写入助手：优先批量，若触发外键约束(23503)则降级为逐条写入并跳过失败项
                    const safeBatchInsert = async (table, items, opts = {}) => {
                        const method = opts._method || 'insert';
                        delete opts._method;
                        if (!items || items.length === 0) return { table, failedIds: [] };
                        const doWrite = (data) => {
                            if (method === 'upsert') return supabaseClient.from(table).upsert(data, opts);
                            return supabaseClient.from(table).insert(data, opts);
                        };
                        try {
                            const { error } = await doWrite(items);
                            if (!error) return { table, failedIds: [] };
                            if (error.code === '23505') return { table, failedIds: [] };
                            if (error.code !== '23503' || !error.message || !error.message.includes('foreign key constraint')) {
                                throw error;
                            }
                            // FK 外键约束失败：降级为逐条写入
                            console.warn(`⚠️ ${table} 批量${method === 'upsert' ? 'upsert' : 'insert'}触发外键约束，降级为逐条处理（共 ${items.length} 条）`);
                            const failedIds = [];
                            for (const item of items) {
                                try {
                                    const { error: e2 } = await doWrite(item);
                                    if (e2 && e2.code === '23503' && e2.message && e2.message.includes('foreign key constraint')) {
                                        failedIds.push(item.game_id);
                                        console.warn(`  ↳ 跳过无效 game_id: ${item.game_id}（games 表中不存在或 RLS 不可见）`);
                                    } else if (e2 && e2.code !== '23505') {
                                        throw e2;
                                    }
                                } catch (e2) {
                                    if (e2.code === '23503' && e2.message && e2.message.includes('foreign key constraint')) {
                                        failedIds.push(item.game_id);
                                        console.warn(`  ↳ 跳过无效 game_id: ${item.game_id}（games 表中不存在或 RLS 不可见）`);
                                    } else {
                                        throw e2;
                                    }
                                }
                            }
                            if (failedIds.length > 0) {
                                console.warn(`⚠️ ${table} 有 ${failedIds.length} 个 game_id 因外键约束被跳过:`, failedIds);
                            }
                            return { table, failedIds };
                        } catch (e) {
                            console.error(`❌ ${table} 批量${method === 'upsert' ? 'upsert' : 'insert'}异常：`, e);
                            throw e;
                        }
                    };

                    const [wishlistRes, playedRes, reviewsRes] = await Promise.all([
                        supabaseClient.from('user_wishlist').select('game_id').eq('user_id', userId),
                        supabaseClient.from('user_played').select('game_id').eq('user_id', userId),
                        supabaseClient.from('user_reviews').select('game_id, verdict, selected_tags, rating, comment, play_date, play_hours, created_at, updated_at').eq(
                            'user_id', userId)
                    ]);

                    if (wishlistRes.error) throw new Error(wishlistRes.error.message);
                    if (playedRes.error) throw new Error(playedRes.error.message);
                    if (reviewsRes.error) throw new Error(reviewsRes.error.message);

                    const cloudWishlist = wishlistRes.data.map(item => Math.round(Number(item.game_id)));
                    const cloudPlayed = playedRes.data.map(item => Math.round(Number(item.game_id)));
                    const cloudReviews = reviewsRes.data.map(item => ({
                        game_id: Math.round(Number(item.game_id)),
                        verdict: item.verdict,
                        selected_tags: item.selected_tags || [],
                        rating: item.rating,
                        comment: item.comment,
                        play_date: item.play_date,
                        play_hours: item.play_hours,
                        created_at: item.created_at,
                        updated_at: item.updated_at
                    }));

                    const localWishlist = userData.wishlist || [];
                    const localPlayed = userData.played || [];
                    const localReviews = userData.reviews || [];

                    const cloudWishlistSet = new Set(cloudWishlist);
                    const cloudPlayedSet = new Set(cloudPlayed);
                    const toUploadWishlist = localWishlist.filter(id => !cloudWishlistSet.has(id));
                    const toUploadPlayed = localPlayed.filter(id => !cloudPlayedSet.has(id));

                    const uploadPromises = [];

                    if (toUploadWishlist.length > 0) {
                        const items = toUploadWishlist.map(game_id => ({ user_id: userId, game_id: Math.round(Number(game_id)) }));
                        uploadPromises.push(safeBatchInsert('user_wishlist', items));
                    }

                    if (toUploadPlayed.length > 0) {
                        const items = toUploadPlayed.map(game_id => ({ user_id: userId, game_id: Math.round(Number(game_id)) }));
                        uploadPromises.push(safeBatchInsert('user_played', items));
                    }

                    const cloudReviewMap = new Map(cloudReviews.map(r => [r.game_id, r]));
                    const localReviewMap = new Map(localReviews.map(r => [r.game_id, r]));
                    const toUploadReviews = [];
                    for (const [gameId, local] of localReviewMap) {
                        const cloud = cloudReviewMap.get(gameId);
                        if (!cloud) {
                            toUploadReviews.push({
                                user_id: userId,
                                game_id: Math.round(Number(gameId)),
                                verdict: local.verdict || null,
                                selected_tags: local.selected_tags || [],
                                comment: local.comment || null,
                                play_date: local.play_date || null,
                                play_hours: local.play_hours || 0,
                                display_name: currentUser.user_metadata?.display_name || currentUser.email || '用户',
                                avatar_url: currentUser.user_metadata?.avatar_url || null,
                                custom_id: currentUser.user_metadata?.custom_id || null
                            });
                        } else if ((local.updated_at || '') > (cloud.updated_at || '')) {
                            toUploadReviews.push({
                                user_id: userId,
                                game_id: Math.round(Number(gameId)),
                                verdict: local.verdict || null,
                                selected_tags: local.selected_tags || [],
                                comment: local.comment || null,
                                play_date: local.play_date || null,
                                play_hours: local.play_hours || 0,
                                display_name: currentUser.user_metadata?.display_name || currentUser.email || '用户',
                                avatar_url: currentUser.user_metadata?.avatar_url || null,
                                custom_id: currentUser.user_metadata?.custom_id || null
                            });
                        }
                    }
                    if (toUploadReviews.length > 0) {
                        uploadPromises.push(
                            safeBatchInsert('user_reviews', toUploadReviews, { _method: 'upsert', onConflict: 'user_id, game_id' })
                        );
                    }

                    if (uploadPromises.length > 0) {
                        const results = await Promise.all(uploadPromises);
                        // 双保险：同步时 FK 失败跳过的 game_id，也从本地 userData 清掉，下次不会再尝试
                        let needSave = false;
                        for (const r of results) {
                            if (!r || !Array.isArray(r.failedIds) || r.failedIds.length === 0) continue;
                            const rmSet = new Set(r.failedIds.map(Number));
                            if (r.table === 'user_played' && Array.isArray(userData.played)) {
                                const before = userData.played.length;
                                userData.played = userData.played.filter(id => !rmSet.has(Number(id)));
                                if (userData.played.length !== before) needSave = true;
                            } else if (r.table === 'user_wishlist' && Array.isArray(userData.wishlist)) {
                                const before = userData.wishlist.length;
                                userData.wishlist = userData.wishlist.filter(id => !rmSet.has(Number(id)));
                                if (userData.wishlist.length !== before) needSave = true;
                            } else if (r.table === 'user_reviews' && Array.isArray(userData.reviews)) {
                                const before = userData.reviews.length;
                                userData.reviews = userData.reviews.filter(rr => !rmSet.has(Number(rr.game_id)));
                                if (userData.reviews.length !== before) needSave = true;
                            }
                        }
                        if (needSave) saveUserData();
                    }

                    const mergedWishlist = [...new Set([...cloudWishlist, ...localWishlist])];
                    const mergedPlayed = [...new Set([...cloudPlayed, ...localPlayed])];
                    const mergedReviews = [];
                    const mergedGameIds = new Set();
                    for (const [gameId, cloud] of cloudReviewMap) {
                        const local = localReviewMap.get(gameId);
                        if (local && (local.updated_at || '') > (cloud.updated_at || '')) {
                            mergedReviews.push(local);
                        } else {
                            mergedReviews.push(cloud);
                        }
                        mergedGameIds.add(gameId);
                    }
                    for (const [gameId, local] of localReviewMap) {
                        if (!mergedGameIds.has(gameId)) {
                            mergedReviews.push(local);
                        }
                    }

                    const curDisplayName = currentUser.user_metadata?.display_name || currentUser.email || '用户';
                    const curAvatarUrl = currentUser.user_metadata?.avatar_url || null;
                    const toUpdate = mergedReviews.filter(r =>
                        r.display_name !== curDisplayName || r.avatar_url !== curAvatarUrl
                    );
                    if (toUpdate.length > 0) {
                        toUpdate.forEach(r => { r.display_name = curDisplayName; r.avatar_url = curAvatarUrl; });
                        const updatePromises = toUpdate.map(r =>
                            supabaseClient.from('user_reviews')
                                .update({ display_name: curDisplayName, avatar_url: curAvatarUrl })
                                .eq('user_id', userId).eq('game_id', r.game_id)
                                .then(() => { })
                        );
                        await Promise.all(updatePromises);
                    }

                    userData.wishlist = mergedWishlist;
                    userData.played = mergedPlayed;
                    userData.reviews = mergedReviews;
                    saveUserData();

                    renderGallery();
                    updateAchievementDot();
                    checkAchievements(); // 内部会触发 syncTitlesAndAchievementsToMetadata
                    // 再调用一次确保头衔列表同步（例如从第二台设备同步过来的已解锁头衔，需要回写 metadata 保证双端一致）
                    syncTitlesAndAchievementsToMetadata({ silent: true, debounceMs: 500 });

                    setSyncStatus('synced', '已同步');
                    const tCnt = (userData.titles || []).length;
                    const aCnt = (userData.achievements || []).length;
                    const eqT = userData.equippedTitle || '无';
                    console.log(`✅ 同步完成：愿望单 ${mergedWishlist.length} 项，玩过 ${mergedPlayed.length} 项，评论 ${mergedReviews.length} 项；头衔 ${tCnt} 个，成就 ${aCnt} 个，佩戴=${eqT}`);
                    _syncInProgress = false;

                } catch (error) {
                    console.error('❌ 同步失败:', error);
                    _syncInProgress = false;
                    if (retryCount < 3) {
                        console.log(`🔄 重试同步 (${retryCount + 1}/3)...`);
                        setSyncStatus('syncing', `正在展开地图 (${retryCount + 1}/3)`);
                        const delay = 2000 * (retryCount + 1);
                        setTimeout(() => syncUserDataWithCloud(retryCount + 1), delay);
                    } else {
                        setSyncStatus('error', '同步失败');
                        showToast('⚠️ 数据同步失败，请检查网络或手动刷新', 3000);
                    }
                }
            }

            // ================================================================
            // ★★★ 首次引导 ★★★
            // ================================================================
            const GUIDE_KEY = 'heroineGuideShown';
            let guideStep = 1;
            const guideTotalSteps = 7;

            // ================================================================
            // ★★★ 公告弹窗（对接现有 site_announcements 表，仅展示标题） ★★★
            // ================================================================
            const ANNOUNCEMENT_SEEN_KEY = 'heroineAnnouncementSeenId';
            let currentAnnouncement = null;

            // 已读公告 id 集合（兼容旧版：只存单个 id 的字符串）
            function getSeenAnnouncementIds() {
                try {
                    const raw = localStorage.getItem(ANNOUNCEMENT_SEEN_KEY);
                    if (!raw) return [];
                    let parsed = null;
                    try { parsed = JSON.parse(raw); } catch (e) { parsed = null; }
                    if (Array.isArray(parsed)) return parsed.map(String);
                    return [String(raw)];
                } catch (e) {
                    return [];
                }
            }

            function markAnnouncementSeen(id) {
                if (id == null) return;
                const seen = getSeenAnnouncementIds();
                const sid = String(id);
                if (!seen.includes(sid)) seen.push(sid);
                try {
                    localStorage.setItem(ANNOUNCEMENT_SEEN_KEY, JSON.stringify(seen));
                } catch (e) {
                    console.warn('⚠️ 无法写入公告已读状态', e.message || e);
                }
            }

            // 只展示最新一条公告，且仅当它从未被读过（点过「我知道了」即视为已读，永不再弹）
            async function fetchLatestUnreadAnnouncement() {
                if (!supabaseClient) return null;
                try {
                    const { data, error } = await supabaseClient
                        .from('site_announcements')
                        .select('id, title, pinned, created_at')
                        .order('created_at', { ascending: false })
                        .limit(20);
                    if (error) throw error;
                    if (!data || data.length === 0) return null;
                    const latest = data[0];
                    const seen = getSeenAnnouncementIds();
                    if (seen.includes(String(latest.id))) return null;
                    return latest;
                } catch (e) {
                    console.warn('⚠️ 公告拉取失败', e.message || e);
                    return null;
                }
            }

            // 从标题中提取第一个 emoji 作为图标
            function extractIcon(title) {
                if (!title) return '📢';
                const emojiMatch = title.match(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{27BF}\u{1F000}-\u{1F02F}]/u);
                return emojiMatch ? emojiMatch[0] : '📢';
            }

            function populateAnnouncementModal(announcement) {
                const iconEl = document.getElementById('announcementModalIcon');
                const titleEl = document.getElementById('announcementModalTitle');
                if (!announcement) return;
                const icon = extractIcon(announcement.title);
                const cleanTitle = (announcement.title || '更新公告').replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{27BF}\u{1F000}-\u{1F02F}]/u, '').trim();
                if (iconEl) iconEl.textContent = icon;
                if (titleEl) titleEl.textContent = cleanTitle || '更新公告';
            }

            function showAnnouncementModal() {
                const overlay = document.getElementById('announcementModalOverlay');
                if (!overlay) return;
                overlay.classList.add('show');
            }

            function closeAnnouncementModal() {
                const overlay = document.getElementById('announcementModalOverlay');
                if (!overlay) return;
                overlay.classList.remove('show');
                if (currentAnnouncement && currentAnnouncement.id) {
                    markAnnouncementSeen(currentAnnouncement.id);
                }
            }

            function goToAnnouncementsPage() {
                closeAnnouncementModal();
                if (typeof switchMainView === 'function') {
                    switchMainView('announcements');
                }
            }

            async function loadAndShowAnnouncement() {
                currentAnnouncement = await fetchLatestUnreadAnnouncement();
                if (!currentAnnouncement) return false;
                populateAnnouncementModal(currentAnnouncement);
                return true;
            }

            function tryShowAnnouncementAfterGuide() {
                loadAndShowAnnouncement().then(shouldShow => {
                    if (shouldShow) {
                        setTimeout(showAnnouncementModal, 400);
                    }
                });
            }

            function initAnnouncementModalEvents() {
                const closeBtn = document.getElementById('announcementModalClose');
                const confirmBtn = document.getElementById('announcementModalConfirm');
                const goBtn = document.getElementById('announcementModalGo');
                const overlay = document.getElementById('announcementModalOverlay');

                if (closeBtn) closeBtn.addEventListener('click', closeAnnouncementModal);
                if (confirmBtn) confirmBtn.addEventListener('click', closeAnnouncementModal);
                if (goBtn) goBtn.addEventListener('click', goToAnnouncementsPage);
                if (overlay) overlay.addEventListener('click', function (e) {
                    if (e.target === overlay) closeAnnouncementModal();
                });
            }

            function showGuide() {
                const overlay = document.getElementById('guideOverlay');
                if (!overlay) return;
                guideStep = 1;
                updateGuideStep();
                overlay.classList.add('show');
            }

            function closeGuide() {
                const overlay = document.getElementById('guideOverlay');
                if (overlay) overlay.classList.remove('show');
                localStorage.setItem(GUIDE_KEY, 'true');
                // 引导关闭后，尝试显示公告弹窗
                tryShowAnnouncementAfterGuide();
            }

            function updateGuideStep() {
                document.querySelectorAll('.guide-step').forEach(s => {
                    s.classList.toggle('active', Number(s.dataset.step) === guideStep);
                });
                document.querySelectorAll('.guide-dot').forEach(d => {
                    d.classList.toggle('active', Number(d.dataset.dot) === guideStep);
                });
                const prev = document.getElementById('guidePrev');
                const next = document.getElementById('guideNext');
                if (prev) prev.style.display = guideStep > 1 ? 'inline-block' : 'none';
                if (next) next.textContent = guideStep >= guideTotalSteps ? '开始探索' : '下一步';
            }

            function initGuideEvents() {
                const next = document.getElementById('guideNext');
                const prev = document.getElementById('guidePrev');
                const skip = document.getElementById('guideSkip');
                if (next) next.addEventListener('click', function () {
                    if (guideStep >= guideTotalSteps) { closeGuide(); return; }
                    guideStep++;
                    updateGuideStep();
                });
                if (prev) prev.addEventListener('click', function () {
                    if (guideStep > 1) { guideStep--; updateGuideStep(); }
                });
                if (skip) skip.addEventListener('click', closeGuide);
                const overlay = document.getElementById('guideOverlay');
                if (overlay) overlay.addEventListener('click', function (e) {
                    if (e.target === overlay) closeGuide();
                });
            }

            // ================================================================
            // ★★★ 键盘快捷键 ★★★
            // ================================================================
            function initKeyboardShortcuts() {
                const hint = document.getElementById('shortcutHint');
                let hintTimeout = null;

                document.addEventListener('keydown', function (e) {
                    // 忽略输入框/textarea 内的快捷键
                    const tag = (e.target.tagName || '').toLowerCase();
                    const isInput = tag === 'input' || tag === 'textarea' || e.target.isContentEditable;
                    if (isInput) return;

                    // 如果有弹窗打开，不触发快捷键
                    const anyModalOpen = document.querySelector('.modal-overlay.show, .guide-overlay.show');
                    if (anyModalOpen && e.key !== 'Escape') return;

                    switch (e.key) {
                        case '/':
                            e.preventDefault();
                            const searchInputEl = document.getElementById('searchInput');
                            if (searchInputEl) {
                                searchInputEl.focus();
                                searchInputEl.select();
                            }
                            break;
                        case '1':
                            if (!e.ctrlKey && !e.metaKey) { switchView('released'); showToast('📀 已发售游戏', 1200); }
                            break;
                        case '2':
                            if (!e.ctrlKey && !e.metaKey) { switchView('unreleased'); showToast('⏳ 未发售游戏', 1200); }
                            break;
                        case '3':
                            if (!e.ctrlKey && !e.metaKey) { switchView('series'); showToast('📚 系列作品', 1200); }
                            break;
                        case 'r':
                        case 'R':
                            if (!e.ctrlKey && !e.metaKey) randomPick();
                            break;
                        case '?':
                            if (localStorage.getItem(GUIDE_KEY) !== 'true') {
                                showGuide();
                            } else {
                                showToast('💡 快捷键: /搜索 · 1/2/3切换视图 · R随机 · ←/→日记翻页 · Esc关闭', 3000);
                            }
                            break;
                        case 'ArrowRight':
                            // 日记翻到下一页
                            if (document.getElementById('diaryPage').style.display === 'flex' &&
                                document.getElementById('diaryContentView').style.display !== 'none' &&
                                !diaryFlipping) {
                                if (diaryCurrentPage < diarySortedReviews.length - 1) {
                                    e.preventDefault();
                                    if (isMobileView() && hasUnsavedDiaryChanges()) {
                                        if (!confirm('你还有未保存的评论内容，确定要翻页吗？未保存的内容将保留在草稿中。')) break;
                                    }
                                    playDiaryFlipSound();
                                    if (isMobileView()) { diaryCurrentPage++; renderDiaryPage(); }
                                    else flipDiaryPage('next');
                                }
                            }
                            break;
                        case 'ArrowLeft':
                            // 日记翻到上一页
                            if (document.getElementById('diaryPage').style.display === 'flex' &&
                                document.getElementById('diaryContentView').style.display !== 'none' &&
                                !diaryFlipping) {
                                if (diaryCurrentPage > 0) {
                                    e.preventDefault();
                                    if (isMobileView() && hasUnsavedDiaryChanges()) {
                                        if (!confirm('你还有未保存的评论内容，确定要翻页吗？未保存的内容将保留在草稿中。')) break;
                                    }
                                    playDiaryFlipSound();
                                    if (isMobileView()) { diaryCurrentPage--; renderDiaryPage(); }
                                    else flipDiaryPage('prev');
                                }
                            }
                            break;
                    }
                });

                // 鼠标悬停时短暂显示快捷键提示
                let shortcutHintShown = localStorage.getItem('heroineShortcutHint');
                if (!shortcutHintShown && hint) {
                    setTimeout(function () {
                        hint.classList.add('show');
                        setTimeout(function () { hint.classList.remove('show'); }, 5000);
                        localStorage.setItem('heroineShortcutHint', 'true');
                    }, 3000);
                }
            }

            // ================================================================


            // ================================================================
            // ★★★ 滚动位置记忆 ★★★
            // ================================================================
            const SCROLL_POS_KEY = 'heroineScrollPos';

            function saveScrollPosition() {
                if (!document.getElementById('detailModalOverlay').classList.contains('show')) {
                    sessionStorage.setItem(SCROLL_POS_KEY, JSON.stringify({
                        view: currentView,
                        y: window.scrollY,
                        ts: Date.now()
                    }));
                }
            }

            function restoreScrollPosition() {
                try {
                    const raw = sessionStorage.getItem(SCROLL_POS_KEY);
                    if (!raw) return;
                    const data = JSON.parse(raw);
                    // 10分钟内有效
                    if (data.view === currentView && data.ts && (Date.now() - data.ts < 600000)) {
                        requestAnimationFrame(function () {
                            window.scrollTo(0, data.y || 0);
                        });
                    }
                } catch (_) { }
            }

            // ================================================================
            // ★★★ 个性化随机推荐 ★★★
            // ================================================================
            function getUserPreferredGenres() {
                const genreCounts = {};
                const playedIds = userData.played || [];
                playedIds.forEach(id => {
                    const game = games.find(g => g.id === id);
                    if (game && game.genre) {
                        game.genre.forEach(g => {
                            genreCounts[g] = (genreCounts[g] || 0) + 1;
                        });
                    }
                });
                return Object.entries(genreCounts)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 5)
                    .map(e => e[0]);
            }

            // ================================================================
            // ★★★ 优化的随机推荐 ★★★
            // ================================================================
            function randomPick() {
                const filtered = getFilteredGames();
                if (filtered.length === 0) { showToast('当前列表中没有游戏可推荐 😅', 2000); return; }

                let pick;
                const preferredGenres = getUserPreferredGenres();
                if (preferredGenres.length > 0 && userData.played.length >= 3) {
                    // 加权随机：偏好题材的游戏权重更高
                    const weighted = filtered.map(g => {
                        const matchCount = (g.genre || []).filter(genre => preferredGenres.includes(genre)).length;
                        return { game: g, weight: 1 + matchCount * 2 };
                    });
                    const totalWeight = weighted.reduce((s, w) => s + w.weight, 0);
                    let rand = Math.random() * totalWeight;
                    pick = weighted[0].game;
                    for (const w of weighted) {
                        rand -= w.weight;
                        if (rand <= 0) { pick = w.game; break; }
                    }
                } else {
                    pick = filtered[Math.floor(Math.random() * filtered.length)];
                }

                const cards = document.querySelectorAll('.gallery-card');
                let target = null;
                for (const c of cards) { if (Number(c.dataset.gameId) === pick.id) { target = c; break; } }
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    target.classList.remove('highlight');
                    void target.offsetWidth;
                    target.classList.add('highlight');
                    setTimeout(() => target.classList.remove('highlight'), 3600);
                    const genreHint = preferredGenres.length > 0 && userData.played.length >= 3 ?
                        '（根据你的偏好推荐）' : '';
                    showToast(`🎲 今日推荐：${pick.title} ${genreHint}`, 2800);
                    celebrate();
                } else { showToast(`🎲 今日推荐：${pick.title} — ${pick.description || '暂无简介'}`, 3500); }
            }

            // ================================================================
            // 庆祝彩带 & 鼓掌音效
            // ================================================================
            let _confettiCanvas, _confettiCtx;
            let _ribbons = [];
            let _confettiAnimId = null;

            function initConfetti() {
                _confettiCanvas = document.getElementById('confettiCanvas');
                if (!_confettiCanvas) return;
                _confettiCtx = _confettiCanvas.getContext('2d');
                function resize() {
                    _confettiCanvas.width = window.innerWidth;
                    _confettiCanvas.height = window.innerHeight;
                }
                resize();
                window.addEventListener('resize', resize, { passive: true });
            }

            function fireConfetti(count) {
                if (!_confettiCanvas) return;
                count = count || 60;
                const colors = ['#e879a8', '#c084fc', '#fb7185', '#a78bfa', '#f472b6', '#818cf8', '#f9a8d4', '#c4b5fd'];
                for (let i = 0; i < count; i++) {
                    _ribbons.push({
                        x: Math.random() * _confettiCanvas.width,
                        y: -10 - Math.random() * 40,
                        w: 6 + Math.random() * 6,
                        h: 14 + Math.random() * 10,
                        color: colors[Math.floor(Math.random() * colors.length)],
                        vx: (Math.random() - 0.5) * 3,
                        vy: 2 + Math.random() * 3,
                        rot: Math.random() * Math.PI * 2,
                        rotV: (Math.random() - 0.5) * 0.2,
                        life: 1,
                        decay: 0.004 + Math.random() * 0.004,
                        sway: Math.random() * 2,
                        swayPhase: Math.random() * Math.PI * 2
                    });
                }
                if (!_confettiAnimId) animateConfetti();
            }

            function animateConfetti() {
                _confettiCtx.clearRect(0, 0, _confettiCanvas.width, _confettiCanvas.height);
                for (let i = _ribbons.length - 1; i >= 0; i--) {
                    const r = _ribbons[i];
                    r.x += r.vx + Math.sin(r.swayPhase) * r.sway * 0.1;
                    r.y += r.vy;
                    r.rot += r.rotV;
                    r.swayPhase += 0.03;
                    r.vy += 0.03;
                    r.life -= r.decay;
                    if (r.life <= 0 || r.y > _confettiCanvas.height + 20) {
                        _ribbons.splice(i, 1);
                        continue;
                    }
                    _confettiCtx.save();
                    _confettiCtx.translate(r.x, r.y);
                    _confettiCtx.rotate(r.rot);
                    _confettiCtx.globalAlpha = r.life;
                    _confettiCtx.fillStyle = r.color;
                    _confettiCtx.fillRect(-r.w / 2, -r.h / 2, r.w, r.h);
                    _confettiCtx.restore();
                }
                if (_ribbons.length > 0) {
                    _confettiAnimId = requestAnimationFrame(animateConfetti);
                } else {
                    _confettiAnimId = null;
                    _confettiCtx.clearRect(0, 0, _confettiCanvas.width, _confettiCanvas.height);
                }
            }

            let _applauseCtx = null;
            function playApplause() {
                try {
                    if (!_applauseCtx) _applauseCtx = new (window.AudioContext || window.webkitAudioContext)();
                    if (_applauseCtx.state === 'suspended') _applauseCtx.resume();
                    const duration = 1.2;
                    const sampleRate = _applauseCtx.sampleRate;
                    const length = sampleRate * duration;
                    const buffer = _applauseCtx.createBuffer(1, length, sampleRate);
                    const data = buffer.getChannelData(0);
                    for (let i = 0; i < length; i++) {
                        const t = i / sampleRate;
                        const envelope = Math.exp(-t * 4) * 0.3;
                        const clap = Math.random() * 2 - 1;
                        const burst = Math.sin(t * 800) * Math.exp(-t * 20) * 0.15;
                        data[i] = (clap * envelope + burst) * 0.35;
                    }
                    for (let b = 0; b < 5; b++) {
                        const start = Math.floor((0.05 + Math.random() * 0.8) * sampleRate);
                        const burstLen = Math.floor(sampleRate * 0.06);
                        for (let j = 0; j < burstLen && start + j < length; j++) {
                            const bt = j / sampleRate;
                            const be = Math.exp(-bt * 30) * 0.25;
                            data[start + j] += (Math.random() * 2 - 1) * be;
                        }
                    }
                    const source = _applauseCtx.createBufferSource();
                    source.buffer = buffer;
                    const gain = _applauseCtx.createGain();
                    gain.gain.value = 0.25;
                    source.connect(gain);
                    gain.connect(_applauseCtx.destination);
                    source.start();
                } catch (_) { }
            }

            function celebrate() {
                fireConfetti(60);
                playApplause();
            }

            // ================================================================
            // ★★★ 初始化 ★★★
            // ================================================================
            async function init() {
                loadSettings();
                loadUserData();

                const grid = document.getElementById('galleryGrid');
                if (grid) {
                    grid.innerHTML = '<div class="loading-spinner"><span class="spinner-icon">🐕</span><div class="loading-dog-trail"><span></span><span></span><span></span></div><div class="spinner-text">正在加载游戏数据...</div></div>';
                }

                const [, loadedGames] = await Promise.all([
                    loadCustomTagsFromStorage(),
                    loadGames()
                ]);
                games = loadedGames;

                resetActiveFilters();
                bindGlobalEvents();
                updateAdminUI();
                syncAutoReleasedGames(); // 管理员：发售日到期但未标记的游戏自动改为已发售
                if (currentView === 'series') {
                    renderSeriesView();
                } else {
                    renderGallery();
                }
                updateFilterUI();
                updateAchievementDot();

                initBackToTop();
                initAnnouncementBar();
                initGuideEvents();
                initAnnouncementModalEvents();
                initKeyboardShortcuts();
                initSystemThemeListener();
                initConfetti();
                initTopNavEvents();
                initAnnouncementEvents();
                initModLoadMoreEvent();

                document.addEventListener('click', function (e) {
                    if (!e.target.closest('.mod-admin-badge-menu')) {
                        document.querySelectorAll('.mod-admin-badge-dropdown.show').forEach(d => d.classList.remove('show'));
                    }
                });

                // 滚动位置记忆
                restoreScrollPosition();
                window.addEventListener('scroll', function () {
                    if (scrollTimeout) clearTimeout(scrollTimeout);
                    scrollTimeout = setTimeout(saveScrollPosition, 500);
                }, { passive: true });

                if (supabaseClient) {
                    supabaseClient.auth.onAuthStateChange((event, session) => {
                        // 邮箱重置链接落地：打开"设置新密码"弹窗
                        if (event === 'PASSWORD_RECOVERY') {
                            openResetPwModal();
                        }
                        // 用户信息变更（如更换邮箱确认后）：刷新显示
                        if (event === 'USER_UPDATED' && session) {
                            const el = document.getElementById('profileEmailCurrent');
                            if (el && session.user) el.textContent = session.user.email ? `（当前：${session.user.email}）` : '';
                        }
                        if (session) {
                            currentUser = session.user;
                            updateUIForLoggedIn(currentUser);
                            updateAdminUI();
                            initNotifSystem();
                            const overlay = document.getElementById('authModalOverlay');
                            if (overlay.classList.contains('show')) {
                                closeAuthModal();
                            }
                            // 初始同步由 init() 中的 getSession() 处理，此处不再重复
                        } else {
                            currentUser = null;
                            _dbAdminConfirmed = null;
                            isAdmin = false;
                            isAdminMode = false;
                            updateUIForLoggedOut();
                            document.getElementById('notifBellWrap').style.display = 'none';
                            _unreadCount = 0;
                            updateNotifBadge();
                            if (_notifListener) {
                                supabaseClient.removeChannel(_notifListener);
                                _notifListener = null;
                            }
                            if (modListener) {
                                supabaseClient.removeChannel(modListener);
                                modListener = null;
                            }
                        }
                    });

                    const { data: { session } } = await supabaseClient.auth.getSession();
                    if (session) {
                        currentUser = session.user;
                        updateUIForLoggedIn(currentUser);
                        updateAdminUI();
                        initNotifSystem();
                        // 初始同步延迟500ms，避免与其他初始化竞争
                        setTimeout(() => {
                            syncUserDataWithCloud().then(() => _processPendingCloudOps()).catch(e => console.warn('[Sync] 初始同步失败:', e.message));
                        }, 500);
                    } else {
                        updateUIForLoggedOut();
                    }
                } else {
                    updateUIForLoggedOut();
                    console.warn('Supabase 未启用，认证功能不可用');
                }

                const hasDetail = handleRouteFromURL();
                if (!hasDetail) {
                    const url = new URL(window.location);
                    if (url.searchParams.has('game')) {
                        url.searchParams.delete('game');
                        window.history.replaceState({ gameId: null }, '', url.toString());
                    }
                    if (url.searchParams.has('gameTitle')) {
                        url.searchParams.delete('gameTitle');
                        window.history.replaceState({ gameId: null }, '', url.toString());
                    }
                }

                // 首次访问引导 + 公告弹窗
                const isFirstVisit = localStorage.getItem(GUIDE_KEY) !== 'true';
                if (isFirstVisit) {
                    setTimeout(showGuide, 800);
                } else {
                    // 非首次访问：异步拉取公告并判断是否显示
                    loadAndShowAnnouncement().then(shouldShow => {
                        if (shouldShow) {
                            setTimeout(showAnnouncementModal, 800);
                        }
                    });
                }

                console.log('✅ Her Lens 已启动（性能优化 + 引导 + 快捷键）');
                console.log(`📊 共加载 ${games.length} 款游戏`);
                console.log(`📋 愿望单 ${userData.wishlist.length} 款，玩过 ${userData.played.length} 款`);
                console.log(`🏆 已解锁 ${userData.achievements.length} / ${ACHIEVEMENTS.length} 项成就`);
                console.log(`📝 已评论 ${userData.reviews.length} 款游戏`);
                console.log(`📱 触摸设备: ${isTouchDevice ? '是 (已禁用高耗能特效)' : '否'}`);
                console.log(`🔐 认证状态: ${currentUser ? '已登录 (' + currentUser.email + ')' : '未登录'}`);
                console.log(`🎨 主题: ${currentTheme}`);
                console.log(`⌨️ 快捷键: /搜索 · 1/2切换 · R随机 · ?帮助`);

                if (currentUser) {
                    let _lastSyncTime = 0;
                    const MIN_SYNC_INTERVAL = 30 * 60 * 1000;

                    setInterval(() => {
                        if (document.visibilityState === 'visible' && currentUser) {
                            const now = Date.now();
                            if (now - _lastSyncTime < MIN_SYNC_INTERVAL) return;
                            _lastSyncTime = now;
                            syncUserDataWithCloud().then(() => _processPendingCloudOps()).catch(e => console.warn('[Sync] 定时同步失败:', e.message));
                        }
                    }, 300000);

                    document.addEventListener('visibilitychange', function () {
                        if (document.visibilityState === 'visible' && currentUser) {
                            const now = Date.now();
                            if (now - _lastSyncTime >= MIN_SYNC_INTERVAL) {
                                _lastSyncTime = now;
                                syncUserDataWithCloud().then(() => _processPendingCloudOps()).catch(e => console.warn('[Sync] 可见性同步失败:', e.message));
                            } else if (_pendingCloudOps.length > 0) {
                                _processPendingCloudOps();
                            }
                        }
                    });
                }
            }

            let scrollTimeout = null;

            if ('serviceWorker' in navigator) {
                navigator.serviceWorker.getRegistrations().then(function (registrations) {
                    for (let registration of registrations) {
                        registration.unregister();
                    }
                }).catch(function () { });
            }

            init();
        })();
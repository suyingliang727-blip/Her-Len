/* ================================================================
 * 知识答题页逻辑（quiz.html）
 * - 两个题库：女性权益与女性游戏 / 女性生理健康知识
 * - 每次随机抽取 20 题，答对 80%（16题）即通过
 * - 通过后写入 localStorage 并同步到 Supabase 用户元数据
 * - 自动跳回 index.html?quiz=passed
 * ================================================================ */
(function () {
    'use strict';

    // ---------- Supabase 配置（与主站一致） ----------
    const SUPABASE_URL = 'https://tydbvpmigvzsnlmsjuby.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5ZGJ2cG1pZ3Z6c25sbXNqdWJ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE3MjkwMTIsImV4cCI6MjA5NzMwNTAxMn0.AyMX8M24S3biHmmE2DMEPk9Ti93w0VHooQl5ox5YL2g';
    let supabaseClient = null;
    if (typeof supabase !== 'undefined') {
        try {
            supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
                auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
            });
        } catch (e) { supabaseClient = null; }
    }

    // ================================================================
    // 题库一：女性权益与女性游戏
    // ================================================================
    const QUESTIONS_GAMES = [
        {
            q: '《古墓丽影》系列的女主角是谁？',
            options: ['劳拉·克罗夫特', '艾莉·威廉姆斯', '克莱尔·雷德菲尔德', '吉尔·瓦伦丁'],
            answer: 0
        },
        {
            q: '下列哪款游戏的女主角是艾莉（Ellie）？',
            options: ['《地平线：零之曙光》', '《最后生还者》', '《控制》', '《超越善恶》'],
            answer: 1
        },
        {
            q: '"女性主角游戏"倡导的核心价值是？',
            options: ['只面向女性玩家', '以女性视角与体验为核心进行叙事', '所有角色必须是女性', '禁止男性角色出场'],
            answer: 1
        },
        {
            q: '在游戏文化中，"物化女性"通常指？',
            options: ['女性角色担任主角', '将女性角色简化为外貌/性吸引力符号而非完整人物', '让女性角色拥有强大能力', '女性角色出现在战斗场景'],
            answer: 1
        },
        {
            q: '《地平线：零之曙光》的女主角名字是？',
            options: ['艾莉', '埃洛伊 (Aloy)', '马克斯', '洁德'],
            answer: 1
        },
        {
            q: '贝优妮塔（Bayonetta）系列的开发商是？',
            options: ['顽皮狗', '白金工作室', '卡普空', '育碧'],
            answer: 1
        },
        {
            q: '下列哪项是"贝克德尔测试"（Bechdel Test）的判断标准？',
            options: ['作品中必须有女性主角', '作品中至少有两个女性角色，且她们谈论除男性以外的话题', '作品中女性角色数量多于男性', '作品中没有暴力元素'],
            answer: 1
        },
        {
            q: '《奇异人生》（Life is Strange）的女主角拥有的能力是？',
            options: ['飞行', '隐身', '时空回溯', '念力'],
            answer: 2
        },
        {
            q: '推动游戏行业增加女性主角比例的最主要意义是？',
            options: ['提高销量', '让更多元的视角与女性体验被看见与表达', '降低开发成本', '替代男性角色'],
            answer: 1
        },
        {
            q: '《控制》中女主角杰西·法登的职务是？',
            options: ['联邦调查局探员', '联邦控制局(FBC)局长', '特工组织成员', '私人侦探'],
            answer: 1
        },
        {
            q: '下列哪种做法有助于改善游戏中女性角色的刻画？',
            options: ['仅强调外貌设计', '赋予女性角色独立的目标、动机与成长弧光', '让女性角色只担任辅助', '减少女性角色台词'],
            answer: 1
        },
        {
            q: '"玻璃悬崖"（Glass Cliff）现象指？',
            options: ['女性无法进入职场', '女性更易在组织危机时被推上高风险领导岗位', '女性工资低于男性', '女性晋升通道被阻断'],
            answer: 1
        },
        {
            q: '《生化危机》系列中，下列哪个角色不是女性？',
            options: ['克莱尔', '吉尔', '艾达·王', '里昂'],
            answer: 3
        },
        {
            q: '旨在提升对女性权益关注、定在每年3月8日的是？',
            options: ['国际劳动节', '国际妇女节', '母亲节', '感恩节'],
            answer: 1
        },
        {
            q: '《超越善恶》的女主角名叫？',
            options: ['洁德 (Jade)', '塞努雅', '卡珊德拉', '阿米西亚'],
            answer: 0
        },
        {
            q: '在游戏评测中，"男性凝视"（Male Gaze）镜头通常指？',
            options: ['以男性为主角的叙事', '以异性恋男性视角设计的、强调女性身体被观看的镜头语言', '所有包含女性的画面', '男性角色的第一人称视角'],
            answer: 1
        },
        {
            q: '《地狱之刃：塞娜的献祭》的女主角 Senua 深刻刻画了什么？',
            options: ['她的复仇之路', '她的心理创伤与精神病痛', '她的政治斗争', '她的太空冒险'],
            answer: 1
        },
        {
            q: '"象征性女性"（Smurfette Principle）指？',
            options: ['女性角色担任反派', '一群男性角色中仅有一个女性角色的现象', '女性角色数量多于男性', '所有女性角色长得一样'],
            answer: 1
        },
        {
            q: '在游戏社区中反对"荡妇羞辱"的目的在于？',
            options: ['鼓励私密讨论', '反对以私生活/着装贬低女性，维护平等尊重的讨论环境', '禁止讨论女性角色', '限制女性发言'],
            answer: 1
        },
        {
            q: '推动"女性向"游戏发展的同时，应避免的误区是？',
            options: ['关注女性玩家的偏好', '将"女性向"等同于低难度或只关注恋爱', '增加女性主角', '丰富叙事视角'],
            answer: 1
        },
        {
            q: '《最后生还者 第二部》中艾莉的核心动机主要围绕？',
            options: ['复仇与执念的代价', '寻找宝藏', '拯救世界', '建立国家'],
            answer: 0
        },
        {
            q: '下列哪款游戏由女性主角阿米西亚带领弟弟雨果在中世纪瘟疫中求生？',
            options: ['《瘟疫传说：无罪》', '《古墓丽影》', '《控制》', '《死亡搁浅》'],
            answer: 0
        },
        {
            q: '关于女性游戏角色的"服设合理性"，下列说法正确的是？',
            options: ['铠甲越暴露防御越高', '服设应与角色所处环境/战斗需求相匹配', '女性角色必须穿裙装', '战斗服越紧身越好'],
            answer: 1
        },
        {
            q: '"游戏中的性别刻板印象"常见表现是？',
            options: ['女性角色职业多样', '女性角色多为治疗/辅助、男性为战士', '男女角色能力均衡', '女性角色可担任多种职业'],
            answer: 1
        },
        {
            q: '支持女性主角游戏创作的根本理由是？',
            options: ['它能带来更丰富、真实且多元的故事体验', '它能降低游戏开发成本', '它能取代男性向游戏', '它只是为了营销'],
            answer: 0
        }
    ];

    // ================================================================
    // 题库二：女性生理健康知识（侧重女性本身，少涉及怀孕）
    // ================================================================
    const QUESTIONS_HEALTH = [
        {
            q: '正常月经周期的平均天数约为？',
            options: ['21天', '28天', '40天', '15天'],
            answer: 1
        },
        {
            q: '月经周期的计算起点是？',
            options: ['本次月经来潮的第一天', '排卵日', '上次月经结束那天', '月中固定日期'],
            answer: 0
        },
        {
            q: '女性在绝经后，哪种微量元素会大量流失、需重点补充？',
            options: ['锌', '钙', '钠', '钾'],
            answer: 1
        },
        {
            q: '女性出现"心下痛"（剑突下/上腹部疼痛）时，最应警惕的疾病是？',
            options: ['急性胃肠炎', '心肌梗死（心脏病）', '胆囊炎', '消化不良'],
            answer: 1
        },
        {
            q: '女性心绞痛/心梗最常伴随的"非典型症状"是？',
            options: ['剧烈胸痛放射左臂', '恶心、气短、极度疲乏', '高热寒战', '咯血'],
            answer: 1
        },
        {
            q: '与男性相比，女性心脏病的常见症状更常表现为？',
            options: ['颈部/下颌/背部疼痛伴气短', '无症状', '持续打嗝', '视力模糊'],
            answer: 0
        },
        {
            q: '排卵通常发生在月经周期的？',
            options: ['月经刚结束时', '下次月经前约14天', '月经来潮当天', '周期正中间且固定不变'],
            answer: 1
        },
        {
            q: '女性基础体温在排卵后会？',
            options: ['下降约0.5℃', '升高约0.3-0.5℃', '保持不变', '剧烈波动'],
            answer: 1
        },
        {
            q: '经前综合征（PMS）的常见表现不包括？',
            options: ['乳房胀痛', '情绪波动', '持续高热不退', '腹胀乏力'],
            answer: 2
        },
        {
            q: '铁缺乏在育龄女性中更常见，主要原因是？',
            options: ['饮食不规律', '月经失血', '运动过量', '睡眠不足'],
            answer: 1
        },
        {
            q: '女性自然绝经的平均年龄约为？',
            options: ['40岁左右', '50岁左右（45-55岁）', '60岁左右', '35岁左右'],
            answer: 1
        },
        {
            q: '预防女性骨质疏松，最关键的骨量积累时期是？',
            options: ['绝经后才开始', '青春期至30岁前积累骨峰值', '50岁以后', '出现骨折后'],
            answer: 1
        },
        {
            q: '乳腺癌自检建议的频率是？',
            options: ['每月一次', '每年一次', '每三天一次', '无需自检'],
            answer: 0
        },
        {
            q: '宫颈癌的主要致病因素是？',
            options: ['细菌感染', '高危型HPV（人乳头瘤病毒）持续感染', '遗传突变', '空气污染'],
            answer: 1
        },
        {
            q: 'HPV疫苗最佳的接种时机是？',
            options: ['首次性行为前', '确诊宫颈癌后', '绝经后', '任意年龄效果相同'],
            answer: 0
        },
        {
            q: '女性尿道较短，因此更易发生？',
            options: ['尿路感染', '肾结石', '膀胱癌', '尿失禁'],
            answer: 0
        },
        {
            q: '多囊卵巢综合征（PCOS）的典型表现是？',
            options: ['月经稀发、多毛、痤疮', '持续高热', '血压骤降', '关节疼痛'],
            answer: 0
        },
        {
            q: '女性在经期进行运动，正确的做法是？',
            options: ['完全卧床休息', '选择低强度有氧，避免倒立与剧烈腹压运动', '进行高强度力量训练', '只做倒立动作'],
            answer: 1
        },
        {
            q: '关于女性盆底肌训练（凯格尔运动），下列说法正确的是？',
            options: ['只对男性有效', '可改善轻度压力性尿失禁', '会导致肌肉萎缩', '必须在医院进行'],
            answer: 1
        },
        {
            q: '女性甲状腺疾病发病率高于男性，最相关的因素是？',
            options: ['雄激素水平', '雌激素水平与自身免疫机制', '运动量少', '饮水量'],
            answer: 1
        },
        {
            q: '女性发生缺铁性贫血时，下列哪类食物补铁效率最高？',
            options: ['菠菜', '红肉、动物肝脏、动物血', '牛奶', '苹果'],
            answer: 1
        },
        {
            q: '关于女性痛经，下列说法正确的是？',
            options: ['所有痛经都正常，无需就医', '继发性痛经（如子宫内膜异位症）需就医排查', '痛经必须吃止痛药一辈子', '痛经与情绪无关'],
            answer: 1
        },
        {
            q: '女性在月经期，下列哪种做法不利于健康？',
            options: ['注意保暖', '保持充足睡眠', '过度节食减肥', '适度低强度运动'],
            answer: 2
        },
        {
            q: '关于女性乳腺健康，下列说法错误的是？',
            options: ['定期自查与筛查有助于早发现', '只有老年女性才需关注', '乳腺增生多为良性', '发现异常肿块应及时就诊'],
            answer: 1
        },
        {
            q: '女性在不同生理阶段（青春期、孕期、哺乳期、绝经期）营养需求？',
            options: ['完全相同', '各阶段差异较大，应针对性调整', '只需补钙', '无需关注'],
            answer: 1
        }
    ];

    // ---------- 配置 ----------
    const PASS_THRESHOLD = 0.8;        // 80% 通过
    const QUIZ_LENGTH = 20;            // 每次答题题数

    // ---------- 状态 ----------
    let currentBank = null;            // 'games' | 'health'
    let currentQuestions = [];         // 本次抽中的题目
    let userAnswers = [];              // 用户每题选择（-1=未答）
    let currentIndex = 0;
    let answered = false;              // 是否已提交查看答案

    // ---------- 工具：洗牌 ----------
    function shuffle(arr) {
        const a = arr.slice();
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    }

    // ---------- 小提示 ----------
    let toastTimer = null;
    function showToast(msg, ms) {
        const el = document.getElementById('toastMini');
        if (!el) return;
        el.textContent = msg;
        el.classList.add('show');
        if (toastTimer) clearTimeout(toastTimer);
        toastTimer = setTimeout(() => el.classList.remove('show'), ms || 2000);
    }

    // ---------- 已通过检测（必须基于当前登录用户，防止切换账号串号） ----------
    async function getCurrentLoginUser() {
        if (!supabaseClient) return null;
        try {
            const { data: { user } } = await supabaseClient.auth.getUser();
            return user || null;
        } catch (e) { return null; }
    }
    async function hasAlreadyPassed() {
        const user = await getCurrentLoginUser();
        if (!user) return false;
        if (user.user_metadata && user.user_metadata.quiz_passed) return true;
        try {
            if (localStorage.getItem('quiz_passed_' + user.id) === 'true') return true;
        } catch (e) {}
        return false;
    }

    // ---------- 屏幕切换 ----------
    function showScreen(id) {
        ['screenCategory', 'screenQuiz', 'screenResult'].forEach(s => {
            const el = document.getElementById(s);
            if (el) el.style.display = (s === id) ? '' : 'none';
        });
        const loading = document.getElementById('quizLoading');
        if (loading) loading.style.display = 'none';
    }

    // ---------- 开始答题 ----------
    function startQuiz(cat) {
        currentBank = cat;
        const bank = cat === 'games' ? QUESTIONS_GAMES : QUESTIONS_HEALTH;
        // 抽取 QUIZ_LENGTH 题（题库不足则全取）
        currentQuestions = shuffle(bank).slice(0, Math.min(QUIZ_LENGTH, bank.length));
        userAnswers = currentQuestions.map(() => -1);
        currentIndex = 0;
        answered = false;
        showScreen('screenQuiz');
        renderQuestion();
    }

    // ---------- 渲染单题 ----------
    function renderQuestion() {
        const q = currentQuestions[currentIndex];
        document.getElementById('questionText').textContent = (currentIndex + 1) + '. ' + q.q;

        // 进度
        const answeredCount = userAnswers.filter(a => a >= 0).length;
        const pct = (answeredCount / currentQuestions.length) * 100;
        document.getElementById('progressFill').style.width = pct + '%';
        document.getElementById('progressText').textContent =
            (currentIndex + 1) + ' / ' + currentQuestions.length;

        // 选项
        const list = document.getElementById('optionsList');
        list.innerHTML = '';
        const markers = ['A', 'B', 'C', 'D', 'E', 'F'];
        q.options.forEach((opt, idx) => {
            const li = document.createElement('li');
            li.className = 'option-item';
            if (answered) {
                if (idx === q.answer) li.classList.add('correct');
                else if (idx === userAnswers[currentIndex]) li.classList.add('wrong');
            } else if (userAnswers[currentIndex] === idx) {
                li.classList.add('selected');
            }
            li.innerHTML = '<span class="opt-marker">' + (markers[idx] || (idx + 1)) + '</span><span>' + escapeHtml(opt) + '</span>';
            if (!answered) {
                li.addEventListener('click', () => {
                    userAnswers[currentIndex] = idx;
                    renderQuestion();
                });
            }
            list.appendChild(li);
        });

        // 导航按钮
        const btnPrev = document.getElementById('btnPrev');
        const btnNext = document.getElementById('btnNext');
        btnPrev.disabled = currentIndex === 0;
        if (answered) {
            btnNext.textContent = currentIndex === currentQuestions.length - 1 ? '查看结果' : '下一题';
        } else {
            btnNext.textContent = currentIndex === currentQuestions.length - 1 ? '提交' : '下一题';
        }
    }

    function escapeHtml(s) {
        return String(s).replace(/[&<>"']/g, c => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        }[c]));
    }

    // ---------- 上一题/下一题 ----------
    function goPrev() {
        if (currentIndex > 0) { currentIndex--; renderQuestion(); }
    }
    function goNext() {
        if (userAnswers[currentIndex] < 0) {
            showToast('请先选择一个答案', 1500);
            return;
        }
        // 最后一题：未提交则提交并查看本题正确答案；已提交则进入结果
        if (currentIndex === currentQuestions.length - 1) {
            if (!answered) {
                answered = true;
                renderQuestion();
                // 提供查看结果入口
                document.getElementById('btnNext').textContent = '查看结果';
                return;
            }
            showResult();
            return;
        }
        currentIndex++;
        renderQuestion();
    }

    // ---------- 计分与结果 ----------
    function calcScore() {
        let correct = 0;
        currentQuestions.forEach((q, i) => { if (userAnswers[i] === q.answer) correct++; });
        return { correct, total: currentQuestions.length, ratio: correct / currentQuestions.length };
    }

    async function showResult() {
        const { correct, total, ratio } = calcScore();
        const passed = ratio >= PASS_THRESHOLD;

        document.getElementById('resultIcon').textContent = passed ? '🎉' : '💪';
        document.getElementById('resultTitle').textContent = passed ? '答题通过！' : '差一点点';
        document.getElementById('resultScore').textContent = correct + ' / ' + total;

        const actions = document.getElementById('resultActions');
        actions.innerHTML = '';

        if (passed) {
            document.getElementById('quizLoading').style.display = '';
            const user = await getCurrentLoginUser();
            let syncedOk = false;

            if (!user) {
                // 未登录：不写入任何状态（避免退出登录后串号），提示用户登录后再完成
                document.getElementById('quizLoading').style.display = 'none';
                document.getElementById('resultHint').innerHTML =
                    '答题分数合格，但尚未检测到登录账号。<br>请先登录后再返回本页完成同步，评论功能即可解锁。';
                const loginBtn = document.createElement('button');
                loginBtn.className = 'quiz-btn quiz-btn-primary';
                loginBtn.textContent = '去登录';
                loginBtn.addEventListener('click', () => { window.location.href = 'index.html#auth=open'; });
                const retrySync = document.createElement('button');
                retrySync.className = 'quiz-btn quiz-btn-secondary';
                retrySync.textContent = '登录后再同步';
                retrySync.addEventListener('click', () => showResult());
                const homeBtn = document.createElement('button');
                homeBtn.className = 'quiz-btn quiz-btn-secondary';
                homeBtn.textContent = '返回首页';
                homeBtn.addEventListener('click', () => goHome(false));
                actions.appendChild(loginBtn);
                actions.appendChild(retrySync);
                actions.appendChild(homeBtn);
            } else {
                // 已登录：同步云端，同步成功后才写入专属本地 key
                syncedOk = await syncPassToCloud(user);
                document.getElementById('quizLoading').style.display = 'none';

                if (syncedOk) {
                    document.getElementById('resultHint').textContent =
                        '评论、评分、回复功能已解锁，正在为你返回首页…';
                    const backBtn = document.createElement('button');
                    backBtn.className = 'quiz-btn quiz-btn-primary';
                    backBtn.textContent = '返回首页';
                    backBtn.addEventListener('click', () => goHome(true));
                    actions.appendChild(backBtn);
                    setTimeout(() => goHome(true), 2600);
                } else {
                    document.getElementById('resultHint').innerHTML =
                        '答题通过，但同步到云端时失败。<br>请点击下方"重试同步"，确认同步成功后再返回解锁评论功能。';
                    const retryBtn = document.createElement('button');
                    retryBtn.className = 'quiz-btn quiz-btn-primary';
                    retryBtn.textContent = '重试同步';
                    retryBtn.addEventListener('click', () => showResult());
                    const homeBtn = document.createElement('button');
                    homeBtn.className = 'quiz-btn quiz-btn-secondary';
                    homeBtn.textContent = '暂不返回';
                    homeBtn.addEventListener('click', () => showToast('建议重试同步，否则评论功能无法解锁', 3000));
                    actions.appendChild(retryBtn);
                    actions.appendChild(homeBtn);
                }
            }
        } else {
            document.getElementById('resultHint').textContent =
                '答对 ' + correct + ' 题，需答对 ' + Math.ceil(total * PASS_THRESHOLD) + ' 题通过。可以再试一次～';
            const retryBtn = document.createElement('button');
            retryBtn.className = 'quiz-btn quiz-btn-primary';
            retryBtn.textContent = '再答一次';
            retryBtn.addEventListener('click', () => startQuiz(currentBank));
            const switchBtn = document.createElement('button');
            switchBtn.className = 'quiz-btn quiz-btn-secondary';
            switchBtn.textContent = '换个分类';
            switchBtn.addEventListener('click', () => { showScreen('screenCategory'); });
            const homeBtn = document.createElement('button');
            homeBtn.className = 'quiz-btn quiz-btn-secondary';
            homeBtn.textContent = '返回首页';
            homeBtn.addEventListener('click', () => goHome(false));
            actions.appendChild(retryBtn);
            actions.appendChild(switchBtn);
            actions.appendChild(homeBtn);
        }
        showScreen('screenResult');
    }

    // ---------- 同步通过状态到 Supabase ----------
    // 注意：同步成功才写本地专属 key，且不写通用 quiz_passed key，防止切换账号串号
    async function syncPassToCloud(user) {
        if (!supabaseClient || !user) return false;
        try {
            const { error } = await supabaseClient.auth.updateUser({
                data: { quiz_passed: true, quiz_passed_at: new Date().toISOString() }
            });
            if (error) { console.warn('同步失败:', error); return false; }
            try { localStorage.setItem('quiz_passed_' + user.id, 'true'); } catch (e) {}
            // 同步成功后也写一份全局 quiz_passed 作为当前会话的加速判断
            // 但 app.js 的 hasPassedQuiz 不读取它，登出时也会被清除，不会串号
            try { localStorage.setItem('quiz_passed', 'true'); } catch (e) {}
            return true;
        } catch (e) {
            console.warn('答题状态同步失败:', e);
            return false;
        }
    }

    function goHome(passed) {
        if (passed) window.location.href = 'index.html?quiz=passed';
        else window.location.href = 'index.html';
    }

    // ---------- 绑定事件 ----------
    document.querySelectorAll('.category-card').forEach(card => {
        card.addEventListener('click', () => startQuiz(card.dataset.cat));
    });
    document.getElementById('btnPrev').addEventListener('click', goPrev);
    document.getElementById('btnNext').addEventListener('click', goNext);

    // 键盘支持
    document.addEventListener('keydown', (e) => {
        if (document.getElementById('screenQuiz').style.display === 'none') return;
        if (e.key === 'ArrowLeft') goPrev();
        else if (e.key === 'ArrowRight' || e.key === 'Enter') goNext();
        else if (['1', '2', '3', '4'].includes(e.key)) {
            const idx = parseInt(e.key, 10) - 1;
            const q = currentQuestions[currentIndex];
            if (q && idx < q.options.length && !answered) {
                userAnswers[currentIndex] = idx;
                renderQuestion();
            }
        }
    });

    // 若当前登录账号已通过，展示提示（必须按登录用户判定，避免串号）
    hasAlreadyPassed().then(passed => {
        if (passed) {
            const cat = document.getElementById('screenCategory');
            if (cat) {
                const note = document.createElement('p');
                note.className = 'quiz-subtitle';
                note.style.marginTop = '12px';
                note.innerHTML = '✅ 当前账号已通过答题，评论功能已解锁。<br>如需重新答题，仍可选择下方分类。';
                cat.appendChild(note);
            }
        }
    }).catch(() => {});
})();

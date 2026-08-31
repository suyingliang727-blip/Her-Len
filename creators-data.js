/* ================================================================
 * Her Lens 「她们」数据
 * teams: 主创团队 / bloggers: 游戏博主
 * bloggers 数据由 bloggers.html / claw.html 从 Supabase 云端加载，
 * 本文件仅保留 teams 占位数据（teams.html 暂未上线）。
 * ================================================================ */
(function () {
    window.HerlensCreators = {
        meta: { sample: false, updatedAt: '2026-08-23' },

        teams: [
            {
                id: 't1',
                name: '月屿工作室',
                logoText: '月',
                founded: 2018,
                place: '上海 · 12 人',
                story: '由几位在游戏行业深耕多年的女性开发者创立的独立团队，专注于叙事驱动的冒险游戏，相信温柔而坚定的故事同样拥有打动人心的力量。',
                members: [
                    { name: '阿澈', role: '制作人 / 编剧', note: '前大厂叙事设计师' },
                    { name: '小满', role: '美术总监', note: '水彩风格探索者' },
                    { name: 'Nana', role: '主程序', note: 'Unity / Godot 双修' }
                ],
                works: [
                    { gameId: null, title: '潮汐之上', year: 2021 },
                    { gameId: null, title: '长夜灯', year: 2024 }
                ],
                links: [{ label: '官方网站', url: '#' }, { label: '微博', url: '#' }]
            },
            {
                id: 't2',
                name: '白昼信号',
                logoText: '信',
                founded: 2020,
                place: '成都 · 6 人',
                story: '一支全女性阵容的微型团队，两人同时身兼数职。代表作以都市怪谈为题材，擅长用像素画面讲述当代年轻人的心事。',
                members: [
                    { name: '周周', role: '制作人 / 程序', note: '一个人就是一支队伍' },
                    { name: 'Momo', role: '像素美术', note: '深夜动画爱好者' }
                ],
                works: [
                    { gameId: null, title: '便利店夜班', year: 2022 }
                ],
                links: [{ label: 'itch.io', url: '#' }, { label: 'B站', url: '#' }]
            },
            {
                id: 't3',
                name: '远山回声',
                logoText: '山',
                founded: 2015,
                place: '北京 · 20 人',
                story: '从同人社团成长起来的中型团队，核心成员多为女性。关注自然与人文题材，作品多次入选独立游戏展会。',
                members: [
                    { name: '林一', role: '创意总监', note: '地理学出身，地图控' },
                    { name: '苏叶', role: '音频总监', note: '田野录音收集者' }
                ],
                works: [
                    { gameId: null, title: '候鸟车站', year: 2019 },
                    { gameId: null, title: '雪线', year: 2023 }
                ],
                links: [{ label: '官方网站', url: '#' }]
            }
        ],

        bloggers: []
    };
})();

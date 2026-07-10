/**
 * role-manager.js — 角色状态管理公共模块
 * 
 * 管理当前用户的角色（客户经理 / 管理员）和模拟的组织层级。
 * 所有页面通过此模块读取角色信息来决定界面展示逻辑。
 * 
 * 使用方式：
 *   在页面底部引入 <script src="js/role-manager.js"></script>
 *   通过 RoleManager.getRole() 获取当前角色
 *   通过 RoleManager.isAdmin() 判断是否管理员
 */

var RoleManager = (function () {
    'use strict';

    // 存储键名
    var STORAGE_KEY = 'smart_marketing_role';

    // 角色常量
    var ROLE = {
        MANAGER: 'MANAGER',
        ADMIN: 'ADMIN'
    };

    // 模拟的组织架构数据（演示用）
    // region: 地域关键词数组，用于按地域分配时匹配企业地址
    var MOCK_ORG_TREE = {
        id: 'hq',
        name: '平安银行江苏省分行',
        levelName: '省分行',
        type: 'org',
        region: ['江苏'],
        children: [
            {
                id: 'branch_sz',
                name: '平安银行苏州市分行',
                levelName: '市分行',
                type: 'org',
                region: ['苏州'],
                children: [
                    {
                        id: 'sub_yq',
                        name: '平安银行园区支行',
                        levelName: '区县支行',
                        type: 'org',
                        region: ['工业园区', '园区'],
                        children: [
                            {
                                id: 'outlet_hd',
                                name: '平安银行湖东网点',
                                levelName: '网点',
                                type: 'org',
                                region: ['湖东'],
                                children: [
                                    {
                                        id: 'team_hd_1', name: '营销一组', type: 'team',
                                        children: [
                                            { id: 'mgr_zhang', name: '张三', type: 'manager' },
                                            { id: 'mgr_li', name: '李四', type: 'manager' }
                                        ]
                                    },
                                    {
                                        id: 'team_hd_2', name: '营销二组', type: 'team',
                                        children: [
                                            { id: 'mgr_wang', name: '王五', type: 'manager' }
                                        ]
                                    }
                                ]
                            },
                            {
                                id: 'outlet_hx',
                                name: '平安银行湖西网点',
                                levelName: '网点',
                                type: 'org',
                                region: ['湖西'],
                                children: [
                                    {
                                        id: 'team_hx_1', name: '综合营销组', type: 'team',
                                        children: [
                                            { id: 'mgr_sun', name: '孙七', type: 'manager' }
                                        ]
                                    }
                                ]
                            },
                            // 支行直属客户经理（未建分组）
                            { id: 'mgr_zhao', name: '赵六', type: 'manager' }
                        ]
                    },
                    {
                        id: 'sub_gs',
                        name: '平安银行姑苏支行',
                        levelName: '区县支行',
                        type: 'org',
                        region: ['姑苏'],
                        children: [
                            { id: 'mgr_qian', name: '钱八', type: 'manager' }
                        ]
                    },
                    {
                        id: 'sub_wz',
                        name: '平安银行吴中支行',
                        levelName: '区县支行',
                        type: 'org',
                        region: ['吴中'],
                        children: [
                            { id: 'mgr_zhou', name: '周九', type: 'manager' },
                            { id: 'mgr_wu', name: '吴十', type: 'manager' }
                        ]
                    }
                ]
            },
            {
                id: 'branch_nj',
                name: '平安银行南京市分行',
                levelName: '市分行',
                type: 'org',
                region: ['南京'],
                children: [
                    {
                        id: 'sub_jn',
                        name: '平安银行江宁支行',
                        levelName: '区县支行',
                        type: 'org',
                        region: ['江宁'],
                        children: [
                            { id: 'mgr_zheng', name: '郑十一', type: 'manager' }
                        ]
                    }
                ]
            },
            {
                id: 'branch_wx',
                name: '平安银行无锡市分行',
                levelName: '市分行',
                type: 'org',
                region: ['无锡'],
                children: []
            },
            {
                id: 'branch_cz',
                name: '平安银行常州市分行',
                levelName: '市分行',
                type: 'org',
                region: ['常州'],
                children: []
            },
            {
                id: 'branch_nt',
                name: '平安银行南通市分行',
                levelName: '市分行',
                type: 'org',
                region: ['南通'],
                children: []
            },
            {
                id: 'branch_tz',
                name: '平安银行泰州市分行',
                levelName: '市分行',
                type: 'org',
                region: ['泰州'],
                children: []
            },
            {
                id: 'branch_yz',
                name: '平安银行扬州市分行',
                levelName: '市分行',
                type: 'org',
                region: ['扬州'],
                children: []
            },
            {
                id: 'branch_yc',
                name: '平安银行盐城市分行',
                levelName: '市分行',
                type: 'org',
                region: ['盐城'],
                children: []
            }
        ]
    };

    // 预设的模拟角色配置（供选择页使用）
    var MOCK_PROFILES = [
        // 客户经理
        {
            role: ROLE.MANAGER,
            userId: 'mgr_zhang',
            userName: '张三',
            orgId: 'outlet_hd',
            orgName: '平安银行湖东网点',
            orgLevelName: '网点',
            avatar: '张'
        },
        // 管理员 - 总行级
        {
            role: ROLE.ADMIN,
            userId: 'admin_hq',
            userName: '王总',
            orgId: 'hq',
            orgName: '平安银行江苏省分行',
            orgLevelName: '省分行',
            avatar: '王'
        },
        // 管理员 - 分行级
        {
            role: ROLE.ADMIN,
            userId: 'admin_sz',
            userName: '李局长',
            orgId: 'branch_sz',
            orgName: '平安银行苏州市分行',
            orgLevelName: '市分行',
            avatar: '李'
        },
        // 管理员 - 支行级
        {
            role: ROLE.ADMIN,
            userId: 'admin_yq',
            userName: '刘行长',
            orgId: 'sub_yq',
            orgName: '平安银行园区支行',
            orgLevelName: '区县支行',
            avatar: '刘'
        },
        // 管理员 - 网点级
        {
            role: ROLE.ADMIN,
            userId: 'admin_hd',
            userName: '陈主任',
            orgId: 'outlet_hd',
            orgName: '平安银行湖东网点',
            orgLevelName: '网点',
            avatar: '陈'
        }
    ];

    // 数据存储键名
    var ALLOC_KEY = 'smart_marketing_allocs';
    var ENTERPRISE_KEY = 'smart_marketing_enterprises';

    /**
     * 企业数据库（以 USCC 为唯一标识，共 10 家去重企业，含 3 家跨产品重叠）
     *
     * 字段说明：
     *   matchedProducts: 适配产品列表，status='active' 当前批次满足，'expired' 已不满足
     *   assignments: 分配记录（多人共管），每条代表一次分配关系，追加不覆盖
     *   rs/bs: 企业级营销状态，任何关联经理均可修改
     *   timeline: 共享营销时间轴，所有关联经理可见可写
     *
     * 重叠企业（同一 USCC 被多产品/批次圈中）：
     *   苏州智云 (MA1EXAMPLE1)：橙业贷 + 厂房贷
     *   苏州纳米 (MA7EXAMPLE7)：厂房贷 + 税务贷
     *   无锡光电 (MA3EXAMPLE3)：厂房贷（active）+ 橙业贷（expired）
     */
    var DEFAULT_ENTERPRISES = [
        {
            uscc: '91320594MA1EXAMPLE1',
            name: '苏州智云科技有限公司',
            addr: '江苏省苏州市工业园区星湖街5号',
            ds: 92, src: '',
            rs: 'PENDING', bs: 'NONE',
            matchedProducts: [
                { product: '平安银行橙业贷', batch: '橙业贷20160508', status: 'active' },
                { product: '平安银行厂房贷', batch: '厂房贷20160501', status: 'active' }
            ],
            assignments: [
                { product: '平安银行橙业贷', batch: '橙业贷20160508', ownerOrgId: 'hq', ownerOrgPath: ['hq'], allocTime: '2026-04-01 09:00' }
            ],
            timeline: []
        },
        {
            uscc: '91320594MA5EXAMPLE5',
            name: '苏州生物医药研究院有限公司',
            addr: '江苏省苏州市工业园区独墅湖大道88号',
            ds: 81, src: '手动',
            rs: 'UNREACHED_NO_ANSWER', bs: 'NONE',
            matchedProducts: [
                { product: '平安银行橙业贷', batch: '橙业贷20160508', status: 'active' }
            ],
            assignments: [
                { product: '平安银行橙业贷', batch: '橙业贷20160508', ownerOrgId: 'hq', ownerOrgPath: ['hq'], allocTime: '2026-04-01 09:00' }
            ],
            timeline: [
                { time: '2026-04-10 10:30', actor: '张三', actorId: 'mgr_zhang', product: '橙业贷', action: '电话联系', note: '无人接听，明日再次拨打' }
            ]
        },
        {
            uscc: '91320412MA4EXAMPLE4',
            name: '常州新能源科技股份有限公司',
            addr: '江苏省常州市武进区高新区南区',
            ds: 72, src: '手动',
            rs: 'REACHED_NO_INTEREST', bs: 'NONE',
            matchedProducts: [
                { product: '平安银行橙业贷', batch: '橙业贷20160509', status: 'active' }
            ],
            assignments: [
                { product: '平安银行橙业贷', batch: '橙业贷20160509', ownerOrgId: 'hq', ownerOrgPath: ['hq'], allocTime: '2026-04-01 09:00' }
            ],
            timeline: [
                { time: '2026-04-12 14:00', actor: '李四', actorId: 'mgr_li', product: '橙业贷', action: '电话联系', note: '企业表示短期内无融资计划' }
            ]
        },
        {
            uscc: '91320115MA2EXAMPLE2',
            name: '南京创新智造集团有限公司',
            addr: '江苏省南京市江宁区将军大道100号',
            ds: 88, src: '手动',
            rs: 'FOLLOWING', bs: 'NONE',
            matchedProducts: [
                { product: '平安银行厂房贷', batch: '厂房贷20160501', status: 'active' }
            ],
            assignments: [
                { product: '平安银行厂房贷', batch: '厂房贷20160501', ownerOrgId: 'branch_nj', ownerOrgPath: ['hq', 'branch_nj'], allocTime: '2026-04-02 09:00' }
            ],
            timeline: [
                { time: '2026-04-15 09:30', actor: '郑十一', actorId: 'mgr_zheng', product: '厂房贷', action: '电话联系', note: '企业有新厂房建设需求，约下周面谈' }
            ]
        },
        {
            uscc: '91320594MA7EXAMPLE7',
            name: '苏州纳米智能装备有限公司',
            addr: '江苏省苏州市高新区科技城锦峰路10号',
            ds: 78, src: '手动',
            rs: 'REACHED_INTERESTED', bs: 'NONE',
            matchedProducts: [
                { product: '平安银行厂房贷', batch: '厂房贷20160501', status: 'active' },
                { product: '平安银行税务贷', batch: '税务贷20160501', status: 'active' }
            ],
            assignments: [
                { product: '平安银行厂房贷', batch: '厂房贷20160501', ownerOrgId: 'hq', ownerOrgPath: ['hq'], allocTime: '2026-04-01 09:00' }
            ],
            timeline: [
                { time: '2026-04-11 11:00', actor: '张三', actorId: 'mgr_zhang', product: '厂房贷', action: '电话联系', note: '企业负责人有意向，希望同时了解税务贷' },
                { time: '2026-04-13 15:30', actor: '张三', actorId: 'mgr_zhang', product: '税务贷', action: '发送资料', note: '已通过微信发送税务贷产品说明书' }
            ]
        },
        {
            uscc: '91320214MA3EXAMPLE3',
            name: '无锡光电半导体有限公司',
            addr: '江苏省无锡市新吴区太湖国际科技园',
            ds: 95, src: '手动',
            rs: 'REACHED_INTERESTED', bs: 'APPLIED',
            matchedProducts: [
                { product: '平安银行厂房贷', batch: '厂房贷20160502', status: 'active' },
                { product: '平安银行橙业贷', batch: '橙业贷20160508', status: 'expired' }
            ],
            assignments: [
                { product: '平安银行厂房贷', batch: '厂房贷20160502', ownerOrgId: 'hq', ownerOrgPath: ['hq'], allocTime: '2026-04-01 09:00' }
            ],
            timeline: [
                { time: '2026-04-08 10:00', actor: '王五', actorId: 'mgr_wang', product: '橙业贷', action: '电话联系', note: '企业评级已不满足橙业贷条件，转推厂房贷' },
                { time: '2026-04-14 14:00', actor: '王五', actorId: 'mgr_wang', product: '厂房贷', action: '上门拜访', note: '面谈顺利，企业已提交申请材料' }
            ]
        },
        {
            uscc: '91320402MAAEXAMPLEC',
            name: '常州智能制造系统有限公司',
            addr: '江苏省常州市新北区通江南路88号',
            ds: 76, src: '手动',
            rs: 'FOLLOWING', bs: 'REVIEWING',
            matchedProducts: [
                { product: '平安银行税务贷', batch: '税务贷20160501', status: 'active' }
            ],
            assignments: [
                { product: '平安银行税务贷', batch: '税务贷20160501', ownerOrgId: 'hq', ownerOrgPath: ['hq'], allocTime: '2026-04-01 09:00' }
            ],
            timeline: []
        },
        {
            uscc: '91320114MA8EXAMPLE8',
            name: '南京云端数据技术有限公司',
            addr: '江苏省南京市雨花台区软件大道1号',
            ds: 90, src: 'API',
            rs: 'REACHED_INTERESTED', bs: 'APPROVED',
            matchedProducts: [
                { product: '平安银行税务贷', batch: '税务贷20160501', status: 'active' }
            ],
            assignments: [
                { product: '平安银行税务贷', batch: '税务贷20160501', ownerOrgId: 'branch_nj', ownerOrgPath: ['hq', 'branch_nj'], allocTime: '2026-04-02 09:00' }
            ],
            timeline: [
                { time: '2026-04-16 09:00', actor: '郑十一', actorId: 'mgr_zheng', product: '税务贷', action: '电话联系', note: '贷款已获批，协助跟进放款流程' }
            ]
        },

        {
            uscc: '91320214MA9EXAMPLEB',
            name: '无锡集成电路设计有限公司',
            addr: '江苏省无锡市滨湖区建筑路32号',
            ds: 83, src: '手动',
            rs: 'REACHED_INTERESTED', bs: 'REJECTED_BIZ',
            matchedProducts: [
                { product: '平安银行橙业贷', batch: '橙业贷20160509', status: 'active' }
            ],
            assignments: [
                { product: '平安银行橙业贷', batch: '橙业贷20160509', ownerOrgId: 'hq', ownerOrgPath: ['hq'], allocTime: '2026-04-01 09:00' }
            ],
            timeline: []
        },

        {
            uscc: '91320982MABEXAMPLEF',
            name: '盐城大丰金属制品有限公司',
            addr: '江苏省盐城市大丰区工业园2号',
            ds: 49, src: '手动',
            rs: 'REACHED_NO_INTEREST', bs: 'APPLIED',
            matchedProducts: [
                { product: '平安银行厂房贷', batch: '厂房贷20160502', status: 'active' }
            ],
            assignments: [
                { product: '平安银行厂房贷', batch: '厂房贷20160502', ownerOrgId: 'hq', ownerOrgPath: ['hq'], allocTime: '2026-04-01 09:00' }
            ],
            timeline: []
        }
    ];

    // 动态扩充 mock 数据，使得企业数量达到几百家以模拟真实营销场景
    (function () {
        var cities = [
            { name: '苏州', code: '05', orgId: 'branch_sz', districts: ['工业园区', '高新区', '姑苏区', '吴中区', '相城区'], streets: ['星湖街', '锦峰路', '人民路', '东吴北路', '相城大道'] },
            { name: '南京', code: '01', orgId: 'branch_nj', districts: ['江宁区', '雨花台区', '建邺区', '鼓楼区', '玄武区'], streets: ['将军大道', '软件大道', '河西大街', '北京东路', '中山路'] },
            { name: '无锡', code: '02', orgId: 'branch_wx', districts: ['新吴区', '滨湖区', '梁溪区', '锡山区', '惠山区'], streets: ['太湖大道', '建筑路', '中山路', '锡沪路', '惠山大道'] },
            { name: '常州', code: '04', orgId: 'branch_cz', districts: ['武进区', '新北区', '天宁区', '钟楼区'], streets: ['高新路', '通江南路', '中吴大道', '延陵西路'] },
            { name: '南通', code: '06', orgId: 'branch_nt', districts: ['崇川区', '港闸区', '开发区'], streets: ['工农路', '青年路', '能达大道'] },
            { name: '泰州', code: '12', orgId: 'branch_tz', districts: ['高港区', '海陵区', '姜堰区'], streets: ['科技大道', '迎春路', '姜堰大道'] },
            { name: '扬州', code: '10', orgId: 'branch_yz', districts: ['广陵区', '邗江区', '开发区'], streets: ['新城路', '文昌中路', '扬子江路'] },
            { name: '盐城', code: '09', orgId: 'branch_yc', districts: ['亭湖区', '盐都区', '大丰区'], streets: ['工业路', '世纪大道', '大丰大道'] }
        ];

        var industries = ['科技', '智能制造', '半导体', '光电', '新材料', '生物医药', '精密机械', '信息技术', '环保科技', '电子科技', '仪器仪表', '软件技术'];
        var types = ['有限公司', '股份有限公司', '科技发展公司', '工业有限公司'];

        var batches = [
            { product: '平安银行橙业贷', batch: '橙业贷20160508', count: 65 },
            { product: '平安银行厂房贷', batch: '厂房贷20160501', count: 50 },
            { product: '平安银行橙业贷', batch: '橙业贷20160509', count: 72 },
            { product: '平安银行税务贷', batch: '税务贷20160501', count: 80 },
            { product: '平安银行厂房贷', batch: '厂房贷20160502', count: 45 }
        ];

        batches.forEach(function (b) {
            for (var i = 0; i < b.count; i++) {
                var city = cities[Math.floor(Math.random() * cities.length)];
                var dist = city.districts[Math.floor(Math.random() * city.districts.length)];
                var street = city.streets[Math.floor(Math.random() * city.streets.length)];
                var num = Math.floor(Math.random() * 200) + 1;
                
                var addr = '江苏省' + city.name + '市' + dist + street + num + '号';
                
                var ind = industries[Math.floor(Math.random() * industries.length)];
                var type = types[Math.floor(Math.random() * types.length)];
                var namePrefix = city.name + Math.floor(Math.random() * 1000 + 100);
                var name = namePrefix + ind + type;

                var randomStr = Math.random().toString(36).substr(2, 10).toUpperCase();
                var uscc = '9132' + city.code + '00MA' + randomStr;

                var ds = Math.floor(Math.random() * 40) + 60; // 60 - 99
                var src = Math.random() > 0.5 ? 'API' : '手动';

                var isDistributedToBranch = Math.random() < 0.3;
                var ownerOrgId = 'hq';
                var ownerOrgPath = ['hq'];
                if (isDistributedToBranch) {
                    ownerOrgId = city.orgId;
                    ownerOrgPath = ['hq', city.orgId];
                }

                DEFAULT_ENTERPRISES.push({
                    uscc: uscc,
                    name: name,
                    addr: addr,
                    ds: ds,
                    src: src,
                    rs: 'PENDING',
                    bs: 'NONE',
                    matchedProducts: [
                        { product: b.product, batch: b.batch, status: 'active' }
                    ],
                    assignments: [
                        { product: b.product, batch: b.batch, ownerOrgId: ownerOrgId, ownerOrgPath: ownerOrgPath, allocTime: '2026-04-02 10:00' }
                    ],
                    timeline: []
                });
            }
        });
    })();

    // 内部方法：获取企业数据库
    function _getEnterprises() {
        try {
            var stored = localStorage.getItem(ENTERPRISE_KEY);
            if (stored) {
                var parsed = JSON.parse(stored);
                // 缓存数量不等于新设定的默认数据量，重置
                if (parsed.length !== DEFAULT_ENTERPRISES.length) {
                    localStorage.removeItem(ENTERPRISE_KEY);
                } else {
                    return parsed;
                }
            }
        } catch (e) {}
        return JSON.parse(JSON.stringify(DEFAULT_ENTERPRISES));
    }

    // 内部方法：保存企业数据库
    function _saveEnterprises(enterprises) {
        try {
            localStorage.setItem(ENTERPRISE_KEY, JSON.stringify(enterprises));
        } catch (e) {}
    }

    // 内部方法：按 USCC 查找企业
    function _findEnterprise(enterprises, uscc) {
        for (var i = 0; i < enterprises.length; i++) {
            if (enterprises[i].uscc === uscc) return enterprises[i];
        }
        return null;
    }

    // 兼容旧向导分配接口：将企业数据生成等效的 allocs 结构
    function _getAllocs() {
        var enterprises = _getEnterprises();
        var allocs = {};
        enterprises.forEach(function (e, idx) {
            var id = String(idx + 1);
            var primaryAssign = e.assignments && e.assignments.length > 0 ? e.assignments[0] : null;
            allocs[id] = {
                owner: primaryAssign ? primaryAssign.ownerOrgId : 'hq',
                path: primaryAssign ? primaryAssign.ownerOrgPath.slice() : ['hq'],
                uscc: e.uscc
            };
        });
        return allocs;
    }

    // 内部方法：保存兼容格式数据（同步回企业数据库）
    function _saveAllocs(allocs) {
        var enterprises = _getEnterprises();
        for (var id in allocs) {
            var idx = parseInt(id) - 1;
            if (idx >= 0 && idx < enterprises.length) {
                var a = allocs[id];
                var e = enterprises[idx];
                if (e.assignments && e.assignments.length > 0) {
                    e.assignments[0].ownerOrgId = a.owner;
                    e.assignments[0].ownerOrgPath = a.path.slice();
                }
            }
        }
        _saveEnterprises(enterprises);
    }

    // 内部方法：递归查找节点
    function _findNode(tree, id) {
        if (tree.id === id) return tree;
        if (tree.children) {
            for (var i = 0; i < tree.children.length; i++) {
                var found = _findNode(tree.children[i], id);
                if (found) return found;
            }
        }
        return null;
    }

    // --- 内部方法 ---

    /**
     * 获取当前存储的角色配置
     */
    function _getProfile() {
        try {
            var data = localStorage.getItem(STORAGE_KEY);
            if (data) {
                return JSON.parse(data);
            }
        } catch (e) {
            // localStorage 不可用或数据损坏
        }
        return null;
    }

    /**
     * 保存角色配置
     */
    function _setProfile(profile) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
        } catch (e) {
            console.warn('[RoleManager] localStorage 不可用');
        }
    }

    // --- 公开 API ---

    return {
        ROLE: ROLE,
        MOCK_PROFILES: MOCK_PROFILES,
        MOCK_ORG_TREE: MOCK_ORG_TREE,

        /**
         * 获取当前角色配置，如果未设置则返回默认客户经理
         */
        getProfile: function () {
            return _getProfile() || MOCK_PROFILES[0];
        },

        /**
         * 设置当前角色
         * @param {Object} profile - MOCK_PROFILES 中的某个配置对象
         */
        setProfile: function (profile) {
            _setProfile(profile);
        },

        /**
         * 获取当前角色类型
         * @returns {'MANAGER'|'ADMIN'}
         */
        getRole: function () {
            return this.getProfile().role;
        },

        /**
         * 是否为管理员角色
         */
        isAdmin: function () {
            return this.getRole() === ROLE.ADMIN;
        },

        /**
         * 是否为客户经理角色
         */
        isManager: function () {
            return this.getRole() === ROLE.MANAGER;
        },

        /**
         * 获取当前角色所管辖的下级组织/团队
         * 比如：总行返回分行列表，分行返回支行，支行返回网点+直属团队，网点返回团队
         */
        getSubordinates: function () {
            var profile = this.getProfile();
            var node = _findNode(MOCK_ORG_TREE, profile.orgId);
            return node && node.children ? node.children : [];
        },

        /**
         * 检查是否已经选择过角色（是否需要跳转入口页）
         */
        hasProfile: function () {
            return !!_getProfile();
        },

        /**
         * 清除角色选择（回到入口页重新选）
         */
        clearProfile: function () {
            try {
                localStorage.removeItem(STORAGE_KEY);
            } catch (e) {}
        },

        /**
         * 根据角色获取对应的首页 URL
         */
        getHomeUrl: function () {
            if (this.isAdmin()) {
                return 'admin-dashboard.html';
            }
            return 'index.html';
        },

        /**
         * 根据角色获取底部 Tab 配置
         */
        getTabConfig: function () {
            if (this.isAdmin()) {
                return [
                    { label: '总览', href: 'admin-dashboard.html', icon: 'chart' },
                    { label: '名单', href: 'customers.html', icon: 'users' },
                    { label: '团队', href: 'admin-team.html', icon: 'team' }
                ];
            }
            return [
                { label: '首页', href: 'index.html', icon: 'home' },
                { label: '名单', href: 'customers.html', icon: 'users' },
                { label: '跟进', href: 'follow.html', icon: 'pulse' }
            ];
        },

        /**
         * 注入悬浮角色切换按钮到页面
         */
        injectSwitcher: function () {
            var self = this;
            var profile = self.getProfile();

            // 创建悬浮按钮
            var fab = document.createElement('div');
            fab.id = 'roleSwitcherFab';
            fab.innerHTML = '<span class="role-fab-icon">' + profile.avatar + '</span>';
            fab.title = profile.userName + ' · ' + profile.orgName;

            // 悬浮按钮样式
            fab.style.cssText = 'position:fixed;left:12px;bottom:' +
                'calc(90px + var(--safe-bottom, 20px))' +
                ';width:40px;height:40px;border-radius:50%;' +
                'background:' + (self.isAdmin() ? 'linear-gradient(135deg,#7c3aed,#a855f7)' : 'linear-gradient(135deg,#2563eb,#3b82f6)') + ';' +
                'color:#fff;display:flex;align-items:center;justify-content:center;' +
                'font-size:14px;font-weight:700;cursor:pointer;z-index:9999;' +
                'box-shadow:0 4px 12px rgba(0,0,0,0.2);' +
                'transition:transform 0.2s;-webkit-tap-highlight-color:transparent;';

            fab.addEventListener('click', function () {
                location.href = 'entry.html';
            });

            // 长按显示角色信息
            fab.addEventListener('touchstart', function () {
                fab.style.transform = 'scale(1.15)';
            });
            fab.addEventListener('touchend', function () {
                fab.style.transform = 'scale(1)';
            });

            document.body.appendChild(fab);
        },

        /**
         * 在页面加载完成后初始化：注入悬浮按钮
         * 在所有业务页面的 <script> 中调用
         */
        init: function () {
            var self = this;
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', function () {
                    self.injectSwitcher();
                });
            } else {
                self.injectSwitcher();
            }
        },

        /**
         * 获取企业完整列表（已按 USCC 去重）
         * @returns {Array} 企业对象数组
         */
        getEnterprises: function () {
            return _getEnterprises();
        },

        /**
         * 按 USCC 获取单个企业
         * @param {string} uscc
         * @returns {Object|null}
         */
        getEnterprise: function (uscc) {
            return _findEnterprise(_getEnterprises(), uscc);
        },

        /**
         * 获取当前客户经理可见的企业列表
         * （与当前经理所在机构有 assignment 关系的企业）
         * @returns {Array} 企业对象数组
         */
        getManagerEnterprises: function () {
            var profile = this.getProfile();
            var myOrgId = profile.orgId;
            var enterprises = _getEnterprises();
            return enterprises.filter(function (e) {
                return e.assignments && e.assignments.some(function (a) {
                    return a.ownerOrgId === myOrgId ||
                           (a.ownerOrgPath && a.ownerOrgPath[a.ownerOrgPath.length - 1] === myOrgId);
                });
            });
        },

        /**
         * 获取当前管理员视角下的名单分类（基于企业维度）
         * @returns {{ pending: number[], assigned: number[] }}
         *   pending: 企业索引（1-based）中，停留在当前机构未分配下去的
         *   assigned: 已分配给下级机构的
         */
        getAdminCustomers: function () {
            var profile = this.getProfile();
            var myOrgId = profile.orgId;
            var enterprises = _getEnterprises();
            var pending = [], assigned = [];
            enterprises.forEach(function (e, idx) {
                var id = idx + 1;
                var relevantAssigns = e.assignments.filter(function (a) {
                    return a.ownerOrgPath && a.ownerOrgPath.indexOf(myOrgId) > -1;
                });
                if (relevantAssigns.length === 0) return;

                var hasPending = relevantAssigns.some(function (a) {
                    return a.ownerOrgId === myOrgId;
                });
                var hasAssigned = relevantAssigns.some(function (a) {
                    return a.ownerOrgId !== myOrgId &&
                           a.ownerOrgPath.indexOf(myOrgId) < a.ownerOrgPath.length - 1;
                });

                if (hasPending) pending.push(id);
                else if (hasAssigned) assigned.push(id);
            });
            return { pending: pending, assigned: assigned };
        },

        /**
         * 执行分配操作（追加 assignment，多人共管不覆盖旧记录）
         * @param {number[]} customerIds - 企业索引列表（1-based）
         * @param {string} targetOrgId - 目标机构 ID
         */
        allocateCustomers: function (customerIds, targetOrgId) {
            var enterprises = _getEnterprises();
            var allocs = _getAllocs();
            for (var i = 0; i < customerIds.length; i++) {
                var idx = parseInt(customerIds[i]) - 1;
                if (idx < 0 || idx >= enterprises.length) continue;
                var e = enterprises[idx];
                var oldAlloc = allocs[String(customerIds[i])];
                var newPath = oldAlloc ? oldAlloc.path.concat([targetOrgId]) : ['hq', targetOrgId];
                // 更新主 assignment 的归属（保留其他 assignment 不变）
                if (e.assignments && e.assignments.length > 0) {
                    e.assignments[0].ownerOrgId = targetOrgId;
                    e.assignments[0].ownerOrgPath = newPath;
                    e.assignments[0].allocTime = new Date().toLocaleString('zh-CN');
                }
            }
            _saveEnterprises(enterprises);
        },

        /**
         * 获取某企业的分配路径（兼容旧接口）
         * @param {number} customerId - 企业索引（1-based）
         * @returns {string[]}
         */
        getAllocPath: function (customerId) {
            var enterprises = _getEnterprises();
            var idx = parseInt(customerId) - 1;
            if (idx < 0 || idx >= enterprises.length) return ['hq'];
            var e = enterprises[idx];
            if (!e.assignments || e.assignments.length === 0) return ['hq'];
            var deepest = e.assignments.reduce(function (a, b) {
                return a.ownerOrgPath.length >= b.ownerOrgPath.length ? a : b;
            });
            return deepest.ownerOrgPath;
        },

        /**
         * 更新企业级营销状态
         * @param {string} uscc - 企业 USCC
         * @param {string} rs - 触达状态
         * @param {string} bs - 业务状态
         * @param {string} [note] - 可选文字备注（写入时间轴）
         */
        updateEnterpriseStatus: function (uscc, rs, bs, note) {
            var enterprises = _getEnterprises();
            var e = _findEnterprise(enterprises, uscc);
            if (!e) return;
            e.rs = rs;
            e.bs = bs;
            if (note) {
                var profile = this.getProfile();
                e.timeline = e.timeline || [];
                e.timeline.unshift({
                    time: new Date().toLocaleString('zh-CN'),
                    actor: profile.userName,
                    actorId: profile.userId,
                    product: '',
                    action: '状态更新',
                    note: note
                });
            }
            _saveEnterprises(enterprises);
        },

        /**
         * 追加营销时间轴记录
         * @param {string} uscc - 企业 USCC
         * @param {Object} record - {product, action, note}
         */
        addTimelineRecord: function (uscc, record) {
            var enterprises = _getEnterprises();
            var e = _findEnterprise(enterprises, uscc);
            if (!e) return;
            var profile = this.getProfile();
            e.timeline = e.timeline || [];
            e.timeline.unshift({
                time: new Date().toLocaleString('zh-CN'),
                actor: profile.userName,
                actorId: profile.userId,
                product: record.product || '',
                action: record.action || '跟进',
                note: record.note || ''
            });
            _saveEnterprises(enterprises);
        },

        /**
         * 获取当前管理员可分配的目标列表（扁平化展示）
         */
        getAssignableTargets: function () {
            var subs = this.getSubordinates();
            var targets = [];
            for (var i = 0; i < subs.length; i++) {
                var s = subs[i];
                if (s.type === 'team') {
                    targets.push({ id: s.id, name: s.name, type: 'team' });
                    if (s.children) {
                        for (var j = 0; j < s.children.length; j++) {
                            var m = s.children[j];
                            targets.push({ id: m.id, name: m.name, type: 'manager', parentTeam: s.name });
                        }
                    }
                } else {
                    targets.push({ id: s.id, name: s.name, type: s.type, levelName: s.levelName || '' });
                }
            }
            return targets;
        },

        /**
         * 根据企业地址智能推荐分配目标
         */
        recommendTarget: function (address) {
            var targets = this.getAssignableTargets();
            if (!address || !targets.length) return null;
            for (var i = 0; i < targets.length; i++) {
                var t = targets[i];
                var keywords = t.name.replace(/[省市区县]|[分支]行|网点|总行|营销|[一二三四五六七八九十]+组/g, '');
                if (keywords.length >= 2 && address.indexOf(keywords) > -1) {
                    return t.id;
                }
            }
            return null;
        },

        /**
         * 根据 ID 查找组织/团队/人员名称
         */
        getNodeName: function (nodeId) {
            function deepFind(n) {
                if (n.id === nodeId) return n.name;
                if (n.children) {
                    for (var i = 0; i < n.children.length; i++) {
                        var found = deepFind(n.children[i]);
                        if (found) return found;
                    }
                }
                return null;
            }
            return deepFind(MOCK_ORG_TREE) || nodeId;
        },

        /**
         * 重置企业数据（恢复默认 Mock）
         */
        resetAllocations: function () {
            try {
                localStorage.removeItem(ALLOC_KEY);
                localStorage.removeItem(ENTERPRISE_KEY);
            } catch (e) {}
        },

        // ===== 向导式分配 API =====

        /**
         * 获取指定节点的直接下级机构列表（仅 type=org）
         * @param {string} orgId - 机构ID，默认当前管理员所在机构
         * @returns {Array} [{id, name, levelName, region, type}]
         */
        getDirectSubOrgs: function (orgId) {
            var id = orgId || this.getProfile().orgId;
            var node = _findNode(MOCK_ORG_TREE, id);
            if (!node || !node.children) return [];
            return node.children.filter(function (c) { return c.type === 'org'; });
        },

        /**
         * 获取指定节点下的所有可分配目标（org/team/manager），展平为列表
         * @param {string} orgId
         * @returns {Array} [{id, name, type, levelName}]
         */
        getSubTargets: function (orgId) {
            var id = orgId || this.getProfile().orgId;
            var node = _findNode(MOCK_ORG_TREE, id);
            if (!node || !node.children) return [];
            return node.children.map(function (c) {
                return { id: c.id, name: c.name, type: c.type, levelName: c.levelName || '' };
            });
        },

        /**
         * 递归统计某机构下的客户经理总数
         * @param {string} orgId
         * @returns {number}
         */
        countManagers: function (orgId) {
            var node = _findNode(MOCK_ORG_TREE, orgId);
            if (!node) return 0;
            if (node.type === 'manager') return 1;
            var count = 0;
            if (node.children) {
                for (var i = 0; i < node.children.length; i++) {
                    count += this.countManagers(node.children[i].id);
                }
            }
            return count;
        },

        /**
         * 判断某个层级是否有地域区分度（org节点带region字段）
         * @param {Array} targets - 目标机构数组
         * @returns {boolean}
         */
        hasRegionData: function (targets) {
            return targets.some(function (t) { return t.type === 'org' && Array.isArray(t.region) && t.region.length > 0; });
        },

        /**
         * 按地域分配 — 将客户列表按地址匹配到下级机构
         * @param {Array} customers - [{id, addr, ...}]
         * @param {Array} targetOrgs - [{id, name, region, ...}] 下级机构列表
         * @returns {{ matched: {orgId: string, orgName: string, customers: Array}[], unmatched: Array }}
         */
        allocateByRegion: function (customers, targetOrgs) {
            var result = {};
            var unmatched = [];
            // 初始化每个机构的结果集
            targetOrgs.forEach(function (org) {
                result[org.id] = { orgId: org.id, orgName: org.name, customers: [] };
            });
            customers.forEach(function (c) {
                var addr = c.addr || '';
                var matched = false;
                for (var i = 0; i < targetOrgs.length; i++) {
                    var org = targetOrgs[i];
                    var regions = org.region || [];
                    for (var j = 0; j < regions.length; j++) {
                        if (addr.indexOf(regions[j]) > -1) {
                            result[org.id].customers.push(c);
                            matched = true;
                            break;
                        }
                    }
                    if (matched) break;
                }
                if (!matched) unmatched.push(c);
            });
            var matchedArr = targetOrgs.map(function (org) { return result[org.id]; });
            return { matched: matchedArr, unmatched: unmatched };
        },

        /**
         * 均分分配
         * @param {Array} customers - 客户列表
         * @param {Array} targetOrgs - 下级机构列表
         * @param {'byOrg'|'byManager'} mode - 按机构数均分 or 按人数加权
         * @returns {{ matched: {orgId, orgName, customers, count}[], unmatched: [] }}
         */
        allocateByAverage: function (customers, targetOrgs, mode) {
            var self = this;
            var total = customers.length;
            var slots = [];
            if (mode === 'byManager') {
                // 按客户经理人数加权
                var totalMgrs = 0;
                targetOrgs.forEach(function (org) {
                    var cnt = self.countManagers(org.id);
                    slots.push({ org: org, weight: cnt });
                    totalMgrs += cnt;
                });
                if (totalMgrs === 0) totalMgrs = targetOrgs.length; // 防除零
                var assigned = 0;
                slots.forEach(function (s) {
                    s.count = Math.floor(total * s.weight / totalMgrs);
                    assigned += s.count;
                });
                // 余数分配
                var remainder = total - assigned;
                slots.sort(function (a, b) { return b.weight - a.weight; });
                for (var i = 0; i < remainder; i++) {
                    slots[i % slots.length].count++;
                }
            } else {
                // 按机构数均分
                var base = Math.floor(total / targetOrgs.length);
                var rem = total % targetOrgs.length;
                targetOrgs.forEach(function (org, idx) {
                    slots.push({ org: org, count: base + (idx < rem ? 1 : 0), weight: 1 });
                });
            }
            // 实际分配：优先按地域匹配
            var pool = customers.slice(); // 复制一份
            var result = slots.map(function (s) {
                return { orgId: s.org.id, orgName: s.org.name, customers: [], count: s.count, managerCount: s.weight };
            });
            // 第一轮：按地域匹配
            var regionResult = this.allocateByRegion(pool, targetOrgs);
            result.forEach(function (r, idx) {
                var regionCustomers = regionResult.matched[idx].customers;
                var needed = slots[idx].count;
                // 从地域匹配结果中取，不超过需求数
                r.customers = regionCustomers.slice(0, needed);
            });
            // 第二轮：补齐不足的
            var usedIds = {};
            result.forEach(function (r) {
                r.customers.forEach(function (c) { usedIds[c.id] = true; });
            });
            var remaining = pool.filter(function (c) { return !usedIds[c.id]; });
            result.forEach(function (r) {
                var deficit = r.count - r.customers.length;
                while (deficit > 0 && remaining.length > 0) {
                    r.customers.push(remaining.shift());
                    deficit--;
                }
            });
            return { matched: result, unmatched: [] };
        },

        /**
         * 自定义数量分配
         * @param {Array} customers - 客户列表
         * @param {Array} targetOrgs - 下级机构列表
         * @param {Object} counts - {orgId: number} 每个机构的分配数量
         * @returns {{ matched: {orgId, orgName, customers, count}[], unmatched: Array }}
         */
        allocateByCustom: function (customers, targetOrgs, counts) {
            var pool = customers.slice();
            var result = [];
            // 先按地域匹配
            var regionResult = this.allocateByRegion(pool, targetOrgs);
            var usedIds = {};
            targetOrgs.forEach(function (org, idx) {
                var needed = counts[org.id] || 0;
                var regionCustomers = regionResult.matched[idx].customers;
                var picked = regionCustomers.slice(0, needed);
                picked.forEach(function (c) { usedIds[c.id] = true; });
                result.push({ orgId: org.id, orgName: org.name, customers: picked, count: needed });
            });
            // 补齐不足
            var remaining = pool.filter(function (c) { return !usedIds[c.id]; });
            result.forEach(function (r) {
                var deficit = r.count - r.customers.length;
                while (deficit > 0 && remaining.length > 0) {
                    r.customers.push(remaining.shift());
                    deficit--;
                }
            });
            var totalAssigned = 0;
            result.forEach(function (r) { totalAssigned += r.customers.length; });
            var unmatched = pool.filter(function (c) {
                for (var i = 0; i < result.length; i++) {
                    if (result[i].customers.some(function (rc) { return rc.id === c.id; })) return false;
                }
                return true;
            });
            return { matched: result, unmatched: unmatched };
        },

        /**
         * 向导式批量分配（委托 allocateCustomers，支持多人共管追加模式）
         * @param {Array} customerIds - 企业索引列表（1-based）
         * @param {string} targetOrgId - 目标机构 ID
         */
        allocateToOrg: function (customerIds, targetOrgId) {
            this.allocateCustomers(customerIds, targetOrgId);
        },

        /**
         * 获取组织树的完整引用（用于向导中展示）
         */
        getOrgTree: function () {
            return MOCK_ORG_TREE;
        }
    };
})();

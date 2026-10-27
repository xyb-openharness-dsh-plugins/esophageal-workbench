/* 小咽宝 EsopPal · 疾病概要数据（36 号 v2）
 * 口径：docs/DISEASE-PRIMER.md；规范：starter docs/36-DISEASE-PRIMER.md。
 * 全部内容属第 ② 层（解释）：只写定义、文件、指南列举过的手段、已发生的事实。
 * 本项目没有取得任何一份指南全文（docs/CLINICAL-DATA-2026.md 明确写 CSCO 2026 /
 * NCCN 2026 / ESMO 2026 状态未核验），因此版本号一律写「版本未核实」，页码「页码待核」。
 *
 * 2026-10-27（36 号 §2.5 补齐）：每条来源都给可点链接，逐个用 curl 验过可达（HTTP 200）。
 * 本项目一份原件都没有，所以每行都是 original:false + secondaryUrl = 官方出版信息页。
 * 不拿「别人的指南 PDF」冒充本项目取得的原件。
 */
window.DISEASE_PRIMER = (function () {
  'use strict'

  /* ---- 已逐条验证可达的链接（2026-10-27，curl -L 全部 200） ---- */
  var LINK = {
    /* CSCO 官方指南合订本页（含食管癌分册；电子书在「人卫助手」渠道，本台未购） */
    cscoGuide: 'https://www.csco.org.cn/cn/ncontent.aspx?oid=9038',
    /* NCCN 官方指南详情页（食管与食管胃结合部癌；全文需机构订阅） */
    nccnEsoph: 'https://www.nccn.org/guidelines/guidelines-detail?category=1&id=1433',
    /* ESMO 官方临床实践指南页（胃与食管癌） */
    esmoGi: 'https://www.esmo.org/guidelines/esmo-clinical-practice-guideline-gastric-and-oesophageal-cancer',
    /* AJCC 官方页（由美国外科医师学会 FACS 管理） */
    ajcc: 'https://www.facs.org/quality-programs/cancer-programs/american-joint-committee-on-cancer/',
    /* WHO 消化系统肿瘤分类第 5 版 · IARC 出版页 */
    whoDigestive: 'https://publications.iarc.who.int/Book-And-Report-Series/Who-Classification-Of-Tumours/Digestive-System-Tumours-2019',
    /* ClinicalTrials.gov 检索页（与 research/esophageal-cancer/README.md 的检索口径同源） */
    ctgovSearch: 'https://clinicaltrials.gov/search?cond=Esophageal%20Neoplasms&aggFilters=studyType:int'
  }

  return {
    brand: '小咽宝 EsopPal',
    name: '食管癌',
    en: 'Esophageal Cancer',
    updated: '2026-10-27',
    sections: [
      {
        id: 'definition',
        title: '定义',
        intro: '食管癌是发生在食管黏膜上皮的恶性肿瘤。这个病的第一道分岔不是「几期」，而是两个更基础的问题：'
          + '病理类型是鳞癌还是腺癌，病变在食管的哪一段。本台把这两项作为建档的双主键，不合并成「食管癌」一个档案。',
        points: [
          '病理类型：食管鳞状细胞癌与食管腺癌是两条不同的病程与治疗路径，指南按类型分别列条目；本台要求先选类型再建档。',
          '部位分段：颈段、胸上段、胸中段、胸下段、食管胃结合部（EGJ）。分段由内镜与影像报告给出，本台只抄原文，不按距门齿距离自行推算。',
          'EGJ 病变用 Siewert 分型记录（医生给出），本台只留记录位，不自动计算、不据此推荐术式。',
          '分期用 TNM；本项目未取得 AJCC 原件，版本未核实，报告上的 T/N/M 只抄不判。',
          '本台不把「鳞癌 / 腺癌」或「哪一段」解释成严重或好治——类型与分段只决定指南里有哪些条目，不决定你的结局。'
        ],
        sources: [
          { org: 'CSCO', doc: 'CSCO 食管癌诊疗指南', version: '版本未核实', original: false, secondaryUrl: LINK.cscoGuide, page: '页码待核', note: '本项目未取得全文；链接为 CSCO 官方指南合订本页，2026 版状态未核验（docs/CLINICAL-DATA-2026.md）' },
          { org: 'NCCN', doc: 'NCCN Guidelines: Esophageal and Esophagogastric Junction Cancers', version: '版本未核实', original: false, secondaryUrl: LINK.nccnEsoph, page: '页码待核', note: '本项目未取得原件；链接为 NCCN 官方指南详情页，全文需机构订阅' },
          { org: 'WHO', doc: 'WHO 消化系统肿瘤分类', version: '版本未核实（第 5 版，2019）', original: false, secondaryUrl: LINK.whoDigestive, page: '页码待核', note: '仅作病理类型命名口径；链接为 IARC 出版页，正文需订阅' },
          { org: 'AJCC', doc: 'AJCC Cancer Staging Manual（食管与 EGJ 章节）', version: '版本未核实', original: false, secondaryUrl: LINK.ajcc, page: '页码待核', note: '本项目未取得原件；链接为 AJCC 官方页' }
        ]
      },
      {
        id: 'evidence',
        title: '医学资料规范和指南情况',
        intro: '这台工作台里出现的「怎么分段、手术还是放化疗、多久复查」，都应能追到下面某一份文件。'
          + '但本项目截至 2026-10-27 没有取得任何一份指南全文——表里照实写未核验，不拿印象补版本号。'
          + '「原件」列每一行都给可点链接：拿不到原件，就指向该机构的官方出版信息页。',
        table: {
          head: ['机构', '文件', '版本 / 年份', '原件', '本台的用途'],
          rows: [
            ['CSCO', 'CSCO 食管癌诊疗指南', '版本未核实（2026 版状态未核验）', { text: '未取得原件 · CSCO 官方指南页', url: LINK.cscoGuide }, '国内口径：病理类型、分段、治疗路径与随访条目'],
            ['NCCN', 'NCCN Guidelines: Esophageal and Esophagogastric Junction Cancers', '版本未核实（2026 版更新状态未核验）', { text: '未取得原件（需机构订阅）· 官方指南页', url: LINK.nccnEsoph }, '手术、围手术期治疗、dCRT 与系统治疗的条目结构'],
            ['ESMO', 'ESMO 食管癌相关指南（胃与食管癌 CPG）', '版本未核实（2026 更新状态未核验）', { text: '未取得原件 · 官方指南页', url: LINK.esmoGi }, '欧洲口径对照'],
            ['AJCC', 'AJCC Cancer Staging Manual（食管与 EGJ 章节）', '版本未核实', { text: '未取得原件 · AJCC 官方页', url: LINK.ajcc }, 'TNM 分期字段'],
            ['WHO', 'WHO 消化系统肿瘤分类', '版本未核实（第 5 版，2019）', { text: '未取得原件 · IARC 出版页', url: LINK.whoDigestive }, '鳞癌 / 腺癌等病理类型命名']
          ]
        },
        points: [
          '未取得原件的文件只记「存在」与「大致讲什么」，不引用其具体条文，页码写「页码待核」。',
          '本项目自己的底线写在 docs/CLINICAL-DATA-2026.md：在取得并核对中国现行指南全文之前，工作台不得生成任何「按最新指南」的治疗解释内容。',
          '「指南里有这一条」「中国已获批」「医保报销」是三件事：本台分字段显示，不合成一句话。',
          '表里的链接只证明「这份文件由该机构发布、当前可打开」，不证明本台读过它的条文——原件列写的就是这个差别。'
        ],
        sources: [
          { org: 'CSCO', doc: 'CSCO 食管癌诊疗指南', version: '版本未核实', original: false, secondaryUrl: LINK.cscoGuide, page: '页码待核', note: '2026 版状态未核验' },
          { org: 'NCCN', doc: 'NCCN Guidelines: Esophageal and Esophagogastric Junction Cancers', version: '版本未核实', original: false, secondaryUrl: LINK.nccnEsoph, page: '页码待核', note: '2026 版更新状态未核验' },
          { org: 'ESMO', doc: 'ESMO 临床实践指南（胃与食管癌）', version: '版本未核实', original: false, secondaryUrl: LINK.esmoGi, page: '页码待核', note: '2026 更新状态未核验' }
        ]
      },
      {
        id: 'landscape',
        title: '目前治疗全景概要',
        intro: '下面按病期与线序列出指南里出现过的手段类别。这是「世界上大致有哪些办法」的地图，不是给你排的先后顺序，'
          + '也不含剂量、疗程与适用条件——那些必须由医生按你的病理类型、分段、分期与身体情况决定。',
        groups: [
          {
            label: '局限期 / 可切除（以手术为主）',
            points: [
              '手术：食管切除 + 淋巴结清扫 + 消化道重建是这一路径的核心；具体术式、切口与重建方式由外科团队按病变位置决定。',
              '围手术期治疗：新辅助放化疗、新辅助化疗、新辅助免疫治疗在指南与 2026 年登记研究中都有条目；本台只记录「做过哪一类、起止日期」。',
              '早期、局限于黏膜的表浅病变：指南列有内镜下切除（EMR / ESD）这一类别；是否适用由内镜与病理判断，本台不替选。',
              '术后辅助：按病理分期、切缘与淋巴结情况，指南列有观察、辅助化疗或辅助放化疗等条目。'
            ]
          },
          {
            label: '根治性放化疗 + 免疫巩固（不手术路径）',
            points: [
              '根治性同步放化疗（dCRT）：放疗与化疗同期进行，作为不做手术时的根治性路径；本项目 2026 登记里「放疗 / 放化疗」主题近似命中 45 条。',
              '免疫巩固：dCRT 结束后进入免疫治疗维持阶段，指南与登记研究中都单列这一阶段；本台只记录起止与复查节点，不评价疗效。',
              '路径切换：从手术路径转到 dCRT、或从 dCRT 转到系统治疗，旧路径记录保留、不覆盖——这是本台的结构要求，不是治疗建议。'
            ]
          },
          {
            label: '晚期 / 复发 / 转移',
            points: [
              '系统治疗：化疗、HER2 靶向（腺癌语境）、免疫检查点抑制剂、CLDN18.2 等靶点在指南与登记研究中出现；具体药是否国内获批、是否在医保内需单独核实。',
              '姑息放疗：用于局部症状控制的放疗条目在指南里列出；本台只记录「做过没有、什么时候、几次」。',
              '营养与进食通路支持：经口调整、支架、鼻饲、胃造瘘、空肠造瘘都是记录位；本台不推荐品牌、不建议时机、不做分诊。',
              '临床研究：指南把「参加登记良好的临床试验」列为一项正式选项，不是最后手段。'
            ]
          },
          {
            label: '贯穿全程的两件事',
            points: [
              '吞咽与营养记录：吞咽自查六档（普食 / 软食 / 半流 / 流食 / 水呛 / 完全梗阻）固定标注「自查，不是医生评估」；体重与白蛋白双序列只画趋势，不判读。',
              '随访与第二原发监测：胃镜 + 影像的复查节点按医生安排记录；鳞癌烟酒人群的头颈 / 肺监测只记录「医生安排了什么」，不给风险提示。'
            ]
          }
        ],
        points: [
          '以上是文献与指南里列出的手段，按病期与线序排列，不代表任何一项适合你。选哪一个，这一句需要问你的医生。'
        ],
        sources: [
          { org: 'CSCO', doc: 'CSCO 食管癌诊疗指南', version: '版本未核实', original: false, secondaryUrl: LINK.cscoGuide, page: '页码待核', note: '本项目未取得全文' },
          { org: 'NCCN', doc: 'NCCN Guidelines: Esophageal and Esophagogastric Junction Cancers', version: '版本未核实', original: false, secondaryUrl: LINK.nccnEsoph, page: '页码待核', note: '本项目未取得原件' },
          { org: 'ClinicalTrials.gov', doc: '2026 年食管癌 / EGJ 干预性研究登记采集', version: '快照 2026-10-25', original: true, url: LINK.ctgovSearch, page: '不以页码计', note: '本项目自采 200 条；链接为同口径检索页，结果随库滚动' }
        ]
      },
      {
        id: 'trend',
        title: '发展趋势',
        intro: '这一段只写已经发生、能回源核对的事。指南版本更替这一类，本项目截至 2026-10-25 未核验 CSCO 2026 / '
          + 'NCCN 2026 / ESMO 2026 的状态，所以不写；只写自采登记数据里的规模与阶段分布。',
        points: [
          '截至 2026-10-25：ClinicalTrials.gov 上首次公示于 2026-01-01 之后的食管癌 / 食管胃结合部干预性研究共 200 条（疾病特异 190 条 + 篮式 10 条）。',
          '截至 2026-10-25，同一批 200 条的登记状态：RECRUITING 103、NOT_YET_RECRUITING 82、COMPLETED 6、ACTIVE_NOT_RECRUITING 6、ENROLLING_BY_INVITATION 3。',
          '截至 2026-10-25，同一批 200 条的分期分布：PHASE2 92、NA（未标注 / 不适用）31、PHASE1 27、PHASE3 22、PHASE1|PHASE2 16、PHASE4 4、EARLY_PHASE1 4、PHASE2|PHASE3 4。',
          '截至 2026-10-25，同一批 200 条中 108 条含中国中心；主题关键词近似命中：免疫治疗 85、鳞癌 84、腺癌 / GEJ 80、手术相关 68、新辅助 / 围手术期 55、放疗 / 放化疗 45（同一研究可命中多个主题，计数为量级参考，不是精确分类）。',
          '采集边界：ChinaDrugTrials 与 ChiCTR 本轮未采集（2026 记录数未知），因此上述 200 条只代表 ClinicalTrials.gov 这一组查询与过滤口径，不代表所有注册库。'
        ],
        sources: [
          { org: 'ClinicalTrials.gov', doc: '2026 年食管癌 / EGJ 干预性研究登记采集', version: '快照 2026-10-25', original: true, url: LINK.ctgovSearch, page: '不以页码计', note: 'API v2 直连，检索式与过滤口径见 research/esophageal-cancer/README.md' },
          { org: '本项目', doc: 'research/esophageal-cancer/README.md', version: '2026-10-25', original: true, nolink: true, page: '不以页码计', note: '仓库内文件，没有公开 URL（仓库为 private）；统计口径与上面那条同源' }
        ]
      }
    ]
  }
})()

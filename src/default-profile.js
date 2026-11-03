export const defaultProfile = {
  version: 1,
  isDemo: true,
  name: '等你写下名字',
  role: '一个持续探索的人',
  intro: '你好，欢迎来到我的进行时。\n这里收集我的经历、作品，和一些不太好归类的热爱。',
  bio: '比起用一个标签概括自己，我更想让你看看：我做过什么，正在琢磨什么，以及那些让我眼睛发亮的小事。',
  email: '',
  entries: [
    { id:'project-1',category:'project',title:'把一个想法，做成看得见的作品',description:'记录问题、过程，以及最后的那个“做到了”。',detail:'这里将展示你的真实项目：为什么开始、负责了什么、如何解决问题，以及最终成果。可补充作品链接与过程记录。',label:'从想法到实现',tags:['等待你的真实作品'],url:'' },
    { id:'achievement-1',category:'achievement',title:'那些值得记住的里程碑',description:'荣誉背后，是一段只有自己知道的路。',detail:'这里留给你想分享的奖项、证书和突破。你可以补充名称、时间、颁发机构及证明材料，不必只记录“大成就”。',label:'记录高光时刻',tags:['等待你的真实成就'],url:'' },
    { id:'experience-1',category:'experience',title:'走过的路，也成为了我的一部分',description:'学习、实践、转弯，以及重新出发。',detail:'这里可以放学习、工作、志愿活动与人生转折。除了时间和地点，也写下一点这段经历带来的改变。',label:'连接成长的线索',tags:['等待你的真实经历'],url:'' },
    { id:'note-1',category:'note',title:'还没想明白，也可以先记下来',description:'给好奇心留一点没有截止日期的空间。',detail:'这里可以收集文章、观察、读书笔记和开放问题。它们不必是结论，也可以是一段值得继续追问的开始。',label:'收藏未完成的思考',tags:['等待你的真实记录'],url:'' }
  ],
  facets: {
    skills:{caption:'能力 / 待你填入',title:'不只“会什么”，\n也在乎“怎么做”。',description:'这里留给你的专业技能、擅长的方法，以及你愿意投入时间打磨的事情。',tags:['专业技能','解决问题的方法','持续学习的领域']},
    traits:{caption:'特点 / 待你填入',title:'你是怎样的人，\n藏在日常的选择里。',description:'用具体的小事讲性格：面对未知时的反应，与人合作时的习惯，以及你坚持的原则。',tags:['做事的习惯','相处的方式','坚持的原则']},
    interests:{caption:'热爱 / 待你填入',title:'有些事没有目的，\n只是喜欢。',description:'这里属于简历之外的你：一项爱好、一个着迷的领域，或一件做起来就忘记时间的事。',tags:['让你着迷的事','生活中的小乐趣','最近的新发现']}
  }
};

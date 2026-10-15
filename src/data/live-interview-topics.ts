import { 
  LiveInterviewCategory, 
  LiveInterviewPurpose, 
  LiveInterviewPersonality, 
  LiveInterviewDifficulty 
} from '@/types';

export interface PredefinedTopic {
  id: string;
  title: string;
  category: LiveInterviewCategory;
  defaultPurpose: LiveInterviewPurpose;
  recommendedDifficulty: LiveInterviewDifficulty;
  context: string;
  starterQuestion: string;
}

export const CATEGORY_METADATA: Record<LiveInterviewCategory, { label: string; iconName: string; description: string }> = {
  technology: {
    label: 'Technology',
    iconName: 'Cpu',
    description: 'Tech trends, software engineering, cloud, cybersecurity & mobile apps'
  },
  artificial_intelligence: {
    label: 'Artificial Intelligence',
    iconName: 'Sparkles',
    description: 'LLMs, automation, future of work, robotics & AI ethics'
  },
  education: {
    label: 'Education & Learning',
    iconName: 'GraduationCap',
    description: 'Online learning, college curriculum, skills-first education & pedagogy'
  },
  college_life: {
    label: 'College & Campus Life',
    iconName: 'Building',
    description: 'Projects, internships, campus clubs, friendships & time management'
  },
  current_affairs: {
    label: 'Current Affairs',
    iconName: 'Globe',
    description: 'Global geopolitical shifts, emerging economies, public policy & news'
  },
  business: {
    label: 'Business & Economy',
    iconName: 'TrendingUp',
    description: 'Startups, financial markets, market disruption & corporate strategy'
  },
  social_issues: {
    label: 'Social Issues',
    iconName: 'Users',
    description: 'Digital divide, mental health, urban development & community wellbeing'
  },
  environment: {
    label: 'Environment & Climate',
    iconName: 'Leaf',
    description: 'Clean energy, sustainability, climate tech & conservation'
  },
  personal_development: {
    label: 'Personal Development',
    iconName: 'Zap',
    description: 'Habits, leadership, resilience, deep work & effective communication'
  },
  custom: {
    label: 'Custom Topic',
    iconName: 'Edit3',
    description: 'Enter any interview question, discussion prompt or debate subject'
  }
};

export const PURPOSE_METADATA: Record<LiveInterviewPurpose, { label: string; description: string; objective: string }> = {
  english_fluency: {
    label: 'English Communication Practice',
    description: 'Natural, spontaneous English conversation focused on vocabulary, grammar, and fluency.',
    objective: 'Express opinions smoothly, eliminate hesitation, and converse confidently without searching for words.'
  },
  campus_placement: {
    label: 'Campus Placement Discussion',
    description: 'Mock placement rounds, behavioral questions, project discussions, and core logic.',
    objective: 'Articulate academic projects, extracurricular leadership, and problem-solving methodologies.'
  },
  hr_interview: {
    label: 'HR / Behavioral Interview',
    description: 'Classic behavioral situations, conflict management, cultural fit, and motivation.',
    objective: 'Deliver structured answers with the STAR framework (Situation, Task, Action, Result).'
  },
  technical_discussion: {
    label: 'Technical Discussion',
    description: 'Architectural trade-offs, coding philosophies, system design, and debugging approaches.',
    objective: 'Demonstrate deep analytical thinking, explain complex concepts simply, and justify design choices.'
  },
  group_discussion: {
    label: 'Group Discussion Practice',
    description: 'Presenting strong points, counter-arguments, synthesis, and constructive agreement.',
    objective: 'State clear theses, back arguments with logic/facts, and synthesize multi-faceted perspectives.'
  },
  general_knowledge: {
    label: 'General Knowledge & Current Affairs',
    description: 'Exploring societal trends, global issues, economic phenomena, and innovations.',
    objective: 'Showcase broad general awareness, critical thinking, and balanced discourse.'
  }
};

export const PERSONALITY_METADATA: Record<LiveInterviewPersonality, { label: string; tag: string; description: string; styleHint: string }> = {
  friendly_mentor: {
    label: 'Friendly Mentor',
    tag: 'Warm & Encouraging',
    description: 'Patient, warm, supportive. Celebrates good points and helps you expand your ideas gently.',
    styleHint: 'Validates your thoughts, asks open-ended clarifying questions, and guides you with warm positivity.'
  },
  professional_interviewer: {
    label: 'Professional Interviewer',
    tag: 'Crisp & Objective',
    description: 'Polite, focused, and corporate. Emphasizes structured reasoning, conciseness, and clarity.',
    styleHint: 'Maintains professional neutrality, probes for concrete examples, and tests answer structure.'
  },
  challenging_interviewer: {
    label: 'Challenging Interviewer',
    tag: 'Probing & Devil’s Advocate',
    description: 'Rigorous and inquisitive. Tests counterarguments, pushes back on weak logic, and probes deeply.',
    styleHint: 'Poses difficult edge cases, politely challenges assumptions, and urges you to defend your perspective.'
  }
};

export const PREDEFINED_TOPICS: PredefinedTopic[] = [
  // Artificial Intelligence
  {
    id: 'ai-jobs',
    title: 'Will Artificial Intelligence create more jobs than it replaces?',
    category: 'artificial_intelligence',
    defaultPurpose: 'english_fluency',
    recommendedDifficulty: 'intermediate',
    context: 'The exponential rise of generative AI, automated coding, and workplace automation has sparked intense debate over the future of human labor.',
    starterQuestion: 'Welcome! Today we are discussing whether artificial intelligence will create more jobs than it replaces. To begin, what is your primary opinion on this?'
  },
  {
    id: 'ai-ethics',
    title: 'Ethical considerations and regulation in autonomous AI systems',
    category: 'artificial_intelligence',
    defaultPurpose: 'technical_discussion',
    recommendedDifficulty: 'advanced',
    context: 'As AI models gain autonomy, concerns around algorithmic bias, data privacy, accountability, and copyright have become critical.',
    starterQuestion: 'Welcome. Today we will explore how AI systems should be regulated. In your view, who should be held accountable when an autonomous AI makes a damaging mistake?'
  },

  // Technology
  {
    id: 'remote-work-tech',
    title: 'The long-term impact of remote vs in-office work on tech innovation',
    category: 'technology',
    defaultPurpose: 'group_discussion',
    recommendedDifficulty: 'intermediate',
    context: 'Companies worldwide are debating whether distributed teams hinder serendipitous innovation or enhance developer productivity.',
    starterQuestion: 'Hello! Today we are examining remote work versus in-office collaboration. Do you believe physical proximity is essential for true team innovation, or is async work superior?'
  },
  {
    id: 'smartphones-attention',
    title: 'Smartphones and the modern attention economy',
    category: 'technology',
    defaultPurpose: 'english_fluency',
    recommendedDifficulty: 'beginner',
    context: 'Short-form media and notifications have drastically altered human attention spans and everyday communication habits.',
    starterQuestion: 'Hello! We are discussing how smartphones affect our concentration and daily habits. How has your own attention span or productivity been impacted by your phone?'
  },

  // Education
  {
    id: 'college-degree-value',
    title: 'Is a traditional 4-year college degree still essential in today’s job market?',
    category: 'education',
    defaultPurpose: 'campus_placement',
    recommendedDifficulty: 'intermediate',
    context: 'With certifications, bootcamps, and open-source learning, the premium on traditional university degrees is being re-evaluated.',
    starterQuestion: 'Welcome. Today’s topic is the practical value of a traditional 4-year college degree. Do you think skills and portfolios have overtaken degrees for modern employers?'
  },
  {
    id: 'ai-in-classroom',
    title: 'Should generative AI tools like ChatGPT be integrated or banned in schools?',
    category: 'education',
    defaultPurpose: 'group_discussion',
    recommendedDifficulty: 'intermediate',
    context: 'Educational institutions are deciding whether AI assistance empowers students or compromises foundational critical thinking.',
    starterQuestion: 'Welcome! We are discussing AI in educational institutions. In your opinion, how should educators adapt their exams when students have access to AI tools?'
  },

  // College Life
  {
    id: 'handling-academic-pressure',
    title: 'Balancing academic deadlines, internships, and mental wellbeing',
    category: 'college_life',
    defaultPurpose: 'english_fluency',
    recommendedDifficulty: 'beginner',
    context: 'College students frequently juggle course projects, placement preparations, and personal life, leading to stress.',
    starterQuestion: 'Hello! Today we are talking about managing college life and deadlines. When you feel overwhelmed with multiple tasks, what is your personal strategy to regain balance?'
  },
  {
    id: 'placement-preparation',
    title: 'A significant project hurdle and how you resolved it (STAR Practice)',
    category: 'college_life',
    defaultPurpose: 'campus_placement',
    recommendedDifficulty: 'intermediate',
    context: 'Recruiters always seek candidates who can clearly describe a real-world technical roadblock and how they methodically overcame it.',
    starterQuestion: 'Welcome to this placement prep interview. Tell me about a time during a major academic or team project when something went wrong unexpectedly. How did you handle it?'
  },

  // Current Affairs & Business
  {
    id: 'startup-vs-corporate',
    title: 'Joining an early-stage startup versus an established multinational corporation',
    category: 'business',
    defaultPurpose: 'hr_interview',
    recommendedDifficulty: 'intermediate',
    context: 'Graduates face a choice between broad ownership and volatility in startups versus structured mentorship in large enterprises.',
    starterQuestion: 'Hello! In this discussion, we are comparing career paths in startups versus large corporations. If you received two identical salary offers today, which environment would you choose and why?'
  },
  {
    id: 'sustainable-business',
    title: 'Can corporations prioritize sustainability without hurting profitability?',
    category: 'environment',
    defaultPurpose: 'group_discussion',
    recommendedDifficulty: 'advanced',
    context: 'Balancing quarterly financial returns with environmental ESG commitments is a central dilemma for modern industry leaders.',
    starterQuestion: 'Welcome! We are discussing green corporate practices. Do you think consumers are truly willing to pay higher prices for environmentally sustainable products?'
  },

  // Social Issues & Personal Development
  {
    id: 'social-media-authenticity',
    title: 'Social media validation versus authentic self-expression',
    category: 'social_issues',
    defaultPurpose: 'english_fluency',
    recommendedDifficulty: 'beginner',
    context: 'Curated online personas often contrast sharply with real-life struggles, influencing youth self-esteem.',
    starterQuestion: 'Hello! Today our topic is the pressure of social media image. Do you think people present an honest reflection of themselves online, and what effect does this have on society?'
  },
  {
    id: 'effective-leadership',
    title: 'What defines a truly impactful leader in a modern workplace?',
    category: 'personal_development',
    defaultPurpose: 'hr_interview',
    recommendedDifficulty: 'intermediate',
    context: 'Leadership has shifted from command-and-control to empathetic collaboration, active listening, and empowering team autonomy.',
    starterQuestion: 'Welcome! Today we are discussing modern leadership qualities. In your experience, what is the single most important habit that separates an inspiring leader from a mediocre manager?'
  }
];

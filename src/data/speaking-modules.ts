export interface ConversationScenario {
  id: string;
  title: string;
  category: 'Networking' | 'Workplace' | 'Social' | 'Everyday Life';
  description: string;
  partnerRole: string;
  userRole: string;
  starterPrompt: string;
  keyPhrasesToUse: string[];
  suggestedSteps: string[];
}

export interface GroupDiscussionTopic {
  id: string;
  topic: string;
  category: string;
  background: string;
  perspectives: {
    role: string;
    viewpoint: string;
    keyArgument: string;
  }[];
  discussionPhases: {
    phase: string;
    suggestedAction: string;
    sampleOpening: string;
  }[];
}

export interface PronunciationItem {
  id: string;
  type: 'minimal-pair' | 'tongue-twister' | 'speech-shadowing';
  title: string;
  focusSound: string;
  content: string;
  phoneticGuide: string;
  audioGuideTip: string;
  commonMistake: string;
}

export interface GrammarPattern {
  id: string;
  category: 'Verb Tense' | 'Subject-Verb Agreement' | 'Articles' | 'Prepositions' | 'Sentence Structure';
  ruleTitle: string;
  explanation: string;
  incorrectExample: string;
  correctExample: string;
  whyWrong: string;
  practiceDrill: {
    prompt: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  };
}

export const CONVERSATION_SCENARIOS: ConversationScenario[] = [
  {
    id: 'conv-1',
    title: 'Introducing Yourself at an Industry Tech Mixer',
    category: 'Networking',
    description: 'You are standing near the refreshment table at an engineering networking meetup and strike up a conversation with a senior product director from an innovative tech firm.',
    partnerRole: 'Alex, Senior Product Director at CloudFlow',
    userRole: 'Aspiring Software Engineer / Job Seeker',
    starterPrompt: '"Hi there! Great keynote talk on distributed systems earlier, wasn’t it? I’m Alex from CloudFlow."',
    keyPhrasesToUse: [
      'It’s a pleasure to meet you, Alex.',
      'What caught my attention in the talk was...',
      'I’ve been following CloudFlow’s recent work on...',
      'I’d love to stay connected on LinkedIn if you have a moment.'
    ],
    suggestedSteps: [
      'Acknowledge their opening remark and introduce your name with a warm, confident smile',
      'Share one specific insight from the event that resonates with your interests',
      'Ask an engaging open-ended question about their role or recent project',
      'Gracefully request their LinkedIn or digital business card to stay in touch'
    ]
  },
  {
    id: 'conv-2',
    title: 'Asking Your Manager for Constructive Project Feedback',
    category: 'Workplace',
    description: 'You completed your first sprint deliverables last week and want proactive feedback from your manager during your bi-weekly 1-on-1 meeting.',
    partnerRole: 'Jordan, Engineering Manager',
    userRole: 'Software Developer',
    starterPrompt: '"Hey! Thanks for taking the time. How are things going on your end this week?"',
    keyPhrasesToUse: [
      'I wanted to review the recent sprint outcomes with you...',
      'Where do you see opportunities for me to sharpen my execution?',
      'Was there anything in the client demo that could have been clearer?',
      'I really appreciate your guidance on this.'
    ],
    suggestedSteps: [
      'Express genuine enthusiasm for your current project work',
      'Ask specifically for areas of improvement rather than general praise',
      'Listen without becoming defensive and take notes',
      'Propose one concrete action item based on their advice'
    ]
  },
  {
    id: 'conv-3',
    title: 'Resolving a Friendly Disagreement in a Group Assignment',
    category: 'Social',
    description: 'A teammate wants to cram the entire final presentation slides with dense text, while you know that visuals and bullet points create a much higher impact.',
    partnerRole: 'Sam, College Project Teammate',
    userRole: 'Project Presenter',
    starterPrompt: '"Look, I spent five hours writing all these details onto the slides so the professor knows we did all the research."',
    keyPhrasesToUse: [
      'I completely agree that your research is fantastic, Sam.',
      'The challenge is that audiences get overwhelmed when reading dense paragraphs.',
      'What if we keep the detailed research in our speaker notes or appendix?',
      'Let’s test how a slide looks with three crisp takeaways and a diagram.'
    ],
    suggestedSteps: [
      'Validate their hard work and dedication first before suggesting changes',
      'Frame the change as an enhancement for audience clarity, not a critique of their research',
      'Offer a win-win compromise (e.g., visual slides + detailed appendix)',
      'Reach mutual agreement with mutual respect'
    ]
  }
];

export const GROUP_DISCUSSION_TOPICS: GroupDiscussionTopic[] = [
  {
    id: 'gd-1',
    topic: 'Remote Work vs Return to Office: Striking the Optimal Hybrid Balance',
    category: 'Business & Workforce',
    background: 'Companies worldwide are debating mandatory in-office attendance against remote flexibility, balancing team cohesion against employee satisfaction.',
    perspectives: [
      {
        role: 'Pro-Office Advocate',
        viewpoint: 'Physical presence builds camaraderie, spontaneous whiteboard brainstorming, and crucial apprenticeship for new college hires.',
        keyArgument: 'Remote teams suffer from cultural erosion and isolation over time.'
      },
      {
        role: 'Pro-Remote Advocate',
        viewpoint: 'Autonomy and zero commutes improve mental health, eliminate real estate costs, and democratize hiring across global talent pools.',
        keyArgument: 'Output and deliverables matter far more than hours spent sitting in traffic.'
      },
      {
        role: 'The Balanced Moderator',
        viewpoint: 'A flexible hybrid model (2-3 intentional collaborative days) delivers the best of both worlds if meetings are structured with purpose.',
        keyArgument: 'Presence should be for collaboration, while deep analytical work is done remotely.'
      }
    ],
    discussionPhases: [
      {
        phase: 'Opening / Setting the Stage',
        suggestedAction: 'Define the topic, acknowledge both corporate and employee needs, and frame the discussion around sustainable productivity.',
        sampleOpening: '"Good morning, everyone. The debate between remote flexibility and office presence touches both business efficiency and human well-being..."'
      },
      {
        phase: 'Entering the Discussion with a Point',
        suggestedAction: 'Build on another speaker’s thought respectfully and introduce data or real-world examples.',
        sampleOpening: '"I completely agree with that perspective on team cohesion, and to add a dimension to it, we must also consider..."'
      },
      {
        phase: 'Summarizing and Guiding Consensus',
        suggestedAction: 'Synthesize the core arguments into an actionable takeaway that unites the group.',
        sampleOpening: '"To synthesize what our group has discussed today, the core consensus is that hybrid work succeeds when presence is intentional..."'
      }
    ]
  },
  {
    id: 'gd-2',
    topic: 'Should Coding Still Be a Mandatory Core Subject in the Age of Generative AI?',
    category: 'Education & Technology',
    background: 'With AI tools generating boilerplate and debugging code in seconds, educators are rethinking whether every student needs to learn programming syntax.',
    perspectives: [
      {
        role: 'Traditional Computer Science Educator',
        viewpoint: 'Coding teaches fundamental logic, algorithmic decomposition, and problem-solving that is essential even if AI writes syntax.',
        keyArgument: 'You cannot verify an AI’s code if you do not understand the underlying fundamentals.'
      },
      {
        role: 'Modern Technologist & Futurist',
        viewpoint: 'Prompt engineering, domain expertise, systems thinking, and ethical verification are now far more critical than memorizing syntax.',
        keyArgument: 'Coding education should shift from low-level syntax to high-level architectural design.'
      }
    ],
    discussionPhases: [
      {
        phase: 'Opening',
        suggestedAction: 'Highlight the speed of AI advancement and ask what foundational intellectual skills schools must instill.',
        sampleOpening: '"Friends, as generative AI can write code in milliseconds, our discussion today on the role of coding education is timely and essential..."'
      },
      {
        phase: 'Mid-Discussion Contribution',
        suggestedAction: 'Make the distinction between syntax memorization and computational thinking.',
        sampleOpening: '"That is a vital point. Let us distinguish between memorizing syntax and cultivating computational problem-solving..."'
      },
      {
        phase: 'Concluding Consensus',
        suggestedAction: 'Conclude that computational thinking remains indispensable, while teaching methods must modernize.',
        sampleOpening: '"In conclusion, our group agrees that while the way we write code has evolved, the algorithmic logic behind it remains a fundamental literacy..."'
      }
    ]
  }
];

export const PRONUNCIATION_ITEMS: PronunciationItem[] = [
  {
    id: 'pron-1',
    type: 'minimal-pair',
    title: 'Short /ɪ/ vs Long /iː/ (Ship vs Sheep)',
    focusSound: '/ɪ/ vs /iː/',
    content: 'Sit vs Seat | Ship vs Sheep | Fit vs Feet | Bit vs Beat | Hit vs Heat',
    phoneticGuide: '/sɪt/ vs /siːt/',
    audioGuideTip: 'For the short /ɪ/ sound, keep your mouth relaxed and jaw slightly open. For the long /iː/, stretch your lips into a smile and hold the sound slightly longer.',
    commonMistake: 'Pronouncing "sit" as "seat", which can cause confusion in sentences like "Please take a seat" vs "Please sit".'
  },
  {
    id: 'pron-2',
    type: 'minimal-pair',
    title: '/v/ vs /w/ Sound Mastery (Vest vs West)',
    focusSound: '/v/ vs /w/',
    content: 'Vest vs West | Vine vs Wine | Vet vs Wet | Vow vs Wow | Very vs Wary',
    phoneticGuide: '/vest/ vs /west/',
    audioGuideTip: 'For /v/, gently rest your top front teeth on your lower bottom lip and vibrate your vocal cords. For /w/, round your lips into a small circle like an "O" without touching teeth to lips.',
    commonMistake: 'Using /w/ for /v/ words (saying "wery" instead of "very"), very common among non-native English speakers.'
  },
  {
    id: 'pron-3',
    type: 'tongue-twister',
    title: 'The /θ/ and /ð/ Dental Fricative Challenge',
    focusSound: '/θ/ and /s/',
    content: 'Thirty-three thousand thinkers thought that they thriller-tested three thoughtful theories.',
    phoneticGuide: '/θɜːti θriː θaʊzənd θɪŋkəz/',
    audioGuideTip: 'Gently place the tip of your tongue between your top and bottom teeth and push air through without closing your mouth completely.',
    commonMistake: 'Replacing the /θ/ sound with /t/ or /s/ (e.g., saying "tirty-tree" instead of "thirty-three").'
  },
  {
    id: 'pron-4',
    type: 'speech-shadowing',
    title: 'Steve Jobs 2005 Stanford Commencement Excerpt',
    focusSound: 'Cadence, rhythm, and intentional pauses',
    content: 'Your time is limited, so don’t waste it living someone else’s life. Don’t be trapped by dogma — which is living with the results of other people’s thinking.',
    phoneticGuide: 'Notice the deliberate pauses after "limited" and after "dogma".',
    audioGuideTip: 'Shadow this sentence by matching the speaker’s exact breathing rhythm, pitch inflection, and deliberate pauses.',
    commonMistake: 'Rushing through without pauses, which strips the message of emotional weight.'
  }
];

export const GRAMMAR_PATTERNS: GrammarPattern[] = [
  {
    id: 'gram-1',
    category: 'Subject-Verb Agreement',
    ruleTitle: 'Singular Indefinite Pronouns take Singular Verbs',
    explanation: 'Pronouns like "everyone", "everybody", "anyone", "each", and "neither" are grammatically singular in English, even though they feel plural in meaning.',
    incorrectExample: 'Everyone in the engineering department have submitted their timesheet.',
    correctExample: 'Everyone in the engineering department has submitted their timesheet.',
    whyWrong: '"Everyone" is grammatically singular, so it requires the singular auxiliary verb "has", not "have".',
    practiceDrill: {
      prompt: 'Each of the participants _______ received a certificate of completion.',
      options: ['have', 'has', 'are', 'were'],
      correctIndex: 1,
      explanation: '"Each" is singular, so it correctly pairs with "has".'
    }
  },
  {
    id: 'gram-2',
    category: 'Prepositions',
    ruleTitle: 'Discussing, Emphasizing, and Resembling do NOT take Prepositions',
    explanation: 'Verbs like "discuss", "emphasize", "comprise", and "resemble" are transitive and take direct objects without extra prepositions like "about" or "on".',
    incorrectExample: 'We need to discuss about the project architecture tomorrow.',
    correctExample: 'We need to discuss the project architecture tomorrow.',
    whyWrong: '"Discuss" already means "talk about", so adding "about" creates an ungrammatical redundancy.',
    practiceDrill: {
      prompt: 'During the sprint review, the product director _______ the importance of customer security.',
      options: ['emphasized on', 'emphasized', 'emphasized about', 'emphasized upon'],
      correctIndex: 1,
      explanation: '"Emphasize" is transitive and takes the direct object directly without "on".'
    }
  },
  {
    id: 'gram-3',
    category: 'Verb Tense',
    ruleTitle: 'Since vs For with Present Perfect Tense',
    explanation: 'Use "since" with a specific point in time (since 2021, since Monday). Use "for" with a duration or length of time (for three years, for two hours).',
    incorrectExample: 'I have been working as a software developer since four years.',
    correctExample: 'I have been working as a software developer for four years.',
    whyWrong: '"Four years" is a duration of time, which requires "for". Use "since" only with a starting anchor (e.g., "since 2022").',
    practiceDrill: {
      prompt: 'She has been studying computer science _______ she was fifteen years old.',
      options: ['for', 'since', 'during', 'from'],
      correctIndex: 1,
      explanation: '"She was fifteen years old" is a specific starting point in time, requiring "since".'
    }
  },
  {
    id: 'gram-4',
    category: 'Sentence Structure',
    ruleTitle: 'Avoiding Dangling Modifiers',
    explanation: 'A modifying phrase at the beginning of a sentence must logically describe the subject that immediately follows the comma.',
    incorrectExample: 'Walking into the interview room, the questions seemed terrifying.',
    correctExample: 'Walking into the interview room, I felt that the questions were terrifying.',
    whyWrong: 'The questions were not walking into the room; you were walking into the room! The modifier must attach to the person.',
    practiceDrill: {
      prompt: 'Select the grammatically correct sentence:',
      options: [
        'Having finished the code review, the bug was finally resolved.',
        'Having finished the code review, the engineer deployed the fix to production.',
        'Having finished the code review, celebration began.',
        'Having finished the code review, the computer was shut down.'
      ],
      correctIndex: 1,
      explanation: 'Only "the engineer" is a person capable of finishing the code review.'
    }
  }
];

import { VocabularyWord } from '@/types';

export const VOCABULARY_WORDS: VocabularyWord[] = [
  {
    id: 'vocab-1',
    word: 'Articulate',
    phonetic: '/ɑːrˈtɪk.jə.lət/',
    partOfSpeech: 'adjective / verb',
    meaning: 'Having or showing the ability to speak fluently and coherently; expressing an idea clearly.',
    level: 'Intermediate',
    category: 'Communication',
    synonyms: ['Eloquent', 'Lucid', 'Fluent', 'Coherent', 'Expressive'],
    antonyms: ['Inarticulate', 'Hesitant', 'Muffled', 'Unclear', 'Incoherent'],
    exampleSentences: [
      'She gave an articulate defense of her proposal during the board meeting.',
      'To pass the technical interview, you must articulate complex logic in simple terms.'
    ],
    commonMistake: 'Using "articulate" as a noun (e.g., "He is an articulate" - say "He is an articulate speaker").',
    practicalTip: 'Before you speak, pause for two seconds to form your topic sentence in your mind so your thoughts sound articulate.',
    quizQuestion: {
      question: 'Which of the following best describes an "articulate" speaker?',
      options: [
        'Someone who speaks very loudly and aggressively',
        'Someone who expresses thoughts clearly and effectively',
        'Someone who uses unnecessarily complicated jargon',
        'Someone who speaks quickly without taking breaths'
      ],
      correctIndex: 1,
      explanation: '"Articulate" means able to express ideas fluently, coherently, and clearly.'
    }
  },
  {
    id: 'vocab-2',
    word: 'Pragmatic',
    phonetic: '/præɡˈmæt.ɪk/',
    partOfSpeech: 'adjective',
    meaning: 'Dealing with things sensibly and realistically in a way that is based on practical rather than theoretical considerations.',
    level: 'Intermediate',
    category: 'Business & Leadership',
    synonyms: ['Practical', 'Realistic', 'Sensible', 'Utilitarian', 'Down-to-earth'],
    antonyms: ['Idealistic', 'Impractical', 'Theoretical', 'Utopian', 'Visionary'],
    exampleSentences: [
      'In a startup crisis, we need pragmatic solutions that generate cash flow immediately.',
      'He took a pragmatic approach to negotiating salary, balancing ambition with company budget limits.'
    ],
    commonMistake: 'Confusing pragmatic with cynical. Pragmatic means realistic and grounded, not selfish or negative.',
    practicalTip: 'Use "pragmatic" in interviews when explaining how you balanced high standards with tight project deadlines.',
    quizQuestion: {
      question: 'What is the opposite of a "pragmatic" plan?',
      options: [
        'An organized plan',
        'A costly plan',
        'An unrealistic or purely idealistic plan',
        'A collaborative plan'
      ],
      correctIndex: 2,
      explanation: '"Idealistic" or "impractical" is the antonym of pragmatic.'
    }
  },
  {
    id: 'vocab-3',
    word: 'Resilient',
    phonetic: '/rɪˈzɪl.jənt/',
    partOfSpeech: 'adjective',
    meaning: 'Able to withstand or recover quickly from difficult conditions, setbacks, or trauma.',
    level: 'Beginner',
    category: 'Personal Growth',
    synonyms: ['Tough', 'Tenacious', 'Adaptable', 'Unyielding', 'Buoyant'],
    antonyms: ['Fragile', 'Vulnerable', 'Brittle', 'Delicate', 'Defeated'],
    exampleSentences: [
      'Successful entrepreneurs are remarkably resilient in the face of continuous product rejection.',
      'The economy proved more resilient than forecasters expected after the supply shock.'
    ],
    commonMistake: 'Saying "resilient to" instead of "resilient in the face of" or "resilient against".',
    practicalTip: 'Highlight resilience in your behavioral interview answers by describing what you learned after a failure.',
    quizQuestion: {
      question: 'A person who bounces back quickly after a major job rejection is:',
      options: [
        'Complacent',
        'Resilient',
        'Reticent',
        'Sycophantic'
      ],
      correctIndex: 1,
      explanation: 'Resilience is the ability to recover swiftly from adversity.'
    }
  },
  {
    id: 'vocab-4',
    word: 'Equanimity',
    phonetic: '/ˌiː.kwəˈnɪm.ə.t̬i/',
    partOfSpeech: 'noun',
    meaning: 'Mental calmness, composure, and evenness of temper, especially in a difficult or provocative situation.',
    level: 'Advanced',
    category: 'Emotional Intelligence',
    synonyms: ['Composure', 'Serenity', 'Poise', 'Tranquility', 'Self-possession'],
    antonyms: ['Agitation', 'Panic', 'Hysteria', 'Turbulence', 'Anxiety'],
    exampleSentences: [
      'The pilot maintained absolute equanimity despite the cockpit warning alarms.',
      'She accepted both high praise and fierce criticism with identical equanimity.'
    ],
    commonMistake: 'Misspelling as "equinimity" or confusing with "equality". Equanimity comes from "equal mind" (equa + animus).',
    practicalTip: 'Use "with equanimity" to describe how you responded calmly to an aggressive customer or critic.',
    quizQuestion: {
      question: 'Which action exemplifies "equanimity"?',
      options: [
        'Shouting angrily during an argument',
        'Remaining calm and composed while addressing an emergency',
        'Avoiding making any decisions out of fear',
        'Celebrating excessively after a minor win'
      ],
      correctIndex: 1,
      explanation: 'Equanimity means maintaining poise and mental calmness under pressure.'
    }
  },
  {
    id: 'vocab-5',
    word: 'Superfluous',
    phonetic: '/suːˈpɝː.flu.əs/',
    partOfSpeech: 'adjective',
    meaning: 'Exceeding what is sufficient or necessary; extra and unnecessary.',
    level: 'Advanced',
    category: 'Writing & Speaking',
    synonyms: ['Redundant', 'Excessive', 'Surplus', 'Gratuitous', 'Supererogatory'],
    antonyms: ['Essential', 'Necessary', 'Vital', 'Indispensable', 'Required'],
    exampleSentences: [
      'Cut all superfluous words from your resume to ensure it fits neatly onto one page.',
      'The slide deck was packed with superfluous statistics that confused the executive audience.'
    ],
    commonMistake: 'Pronouncing the emphasis on the third syllable ("super-FLU-ous"). Correct emphasis is on the second syllable: /suːˈpɝː.flu.əs/ ("su-PER-floo-us").',
    practicalTip: 'When editing your speeches, eliminate filler words and superfluous adjectives to keep your delivery punchy.',
    quizQuestion: {
      question: 'If an explanation contains "superfluous" details, those details are:',
      options: [
        'Crucial for understanding',
        'Completely false',
        'Unnecessary and excessive',
        'Extremely secretive'
      ],
      correctIndex: 2,
      explanation: 'Superfluous means unnecessary, more than what is needed.'
    }
  },
  {
    id: 'vocab-6',
    word: 'Conscientious',
    phonetic: '/ˌkɑːn.ʃiˈen.ʃəs/',
    partOfSpeech: 'adjective',
    meaning: 'Wishing to do what is right, especially to do one’s work or duty well, thoroughly, and carefully.',
    level: 'Intermediate',
    category: 'Workplace & Character',
    synonyms: ['Diligent', 'Meticulous', 'Thorough', 'Painstaking', 'Scrupulous'],
    antonyms: ['Careless', 'Negligent', 'Slapdash', 'Irresponsible', 'Casual'],
    exampleSentences: [
      'She is a conscientious engineer who verifies every database migration before deployment.',
      'His conscientious attention to client feedback earned him early promotion.'
    ],
    commonMistake: 'Confusing "conscientious" (diligent/thorough) with "conscious" (awake/aware).',
    practicalTip: 'Conscientiousness is one of the "Big Five" personality traits most strongly correlated with job performance.',
    quizQuestion: {
      question: 'A worker who double-checks safety protocols and never takes reckless shortcuts is:',
      options: [
        'Conscientious',
        'Ambivalent',
        'Apathetic',
        'Dogmatic'
      ],
      correctIndex: 0,
      explanation: 'Conscientious means thorough, diligent, and careful in fulfilling duties.'
    }
  },
  {
    id: 'vocab-7',
    word: 'Nuance',
    phonetic: '/ˈnuː.ɑːns/',
    partOfSpeech: 'noun / verb',
    meaning: 'A subtle distinction or variation in meaning, expression, tone, or response.',
    level: 'Intermediate',
    category: 'Analysis & Thought',
    synonyms: ['Subtlety', 'Distinction', 'Subtlety', 'Shade', 'Gradation'],
    antonyms: ['Oversimplification', 'Crude uniformity', 'Bluntness'],
    exampleSentences: [
      'Social media debates often collapse complex moral nuances into black-and-white outrage.',
      'An experienced diplomat understands the subtle nuances of body language and formal etiquette.'
    ],
    commonMistake: 'Saying "small nuance" (nuance is already by definition a subtle, small distinction).',
    practicalTip: 'Use phrases like "There is an important nuance here" when answering interview questions to show analytical depth.',
    quizQuestion: {
      question: 'Which of the following represents a "nuanced" viewpoint?',
      options: [
        'Technology is 100% evil and will destroy everyone',
        'Technology brings immense communication benefits, but requires safeguards against privacy erosion',
        'All people who disagree with me are foolish',
        'There is only one correct way to live your life'
      ],
      correctIndex: 1,
      explanation: 'A nuanced viewpoint recognizes subtle distinctions, trade-offs, and complexities.'
    }
  },
  {
    id: 'vocab-8',
    word: 'Ambiguous',
    phonetic: '/æmˈbɪɡ.ju.əs/',
    partOfSpeech: 'adjective',
    meaning: 'Open to more than one interpretation; having a double meaning; unclear or indefinite.',
    level: 'Beginner',
    category: 'Clarity & Logic',
    synonyms: ['Equivocal', 'Vague', 'Obscure', 'Unclear', 'Enigmatic'],
    antonyms: ['Unambiguous', 'Clear', 'Explicit', 'Definite', 'Lucid'],
    exampleSentences: [
      'The election results remained ambiguous until the final mail-in ballots were tallied.',
      'Her ambiguous phrasing left the team confused about who was responsible for the deadline.'
    ],
    commonMistake: 'Confusing "ambiguous" (unclear/multiple meanings) with "ambivalent" (having mixed feelings about something).',
    practicalTip: 'In engineering and business, ambiguous specifications lead to costly rework. Always clarify expectations.',
    quizQuestion: {
      question: 'If a project requirement is "ambiguous", it is:',
      options: [
        'Extremely ambitious',
        'Clear and well-documented',
        'Unclear and open to multiple conflicting interpretations',
        'Easy to finish in one day'
      ],
      correctIndex: 2,
      explanation: 'Ambiguous means vague, indefinite, or open to more than one interpretation.'
    }
  },
  {
    id: 'vocab-9',
    word: 'Sycophant',
    phonetic: '/ˈsɪk.ə.fænt/',
    partOfSpeech: 'noun',
    meaning: 'A person who acts obsequiously toward someone important in order to gain advantage; a flatterer.',
    level: 'Advanced',
    category: 'Leadership & Society',
    synonyms: ['Flatterer', 'Yes-man', 'Toady', 'Bootlicker', 'Lackey'],
    antonyms: ['Critic', 'Challenger', 'Truth-teller', 'Maverick'],
    exampleSentences: [
      'The CEO was surrounded by sycophants who praised every flawed marketing decision he made.',
      'True leaders do not promote sycophants; they cultivate honest thinkers who dare to disagree.'
    ],
    commonMistake: 'Mispronouncing "psycho" into sycophant. The root is Greek (sykophantēs).',
    practicalTip: 'In leadership discussions, explain that sycophants create dangerous corporate blind spots.',
    quizQuestion: {
      question: 'A person who blindly flatters the boss to get an unearned promotion is called a:',
      options: [
        'Philanthropist',
        'Sycophant',
        'Visionary',
        'Diplomat'
      ],
      correctIndex: 1,
      explanation: 'A sycophant is someone who flatters superiors servilely for selfish gain.'
    }
  },
  {
    id: 'vocab-10',
    word: 'Ephemeral',
    phonetic: '/ɪˈfem.ər.əl/',
    partOfSpeech: 'adjective',
    meaning: 'Lasting for a very short time; fleeting or transitory.',
    level: 'Advanced',
    category: 'Philosophy & Lifestyle',
    synonyms: ['Fleeting', 'Transient', 'Transitory', 'Momentary', 'Short-lived'],
    antonyms: ['Permanent', 'Eternal', 'Enduring', 'Everlasting', 'Perennial'],
    exampleSentences: [
      'Social media virality is ephemeral; true brand reputation is built over decades.',
      'The beauty of cherry blossoms lies in their ephemeral nature.'
    ],
    commonMistake: 'Using "ephemeral" for tangible physical objects when you mean fragile. Ephemeral refers to duration in time, not structural strength.',
    practicalTip: 'Contrast ephemeral trends with durable foundational skills in speeches about career longevity.',
    quizQuestion: {
      question: 'Which of the following is the best example of an "ephemeral" event?',
      options: [
        'A granite mountain standing for millions of years',
        'A viral internet meme that is forgotten within three days',
        'A permanent constitutional amendment',
        'The laws of physics'
      ],
      correctIndex: 1,
      explanation: 'Ephemeral means lasting for only a brief, fleeting period.'
    }
  }
];

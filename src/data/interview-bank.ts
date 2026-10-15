import { InterviewQuestion } from '@/types';

export const INTERVIEW_QUESTIONS: InterviewQuestion[] = [
  // HR & Standard (1-3)
  {
    id: 'int-1',
    question: 'Tell me about yourself and why you are interested in this role.',
    category: 'HR',
    starContext: {
      situationHint: 'Briefly summarize your academic or professional background and core areas of focus.',
      taskHint: 'Mention the core skills or unique strengths you have developed.',
      actionHint: 'Give a concrete example of a project or impact that demonstrates your enthusiasm.',
      resultHint: 'Connect your trajectory directly to why this role and company are the logical next step.'
    },
    sampleGoodAnswer: 'I am a software engineer with a strong foundation in full-stack web applications and distributed systems. Over the past two years, I built and scaled real-time collaborative web tools that served over ten thousand active users. In my recent role, I noticed that our data processing pipeline was experiencing frequent latency spikes during peak hours. I took the initiative to refactor our serverless caching layer and implement Redis caching, which reduced average response latency by 42%. I have been following your team’s recent launch of your cloud communications suite, and I am excited about this role because my background in scalable web interfaces directly aligns with your upcoming product expansion.',
    keyLookouts: [
      'Avoid reciting the resume line-by-line',
      'Keep the response between 90 and 120 seconds',
      'End with a clear, enthusiastic connection to the company',
      'Speak with confident pacing and clear structure'
    ]
  },
  {
    id: 'int-2',
    question: 'What is your greatest professional weakness, and what concrete steps have you taken to manage it?',
    category: 'HR',
    starContext: {
      situationHint: 'Choose a real, non-fatal professional weakness (avoid cliché non-answers like "I am a perfectionist").',
      taskHint: 'Describe a scenario where this weakness presented a challenge.',
      actionHint: 'Detail the proactive habit, framework, or tool you instituted to counteract it.',
      resultHint: 'Explain how your performance improved as a direct consequence of this system.'
    },
    sampleGoodAnswer: 'Historically, my greatest weakness was difficulty delegating tasks when leading projects. Because I felt personally responsible for the final output, I would absorb excess individual tasks myself, which created bottlenecks for the team. During a university tech symposium where I led a team of six developers, I realized this approach was burning me out and depriving junior team members of learning opportunities. To solve this, I adopted a structured delegation framework: breaking deliverables into clear GitHub milestones, setting up daily ten-minute standups, and providing clear acceptance criteria rather than micromanaging implementation. As a result, our team delivered the event portal three days ahead of schedule, and two junior team members were empowered to lead subsequent sub-modules.',
    keyLookouts: [
      'Demonstrate genuine self-awareness and emotional maturity',
      'Focus the majority of the answer on the corrective action taken',
      'Avoid disqualifying weaknesses (e.g., "I don’t meet deadlines")',
      'Show ongoing commitment to professional growth'
    ]
  },
  {
    id: 'int-3',
    question: 'Where do you see yourself in five years, and how does this position fit into that vision?',
    category: 'HR',
    starContext: {
      situationHint: 'Frame your ambition around deep skill mastery, leadership capability, and business impact.',
      taskHint: 'Specify the domain knowledge you intend to cultivate in the next 2-3 years.',
      actionHint: 'Explain how you plan to mentor others and take on larger cross-functional ownership.',
      resultHint: 'Align your long-term aspiration with the growth opportunities within the company.'
    },
    sampleGoodAnswer: 'Over the next five years, my goal is to develop from an effective individual contributor into a technical lead who bridges engineering excellence with strategic product vision. In the first two years, I want to immerse myself in your codebase, mastering your architectural standards and delivering high-impact features with exceptional reliability. By year three and four, I see myself taking ownership of system architecture, mentoring junior engineers, and collaborating closely with product managers to shape technical roadmaps. This position is ideal because your organization emphasizes both rigorous technical craft and clear internal growth pathways.',
    keyLookouts: [
      'Balance ambition with realistic patience',
      'Do not express plans to jump ship to a competitor or enter a totally unrelated field',
      'Show that you want to grow WITH the organization'
    ]
  },

  // Behavioral & STAR Method (4-6)
  {
    id: 'int-4',
    question: 'Describe a situation where you had a significant disagreement with a colleague or manager. How did you handle it?',
    category: 'Behavioral',
    starContext: {
      situationHint: 'SITUATION: Describe the project, the conflicting viewpoint, and what was at stake.',
      taskHint: 'TASK: Explain the goal of reaching a collaborative consensus without derailing the deadline.',
      actionHint: 'ACTION: Highlight active listening, data-driven reasoning, and respectful communication.',
      resultHint: 'RESULT: Share the mutually agreed outcome, the deliverable success, and the preserved working relationship.'
    },
    sampleGoodAnswer: 'During our final semester capstone project, my technical co-lead and I strongly disagreed on our database choice. He wanted to use MongoDB for its schema flexibility, while I advocated for PostgreSQL because our application required strict relational foreign keys and financial transaction consistency. Rather than turning the disagreement into a heated debate, I suggested we conduct a 24-hour benchmark. We defined clear criteria: write throughput, ACID compliance guarantees, and reporting query complexity. When we modeled our core user transaction flows, PostgreSQL demonstrated clear data integrity advantages while eliminating several complex application-level checks. My teammate agreed with the benchmark findings, and in turn, I supported his proposal to use Dockerized containers for deployment. The project was awarded highest honors, and our working relationship grew even stronger because we prioritized data over ego.',
    keyLookouts: [
      'Focus on the issue and data, never personal criticism',
      'Show empathy and the ability to compromise constructively',
      'Demonstrate that the relationship remained strong afterwards'
    ]
  },
  {
    id: 'int-5',
    question: 'Tell me about a time when a project you were working on failed or missed expectations. What happened and what did you learn?',
    category: 'Behavioral',
    starContext: {
      situationHint: 'SITUATION: Set up the project and the high expectations that were initially set.',
      taskHint: 'TASK: Explain your responsibility and the unforeseen obstacle that emerged.',
      actionHint: 'ACTION: Describe how you communicated the setback, contained damage, and diagnosed the root cause.',
      resultHint: 'RESULT: Detail the systemic changes you implemented to prevent recurrence in future projects.'
    },
    sampleGoodAnswer: 'During an internship at a logistics startup, I was tasked with building an automated notification pipeline for delivery status updates. I finished the code and tested it in staging with fifty sample users, where it performed flawlessly. However, on launch day, when two thousand orders entered the queue simultaneously, our third-party SMS provider rate-limited our API key, causing thousands of text alerts to be delayed by over three hours. It was an embarrassing failure, and customers were confused. I immediately owned the oversight, notified the engineering lead, and drafted a clear status communication for the customer support team. That evening, I redesigned the service with an asynchronous queue and exponential backoff retry logic, while adding batching to prevent API throttling. That experience taught me never to assume staging performance translates directly to production load without simulated stress testing.',
    keyLookouts: [
      'Take unambiguous personal accountability without making excuses',
      'Demonstrate quick, transparent crisis communication',
      'Highlight concrete technical and operational lessons learned'
    ]
  },
  {
    id: 'int-6',
    question: 'Give an example of a time when you had to adapt quickly to a major unexpected change or tight deadline.',
    category: 'Behavioral',
    starContext: {
      situationHint: 'SITUATION: Describe an abrupt change in project scope, team member departure, or halved deadline.',
      taskHint: 'TASK: Define what needed to be accomplished despite the disruption.',
      actionHint: 'ACTION: Explain how you reprioritized, communicated with stakeholders, and executed under pressure.',
      resultHint: 'RESULT: Share the successful delivery and positive feedback received.'
    },
    sampleGoodAnswer: 'Two weeks before our company’s annual client demo, our lead frontend developer had to take an emergency leave of absence. At the same time, the client requested a major redesign of the analytics dashboard module. As the remaining developer, I had to prevent project slippage. I immediately organized a triaging meeting with the product manager. We categorized the requested dashboard widgets into non-negotiable core metrics versus secondary visual enhancements, securing approval to defer the secondary items to a subsequent patch. I then blocked dedicated four-hour deep-work sessions each morning, leveraging pre-built component libraries to accelerate styling. We shipped the core analytics dashboard twenty-four hours ahead of the demo, and the client signed an annual contract extension without noticing any disruption.',
    keyLookouts: [
      'Show calm composure under sudden pressure',
      'Highlight ruthless prioritization and clear stakeholder alignment',
      'Focus on delivered business outcome'
    ]
  },

  // Campus Placement & Fresher (7-8)
  {
    id: 'int-7',
    question: 'Why should our company hire you over other qualified candidates from your campus?',
    category: 'Campus Placement',
    starContext: {
      situationHint: 'Acknowledge the strong peer talent pool with respect rather than arrogance.',
      taskHint: 'Highlight your unique intersection of technical skill, proactive initiative, and coachability.',
      actionHint: 'Give a brief example showing self-driven learning beyond classroom syllabi.',
      resultHint: 'Express your readiness to deliver immediate value and absorb mentorship.'
    },
    sampleGoodAnswer: 'My campus is fortunate to have many brilliant engineers who have earned strong academic grades. What distinguishes me is my proactive track record of turning theory into production software. While our university syllabus stopped at basic algorithmic problems, I built and deployed three end-to-end full-stack applications on my own initiative, including a campus peer-tutoring marketplace that actively connects over four hundred students. Through building that, I encountered real-world challenges like database indexing, session authentication, and API latency that cannot be learned from a textbook alone. Beyond technical competence, I bring intense curiosity, strong communication, and humility: I am eager to learn from your senior engineers and contribute meaningful value to your sprint velocity from day one.',
    keyLookouts: [
      'Do not demean other candidates',
      'Provide tangible proof of self-motivated initiative',
      'Showcase eagerness to learn and contribute to team culture'
    ]
  },
  {
    id: 'int-8',
    question: 'How do you keep your technical skills sharp in such a fast-moving industry?',
    category: 'Campus Placement',
    starContext: {
      situationHint: 'Explain your philosophy toward continuous professional learning.',
      taskHint: 'Mention the specific sources, newsletters, and open-source communities you follow.',
      actionHint: 'Describe how you test new concepts through small experimental sandboxes and side projects.',
      resultHint: 'Show how this ongoing curiosity improves your day-to-day code quality.'
    },
    sampleGoodAnswer: 'I view continuous learning as a daily discipline rather than an occasional chore. I subscribe to engineering blogs from teams like Netflix, Stripe, and Cloudflare to understand real-world architectural design trade-offs. Additionally, whenever a new library or paradigm catches my interest—such as React Server Components or Edge computing—I don’t just read the documentation; I build a small weekend prototype to test its strengths and failure modes firsthand. For instance, experimenting with Next.js App Router in personal projects allowed me to immediately help my academic team migrate an older single-page app to server-side rendering, dramatically improving our initial load times.',
    keyLookouts: [
      'Demonstrate genuine curiosity rather than forced compliance',
      'Reference specific, respected industry resources',
      'Emphasize hands-on experimentation over passive reading'
    ]
  }
];

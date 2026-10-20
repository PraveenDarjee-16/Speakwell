import test from 'node:test';
import assert from 'node:assert/strict';
import { LiveSpeechRecognitionService, LiveTranscriptUpdate } from '@/lib/speech/recognition';
import { countWords } from '@/lib/speech/metrics';

// Mock Web Speech API for Node.js test environment
class MockSpeechRecognition {
  public continuous: boolean = true;
  public interimResults: boolean = true;
  public lang: string = 'en-US';
  public maxAlternatives: number = 1;

  public onstart: (() => void) | null = null;
  public onresult: ((event: any) => void) | null = null;
  public onerror: ((event: any) => void) | null = null;
  public onend: (() => void) | null = null;

  public isStarted: boolean = false;
  public static instances: MockSpeechRecognition[] = [];

  constructor() {
    MockSpeechRecognition.instances.push(this);
  }

  public start(): void {
    this.isStarted = true;
    if (this.onstart) {
      this.onstart();
    }
  }

  public stop(): void {
    this.isStarted = false;
    if (this.onend) {
      this.onend();
    }
  }

  public abort(): void {
    this.isStarted = false;
    if (this.onend) {
      this.onend();
    }
  }

  // Helper to simulate incoming recognition results
  public simulateResults(results: { transcript: string; isFinal: boolean }[]): void {
    if (!this.onresult) return;
    const eventResults = results.map((r) => {
      const item = [{ transcript: r.transcript }];
      (item as any).isFinal = r.isFinal;
      return item;
    });
    this.onresult({
      results: eventResults,
      resultIndex: 0
    });
  }

  // Helper to simulate Chrome's 45-60s timeout / network drop
  public simulateChromeTimeoutDrop(): void {
    if (this.onerror) {
      this.onerror({ error: 'network' });
    }
    if (this.onend) {
      this.onend();
    }
  }
}

// Setup global mock window
function setupMockWindow() {
  MockSpeechRecognition.instances = [];
  (global as any).window = {
    SpeechRecognition: MockSpeechRecognition,
    webkitSpeechRecognition: MockSpeechRecognition,
  };
}

function teardownMockWindow() {
  delete (global as any).window;
}

test('Continuous Speech Recognition - Multi-session speech transcribes beyond 70 words without stopping', async () => {
  setupMockWindow();
  let service: LiveSpeechRecognitionService | null = null;
  try {
    service = new LiveSpeechRecognitionService();
    assert.equal(LiveSpeechRecognitionService.isSupported(), true);

    let latestUpdate: LiveTranscriptUpdate | null = null;
    const started = service.startListening((update) => {
      latestUpdate = update;
    });
    assert.equal(started, true);

    const firstInstance = MockSpeechRecognition.instances[0];
    assert.ok(firstInstance, 'First SpeechRecognition instance should be created');

    // Generate ~70 words in session 1 (simulating user speaking for ~45 seconds)
    const session1Words = [
      'In', 'today', 'rapidly', 'evolving', 'digital', 'world', 'effective', 'communication',
      'is', 'the', 'most', 'essential', 'leadership', 'skill', 'for', 'career', 'growth',
      'and', 'professional', 'excellence.', 'When', 'people', 'express', 'ideas', 'with',
      'clarity,', 'confidence,', 'and', 'structure,', 'they', 'inspire', 'trust,', 'align',
      'teams,', 'and', 'turn', 'strategic', 'vision', 'into', 'impactful', 'action.', 'Many',
      'professionals', 'struggle', 'with', 'nervousness', 'and', 'hesitation,', 'yet', 'deliberate',
      'daily', 'practice', 'transforms', 'hesitation', 'into', 'poise.', 'Continuous', 'learning',
      'and', 'feedback', 'empower', 'everyone', 'to', 'overcome', 'fear', 'and', 'deliver',
      'persuasive', 'presentations.'
    ];
    assert.equal(session1Words.length, 69);
    const session1Text = session1Words.join(' ');

    firstInstance.simulateResults([
      { transcript: session1Text, isFinal: true }
    ]);

    assert.ok(latestUpdate);
    assert.equal(latestUpdate.wordCount, 69);
    assert.equal(service.getCurrentTranscript(), session1Text);

    // Simulate Chrome's 45-60s timeout / network drop (which used to stop recognition permanently!)
    firstInstance.simulateChromeTimeoutDrop();

    // Fast-forward or wait for restart timer (200ms default)
    await new Promise((r) => setTimeout(r, 350));

    // A second instance should have automatically spun up
    assert.ok(MockSpeechRecognition.instances.length >= 2, 'Auto-restart should instantiate session 2');
    const secondInstance = MockSpeechRecognition.instances[MockSpeechRecognition.instances.length - 1];

    // User speaks words 70 to 140 in session 2
    const session2Words = [
      'Furthermore,', 'active', 'listening', 'enhances', 'collaboration', 'across', 'diverse',
      'engineering', 'and', 'product', 'organizations.', 'By', 'synthesizing', 'complex',
      'information', 'into', 'concise', 'insights,', 'speakers', 'can', 'guide', 'decision',
      'making', 'with', 'clarity.', 'This', 'demonstrates', 'how', 'consistent', 'practice',
      'leads', 'to', 'long', 'term', 'fluency', 'and', 'executive', 'presence', 'in', 'every',
      'meeting,', 'interview,', 'and', 'keynote', 'address.', 'Never', 'underestimate', 'the',
      'power', 'of', 'clear', 'and', 'articulate', 'speech', 'to', 'open', 'new', 'opportunities.'
    ];
    const session2Text = session2Words.join(' ');

    secondInstance.simulateResults([
      { transcript: session2Text, isFinal: true }
    ]);

    assert.ok(latestUpdate);
    const totalWords = countWords(latestUpdate.transcript);
    assert.ok(totalWords > 120, `Expected total word count to exceed 120 words across sessions, got ${totalWords}`);
    assert.equal(latestUpdate.transcript.includes(session1Words[1]), true);
    assert.equal(latestUpdate.transcript.includes(session2Words[1]), true);

    // Finalize
    const finalized = service.stopListening();
    assert.equal(countWords(finalized), totalWords);
  } finally {
    if (service) service.stopListening();
    teardownMockWindow();
  }
});

test('Continuous Speech Recognition - Trailing interim text is preserved on unexpected cut', async () => {
  setupMockWindow();
  let service: LiveSpeechRecognitionService | null = null;
  try {
    service = new LiveSpeechRecognitionService();
    let latestUpdate: LiveTranscriptUpdate | null = null;
    service.startListening((update) => {
      latestUpdate = update;
    });

    const instance = MockSpeechRecognition.instances[0];

    // User is mid-sentence when the browser socket cuts off
    instance.simulateResults([
      { transcript: 'This is finalized text.', isFinal: true },
      { transcript: 'And this is interim speech right before cutoff', isFinal: false }
    ]);

    // Simulate unexpected cutoff
    instance.simulateChromeTimeoutDrop();

    // Interim speech must be committed and not dropped
    const transcriptAfterCut = service.getCurrentTranscript();
    assert.ok(transcriptAfterCut.includes('interim speech right before cutoff'),
      `Expected trailing interim speech to be preserved, got: ${transcriptAfterCut}`);

    service.stopListening();
  } finally {
    if (service) service.stopListening();
    teardownMockWindow();
  }
});

test('Continuous Speech Recognition - Deduplication prevents repeating words on session restart', async () => {
  setupMockWindow();
  let service: LiveSpeechRecognitionService | null = null;
  try {
    service = new LiveSpeechRecognitionService();
    service.startListening(() => {});

    const instance1 = MockSpeechRecognition.instances[0];
    instance1.simulateResults([
      { transcript: 'The quick brown fox jumps over the lazy dog.', isFinal: true }
    ]);

    instance1.simulateChromeTimeoutDrop();
    await new Promise((r) => setTimeout(r, 350));

    const instance2 = MockSpeechRecognition.instances[MockSpeechRecognition.instances.length - 1];
    instance2.simulateResults([
      { transcript: 'It was a sunny morning in the countryside.', isFinal: true }
    ]);

    const transcript = service.stopListening();
    assert.equal(
      transcript,
      'The quick brown fox jumps over the lazy dog. It was a sunny morning in the countryside.'
    );

    // Verify 'The quick brown fox' appears exactly once
    const matches = transcript.match(/The quick brown fox/g);
    assert.equal(matches?.length, 1, 'Sentence must not be duplicated across restarts');
  } finally {
    if (service) service.stopListening();
    teardownMockWindow();
  }
});

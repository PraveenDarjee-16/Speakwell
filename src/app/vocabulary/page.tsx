'use client';

import React, { useState, useEffect } from 'react';
import { 
  Volume2, 
  CheckCircle, 
  XCircle, 
  Bookmark, 
  BookmarkCheck, 
  Search, 
  Send, 
  ArrowRight,
  Check
} from 'lucide-react';
import { VocabularyWord } from '@/types';
import { VOCABULARY_WORDS } from '@/data/vocabulary-bank';
import { playPronunciation } from '@/lib/speech/tts';

type VocabTab = 'explore' | 'quiz' | 'sentence-challenge' | 'notebook';

export default function VocabularyPage() {
  const [activeTab, setActiveTab] = useState<VocabTab>('explore');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeWordIndex, setActiveWordIndex] = useState<number>(0);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [bookmarkedWords, setBookmarkedWords] = useState<string[]>([]);
  const [masteredWords, setMasteredWords] = useState<string[]>([]);

  // Quiz State
  const [quizWordIndex, setQuizWordIndex] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState<boolean>(false);
  const [quizScore, setQuizScore] = useState<{ correct: number; total: number }>({ correct: 0, total: 0 });

  // Sentence Challenge State
  const [userSentence, setUserSentence] = useState<string>('');
  const [sentenceFeedback, setSentenceFeedback] = useState<{
    status: 'success' | 'needs-work' | null;
    message: string;
  } | null>(null);
  const [isEvaluatingSentence, setIsEvaluatingSentence] = useState<boolean>(false);

  useEffect(() => {
    try {
      const storedBookmarks = localStorage.getItem('speakwell_vocab_bookmarks');
      if (storedBookmarks) setBookmarkedWords(JSON.parse(storedBookmarks));
      const storedMastered = localStorage.getItem('speakwell_vocab_mastered');
      if (storedMastered) setMasteredWords(JSON.parse(storedMastered));
    } catch {}
  }, []);

  const toggleBookmark = (id: string) => {
    const updated = bookmarkedWords.includes(id)
      ? bookmarkedWords.filter((w) => w !== id)
      : [...bookmarkedWords, id];
    setBookmarkedWords(updated);
    try {
      localStorage.setItem('speakwell_vocab_bookmarks', JSON.stringify(updated));
    } catch {}
  };

  const toggleMastered = (id: string) => {
    const updated = masteredWords.includes(id)
      ? masteredWords.filter((w) => w !== id)
      : [...masteredWords, id];
    setMasteredWords(updated);
    try {
      localStorage.setItem('speakwell_vocab_mastered', JSON.stringify(updated));
    } catch {}
  };

  const handleAudio = async (wordText: string) => {
    setIsPlayingAudio(true);
    await playPronunciation(wordText);
    setIsPlayingAudio(false);
  };

  const categories = [
    'All',
    'Persuasive',
    'Structure & Flow',
    'Precision',
    'Nuance & Contrast',
    'Emphasis',
  ];

  const filteredWords = VOCABULARY_WORDS.filter((w) => {
    const matchCat = selectedCategory === 'All' || w.category === selectedCategory;
    const matchSearch =
      searchQuery.trim() === '' ||
      w.word.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.meaning.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  const currentWord = filteredWords[activeWordIndex] || VOCABULARY_WORDS[0];
  const quizWord = VOCABULARY_WORDS[quizWordIndex] || VOCABULARY_WORDS[0];

  const handleSelectQuizOption = (idx: number) => {
    if (quizSubmitted) return;
    setSelectedOption(idx);
  };

  const handleSubmitQuiz = () => {
    if (selectedOption === null || quizSubmitted || !quizWord.quizQuestion) return;
    setQuizSubmitted(true);
    const isCorrect = selectedOption === quizWord.quizQuestion.correctIndex;
    setQuizScore((prev) => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      total: prev.total + 1,
    }));
  };

  const handleNextQuizQuestion = () => {
    setSelectedOption(null);
    setQuizSubmitted(false);
    setQuizWordIndex((prev) => (prev + 1) % VOCABULARY_WORDS.length);
  };

  const handleSentenceSubmit = () => {
    if (!userSentence.trim()) return;
    setIsEvaluatingSentence(true);
    setTimeout(() => {
      const lower = userSentence.toLowerCase();
      const targetLower = currentWord.word.toLowerCase();
      const containsWord = lower.includes(targetLower);

      if (!containsWord) {
        setSentenceFeedback({
          status: 'needs-work',
          message: `Your sentence does not appear to contain the word "${currentWord.word}". Try again!`,
        });
      } else if (userSentence.split(' ').length < 5) {
        setSentenceFeedback({
          status: 'needs-work',
          message: `Your sentence is quite brief. Aim for at least 7-8 words to provide richer context for "${currentWord.word}".`,
        });
      } else {
        setSentenceFeedback({
          status: 'success',
          message: `Excellent sentence! You used "${currentWord.word}" naturally and grammatically in proper context.`,
        });
      }
      setIsEvaluatingSentence(false);
    }, 400);
  };

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-white/[0.06]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-medium text-zinc-100 tracking-tight">
            Vocabulary Lab
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Build precise, impactful vocabulary for spontaneous speech and interviews.
          </p>
        </div>

        <div className="text-xs font-mono text-zinc-400 px-3 py-1 rounded-lg bg-zinc-900 border border-zinc-800">
          Mastered: <span className="text-emerald-400 font-medium">{masteredWords.length}</span>
        </div>
      </div>

      {/* Segmented Navigation */}
      <div className="flex items-center gap-1.5 border-b border-white/[0.06] pb-2 text-xs">
        <button
          onClick={() => setActiveTab('explore')}
          className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
            activeTab === 'explore'
              ? 'bg-zinc-800 text-zinc-100 font-medium'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Explore
        </button>

        <button
          onClick={() => setActiveTab('quiz')}
          className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
            activeTab === 'quiz'
              ? 'bg-zinc-800 text-zinc-100 font-medium'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Quiz
        </button>

        <button
          onClick={() => setActiveTab('sentence-challenge')}
          className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
            activeTab === 'sentence-challenge'
              ? 'bg-zinc-800 text-zinc-100 font-medium'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Sentence Builder
        </button>

        <button
          onClick={() => setActiveTab('notebook')}
          className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
            activeTab === 'notebook'
              ? 'bg-zinc-800 text-zinc-100 font-medium'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Notebook ({bookmarkedWords.length})
        </button>
      </div>

      {/* TAB 1: EXPLORE WORDS */}
      {activeTab === 'explore' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Word List */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                placeholder="Search words..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-zinc-700"
              />
            </div>

            <div className="flex gap-1 overflow-x-auto pb-1 text-[11px]">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 rounded-md shrink-0 cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-zinc-800 text-zinc-100 font-medium'
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="space-y-1.5 max-h-[500px] overflow-y-auto pr-1">
              {filteredWords.map((word) => {
                const isSelected = word.id === currentWord.id;
                const isBookmarked = bookmarkedWords.includes(word.id);
                const isMastered = masteredWords.includes(word.id);

                return (
                  <div
                    key={word.id}
                    onClick={() => setActiveWordIndex(VOCABULARY_WORDS.findIndex((w) => w.id === word.id))}
                    className={`p-3 rounded-lg border transition-all cursor-pointer flex items-center justify-between text-xs ${
                      isSelected
                        ? 'bg-zinc-800/80 border-zinc-700 text-zinc-100'
                        : 'bg-zinc-900/40 border-white/[0.04] text-zinc-400 hover:bg-zinc-900/80 hover:text-zinc-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium text-zinc-200">{word.word}</span>
                        <span className="text-[10px] text-zinc-500 font-mono">{word.partOfSpeech}</span>
                      </div>
                      <p className="text-[11px] text-zinc-500 line-clamp-1 mt-0.5">{word.meaning}</p>
                    </div>

                    <div className="flex items-center gap-1">
                      {isMastered && <Check className="w-3 h-3 text-emerald-400" />}
                      {isBookmarked && <Bookmark className="w-3 h-3 fill-zinc-400 text-zinc-400" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Detailed Word Card */}
          <div className="lg:col-span-2 minimal-card p-6 space-y-6">
            <div className="flex items-start justify-between pb-4 border-b border-white/[0.04]">
              <div>
                <div className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider mb-1">
                  {currentWord.category} • {currentWord.level}
                </div>
                <h2 className="text-2xl font-medium text-zinc-100 tracking-tight">
                  {currentWord.word}
                </h2>
                <div className="flex items-center gap-2 mt-1 text-zinc-500 font-mono text-xs">
                  <span>{currentWord.phonetic}</span>
                  <span>•</span>
                  <span>{currentWord.partOfSpeech}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleAudio(currentWord.word)}
                  className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 transition-colors cursor-pointer"
                  title="Pronounce"
                >
                  <Volume2 className={`w-4 h-4 ${isPlayingAudio ? 'text-zinc-100' : ''}`} />
                </button>

                <button
                  onClick={() => toggleBookmark(currentWord.id)}
                  className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 transition-colors cursor-pointer"
                  title="Bookmark"
                >
                  <Bookmark className={`w-4 h-4 ${bookmarkedWords.includes(currentWord.id) ? 'fill-zinc-300 text-zinc-300' : ''}`} />
                </button>

                <button
                  onClick={() => toggleMastered(currentWord.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer flex items-center gap-1 ${
                    masteredWords.includes(currentWord.id)
                      ? 'bg-zinc-800 text-emerald-400 border-zinc-700'
                      : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
                  }`}
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{masteredWords.includes(currentWord.id) ? 'Mastered' : 'Mark Mastered'}</span>
                </button>
              </div>
            </div>

            {/* Meaning */}
            <div className="space-y-1 text-xs">
              <span className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider block">Definition</span>
              <p className="text-sm text-zinc-300 leading-relaxed">{currentWord.meaning}</p>
            </div>

            {/* Synonyms & Antonyms */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3 rounded-lg bg-zinc-900/60 border border-white/[0.04] space-y-1.5">
                <span className="text-[10px] font-mono uppercase text-zinc-500 block">Synonyms</span>
                <div className="flex flex-wrap gap-1">
                  {currentWord.synonyms.map((s, idx) => (
                    <span key={idx} className="px-2 py-0.5 rounded text-[11px] bg-zinc-800 text-zinc-300">
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-3 rounded-lg bg-zinc-900/60 border border-white/[0.04] space-y-1.5">
                <span className="text-[10px] font-mono uppercase text-zinc-500 block">Antonyms</span>
                <div className="flex flex-wrap gap-1">
                  {currentWord.antonyms.map((a, idx) => (
                    <span key={idx} className="px-2 py-0.5 rounded text-[11px] bg-zinc-800 text-zinc-300">
                      {a}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Example Sentences */}
            <div className="space-y-2 text-xs">
              <span className="text-[11px] font-mono uppercase text-zinc-500 block">In Natural Speech</span>
              <div className="space-y-1.5">
                {currentWord.exampleSentences.map((sent, idx) => (
                  <div key={idx} className="p-2.5 rounded-lg bg-zinc-900/40 border border-white/[0.04] text-zinc-400 italic">
                    "{sent}"
                  </div>
                ))}
              </div>
            </div>

            {/* Delivery Tip */}
            <div className="p-3 rounded-lg bg-zinc-900/40 border border-white/[0.04] text-xs space-y-1">
              <span className="text-[11px] font-mono uppercase text-zinc-500 block">Delivery Tip</span>
              <p className="text-zinc-400 leading-relaxed">{currentWord.practicalTip}</p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: QUIZ */}
      {activeTab === 'quiz' && quizWord.quizQuestion && (
        <div className="max-w-xl mx-auto minimal-card p-6 space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.06] text-xs">
            <span className="font-mono text-zinc-500 uppercase">Quiz: "{quizWord.word}"</span>
            <span className="font-mono text-zinc-400">Score: {quizScore.correct} / {quizScore.total}</span>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium text-zinc-200">
              {quizWord.quizQuestion.question}
            </p>

            <div className="space-y-2 pt-1">
              {quizWord.quizQuestion.options.map((opt, idx) => {
                const isSelected = selectedOption === idx;
                const isCorrect = idx === quizWord.quizQuestion?.correctIndex;

                let style = 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-700';
                if (quizSubmitted) {
                  if (isCorrect) style = 'bg-zinc-900 border-emerald-500 text-emerald-300 font-medium';
                  else if (isSelected) style = 'bg-zinc-900 border-red-500 text-red-300';
                } else if (isSelected) {
                  style = 'bg-zinc-800 border-zinc-600 text-white font-medium';
                }

                return (
                  <button
                    key={idx}
                    onClick={() => handleSelectQuizOption(idx)}
                    className={`w-full p-3 rounded-lg border text-left text-xs transition-colors cursor-pointer flex items-center justify-between ${style}`}
                  >
                    <span>{opt}</span>
                    {quizSubmitted && isCorrect && <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 ml-2" />}
                    {quizSubmitted && isSelected && !isCorrect && <XCircle className="w-4 h-4 text-red-400 shrink-0 ml-2" />}
                  </button>
                );
              })}
            </div>
          </div>

          {quizSubmitted && (
            <div className="p-3 rounded-lg bg-zinc-900 border border-white/[0.04] text-xs text-zinc-400 space-y-1">
              <span className="font-mono text-[10px] uppercase text-zinc-500 block">Explanation</span>
              <p>{quizWord.quizQuestion.explanation}</p>
            </div>
          )}

          <div className="pt-2 flex items-center justify-end">
            {!quizSubmitted ? (
              <button
                onClick={handleSubmitQuiz}
                disabled={selectedOption === null}
                className="px-4 py-2 rounded-lg font-medium text-xs text-zinc-950 bg-zinc-100 hover:bg-white disabled:opacity-40 transition-colors cursor-pointer"
              >
                Submit Answer
              </button>
            ) : (
              <button
                onClick={handleNextQuizQuestion}
                className="px-4 py-2 rounded-lg font-medium text-xs text-zinc-950 bg-zinc-100 hover:bg-white transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <span>Next Question</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: SENTENCE CHALLENGE */}
      {activeTab === 'sentence-challenge' && (
        <div className="max-w-xl mx-auto minimal-card p-6 space-y-4">
          <div className="space-y-1">
            <span className="text-[11px] font-mono uppercase text-zinc-500 block">Sentence Drill</span>
            <h3 className="text-base font-medium text-zinc-100">Write a sentence using "{currentWord.word}"</h3>
            <p className="text-xs text-zinc-400">Apply the word in a professional context.</p>
          </div>

          <textarea
            value={userSentence}
            onChange={(e) => setUserSentence(e.target.value)}
            placeholder={`Draft a sentence applying "${currentWord.word}"...`}
            rows={3}
            className="w-full p-3 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-zinc-700"
          />

          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-500">Target: {currentWord.word}</span>
            <button
              onClick={handleSentenceSubmit}
              disabled={isEvaluatingSentence || !userSentence.trim()}
              className="px-4 py-2 rounded-lg font-medium text-xs text-zinc-950 bg-zinc-100 hover:bg-white disabled:opacity-40 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Send className="w-3 h-3" />
              <span>{isEvaluatingSentence ? 'Checking...' : 'Check Sentence'}</span>
            </button>
          </div>

          {sentenceFeedback && (
            <div className={`p-3 rounded-lg border text-xs ${
              sentenceFeedback.status === 'success'
                ? 'bg-zinc-900 border-emerald-500/30 text-emerald-300'
                : 'bg-zinc-900 border-zinc-700 text-zinc-300'
            }`}>
              {sentenceFeedback.message}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: NOTEBOOK */}
      {activeTab === 'notebook' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>Saved Words</span>
            <span className="font-mono">{bookmarkedWords.length} words</span>
          </div>

          {bookmarkedWords.length === 0 ? (
            <div className="p-12 text-center minimal-card text-xs text-zinc-500 space-y-1">
              <Bookmark className="w-6 h-6 mx-auto text-zinc-600 mb-2" />
              <p>No words bookmarked yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {VOCABULARY_WORDS.filter((w) => bookmarkedWords.includes(w.id)).map((word) => (
                <div key={word.id} className="minimal-card p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-zinc-200">{word.word}</span>
                    <button onClick={() => toggleBookmark(word.id)} className="text-zinc-500 hover:text-zinc-300">
                      <BookmarkCheck className="w-4 h-4 fill-zinc-400 text-zinc-400" />
                    </button>
                  </div>
                  <p className="text-xs text-zinc-400">{word.meaning}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

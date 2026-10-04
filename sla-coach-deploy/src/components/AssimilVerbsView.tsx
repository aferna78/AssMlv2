import React, { useState, useMemo, useEffect } from 'react';
import {
  Volume2,
  Search,
  CheckCircle2,
  Zap,
  RotateCcw,
  BookOpen,
  MessageSquare,
  Eye,
  EyeOff,
  Star,
  Check,
  HelpCircle,
  Award,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { AssimilIrregularVerb } from '../types';
import { ASSIMIL_IRREGULAR_VERBS } from '../data/irregularVerbs';
import { speakText } from '../utils/speech';

interface AssimilVerbsViewProps {
  onStartCoachChat: (prompt: string, topic: string) => void;
  voiceAccent?: 'en-US' | 'en-GB';
}

const STORAGE_KEY_MASTERED_VERBS = 'assimil_mastered_irregular_verbs_v1';

export const AssimilVerbsView: React.FC<AssimilVerbsViewProps> = ({
  onStartCoachChat,
  voiceAccent = 'en-GB',
}) => {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'same_past_participle' | 'all_different' | 'all_identical' | 'mastered'>('all');
  const [mode, setMode] = useState<'table' | 'quiz'>('table');
  const [masteredVerbs, setMasteredVerbs] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_MASTERED_VERBS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Save mastered verbs to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_MASTERED_VERBS, JSON.stringify(masteredVerbs));
    } catch {}
  }, [masteredVerbs]);

  const toggleMastered = (infinitive: string) => {
    setMasteredVerbs((prev) =>
      prev.includes(infinitive) ? prev.filter((v) => v !== infinitive) : [...prev, infinitive]
    );
  };

  // Helper to categorize verb patterns
  const getVerbCategory = (verb: AssimilIrregularVerb) => {
    const infClean = verb.infinitive.replace(/^to\s+/, '').trim().toLowerCase();
    const pastClean = verb.past.split('/')[0].trim().toLowerCase();
    const partClean = verb.participle.split('/')[0].replace(/\(.*?\)/g, '').trim().toLowerCase();

    if (infClean === pastClean && pastClean === partClean) {
      return 'identical';
    }
    if (pastClean === partClean) {
      return 'same_past_participle';
    }
    return 'all_different';
  };

  // Filtered list
  const filteredVerbs = useMemo(() => {
    return ASSIMIL_IRREGULAR_VERBS.filter((verb) => {
      const query = search.trim().toLowerCase();
      const matchesSearch =
        !query ||
        verb.infinitive.toLowerCase().includes(query) ||
        verb.past.toLowerCase().includes(query) ||
        verb.participle.toLowerCase().includes(query) ||
        verb.spanish.toLowerCase().includes(query);

      if (!matchesSearch) return false;

      const category = getVerbCategory(verb);
      if (filterType === 'same_past_participle') return category === 'same_past_participle';
      if (filterType === 'all_different') return category === 'all_different';
      if (filterType === 'all_identical') return category === 'identical';
      if (filterType === 'mastered') return masteredVerbs.includes(verb.infinitive);

      return true;
    });
  }, [search, filterType, masteredVerbs]);

  // Audio pronunciation helper for the whole triplet
  const playTriplet = (verb: AssimilIrregularVerb) => {
    const textToSpeak = `${verb.infinitive}... ${verb.past}... ${verb.participle}`;
    speakText(textToSpeak, { lang: voiceAccent, rate: 0.85 });
  };

  const playSingle = (word: string) => {
    speakText(word, { lang: voiceAccent, rate: 0.9 });
  };

  // -------------------- QUIZ MODE STATE --------------------
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizPastInput, setQuizPastInput] = useState('');
  const [quizPartInput, setQuizPartInput] = useState('');
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState({ correct: 0, total: 0 });

  const currentQuizVerb = filteredVerbs[quizIndex] || filteredVerbs[0] || ASSIMIL_IRREGULAR_VERBS[0];

  const handleQuizSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (quizSubmitted) return;

    const norm = (s: string) => s.trim().toLowerCase();
    const expectedPast = currentQuizVerb.past.toLowerCase().split('/').map((s) => s.trim());
    const expectedPart = currentQuizVerb.participle.toLowerCase().replace(/\(.*?\)/g, '').split('/').map((s) => s.trim());

    const pastIsCorrect = expectedPast.some((p) => norm(quizPastInput) === p || norm(quizPastInput).replace(/^was\s+/, '') === p);
    const partIsCorrect = expectedPart.some((p) => norm(quizPartInput) === p);

    const isAllCorrect = pastIsCorrect && partIsCorrect;
    setQuizScore((prev) => ({
      correct: prev.correct + (isAllCorrect ? 1 : 0),
      total: prev.total + 1,
    }));
    setQuizSubmitted(true);

    if (isAllCorrect && !masteredVerbs.includes(currentQuizVerb.infinitive)) {
      toggleMastered(currentQuizVerb.infinitive);
    }
  };

  const nextQuizVerb = () => {
    setQuizPastInput('');
    setQuizPartInput('');
    setQuizSubmitted(false);
    if (quizIndex < filteredVerbs.length - 1) {
      setQuizIndex(quizIndex + 1);
    } else {
      setQuizIndex(0);
    }
  };

  const shuffleQuiz = () => {
    setQuizPastInput('');
    setQuizPartInput('');
    setQuizSubmitted(false);
    const randomIdx = Math.floor(Math.random() * filteredVerbs.length);
    setQuizIndex(randomIdx);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/30 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-8 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/30">
                Apéndice Gramatical Assimil
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                134 Verbos Esenciales
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Tabla Completa de Verbos Irregulares
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
              El inventario clásico de verbos irregulares del curso Assimil (*El nuevo inglés sin esfuerzo*). Con las tres formas básicas (Infinitivo, Pasado Simple y Participio Pasivo), pronunciación hablada y autoevaluación activa.
            </p>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center gap-2 bg-slate-950/70 p-1 rounded-xl border border-slate-800 self-start md:self-auto shrink-0">
            <button
              onClick={() => setMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                mode === 'table'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Tabla Completa</span>
            </button>
            <button
              onClick={() => {
                setMode('quiz');
                setQuizSubmitted(false);
                setQuizPastInput('');
                setQuizPartInput('');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                mode === 'quiz'
                  ? 'bg-rose-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-amber-300" />
              <span>Quiz de Práctica</span>
            </button>
          </div>
        </div>

        {/* Progress summary bar */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>
                <strong className="text-white">{masteredVerbs.length}</strong> de {ASSIMIL_IRREGULAR_VERBS.length} dominados
              </span>
            </div>
            <div className="w-24 sm:w-36 h-2 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 rounded-full transition-all duration-500"
                style={{
                  width: `${(masteredVerbs.length / ASSIMIL_IRREGULAR_VERBS.length) * 100}%`,
                }}
              />
            </div>
          </div>
          <div className="text-[11px] text-slate-400">
            Regla de oro: En la 2ª Ola (Lecciones 50-146) estos verbos son el núcleo del Past Simple.
          </div>
        </div>
      </div>

      {/* -------------------- TAB 1: INTERACTIVE TABLE -------------------- */}
      {mode === 'table' && (
        <div className="space-y-4">
          {/* Controls & Search */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row gap-3 md:items-center justify-between">
            {/* Search input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar verbo en inglés o significado en español (ej: buy, drank, comer)..."
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
                >
                  Limpiar
                </button>
              )}
            </div>

            {/* Filter pills */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <button
                onClick={() => setFilterType('all')}
                className={`px-2.5 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                  filterType === 'all'
                    ? 'bg-indigo-600 text-white font-bold'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                Todos ({ASSIMIL_IRREGULAR_VERBS.length})
              </button>
              <button
                onClick={() => setFilterType('same_past_participle')}
                className={`px-2.5 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                  filterType === 'same_past_participle'
                    ? 'bg-indigo-600 text-white font-bold'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
                title="Verbos donde el Past Simple y el Past Participle son iguales (ej: buy - bought - bought)"
              >
                Pasado = Participio
              </button>
              <button
                onClick={() => setFilterType('all_different')}
                className={`px-2.5 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                  filterType === 'all_different'
                    ? 'bg-indigo-600 text-white font-bold'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
                title="Verbos con 3 formas completamente diferentes (ej: go - went - gone, speak - spoke - spoken)"
              >
                3 Formas Diferentes
              </button>
              <button
                onClick={() => setFilterType('all_identical')}
                className={`px-2.5 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                  filterType === 'all_identical'
                    ? 'bg-indigo-600 text-white font-bold'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
                title="Verbos donde las 3 formas son idénticas (ej: cut - cut - cut, cost - cost - cost)"
              >
                3 Formas Iguales
              </button>
              <button
                onClick={() => setFilterType('mastered')}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                  filterType === 'mastered'
                    ? 'bg-emerald-600 text-white font-bold'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <Star className="w-3 h-3 text-amber-300" />
                <span>Dominados ({masteredVerbs.length})</span>
              </button>
            </div>
          </div>

          {/* Verbs Table Container */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-4 w-12 text-center">Estado</th>
                    <th className="py-3 px-4">Infinitivo (Presente)</th>
                    <th className="py-3 px-4">Past Simple (Pasado)</th>
                    <th className="py-3 px-4">Past Participle (Participio)</th>
                    <th className="py-3 px-4">Español</th>
                    <th className="py-3 px-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-xs">
                  {filteredVerbs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500">
                        No se encontraron verbos irregulares para este filtro o búsqueda.
                      </td>
                    </tr>
                  ) : (
                    filteredVerbs.map((verb) => {
                      const isMastered = masteredVerbs.includes(verb.infinitive);
                      const category = getVerbCategory(verb);

                      return (
                        <tr
                          key={verb.infinitive}
                          className={`group hover:bg-slate-800/40 transition-colors ${
                            isMastered ? 'bg-emerald-950/10' : ''
                          }`}
                        >
                          {/* Mastered toggle */}
                          <td className="py-3 px-4 text-center">
                            <button
                              onClick={() => toggleMastered(verb.infinitive)}
                              className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                                isMastered
                                  ? 'text-amber-400 bg-amber-400/10 hover:bg-amber-400/20'
                                  : 'text-slate-600 hover:text-slate-300'
                              }`}
                              title={isMastered ? 'Verbo dominado (clic para desmarcar)' : 'Marcar como dominado'}
                            >
                              <Star className={`w-3.5 h-3.5 ${isMastered ? 'fill-amber-400' : ''}`} />
                            </button>
                          </td>

                          {/* Infinitive */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white text-sm">
                                {verb.infinitive}
                              </span>
                              <button
                                onClick={() => playSingle(verb.infinitive)}
                                className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-indigo-400 transition-opacity p-1 cursor-pointer"
                                title="Escuchar pronunciación"
                              >
                                <Volume2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            {verb.notes && (
                              <span className="text-[10px] text-amber-400/80 block mt-0.5">
                                Note: {verb.notes}
                              </span>
                            )}
                          </td>

                          {/* Past */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-indigo-300 font-mono text-xs">
                                {verb.past}
                              </span>
                              <button
                                onClick={() => playSingle(verb.past)}
                                className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-indigo-400 transition-opacity p-1 cursor-pointer"
                                title="Escuchar pasado"
                              >
                                <Volume2 className="w-3 h-3" />
                              </button>
                            </div>
                          </td>

                          {/* Participle */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-rose-300 font-mono text-xs">
                                {verb.participle}
                              </span>
                              <button
                                onClick={() => playSingle(verb.participle)}
                                className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-indigo-400 transition-opacity p-1 cursor-pointer"
                                title="Escuchar participio"
                              >
                                <Volume2 className="w-3 h-3" />
                              </button>
                            </div>
                          </td>

                          {/* Spanish */}
                          <td className="py-3 px-4 text-slate-300">
                            <span>{verb.spanish}</span>
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => playTriplet(verb)}
                                className="flex items-center gap-1 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-medium transition-colors cursor-pointer"
                                title="Escuchar las tres formas consecutivas"
                              >
                                <Volume2 className="w-3 h-3 text-indigo-400" />
                                <span className="hidden sm:inline">Tríada</span>
                              </button>

                              <button
                                onClick={() => {
                                  onStartCoachChat(
                                    `Quiero practicar el verbo irregular "${verb.infinitive}" (past: ${verb.past}, participle: ${verb.participle} - ${verb.spanish}). Por favor explícame sus usos con 3 ejemplos conversacionales británicos cotidianos y hazme una pregunta para que responda usando este verbo.`,
                                    `Verbo irregular: ${verb.infinitive}`
                                  );
                                }}
                                className="flex items-center gap-1 px-2 py-1 rounded bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/40 text-[11px] font-medium transition-colors cursor-pointer"
                                title="Practicar este verbo con el Coach AI"
                              >
                                <MessageSquare className="w-3 h-3" />
                                <span className="hidden sm:inline">Coach</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* -------------------- TAB 2: QUIZ / TRAINER MODE -------------------- */}
      {mode === 'quiz' && (
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Quiz Card */}
          <div className="p-6 sm:p-8 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-4 mb-6">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  <Zap className="w-4 h-4 text-amber-300" />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-white">Quiz de Verbos Irregulares Assimil</h3>
                  <p className="text-[11px] text-slate-400">Verbo #{quizIndex + 1} de {filteredVerbs.length}</p>
                </div>
              </div>

              {/* Score pill */}
              <div className="px-3 py-1 rounded-full bg-slate-950 border border-slate-800 text-xs font-mono">
                Aciertos: <strong className="text-emerald-400">{quizScore.correct}</strong> / {quizScore.total}
              </div>
            </div>

            {/* Target Verb Prompt */}
            <div className="text-center py-6 px-4 rounded-xl bg-slate-950/70 border border-slate-800 mb-6 space-y-2">
              <p className="text-xs uppercase tracking-widest text-indigo-400 font-bold">Infinitivo & Significado</p>
              <h2 className="text-3xl font-black text-white tracking-tight">{currentQuizVerb.infinitive}</h2>
              <p className="text-sm text-slate-300 font-medium">« {currentQuizVerb.spanish} »</p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => playSingle(currentQuizVerb.infinitive)}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer transition-colors"
                >
                  <Volume2 className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Escuchar infinitivo</span>
                </button>
              </div>
            </div>

            {/* Input Form */}
            <form onSubmit={handleQuizSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Past Simple Input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                    <span>1. Past Simple (Pasado)</span>
                    {quizSubmitted && (
                      <span className="text-[10px] font-mono text-indigo-300">
                        Solución: {currentQuizVerb.past}
                      </span>
                    )}
                  </label>
                  <input
                    type="text"
                    value={quizPastInput}
                    onChange={(e) => setQuizPastInput(e.target.value)}
                    disabled={quizSubmitted}
                    placeholder="Escribe el Past Simple..."
                    className={`w-full px-3 py-2 rounded-xl bg-slate-950 border text-sm text-white placeholder-slate-600 focus:outline-none ${
                      quizSubmitted
                        ? currentQuizVerb.past.toLowerCase().includes(quizPastInput.trim().toLowerCase()) && quizPastInput.trim() !== ''
                          ? 'border-emerald-500 bg-emerald-950/20 text-emerald-300'
                          : 'border-rose-500 bg-rose-950/20 text-rose-300'
                        : 'border-slate-700 focus:border-indigo-500'
                    }`}
                  />
                </div>

                {/* Past Participle Input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                    <span>2. Past Participle (Participio)</span>
                    {quizSubmitted && (
                      <span className="text-[10px] font-mono text-rose-300">
                        Solución: {currentQuizVerb.participle}
                      </span>
                    )}
                  </label>
                  <input
                    type="text"
                    value={quizPartInput}
                    onChange={(e) => setQuizPartInput(e.target.value)}
                    disabled={quizSubmitted}
                    placeholder="Escribe el Past Participle..."
                    className={`w-full px-3 py-2 rounded-xl bg-slate-950 border text-sm text-white placeholder-slate-600 focus:outline-none ${
                      quizSubmitted
                        ? currentQuizVerb.participle.toLowerCase().includes(quizPartInput.trim().toLowerCase()) && quizPartInput.trim() !== ''
                          ? 'border-emerald-500 bg-emerald-950/20 text-emerald-300'
                          : 'border-rose-500 bg-rose-950/20 text-rose-300'
                        : 'border-slate-700 focus:border-indigo-500'
                    }`}
                  />
                </div>
              </div>

              {/* Feedback Alert if submitted */}
              {quizSubmitted && (
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => playTriplet(currentQuizVerb)}
                        className="text-indigo-400 hover:text-indigo-300 transition-colors p-1"
                        title="Escuchar tríada completa"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                      <span className="text-xs font-bold text-white">
                        {currentQuizVerb.infinitive} &bull; {currentQuizVerb.past} &bull; {currentQuizVerb.participle}
                      </span>
                    </div>
                    <span className="text-xs text-slate-400">
                      « {currentQuizVerb.spanish} »
                    </span>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={shuffleQuiz}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Aleatorio</span>
                </button>

                <div className="flex items-center gap-2">
                  {!quizSubmitted ? (
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 cursor-pointer transition-all active:scale-95"
                    >
                      Comprobar Respuesta
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={nextQuizVerb}
                      className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 cursor-pointer transition-all active:scale-95"
                    >
                      <span>Siguiente Verbo</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

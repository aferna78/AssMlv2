import React from 'react';
import {
  Brain,
  Volume2,
  RotateCw,
  Plus,
  CheckCircle2,
  Clock,
  Sparkles,
  Search,
  Filter,
  Layers,
  ChevronRight,
  BookOpen,
} from 'lucide-react';
import { SRSFlashcard, CEFRLevel } from '../types';
import { speakText } from '../utils/speech';

interface SRSDeckViewProps {
  cards: SRSFlashcard[];
  onReviewCard: (id: string, grade: 'again' | 'hard' | 'good' | 'easy') => void;
  onAddCard: (card: Omit<SRSFlashcard, 'id' | 'repetitionStage' | 'easeFactor' | 'nextReviewDate' | 'reviewCount'>) => void;
  voiceAccent: 'en-US' | 'en-GB';
}

export const SRSDeckView: React.FC<SRSDeckViewProps> = ({
  cards,
  onReviewCard,
  onAddCard,
  voiceAccent,
}) => {
  const [activeReviewIndex, setActiveReviewIndex] = React.useState(0);
  const [isFlipped, setIsFlipped] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [selectedLevelFilter, setSelectedLevelFilter] = React.useState<string>('all');
  const [isAddingCard, setIsAddingCard] = React.useState(false);
  const [playingId, setPlayingId] = React.useState<string | null>(null);

  // New card form state
  const [newTerm, setNewTerm] = React.useState('');
  const [newType, setNewType] = React.useState<SRSFlashcard['type']>('collocation');
  const [newLevel, setNewLevel] = React.useState<CEFRLevel>('B1');
  const [newTranslation, setNewTranslation] = React.useState('');
  const [newContext, setNewContext] = React.useState('');
  const [newNotes, setNewNotes] = React.useState('');

  const now = Date.now();
  const dueCards = cards.filter((c) => c.nextReviewDate <= now);
  const currentCard = dueCards[activeReviewIndex] || null;

  const handlePlayAudio = async (text: string, id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      setPlayingId(id);
      await speakText(text, { lang: voiceAccent, rate: 0.9 });
      setPlayingId(null);
    } catch {
      setPlayingId(null);
    }
  };

  const handleGrade = (grade: 'again' | 'hard' | 'good' | 'easy') => {
    if (!currentCard) return;
    onReviewCard(currentCard.id, grade);
    setIsFlipped(false);
    if (activeReviewIndex >= dueCards.length - 1) {
      setActiveReviewIndex(0);
    }
  };

  const handleCreateCardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTerm.trim() || !newTranslation.trim() || !newContext.trim()) return;

    onAddCard({
      term: newTerm.trim(),
      type: newType,
      level: newLevel,
      translation: newTranslation.trim(),
      contextSentence: newContext.trim(),
      notes: newNotes.trim() || undefined,
    });

    setNewTerm('');
    setNewTranslation('');
    setNewContext('');
    setNewNotes('');
    setIsAddingCard(false);
  };

  const filteredCards = cards.filter((c) => {
    const matchesSearch =
      c.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.translation.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.contextSentence.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLevel = selectedLevelFilter === 'all' || c.level === selectedLevelFilter;
    return matchesSearch && matchesLevel;
  });

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-2">
            <Brain className="w-3.5 h-3.5" />
            <span>Spaced Repetition System (SRS) &bull; Método Léxico</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Mazo de Repetición Espaciada
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Algoritmo Leitner para consolidar collocations, phrasal verbs y chunks en la memoria a largo plazo.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAddingCard(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Añadir Collocation</span>
          </button>
        </div>
      </div>

      {/* Review Stats summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Pendientes Hoy
          </span>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-400" />
            <span className="text-xl sm:text-2xl font-extrabold text-amber-300">
              {dueCards.length}
            </span>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Total en Mazo
          </span>
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-400" />
            <span className="text-xl sm:text-2xl font-extrabold text-indigo-300">
              {cards.length}
            </span>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            En Etapa Avanzada
          </span>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="text-xl sm:text-2xl font-extrabold text-emerald-300">
              {cards.filter((c) => c.repetitionStage >= 3).length}
            </span>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Retención Estimada
          </span>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span className="text-xl sm:text-2xl font-extrabold text-cyan-300">92%</span>
          </div>
        </div>
      </div>

      {/* ACTIVE REVIEW FLASHCARD SESSION */}
      <div className="mb-12">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <span>Sesión de Active Recall:</span>
            {dueCards.length > 0 && (
              <span className="text-xs font-mono font-normal text-slate-400">
                Tarjeta {activeReviewIndex + 1} de {dueCards.length}
              </span>
            )}
          </h2>
        </div>

        {currentCard ? (
          <div className="relative">
            {/* Flashcard container */}
            <div
              onClick={() => setIsFlipped(!isFlipped)}
              className="min-h-[280px] sm:min-h-[320px] rounded-3xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 hover:border-slate-700 p-6 sm:p-8 flex flex-col justify-between cursor-pointer transition-all shadow-2xl relative overflow-hidden group select-none"
            >
              {/* Card top bar */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    {currentCard.type.replace('_', ' ')}
                  </span>
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                    Nivel {currentCard.level}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => handlePlayAudio(currentCard.term, `card-${currentCard.id}`, e)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                    title="Escuchar pronunciación"
                  >
                    <Volume2
                      className={`w-4 h-4 ${
                        playingId === `card-${currentCard.id}` ? 'text-indigo-400 animate-pulse' : ''
                      }`}
                    />
                  </button>
                  <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                    <RotateCw className="w-3 h-3 group-hover:rotate-180 transition-transform duration-500" />
                    <span>Toca para girar</span>
                  </span>
                </div>
              </div>

              {/* Card Center Content */}
              <div className="my-6 text-center">
                {!isFlipped ? (
                  /* FRONT: English term + Context sentence with prompt */
                  <div className="space-y-3">
                    <h3 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
                      {currentCard.term}
                    </h3>
                    {currentCard.ipa && (
                      <p className="text-sm font-mono text-indigo-400">{currentCard.ipa}</p>
                    )}
                    <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto italic mt-2">
                      ¿Recuerdas su significado exacto y cómo usarlo en contexto?
                    </p>
                  </div>
                ) : (
                  /* BACK: Translation + Full example + Notes */
                  <div className="space-y-3 animate-in fade-in zoom-in-95 duration-200">
                    <div className="inline-block px-3 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-semibold mb-1">
                      Significado en Español
                    </div>
                    <h3 className="text-xl sm:text-3xl font-extrabold text-emerald-300 tracking-tight">
                      {currentCard.translation}
                    </h3>

                    {/* Example sentence */}
                    <div className="max-w-xl mx-auto mt-4 p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 text-left">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Ejemplo real en inglés:
                        </span>
                        <button
                          onClick={(e) =>
                            handlePlayAudio(currentCard.contextSentence, `ctx-${currentCard.id}`, e)
                          }
                          className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                        >
                          <Volume2 className="w-3 h-3" />
                          <span>Escuchar</span>
                        </button>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-100 font-medium">
                        "{currentCard.contextSentence}"
                      </p>
                      {currentCard.translationContext && (
                        <p className="text-xs text-slate-400 italic mt-0.5">
                          &rarr; {currentCard.translationContext}
                        </p>
                      )}
                    </div>

                    {currentCard.notes && (
                      <p className="text-xs text-amber-300/90 bg-amber-500/10 p-2 rounded-lg border border-amber-500/20 max-w-xl mx-auto">
                        💡 {currentCard.notes}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Bottom hint or flip bar */}
              <div className="text-center text-[11px] text-slate-500">
                {!isFlipped
                  ? 'Haz clic en la tarjeta para revelar la traducción y ejemplos'
                  : 'Califica qué tan fácil te resultó recordar esta estructura:'}
              </div>
            </div>

            {/* SRS Review Rating Buttons (active only when flipped) */}
            {isFlipped && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4 animate-in fade-in slide-in-from-bottom-2">
                <button
                  onClick={() => handleGrade('again')}
                  className="py-3 px-2 rounded-xl bg-rose-500/10 border border-rose-500/30 hover:bg-rose-500/20 text-rose-300 text-xs font-bold transition-all text-center"
                >
                  <span className="block text-sm mb-0.5">🔴 Otra vez</span>
                  <span className="text-[10px] font-normal opacity-80">&lt; 10 min</span>
                </button>

                <button
                  onClick={() => handleGrade('hard')}
                  className="py-3 px-2 rounded-xl bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 text-amber-300 text-xs font-bold transition-all text-center"
                >
                  <span className="block text-sm mb-0.5">🟠 Difícil</span>
                  <span className="text-[10px] font-normal opacity-80">1 día</span>
                </button>

                <button
                  onClick={() => handleGrade('good')}
                  className="py-3 px-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 text-emerald-300 text-xs font-bold transition-all text-center"
                >
                  <span className="block text-sm mb-0.5">🟢 Bien</span>
                  <span className="text-[10px] font-normal opacity-80">3 días</span>
                </button>

                <button
                  onClick={() => handleGrade('easy')}
                  className="py-3 px-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 hover:bg-cyan-500/20 text-cyan-300 text-xs font-bold transition-all text-center"
                >
                  <span className="block text-sm mb-0.5">🔵 Fácil</span>
                  <span className="text-[10px] font-normal opacity-80">7 días</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Empty / Completed state */
          <div className="rounded-3xl bg-slate-900/60 border border-slate-800 p-10 text-center">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mx-auto text-emerald-400 mb-4">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-white mb-1">
              ¡Repaso del día completado!
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto mb-4">
              Has revisado todas las tarjetas pendientes. Vuelve más tarde o añade nuevas collocations aprendidas durante tus sesiones con el Coach.
            </p>
            <button
              onClick={() => setIsAddingCard(true)}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition-colors"
            >
              + Añadir nuevo término
            </button>
          </div>
        )}
      </div>

      {/* ALL FLASHCARDS EXPLORER */}
      <div className="border-t border-slate-800 pt-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-indigo-400" />
            <span>Biblioteca de Léxico Activo ({filteredCards.length})</span>
          </h2>

          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar término o traducción..."
                className="bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-44 sm:w-56"
              />
            </div>

            {/* Level filter */}
            <select
              value={selectedLevelFilter}
              onChange={(e) => setSelectedLevelFilter(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
            >
              <option value="all">Todos los niveles</option>
              <option value="A1">Nivel A1</option>
              <option value="A2">Nivel A2</option>
              <option value="B1">Nivel B1</option>
              <option value="B2">Nivel B2</option>
              <option value="C1">Nivel C1</option>
              <option value="C2">Nivel C2</option>
            </select>
          </div>
        </div>

        {/* Card grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredCards.map((card) => (
            <div
              key={card.id}
              className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 hover:border-slate-700 transition-colors flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[9px] uppercase font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    {card.type.replace('_', ' ')}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400">
                    Nivel {card.level}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-sm font-bold text-white tracking-tight">{card.term}</h4>
                  <button
                    onClick={() => handlePlayAudio(card.term, `lib-${card.id}`)}
                    className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <p className="text-xs text-emerald-400 font-medium mt-1">{card.translation}</p>

                <p className="text-[11px] text-slate-400 italic mt-2 border-l-2 border-slate-700 pl-2">
                  "{card.contextSentence}"
                </p>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                <span>Repasos: {card.reviewCount}</span>
                <span>Etapa: {card.repetitionStage}/5</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ADD CARD MODAL */}
      {isAddingCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-1">
              Añadir Nueva Estructura al Mazo SRS
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Registra una collocation, chunk o phrasal verb para programar su repetición espaciada.
            </p>

            <form onSubmit={handleCreateCardSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Término o Collocation en Inglés *
                </label>
                <input
                  type="text"
                  required
                  value={newTerm}
                  onChange={(e) => setNewTerm(e.target.value)}
                  placeholder="ej: come up with / take for granted"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Tipo</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="collocation">Collocation</option>
                    <option value="phrasal_verb">Phrasal Verb</option>
                    <option value="idiom">Idiom</option>
                    <option value="chunk">Lexical Chunk</option>
                    <option value="connector">Conector</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Nivel CEFR
                  </label>
                  <select
                    value={newLevel}
                    onChange={(e) => setNewLevel(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="A1">A1</option>
                    <option value="A2">A2</option>
                    <option value="B1">B1</option>
                    <option value="B2">B2</option>
                    <option value="C1">C1</option>
                    <option value="C2">C2</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Traducción / Significado en Español *
                </label>
                <input
                  type="text"
                  required
                  value={newTranslation}
                  onChange={(e) => setNewTranslation(e.target.value)}
                  placeholder="ej: ocurrirse / dar por sentado"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Oración de Ejemplo (Input Comprensible) *
                </label>
                <textarea
                  required
                  rows={2}
                  value={newContext}
                  onChange={(e) => setNewContext(e.target.value)}
                  placeholder="ej: She came up with a brilliant proposal for the client."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Nota técnica o mnemotecnia (opcional)
                </label>
                <input
                  type="text"
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="ej: Three-part phrasal verb. No se separa nunca."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddingCard(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition-colors"
                >
                  Guardar en Mazo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

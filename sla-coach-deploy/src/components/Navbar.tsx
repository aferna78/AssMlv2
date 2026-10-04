import React from 'react';
import {
  Sparkles,
  BookOpen,
  Brain,
  CheckCircle2,
  Compass,
  BarChart3,
  Volume2,
  ChevronDown,
  Flame,
  Mic,
  Cloud,
  CloudOff,
  RefreshCw,
  User,
  Check,
} from 'lucide-react';
import { CEFRLevel, Domain, ErrorRate, SystemState } from '../types';

interface NavbarProps {
  currentTab: 'chat' | 'assimil' | 'roadmap' | 'srs' | 'diagnostic' | 'stats';
  onSelectTab: (tab: 'chat' | 'assimil' | 'roadmap' | 'srs' | 'diagnostic' | 'stats') => void;
  systemState: SystemState;
  onSelectLevel: (level: CEFRLevel) => void;
  voiceAccent: 'en-US' | 'en-GB';
  onToggleAccent: () => void;
  onOpenDiagnostic: () => void;
  onOpenStats: () => void;
  onOpenVoicePractice: () => void;
  currentAssimilLesson?: number;
  completedLessonsCount?: number;
  syncStatus?: 'idle' | 'syncing' | 'synced' | 'error';
  onManualSync?: () => void;
  userEmail?: string;
  userDisplayName?: string;
  onOpenProfile?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  systemState,
  onSelectLevel,
  voiceAccent,
  onToggleAccent,
  onOpenDiagnostic,
  onOpenStats,
  onOpenVoicePractice,
  currentAssimilLesson = 2,
  completedLessonsCount = 1,
  syncStatus = 'synced',
  onManualSync,
  userEmail = 'AntonioFCM@gmail.com',
  userDisplayName = 'Antonio',
  onOpenProfile,
}) => {
  const [levelDropdownOpen, setLevelDropdownOpen] = React.useState(false);
  const levels: CEFRLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

  const getScaffoldingRatio = (level: CEFRLevel) => {
    if (level === 'A1' || level === 'A2') return '80% ES / 20% EN';
    if (level === 'B1' || level === 'B2') return '30% ES / 70% EN';
    return '100% EN (C1/C2)';
  };

  const getLevelColor = (level: CEFRLevel) => {
    switch (level) {
      case 'A1': return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'A2': return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';
      case 'B1': return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40';
      case 'B2': return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
      case 'C1': return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
      case 'C2': return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/85 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => onSelectTab('chat')}
              className="flex items-center gap-2.5 text-left group transition-transform active:scale-95"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 p-0.5 shadow-lg shadow-indigo-500/20">
                <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center group-hover:bg-transparent transition-colors">
                  <Sparkles className="w-5 h-5 text-indigo-400 group-hover:text-white transition-colors" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-base tracking-tight text-white">SLA Master Coach</span>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                    i+1
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
                  Krashen SLA &bull; Método Léxico &bull; Spaced Repetition
                </p>
              </div>
            </button>

            {/* CEFR Level Selector dropdown */}
            <div className="relative ml-2 sm:ml-4">
              <button
                onClick={() => setLevelDropdownOpen(!levelDropdownOpen)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-all ${getLevelColor(
                  systemState.cefrLevel
                )} hover:brightness-110`}
                title="Cambiar nivel CEFR"
              >
                <span>Nivel {systemState.cefrLevel}</span>
                <ChevronDown className="w-3.5 h-3.5 opacity-70" />
              </button>

              {levelDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-20"
                    onClick={() => setLevelDropdownOpen(false)}
                  />
                  <div className="absolute left-0 mt-2 w-64 rounded-xl border border-slate-800 bg-slate-900/95 backdrop-blur-xl shadow-2xl p-2 z-30 animate-in fade-in zoom-in-95">
                    <div className="px-2 py-1.5 border-b border-slate-800/80 mb-1">
                      <p className="text-xs font-semibold text-slate-200">Ajuste de Nivel CEFR</p>
                      <p className="text-[10px] text-slate-400">
                        Adapta el scaffolding de input ({getScaffoldingRatio(systemState.cefrLevel)})
                      </p>
                    </div>
                    <div className="space-y-1">
                      {levels.map((lvl) => (
                        <button
                          key={lvl}
                          onClick={() => {
                            onSelectLevel(lvl);
                            setLevelDropdownOpen(false);
                          }}
                          className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors ${
                            systemState.cefrLevel === lvl
                              ? 'bg-indigo-600/30 text-indigo-200 font-bold border border-indigo-500/40'
                              : 'text-slate-300 hover:bg-slate-800'
                          }`}
                        >
                          <div>
                            <span className="font-semibold">{lvl}</span> -{' '}
                            <span className="text-[11px] text-slate-400">
                              {lvl === 'A1'
                                ? 'Principiante'
                                : lvl === 'A2'
                                ? 'Elemental'
                                : lvl === 'B1'
                                ? 'Intermedio'
                                : lvl === 'B2'
                                ? 'Avanzado Int.'
                                : lvl === 'C1'
                                ? 'Operativo Eficaz'
                                : 'Maestría Bilingüe'}
                            </span>
                          </div>
                          <span className="text-[9px] text-slate-400 font-mono">
                            {getScaffoldingRatio(lvl).split(' ')[0]}
                          </span>
                        </button>
                      ))}
                    </div>
                    <div className="mt-2 pt-1.5 border-t border-slate-800/80">
                      <button
                        onClick={() => {
                          setLevelDropdownOpen(false);
                          onOpenDiagnostic();
                        }}
                        className="w-full text-center py-1 text-[11px] text-indigo-400 hover:text-indigo-300 font-medium"
                      >
                        ⚡ ¿Dudas de tu nivel? Haz el Test Diagnóstico
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-900/60 p-1 rounded-xl border border-slate-800/80">
            <button
              onClick={() => onSelectTab('assimil')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                currentTab === 'assimil'
                  ? 'bg-gradient-to-r from-rose-600 to-indigo-600 text-white shadow-md shadow-indigo-600/30 font-bold'
                  : 'text-rose-300/90 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-rose-400" />
              <span>Assimil #{currentAssimilLesson}</span>
              {completedLessonsCount > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-mono font-bold">
                  {completedLessonsCount} compl.
                </span>
              )}
            </button>

            <button
              onClick={() => onSelectTab('chat')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                currentTab === 'chat'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Coach SLA</span>
            </button>

            <button
              onClick={() => onSelectTab('roadmap')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                currentTab === 'roadmap'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Roadmap A1-C2</span>
            </button>

            <button
              onClick={() => onSelectTab('srs')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                currentTab === 'srs'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Brain className="w-3.5 h-3.5" />
              <span>Mazo SRS</span>
            </button>

            <button
              onClick={() => onSelectTab('diagnostic')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                currentTab === 'diagnostic'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Diagnóstico</span>
            </button>
          </nav>

          {/* Quick Stats, Voice & System State drawer */}
          <div className="flex items-center gap-2">
            {/* User Profile Assigned Button */}
            {onOpenProfile && (
              <button
                onClick={onOpenProfile}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-indigo-500/40 text-white text-xs font-semibold transition-all cursor-pointer shadow-sm hover:border-indigo-400 group"
                title={`Perfil activo: ${userDisplayName || 'Antonio'} (${userEmail || 'AntonioFCM@gmail.com'}). Clic para ver o cambiar perfil.`}
              >
                <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-indigo-600 to-rose-600 flex items-center justify-center text-[11px] font-bold text-white shadow-xs shrink-0">
                  {(userDisplayName || 'Antonio')[0].toUpperCase()}
                </div>
                <div className="hidden lg:flex flex-col text-left leading-tight">
                  <span className="text-[11px] font-bold text-white group-hover:text-indigo-300">
                    {userDisplayName || 'Antonio'}
                  </span>
                  <span className="text-[9px] text-emerald-400 font-medium flex items-center gap-0.5">
                    <Check className="w-2.5 h-2.5" /> Perfil Guardado
                  </span>
                </div>
              </button>
            )}

            {/* Cloud Sync Status Button */}
            {onManualSync && (
              <button
                onClick={onManualSync}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs transition-all cursor-pointer bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-300"
                title={
                  syncStatus === 'syncing'
                    ? 'Sincronizando progreso en la nube...'
                    : syncStatus === 'error'
                    ? 'Error de conexión temporal. Haz clic para reintentar.'
                    : 'Progreso sincronizado en la nube (Móvil y PC al día). Haz clic para forzar sincronización.'
                }
              >
                {syncStatus === 'syncing' ? (
                  <RefreshCw className="w-3.5 h-3.5 text-indigo-400 animate-spin" />
                ) : syncStatus === 'error' ? (
                  <CloudOff className="w-3.5 h-3.5 text-rose-400" />
                ) : (
                  <Cloud className="w-3.5 h-3.5 text-emerald-400" />
                )}
                <span className="hidden xl:inline text-[11px] text-slate-300">
                  {syncStatus === 'syncing' ? 'Sincronizando...' : 'Nube OK'}
                </span>
              </button>
            )}

            {/* Hablar con la app / Modo Voz button */}
            <button
              onClick={onOpenVoicePractice}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-indigo-600/30 via-indigo-500/20 to-rose-500/20 hover:from-indigo-600/40 hover:to-rose-500/30 border border-indigo-500/40 text-indigo-200 text-xs font-semibold transition-all shadow-sm active:scale-95 cursor-pointer"
              title="Hablar con la app (Modo Conversación por Voz)"
            >
              <Mic className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
              <span className="hidden sm:inline">Hablar con la app</span>
              <span className="sm:hidden">Hablar</span>
            </button>

            {/* Audio Accent Toggle */}
            <button
              onClick={onToggleAccent}
              title={`Variante e idioma de audio: ${voiceAccent === 'en-GB' ? 'Inglés Británico (UK Standard - Activo)' : 'Inglés Estadounidense (US)'}. Haz clic para cambiar.`}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                voiceAccent === 'en-GB'
                  ? 'border-indigo-500/40 bg-indigo-500/10 text-indigo-300 shadow-sm'
                  : 'border-slate-800 bg-slate-900 text-slate-300 hover:border-slate-700'
              }`}
            >
              <span>{voiceAccent === 'en-GB' ? '🇬🇧 UK' : '🇺🇸 US'}</span>
              <span className="text-[10px] text-slate-400 font-normal hidden lg:inline">
                {voiceAccent === 'en-GB' ? 'Británico' : 'Americano'}
              </span>
            </button>

            {/* Streak & XP pill */}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs">
              <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span className="font-semibold">{systemState.streakDays || 1} d</span>
            </div>

            {/* Open System State drawer button */}
            <button
              onClick={onOpenStats}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 text-xs font-medium hover:bg-slate-800 transition-colors"
              title="Ver registro del estado del sistema SLA"
            >
              <BarChart3 className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">Estado SLA</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile subnavigation bar */}
      <div className="flex md:hidden border-t border-slate-800/80 bg-slate-950 px-2 py-1.5 justify-around overflow-x-auto">
        <button
          onClick={() => onSelectTab('assimil')}
          className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs shrink-0 ${
            currentTab === 'assimil' ? 'text-rose-400 font-bold bg-rose-500/10' : 'text-slate-400'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5 text-rose-400" />
          <span>Assimil #{currentAssimilLesson}</span>
          {completedLessonsCount > 0 && (
            <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-bold">
              {completedLessonsCount}
            </span>
          )}
        </button>
        <button
          onClick={() => onSelectTab('chat')}
          className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs shrink-0 ${
            currentTab === 'chat' ? 'text-indigo-400 font-bold bg-indigo-500/10' : 'text-slate-400'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Coach</span>
        </button>
        <button
          onClick={onOpenVoicePractice}
          className="flex items-center gap-1 px-2.5 py-1 rounded text-xs text-rose-400 font-bold bg-rose-500/10 shrink-0"
        >
          <Mic className="w-3.5 h-3.5 animate-pulse" />
          <span>Hablar</span>
        </button>
        <button
          onClick={() => onSelectTab('roadmap')}
          className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs shrink-0 ${
            currentTab === 'roadmap' ? 'text-indigo-400 font-bold bg-indigo-500/10' : 'text-slate-400'
          }`}
        >
          <Compass className="w-3.5 h-3.5" />
          <span>Roadmap</span>
        </button>
        <button
          onClick={() => onSelectTab('srs')}
          className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs shrink-0 ${
            currentTab === 'srs' ? 'text-indigo-400 font-bold bg-indigo-500/10' : 'text-slate-400'
          }`}
        >
          <Brain className="w-3.5 h-3.5" />
          <span>SRS</span>
        </button>
        <button
          onClick={() => onSelectTab('diagnostic')}
          className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs shrink-0 ${
            currentTab === 'diagnostic' ? 'text-indigo-400 font-bold bg-indigo-500/10' : 'text-slate-400'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Test</span>
        </button>
        {onOpenProfile && (
          <button
            onClick={onOpenProfile}
            className="flex items-center gap-1 px-2.5 py-1 rounded text-xs text-indigo-300 font-semibold bg-indigo-500/10 shrink-0"
            title="Mi Perfil"
          >
            <div className="w-4 h-4 rounded bg-gradient-to-tr from-indigo-600 to-rose-600 flex items-center justify-center text-[9px] font-bold text-white">
              {(userDisplayName || 'Antonio')[0].toUpperCase()}
            </div>
            <span>Perfil</span>
          </button>
        )}
      </div>
    </header>
  );
};

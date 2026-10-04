import React, { useState, useEffect } from 'react';
import {
  User,
  Mail,
  Shield,
  Cloud,
  CheckCircle2,
  RefreshCw,
  Plus,
  Users,
  Award,
  Flame,
  BookOpen,
  ArrowRight,
  X,
  Edit2,
  Check,
} from 'lucide-react';
import { UserProfileSummary, AssimilProgress, SystemState } from '../types';
import {
  fetchProfilesList,
  createNewProfile,
  setActiveProfile,
  getActiveProfileEmail,
  getActiveProfileName,
  saveServerProgress,
  fetchServerProgress,
} from '../utils/syncService';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLessonNum: number;
  assimilProgress: AssimilProgress;
  systemState: SystemState;
  onProfileSwitched: (newEmail: string, displayName: string) => void;
  syncStatus?: 'idle' | 'syncing' | 'synced' | 'error';
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  currentLessonNum,
  assimilProgress,
  systemState,
  onProfileSwitched,
  syncStatus = 'synced',
}) => {
  const [activeEmail, setActiveEmail] = useState<string>(getActiveProfileEmail());
  const [activeName, setActiveName] = useState<string>(getActiveProfileName());
  const [profiles, setProfiles] = useState<UserProfileSummary[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Load registered profiles
  const loadProfiles = async () => {
    const res = await fetchProfilesList();
    if (res?.profiles) {
      setProfiles(res.profiles);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setActiveEmail(getActiveProfileEmail());
      setActiveName(getActiveProfileName());
      loadProfiles();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const completedCount = assimilProgress.completedLessons.length;
  const completionPercentage = Math.round((completedCount / 146) * 100);

  // Manual save for active profile
  const handleForceSave = async () => {
    setIsSaving(true);
    setSuccessToast(null);
    try {
      await saveServerProgress({
        userEmail: activeEmail,
        displayName: activeName,
        currentAssimilLessonNum: currentLessonNum,
        assimilProgress,
        systemState,
      });
      setSuccessToast(`¡Progreso guardado y asignado exitosamente al perfil de ${activeName}!`);
      loadProfiles();
      setTimeout(() => setSuccessToast(null), 4000);
    } catch {
      setSuccessToast('Error al conectar con el servidor.');
    } finally {
      setIsSaving(false);
    }
  };

  // Switch to another profile
  const handleSwitchProfile = async (targetEmail: string, targetName: string) => {
    setActiveProfile(targetEmail, targetName);
    setActiveEmail(targetEmail);
    setActiveName(targetName);
    setSuccessToast(`Cambiando al perfil de ${targetName}...`);
    onProfileSwitched(targetEmail, targetName);
    setTimeout(() => {
      setSuccessToast(null);
      onClose();
    }, 800);
  };

  // Create new profile
  const handleCreateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim()) return;

    const name = newName.trim() || newEmail.split('@')[0];
    const email = newEmail.trim();

    const ok = await createNewProfile(email, name);
    if (ok) {
      setIsCreating(false);
      setNewName('');
      setNewEmail('');
      await handleSwitchProfile(email, name);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-rose-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
              {activeName ? activeName[0].toUpperCase() : 'A'}
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>Perfil de Aprendizaje & Nube</span>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Activo
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Tu progreso y lecciones están vinculados y guardados bajo esta cuenta
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6">
          {/* Success Toast */}
          {successToast && (
            <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-500/50 text-xs text-emerald-200 flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successToast}</span>
            </div>
          )}

          {/* ACTIVE PROFILE HERO CARD */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-950/40 via-slate-900 to-slate-950 border border-indigo-500/30 shadow-lg space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">
                  Usuario Activo Asignado
                </span>
                <div className="flex items-center gap-2">
                  <h4 className="text-lg font-extrabold text-white">
                    {activeName}
                  </h4>
                  <span className="text-xs text-slate-400 font-mono">
                    ({activeEmail})
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                  <Cloud className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Sincronizado en la Nube</span>
                </span>
              </div>
            </div>

            {/* Metrics Breakdown */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <BookOpen className="w-3.5 h-3.5 text-rose-400" />
                  <span>Lección Actual</span>
                </div>
                <div className="text-lg font-bold text-white">
                  #{currentLessonNum}
                </div>
                <div className="text-[10px] text-slate-500">
                  Assimil Bulger
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Completadas</span>
                </div>
                <div className="text-lg font-bold text-white">
                  {completedCount} <span className="text-xs font-normal text-slate-400">/ 146</span>
                </div>
                <div className="text-[10px] text-emerald-400 font-semibold">
                  {completionPercentage}% del curso
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <Flame className="w-3.5 h-3.5 text-amber-400" />
                  <span>Racha Activa</span>
                </div>
                <div className="text-lg font-bold text-white">
                  {systemState.streakDays || 1} días
                </div>
                <div className="text-[10px] text-amber-400 font-semibold">
                  {systemState.xpPoints || 0} XP acumulados
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <Award className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Nivel CEFR</span>
                </div>
                <div className="text-lg font-bold text-white">
                  {systemState.cefrLevel}
                </div>
                <div className="text-[10px] text-indigo-400">
                  {systemState.learningTrack || 'UK Standard'}
                </div>
              </div>
            </div>

            {/* Explanatory guarantee */}
            <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800/80 text-xs text-slate-300 leading-relaxed flex items-start gap-2.5">
              <Shield className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white">Garantía de Persistencia Multi-Dispositivo: </strong>
                Todo lo que avances en tu ordenador se guarda bajo el perfil de <strong className="text-indigo-300">{activeEmail}</strong>. Al abrir la app en tu teléfono con Google Chrome, se carga automáticamente tu progreso personal y viceversa.
              </div>
            </div>

            {/* Action: Force Save Now */}
            <div className="pt-1 flex items-center justify-between gap-3 flex-wrap">
              <button
                type="button"
                onClick={handleForceSave}
                disabled={isSaving}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md cursor-pointer transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSaving ? 'animate-spin' : ''}`} />
                <span>{isSaving ? 'Guardando en tu perfil...' : 'Guardar y verificar progreso ahora'}</span>
              </button>

              <span className="text-[11px] text-slate-400">
                Última sincronización: Hace unos segundos
              </span>
            </div>
          </div>

          {/* MULTI-PROFILE SELECTOR & SWITCHER */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-400" />
                  <span>Perfiles Guardados en este Sistema</span>
                </h4>
                <p className="text-xs text-slate-400">
                  Cada perfil conserva su progreso y lecciones de forma 100% independiente.
                </p>
              </div>

              {!isCreating && (
                <button
                  type="button"
                  onClick={() => setIsCreating(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Nuevo Perfil</span>
                </button>
              )}
            </div>

            {/* Create new profile form */}
            {isCreating && (
              <form
                onSubmit={handleCreateProfile}
                className="p-4 rounded-xl bg-slate-950/80 border border-indigo-500/40 space-y-3 animate-in fade-in"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">
                    Crear nuevo perfil de estudiante
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsCreating(false)}
                    className="text-slate-400 hover:text-white text-xs"
                  >
                    Cancelar
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">
                      Nombre o alias:
                    </label>
                    <input
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="Ej: Antonio, María..."
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">
                      Correo electrónico identificador:
                    </label>
                    <input
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="ejemplo@gmail.com"
                      required
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md cursor-pointer"
                  >
                    Crear y Asignar Perfil
                  </button>
                </div>
              </form>
            )}

            {/* List of registered profiles */}
            <div className="space-y-2">
              {profiles.map((p) => {
                const isCurrent = p.email.toLowerCase() === activeEmail.toLowerCase();

                return (
                  <div
                    key={p.email}
                    className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 transition-all ${
                      isCurrent
                        ? 'bg-indigo-950/30 border-indigo-500/50 shadow-sm'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-indigo-600 to-rose-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                        {p.displayName ? p.displayName[0].toUpperCase() : 'U'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-white">
                            {p.displayName}
                          </span>
                          {isCurrent && (
                            <span className="text-[10px] px-2 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
                              Activo ahora
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 font-mono">
                          {p.email} &bull; Lección #{p.currentLesson} ({p.completedLessonsCount} completadas)
                        </p>
                      </div>
                    </div>

                    {!isCurrent && (
                      <button
                        type="button"
                        onClick={() => handleSwitchProfile(p.email, p.displayName)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors cursor-pointer shrink-0"
                      >
                        <span>Cargar este perfil</span>
                        <ArrowRight className="w-3.5 h-3.5 text-indigo-400" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            Perfil actual: <strong className="text-white">{activeEmail}</strong>
          </span>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

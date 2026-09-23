'use client';

import React, { useState, useEffect } from 'react';
import { 
  Lock, 
  Settings, 
  Edit2, 
  Check, 
  UserPlus, 
  Trash2, 
  Users, 
  ChevronDown, 
  ChevronUp, 
  BookOpen, 
  Sparkles, 
  ShieldCheck, 
  ArrowRight,
  HeartHandshake,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { gradesArr, lettersArr, PIN_CONFIG, units } from '@/lib/constants';
import { PinModal } from './PinModal';
import { SchoolLogo } from './SchoolLogo';
import { TreeGrowthIcon } from './TreeGrowthIcon';
import { treeGrowthStages, getTreeGrowthStage } from '@/lib/treeGrowth';
import { AppData, Teacher } from '@/lib/types';

interface DashboardProps {
  appData: AppData;
  onSelectClass: (grade: string, letter: string) => void;
}

export function Dashboard({ appData, onSelectClass }: DashboardProps) {
  const [openYear, setOpenYear] = useState<number | null>(1); // Default open 1º ano
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [pendingSelection, setPendingSelection] = useState<{ g: number | null; l: string | null; isAdmin?: boolean }>({ g: null, l: null });
  const [currentPin, setCurrentPin] = useState("");
  const [isError, setIsError] = useState(false);
  
  const [classPins, setClassPins] = useState<Record<string, string>>({});
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [isAdminAuth, setIsAdminAuth] = useState(false);
  const [editingPin, setEditingPin] = useState<string | null>(null);
  const [newPinValue, setNewPinValue] = useState("");
  const [newTeacherName, setNewTeacherName] = useState("");
  const [newTeacherClasses, setNewTeacherClasses] = useState<string[]>([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(null);

  useEffect(() => {
    const savedPins = localStorage.getItem('edu_pins_v13');
    if (savedPins) {
      setClassPins(JSON.parse(savedPins));
    } else {
      const initialPins: Record<string, string> = {};
      gradesArr.forEach(g => {
        lettersArr.forEach(l => {
          initialPins[`${g}${l}`] = PIN_CONFIG[g.toString()];
        });
      });
      setClassPins(initialPins);
      localStorage.setItem('edu_pins_v13', JSON.stringify(initialPins));
    }

    const savedTeachers = localStorage.getItem('edu_teachers_v13');
    if (savedTeachers) {
      setTeachers(JSON.parse(savedTeachers));
    }
  }, []);

  const handlePinChange = (pin: string) => {
    if (isError) return;
    setCurrentPin(pin);
    
    if (pendingSelection.isAdmin) {
      if (pin.length >= 7) {
        if (pin.toLowerCase() === 'adm2026') {
          setIsAdminAuth(true);
          setPinModalOpen(false);
        } else {
          setIsError(true);
          setTimeout(() => { setCurrentPin(""); setIsError(false); }, 500);
        }
      }
    } else {
      if (pin.length === 5) {
        const classKey = `${pendingSelection.g}${pendingSelection.l}`;
        const correctPin = classPins[classKey] || PIN_CONFIG[pendingSelection.g!.toString()];
        
        if (pendingSelection.g && pin === correctPin) {
          onSelectClass(pendingSelection.g.toString(), pendingSelection.l!);
          setPinModalOpen(false);
        } else {
          setIsError(true);
          setTimeout(() => { setCurrentPin(""); setIsError(false); }, 500);
        }
      }
    }
  };

  const openPinModal = (g: number, l: string) => {
    setPendingSelection({ g, l });
    setCurrentPin("");
    setPinModalOpen(true);
  };

  const openAdminModal = () => {
    setPendingSelection({ g: null, l: null, isAdmin: true });
    setCurrentPin("");
    setPinModalOpen(true);
  };

  const handleSaveNewPin = (classKey: string) => {
    if (newPinValue.length !== 5) {
      alert("A senha deve ter exatamente 5 dígitos numéricos.");
      return;
    }
    const updatedPins = { ...classPins, [classKey]: newPinValue };
    setClassPins(updatedPins);
    localStorage.setItem('edu_pins_v13', JSON.stringify(updatedPins));
    setEditingPin(null);
    setNewPinValue("");
  };

  const handleSaveTeacher = () => {
    if (!newTeacherName.trim()) return;
    const newTeacher: Teacher = {
      id: Date.now().toString(),
      name: newTeacherName.trim().toUpperCase(),
      classes: newTeacherClasses
    };
    const updated = [...teachers, newTeacher];
    setTeachers(updated);
    localStorage.setItem('edu_teachers_v13', JSON.stringify(updated));
    setNewTeacherName("");
    setNewTeacherClasses([]);
  };

  const handleDeleteTeacher = (id: string) => {
    if (confirm("Remover este professor da lista?")) {
      const updated = teachers.filter(t => t.id !== id);
      setTeachers(updated);
      localStorage.setItem('edu_teachers_v13', JSON.stringify(updated));
    }
  };

  const toggleTeacherClass = (classKey: string) => {
    setNewTeacherClasses(prev => 
      prev.includes(classKey) ? prev.filter(k => k !== classKey) : [...prev, classKey]
    );
  };

  // Compute school-wide statistics
  const schoolStats = (() => {
    let totalStudents = 0;
    let totalAee = 0;
    let totalReportsDone = 0;
    let totalReportsPossible = 0;

    gradesArr.forEach(g => {
      lettersArr.forEach(l => {
        const cData = appData[`${g}${l}`];
        if (cData && cData.students) {
          const activeStudents = cData.students.filter(s => cData[s]?.active !== false);
          totalStudents += activeStudents.length;

          activeStudents.forEach(s => {
            const sData = cData[s];
            if (sData?.isAee) totalAee++;

            // Count for current evaluation units
            units.forEach(u => {
              totalReportsPossible++;
              if (sData?.[u]?.observation && sData[u].observation.trim().length > 30) {
                totalReportsDone++;
              }
            });
          });
        }
      });
    });

    const completionRate = totalReportsPossible > 0 
      ? Math.round((totalReportsDone / totalReportsPossible) * 100) 
      : 0;

    return { totalStudents, totalAee, totalReportsDone, completionRate };
  })();

  return (
    <div className="min-h-full bg-[#f8fafc] text-slate-800 flex flex-col justify-between selection:bg-emerald-100 selection:text-emerald-900">
      {/* Top Institutional Header Bar */}
      <header className="bg-white/95 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <SchoolLogo size="md" showText={true} />
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden md:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Ano Letivo 2026
            </span>

            <button 
              onClick={isAdminAuth ? () => setIsAdminAuth(false) : openAdminModal} 
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase transition-all shadow-xs ${
                isAdminAuth 
                  ? 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100' 
                  : 'bg-slate-100 text-slate-700 border border-slate-200 hover:bg-white hover:border-slate-300'
              }`}
              title="Acesso da Coordenação e Administração"
            >
              {isAdminAuth ? <Lock className="w-3.5 h-3.5 text-rose-600" /> : <Settings className="w-3.5 h-3.5 text-slate-500" />}
              <span>{isAdminAuth ? "Sair do Adm" : "Admin / Senhas"}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto w-full px-4 sm:px-6 py-8 flex-1">
        {/* Hero Section with School Emblem & Botanical Brand */}
        <section className="mb-8 bg-gradient-to-br from-white via-white to-sky-50/50 p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
          {/* Subtle botanical branch background glow */}
          <div className="absolute -right-10 -bottom-10 w-72 h-72 rounded-full bg-emerald-100/40 blur-3xl pointer-events-none" />
          <div className="absolute -left-10 -top-10 w-64 h-64 rounded-full bg-sky-100/40 blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-50 border border-sky-200 text-escola-azul text-[10px] font-black uppercase tracking-wider mb-3">
                <BookOpen className="w-3 h-3 text-sky-600" />
                <span>Gestão Pedagógica dos Pareceres Descritivos</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 uppercase font-serif tracking-tight leading-tight">
                Caderno de Avaliação & Habilidades
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 font-medium mt-1 leading-relaxed">
                Acompanhamento contínuo da trajetória de cada estudante, respeitando cada etapa do seu crescimento desde o primeiro broto até a plena maturidade.
              </p>
            </div>

            {/* School Metrics Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 shrink-0 bg-slate-50/90 p-3 rounded-2xl border border-slate-200/80">
              <div className="p-2.5 bg-white rounded-xl border border-slate-100 text-center shadow-2xs">
                <span className="block text-lg font-black text-slate-900 font-mono">20</span>
                <span className="text-[9px] font-bold text-slate-500 uppercase">Turmas (1º ao 5º)</span>
              </div>
              <div className="p-2.5 bg-white rounded-xl border border-slate-100 text-center shadow-2xs">
                <span className="block text-lg font-black text-escola-azul font-mono">{schoolStats.totalStudents}</span>
                <span className="text-[9px] font-bold text-slate-500 uppercase">Estudantes</span>
              </div>
              <div className="p-2.5 bg-white rounded-xl border border-slate-100 text-center shadow-2xs">
                <span className="block text-lg font-black text-purple-700 font-mono">{schoolStats.totalAee}</span>
                <span className="text-[9px] font-bold text-slate-500 uppercase">Inclusão / AEE</span>
              </div>
              <div className="p-2.5 bg-white rounded-xl border border-slate-100 text-center shadow-2xs">
                <span className="block text-lg font-black text-emerald-700 font-mono">{schoolStats.completionRate}%</span>
                <span className="text-[9px] font-bold text-slate-500 uppercase">Pareceres</span>
              </div>
            </div>
          </div>

          {/* Interactive Tree Growth Roadmap (Our School Hallmark) */}
          <div className="mt-8 pt-6 border-t border-slate-200/80">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                <h2 className="text-xs font-black uppercase tracking-wider text-slate-700">
                  O Ciclo de Crescimento da Nossa Escola: Da Semente ao Fruto
                </h2>
              </div>
              <span className="text-[10px] text-slate-400 font-semibold hidden sm:inline">
                Clique em uma etapa para ver as turmas
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5">
              {treeGrowthStages.map(stage => {
                const isSelected = openYear === stage.grade;
                return (
                  <button
                    key={stage.grade}
                    onClick={() => setOpenYear(stage.grade)}
                    className={`flex sm:flex-col items-center sm:items-start p-3 rounded-2xl border text-left transition-all relative overflow-hidden group ${
                      isSelected
                        ? 'bg-white shadow-md border-emerald-400 ring-2 ring-emerald-200/50 -translate-y-0.5'
                        : 'bg-white/80 border-slate-200/90 hover:border-slate-300 hover:bg-white hover:shadow-2xs'
                    }`}
                  >
                    <div className="flex items-center gap-3 sm:gap-2 mb-0 sm:mb-2 w-full">
                      <TreeGrowthIcon grade={stage.grade} size="sm" withContainer={true} />
                      <div className="flex-1">
                        <span className="block text-[11px] font-black text-slate-900 leading-tight">
                          {stage.grade}º Ano
                        </span>
                        <span className="text-[9px] font-bold text-emerald-700 uppercase block tracking-tight">
                          {stage.shortName}
                        </span>
                      </div>
                    </div>
                    <p className="hidden sm:block text-[10px] text-slate-500 line-clamp-2 leading-relaxed">
                      {stage.pedagogicalFocus}
                    </p>
                    <div 
                      className={`absolute bottom-0 left-0 right-0 h-1 transition-all ${
                        isSelected ? 'bg-emerald-600' : 'bg-transparent group-hover:bg-slate-200'
                      }`} 
                    />
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Administration View or Class Selector */}
        {isAdminAuth ? (
          <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
            {/* Header info */}
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-amber-700" />
                <div>
                  <h2 className="text-xs font-black text-amber-900 uppercase">Modo Administrativo Ativo</h2>
                  <p className="text-[11px] text-amber-800">
                    Gerencie os professores vinculados e as senhas (PIN) de 5 dígitos de cada turma da escola.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAdminAuth(false)}
                className="px-3.5 py-1.5 rounded-xl bg-white border border-amber-300 text-amber-900 text-xs font-bold uppercase hover:bg-amber-100 transition-colors"
              >
                Concluir
              </button>
            </div>

            {/* Teacher Management */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
              <h3 className="text-sm font-black text-slate-800 uppercase mb-4 flex items-center gap-2">
                <Users className="w-4 h-4 text-escola-azul" /> Cadastro de Professores
              </h3>
              
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 mb-6">
                <h4 className="text-xs font-black text-slate-700 uppercase mb-3">Vincular Novo Professor</h4>
                <div className="flex flex-col gap-4">
                  <input 
                    type="text" 
                    value={newTeacherName}
                    onChange={(e) => setNewTeacherName(e.target.value)}
                    placeholder="Nome completo do(a) Professor(a)"
                    className="w-full bg-white px-4 py-2.5 rounded-xl text-xs font-bold outline-none border border-slate-200 focus:border-escola-azul uppercase transition-colors shadow-2xs"
                  />
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase mb-2 block">
                      Selecione as turmas sob responsabilidade:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {gradesArr.map(g => 
                        lettersArr.map(l => {
                          const key = `${g}${l}`;
                          const isSelected = newTeacherClasses.includes(key);
                          return (
                            <button
                              key={key}
                              type="button"
                              onClick={() => toggleTeacherClass(key)}
                              className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase transition-all ${
                                isSelected 
                                  ? 'bg-escola-azul text-white border-escola-azul border shadow-2xs' 
                                  : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                              }`}
                            >
                              {key}
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                  <button 
                    onClick={handleSaveTeacher}
                    className="self-end bg-slate-900 text-white px-4 py-2 rounded-xl font-bold uppercase text-xs hover:bg-slate-800 flex items-center gap-1.5 shadow-2xs transition-colors"
                  >
                    <UserPlus className="w-3.5 h-3.5" /> Salvar Professor
                  </button>
                </div>
              </div>

              {/* Existing Teachers List */}
              <div className="space-y-2.5">
                {teachers.length === 0 ? (
                  <p className="text-xs text-slate-400 font-semibold text-center py-4 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                    Nenhum professor cadastrado ainda. Use o formulário acima para cadastrar a equipe docente.
                  </p>
                ) : (
                  teachers.map(t => (
                    <div key={t.id} className="bg-white p-3.5 rounded-xl border border-slate-200 flex items-center justify-between hover:border-slate-300 transition-colors shadow-2xs">
                      <div>
                        <span className="block text-xs font-black text-slate-900 uppercase">{t.name}</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {t.classes.length > 0 ? (
                            t.classes.map(c => (
                              <span key={c} className="text-[9px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-bold border border-slate-200 font-mono">
                                {c}
                              </span>
                            ))
                          ) : (
                            <span className="text-[9px] text-slate-400 italic">Sem turmas vinculadas</span>
                          )}
                        </div>
                      </div>
                      <button 
                        onClick={() => handleDeleteTeacher(t.id)} 
                        className="w-8 h-8 flex items-center justify-center bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 transition-colors"
                        title="Remover professor"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Class PINs Administration */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
              <h3 className="text-sm font-black text-slate-800 uppercase mb-4 flex items-center gap-2">
                <Lock className="w-4 h-4 text-escola-azul" /> Administração de Senhas das Turmas (PIN)
              </h3>
              <p className="text-[11px] text-slate-500 mb-6">
                Cada turma possui uma senha de 5 dígitos para proteger os registros pedagógicos. Você pode redefinir as senhas abaixo.
              </p>
              
              <div className="space-y-4">
                {gradesArr.map(g => {
                  const stage = getTreeGrowthStage(g);
                  return (
                    <div key={g} className="border border-slate-200/90 rounded-2xl p-4 bg-slate-50/70">
                      <div className="flex items-center gap-2 mb-3">
                        <TreeGrowthIcon grade={g} size="xs" />
                        <h4 className="text-xs font-black text-slate-800 uppercase">
                          {g}º Ano · {stage.shortName}
                        </h4>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                        {lettersArr.map(l => {
                          const classKey = `${g}${l}`;
                          const isEditing = editingPin === classKey;
                          const currentClassPin = classPins[classKey] || PIN_CONFIG[g.toString()];
                          
                          return (
                            <div key={l} className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between shadow-2xs">
                              <div>
                                <span className="block text-sm font-black text-slate-900 uppercase">Turma {l}</span>
                                {isEditing ? (
                                  <input 
                                    type="text" 
                                    maxLength={5}
                                    value={newPinValue}
                                    onChange={(e) => setNewPinValue(e.target.value.replace(/\D/g, ''))}
                                    className="w-20 bg-slate-100 px-2 py-1 rounded-md text-xs font-bold outline-none border border-slate-300 focus:border-escola-azul mt-1 font-mono"
                                    placeholder="5 dígitos"
                                    autoFocus
                                  />
                                ) : (
                                  <span className="text-[10px] font-bold text-slate-400 font-mono">PIN: {currentClassPin}</span>
                                )}
                              </div>
                              {isEditing ? (
                                <button 
                                  onClick={() => handleSaveNewPin(classKey)} 
                                  className="w-8 h-8 flex items-center justify-center bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition-colors"
                                  title="Confirmar nova senha"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                              ) : (
                                <button 
                                  onClick={() => { setEditingPin(classKey); setNewPinValue(currentClassPin); }} 
                                  className="w-8 h-8 flex items-center justify-center bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
                                  title="Editar senha da turma"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Quick Access for Assigned Teachers */}
            {teachers.length > 0 && (
              <section className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-escola-azul" />
                    <h2 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                      Acesso Rápido por Professor(a)
                    </h2>
                  </div>
                  <span className="text-[10px] text-slate-400 font-semibold">
                    Selecione seu nome para visualizar suas turmas
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
                  {teachers.map(t => {
                    const isSelected = selectedTeacherId === t.id;
                    return (
                      <button
                        key={t.id}
                        onClick={() => setSelectedTeacherId(isSelected ? null : t.id)}
                        className={`p-3 rounded-2xl border text-left transition-all ${
                          isSelected 
                            ? 'bg-sky-50/80 border-sky-300 ring-2 ring-sky-200/50 shadow-xs' 
                            : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-2xs'
                        }`}
                      >
                        <span className="block text-xs font-black text-slate-900 uppercase truncate">{t.name}</span>
                        <span className="text-[10px] font-bold text-slate-500 uppercase mt-0.5 block">
                          {t.classes.length} {t.classes.length === 1 ? 'Turma vinculada' : 'Turmas vinculadas'}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Selected Teacher Classes Drawer */}
                {selectedTeacherId && (
                  <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-2 animate-in fade-in slide-in-from-top-1">
                    <span className="text-xs font-bold text-slate-600 mr-2">Suas turmas:</span>
                    {teachers.find(t => t.id === selectedTeacherId)?.classes.map(c => {
                      const g = parseInt(c[0], 10);
                      const l = c.substring(1);
                      return (
                        <button
                          key={c}
                          onClick={() => openPinModal(g, l)}
                          className="px-4 py-2 rounded-xl bg-escola-azul hover:bg-blue-700 text-white font-black text-xs uppercase shadow-xs flex items-center gap-2 transition-transform hover:scale-105"
                        >
                          <TreeGrowthIcon grade={g} size="xs" />
                          <span>{g}º ANO &quot;{l}&quot;</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      );
                    })}
                  </div>
                )}
              </section>
            )}

            {/* All Classes Organized by Grade & Tree Growth Stage */}
            <section className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-emerald-700" />
                  <h2 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                    Turmas do Ensino Fundamental I
                  </h2>
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Ano Letivo 2026
                </span>
              </div>

              {gradesArr.map(g => {
                const stage = getTreeGrowthStage(g);
                const isActive = openYear === g;

                // Grade stats
                let gradeStudents = 0;
                let gradeAee = 0;
                let gradeDoneReports = 0;
                let gradePossibleReports = 0;

                lettersArr.forEach(l => {
                  const cData = appData[`${g}${l}`];
                  if (cData && cData.students) {
                    const activeStudents = cData.students.filter(s => cData[s]?.active !== false);
                    gradeStudents += activeStudents.length;

                    activeStudents.forEach(s => {
                      const sData = cData[s];
                      if (sData?.isAee) gradeAee++;
                      units.forEach(u => {
                        gradePossibleReports++;
                        if (sData?.[u]?.observation && sData[u].observation.trim().length > 30) {
                          gradeDoneReports++;
                        }
                      });
                    });
                  }
                });

                const gradeCompletionRate = gradePossibleReports > 0 
                  ? Math.round((gradeDoneReports / gradePossibleReports) * 100) 
                  : 0;

                return (
                  <div key={g} className="rounded-3xl border border-slate-200/90 bg-white shadow-xs overflow-hidden transition-all">
                    {/* Grade Accordion Button */}
                    <button 
                      onClick={() => setOpenYear(isActive ? null : g)} 
                      className={`w-full flex items-center justify-between p-4 sm:p-5 text-left transition-colors ${
                        isActive ? 'bg-slate-50/70 border-b border-slate-200/80' : 'hover:bg-slate-50/40'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <TreeGrowthIcon grade={g} size="lg" withContainer={true} />
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-base sm:text-lg font-black uppercase text-slate-900 font-serif tracking-tight">
                              {stage.stageTitle}
                            </h3>
                            <span className="text-[9px] font-black px-2 py-0.5 rounded-full uppercase bg-emerald-100/80 text-emerald-800 border border-emerald-200">
                              {stage.phaseLabel}
                            </span>
                          </div>
                          <p className="text-[11px] font-medium text-slate-500 mt-0.5 line-clamp-1">
                            {stage.symbolism}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 shrink-0">
                        {/* Progress Bar Badge */}
                        <div className="hidden md:flex flex-col items-end">
                          <span className="text-[10px] font-bold text-slate-500 uppercase">
                            {gradeStudents} Alunos · {gradeCompletionRate}% Concluído
                          </span>
                          <div className="w-24 h-1.5 bg-slate-200 rounded-full mt-1 overflow-hidden">
                            <div 
                              className="h-full bg-emerald-600 rounded-full transition-all duration-500" 
                              style={{ width: `${gradeCompletionRate}%` }}
                            />
                          </div>
                        </div>

                        <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400">
                          {isActive ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </div>
                      </div>
                    </button>
                    
                    {/* Class Cards Grid */}
                    {isActive && (
                      <div className="p-4 sm:p-6 bg-slate-50/40 animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                          {lettersArr.map(l => {
                            const classKey = `${g}${l}`;
                            const classData = appData[classKey];
                            const activeStudents = classData?.students?.filter(s => classData[s]?.active !== false) || [];
                            const count = activeStudents.length;

                            let classDoneReports = 0;
                            let classTotalReports = count * units.length;
                            activeStudents.forEach(s => {
                              units.forEach(u => {
                                if (classData?.[s]?.[u]?.observation && classData[s][u].observation.trim().length > 30) {
                                  classDoneReports++;
                                }
                              });
                            });

                            const classRate = classTotalReports > 0 
                              ? Math.round((classDoneReports / classTotalReports) * 100) 
                              : 0;

                            const aeeCount = activeStudents.filter(s => classData?.[s]?.isAee).length;

                            return (
                              <div 
                                key={l} 
                                onClick={() => openPinModal(g, l)} 
                                className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 hover:border-emerald-400 hover:shadow-md cursor-pointer transition-all duration-200 group relative flex flex-col justify-between"
                              >
                                <div>
                                  <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                      <TreeGrowthIcon grade={g} size="sm" withContainer={true} />
                                      <div>
                                        <span className="block text-base font-black text-slate-900 uppercase">
                                          Turma {l}
                                        </span>
                                        <span className="text-[9px] font-bold text-slate-400 uppercase">
                                          {g}º Ano
                                        </span>
                                      </div>
                                    </div>
                                    <div className="w-7 h-7 rounded-full bg-slate-100 group-hover:bg-escola-azul group-hover:text-white flex items-center justify-center text-slate-400 transition-colors">
                                      <ArrowRight className="w-3.5 h-3.5" />
                                    </div>
                                  </div>

                                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 mb-2">
                                    <span>{count} {count === 1 ? 'Estudante' : 'Estudantes'}</span>
                                    {aeeCount > 0 && (
                                      <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-purple-100 text-purple-800">
                                        {aeeCount} AEE
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {/* Mini Progress bar */}
                                <div>
                                  <div className="flex items-center justify-between text-[9px] font-bold text-slate-400 mb-1">
                                    <span>Pareceres</span>
                                    <span className="font-mono">{classRate}%</span>
                                  </div>
                                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                    <div 
                                      className="h-full bg-emerald-600 rounded-full transition-all" 
                                      style={{ width: `${classRate}%` }}
                                    />
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </section>
          </div>
        )}
      </main>

      {/* Institutional Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-slate-500 text-[11px] mt-12">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <SchoolLogo size="sm" showText={false} />
            <span className="font-bold text-slate-700">
              Escola Municipal Raymundo Lemos Santana • Ensino Fundamental I
            </span>
          </div>
          <div className="flex items-center gap-2 text-slate-400">
            <span>Semeando conhecimento, colhendo saberes</span>
            <span>•</span>
            <span>Ano Letivo 2026</span>
          </div>
        </div>
      </footer>

      {/* PIN Access Modal */}
      <PinModal 
        isOpen={pinModalOpen}
        targetGrade={pendingSelection.g}
        targetLetter={pendingSelection.l}
        isAdmin={pendingSelection.isAdmin}
        currentPin={currentPin}
        isError={isError}
        onPinChange={handlePinChange}
        onCancel={() => setPinModalOpen(false)}
      />
    </div>
  );
}

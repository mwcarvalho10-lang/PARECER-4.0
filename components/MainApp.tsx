'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Home, 
  Download, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  Menu, 
  Clock, 
  Bell, 
  Book, 
  CheckSquare, 
  Square, 
  Layers, 
  Sparkles, 
  Check, 
  BarChart3, 
  Search, 
  BookOpen, 
  HeartHandshake,
  ChevronLeft,
  ChevronRight,
  Copy,
  Printer,
  ChevronDown,
  HelpCircle,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AppData, Skill, ClassData } from '@/lib/types';
import { units, subjects } from '@/lib/constants';
import { generateReportText } from '@/lib/utils';
import { StudentModal } from './StudentModal';
import { SkillsModal } from './SkillsModal';
import { ClassDiagnosis } from './ClassDiagnosis';
import { SchoolLogo } from './SchoolLogo';
import { PhraseBankModal } from './PhraseBankModal';
import { QuickSkillSearchModal } from './QuickSkillSearchModal';
import { TreeGrowthIcon } from './TreeGrowthIcon';
import { getTreeGrowthStage } from '@/lib/treeGrowth';
import { Document, Packer, Paragraph, HeadingLevel, AlignmentType } from 'docx';
import { saveAs } from 'file-saver';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface MainAppProps {
  currentGrade: string;
  currentLetter: string;
  appData: AppData;
  globalSkills: Skill[];
  onGoBack: () => void;
  onUpdateAppData: (newData: AppData) => void;
  onUpdateGlobalSkills: (newSkills: Skill[]) => void;
}

export function MainApp({ 
  currentGrade, 
  currentLetter, 
  appData, 
  globalSkills, 
  onGoBack, 
  onUpdateAppData, 
  onUpdateGlobalSkills 
}: MainAppProps) {
  const classKey = `${currentGrade}${currentLetter}`;
  const classData: ClassData = React.useMemo(() => appData[classKey] || { students: [] }, [appData, classKey]);
  const treeStage = getTreeGrowthStage(currentGrade);

  const [selectedStudent, setSelectedStudent] = useState<string>(classData.students[0] || "");
  const [selectedUnit, setSelectedUnit] = useState<string>("Diagnóstica");
  const [activeTab, setActiveTab] = useState<string>("portugues");
  const [activeSubFilter, setActiveSubFilter] = useState<string>("all");
  const [searchStudent, setSearchStudent] = useState("");
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'aee'>('active');

  const [studentModalOpen, setStudentModalOpen] = useState(false);
  const [studentToEdit, setStudentToEdit] = useState("");
  const [skillsModalOpen, setSkillsModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isProgressOpen, setIsProgressOpen] = useState(false);

  const [isQuickSearchOpen, setIsQuickSearchOpen] = useState(false);
  const [isPhraseBankOpen, setIsPhraseBankOpen] = useState(false);

  const [isBulkMode, setIsBulkMode] = useState(false);
  const [selectedStudentsBulk, setSelectedStudentsBulk] = useState<string[]>([]);

  const [isReportOpen, setIsReportOpen] = useState(true);
  const [isReadMode, setIsReadMode] = useState(false);
  const [copiedFeedback, setCopiedFeedback] = useState(false);
  const [reportFontSize, setReportFontSize] = useState<'sm' | 'base' | 'lg'>('base');
  const [templates, setTemplates] = useState<{name: string, text: string}[]>([]);

  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setActiveSubFilter("all");
  }, [activeTab, currentGrade]);

  useEffect(() => {
    const t = JSON.parse(localStorage.getItem('edu_templates_v13') || '[]');
    setTemplates(t);
  }, []);

  useEffect(() => {
    if (!classData.students.includes(selectedStudent)) {
      setSelectedStudent(classData.students[0] || "");
    }
  }, [classData.students, selectedStudent]);

  // Global keyboard shortcuts:
  // Ctrl+K for quick skills search
  // Shift+ArrowRight / Shift+ArrowLeft for student navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsQuickSearchOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleAddStudent = (
    name: string, 
    active: boolean, 
    gender: 'M' | 'F' | '', 
    isAee: boolean, 
    aeeType: string, 
    aeeNotes: string
  ) => {
    if (!name) return;
    if (classData.students.includes(name)) {
      alert("ESTUDANTE JÁ CADASTRADO.");
      return;
    }
    const newStudents = [...classData.students, name].sort();
    const newStudentData: any = { active, gender, isAee, aeeType, aeeNotes };
    units.forEach(u => newStudentData[u] = { skills: [], observation: "" });
    
    onUpdateAppData({
      ...appData,
      [classKey]: {
        ...classData,
        students: newStudents,
        [name]: newStudentData
      }
    });
    setStudentModalOpen(false);
    setSelectedStudent(name);
  };

  const handleEditStudent = (
    newName: string, 
    active: boolean, 
    gender: 'M' | 'F' | '',
    isAee: boolean,
    aeeType: string,
    aeeNotes: string
  ) => {
    if (!newName) {
      alert("NOME NÃO PODE SER VAZIO.");
      return;
    }
    if (newName !== studentToEdit && classData.students.includes(newName)) {
      alert("ESTUDANTE JÁ CADASTRADO.");
      return;
    }

    const newStudents = classData.students.map(s => s === studentToEdit ? newName : s).sort();
    const oldStudentData = classData[studentToEdit] || {};
    const newStudentData = {
      ...oldStudentData,
      active,
      gender,
      isAee,
      aeeType,
      aeeNotes
    };

    const newClassData = { ...classData };
    delete newClassData[studentToEdit];
    newClassData.students = newStudents;
    newClassData[newName] = newStudentData;

    onUpdateAppData({
      ...appData,
      [classKey]: newClassData
    });
    setStudentModalOpen(false);
    setSelectedStudent(newName);
  };

  const handleDeleteStudent = (name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`DESEJA REALMENTE EXCLUIR O ESTUDANTE "${name}"?`)) {
      const newStudents = classData.students.filter(s => s !== name);
      const newClassData = { ...classData };
      delete newClassData[name];
      newClassData.students = newStudents;

      onUpdateAppData({
        ...appData,
        [classKey]: newClassData
      });

      if (selectedStudent === name) {
        setSelectedStudent(newStudents[0] || "");
      }
    }
  };

  const toggleSkill = (skillId: string) => {
    if (isBulkMode) {
      if (selectedStudentsBulk.length === 0) {
        alert("Selecione ao menos um estudante para a marcação em lote.");
        return;
      }

      const newClassData = { ...classData };
      selectedStudentsBulk.forEach(studentName => {
        const studentData = newClassData[studentName] || {};
        const unitData = studentData[selectedUnit] || { skills: [], observation: "" };
        const currentSkills = unitData.skills || [];
        
        let newSkills: string[];
        if (currentSkills.includes(skillId)) {
          newSkills = currentSkills.filter((s: string) => s !== skillId);
        } else {
          newSkills = [...currentSkills, skillId];
        }

        newClassData[studentName] = {
          ...studentData,
          [selectedUnit]: {
            ...unitData,
            skills: newSkills
          }
        };
      });

      onUpdateAppData({
        ...appData,
        [classKey]: newClassData
      });
      return;
    }

    if (!selectedStudent) return;
    const studentData = classData[selectedStudent] || {};
    const unitData = studentData[selectedUnit] || { skills: [], observation: "" };
    const currentSkills = unitData.skills || [];
    
    let newSkills: string[];
    if (currentSkills.includes(skillId)) {
      newSkills = currentSkills.filter((s: string) => s !== skillId);
    } else {
      newSkills = [...currentSkills, skillId];
    }

    onUpdateAppData({
      ...appData,
      [classKey]: {
        ...classData,
        [selectedStudent]: {
          ...studentData,
          [selectedUnit]: {
            ...unitData,
            skills: newSkills
          }
        }
      }
    });
  };

  const handleManualEdit = () => {
    if (!selectedStudent || isBulkMode || !reportRef.current) return;
    const newObs = reportRef.current.innerText;
    
    const currentStudentData = classData[selectedStudent] || {};
    const currentUnitData = currentStudentData[selectedUnit] || { skills: [], observation: "" };
    
    onUpdateAppData({
      ...appData,
      [classKey]: {
        ...classData,
        [selectedStudent]: {
          ...currentStudentData,
          [selectedUnit]: {
            ...currentUnitData,
            observation: newObs
          }
        }
      }
    });
  };

  const handleInsertPhrase = (phraseText: string) => {
    if (!reportRef.current) return;
    
    const currentText = reportRef.current.innerText.trim();
    if (currentText.length > 0) {
      reportRef.current.innerText = `${currentText} ${phraseText}`;
    } else {
      reportRef.current.innerText = phraseText;
    }
    
    handleManualEdit();
  };

  const handleGenerateDraftFromSkills = () => {
    if (!selectedStudent || isBulkMode || !reportRef.current) return;
    const studentData = classData[selectedStudent];
    const unitData = studentData?.[selectedUnit];
    const activeSkillsIds = unitData?.skills || [];
    
    if (activeSkillsIds.length === 0) {
      alert("Selecione ao menos uma habilidade BNCC antes de gerar o esboço.");
      return;
    }
    
    const skillTexts = activeSkillsIds.map((id: string) => {
      const found = globalSkills.find(s => s.id === id);
      return found ? found.report : id;
    });

    const generated = generateReportText(
      selectedStudent,
      studentData?.gender,
      selectedUnit,
      skillTexts
    );

    const currentText = reportRef.current.innerText.trim();
    if (currentText.length > 0) {
      if (!confirm("Deseja atualizar o texto do parecer com base nas habilidades assinaladas?")) {
        return;
      }
    }

    reportRef.current.innerText = generated;
    handleManualEdit();
  };

  const handleCopyReport = () => {
    if (reportRef.current) {
      const text = reportRef.current.innerText;
      navigator.clipboard.writeText(text);
      setCopiedFeedback(true);
      setTimeout(() => setCopiedFeedback(false), 2000);
    }
  };

  useEffect(() => {
    if (reportRef.current) {
      if (isBulkMode) {
        reportRef.current.innerText = "";
      } else if (selectedStudent && classData[selectedStudent]) {
        const studentUnitData = classData[selectedStudent][selectedUnit];
        reportRef.current.innerText = studentUnitData?.observation || "";
      } else {
        reportRef.current.innerText = "";
      }
    }
  }, [selectedStudent, selectedUnit, classData, isBulkMode]);

  const filteredStudents = (classData.students || []).filter(s => {
    if (statusFilter === 'active' && classData[s]?.active === false) return false;
    if (statusFilter === 'inactive' && classData[s]?.active !== false) return false;
    if (statusFilter === 'aee' && !classData[s]?.isAee) return false;
    return s.toLowerCase().includes(searchStudent.toLowerCase());
  });

  const handleNextStudent = React.useCallback(() => {
    const idx = filteredStudents.indexOf(selectedStudent);
    if (idx >= 0 && idx < filteredStudents.length - 1) {
      setSelectedStudent(filteredStudents[idx + 1]);
    }
  }, [filteredStudents, selectedStudent]);

  const handlePrevStudent = React.useCallback(() => {
    const idx = filteredStudents.indexOf(selectedStudent);
    if (idx > 0) {
      setSelectedStudent(filteredStudents[idx - 1]);
    }
  }, [filteredStudents, selectedStudent]);

  // Keyboard navigation between students (Shift+Left / Shift+Right)
  useEffect(() => {
    const handleKeyNav = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || (e.target as HTMLElement).isContentEditable) {
        return;
      }
      if (e.shiftKey && e.key === 'ArrowRight') {
        e.preventDefault();
        handleNextStudent();
      } else if (e.shiftKey && e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrevStudent();
      }
    };
    window.addEventListener('keydown', handleKeyNav);
    return () => window.removeEventListener('keydown', handleKeyNav);
  }, [handleNextStudent, handlePrevStudent]);

  const getStatsRaw = () => {
    const activeStudents = classData.students.filter(s => classData[s]?.active !== false);
    if (activeStudents.length === 0) return { done: 0, pending: 0, percent: 0, aee: 0 };
    
    let done = 0;
    let aee = 0;
    activeStudents.forEach(s => {
      if (classData[s]?.isAee) aee++;
      const u = classData[s]?.[selectedUnit];
      if (u?.observation && u.observation.trim().length > 30) {
        done++;
      }
    });

    const pending = activeStudents.length - done;
    const percent = Math.round((done / activeStudents.length) * 100);
    return { done, pending, percent, aee };
  };

  const exportBatchDocx = async () => {
    const activeStudents = classData.students.filter(s => classData[s]?.active !== false);
    if (activeStudents.length === 0) {
      alert("NENHUM ESTUDANTE ATIVO PARA EXPORTAR.");
      return;
    }

    const docChildren: Paragraph[] = [
      new Paragraph({
        text: `ESCOLA MUNICIPAL RAYMUNDO LEMOS SANTANA`,
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER,
      }),
      new Paragraph({
        text: `PARECERES DESCRITIVOS - ${currentGrade}º ANO "${currentLetter}" - ETAPA: ${selectedUnit.toUpperCase()}`,
        heading: HeadingLevel.HEADING_2,
        alignment: AlignmentType.CENTER,
      }),
      new Paragraph({ text: "" }),
    ];

    activeStudents.forEach(s => {
      const sData = classData[s];
      const uData = sData?.[selectedUnit];
      const obs = uData?.observation || "PARECER NÃO PREENCHIDO.";
      const aeeText = sData?.isAee ? ` (AEE / PEI: ${sData?.aeeType || 'Adaptação Curricular'})` : '';

      docChildren.push(
        new Paragraph({
          text: `ESTUDANTE: ${s}${aeeText}`,
          heading: HeadingLevel.HEADING_3,
        }),
        new Paragraph({
          text: obs,
          alignment: AlignmentType.BOTH,
        }),
        new Paragraph({ text: "" })
      );
    });

    const doc = new Document({
      sections: [{
        properties: {},
        children: docChildren,
      }],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `PARECERES_${currentGrade}ANO_${currentLetter}_${selectedUnit}.docx`);
  };

  const exportIndividualDocx = async (mode: 'unit' | 'history') => {
    if (!selectedStudent) return;
    const sData = classData[selectedStudent];
    const aeeText = sData?.isAee ? ` - AEE / PEI: ${sData?.aeeType || 'Adaptação'}` : '';

    const docChildren: Paragraph[] = [
      new Paragraph({
        text: `ESCOLA MUNICIPAL RAYMUNDO LEMOS SANTANA`,
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER,
      }),
      new Paragraph({
        text: `PARECER DESCRITIVO INDIVIDUAL`,
        heading: HeadingLevel.HEADING_2,
        alignment: AlignmentType.CENTER,
      }),
      new Paragraph({
        text: `ESTUDANTE: ${selectedStudent}${aeeText} | TURMA: ${currentGrade}º ANO "${currentLetter}"`,
        alignment: AlignmentType.CENTER,
      }),
      new Paragraph({ text: "" }),
    ];

    if (mode === 'unit') {
      const uData = sData?.[selectedUnit];
      const obs = uData?.observation || "PARECER NÃO PREENCHIDO.";
      docChildren.push(
        new Paragraph({
          text: `ETAPA: ${selectedUnit.toUpperCase()}`,
          heading: HeadingLevel.HEADING_3,
        }),
        new Paragraph({
          text: obs,
          alignment: AlignmentType.BOTH,
        })
      );
    } else {
      units.forEach(u => {
        const uData = sData?.[u];
        const obs = uData?.observation || "PARECER NÃO PREENCHIDO.";
        docChildren.push(
          new Paragraph({
            text: `ETAPA: ${u.toUpperCase()}`,
            heading: HeadingLevel.HEADING_3,
          }),
          new Paragraph({
            text: obs,
            alignment: AlignmentType.BOTH,
          }),
          new Paragraph({ text: "" })
        );
      });
    }

    const doc = new Document({
      sections: [{
        properties: {},
        children: docChildren,
      }],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `PARECER_${selectedStudent}_${mode === 'unit' ? selectedUnit : 'HISTORICO'}.docx`);
  };

  const saveTemplate = () => {
    if (!reportRef.current) return;
    const text = reportRef.current.innerText;
    if (!text.trim()) {
      alert("O parecer está vazio!");
      return;
    }
    const name = prompt("Nome do modelo:");
    if (name) {
      const newTemplates = [...templates, { name: name.toUpperCase(), text }];
      setTemplates(newTemplates);
      localStorage.setItem('edu_templates_v13', JSON.stringify(newTemplates));
      alert("Modelo salvo com sucesso!");
    }
  };

  const loadTemplate = (text: string) => {
    if (reportRef.current && selectedStudent) {
      reportRef.current.innerText = text;
      handleManualEdit();
    }
  };

  const stats = getStatsRaw();

  return (
    <div className="h-full flex flex-col bg-[#f8fafc] text-slate-800">
      {/* Top Institutional App Header */}
      <header className="h-16 bg-white flex items-center justify-between px-4 sm:px-6 shrink-0 border-b border-slate-200 shadow-2xs z-30">
        <div className="flex items-center gap-3">
          <button 
            onClick={onGoBack} 
            className="w-9 h-9 hover:bg-slate-100 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-900 transition-colors" 
            title="Voltar para Turmas"
          >
            <Home className="w-4 h-4" />
          </button>
          
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
            className="w-9 h-9 hover:bg-slate-100 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-900 transition-colors" 
            title="Alternar Lista de Estudantes"
          >
            <Menu className="w-4 h-4" />
          </button>

          {/* School Brand & Tree Growth Stage */}
          <div className="flex items-center gap-3 border-l border-slate-200 pl-3">
            <TreeGrowthIcon grade={currentGrade} size="sm" withContainer={true} />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-black uppercase font-serif tracking-tight text-slate-900 leading-tight">
                  {currentGrade}º ANO &quot;{currentLetter}&quot;
                </h1>
                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-100/90 text-emerald-800 border border-emerald-200 hidden sm:inline-block">
                  {treeStage.shortName}
                </span>
              </div>
              <p className="text-[9px] text-escola-azul font-bold uppercase tracking-wider">
                E. M. Raymundo Lemos Santana
              </p>
            </div>
          </div>
        </div>

        {/* Center Unit Selector */}
        <div className="hidden md:flex bg-slate-100 p-1 rounded-2xl gap-1 border border-slate-200/80">
          {units.map(u => (
            <button 
              key={u} 
              onClick={() => setSelectedUnit(u)} 
              className={`px-3.5 py-1.5 text-[10px] font-black uppercase rounded-xl transition-all ${
                selectedUnit === u 
                  ? 'bg-escola-azul text-white shadow-xs -translate-y-px' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {u}
            </button>
          ))}
        </div>

        {/* Right Tools & Progress */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Skill Search (Ctrl+K) */}
          <button
            onClick={() => setIsQuickSearchOpen(true)}
            className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-200 bg-slate-50 hover:bg-white text-slate-700 hover:text-escola-azul text-[10px] font-bold uppercase transition-colors shadow-2xs"
            title="Atalho: Ctrl + K"
          >
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <span>Buscar Habilidades</span>
            <kbd className="text-[9px] bg-slate-200/80 px-1 py-0.5 rounded font-mono text-slate-600">Ctrl+K</kbd>
          </button>

          {/* Phrase Bank Quick Action */}
          <button 
            onClick={() => setIsPhraseBankOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase transition-colors shadow-2xs"
            title="Banco de Frases Pedagógicas & Conectivos"
          >
            <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden sm:inline">Frases</span>
          </button>

          {/* Class Progress Popover */}
          <div className="relative">
            <button 
              onClick={() => setIsProgressOpen(!isProgressOpen)} 
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-[10px] font-bold uppercase transition-colors shadow-2xs"
              title="Progresso da Turma na Unidade Atual"
            >
              <span className={`w-2 h-2 rounded-full ${stats.percent === 100 ? 'bg-emerald-500' : stats.percent > 0 ? 'bg-amber-500' : 'bg-slate-300'}`} />
              <span className="font-mono">{stats.percent}%</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {isProgressOpen && (
              <div className="absolute top-11 right-0 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 p-4 z-50 animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    Colheita ({selectedUnit})
                  </h3>
                  <span className="text-[9px] font-mono font-bold text-slate-400">
                    {stats.done} / {stats.done + stats.pending}
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 relative shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Feito', value: stats.done },
                            { name: 'Pendente', value: stats.pending }
                          ]}
                          innerRadius="75%"
                          outerRadius="100%"
                          paddingAngle={0}
                          dataKey="value"
                          startAngle={90}
                          endAngle={-270}
                          stroke="none"
                        >
                          <Cell key="cell-0" fill="#16a34a" />
                          <Cell key="cell-1" fill="#e2e8f0" />
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-[11px] font-black text-slate-800 font-mono">{stats.percent}%</span>
                    </div>
                  </div>

                  <div className="flex flex-col flex-1 text-[10px] space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-bold uppercase">Pareceres Prontos</span>
                      <span className="font-black text-emerald-700 font-mono">{stats.done}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-bold uppercase">Pendentes</span>
                      <span className="font-black text-slate-400 font-mono">{stats.pending}</span>
                    </div>
                    {stats.aee > 0 && (
                      <div className="flex justify-between items-center pt-1 border-t border-slate-100">
                        <span className="text-purple-700 font-bold uppercase">Estudantes AEE</span>
                        <span className="font-black text-purple-700 font-mono">{stats.aee}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Export Batch DOCX */}
          <button 
            onClick={exportBatchDocx} 
            className="bg-escola-azul hover:bg-blue-700 text-white px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full text-[10px] font-black uppercase shadow-xs flex items-center gap-1.5 transition-transform hover:scale-105 active:scale-95"
            title="Baixar todos os pareceres da unidade em formato DOCX"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Exportar Turma</span>
          </button>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <div className="flex flex-1 overflow-hidden p-3 sm:p-4 gap-3 sm:gap-4">
        {/* Left Sidebar: Student List */}
        <aside 
          className={`bg-white rounded-3xl border border-slate-200/90 flex flex-col shrink-0 transition-all duration-300 shadow-xs ${
            isSidebarOpen ? 'w-72 sm:w-80' : 'w-0 overflow-hidden border-none opacity-0'
          }`}
        >
          <div className="w-72 sm:w-80 flex flex-col h-full">
            <div className="p-4 pb-2 border-b border-slate-100">
              <div className="flex justify-between items-center mb-2.5">
                <div className="flex items-center gap-2">
                  <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    Estudantes ({filteredStudents.length})
                  </h2>
                </div>
                <button 
                  onClick={() => setIsBulkMode(!isBulkMode)}
                  className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase transition-colors flex items-center gap-1 ${
                    isBulkMode ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                  title="Modo de Marcação em Lote"
                >
                  {isBulkMode ? <CheckSquare className="w-3 h-3 text-amber-600" /> : <Layers className="w-3 h-3" />}
                  <span>{isBulkMode ? 'Sair do Lote' : 'Lote'}</span>
                </button>
              </div>

              {/* Search Bar */}
              <div className="relative mb-2.5">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  value={searchStudent}
                  onChange={e => setSearchStudent(e.target.value)}
                  placeholder="Buscar estudante..." 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-2 text-xs font-bold uppercase outline-none focus:border-escola-azul transition-colors placeholder:text-slate-400"
                />
              </div>

              {/* Segmented Status Filters */}
              <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
                <button 
                  onClick={() => setStatusFilter('active')}
                  className={`flex-1 py-1 text-[9px] font-black uppercase rounded-lg transition-all ${
                    statusFilter === 'active' ? 'bg-white text-slate-800 shadow-2xs' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  Ativos
                </button>
                <button 
                  onClick={() => setStatusFilter('aee')}
                  className={`flex-1 py-1 text-[9px] font-black uppercase rounded-lg transition-all ${
                    statusFilter === 'aee' ? 'bg-purple-600 text-white shadow-2xs' : 'text-purple-600 hover:bg-purple-50'
                  }`}
                >
                  AEE
                </button>
                <button 
                  onClick={() => setStatusFilter('inactive')}
                  className={`flex-1 py-1 text-[9px] font-black uppercase rounded-lg transition-all ${
                    statusFilter === 'inactive' ? 'bg-white text-slate-800 shadow-2xs' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  Inat.
                </button>
                <button 
                  onClick={() => setStatusFilter('all')}
                  className={`flex-1 py-1 text-[9px] font-black uppercase rounded-lg transition-all ${
                    statusFilter === 'all' ? 'bg-white text-slate-800 shadow-2xs' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  Todos
                </button>
              </div>

              {/* Bulk mode actions */}
              {isBulkMode && (
                <div className="mt-2 p-2 bg-amber-50 rounded-xl border border-amber-200 flex items-center justify-between text-[9px] font-bold text-amber-900">
                  <span>{selectedStudentsBulk.length} selecionados</span>
                  <div className="flex gap-1">
                    <button 
                      onClick={() => setSelectedStudentsBulk(filteredStudents)}
                      className="px-1.5 py-0.5 rounded bg-white border border-amber-300 text-amber-800 hover:bg-amber-100 uppercase"
                    >
                      Todos
                    </button>
                    <button 
                      onClick={() => setSelectedStudentsBulk([])}
                      className="px-1.5 py-0.5 rounded bg-white border border-amber-300 text-amber-800 hover:bg-amber-100 uppercase"
                    >
                      Limpar
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Students List Scrollable */}
            <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
              {filteredStudents.length === 0 ? (
                <p className="text-center py-8 text-xs text-slate-400 font-semibold italic">
                  Nenhum estudante encontrado.
                </p>
              ) : (
                filteredStudents.map(s => {
                  const numSkills = classData[s]?.[selectedUnit]?.skills?.length || 0;
                  const obsLength = classData[s]?.[selectedUnit]?.observation?.trim()?.length || 0;
                  
                  let isDone = false;
                  let isProgress = false;
                  if (obsLength > 30) {
                    isDone = true;
                  } else if (numSkills > 0 || obsLength > 0) {
                    isProgress = true;
                  }
                  
                  const isActive = classData[s]?.active !== false;
                  const isAee = Boolean(classData[s]?.isAee);
                  const isSelectedInBulk = selectedStudentsBulk.includes(s);
                  const isCurrent = selectedStudent === s;

                  return (
                    <div key={s} className="group relative flex items-center">
                      <button 
                        onClick={() => {
                          if (isBulkMode) {
                            setSelectedStudentsBulk(prev => 
                              prev.includes(s) ? prev.filter(st => st !== s) : [...prev, s]
                            );
                          } else {
                            setSelectedStudent(s);
                          }
                        }} 
                        className={`flex-1 flex items-center gap-2 text-left px-3 py-2 rounded-xl text-[11px] font-bold transition-all ${
                          isBulkMode 
                            ? (isSelectedInBulk ? 'bg-amber-50 text-amber-800 border border-amber-200' : 'text-slate-600 hover:bg-slate-50 border border-transparent')
                            : (isCurrent ? 'bg-escola-azul text-white shadow-xs' : 'text-slate-600 hover:bg-slate-50 border border-transparent')
                        }`}
                      >
                        {isBulkMode ? (
                          isSelectedInBulk ? (
                            <CheckSquare className="w-4 h-4 shrink-0 text-amber-600" />
                          ) : (
                            <Square className="w-4 h-4 shrink-0 text-slate-300" />
                          )
                        ) : (
                          isDone ? (
                            <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 ${isCurrent ? 'text-white' : 'text-emerald-600'}`} />
                          ) : isProgress ? (
                            <Clock className={`w-3.5 h-3.5 shrink-0 ${isCurrent ? 'text-white/80' : 'text-amber-500'}`} />
                          ) : (
                            <div className={`w-3.5 h-3.5 shrink-0 rounded-full border-2 ${isCurrent ? 'border-white/40' : 'border-slate-300'}`} />
                          )
                        )}

                        <span className={`truncate uppercase block flex-1 ${!isActive ? 'line-through opacity-50' : ''}`}>
                          {s}
                        </span>

                        {isAee && (
                          <span className={`shrink-0 px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                            isCurrent ? 'bg-white/20 text-white' : 'bg-purple-100 text-purple-800 border border-purple-200'
                          }`}>
                            AEE
                          </span>
                        )}
                      </button>

                      {/* Edit / Delete triggers on hover */}
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 hidden group-hover:flex gap-1 z-20">
                        <button 
                          onClick={(e) => { e.stopPropagation(); setStudentToEdit(s); setStudentModalOpen(true); }} 
                          className="w-6 h-6 bg-white/95 rounded-md flex items-center justify-center text-slate-500 hover:text-escola-azul shadow-2xs border border-slate-200 hover:border-slate-300 transition-colors"
                          title="Editar cadastro do estudante"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                        <button 
                          onClick={(e) => handleDeleteStudent(s, e)} 
                          className="w-6 h-6 bg-white/95 rounded-md flex items-center justify-center text-slate-500 hover:text-rose-600 shadow-2xs border border-slate-200 hover:border-rose-200 hover:bg-rose-50 transition-colors"
                          title="Excluir estudante"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Bottom Add Student Button */}
            <div className="p-3 border-t border-slate-100">
              <button 
                onClick={() => { setStudentToEdit(""); setStudentModalOpen(true); }} 
                className="w-full py-2.5 rounded-xl border border-dashed border-slate-300 text-slate-600 text-[10px] font-black uppercase hover:text-escola-azul hover:border-escola-azul hover:bg-blue-50/50 transition-colors flex items-center justify-center gap-1.5"
              >
                <span>+ Cadastrar Estudante</span>
              </button>
            </div>
          </div>
        </aside>

        {/* Central Workspace */}
        <main className="flex-1 flex flex-col overflow-hidden bg-white rounded-3xl border border-slate-200 shadow-xs">
          {/* Main Navigation Tabs */}
          <nav className="h-14 bg-white border-b border-slate-100 flex items-center px-4 sm:px-6 gap-6 shrink-0 overflow-x-auto">
            {subjects.map(sub => (
              <button 
                key={sub.id} 
                onClick={() => setActiveTab(sub.id)} 
                className={`relative py-4 text-[11px] font-black uppercase whitespace-nowrap transition-all ${
                  activeTab === sub.id ? 'text-escola-azul' : 'text-slate-400 hover:text-slate-700'
                }`}
              >
                {sub.label}
                {activeTab === sub.id && (
                  <div className="absolute bottom-[-1px] left-0 w-full h-[3px] bg-emerald-600 rounded-t-full" />
                )}
              </button>
            ))}

            <button 
              onClick={() => setActiveTab('diagnostico')}
              className={`relative py-4 text-[11px] font-black uppercase whitespace-nowrap transition-all flex items-center gap-1.5 ${
                activeTab === 'diagnostico' ? 'text-escola-azul' : 'text-slate-400 hover:text-slate-700'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Diagnóstico da Turma</span>
              {activeTab === 'diagnostico' && (
                <div className="absolute bottom-[-1px] left-0 w-full h-[3px] bg-emerald-600 rounded-t-full" />
              )}
            </button>
          </nav>

          {/* Conditional View: Class Diagnosis OR Skills Evaluation */}
          {activeTab === 'diagnostico' ? (
            <div className="flex-1 overflow-y-auto">
              <ClassDiagnosis 
                currentGrade={currentGrade}
                currentLetter={currentLetter}
                classData={classData}
                globalSkills={globalSkills}
                selectedUnit={selectedUnit}
                onSelectUnit={(u) => setSelectedUnit(u)}
                onSelectStudent={(sName) => {
                  setSelectedStudent(sName);
                  setActiveTab('portugues');
                }}
              />
            </div>
          ) : (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Student Context & Quick Navigation Ribbon */}
              <div className="bg-slate-50/80 border-b border-slate-200/80 px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4 shrink-0">
                <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                  <TreeGrowthIcon grade={currentGrade} size="xs" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase hidden sm:inline">
                    Estudante:
                  </span>
                  <span className="text-xs font-black text-slate-900 uppercase tracking-tight">
                    {selectedStudent || "Selecione um estudante na lista"}
                  </span>

                  {classData[selectedStudent]?.isAee && (
                    <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase bg-purple-100 text-purple-800 border border-purple-200">
                      AEE · {classData[selectedStudent]?.aeeType || 'Adaptação'}
                    </span>
                  )}
                </div>

                {/* Fast Next/Previous Student Buttons */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={handlePrevStudent}
                    disabled={filteredStudents.indexOf(selectedStudent) <= 0}
                    className="px-2.5 py-1 text-[10px] font-bold uppercase rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none transition-colors flex items-center gap-1 shadow-2xs"
                    title="Estudante anterior (Shift + ←)"
                  >
                    <ChevronLeft className="w-3 h-3" />
                    <span className="hidden sm:inline">Anterior</span>
                  </button>

                  <span className="text-[10px] font-mono font-bold text-slate-500 px-1">
                    {filteredStudents.indexOf(selectedStudent) >= 0 ? filteredStudents.indexOf(selectedStudent) + 1 : 0} / {filteredStudents.length}
                  </span>

                  <button
                    onClick={handleNextStudent}
                    disabled={filteredStudents.indexOf(selectedStudent) >= filteredStudents.length - 1}
                    className="px-2.5 py-1 text-[10px] font-bold uppercase rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none transition-colors flex items-center gap-1 shadow-2xs"
                    title="Próximo estudante (Shift + →)"
                  >
                    <span className="hidden sm:inline">Próximo</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Sub-Filters / Categories Ribbon */}
              {(() => {
                const subSkills = globalSkills.filter(s => s.grade === currentGrade && s.subject === activeTab);
                const categories = Array.from(new Set(subSkills.map(s => s.category).filter(Boolean))) as string[];
                
                return (
                  <div className="px-4 sm:px-6 py-2.5 border-b border-slate-100 flex items-center justify-between gap-3 overflow-x-auto shrink-0 bg-white">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        onClick={() => setActiveSubFilter('all')}
                        className={`px-3 py-1 rounded-full text-[10px] font-black uppercase transition-all ${
                          activeSubFilter === 'all' 
                            ? 'bg-slate-900 text-white shadow-2xs' 
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        Todas ({subSkills.length})
                      </button>
                      {categories.map(cat => {
                        const count = subSkills.filter(s => s.category === cat).length;
                        return (
                          <button
                            key={cat}
                            onClick={() => setActiveSubFilter(cat)}
                            className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase transition-all ${
                              activeSubFilter === cat 
                                ? 'bg-escola-azul text-white shadow-2xs' 
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            {cat} ({count})
                          </button>
                        );
                      })}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => setSkillsModalOpen(true)}
                        className="text-[10px] font-bold text-slate-500 hover:text-escola-azul uppercase underline decoration-dotted"
                      >
                        Gerenciar Matriz
                      </button>
                    </div>
                  </div>
                );
              })()}

              {/* Skills Cards Grid */}
              <section className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/40">
                {(() => {
                  const filteredSkills = globalSkills.filter(s => {
                    const matchGrade = s.grade === currentGrade;
                    const matchSubject = s.subject === activeTab;
                    const matchCategory = activeSubFilter === 'all' || s.category === activeSubFilter;
                    return matchGrade && matchSubject && matchCategory;
                  });

                  if (filteredSkills.length === 0) {
                    return (
                      <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-200 p-8">
                        <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                        <h3 className="text-xs font-black uppercase text-slate-600 mb-1">
                          Nenhuma habilidade cadastrada para este filtro
                        </h3>
                        <p className="text-[11px] text-slate-400 mb-4">
                          Você pode adicionar novas habilidades à matriz pedagógica a qualquer momento.
                        </p>
                        <button
                          onClick={() => setSkillsModalOpen(true)}
                          className="px-4 py-2 rounded-xl bg-escola-azul text-white font-bold text-xs uppercase"
                        >
                          + Adicionar Habilidade
                        </button>
                      </div>
                    );
                  }

                  return (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      <AnimatePresence>
                        {filteredSkills.map(s => {
                          const currentStudentData = classData[selectedStudent] || {};
                          const unitData = currentStudentData[selectedUnit] || { skills: [] };
                          const isSet = (unitData.skills || []).includes(s.id);

                          // Check if skill was consolidated in a previous unit
                          let usedInOtherUnit: string | null = null;
                          units.forEach(u => {
                            if (u !== selectedUnit && (currentStudentData[u]?.skills || []).includes(s.id)) {
                              usedInOtherUnit = u;
                            }
                          });

                          return (
                            <motion.div
                              key={s.id}
                              layout
                              onClick={() => toggleSkill(s.id)}
                              className={`p-4 rounded-2xl cursor-pointer transition-all duration-150 flex flex-col justify-between gap-3 border select-none group relative ${
                                isSet 
                                  ? 'bg-emerald-50/90 border-emerald-400 ring-2 ring-emerald-300/40 shadow-xs' 
                                  : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-2xs'
                              }`}
                            >
                              <div>
                                <div className="flex items-center justify-between gap-2 mb-2">
                                  <div className="flex items-center gap-2">
                                    <span 
                                      className="w-2.5 h-2.5 rounded-full shrink-0" 
                                      style={{ backgroundColor: s.color || '#0ea5e9' }} 
                                    />
                                    <span className={`text-[11px] font-black uppercase tracking-wider font-mono ${isSet ? 'text-emerald-800' : 'text-slate-800'}`}>
                                      {s.id}
                                    </span>
                                    {usedInOtherUnit && (
                                      <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                                        {usedInOtherUnit}
                                      </span>
                                    )}
                                  </div>

                                  <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors ${
                                    isSet ? 'bg-emerald-600 text-white' : 'border-2 border-slate-300 group-hover:border-slate-400'
                                  }`}>
                                    {isSet && <Check className="w-3 h-3 stroke-[3]" />}
                                  </div>
                                </div>

                                <p className={`text-[11px] leading-relaxed transition-colors ${
                                  isSet ? 'text-slate-900 font-semibold' : 'text-slate-600'
                                }`}>
                                  {s.report}
                                </p>
                              </div>

                              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
                                <span className="text-slate-400 font-semibold truncate max-w-[150px]">
                                  {s.category || `${s.grade}º Ano · BNCC`}
                                </span>
                                <span className={`font-black ${isSet ? 'text-emerald-700' : 'text-slate-400 group-hover:text-slate-600'}`}>
                                  {isSet ? '✓ Consolidada' : '+ Marcar'}
                                </span>
                              </div>
                            </motion.div>
                          );
                        })}
                      </AnimatePresence>
                    </div>
                  );
                })()}
              </section>
            </div>
          )}
        </main>

        {/* Floating Descriptive Report Panel */}
        <div 
          className={`fixed bottom-6 right-6 w-[480px] max-w-[calc(100vw-3rem)] bg-white rounded-3xl shadow-2xl border border-slate-200 z-50 flex flex-col transition-all duration-300 ${
            isReportOpen && activeTab !== 'diagnostico' 
              ? 'translate-y-0 opacity-100' 
              : 'translate-y-12 opacity-0 pointer-events-none'
          }`}
        >
          {/* Drawer Header */}
          <div 
            className="bg-slate-900 p-4 flex justify-between items-center text-white rounded-t-3xl cursor-pointer"
            onClick={() => setIsReportOpen(false)}
          >
            <div className="flex items-center gap-2">
              <TreeGrowthIcon grade={currentGrade} size="xs" />
              <div>
                <span className="text-xs font-black uppercase tracking-wider block">
                  {selectedStudent || "--"}
                </span>
                <span className="text-[9px] text-slate-400 uppercase font-mono block">
                  {selectedUnit} · Parecer Descritivo
                </span>
              </div>
            </div>

            <div className="flex gap-1.5 items-center">
              {/* Phrase bank button */}
              <button 
                onClick={(e) => { e.stopPropagation(); setIsPhraseBankOpen(true); }} 
                className="text-[9px] bg-emerald-600 px-2 py-1 rounded-lg hover:bg-emerald-500 text-white font-black uppercase flex items-center gap-1 transition-colors shadow-2xs" 
                title="Abrir Banco de Frases Pedagógicas"
              >
                <BookOpen className="w-3 h-3" /> Frases
              </button>

              {/* Generate Draft from Skills */}
              <button
                onClick={(e) => { e.stopPropagation(); handleGenerateDraftFromSkills(); }}
                className="text-[9px] bg-escola-azul px-2 py-1 rounded-lg hover:bg-blue-600 text-white font-black uppercase flex items-center gap-1 transition-colors shadow-2xs"
                title="Sintetizar parecer a partir das habilidades assinaladas"
              >
                <Sparkles className="w-3 h-3" /> Esboço
              </button>

              {/* Copy Report */}
              <button
                onClick={(e) => { e.stopPropagation(); handleCopyReport(); }}
                className={`text-[9px] px-2 py-1 rounded-lg font-black uppercase flex items-center gap-1 transition-colors ${
                  copiedFeedback ? 'bg-emerald-500 text-white' : 'bg-slate-800 hover:bg-slate-700 text-white'
                }`}
                title="Copiar texto do parecer"
              >
                {copiedFeedback ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                <span>{copiedFeedback ? 'Copiado!' : 'Copiar'}</span>
              </button>

              {/* Individual DOCX download */}
              <button 
                onClick={(e) => { e.stopPropagation(); exportIndividualDocx('unit'); }} 
                className="text-[9px] bg-slate-800 px-2 py-1 rounded-lg hover:bg-slate-700 text-white font-black uppercase flex items-center gap-1 transition-colors"
                title="Baixar parecer do aluno em DOCX"
              >
                <Download className="w-3 h-3" /> DOCX
              </button>
            </div>
          </div>

          {/* Drawer Body Editor */}
          <div className="p-4 flex flex-col bg-slate-50 rounded-b-3xl">
            {/* AEE Special Adaptation Warning if active */}
            {classData[selectedStudent]?.isAee && (
              <div className="mb-3 p-2.5 bg-purple-50 border border-purple-200 rounded-xl text-[10px] text-purple-950 flex items-start gap-2 shadow-2xs">
                <HeartHandshake className="w-4 h-4 text-purple-700 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-black uppercase tracking-wider text-[9px] text-purple-900">
                      Estudante AEE / PEI
                    </span>
                    <span className="text-[9px] font-bold bg-purple-200/80 text-purple-900 px-2 py-0.5 rounded-md">
                      {classData[selectedStudent]?.aeeType || 'Adaptação Curricular'}
                    </span>
                  </div>
                  {classData[selectedStudent]?.aeeNotes && (
                    <p className="text-[10px] text-purple-900 mt-1 leading-relaxed italic">
                      {classData[selectedStudent]?.aeeNotes}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Previous Unit History Context */}
            {(() => {
              const unitIndex = units.indexOf(selectedUnit);
              if (unitIndex > 0 && selectedStudent && classData[selectedStudent]) {
                const prevUnit = units[unitIndex - 1];
                const prevUnitText = classData[selectedStudent][prevUnit]?.observation;
                if (prevUnitText) {
                  return (
                    <div className="mb-3 p-2.5 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
                      <p className="text-[9px] font-black text-slate-400 mb-1 uppercase tracking-widest">
                        Histórico ({prevUnit})
                      </p>
                      <p className="text-[10px] text-slate-600 uppercase italic line-clamp-2 hover:line-clamp-none transition-all cursor-pointer leading-relaxed">
                        {prevUnitText}
                      </p>
                    </div>
                  );
                }
              }
              return null;
            })()}

            {/* Editable Content Area */}
            <div 
              ref={reportRef}
              spellCheck={true}
              contentEditable={!isBulkMode && !!selectedStudent} 
              onInput={handleManualEdit}
              onBlur={handleManualEdit}
              className={`leading-relaxed text-[12px] outline-none p-4 rounded-2xl uppercase text-justify min-h-[160px] max-h-[260px] overflow-y-auto transition-all shadow-2xs border bg-white border-slate-200 focus:border-escola-azul text-slate-900 font-medium`}
            />

            {/* Bottom Editor Metadata / Status */}
            <div className="mt-2.5 flex items-center justify-between text-[10px] font-bold text-slate-400 px-1">
              <span className="flex items-center gap-1 text-emerald-700">
                <Check className="w-3 h-3 text-emerald-600" /> Salvo no caderno
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={saveTemplate}
                  className="hover:text-slate-700 uppercase"
                  title="Salvar como modelo reutilizável"
                >
                  Salvar Modelo
                </button>
                {templates.length > 0 && (
                  <select 
                    onChange={(e) => { if(e.target.value) loadTemplate(e.target.value); e.target.value = ''; }} 
                    className="text-[9px] bg-slate-200 text-slate-700 rounded px-1.5 py-0.5 outline-none uppercase font-bold"
                  >
                    <option value="">Modelos</option>
                    {templates.map(t => <option key={t.name} value={t.text}>{t.name}</option>)}
                  </select>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Toggle Button if drawer is closed */}
        {!isReportOpen && activeTab !== 'diagnostico' && (
          <button 
            onClick={() => setIsReportOpen(true)}
            className="fixed bottom-6 right-6 bg-slate-900 hover:bg-slate-800 text-white px-5 py-3 rounded-full shadow-2xl font-black uppercase text-xs flex items-center gap-2.5 transition-transform hover:scale-105 z-40 animate-in fade-in slide-in-from-bottom-3"
          >
            <TreeGrowthIcon grade={currentGrade} size="xs" />
            <span>Ver Parecer Descritivo</span>
          </button>
        )}
      </div>

      {/* Modals */}
      <StudentModal 
        isOpen={studentModalOpen} 
        initialName={studentToEdit} 
        initialActive={studentToEdit ? classData[studentToEdit]?.active !== false : true}
        initialGender={studentToEdit ? classData[studentToEdit]?.gender : ''}
        initialIsAee={studentToEdit ? Boolean(classData[studentToEdit]?.isAee) : false}
        initialAeeType={studentToEdit ? classData[studentToEdit]?.aeeType || '' : ''}
        initialAeeNotes={studentToEdit ? classData[studentToEdit]?.aeeNotes || '' : ''}
        onClose={() => setStudentModalOpen(false)} 
        onConfirm={studentToEdit ? handleEditStudent : handleAddStudent} 
      />
      
      <SkillsModal 
        isOpen={skillsModalOpen} 
        onClose={() => setSkillsModalOpen(false)} 
        globalSkills={globalSkills}
        onSaveSkill={(skill) => onUpdateGlobalSkills([...globalSkills, skill])}
        onDeleteSkill={(idx) => {
          const newSkills = [...globalSkills];
          newSkills.splice(idx, 1);
          onUpdateGlobalSkills(newSkills);
        }}
      />

      <PhraseBankModal
        isOpen={isPhraseBankOpen}
        onClose={() => setIsPhraseBankOpen(false)}
        studentName={selectedStudent}
        onInsertPhrase={handleInsertPhrase}
      />

      <QuickSkillSearchModal
        isOpen={isQuickSearchOpen}
        onClose={() => setIsQuickSearchOpen(false)}
        globalSkills={globalSkills}
        currentGrade={currentGrade}
        selectedStudent={selectedStudent}
        selectedUnit={selectedUnit}
        currentStudentData={classData[selectedStudent]?.[selectedUnit]}
        onToggleSkill={toggleSkill}
      />
    </div>
  );
}

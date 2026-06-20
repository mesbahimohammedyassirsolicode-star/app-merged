import { useEffect, useMemo, useState, useRef } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  gradesApi,
  type TrainerGradeEntryFiliere,
  type TrainerGradeEntryGroup,
  type TrainerGradeEntryModule,
  type TrainerGradeEntryStudent,
} from '../api/api/grades';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { toast } from 'sonner';
import { getApiErrorMessage } from '../lib/api-error';
import { 
  Save, 
  Loader2, 
  GraduationCap, 
  Users, 
  BookOpen, 
  AlertCircle, 
  CheckCircle2, 
  XCircle,
  AlertOctagon,
  ChevronDown,
  Search,
  BookOpenCheck,
  Calendar,
  RotateCcw,
  Sparkles,
  Download,
  Upload,
  ChevronLeft,
  ChevronRight,
  Award,
  Lock,
  LockOpen,
  ArrowRight
} from 'lucide-react';
import CustomSelect from '../components/ui/select';
import Modal from '../components/ui/modal';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';

type RowSaveStatus = 'idle' | 'saved' | 'error';

function extractEntryValidationErrors(error: unknown): Record<number, string> {
  const bag = (error as { response?: { data?: { errors?: Record<string, string[]> } } })?.response?.data?.errors;
  if (!bag || typeof bag !== 'object') return {};

  const mapped: Record<number, string> = {};
  Object.entries(bag).forEach(([key, messages]) => {
    const match = key.match(/^entries\.(\d+)\./);
    if (!match) return;
    const index = Number(match[1]);
    if (Number.isNaN(index)) return;
    mapped[index] = messages?.[0] ?? 'Validation error';
  });

  return mapped;
}

function getStudentInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getStudentGradient(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const gradients = [
    'from-blue-500/20 to-indigo-500/20 text-blue-300 border-blue-500/30',
    'from-purple-500/20 to-pink-500/20 text-purple-300 border-purple-500/30',
    'from-emerald-500/20 to-teal-500/20 text-emerald-300 border-emerald-500/30',
    'from-amber-500/20 to-orange-500/20 text-amber-300 border-amber-500/30',
    'from-rose-500/20 to-red-500/20 text-rose-300 border-rose-500/30',
    'from-cyan-500/20 to-blue-600/20 text-cyan-300 border-cyan-500/30',
    'from-violet-500/20 to-purple-600/20 text-violet-300 border-violet-500/30',
  ];
  const index = Math.abs(hash) % gradients.length;
  return gradients[index];
}

export default function GradeEntryPage() {
  const [data, setData] = useState<TrainerGradeEntryFiliere[]>([]);
  const [selectedFiliere, setFiliere] = useState<number | null>(null);
  const [selectedGroup, setGroup] = useState<number | null>(null);
  const [selectedModule, setModule] = useState<number | null>(null);
  const [grades, setGrades] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [rowStatuses, setRowStatuses] = useState<Record<number, RowSaveStatus>>({});
  const [rowErrors, setRowErrors] = useState<Record<number, string>>({});
  const [focusedRow, setFocusedRow] = useState<number | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSemester, setSemester] = useState('S1');
  const [selectedSession, setSession] = useState('Normal');
  const [isAutoSave, setIsAutoSave] = useState(false);
  const [isPublished, setIsPublished] = useState(false);
  const [isPublishOpen, setIsPublishOpen] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  
  const [isUnsavedModalOpen, setIsUnsavedModalOpen] = useState(false);
  const [pendingSelection, setPendingSelection] = useState<{
    type: 'filiere' | 'group' | 'module' | 'reset';
    value: number | null;
  } | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadQuery = useQuery({
    queryKey: ['trainer-grade-entry-data'],
    queryFn: () => gradesApi.trainerGradeEntryData(),
  });

  useEffect(() => {
    if (loadQuery.data) {
      setData(loadQuery.data);
      setLoading(false);
    }
  }, [loadQuery.data]);

  useEffect(() => {
    if (loadQuery.isError) {
      setLoading(false);
    }
  }, [loadQuery.isError]);

  const selectedFiliereData = useMemo(
    () => data.find((item) => item.filiere_id === selectedFiliere) ?? null,
    [data, selectedFiliere],
  );

  const groups = useMemo<TrainerGradeEntryGroup[]>(
    () => selectedFiliereData?.groups ?? [],
    [selectedFiliereData],
  );

  const selectedGroupData = useMemo(
    () => groups.find((item) => item.group_id === selectedGroup) ?? null,
    [groups, selectedGroup],
  );

  const modules = useMemo<TrainerGradeEntryModule[]>(
    () => selectedGroupData?.modules ?? [],
    [selectedGroupData],
  );

  const selectedModuleData = useMemo(
    () => modules.find((item) => item.module_id === selectedModule) ?? null,
    [modules, selectedModule],
  );

  const students = useMemo(
    () => selectedModuleData?.students ?? [],
    [selectedModuleData],
  );

  useEffect(() => {
    if (!selectedModuleData) {
      setGrades({});
      setRowStatuses({});
      setRowErrors({});
      setIsPublished(false);
      return;
    }

    const initial: Record<number, string> = {};
    selectedModuleData.students.forEach((student) => {
      initial[student.id] = student.existing_grade !== null ? String(student.existing_grade) : '';
    });

    setGrades(initial);
    setRowStatuses({});
    setRowErrors({});
    setIsPublished(false);
  }, [selectedModuleData]);

  const filteredStudents = useMemo(() => {
    if (!students) return [];
    return students.filter(student => 
      student.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [students, searchQuery]);

  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage) || 1;
  const paginatedStudents = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredStudents.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredStudents, currentPage, itemsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedModule, searchQuery, itemsPerPage]);

  const invalidStudentIds = useMemo(() => {
    const invalid: number[] = [];
    students.forEach((student) => {
      const raw = (grades[student.id] ?? '').trim();
      if (raw === '') return;
      const parsed = Number(raw);
      if (Number.isNaN(parsed) || parsed < 0 || parsed > 20) {
        invalid.push(student.id);
      }
    });
    return invalid;
  }, [students, grades]);

  const modifiedEntries = useMemo(() => {
    if (!selectedModule) return [];

    return students
      .filter((student) => {
        const current = (grades[student.id] ?? '').trim();
        const initial = student.existing_grade !== null ? String(student.existing_grade) : '';
        return current !== initial;
      })
      .map((student) => ({
        module_id: selectedModule,
        student_id: student.id,
        grade: Number((grades[student.id] ?? '').trim()),
      }));
  }, [students, grades, selectedModule]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      setSaving(true);
      return gradesApi.saveTrainerGrades(modifiedEntries);
    },
    onSuccess: (savedRows) => {
      const nextStatuses: Record<number, RowSaveStatus> = {};
      savedRows.forEach((entry) => {
        nextStatuses[entry.student_id] = 'saved';
      });
      setRowStatuses((prev) => ({ ...prev, ...nextStatuses }));
      setRowErrors({});
      
      setData((prevData) => {
        return prevData.map((filiere) => ({
          ...filiere,
          groups: filiere.groups.map((group) => ({
            ...group,
            modules: group.modules.map((mod) => {
              if (mod.module_id === selectedModule) {
                return {
                  ...mod,
                  students: mod.students.map((stud) => {
                    const savedEntry = savedRows.find(s => s.student_id === stud.id);
                    if (savedEntry) {
                      return {
                        ...stud,
                        existing_grade: savedEntry.grade
                      };
                    }
                    return stud;
                  })
                };
              }
              return mod;
            })
          }))
        }));
      });

      toast.success('Grades saved successfully.');
    },
    onError: (error: unknown) => {
      const message = getApiErrorMessage(error, 'Unable to save grades.');
      const entryValidationErrors = extractEntryValidationErrors(error);

      setRowStatuses((prev) => {
        const next = { ...prev };
        modifiedEntries.forEach((entry, index) => {
          next[entry.student_id] = 'error';
          if (entryValidationErrors[index]) {
            next[entry.student_id] = 'error';
          }
        });
        return next;
      });
      setRowErrors((prev) => {
        const next = { ...prev };
        modifiedEntries.forEach((entry, index) => {
          next[entry.student_id] = entryValidationErrors[index] ?? message;
        });
        return next;
      });
      toast.error(message);
    },
    onSettled: () => {
      setSaving(false);
    },
  });

  useEffect(() => {
    if (!isAutoSave || modifiedEntries.length === 0 || invalidStudentIds.length > 0 || saving || isPublished) {
      return;
    }

    const timer = setTimeout(() => {
      saveMutation.mutate();
    }, 1500);

    return () => clearTimeout(timer);
  }, [grades, isAutoSave]);

  const canSave =
    selectedModule !== null &&
    students.length > 0 &&
    modifiedEntries.length > 0 &&
    invalidStudentIds.length === 0 &&
    !saving &&
    !isPublished;

  const confirmSelectionChange = (type: 'filiere' | 'group' | 'module' | 'reset', value: number | null) => {
    if (modifiedEntries.length > 0) {
      setPendingSelection({ type, value });
      setIsUnsavedModalOpen(true);
    } else {
      applySelectionChange(type, value);
    }
  };

  const applySelectionChange = (type: 'filiere' | 'group' | 'module' | 'reset', value: number | null) => {
    if (type === 'filiere') {
      setFiliere(value);
      setGroup(null);
      setModule(null);
    } else if (type === 'group') {
      setGroup(value);
      setModule(null);
    } else if (type === 'module') {
      setModule(value);
    } else if (type === 'reset') {
      const initial: Record<number, string> = {};
      students.forEach((student) => {
        initial[student.id] = student.existing_grade !== null ? String(student.existing_grade) : '';
      });
      setGrades(initial);
      setRowStatuses({});
      setRowErrors({});
      toast.info('All unsaved changes have been reverted.');
    }
    setIsUnsavedModalOpen(false);
    setPendingSelection(null);
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    studentId: number,
    index: number,
    studentList: TrainerGradeEntryStudent[]
  ) => {
    if (e.key === 'ArrowDown' || e.key === 'Enter') {
      e.preventDefault();
      const nextIndex = index + 1;
      if (nextIndex < studentList.length) {
        const nextStudent = studentList[nextIndex];
        const nextInput = document.getElementById(`grade-input-${nextStudent.id}`) as HTMLInputElement | null;
        if (nextInput) {
          nextInput.focus();
          nextInput.select();
        }
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevIndex = index - 1;
      if (prevIndex >= 0) {
        const prevStudent = studentList[prevIndex];
        const prevInput = document.getElementById(`grade-input-${prevStudent.id}`) as HTMLInputElement | null;
        if (prevInput) {
          prevInput.focus();
          prevInput.select();
        }
      }
    } else if (e.key === 'Escape') {
      e.currentTarget.blur();
    }
  };

  const handleExportCSV = () => {
    if (!students || students.length === 0) {
      toast.error('No students to export.');
      return;
    }
    const headers = ['Student Name', 'Grade (0-20)', 'Status'];
    const rows = students.map((student) => {
      const val = grades[student.id] !== undefined ? grades[student.id].trim() : (student.existing_grade !== null ? String(student.existing_grade) : '');
      const parsed = Number(val);
      const isInvalid = val === '' || Number.isNaN(parsed);
      const status = isInvalid ? 'No Grade' : parsed >= 10 ? 'Valide' : 'Insuffisant';
      return [
        `"${student.name.replace(/"/g, '""')}"`,
        val || '""',
        status
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF'
      + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    const modName = selectedModuleData?.module_name ? selectedModuleData.module_name.toLowerCase().replace(/[^a-z0-9]/g, '_') : 'module';
    link.setAttribute('download', `grades_${modName}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Grades exported to CSV successfully.');
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
        if (lines.length <= 1) {
          toast.error('CSV file appears to be empty.');
          return;
        }

        const newGrades = { ...grades };
        let count = 0;
        let errors = 0;

        for (let i = 1; i < lines.length; i++) {
          const matches = lines[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || lines[i].split(',');
          if (!matches || matches.length < 2) continue;
          
          const studentName = matches[0].replace(/^"|"$/g, '').trim();
          const gradeStr = matches[1].replace(/^"|"$/g, '').trim();

          const studentObj = students.find(s => s.name.toLowerCase() === studentName.toLowerCase());
          if (studentObj) {
            if (gradeStr === '') {
              newGrades[studentObj.id] = '';
              count++;
            } else {
              const num = Number(gradeStr);
              if (!Number.isNaN(num) && num >= 0 && num <= 20) {
                newGrades[studentObj.id] = String(num);
                count++;
              } else {
                errors++;
              }
            }
          }
        }

        setGrades(newGrades);
        setRowStatuses({});
        
        if (errors > 0) {
          toast.warning(`Import complete. Filled ${count} grades, but skipped ${errors} invalid values.`);
        } else {
          toast.success(`Import complete! Successfully filled ${count} student grades.`);
        }
      } catch (err) {
        toast.error('Failed to parse CSV file. Please match the exported format.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handlePublishClick = () => {
    if (invalidStudentIds.length > 0) {
      toast.error('Please correct invalid grade scores before publishing.');
      return;
    }
    if (modifiedEntries.length > 0) {
      toast.error('Please save your changes before publishing.');
      return;
    }
    setIsPublishOpen(true);
  };

  const handleConfirmPublish = () => {
    setIsPublishing(true);
    setTimeout(() => {
      setIsPublishing(false);
      setIsPublishOpen(false);
      setIsPublished(true);
      toast.success('Grades published successfully! They are locked and visible to students.');
    }, 1500);
  };

  const handleUnpublishGrades = () => {
    setIsPublished(false);
    toast.info('Session unlocked for editing.');
  };

  const filiereOptions = useMemo(() => {
    return data.map((f) => ({
      value: String(f.filiere_id),
      label: f.filiere_name,
    }));
  }, [data]);

  const groupOptions = useMemo(() => {
    return groups.map((g) => ({
      value: String(g.group_id),
      label: g.group_name,
    }));
  }, [groups]);

  const moduleOptions = useMemo(() => {
    return modules.map((m) => ({
      value: String(m.module_id),
      label: m.module_name,
    }));
  }, [modules]);

  const semesterOptions = [
    { value: 'S1', label: 'Semester 1' },
    { value: 'S2', label: 'Semester 2' }
  ];

  const sessionOptions = [
    { value: 'Normal', label: 'Normal Session' },
    { value: 'Rattrapage', label: 'Rattrapage Session' }
  ];

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 md:px-8">
        <div className="h-4 w-48 animate-pulse rounded bg-theme-surface" />
        <div className="space-y-3">
          <div className="h-9 w-64 animate-pulse rounded-lg bg-theme-surface" />
          <div className="h-5 w-96 animate-pulse rounded-md bg-theme-surface" />
        </div>
        <div className="rounded-2xl border border-theme-border glass-panel p-6 shadow-sm">
          <div className="grid gap-6 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="space-y-3">
                <div className="h-4 w-24 animate-pulse rounded bg-theme-surface" />
                <div className="h-11 animate-pulse rounded-xl bg-theme-surface" />
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-theme-border glass-panel overflow-hidden">
          <div className="h-16 border-b border-theme-border bg-theme-surface" />
          <div className="p-6 space-y-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="flex gap-4 items-center">
                <div className="h-10 w-10 animate-pulse rounded-full bg-theme-surface" />
                <div className="h-5 flex-1 animate-pulse rounded bg-theme-surface" />
                <div className="h-10 w-24 animate-pulse rounded-xl bg-theme-surface" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 md:px-8 animate-in fade-in duration-500">
      <nav className="flex items-center gap-2 text-xs font-semibold text-theme-text-secondary">
        <span className="hover:bg-theme-hover-card-bg hover:text-theme-hover-card-fg transition-colors cursor-pointer px-1 rounded">GIMS Dashboard</span>
        <ArrowRight className="h-3 w-3 text-theme-text-secondary" />
        <span className="hover:bg-theme-hover-card-bg hover:text-theme-hover-card-fg transition-colors cursor-pointer px-1 rounded">Academics</span>
        <ArrowRight className="h-3 w-3 text-theme-text-secondary" />
        <span className="text-blue-400">Grade Entry</span>
      </nav>

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-extrabold tracking-tight text-theme-text-primary sm:text-4xl">
              Grade Entry
            </h1>
            {isPublished && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-400 shadow-glow-primary/10">
                <Lock className="h-3 w-3" />
                Published & Locked
              </span>
            )}
          </div>
          <p className="text-sm text-theme-text-secondary max-w-2xl">
            Input, manage, and publish academic records for your assigned filières and groups. Lock grades once complete to publish them.
          </p>
        </div>
      </div>

      {loadQuery.isError && (
        <div className="flex items-center gap-3 rounded-2xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-400 shadow-elevation-sm backdrop-blur-sm">
          <AlertOctagon className="h-5 w-5 flex-shrink-0 text-red-500" />
          <p className="font-medium">{getApiErrorMessage(loadQuery.error, 'Unable to load grade entry data.')}</p>
        </div>
      )}

      <div className="rounded-2xl border border-theme-border glass-panel shadow-elevation-sm transition-all duration-300">
        <div className="flex items-center gap-2.5 border-b border-theme-border px-6 py-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500/10">
            <GraduationCap className="h-4 w-4 text-blue-400" />
          </div>
<h2 className="text-sm font-bold text-theme-text-primary uppercase tracking-wider">
              Academic Context Filters
            </h2>
        </div>

        <div className="grid gap-6 p-6 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-theme-text-secondary">
              <GraduationCap className="h-3.5 w-3.5 text-theme-text-secondary" />
              Filière
            </label>
            <CustomSelect
              options={filiereOptions}
              value={selectedFiliere !== null ? String(selectedFiliere) : ''}
              onChange={(val) => confirmSelectionChange('filiere', val ? Number(val) : null)}
              placeholder="Select a filière..."
            />
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-theme-text-secondary">
              <Users className="h-3.5 w-3.5 text-theme-text-secondary" />
              Group
            </label>
            <CustomSelect
              options={groupOptions}
              value={selectedGroup !== null ? String(selectedGroup) : ''}
              onChange={(val) => confirmSelectionChange('group', val ? Number(val) : null)}
              placeholder={selectedFiliere === null ? "Select filière first" : "Select a group..."}
              className={selectedFiliere === null ? "opacity-60 pointer-events-none" : ""}
            />
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-theme-text-secondary">
              <BookOpen className="h-3.5 w-3.5 text-theme-text-secondary" />
              Module
            </label>
            <CustomSelect
              options={moduleOptions}
              value={selectedModule !== null ? String(selectedModule) : ''}
              onChange={(val) => confirmSelectionChange('module', val ? Number(val) : null)}
              placeholder={selectedGroup === null ? "Select group first" : "Select a module..."}
              className={selectedGroup === null ? "opacity-60 pointer-events-none" : ""}
            />
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-theme-text-secondary">
              <Calendar className="h-3.5 w-3.5 text-theme-text-secondary" />
              Semester
            </label>
            <CustomSelect
              options={semesterOptions}
              value={selectedSemester}
              onChange={(val) => setSemester(val)}
              placeholder="Semester..."
            />
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-theme-text-secondary">
              <Award className="h-3.5 w-3.5 text-theme-text-secondary" />
              Session / Exam Type
            </label>
            <CustomSelect
              options={sessionOptions}
              value={selectedSession}
              onChange={(val) => setSession(val)}
              placeholder="Session..."
            />
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-theme-text-secondary">
              <Search className="h-3.5 w-3.5 text-theme-text-secondary" />
              Search Student
            </label>
            <div className="relative group/search">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-theme-text-secondary group-focus-within/search:text-blue-400 transition-colors pointer-events-none" />
              <Input
                type="text"
                placeholder="Type student name to search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-[42px] border-theme-border bg-theme-surface text-theme-text-primary placeholder:text-theme-text-secondary focus-visible:border-blue-500/50 focus-visible:ring-blue-500/10 focus-visible:ring-4 rounded-xl transition-all duration-300 w-full"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col rounded-2xl border border-theme-border glass-panel overflow-hidden shadow-elevation-sm">
        <div className="sticky top-0 z-20 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-theme-border bg-theme-surface/90 px-6 py-4 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10">
              <BookOpenCheck className="h-4.5 w-4.5 text-blue-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-theme-text-primary uppercase tracking-wider">
                Student Roster
              </h3>
              <p className="text-xs text-theme-text-secondary">
                {selectedModule === null
                  ? 'Please select a module to view roster'
                  : `${filteredStudents.length} of ${students.length} Student${students.length !== 1 ? 's' : ''} shown`}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {selectedModule !== null && !isPublished && (
              <button
                type="button"
                onClick={() => setIsAutoSave(!isAutoSave)}
                className={cn(
                  "flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold uppercase transition-all duration-300 active:scale-[0.98]",
                  isAutoSave 
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-glow-primary/5" 
                    : "bg-theme-surface text-theme-text-secondary border-theme-border hover:bg-theme-surface"
                )}
              >
                <span className={cn("h-1.5 w-1.5 rounded-full", isAutoSave ? "bg-emerald-400 animate-pulse" : "bg-theme-text-secondary")} />
                Auto-save: {isAutoSave ? "ON" : "OFF"}
              </button>
            )}

            {selectedModule !== null && modifiedEntries.length > 0 && !isPublished && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => confirmSelectionChange('reset', null)}
                className="flex items-center gap-1.5 font-bold uppercase text-xs rounded-xl"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset
              </Button>
            )}

            {selectedModule !== null && !isPublished && (
              <>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImportCSV}
                  accept=".csv"
                  className="hidden"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 font-bold uppercase text-xs rounded-xl"
                >
                  <Upload className="h-3.5 w-3.5" />
                  Import
                </Button>
              </>
            )}

            {selectedModule !== null && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportCSV}
                className="flex items-center gap-1.5 font-bold uppercase text-xs rounded-xl"
              >
                <Download className="h-3.5 w-3.5" />
                Export
              </Button>
            )}

            {selectedModule !== null && !isPublished && (
              <Button
                disabled={!canSave}
                onClick={() => saveMutation.mutate()}
                className="flex items-center gap-1.5 font-bold uppercase text-xs shadow-elevation-md rounded-xl"
                size="sm"
              >
                {saving ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Save className="h-3.5 w-3.5" />
                )}
                {saving ? 'Saving...' : 'Save Grades'}
              </Button>
            )}

            {selectedModule !== null && (
              <Button
                variant={isPublished ? "outline" : "default"}
                onClick={isPublished ? handleUnpublishGrades : handlePublishClick}
                className={cn(
                  "flex items-center gap-1.5 font-bold uppercase text-xs rounded-xl active:scale-[0.98] transition-all",
                  !isPublished && "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/10 border-emerald-500/20 shadow-lg border"
                )}
                size="sm"
              >
                {isPublished ? (
                  <>
                    <LockOpen className="h-3.5 w-3.5 text-orange-400" />
                    Unlock Session
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5 animate-pulse" />
                    Publish Grades
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        <AnimatePresence>
          {(saving || isAutoSave || modifiedEntries.length > 0) && selectedModule !== null && !isPublished && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-theme-surface px-6 py-2 flex items-center justify-between border-b border-theme-border text-xs"
            >
              <div className="flex items-center gap-2">
                {saving ? (
                  <div className="flex items-center gap-1.5 text-blue-400 font-medium">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Saving edits to database...</span>
                  </div>
                ) : modifiedEntries.length > 0 ? (
                  <div className="flex items-center gap-1.5 text-amber-400 font-medium">
                    <AlertCircle className="h-3.5 w-3.5" />
                    <span>{modifiedEntries.length} unsaved grade edit{modifiedEntries.length !== 1 ? 's' : ''} draft</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>All changes synced successfully</span>
                  </div>
                )}
              </div>
              {isAutoSave && (
                <span className="text-[11px] text-theme-text-secondary uppercase tracking-widest font-mono">
                  {saving ? "Syncing..." : modifiedEntries.length > 0 ? "Auto-saving in 1.5s..." : "Synced"}
                </span>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="relative w-full overflow-x-auto custom-scrollbar">
          <table className="w-full min-w-[900px] text-sm text-left border-collapse">
            <thead className="bg-theme-surface text-[11px] font-bold uppercase tracking-wider text-theme-text-secondary sticky top-0 z-10 border-b border-theme-border">
              <tr>
                <th className="px-6 py-4 w-20 text-center">#</th>
                <th className="px-6 py-4">Student Profile</th>
                <th className="px-6 py-4 w-44 text-center">Grade score (0 - 20)</th>
                <th className="px-6 py-4 w-40 text-center">Status badge</th>
                <th className="px-6 py-4 w-60 text-right">Database feedback</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-theme-border bg-transparent">
              
              {selectedModule === null && (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center justify-center max-w-sm mx-auto space-y-4">
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 shadow-glow-primary/5">
                        <BookOpen className="h-8 w-8" />
                      </div>
                      <div>
                        <h4 className="text-base font-bold text-theme-text-primary">No Module Selected</h4>
                        <p className="mt-1.5 text-xs text-theme-text-secondary leading-relaxed">
                          To record academic marks, select a filière, group, and module using the filter controls above.
                        </p>
                      </div>
                    </div>
                  </td>
                </tr>
              )}

              {selectedModule !== null && students.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center justify-center max-w-sm mx-auto space-y-4">
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-theme-surface border border-theme-border text-theme-text-secondary">
                        <Users className="h-8 w-8" />
                      </div>
                      <div>
                        <h4 className="text-base font-bold text-theme-text-primary">Roster is empty</h4>
                        <p className="mt-1.5 text-xs text-theme-text-secondary leading-relaxed">
                          This module currently has no registered students. Please sync or coordinate with school administration.
                        </p>
                      </div>
                    </div>
                  </td>
                </tr>
              )}

              {selectedModule !== null && students.length > 0 && filteredStudents.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center justify-center max-w-sm mx-auto space-y-4">
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-theme-surface border border-theme-border text-theme-text-secondary">
                        <Search className="h-8 w-8" />
                      </div>
                      <div>
                        <h4 className="text-base font-bold text-theme-text-primary">No matches found</h4>
                        <p className="mt-1.5 text-xs text-theme-text-secondary leading-relaxed">
                          No student matching "{searchQuery}" is enrolled in this group module. Check spelling or try a different term.
                        </p>
                      </div>
                    </div>
                  </td>
                </tr>
              )}

              {selectedModule !== null && paginatedStudents.map((student, pageIndex) => {
                const index = (currentPage - 1) * itemsPerPage + pageIndex;
                const raw = grades[student.id];
                const numeric = raw !== undefined ? Number(raw.trim()) : NaN;
                const isInputEmpty = raw === undefined || raw.trim() === '';
                const isInvalid = !isInputEmpty && (Number.isNaN(numeric) || numeric < 0 || numeric > 20);
                const isPassing = !isInputEmpty && !isInvalid && numeric >= 10;
                const isFailing = !isInputEmpty && !isInvalid && numeric < 10;
                
                const saveStatus = rowStatuses[student.id] ?? 'idle';
                const isFocused = focusedRow === student.id;
                const initials = getStudentInitials(student.name);
                const gradientClasses = getStudentGradient(student.name);

                const currentStr = raw !== undefined ? raw.trim() : '';
                const initialStr = student.existing_grade !== null ? String(student.existing_grade) : '';
                const isRowModified = currentStr !== initialStr;

                return (
                  <tr 
                    key={student.id} 
                    className={cn(
                      "transition-all duration-300 relative border-l-4 group/row",
                      isRowModified ? "border-l-indigo-500 bg-indigo-500/[0.02]" : "border-l-transparent hover:bg-theme-surface",
                      isFocused ? "bg-blue-500/[0.03] border-l-blue-400" : ""
                    )}
                    onMouseEnter={() => setFocusedRow(student.id)}
                    onMouseLeave={() => setFocusedRow(null)}
                  >
                    <td className="px-6 py-4.5 text-center text-xs font-bold text-theme-text-secondary font-mono">
                      {(index + 1).toString().padStart(2, '0')}
                    </td>
                    
                    <td className="px-6 py-4.5">
                      <div className="flex items-center gap-3.5">
                        <div className={cn(
                          "flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold border shadow-inner bg-gradient-to-br transition-transform duration-300 group-hover/row:scale-110",
                          gradientClasses
                        )}>
                          {initials}
                        </div>
                        <div>
                          <div className="font-bold text-theme-text-primary text-sm group-hover/row:text-blue-400 transition-colors duration-200">
                            {student.name}
                          </div>
                          <div className="text-[11px] text-theme-text-secondary uppercase tracking-widest mt-0.5">
                            ID: #{student.id}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4.5">
                      <div className="relative w-28 mx-auto group/input">
                        <Input
                          id={`grade-input-${student.id}`}
                          type="number"
                          min={0}
                          max={20}
                          step={0.25}
                          value={grades[student.id] ?? ''}
                          disabled={isPublished}
                          onChange={(e) => {
                            const value = e.target.value;
                            setGrades((prev) => ({ ...prev, [student.id]: value }));
                            setRowStatuses((prev) => ({ ...prev, [student.id]: 'idle' }));
                            setRowErrors((prev) => ({ ...prev, [student.id]: '' }));
                          }}
                          onFocus={() => setFocusedRow(student.id)}
                          onKeyDown={(e) => handleKeyDown(e, student.id, index, filteredStudents)}
                          aria-invalid={isInvalid}
                          className={cn(
                            "h-[42px] text-center font-bold text-sm transition-all duration-300 rounded-xl border focus-visible:ring-4 placeholder:text-theme-text-secondary disabled:opacity-60 disabled:cursor-not-allowed",
                            isInvalid 
                              ? "border-red-500 bg-red-500/10 text-red-200 focus-visible:border-red-500 focus-visible:ring-red-500/20" 
                              : isPassing 
                                ? "border-emerald-500/50 bg-emerald-500/5 text-emerald-300 focus-visible:border-emerald-400 focus-visible:ring-emerald-500/10"
                                : isFailing
                                  ? "border-amber-500/50 bg-amber-500/5 text-amber-300 focus-visible:border-amber-400 focus-visible:ring-amber-500/10"
                                  : "border-theme-border bg-theme-surface text-theme-text-primary focus-visible:border-blue-500 focus-visible:ring-blue-500/10"
                          )}
                          placeholder="0.00"
                        />
                        {isInvalid && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-red-400 animate-bounce">
                            <AlertCircle className="h-4 w-4" />
                          </div>
                        )}
                      </div>
                      {isInvalid && (
                        <p className="absolute left-1/2 -translate-x-1/2 mt-1 text-[10px] font-bold text-red-400 bg-red-950/80 px-2 py-0.5 border border-red-900/50 rounded-md backdrop-blur-md shadow-lg z-10 animate-in slide-in-from-top-1">
                          Limit 0-20
                        </p>
                      )}
                    </td>

                    <td className="px-6 py-4.5 text-center">
                      {isInputEmpty ? (
                        <span className="inline-flex items-center gap-1.5 rounded-xl border border-theme-border bg-theme-surface px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-theme-text-secondary">
                          Empty
                        </span>
                      ) : isInvalid ? (
                        <span className="inline-flex items-center gap-1.5 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-red-400 shadow-glow-primary/5">
                          Invalid
                        </span>
                      ) : isPassing ? (
                        <span className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-emerald-400 shadow-glow-primary/5">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                          Passed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-amber-400 shadow-glow-primary/5">
                          <AlertCircle className="h-3.5 w-3.5 text-amber-400" />
                          Failed
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4.5 text-right font-medium">
                      <div className="flex items-center justify-end min-h-6">
                        {isPublished ? (
                          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 border border-emerald-500/15 bg-emerald-500/5 px-2.5 py-1 rounded-lg">
                            <Lock className="h-3 w-3" />
                            Locked
                          </div>
                        ) : saveStatus === 'saved' && !isRowModified ? (
                          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 animate-in zoom-in-95">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                            <span>Synced</span>
                          </div>
                        ) : saveStatus === 'error' ? (
                          <div className="flex items-center gap-1.5 text-xs font-bold text-red-400 animate-in zoom-in-95" title={rowErrors[student.id]}>
                            <XCircle className="h-3.5 w-3.5" />
                            <span className="max-w-[150px] truncate">
                              {rowErrors[student.id] || 'Save error'}
                            </span>
                          </div>
                        ) : isRowModified ? (
                          <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-400 border border-indigo-500/30 bg-indigo-500/10 px-2 py-0.5 rounded animate-pulse">
                            Draft Edits
                          </span>
                        ) : (
                          <span className="text-theme-text-secondary font-mono select-none">—</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {selectedModule !== null && filteredStudents.length > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-theme-border bg-theme-surface/80 px-6 py-4 text-xs font-semibold">
            <div className="flex items-center gap-4 text-theme-text-secondary">
              <span className="text-theme-text-secondary">
                Showing <strong className="text-theme-text-primary">{Math.min(filteredStudents.length, (currentPage - 1) * itemsPerPage + 1)}-{Math.min(filteredStudents.length, currentPage * itemsPerPage)}</strong> of <strong className="text-theme-text-primary">{filteredStudents.length}</strong> matching students
              </span>
              
              <div className="flex items-center gap-2">
                <span className="text-[11px] uppercase tracking-wider text-theme-text-secondary font-bold">Show:</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => setItemsPerPage(Number(e.target.value))}
                  className="bg-theme-surface text-theme-text-primary border-theme-border hover:bg-theme-hover-card-bg rounded-xl px-2.5 py-1 text-xs cursor-pointer focus:ring-1 focus:ring-blue-500/50"
                >
                  <option value={10}>10 items</option>
                  <option value={20}>20 items</option>
                  <option value={50}>50 items</option>
                  <option value={100}>100 items</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="h-8 w-8 p-0 rounded-lg flex items-center justify-center active:scale-95 disabled:pointer-events-none"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <div className="flex items-center gap-1.5 font-mono">
                {Array.from({ length: totalPages }).map((_, i) => {
                  const pNum = i + 1;
                  const isActive = currentPage === pNum;
                  return (
                    <button
                      key={pNum}
                      onClick={() => setCurrentPage(pNum)}
                      className={cn(
                        "h-8 w-8 font-bold rounded-lg border text-xs transition-all active:scale-95",
                        isActive 
                          ? "bg-blue-600 text-white border-blue-400/20 shadow-lg shadow-blue-600/10" 
                          : "bg-theme-surface border-theme-border text-theme-text-secondary hover:bg-theme-hover-card-bg hover:text-theme-hover-card-fg"
                      )}
                    >
                      {pNum}
                    </button>
                  );
                })}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="h-8 w-8 p-0 rounded-lg flex items-center justify-center active:scale-95 disabled:pointer-events-none"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      <Modal
        isOpen={isPublishOpen}
        onClose={() => setIsPublishOpen(false)}
        title="Publish Grades Confirmation"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 p-4 text-xs leading-relaxed text-amber-300">
            <AlertCircle className="h-5 w-5 flex-shrink-0 text-amber-500" />
            <div>
              <strong className="font-extrabold block text-sm mb-1 uppercase tracking-wider text-amber-400">Critical warning!</strong>
              Publishing locked grades commits them to the school ERP. Student dashboards will refresh instantly and grades will become **read-only** for this module session.
            </div>
          </div>

          <p className="text-sm text-theme-text-secondary leading-relaxed">
            Are you absolutely sure you want to lock and publish the grades for module <strong>"{selectedModuleData?.module_name}"</strong>, session <strong>"{selectedSession}"</strong>?
          </p>

          <div className="flex items-center justify-end gap-3 pt-3">
            <Button
              variant="ghost"
              onClick={() => setIsPublishOpen(false)}
              className="font-bold text-xs uppercase rounded-xl"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmPublish}
              disabled={isPublishing}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase shadow-lg shadow-emerald-600/10 rounded-xl flex items-center gap-1.5"
            >
              {isPublishing && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {isPublishing ? 'Publishing...' : 'Yes, lock & publish'}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isUnsavedModalOpen}
        onClose={() => setIsUnsavedModalOpen(false)}
        title="Unsaved changes detected"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-2xl bg-red-500/10 border border-red-500/20 p-4 text-xs leading-relaxed text-red-300">
            <AlertTriangleIcon className="h-5 w-5 flex-shrink-0 text-red-500" />
            <div>
              <strong className="font-extrabold block text-sm mb-1 uppercase tracking-wider text-red-400">Warning</strong>
              You have {modifiedEntries.length} draft grade edits. Changing filters or resetting will discard all draft modifications!
            </div>
          </div>

          <p className="text-sm text-theme-text-primary leading-relaxed">
            Do you want to discard your draft edits and continue, or stay here to save them?
          </p>

          <div className="flex items-center justify-end gap-3 pt-3">
            <Button
              variant="ghost"
              onClick={() => setIsUnsavedModalOpen(false)}
              className="font-bold text-xs uppercase rounded-xl"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (pendingSelection) {
                  applySelectionChange(pendingSelection.type, pendingSelection.value);
                }
              }}
              className="font-bold text-xs uppercase rounded-xl"
            >
              Discard changes
            </Button>
            <Button
              onClick={() => {
                setIsUnsavedModalOpen(false);
                saveMutation.mutate();
              }}
              className="font-bold text-xs uppercase rounded-xl flex items-center gap-1.5"
            >
              Save first
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function AlertTriangleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

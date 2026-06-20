import { memo, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { modulesApi } from '../api/api/modules';
import type { AcademicCatalogFiliere, Module, MyModulesPayload } from '../api/api/modules';
import { stagiaireApi } from '../api/api/stagiaire';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import {
  BarChart3,
  BookOpen,
  BookOpenCheck,
  ChevronDown,
  ClipboardList,
  Clock,
  Eye,
  FileWarning,
  Filter,
  FolderKanban,
  GraduationCap,
  Hash,
  Layers3,
  Search,
  SlidersHorizontal,
  Sparkles,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../hooks/useAuth';
import { getApiErrorMessage } from '../lib/api-error';

type FiliereTone = {
  accent: string;
  badge: string;
  soft: string;
  ring: string;
  icon: string;
};

const TYPE_STYLES: Record<string, FiliereTone> = {
  qualification: {
    accent: '#4f8ef7',
    badge: 'border-blue-400/30 bg-blue-500/15 text-blue-200',
    soft: 'from-blue-500/16 via-blue-500/6 to-transparent',
    ring: 'group-hover:shadow-[0_0_0_1px_rgba(79,142,247,0.35),0_18px_45px_rgba(15,23,42,0.45)]',
    icon: 'bg-blue-500/18 text-blue-200',
  },
  bts: {
    accent: '#22c55e',
    badge: 'border-emerald-400/30 bg-emerald-500/15 text-emerald-200',
    soft: 'from-emerald-500/16 via-emerald-500/6 to-transparent',
    ring: 'group-hover:shadow-[0_0_0_1px_rgba(34,197,94,0.35),0_18px_45px_rgba(15,23,42,0.45)]',
    icon: 'bg-emerald-500/18 text-emerald-200',
  },
  default: {
    accent: '#6c63ff',
    badge: 'border-violet-400/30 bg-violet-500/15 text-violet-200',
    soft: 'from-violet-500/16 via-violet-500/6 to-transparent',
    ring: 'group-hover:shadow-[0_0_0_1px_rgba(108,99,255,0.35),0_18px_45px_rgba(15,23,42,0.45)]',
    icon: 'bg-violet-500/18 text-violet-200',
  },
};

const LEVEL_STYLES: Record<string, { accent: string; chip: string; border: string }> = {
  '1A': {
    accent: '#4f8ef7',
    chip: 'border-blue-400/25 bg-blue-500/15 text-blue-100',
    border: 'border-l-blue-400/80',
  },
  '2A': {
    accent: '#6c63ff',
    chip: 'border-violet-400/25 bg-violet-500/15 text-violet-100',
    border: 'border-l-violet-400/80',
  },
  '3A': {
    accent: '#f59e0b',
    chip: 'border-amber-400/25 bg-amber-500/15 text-amber-100',
    border: 'border-l-amber-400/80',
  },
  default: {
    accent: '#22c55e',
    chip: 'border-emerald-400/25 bg-emerald-500/15 text-emerald-100',
    border: 'border-l-emerald-400/80',
  },
};

function formatLastSession(iso: string | null): string {
  if (!iso) return '-';
  try {
    return new Date(iso).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' });
  } catch {
    return iso;
  }
}

function localDatetimeValueFromIso(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function localDatetimeToIso(local: string): string | undefined {
  const t = local.trim();
  if (!t) return undefined;
  const d = new Date(t);
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
}

function getTypeTone(type: string): FiliereTone {
  const key = type.trim().toLowerCase();
  return TYPE_STYLES[key] ?? TYPE_STYLES.default;
}

function getLevelStyle(level?: string) {
  if (!level) return LEVEL_STYLES.default;
  return LEVEL_STYLES[level.toUpperCase()] ?? LEVEL_STYLES.default;
}

function buildLevelMeta(modules: Module[]) {
  return modules.reduce(
    (acc, module) => {
      acc.hours += Number(module.masse_horaire ?? 0);
      acc.coefficient += Number(module.coefficient ?? 0);
      return acc;
    },
    { hours: 0, coefficient: 0 },
  );
}

const SkeletonCard = memo(function SkeletonCard() {
  return (
    <div className="animate-pulse overflow-hidden rounded-[26px] border border-[#2d3a5a] bg-theme-card">
      <div className="border-b border-theme-border bg-gradient-to-r from-theme-card to-transparent px-5 py-5">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-theme-surface" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-56 rounded bg-theme-surface" />
            <div className="h-3 w-32 rounded bg-theme-surface" />
          </div>
          <div className="h-10 w-10 rounded-2xl bg-theme-surface" />
        </div>
      </div>
      <div className="space-y-4 px-5 py-5">
        <div className="flex gap-2">
          <div className="h-7 w-24 rounded-full bg-theme-surface" />
          <div className="h-7 w-28 rounded-full bg-theme-surface" />
        </div>
        {[1, 2].map((item) => (
          <div key={item} className="rounded-2xl border border-theme-border bg-theme-surface p-4">
            <div className="mb-3 h-4 w-32 rounded bg-theme-surface" />
            <div className="space-y-2">
              <div className="h-14 rounded-2xl bg-theme-surface" />
              <div className="h-14 rounded-2xl bg-theme-surface" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

const TeacherModulesTableSkeleton = memo(function TeacherModulesTableSkeleton() {
  return (
    <div className="overflow-hidden rounded-[24px] border border-theme-border bg-theme-card animate-pulse">
      <div className="h-12 border-b border-theme-border bg-theme-surface" />
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex gap-4 border-b border-theme-border px-4 py-4">
          <div className="h-4 flex-1 rounded bg-theme-surface" />
          <div className="h-4 w-24 rounded bg-theme-surface" />
          <div className="h-4 w-40 rounded bg-theme-surface" />
        </div>
      ))}
    </div>
  );
});

const StagiaireModulesTableSkeleton = memo(function StagiaireModulesTableSkeleton() {
  return (
    <div className="overflow-hidden rounded-[24px] border border-theme-border bg-theme-card animate-pulse">
      <div className="h-12 border-b border-theme-border bg-theme-surface" />
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex gap-4 border-b border-theme-border px-4 py-4">
          <div className="h-4 flex-1 rounded bg-theme-surface" />
          <div className="h-4 w-48 rounded bg-theme-surface" />
        </div>
      ))}
    </div>
  );
});

function StatsCard({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: typeof BookOpen;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="min-h-[112px] rounded-[24px] border border-theme-border bg-gradient-to-br from-theme-card from-theme-card to-transparent p-5 shadow-[0_18px_45px_rgba(2,6,23,0.35)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-theme-text-secondary">{label}</p>
          <p className="mt-3 text-3xl font-black tracking-tight text-white">{value}</p>
          <p className="mt-2 text-sm text-theme-text-secondary">{detail}</p>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-theme-border bg-[#4f8ef7]/15 text-[#9dc0ff]">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function SearchBar({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <label className="relative block min-w-0 flex-1" aria-label="Rechercher des modules">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-theme-text-secondary" />
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-12 rounded-2xl border-theme-border bg-theme-surface pl-11 pr-10 text-theme-text-primary placeholder:text-theme-text-secondary"
        aria-label="Recherche par filiere, module, code ou niveau"
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-xl text-theme-text-secondary transition hover:bg-theme-hover-card-bg hover:text-theme-hover-card-fg"
          aria-label="Effacer la recherche"
        >
          <X className="h-4 w-4" />
        </button>
      ) : null}
    </label>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <label className="min-w-[160px] flex-1 sm:flex-none">
      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-theme-text-secondary">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-12 w-full rounded-2xl border border-theme-border bg-theme-surface px-4 text-sm text-theme-text-primary outline-none transition hover:border-theme-border focus:border-[#4f8ef7]/60 focus:ring-2 focus:ring-[#4f8ef7]/20"
        aria-label={`Filtrer par ${label.toLowerCase()}`}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value} className="bg-theme-card text-theme-text-primary">
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function ActiveFilters({
  items,
  onClear,
}: {
  items: string[];
  onClear: () => void;
}) {
  if (items.length === 0) {
    return (
      <div className="flex min-h-[44px] items-center gap-2 rounded-2xl border border-dashed border-theme-border bg-theme-surface px-4 text-sm text-theme-text-secondary">
        <Sparkles className="h-4 w-4 text-[#6c63ff]" />
        No active filters
      </div>
    );
  }

  return (
    <div className="flex min-h-[44px] flex-wrap items-center gap-2 rounded-2xl border border-theme-border bg-theme-surface px-3 py-2">
      <span className="inline-flex items-center gap-2 rounded-full border border-[#4f8ef7]/25 bg-[#4f8ef7]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#cfe0ff]">
        <Filter className="h-3.5 w-3.5" />
        Active filters
      </span>
      {items.map((item) => (
        <span key={item} className="rounded-full border border-theme-border bg-theme-surface px-3 py-1 text-sm text-theme-text-primary">
          {item}
        </span>
      ))}
      <button
        type="button"
        onClick={onClear}
        className="ml-auto inline-flex min-h-[44px] items-center justify-center rounded-2xl px-3 text-sm font-medium text-theme-text-secondary transition hover:bg-theme-hover-card-bg hover:text-theme-hover-card-fg"
      >
        Clear all
      </button>
    </div>
  );
}

const ModuleRow = memo(function ModuleRow({
  module,
  tone,
}: {
  module: Module;
  tone: FiliereTone;
}) {
  const levelStyle = getLevelStyle(module.niveau ?? module.semester);

  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border border-theme-border bg-[#111a31]/88 p-4 transition duration-200 hover:-translate-y-0.5 hover:border-theme-border hover:bg-theme-card ${levelStyle.border} border-l-4`}
      style={{ boxShadow: `0 10px 30px rgba(2, 6, 23, 0.22)` }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition duration-200 group-hover:opacity-100"
        style={{ background: `linear-gradient(90deg, ${tone.accent}12, transparent 45%)` }}
      />
      <div className="relative flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <h4 className="text-sm font-semibold text-theme-text-primary sm:text-base">{module.label}</h4>
            {module.code ? (
              <span
                className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold"
                style={{ backgroundColor: `${tone.accent}20`, color: '#e2ecff', border: `1px solid ${tone.accent}45` }}
              >
                <Hash className="h-3 w-3" />
                {module.code}
              </span>
            ) : null}
            <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${levelStyle.chip}`}>
              <Layers3 className="h-3.5 w-3.5" />
              {module.niveau ?? module.semester ?? 'Autre'}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-theme-text-secondary">
            <span className="inline-flex items-center gap-1 rounded-full border border-theme-border bg-theme-surface px-2.5 py-1">
              <Clock className="h-3.5 w-3.5 text-theme-text-secondary" />
              {module.masse_horaire}h
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-theme-border bg-theme-surface px-2.5 py-1">
              <BarChart3 className="h-3.5 w-3.5 text-theme-text-secondary" />
              Coef {module.coefficient}
            </span>
          </div>
        </div>
        <button
          type="button"
          className="inline-flex min-h-[44px] items-center justify-center gap-2 self-start rounded-2xl border border-theme-border bg-theme-surface px-3 text-sm font-medium text-theme-text-secondary opacity-100 transition hover:border-theme-border hover:bg-theme-hover-card-bg hover:text-theme-hover-card-fg lg:opacity-0 lg:group-hover:opacity-100"
          aria-label={`Voir les details du module ${module.label}`}
        >
          <Eye className="h-4 w-4" />
          View
        </button>
      </div>
    </div>
  );
});

const LevelSection = memo(function LevelSection({
  level,
  modules,
  tone,
}: {
  level: string;
  modules: Module[];
  tone: FiliereTone;
}) {
  const meta = useMemo(() => buildLevelMeta(modules), [modules]);
  const levelStyle = getLevelStyle(level);

  return (
    <section className="rounded-[22px] border border-theme-border bg-[#121c36]/80 p-3 sm:p-4">
      <div className="sticky top-0 z-10 mb-3 flex flex-col gap-3 rounded-2xl border border-theme-border bg-theme-card/95 px-4 py-3 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className={`inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-2xl border px-3 text-sm font-black tracking-[0.12em] ${levelStyle.chip}`}>
            {level}
          </span>
          <div>
            <p className="text-sm font-semibold text-white">Level track</p>
            <p className="text-xs text-theme-text-secondary">Structured module set for this stage</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 text-xs text-theme-text-primary">
          <span className="rounded-full border border-theme-border bg-theme-surface px-3 py-1.5">{modules.length} modules</span>
          <span className="rounded-full border border-theme-border bg-theme-surface px-3 py-1.5">{meta.hours}h total</span>
        </div>
      </div>
      <div className="space-y-3">
        {modules.map((module) => (
          <ModuleRow key={module.id} module={module} tone={tone} />
        ))}
      </div>
    </section>
  );
});

const FiliereCard = memo(function FiliereCard({
  filiere,
  maxModules,
}: {
  filiere: AcademicCatalogFiliere;
  maxModules: number;
}) {
  const [open, setOpen] = useState(true);
  const filiereModules = useMemo(
    () => (Array.isArray(filiere.modules) ? filiere.modules : []),
    [filiere.modules],
  );
  const tone = getTypeTone(filiere.type);

  const modulesByLevel = useMemo(() => {
    const map: Record<string, Module[]> = {};
    filiereModules.forEach((module) => {
      const key = module.niveau ?? module.semester ?? 'Autre';
      (map[key] ??= []).push(module);
    });
    return map;
  }, [filiereModules]);

  const fillPercent = maxModules > 0 ? Math.round((filiereModules.length / maxModules) * 100) : 0;

  return (
    <Card
      className={`group overflow-hidden rounded-[28px] border border-[#2d3a5a] bg-theme-card transition duration-300 ${tone.ring}`}
      style={{ borderLeftWidth: 5, borderLeftColor: tone.accent }}
    >
      <CardHeader className="space-y-0 p-0">
        <button
          type="button"
          className={`w-full bg-gradient-to-r ${tone.soft} px-5 py-5 text-left sm:px-6`}
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-controls={`filiere-panel-${filiere.id}`}
          aria-label={`Basculer la filiere ${filiere.label}`}
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 items-start gap-4">
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-theme-border ${tone.icon}`}>
                <GraduationCap className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <CardTitle className="text-lg font-black leading-tight text-white sm:text-xl">
                    {filiere.label}
                  </CardTitle>
                  <span className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] ${tone.badge}`}>
                    {filiere.type}
                  </span>
                </div>
                <p className="text-sm text-theme-text-secondary">
                  {filiere.code} • {filiereModules.length} modules • {Object.keys(modulesByLevel).length} levels
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 lg:min-w-[280px]">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-theme-text-secondary">Module density</span>
                <span className="text-sm font-semibold text-white">{fillPercent}%</span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-theme-surface">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{ width: `${fillPercent}%`, background: `linear-gradient(90deg, ${tone.accent}, #6c63ff)` }}
                />
              </div>
              <div className="flex items-center justify-between text-xs text-theme-text-secondary">
                <span>{filiere.required_level}</span>
                <span>{filiere.duration_years} year{filiere.duration_years > 1 ? 's' : ''}</span>
              </div>
            </div>

            <div className="flex h-12 w-12 items-center justify-center self-end rounded-2xl border border-theme-border bg-theme-surface text-theme-text-secondary lg:self-center">
              <ChevronDown className={`h-5 w-5 transition-transform duration-300 ${open ? 'rotate-180' : 'rotate-0'}`} />
            </div>
          </div>
        </button>
      </CardHeader>

      <div
        id={`filiere-panel-${filiere.id}`}
        className={`overflow-hidden transition-all duration-300 ease-out ${open ? 'max-h-[5000px] opacity-100' : 'max-h-0 opacity-0'}`}
      >
        <CardContent className="space-y-5 px-5 pb-5 pt-4 sm:px-6 sm:pb-6">
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="rounded-full border border-theme-border bg-theme-surface px-3 py-1.5 font-medium text-theme-text-primary">
              Niveau requis: {filiere.required_level}
            </span>
            <span className="rounded-full border border-[#4f8ef7]/25 bg-[#4f8ef7]/10 px-3 py-1.5 font-medium text-[#d9e6ff]">
              Duree: {filiere.duration_years} year{filiere.duration_years > 1 ? 's' : ''}
            </span>
          </div>

          <div className="space-y-4">
            {Object.entries(modulesByLevel).map(([level, modules]) => (
              <LevelSection key={level} level={level} modules={modules} tone={tone} />
            ))}
          </div>
        </CardContent>
      </div>
    </Card>
  );
});

function EmptyCatalogState({ hasSearch }: { hasSearch: boolean }) {
  return (
    <div className="flex min-h-[360px] flex-col items-center justify-center rounded-[28px] border border-dashed border-theme-border bg-gradient-to-b from-theme-card to-transparent px-6 py-16 text-center">
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-3xl border border-theme-border bg-theme-surface text-theme-text-secondary">
        <FileWarning className="h-8 w-8" />
      </div>
      <h3 className="text-xl font-bold text-theme-text-primary">No modules found</h3>
      <p className="mt-3 max-w-md text-sm leading-6 text-theme-text-secondary">
        {hasSearch
          ? 'Try broadening the search or clearing one of the active filters to reveal more modules.'
          : 'The academic catalog is currently empty or does not expose usable module data yet.'}
      </p>
    </div>
  );
}

function CatalogHero({
  totalModules,
  totalFilieres,
  totalLevels,
}: {
  totalModules: number;
  totalFilieres: number;
  totalLevels: number;
}) {
  return (
    <section className="overflow-hidden rounded-[32px] border border-theme-border bg-theme-card shadow-[0_24px_70px_rgba(2,6,23,0.38)]">
      <div className="relative px-6 py-7 sm:px-8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(79,142,247,0.16),_transparent_32%),radial-gradient(circle_at_right,_rgba(108,99,255,0.12),_transparent_28%)]" aria-hidden="true" />
        <div className="relative grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,0.9fr)] xl:items-end">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-theme-border bg-theme-surface px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-theme-text-secondary">
              <BookOpenCheck className="h-4 w-4 text-[#9dc0ff]" />
              Systeme de Gestion IKI
            </div>
            <div className="flex items-start gap-4">
              <div className="mt-1 flex h-14 w-14 shrink-0 items-center justify-center rounded-[20px] border border-theme-border bg-[#4f8ef7]/15 text-[#cfe0ff]">
                <BookOpen className="h-7 w-7" />
              </div>
              <div>
                <h1 className="text-3xl font-black tracking-tight text-theme-text-primary sm:text-4xl">Modules</h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-theme-text-secondary sm:text-base">
                  Browse the academic catalog by filiere and level, scan workloads faster, and surface modules with clearer visual hierarchy.
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1 2xl:grid-cols-3">
            <StatsCard icon={BookOpen} label="Modules" value={String(totalModules)} detail="All catalog entries" />
            <StatsCard icon={FolderKanban} label="Filieres" value={String(totalFilieres)} detail="Active training tracks" />
            <StatsCard icon={Layers3} label="Levels" value={String(totalLevels)} detail="Distinct level groups" />
          </div>
        </div>
      </div>
    </section>
  );
}

/** Modules de la filiere du stagiaire (API dediee, lecture seule). */
function StagiaireModulesSection() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  const query = useQuery({
    queryKey: ['stagiaire-modules', user?.id],
    queryFn: () => stagiaireApi.modules(),
    enabled: Boolean(user?.id),
  });

  useEffect(() => {
    if (query.error) {
      toast.error(getApiErrorMessage(query.error, 'Erreur lors du chargement des modules.'));
    }
  }, [query.error]);

  const emptyArray = useMemo(() => [], []);
  const rows = query.data?.modules ?? emptyArray;
  const metaFiliere = query.data?.meta?.filiere;

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((m) => {
      const desc = (m.description ?? '').toLowerCase();
      return m.name.toLowerCase().includes(q) || m.code.toLowerCase().includes(q) || desc.includes(q);
    });
  }, [rows, searchQuery]);

  if (query.isLoading) {
    return <StagiaireModulesTableSkeleton />;
  }

  if (rows.length === 0) {
    return (
      <div className="flex min-h-[360px] flex-col items-center justify-center rounded-[28px] border border-dashed border-theme-border bg-theme-card px-6 py-16 text-center">
        <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-700/30">
          <BookOpen className="h-8 w-8 text-theme-text-secondary" />
        </div>
        <h3 className="mb-2 text-lg font-bold text-theme-text-primary">Aucun module pour votre filiere</h3>
        <p className="max-w-md text-sm text-theme-text-secondary">
          Verifiez que votre compte stagiaire est bien rattache a une filiere. Si le probleme persiste, contactez le secretariat.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {metaFiliere ? (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-1 font-medium text-indigo-300">
            Filiere : {metaFiliere.code} - {metaFiliere.label}
          </span>
          <span className="rounded-full border border-theme-border bg-theme-surface px-3 py-1 text-theme-text-secondary">
            {rows.length} module{rows.length !== 1 ? 's' : ''}
          </span>
        </div>
      ) : null}

      <div className="relative w-full sm:w-96">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-theme-text-secondary" />
        <Input
          placeholder="Filtrer par nom, code ou detail..."
          className="h-10 w-full pl-10 pr-4"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          aria-label="Rechercher dans les modules stagiaire"
        />
      </div>

      <div className="overflow-hidden rounded-[24px] border border-theme-border bg-theme-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-theme-border bg-theme-surface text-left">
                <th className="px-4 py-3 font-semibold text-theme-text-secondary">Module</th>
                <th className="hidden px-4 py-3 font-semibold text-theme-text-secondary md:table-cell">Code</th>
                <th className="px-4 py-3 font-semibold text-theme-text-secondary">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-theme-border">
              {filtered.map((m) => (
                <tr key={m.id} className="hover:bg-theme-surface">
                  <td className="px-4 py-3 font-medium text-white">{m.name}</td>
                  <td className="hidden px-4 py-3 font-mono text-xs text-theme-text-secondary md:table-cell">{m.code}</td>
                  <td className="px-4 py-3 text-theme-text-secondary">{m.description ?? <span className="italic text-theme-text-secondary">-</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filtered.length === 0 && rows.length > 0 ? <p className="text-center text-sm text-theme-text-secondary">Aucun resultat pour cette recherche.</p> : null}
    </div>
  );
}

/** Modules assignes + progression (formateurs / enseignants). */
function FormateurModulesSection() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [drafts, setDrafts] = useState<Record<number, { progression: number; sessionLocal?: string }>>({});

  const query = useQuery({
    queryKey: ['my-modules', user?.id],
    queryFn: () => modulesApi.myModules(),
    enabled: Boolean(user?.id),
  });

  useEffect(() => {
    if (query.error) {
      toast.error(getApiErrorMessage(query.error, 'Erreur lors du chargement de vos modules.'));
    }
  }, [query.error]);

  const [prevModules, setPrevModules] = useState(query.data?.modules);

  if (query.data?.modules !== prevModules) {
    setPrevModules(query.data?.modules);
    const rows = query.data?.modules ?? [];
    setDrafts((prev) => {
      const next = { ...prev };
      for (const m of rows) {
        if (!next[m.id]) {
          next[m.id] = {
            progression: m.progress.progression,
            sessionLocal: localDatetimeValueFromIso(m.progress.last_session),
          };
        }
      }
      return next;
    });
  }

  const filteredModules = useMemo(() => {
    const rows = query.data?.modules ?? [];
    const q = searchQuery.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((m) => {
      const filiereLabel = m.filiere?.label?.toLowerCase() ?? '';
      return m.label.toLowerCase().includes(q) || m.code.toLowerCase().includes(q) || filiereLabel.includes(q);
    });
  }, [query.data?.modules, searchQuery]);

  const mutation = useMutation({
    mutationFn: ({
      moduleId,
      progression,
      last_session,
    }: {
      moduleId: number;
      progression: number;
      last_session?: string | null;
    }) =>
      modulesApi.updateModuleProgress(moduleId, {
        progression,
        last_session: last_session ?? undefined,
      }),
    onSuccess: (updated) => {
      queryClient.setQueryData(['my-modules', user?.id], (old: MyModulesPayload | undefined) => {
        if (!old) return old;
        return {
          ...old,
          modules: old.modules.map((m) => (m.id === updated.id ? { ...m, ...updated } : m)),
        };
      });
      setDrafts((prev) => ({
        ...prev,
        [updated.id]: {
          progression: updated.progress.progression,
          sessionLocal: localDatetimeValueFromIso(updated.progress.last_session),
        },
      }));
      toast.success('Progression enregistree.');
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, "Impossible d'enregistrer la progression."));
    },
  });

  const academicYear = query.data?.meta?.academic_year as number | undefined;

  if (query.isLoading) {
    return <TeacherModulesTableSkeleton />;
  }

  if ((query.data?.modules?.length ?? 0) === 0) {
    return (
      <div className="flex min-h-[360px] flex-col items-center justify-center rounded-[28px] border border-dashed border-theme-border bg-theme-card px-6 py-16 text-center">
        <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-700/30">
          <ClipboardList className="h-8 w-8 text-theme-text-secondary" />
        </div>
        <h3 className="mb-2 text-lg font-bold text-theme-text-primary">Aucun module assigne</h3>
        <p className="max-w-md text-sm text-theme-text-secondary">
          {academicYear === 0 || academicYear === undefined
            ? "Aucune annee scolaire active n'a ete trouvee. Verifiez la configuration des annees scolaires."
            : "Vous n'avez pas encore de modules pour l'annee en cours. Les affectations sont gerees par l'administration."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {typeof academicYear === 'number' && academicYear > 0 ? (
        <p className="text-xs text-theme-text-secondary">
          Annee scolaire referencee cote serveur : <span className="font-medium text-theme-text-secondary">{academicYear}</span>
        </p>
      ) : null}

      <div className="relative w-full sm:w-96">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-theme-text-secondary" />
        <Input
          placeholder="Filtrer par module, code ou filiere..."
          className="h-10 w-full pl-10 pr-4"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          aria-label="Rechercher dans les modules enseignant"
        />
      </div>

      <div className="overflow-hidden rounded-[24px] border border-theme-border bg-theme-card">
        <div className="overflow-x-auto">
          <table className="min-w-[720px] text-sm">
            <thead className="border-b border-theme-border bg-theme-surface text-theme-text-secondary">
              <tr>
                <th className="px-4 py-3 font-semibold">Module</th>
                <th className="px-4 py-3 font-semibold">Filiere</th>
                <th className="w-[220px] px-4 py-3 font-semibold">Progression</th>
                <th className="whitespace-nowrap px-4 py-3 font-semibold">Derniere seance</th>
                <th className="w-[200px] px-4 py-3 font-semibold">Mise a jour</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-theme-border">
              {filteredModules.map((m) => {
                const draft = drafts[m.id] ?? {
                  progression: m.progress.progression,
                  sessionLocal: localDatetimeValueFromIso(m.progress.last_session),
                };
                const pct = draft.progression;
                const saving = mutation.isPending && mutation.variables?.moduleId === m.id;

                return (
                  <tr key={m.id} className="transition-colors hover:bg-blue-500/10">
                    <td className="px-4 py-4 align-top">
                      <div className="font-semibold text-white">{m.label}</div>
                      <div className="mt-1 flex flex-wrap gap-2 text-xs text-theme-text-secondary">
                        {m.code ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-2 py-0.5 text-indigo-300">
                            <Hash className="h-3 w-3" />
                            {m.code}
                          </span>
                        ) : null}
                        {m.semester ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-sky-500/20 bg-sky-500/10 px-2 py-0.5 font-medium text-sky-300">
                            {m.semester}
                          </span>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-4 py-4 align-top text-theme-text-secondary">
                      {m.filiere?.label ?? '-'}
                      {m.filiere?.code ? <span className="mt-0.5 block text-xs text-theme-text-secondary">{m.filiere.code}</span> : null}
                    </td>
                    <td className="px-4 py-4 align-top">
                      <div className="mb-2 flex items-center gap-3">
                        <input
                          type="range"
                          min={0}
                          max={100}
                          value={pct}
                          onChange={(e) =>
                            setDrafts((prev) => ({
                              ...prev,
                              [m.id]: {
                                ...draft,
                                progression: Number(e.target.value),
                              },
                            }))
                          }
                          className="h-2 flex-1 cursor-pointer accent-blue-600"
                          aria-label={`Progression ${m.label}`}
                        />
                        <span className="w-10 text-right font-medium tabular-nums text-theme-text-primary">{pct}%</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-theme-surface">
                        <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-300" style={{ width: `${pct}%` }} />
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 align-top text-theme-text-secondary">{formatLastSession(m.progress.last_session)}</td>
                    <td className="space-y-2 px-4 py-4 align-top">
                      <Input
                        type="datetime-local"
                        className="h-9 text-xs"
                        value={draft.sessionLocal ?? ''}
                        onChange={(e) =>
                          setDrafts((prev) => ({
                            ...prev,
                            [m.id]: { ...draft, sessionLocal: e.target.value },
                          }))
                        }
                      />
                      <p className="text-[11px] leading-snug text-theme-text-secondary">Laisser vide pour utiliser la date du serveur a l'enregistrement.</p>
                      <Button
                        type="button"
                        size="sm"
                        className="w-full sm:w-auto"
                        isLoading={saving}
                        onClick={() =>
                          mutation.mutate({
                            moduleId: m.id,
                            progression: draft.progression,
                            last_session: localDatetimeToIso(draft.sessionLocal ?? ''),
                          })
                        }
                      >
                        Enregistrer
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {filteredModules.length === 0 && (query.data?.modules?.length ?? 0) > 0 ? (
        <p className="py-6 text-center text-sm text-theme-text-secondary">Aucun resultat pour cette recherche.</p>
      ) : null}
    </div>
  );
}

export default function ModulesPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFiliere, setSelectedFiliere] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');
  const [selectedType, setSelectedType] = useState('');

  const isTeacherScope = user?.role === 'teacher' || user?.role === 'formateur';
  const isStudentScope = user?.role === 'student' || user?.role === 'stagiaire';

  const { data: filieres = [], isLoading, error } = useQuery({
    queryKey: ['modules-academic-catalog', user?.id, user?.role],
    queryFn: () => modulesApi.academicCatalog(),
    enabled: Boolean(user?.id) && !isTeacherScope && !isStudentScope,
  });

  useEffect(() => {
    if (error) {
      toast.error(getApiErrorMessage(error, 'Erreur chargement des modules.'));
    }
  }, [error]);

  const filiereOptions = useMemo(
    () =>
      filieres.map((filiere) => ({
        value: filiere.code,
        label: `${filiere.code} - ${filiere.label}`,
      })),
    [filieres],
  );

  const typeOptions = useMemo(() => {
    const types = Array.from(new Set(filieres.map((filiere) => filiere.type).filter(Boolean)));
    return types.map((type) => ({ value: type, label: type }));
  }, [filieres]);

  const levelOptions = useMemo(() => {
    const levels = new Set<string>();
    filieres.forEach((filiere) => {
      (filiere.modules ?? []).forEach((module) => {
        const level = module.niveau ?? module.semester;
        if (level) levels.add(level);
      });
    });
    return Array.from(levels).sort().map((level) => ({ value: level, label: level }));
  }, [filieres]);

  const filteredFilieres = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return filieres.reduce<AcademicCatalogFiliere[]>((acc, filiere) => {
      if (selectedFiliere && filiere.code !== selectedFiliere) return acc;
      if (selectedType && filiere.type !== selectedType) return acc;

      const sourceModules = Array.isArray(filiere.modules) ? filiere.modules : [];
      const filteredModules = sourceModules.filter((module) => {
        const matchesLevel = !selectedLevel || (module.niveau ?? module.semester ?? '') === selectedLevel;
        const matchesSearch =
          !q ||
          filiere.label.toLowerCase().includes(q) ||
          filiere.code.toLowerCase().includes(q) ||
          filiere.type.toLowerCase().includes(q) ||
          module.label.toLowerCase().includes(q) ||
          module.code.toLowerCase().includes(q) ||
          (module.niveau ?? '').toLowerCase().includes(q) ||
          (module.semester ?? '').toLowerCase().includes(q);

        return matchesLevel && matchesSearch;
      });

      if (filteredModules.length > 0) {
        acc.push({
          ...filiere,
          modules: filteredModules,
        });
      }

      return acc;
    }, []);
  }, [filieres, searchQuery, selectedFiliere, selectedLevel, selectedType]);

  const totalCatalogModules = useMemo(
    () => filieres.reduce((sum, filiere) => sum + (filiere.modules?.length ?? 0), 0),
    [filieres],
  );
  const totalCatalogLevels = useMemo(() => {
    const levels = new Set<string>();
    filieres.forEach((filiere) => {
      (filiere.modules ?? []).forEach((module) => {
        const level = module.niveau ?? module.semester;
        if (level) levels.add(level);
      });
    });
    return levels.size;
  }, [filieres]);
  const totalModules = useMemo(
    () => filteredFilieres.reduce((sum, filiere) => sum + filiere.modules.length, 0),
    [filteredFilieres],
  );
  const maxModules = useMemo(
    () => Math.max(0, ...filteredFilieres.map((filiere) => filiere.modules.length)),
    [filteredFilieres],
  );

  const activeFilters = useMemo(() => {
    const items: string[] = [];
    if (searchQuery.trim()) items.push(`Search: ${searchQuery.trim()}`);
    if (selectedFiliere) {
      const label = filiereOptions.find((option) => option.value === selectedFiliere)?.label ?? selectedFiliere;
      items.push(`Filiere: ${label}`);
    }
    if (selectedLevel) items.push(`Niveau: ${selectedLevel}`);
    if (selectedType) items.push(`Type: ${selectedType}`);
    return items;
  }, [filiereOptions, searchQuery, selectedFiliere, selectedLevel, selectedType]);

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedFiliere('');
    setSelectedLevel('');
    setSelectedType('');
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-12">
      <div>
        <h2 className="sr-only">{t('nav.modules', 'Modules')}</h2>
      </div>

      {isTeacherScope ? (
        <div className="space-y-4">
          <div>
            <h1 className="text-2xl font-bold text-theme-text-primary">{t('nav.modules', 'Modules')}</h1>
            <p className="mt-1 text-sm text-theme-text-secondary">
              Modules qui vous sont assignes : suivez la progression pedagogique et la derniere seance enregistree.
            </p>
          </div>
          <FormateurModulesSection />
        </div>
      ) : isStudentScope ? (
        <div className="space-y-4">
          <div>
            <h1 className="text-2xl font-bold text-theme-text-primary">{t('nav.modules', 'Modules')}</h1>
            <p className="mt-1 text-sm text-theme-text-secondary">Liste officielle des modules de votre filiere en consultation seule.</p>
          </div>
          <StagiaireModulesSection />
        </div>
      ) : (
        <>
          <CatalogHero
            totalModules={totalCatalogModules}
            totalFilieres={filieres.length}
            totalLevels={totalCatalogLevels}
          />

          <section className="rounded-[28px] border border-theme-border bg-theme-card p-5 shadow-[0_20px_50px_rgba(2,6,23,0.28)] sm:p-6">
            <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-theme-text-secondary">Discover and refine</p>
                <h2 className="mt-2 text-xl font-bold text-theme-text-primary">Search, filters, and active context</h2>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-theme-border bg-theme-surface px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-theme-text-secondary">
                <SlidersHorizontal className="h-4 w-4 text-[#9dc0ff]" />
                {totalModules} visible modules
              </div>
            </div>

            <div className="grid gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,0.75fr)]">
              <SearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search by module, code, level, filiere, or type..."
              />
              <div className="grid gap-4 sm:grid-cols-3">
                <FilterSelect
                  label="Filiere"
                  value={selectedFiliere}
                  onChange={setSelectedFiliere}
                  options={[{ value: '', label: 'All filieres' }, ...filiereOptions]}
                />
                <FilterSelect
                  label="Niveau"
                  value={selectedLevel}
                  onChange={setSelectedLevel}
                  options={[{ value: '', label: 'All levels' }, ...levelOptions]}
                />
                <FilterSelect
                  label="Type"
                  value={selectedType}
                  onChange={setSelectedType}
                  options={[{ value: '', label: 'All types' }, ...typeOptions]}
                />
              </div>
            </div>

            <div className="mt-4">
              <ActiveFilters items={activeFilters} onClear={clearFilters} />
            </div>
          </section>

          {!isLoading && filteredFilieres.length > 0 ? (
            <div className="flex flex-wrap items-center gap-3 text-sm text-theme-text-secondary">
              <span className="rounded-full border border-[#4f8ef7]/25 bg-[#4f8ef7]/10 px-3 py-1.5 font-medium text-[#d8e6ff]">
                {totalModules} module{totalModules !== 1 ? 's' : ''}
              </span>
              <span className="rounded-full border border-theme-border bg-theme-surface px-3 py-1.5 font-medium text-theme-text-secondary">
                {filteredFilieres.length} filiere{filteredFilieres.length !== 1 ? 's' : ''}
              </span>
            </div>
          ) : null}

          {isLoading ? (
            <div className="space-y-4">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
          ) : filteredFilieres.length === 0 ? (
            <EmptyCatalogState hasSearch={activeFilters.length > 0} />
          ) : (
            <div className="space-y-5">
              {filteredFilieres.map((filiere) => (
                <FiliereCard key={filiere.code} filiere={filiere} maxModules={maxModules} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

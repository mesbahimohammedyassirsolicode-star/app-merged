import type { QueryClient } from '@tanstack/react-query';
import type { Module } from '../../../../api/api/modules';
import type { Groupe } from '../../../../api/api/groups';
import { groupsApi } from '../../../../api/api/groups';
import { modulesApi } from '../../../../api/api/modules';
import { parentApi } from '../../../../api/api/parent';
import { queryKeys } from '../../../../lib/query-keys';
import { userService } from '../../../../api/userService';
import type { User } from '../../../../types/auth';
import type {
  CopilotEntityLoadContext,
  EntityRegistries,
  GroupRegistryRow,
  ModuleRegistryRow,
  StudentRegistryRow,
  TeacherRegistryRow,
} from '../contracts';

function mapModule(m: Module): ModuleRegistryRow {
  return {
    id: m.id,
    code: m.code,
    label: m.label,
    filiereId: m.filiere_id,
    filiereLabel: m.filiere?.label,
  };
}

function mapGroup(g: Groupe): GroupRegistryRow {
  return {
    id: g.id,
    label: g.label || g.name || `Group #${g.id}`,
    filiereId: g.filiere_id,
    filiereLabel: g.filiere?.label,
  };
}

function usersToStudents(users: User[]): StudentRegistryRow[] {
  const rows: StudentRegistryRow[] = [];
  for (const u of users) {
    if (!u.stagiaire) continue;
    rows.push({
      stagiaireId: u.stagiaire.id,
      userId: u.id,
      name: u.name,
    });
  }
  return rows;
}

function usersToTeachers(users: User[]): TeacherRegistryRow[] {
  return users.map((u) => ({
    userId: u.id,
    name: u.name,
    role: u.role,
  }));
}

async function loadModules(queryClient: QueryClient, ctx: CopilotEntityLoadContext): Promise<ModuleRegistryRow[]> {
  if (ctx.copilotScope === 'teacher') {
    const rows = await queryClient.fetchQuery({
      queryKey: queryKeys.entities.modulesTrainer(),
      queryFn: () => modulesApi.trainerModules(),
      staleTime: 5 * 60 * 1000,
    });
    return rows.map((m) => ({
      id: m.id,
      code: m.code,
      label: m.label,
    }));
  }

  const list = await queryClient.fetchQuery({
    queryKey: queryKeys.entities.modulesList({}),
    queryFn: () => modulesApi.list(),
    staleTime: 5 * 60 * 1000,
  });
  return list.map(mapModule);
}

async function loadGroups(queryClient: QueryClient, ctx: CopilotEntityLoadContext): Promise<GroupRegistryRow[]> {
  const { items } = await queryClient.fetchQuery({
    queryKey: queryKeys.entities.groupsList({ per_page: 500 }),
    queryFn: () => groupsApi.list({ per_page: 500 }),
    staleTime: 5 * 60 * 1000,
  });
  let rows = items.map(mapGroup);

  if (ctx.copilotScope === 'teacher') {
    const trainer = await queryClient.fetchQuery({
      queryKey: queryKeys.entities.modulesTrainer(),
      queryFn: () => modulesApi.trainerModules(),
      staleTime: 5 * 60 * 1000,
    });
    const allowed = new Set<number>();
    for (const m of trainer) {
      for (const g of m.groups ?? []) {
        allowed.add(g.id);
      }
    }
    rows = rows.filter((g) => allowed.has(g.id));
  }

  return rows;
}

async function loadStudents(queryClient: QueryClient, ctx: CopilotEntityLoadContext): Promise<StudentRegistryRow[]> {
  if (ctx.copilotScope === 'parent') {
    try {
      const children = await queryClient.fetchQuery({
        queryKey: queryKeys.entities.parentStagiaires(),
        queryFn: () => parentApi.getChildren(),
        staleTime: 5 * 60 * 1000,
      });
      return children.map((c) => ({
        stagiaireId: c.id,
        userId: c.user?.id ?? 0,
        name: c.user?.name ?? `Stagiaire #${c.id}`,
      }));
    } catch {
      return [];
    }
  }

  try {
    const [stagiaires, students] = await Promise.all([
      queryClient.fetchQuery({
        queryKey: queryKeys.entities.usersByRole('stagiaire'),
        queryFn: async () => (await userService.getAll('stagiaire')).data,
        staleTime: 5 * 60 * 1000,
      }),
      queryClient.fetchQuery({
        queryKey: queryKeys.entities.usersByRole('student'),
        queryFn: async () => (await userService.getAll('student')).data,
        staleTime: 5 * 60 * 1000,
      }),
    ]);

    return usersToStudents([...stagiaires, ...students]);
  } catch {
    return [];
  }
}

async function loadTeachers(queryClient: QueryClient): Promise<TeacherRegistryRow[]> {
  try {
    const [teachers, formateurs] = await Promise.all([
      queryClient.fetchQuery({
        queryKey: queryKeys.entities.usersByRole('teacher'),
        queryFn: async () => (await userService.getAll('teacher')).data,
        staleTime: 5 * 60 * 1000,
      }),
      queryClient.fetchQuery({
        queryKey: queryKeys.entities.usersByRole('formateur'),
        queryFn: async () => (await userService.getAll('formateur')).data,
        staleTime: 5 * 60 * 1000,
      }),
    ]);
    return usersToTeachers([...teachers, ...formateurs]);
  } catch {
    return [];
  }
}

/**
 * Loads scoped entity corpora through React Query (cache reuse, shared invalidation later).
 */
export async function loadEntityRegistries(
  queryClient: QueryClient,
  ctx: CopilotEntityLoadContext
): Promise<EntityRegistries> {
  const [modules, groups, students, teachers] = await Promise.all([
    loadModules(queryClient, ctx),
    loadGroups(queryClient, ctx),
    loadStudents(queryClient, ctx),
    ctx.copilotScope === 'parent' ? Promise.resolve([] as TeacherRegistryRow[]) : loadTeachers(queryClient),
  ]);

  return { modules, groups, students, teachers };
}

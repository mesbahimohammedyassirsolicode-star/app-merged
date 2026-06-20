import type { CopilotIntent } from '../../contracts';
import type { EntityRegistries, EntityResolutionResult, EntitySlotResult } from '../contracts';
import { resolveGroupEntity } from './resolveGroupEntity';
import { resolveModuleEntity, resolveModuleEntityByCode } from './resolveModuleEntity';
import { resolveStudentEntity } from './resolveStudentEntity';
import { resolveTeacherEntity } from './resolveTeacherEntity';

function collectTraces(slots: Record<string, EntitySlotResult>): EntityResolutionResult['traces'] {
  const traces: EntityResolutionResult['traces'] = [];
  for (const slot of Object.values(slots)) {
    if (slot.status === 'resolved') {
      traces.push(slot.trace);
    }
  }
  return traces;
}

/**
 * Runs deterministic resolvers per intent. Does not mutate the intent — caller merges IDs into filters.
 */
export function resolveEntitiesForCopilotIntent(
  intent: CopilotIntent,
  registries: EntityRegistries
): EntityResolutionResult {
  const slots: Record<string, EntitySlotResult> = {};
  const { entityMentions } = intent;

  if (entityMentions.moduleCode) {
    slots.module = resolveModuleEntityByCode(entityMentions.moduleCode, registries.modules);
  } else if (entityMentions.moduleRaw) {
    slots.module = resolveModuleEntity(entityMentions.moduleRaw, registries.modules);
  } else {
    slots.module = { status: 'skipped', reason: 'not_applicable' };
  }

  if (entityMentions.groupA) {
    const cleanedA = entityMentions.groupA.replace(/^(groupe|group)\s+/i, '').trim();
    slots.groupA = resolveGroupEntity(cleanedA || entityMentions.groupA, registries.groups);
  } else {
    slots.groupA = { status: 'skipped', reason: 'not_applicable' };
  }

  if (entityMentions.groupB) {
    const cleanedB = entityMentions.groupB.replace(/^(groupe|group)\s+/i, '').trim();
    slots.groupB = resolveGroupEntity(cleanedB || entityMentions.groupB, registries.groups);
  } else {
    slots.groupB = { status: 'skipped', reason: 'not_applicable' };
  }

  if (entityMentions.studentRaw) {
    slots.student = resolveStudentEntity(entityMentions.studentRaw, registries.students);
  } else {
    slots.student = { status: 'skipped', reason: 'not_applicable' };
  }

  if (entityMentions.teacherRaw) {
    slots.teacher = resolveTeacherEntity(entityMentions.teacherRaw, registries.teachers);
  } else {
    slots.teacher = { status: 'skipped', reason: 'not_applicable' };
  }

  return { slots, traces: collectTraces(slots) };
}

export function getEntityResolutionBlocker(
  intent: CopilotIntent,
  result: EntityResolutionResult
): EntitySlotResult | null {
  const { slots } = result;
  const m = intent.entityMentions;

  if (intent.name === 'compare_groups') {
    if (slots.groupA.status !== 'resolved') return slots.groupA;
    if (slots.groupB.status !== 'resolved') return slots.groupB;
  }

  if (m.moduleCode || m.moduleRaw) {
    if (slots.module.status !== 'resolved') return slots.module;
  }

  if (m.studentRaw && intent.name === 'students_at_risk') {
    if (slots.student.status !== 'resolved') return slots.student;
  }

  if (m.teacherRaw) {
    if (slots.teacher.status !== 'resolved') return slots.teacher;
  }

  return null;
}

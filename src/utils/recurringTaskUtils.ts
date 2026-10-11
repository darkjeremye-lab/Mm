import { DayOfWeek, DAYS_OF_WEEK, RecurrenceFrequency, TaskItem, TaskPriority, TaskRecurrence } from '../types';

export interface RecurringTaskTemplate {
  id: string; // unique template id
  text: string;
  priority?: TaskPriority;
  duration?: string;
  frequency: RecurrenceFrequency;
  customDays?: DayOfWeek[]; // for 'custom'
  originDay?: DayOfWeek; // for 'weekly'
  createdAt: number;
}

const RECURRING_TEMPLATES_KEY = 'mw_luxury_recurring_templates';

export function loadRecurringTemplates(): RecurringTaskTemplate[] {
  try {
    const saved = localStorage.getItem(RECURRING_TEMPLATES_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('[RecurringTasks] Failed to load templates:', e);
  }
  return [];
}

export function saveRecurringTemplates(templates: RecurringTaskTemplate[]): void {
  try {
    localStorage.setItem(RECURRING_TEMPLATES_KEY, JSON.stringify(templates));
  } catch (e) {
    console.error('[RecurringTasks] Failed to save templates:', e);
  }
}

export function removeRecurringTemplate(templateId: string): void {
  const templates = loadRecurringTemplates();
  const filtered = templates.filter((t) => t.id !== templateId);
  saveRecurringTemplates(filtered);
}

/**
 * Returns which days of the week a recurrence rule targets
 */
export function getTargetDaysForRecurrence(
  frequency: RecurrenceFrequency,
  originDay: DayOfWeek = 'Mon',
  customDays?: DayOfWeek[]
): DayOfWeek[] {
  switch (frequency) {
    case 'daily':
      return [...DAYS_OF_WEEK];
    case 'weekdays':
      return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
    case 'weekly':
      return [originDay];
    case 'custom':
      return customDays && customDays.length > 0 ? customDays : [originDay];
    default:
      return [originDay];
  }
}

/**
 * Synchronizes templates with a week's tasks without creating duplicates
 * Preserves completed status of existing tasks
 */
export function populateRecurringTasksForWeek(
  existingTasksByDay: Record<DayOfWeek, TaskItem[]>,
  templates: RecurringTaskTemplate[] = loadRecurringTemplates()
): Record<DayOfWeek, TaskItem[]> {
  if (templates.length === 0) return existingTasksByDay;

  const updated: Record<DayOfWeek, TaskItem[]> = {
    Mon: [...(existingTasksByDay.Mon || [])],
    Tue: [...(existingTasksByDay.Tue || [])],
    Wed: [...(existingTasksByDay.Wed || [])],
    Thu: [...(existingTasksByDay.Thu || [])],
    Fri: [...(existingTasksByDay.Fri || [])],
    Sat: [...(existingTasksByDay.Sat || [])],
    Sun: [...(existingTasksByDay.Sun || [])],
  };

  let hasChanges = false;

  templates.forEach((tpl) => {
    const originDay = tpl.originDay || 'Mon';
    const targetDays = getTargetDaysForRecurrence(tpl.frequency, originDay, tpl.customDays);

    targetDays.forEach((day) => {
      const dayTasks = updated[day] || [];
      // Check if an occurrence for this template already exists in this day
      const alreadyExists = dayTasks.some(
        (t) =>
          t.recurrence?.sourceTaskId === tpl.id ||
          t.id.includes(tpl.id) ||
          (t.text.trim().toLowerCase() === tpl.text.trim().toLowerCase() &&
            t.recurrence?.frequency === tpl.frequency)
      );

      if (!alreadyExists) {
        const occurrence: TaskItem = {
          id: `${day.toLowerCase()}-rec-${tpl.id}-${Date.now().toString(36).substring(4)}`,
          text: tpl.text,
          completed: false,
          priority: tpl.priority || 'medium',
          duration: tpl.duration,
          recurrence: {
            frequency: tpl.frequency,
            days: tpl.customDays,
            sourceTaskId: tpl.id,
          },
          createdAt: tpl.createdAt,
        };
        updated[day].push(occurrence);
        hasChanges = true;
      }
    });
  });

  return hasChanges ? updated : existingTasksByDay;
}

export const activityStatuses = ['pending', 'in_progress', 'completed', 'postponed', 'cancelled'] as const
export const activityPriorities = ['low', 'medium', 'high', 'urgent'] as const
export type ActivityStatus = typeof activityStatuses[number]
export type ActivityPriority = typeof activityPriorities[number]
export interface ActivityWrite { title: string; subject_id: number; deadline: string; priority: ActivityPriority; status: ActivityStatus; estimated_duration: number; notes: string | null }
export interface Activity extends ActivityWrite { id: number; original_deadline: string; deadline_revision: number; created_at: string; updated_at: string }
export interface ActivityList { items: Activity[]; next_after_id: number | null }
export interface DeadlineEvent { revision: number; previous_deadline: string; new_deadline: string; event_type: 'postponed' | 'rescheduled'; occurred_at: string }
export interface DeadlineHistory { items: DeadlineEvent[]; next_after_revision: number | null }
export interface ActivityFilters { subject_id?: number; status?: ActivityStatus; priority?: ActivityPriority; deadline?: string; deadline_from?: string; deadline_to?: string }

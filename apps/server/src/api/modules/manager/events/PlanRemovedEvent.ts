/**
 * PlanRemovedEvent
 *
 * Emitted when a plan is removed by a super admin.
 */
export class PlanRemovedEvent {
  constructor(
    public readonly planId: string,
    public readonly removedBy: string,
  ) {}
}

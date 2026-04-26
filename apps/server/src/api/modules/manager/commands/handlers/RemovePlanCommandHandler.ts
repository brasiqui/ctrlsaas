import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { RemovePlanCommand } from '../RemovePlanCommand';
import { PlanRemovedEvent } from '../../events/PlanRemovedEvent';
import { ManagerPlanService } from '../../manager-plan.service';
import { ILoggerService } from '@fnd/contracts';

@CommandHandler(RemovePlanCommand)
export class RemovePlanCommandHandler implements ICommandHandler<RemovePlanCommand, void> {
  constructor(
    private readonly planService: ManagerPlanService,
    @Inject('ILoggerService') private readonly logger: ILoggerService,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: RemovePlanCommand): Promise<void> {
    this.logger.info('Removing plan', {
      operation: 'manager.remove_plan.start',
      module: 'RemovePlanCommandHandler',
      planId: command.planId,
    });

    await this.planService.removePlan(command.planId, command.userId);

    // Emitir evento para auditoria
    const event = new PlanRemovedEvent(command.planId, command.userId);
    this.eventBus.publish(event);

    this.logger.info('Plan removed successfully', {
      operation: 'manager.remove_plan.success',
      module: 'RemovePlanCommandHandler',
      planId: command.planId,
    });
  }
}

import { Injectable, Inject, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { Kysely } from 'kysely';
import { Database, IPaymentProviderMappingRepository } from '@fnd/database';
import { Plan, PlanPrice, PaymentProvider } from '@fnd/domain';
import { ILoggerService, IPaymentGatewayFactory } from '@fnd/contracts';
import { PlanResponseDto, PlanPriceResponseDto, CreatePlanDto, UpdatePlanDto, CreatePlanPriceDto, UpdatePlanPriceDto } from './dtos';
import { LinkPriceMappingInput } from './commands/LinkGatewayPlanCommand';

/**
 * ManagerPlanService
 *
 * Service for managing plans and plan prices from the manager panel.
 * Handles CRUD operations, Stripe validation, and activation logic.
 */
@Injectable()
export class ManagerPlanService {
  constructor(
    @Inject('DATABASE') private readonly db: Kysely<Database>,
    @Inject('ILoggerService') private readonly logger: ILoggerService,
    @Inject('IPaymentGatewayFactory') private readonly gatewayFactory: IPaymentGatewayFactory,
    @Inject('IPaymentProviderMappingRepository')
    private readonly mappingRepo: IPaymentProviderMappingRepository,
  ) {}

  /**
   * Get all plans with their prices
   */
  async getAllPlans(): Promise<PlanResponseDto[]> {
    const plans = await this.db
      .selectFrom('plans')
      .leftJoin('products', 'plans.product_id', 'products.id')
      .select([
        'plans.id',
        'plans.code',
        'plans.name',
        'plans.description',
        'plans.product_id',
        'plans.features',
        'plans.is_active',
        'plans.created_at',
        'plans.updated_at',
        'products.id as product_id',
        'products.code as product_code',
        'products.name as product_name',
      ])
      .orderBy('plans.created_at', 'asc')
      .execute();

    return Promise.all(plans.map(async (plan) => {
      const prices = await this.getPlanPrices(plan.id);
      return this.mapPlanToDto(plan, prices);
    }));
  }

  /**
   * Get plan by ID with prices
   */
  async getPlanById(id: string): Promise<PlanResponseDto> {
    const plan = await this.db
      .selectFrom('plans')
      .leftJoin('products', 'plans.product_id', 'products.id')
      .select((eb) => [
        'plans.id',
        'plans.code',
        'plans.name',
        'plans.description',
        'plans.product_id',
        'plans.features',
        'plans.is_active',
        'plans.created_at',
        'plans.updated_at',
        'products.id as product_id',
        'products.code as product_code',
        'products.name as product_name',
      ])
      .where('plans.id', '=', id)
      .executeTakeFirst();

    if (!plan) {
      throw new NotFoundException(`Plan not found: ${id}`);
    }

    const prices = await this.getPlanPrices(id);
    return this.mapPlanToDto(plan, prices);
  }

  /**
   * Create a new plan (draft mode)
   */
  async createPlan(dto: CreatePlanDto): Promise<PlanResponseDto> {
    const existingPlan = await this.db
      .selectFrom('plans')
      .selectAll()
      .where('code', '=', dto.code)
      .where('product_id', '=', dto.productId)
      .executeTakeFirst();

    if (existingPlan) {
      throw new ConflictException(`Plan with code '${dto.code}' already exists`);
    }

    await this.verifyProductExists(dto.productId);

    const now = new Date();
    const plan = await this.db
      .insertInto('plans')
      .values({
        code: dto.code,
        name: dto.name,
        description: dto.description || null,
        product_id: dto.productId,
        features: dto.features as any,
        is_active: false,
        created_at: now,
        updated_at: now,
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    this.logger.info('Plan created in draft mode', {
      operation: 'manager.create_plan',
      module: 'ManagerPlanService',
      planId: plan.id,
      code: dto.code,
      productId: dto.productId,
    });

    return this.mapPlanToDto(plan, []);
  }

  /**
   * Update plan details
   */
  async updatePlan(id: string, dto: UpdatePlanDto): Promise<PlanResponseDto> {
    const now = new Date();
    const updateData: any = { updated_at: now };

    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.features !== undefined) updateData.features = dto.features;
    if (dto.productId !== undefined) {
      await this.verifyProductExists(dto.productId);
      updateData.product_id = dto.productId;
    }

    const plan = await this.db
      .updateTable('plans')
      .set(updateData)
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirst();

    if (!plan) {
      throw new NotFoundException(`Plan not found: ${id}`);
    }

    this.logger.info('Plan updated', {
      operation: 'manager.update_plan',
      module: 'ManagerPlanService',
      planId: id,
    });

    const prices = await this.getPlanPrices(id);
    return this.mapPlanToDto(plan, prices);
  }

  private async verifyProductExists(productId: string): Promise<void> {
    const product = await this.db
      .selectFrom('products')
      .select(['id'])
      .where('id', '=', productId)
      .executeTakeFirst();

    if (!product) {
      throw new NotFoundException(`Product not found: ${productId}`);
    }
  }

  /**
   * Activate plan (validates Stripe ID exists)
   */
  async activatePlan(id: string): Promise<void> {
    const plan = await this.db
      .selectFrom('plans')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();

    if (!plan) {
      throw new NotFoundException(`Plan not found: ${id}`);
    }

    // TODO (F0004 Feature 4): Check payment_provider_mappings for at least one active gateway link
    // For now, allow activation without gateway mapping

    await this.db
      .updateTable('plans')
      .set({ is_active: true, updated_at: new Date() })
      .where('id', '=', id)
      .execute();

    this.logger.info('Plan activated', {
      operation: 'manager.activate_plan',
      module: 'ManagerPlanService',
      planId: id,
    });
  }

  /**
   * Deactivate plan
   */
  async deactivatePlan(id: string): Promise<void> {
    const plan = await this.db
      .selectFrom('plans')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();

    if (!plan) {
      throw new NotFoundException(`Plan not found: ${id}`);
    }

    await this.db
      .updateTable('plans')
      .set({ is_active: false, updated_at: new Date() })
      .where('id', '=', id)
      .execute();

    this.logger.info('Plan deactivated', {
      operation: 'manager.deactivate_plan',
      module: 'ManagerPlanService',
      planId: id,
    });
  }

/**
 * Remove plan definitivamente
 */
async removePlan(id: string, removedBy: string): Promise<void> {
  const plan = await this.db
    .selectFrom('plans')
    .selectAll()
    .where('id', '=', id)
    .executeTakeFirst();

  if (!plan) {
    throw new NotFoundException(`Plan not found: ${id}`);
  }

  // Verificar se há assinaturas ativas vinculadas a preços deste plano
  const activeSubscriptions = await this.db
    .selectFrom('subscriptions')
    .innerJoin('plan_prices', 'subscriptions.plan_price_id', 'plan_prices.id')
    .where('plan_prices.plan_id', '=', id)
    .where('subscriptions.status', '=', 'active')
    .execute();

  if (activeSubscriptions.length > 0) {
    throw new BadRequestException(
      `Cannot remove plan ${id}: active subscriptions exist`
    );
  }

  // Buscar preços do plano
  const prices = await this.db
    .selectFrom('plan_prices')
    .select(['id'])
    .where('plan_id', '=', id)
    .execute();

  // Remover mappings de cada preço
  for (const price of prices) {
    await this.mappingRepo.deactivateByEntity('plan_price', price.id);
    this.logger.info('Plan price mapping removed', {
      operation: 'manager.remove_plan_price_mapping',
      module: 'ManagerPlanService',
      planId: id,
      priceId: price.id,
      removedBy,
    });
  }

  // Remover mappings do plano
  await this.mappingRepo.deactivateByEntity('plan', id);
  this.logger.info('Plan mapping removed', {
    operation: 'manager.remove_plan_mapping',
    module: 'ManagerPlanService',
    planId: id,
    removedBy,
  });

  // Remover preços associados
  await this.db
    .deleteFrom('plan_prices')
    .where('plan_id', '=', id)
    .execute();

  // Remover o plano
  await this.db
    .deleteFrom('plans')
    .where('id', '=', id)
    .execute();

  this.logger.info('Plan removed', {
    operation: 'manager.remove_plan',
    module: 'ManagerPlanService',
    planId: id,
    removedBy,
  });
}


  /**
   * Link a gateway product to a plan using payment_provider_mappings table.
   * Creates entries for the plan and each plan_price mapping provided.
   */
  async linkGatewayPlan(
    planId: string,
    provider: PaymentProvider,
    providerProductId: string,
    providerPriceIds: LinkPriceMappingInput[],
  ): Promise<void> {
    const plan = await this.db
      .selectFrom('plans')
      .select(['id'])
      .where('id', '=', planId)
      .executeTakeFirst();

    if (!plan) {
      throw new NotFoundException(`Plan not found: ${planId}`);
    }

    // Create or replace plan mapping
    const existingPlanMapping = await this.mappingRepo.findByEntityAndProvider(
      'plan',
      planId,
      provider,
    );

    if (existingPlanMapping) {
      await this.mappingRepo.deactivateByEntity('plan', planId);
    }

    await this.mappingRepo.create({
      entityType: 'plan',
      entityId: planId,
      provider,
      providerId: providerProductId,
      isActive: true,
    });

    // Create or replace plan_price mappings
    for (const priceMapping of providerPriceIds) {
      const existingPriceMapping = await this.mappingRepo.findByEntityAndProvider(
        'plan_price',
        priceMapping.planPriceId,
        provider,
      );

      if (existingPriceMapping) {
        await this.mappingRepo.deactivateByEntity('plan_price', priceMapping.planPriceId);
      }

      await this.mappingRepo.create({
        entityType: 'plan_price',
        entityId: priceMapping.planPriceId,
        provider,
        providerId: priceMapping.providerPriceId,
        isActive: true,
      });
    }

    this.logger.info('Gateway plan linked via service', {
      operation: 'manager.link_gateway_plan',
      module: 'ManagerPlanService',
      planId,
      provider,
      providerProductId,
      priceCount: providerPriceIds.length,
    });
  }

  /**
   * Add price to plan
   */
  async createPlanPrice(planId: string, dto: CreatePlanPriceDto): Promise<PlanPriceResponseDto> {
    // Verify plan exists
    const plan = await this.db
      .selectFrom('plans')
      .selectAll()
      .where('id', '=', planId)
      .executeTakeFirst();

    if (!plan) {
      throw new NotFoundException(`Plan not found: ${planId}`);
    }

    const now = new Date();
    const price = await this.db
      .insertInto('plan_prices')
      .values({
        plan_id: planId,
        amount: dto.amount,
        currency: dto.currency,
        interval: dto.interval,
        is_current: false,
        created_at: now,
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    this.logger.info('Plan price created', {
      operation: 'manager.create_plan_price',
      module: 'ManagerPlanService',
      planId,
      priceId: price.id,
    });

    return this.mapPlanPriceToDto(price);
  }

  /**
   * Update plan price
   */
  async updatePlanPrice(planId: string, priceId: string, dto: UpdatePlanPriceDto): Promise<PlanPriceResponseDto> {
    const updateData: any = {};

    if (dto.amount !== undefined) updateData.amount = dto.amount;
    if (dto.isCurrent !== undefined) {
      // If setting this price as current, unset all other prices for this plan
      if (dto.isCurrent) {
        await this.db
          .updateTable('plan_prices')
          .set({ is_current: false })
          .where('plan_id', '=', planId)
          .execute();
      }
      updateData.is_current = dto.isCurrent;
    }

    const price = await this.db
      .updateTable('plan_prices')
      .set(updateData)
      .where('id', '=', priceId)
      .where('plan_id', '=', planId)
      .returningAll()
      .executeTakeFirst();

    if (!price) {
      throw new NotFoundException(`Plan price not found: ${priceId}`);
    }

    this.logger.info('Plan price updated', {
      operation: 'manager.update_plan_price',
      module: 'ManagerPlanService',
      planId,
      priceId,
    });

    return this.mapPlanPriceToDto(price);
  }

  /**
   * Get all prices for a plan
   */
  private async getPlanPrices(planId: string): Promise<any[]> {
    return this.db
      .selectFrom('plan_prices')
      .selectAll()
      .where('plan_id', '=', planId)
      .orderBy('created_at', 'asc')
      .execute();
  }

  /**
   * Map plan to DTO
   */
  private mapPlanToDto(plan: any, prices: any[]): PlanResponseDto {
    return {
      id: plan.id,
      code: plan.code,
      name: plan.name,
      description: plan.description,
      productId: plan.product_id,
      product: plan.product_id
        ? {
            id: plan.product_id,
            code: plan.product_code,
            name: plan.product_name,
          }
        : null,
      features: plan.features,
      isActive: plan.is_active,
      prices: prices.map(this.mapPlanPriceToDto),
      createdAt: new Date(plan.created_at),
      updatedAt: new Date(plan.updated_at),
    };
  }

  /**
   * Map plan price to DTO
   */
  private mapPlanPriceToDto(price: any): PlanPriceResponseDto {
    return {
      id: price.id,
      planId: price.plan_id,
      amount: price.amount,
      currency: price.currency,
      interval: price.interval,
      isCurrent: price.is_current,
      createdAt: new Date(price.created_at),
      updatedAt: new Date(price.created_at), // plan_prices doesn't have updated_at
    };
  }
}

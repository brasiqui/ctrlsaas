import { Plan, PlanPrice } from '@fnd/domain';

export interface PlanWithPrice extends Plan {
  currentPrice?: PlanPrice;
}

export interface PlanWithPriceAndProduct extends Plan {
  currentPrice?: PlanPrice;
  product?: {
    id: string;
    code: string;
    name: string;
  };
}

export interface IPlanRepository {
  findAll(): Promise<Plan[]>;
  findById(id: string): Promise<Plan | null>;
  findByCode(code: string): Promise<Plan | null>;
  findActive(): Promise<Plan[]>;
  findActiveWithCurrentPrices(): Promise<PlanWithPrice[]>;
  findActiveWithCurrentPricesAndProduct(): Promise<PlanWithPriceAndProduct[]>;
  findCurrentPriceByPlanId(planId: string): Promise<PlanPrice | null>;
  create(data: Omit<Plan, 'id' | 'createdAt' | 'updatedAt'>): Promise<Plan>;
  update(id: string, data: Partial<Plan>): Promise<Plan>;
}

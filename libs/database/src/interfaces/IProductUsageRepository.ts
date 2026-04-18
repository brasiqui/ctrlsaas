import { ProductUsage } from '@fnd/domain';

export interface IProductUsageRepository {
  findBySubscriptionProductMetric(
    subscriptionId: string,
    productId: string,
    metric: string,
  ): Promise<ProductUsage | null>;
  create(data: Omit<ProductUsage, 'id' | 'createdAt'>): Promise<ProductUsage>;
  update(id: string, data: Partial<ProductUsage>): Promise<ProductUsage>;
  incrementUsage(
    subscriptionId: string,
    productId: string,
    metric: string,
    usedValue: number,
    limitValue?: number | null,
  ): Promise<ProductUsage>;
}

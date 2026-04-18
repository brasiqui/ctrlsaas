import { Injectable } from '@nestjs/common';
import { Kysely, sql } from 'kysely';
import { ProductUsage } from '@fnd/domain';
import { Database } from '../types';
import { IProductUsageRepository } from '../interfaces';

@Injectable()
export class ProductUsageRepository implements IProductUsageRepository {
  constructor(private db: Kysely<Database>) {}

  async findBySubscriptionProductMetric(
    subscriptionId: string,
    productId: string,
    metric: string,
  ): Promise<ProductUsage | null> {
    const result = await this.db
      .selectFrom('product_usage')
      .selectAll()
      .where('subscription_id', '=', subscriptionId)
      .where('product_id', '=', productId)
      .where('metric', '=', metric)
      .executeTakeFirst();

    if (!result) return null;
    return this.mapToEntity(result);
  }

  async create(data: Omit<ProductUsage, 'id' | 'createdAt'>): Promise<ProductUsage> {
    const now = new Date();
    const result = await this.db
      .insertInto('product_usage')
      .values({
        subscription_id: data.subscriptionId,
        product_id: data.productId,
        metric: data.metric,
        used_value: data.usedValue,
        limit_value: data.limitValue,
        last_updated: data.lastUpdated,
        created_at: now,
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    return this.mapToEntity(result);
  }

  async update(id: string, data: Partial<ProductUsage>): Promise<ProductUsage> {
    const updateData: any = {};

    if (data.subscriptionId !== undefined) updateData.subscription_id = data.subscriptionId;
    if (data.productId !== undefined) updateData.product_id = data.productId;
    if (data.metric !== undefined) updateData.metric = data.metric;
    if (data.usedValue !== undefined) updateData.used_value = data.usedValue;
    if (data.limitValue !== undefined) updateData.limit_value = data.limitValue;
    if (data.lastUpdated !== undefined) updateData.last_updated = data.lastUpdated;

    const result = await this.db
      .updateTable('product_usage')
      .set(updateData)
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirst();

    if (!result) {
      throw new Error(`Product usage not found: ${id}`);
    }

    return this.mapToEntity(result);
  }

  async incrementUsage(
    subscriptionId: string,
    productId: string,
    metric: string,
    usedValue: number,
    limitValue?: number | null,
  ): Promise<ProductUsage> {
    const existing = await this.findBySubscriptionProductMetric(subscriptionId, productId, metric);
    const now = new Date();

    if (existing) {
      const updated = await this.db
        .updateTable('product_usage')
        .set({
          used_value: sql`product_usage.used_value + ${usedValue}`,
          limit_value: limitValue !== undefined ? limitValue : existing.limitValue,
          last_updated: now,
        })
        .where('id', '=', existing.id)
        .returningAll()
        .executeTakeFirst();

      if (!updated) {
        throw new Error(`Failed to update product usage: ${existing.id}`);
      }

      return this.mapToEntity(updated);
    }

    return this.create({
      subscriptionId,
      productId,
      metric,
      usedValue,
      limitValue: limitValue ?? null,
      lastUpdated: now,
    });
  }

  private mapToEntity(row: any): ProductUsage {
    return {
      id: row.id,
      subscriptionId: row.subscription_id,
      productId: row.product_id,
      metric: row.metric,
      usedValue: Number(row.used_value),
      limitValue: row.limit_value !== null ? Number(row.limit_value) : null,
      lastUpdated: new Date(row.last_updated),
      createdAt: new Date(row.created_at),
    };
  }
}

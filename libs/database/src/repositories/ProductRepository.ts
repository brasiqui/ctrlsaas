import { Injectable } from '@nestjs/common';
import { Kysely } from 'kysely';
import { Product } from '@fnd/domain';
import { Database } from '../types';
import { IProductRepository } from '../interfaces';

@Injectable()
export class ProductRepository implements IProductRepository {
  constructor(private db: Kysely<Database>) {}

  async findAll(): Promise<Product[]> {
    const results = await this.db
      .selectFrom('products')
      .selectAll()
      .orderBy('created_at', 'asc')
      .execute();

    return results.map(this.mapToEntity);
  }

  async findById(id: string): Promise<Product | null> {
    const product = await this.db
      .selectFrom('products')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();

    return product ? this.mapToEntity(product) : null;
  }

  async findByCode(code: string): Promise<Product | null> {
    const product = await this.db
      .selectFrom('products')
      .selectAll()
      .where('code', '=', code)
      .executeTakeFirst();

    return product ? this.mapToEntity(product) : null;
  }

  async findActive(): Promise<Product[]> {
    const results = await this.db
      .selectFrom('products')
      .selectAll()
      .where('is_active', '=', true)
      .orderBy('created_at', 'asc')
      .execute();

    return results.map(this.mapToEntity);
  }

  async create(data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> {
    const now = new Date();
    const result = await this.db
      .insertInto('products')
      .values({
        code: data.code,
        name: data.name,
        description: data.description,
        type: data.type,
        is_active: data.isActive,
        created_at: now,
        updated_at: now,
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    return this.mapToEntity(result);
  }

  async update(id: string, data: Partial<Product>): Promise<Product> {
    const now = new Date();
    const updateData: any = {
      updated_at: now,
    };

    if (data.code !== undefined) updateData.code = data.code;
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.isActive !== undefined) updateData.is_active = data.isActive;

    const result = await this.db
      .updateTable('products')
      .set(updateData)
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirst();

    if (!result) {
      throw new Error(`Product not found: ${id}`);
    }

    return this.mapToEntity(result);
  }

  private mapToEntity(row: any): Product {
    return {
      id: row.id,
      code: row.code,
      name: row.name,
      description: row.description,
      type: row.type,
      isActive: row.is_active,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }
}

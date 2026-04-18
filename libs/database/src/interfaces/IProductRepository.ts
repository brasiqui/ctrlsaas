import { Product } from '@fnd/domain';

export interface IProductRepository {
  findAll(): Promise<Product[]>;
  findById(id: string): Promise<Product | null>;
  findByCode(code: string): Promise<Product | null>;
  findActive(): Promise<Product[]>;
  create(data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product>;
  update(id: string, data: Partial<Product>): Promise<Product>;
}

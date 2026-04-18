import { Injectable, Inject, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { IProductRepository } from '@fnd/database';
import { Product } from '@fnd/domain';
import { CreateProductDto, UpdateProductDto } from './dtos';

@Injectable()
export class ManagerProductService {
  constructor(
    @Inject('IProductRepository')
    private readonly productRepository: IProductRepository,
  ) {}

  async getAllProducts(): Promise<Product[]> {
    return this.productRepository.findAll();
  }

  async getProductById(id: string): Promise<Product> {
    const product = await this.productRepository.findById(id);
    if (!product) {
      throw new NotFoundException(`Product not found: ${id}`);
    }
    return product;
  }

  async createProduct(dto: CreateProductDto): Promise<Product> {
    const existing = await this.productRepository.findByCode(dto.code);
    if (existing) {
      throw new ConflictException(`Product with code '${dto.code}' already exists`);
    }

    return this.productRepository.create({
      code: dto.code,
      name: dto.name,
      description: dto.description || null,
      type: dto.type,
      isActive: dto.isActive ?? true,
    });
  }

  async updateProduct(id: string, dto: UpdateProductDto): Promise<Product> {
    const product = await this.productRepository.findById(id);
    if (!product) {
      throw new NotFoundException(`Product not found: ${id}`);
    }

    if (dto.code && dto.code !== product.code) {
      const existing = await this.productRepository.findByCode(dto.code);
      if (existing) {
        throw new ConflictException(`Product with code '${dto.code}' already exists`);
      }
    }

    return this.productRepository.update(id, {
      code: dto.code,
      name: dto.name,
      description: dto.description,
      type: dto.type,
      isActive: dto.isActive,
    });
  }

  async activateProduct(id: string): Promise<void> {
    await this.updateProduct(id, { isActive: true });
  }

  async deactivateProduct(id: string): Promise<void> {
    await this.updateProduct(id, { isActive: false });
  }
}

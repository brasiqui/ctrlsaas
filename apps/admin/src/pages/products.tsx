import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useProducts, useUpdateProduct } from '@/hooks/use-products'
import { ProductCard } from '@/components/features/products/product-card'
import { ProductForm } from '@/components/features/products/product-form'
import type { Product } from '@/types'

export function ProductsPage() {
  const navigate = useNavigate()
  const { data: products, isLoading } = useProducts()
  const updateMutation = useUpdateProduct()

  const [productFormOpen, setProductFormOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | undefined>(undefined)

  const handleViewPlans = (productId: string) => {
    navigate(`/plans?productId=${productId}`)
  }

  const handleCreateProduct = () => {
    setSelectedProduct(undefined)
    setProductFormOpen(true)
  }

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product)
    setProductFormOpen(true)
  }

  const handleActivate = (product: Product) => {
    updateMutation.mutate({ id: product.id, data: { isActive: true } })
  }

  const handleDeactivate = (product: Product) => {
    updateMutation.mutate({ id: product.id, data: { isActive: false } })
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold">Produtos</h1>
          <p className="text-muted-foreground mt-1">
            Gerenciar produtos e suas configuracoes
          </p>
        </div>
        <Button onClick={handleCreateProduct}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Produto
        </Button>
      </div>

      {/* Products Grid */}
      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="border rounded-lg p-6 space-y-4">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ))}
        </div>
      ) : products && products.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onEdit={() => handleEditProduct(product)}
              onActivate={() => handleActivate(product)}
              onDeactivate={() => handleDeactivate(product)}
              onViewPlans={() => handleViewPlans(product.id)}
            />
          ))}
        </div>
      ) : (
        <div className="border rounded-lg p-8 text-center text-muted-foreground">
          Nenhum produto cadastrado. Crie o primeiro produto para começar.
        </div>
      )}

      {/* Dialogs */}
      <ProductForm open={productFormOpen} onOpenChange={setProductFormOpen} product={selectedProduct} />
    </div>
  )
}
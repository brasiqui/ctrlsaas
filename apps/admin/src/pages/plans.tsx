import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { usePlans, useActivatePlan, useDeactivatePlan, useRemovePlan } from '@/hooks/use-plans'
import { useProducts } from '@/hooks/use-products'
import { PlanCard } from '@/components/features/plans/plan-card'
import { PlanForm } from '@/components/features/plans/plan-form'
import { PlanPriceForm } from '@/components/features/plans/plan-price-form'
import { LinkGatewayModal } from '@/components/features/plans/link-gateway-modal'
import type { ManagerPlan } from '@/types'

export function PlansPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const selectedProductId = searchParams.get('productId') ?? ''
  const selectedProductFilterValue = selectedProductId || 'all'

  const { data: plans, isLoading } = usePlans()
  const { data: products } = useProducts()
  const activateMutation = useActivatePlan()
  const deactivateMutation = useDeactivatePlan()
  const removePlanMutation = useRemovePlan()

  const [planFormOpen, setPlanFormOpen] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<ManagerPlan | undefined>(undefined)

  const filteredPlans = selectedProductId
    ? plans?.filter((plan) => plan.productId === selectedProductId)
    : plans

  const selectedProduct = products?.find((product) => product.id === selectedProductId)

  const handleProductFilterChange = (productId: string) => {
    const nextParams = new URLSearchParams(searchParams)

    if (productId && productId !== 'all') {
      nextParams.set('productId', productId)
    } else {
      nextParams.delete('productId')
    }

    setSearchParams(nextParams, { replace: true })
  }

  const [priceFormOpen, setPriceFormOpen] = useState(false)
  const [priceFormPlan, setPriceFormPlan] = useState<ManagerPlan | undefined>(undefined)

  const [linkGatewayOpen, setLinkGatewayOpen] = useState(false)
  const [linkGatewayPlan, setLinkGatewayPlan] = useState<ManagerPlan | undefined>(undefined)

  const handleCreatePlan = () => {
    setSelectedPlan(undefined)
    setPlanFormOpen(true)
  }

  const handleEditPlan = (plan: ManagerPlan) => {
    setSelectedPlan(plan)
    setPlanFormOpen(true)
  }

  const handleAddPrice = (plan: ManagerPlan) => {
    setPriceFormPlan(plan)
    setPriceFormOpen(true)
  }

  const handleLinkGateway = (plan: ManagerPlan) => {
    setLinkGatewayPlan(plan)
    setLinkGatewayOpen(true)
  }

  const handleActivate = (plan: ManagerPlan) => {
    activateMutation.mutate(plan.id)
  }

  const handleDeactivate = (plan: ManagerPlan) => {
    deactivateMutation.mutate(plan.id)
  }

  const handleRemovePlan = (plan: ManagerPlan) => {
    removePlanMutation.mutate(plan.id)
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold">Planos</h1>
          <p className="text-muted-foreground mt-1">
            Gerenciar planos de assinatura e precos
          </p>
          {selectedProduct ? (
            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span>Produto selecionado:</span>
              <span className="rounded-full border border-muted px-2 py-1 text-sm text-foreground">
                {selectedProduct.name}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleProductFilterChange('')}
              >
                Limpar filtro
              </Button>
            </div>
          ) : (
            <div className="mt-3 text-sm text-muted-foreground">
              Exibindo todos os planos. Selecione um produto para filtrar.
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="min-w-[220px]">
            <Select value={selectedProductFilterValue} onValueChange={handleProductFilterChange}>
              <SelectTrigger className="w-full h-11">
                <SelectValue placeholder="Filtrar por produto" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os produtos</SelectItem>
                {products?.map((product) => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleCreatePlan}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Plano
          </Button>
        </div>
      </div>

      {/* Plans Grid */}
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
      ) : filteredPlans && filteredPlans.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredPlans
            .sort((a, b) => a.features.display.displayOrder - b.features.display.displayOrder)
            .map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                onEdit={() => handleEditPlan(plan)}
                onActivate={() => handleActivate(plan)}
                onDeactivate={() => handleDeactivate(plan)}
                onRemove={() => handleRemovePlan(plan)}
                onAddPrice={() => handleAddPrice(plan)}
                onLinkGateway={() => handleLinkGateway(plan)}
              />
            ))}
        </div>
      ) : (
        <div className="border rounded-lg p-8 text-center text-muted-foreground">
          {selectedProduct ? (
            <>Nenhum plano encontrado para o produto selecionado.</>
          ) : (
            <>Nenhum plano cadastrado. Crie o primeiro plano para começar.</>
          )}
        </div>
      )}

      {/* Dialogs */}
      <PlanForm open={planFormOpen} onOpenChange={setPlanFormOpen} plan={selectedPlan} />
      <PlanPriceForm
        open={priceFormOpen}
        onOpenChange={setPriceFormOpen}
        plan={priceFormPlan}
      />
      {linkGatewayPlan && (
        <LinkGatewayModal
          planId={linkGatewayPlan.id}
          planPrices={linkGatewayPlan.prices}
          open={linkGatewayOpen}
          onClose={() => setLinkGatewayOpen(false)}
          onSuccess={() => {}}
        />
      )}
    </div>
  )
}

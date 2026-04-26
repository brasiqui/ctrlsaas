"use client"

import * as React from "react"
import { useNavigate } from "react-router-dom"
import { Loader2, Search } from "lucide-react"
import { AppShell } from "@/components/layout/app-shell"
import { PageHeader } from "@/components/layout/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { useProducts, useCurrentBillingInfo, usePlans } from "@/hooks/use-billing"

export default function ProductsPage() {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = React.useState("")
  const { data: products, isLoading: productsLoading } = useProducts()
  const { data: plans } = usePlans()
  const { data: billingInfo, isLoading: billingLoading } = useCurrentBillingInfo()

  // Build a map of productId -> hasSubscription
  const productSubscriptionMap = React.useMemo(() => {
    const map = new Map<string, boolean>()
    if (!plans || !billingInfo?.plan.code) return map

    plans.forEach((plan) => {
      if (plan.code === billingInfo.plan.code) {
        map.set(plan.productId, true)
      }
    })

    return map
  }, [plans, billingInfo])

  const filteredProducts = React.useMemo(() => {
    if (!products) return []

    const normalizedSearch = searchTerm.trim().toLowerCase()

    return products
      .filter(
        (product) =>
          product.isActive !== false &&
          (normalizedSearch.length === 0 || product.name.toLowerCase().includes(normalizedSearch)),
      )
      .sort((a, b) => {
        const aHasSubscription = productSubscriptionMap.has(a.id)
        const bHasSubscription = productSubscriptionMap.has(b.id)

        if (aHasSubscription === bHasSubscription) {
          return a.name.localeCompare(b.name)
        }
        return bHasSubscription ? 1 : -1
      })
  }, [products, searchTerm, productSubscriptionMap])

  const isLoading = productsLoading || billingLoading

  const handleProductClick = (productId: string) => {
    navigate(`/admin/billing?productId=${productId}`)
  }

  return (
    <AppShell currentPath="/products" breadcrumb={["Produtos"]}>
      <div className="space-y-6">
        <PageHeader
          title="Produtos"
          description="Confira os produtos disponíveis e veja se há assinatura ativa"
        />

        <div className="relative max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Buscar produtos..."
            className="pl-9"
          />
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center min-h-[240px]">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredProducts.map((product) => {
              const hasSubscription = productSubscriptionMap.has(product.id)

              return (
                <button
                  key={product.id}
                  onClick={() => handleProductClick(product.id)}
                  className="text-left transition-all hover:scale-105 active:scale-100"
                  type="button"
                >
                  <Card className="border hover:shadow-lg transition cursor-pointer h-full">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <CardTitle>{product.name}</CardTitle>
                          <CardDescription className="mt-1">
                            {product.description || "Sem descrição disponível."}
                          </CardDescription>
                        </div>
                        <Badge variant="default" className="ml-2">
                          {hasSubscription ? "Assinado" : "Disponível"}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        {hasSubscription
                          ? "Produto com assinatura ativa."
                          : "Clique para ver assinaturas disponíveis."}
                      </p>
                    </CardContent>
                  </Card>
                </button>
              )
            })}
          </div>
        ) : (
          <div className="border rounded-lg p-12 text-center text-muted-foreground">
            Nenhum produto encontrado com este filtro.
          </div>
        )}
      </div>
    </AppShell>
  )
}

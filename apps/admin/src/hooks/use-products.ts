import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type {
  Product,
  CreateProductInput,
  UpdateProductInput,
  AxiosErrorWithResponse,
} from '@/types'
import { toast } from 'sonner'

export function useProducts() {
  return useQuery({
    queryKey: ['manager', 'products'],
    queryFn: async () => {
      const response = await api.get<Product[]>('/manager/products')
      return response.data
    },
  })
}

export function useCreateProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateProductInput) => {
      const response = await api.post<Product>('/manager/products', data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manager', 'products'] })
      toast.success('Produto criado com sucesso!')
    },
    onError: (error: AxiosErrorWithResponse) => {
      const message = error.response?.data?.message || error.message || 'Erro ao criar produto'
      toast.error(message)
    },
  })
}

export function useUpdateProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateProductInput }) => {
      const response = await api.patch<Product>(`/manager/products/${id}`, data)
      return response.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['manager', 'products'] })
      toast.success('Produto atualizado com sucesso!')
    },
    onError: (error: AxiosErrorWithResponse) => {
      const message = error.response?.data?.message || error.message || 'Erro ao atualizar produto'
      toast.error(message)
    },
  })
}

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { LoadingButton } from "@/components/ui/loading-button";
import type { Product, CreateProductInput, UpdateProductInput } from "@/types";
import { useCreateProduct, useUpdateProduct } from "@/hooks/use-products";

interface ProductFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: Product;
}

export function ProductForm({ open, onOpenChange, product }: ProductFormProps) {
  const isEditing = !!product;
  const [formData, setFormData] = useState({
    code: product?.code || "",
    name: product?.name || "",
    description: product?.description || "",
    type: product?.type || "api",
    isActive: product?.isActive ?? true,
  });

  useEffect(() => {
    if (product) {
      setFormData({
        code: product.code,
        name: product.name,
        description: product.description || "",
        type: product.type,
        isActive: product.isActive,
      });
    } else {
      setFormData({
        code: "",
        name: "",
        description: "",
        type: "api",
        isActive: true,
      });
    }
  }, [product]);

  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isEditing) {
      await updateMutation.mutateAsync({
        id: product!.id,
        data: {
          name: formData.name,
          description: formData.description,
          type: formData.type,
          isActive: formData.isActive,
        },
      });
    } else {
      await createMutation.mutateAsync(formData as CreateProductInput);
    }

    onOpenChange(false);
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Produto" : "Novo Produto"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Atualize as informações do produto."
              : "Crie um novo produto para associar aos planos."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="code">Código *</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) =>
                  setFormData({ ...formData, code: e.target.value })
                }
                disabled={isEditing}
                required
              />
              {isEditing && (
                <p className="text-xs text-muted-foreground mt-1">
                  O código não pode ser alterado.
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
            </div>

            <div>
              <Label htmlFor="type">Tipo *</Label>
              <select
                id="type"
                value={formData.type}
                onChange={(e) =>
                  setFormData({ ...formData, type: e.target.value })
                }
                className="mt-2 select-base"
                required
              >
                <option value="api">API</option>
                <option value="web">Web</option>
                <option value="service">Service</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, isActive: checked })
                }
              />
              <Label htmlFor="isActive" className="cursor-pointer">
                Produto ativo
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <LoadingButton type="submit" loading={isLoading}>
              {isEditing ? "Atualizar" : "Criar"}
            </LoadingButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

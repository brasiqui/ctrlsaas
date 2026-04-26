import { MoreVertical, Edit, Power, PowerOff } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Product } from "@/types";

interface ProductCardProps {
  product: Product;
  onEdit: () => void;
  onActivate: () => void;
  onDeactivate: () => void;
  onViewPlans?: () => void;
}

export function ProductCard({
  product,
  onEdit,
  onActivate,
  onDeactivate,
  onViewPlans,
}: ProductCardProps) {
  const typeLabels = {
    api: "API",
    web: "Web",
    service: "Serviço",
  };

  return (
    <Card
      onClick={onViewPlans}
      className={
        onViewPlans
          ? "cursor-pointer transition hover:-translate-y-0.5 hover:shadow-lg"
          : ""
      }
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <CardTitle>{product.name}</CardTitle>
              <Badge variant={product.isActive ? "default" : "secondary"}>
                {product.isActive ? "Ativo" : "Inativo"}
              </Badge>
            </div>
            <CardDescription className="mt-1">
              {product.description}
            </CardDescription>
            <div className="mt-2 text-sm text-muted-foreground">
              Código: <span className="font-mono">{product.code}</span>
            </div>
            <div className="mt-2">
              <Badge variant="outline">{typeLabels[product.type]}</Badge>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={(event) => event.stopPropagation()}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              onClick={(event) => event.stopPropagation()}
            >
              <DropdownMenuItem
                onClick={(event) => {
                  event.stopPropagation();
                  onEdit();
                }}
              >
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {product.isActive ? (
                <DropdownMenuItem
                  onClick={(event) => {
                    event.stopPropagation();
                    onDeactivate();
                  }}
                >
                  <PowerOff className="mr-2 h-4 w-4" />
                  Desativar
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem
                  onClick={(event) => {
                    event.stopPropagation();
                    onActivate();
                  }}
                >
                  <Power className="mr-2 h-4 w-4" />
                  Ativar
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent>
        <div className="text-sm text-muted-foreground">
          Criado em: {new Date(product.createdAt).toLocaleDateString("pt-BR")}
        </div>
      </CardContent>
    </Card>
  );
}

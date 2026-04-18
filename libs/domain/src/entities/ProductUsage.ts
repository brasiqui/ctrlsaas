export interface ProductUsage {
  id: string;
  subscriptionId: string;
  productId: string;
  metric: string;
  usedValue: number;
  limitValue: number | null;
  lastUpdated: Date;
  createdAt: Date;
}

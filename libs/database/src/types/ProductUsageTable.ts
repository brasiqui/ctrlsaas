import { ColumnType, Generated } from 'kysely';

export interface ProductUsageTable {
  id: Generated<string>;
  subscription_id: string;
  product_id: string;
  metric: string;
  used_value: ColumnType<number, number, number>;
  limit_value: ColumnType<number | null, number | null, number | null>;
  last_updated: Date;
  created_at: Generated<Date>;
}

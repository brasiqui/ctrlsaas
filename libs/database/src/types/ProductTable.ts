import { ColumnType, Generated } from 'kysely';

export interface ProductTable {
  id: Generated<string>;
  code: string;
  name: string;
  description: string | null;
  type: string;
  is_active: boolean;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

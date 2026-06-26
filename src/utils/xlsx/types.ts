export type NormalizeResult = {
  headers: string[];
  rows: Record<string, string>[];
};

export type ColumnRule = {
  key: string;
  index?: number;
  name?: string;
};

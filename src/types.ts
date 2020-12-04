export type Dict = { [key: string]: Dict | string | readonly string[] };

export type FlatKeys<T extends Record<string, any>> = keyof {
  [K in keyof T as K extends string ? (T[K] extends Record<string, any> ? `${K}.${FlatKeys<T[K]>}` : K) : never]: 1;
};
export type DeepValue<T, K> = K extends `${infer first}.${infer rest}`
  ? first extends keyof T
    ? DeepValue<T[first], rest>
    : never
  : K extends keyof T
  ? T[K]
  : never;

export type FlatDict<D extends Dict> = { [K in FlatKeys<D>]: DeepValue<D, K> };

export type DeepPartial<T> = T extends Record<string, any> ? { [K in keyof T]?: DeepPartial<T[K]> } : T;
export type Options<D extends Dict> = {
  sourceDictionary: D;
  sourceLocale: string;
  fallbackLocale?: string | string[];
  dicts: { [locale: string]: DeepPartial<D> } | ((locale: string) => DeepPartial<D> | Promise<DeepPartial<D>>);
};

export type Values = string | number | boolean | { [key: string]: string | number | boolean };
export type TranslationProps = { key: string; values: Values; fallback?: unknown; locale?: string };

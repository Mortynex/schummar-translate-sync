import { DictStore } from './dictStore';
import { GetICUArgs } from './extractICU';
import { format, translate } from './translate';
import { DeepValue, Dict, FlatKeys, Options } from './types';

type TranslateArgs<D extends Dict, K extends string> = Record<string, never> extends GetICUArgs<DeepValue<D, K>>
  ? []
  : [values: GetICUArgs<DeepValue<D, K>>];

type FormatArgs<T extends string> = Record<string, never> extends GetICUArgs<T> ? [] : [values: GetICUArgs<T>];

export function createTranslator<D extends Dict>(
  options: Options<D>,
): {
  getTranslateFallback: (
    overrideLocale?: string,
  ) => Promise<(id: string, args: { values?: Record<string, any>; fallback: string }) => string>;
  getTranslate: (overrideLocale?: string) => Promise<<K extends FlatKeys<D>>(id: K, ...args: TranslateArgs<D, K>) => string>;
  getFormat: (locale?: string) => <T extends string>(template: T, ...args: FormatArgs<T>) => string;
} {
  const store = new DictStore(options);
  const { sourceLocale, fallbackLocale = [] } = options;

  const getTranslateFallback = async (overrideLocale?: string) => {
    const locale = overrideLocale ?? sourceLocale;
    const localeFallbackOrder = [locale, ...fallbackLocale, sourceLocale];
    const dicts = await store.load(...new Set(localeFallbackOrder));

    return (id: string, args: { values?: Record<string, any>; fallback?: string }) => {
      return translate(dicts, { locale, id, ...args });
    };
  };

  const getTranslate = async (overrideLocale?: string) => {
    const translate = await getTranslateFallback(overrideLocale);

    return <K extends FlatKeys<D>>(id: K, ...[values]: TranslateArgs<D, K>) => {
      return translate(id, { values: values as any });
    };
  };

  const getFormat = (overrideLocale?: string) => {
    const locale = overrideLocale ?? sourceLocale;

    return <T extends string>(template: T, ...[values]: FormatArgs<T>) => {
      return format(template, values as any, locale);
    };
  };

  return {
    getTranslateFallback,
    getTranslate,
    getFormat,
  };
}

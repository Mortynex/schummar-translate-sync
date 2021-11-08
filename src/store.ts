import { match } from '@formatjs/intl-localematcher';
import { Cache } from './cache';
import { flattenDict } from './flattenDict';
import { arrEquals } from './helpers';
import { CreateTranslatorOptions, Dict, FlatDict } from './types';

export class Store<D extends Dict = any> {
  dicts = new Map<string, FlatDict | null>();
  cache = new Cache(this.options.cacheOptions);
  subs = new Set<() => void>();

  constructor(public options: CreateTranslatorOptions<D>) {}

  load(locale: string): FlatDict | null {
    let entry = this.dicts.get(locale);
    if (entry !== undefined) return entry;

    let dict = null;
    if (match([locale], [this.options.sourceLocale], '') && this.options.sourceDictionary) {
      dict = this.options.sourceDictionary;
    } else if (this.options.dicts instanceof Function) {
      dict = this.options.dicts(locale);
    } else if (this.options.dicts) {
      const availableLocales = Object.keys(this.options.dicts);
      const matching = match([locale], availableLocales, locale);
      dict = this.options.dicts[matching] ?? null;
      if (dict instanceof Function) dict = dict();
    }

    entry = dict && flattenDict(dict);

    this.dicts.set(locale, entry);

    this.notify();

    return entry;
  }

  loadAll(...locales: string[]): FlatDict[] {
    const dicts = locales.map((locale) => this.load(locale));

    return dicts.filter(Boolean) as unknown as FlatDict[];
  }

  getAll(...locales: string[]): FlatDict[] {
    const dicts = locales.map((locale) => this.load(locale));
    return dicts.filter(Boolean) as FlatDict[];
  }

  subscribe(locales: string[], callback: (dicts?: FlatDict[]) => void): () => void {
    let last: FlatDict[] | undefined;

    const sub = () => {
      const dicts = this.getAll(...locales);
      if (!arrEquals(dicts, last)) {
        last = dicts;
        callback(dicts);
      }
    };
    sub();

    this.subs.add(callback);
    return () => {
      this.subs.delete(callback);
    };
  }

  clear(): void {
    this.dicts.clear();
    this.cache.clear();
    this.notify();
  }

  private notify() {
    setTimeout(() => {
      for (const sub of this.subs) sub();
    });
  }
}

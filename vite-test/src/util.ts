/**
 * 具有 name 属性的对象接口
 */
export interface NamedItem {
  name: string;
}

/**
 * 按 name 属性对对象集合进行去重，返回一个新的集合。
 * 如果存在多个相同 name 的对象，只保留第一个出现的对象。
 *
 * @param items - 包含具有 name 属性的对象的集合
 * @returns 去重后的新集合
 *
 * @example
 * const data = [
 *   { name: 'Alice', age: 25 },
 *   { name: 'Bob', age: 30 },
 *   { name: 'Alice', age: 28 },
 * ];
 * const result = deduplicateByName(data);
 * // result => [{ name: 'Alice', age: 25 }, { name: 'Bob', age: 30 }]
 */
export function deduplicateByName<T extends NamedItem>(items: T[]): T[] {
  const seen = new Map<string, T>();

  for (const item of items) {
    if (!seen.has(item.name)) {
      seen.set(item.name, item);
    }
  }

  return Array.from(seen.values());
}

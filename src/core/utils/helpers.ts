export function keyObject<T extends readonly string[]>(arr: T): { [K in T[number]]: null } {
    return Object.fromEntries(arr.map(v => [v, null])) as any
}

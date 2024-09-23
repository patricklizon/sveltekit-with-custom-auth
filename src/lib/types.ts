export type Nothing = undefined | null;

export type Option<T> = T | Nothing;

export type Enum<T extends Record<string, string>> = T[keyof T];

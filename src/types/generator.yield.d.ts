export type GeneratorYieldType<T extends Generator | AsyncGenerator> = T extends Generator<
  infer TYield
>
  ? TYield
  : T extends AsyncGenerator<infer TYield>
  ? TYield
  : unknown;

export type GeneratorYieldTuple<T extends Generator[] | AsyncGenerator[]> = {
  [key in keyof T]?: GeneratorYieldType<T[key]>;
};

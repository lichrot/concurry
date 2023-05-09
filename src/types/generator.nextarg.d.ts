export type GeneratorNextArgType<T extends Generator | AsyncGenerator> = T extends Generator<
  any,
  any,
  infer TNext
>
  ? TNext
  : T extends AsyncGenerator<any, any, infer TNext>
  ? TNext
  : unknown;

export type GeneratorNextArgTuple<T extends Generator[] | AsyncGenerator[]> = {
  [key in keyof T]: GeneratorNextArgType<T[key]>;
};

export type GeneratorReturnType<T extends Generator | AsyncGenerator> = T extends Generator<
  any,
  infer TReturn
>
  ? TReturn
  : T extends AsyncGenerator<any, infer TReturn>
  ? TReturn
  : unknown;

export type GeneratorReturnTuple<T extends Generator[] | AsyncGenerator[]> = {
  [key in keyof T]: GeneratorReturnType<T[key]>;
};

import { GeneratorReturnType } from './generator.return';

export type GeneratorReturnResult<T> = { status: 'return'; value: T };
export type GeneratorThrowResult = { status: 'throw'; reason: any };
export type GeneratorSettledResult<T> = GeneratorReturnResult<T> | GeneratorThrowResult;

export type GeneratorSettledResultTuple<T extends Generator[] | AsyncGenerator[]> = {
  [key in keyof T]: GeneratorSettledResult<GeneratorReturnType<T[key]>>;
};

import { GeneratorReturnType } from './generator.return';

export type GeneratorFulfilledResult<T> = { status: 'fulfilled'; value: T };
export type GeneratorRejectedResult = { status: 'rejected'; reason: any };
export type GeneratorSettledResult<T> = GeneratorFulfilledResult<T> | GeneratorRejectedResult;

export type GeneratorSettledResultTuple<T extends Generator[] | AsyncGenerator[]> = {
  [key in keyof T]: GeneratorSettledResult<GeneratorReturnType<T[key]>>;
};

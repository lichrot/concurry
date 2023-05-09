import {
  GeneratorNextArgTuple,
  GeneratorReturnTuple,
  GeneratorReturnType,
  GeneratorSettledResultTuple,
  GeneratorYieldTuple,
} from './types';

// prettier-ignore
const GeneratorFunctionConstructor = (function* () {}).constructor as GeneratorFunctionConstructor;

export class GeneratorFunction extends GeneratorFunctionConstructor {
  static *allSettled<T extends Generator[]>(
    generators: [...T]
  ): Generator<GeneratorYieldTuple<T>, GeneratorSettledResultTuple<T>, GeneratorNextArgTuple<T>> {
    const genCount = generators.length;
    if (!genCount) return [] as GeneratorSettledResultTuple<T>;

    const genReturns = new Array(genCount) as GeneratorSettledResultTuple<T>;

    let settledGenCount = 0;
    let genArgs: GeneratorNextArgTuple<T> | null = null;

    while (true) {
      const genYields = new Array(genCount) as GeneratorYieldTuple<T>;

      for (let idx = 0; idx < genCount; idx++) {
        if (genReturns[idx]) {
          genYields[idx] = undefined;
          continue;
        }

        try {
          const iterResult = generators[idx].next(genArgs?.[idx]);
          if (iterResult.done !== true) {
            genYields[idx] = iterResult.value;
            continue;
          }

          settledGenCount += 1;
          genYields[idx] = undefined;
          genReturns[idx] = { status: 'fulfilled', value: iterResult.value };

        } catch (error) {
          settledGenCount += 1;
          genYields[idx] = undefined;
          genReturns[idx] = { status: 'rejected', reason: error };
        }
      }

      if (settledGenCount === genCount) break;
      genArgs = (yield genYields) ?? null;
    }

    return genReturns;
  }

  static *all<T extends Generator[]>(
    generators: [...T]
  ): Generator<GeneratorYieldTuple<T>, GeneratorReturnTuple<T>, GeneratorNextArgTuple<T>> {
    const genCount = generators.length;
    if (!genCount) return [] as GeneratorReturnTuple<T>;

    const genReturns = new Array(genCount) as GeneratorReturnTuple<T>;
    const genStatuses = new Array(genCount).fill(false) as { [key in keyof T]: boolean };

    let settledGenCount = 0;
    let genArgs: GeneratorNextArgTuple<T> | null = null;

    while (true) {
      const genYields = new Array(genCount) as GeneratorYieldTuple<T>;

      for (let idx = 0; idx < genCount; idx++) {
        if (genStatuses[idx]) {
          genYields[idx] = undefined;
          continue;
        }

        const iterResult = generators[idx].next(genArgs?.[idx]);
        if (iterResult.done !== true) {
          genYields[idx] = iterResult.value;
          continue;
        }

        settledGenCount += 1;
        genStatuses[idx] = true;
        genYields[idx] = undefined;
        genReturns[idx] = { status: 'return', value: iterResult.value };
      }

      if (settledGenCount === genCount) break;
      genArgs = (yield genYields) ?? null;
    }

    return genReturns;
  }

  private static errorMessage = 'No Generator in FunctionGenerator.any has been done';

  static *any<T extends Generator[]>(
    generators: [...T]
  ): Generator<GeneratorYieldTuple<T>, GeneratorReturnType<T[number]>, GeneratorNextArgTuple<T>> {
    const genCount = generators.length;
    if (!genCount) throw new AggregateError([], this.errorMessage);

    const genErrors = new Array(genCount) as { [key in keyof T]: any };

    let genArgs: GeneratorNextArgTuple<T> | null = null;

    while (true) {
      const genYields = new Array(genCount) as GeneratorYieldTuple<T>;

      for (let idx = 0; idx < genCount; idx++) {
        if (genErrors[idx]) {
          genYields[idx] = undefined;
          continue;
        }

        try {
          const iterResult = generators[idx].next(genArgs?.[idx]);
          if (iterResult.done === true) return iterResult.value;
          genYields[idx] = iterResult.value;
        } catch (error) {
          genYields[idx] = undefined;
          genErrors[idx] = error;
        }
      }

      if (genErrors.length === genCount) break;
      genArgs = (yield genYields) ?? null;
    }

    throw new AggregateError(genErrors, this.errorMessage);
  }

  static *race<T extends Generator[]>(
    generators: [...T]
  ): Generator<GeneratorYieldTuple<T>, GeneratorReturnType<T[number]>, GeneratorNextArgTuple<T>> {
    const genCount = generators.length;
    if (!genCount) return undefined as any;

    let genArgs: GeneratorNextArgTuple<T> | null = null;

    while (true) {
      const genYields = new Array(genCount) as GeneratorYieldTuple<T>;

      for (let idx = 0; idx < genCount; idx++) {
        const iterResult = generators[idx].next(genArgs?.[idx]);
        if (iterResult.done === true) return iterResult.value;
        genYields[idx] = iterResult.value;
      }

      genArgs = (yield genYields) ?? null;
    }
  }

  static *resolve<T>(value: T): Generator<never, T, never> {
    return value;
  }

  static *reject(reason: any): Generator<never, never, never> {
    throw reason;
  }
}

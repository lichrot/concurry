import {
  GeneratorNextArgTuple,
  GeneratorReturnTuple,
  GeneratorReturnType,
  GeneratorSettledResultTuple,
  GeneratorYieldTuple,
} from './types';

const AsyncGeneratorFunctionConstructor = async function* () {}
  .constructor as AsyncGeneratorFunctionConstructor;

export class AsyncGeneratorFunction extends AsyncGeneratorFunctionConstructor {
  static async *allSettled<T extends AsyncGenerator[]>(
    generators: [...T]
  ): AsyncGenerator<
    GeneratorYieldTuple<T>,
    GeneratorSettledResultTuple<T>,
    GeneratorNextArgTuple<T>
  > {
    const genCount = generators.length;
    if (!genCount) return [] as GeneratorSettledResultTuple<T>;

    const genReturns = new Array(genCount) as GeneratorSettledResultTuple<T>;

    let settledGenCount = 0;
    let genArgs: GeneratorNextArgTuple<T> | null = null;

    while (true) {
      const promises = generators.map((gen, idx) => gen.next(genArgs?.[idx]));
      const promiseResults = await Promise.allSettled(promises);

      const genYields = new Array(genCount) as GeneratorYieldTuple<T>;

      for (let idx = 0; idx < genCount; idx++) {
        if (genReturns[idx]) {
          genYields[idx] = undefined;
          continue;
        }

        const promiseResult = promiseResults[idx];
        if (promiseResult.status === 'rejected') {
          settledGenCount += 1;
          genReturns[idx] = { status: 'throw', reason: promiseResult.reason };
          continue;
        }

        const iterResult = promiseResult.value;
        if (iterResult.done !== true) {
          genYields[idx] = iterResult.value;
          continue;
        }

        settledGenCount += 1;
        genYields[idx] = undefined;
        genReturns[idx] = { status: 'return', value: iterResult.value };
      }

      if (settledGenCount === genCount) break;
      genArgs = (yield genYields) ?? null;
    }

    return genReturns;
  }

  static async *all<T extends AsyncGenerator[]>(
    generators: [...T]
  ): AsyncGenerator<GeneratorYieldTuple<T>, GeneratorReturnTuple<T>, GeneratorNextArgTuple<T>> {
    const genCount = generators.length;
    if (!genCount) return [] as GeneratorReturnTuple<T>;

    const genReturns = new Array(genCount) as GeneratorReturnTuple<T>;
    const genStatuses = new Array(genCount).fill(false) as { [key in keyof T]: boolean };

    let settledGenCount = 0;
    let genArgs: GeneratorNextArgTuple<T> | null = null;

    while (true) {
      const promises = generators.map((gen, idx) => gen.next(genArgs?.[idx]));
      const iterResults = await Promise.all(promises);

      const genYields = new Array(genCount) as GeneratorYieldTuple<T>;

      for (let idx = 0; idx < genCount; idx++) {
        if (genStatuses[idx]) {
          genYields[idx] = undefined;
          continue;
        }

        const iterResult = iterResults[idx];
        if (iterResult.done !== true) {
          genYields[idx] = iterResult.value;
          continue;
        }

        settledGenCount += 1;
        genStatuses[idx] = true;
        genYields[idx] = undefined;
        genReturns[idx] = iterResult.value;
      }

      if (settledGenCount === genCount) break;
      genArgs = (yield genYields) ?? null;
    }

    return genReturns;
  }

  private static errorMessage =
    'No AsyncGenerator in AsyncFunctionGenerator.any has been done' as const;

  static async *any<T extends AsyncGenerator[]>(
    generators: [...T]
  ): AsyncGenerator<
    GeneratorYieldTuple<T>,
    GeneratorReturnType<T[number]>,
    GeneratorNextArgTuple<T>
  > {
    const genCount = generators.length;
    if (!genCount) throw new AggregateError([], this.errorMessage);

    const genErrors = new Array(genCount) as { [key in keyof T]: any };

    let genArgs: GeneratorNextArgTuple<T> | null = null;

    while (true) {
      const promises = generators.map((gen, idx) => gen.next(genArgs?.[idx]));

      // TODO: More efficient algo to deal with each promise as they resolve
      // instead of awaiting all promises if fast track fails (too lazy, can't do)
      // Same for AsyncGeneratorFunction.race()

      // Fast track
      try {
        const iterAnyResult = await Promise.any(promises);
        if (iterAnyResult.done === true) return iterAnyResult.value;
      } catch (error: any) {
        const errors = (error as AggregateError).errors;
        throw new AggregateError(errors, this.errorMessage);
      }

      // Slow track
      const promiseResults = await Promise.allSettled(promises);

      const genYields = new Array(genCount) as GeneratorYieldTuple<T>;

      for (let idx = 0; idx < genCount; idx++) {
        if (genErrors[idx]) {
          genYields[idx] = undefined;
          continue;
        }

        const promiseResult = promiseResults[idx];
        if (promiseResult.status === 'rejected') {
          genYields[idx] = undefined;
          genErrors[idx] = promiseResult.reason;
          continue;
        }

        const iterResult = promiseResult.value;
        if (iterResult.done === true) return iterResult.value;
        genYields[idx] = iterResult.value;
      }

      if (genErrors.length === genCount) break;
      genArgs = (yield genYields) ?? null;
    }

    throw new AggregateError(genErrors, this.errorMessage);
  }

  static async *race<T extends AsyncGenerator[]>(
    generators: [...T]
  ): AsyncGenerator<
    GeneratorYieldTuple<T>,
    GeneratorReturnType<T[number]>,
    GeneratorNextArgTuple<T>
  > {
    const genCount = generators.length;
    if (!genCount) return undefined as any;

    let genArgs: GeneratorNextArgTuple<T> | null = null;

    while (true) {
      const promises = generators.map((gen, idx) => gen.next(genArgs?.[idx]));

      // TODO: More efficient algo to deal with each promise as they resolve
      // instead of awaiting all promises if fast track fails (too lazy, can't do)
      // Same for AsyncGeneratorFunction.any()

      // Fast track
      const iterRaceResult = await Promise.race(promises);
      if (iterRaceResult.done === true) return iterRaceResult.value;

      // Slow track
      const promiseResults = await Promise.allSettled(promises);

      const genYields = new Array(genCount) as GeneratorYieldTuple<T>;

      for (let idx = 0; idx < genCount; idx++) {
        const promiseResult = promiseResults[idx];
        if (promiseResult.status === 'rejected') throw promiseResult.reason;

        const iterResult = promiseResult.value;
        if (iterResult.done === true) return iterResult.value;

        genYields[idx] = iterResult.value;
      }

      genArgs = (yield genYields) ?? null;
    }
  }

  static async *return<T>(value: T): AsyncGenerator<never, T, never> {
    return value;
  }

  static async *throw(reason: any): AsyncGenerator<never, never, never> {
    throw reason;
  }
}

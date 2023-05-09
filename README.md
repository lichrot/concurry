# [concurry] Promise & Generator

Inspired by [`motion-canvas`](https://github.com/motion-canvas/motion-canvas)' threading model.  
NB: This library is half-baked and not well thought out, don't use in production  
PS: It's just a prank, bro

# [✍️] Examples

Zipping simple generators
```typescript
function* spawnNumberGenerator(max: number) {
  for (let idx = 1; idx <= max; idx++) yield idx;
  return max;
}

const alphabet = 'abcdefghijklmnopqrstuvwxyz';
const alphabetLength = alphabet.length;
function* spawnRandomLetterGenerator(max: number) {
  for (let idx = 0; idx < max; idx++) {
    const randomIdx = (Math.random() * alphabetLength) | 0;
    yield alphabet[randomIdx];
  }
  return max;
}

const zippedGenerators = GeneratorFunction.all([
  spawnNumberGenerator(3),
  spawnRandomLetterGenerator(4),
]);

const ids = [...zippedGenerators].map(([number, letter]) => `${number}_${letter}`);
// const ids: ['1_t', '2_f', '3_o', 'undefined_c']

const maxes = zippedGenerators.return();
// const maxes: [3, 4]
```

Complex threading with side-effects  
PS: You are better off creating your own threading model, don't do this
```typescript
async function* spawnAudioPlayer(ctx: AudioContext) {
  while (true) {
    const shouldPause: boolean = yield;
    const curState = ctx.state;
    if (shouldPause && curState === 'running')
      await ctx.suspend();
    if (!shouldPause && curState === 'suspended')
      await ctx.resume();
  }
}

async function* spawnAnimationPlayer(ctx: CanvasRenderingContext2D) {
  while (true) {
    const shouldPause: boolean = yield;
    // ... animation stuff
    if (!shouldPause) ctx.save();
  }
}

const animationRunner = AsyncGeneratorFunction.all([
  spawnAudioPlayer(audioContext),
  spawnAnimationPlayer(canvasContext),
]);

let isAudioPaused = false;
let isAnimationPaused = false;

document
  .querySelector('mute-button')!
  .addEventListener('click', () => (isAudioPaused = !isAudioPaused));

document
  .querySelector('pause-button')!
  .addEventListener('click', () => (isAnimationPaused = !isAnimationPaused));

function runAnimation() {
  requestAnimationFrame(() => animationRunner.next([
    isAudioPaused || isAnimationPaused,
    isAnimationPaused,
  ]));
  runAnimation();
}

runAnimation();
```

# [📜] Todo

- Create appropriate interface to allow for different concurrency strategies
- Work out the correct promise handling in `AsyncGeneratorFunction.any()` and `AsyncGeneratorFunction.race()`

# [📝] License

This work is licensed under [Apache-2.0](https://www.apache.org/licenses/LICENSE-2.0) (see [NOTICE](/NOTICE)).
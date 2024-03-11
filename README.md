[![NPM version](https://img.shields.io/npm/v/rxjs-branch?color=%23cb3837&style=flat-square)](https://www.npmjs.com/package/rxjs-branch)
[![Repository package.json version](https://img.shields.io/github/package-json/v/vilicvane/rxjs-branch?color=%230969da&label=repo&style=flat-square)](./package.json)
[![MIT License](https://img.shields.io/badge/license-MIT-999999?style=flat-square)](./LICENSE)
[![Discord](https://img.shields.io/badge/chat-discord-5662f6?style=flat-square)](https://discord.gg/wEVn2qcf8h)

# Branch Operator for RxJS

## Installation

```sh
npm install rxjs-branch
```

## Usage

```ts
const branches = await firstValueFrom(
  range(0, 10).pipe(
    branch(
      value => value % 2 === 0,
      (state, value) => state,
    ),
    mergeMap(value$ =>
      value$.pipe(
        map(([state, value]) => value),
        toArray(),
      ),
    ),
    toArray(),
  ),
);

expect(branches).toEqual([
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [2, 3, 4, 5, 6, 7, 8, 9],
  [4, 5, 6, 7, 8, 9],
  [6, 7, 8, 9],
  [8, 9],
]);
```

## License

MIT License.

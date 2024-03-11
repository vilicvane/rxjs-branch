import {firstValueFrom, map, mergeMap, range, take, toArray} from 'rxjs';

import {branch} from '../library/index.js';

test('basic', async () => {
  const branches = await firstValueFrom(
    range(0, 10).pipe(
      branch(
        value => value,
        state => state % 2 === 0,
      ),
      mergeMap(value$ =>
        value$.pipe(
          map(([, value]) => value),
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
});

test('take 3 from each branch', async () => {
  const branches = await firstValueFrom(
    range(0, 10).pipe(
      branch(
        value => value % 2 === 0,
        state => state,
      ),
      mergeMap(value$ =>
        value$.pipe(
          take(3),
          map(([, value]) => value),
          toArray(),
        ),
      ),
      toArray(),
    ),
  );

  expect(branches).toEqual([
    [0, 1, 2],
    [2, 3, 4],
    [4, 5, 6],
    [6, 7, 8],
    [8, 9],
  ]);
});

test('exclusive', async () => {
  const branches = await firstValueFrom(
    range(0, 10).pipe(
      branch(
        value => (value % 2 === 0 ? {count: 0} : undefined),
        state => {
          if (state === undefined || state.count === 3) {
            return false;
          }

          state.count++;

          return 'exclusive';
        },
      ),
      mergeMap(value$ =>
        value$.pipe(
          map(([, value]) => value),
          toArray(),
        ),
      ),
      toArray(),
    ),
  );

  expect(branches).toEqual([
    [0, 1, 2],
    [4, 5, 6],
    [8, 9],
  ]);
});

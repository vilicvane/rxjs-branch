import type {Observable, Observer, OperatorFunction} from 'rxjs';
import {Subject} from 'rxjs';
import {OperatorSubscriber} from 'rxjs/internal/operators/OperatorSubscriber';
import {operate} from 'rxjs/internal/util/lift';

export function branch<T, TState>(
  stateInitializer: (value: T) => TState,
  predicate: (state: TState, value: T) => boolean,
): OperatorFunction<T, Observable<[state: TState, value: T]>> {
  return operate((source, subscriber) => {
    const branchMap = new Map<Subject<[TState, T]>, TState>();

    const notify = (
      callback: (
        branch: Observer<Observable<[TState, T]>> | Observer<[TState, T]>,
      ) => void,
    ): void => {
      for (const [branch] of branchMap) {
        callback(branch);
      }

      callback(subscriber);
    };

    const handleError = (error: unknown): void =>
      notify(consumer => consumer.error(error));

    const branchSourceSubscriber = new OperatorSubscriber(
      subscriber,
      (value: T) => {
        try {
          for (const [branch, state] of branchMap) {
            if (predicate(state, value)) {
              branch.next([state, value]);
            } else {
              branch.complete();
              branchMap.delete(branch);
            }
          }

          {
            const state = stateInitializer(value);

            if (predicate(state, value)) {
              const branch = new Subject<[TState, T]>();
              branchMap.set(branch, state);
              subscriber.next(branch.asObservable());
              branch.next([state, value]);
            }
          }
        } catch (err) {
          handleError(err);
        }
      },
      () => notify(consumer => consumer.complete()),
      handleError,
      () => branchMap.clear(),
    );

    source.subscribe(branchSourceSubscriber);
  });
}

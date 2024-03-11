import type {Observable, Observer, OperatorFunction} from 'rxjs';
import {Subject} from 'rxjs';
import {OperatorSubscriber} from 'rxjs/internal/operators/OperatorSubscriber';
import {operate} from 'rxjs/internal/util/lift';

export function branch<T, TState>(
  stateInitializer: (value: T) => TState,
  predicate: (state: TState, value: T) => boolean | 'exclusive',
  exclusiveByDefault = false,
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
          let exclusive = false;

          for (const [branch, state] of branchMap) {
            const predication = predicate(state, value);

            if (predication === false) {
              branch.complete();
              branchMap.delete(branch);
            } else {
              if (exclusiveByDefault || predication === 'exclusive') {
                exclusive = true;
              }

              branch.next([state, value]);
            }
          }

          if (!exclusive) {
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

import type {Observable, Observer, OperatorFunction} from 'rxjs';
import {Subject} from 'rxjs';
import {OperatorSubscriber} from 'rxjs/internal/operators/OperatorSubscriber';
import {operate} from 'rxjs/internal/util/lift';

export function branch<T, TState extends object>(
  predicate: (value: T, state: TState) => boolean,
  state: TState,
): OperatorFunction<T, Observable<T>>;
export function branch<T>(
  predicate: (value: T) => boolean,
): OperatorFunction<T, Observable<T>>;
export function branch<T, TState extends object>(
  predicate: (value: T, state: TState | undefined) => boolean,
  state?: TState,
): OperatorFunction<T, Observable<T>> {
  return operate((source, subscriber) => {
    const branchSet = new Set<Subject<T>>();

    const notify = (
      callback: (branch: Observer<Observable<T>> | Observer<T>) => void,
    ): void => {
      for (const branch of branchSet) {
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
          if (predicate(value, state)) {
            const branch = new Subject<T>();

            branchSet.add(branch);

            const branched = branch.asObservable();

            subscriber.next(branched);
          }

          for (const branch of branchSet) {
            branch.next(value);
          }
        } catch (err) {
          handleError(err);
        }
      },
      () => notify(consumer => consumer.complete()),
      handleError,
      () => branchSet.clear(),
    );

    source.subscribe(branchSourceSubscriber);
  });
}

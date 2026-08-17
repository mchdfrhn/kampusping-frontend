export type AsyncHandler<T extends unknown[]> = (...args: T) => void | Promise<void>;

export const isPromise = (value: unknown): value is Promise<unknown> =>
  typeof value === 'object' && value !== null && typeof (value as Promise<unknown>).then === 'function';

export const invokeAsyncAction = async <T extends unknown[]>(
  handler: AsyncHandler<T>,
  args: T,
): Promise<void> => {
  const result = handler(...args);
  if (isPromise(result)) {
    await result;
  }
};

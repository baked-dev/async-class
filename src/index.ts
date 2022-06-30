export type ResolvedInstance<
  T extends { then: (cb: (val: any) => any) => Promise<any> }
> = Omit<T, "then" | "catch" | "finally" | "__promise" | "__proxy">;

/**
 * @virtual
 * Extending class is required to have a method with the init interface
 * @typeArg C - Tuple indicating the type of the init methods parameters
 */
export abstract class AwaitableClass<C extends any[] = []>
  implements Promise<any>
{
  private static readonly hiddenProps = [
    // promise interface
    "then",
    "catch",
    "finally",
    // internal helpers
    "__promise",
    "__proxy",
  ];
  /** required to satisfy promise interface */
  public get [Symbol.toStringTag]() {
    return `[Object ${this.constructor.name}]`;
  }

  private __promise: Promise<any>;

  /**
   * proxy to remove the internal and promise interfaces
   * not removing the .then from the resolved class would result
   * in endless loops. other keys are removed to interfere as little
   * as possible with the extending class
   * */
  private readonly __proxy: ResolvedInstance<this> = new Proxy(this, {
    get: (target, prop) => {
      if (typeof prop === "string" && AwaitableClass.hiddenProps.includes(prop))
        return undefined;
      else return this[prop as keyof typeof target];
    },
    has: (target, prop) => {
      if (typeof prop === "string" && AwaitableClass.hiddenProps.includes(prop))
        return false;
      return target.hasOwnProperty(prop);
    },
    ownKeys: (target) => {
      return Object.keys(target).filter(
        (key) => !AwaitableClass.hiddenProps.includes(key)
      );
    },
  });

  /**
   * Can only be extended, should not be initialzed directly
   * @param args - will be forwarded to the init method
   */
  constructor(...args: C) {
    this.__promise = this.init(...args);
  }

  public then<TResult1 = any, TResult2 = never>(
    onfulfilled: (
      value: ResolvedInstance<this>
    ) => TResult1 | PromiseLike<TResult1>,
    onrejected?:
      | ((reason: any) => TResult2 | PromiseLike<TResult2>)
      | null
      | undefined
  ): Promise<TResult1 | TResult2> {
    return this.__promise.then(() => {
      /**
       * resolve promise and return result for chaining.
       * resolve with the proxy to "this" that removed
       * internal and promise interfaces
       * */
      return onfulfilled(this.__proxy);
    }, onrejected);
  }

  /** proxy forward to the init promises .catch */
  public catch<TResult = never>(
    onrejected?:
      | ((reason: any) => TResult | PromiseLike<TResult>)
      | null
      | undefined
  ): Promise<any> {
    return this.__promise.catch(onrejected);
  }

  /** proxy forward to the init promises .finally */
  public finally(onfinally?: (() => void) | null | undefined): Promise<any> {
    return this.__promise.finally(onfinally);
  }

  /**
   * @virtual
   * @param args - Arguments will be forarded from the construcor
   */
  protected abstract init(...args: C): Promise<any>;
}

# @baked-dev/async-class

Small utility to add async constructors to JavaScript/TypeScript

## Install
### npm
```
npm i @baked-dev/async-class --save-dev
```
### yarn
```
yarn add @baked-dev/async-class --dev
```
### pnpm
```
pnpm i @baked-dev/async-class --save-dev
```

## Usage
### TypeScript
```ts
/**
 * add the parameter types of the construct method as a tuple as the generic for AsyncClass.
 * (these types can not be Inferred from usage in the construct function at the moment)
 */
class Test extends AsyncClass<[string]> {
  public test = "asd";

  /** 
   * the construct method replaces the constructor and should be async.
   * without a custom constructor the parameters of the constructor 
   * will match this construct method.
   * has to be a member method as it needs to be available before super()
   * is called
  */
  protected async construct(test: string) {
    console.log(test);
    await new Promise((res) => setTimeout(res, 1000));
  }

  public log = async () => {
    await this; // wait for contruction to finish
    console.log(this.test);
  };
}

const main = async () => {
  const awaitable = new Test("hallo"); // get the "async constructor"
  const test = await awaitable; // await the class "construction"
  const test2 = await awaitable; // can be awaited multiple times
  awaitable.then(test3 => {
    test3.log(); // -> "asd"
  }); // can be chained
  const test4 = await new Test("hallo2"); // await directly

  console.log(test === test2); // -> true
  console.log(test instanceof Test); // -> true

  test.test = "123";
  test.log(); // -> "123"
}

main();
```
### JavaScript
the same but without types
## How?
AsyncClass class implements the Promise interface. 
```ts 
export abstract class AsyncClass<C extends any[] = []>
  implements Promise<any> 
```
In the constructor the construct method supplied by the extending class is called and attached to `this.__construct`:
```ts
constructor(...args: C) {
  this.__construct = this.construct(...args);
}
```
.catch and .finally just proxy to the `this.__construct`:
```ts
public catch<TResult = never>(
  onrejected?:
    | ((reason: any) => TResult | PromiseLike<TResult>)
    | null
    | undefined
): Promise<any> {
  return this.__construct.catch(onrejected);
}

public finally(onfinally?: (() => void) | null | undefined): Promise<any> {
  return this.__construct.finally(onfinally);
}
```
.then is intercepted and resolves with a proxied instance:
```ts
public then<TResult1 = any, TResult2 = never>(
  onfulfilled: (
    value: ResolvedInstance<this>
  ) => TResult1 | PromiseLike<TResult1>,
  onrejected?:
    | ((reason: any) => TResult2 | PromiseLike<TResult2>)
    | null
    | undefined
): Promise<TResult1 | TResult2> {
  return this.__construct.then(() => {
    return onfulfilled(this.__proxy);
  }, onrejected);
}
```
The proxied instance of `this` removes the Promise and internal Interfaces, else this would result in an infinite loop as Javascript eagerly `await`s promises:
```ts
private readonly __proxy: ResolvedInstance<this> = new Proxy(this, {
  get: (target, prop) => {
    if (typeof prop === "string" && AsyncClass.hiddenProps.includes(prop))
      return undefined;
    else return this[prop as keyof typeof target];
  },
  has: (target, prop) => {
    if (typeof prop === "string" && AsyncClass.hiddenProps.includes(prop))
      return false;
    return target.hasOwnProperty(prop);
  },
  ownKeys: (target) => {
    return Object.keys(target).filter(
      (key) => !AsyncClass.hiddenProps.includes(key)
    );
  },
});
```
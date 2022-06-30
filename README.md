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
 * add the parameter types of the init function as a tuple as the generic for AwaitableClass.
 * (these types can not be Inferred from usage in the init function at the moment)
 */
class Test extends AwaitableClass<[string]> {
  public test = "asd";

  /** 
   * the init method replaces the constructor and should be async.
   * without a custom constructor the parameters of the constructor 
   * will match this init method
  */
  protected async init(test: string) {
    console.log(test);
    await new Promise((res) => setTimeout(res, 1000));
  }

  public log = () => {
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
The AwaitableClass class implements the Promise interface. 
```ts 
export abstract class AwaitableClass<C extends any[] = []>
  implements Promise<any> 
```
When this.__promise is accessed, a getter calls this.init() with the parameters passed to the constructor and stores the promise in a class variable on first access. 
```ts
private get __promise() {
  return this.___promise || (this.___promise = this.init(...this.__args));
}
```
.catch and .finally just proxy to the init promise:
```ts
public catch<TResult = never>(
  onrejected?:
    | ((reason: any) => TResult | PromiseLike<TResult>)
    | null
    | undefined
): Promise<any> {
  return this.__promise.catch(onrejected);
}

public finally(onfinally?: (() => void) | null | undefined): Promise<any> {
  return this.__promise.finally(onfinally);
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
  return this.__promise.then(() => {
    return onfulfilled(this.__proxy);
  }, onrejected);
}
```
The proxied instance of `this` removes the Promise and internal Interfaces, else this would result in an infinite loop as Javascript eagerly `await`s promises:
```ts
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
```
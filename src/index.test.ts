import { randomBytes } from "crypto";
import { AwaitableClass, ResolvedInstance } from "./";

describe("AwaitableClass", () => {
  class ExtendingClass extends AwaitableClass<[string?]> {
    public test = "";

    protected async init(input: string = "asd"): Promise<any> {
      await new Promise((res) => setTimeout(res, 0));
      this.test = input;
    }

    public get name() {
      return this.test;
    }

    public set name(value: string) {
      this.test = value;
    }

    public name2 = () => this.test;

    public name3() {
      return this.test;
    }
  }

  const expectInstance = (instance: ResolvedInstance<ExtendingClass>) => {
    expect(instance).toBeInstanceOf(ExtendingClass);
    expect((instance as ExtendingClass).then).toEqual(undefined);
  };

  it("is awaitable", async () => {
    const instance = await new ExtendingClass();
    expectInstance(instance);
  });

  it("is thenable", async () => {
    return new ExtendingClass().then(expectInstance);
  });

  it("allows awaiting the same instance twice", async () => {
    const awaitable = new ExtendingClass();
    const instance0 = await awaitable;
    const instance1 = await awaitable;
    expect(instance0).toBe(instance1);
  });

  it("allows for getters", async () => {
    const input = randomBytes(4).toString("hex");
    const instance = await new ExtendingClass(input);
    expect(instance.name).toEqual(input);
  });

  it("allows for setters", async () => {
    const input = randomBytes(4).toString("hex");
    const instance = await new ExtendingClass();
    instance.name = input;
    expect(instance.test).toEqual(input);
  });

  it("allows for property method access", async () => {
    const input = randomBytes(4).toString("hex");
    const instance = await new ExtendingClass(input);
    expect(instance.name2()).toEqual(input);
  });

  it("allows for member method access", async () => {
    const input = randomBytes(4).toString("hex");
    const instance = await new ExtendingClass(input);
    expect(instance.name3()).toEqual(input);
  });
});

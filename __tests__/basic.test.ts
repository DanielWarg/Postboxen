// Simple unit test that doesn't require database
describe("Basic functionality", () => {
  test("should pass basic math", () => {
    expect(2 + 2).toBe(4);
  });

  test("should handle string operations", () => {
    const greeting = "Hello";
    const name = "World";
    expect(`${greeting} ${name}`).toBe("Hello World");
  });

  test("should work with arrays", () => {
    const numbers = [1, 2, 3, 4, 5];
    const doubled = numbers.map(n => n * 2);
    expect(doubled).toEqual([2, 4, 6, 8, 10]);
  });
});

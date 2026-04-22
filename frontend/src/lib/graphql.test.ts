import { describe, it, expect, vi, beforeEach } from "vitest";
import { gql, GraphQLError, graphqlClient } from "./graphql";

describe("gql client", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it("returns the data field from the response", async () => {
    const post = vi
      .spyOn(graphqlClient, "post")
      .mockResolvedValue({ data: { data: { hello: "world" } } } as any);
    const result = await gql<{ hello: string }>("{ hello }");
    expect(result).toEqual({ hello: "world" });
    expect(post).toHaveBeenCalledWith("", {
      query: "{ hello }",
      variables: undefined,
    });
  });

  it("forwards variables on the POST body", async () => {
    const post = vi
      .spyOn(graphqlClient, "post")
      .mockResolvedValue({ data: { data: { ok: true } } } as any);
    await gql("query X($id: ID!) { x(id:$id) }", { id: "42" });
    expect(post).toHaveBeenCalledWith("", {
      query: "query X($id: ID!) { x(id:$id) }",
      variables: { id: "42" },
    });
  });

  it("throws a GraphQLError joining all error messages", async () => {
    vi.spyOn(graphqlClient, "post").mockResolvedValue({
      data: {
        errors: [{ message: "bad input" }, { message: "denied" }],
      },
    } as any);
    await expect(gql("{ x }")).rejects.toBeInstanceOf(GraphQLError);
    await expect(gql("{ x }")).rejects.toThrow(/bad input; denied/);
  });
});

import axios from "axios";

const GRAPHQL_URL = import.meta.env.VITE_GRAPHQL_URL || "/graphql/";

export class GraphQLError extends Error {
  constructor(message: string, public readonly errors?: unknown[]) {
    super(message);
    this.name = "GraphQLError";
  }
}

const client = axios.create({
  baseURL: GRAPHQL_URL,
  headers: { "Content-Type": "application/json" },
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem("free_mentors_token");
  if (token) {
    config.headers.Authorization = `JWT ${token}`;
  }
  return config;
});

export async function gql<T = any>(
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  const { data } = await client.post("", { query, variables });
  if (data.errors && data.errors.length > 0) {
    const message = data.errors.map((e: any) => e.message).join("; ");
    throw new GraphQLError(message, data.errors);
  }
  return data.data as T;
}

export const graphqlClient = client;

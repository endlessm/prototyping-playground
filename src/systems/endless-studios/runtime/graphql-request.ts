// Stand-in for the `graphql-request` package, which copied components import for the `gql` tag. Queries never leave
// the prototype; `GraphQLClient` resolves empty and is reported once: screens use `$graphqlRequest` or useGraphQLQuery.
import { noticeOnce } from './notice';

export type RequestDocument = string;
export type Variables = Record<string, unknown>;

export function gql(chunks: TemplateStringsArray, ...values: unknown[]): string {
  return chunks.reduce((text, chunk, index) => text + chunk + (index < values.length ? String(values[index]) : ''), '');
}

export class ClientError extends Error {}

export class GraphQLClient {
  url: string;
  constructor(url: string) {
    this.url = url;
  }
  async request(): Promise<Record<string, never>> {
    noticeOnce('GraphQLClient', 'GraphQLClient.request is not stood in; use $graphqlRequest or useGraphQLQuery');
    return {};
  }
}

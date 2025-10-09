export type ResponseMeta = { asOf?: string; source?: string; schema_version?: string; trace_id?: string };
export function getMeta<T extends { meta?: ResponseMeta; _meta?: ResponseMeta }>(data: T): ResponseMeta {
  return (data && ((data as any).meta || (data as any)._meta)) || {};
}

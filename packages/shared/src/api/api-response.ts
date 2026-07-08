export type ApiStatus = 'success';

export interface ApiResponseEnvelope<TData> {
  status: ApiStatus;
  message: string;
  data: TData;
}

export interface ApiResponse<TData> {
  status: 'success';
  message: string;
  data: TData;
}

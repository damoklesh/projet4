export interface PaginationQuery {
  page: number;
  pageSize: number;
}

export interface PaginatedResult<TItem> {
  items: TItem[];
  total: number;
  page: number;
  pageSize: number;
}

export interface PaginationQuery {
  page: number;
  pageSize: number;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface PaginatedResult<TItem> {
  items: TItem[];
  pagination: PaginationMeta;
}

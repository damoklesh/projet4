export const FILE_STATUSES = ['active', 'expired', 'deleted'] as const;
export const FILE_STATUS_FILTERS = ['active', 'expired', 'all'] as const;

export type FileStatus = (typeof FILE_STATUSES)[number];
export type FileStatusFilter = (typeof FILE_STATUS_FILTERS)[number];

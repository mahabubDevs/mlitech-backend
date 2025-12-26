export interface AnalyticsQueryOptions {
    startDate?: string;
    endDate?: string;
    page?: number | undefined;
    limit?: number | undefined;
    forExport?: boolean; // if true, no pagination
}

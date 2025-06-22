export interface IListAPIResponse<T> {
  totalCount: number;
  records: T[];
}

export interface IPaginatedListAPIResponse<T> {
  totalCount: number;
  records: T[];
  page: number;
  limit: number;
  totalPages: number;
}

export interface IAddResponse {
  id: string;
}

export type IUpdateResponse = boolean;

export type IDeleteResponse = boolean;

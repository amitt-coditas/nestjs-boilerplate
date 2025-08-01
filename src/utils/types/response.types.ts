export interface IPaginatedListAPIResponse<T> {
  totalCount: number;
  records: T[];
  page: number;
  limit: number;
  totalPages: number;
}

export interface IListAPIResponse<T> {
  totalCount: number;
  records: T[];
}

export interface ICreateResponse {
  id: string;
}

export interface IUpdateResponse {
  status: boolean;
}

export interface IRemoveResponse {
  status: boolean;
}

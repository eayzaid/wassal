export interface ContactDto {
  name?: string;
  email?: string;
  phone?: string;
}

export interface ErrorResponse {
  error: string;
  message: string;
  contact?: ContactDto | null;
}

export interface MessageResponse {
  message: string;
}

export interface PageResponse<T> {
  content: T[];
  page?: {
    size: number;
    number: number;
    totalElements: number;
    totalPages: number;
  };
  pageable?: {
    pageNumber: number;
    pageSize: number;
    sort?: {
      empty: boolean;
      sorted: boolean;
      unsorted: boolean;
    };
    offset?: number;
    paged?: boolean;
    unpaged?: boolean;
  };
  last?: boolean;
  totalElements?: number;
  totalPages?: number;
  size?: number;
  number?: number;
  sort?: {
    empty: boolean;
    sorted: boolean;
    unsorted: boolean;
  };
  first?: boolean;
  numberOfElements?: number;
  empty?: boolean;
}

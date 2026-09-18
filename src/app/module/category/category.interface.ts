export interface ICreateCategory {
  name: string;
  description?: string;
  department: string;
  isActive?: boolean;
  paymentRequired?: boolean;
  paymentAmount?: number;
}

export interface IUpdateCategory {
  name?: string;
  description?: string;
  department?: string;
  isActive?: boolean;
  paymentRequired?: boolean;
  paymentAmount?: number;
}
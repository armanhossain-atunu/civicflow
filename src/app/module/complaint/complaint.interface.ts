export interface ICreateComplaint {
  title: string;
  description: string;
  categoryId: string;
  locationId?: string;
}
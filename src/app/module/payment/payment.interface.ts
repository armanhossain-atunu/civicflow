export interface ICreatePayment {
  complaintId: string;
}

export interface IBkashCreatePaymentRequest {
  amount: string;
  currency: string;
  intent: "sale";
  merchantInvoiceNumber: string;
  callbackURL?: string;
}

export interface IBkashCreatePaymentResponse {
  paymentID?: string;
  paymentId?: string;
  bkashURL?: string;
  transactionStatus?: string;
  amount?: string;
  currency?: string;
  merchantInvoiceNumber?: string;
  errorCode?: string;
  errorMessage?: string;
  statusCode?: string;
  statusMessage?: string;
  msg?: string;
}

export interface IBkashExecutePaymentResponse {
  paymentID?: string;
  paymentId?: string;
  trxID?: string;
  transactionStatus?: string;
  amount?: string;
  currency?: string;
  merchantInvoiceNumber?: string;
  errorCode?: string;
  errorMessage?: string;
  statusCode?: string;
  statusMessage?: string;
  msg?: string;
}

export interface IBkashGrantTokenResponse {
  id_token?: string;
  token_type?: string;
  expires_in?: number;
  refresh_token?: string;
  errorCode?: string;
  errorMessage?: string;
  statusMessage?: string;
  msg?: string;
}

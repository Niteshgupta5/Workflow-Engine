import { HttpMethod } from "./enums";

export interface SendEmail {
  from: string;
  to: string;
  subject: string | "";
  message: string;
}

export interface SendHttpRequest {
  method: HttpMethod;
  url: string;
  body?: Object;
  headers?: Object;
}

export interface UpdateDatabase {
  table: string;
  data: Object;
}

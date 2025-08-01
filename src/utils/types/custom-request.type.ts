import { Request } from 'express';

export interface CustomHeaders {
  authorization?: string;
  sessionId?: string;
}

export interface CustomRequest extends Request {
  customHeaders: CustomHeaders;
}

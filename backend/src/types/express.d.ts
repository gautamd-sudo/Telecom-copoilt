declare namespace Express {
  export interface Request {
    user?: {
      tenantId: string;
      apiKeyId: string;
      scopes: string[];
    };
  }
}

export {};

declare global {
  interface CustomJwtSessionClaims {
    metadata?: {
      isAdmin?: boolean;
    };
  }
}

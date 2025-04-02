import { auth as clerkAuth } from '@clerk/nextjs/server';

export const auth = async () => {
  const { sessionClaims, ...args } = await clerkAuth();

  return {
    ...args,
    sessionClaims,
    isAdmin: sessionClaims?.metadata?.isAdmin ?? false,
  };
};

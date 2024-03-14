import { createTRPCClient, httpBatchLink } from "@trpc/client";

import { AppRouter } from "@blobscan/api";

// @ts-ignore
const client = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: "http://localhost:3000/trpc",
    }),
  ],
});

export default client;

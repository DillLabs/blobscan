import { z } from "@blobscan/zod";

import { blockRouter } from "./routers/block";
import { blobRouter } from "./routers/blob";
import { publicProcedure } from "./procedures";
import { blobStoragesStateRouter } from "./routers/blob-storages-state";
import { blockchainSyncStateRouter } from "./routers/blockchain-sync-state";
import { indexerRouter } from "./routers/indexer";
import { searchRouter } from "./routers/search";
import { statsRouter } from "./routers/stats";
import { transactionRouter } from "./routers/tx";

import { t } from "./trpc-client";

export const appRouter = t.router({
  block: blockRouter,
  blob: blobRouter,
  tx: transactionRouter,
  search: searchRouter,
  stats: statsRouter,
  indexer: indexerRouter,
  syncState: blockchainSyncStateRouter,
  blobStoragesState: blobStoragesStateRouter,
  healthcheck: publicProcedure
    .meta({
      openapi: {
        method: "GET",
        path: "/healthcheck",
        summary: "connection healthcheck.",
        tags: ["system"],
      },
    })
    .input(z.void())
    .output(z.string())
    .query(() => "yay!"),
});

// export type definition of API
export type AppRouter = typeof appRouter;

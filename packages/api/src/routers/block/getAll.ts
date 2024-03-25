import { z } from "@blobscan/zod";

import {
  createExpandsSchema,
  withExpands,
} from "../../middlewares/withExpands";
import {
  withAllFiltersSchema,
  withFilters,
} from "../../middlewares/withFilters";
import {
  withPaginationSchema,
  withPagination,
} from "../../middlewares/withPagination";
import { publicProcedure } from "../../procedures";
import { calculateDerivedTxBlobGasFields, isEmptyObject } from "../../utils";
import {
  createBlockSelect,
  serializeBlock,
  serializedBlockSchema,
} from "./common";
import type { QueriedBlock } from "./common";

const inputSchema = withAllFiltersSchema
  .merge(createExpandsSchema(["transaction", "blob"]))
  .merge(withPaginationSchema)
  .optional();

const outputSchema = z.object({
  blocks: serializedBlockSchema.array(),
  totalBlocks: z.number(),
});

export const getAll = publicProcedure
  .meta({
    openapi: {
      method: "GET",
      path: "/blocks",
      tags: ["blocks"],
      summary: "retrieves all blocks.",
    },
  })
  .input(inputSchema)
  .use(withFilters)
  .use(withExpands)
  .use(withPagination)
  .output(outputSchema)
  .query(async ({ ctx }) => {
    const {
      blockRangeFilter,
      rollupFilter,
      slotRangeFilter,
      typeFilter,
      sort,
    } = ctx.filters;

    const [queriedBlocks, totalBlocks] = await Promise.all([
      ctx.prisma.block.findMany({
        select: createBlockSelect(ctx.expands),
        where: {
          ...blockRangeFilter,
          ...slotRangeFilter,
          ...typeFilter,
          transactions: {
            some: {
              rollup: rollupFilter,
            },
          },
        },
        orderBy: { number: sort },
        ...ctx.pagination,
      }),
      ctx.prisma.blockOverallStats
        .findFirst({
          select: {
            totalBlocks: true,
          },
        })
        .then((stats) => stats?.totalBlocks ?? 0),
    ]);

    const isTransactionSelectExpanded = !isEmptyObject(
      ctx.expands.expandedTransactionSelect
    );

    let blocks: QueriedBlock[] = queriedBlocks;

    if (isTransactionSelectExpanded) {
      blocks = blocks.map((block) => ({
        ...block,
        transactions: block.transactions.map((tx) => ({
          ...tx,
          ...calculateDerivedTxBlobGasFields({
            blobGasPrice: block.blobGasPrice,
            maxFeePerBlobGas: tx.maxFeePerBlobGas,
            txBlobsLength: tx.blobs.length,
          }),
        })),
      }));
    }

    /**
     * When rollup filter is set we need to filter out the transactions don't
     * match manually as the query returns all the transactions in the block
     */
    if (rollupFilter !== undefined) {
      blocks = queriedBlocks.map((block) => ({
        ...block,
        transactions: block.transactions.filter(
          (tx) => tx.rollup === rollupFilter
        ),
      }));
    }

    return {
      blocks: blocks.map(serializeBlock),
      totalBlocks,
    };
  });

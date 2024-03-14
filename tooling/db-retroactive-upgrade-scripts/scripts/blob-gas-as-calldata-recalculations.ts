import { inspect } from "util";

import { getBlobStorageManager } from "@blobscan/blob-storage-manager";
import { prisma } from "@blobscan/db";

const BATCH_SIZE = 1000;

// https://storage.googleapis.com/${env.NEXT_PUBLIC_GOOGLE_STORAGE_BUCKET_NAME}/${blobReference}

function getEIP2028CalldataGas(hexData: string) {
  const bytes = Buffer.from(hexData.slice(2), "hex");
  let gasCost = BigInt(0);

  for (const byte of bytes.entries()) {
    if (byte[1] === 0) {
      gasCost += BigInt(4);
    } else {
      gasCost += BigInt(16);
    }
  }

  return gasCost;
}

// function calculateTxBlobAsCalldataGasUsed(dbTxs: any) {
//   return tx;
// }
// const blobAsCalldataGasUsed = dbTxs.reduce(
//   (acc, tx) => acc.add(tx.blobAsCalldataGasUsed),
//   new Prisma.Decimal(0)
// );

// const blobGasAsCalldataUsed = txBlobs.reduce(
//   (acc, b) => acc + getEIP2028CalldataGas(b.data),
//   BigInt(0)
// );

async function main() {
  const blockCount = 226742;
  // const blobStorageManager = await getBlobStorageManager();
  // const blockCount = await prisma.block.count();
  const batches = Math.ceil(blockCount / BATCH_SIZE);

  // for (let i = 0; i < batches; i++) {
  const fullBlocks = await prisma.block.findMany({
    // skip: i * BATCH_SIZE,
    // take: BATCH_SIZE,
    skip: 0,
    take: 1000,
    select: {
      hash: true,
      transactions: {
        select: {
          hash: true,
          blobs: {
            select: {
              blob: {
                select: {
                  dataStorageReferences: {
                    select: {
                      blobHash: true,
                      dataReference: true,
                      blobStorage: true,
                    },
                    where: {
                      blobStorage: "GOOGLE",
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  const formattedBlocks = fullBlocks.map((b) => ({
    blockHash: b.hash,
    transactions: b.transactions.map((t) => ({
      hash: t.hash,
      blobs: t.blobs.flatMap((b) =>
        b.blob.dataStorageReferences.map((ref) => ({
          blobHash: ref.blobHash,
          dataReference: ref.dataReference,
          storage: ref.blobStorage,
        }))
      ),
    })),
  }));

  console.log(inspect(formattedBlocks, { depth: 20 }));

  // console.log(blockIds);
  // console.log(klockIds.map((b) => b.transactions.map(t)));

  // }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });

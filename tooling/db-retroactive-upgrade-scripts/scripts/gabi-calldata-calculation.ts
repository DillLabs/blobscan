// import { PrismaClient, Prisma } from '@prisma/client';

// const prisma = new PrismaClient();
// const batchSize = 1000;

// export function getEIP2028CalldataGas(hexData: string) {
//     const bytes = Buffer.from(hexData.slice(2), "hex");
//     let gasCost = BigInt(0);

//     for (const byte of bytes.entries()) {
//       if (byte[1] === 0) {
//         gasCost += BigInt(4);
//       } else {
//         gasCost += BigInt(16);
//       }
//     }

//     return gasCost;
//   }

// async function updateBlocksInBatches() {
//   let lastBlockNumber = 0;
//   let continueUpdating = true;

//   while (continueUpdating) {
//     const blocks = await prisma.block.findMany({
//       select: {
//         number: true,
//         transactions: {
//           select: {
//             blobs: {
//               select: {
//                 data: true,
//               },
//             },
//             }
//           },
//         },
//         }
//       },
//       where: {
//         number: {
//           gt: lastBlockNumber,
//         },
//       },
//       take: batchSize,
//       orderBy: {
//         number: 'asc',
//       },
//     });

//     if (blocks.length === 0) {
//       continueUpdating = false;
//     } else {

//         const blobAsCalldataGasUsed = dbTxs.reduce(
//             (acc, tx) => acc.add(tx.blobAsCalldataGasUsed),
//             new Prisma.Decimal(0)
//           );

//       const blobGasAsCalldataUsed = txBlobs.reduce(
//         (acc, b) => acc + getEIP2028CalldataGas(b.data),
//         BigInt(0)
//       );

//       lastBlockNumber = blocks[blocks.length - 1].number;
//       for (const block of blocks) {
//         const newBlobAsCalldataGasUsed = calculateNewValueForBlock(block); // Your calculation logic here

//         await prisma.block.update({
//           where: { hash: block.hash },
//           data: { blobAsCalldataGasUsed: newBlobAsCalldataGasUsed },
//         });
//       }
//     }
//   }
// }

// // Placeholder for your actual calculation logic
// function calculateNewValueForBlock(block: any): Prisma.Decimal {
//   // Implement the logic to calculate the new value
//   return new Prisma.Decimal(0); // Example placeholder
// }

// async function run() {
//   try {
//     await updateBlocksInBatches();
//     console.log('Blocks updated successfully in batches.');
//   } catch (error) {
//     console.error('Error updating blocks in batches:', error);
//   } finally {
//     await prisma.$disconnect();
//   }
// }

// run();

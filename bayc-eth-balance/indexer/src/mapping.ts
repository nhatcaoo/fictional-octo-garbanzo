import { Transfer } from "../generated/bayc/bayc";
import { TransferEvent } from "../generated/schema";

export function handleTransfer(event: Transfer): void {
  let transferEvent = new TransferEvent(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  );
  transferEvent.from = event.params.from;
  transferEvent.to = event.params.to;
  transferEvent.tokenId = event.params.tokenId;
  transferEvent.timestamp = event.block.timestamp;
  transferEvent.blockNumber = event.block.number; // Store block number
  transferEvent.save();
}

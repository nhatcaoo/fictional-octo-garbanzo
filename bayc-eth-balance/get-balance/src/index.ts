import { Spinner } from "cli-spinner";
import { Alchemy, Network } from "alchemy-sdk";
import EthDater from "ethereum-block-by-date";
import { ethers } from "ethers";
import dotenv from "dotenv";
import { gql } from "graphql-tag";
import axios from "axios";
dotenv.config(); // Load environment variables from .env file

const config = {
  apiKey: process.env.API_KEY || "w7-WwSvNLs6sD_eQJVASk6_xrbu10GeA",
  network: Network.ETH_MAINNET,
};
const GRAPH_API_URL = process.env.GRAPH_API_URL || "http://127.0.0.1:8000/subgraphs/name/indexer/";
const alchemy = new Alchemy(config);
const provider = new ethers.providers.JsonRpcProvider(`https://eth-mainnet.alchemyapi.io/v2/${config.apiKey}`);

const dater = new EthDater(provider);

const FROM_BLOCK = parseInt(process.env.FROM_BLOCK || "12287507", 10); // Default fromBlock if not provided
const MAX_CHUNK_SIZE = 1000; // Adjust this based on GraphQL server limits

async function getCurrentBlockNumber(): Promise<number> {
  try {
    const response = await alchemy.core.getBlockNumber();
    return response;
  } catch (error) {
    console.error("Error fetching current block number:", error);
    throw error;
  }
}

async function getHoldersByEpoch(epoch: number): Promise<{ holdersWithBalance: string[]; targetBlockNum: number }> {
  const spinner = new Spinner("Fetching data... 0%");
  spinner.setSpinnerString(18); // Optional: Customize spinner style

  try {
    const timestamp = epoch === Infinity ? new Date().toISOString() : new Date(epoch * 1000).toISOString();
    const block = await dater.getDate(timestamp);
    const targetBlockNumber = block["block"];
    console.log("Target Block Number:", targetBlockNumber);
    spinner.start();

    if (targetBlockNumber < FROM_BLOCK) {
      throw new Error("Invalid target block number: " + targetBlockNumber);
    }
    let hasNextPage = true;
    let holdersMap: Map<string, number> = new Map();
    let pageCursor: string | null = null;
    let totalTxs = 0;
    while (hasNextPage) {
      const query = gql`
          query Transfers($targetblock: BigInt!, $cursor: String) {
            transferEvents(first: ${MAX_CHUNK_SIZE}, where: { blockNumber_lte: $targetblock }, after: $cursor) {
              id
              from
              to
              tokenId
              timestamp
              blockNumber
            }
          }
        `;

      const response: any = await axios.post(GRAPH_API_URL, {
        query: query.loc?.source.body, // Access the raw query string
        variables: {
          targetblock: targetBlockNumber,
          cursor: pageCursor,
        },
      });

      const transferEvents = response.data.data.transferEvents;
      transferEvents.forEach((tx: any) => {
        const { from, to } = tx;
        if (from !== "0x0000000000000000000000000000000000000000") {
          holdersMap.set(from.toLowerCase(), (holdersMap.get(from.toLowerCase()) || 0) - 1);
        }
        if (to !== "0x0000000000000000000000000000000000000000" && to) {
          holdersMap.set(to.toLowerCase(), (holdersMap.get(to.toLowerCase()) || 0) + 1);
        }
      });

      // Update page cursor for next page if available
      pageCursor = transferEvents.length === MAX_CHUNK_SIZE ? transferEvents[MAX_CHUNK_SIZE - 1].id : null;
      hasNextPage = transferEvents.length === MAX_CHUNK_SIZE;
      totalTxs = totalTxs + transferEvents.length;
      // Calculate progress
      spinner.setSpinnerTitle(`Fetching data... number of transfer transaction fetched: ${totalTxs}`);
    }

    spinner.setSpinnerTitle(`Fetching data... 100%`);
    const holdersWithBalance: string[] = [];
    holdersMap.forEach((balance, address) => {
      if (balance > 0) {
        holdersWithBalance.push(address);
      }
    });
    return { holdersWithBalance: holdersWithBalance, targetBlockNum: targetBlockNumber };
  } catch (error) {
    console.error("Error:", error);
    throw error;
  } finally {
    spinner.stop(true); // Stop the spinner regardless of success or error
    console.log("\nFinish fetching data.");
  }
}

async function getEthBalanceAtBlockWithRetry(address: string, blockNumber: number, retries = 3): Promise<string> {
  try {
    const balanceWei = await alchemy.core.getBalance(address, ethers.utils.hexValue(blockNumber));
    const balanceEth = ethers.utils.formatEther(balanceWei);
    return balanceEth;
  } catch (error: any) {
    if (retries > 0) {
      console.warn(`Request timed out. Retrying... (${retries} retries left)`);
      await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait for 2 seconds before retrying
      return getEthBalanceAtBlockWithRetry(address, blockNumber, retries - 1);
    } else {
      console.error(`Error fetching balance for address ${address} at block ${blockNumber}:`, error);
      throw error;
    }
  }
}

// Function to calculate total ETH value of addresses at a specific block number
async function calculateTotalEthValue(addresses: string[], blockNumber: number): Promise<string> {
  const spinner = new Spinner("Calculating ETH balances... %s");

  try {
    let totalEthValue = ethers.BigNumber.from(0);

    // Initialize spinner
    spinner.setSpinnerString(18);
    spinner.start();

    // Iterate through each address and accumulate ETH balance
    for (let i = 0; i < addresses.length; i++) {
      const address = addresses[i];
      const balanceEth = await getEthBalanceAtBlockWithRetry(address, blockNumber);
      const balanceWei = ethers.utils.parseEther(balanceEth); // Convert ETH to Wei
      totalEthValue = totalEthValue.add(balanceWei);

      // Update spinner and log progress
      spinner.setSpinnerTitle(
        `Calculating ETH balances at block ${blockNumber}... ${Math.round(((i + 1) / addresses.length) * 100)}% - [${i + 1}/${addresses.length}]`
      );
    }

    // Convert total value from Wei to ETH
    return ethers.utils.formatEther(totalEthValue);
  } catch (error) {
    console.error("Error calculating total ETH value:", error);
    throw error;
  } finally {
    // Stop spinner and log finish
    spinner.stop(true);
    console.log("Finish calculating ETH balances.");
  }
}

function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${padZero(hours)}:${padZero(minutes)}:${padZero(remainingSeconds)}`;
}

function padZero(num: number): string {
  return num.toString().padStart(2, "0");
}

async function promptUserInput(prompt: string): Promise<string> {
  return new Promise<string>((resolve) => {
    const stdin = process.stdin;
    stdin.setEncoding("utf8");
    stdin.resume();
    console.log(prompt);

    stdin.on("data", (data: Buffer) => {
      const userInput = data.toString().trim(); // Convert Buffer to string and trim whitespace
      resolve(userInput);
      stdin.pause();
    });
  });
}

const main = async (): Promise<void> => {
  try {
    let epochTimeStr = await promptUserInput("Enter the epoch time (Unix timestamp) or leave blank for latest block: ");
    let epochTime = epochTimeStr ? parseInt(epochTimeStr) : Infinity;

    if (isNaN(epochTime)) {
      throw new Error("Invalid epoch time. Please enter a valid Unix timestamp.");
    }

    const { holdersWithBalance, targetBlockNum } = await getHoldersByEpoch(epochTime);
    console.log(`\nNumber of holders with positive balance: ${holdersWithBalance.length}`);

    // Calculate total ETH value
    const totalEthValue = await calculateTotalEthValue(holdersWithBalance, targetBlockNum);
    console.log(`\n🚀 Total ETH value of all holders of BAYC at epoch ${epochTime || "latest"} is: ${totalEthValue} `);
  } catch (error) {
    console.error("Error:", error);
  }
};

main();

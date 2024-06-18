# ETH Holder Balance Calculator

1.	Bored Ape Yacht Club (BAYC) is the current bluechip NFT project on Ethereum Blockchain.
a.	Blockchain: Ethereum
b.	Contract address: 0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d
c.	Website: https://boredapeyachtclub.com/#/
2.	Create a program using node.js/Java to get the total ETH value in the crypto wallets of all holders at any time. 
3.	The program should take epoch time as the only input, and output the ETH value.

# Project Setup

## Prerequisites
- Docker
- Node.js

## Setup Instructions

### 1. Run the Graph Indexer

To set up and run the Graph indexer, follow these steps:

Run the `setup-indexer.sh` script:

 ```bash
    cd indexer
    ./scripts/setup-indexer.sh
 ```

This script will:
- Install dependencies
- Generate code
- Build the project
- Start Docker containers
- Create and deploy the subgraph

Wait for the indexer to catch up to the latest block.

### 2. Run the get-balance Service

Once the Graph indexer is set up and running, you can start the `get-balance` service:

 ```bash
    cd get-balance
    npm install 
    npm run start
```

## Some test cases
1. 1619220828
2. 1621812828
3. 1627083228



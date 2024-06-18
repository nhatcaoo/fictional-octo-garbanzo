const readline = require('readline');

// Function to read input from standard input
const readInput = () => {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    return new Promise((resolve) => {
        const input = [];

        // Function to prompt user for numNodes
        const promptForNumNodes = () => {
            rl.question('Enter the number of nodes in the network (5 <= numNodes <= 500): ', (numNodes) => {
                numNodes = parseInt(numNodes);
                if (numNodes >= 5 && numNodes <= 500) {
                    input.push(numNodes);
                    promptForVirusLocation();
                } else {
                    console.log('Invalid input. Please enter a number between 5 and 500.');
                    promptForNumNodes();
                }
            });
        };

        // Function to prompt user for virusLocation
        const promptForVirusLocation = () => {
            rl.question(`Enter the starting node of the virus (0 <= virusLocation < ${input[0]}): `, (virusLocation) => {
                virusLocation = parseInt(virusLocation);
                const numNodes = input[0];
                if (virusLocation >= 0 && virusLocation < numNodes) {
                    input.push(virusLocation);
                    promptForNumLinks();
                } else {
                    console.log(`Invalid input. Please enter a number i [0 , ${numNodes - 1}].`);
                    promptForVirusLocation();
                }
            });
        };

        // Function to prompt user for numLinks
        const promptForNumLinks = () => {
            const numNodes = input[0];
            const maximumNumberOfLinks = (numNodes * (numNodes - 1)) / 2
            rl.question(`Enter the number of links in the network (${numNodes - 2} < numLinks < ${maximumNumberOfLinks}): `, (numLinks) => {
                numLinks = parseInt(numLinks);
                if (numLinks > numNodes - 2 && numLinks < maximumNumberOfLinks) {
                    input.push(numLinks);
                    console.log('Enter the links (each in the format "i j"):');
                    let linksCount = 0;
                    const links = [];

                    // Read each link from user input
                    rl.on('line', (line) => {
                        const trimmedLine = line.trim();
                        if (trimmedLine) {
                            const link = trimmedLine.split(' ').map(Number);
                            if (link.length === 2 && isValidLink(link, links, numNodes)) {
                                links.push(link);
                                linksCount++;
                            } else {
                                console.log('Invalid input format or duplicate link. Please enter links in the format "i j" and ensure they are valid.');
                            }
                        }

                        // If all links are read, close the readline interface and resolve the promise
                        if (linksCount === numLinks) {

                            rl.close();
                            input.push(links);
                            resolve(input);
                        }
                    });
                } else {
                    console.log(`Invalid input. Please enter a number of links in (${numNodes - 2} , ${maximumNumberOfLinks}).`);
                    promptForNumLinks();
                }
            });
        };

        // Function to validate if a link is valid
        const isValidLink = (link, links, numNodes) => {
            const [i, j] = link;
            if (i === j || i < 0 || i >= numNodes || j < 0 || j >= numNodes) {
                return false; // Self-loop or nodes out of bounds
            }
            for (const [existingI, existingJ] of links) {
                if ((existingI === i && existingJ === j) || (existingI === j && existingJ === i)) {
                    return false; // Duplicate link
                }
            }
            return true;
        };

        // Start prompting for inputs
        promptForNumNodes();
    });
};

// Function to find the best firewall location
const findBestFirewallLocation = (numNodes, virusLocation, links) => {
    const graph = Array.from({ length: numNodes }, () => []);

    // Build adjacency list for the graph
    links.forEach(([i, j]) => {
        graph[i].push(j);
        graph[j].push(i);
    });

    // Function to perform BFS and return visited nodes
    const bfs = (start, blocked) => {
        const queue = [start];
        const visited = new Set([start]);

        while (queue.length > 0) {
            const node = queue.shift();
            for (const neighbor of graph[node]) {
                if (!visited.has(neighbor) && neighbor !== blocked) {
                    visited.add(neighbor);
                    queue.push(neighbor);
                }
            }
        }
        return visited;
    };

    let bestNode = null;
    let maxSaved = -1;

    // Evaluate each node as a potential firewall location
    for (let node = 0; node < numNodes; node++) {
        if (node !== virusLocation) {
            const infectedWithFirewall = bfs(virusLocation, node);
            const saved = numNodes - infectedWithFirewall.size;
            if (saved > maxSaved) {
                maxSaved = saved;
                bestNode = node;
            }
        }
    }

    return bestNode;
};

// Main function to execute the script
const main = async () => {
    try {
        console.log('Welcome! Please provide the following inputs:');
        const input = await readInput();

        const numNodes = input[0];
        const virusLocation = input[1];
        const links = input[3];
        console.log('\nCalculating optimal firewall location...');
        const result = findBestFirewallLocation(numNodes, virusLocation, links);
        console.log('Optimal firewall location:', result);
    } catch (error) {
        console.error('Error:', error);
    }
};

// Execute the main function
main();

module.exports = { findBestFirewallLocation };

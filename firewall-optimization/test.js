const fs = require('fs');
const path = require('path');
const { findBestFirewallLocation } = require('./firewall.js');

const filePath = path.resolve(__dirname, 'testcases.txt');

const readTestCases = async () => {
    try {
        const input = fs.readFileSync(filePath, 'utf8').trim().split('---\r\n');

        for (let i = 0; i < input.length; i++) {
            const lines = input[i].trim().split('\n').map(line => line.trim());
            const numNodes = parseInt(lines[1]);
            const virusLocation = parseInt(lines[2]);
            const output = parseInt(lines[lines.length - 1]);
            const links = lines.slice(3)
                .map(line => line.split(' ')
                    .filter(str => str !== '') // Filter out empty strings
                    .map(Number)
                )
                .filter(arr => arr.length === 2); // Filter out invalid link pairs

            const result = findBestFirewallLocation(numNodes, virusLocation, links);
            if (result === output) {
                console.log(`Test Case ${i + 1}: Result = ${result} - Passed`);
            } else {
                console.log(`Test Case ${i + 1}: Result = ${result} - Failed (Expected: ${output})`);
            }
        }
    } catch (error) {
        console.error('Error:', error);
    } finally {
        process.exit(0); // Exit the program after processing all test cases
    }
};

readTestCases();

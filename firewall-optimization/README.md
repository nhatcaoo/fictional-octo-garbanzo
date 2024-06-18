# Firewall optimization

A virus is installed in one of the nodes of a network. The goal is to protect the largest possible part of the network from the virus by placing a firewall on a single node that the virus cannot traverse.
You must output the optimal location of the firewall. You cannot place your firewall on an infected node.

NOTE: The virus can spread through any link in the network. Solutions are unique, no tiebreaking is needed.
Input
- Line 1: An integer, numNodes, the number of nodes in the network
- Line 2: An integer, virusLocation, the starting node of the virus
- Line 3: An integer, numLinks, the number of links within the network

- Next numLinks lines: Two space-separated integers i and j representing the indexes of the nodes connected by the undirected link
<p>
Output: 
An integer firewallLocation, the index of the node where the firewall should be placed.
</p>
<p>
Constraints
5 <= numNodes <= 500
numNodes-2 < numLinks < 800
</p>

## Run

```bash
node firewall.js
node test.js 
```
## Steps
### Initialization: 
Start BFS from the virusLocation to explore all nodes that the virus can reach initially.

### Evaluation:
For each potential firewall location (every node except virusLocation):

Perform BFS with that node blocked to simulate placing a firewall there.
Count how many nodes can still be reached by the virus (nodes not visited by BFS).
### Selection:
Choose the node that allows the fewest nodes to be reached (protects the most nodes) as the optimal firewall location.
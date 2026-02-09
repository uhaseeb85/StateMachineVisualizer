/**
 * GraphSplittingService
 * 
 * Provides graph partitioning algorithms for state machine splitting.
 * Uses community detection and connected component analysis.
 * 
 * Features:
 * - Connected component detection using BFS
 * - Graph partitioning using Girvan-Newman-inspired algorithm
 * - Boundary edge detection
 * - Subgraph validation
 * 
 * SOLID Principles:
 * - Single Responsibility: Only handles graph partitioning algorithms
 * - Open/Closed: Can be extended with new partitioning strategies
 */

/**
 * GraphSplittingService class
 * Encapsulates state machine graph partitioning algorithms
 */
export class GraphSplittingService {
  /**
   * Default number of target partitions
   */
  DEFAULT_TARGET_PARTITIONS = 3;

  /**
   * Splits a state machine graph into partitions
   * 
   * @param {Array} states - Array of state objects
   * @param {number} targetPartitions - Target number of partitions
   * @returns {Array} Array of partition objects
   */
  splitGraph(states, targetPartitions = this.DEFAULT_TARGET_PARTITIONS) {
    if (!states || states.length === 0) {
      return [];
    }

    // Find partitions
    const partitionGroups = this.findPartitions(states, targetPartitions);

    // Convert partition groups to partition objects with metadata
    return partitionGroups.map((stateIds, index) => {
      const partitionStates = states.filter(s => stateIds.includes(s.id));
      const boundaries = this.findBoundaryEdges(partitionStates, states);

      return {
        id: `partition-${index + 1}`,
        name: `Subgraph ${index + 1}`,
        stateIds,
        states: partitionStates,
        stateCount: stateIds.length,
        boundaries: boundaries.length,
        boundaryEdges: boundaries
      };
    });
  }

  /**
   * Finds connected components in a graph using BFS
   * A connected component is a maximal set of states where every state
   * is reachable from every other state through some path
   * 
   * @param {Array} states - Array of state objects
   * @returns {Array} Array of connected component groups (arrays of state IDs)
   */
  findConnectedComponents(states) {
    const visited = new Set();
    const components = [];

    // For each state, if not visited, run BFS to find connected component
    for (const state of states) {
      if (visited.has(state.id)) continue;

      const component = [];
      const queue = [state.id];
      visited.add(state.id);

      while (queue.length > 0) {
        const currentId = queue.shift();
        component.push(currentId);

        // Find the current state object
        const currentState = states.find(s => s.id === currentId);
        if (!currentState) continue;

        // Add all connected states to the queue
        const connectedStateIds = new Set();

        // Add states that are targets of this state's rules (outgoing edges)
        currentState.rules.forEach(rule => {
          if (rule.nextState && !visited.has(rule.nextState)) {
            connectedStateIds.add(rule.nextState);
          }
        });

        // Add states that have this state as a target in their rules (incoming edges)
        states.forEach(s => {
          if (s.id !== currentId) {
            s.rules.forEach(rule => {
              if (rule.nextState === currentId && !visited.has(s.id)) {
                connectedStateIds.add(s.id);
              }
            });
          }
        });

        // Process all connected states
        for (const id of connectedStateIds) {
          if (!visited.has(id)) {
            visited.add(id);
            queue.push(id);
          }
        }
      }

      // Add this connected component to our result
      if (component.length > 0) {
        components.push(component);
      }
    }

    return components;
  }

  /**
   * Uses community detection algorithms to find natural partitions in a connected graph
   * Implements a basic version of the Girvan-Newman algorithm
   * 
   * @param {Array} states - Array of state objects
   * @param {number} targetPartitions - Target number of partitions to create
   * @returns {Array} Array of partition groups (arrays of state IDs)
   */
  findPartitions(states, targetPartitions = this.DEFAULT_TARGET_PARTITIONS) {
    // Validate inputs
    if (!states || states.length === 0) {
      return [];
    }

    // If target partitions exceeds number of states, adjust to maximum possible
    const validTargetPartitions = Math.min(targetPartitions, states.length);

    // If only one state, return it as a single partition
    if (states.length === 1) {
      return [[states[0].id]];
    }

    // First check if the graph already has natural connected components
    const connectedComponents = this.findConnectedComponents(states);
    if (connectedComponents.length > 1) {
      return connectedComponents;
    }

    // For a simple approach, we'll use a state's connection count as a metric
    // States with more connections are more "central" and should be kept in different partitions
    const stateConnections = this.calculateStateConnections(states);

    // Sort states by connection count (descending)
    stateConnections.sort((a, b) => b.connections - a.connections);

    // Initialize partitions with the most connected states as "seeds"
    const partitions = [];
    for (let i = 0; i < validTargetPartitions && i < stateConnections.length; i++) {
      partitions.push([stateConnections[i].id]);
    }

    // Assign remaining states to nearest partition based on connections
    const assignedStates = new Set(partitions.flat());

    for (const stateConn of stateConnections) {
      if (assignedStates.has(stateConn.id)) continue;

      // Find which partition this state has the most connections to
      const partitionScores = partitions.map(partition => {
        return this.calculateConnectionScore(stateConn.id, partition, states);
      });

      // Assign to partition with highest score
      const maxScore = Math.max(...partitionScores);
      const bestPartitionIndex = partitionScores.indexOf(maxScore);

      partitions[bestPartitionIndex].push(stateConn.id);
      assignedStates.add(stateConn.id);
    }

    // Filter out empty partitions
    return partitions.filter(p => p.length > 0);
  }

  /**
   * Calculates connection scores for states
   * 
   * @param {Array} states - Array of state objects
   * @returns {Array} Array of objects with state id, connections count, and name
   */
  calculateStateConnections(states) {
    return states.map(state => {
      // Count outgoing connections
      const outgoing = state.rules.length;

      // Count incoming connections
      const incoming = states.reduce((count, s) => {
        return count + s.rules.filter(rule => rule.nextState === state.id).length;
      }, 0);

      return {
        id: state.id,
        connections: outgoing + incoming,
        name: state.name
      };
    });
  }

  /**
   * Calculates how connected a state is to a partition
   * 
   * @param {string} stateId - State ID to check
   * @param {Array} partition - Array of state IDs in the partition
   * @param {Array} states - All states
   * @returns {number} Connection score
   */
  calculateConnectionScore(stateId, partition, states) {
    const state = states.find(s => s.id === stateId);
    if (!state) return 0;

    let score = 0;

    // Check outgoing connections to partition
    state.rules.forEach(rule => {
      if (partition.includes(rule.nextState)) {
        score++;
      }
    });

    // Check incoming connections from partition
    partition.forEach(partitionStateId => {
      const partitionState = states.find(s => s.id === partitionStateId);
      if (partitionState) {
        partitionState.rules.forEach(rule => {
          if (rule.nextState === stateId) {
            score++;
          }
        });
      }
    });

    return score;
  }

  /**
   * Finds boundary edges - edges that connect states in one partition to states outside
   * 
   * @param {Array} partitionStates - States in the partition
   * @param {Array} allStates - All states in the graph
   * @returns {Array} Array of boundary edge objects
   */
  findBoundaryEdges(partitionStates, allStates) {
    const partitionStateIds = new Set(partitionStates.map(s => s.id));
    const boundaries = [];

    partitionStates.forEach(state => {
      state.rules.forEach(rule => {
        if (rule.nextState && !partitionStateIds.has(rule.nextState)) {
          const targetState = allStates.find(s => s.id === rule.nextState);
          if (targetState) {
            boundaries.push({
              fromState: state.name,
              toState: targetState.name,
              condition: rule.condition,
              type: 'outgoing'
            });
          }
        }
      });
    });

    return boundaries;
  }

  /**
   * Finds entry points - states in a partition that are referenced by states outside
   * 
   * @param {Array} partitionStates - States in the partition
   * @param {Array} allStates - All states in the graph
   * @returns {Array} Array of entry point state names
   */
  findEntryPoints(partitionStates, allStates) {
    const partitionStateIds = new Set(partitionStates.map(s => s.id));
    const entryPoints = new Set();

    allStates.forEach(state => {
      // Skip states in the partition
      if (partitionStateIds.has(state.id)) return;

      // Check if this external state references any state in the partition
      state.rules.forEach(rule => {
        if (partitionStateIds.has(rule.nextState)) {
          const targetState = partitionStates.find(s => s.id === rule.nextState);
          if (targetState) {
            entryPoints.add(targetState.name);
          }
        }
      });
    });

    return Array.from(entryPoints);
  }

  /**
   * Finds exit points - states in a partition that reference states outside
   * 
   * @param {Array} partitionStates - States in the partition
   * @param {Array} allStates - All states in the graph
   * @returns {Array} Array of exit point state names
   */
  findExitPoints(partitionStates, allStates) {
    const partitionStateIds = new Set(partitionStates.map(s => s.id));
    const exitPoints = new Set();

    partitionStates.forEach(state => {
      state.rules.forEach(rule => {
        if (rule.nextState && !partitionStateIds.has(rule.nextState)) {
          exitPoints.add(state.name);
        }
      });
    });

    return Array.from(exitPoints);
  }

  /**
   * Validates that partitions are non-overlapping
   * 
   * @param {Array} partitions - Array of partition objects
   * @returns {boolean} True if valid
   */
  validatePartitions(partitions) {
    const allStateIds = new Set();

    for (const partition of partitions) {
      for (const stateId of partition.stateIds) {
        if (allStateIds.has(stateId)) {
          return false; // Duplicate state found
        }
        allStateIds.add(stateId);
      }
    }

    return true;
  }

  /**
   * Merges multiple partitions into one
   * 
   * @param {Array} partitions - Array of partition objects to merge
   * @param {Array} states - All states
   * @returns {Object} Merged partition object
   */
  mergePartitions(partitions, states) {
    const mergedStateIds = [];
    partitions.forEach(partition => {
      mergedStateIds.push(...partition.stateIds);
    });

    const uniqueStateIds = [...new Set(mergedStateIds)];
    const partitionStates = states.filter(s => uniqueStateIds.includes(s.id));
    const boundaries = this.findBoundaryEdges(partitionStates, states);

    return {
      id: `partition-merged`,
      name: `Merged Subgraph`,
      stateIds: uniqueStateIds,
      states: partitionStates,
      stateCount: uniqueStateIds.length,
      boundaries: boundaries.length,
      boundary Edges: boundaries
    };
  }

  /**
   * Splits a partition into smaller partitions
   * 
   * @param {Object} partition - Partition object to split
   * @param {Array} states - All states
   * @param {number} targetCount - Target number of sub-partitions
   * @returns {Array} Array of new partition objects
   */
  splitPartition(partition, states, targetCount = 2) {
    const partitionStates = states.filter(s => partition.stateIds.includes(s.id));
    return this.splitGraph(partitionStates, targetCount);
  }
}

// Singleton instance
let instance = null;

/**
 * Gets the singleton instance of GraphSplittingService
 * @returns {GraphSplittingService}
 */
export const getGraphSplittingService = () => {
  if (!instance) {
    instance = new GraphSplittingService();
  }
  return instance;
};

export default GraphSplittingService;

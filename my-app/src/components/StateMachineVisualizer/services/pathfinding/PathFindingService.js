/**
 * PathFindingService
 * 
 * Provides path finding algorithms for state machine navigation.
 * Uses depth-first search (DFS) with cycle detection and performance optimizations.
 * 
 * Features:
 * - Find paths to end states (states with no outgoing rules)
 * - Find paths between specific states
 * - Find paths through intermediate states
 * - Cycle detection to prevent infinite loops
 * - Progress tracking for long-running searches
 * - Performance optimizations (O(1) lookups, batched updates)
 * 
 * SOLID Principles:
 * - Single Responsibility: Only handles path finding algorithms
 * - Open/Closed: Can be extended with new pathfinding strategies
 */

/**
 * PathFindingService class
 * Encapsulates state machine path finding algorithms
 */
export class PathFindingService {
  /**
   * Maximum path length multiplier to prevent infinite loops
   */
  MAX_PATH_LENGTH_MULTIPLIER = 2;

  /**
   * Progress update interval in milliseconds
   */
  PROGRESS_UPDATE_INTERVAL = 100;

  /**
   * Number of paths to collect before updating UI
   */
  PATHS_BATCH_SIZE = 10;

  /**
   * Finds all paths from a start state based on search mode
   * 
   * @param {Array} states - Array of state objects
   * @param {string} startStateId - Starting state ID
   * @param {Object} options - Search options
   * @param {string} options.endStateId - Target end state ID (optional)
   * @param {string} options.intermediateStateId - Required intermediate state ID (optional)
   * @param {Function} options.onProgress - Progress callback (0-100)
   * @param {Function} options.onPathBatch - Batch update callback
   * @param {Object} options.cancelToken - Cancellation token { cancelled: boolean }
   * @returns {Promise<Array>} Array of path objects
   * @throws {Error} If search is cancelled or invalid parameters
   */
  async findPaths(states, startStateId, options = {}) {
    const {
      endStateId = null,
      intermediateStateId = null,
      onProgress = () => {},
      onPathBatch = () => {},
      cancelToken = { cancelled: false }
    } = options;

    // Validate inputs
    const startState = states.find(s => s.id === startStateId);
    if (!startState) {
      throw new Error('Start state not found');
    }

    if (endStateId && !states.find(s => s.id === endStateId)) {
      throw new Error('End state not found');
    }

    if (intermediateStateId && !states.find(s => s.id === intermediateStateId)) {
      throw new Error('Intermediate state not found');
    }

    // Create state lookup map for O(1) access
    const stateMap = new Map(states.map(s => [s.id, s]));

    // Initialize search state
    let allPaths = [];
    let processedStates = 0;
    const totalStates = states.length;
    const maxPathLength = totalStates * this.MAX_PATH_LENGTH_MULTIPLIER;
    let lastUpdateTime = Date.now();

    onProgress(0);

    /**
     * Recursive DFS function for path finding
     * 
     * @param {Object} currentState - Current state in the traversal
     * @param {Array} currentPath - Current path being explored
     * @param {Set} visitedInPath - Set of state IDs visited in current path
     * @param {Array} rulePath - Rules used in the current path
     * @param {Array} failedRulesPath - Failed rules at each step
     * @param {boolean} foundIntermediate - Whether intermediate state was found
     * @param {number} depth - Current recursion depth
     */
    const dfs = async (
      currentState,
      currentPath = [],
      visitedInPath = new Set(),
      rulePath = [],
      failedRulesPath = [],
      foundIntermediate = false,
      depth = 0
    ) => {
      // Check for cancellation
      if (cancelToken.cancelled) {
        throw new Error('Search cancelled');
      }

      // Prevent infinite loops by limiting path length
      if (depth > maxPathLength) {
        return;
      }

      // Update progress periodically (batched for performance)
      processedStates++;
      const now = Date.now();
      if (now - lastUpdateTime > this.PROGRESS_UPDATE_INTERVAL) {
        const progressValue = Math.min((processedStates / (totalStates * 2)) * 100, 99);
        onProgress(progressValue);
        lastUpdateTime = now;
        // Small delay to prevent UI freezing
        await new Promise(resolve => setTimeout(resolve, 1));
      }

      // Build current path
      const newPath = [...currentPath, currentState.name];
      const newVisitedInPath = new Set(visitedInPath).add(currentState.id);

      // Check if current path satisfies search criteria
      let isValidPath = false;

      if (intermediateStateId) {
        // Must pass through intermediate state and reach end state
        isValidPath = currentState.id === endStateId && foundIntermediate;
      } else if (endStateId) {
        // Must reach specific end state
        isValidPath = currentState.id === endStateId;
      } else {
        // Must reach any end state (state with no rules)
        isValidPath = currentState.rules.length === 0;
      }

      // If valid path found, add to results
      if (isValidPath) {
        const pathObj = {
          states: [...newPath],
          rules: [...rulePath],
          failedRules: [...failedRulesPath]
        };
        allPaths.push(pathObj);

        // Batched state updates for performance
        if (allPaths.length % this.PATHS_BATCH_SIZE === 0) {
          onPathBatch([...allPaths]);
        }
      }

      // Explore next states
      for (let i = 0; i < currentState.rules.length; i++) {
        const rule = currentState.rules[i];
        const nextState = stateMap.get(rule.nextState); // O(1) lookup

        // Check for cycles using Set.has() - O(1) lookup
        if (nextState && !newVisitedInPath.has(nextState.id)) {
          const hasFoundIntermediate = foundIntermediate || nextState.id === intermediateStateId;

          // Collect failed rules (rules before the successful one)
          const failedRules = currentState.rules
            .slice(0, i)
            .map(r => r.condition);

          await dfs(
            nextState,
            newPath,
            newVisitedInPath,
            [...rulePath, rule.condition],
            [...failedRulesPath, failedRules],
            hasFoundIntermediate,
            depth + 1
          );
        }
      }
    };

    // Start DFS from the initial state
    await dfs(startState);

    // Final progress update
    onProgress(100);

    // Return all found paths
    return allPaths;
  }

  /**
   * Finds loops in the state machine
   * A loop exists when a state can reach itself
   * 
   * @param {Array} states - Array of state objects
   * @param {Object} options - Search options
   * @param {Function} options.onProgress - Progress callback (0-100)
   * @param {Object} options.cancelToken - Cancellation token { cancelled: boolean }
   * @returns {Promise<Array>} Array of loop objects
   */
  async findLoops(states, options = {}) {
    const {
      onProgress = () => {},
      cancelToken = { cancelled: false }
    } = options;

    const stateMap = new Map(states.map(s => [s.id, s]));
    const loops = [];
    let processedStates = 0;

    onProgress(0);

    // Check each state for loops
    for (const state of states) {
      if (cancelToken.cancelled) {
        throw new Error('Search cancelled');
      }

      // Try to find a path from state back to itself
      const visited = new Set();
      const stack = [{ state, path: [state.name] }];

      while (stack.length > 0) {
        const { state: current, path } = stack.pop();
        
        // Check if we've returned to original state (and it's not the first step)
        if (current.id === state.id && path.length > 1) {
          loops.push({
            states: path,
            loopState: state.name
          });
          break; // Found one loop for this state, move to next
        }

        if (visited.has(current.id)) {
          continue;
        }

        visited.add(current.id);

        // Explore next states
        for (const rule of current.rules) {
          const nextState = stateMap.get(rule.nextState);
          if (nextState) {
            stack.push({
              state: nextState,
              path: [...path, nextState.name]
            });
          }
        }
      }

      processedStates++;
      onProgress((processedStates / states.length) * 100);
    }

    return loops;
  }

  /**
   * Finds the shortest path between two states using BFS
   * 
   * @param {Array} states - Array of state objects
   * @param {string} startStateId - Starting state ID
   * @param {string} endStateId - Target end state ID
   * @returns {Array|null} Shortest path or null if no path exists
   */
  findShortestPath(states, startStateId, endStateId) {
    const startState = states.find(s => s.id === startStateId);
    const endState = states.find(s => s.id === endStateId);

    if (!startState || !endState) {
      return null;
    }

    const stateMap = new Map(states.map(s => [s.id, s]));
    const queue = [{ state: startState, path: [startState.name], rules: [] }];
    const visited = new Set([startStateId]);

    while (queue.length > 0) {
      const { state: current, path, rules } = queue.shift();

      // Found the target
      if (current.id === endStateId) {
        return { states: path, rules };
      }

      // Explore neighbors
      for (const rule of current.rules) {
        const nextState = stateMap.get(rule.nextState);
        if (nextState && !visited.has(nextState.id)) {
          visited.add(nextState.id);
          queue.push({
            state: nextState,
            path: [...path, nextState.name],
            rules: [...rules, rule.condition]
          });
        }
      }
    }

    return null; // No path found
  }

  /**
   * Checks if a state is reachable from another state
   * 
   * @param {Array} states - Array of state objects
   * @param {string} fromStateId - Starting state ID
   * @param {string} toStateId - Target state ID
   * @returns {boolean} True if reachable
   */
  isReachable(states, fromStateId, toStateId) {
    return this.findShortestPath(states, fromStateId, toStateId) !== null;
  }
}

// Singleton instance
let instance = null;

/**
 * Gets the singleton instance of PathFindingService
 * @returns {PathFindingService}
 */
export const getPathFindingService = () => {
  if (!instance) {
    instance = new PathFindingService();
  }
  return instance;
};

export default PathFindingService;

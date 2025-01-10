import React, { useState } from "react";

const FlowSimulation = ({ states }) => {
  const [currentState, setCurrentState] = useState(null);
  const [simulationPath, setSimulationPath] = useState([]);

  const startSimulation = () => {
    if (states.length === 0) return;
    setCurrentState(states[0]);
    setSimulationPath([]);
  };

  const applyRule = (rule) => {
    const nextState = states.find((state) => state.name === rule.nextState);
    setSimulationPath([
      ...simulationPath,
      { type: "rule", value: rule },
      { type: "state", value: nextState },
    ]);
    setCurrentState(nextState);
  };

  return (
    <div className="p-4 bg-gray-50">
      <h2 className="font-bold">Flow Simulation</h2>
      {!currentState ? (
        <button className="bg-green-500 text-white px-4 py-2" onClick={startSimulation}>
          Start Simulation
        </button>
      ) : (
        <div>
          <div className="mt-4">
            <h3 className="text-lg font-semibold">
              Current State: {currentState.name}
            </h3>
            <div className="mt-2">
              <h4 className="font-semibold">Available Rules:</h4>
              <ul>
                {currentState.rules.map((rule) => (
                  <li key={rule.id} className="mt-2">
                    <button
                      className="bg-yellow-500 text-white px-4 py-2 rounded"
                      onClick={() => applyRule(rule)}
                    >
                      IF {rule.condition}, THEN {rule.nextState}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <button
            className="mt-4 bg-red-500 text-white px-4 py-2 rounded"
            onClick={() => setCurrentState(null)}
          >
            Reset Simulation
          </button>
        </div>
      )}
      <h4 className="mt-6">Simulation Path:</h4>
      <ul>
        {simulationPath.map((step, index) => (
          <li key={index} className={`p-2 ${step.type === "state" ? "bg-blue-100" : "bg-yellow-100"}`}>
            {step.type === "state" ? `State: ${step.value.name}` : `Rule: ${step.value.condition}`}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default FlowSimulation;

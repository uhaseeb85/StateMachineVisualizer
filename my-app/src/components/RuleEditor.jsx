import React, { useState } from "react";

const RuleEditor = ({ state, onAddRule, onDeleteRule }) => {
  const [condition, setCondition] = useState("");
  const [nextState, setNextState] = useState("");

  if (!state) {
    return <div className="p-4">Select a state to manage its rules.</div>;
  }

  return (
    <div className="p-4 bg-gray-100 rounded">
      <h2 className="font-bold">Rules for "{state.name}"</h2>
      <div className="mt-4">
        <input
          type="text"
          value={condition}
          placeholder="Condition"
          onChange={(e) => setCondition(e.target.value)}
          className="mr-2"
        />
        <input
          type="text"
          value={nextState}
          placeholder="Next state"
          onChange={(e) => setNextState(e.target.value)}
          className="mr-2"
        />
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded"
          onClick={() => {
            if (condition.trim() === "" || nextState.trim() === "") return;
            const newRule = {
              id: Date.now(),
              condition: condition.trim(),
              nextState: nextState.trim(),
            };
            onAddRule(newRule);
            setCondition("");
            setNextState("");
          }}
        >
          Add Rule
        </button>
      </div>
      <ul className="mt-4">
        {state.rules.map((rule) => (
          <li key={rule.id} className="p-2 flex justify-between items-center">
            <span>
              IF <b>{rule.condition}</b>, THEN go to <b>{rule.nextState}</b>
            </span>
            <button
              className="text-red-500"
              onClick={() => onDeleteRule(rule.id)}
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default RuleEditor;

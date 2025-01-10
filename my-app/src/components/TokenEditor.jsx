import React, { useState } from "react";

const TokenEditor = ({ state, onAddToken, onDeleteToken }) => {
  const [newTokenValue, setNewTokenValue] = useState("");

  if (!state) {
    return <div className="p-4">Select a state to manage its tokens.</div>;
  }

  return (
    <div className="p-4 bg-gray-100 rounded">
      <h2 className="font-bold">Tokens for "{state.name}"</h2>
      <div className="flex items-center gap-2 mt-2">
        <input
          type="text"
          value={newTokenValue}
          placeholder="Enter token value"
          onChange={(e) => setNewTokenValue(e.target.value)}
        />
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded"
          onClick={() => {
            if (newTokenValue.trim() === "") return;
            const newToken = {
              id: Date.now(),
              value: newTokenValue.trim(),
            };
            onAddToken(newToken);
            setNewTokenValue("");
          }}
        >
          Add Token
        </button>
      </div>
      <ul className="mt-4">
        {state.tokens.map((token) => (
          <li key={token.id} className="flex justify-between items-center p-2">
            <span>{token.value}</span>
            <button
              className="text-red-500"
              onClick={() => onDeleteToken(token.id)}
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TokenEditor;

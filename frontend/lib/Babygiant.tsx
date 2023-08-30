"use client";

import React, { useState, useEffect } from "react";

let wasm: any;

export default function BabyGiantCalculator() {
  const [Cx, setCx] = useState("");
  const [Cy, setCy] = useState("");
  const [result, setResult] = useState("");

  useEffect(() => {
    // Dynamic import of the Wasm module
    import("../../circuits/exponential_elgamal/babygiant/pkg/index.js")
      .then((module) => {
        wasm = module;
      })
      .catch((error) => {
        console.error("Failed to load the Wasm module:", error);
      });
  }, []);

  const calculate = () => {
    const output = wasm.do_compute_dlog(Cx, Cy);
    setResult(output.toString());
  };

  return (
    <div>
      <h1>Discrete Logarithm Calculator</h1>
      <div>
        <label>
          Cx:
          <input
            type="text"
            value={Cx}
            onChange={(e) => setCx(e.target.value)}
          />
        </label>
        <label>
          Cy:
          <input
            type="text"
            value={Cy}
            onChange={(e) => setCy(e.target.value)}
          />
        </label>
      </div>
      <div>
      </div>
      <button onClick={calculate}>Calculate</button>

      {result !== null && <div>Result: {result}</div>}
    </div>
  );
}

"use client";

import React, { useState, useEffect } from "react";

let wasm: any;

export default function BabyGiantCalculator() {
  const [maxBitwidth, setMaxBitwidth] = useState(0);
  const [ax, setAx] = useState("");
  const [ay, setAy] = useState("");
  const [bx, setBx] = useState("");
  const [by, setBy] = useState("");
  const [bt, setBt] = useState("");
  const [bz, setBz] = useState("");
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
    const output = wasm.baby_giant(BigInt(maxBitwidth), ax, ay, bx, by, bt, bz);
    setResult(output.toString());
  };

  return (
    <div>
      <h1>Baby Giant Calculator</h1>
      <div>
        <label>
          Max Bitwidth:
          <input
            type="number"
            value={maxBitwidth}
            onChange={(e) => setMaxBitwidth(Number(e.target.value))}
          />
        </label>
      </div>
      <div>
        <label>
          Ax:
          <input
            type="text"
            value={ax}
            onChange={(e) => setAx(e.target.value)}
          />
        </label>
        <label>
          Ay:
          <input
            type="text"
            value={ay}
            onChange={(e) => setAy(e.target.value)}
          />
        </label>
      </div>
      <div>
        <label>
          Bx:
          <input
            type="text"
            value={bx}
            onChange={(e) => setBx(e.target.value)}
          />
        </label>
        <label>
          By:
          <input
            type="text"
            value={by}
            onChange={(e) => setBy(e.target.value)}
          />
        </label>
        <label>
          Bt:
          <input
            type="text"
            value={bt}
            onChange={(e) => setBt(e.target.value)}
          />
        </label>
        <label>
          Bz:
          <input
            type="text"
            value={bz}
            onChange={(e) => setBz(e.target.value)}
          />
        </label>
      </div>
      <button onClick={calculate}>Calculate</button>

      {result !== null && <div>Result: {result}</div>}
    </div>
  );
}

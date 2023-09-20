"use client";

import React, { useState, useEffect } from "react";
import SpinnerComponent from "../components/SpinnerComponent";

let wasm: any;

export default function BabyGiantCalculator() {
  const [Cx, setCx] = useState("");
  const [Cy, setCy] = useState("");
  const [result, setResult] = useState("");
  const [duration, setDuration] = useState("");
  const [computing, setComputing] = useState(false);
  



  const calculate = async () => {
    setComputing(true);
    setResult(" Computing, this should not take more than 10 seconds*...");
    const startTime = performance.now();
    const numberOfWorkers = Math.max(1,window.navigator.hardwareConcurrency-2) || 8; // Default to 8 if the property isn't supported
    let workersCompleted = 0;
    let found = false;
    async function onWorkerMessage(event: any) {
      workersCompleted++;
      if (event.data!=="dl_not_found") {
        setResult(event.data.toString());
        const duration_ = performance.now()-startTime;
        setDuration(duration_.toString());
        found = true;
        setComputing(false);
      }
      if ((workersCompleted===numberOfWorkers) && !found){
        setResult("Discrete Log not found");
        setComputing(false);

      }
    }
    let n = 1048576; // sqrt(max(uint40))
    let chunkSize = Math.ceil(n / numberOfWorkers);

    for (let i = 0; i < numberOfWorkers; i++) {
      const myWorker = new Worker(new URL('./worker_babygiant.js', import.meta.url));
      myWorker.onmessage = onWorkerMessage;
  
      let start = i * chunkSize + 1;
      let end = Math.min(n, start + chunkSize-1);
      myWorker.postMessage({ Cx: Cx, Cy: Cy, min_range: start, max_range: end });
    }

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

      <div>Result:  {!computing || <SpinnerComponent />} {result}  {!computing ||(<span style={{ fontSize: '12px' }}>(*on a M1 MacBook Pro) </span>)} <br/> Duration: {duration}</div>
    </div>
  );
}

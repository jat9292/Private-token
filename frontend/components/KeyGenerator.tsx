"use client";

import { generatePrivateAndPublicKey } from "../lib/bjj_utils.js";
import { useState, useEffect } from "react";

function KeyGenerator() {
  const [keys, setKeys] = useState({
    privateKey: BigInt(0),
    publicKey: { x: BigInt(0), y: BigInt(0) },
  });

  const handleGenerate = async () => {
    const generatedKeys = await generatePrivateAndPublicKey();
    console.log(generatedKeys);
    setKeys(generatedKeys);
  };

  return (
    <div>
      <button onClick={handleGenerate}>Generate Keys</button>
      {keys && (
        <div>
          <p>
            <strong>Private Key:</strong> {keys.privateKey.toString()}
          </p>
          <p>
            <strong>Public Key X:</strong> {keys.publicKey.x.toString()}
          </p>
          <p>
            <strong>Public Key Y:</strong> {keys.publicKey.y.toString()}
          </p>
        </div>
      )}
    </div>
  );
}

export default KeyGenerator;

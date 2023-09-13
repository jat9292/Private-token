"use client";

import { generatePrivateAndPublicKey } from "../lib/bjj_utils.js";
// import { generatePrivateAndPublicKey } from "../../utils/babyjubjub_utils.js";
import { useState, useEffect } from "react";

function KeyGenerator() {
  const [keys, setKeys] = useState<{
    privateKey: BigInt;
    publicKey: any;
  } | null>(null);

  const handleGenerate = () => {
    const generatedKeys = generatePrivateAndPublicKey();
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
            <strong>Public Key:</strong> {keys.publicKey.toString()}
          </p>{" "}
        </div>
      )}
    </div>
  );
}

export default KeyGenerator;

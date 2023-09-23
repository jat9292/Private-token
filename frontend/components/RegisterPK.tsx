"use client";

import { useState, useEffect } from "react";
import { ContractFactory, providers } from 'ethers';
import { abi, bytecode } from "../../hardhat/artifacts/contracts/PublicKeyInfrastructure.sol/PublicKeyInfrastructure.json";
import PKIjson from "../../hardhat/artifacts/contracts/PublicKeyInfrastructure.sol/PublicKeyInfrastructure.json";
import SpinnerComponent from "./SpinnerComponent";
import {
  usePrepareContractWrite,
  useContractWrite,
  useWaitForTransaction,
  useAccount, useConnect
} from "wagmi";







export default function RegisterPK({PK,PKIAddress,onChange}:{PK: any,PKIAddress: any,onChange: any}) {
  const { address } = useAccount()

  const { config } = usePrepareContractWrite({
    address: PKIAddress,
    abi: PKIjson.abi,
    functionName: "registerPublicKey",
    args: [PK.x,PK.y],
    account: address
  });

  const { data, write } = useContractWrite(config);

  // Use the useWaitForTransaction hook to wait for the transaction to be mined and return loading and success states
  const { isLoading, isSuccess } = useWaitForTransaction({
    hash: data?.hash,
    confirmations: 1
  });

  useEffect(() => {
    onChange(isSuccess)
  }, [isSuccess]);

  return (
    <div>
      {(!isLoading && !isSuccess) && <button 
        onClick={() => write?.()}>Register Public Key</button>}
      {isLoading && <button ><SpinnerComponent /> Registering Public Key...</button>}
      {isSuccess && (
        <div>
          <button className="bg-gray-300 text-gray-600 cursor-not-allowed" disabled >Register Public Key</button> <br/>
          Successfully registered your Public Key!
          <div>
            <a href={`https://sepolia.etherscan.io/tx/${data?.hash}`} style={{textDecoration: "underline"}} target="_blank" rel="noopener noreferrer">Check confirmation on Etherscan</a>
          </div>
        </div>
      )}
    </div>
  );
}

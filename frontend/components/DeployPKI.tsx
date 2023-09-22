"use client";

import { useState, useEffect } from "react";
import { ContractFactory, providers } from 'ethers';
import { abi, bytecode } from "../../hardhat/artifacts/contracts/PublicKeyInfrastructure.sol/PublicKeyInfrastructure.json";
import { useAccount, useConnect } from "wagmi";
import SpinnerComponent from "./SpinnerComponent";






export default function DeployPKI({onChange}) {
  const [deploying, setDeploying] = useState(false);
  const [deployed, setDeployed] = useState(false);
  const { isConnected } = useAccount();
  const [contract, setContract] = useState("");

  async function deployPKI(){
    let contract_;
    const num_block_confirmation = 1;
    const provider = new providers.Web3Provider(window.ethereum);
    const [address] = await provider.listAccounts();
    const signer = provider.getSigner(address);
    const contractFactory = new ContractFactory(abi, bytecode, signer);
    setDeploying(true);
    try{    contract_ = await contractFactory.deploy();
      await contract_.deployTransaction.wait(num_block_confirmation);
      setDeploying(false);
      let constractAddress = contract_.address;
      setContract(constractAddress);
      setDeployed(true);
      onChange(constractAddress);
    }
    catch {
      setDeploying(false);
    }

  }

  return (
    <div>
      {isConnected && <>Step 1 : Deploy Public Key Infrastructure smart contract (PKI): <br/> </> }
      {(isConnected && !deploying && !deployed)  && <button onClick={deployPKI}>Deploy PKI</button>}
      {(isConnected && deploying && !deployed)  && <button ><SpinnerComponent /> Deploying PKI...</button> }
      {(isConnected && deployed)  && <button className="bg-gray-300 text-gray-600 cursor-not-allowed" disabled >Deploy PKI</button> }
      {(isConnected && contract)  && <div>PKI has been deployed at : {contract}</div> }
    </div>
  );
}

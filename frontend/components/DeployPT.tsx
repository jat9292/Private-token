"use client";

import { useState, useEffect } from "react";
import { ContractFactory, providers } from 'ethers';
import { abi, bytecode } from "../../hardhat/artifacts/contracts/PrivateToken.sol/PrivateToken.json";
import { address as addressMintVerifier } from "../../hardhat/deployments/sepolia/MintUltraVerifier.json";
import { address as addressTransferToNewVerifier } from "../../hardhat/deployments/sepolia/TransferToNewUltraVerifier.json";
import { address as addressTransferVerifier } from "../../hardhat/deployments/sepolia/TransferUltraVerifier.json";
import { useAccount, useConnect } from "wagmi";
import Link from 'next/link';
import SpinnerComponent from "./SpinnerComponent";
import useWindowSize from 'react-use/lib/useWindowSize'
import Confetti from 'react-confetti'

function uint8ArrayToHexString(arr: any) {
  return '0x' + Array.from(arr).map((byte: any) => byte.toString(16).padStart(2, '0')).join('');
}

export default function DeployPT({proofMint, pkiDeployedAddress, totalSupply} : {proofMint: any, pkiDeployedAddress: any, totalSupply:any}) {
  const { width, height } = useWindowSize()

  const [deploying, setDeploying] = useState(false);
  const [deployed, setDeployed] = useState(false);
  const { isConnected } = useAccount();
  const [contract, setContract] = useState("");

  async function deployPT(){
    let contract_;
    const num_block_confirmation = 1;
    const provider = new providers.Web3Provider(window?.ethereum);
    const [address] = await provider.listAccounts();
    const signer = provider.getSigner(address);
    const contractFactory = new ContractFactory(abi, bytecode, signer);
    setDeploying(true);
    const sliced_proof_mint = uint8ArrayToHexString(proofMint.slice(7*32)); // bb.js appends the public inputs to the proof, and there are 7 public inputs (bytes32) for the mint circuit
    try{    
      contract_ = await contractFactory.deploy(totalSupply.totalSupplyClear,pkiDeployedAddress,addressMintVerifier,
      addressTransferVerifier,addressTransferToNewVerifier, sliced_proof_mint, 
      {C1x: totalSupply.totalSupplyC1x, C1y: totalSupply.totalSupplyC1y, C2x: totalSupply.totalSupplyC2x,C2y: totalSupply.totalSupplyC2y});
      await contract_.deployTransaction.wait(num_block_confirmation);
      setDeploying(false);
      let constractAddress = contract_.address;
      setContract(constractAddress);
      setDeployed(true);
      await fetch('/api', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(constractAddress)
      });
    }
    catch {
      setDeploying(false);
    }

  }

  return (
    <div>
      {(isConnected && !deploying && !deployed)  && <button onClick={deployPT}>Deploy Private Token</button>}
      {(isConnected && deploying && !deployed)  && <button ><SpinnerComponent /> Deploying Private Token...</button> }
      {(isConnected && deployed)  && (<><Confetti width={width} height={height} recycle={false}/> <button className="bg-gray-300 text-gray-600 cursor-not-allowed" disabled >Deploy Private Token</button></>) }
      {(isConnected && contract)  && <div>Private Token has been deployed at : <a href={`https://sepolia.etherscan.io/address/`+contract } style={{textDecoration: "underline"}} target="_blank" rel="noopener noreferrer">{contract}</a></div>}
      {(isConnected && contract)  && <Link href={`/transfer/${contract}`}><button className="ml-20">🔥 Transfer Token 🔥</button></Link>}
      {(isConnected && contract)  && <Link href="/"><button className="float-right mr-4">⬆️  Back to Home 🏠</button></Link>}
    </div>
  );
}

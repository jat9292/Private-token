"use client"

import Image from "next/image";
import dynamic from 'next/dynamic'
import { ConnectButton } from "@rainbow-me/rainbowkit";
import KeyGenerator from "../../components/KeyGenerator";
import DeployPKI from "../../components/DeployPKI";
import DeployPT from "../../components/DeployPT";
import RegisterPK from "../../components/RegisterPK";
//import ComputeMintProof from "../../components/ComputeMintProof";
const ComputeMintProof = dynamic(() => import('../../components/ComputeMintProof'), { ssr: false })
import {useState, useEffect} from 'react';
import PKIjson from "../../../hardhat/artifacts/contracts/PublicKeyInfrastructure.sol/PublicKeyInfrastructure.json";
import PTjson from "../../../hardhat/artifacts/contracts/PrivateToken.sol/PrivateToken.json";
import { useAccount } from "wagmi";

export default function Home() {
    const [pkiDeployedAddress, setPKIDeployedAddress] = useState("");
    const [publicKey, setPK] = useState("");
    const [registered, setRegistered] = useState(false);
    const [proofMint, setProofMint] = useState("");
    const [totalSupply, setTotalSupply] = useState({totalSupplyClear: BigInt(0),
        totalSupplyC1x: BigInt(0),
        totalSupplyC1y: BigInt(0),
        totalSupplyC2x: BigInt(0),
        totalSupplyC2y: BigInt(0)});

    return (
        <>
            <div
            style={{
                display: "flex",
                justifyContent: "flex-end",
                padding: 12,
            }}
            >
            <ConnectButton />
            </div>

            <DeployPKI onChange={setPKIDeployedAddress}/>

            {pkiDeployedAddress && <>&bull; <u>Step 2</u> : Generate or choose public key on the Baby Jubjub curve : 
            <KeyGenerator onChange={setPK} registered={registered}/></>}

            {publicKey && <>&bull; <u>Step 3</u> : Register this public key in the PKI contract : 
            <RegisterPK PK={publicKey} PKIAddress={pkiDeployedAddress} onChange={setRegistered}/></>}
            
            {(registered && !proofMint) && <>&bull; <u>Step 4</u> : Compute proof for minting initial supply of Private Token (this is still done off-chain, client side) : <ComputeMintProof PK={publicKey}  onChange={setProofMint} setSupply={setTotalSupply}/></>}
            {(proofMint) && <>&bull; <u>Step 4</u> : Compute proof for minting initial supply of Private Token (this is still done off-chain, client side) : 
                <div><button  className="bg-gray-300 text-gray-600 cursor-not-allowed" disabled>Enter Circuit Inputs</button></div></>}

            {(proofMint) && <>&bull; <u>Step 5</u> : Finally, deploy the private token and mint initial supply! <DeployPT proofMint={proofMint} pkiDeployedAddress={pkiDeployedAddress} totalSupply={totalSupply}/></>}
        </>
        
    );
}

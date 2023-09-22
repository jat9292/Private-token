"use client"

import Image from "next/image";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import KeyGenerator from "../../components/KeyGenerator";
import DeployPKI from "../../components/DeployPKI";
import {useState, useEffect, useCallback} from 'react';
import PKIjson from "../../../hardhat/artifacts/contracts/PublicKeyInfrastructure.sol/PublicKeyInfrastructure.json";
import PTjson from "../../../hardhat/artifacts/contracts/PrivateToken.sol/PrivateToken.json";
import { useAccount } from "wagmi";

export default function Home() {
    const [pkiDeployedAddress, setPKIDeployedAddress] = useState("");
    const handleChangePKI = useCallback((newValue) => {
        setPKIDeployedAddress(newValue);
     }, []);
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
        <DeployPKI onChange={handleChangePKI}/>
        {pkiDeployedAddress && <>Step2 : Generate or choose public key on the Baby Jubjub curve : <KeyGenerator /></>}
        
        </>
        
    );
}

"use client"

import Image from "next/image";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import JsonToList from "../components/JsonToList";
import React, {useState, useEffect} from 'react';
import PKIjson from "../../hardhat/artifacts/contracts/PublicKeyInfrastructure.sol/PublicKeyInfrastructure.json";
import Link from 'next/link';


export default function Home() {
  const { isConnected } = useAccount();
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

      <div style={{display: "flex", justifyContent: "center", alignItems: "center", height: "30vh"}}>
        <Link href="/new-token">
            {isConnected && (<button>Deploy New Private Token</button>)}
        </Link>
      </div>

      <div style={{display: "grid", justifyContent: "center", alignItems: "center", height: "10vh"}}>
      {isConnected && <>Or, alternatively, choose to trade one of the already deployed Private Tokens : 
        <>
          <JsonToList />
        </>
        </>}
      </div>
      
    </>
  );
}

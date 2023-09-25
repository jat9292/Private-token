"use client"

import Image from "next/image";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import KeyGenerator from "../../../components/KeyGenerator";
import DeployPKI from "../../../components/DeployPKI";
import DeployPT from "../../../components/DeployPT";
import RegisterPK from "../../../components/RegisterPK";
import DecryptBalance from "../../../components/DecryptBalance";
import SendToken from "../../../components/SendToken";
import {useState, useEffect} from 'react';
import PKIjson from "../../../../hardhat/artifacts/contracts/PublicKeyInfrastructure.sol/PublicKeyInfrastructure.json";
import PTjson from "../../../../hardhat/artifacts/contracts/PrivateToken.sol/PrivateToken.json";
import { usePathname } from 'next/navigation'
import { useAccount } from 'wagmi';
import { readContract } from '@wagmi/core'
 

// Captures 0x + 4 characters, then the last 4 characters.
const truncateRegex = /^(0x[a-zA-Z0-9]{4})[a-zA-Z0-9]+([a-zA-Z0-9]{4})$/;

/**
 * Truncates an ethereum address to the format 0x0000…0000
 * @param address Full address to truncate
 * @returns Truncated address
 */
const truncateEthAddress = (address: string) => {
  const match = address.match(truncateRegex);
  if (!match) return address;
  return `${match[1]}…${match[2]}`;
};

export default function Home() {
    const pathname = usePathname();
    const pathlist = pathname.split('/');
    const addressToken = pathlist[pathlist.length-1];
    const { address, isConnected } = useAccount();
    const [addressPKI, setAddressPKI] = useState("");
    const [totalSupply, setTotalSupply] = useState("");
    const [encryptedBalance, setEncryptedBalance] = useState("");
    const [decryptedBalance, setDecryptedBalance] = useState("");
    const [PK, setPK] = useState("");
    const [privateKey, setPrivateKey] = useState("");
    const [isRegistered, setIsRegistered] = useState("");

    const onChangeDecrypt = async (decryptedBalance_, privateKey_) =>{
        setDecryptedBalance(decryptedBalance_);
        setPrivateKey(privateKey_);
    }

    const onChangeSendToken = async (decryptedBalance_, encryptedBalance_) =>{
        setDecryptedBalance(decryptedBalance_);
        setEncryptedBalance(encryptedBalance_);
    }

    useEffect(() => {
        async function fetch() {
            setDecryptedBalance("");
            const addressPKI_ = await readContract({
                address: addressToken,
                abi: PTjson.abi,
                functionName: 'PKI',
            });
            setAddressPKI(addressPKI_);
            const totalSupply_ = await readContract({
                address: addressToken,
                abi: PTjson.abi,
                functionName: 'totalSupply',
            });
            setTotalSupply(totalSupply_);
            const encryptedBalance_ = await readContract({
                address: addressToken,
                abi: PTjson.abi,
                functionName: 'balances',
                args: [address]
            });
            setEncryptedBalance(encryptedBalance_);
            const PK_ = await readContract({
                address: addressPKI_,
                abi: PKIjson.abi,
                functionName: 'getRegistredKey',
                args: [address]
            });
            
            if (PK_.X!== BigInt(0) || PK_.Y!== BigInt(0)){
                setPK(PK_);
                setIsRegistered(true);
            } else{
                setIsRegistered(false);
            }
        }
        isConnected && fetch();
    }, [address]);
    


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
            <div className="text-center text-lg">Transfer of Private Token <a href={`https://sepolia.etherscan.io/address/`+addressToken } 
                style={{textDecoration: "underline"}} target="_blank" rel="noopener noreferrer">{truncateEthAddress(addressToken)}</a> | 
                Total Supply : <strong>{totalSupply}</strong></div>

            {(isRegistered && isConnected) && (<div><div>Encrypted Balance:</div>
            <div className="text-xs">C1x: {encryptedBalance[0].toString()}</div>
            <div className="text-xs">C1y: {encryptedBalance[1].toString()}</div>
            <div className="text-xs">C2x: {encryptedBalance[2].toString()}</div>
            <div className="text-xs">C2y: {encryptedBalance[3].toString()}</div>
            {!decryptedBalance && <DecryptBalance Cxy={encryptedBalance} onChange={onChangeDecrypt} />}
            {decryptedBalance && <strong>Your Decrypted Balance is currently : {decryptedBalance}</strong>}
            {decryptedBalance && <SendToken privateKey={privateKey} PK={PK} PTAddress={addressToken} balance={decryptedBalance} encBalance={encryptedBalance} addressPKI={addressPKI} onChange={onChangeSendToken}/>}
            </div>)}

            {((isRegistered===false) && isConnected) && (<div>Your account is not registered for this Private Token yet! <br/>Please register your public key if you want to be able to receive and send tokens.<br/>
            {<>&bull; <u>Step 1</u> : Generate or choose public key on the Baby Jubjub curve : 
            <KeyGenerator onChange={setPK} registered={isRegistered}/></>}
            {PK && <>&bull; <u>Step 3</u> : Register this public key in the PKI contract : 
            <RegisterPK PK={PK} PKIAddress={addressPKI} onChange={setIsRegistered}/></>}
            </div>)}

        </>
        
    );
}

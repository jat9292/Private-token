import Image from "next/image";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import Babygiant from "../components/Babygiant";
import KeyGenerator from "../components/KeyGenerator";
export default function Home() {
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
      <div>
        <h1>Welcome to the Home Page</h1>
        <Babygiant />
        <KeyGenerator />
      </div>
    </>
  );
}

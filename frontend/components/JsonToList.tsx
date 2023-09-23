import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import Link from 'next/link';

export default function JsonToList( ) {
    const { isConnected } = useAccount();
    const [already_deployed_private_tokens, setAlready_deployed_private_tokens] = useState("");
    useEffect(() => {
        async function fetchData() {
            try {
                const res = await fetch('api/');
                const data = await res.json();
                console.log(data);
                setAlready_deployed_private_tokens(data);
            } catch (error) {
                console.error("Error fetching data:", error);
            }
        }
        
        fetchData();
    }, []);
    return (
        <div className="layout-container pb-20">
            <table className="min-w-full bg-white divide-y divide-gray-200 shadow-md mt-5">
                <thead>
                    <tr>
                    <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address (Click to trade token)</th>
                    <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deployed on</th>
                    <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">View on Explorer</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {Object.entries(already_deployed_private_tokens).map(([address, date]) => (
                        <tr key={address}>
                        <td className="py-2 px-3"><Link href={`/transfer/${address}`} style={{textDecoration: "underline"}}>{address}</Link></td>
                        <td className="py-2 px-3">{date}</td>
                        <td className="py-2 px-3"><a href={`https://sepolia.etherscan.io/address/`+address } style={{textDecoration: "underline"}} target="_blank" rel="noopener noreferrer">Etherscan</a></td>
                        </tr>
                    ))}
                </tbody>
        </table>
      </div>
    )
}

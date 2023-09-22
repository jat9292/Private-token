import { useState, useEffect } from "react";
import { useAccount } from "wagmi";

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
        <>
            {isConnected && (
                <ul>
                    {Object.entries(already_deployed_private_tokens).map(([key, value]) => (
                        <li key={key}>{key}: {value}</li>
                    ))}
                </ul>
            )}
        </>
    )
}

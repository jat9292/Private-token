t: 
    cd circuits/exponential_elgamal/babygiant/ && nargo test --show-output

wp:
    cd circuits/exponential_elgamal/babygiant/ && cargo install wasm-pack && wasm-pack build --target web

dev:
    cd frontend && npm i && npm run dev

d:
    cd frontend && bun run dev

test:
    cargo build --release --manifest-path circuits/exponential_elgamal/babygiant_native/Cargo.toml && cd utils && npm i &&  cd ../hardhat && npm i && npx hardhat test

clean:
    cd frontend && rm -rf node_modules && cd .. && cd circuits/exponential_elgamal/babygiant/ && cargo clean && rm -rf pkg && rm Cargo.lock
    
da: ## Deploy to anvil
    cd deploy && forge script Deploy -f localhost

dh: ## Deploy to hardhat node
    cd hardhat && npx hardhat node 

gen: ## Wagmi generate
    cd frontend && npx wagmi generate

ds:
    cd hardhat && npx hardhat deploy --network sepolia

verify:
    cd hardhat && npx hardhat --network sepolia etherscan-verify

release:
    cd frontend && npm run build && npm run start
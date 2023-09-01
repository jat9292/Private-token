t: 
    cd circuits/exponential_elgamal/babygiant/ && nargo test --show-output

wp:
    cd circuits/exponential_elgamal/babygiant/ && cargo install wasm-pack && wasm-pack build --target web

dev:
    cd frontend && npm i && npm run dev

test:
    cd hardhat && npm i && npx hardhat test

clean:
    cd frontend && rm -rf node_modules && cd .. && cd circuits/exponential_elgamal/babygiant/ && cargo clean && rm -rf pkg && rm Cargo.lock
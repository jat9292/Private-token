t: 
    cd circuits/exponential_elgamal/babygiant/ && nargo test --show-output

wp:
    cd circuits/exponential_elgamal/babygiant/ && cargo install wasm-pack && wasm-pack build --target web

dev:
    cd frontend && pnpm i && pnpm dev

test:
    forge test

clean:
    cd frontend && rm -rf node_modules && cd .. && cd circuits/exponential_elgamal/babygiant/ && cargo clean && rm -rf pkg && rm Cargo.lock
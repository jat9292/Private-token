t: 
    cd circuits/exponential_elgamal/babygiant/ && nargo test --show-output

wp:
    cd circuits/exponential_elgamal/babygiant/ && wasm-pack build --target web

dev:
    cd frontend && pnpm dev
###  To compile:

cargo build --target wasm32-unknown-unknown --release && wasm-bindgen target/wasm32-unknown-unknown/release/my_wasm_png.wasm --out-dir ./public --target web

### Based on:

https://dev.to/dandyvica/wasm-in-rust-without-nodejs-2e0c

https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WebAssembly/Table

https://dev.to/jor/rust-wasm-browser-nodejs-2bo6

### Usage

```javascript
// import * as wasm from './my_wasm_png.wasm';
let wasm;
export const ready = fetch('my_wasm_png.wasm').then(response => {
    return response.arrayBuffer().then(bytes => {
        return WebAssembly.instantiate(bytes, []).then(({ instance }) => {
            wasm = instance.exports;
            return wasm;
        })
    })
});

```


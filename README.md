###  To compile:

```
cargo build --target wasm32-unknown-unknown --release && wasm-bindgen target/wasm32-unknown-unknown/release/my_wasm_png.wasm --out-dir ./public --target web
```
```
cargo build --target wasm32-unknown-unknown --release && wasm-bindgen target/wasm32-unknown-unknown/release/my_wasm_png.wasm --out-dir ./cli --target nodejs
```

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


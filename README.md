###  To compile:

```console
cargo build --target wasm32-unknown-unknown --release && wasm-bindgen target/wasm32-unknown-unknown/release/my_wasm_png.wasm --out-dir ./public --target web
```
```console
cargo build --target wasm32-unknown-unknown --release && wasm-bindgen target/wasm32-unknown-unknown/release/my_wasm_png.wasm --out-dir ./cli --target nodejs
```
```console
age-pack tiled ./dev/map/dev.png -o ./data/world -w 16 -h 16
```

```puml
A -> B
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

### Automap all open files in Tiled

```javascript
var assets = tiled.openAssets;
for (var i = 0; i < assets.length; ++i) {
    tiled.activeAsset = assets[i];
    tiled.trigger("AutoMap");
}
```

[Fast map generation](https://rollforfantasy.com/tools/map-creator.php)
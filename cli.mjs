import myWasmPng from "./cli/my_wasm_png.js";
import fs from "fs";

const tileIndexOffset = 80


function fillData(w, h, value) {
    const dataView = new DataView(new ArrayBuffer(w * h * 4));
    for (let step = 0; step < w * h; step++) {
        dataView.setUint32(step * 4, value, false);
    }
    return dataView;
}

function useData(w, h, data) {
    const dataView = new DataView(new ArrayBuffer(w * h * 4));
    for (let step = 0; step < w * h; step++) {
        let aaa = data[step]
        aaa = aaa - tileIndexOffset
        dataView.setUint32(step * 4, aaa, false);
    }
    return dataView;
}

const writeFileSync = function (path, buffer) {
    fs.writeFile(path, buffer, function (err) {
        if (err) return console.log(err);
        console.log(`Image created > ${path}`);
    })
}

export function generate(income, file, i = 0) {
    income.forEach(({ layers, data, width, height, type }) => {
        if (type === "group") {
            i = generate(layers, file, i)
        } else {
            const dataView = useData(width, height, data)
            const imageData = myWasmPng.encodePNG(width, height, new Uint8Array(dataView.buffer))
            writeFileSync(`./data/${file}-${i}.png`, imageData)
            i++;
        }
    })
    return i
}

if (process.argv[2]) {
    try {
        if (fs.existsSync(process.argv[2])) {
            let rawdata = fs.readFileSync(process.argv[2]);
            let level = JSON.parse(rawdata);
            const file = process.argv[2].replace(/^.*[\\\/]/, '').replace(".json", "")
            generate(level.layers, file)
        }
    } catch (err) {
        console.error(err)
    }
} else {
    const w = 100;
    const h = 100;
    console.log("building default image")
    const dataView = fillData(w, h, 16);

    const data = new Uint8Array(dataView.buffer);
    console.time("image encoding");
    const imageData = myWasmPng.encodePNG(w, h, data);
    console.timeEnd("image encoding");
    console.time("imageDataConvert");
// console.log(`data:image/png;base64,${binaryToBase64(imageData)}`)
    writeFileSync("./data/001-1-1.png", imageData)
    console.timeEnd("imageDataConvert");


}


function binaryToBase64(arrayBuffer) {
    return Buffer.from(arrayBuffer, "binary").toString("base64")
}



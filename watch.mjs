import fs from "fs"
import { generate } from "./cli.mjs"

if (process.argv[2]) {
    try {
        if (fs.existsSync(process.argv[2])) {
            let rawdata = fs.readFileSync(process.argv[2]);
            let level = JSON.parse(rawdata);
            const file = process.argv[2].replace(/^.*[\\\/]/, '').replace(".json", "")
            const dir = process.argv[2].replace(`${file}.json`, "")
            console.log(dir);
            let timeout = null;
            fs.watch(dir, { encoding: "utf8" }, (eventType, filename) => {
                if (filename) {
                    clearTimeout(timeout);
                    timeout = setTimeout(() => generate(getContent(process.argv[2]).layers, file), 100)
                    console.log("file changed", eventType, filename)
                }
            });
        } else {
            console.log(`"${process.argv[2]}" file not exist`)
        }

    } catch (err) {
        console.error(err)
    }
} else {
    console.log("no imput file")
}


function getContent(filename) {
    let rawdata = fs.readFileSync(filename);
    return JSON.parse(rawdata);
}
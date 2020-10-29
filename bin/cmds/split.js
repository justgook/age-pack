const path = require("path")
const fs = require("fs")
const wasmLib = require("../../cli/my_wasm_png.js")
const { fixFilePath } = require("./_util");
const { fileExists } = require("./_util");
const { outputDir, nicePath } = require("./_util");


exports.command = "split [input] [width] [height]"
exports.desc = "Split image to tiles"
exports.builder = (yargs) => yargs
    .positional("input", {
        describe: "path to image",
        default: process.cwd(),
        normalize: true,
        coerce: fixFilePath
    })
    .positional("width", {
        type: "number",
        default: 128,
        describe: "output image width",
    })
    .positional("height", {
        type: "number",
        default: 128,
        describe: "output image height",
    })
    .check((argv, options) => {
        if (fileExists(argv.input)) {
            return true;
        }
        throw new Error(`Argument check failed: "${nicePath(argv.input)}" is not a readable file`);
    })

exports.handler = async (argv) => {

    const timeStart = process.hrtime()

    const input = argv.input
    const output = outputDir(argv.output)
    console.info(`Slicing image \n input: ${nicePath(input)}\n output: ${nicePath(output)}\n`)
    const width = argv.width
    const height = argv.height

    const raw = fs.readFileSync(input);
    const images = wasmLib.slicePngFast(raw, width, height)
    const imagesCount = images.count()
    const done = [];

    for (let i = 0; i < imagesCount; i++) {
        done.push(fs.promises.writeFile(path.resolve(output, `${i}.png`), images.image(i)))
    }
    return Promise.all(done).then(() => {
        const timeEnd = process.hrtime(timeStart)
        console.info(`Created ${imagesCount} images`)
        console.info("Execution time: %ds %dms", timeEnd[0], timeEnd[1] / 1000000)
        return Promise.resolve()
    })
};


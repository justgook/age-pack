const path = require("path")
const fs = require("fs")
const { allPromise } = require("./_util")
const minimatch = require("minimatch")

const { fileExists, nicePath, outputDir, fixFilePath, configOption } = require("./_util")
const wasmLib = require("../../cli/my_wasm_png.js")

const term = require("terminal-kit").terminal
const yaml = require("js-yaml")

const optGroup = "Lookup Options:"

exports.command = "lookup [world_file]"

exports.desc = "Convert tiled to Look up tables"

exports.builder = (yargs) => yargs
    .positional("world_file", {
        describe: "Path to tiled maps and or world file",
        normalize: true,
        coerce: (world_file) => {
            if (!fileExists(world_file)) {
                throw new Error(`Argument check failed: "${nicePath(world_file)}" is not a readable file`);
            }
            const input = fixFilePath(world_file)
            return path.resolve(input, "world.world")
        },
    })
    .option("config", {
        ...configOption,
        alias: "c",
        group: optGroup,
        default: path.resolve(__dirname, "default", "lookup-config.yaml"),
    })

exports.handler = function (argv) {
    const config = argv.config

    const mapPixelsByLayer = require("./_tiled").mapPixelsByLayer(config)
    const worldFilePath = argv.world_file
    const inputDir = path.parse(worldFilePath).dir
    const outputDirPath = outputDir(argv.output)
    const inputData = JSON.parse(fs.readFileSync(worldFilePath))
    const timeStart = process.hrtime()
    term.fullscreen(true)
    const progressBar = term.progressBar({
        width: 80,
        title: "Building:",
        eta: true,
        percent: true,
        inline: false,
        x: (process.stdout.columns) / 2 - 40,
        y: process.stdout.rows / 2,
    })

    const done = [Promise.resolve()]
    const realWork = inputData.maps.reduce((acc, { fileName }) => {
        const mapFilePath = path.resolve(inputDir, fileName)

        acc.push(fs.promises.readFile(mapFilePath)
            .then((mapFile) => {
                const outputPath = path.relative(inputDir, mapFilePath)
                const mapData = JSON.parse(mapFile)
                const returner = []
                const dataView = new DataView(new ArrayBuffer(mapData.width * mapData.height * 4))
                mapData.layers.forEach((value) => {
                    let pattern_i = 0, pattern = ""
                    while (pattern = config["ignore-layers"][pattern_i]) {
                        if (minimatch(value.name, pattern)) {
                            return;
                        }
                        pattern_i++;
                    }
                    const mapPixels_ = mapPixelsByLayer(value.name)
                    const mapPixels = (a) => {
                        const aaa = mapPixels_(a)
                        return aaa > 144 ? aaa - 144 : aaa
                    }

                    value.data.forEach((a, i) => {
                        dataView.setUint32(i * 4, mapPixels(a), false)
                    })
                    const imageBuffer = wasmLib.encodePng(value.width, value.height, new Uint8Array(dataView.buffer))

                    let outputFilePath = path.resolve(outputDirPath, outputPath)
                    outputFilePath = outputFilePath.replace(".json", "")
                    outputFilePath = `${outputFilePath}_${value.name}.png`

                    returner.push(fs.promises.mkdir(path.parse(outputFilePath).dir, { recursive: true }).then(() => {
                        return fs.promises.writeFile(outputFilePath, imageBuffer)
                    }))
                })
                return Promise.all(returner);
            }));

        return acc
    }, [])

    done.push.apply(done, realWork)
    return allPromise(done, progressBar.update).then(() => {
        const timeEnd = process.hrtime(timeStart)
        term("World created")
        term("Execution time: %ds %dms", timeEnd[0], timeEnd[1] / 1000000)
        return Promise.resolve()
    })
}
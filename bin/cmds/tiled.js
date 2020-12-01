const path = require("path")
const fs = require("fs")
const term = require("terminal-kit").terminal;
const { configOption, outputDir, nicePath, fixFilePath, allPromise } = require("./_util")

const wasmLib = require("../../cli/my_wasm_png.js")
const { toDataArray } = require("./_tiled");


const optGroup = "World Options:"
exports.command = "tiled <image> [images..]"
exports.desc = "Create world from image(s)"
exports.builder = (yargs) => yargs
    .positional("image", {
        describe: "Path to image",
        normalize: true,
        coerce: fixFilePath
    })
    .positional("images", {
        describe: "Multilayer world",
        normalize: true,
        coerce: (aaa) => aaa.map(fixFilePath)
    })
    .option("config", {
        ...configOption,
        alias: "c",
        group: optGroup,
        default: path.resolve(__dirname, "default", "tiled-config.yaml"),
    })
    .option("tiled-width", {
        alias: "tw",
        type: "number",
        description: "Tile width",
        default: 32,
        group: optGroup
    })
    .option("tiled-height", {
        alias: "th",
        type: "number",
        description: "Tile height",
        default: 32,
        group: optGroup
    })
    .option("region-width", {
        alias: "w",
        type: "number",
        description: "Region width",
        default: 128,
        group: optGroup
    })
    .option("region-height", {
        alias: "h",
        type: "number",
        description: "Region height",
        default: 128,
        group: optGroup
    })


// builderInputWidthHeight(yargs)


exports.handler = async (argv) => {
    const source = [argv.image].concat(argv.images)
    const config = argv.config
    const tw = argv["tiled-width"]
    const th = argv["tiled-height"]
    const width = argv["region-width"]
    const height = argv["region-height"]
    const output = outputDir(argv.output)
    const done = []
    const timeStart = process.hrtime()
    term.fullscreen(true)
    term(`Creating world: \n input: ${argv.images.length ? `[ ${nicePath(argv.image)}.. ]` : nicePath(argv.image)}\n output: ${nicePath(output)}\n`)
    const progressBar = term.progressBar({
        width: 80,
        title: "Building:",
        eta: true,
        percent: true,
        inline: false,
        x: (process.stdout.columns) / 2 - 40,
        y: process.stdout.rows / 2,
    })


    // Creating tileset START
    const tilesetName = "tileset.json"
    const tilesetImageName = "tileset.png"
    const tilesetImageSrc = path.resolve(__dirname, "default", tilesetImageName)
    const tilesetImageData = fs.readFileSync(tilesetImageSrc);
    const tilesetImageInfo = wasmLib.decodePngInfo(tilesetImageData)
    const tilesetData = require("./_tiled").tilesetFile(tw, th, "tileset.png", tilesetImageInfo.width(), tilesetImageInfo.height())
    tilesetImageInfo.free()
    done.push(fs.promises.copyFile(tilesetImageSrc, path.resolve(output, tilesetImageName)))
    done.push(fs.promises.writeFile(path.resolve(output, tilesetName), stringifyJSON(tilesetData)))
    // Creating tileset END

    const mapPixelsByLayer = require("./_tiled").mapPixelsByLayer(config)

    const worldFile = require("./_tiled").worldFile
    const mapFileCreator = require("./_tiled").mapFile(width, height, tw, th)
    const tileLayer = require("./_tiled").tileLayer(width, height)
    // const tilesetFile = require("./_tiled").tilesetFile(tw, th, image, imagewidth, imageheight)
    const mapsDir = outputDir(path.resolve(output, "maps"))
    const mapFileAll = [] //(Array(39)).fill("a")

    source.forEach((input, index) => {
        const layerName_ = path.parse(input).name
        const layerName = config.rename[layerName_] || layerName_;
        const raw = fs.readFileSync(input);
        const images = wasmLib.slicePngFast(raw, width, height)

        const mapForWorld = require("./_tiled").worldFileMap(width, height, th, tw, images.cols());

        const imagesCount = images.count()

        for (let i = 0; i < imagesCount; i++) {
            const fileName = `level_${String(i).padStart(4, '0')}.json`

            const filePath = path.resolve(mapsDir, fileName)
            worldFile.maps[i] = mapForWorld(path.relative(process.cwd(), `maps/${fileName}`), i)
            if (index === 0) {
                mapFileAll[i] = [filePath, mapFileCreator()]
                mapFileAll[i][1].tilesets = config.tileset || [{ firstgid: 1, source: `../${tilesetName}` }]
            }
            mapFileAll[i][1].layers.push(tileLayer(index, layerName, toDataArray(images.get(i).buffer, mapPixelsByLayer(layerName))))
        }
        mapFileAll.forEach(([filePath, content]) => {
            content.nextlayerid = source.length
            done.push(fs.promises.writeFile(path.resolve(mapsDir, filePath), stringifyJSON(content)))
        })
        images.free()
    })

    done.push(fs.promises.writeFile(path.resolve(output, `world.world`), stringifyJSON(worldFile)))

    return allPromise(done, progressBar.update).then(() => {
        const timeEnd = process.hrtime(timeStart)
        term("World created")
        term("Execution time: %ds %dms", timeEnd[0], timeEnd[1] / 1000000)
        return Promise.resolve()
    })
}

const stringifyJSON = (data) => JSON.stringify(data, null, 2)
const path = require("path")
const fs = require("fs")

const { outputDir, nicePath, fixFilePath } = require("./_util");


const wasmLib = require("../../cli/my_wasm_png.js")
const { toArray } = require("./_util");


const optGroup = "World Options:"
exports.command = "world <image> [images..]"
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
    const tw = argv["tiled-width"]
    const th = argv["tiled-height"]
    const width = argv["region-width"]
    const height = argv["region-height"]
    const output = outputDir(argv.output)
    const done = []
    const timeStart = process.hrtime()

    console.info(`Creating world: \n input: ${argv.images.length ? `[ ${nicePath(argv.image)}.. ]` : nicePath(argv.image)}\n output: ${nicePath(output)}\n`)

    const worldFile = require("./_mock").worldFile
    const mapFileCreator = require("./_mock").mapFile
    const tileLayer = require("./_mock").tileLayer(width, height)
    const mapsDir = outputDir(path.resolve(output, "maps"))
    const mapFileAll = [] //(Array(39)).fill("a")

    source.forEach((input, index) => {
        const name = path.parse(input).name
        const raw = fs.readFileSync(input);
        const images = wasmLib.slicePngFast(raw, width, height)
        const mapForWorld = require("./_mock").worldFileMap(width, height, th, tw, images.cols());

        const imagesCount = images.count()

        for (let i = 0; i < imagesCount; i++) {
            const fileName = `level_${i}.json`
            const filePath = path.resolve(mapsDir, fileName)
            worldFile.maps[i] = mapForWorld(path.relative(process.cwd(), `maps/${fileName}`), i)
            if (index === 0) {
                mapFileAll[i] = [filePath, mapFileCreator()]
            }
            mapFileAll[i][1].layers.push(tileLayer(index, name, toArray(images.get(i).buffer)))

        }
        mapFileAll.forEach(([filePath, content]) => {
            content.nextlayerid = source.length
            done.push(fs.promises.writeFile(path.resolve(mapsDir, filePath), JSON.stringify(content, null, 4)))
        })
        images.free()
    })

    done.push(fs.promises.writeFile(path.resolve(output, `world.world`), JSON.stringify(worldFile, null, 4)))

    return Promise.all(done).then(() => {
        const timeEnd = process.hrtime(timeStart)
        console.info("World created!")
        console.info("Execution time: %ds %dms", timeEnd[0], timeEnd[1] / 1000000)
        return Promise.resolve()
    })

}
function toDataArray(buffer, mapping = (a) => a) {
    const dataView = new DataView(buffer)
    const size = buffer.byteLength;
    const result = []
    for (let i = 0; i < size; i += 4) {
        result.push(mapping(dataView.getUint32(i, false)))
    }
    return result
}


exports.mapPixelsByLayer = (config) => (layerName) => (a) => {
    if (config.replace[layerName] && config.replace[layerName][a] != null) {
        return config.replace[layerName][a]
    } else if (config.replace["*"] && config.replace["*"][a] != null) {
        return config.replace["*"][a]
    }
    return a
}
exports.toDataArray = toDataArray


exports.tilesetFile = (tilewidth, tileheight, image, imagewidth, imageheight) => ({
    "name": "Output",
    "columns": Math.ceil(imageheight / tilewidth),
    tileheight,
    tilewidth,
    image,
    imagewidth,
    imageheight,
    tilecount: Math.ceil(imagewidth / tilewidth) * Math.ceil(imageheight / tileheight),

    "margin": 0,

    "spacing": 0,

    "tiledversion": "2020.09.22",
    "type": "tileset",
    "version": 1.4
})
exports.worldFile = {
    "maps": [],
    "onlyShowAdjacentMaps": false,
    "type": "world"
}

exports.worldFileMap = (h, w, th, tw, cols) => (fileName, i) => ({
    width: w * tw,
    height: h * th,
    fileName,
    x: i % cols * w * tw,
    y: Math.floor(i / cols) * h * th,
});

exports.mapFile = (width, height, tilewidth, tileheight) => () => ({
    width,
    height,
    tilewidth,
    tileheight,

    "layers": [],
    "tilesets": [],

    "nextlayerid": 6,
    "nextobjectid": 1,

    "orientation": "orthogonal",
    "renderorder": "right-down",
    "infinite": false,
    "type": "map",
    "version": 1.4,
    "tiledversion": "2020.09.22",

})


exports.tileLayer = (width, height) => (id, name, data) => ({
    data,
    id,

    name,
    width,
    height,

    "opacity": 1,
    "type": "tilelayer",
    "visible": true,
    "x": 0,
    "y": 0
})
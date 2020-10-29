exports.worldFile = {
    "maps": [],
    "onlyShowAdjacentMaps": false,
    "type": "world"
}

exports.worldFileMap = (h, w, th, tw, cols) => (fileName, i) => ({
    width: w * tw,
    height: h * th,
    fileName,
    x: 0,
    y: 0,
});

exports.mapFile = () => ({

    "orientation": "orthogonal",
    "renderorder": "right-down",
    "infinite": false,

    "width": 20,
    "height": 20,

    "tileheight": 32,
    "tilewidth": 32,

    "layers": [],
    "tilesets": [],

    "nextlayerid": 6,
    "nextobjectid": 1,


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
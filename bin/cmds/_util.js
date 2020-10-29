const path = require("path")
const fs = require("fs")

function toArray(buffer) {
    const dataView = new DataView(buffer)
    const size = buffer.byteLength;
    const result = []
    for (let i = 0; i < size; i += 4) {
        result.push(dataView.getUint32(i, false))
    }
    return result
}


function outputDir(output) {
    if (!fileExists(output)) {
        fs.promises.mkdir(output, { recursive: true });
    }
    return output;
}

function nicePath(file) {
    const relPath = path.relative(process.cwd(), file);
    return relPath < file ? file : relPath
}

function fixFilePath(file) {
    return path.isAbsolute(file) ? file : path.resolve(process.cwd(), file)
}

function fileExists(filename, mode = fs.R_OK) {
    try {
        fs.accessSync(filename, mode);
        return true;
    } catch (e) {
        return false;
    }
}

function canReadAndWriteRecursive(targetPath, mode = fs.W_OK | fs.R_OK) {
    if (fs.existsSync(targetPath)) {
        if (fs.lstatSync(targetPath).isDirectory()) {
            return true
        } else {
            throw new Error(`Argument check failed: ${nicePath(targetPath)} is not a directory`)
        }
    }
    const parsed = path.parse(targetPath)

    if (parsed.dir !== parsed.root) {
        return canReadAndWriteRecursive(parsed.dir, mode)
    }
    throw new Error(`Argument check failed: ${nicePath(targetPath)} is not a writable`)
}

exports.outputDir = outputDir;
exports.fixFilePath = fixFilePath;
exports.nicePath = nicePath;
exports.canReadAndWriteRecursive = canReadAndWriteRecursive;
exports.fileExists = fileExists;
exports.toArray = toArray;
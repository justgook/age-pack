const path = require("path")
const fs = require("fs")
const yaml = require("js-yaml")

exports.configOption = {
    type: "string",
    description: "Path to config file",
    normalize: true,
    coerce: (filename) => {
        const configFilename = fixFilePath(filename)
        if (!fileExists(configFilename)) {
            throw new Error(`Argument check failed: "${nicePath(configFilename)}" is not a readable file`);
        }
        try {
            let fileContents = fs.readFileSync(configFilename, "utf8");
            return yaml.safeLoad(fileContents);
        } catch (e) {
            throw new Error(`Argument check failed: failed to parse "${nicePath(configFilename)}"\n${e}`);
        }
    },
}


function allPromise(proms, progress_cb = () => null) {
    let d = 0;
    progress_cb(0);
    for (const p of proms) {
        p.then(() => {
            d++;
            progress_cb(d / proms.length);
        });
    }
    return Promise.all(proms);
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
exports.allPromise = allPromise;
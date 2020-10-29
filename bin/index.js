#!/usr/bin/env node

const { fixFilePath } = require("./cmds/_util");

const yargs = require("yargs/yargs")
const { canReadAndWriteRecursive } = require("./cmds/_util");
const { hideBin } = require("yargs/helpers")

// feature ideas `terminal-kit`

const argv_ = yargs(hideBin(process.argv))
    .commandDir("cmds")
    .demandCommand()
    .option("watch", {
        type: "boolean",
        description: "Run in watch mode",
    })
    .option("output", {
        alias: "o",
        type: "path",
        description: "Output directory",
        default: process.cwd(),
        normalize: true,
        coerce: fixFilePath
    })
    .check((argv, options) => canReadAndWriteRecursive(argv.output))
    .showHelpOnFail(false, "Specify --help for available options")
    .demandCommand(1)
    .strict()
    .argv

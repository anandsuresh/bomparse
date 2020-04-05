#!/usr/bin/env node
/**
 * @file A command-line tool to parse BOM lists
 */
'use strict'

const { parse } = require('../lib/parser')
const { createReadStream } = require('fs')
const { createInterface } = require('readline')

const fatal = msg => { console.error(msg); process.exit(1) }

const argv = require('yargs')
  .help()
  .version(false)
  .wrap(null)
  .options({
    spaces: {
      alias: 's',
      desc: 'The number of spaces when pretty-printing JSON output',
      type: 'number',
      default: 2
    },
    file: {
      alias: 'f',
      desc: 'The file to read the input from; "-" for stdin',
      type: 'string',
      default: '-'
    },
    number: {
      alias: 'n',
      desc: 'Number of BOM line items to display when reading from a file',
      type: 'number'
    },
    check: {
      alias: 'c',
      desc: 'Checks if the specified string can be parsed; useful for testing',
      type: 'string'
    }
  })
  .check(argv => {
    if (argv.file !== '-' && isNaN(+argv.number)) {
      fatal('must specify --number/-n when reading from a file!')
    } else if (argv.file === '-' && !isNaN(+argv.number)) {
      fatal('must not specify --number/-n when reading from stdin!')
    }

    return true
  })
  .argv

// handle running a check on a single string
if (argv.check != null) {
  if (argv.check.length === 0) fatal('must specify a string to check!')

  const obj = parse(argv.check)
  if (obj == null) fatal('failed to parse!')

  console.log(JSON.stringify(obj, null, argv.spaces))
  process.exit(0)
}

// handle parsing BOM items from a file or from stdin
const bomLineItems = new Map()
const opts = {
  input: argv.file === '-' ? process.stdin : createReadStream(argv.file),
  crlfDelay: Infinity
}

createInterface(opts)
  .on('line', line => {
    // ignore empty lines
    if (line == null || line.trim().length === 0) return

    // check for the number of items to output when reading from stdin
    if (argv.file === '-' && isNaN(argv.number)) {
      if (isNaN(+line) || +line < 0) {
        fatal(`Expected a positive number N; got "${line}" instead!`)
      }

      argv.number = +line
      return
    }

    // report errors for lines that could not be parsed
    const parsedBomItem = parse(line)
    if (parsedBomItem == null) {
      console.error(`error parsing "${line}"`)
      return
    }

    const key = parsedBomItem.id
    if (bomLineItems.has(key)) {
      const bomItem = bomLineItems.get(key)
      bomItem.NumOccurrences++
      parsedBomItem.ReferenceDesignators.forEach(ref => {
        bomItem.ReferenceDesignators.add(ref) // noop, if item already exists
      })
    } else {
      bomLineItems.set(key, parsedBomItem)
    }
  })
  .once('close', () => {
    const output = Array.from(bomLineItems.values())
      .sort((a, b) => a.NumOccurrences === b.NumOccurrences
        ? b.ReferenceDesignators.size - a.ReferenceDesignators.size
        : b.NumOccurrences - a.NumOccurrences)
      .slice(0, argv.number)

    console.log(JSON.stringify(output, null, argv.spaces))
  })

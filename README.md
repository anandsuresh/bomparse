# `bomparse`

A command-line utility to parse a BOM list and return the most used components
in JSON format. The tool is designed to read some level of malformed input, and
still produce valid JSON output.

- Manufacturer names are expected to contain alphanumeric characters and spaces.
- Extra spaces in the manufacturer names are stripped down to exactly one space.
- Manufacturer names in the output are title-cased.
- Manufacturer part numbers are expected to be alphanumeric including spaces and
  hyphens. All other characters are considered bad input.
- Manufacturer part numbers and reference designators are forced to upper-case.
- Any spaces in the manufacturer part numbers and reference designators are
  removed.
- The JSON output is pretty-printed with 2 spaces, by default. This may be
  changed using the `--spaces` option.

## installation

Installation requires node.js v10+ and npm v6+. To install the tool, run
`npm link`. This should install the `bomparse` tool.

## usage

The simplest way to use this script is to run the `bomparse` tool. By default,
input is read from the `stdin`.

```
$ bomparse
2
Wintermute Systems -- CASE-19201:A2,A3
AXXX-1000:Panasonic:D1,D8,D9
Z1,Z3;40001;Keystone
Z1,Z3,Z8;40001;Keystone
^D
[
  {
    "MPN": "40001",
    "Manufacturer": "Keystone",
    "ReferenceDesignators": [
      "Z1",
      "Z3",
      "Z8"
    ],
    "NumOccurrences": 2
  },
  {
    "MPN": "AXXX-1000",
    "Manufacturer": "Panasonic",
    "ReferenceDesignators": [
      "D1",
      "D8",
      "D9"
    ],
    "NumOccurrences": 1
  }
]
```

#### getting help

At any time, you can check the options that can be used with the command. To do
so, use the `--help` flag.

```
$ bomparse --help
Options:
  --help        Show help  [boolean]
  --spaces, -s  The number of spaces when pretty-printing JSON output  [number] [default: 2]
  --file, -f    The file to read the input from; "-" for stdin  [string] [default: "-"]
  --number, -n  Number of BOM line items to display when reading from a file  [number]
  --check, -c   Checks if the specified string can be parsed; useful for testing  [string]
```

#### checking a single BOM line item

To validate any BOM string, use the `--check/-c` flag. This will evaluate the
specified string and output the JSON representation of the BOM line item.

If the input fails the check, then an error is displayed and the script exits
with a non-zero exit code.

```
$ bomparse --check "Wintermute Systems -- CASE-19201:A2,A3"
{
  "MPN": "CASE-19201",
  "Manufacturer": "Wintermute Systems",
  "ReferenceDesignators": [
    "A2",
    "A3"
  ],
  "NumOccurrences": 1
}

$ bomparse --check "bad input"
failed to parse!

$ echo $?
1
```

#### reading from a file

It is also possible to read input from a file as opposed to `stdin`. In this
case, the number of BOM lines to display in the output can be specified using
the `--number/-n` flag.

```
$ cat spec/fixtures/file.input
Wintermute Systems -- CASE-19201:A2,A3
AXXX-1000:Panasonic:D1,D8,D9
Z1,Z3;40001;Keystone
Z1,Z3,Z8;40001;Keystone

$ bomparse --file spec/fixtures/file.input
must specify --number/-n when reading from a file!

$ echo $?
1

$ bomparse --file spec/fixtures/file.input --number 1
[
  {
    "MPN": "40001",
    "Manufacturer": "Keystone",
    "ReferenceDesignators": [
      "Z1",
      "Z3",
      "Z8"
    ],
    "NumOccurrences": 2
  }
]
```

#### formatting the output

The JSON output is usually pretty-printed to `stdout`. The amount of spacing can
be controlled using the `--spaces/-s` flag. Setting this flag to `0` will cause
the output to be printed densely.

```
$ bomparse --file spec/fixtures/file.input --number 1 --spaces 0
[{"MPN":"40001","Manufacturer":"Keystone","ReferenceDesignators":["Z1","Z3","Z8"],"NumOccurrences":2}]

$ bomparse --file spec/fixtures/file.input --number 1 --spaces 4
[
    {
        "MPN": "40001",
        "Manufacturer": "Keystone",
        "ReferenceDesignators": [
            "Z1",
            "Z3",
            "Z8"
        ],
        "NumOccurrences": 2
    }
]
```

## testing

Tests can be run run using `npm test`.

```
$ npm test

> bomparse@0.0.0 test /Users/anand/github/anandsuresh/bomparse
> mocha spec


  bomparse
    reading from stdin
      ✓ must corectly parse input from stdin (119ms)
    checking a single BOM line item
      ✓ must correctly parse data when running a check (114ms)
      ✓ must error out when checking bad/unknown formats (111ms)
    reading from a file
      ✓ must correctly parse input from a file (115ms)
      ✓ must error out when using file input without --number (106ms)
    formatting the output
      ✓ must write output with 2 spaces, by default (114ms)
      ✓ must write output with the specified number of spaces (123ms)

  Parser
    ✓ Format 1: AXXX-1000:Panasonic:D1,D8,D9
    ✓ Format 1: TSR-1002:Panasonic:A1,D2
    ✓ Format 1: tsr - 10 02: panaSonic: a1,D 2
    ✓ Format 2: Panasonic -- TSR-1002:A1
    ✓ Format 2: Wintermute Systems -- CASE-19201:A2,A3
    ✓ Format 2:  WinteRMute  systems  -  -T  s R - 1 0 0 2 :a1
    ✓ Format 3: Z1,Z3;40001;Keystone
    ✓ Format 3: Z1, z 3,Z 8;40001;Keystone


  15 passing (812ms)
```

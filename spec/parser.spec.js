/**
 * @file Behavioral specification for BOM line item parser
 */
'use strict'

const { expect } = require('chai')
const Parser = require('../lib/parser')

/**
 * Test cases to be validated; each test case is an object specifying the
 * format type (1, 2 or 3), and the expected output
 * @type {Object}
 */
const TEST_CASES = {
  'AXXX-1000:Panasonic:D1,D8,D9': {
    format: 1,
    expected: {
      MPN: 'AXXX-1000',
      Manufacturer: 'Panasonic',
      ReferenceDesignators: new Set(['D1', 'D8', 'D9'])
    }
  },
  'TSR-1002:Panasonic:A1,D2': {
    format: 1,
    expected: {
      MPN: 'TSR-1002',
      Manufacturer: 'Panasonic',
      ReferenceDesignators: new Set(['A1', 'D2'])
    }
  },
  'tsr - 10 02: panaSonic: a1,D 2': {
    format: 1,
    expected: {
      MPN: 'TSR-1002',
      Manufacturer: 'Panasonic',
      ReferenceDesignators: new Set(['A1', 'D2'])
    }
  },
  'Panasonic -- TSR-1002:A1': {
    format: 2,
    expected: {
      MPN: 'TSR-1002',
      Manufacturer: 'Panasonic',
      ReferenceDesignators: new Set(['A1'])
    }
  },
  'Wintermute Systems -- CASE-19201:A2,A3': {
    format: 2,
    expected: {
      MPN: 'CASE-19201',
      Manufacturer: 'Wintermute Systems',
      ReferenceDesignators: new Set(['A2', 'A3'])
    }
  },
  ' WinteRMute  systems  -  -T  s R - 1 0 0 2 :a1': {
    format: 2,
    expected: {
      MPN: 'TSR-1002',
      Manufacturer: 'Wintermute Systems',
      ReferenceDesignators: new Set(['A1'])
    }
  },
  'Z1,Z3;40001;Keystone': {
    format: 3,
    expected: {
      MPN: '40001',
      Manufacturer: 'Keystone',
      ReferenceDesignators: new Set(['Z1', 'Z3'])
    }
  },
  'Z1, z 3,Z 8;40001;Keystone': {
    format: 3,
    expected: {
      MPN: '40001',
      Manufacturer: 'Keystone',
      ReferenceDesignators: new Set(['Z1', 'Z3', 'Z8'])
    }
  }
}

describe('Parser', function () {
  for (const line in TEST_CASES) {
    const { format, expected } = TEST_CASES[line]

    it(`Format ${format}: ${line}`, function () {
      const actual = Parser.parse(line, format - 1)
      expect(actual).to.deep.include(expected)
    })
  }
})

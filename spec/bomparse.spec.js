/**
 * @file Behavioral specification for the bomparse tool
 */
'use strict'

const { expect } = require('chai')
const { spawnSync } = require('child_process')
const { readFileSync } = require('fs')
const { join } = require('path')

const BOMPARSE = join(__dirname, '..', 'bin', 'bomparse.js')
const INPUT = readFileSync(join(__dirname, 'fixtures', 'file.input'))
const OUTPUT = readFileSync(join(__dirname, 'fixtures', 'file.output'))

describe('bomparse', function () {
  describe('reading from stdin', function () {
    it('must corectly parse input from stdin', function () {
      const cmd = spawnSync(BOMPARSE, { input: Buffer.from(`2\n${INPUT}`) })

      expect(cmd.status).to.equal(0)
      expect(cmd.stdout).to.deep.equal(Buffer.from(OUTPUT))
    })
  })

  describe('checking a single BOM line item', function () {
    it('must correctly parse data when running a check', function () {
      const cmd = spawnSync(BOMPARSE, ['--check', 'Z1,Z3,Z8;40001;Keystone'])

      expect(cmd.status).to.equal(0)
      const obj = JSON.parse(cmd.stdout.toString())
      expect(obj).to.be.an('object')
      expect(obj.MPN).to.equal('40001')
      expect(obj.Manufacturer).to.equal('Keystone')
      expect(obj.ReferenceDesignators).to.deep.equal(['Z1', 'Z3', 'Z8'])
      expect(obj.NumOccurrences).to.equal(1)
    })

    it('must error out when checking bad/unknown formats', function () {
      const cmd = spawnSync(BOMPARSE, ['--check', 'bad input'])
      const err = 'failed to parse!\n'

      expect(cmd.status).to.equal(1)
      expect(cmd.stderr).to.deep.equal(Buffer.from(err))
    })
  })

  describe('reading from a file', function () {
    it('must correctly parse input from a file', function () {
      const cmd = spawnSync(BOMPARSE, [
        '--file', join(__dirname, 'fixtures', 'file.input'),
        '--number', 2
      ])

      expect(cmd.status).to.equal(0)
      expect(cmd.stdout).to.deep.equal(Buffer.from(OUTPUT))
    })

    it('must error out when using file input without --number', function () {
      const cmd = spawnSync(BOMPARSE, [
        '--file', join(__dirname, 'fixtures', 'file.input')
      ])
      const err = 'must specify --number/-n when reading from a file!\n'

      expect(cmd.status).to.equal(1)
      expect(cmd.stderr.toString()).to.equal(err)
    })
  })

  describe('formatting the output', function () {
    const obj = JSON.parse(OUTPUT)

    it('must write output with 2 spaces, by default', function () {
      const output = `${JSON.stringify(obj, null, 2)}\n`
      const cmd = spawnSync(BOMPARSE, { input: Buffer.from(`2\n${INPUT}`) })

      expect(cmd.status).to.equal(0)
      expect(cmd.stdout).to.deep.equal(Buffer.from(output))
    })

    it('must write output with the specified number of spaces', function () {
      const output = `${JSON.stringify(obj, null, 4)}\n`
      const cmd = spawnSync(BOMPARSE, [
        '--spaces', '4'
      ], { input: Buffer.from(`2\n${INPUT}`) })

      expect(cmd.status).to.equal(0)
      expect(cmd.stdout).to.deep.equal(Buffer.from(output))
    })
  })
})

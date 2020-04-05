/**
 * @file Implements a BOM line item parser
 */
'use strict'

/**
 * Defines the named capture group for a manufacturer part number
 * @type {String}
 */
const NCG_MPN = '(?<MPN>[A-Z0-9- ]+)'

/**
 * Defines the named capture group for the name of the manufacturer
 * @type {String}
 */
const NCG_MANUFACTURER = '(?<Manufacturer>[A-Za-z0-9 ]+)'

/**
 * Defines the named capture group for the reference designators
 * @type {String}
 */
const NCG_REFS = '(?<ReferenceDesignators>[A-Za-z0-9 ]+(,[A-Za-z0-9 ]+)*)'

/**
 * Defines a list of regular expressions describing the BOM line item formats
 * @type {RegExp[]}
 */
const FORMATS = [
  new RegExp(`^${NCG_MPN}:${NCG_MANUFACTURER}:${NCG_REFS}$`, 'i'),
  new RegExp(`^${NCG_MANUFACTURER}-\\s*-${NCG_MPN}:${NCG_REFS}$`, 'i'),
  new RegExp(`^${NCG_REFS};${NCG_MPN};${NCG_MANUFACTURER}$`, 'i')
]

/**
 * Defines a BOM list item
 */
class BomItem {
  /**
   * Constructs a new instance of a BOM line item
   *
   * This method cleans up the manufacturer part number, manufacturer name and
   * the reference designators. Cleaning ensures the removal any additional
   * spaces in the fields, and fixing the character cases.
   *
   * It also auto-initializes the number of occurences to 1.
   *
   * @param {String} MPN The manufacturer part number
   * @param {String} Manufacturer The name of the manufacturer
   * @param {String} ReferenceDesignators Comma-separated reference designators
   */
  constructor ({ MPN, Manufacturer, ReferenceDesignators }) {
    this.MPN = MPN.toUpperCase()
      .split(/\s*/)
      .filter(char => !!char)
      .join('')
    this.Manufacturer = Manufacturer.toLowerCase()
      .split(/\s+/)
      .filter(word => !!word)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
    this.ReferenceDesignators = new Set(ReferenceDesignators.toUpperCase()
      .split(/\s*/)
      .filter(char => !!char)
      .join('')
      .split(','))
    this.NumOccurrences = 1

    // seal the object to prevent any additional fields from being added
    Object.seal(this)
  }

  /**
   * Returns a unique identifier for the BOM item
   *
   * This is currently a concatenation of the manufacturer name and the part
   * number. This identifier is used to differentiate between similar part
   * numbers for different manufacturers.
   *
   * @returns {String}
   */
  get id () {
    return `${this.Manufacturer}:${this.MPN}`
  }

  /**
   * Returns the JSON representation of the BOM line item instane
   * @returns {Object}
   */
  toJSON () {
    const { MPN, Manufacturer, ReferenceDesignators, NumOccurrences } = this
    return {
      MPN,
      Manufacturer,
      ReferenceDesignators: Array.from(ReferenceDesignators),
      NumOccurrences
    }
  }
}

/**
 * Parses a BOM line item into an object
 *
 * This method iterates over all the regular expressions for each and every
 * BOM format and returns the first one that successfully parses the line.
 *
 * NOTE: If a regular expression fails to parse out all 3 components of the BOM
 * line item, this function will fail!
 *
 * @param {String} line A string describing the BOM line item
 * @param {Number} [format] Used for testing; not recommended for production use
 * @returns {BomItem|null} A BomItem instance; null if the line cannot be parsed
 * @throws Throws an error if the line is null; Also throws during testing when
 * the format used to parse the line is not the one expected.
 */
module.exports.parse = function (line, format) {
  if (line == null) throw new Error('`line` must be a valid string!')

  for (const index in FORMATS) {
    const matches = line.match(FORMATS[index])

    if (matches != null && matches.groups != null) {
      if (isNaN(format) || (+index === format)) {
        return new BomItem(matches.groups)
      } else {
        throw new Error('Parsed successfully, but not the expected format!')
      }
    }
  }

  return null
}

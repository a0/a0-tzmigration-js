/**
 * @jest-environment node
 */
import util from '../src/util'

test('offset_to_str', () => {
  expect(util.offset_to_str(0)).toEqual('+00:00:00')
  expect(util.offset_to_str(-1)).toEqual('-00:00:01')
  expect(util.offset_to_str(-3600)).toEqual('-01:00:00')
  expect(util.offset_to_str(-16200)).toEqual('-04:30:00')
})

test('timestamp_to_str', () => {
  expect(util.timestamp_to_str(0)).toEqual('1970-01-01 00:00:00 UTC')
  expect(util.timestamp_to_str(-1893439034)).toEqual('1910-01-01 04:42:46 UTC')
  expect(util.timestamp_to_str(637729200)).toEqual('1990-03-18 03:00:00 UTC')
  expect(util.timestamp_to_str(-Infinity)).toEqual('-∞')
  expect(util.timestamp_to_str(Infinity)).toEqual('∞')
})

test('range_item', () => {
  expect(util.range_item(-740520000, -718056000, 3600)).toEqual({ ini_str: '1946-07-15 04:00:00 UTC', fin_str: '1947-04-01 04:00:00 UTC', off_str: '+01:00:00', ini: -740520000, fin: -718056000, off: 3600 })
})

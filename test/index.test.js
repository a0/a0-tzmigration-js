/**
 * @jest-environment node
 */
import { TZVersion } from '../src/index'

test('timezones', async () => {
  const timezones = await new TZVersion().timezones()
  expect(Object.keys(timezones)).toEqual(expect.arrayContaining(['America/Santiago', 'Zulu']))
  expect(timezones['America/Santiago'].versions).toEqual(expect.arrayContaining(['2018c', '2018e']))
})

test('versions', async () => {
  const versions = await new TZVersion().versions()
  expect(Object.keys(versions)).toEqual(expect.arrayContaining(['2013c', '2018e']))
  expect(versions['2013c'].timezones).toEqual(expect.arrayContaining(['America/Santiago', 'Zulu']))
})

test('fetch timezone version', async () => {
  const data = await new TZVersion().fetch('America/Santiago', '2018e')
  expect(data.released_at).toEqual('2018-05-01 23:42:51 -0700')
})

test('fetch aliased timezone version', async () => {
  let tzversion = new TZVersion()
  const data = await tzversion.fetch('America/Caracas', '2018e')
  expect(data.released_at).toEqual('2018-05-01 23:42:51 -0700')
})

test('returns an empty list for America/Santiago between 2014i 2014j versions', async () => {
  let tzversion = new TZVersion()
  const data_a = await tzversion.fetch('America/Santiago', '2014i')
  const data_b = await tzversion.fetch('America/Santiago', '2014j')
  let delta = tzversion.delta_ranges(data_a, data_b)
  expect(delta.length).toBe(0)
})

test('returns a non empty list for America/Santiago between 2014i 2015a versions', async () => {
  let tzversion = new TZVersion()
  const data_a = await tzversion.fetch('America/Santiago', '2014i')
  const data_b = await tzversion.fetch('America/Santiago', '2015a')
  let delta = tzversion.delta_ranges(data_a, data_b)
  expect(delta.length).not.toBe(0)
})

test('returns the delta range expected for America/Caracas', async () => {
  let tzversion = new TZVersion()
  const data_a = await tzversion.fetch('America/Caracas', '2016c')
  const data_b = await tzversion.fetch('America/Caracas', '2016d')
  let delta = tzversion.delta_ranges(data_a, data_b)

  expect(delta.length).toBe(1)
  expect(delta[0].off).toBe(1800)
  expect(delta[0].ini).toBe(Date.parse('2016-05-01T02:30:00-04:30') / 1000)
})


let compare_inverse = async (zone_a, version_a, zone_b, version_b) => {
  let tzversion = new TZVersion()
  const data_a = await tzversion.fetch(zone_a, version_a)
  const data_b = await tzversion.fetch(zone_b, version_b)
  let delta_ab = tzversion.delta_ranges(data_a, data_b)
  let delta_ba = tzversion.delta_ranges(data_b, data_a)

  expect(delta_ab.length).toBe(delta_ba.length)

  delta_ab.forEach((item, index) => {
    let item_a = delta_ab[index]
    let item_b = delta_ba[index]

    expect(item_a.ini).toBe(item_b.ini)
    expect(item_a.fin).toBe(item_b.fin)
    expect(item_a.off).toBe(-item_b.off)
  });
}

let f = (a, b) => [].concat(...a.map(a => b.map(b => [].concat(a, b))))
let cartesian = (a, b, ...c) => b ? cartesian(f(a, b), ...c) : a

let versions = ['2013c', '2015a', '2016a', '2018e']
cartesian(versions, versions).forEach(([version_a, version_b]) => {
  test('returns the inverse delta range list for America/Santiago between 2013c 2018e versions', () => {
    compare_inverse('America/Santiago', version_a, 'America/Santiago', version_b)
  })
})

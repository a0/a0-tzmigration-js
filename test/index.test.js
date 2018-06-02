/**
 * @jest-environment node
 */
import { TZVersion } from '../src/index'

jest.setTimeout(40000) // sorry, my network is not so good here…

function expect_eq_not_null(value_a, value_b) {
  expect(value_a).toEqual(value_b)
  expect(value_a).not.toBeNull()
  expect(value_b).not.toBeNull()
}

test('has a version number', () => {
  expect(TZVersion.VERSION).not.toBeFalsy()
  expect(TZVersion.VERSION).toEqual('1.0.0')
})

test('can load version index', async () => {
  const versions = await TZVersion.versions()
  expect(Object.keys(versions)).toEqual(expect.arrayContaining(['2013c', '2018e']))
  expect(versions['2013c'].timezones).toEqual(expect.arrayContaining(['America/Santiago', 'Zulu']))
})

test('can load timezone index', async () => {
  const timezones = await TZVersion.timezones()
  expect(Object.keys(timezones)).toEqual(expect.arrayContaining(['America/Santiago', 'Zulu']))
  expect(timezones['America/Santiago'].versions).toEqual(expect.arrayContaining(['2018c', '2018e']))
})

test('can get a tzversion release date', async () => {
  let tzversion = new TZVersion('America/Santiago', '2018e')
  let released_at = await tzversion.released_at()
  expect(released_at).toEqual('2018-05-01 23:42:51 -0700')
})

test('can load an aliased tzversion and has the same data that the target timezone version', async () => {
  let tzversion_a = new TZVersion('America/Santiago', '2018e')
  let tzversion_b = new TZVersion('Chile/Continental', '2018e')
  let version_data_a = await tzversion_a.version_data()
  let version_data_b = await tzversion_b.version_data()
  expect_eq_not_null(version_data_a, version_data_b)
})

test('throws error when loading an unknown version', async () => {
  let tzversion = new TZVersion('America/Santiago', '1800a')
  await expect(tzversion.version_data()).rejects.toThrow('Version 1800a not found for America/Santiago.')
})

test('throws error when loading an unknown timezone', async () => {
  let tzversion = new TZVersion('America/Santiagors', '2018e')
  await expect(tzversion.version_data()).rejects.toThrow()
})

test('returns no changes for America/Santiago from version 2014i to 2014j', async () => {
  let tzversion_a = new TZVersion('America/Santiago', '2014i')
  let tzversion_b = new TZVersion('America/Santiago', '2014j')
  let changes = await tzversion_a.changes(tzversion_b)
  expect(changes).toEqual([])
})

test('returns non empty changes for America/Santiago version 2016j to America/Punta_Arenas 2017a', async () => {
  let tzversion_a = new TZVersion('America/Santiago', '2016j')
  let tzversion_b = new TZVersion('America/Punta_Arenas', '2017a')
  let changes = await tzversion_a.changes(tzversion_b)
  expect(changes.length).not.toEqual(0)
})

test('returns the expected changes for America/Caracas from version 2016c to 2016d', async () => {
  let tzversion_a = new TZVersion('America/Caracas', '2016c')
  let tzversion_b = new TZVersion('America/Caracas', '2016d')
  let changes = await tzversion_a.changes(tzversion_b)
  let first = changes[0]

  expect(changes.length).toEqual(1)
  expect(first.off).toEqual(1800)
  expect(first.ini).toEqual(Date.parse('2016-05-01T02:30:00-04:30') / 1000)
  expect(first.fin).toEqual(Infinity)
  expect(first.ini_str).toEqual('2016-05-01 07:00:00 UTC')
  expect(first.fin_str).toEqual('∞')
  expect(first.off_str).toEqual('+00:30:00')
})

test('returns the expected changes for versions with empty transitions like UTC', async () => {
  let tzversion_a = new TZVersion('UTC', '2013c')
  let tzversion_b = new TZVersion('UTC', '2018e')
  let changes = await tzversion_a.changes(tzversion_b)
  expect(changes).toEqual([])
})

test('returns the expected changes between a version with empty transitions to an non empty one', async () => {
  let tzversion_a = new TZVersion('Africa/Abidjan', '2018e')
  let tzversion_b = new TZVersion('UTC', '2018e')

  let changes = await tzversion_a.changes(tzversion_b)
  let expected = [{ ini: -Infinity, fin: -1830383032, off: 968, ini_str: '-∞', fin_str: '1912-01-01 00:16:08 UTC', off_str: '+00:16:08' }]
  expect(changes).toEqual(expected)

  changes = await tzversion_b.changes(tzversion_a)
  expected = [{ ini: -Infinity, fin: -1830383032, off: -968, ini_str: '-∞', fin_str: '1912-01-01 00:16:08 UTC', off_str: '-00:16:08' }]
  expect(changes).toEqual(expected)
})

let compare_inverse = async (zone_a, version_a, zone_b, version_b) => {
  let tzversion_a = new TZVersion(zone_a, version_a)
  let tzversion_b = new TZVersion(zone_b, version_b)
  let changes_ab = await tzversion_a.changes(tzversion_b)
  let changes_ba = await tzversion_b.changes(tzversion_a)

  expect(changes_ab.length).toEqual(changes_ba.length)

  changes_ab.forEach((item, index) => {
    let item_a = changes_ab[index]
    let item_b = changes_ba[index]

    expect_eq_not_null(item_a.ini, item_b.ini)
    expect_eq_not_null(item_a.fin, item_b.fin)
    expect_eq_not_null(item_a.off, item_b.off)
    expect_eq_not_null(item_a.ini_str, item_b.ini_str)
    expect_eq_not_null(item_a.fin_str, item_b.fin_str)
  });
}

let f = (a, b) => [].concat(...a.map(a => b.map(b => [].concat(a, b))))
let product = (a, b, ...c) => b ? product(f(a, b), ...c) : a

let versions = ['2013c', '2015a', '2016a', '2018e']
product(versions, versions).forEach(([version_a, version_b]) => {
  test(`returns the inverse changes for America/Santiago between version ${version_a} and ${version_b}`, () => {
    compare_inverse('America/Santiago', version_a, 'America/Santiago', version_b)
  })
})

test('config base_url works as expected', async () => {
  let base_url = TZVersion.config.base_url
  expect(base_url).toEqual('https://a0.github.io/a0-tzmigration-ruby/data/')
  let timezones = await TZVersion.timezones()
  expect(Object.keys(timezones)).toEqual(expect.arrayContaining(['America/Santiago', 'Zulu']))

  TZVersion.config.base_url = 'https://foo'
  await expect(TZVersion.timezones()).rejects.toThrow()

  TZVersion.config.base_url = base_url // get configuration back to normal
})

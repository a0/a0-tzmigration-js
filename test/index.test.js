import { TZVersion } from '../src/index'

test('something', () => {
  let a = new TZVersion('America/Santiago', '2016a')
  expect(a.version).toBe('2016a')
})

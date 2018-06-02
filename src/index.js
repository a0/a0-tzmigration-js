import regeneratorRuntime from "regenerator-runtime" // eslint-disable-line no-unused-vars

import axios from 'axios'
import util from './util'
import { version } from '../package.json'

const config = {
  base_url: 'https://a0.github.io/a0-tzmigration-ruby/data/'
}

class TZVersion {
  constructor(name, version) {
    this.name = name
    this.version = version
    this.cache = {}
  }

  async data() {
    if (!this.cache.data) {
      let response = await axios.get(config.base_url + 'timezones/' + this.name + '.json')

      this.cache.data = response.data
    }

    return this.cache.data
  }

  async version_data() {
    if (!this.cache.version_data) {
      let data = await this.data()

      if (!(this.version in data.versions)) {
        throw new Error(`Version ${this.version} not found for ${this.name}.`)
      }

      let version_data = data.versions[this.version]
      if (version_data.alias) {
        this.cache.link = new TZVersion(version_data.alias, this.version)
        version_data = await this.cache.link.version_data()
      }

      this.cache.version_data = version_data
    }

    return this.cache.version_data
  }

  async released_at() {
    if (!this.cache.released_at) {
      let version_data = await this.version_data()

      this.cache.released_at = version_data.released_at
    }

    return this.cache.released_at
  }

  async transitions() {
    if (!this.cache.transitions) {
      let version_data = await this.version_data()

      this.cache.transitions = version_data.transitions
    }

    return this.cache.transitions
  }

  async transition_ranges() {
    if (!this.cache.transition_ranges) {
      let transitions = await this.transitions()

      let ini = -Infinity
      let fin = Infinity
  
      if (transitions.length == 0) {
        this.cache.transition_ranges = [util.range_item(ini, fin, 0)]
      } else {
        let ranges = transitions.map(transition => {
          return util.range_item(ini, (ini = transition.utc_timestamp), transition.utc_prev_offset)
        })

        ranges.push(util.range_item(ranges[ranges.length - 1].fin, fin, transitions[transitions.length - 1].utc_offset))

        this.cache.transition_ranges = ranges
      }
    }

    return this.cache.transition_ranges
  }

  async timestamps() {
    if (!this.cache.timestamps) {
      let transitions = await this.transitions()

      let timestamps = []
      timestamps.push(-Infinity)
      transitions.forEach(transition => {
        timestamps.push(transition.utc_timestamp)
      })
      timestamps.push(Infinity)
  
      this.cache.timestamps = timestamps
    }

    return this.cache.timestamps
  }

  async changes(other) {
    let timestamps_a = await this.timestamps()
    let timestamps_b = await other.timestamps()

    let timestamps = timestamps_a.concat(timestamps_b).sort( (a, b) => a - b).filter((item, index, array) => {
      return index == array.length -1 || array[index+ 1] != item
    })

    let transition_ranges_a = await this.transition_ranges()
    let transition_ranges_b = await other.transition_ranges()

    let list_a = util.split_ranges(transition_ranges_a, timestamps)
    let list_b = util.split_ranges(transition_ranges_b, timestamps)

    let changes = []
    list_a.forEach((range_a, index) => {
      let range_b = list_b[index]

      if (range_a.off != range_b.off) {
        changes.push(util.range_item(range_a.ini, range_a.fin, range_b.off - range_a.off))
      }
    })

    return util.compact_ranges(changes)
  }

  static async versions() {
    let response = await axios.get(config.base_url + 'versions/00-index.json')

    return response.data.versions
  }

  static async timezones() {
    let response = await axios.get(config.base_url + 'timezones/00-index.json')

    return response.data.timezones
  }

  static get config() {
    return config
  }

  static get VERSION() {
    return version
  }
}

export { TZVersion }

import axios from 'axios'

class TZVersion {
  constructor(base_url = "https://a0.github.io/a0-tzmigration-ruby/data/") {
    this.base_url = base_url
  }

  fetch(name, version) {
    this.name = name
    this.version = version
    return new Promise((resolve, reject) => {
      axios.get(this.base_url + 'timezones/' + name + '.json').then(response => {
        this.data = response.data
        if (!(version in response.data.versions)) {
          throw new Error(`Version ${version} not found`)
        }

        let version_data = response.data.versions[version]
        if (version_data.alias) {
          this.fetch(version_data.alias, version).then(resolve).catch(reject)
        } else {
          resolve(version_data)
        }
      }).catch(reject)
    })
  }

  timestamps(version_data) {
    let result = []

    result.push(-Infinity)
    version_data.transitions.forEach(transition => {
      result.push(transition.utc_timestamp)
    })
    result.push(Infinity)

    return result
  }

  timezone_ranges(version_data) {
    let ini = -Infinity
    let fin = Infinity

    let ranges = []
    version_data.transitions.forEach(transition => {
      ranges.push({ ini: ini, fin: (ini = transition.utc_timestamp), off: transition.utc_prev_offset })
    })

    if (ranges.length > 0) {
      let last = ranges[ranges.length - 1]
      ranges.push({ ini: last.fin, fin: fin, off: version_data.transitions[version_data.transitions.length - 1].utc_offset })
    }

    return ranges
  }

  next_index(index, ranges, timestamp) {
    while (((index + 1) < ranges.length) && (ranges[index].ini < timestamp) && (ranges[index].fin <= timestamp)) {
      index += 1
    }

    return index
  }

  split_range_list(ranges, timestamps) {
    let index = this.next_index(0, ranges, timestamps[0])

    timestamps.forEach((timestamp, timestamp_index) => {
      let range = ranges[index]

      if (timestamp > range.ini && timestamp < range.fin && index < ranges.length) {
        ranges.splice(index + 1, 0, Object.assign({}, range, { ini: timestamp }))
        ranges[index].fin = timestamp
      }

      if (timestamp_index + 1 < timestamps.length) {
        index = this.next_index(index, ranges, timestamps[timestamp_index + 1])
      }
    })

    return ranges
  }

  compact_ranges(ranges) {
    let index = 0

    while (index < ranges.length) {
      let curr = ranges[index]
      let next = ranges[index + 1]

      if (next && curr.fin == next.ini && curr.off == next.off) {
        curr.fin = next.fin
        ranges.splice(index + 1, 1)
      } else {
        index += 1
      }
    }

    return ranges
  }

  delta_ranges(a, b) {
    let timestamps_a = this.timestamps(a)
    let timestamps_b = this.timestamps(b)
    let timestamps = timestamps_a.concat(timestamps_b).sort( (a, b) => a - b).filter((item, index, array) => {
      return index == array.length -1 || array[index+ 1] != item
    })

    let list_a = this.split_range_list(this.timezone_ranges(a), timestamps)
    let list_b = this.split_range_list(this.timezone_ranges(b), timestamps)

    let delta = []
    list_a.forEach((range_a, index) => {
      let range_b = list_b[index]

      if (range_a.off != range_b.off) {
        delta.push({ ini: range_a.ini, fin: range_a.fin, off: range_b.off - range_a.off })
      }
    })

    return this.compact_ranges(delta)
  }

  timezones() {
    return new Promise((resolve, reject) => {
      axios.get(this.base_url + 'timezones/00-index.json').then(response => {
        resolve(response.data.timezones)
      }).catch(reject)
    })
  }

  versions() {
    return new Promise((resolve, reject) => {
      axios.get(this.base_url + 'versions/00-index.json').then(response => {
        resolve(response.data.versions)
      }).catch(reject)
    })
  }
}

export { TZVersion }

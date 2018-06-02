function pad(number) {
  return number < 10 ? '0' + number : '' + number
}

export default {
  compact_ranges(ranges) {
    let index = 0

    while (index < ranges.length) {
      let curr_range = ranges[index]
      let next_range = ranges[index + 1]

      if (next_range && curr_range.fin == next_range.ini && curr_range.off == next_range.off) {
        curr_range.fin = next_range.fin
        curr_range.fin_str = next_range.fin_str
        ranges.splice(index + 1, 1)
      } else {
        index += 1
      }
    }

    return ranges
  },
  offset_to_str(offset) {
    let date = new Date(null)
    let off = offset < 0 ? -offset : offset
    let sig = offset < 0 ? '-' : '+'
  
    date.setTime(off*1000)
  
    return sig + date.toISOString().substr(11, 8)
  },
  timestamp_to_str(timestamp) {
    if (timestamp == -Infinity) {
      return '-∞'
    } else if (timestamp == Infinity) {
      return '∞'
    } else {
      let date = new Date(timestamp * 1000)
      return date.getUTCFullYear() + '-' + pad(date.getUTCMonth() + 1) + '-' + pad(date.getUTCDate()) + ' ' +
             pad(date.getUTCHours()) + ':' + pad(date.getUTCMinutes()) + ':' + pad(date.getUTCSeconds()) + ' UTC'
    }
  },
  range_item(ini, fin, off) {
    return { ini_str: this.timestamp_to_str(ini), fin_str: this.timestamp_to_str(fin), off_str: this.offset_to_str(off), ini: ini, fin: fin, off: off }
  },
  next_index(index, ranges, timestamp) {
    while (((index + 1) < ranges.length) && (ranges[index].ini < timestamp) && (ranges[index].fin <= timestamp)) {
      index += 1
    }

    return index
  },
  split_ranges(ranges, timestamps) {
    ranges = ranges.map(x => Object.assign({}, x))
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
}

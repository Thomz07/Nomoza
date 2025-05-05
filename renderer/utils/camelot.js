const camelotMap = {
    'C major': '8B', 'G major': '9B', 'D major': '10B', 'A major': '11B',
    'E major': '12B', 'B major': '1B', 'F# major': '2B', 'C# major': '3B',
    'G# major': '4B', 'D# major': '5B', 'A# major': '6B', 'F major': '7B',
    'A minor': '8A', 'E minor': '9A', 'B minor': '10A', 'F# minor': '11A',
    'C# minor': '12A', 'G# minor': '1A', 'D# minor': '2A', 'A# minor': '3A',
    'F minor': '4A', 'C minor': '5A', 'G minor': '6A', 'D minor': '7A'
  }
  
  export function toCamelot(key, scale) {
    return camelotMap[`${key} ${scale}`] || '—'
  }  
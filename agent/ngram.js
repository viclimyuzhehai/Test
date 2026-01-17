// Very small session-local n-gram predictor for editor content (ES module for renderer)
export default class NGramPredictor {
  constructor(n = 3) {
    this.n = n
    this.map = new Map()
    this.buffer = ''
  }

  // feed accepts a string chunk (e.g., editor content or change)
  feed(chunk) {
    if (!chunk) return
    this.buffer += chunk
    const tokens = this.buffer.split(/\s+/).filter(Boolean)
    for (let i = 0; i + this.n < tokens.length; i++) {
      const key = tokens.slice(i, i + this.n).join(' ')
      const next = tokens[i + this.n]
      const entry = this.map.get(key) || {}
      entry[next] = (entry[next] || 0) + 1
      this.map.set(key, entry)
    }
    // keep buffer manageable
    if (tokens.length > 2000) {
      this.buffer = tokens.slice(-1000).join(' ')
    }
  }

  // predict up to topK next tokens given a prefix string
  predict(prefix, topK = 3) {
    if (!prefix) return []
    const tokens = prefix.split(/\s+/).filter(Boolean)
    const key = tokens.slice(-this.n).join(' ')
    const entry = this.map.get(key) || {}
    const items = Object.entries(entry).sort((a, b) => b[1] - a[1])
    return items.slice(0, topK).map(i => i[0])
  }
}

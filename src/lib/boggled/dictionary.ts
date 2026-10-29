export class Dictionary {
  readonly words: string[];
  private readonly set: Set<string>;

  constructor(words: string[]) {
    this.words = [...words].sort();
    this.set = new Set(this.words);
  }

  static fromText(text: string): Dictionary {
    return new Dictionary(
      text
        .split("\n")
        .map((w) => w.trim().toLowerCase())
        .filter((w) => /^[a-z]+$/.test(w)),
    );
  }

  has(word: string): boolean {
    return this.set.has(word);
  }

  hasPrefix(prefix: string): boolean {
    let lo = 0;
    let hi = this.words.length;
    while (lo < hi) {
      const mid = (lo + hi) >>> 1;
      if (this.words[mid] < prefix) lo = mid + 1;
      else hi = mid;
    }
    return lo < this.words.length && this.words[lo].startsWith(prefix);
  }
}

let loading: Promise<Dictionary> | null = null;

export function loadDictionary(url = "/boggled/words.txt"): Promise<Dictionary> {
  if (!loading) {
    loading = fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(`Dictionary failed to load (${res.status})`);
        return res.text();
      })
      .then((text) => Dictionary.fromText(text))
      .catch((err) => {
        loading = null;
        throw err;
      });
  }
  return loading;
}

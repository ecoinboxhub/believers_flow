"""
Generate synchronized tune files for frontend (JS) and backend (Python).
Melodies are generated programmatically based on each hymn's key.
Run: python scripts/generate_tunes.py
Output: updates src/hymnFallbackTunes.js and backend/api/hymn_tunes.py
"""
import json, itertools

# Scale mappings: tonic through octave for each key
SCALES = {
  'C':  ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5',
         'D5', 'E5', 'F5', 'G5', 'A5', 'B5', 'C6'],
  'G':  ['G3', 'A3', 'B3', 'C4', 'D4', 'E4', 'F#4', 'G4',
         'A4', 'B4', 'C5', 'D5', 'E5', 'F#5', 'G5'],
  'D':  ['D4', 'E4', 'F#4', 'G4', 'A4', 'B4', 'C#5', 'D5',
         'E5', 'F#5', 'G5', 'A5', 'B5', 'C#6', 'D6'],
  'Eb': ['Eb4', 'F4', 'G4', 'Ab4', 'Bb4', 'C5', 'D5', 'Eb5',
         'F5', 'G5', 'Ab5', 'Bb5', 'C6'],
  'E':  ['E4', 'F#4', 'G#4', 'A4', 'B4', 'C#5', 'D#5', 'E5',
         'F#5', 'G#5', 'A5', 'B5', 'C#6', 'D#6', 'E6'],
}

# Melodic patterns as scale-degree sequences (0=tonic, 4=dominant, 7=octave)
# Each is a list of (scale_degree, duration) pairs
PATTERNS = {
  'arch1':  [(0,0.4),(1,0.4),(2,0.4),(3,0.4),(4,0.4),(5,0.4),(4,0.4),(4,0.4),(3,0.4),(2,0.4),(1,0.4),(0,0.8)],
  'arch2':  [(4,0.4),(5,0.4),(6,0.4),(7,0.8),(6,0.4),(5,0.4),(4,0.4),(3,0.4),(2,0.4),(1,0.4),(0,0.8)],
  'rise':   [(0,0.4),(0,0.4),(1,0.4),(2,0.4),(3,0.4),(4,0.4),(5,0.4),(4,0.8)],
  'fall':   [(5,0.4),(4,0.4),(3,0.4),(2,0.4),(1,0.4),(0,0.8)],
  'skip':   [(0,0.4),(2,0.4),(4,0.4),(5,0.4),(4,0.4),(2,0.4),(0,0.8)],
  'triad':  [(0,0.4),(2,0.4),(4,0.4),(7,0.4),(4,0.4),(2,0.4),(0,0.8)],
  'wave1':  [(0,0.4),(2,0.4),(3,0.4),(5,0.4),(6,0.4),(5,0.4),(3,0.4),(2,0.4),(0,0.8)],
  'wave2':  [(4,0.4),(3,0.4),(4,0.4),(5,0.4),(6,0.4),(7,0.4),(6,0.4),(5,0.4),(4,0.4),(4,0.8)],
  'cadence':[(2,0.4),(3,0.4),(4,0.4),(5,0.4),(4,0.8),(3,0.4),(2,0.4),(1,0.4),(0,1.2)],
  'descent':[(7,0.4),(6,0.4),(5,0.4),(4,0.4),(3,0.4),(2,0.4),(1,0.4),(0,0.8)],
  'gentle1':[(0,0.4),(0,0.4),(2,0.4),(4,0.4),(3,0.4),(2,0.4),(1,0.4),(0,0.8)],
  'gentle2':[(3,0.4),(4,0.4),(5,0.4),(6,0.4),(5,0.4),(4,0.4),(3,0.4),(2,0.4),(1,0.4),(0,0.8)],
}

# Hymn tune metadata (key, tempo, tune_name)
# Melodies are auto-generated from these using programmatic patterns
TUNE_META = {
  1:  {"key": "G",  "tempo": 90,  "tune_name": "New Britain"},
  2:  {"key": "Eb", "tempo": 80,  "tune_name": "O Store Gud"},
  3:  {"key": "G",  "tempo": 85,  "tune_name": "Faithfulness"},
  4:  {"key": "G",  "tempo": 88,  "tune_name": "Ville du Havre"},
  5:  {"key": "G",  "tempo": 95,  "tune_name": "Blessed Assurance"},
  6:  {"key": "E",  "tempo": 80,  "tune_name": "Nicaea"},
  7:  {"key": "G",  "tempo": 85,  "tune_name": "Erie"},
  8:  {"key": "G",  "tempo": 80,  "tune_name": "Woodworth"},
  9:  {"key": "G",  "tempo": 82,  "tune_name": "Toplady"},
  10: {"key": "G",  "tempo": 88,  "tune_name": "Nettleton"},
  11: {"key": "C",  "tempo": 90,  "tune_name": "Lasst uns erfreuen"},
  12: {"key": "C",  "tempo": 95,  "tune_name": "Coronation"},
  13: {"key": "G",  "tempo": 84,  "tune_name": "Sagina"},
  14: {"key": "Eb", "tempo": 76,  "tune_name": "Eventide"},
  15: {"key": "D",  "tempo": 78,  "tune_name": "Slane"},
  16: {"key": "C",  "tempo": 92,  "tune_name": "Jesus Loves Me"},
  17: {"key": "G",  "tempo": 80,  "tune_name": "Need"},
  18: {"key": "G",  "tempo": 78,  "tune_name": "Bethany"},
  19: {"key": "C",  "tempo": 75,  "tune_name": "Cantique de Noel"},
  20: {"key": "C",  "tempo": 70,  "tune_name": "Stille Nacht"},
  21: {"key": "G",  "tempo": 92,  "tune_name": "Mendelssohn"},
  22: {"key": "G",  "tempo": 90,  "tune_name": "Adeste Fideles"},
  23: {"key": "G",  "tempo": 100, "tune_name": "Antioch"},
  24: {"key": "C",  "tempo": 72,  "tune_name": "Mueller"},
  25: {"key": "D",  "tempo": 85,  "tune_name": "The First Noel"},
  26: {"key": "C",  "tempo": 90,  "tune_name": "Three Kings of Orient"},
  27: {"key": "G",  "tempo": 78,  "tune_name": "St. Louis"},
  28: {"key": "C",  "tempo": 95,  "tune_name": "Gloria"},
  29: {"key": "C",  "tempo": 74,  "tune_name": "Cranham"},
  30: {"key": "C",  "tempo": 76,  "tune_name": "Veni Emmanuel"},
  31: {"key": "E",  "tempo": 88,  "tune_name": "Diademata"},
  32: {"key": "C",  "tempo": 90,  "tune_name": "St. Theodulph"},
  33: {"key": "G",  "tempo": 80,  "tune_name": "Hamburg"},
  34: {"key": "G",  "tempo": 76,  "tune_name": "Were You There"},
  35: {"key": "C",  "tempo": 90,  "tune_name": "Ackley"},
  36: {"key": "C",  "tempo": 94,  "tune_name": "Easter Hymn"},
  37: {"key": "G",  "tempo": 90,  "tune_name": "Christ Arose"},
  38: {"key": "C",  "tempo": 86,  "tune_name": "Duke Street"},
  39: {"key": "C",  "tempo": 92,  "tune_name": "Judas Maccabaeus"},
  40: {"key": "C",  "tempo": 82,  "tune_name": "Bennard"},
  41: {"key": "G",  "tempo": 86,  "tune_name": "Hudson"},
  42: {"key": "C",  "tempo": 78,  "tune_name": "St. Christopher"},
  43: {"key": "C",  "tempo": 80,  "tune_name": "Horsley"},
  44: {"key": "G",  "tempo": 78,  "tune_name": "Garden"},
  45: {"key": "G",  "tempo": 82,  "tune_name": "He Leadeth Me"},
  46: {"key": "G",  "tempo": 80,  "tune_name": "Bradbury"},
  47: {"key": "G",  "tempo": 76,  "tune_name": "Crimond"},
  48: {"key": "C",  "tempo": 80,  "tune_name": "Vox Dilecti"},
  49: {"key": "G",  "tempo": 80,  "tune_name": "Thompson"},
  50: {"key": "G",  "tempo": 82,  "tune_name": "Pass Me Not"},
  52: {"key": "C",  "tempo": 85,  "tune_name": "Surrender"},
  63: {"key": "C",  "tempo": 80,  "tune_name": "Cowper"},
  64: {"key": "C",  "tempo": 90,  "tune_name": "Plainfield"},
  75: {"key": "G",  "tempo": 85,  "tune_name": "Hanson Place"},
  79: {"key": "G",  "tempo": 86,  "tune_name": "Resurrection"},
  94: {"key": "G",  "tempo": 78,  "tune_name": "Precious Lord"},
  97: {"key": "G",  "tempo": 82,  "tune_name": "Closer Walk"},
  100:{"key": "G",  "tempo": 84,  "tune_name": "Trust and Obey"},
}

# Assign pattern sequences to each hymn ID for variety
PATTERN_SEQUENCES = {}
pattern_names = list(PATTERNS.keys())
for i, hid in enumerate(sorted(TUNE_META.keys())):
  seq = []
  # Each hymn gets 4-6 patterns for a complete melody
  offsets = [(i * 7 + j * 3) % len(pattern_names) for j in range(6)]
  for o in offsets:
    seq.append(pattern_names[o])
  PATTERN_SEQUENCES[hid] = seq

def generate_notes(hid):
  """Generate notes for a hymn based on its key and pattern sequence."""
  meta = TUNE_META[hid]
  key = meta['key']
  scale = SCALES.get(key, SCALES['C'])
  seq = PATTERN_SEQUENCES[hid]

  notes = []
  for pname in seq:
    pattern = PATTERNS[pname]
    for degree, duration in pattern:
      pitch_idx = min(degree, len(scale) - 1)
      notes.append({"p": scale[pitch_idx], "d": duration})
  return notes

def build_tunes():
  TUNES = {}
  for hid in sorted(TUNE_META.keys()):
    meta = TUNE_META[hid]
    TUNES[hid] = {
      "key": meta["key"],
      "tempo": meta["tempo"],
      "tune_name": meta["tune_name"],
      "notes": generate_notes(hid),
    }
  return TUNES

TUNES = build_tunes()

def format_notes(notes):
  parts = []
  for n in notes:
    parts.append(f'{{"p": "{n["p"]}", "d": {n["d"]}}}')
  return ', '.join(parts)

def gen_js():
  lines = ['export const FALLBACK_TUNES = {']
  for hid in sorted(TUNES.keys()):
    t = TUNES[hid]
    lines.append(f'  {hid}: {{ key: "{t["key"]}", tempo: {t["tempo"]}, tune_name: "{t["tune_name"]}", notes: [')
    notes_str = format_notes(t["notes"])
    lines.append(f'    {notes_str},')
    lines.append(f'  ]}},')
  lines.append('}')
  lines.append('')
  return '\n'.join(lines)

def gen_py():
  lines = ['HYMN_TUNES = {']
  for hid in sorted(TUNES.keys()):
    t = TUNES[hid]
    lines.append(f'  {hid}: {{')
    lines.append(f'    "key": "{t["key"]}",')
    lines.append(f'    "tempo": {t["tempo"]},')
    lines.append(f'    "tune_name": "{t["tune_name"]}",')
    lines.append(f'    "notes": [')
    notes_str = format_notes(t["notes"])
    lines.append(f'      {notes_str},')
    lines.append(f'    ]')
    lines.append(f'  }},')
  lines.append('}')
  lines.append('')
  return '\n'.join(lines)

def write_file(path, content):
  old = None
  try:
    with open(path, 'r') as f:
      old = f.read()
  except: pass
  with open(path, 'w') as f:
    f.write(content)
  changed = old != content
  print(f'  {"CHANGED" if changed else "unchanged"} {path}')
  return changed

if __name__ == '__main__':
  import os
  root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
  js_path = os.path.join(root, 'src', 'hymnFallbackTunes.js')
  py_path = os.path.join(root, 'backend', 'api', 'hymn_tunes.py')

  print(f'Generating {len(TUNES)} hymn tunes...')
  write_file(js_path, gen_js())
  write_file(py_path, gen_py())
  print('Done!')

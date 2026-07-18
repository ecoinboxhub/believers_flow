/**
 * Import public-domain Bible texts from bible-api.com
 * Converts them to the local JSON format expected by bible_service.py
 *
 * Usage: node scripts/import_bible_texts.cjs [version_id]
 *   version_id defaults to "ASV" — can be: ASV, YLT, DBY, DRB, WBT, BBE, RV, WEB, KJV
 */
const https = require('https');
const fs = require('fs');
const path = require('path');

const BOOKS = [
  "Genesis","Exodus","Leviticus","Numbers","Deuteronomy","Joshua","Judges","Ruth",
  "1 Samuel","2 Samuel","1 Kings","2 Kings","1 Chronicles","2 Chronicles","Ezra",
  "Nehemiah","Esther","Job","Psalms","Proverbs","Ecclesiastes","Song of Solomon",
  "Isaiah","Jeremiah","Lamentations","Ezekiel","Daniel","Hosea","Joel","Amos",
  "Obadiah","Jonah","Micah","Nahum","Habakkuk","Zephaniah","Haggai","Zechariah",
  "Malachi","Matthew","Mark","Luke","John","Acts","Romans","1 Corinthians",
  "2 Corinthians","Galatians","Ephesians","Philippians","Colossians",
  "1 Thessalonians","2 Thessalonians","1 Timothy","2 Timothy","Titus","Philemon",
  "Hebrews","James","1 Peter","2 Peter","1 John","2 John","3 John","Jude","Revelation"
];

const CHAPTER_COUNTS = {
  "Genesis":50,"Exodus":40,"Leviticus":27,"Numbers":36,"Deuteronomy":34,"Joshua":24,"Judges":21,
  "Ruth":4,"1 Samuel":31,"2 Samuel":24,"1 Kings":22,"2 Kings":25,"1 Chronicles":29,
  "2 Chronicles":36,"Ezra":10,"Nehemiah":13,"Esther":10,"Job":42,"Psalms":150,"Proverbs":31,
  "Ecclesiastes":12,"Song of Solomon":8,"Isaiah":66,"Jeremiah":52,"Lamentations":5,"Ezekiel":48,
  "Daniel":12,"Hosea":14,"Joel":3,"Amos":9,"Obadiah":1,"Jonah":4,"Micah":7,"Nahum":3,
  "Habakkuk":3,"Zephaniah":3,"Haggai":2,"Zechariah":14,"Malachi":4,"Matthew":28,"Mark":16,
  "Luke":24,"John":21,"Acts":28,"Romans":16,"1 Corinthians":16,"2 Corinthians":13,
  "Galatians":6,"Ephesians":6,"Philippians":4,"Colossians":4,"1 Thessalonians":5,
  "2 Thessalonians":3,"1 Timothy":6,"2 Timothy":4,"Titus":3,"Philemon":1,"Hebrews":13,
  "James":5,"1 Peter":5,"2 Peter":3,"1 John":5,"2 John":1,"3 John":1,"Jude":1,"Revelation":22
};

const TARGET_DIR = path.join(__dirname, '..', 'backend', 'bible_texts');

function fetch(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}`));
        return;
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });
}

async function importVersion(version) {
  const bible = {};
  let totalChapters = 0;
  let successChapters = 0;

  for (const book of BOOKS) {
    const chapters = CHAPTER_COUNTS[book];
    const bookKey = book.toLowerCase();
    bible[bookKey] = {};

    for (let ch = 1; ch <= chapters; ch++) {
      totalChapters++;
      const url = `https://bible-api.com/${encodeURIComponent(book)}+${ch}?translation=${version}`;
      try {
        const data = await fetch(url);
        if (data.verses) {
          const chapterData = {};
          for (const v of data.verses) {
            chapterData[String(v.verse)] = v.text;
          }
          bible[bookKey][String(ch)] = chapterData;
          successChapters++;
        }
        process.stdout.write(`\r${book} ${ch}/${chapters} — ${Math.round(successChapters/totalChapters*100)}%`);
      } catch (e) {
        // Skip failed chapters
        process.stdout.write(`\r${book} ${ch} FAILED — ${Math.round(successChapters/totalChapters*100)}%`);
      }
      // Rate limit: 200ms between requests
      await new Promise(r => setTimeout(r, 200));
    }
  }

  const outputPath = path.join(TARGET_DIR, `${version.toLowerCase()}.json`);
  fs.writeFileSync(outputPath, JSON.stringify(bible, null, 2));
  console.log(`\n\nSaved ${outputPath} (${successChapters}/${totalChapters} chapters)`);
}

const version = (process.argv[2] || 'ASV').toUpperCase();
console.log(`Importing ${version} from bible-api.com...\n`);
importVersion(version).catch(err => console.error('Import failed:', err.message));

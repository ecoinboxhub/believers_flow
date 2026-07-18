export const CDR_DEVOTIONALS = {
  name: "CDR Devotional",
  pastor: "Christ Dedicated Rock",
  sourceUrl: "https://thedevotionals.com.ng/devotional/cdr/",
  color: "#DC143C",
  devotionals: Array.from({ length: 365 }, (_, i) => ({
    day: i + 1,
    title: "Built on the Rock",
    verse: "Matthew 7:24-25",
    verseText: "Therefore everyone who hears these words of mine and puts them into practice is like a wise man who built his house on the rock. The rain came down, the streams rose, and the winds blew and beat against that house; yet it did not fall, because it had its foundation on the rock.",
    text: "Building your life on Christ, the solid rock, is the only way to stand firm through life's storms. When your foundation is secure, no storm can move you.\n\nThe world offers many foundations for life—money, status, relationships—but only Christ is unshakable. Put your trust in Him and build your life on His Word.\n\nWhen the storms of life come, and they will come, you will not be moved because your foundation is secure in Christ. Stand firm on the Rock of Ages.",
    prayer: "Lord Jesus, You are my rock and my foundation. Help me to build my life on Your Word so that I may stand firm in every storm. In Your name, Amen.",
  }))
}

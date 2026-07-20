export const ODBTD_DEVOTIONALS = {
  name: "Our Daily Bread",
  pastor: "Our Daily Bread Ministries",
  sourceUrl: "https://thedevotionals.com.ng/devotional/odb/",
  color: "#2E86AB",
  devotionals: Array.from({ length: 365 }, (_, i) => ({
    day: i + 1,
    title: "God's Faithfulness",
    verse: "Lamentations 3:22-23",
    verseText: "Because of the Lord's great love we are not consumed, for his compassions never fail. They are new every morning; great is your faithfulness.",
    text: "Every morning is a fresh reminder of God's unwavering faithfulness. His mercies are new each day, inviting us to trust Him completely.\n\nWhen we wake each day, we have the opportunity to experience God's love in fresh ways. The challenges of yesterday do not limit the grace available for today.\n\nGod's faithfulness is not dependent on our performance. It flows from His unchanging character. In a world of constant change, this truth anchors our souls.",
    prayer: "Heavenly Father, thank You for Your mercies that are new every morning. Help me to trust in Your faithfulness today. In Jesus' name, Amen.",
  }))
}

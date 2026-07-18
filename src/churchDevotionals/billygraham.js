export const BILLYGRAHAM_DEVOTIONALS = {
  name: "Billy Graham",
  pastor: "Billy Graham Evangelistic Association",
  sourceUrl: "https://thedevotionals.com.ng/devotional/billy-graham/",
  color: "#556B2F",
  devotionals: Array.from({ length: 365 }, (_, i) => ({
    day: i + 1,
    title: "The Cross of Christ",
    verse: "John 3:16",
    verseText: "For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.",
    text: "The cross stands as the ultimate demonstration of God's love for humanity. At the cross, sin was judged and grace was offered freely to all who would receive it.\n\nThere is no sin too great for God's forgiveness, no life too broken for His restoration. The same power that raised Christ from the dead is available to you today.\n\nDo not carry the weight of guilt and shame any longer. Bring your burdens to the foot of the cross and leave them there. Christ's sacrifice was sufficient for all your sins.",
    prayer: "Lord Jesus, thank You for Your sacrifice on the cross. I receive Your forgiveness and grace today. Help me to live in the freedom You purchased for me. In Your name, Amen.",
  }))
}

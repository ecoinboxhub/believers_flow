export const TREM_DEVOTIONALS = {
  name: "TREM Devotional",
  pastor: "Dr. Mike Irukwu",
  sourceUrl: "https://thedevotionals.com.ng/devotional/trem-devotioal/",
  color: "#8B4513",
  devotionals: Array.from({ length: 365 }, (_, i) => ({
    day: i + 1,
    title: "Walking in God's Purpose",
    verse: "Jeremiah 29:11",
    verseText: "For I know the plans I have for you, declares the Lord, plans to prosper you and not to harm you, plans to give you hope and a future.",
    text: "God has a specific plan and purpose for your life. He knows the end from the beginning, and His plans for you are good. Trust in His guidance and walk in the path He has set before you.\n\nEvery step you take in faith brings you closer to the fulfillment of God's purpose. Do not be discouraged by delays or obstacles. God's timing is perfect, and His plans will come to pass.\n\nStay focused on His Word and remain obedient to His leading. He who began a good work in you will carry it to completion.",
    prayer: "Father, thank You for Your perfect plan for my life. Help me to trust You completely and walk in Your purpose. In Jesus' name, Amen.",
  }))
}

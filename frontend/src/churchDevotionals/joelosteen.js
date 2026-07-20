export const JOELOSTEEN_DEVOTIONALS = {
  name: "Joel Osteen (Lakewood Church)",
  pastor: "Pastor Joel Osteen",
  sourceUrl: "https://joelosteen.com",
  color: "#B8860B",
  devotionals: Array.from({ length: 365 }, (_, i) => ({
    day: i + 1,
    title: "Your Best Days Are Ahead",
    verse: "Jeremiah 29:11",
    verseText: "For I know the plans I have for you, declares the Lord, plans to prosper you and not to harm you, plans to give you hope and a future.",
    text: "God has amazing things in store for your future. You may have faced setbacks, disappointments, or challenges, but that doesn't change what God has planned for you.\n\nYour current circumstances do not determine your destiny. God is working behind the scenes, arranging things for your good. He is opening doors that no man can close.\n\nToday, shake off the weight of past disappointments. God has a purpose for your life that is greater than any obstacle you face. He is not finished with you yet.\n\nKeep your head up, keep your faith strong, and get ready for the blessings God has prepared. Your best days are not behind you; they are ahead of you!",
    prayer: "Father, I thank You that my best days are ahead. I trust Your plans for my life and believe that You are working everything together for my good. In Jesus' name, Amen."
  }))
}

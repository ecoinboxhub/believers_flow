"""
Complete Devotional Generator for BelieversFlow
Generates all 365 unique daily devotionals with varied, theme-specific content.
"""
import os
import random

# 365 unique themes with Bible verses
THEMES = [
    # JANUARY (1-31)
    (1, "New Beginnings", "Lamentations 3:22-23", "Because of the Lord's great love we are not consumed, for his compassions never fail. They are new every morning; great is your faithfulness."),
    (2, "The God Who Sees", "Genesis 16:13", "She gave this name to the Lord who spoke to her: 'You are the God who sees me,' for she said, 'I have now seen the One who sees me.'"),
    (3, "Faith Like a Mustard Seed", "Matthew 17:20", "He replied, 'Because you have so little faith. Truly I tell you, if you have faith as small as a mustard seed, you can say to this mountain, Move from here to there, and it will move. Nothing will be impossible for you.'"),
    (4, "Abiding in the Vine", "John 15:5", "I am the vine; you are the branches. If you remain in me and I in you, you will bear much fruit; apart from me you can do nothing."),
    (5, "Peace That Passes Understanding", "Philippians 4:6-7", "Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God. And the peace of God, which transcends all understanding, will guard your hearts and your minds in Christ Jesus."),
    (6, "Created for Good Works", "Ephesians 2:10", "For we are God's handiwork, created in Christ Jesus to do good works, which God prepared in advance for us to do."),
    (7, "The Shepherd's Care", "Psalm 23:1-3", "The Lord is my shepherd, I lack nothing. He makes me lie down in green pastures, he leads me beside quiet waters, he refreshes my soul."),
    (8, "The Power of Gratitude", "1 Thessalonians 5:16-18", "Rejoice always, pray continually, give thanks in all circumstances; for this is God's will for you in Christ Jesus."),
    (9, "Walking in the Spirit", "Galatians 5:16", "So I say, walk by the Spirit, and you will not gratify the desires of the flesh."),
    (10, "The Armor of God", "Ephesians 6:10-11", "Finally, be strong in the Lord and in his mighty power. Put on the full armor of God, so that you can take your stand against the devil's schemes."),
    (11, "God's Faithfulness", "Psalm 36:5", "Your love, Lord, reaches to the heavens, your faithfulness to the skies."),
    (12, "The Call to Pray", "Jeremiah 33:3", "Call to me and I will answer you and tell you great and unsearchable things you do not know."),
    (13, "Strength in Weakness", "2 Corinthians 12:9", "My grace is sufficient for you, for my power is made perfect in weakness."),
    (14, "The Love of God", "Romans 8:38-39", "For I am convinced that neither death nor life, neither angels nor demons, neither the present nor the future, nor any powers, neither height nor depth, nor anything else in all creation, will be able to separate us from the love of God that is in Christ Jesus our Lord."),
    (15, "Waiting on God", "Isaiah 40:31", "But those who hope in the Lord will renew their strength. They will soar on wings like eagles; they will run and not grow weary, they will walk and not be faint."),
    (16, "The Joy of the Lord", "Nehemiah 8:10", "Do not grieve, for the joy of the Lord is your strength."),
    (17, "God's Perfect Plan", "Jeremiah 29:11", "For I know the plans I have for you, declares the Lord, plans to prosper you and not to harm you, plans to give you hope and a future."),
    (18, "Living by Faith", "2 Corinthians 5:7", "For we live by faith, not by sight."),
    (19, "The Grace of God", "Ephesians 2:8-9", "For it is by grace you have been saved, through faith; and this is not from yourselves, it is the gift of God, not by works, so that no one can boast."),
    (20, "Overcoming Fear", "2 Timothy 1:7", "For God has not given us a spirit of fear, but of power and of love and of a sound mind."),
    (21, "The Power of Unity", "Psalm 133:1", "How good and pleasant it is when God's people live together in unity!"),
    (22, "God's Unfailing Love", "Psalm 136:26", "Give thanks to the God of heaven, for his steadfast love endures forever."),
    (23, "A Renewed Mind", "Romans 12:2", "Do not conform to the pattern of this world, but be transformed by the renewing of your mind."),
    (24, "The Gift of Today", "Psalm 118:24", "The Lord has done it this very day; let us rejoice today and be glad."),
    (25, "God Our Refuge", "Psalm 91:1-2", "Whoever dwells in the shelter of the Most High will rest in the shadow of the Almighty. I will say of the Lord, He is my refuge and my fortress, my God, in whom I trust."),
    (26, "The Power of Prayer", "James 5:16", "The prayer of a righteous person is powerful and effective."),
    (27, "God's Word Is Light", "Psalm 119:105", "Your word is a lamp for my feet, a light on my path."),
    (28, "Bearing Fruit", "John 15:8", "This is to my Father's glory, that you bear much fruit, showing yourselves to be my disciples."),
    (29, "The Heart of Worship", "John 4:24", "God is spirit, and his worshippers must worship in the Spirit and in truth."),
    (30, "God's Comfort", "2 Corinthians 1:3-4", "Praise be to the God and Father of our Lord Jesus Christ, the Father of compassion and the God of all comfort, who comforts us in all our troubles."),
    (31, "The Call to Serve", "Galatians 5:13", "You, my brothers and sisters, were called to be free. But do not use your freedom to indulge the flesh; rather, serve one another humbly in love."),
    # FEBRUARY (32-59)
    (32, "God's Wisdom", "James 1:5", "If any of you lacks wisdom, you should ask God, who gives generously to all without finding fault, and it will be given to you."),
    (33, "Perseverance", "Hebrews 12:1", "Therefore, since we are surrounded by such a great cloud of witnesses, let us throw off everything that hinders and the sin that so easily entangles. And let us run with perseverance the race marked out for us."),
    (34, "The Good Shepherd", "John 10:11", "I am the good shepherd. The good shepherd lays down his life for the sheep."),
    (35, "Forgiveness", "1 John 1:9", "If we confess our sins, he is faithful and just and will forgive us our sins and purify us from all unrighteousness."),
    (36, "God's Presence", "Joshua 1:9", "Be strong and courageous. Do not be afraid; do not be discouraged, for the Lord your God will be with you wherever you go."),
    (37, "The Vine and Branches", "John 15:4", "Remain in me, as I also remain in you. No branch can bear fruit by itself; it must remain in the vine. Neither can you bear fruit unless you remain in me."),
    (38, "God's Mercy", "Psalm 103:8", "The Lord is compassionate and gracious, slow to anger, abounding in love."),
    (39, "The Great Commission", "Matthew 28:19-20", "Therefore go and make disciples of all nations, baptizing them in the name of the Father and of the Son and of the Holy Spirit, and teaching them to obey everything I have commanded you."),
    (40, "Contentment", "Philippians 4:11-12", "I have learned to be content whatever the circumstances. I know what it is to be in need, and I know what it is to have plenty. I have learned the secret of being content in any and every situation."),
    (41, "Strength for Today", "Isaiah 41:10", "So do not fear, for I am with you; do not be dismayed, for I am your God. I will strengthen you and help you; I will uphold you with my righteous right hand."),
    (42, "The Fruit of the Spirit", "Galatians 5:22-23", "But the fruit of the Spirit is love, joy, peace, forbearance, kindness, goodness, faithfulness, gentleness and self-control. Against such things there is no law."),
    (43, "Trusting God's Timing", "Ecclesiastes 3:1", "There is a time for everything, and a season for every activity under the heavens."),
    (44, "The Word of God", "Hebrews 4:12", "For the word of God is alive and active. Sharper than any double-edged sword, it penetrates even to dividing soul and spirit, joints and marrow; it judges the thoughts and attitudes of the heart."),
    (45, "Rest in God", "Matthew 11:28-29", "Come to me, all you who are weary and burdened, and I will give you rest. Take my yoke upon you and learn from me, for I am gentle and humble in heart, and you will find rest for your souls."),
    (46, "Generosity", "2 Corinthians 9:7", "Each of you should give what you have decided in your heart to give, not reluctantly or under compulsion, for God loves a cheerful giver."),
    (47, "Identity in Christ", "2 Corinthians 5:17", "Therefore, if anyone is in Christ, the new creation has come: The old has gone, the new is here!"),
    (48, "Spiritual Warfare", "Ephesians 6:12", "For our struggle is not against flesh and blood, but against the rulers, against the authorities, against the powers of this dark world and against the spiritual forces of evil in the heavenly realms."),
    (49, "The Cross", "Galatians 6:14", "May I never boast except in the cross of our Lord Jesus Christ, through which the world has been crucified to me, and I to the world."),
    (50, "Patience", "James 1:4", "Let perseverance finish its work so that you may be mature and complete, not lacking anything."),
    (51, "Community", "Hebrews 10:24-25", "And let us consider how we may spur one another on toward love and good deeds, not giving up meeting together, as some are in the habit of doing, but encouraging one another."),
    (52, "Stewardship", "1 Peter 4:10", "Each of you should use whatever gift you have received to serve others, as faithful stewards of God's grace in its various forms."),
    (53, "Humility", "Philippians 2:3-4", "Do nothing out of selfish ambition or vain conceit. Rather, in humility value others above yourselves, not looking to your own interests but each of you to the interests of the others."),
    (54, "Healing", "Psalm 147:3", "He heals the brokenhearted and binds up their wounds."),
    (55, "Guidance", "Proverbs 3:5-6", "Trust in the Lord with all your heart and lean not on your own understanding; in all your ways submit to him, and he will make your paths straight."),
    (56, "Victory Over Sin", "Romans 6:14", "For sin shall no longer be your master, because you are not under the law, but under grace."),
    (57, "Divine Provision", "Philippians 4:19", "And my God will meet all your needs according to the riches of his glory in Christ Jesus."),
    (58, "Obedience", "John 14:15", "If you love me, keep my commands."),
    (59, "Hope", "Romans 15:13", "May the God of hope fill you with all joy and peace as you trust in him, so that you may overflow with hope by the power of the Holy Spirit."),
    # MARCH (60-90)
    (60, "The Resurrection", "1 Corinthians 15:3-4", "For what I received I passed on to you as of first importance: that Christ died for our sins according to the Scriptures, that he was buried, that he was raised on the third day according to the Scriptures."),
    (61, "Prayer and Fasting", "Matthew 6:16-18", "When you fast, do not look somber as the hypocrites do, for they disfigure their faces to show others they are fasting. Truly I tell you, they have received their reward in full."),
    (62, "The Holy Spirit", "Acts 1:8", "But you will receive power when the Holy Spirit comes on you; and you will be my witnesses in Jerusalem, and in all Judea and Samaria, and to the ends of the earth."),
    (63, "Suffering and Glory", "Romans 8:17", "Now if we are children, then we are heirs, heirs of God and co-heirs with Christ, if indeed we share in his sufferings in order that we may also share in his glory."),
    (64, "The Church", "Ephesians 5:25", "Christ loved the church and gave himself up for her."),
    (65, "Faithful Stewardship", "Luke 16:10", "Whoever can be trusted with very little can also be trusted with much, and whoever is dishonest with very little will also be dishonest with much."),
    (66, "God's Sovereignty", "Psalm 115:3", "Our God is in heaven; he does whatever pleases him."),
    (67, "Evangelism", "Romans 10:14", "How, then, can they call on the one they have not believed in? And how can they believe in the one of whom they have not heard? And how can they hear without someone preaching to them?"),
    (68, "Sabbath Rest", "Mark 2:27", "Then he said to them, 'The Sabbath was made for man, not man for the Sabbath.'"),
    (69, "The Bible", "2 Timothy 3:16-17", "All Scripture is God-breathed and is useful for teaching, rebuking, correcting and training in righteousness, so that the servant of God may be thoroughly equipped for every good work."),
    (70, "Compassion", "Colossians 3:12", "Therefore, as God's chosen people, holy and dearly loved, clothe yourselves with compassion, kindness, humility, gentleness and patience."),
    (71, "Discipleship", "Luke 9:23", "Then he said to them all: 'Whoever wants to be my disciple must deny themselves and take up their cross daily and follow me.'"),
    (72, "Satan's Tactics", "1 Peter 5:8", "Be alert and of sober mind. Your enemy the devil prowls around like a roaring lion looking for someone to devour."),
    (73, "Spiritual Gifts", "1 Corinthians 12:4-7", "There are different kinds of gifts, but the same Spirit distributes them. There are different kinds of service, but the same Lord. There are different kinds of working, but in all of them and in everyone it is the same God at work. Now to each one the manifestation of the Spirit is given for the common good."),
    (74, "Peace with God", "Romans 5:1", "Therefore, since we have been justified through faith, we have peace with God through our Lord Jesus Christ."),
    (75, "Encouragement", "Hebrews 3:13", "But encourage one another daily, as long as it is called Today, so that none of you may be hardened by sin's deceitfulness."),
    (76, "The Resurrection Power", "Philippians 3:10", "I want to know Christ, yes, to know the power of his resurrection and participation in his sufferings, becoming like him in his death."),
    (77, "Love Your Neighbor", "Leviticus 19:18", "'Do not seek revenge or bear a grudge against anyone among your people, but love your neighbor as yourself. I am the Lord.'"),
    (78, "The Power of Praise", "Psalm 150:6", "Let everything that has breath praise the Lord. Praise the Lord."),
    (79, "Trusting in Trials", "James 1:2-3", "Consider it pure joy, my brothers and sisters, whenever you face trials of many kinds, because you know that the testing of your faith produces perseverance."),
    (80, "The Kingdom of God", "Matthew 6:33", "But seek first his kingdom and his righteousness, and all these things will be given to you as well."),
    (81, "God's Grace Is Sufficient", "2 Corinthians 12:9", "But he said to me, 'My grace is sufficient for you, for my power is made perfect in weakness.' Therefore I will boast all the more gladly about my weaknesses, so that Christ's power may rest on me."),
    (82, "The Power of the Gospel", "Romans 1:16", "For I am not ashamed of the gospel, because it is the power of God that brings salvation to everyone who believes: first to the Jew, then to the Gentile."),
    (83, "Walking by Faith", "2 Corinthians 5:7", "For we live by faith, not by sight."),
    (84, "The Love of the Father", "1 John 3:1", "See what great love the Father has lavished on us, that we should be called children of God! And that is what we are!"),
    (85, "Redemption", "Ephesians 1:7", "In him we have redemption through his blood, the forgiveness of sins, in accordance with the riches of God's grace."),
    (86, "The Power of Testimony", "Revelation 12:11", "They triumphed over him by the blood of the Lamb and by the word of their testimony; they did not love their lives so much as to shrink from death."),
    (87, "God's Faithfulness in Storms", "Psalm 46:1", "God is our refuge and strength, an ever-present help in trouble."),
    (88, "The Ministry of Reconciliation", "2 Corinthians 5:18", "All this is from God, who reconciled us to himself through Christ and gave us the ministry of reconciliation."),
    (89, "The Power of the Word", "Isaiah 55:11", "So is my word that goes out from my mouth: It will not return to me empty, but will accomplish what I desire and achieve the purpose for which I sent it."),
    (90, "Living Water", "John 4:14", "But whoever drinks the water I give them will never thirst. Indeed, the water I give them will become in them a spring of water welling up to eternal life."),
    # APRIL (91-120)
    (91, "The Lamb of God", "John 1:29", "The next day John saw Jesus coming toward him and said, 'Look, the Lamb of God, who takes away the sin of the world!'"),
    (92, "New Covenant", "Hebrews 8:12", "For I will forgive their wickedness and will remember their sins no more."),
    (93, "The Power of Love", "1 Corinthians 13:4-7", "Love is patient, love is kind. It does not envy, it does not boast, it is not proud. It does not dishonor others, it is not self-seeking, it is not easily angered, it keeps no record of wrongs. Love does not delight in evil but rejoices with the truth. It always protects, always trusts, always hopes, always perseveres."),
    (94, "Christ in You", "Colossians 1:27", "To them God has chosen to make known among the Gentiles the glorious riches of this mystery, which is Christ in you, the hope of glory."),
    (95, "The Word Became Flesh", "John 1:14", "The Word became flesh and made his dwelling among us. We have seen his glory, the glory of the one and only Son, who came from the Father, full of grace and truth."),
    (96, "Eternal Life", "John 3:16", "For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life."),
    (97, "Justified by Faith", "Romans 5:1", "Therefore, since we have been justified through faith, we have peace with God through our Lord Jesus Christ."),
    (98, "No Condemnation", "Romans 8:1", "Therefore, there is now no condemnation for those who are in Christ Jesus."),
    (99, "More Than Conquerors", "Romans 8:37", "No, in all these things we are more than conquerors through him who loved us."),
    (100, "The Shepherd Knows His Sheep", "John 10:14", "I am the good shepherd; I know my sheep and my sheep know me."),
    (101, "Abundant Life", "John 10:10", "The thief comes only to steal and kill and destroy; I have come that they may have life, and have it to the full."),
    (102, "The Way, Truth, Life", "John 14:6", "Jesus answered, 'I am the way and the truth and the life. No one comes to the Father except through me.'"),
    (103, "Another Helper", "John 14:16", "And I will ask the Father, and he will give you another advocate to help you and be with you forever, the Spirit of truth."),
    (104, "Abide in My Love", "John 15:9", "As the Father has loved me, so have I loved you. Now remain in my love."),
    (105, "The World's Hatred", "John 15:18", "If the world hates you, keep in mind that it hated me first."),
    (106, "The Spirit of Truth", "John 16:13", "But when he, the Spirit of truth, comes, he will guide you into all the truth."),
    (107, "Peace I Leave With You", "John 14:27", "Peace I leave with you; my peace I give you. I do not give to you as the world gives. Do not let your hearts be troubled and do not be afraid."),
    (108, "The True Vine", "John 15:1", "I am the true vine, and my Father is the gardener."),
    (109, "I Am the Light", "John 8:12", "When Jesus spoke again to the people, he said, 'I am the light of the world. Whoever follows me will never walk in darkness, but will have the light of life.'"),
    (110, "I Am the Bread", "John 6:35", "Then Jesus declared, 'I am the bread of life. Whoever comes to me will never go hungry, and whoever believes in me will never be thirsty.'"),
    (111, "I Am the Door", "John 10:9", "I am the gate; whoever enters through me will be saved. They will come in and go out, and find pasture."),
    (112, "I Am the Resurrection", "John 11:25", "Jesus said to her, 'I am the resurrection and the life. The one who believes in me will live, even though they die.'"),
    (113, "Before Abraham Was", "John 8:58", "Jesus said to them, 'Very truly I tell you, before Abraham was born, I am!"),
    (114, "I Am the Good Shepherd", "John 10:11", "I am the good shepherd. The good shepherd lays down his life for the sheep."),
    (115, "The Hour Has Come", "John 12:23", "Jesus replied, 'The hour has come for the Son of Man to be glorified.'"),
    (116, "The Grain of Wheat", "John 12:24", "Very truly I tell you, unless a grain of wheat falls to the ground and dies, it remains only a single seed. But if it dies, it produces many seeds."),
    (117, "Lifting Up the Son", "John 12:32", "And I, when I am lifted up from the earth, will draw all people to myself."),
    (118, "Walking in the Light", "1 John 1:7", "But if we walk in the light, as he is in the light, we have fellowship with one another, and the blood of Jesus, his Son, purifies us from all sin."),
    (119, "Confidence in Prayer", "1 John 5:14", "This is the confidence we have in approaching God: that if we ask anything according to his will, he hears us."),
    (120, "Greater Is He", "1 John 4:4", "You, dear children, are from God and have overcome them, because the one who is in you is greater than the one who is in the world."),
    # MAY (121-151)
    (121, "Love One Another", "1 John 4:7", "Dear friends, let us love one another, for love comes from God. Everyone who loves has been born of God and knows God."),
    (122, "God Is Love", "1 John 4:8", "Whoever does not love does not know God, because God is love."),
    (123, "Perfected in Love", "1 John 4:18", "There is no fear in love. But perfect love drives out fear, because fear has to do with punishment. The one who fears is not made perfect in love."),
    (124, "We Love Because He First Loved", "1 John 4:19", "We love because he first loved us."),
    (125, "Keep His Commandments", "1 John 5:3", "In fact, this is love for God: to keep his commands. And his commands are not burdensome."),
    (126, "The World Passes Away", "1 John 2:17", "The world and its desires pass away, but whoever does the will of God lives forever."),
    (127, "Anointing from the Holy One", "1 John 2:20", "But you have an anointing from the Holy One, and all of you know the truth."),
    (128, "Do Not Love the World", "1 John 2:15", "Do not love the world or anything in the world. If anyone loves the world, love for the Father is not in them."),
    (129, "Confess and Be Cleansed", "1 John 1:9", "If we confess our sins, he is faithful and just and will forgive us our sins and purify us from all unrighteousness."),
    (130, "The Spirit of Antichrist", "1 John 4:3", "But every spirit that does not acknowledge Jesus is not from God. This is the spirit of the antichrist, which you have heard is coming and even now is already in the world."),
    (131, "Test the Spirits", "1 John 4:1", "Dear friends, do not believe every spirit, but test the spirits to see whether they are from God, because many false prophets have gone out into the world."),
    (132, "The Command Is Eternal", "1 John 2:17", "The world and its desires pass away, but whoever does the will of God lives forever."),
    (133, "Write These Things", "1 John 5:13", "I write these things to you who believe in the name of the Son of God so that you may know that you have eternal life."),
    (134, "The Blood of Jesus", "1 John 1:7", "But if we walk in the light, as he is in the light, we have fellowship with one another, and the blood of Jesus, his Son, purifies us from all sin."),
    (135, "The Witness of God", "1 John 5:9-10", "We accept human testimony, but God's testimony is greater because it is the testimony of God, which he has given about his Son. Whoever believes in the Son of God accepts this testimony."),
    (136, "Eternal Life in the Son", "1 John 5:11", "And this is the testimony: God has given us eternal life, and this life is in his Son."),
    (137, "The Power of His Name", "Philippians 2:9-11", "Therefore God exalted him to the highest place and gave him the name that is above every name, that at the name of Jesus every knee should bow, in heaven and on earth and under the earth, and every tongue acknowledge that Jesus Christ is Lord, to the glory of God the Father."),
    (138, "The Mystery of Godliness", "1 Timothy 3:16", "Beyond all question, the mystery from which true godliness springs is great: He appeared in the flesh, was vindicated by the Spirit, was seen by angels, was preached among the nations, was believed on in the world, was taken up in glory."),
    (139, "Fight the Good Fight", "1 Timothy 6:12", "Fight the good fight of the faith, take hold of the eternal life to which you were called when you made your good confession in the presence of many witnesses."),
    (140, "The Unchanging God", "Hebrews 13:8", "Jesus Christ is the same yesterday and today and forever."),
    (141, "Draw Near to God", "Hebrews 4:16", "Let us then approach God's throne of grace with confidence, so that we may receive mercy and find grace to help us in our time of need."),
    (142, "Run with Endurance", "Hebrews 12:1", "Therefore, since we are surrounded by such a great cloud of witnesses, let us throw off everything that hinders and the sin that so easily entangles. And let us run with perseverance the race marked out for us."),
    (143, "God Disciplines Those He Loves", "Hebrews 12:6", "Because the Lord disciplines the one he loves, and chastens everyone he accepts as his son."),
    (144, "Do Not Grow Weary", "Hebrews 12:3", "Consider him who endured such opposition from sinners, so that you will not grow weary and lose heart."),
    (145, "The City to Come", "Hebrews 13:14", "For here we do not have an enduring city, but we are looking for the city that is to come."),
    (146, "Faith Is the Assurance", "Hebrews 11:1", "Now faith is confidence in what we hope for and assurance about what we do not see."),
    (147, "By Faith Abraham", "Hebrews 11:8", "By faith Abraham, when called to go to a place he would later receive as his inheritance, obeyed and went, even though he did not know where he was going."),
    (148, "The Saints of Old", "Hebrews 12:1", "Therefore, since we are surrounded by such a great cloud of witnesses, let us throw off everything that hinders and the sin that so easily entangles."),
    (149, "The Blood Speaks", "Hebrews 12:24", "to Jesus the mediator of a new covenant, and to the sprinkled blood that speaks a better word than the blood of Abel."),
    (150, "Be Content", "Hebrews 13:5", "Keep your lives free from the love of money and be content with what you have, because God has said, 'Never will I leave you; never will I forsake you.'"),
    (151, "Sacrifice of Praise", "Hebrews 13:15", "Through Jesus, therefore, let us continually offer to God a sacrifice of praise, the fruit of lips that openly profess his name."),
    # JUNE (152-181)
    (152, "The Power of the Cross", "1 Corinthians 1:18", "For the message of the cross is foolishness to those who are perishing, but to us who are being saved it is the power of God."),
    (153, "Christ the Wisdom of God", "1 Corinthians 1:24", "But to those whom God has called, both Jews and Greeks, Christ the power of God and the wisdom of God."),
    (154, "The Foundation", "1 Corinthians 3:11", "For no one can lay any foundation other than the one already laid, which is Jesus Christ."),
    (155, "The Temple of the Holy Spirit", "1 Corinthians 6:19", "Do you not know that your bodies are temples of the Holy Spirit, who is in you, whom you have received from God?"),
    (156, "Do Everything for God's Glory", "1 Corinthians 10:31", "So whether you eat or drink or whatever you do, do it all for the glory of God."),
    (157, "The Body of Christ", "1 Corinthians 12:27", "Now you are the body of Christ, and each one of you is a part of it."),
    (158, "The Greatest Is Love", "1 Corinthians 13:13", "And now these three remain: faith, hope and love. But the greatest of these is love."),
    (159, "Prophecies Will Cease", "1 Corinthians 13:8", "Love never fails. But where there are prophecies, they will cease; where there are tongues, they will be stilled; where there is knowledge, it will pass away."),
    (160, "The Resurrection Body", "1 Corinthians 15:42", "So will it be with the resurrection of the dead. The body that is sown is perishable, it is raised imperishable."),
    (161, "Death Is Swallowed Up", "1 Corinthians 15:54", "When the perishable has been clothed with the imperishable, and the mortal with immortality, then the saying that is written will come true: 'Death has been swallowed up in victory.'"),
    (162, "Be Steadfast", "1 Corinthians 15:58", "Therefore, my dear brothers and sisters, stand firm. Let nothing move you. Always give yourselves fully to the work of the Lord, because you know that your labor in the Lord is not in vain."),
    (163, "Generous Giving", "2 Corinthians 8:7", "But since you excel in everything, in faith, in speech, in knowledge, in complete earnestness and in the love we have kindled in you, see that you also excel in this grace of giving."),
    (164, "God Loves a Cheerful Giver", "2 Corinthians 9:7", "Each of you should give what you have decided in your heart to give, not reluctantly or under compulsion, for God loves a cheerful giver."),
    (165, "Abundant Grace", "2 Corinthians 9:8", "And God is able to bless you abundantly, so that in all things at all times, having all that you need, you will abound in every good work."),
    (166, "Weakness Made Strong", "2 Corinthians 12:9", "But he said to me, 'My grace is sufficient for you, for my power is made perfect in weakness.' Therefore I will boast all the more gladly about my weaknesses, so that Christ's power may rest on me."),
    (167, "A New Creation", "2 Corinthians 5:17", "Therefore, if anyone is in Christ, the new creation has come: The old has gone, the new is here!"),
    (168, "Christ's Love Compels Us", "2 Corinthians 5:14", "For Christ's love compels us, because we are convinced that one died for all, and therefore all died."),
    (169, "The Ministry of Reconciliation", "2 Corinthians 5:18", "All this is from God, who reconciled us to himself through Christ and gave us the ministry of reconciliation."),
    (170, "Light Shines from Darkness", "2 Corinthians 4:6", "For God, who said, 'Let light shine out of darkness,' made his light shine in our hearts to give us the light of the knowledge of God's glory displayed in the face of Christ."),
    (171, "Treasure in Jars of Clay", "2 Corinthians 4:7", "But we have this treasure in jars of clay to show that this all-surpassing power is from God and not from us."),
    (172, "Outer Waste, Inner Renewal", "2 Corinthians 4:16", "Therefore we do not lose heart. Though outwardly we are wasting away, yet inwardly we are being renewed day by day."),
    (173, "Fixed and Eternal", "2 Corinthians 4:18", "So we fix our eyes not on what is seen, but on what is unseen, since what is seen is temporary, but what is unseen is eternal."),
    (174, "Christ's Humility", "Philippians 2:5-8", "In your relationships with one another, have the same mindset as Christ Jesus: Who, being in very nature God, did not consider equality with God something to be used to his own advantage; rather, he made himself nothing by taking the very nature of a servant, being made in human likeness. And being found in appearance as a man, he humbled himself by becoming obedient to death, even death on a cross!"),
    (175, "The Exaltation of Christ", "Philippians 2:9-11", "Therefore God exalted him to the highest place and gave him the name that is above every name, that at the name of Jesus every knee should bow, in heaven and on earth and under the earth, and every tongue acknowledge that Jesus Christ is Lord, to the glory of God the Father."),
    (176, "Pressing On", "Philippians 3:13-14", "Brothers and sisters, I do not consider myself yet to have taken hold of it. But one thing I do: Forgetting what is behind and straining toward what is ahead, I press on toward the goal to win the prize for which God has called me heavenward in Christ Jesus."),
    (177, "The Peace of God", "Philippians 4:7", "And the peace of God, which transcends all understanding, will guard your hearts and your minds in Christ Jesus."),
    (178, "I Can Do All Things", "Philippians 4:13", "I can do all this through him who gives me strength."),
    (179, "God Will Supply", "Philippians 4:19", "And my God will meet all your needs according to the riches of his glory in Christ Jesus."),
    (180, "Think About These Things", "Philippians 4:8", "Finally, brothers and sisters, whatever is true, whatever is noble, whatever is right, whatever is pure, whatever is lovely, whatever is admirable, if anything is excellent or praiseworthy, think about such things."),
    (181, "Rejoice in the Lord", "Philippians 4:4", "Rejoice in the Lord always. I will say it again: Rejoice!"),
    # JULY (182-212)
    (182, "The Fullness of God", "Colossians 1:19", "For God was pleased to have all his fullness dwell in him."),
    (183, "Image of the Invisible God", "Colossians 1:15", "The Son is the image of the invisible God, the firstborn over all creation."),
    (184, "All Things Created Through Him", "Colossians 1:16", "For in him all things were created: things in heaven and on earth, visible and invisible, whether thrones or powers or rulers or authorities; all things have been created through him and for him."),
    (185, "He Is Before All Things", "Colossians 1:17", "He is before all things, and in him all things hold together."),
    (186, "Head of the Body", "Colossians 1:18", "And he is the head of the body, the church; he is the beginning and the firstborn from among the dead, so that in everything he might have the supremacy."),
    (187, "Reconciled Through the Cross", "Colossians 1:20", "and through him to reconcile to himself all things, whether things on earth or things in heaven, by making peace through his blood, shed on the cross."),
    (188, "Hidden Wisdom", "Colossians 2:3", "in whom are hidden all the treasures of wisdom and knowledge."),
    (189, "Firmly Rooted", "Colossians 2:7", "rooted and built up in him, strengthened in the faith as you were taught, and overflowing with thankfulness."),
    (190, "Set Your Minds on Things Above", "Colossians 3:2", "Set your minds on things above, not on earthly things."),
    (191, "Put On the New Self", "Colossians 3:10", "and have put on the new self, which is being renewed in knowledge in the image of its Creator."),
    (192, "Christ Is All", "Colossians 3:11", "Here there is no Gentile or Jew, circumcised or uncircumcised, barbarian, Scythian, slave or free, but Christ is all, and is in all."),
    (193, "Let the Peace of God", "Colossians 3:15", "Let the peace of Christ rule in your hearts, since as members of one body you were called to peace. And be thankful."),
    (194, "The Word of Christ", "Colossians 3:16", "Let the message of Christ dwell among you richly as you teach and admonish one another with all wisdom through psalms, hymns, and songs from the Spirit, singing to God with gratitude in your hearts."),
    (195, "Whatever You Do", "Colossians 3:17", "And whatever you do, whether in word or deed, do it all in the name of the Lord Jesus, giving thanks to God the Father through him."),
    (196, "Devote Yourselves to Prayer", "Colossians 4:2", "Devote yourselves to prayer, being watchful and thankful."),
    (197, "Walk in Wisdom", "Colossians 4:5", "Be wise in the way you act toward outsiders; make the most of every opportunity."),
    (198, "Grace to You", "Colossians 4:6", "Let your conversation be always full of grace, seasoned with salt, so that you may know how to answer everyone."),
    (199, "The Mystery of God", "Colossians 2:2", "My goal is that they may be encouraged in heart and united in love, so that they may have the full riches of complete understanding, in order that they may know the mystery of God, namely, Christ."),
    (200, "Alive with Christ", "Colossians 2:13", "When you were dead in your sins and in the uncircumcision of your flesh, God made you alive with Christ. He forgave us all our sins."),
    (201, "Cancelled the Charge", "Colossians 2:14", "having cancelled the charge of our legal indebtedness, which stood against us and condemned us; he has taken it away, nailing it to the cross."),
    (202, "Disarming the Powers", "Colossians 2:15", "And having disarmed the powers and authorities, he made a public spectacle of them, triumphing over them by the cross."),
    (203, "The Hope of Glory", "Colossians 1:27", "To them God has chosen to make known among the Gentiles the glorious riches of this mystery, which is Christ in you, the hope of glory."),
    (204, "Laboring for Christ", "Colossians 1:29", "To this end I strenuously contend with all the energy Christ so powerfully works in me."),
    (205, "Stand Firm in Faith", "Colossians 2:5", "For though I am absent from you in body, I am present with you in spirit and delight to see how disciplined you are and how firm your faith in Christ is."),
    (206, "Rooted and Built Up", "Colossians 2:7", "rooted and built up in him, strengthened in the faith as you were taught, and overflowing with thankfulness."),
    (207, "Do Not Be Taken Captive", "Colossians 2:8", "See to it that no one takes you captive through hollow and deceptive philosophy, which depends on human tradition and the elemental spiritual forces of this world rather than on Christ."),
    (208, "The Fullness of Deity", "Colossians 2:9", "For in Christ all the fullness of the Deity lives in bodily form."),
    (209, "Complete in Christ", "Colossians 2:10", "and in Christ you have been brought to fullness. He is the head over every power and authority."),
    (210, "Put Off the Old Self", "Colossians 3:9", "Do not lie to each other, since you have taken off the old self with its practices."),
    (211, "Bear with One Another", "Colossians 3:13", "Bear with each other and forgive one another if any of you has a grievance against someone. Forgive as the Lord forgave you."),
    (212, "Love Binds Everything Together", "Colossians 3:14", "And over all these virtues put on love, which binds them all together in perfect unity."),
    # AUGUST (213-243)
    (213, "The Thessalonian Faith", "1 Thessalonians 1:3", "We remember before our God and Father your work produced by faith, your labor prompted by love, and your endurance inspired by hope in our Lord Jesus Christ."),
    (214, "Faith, Hope, and Love", "1 Thessalonians 1:3", "We remember before our God and Father your work produced by faith, your labor prompted by love, and your endurance inspired by hope in our Lord Jesus Christ."),
    (215, "A Model to All Believers", "1 Thessalonians 1:7", "And so you became a model to all the believers in Macedonia and Achaia."),
    (216, "The Word of the Lord", "1 Thessalonians 2:13", "And we also thank God continually because, when you received the word of God, which you heard from us, you accepted it not as a human word, but as it actually is, the word of God, which is indeed at work in you who believe."),
    (217, "Pleasing God", "1 Thessalonians 4:1", "As for other matters, brothers and sisters, we instructed you how to live in order to please God, as in fact you are living. Now we ask you and urge you in the Lord Jesus to do this more and more."),
    (218, "Sanctified Throughout", "1 Thessalonians 4:3", "It is God's will that you should be sanctified: that you should avoid sexual immorality."),
    (219, "Control Your Body", "1 Thessalonians 4:4-5", "that each of you should learn to control your own body in a way that is holy and honorable, not in passionate lust like the pagans, who do not know God."),
    (220, "Brotherly Love", "1 Thessalonians 4:9", "Now about your love for one another we do not need to write to you, for you yourselves have been taught by God to love each other."),
    (221, "Live in Peace", "1 Thessalonians 5:13", "Live in peace with each other."),
    (222, "Encourage the Disheartened", "1 Thessalonians 5:14", "And we urge you, brothers and sisters, warn those who are idle and disruptive, encourage the disheartened, help the weak, be patient with everyone."),
    (223, "Pray Without Ceasing", "1 Thessalonians 5:17", "Pray continually."),
    (224, "Give Thanks in All Circumstances", "1 Thessalonians 5:18", "give thanks in all circumstances; for this is God's will for you in Christ Jesus."),
    (225, "Do Not Quench the Spirit", "1 Thessalonians 5:19", "Do not quench the Spirit."),
    (226, "Test Everything", "1 Thessalonians 5:21", "but test them all; hold on to what is good."),
    (227, "Avoid Every Kind of Evil", "1 Thessalonians 5:22", "Avoid every kind of evil."),
    (228, "The Coming of the Lord", "1 Thessalonians 4:16-17", "For the Lord himself will come down from heaven, with a loud command, with the voice of the archangel and with the trumpet call of God, and the dead in Christ will rise first. After that, we who are still alive and are left will be caught up together with them in the clouds to meet the Lord in the air."),
    (229, "Be Prepared", "1 Thessalonians 5:6", "So let us not be like others, who are asleep, but let us be awake and sober."),
    (230, "Put On Faith and Love", "1 Thessalonians 5:8", "But since we belong to the day, let us be sober, putting on faith and love as a breastplate, and the hope of salvation as a helmet."),
    (231, "God Chose You", "2 Thessalonians 2:13", "But we ought always to thank God for you, brothers and sisters loved by the Lord, because God chose you as firstfruits to be saved through the sanctifying work of the Spirit and through belief in the truth."),
    (232, "Stand Firm", "2 Thessalonians 2:15", "So then, brothers and sisters, stand firm and hold fast to the teachings we passed on to you, whether by word of mouth or by letter."),
    (233, "The Lord Is Faithful", "2 Thessalonians 3:3", "But the Lord is faithful, and he will strengthen you and protect you from the evil one."),
    (234, "Do Not Grow Weary", "2 Thessalonians 3:13", "As for you, brothers and sisters, do not grow weary in doing good."),
    (235, "The Armor of Light", "Romans 13:12", "The night is nearly over; the day is almost here. So let us put aside the deeds of darkness and put on the armor of light."),
    (236, "Clothe Yourselves with Christ", "Romans 13:14", "Rather, clothe yourselves with the Lord Jesus Christ, and do not think about how to gratify the desires of the flesh."),
    (237, "Accept One Another", "Romans 15:7", "Accept one another, then, just as Christ accepted you, in order to bring praise to God."),
    (238, "The God of Endurance", "Romans 15:5", "May the God who gives endurance and encouragement give you the same attitude of mind toward each other that Christ Jesus had."),
    (239, "Living Sacrifice", "Romans 12:1", "Therefore, I urge you, brothers and sisters, in view of God's mercy, to offer your bodies as a living sacrifice, holy and pleasing to God; this is your true and proper worship."),
    (240, "Humble Service", "Romans 12:3", "For by the grace given me I say to every one of you: Do not think of yourself more highly than you ought, but rather think of yourself with sober judgment, in accordance with the faith God has distributed to each of you."),
    (241, "Use Your Gifts", "Romans 12:4-5", "For just as each of us has one body with many members, and these members do not all have the same function, so in Christ we, though many, form one body, and each member belongs to all the others."),
    (242, "Sincere Love", "Romans 12:9", "Love must be sincere. Hate what is evil; cling to what is good."),
    (243, "Overcome Evil with Good", "Romans 12:21", "Do not be overcome by evil, but overcome evil with good."),
    # SEPTEMBER (244-273)
    (244, "The Call of God", "Romans 8:28-30", "And we know that in all things God works for the good of those who love him, who have been called according to his purpose. For those God foreknew he also predestined to be conformed to the image of his Son."),
    (245, "God's Purpose", "Romans 8:29", "For those God foreknew he also predestined to be conformed to the image of his Son, that he might be the firstborn among many brothers and sisters."),
    (246, "God Is for Us", "Romans 8:31", "What, then, shall we say in response to these things? If God is for us, who can be against us?"),
    (247, "God's Love in Christ", "Romans 8:35", "Who shall separate us from the love of Christ? Shall trouble or hardship or persecution or famine or nakedness or danger or sword?"),
    (248, "Super conquerors", "Romans 8:37", "No, in all these things we are more than conquerors through him who loved us."),
    (249, "Nothing Can Separate Us", "Romans 8:38-39", "For I am convinced that neither death nor life, neither angels nor demons, neither the present nor the future, nor any powers, neither height nor depth, nor anything else in all creation, will be able to separate us from the love of God that is in Christ Jesus our Lord."),
    (250, "God's gifts and calling", "Romans 11:29", "for God's gifts and his call are irrevocable."),
    (251, "Do not be conformed", "Romans 12:2", "Do not conform to the pattern of this world, but be transformed by the renewing of your mind."),
    (252, "Use your gift", "Romans 12:6", "We have different gifts, according to the grace given to each of us."),
    (253, "Zealous in Spirit", "Romans 12:11", "Never be lacking in zeal, but keep your spiritual fervor, serving the Lord."),
    (254, "Joyful in hope", "Romans 12:12", "Be joyful in hope, patient in affliction, faithful in prayer."),
    (255, "Share with the Lord's people", "Romans 12:13", "Share with the Lord's people who are in need. Practice hospitality."),
    (256, "Bless those who persecute you", "Romans 12:14", "Bless those who persecute you; bless and do not curse."),
    (257, "Live in harmony", "Romans 12:16", "Live in harmony with one another. Do not be proud, but be willing to associate with people of low position."),
    (258, "Do not repay evil with evil", "Romans 12:17", "Do not repay anyone evil for evil. Be careful to do what is right in the eyes of everyone."),
    (259, "If it is possible", "Romans 12:18", "If it is possible, as far as it depends on you, live at peace with everyone."),
    (260, "Do not take revenge", "Romans 12:19", "Do not take revenge, my dear friends, but leave room for God's wrath, for it is written: 'It is mine to avenge; I will repay,' says the Lord."),
    (261, "Feed your enemy", "Romans 12:20", "On the contrary: 'If your enemy is hungry, feed him; if he is thirsty, give him something to drink.'"),
    (262, "Subject to governing authorities", "Romans 13:1", "Let everyone be subject to the governing authorities, for there is no authority except that which God has established."),
    (263, "Love fulfills the law", "Romans 13:10", "Love does no harm to a neighbor. Therefore love is the fulfillment of the law."),
    (264, "The day is near", "Romans 13:12", "The night is nearly over; the day is almost here."),
    (265, "Put on the Lord Jesus Christ", "Romans 13:14", "Rather, clothe yourselves with the Lord Jesus Christ."),
    (266, "Welcome the weak", "Romans 14:1", "Accept the one whose faith is weak, without quarreling over disputable matters."),
    (267, "We do not live to ourselves", "Romans 14:7", "For none of us lives to ourselves alone and none of us dies to ourselves alone."),
    (268, "We will all stand before God's judgment seat", "Romans 14:10", "You, then, why do you judge your brother or sister? Or why do you treat them with contempt? For we will all stand before God's judgment seat."),
    (269, "It is written", "Romans 14:11", "'As surely as I live,' says the Lord, 'every knee will bow before me; every tongue will acknowledge God.'"),
    (270, "Each of us will give an account", "Romans 14:12", "So then, each of us will give an account of ourselves to God."),
    (271, "Pursue what leads to peace", "Romans 14:19", "Let us therefore make every effort to do what leads to peace and to mutual edification."),
    (272, "The kingdom of God", "Romans 14:17", "For the kingdom of God is not a matter of eating and drinking, but of righteousness, peace and joy in the Holy Spirit."),
    (273, "Build up your neighbor", "Romans 14:19", "Let us therefore make every effort to do what leads to peace and to mutual edification."),
    # OCTOBER (274-304)
    (274, "The Riches of God's Grace", "Ephesians 1:7", "In him we have redemption through his blood, the forgiveness of sins, in accordance with the riches of God's grace."),
    (275, "Sealed with the Spirit", "Ephesians 1:13", "When you believed, you were marked in him with a seal, the promised Holy Spirit."),
    (276, "Alive in Christ", "Ephesians 2:4-5", "But because of his great love for us, God, who is rich in mercy, made us alive with Christ even when we were dead in transgressions; it is by grace you have been saved."),
    (277, "Created to Do Good Works", "Ephesians 2:10", "For we are God's handiwork, created in Christ Jesus to do good works, which God prepared in advance for us to do."),
    (278, "Brought Near", "Ephesians 2:13", "But now in Christ Jesus you who once were far away have been brought near by the blood of Christ."),
    (279, "One New Humanity", "Ephesians 2:15", "His purpose was to create in himself one new humanity out of the two, thus making peace."),
    (280, "Built Together", "Ephesians 2:22", "And in him you too are being built together to become a dwelling in which God lives by his Spirit."),
    (281, "Boundless Love", "Ephesians 3:18-19", "may have power, together with all the Lord's holy people, to grasp how wide and long and high and deep is the love of Christ, and to know this love that surpasses knowledge."),
    (282, "More Than We Can Imagine", "Ephesians 3:20", "Now to him who is able to do immeasurably more than all we ask or imagine, according to his power that is at work within us."),
    (283, "Unity of the Spirit", "Ephesians 4:3", "Make every effort to keep the unity of the Spirit through the bond of peace."),
    (284, "One Lord, One Faith", "Ephesians 4:5", "one Lord, one faith, one baptism."),
    (285, "Speak the Truth in Love", "Ephesians 4:15", "Instead, speaking the truth in love, we will grow to become in every respect the mature body of him who is the head, that is, Christ."),
    (286, "Put Off the Old Self", "Ephesians 4:22", "You were taught, with regard to your former way of life, to put off your old self, which is being corrupted by its deceitful desires."),
    (287, "Put On the New Self", "Ephesians 4:24", "and to put on the new self, created to be like God in true righteousness and holiness."),
    (288, "Do Not Grieve the Spirit", "Ephesians 4:30", "And do not grieve the Holy Spirit of God, with whom you were sealed for the day of redemption."),
    (289, "Be Kind and Compassionate", "Ephesians 4:32", "Be kind and compassionate to one another, forgiving each other, just as in Christ God forgave you."),
    (290, "Follow God's Example", "Ephesians 5:1", "Follow God's example, therefore, as dearly loved children."),
    (291, "Walk in the Way of Love", "Ephesians 5:2", "and walk in the way of love, just as Christ loved us and gave himself up for us as a fragrant offering and sacrifice to God."),
    (293, "Live as Children of Light", "Ephesians 5:8", "For you were once darkness, but now you are light in the Lord. Live as children of light."),
    (294, "Be Very Careful", "Ephesians 5:15", "Be very careful, then, how you live, not as unwise but as wise."),
    (295, "Make the Most of Every Opportunity", "Ephesians 5:16", "making the most of every opportunity, because the days are evil."),
    (296, "Be Filled with the Spirit", "Ephesians 5:18", "Do not get drunk on wine, which leads to debauchery. Instead, be filled with the Spirit."),
    (297, "Submit to One Another", "Ephesians 5:21", "Submit to one another out of reverence for Christ."),
    (298, "Children, Obey Your Parents", "Ephesians 6:1", "Children, obey your parents in the Lord, for this is right."),
    (299, "Honor Your Father and Mother", "Ephesians 6:2-3", "'Honor your father and mother' which is the first commandment with a promise, 'so that it may go well with you and that you may enjoy long life on the earth.'"),
    (300, "Fathers, Do Not Provoke", "Ephesians 6:4", "Fathers, do not provoke your children to anger, but bring them up in the training and instruction of the Lord."),
    (301, "Slaves, Obey Your Masters", "Ephesians 6:5", "Slaves, obey your earthly masters with respect and fear, and with sincerity of heart, just as you would obey Christ."),
    (302, "Serve Wholeheartedly", "Ephesians 6:7", "Serve wholeheartedly, as if you were serving the Lord, not people."),
    (303, "The Armor of God", "Ephesians 6:10-11", "Finally, be strong in the Lord and in his mighty power. Put on the full armor of God, so that you can take your stand against the devil's schemes."),
    (304, "Stand Your Ground", "Ephesians 6:13", "Therefore put on the full armor of God, so that when the day of evil comes, you may be able to stand your ground, and after you have done everything, to stand."),
    # NOVEMBER (305-334)
    (305, "The Prize", "Philippians 3:14", "I press on toward the goal to win the prize for which God has called me heavenward in Christ Jesus."),
    (306, "Forgetting the Past", "Philippians 3:13", "Brothers and sisters, I do not consider myself yet to have taken hold of it. But one thing I do: Forgetting what is behind and straining toward what is ahead."),
    (307, "The Mind of Christ", "Philippians 2:5", "In your relationships with one another, have the same mindset as Christ Jesus."),
    (308, "Humble Ourselves", "James 4:10", "Humble yourselves before the Lord, and he will lift you up."),
    (309, "Draw Near to God", "James 4:8", "Come near to God and he will come near to you."),
    (310, "Resist the Devil", "James 4:7", "Submit yourselves, then, to God. Resist the devil, and he will flee from you."),
    (311, "Ask God for Wisdom", "James 1:5", "If any of you lacks wisdom, you should ask God, who gives generously to all without finding fault, and it will be given to you."),
    (312, "Do Not Be Deceived", "James 1:16", "Don't be deceived, my dear brothers and sisters."),
    (313, "Be Quick to Listen", "James 1:19", "My dear brothers and sisters, take note of this: Everyone should be quick to listen, slow to speak and slow to become angry."),
    (314, "Do What the Word Says", "James 1:22", "Do not merely listen to the word, and so deceive yourselves. Do what it says."),
    (315, "Religion That God Accepts", "James 1:27", "Religion that God our Father accepts as pure and faultless is this: to look after orphans and widows in their distress and to keep oneself from being polluted by the world."),
    (316, "Faith and Works", "James 2:17", "In the same way, faith by itself, if it is not accompanied by action, is dead."),
    (317, "Show No Favoritism", "James 2:1", "My brothers and sisters, believers in our glorious Lord Jesus Christ must not show favoritism."),
    (318, "The Tongue", "James 3:5", "Likewise, the tongue is a small part of the body, but it makes great boasts."),
    (319, "The Wisdom from Above", "James 3:17", "But the wisdom that comes from heaven is first of all pure; then peace-loving, considerate, submissive, full of mercy and good fruit, impartial and sincere."),
    (320, "Where There Is Envy", "James 3:16", "For where you have envy and selfish ambition, there you find disorder and every evil practice."),
    (321, "Submit to God", "James 4:7", "Submit yourselves, then, to God. Resist the devil, and he will flee from you."),
    (322, "Do Not Boast About Tomorrow", "James 4:13", "Now listen, you who say, 'Today or tomorrow we will go to this or that city, spend a year there, carry on business and make money.'"),
    (323, "If It Is the Lord's Will", "James 4:15", "Instead, you ought to say, 'If it is the Lord's will, we will live and do this or that.'"),
    (324, "Be Patient", "James 5:7", "Be patient, then, brothers and sisters, until the Lord's coming."),
    (325, "The Prayer of Faith", "James 5:15", "And the prayer offered in faith will make the sick person well; the Lord will raise them up."),
    (326, "Confess Your Sins", "James 5:16", "Therefore confess your sins to each other and pray for each other so that you may be healed."),
    (327, "The Effective Prayer", "James 5:16", "The prayer of a righteous person is powerful and effective."),
    (328, "Elijah Was a Human Being", "James 5:17", "Elijah was a human being, even as we are. He prayed earnestly that it would not rain, and it did not rain on the land for three and a half years."),
    (329, "The Return of the Lord", "James 5:8", "You too, be patient and stand firm, because the Lord's coming is near."),
    (330, "Do Not Grumble", "James 5:9", "Don't grumble against one another, brothers and sisters, or you will be judged."),
    (331, "The Lord Is Full of Compassion", "James 5:11", "The Lord is full of compassion and mercy."),
    (332, "Let Your Yes Be Yes", "James 5:12", "Above all, my brothers and sisters, do not swear, not by heaven or by earth or by anything else. All you need to say is a simple 'Yes' or 'No'."),
    (333, "Is Anyone Among You Sick?", "James 5:14", "Is anyone among you sick? Let them call the elders of the church to pray over them and anoint them with oil in the name of the Lord."),
    (334, "The Prayer of Righteousness", "James 5:16", "Therefore confess your sins to each other and pray for each other so that you may be healed."),
    # DECEMBER (335-365)
    (335, "The Word Became Flesh", "John 1:14", "The Word became flesh and made his dwelling among us. We have seen his glory, the glory of the one and only Son, who came from the Father, full of grace and truth."),
    (336, "He Was in the World", "John 1:10", "He was in the world, and though the world was made through him, the world did not recognize him."),
    (337, "He Came to That Which Was His Own", "John 1:11", "He came to that which was his own, but his own did not receive him."),
    (338, "To All Who Did Receive Him", "John 1:12", "Yet to all who did receive him, to those who believed in his name, he gave the right to become children of God."),
    (339, "Born of God", "John 1:13", "children born not of natural descent, nor of human decision or a husband's will, but born of God."),
    (340, "The True Light", "John 1:9", "The true light that gives light to everyone was coming into the world."),
    (341, "The Word Was with God", "John 1:1", "In the beginning was the Word, and the Word was with God, and the Word was God."),
    (342, "Through Him All Things Were Made", "John 1:3", "Through him all things were made; without him nothing was made that has been made."),
    (344, "In Him Was Life", "John 1:4", "In him was life, and that life was the light of all mankind."),
    (345, "The Light Shines in the Darkness", "John 1:5", "The light shines in the darkness, and the darkness has not overcome it."),
    (346, "John the Baptist's Testimony", "John 1:15", "John testified concerning him. He cried out, saying, 'This is the one I spoke about when I said, He who comes after me has surpassed me because he was before me.'"),
    (347, "From His Fullness", "John 1:16", "Out of his fullness we have all received grace in place of grace already given."),
    (348, "The Law Was Given Through Moses", "John 1:17", "For the law was given through Moses; grace and truth came through Jesus Christ."),
    (349, "No One Has Ever Seen God", "John 1:18", "No one has ever seen God, but the one and only Son, who is himself God and is in closest relationship with the Father, has made him known."),
    (350, "The Lamb of God", "John 1:29", "The next day John saw Jesus coming toward him and said, 'Look, the Lamb of God, who takes away the sin of the world!'"),
    (351, "The Calling of the First Disciples", "John 1:39", "'Come and see,' he said. It was about four in the afternoon."),
    (352, "We Have Found the Messiah", "John 1:41", "The first thing Andrew did was to find his brother Simon and tell him, 'We have found the Messiah' (that is, the Christ)."),
    (353, "Rabbi", "John 1:49", "Then Nathanael declared, 'Rabbi, you are the Son of God; you are the king of Israel.'"),
    (354, "The Wedding at Cana", "John 2:1", "On the third day a wedding took place at Cana in Galilee. Jesus' mother was there."),
    (355, "Do Whatever He Tells You", "John 2:5", "His mother said to the servants, 'Do whatever he tells you.'"),
    (356, "The First of His Signs", "John 2:11", "What Jesus did here in Cana of Galilee was the first of the signs through which he revealed his glory; and his disciples believed in him."),
    (357, "Cleanse the Temple", "John 2:15", "Making a whip of cords, he drove all from the temple courts, both sheep and cattle; he scattered the coins of the money changers and overturned their tables."),
    (358, "Destroy This Temple", "John 2:19", "Jesus answered them, 'Destroy this temple, and I will raise it again in three days.'"),
    (359, "He Was Speaking of His Body", "John 2:21", "But the temple he had spoken of was his body."),
    (360, "Many Believed", "John 2:23", "Now while he was in Jerusalem at the Passover Festival, many people saw the signs he was performing and believed in his name."),
    (361, "For God So Loved the World", "John 3:16", "For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life."),
    (362, "God Did Not Send His Son", "John 3:17", "For God did not send his Son into the world to condemn the world, but to save the world through him."),
    (363, "Light Has Come", "John 3:19", "This is the verdict: Light has come into the world, but people loved darkness instead of light because their deeds were evil."),
    (364, "Whoever Lives by the Truth", "John 3:21", "But whoever lives by the truth comes into the light, so that it may be seen plainly that what they have done has been done in the sight of God."),
    (365, "He Must Increase", "John 3:30", "He must become greater; I must become less."),
]

# Hand-written reflections for days 1-10 (rich, unique content)
REFLECTIONS = {
    1: "Every new day is a gift from God, a fresh start filled with His mercy and grace. No matter what happened yesterday, today offers a clean slate. God's compassion doesn't run out, even when we feel we've exhausted our chances.\n\nHow often do we carry yesterday's failures into today? God doesn't. He wakes up each morning with fresh love for you. The question is not whether He will extend mercy, but whether you will receive it.\n\nLet this truth free you from the weight of regret. Embrace today as the new beginning God has designed it to be, and walk forward in the confidence of His unfailing love.",
    2: "Hagar was alone in the desert, rejected and hopeless. Yet in her lowest moment, she discovered something profound: God saw her. Not just her circumstances, but her heart, her pain, her fear. She mattered to Him.\n\nYou may feel invisible today, lost in the crowd or forgotten by those who matter to you. But the God who saw Hagar in the wilderness sees you right now. Your struggles are not hidden from Him, and your tears are not wasted.\n\nTake comfort in the beautiful truth that you serve El Roi, the God who sees. You are known, you are loved, and you are never out of His sight.",
    3: "Jesus didn't say we need enormous faith to see great things. He said faith the size of a tiny mustard seed is enough. That's incredibly encouraging because it takes the pressure off. The power isn't in the size of your faith but in the God your faith is placed in.\n\nYou might feel your faith is small today, battered by doubt and circumstances. That's okay. Bring what little faith you have to Jesus and watch what He does with it. He specializes in taking our small offerings and multiplying them beyond imagination.\n\nDon't wait until your faith feels strong enough. Start with what you have, no matter how small, and trust the God who can move mountains with a whisper.",
    4: "A branch disconnected from the vine cannot produce fruit; it simply withers and dies. Yet how often do we try to live the Christian life independently, striving in our own strength? Jesus invites us to something better, a life of connection and dependence on Him.\n\nAbiding isn't about doing more; it's about being with. It's the quiet surrender of your schedule, your worries, and your ambitions to the One who gives life. When you stay connected to Christ, fruitfulness happens naturally, not by effort but by overflow.\n\nToday, resist the urge to strive. Simply rest in Jesus, draw life from Him, and let His Spirit produce through you what you could never produce on your own.",
    5: "Anxiety has a way of gripping our hearts and refusing to let go. Paul's instruction isn't to simply stop being anxious, which feels impossible. Instead, he gives us something active to do: pray. Take every worry, every fear, every burden to God in prayer.\n\nThe result is not necessarily the removal of the problem but something even more remarkable. God promises peace that doesn't make sense, a calm that stands guard over your heart and mind even when circumstances haven't changed. This peace is supernatural.\n\nWhat are you anxious about today? Don't carry it another moment. Lay it before God with thanksgiving, and let His incomprehensible peace settle over your soul.",
    6: "You are not an accident or a random collection of cells. You are God's handiwork, His masterpiece, created with intention and purpose. Before you were born, God prepared good works for you to walk in.\n\nThis truth changes everything. Your life has meaning beyond your job, your relationships, or your accomplishments. You were created for a purpose that extends into eternity. Every skill, every opportunity, every relationship is part of God's design for your good works.\n\nToday, live as the masterpiece you are. Walk in the good works God has prepared for you. Your life is not random; it is a divine assignment waiting to be fulfilled.",
    7: "David's famous psalm paints a picture of complete dependence and trust. The Lord is my shepherd, he says. Not a stranger, not a hired hand, but my shepherd. One who knows me, cares for me, and provides for me.\n\nSheep are helpless animals. They cannot find water or food on their own. They need a shepherd to guide, protect, and provide. We are no different. Without the Good Shepherd, we wander aimlessly through life, vulnerable to every danger.\n\nToday, acknowledge the Lord as your Shepherd. Trust Him to lead you to green pastures and quiet waters. Let Him refresh your soul and guide you in paths of righteousness for His name's sake.",
    8: "Paul gives three instructions that seem impossible: rejoice always, pray continually, give thanks in all circumstances. Not for some circumstances or happy circumstances, but all circumstances. This is God's will for us.\n\nGratitude is not about pretending everything is perfect. It's about recognizing that God is with you in every situation. Even in difficulty, there is something to be thankful for. Gratitude shifts your focus from what you lack to what you have.\n\nToday, practice gratitude. Find something to thank God for in every circumstance. Let thankfulness become your default response, and watch how it transforms your perspective.",
    9: "The Christian life is not a matter of willpower but of walking in the Spirit. Paul contrasts the flesh and the Spirit, showing that the solution to sin is not trying harder but depending more on the Holy Spirit.\n\nWalking in the Spirit means moment-by-moment dependence on God's presence within you. It means checking in with the Spirit before you speak, before you decide, before you act. It's a rhythm of listening and obeying.\n\nToday, practice walking in the Spirit. Before each decision, pause and ask the Spirit for guidance. You will find that the fruit of the Spirit naturally replaces the works of the flesh when you walk in step with Him.",
    10: "Paul describes the Christian life as a battle, not against people but against spiritual forces. He urges us to be strong not in ourselves but in the Lord and His mighty power. The armor of God is our protection.\n\nEach piece of armor has significance: the belt of truth, the breastplate of righteousness, the shoes of peace, the shield of faith, the helmet of salvation, and the sword of the Spirit. These are not metaphorical suggestions but essential equipment for spiritual warfare.\n\nToday, put on the full armor of God. You are not fighting in your own strength but in the Lord's mighty power. Stand firm, knowing that the victory has already been won through Christ.",
}

# Hand-written prayers for days 1-10
PRAYERS = {
    1: "Lord, thank You for new mercies each morning. Help me embrace this day with gratitude and walk in Your faithfulness. Amen.",
    2: "God who sees me, thank You that I am never hidden from Your sight. Help me rest in the security of Your loving gaze. Amen.",
    3: "Lord, I bring my small faith to You. Please multiply it and help me trust You even when I cannot see the way. Amen.",
    4: "Jesus, help me to abide in You today. I surrender my striving and choose to rest in Your sufficiency. Amen.",
    5: "Father, I give You my anxieties and receive Your peace. Guard my heart and mind in Christ Jesus today. Amen.",
    6: "Lord, thank You that I am Your handiwork. Help me walk in the good works You have prepared for me. Amen.",
    7: "Good Shepherd, thank You for leading me. Help me trust Your guidance and rest in Your provision. Amen.",
    8: "Lord, I thank You in all circumstances. Help me develop a heart of continuous gratitude. Amen.",
    9: "Holy Spirit, help me walk in step with You today. Guide my thoughts, words, and actions. Amen.",
    10: "Lord, I put on Your armor today. Help me stand firm against the enemy's schemes and fight in Your strength. Amen.",
}


def categorize_theme(title):
    """Categorize a theme into a spiritual category for template selection."""
    title_lower = title.lower()

    # Faith/Trust themes
    if any(w in title_lower for w in ["faith", "trust", "believe", "assurance", "confidence"]):
        return "faith"
    # Love themes
    if any(w in title_lower for w in ["love", "beloved", "compassion", "kindness"]):
        return "love"
    # Prayer themes
    if any(w in title_lower for w in ["pray", "prayer", "call to", "draw near", "intercession"]):
        return "prayer"
    # Strength themes
    if any(w in title_lower for w in ["strength", "power", "mighty", "endure", "persever", "patience", "steady"]):
        return "strength"
    # Hope themes
    if any(w in title_lower for w in ["hope", "waiting", "expect", "future", "coming"]):
        return "hope"
    # Obedience themes
    if any(w in title_lower for w in ["obey", "command", "submit", "follow", "do what", "walk in"]):
        return "obedience"
    # Peace themes
    if any(w in title_lower for w in ["peace", "rest", "calm", "still", "quiet"]):
        return "peace"
    # Joy themes
    if any(w in title_lower for w in ["joy", "rejoice", "glad", "delight", "celebrate"]):
        return "joy"
    # Forgiveness themes
    if any(w in title_lower for w in ["forgive", "confess", "cleanse", "pard", "mercy"]):
        return "forgiveness"
    # Service themes
    if any(w in title_lower for w in ["serv", "minister", "give", "generous", "steward", "humble"]):
        return "service"
    # Warfare themes
    if any(w in title_lower for w in ["armor", "warfare", "battle", "fight", "resist", "enemy", "devil", "satan"]):
        return "warfare"
    # Word themes
    if any(w in title_lower for w in ["word", "bible", "scripture", "truth", "light"]):
        return "word"
    # Identity themes
    if any(w in title_lower for w in ["identity", "created", "new self", "new creation", "child", "chosen"]):
        return "identity"
    # Community themes
    if any(w in title_lower for w in ["community", "church", "unity", "one another", "together", "fellowship"]):
        return "community"
    # Grace themes
    if any(w in title_lower for w in ["grace", "gift", "free", "unmerited"]):
        return "grace"
    # Salvation themes
    if any(w in title_lower for w in ["salvation", "redeem", "justified", "cross", "resurrect", "eternal life", "lamb"]):
        return "salvation"
    # Holiness themes
    if any(w in title_lower for w in ["holy", "sanctif", "pure", "righteous", "set apart"]):
        return "holiness"
    # Provision themes
    if any(w in title_lower for w in ["provision", "supply", "provide", "supply", "needs"]):
        return "provision"
    # Wisdom themes
    if any(w in title_lower for w in ["wisdom", "wise", "understand", "knowledge"]):
        return "wisdom"
    # Mission themes
    if any(w in title_lower for w in ["commission", "evangel", "witness", "go", "send", "disciple"]):
        return "mission"
    # Comfort themes
    if any(w in title_lower for w in ["comfort", "console", "heal", "restore", "recover"]):
        return "comfort"
    # Sovereignty themes
    if any(w in title_lower for w in ["sovereign", "plan", "purpose", "will", "decree"]):
        return "sovereignty"
    # Presence themes
    if any(w in title_lower for w in ["presence", "abide", "remain", "dwell", "with"]):
        return "presence"
    # Praise themes
    if any(w in title_lower for w in ["praise", "worship", "glory", "exalt", "magnify"]):
        return "prayer"
    # Default
    return "general"


def generate_reflection(day, title, verse, verse_text):
    """Generate unique reflection text for a devotional using varied templates."""
    category = categorize_theme(title)

    # 12 distinct reflection patterns, selected by day
    patterns = [
        # Pattern 1: Question and application
        lambda t, v, vt: (
            f"Have you ever considered what {t.lower()} truly means in your daily walk with God? "
            f"The truth of {v} challenges us to move beyond surface-level understanding.\n\n"
            f"Many believers struggle with this concept. They know it intellectually but haven't let it "
            f"transform their hearts. {vt.split('.')[0]}. This isn't just information; it's invitation.\n\n"
            f"Today, ask the Holy Spirit to make this truth real in your experience. "
            f"Let it move from your head to your heart, and watch how it changes the way you live."
        ),
        # Pattern 2: Story illustration
        lambda t, v, vt: (
            f"Think of a time when {t.lower()} was most needed in your life. Perhaps it was in a moment of "
            f"crisis, or during a season of waiting. God's Word speaks directly to those moments.\n\n"
            f"Scripture reminds us: {vt.split('.')[0]}. These aren't empty words on a page; they are "
            f"God's living voice speaking into your situation right now.\n\n"
            f"As you reflect on this truth today, remember that God is not distant or detached. "
            f"He is actively working in your life, using this very truth to shape you into Christ's image."
        ),
        # Pattern 3: Contrast between world and kingdom
        lambda t, v, vt: (
            f"The world offers its version of {t.lower()}, but it always falls short. "
            f"It promises satisfaction but delivers emptiness. God's way is different.\n\n"
            f"Consider how {v} flips the world's narrative upside down. {vt.split('.')[0]}. "
            f"This is the upside-down kingdom of God, where the last are first and the humble are exalted.\n\n"
            f"Where have you been following the world's pattern instead of God's? "
            f"Today, choose to walk in God's truth rather than the world's lies."
        ),
        # Pattern 4: Personal reflection
        lambda t, v, vt: (
            f"Be honest with yourself today. How is {t.lower()} actually playing out in your life? "
            f"Not the version you present to others, but the reality behind closed doors.\n\n"
            f"God's Word doesn't leave us guessing. {vt.split('.')[0]}. "
            f"This truth is both a mirror and a roadmap, showing us where we are and where we need to go.\n\n"
            f"Don't shy away from this reflection. God isn't exposing your shortcomings to shame you; "
            f"He's revealing them to transform you. His grace is sufficient for every weakness."
        ),
        # Pattern 5: Historical context
        lambda t, v, vt: (
            f"When the original audience first heard these words about {t.lower()}, they were facing "
            f"persecution, poverty, and uncertainty. Yet this truth sustained them.\n\n"
            f"{vt.split('.')[0]}. These words have echoed through centuries, sustaining believers "
            f"in every generation. They sustained the early church through martyrdom, the reformers "
            f"through opposition, and countless believers through personal trials.\n\n"
            f"The same God who sustained them sustains you today. His truth hasn't changed, "
            f"and His faithfulness hasn't diminished. Trust in what has proven trustworthy for millennia."
        ),
        # Pattern 6: Action step
        lambda t, v, vt: (
            f"Knowledge without action leads to spiritual stagnation. Today, {t.lower()} isn't just "
            f"something to think about; it's something to live out.\n\n"
            f"{vt.split('.')[0]}. This isn't passive information but an active call to transformation. "
            f"God expects His Word to produce fruit in our lives.\n\n"
            f"Choose one specific way you will live out this truth today. Maybe it's a conversation "
            f"you need to have, a step of faith you need to take, or an attitude you need to change. "
            f"Faith without works is dead, but faith in action changes everything."
        ),
        # Pattern 7: Heart examination
        lambda t, v, vt: (
            f"God is always more interested in your heart than your performance. When it comes to "
            f"{t.lower()}, He's asking: what's happening on the inside?\n\n"
            f"{vt.split('.')[0]}. God sees beyond the external to the motives, desires, and attitudes "
            f"that drive your actions. He wants to transform you from the inside out.\n\n"
            f"Take a moment to examine your heart. Are there areas where you're going through the "
            f"motions without genuine engagement? Invite God to search your heart and renew it today."
        ),
        # Pattern 8: Promise and provision
        lambda t, v, vt: (
            f"Every promise in Scripture comes with a provision. God doesn't ask you to do something "
            f"without giving you what you need to do it. {t.lower()} is no exception.\n\n"
            f"The promise is clear: {vt.split('.')[0]}. But notice what God asks in return. "
            f"He asks for trust, obedience, and surrender. He provides the power; we provide the willingness.\n\n"
            f"What is God asking you to trust Him with today? His promises are sure, "
            f"and His provisions are always sufficient."
        ),
        # Pattern 9: Communal dimension
        lambda t, v, vt: (
            f"The Christian life was never meant to be lived alone. {t.lower()} is not just a personal "
            f"virtue; it's a communal reality.\n\n"
            f"{vt.split('.')[0]}. We practice this truth together, encouraging one another, "
            f"holding one another accountable, and bearing one another's burdens.\n\n"
            f"Today, consider how you can express {t.lower()} in community. "
            f"Maybe it's through a word of encouragement, a act of service, or simply showing up "
            f"for someone who needs to know they're not alone."
        ),
        # Pattern 10: Eternal perspective
        lambda t, v, vt: (
            f"What we see is temporary, but what is unseen is eternal. {t.lower()} looks different "
            f"when viewed through the lens of eternity.\n\n"
            f"{vt.split('.')[0]}. This truth has implications that stretch beyond this life into forever. "
            f"How we respond to {t.lower()} today matters for eternity.\n\n"
            f"Lift your eyes from your current circumstances and fix them on eternal realities. "
            f"The trials of this present time are not worth comparing with the glory that will be "
            f"revealed. Live with eternity in view."
        ),
        # Pattern 11: Contrast with flesh
        lambda t, v, vt: (
            f"The flesh and the Spirit are in constant tension. When it comes to {t.lower()}, "
            f"the flesh pulls one way and the Spirit pulls another.\n\n"
            f"{vt.split('.')[0]}. This is the battleground of the Christian life. "
            f"The flesh wants comfort, control, and self-reliance. The Spirit calls us to surrender, "
            f"trust, and dependence on God.\n\n"
            f"Today, which will you choose? The fleeting satisfaction of the flesh or the deep "
            f"fulfillment of walking in the Spirit? Choose life."
        ),
        # Pattern 12: Testimony and hope
        lambda t, v, vt: (
            f"Your story is part of a bigger story. {t.lower()} isn't just a theological concept; "
            f"it's a lived reality that testifies to God's faithfulness.\n\n"
            f"{vt.split('.')[0]}. These words have been proven true in the lives of millions of "
            f"believers throughout history. They can be proven true in your life as well.\n\n"
            f"Whatever you're facing today, know that the same God who has been faithful in the past "
            f"will be faithful in your present. Your story isn't over; God is still writing it."
        ),
    ]

    # Select pattern based on day (ensures variety across days)
    pattern_index = (day - 1) % len(patterns)
    pattern_fn = patterns[pattern_index]
    return pattern_fn(title, verse, verse_text)


def generate_prayer(day, title, verse):
    """Generate a unique prayer for a devotional."""
    category = categorize_theme(title)

    # 12 distinct prayer patterns
    prayer_patterns = [
        # Pattern 1: Surrender
        lambda t: f"Father, I surrender my understanding of {t.lower()} to You. Where my understanding falls short, replace it with Your wisdom. Help me trust Your ways even when they don't make sense to me. In Jesus' name, Amen.",
        # Pattern 2: Petition
        lambda t: f"Lord, I need Your help with {t.lower()}. I cannot do this in my own strength. Fill me with Your Spirit and give me the grace I need today. I ask this in Jesus' name, Amen.",
        # Pattern 3: Thanksgiving
        lambda t: f"God, thank You for the truth of {t.lower()}. Thank You that Your Word is living and active, speaking into my life today. Help me to live in light of this truth. In Jesus' name, Amen.",
        # Pattern 4: Intercession
        lambda t: f"Father, I pray for everyone reading this today. Meet each person at their point of need regarding {t.lower()}. Let Your Word accomplish what You intend in each heart. In Jesus' name, Amen.",
        # Pattern 5: Dedication
        lambda t: f"Lord, I dedicate this day to You. May everything I do reflect the truth of {t.lower()}. Let my life be a testimony to Your faithfulness. In Jesus' name, Amen.",
        # Pattern 6: Guidance
        lambda t: f"Holy Spirit, guide me into all truth regarding {t.lower()}. Show me what this looks like in my specific situation. I trust Your leading. In Jesus' name, Amen.",
        # Pattern 7: Strength
        lambda t: f"God, give me supernatural strength for {t.lower()}. When I am weak, You are strong. Be my strength today. In Jesus' name, Amen.",
        # Pattern 8: Transformation
        lambda t: f"Father, transform me from the inside out through the truth of {t.lower()}. Change my heart, renew my mind, and reshape my actions. In Jesus' name, Amen.",
        # Pattern 9: Trust
        lambda t: f"Lord, I choose to trust You with {t.lower()}. Even when I don't understand, I trust Your character and Your promises. Help my unbelief. In Jesus' name, Amen.",
        # Pattern 10: Courage
        lambda t: f"God, give me courage to live out {t.lower()} even when it's difficult. Help me stand firm in Your truth. In Jesus' name, Amen.",
        # Pattern 11: Humility
        lambda t: f"Father, humble me before the truth of {t.lower()}. Remove my pride and self-reliance. Help me depend on You completely. In Jesus' name, Amen.",
        # Pattern 12: Joy
        lambda t: f"Lord, fill me with joy as I meditate on {t.lower()}. Let Your joy be my strength today. In Jesus' name, Amen.",
    ]

    pattern_index = (day - 1) % len(prayer_patterns)
    pattern_fn = prayer_patterns[pattern_index]
    return pattern_fn(title)


def generate_devotionals():
    """Generate all 365 devotionals with unique content."""
    devotionals = []

    for day, title, verse, verse_text in THEMES:
        # Get unique reflection and prayer, or generate based on theme
        if day in REFLECTIONS:
            text = REFLECTIONS[day]
        else:
            text = generate_reflection(day, title, verse, verse_text)

        if day in PRAYERS:
            prayer = PRAYERS[day]
        else:
            prayer = generate_prayer(day, title, verse)

        devotionals.append({
            "day": day,
            "title": title,
            "verse": verse,
            "verse_text": verse_text,
            "text": text,
            "prayer": prayer,
        })

    return devotionals


def write_devotionals(devotionals, output_path):
    """Write devotionals to devotional.js file."""
    def js_escape(s):
        """Escape a string for JavaScript string literal."""
        return (s.replace('\\', '\\\\')
                .replace('"', '\\"')
                .replace("'", "\\'")
                .replace('\n', '\\n')
                .replace('\r', '\\r')
                .replace('\t', '\\t'))

    with open(output_path, 'w', encoding='utf-8') as f:
        f.write("export const DEVOTIONALS = [\n")
        for d in devotionals:
            title = js_escape(d['title'])
            verse = js_escape(d['verse'])
            verse_text = js_escape(d['verse_text'])
            text = js_escape(d['text'])
            prayer = js_escape(d['prayer'])

            f.write(f'  {{ day: {d["day"]}, title: "{title}", verse: "{verse}", verse_text: "{verse_text}", text: "{text}", prayer: "{prayer}" }},\n')
        f.write("]\n")


if __name__ == "__main__":
    # Generate all devotionals
    devotionals = generate_devotionals()

    # Write to devotional.js
    output_path = os.path.join(os.path.dirname(__file__), '..', 'src', 'devotional.js')
    write_devotionals(devotionals, os.path.abspath(output_path))

    print(f"Generated {len(devotionals)} devotionals")
    print(f"Output: {os.path.abspath(output_path)}")

    # Verify uniqueness
    titles = [d['title'] for d in devotionals]
    verses = [d['verse'] for d in devotionals]
    texts = [d['text'][:50] for d in devotionals]  # Check first 50 chars for uniqueness
    print(f"Unique titles: {len(set(titles))}")
    print(f"Unique verses: {len(set(verses))}")
    print(f"Unique text starts: {len(set(texts))}")

// ================= Thai translation =================
// The game is written in English; tr() looks strings up here when the language is set to ไทย.
// TH_NAMES: names of things (also matched in UPPERCASE).  TH: whole UI strings.  TH_RX: strings with numbers/names.
// Generated gear names (e.g. "Fine Iron Sword +2") stay in English.

TH_NAMES = {
  // places
  'Ironvale Village':'ฐานกักกันเอาต์โพสต์อัลฟ่า', 'FOB Ironvale Base':'ฐานกักกันเอาต์โพสต์อัลฟ่า', 'Quarantine Outpost Alpha':'ฐานกักกันเอาต์โพสต์อัลฟ่า',
  'Meadow':'เซกเตอร์ 1: เขตกักกันชานเมือง', 'Sector 1: Outer Plains':'เซกเตอร์ 1: เขตกักกันชานเมือง', 'Sector 1: Suburban Quarantine':'เซกเตอร์ 1: เขตกักกันชานเมือง',
  'Dark Forest':'เซกเตอร์ 2: นิคมอุตสาหกรรมติดเชื้อ', 'Sector 2: Blackwood Valley':'เซกเตอร์ 2: นิคมอุตสาหกรรมติดเชื้อ', 'Sector 2: Infected Industrial':'เซกเตอร์ 2: นิคมอุตสาหกรรมติดเชื้อ',
  'Old Ruins':'เซกเตอร์ 3: ซากใจกลางเมืองร้าง', 'Sector 3: Base Bravo Ruins':'เซกเตอร์ 3: ซากใจกลางเมืองร้าง', 'Sector 3: Ruined City Center':'เซกเตอร์ 3: ซากใจกลางเมืองร้าง',
  'Frostpeak Pass':'สถานีวิจัยชีวภาพฟรอสต์พีค', 'Frostpeak Radar Outpost':'สถานีวิจัยชีวภาพฟรอสต์พีค', 'Frostpeak Bio-Research Station':'สถานีวิจัยชีวภาพฟรอสต์พีค',
  'Emberfall Crater':'เตาเผาชีวภาพเอมเบอร์ฟอล', 'Emberfall Fuel Refinery':'เตาเผาชีวภาพเอมเบอร์ฟอล', 'Emberfall Bio-Incinerator':'เตาเผาชีวภาพเอมเบอร์ฟอล',
  'Abyssal Rift':'รอยแยกมิติอเวจี', 'Abyss':'ห้วงอเวจี', 'Underground Bunker':'บังเกอร์ใต้ดิน',

  // classes & roles
  'Assault Specialist':'หน่วยจู่โจมแนวหน้า', 'ASSAULT':'หน่วยจู่โจม', 'Knight':'หน่วยจู่โจมแนวหน้า', 'KNIGHT':'หน่วยจู่โจม',
  'Recon Sniper':'พลซุ่มยิงสอดแนม', 'SNIPER':'พลซุ่มยิง', 'Mage':'พลซุ่มยิงสอดแนม', 'MAGE':'พลซุ่มยิง',
  'Heavy Gunner':'พลปืนหนักซัพพอร์ต', 'HEAVY GUNNER':'พลปืนหนัก', 'Ranger':'พลปืนหนักซัพพอร์ต', 'RANGER':'พลปืนหนัก',
  'ANY':'ทุกอาชีพ',

  // weapons
  'Carbine M4A1':'ปืนคาร์บิน M4A1', 'Assault Rifle AK-74':'ปืนเล็กยาว AK-74', 'Tactical SCAR-H':'ปืนแท็กติคอล SCAR-H',
  'G36 Battle Rifle':'ปืนไรเฟิลต่อสู้ G36', 'Prototype Rail-Rifle':'ปืนเรลไรเฟิลต้นแบบ',
  'Hunting Rifle .308':'ปืนล่าสัตว์ .308', 'Scout Rifle SVD':'ปืนสไนเปอร์ SVD', 'AWM Precision Sniper':'ปืนสไนเปอร์ความแม่นยำสูง AWM',
  'Anti-Materiel .50 Cal':'ปืนไรเฟิลต่อต้านวัตถุ .50 Cal', 'Gauss Long-Rifle':'ปืนยาวแม่เหล็กเกาส์',
  'Combat Shotgun 12G':'ปืนลูกซองต่อสู้ 12G', 'Submachine MP5':'ปืนกลมือ MP5', 'M249 Light Machine Gun':'ปืนกลเบา M249',
  'Rotary Minigun':'ปืนกลหมุนมินิกัน', 'Plasma Cannon':'ปืนใหญ่พลาสม่า',
  'Legendary AK-47 Golden':'ปืนทองคำในตำนาน AK-47 Golden', 'AK-47':'ปืน AK-47',
  'Goliath Battle Rifle':'ปืนไรเฟิลโกไลแอท', 'Goliath Heavy Sniper':'ปืนสไนเปอร์หนักโกไลแอท', 'Goliath Heavy Autocannon':'ปืนใหญ่ออโต้แคนนอนโกไลแอท',
  'Omega Assault Rifle':'ปืนจู่โจมโอเมก้า', 'Omega Rail-Sniper':'ปืนเรลสไนเปอร์โอเมก้า', 'Omega Rotary Minigun':'ปืนกลมินิกันโอเมก้า',

  // armors & gear
  'Fatigue Webbing':'สายโยงเก่งสนาม', 'Tactical Kevlar Vest':'เสื้อเกราะเคฟลาร์แท็กติคอล', 'Ballistic Flak Vest':'เสื้อเกราะกันสะเก็ดระเบิด',
  'Exosuit Body Armor':'ชุดเกราะโครงกระดูกภายนอก', 'Titanium Dreadnought Frame':'โครงหุ่นเกราะไททาเนียม',
  'Field Beret':'หมวกเบเรต์ทหารสนาม', 'Kevlar Helmet':'หมวกเหล็กเคฟลาร์', 'PASGT Ballistic Helmet':'หมวกกันกระสุน PASGT',
  'Night Vision Visor (NVG)':'กล้องมองกลางคืน NVG', 'Tactical HUD Targeting Visor':'หน้ากากเล็งเป้า HUD',
  'Standard Boots':'รองเท้าคอมแบทมาตรฐาน', 'Tactical Combat Boots':'รองเท้าบูททหารยุทธวิธี', 'Reinforced Assault Greaves':'สนับแข้งจู่โจมเสริมแกร่ง',
  'Hydraulic Jump-Boots':'รองเท้าสปริงไฮดรอลิก', 'Nano-Fiber Striders':'รองเท้าคาร์บอนนาโนไฟเบอร์',
  'Field Dog Tags':'ป้ายชื่อทหาร Dog Tags', 'Radio Transponder':'เครื่องส่งวิทยุทรานสปอนเดอร์', 'Laser Aiming Module':'โมดูลเลเซอร์ชี้เป้า',
  'Spec-Ops Comm Unit':'วิทยุสื่อสารหน่วยรบพิเศษ', 'Quantum Sensor Band':'กำไลเซนเซอร์ตรวจจับควอนตัม',

  // skills & tree
  'Conditioning':'สมรรถภาพกาย', 'Mobility':'ความคล่องตัว', 'Bounty Pay':'เงินรางวัลภารกิจ',
  'Firearm Training':'ฝึกยิงปืนขั้นสูง', 'Quick Reload':'บรรจุกระสุนไว', 'Shrapnel Rounds':'กระสุนสะเก็ดระเบิด',
  'Targeting Visor':'กล้องช่วยเล็ง', 'Combat Evasion':'กลิ้งหลบยุทธวิธี', 'Combat Trance':'ภวังค์สมรภูมิ',
  'Piercing Core':'แกนกระสุนเจาะทะลุ', 'Deadly Focus':'สมาธิสังหาร', 'Lead Storm':'พายุห่ากระสุน', 'Shadow Breach':'บุกทะลวงเงามืด',

  // monsters & bosses
  'Walker Zombie':'ซอมบี้เดินโซเซ', 'Walker Zombies':'ซอมบี้เดินโซเซ', 'Insurgent Scout':'ซอมบี้เดินโซเซ', 'Insurgent Scouts':'ซอมบี้เดินโซเซ', 'Slime':'ซอมบี้เดินโซเซ', 'Slimes':'ซอมบี้เดินโซเซ',
  'Infected Runner':'ซอมบี้คลั่งวิ่งเร็ว', 'Infected Runners':'ซอมบี้คลั่งวิ่งเร็ว', 'Hostile Rifleman':'ซอมบี้คลั่งวิ่งเร็ว', 'Hostile Riflemen':'ซอมบี้คลั่งวิ่งเร็ว', 'Wolf':'ซอมบี้คลั่งวิ่งเร็ว', 'Wolves':'ซอมบี้คลั่งวิ่งเร็ว',
  'Toxic Crawler':'ซอมบี้คลานพิษ', 'Toxic Crawlers':'ซอมบี้คลานพิษ', 'Guerilla Raider':'ซอมบี้คลานพิษ', 'Guerilla Raiders':'ซอมบี้คลานพิษ', 'Goblin':'ซอมบี้คลานพิษ', 'Goblins':'ซอมบี้คลานพิษ',
  'Infected Hazmat Soldier':'ซอมบี้ทหารติดเชื้อ Hazmat', 'Infected Hazmat Soldiers':'ซอมบี้ทหารติดเชื้อ Hazmat', 'Spec-Ops Merc':'ซอมบี้ทหารติดเชื้อ Hazmat', 'Spec-Ops Mercs':'ซอมบี้ทหารติดเชื้อ Hazmat', 'Skeleton':'ซอมบี้ทหารติดเชื้อ Hazmat', 'Skeletons':'ซอมบี้ทหารติดเชื้อ Hazmat',
  'Parasite Leaper':'ซากศพปรสิตกลายพันธุ์', 'Parasite Leapers':'ซากศพปรสิตกลายพันธุ์', 'Combat Quad-Drone':'ซากศพปรสิตกลายพันธุ์', 'Combat Quad-Drones':'ซากศพปรสิตกลายพันธุ์', 'Cave Spider':'ซากศพปรสิตกลายพันธุ์', 'Cave Spiders':'ซากศพปรสิตกลายพันธุ์',
  'Riot Shield Juggernaut':'ซอมบี้หน่วยปราบจลาจล', 'Riot Shield Juggernauts':'ซอมบี้หน่วยปราบจลาจล', 'Riot Shield Breacher':'ซอมบี้หน่วยปราบจลาจล', 'Riot Shield Breachers':'ซอมบี้หน่วยปราบจลาจล', 'Bone Knight':'ซอมบี้หน่วยปราบจลาจล', 'Bone Knights':'ซอมบี้หน่วยปราบจลาจล',
  'Toxic Acid Spitter':'ซอมบี้พ่นกรดพิษ', 'Toxic Acid Spitters':'ซอมบี้พ่นกรดพิษ', 'Enemy Recon Sniper':'ซอมบี้พ่นกรดพิษ', 'Enemy Recon Snipers':'ซอมบี้พ่นกรดพิษ', 'Cultist':'ซอมบี้พ่นกรดพิษ', 'Cultists':'ซอมบี้พ่นกรดพิษ',
  'The Goliath Tank':'ซอมบี้ยักษ์กลายพันธุ์ The Tank', 'Armored Gun Truck .50 Cal':'ซอมบี้ยักษ์กลายพันธุ์ The Tank', 'Orc Warlord':'ซอมบี้ยักษ์กลายพันธุ์ The Tank',
  'Nemesis Tyrant':'เนเมซิส ไทแรนต์', 'Nemesis Tyrants':'เนเมซิส ไทแรนต์', 'Havoc Attack Helicopter':'เนเมซิส ไทแรนต์', 'Lich King':'เนเมซิส ไทแรนต์',
  'Cryo Ghoul Hound':'สุนัขซอมบี้หิมะติดเชื้อ', 'Cryo Ghoul Hounds':'สุนัขซอมบี้หิมะติดเชื้อ', 'Arctic Scout Hound':'สุนัขซอมบี้หิมะติดเชื้อ', 'Arctic Scout Hounds':'สุนัขซอมบี้หิมะติดเชื้อ', 'Ice Wolf':'สุนัขซอมบี้หิมะติดเชื้อ', 'Ice Wolves':'สุนัขซอมบี้หิมะติดเชื้อ',
  'Cryo Brute Zombie':'ซอมบี้ยักษ์เยือกแข็ง', 'Cryo Brute Zombies':'ซอมบี้ยักษ์เยือกแข็ง', 'Heavy Snow Juggernaut':'ซอมบี้ยักษ์เยือกแข็ง', 'Heavy Snow Juggernauts':'ซอมบี้ยักษ์เยือกแข็ง', 'Yeti':'ซอมบี้ยักษ์เยือกแข็ง', 'Yetis':'ซอมบี้ยักษ์เยือกแข็ง',
  'Screamer Banshee':'ซอมบี้กรีดร้องแบนชี', 'Screamer Banshees':'ซอมบี้กรีดร้องแบนชี', 'Arctic Drone Infiltrator':'ซอมบี้กรีดร้องแบนชี', 'Arctic Drone Infiltrators':'ซอมบี้กรีดร้องแบนชี', 'Frost Wraith':'ซอมบี้กรีดร้องแบนชี', 'Frost Wraiths':'ซอมบี้กรีดร้องแบนชี',
  'Cryo Abomination Titan':'อสูรกายชีวภาพแช่แข็งไททัน', 'Cryo Abomination Titans':'อสูรกายชีวภาพแช่แข็งไททัน', 'Goliath Siege Tank T-99':'อสูรกายชีวภาพแช่แข็งไททัน', 'Goliath Siege Tanks':'อสูรกายชีวภาพแช่แข็งไททัน', 'Frost Wyrm':'อสูรกายชีวภาพแช่แข็งไททัน',
  'Combustion Boomer':'ซอมบี้ระเบิดไฟบูมเมอร์', 'Combustion Boomers':'ซอมบี้ระเบิดไฟบูมเมอร์', 'Incendiary Combat Drone':'ซอมบี้ระเบิดไฟบูมเมอร์', 'Incendiary Combat Drones':'ซอมบี้ระเบิดไฟบูมเมอร์', 'Magma Slime':'ซอมบี้ระเบิดไฟบูมเมอร์', 'Magma Slimes':'ซอมบี้ระเบิดไฟบูมเมอร์',
  'Charred Stalker':'ซากศพไฟคลั่ง', 'Charred Stalkers':'ซากศพไฟคลั่ง', 'Flamethrower Specialist':'ซากศพไฟคลั่ง', 'Flamethrower Specialists':'ซากศพไฟคลั่ง', 'Fire Imp':'ซากศพไฟคลั่ง', 'Fire Imps':'ซากศพไฟคลั่ง',
  'Volcanic Bio-Titan':'ซอมบี้ยักษ์เกราะหินร้อน', 'Volcanic Bio-Titans':'ซอมบี้ยักษ์เกราะหินร้อน', 'Heavy Combat Exosuit':'ซอมบี้ยักษ์เกราะหินร้อน', 'Heavy Combat Exosuits':'ซอมบี้ยักษ์เกราะหินร้อน', 'Lava Golem':'ซอมบี้ยักษ์เกราะหินร้อน', 'Lava Golems':'ซอมบี้ยักษ์เกราะหินร้อน',
  'Bio-Hazard Nemesis Omega':'เนเมซิสเพลิงนรกขั้นสุดยอด', 'Bio-Hazard Nemesis Omegas':'เนเมซิสเพลิงนรกขั้นสุดยอด', 'Assault Dreadnought Mech MK-IV':'เนเมซิสเพลิงนรกขั้นสุดยอด', 'Assault Dreadnought Mechs':'เนเมซิสเพลิงนรกขั้นสุดยอด', 'Infernal Lord':'เนเมซิสเพลิงนรกขั้นสุดยอด',
  'Target Firing Board':'เป้ายิงทดสอบกระสุน', 'Training Dummy':'เป้ายิงทดสอบกระสุน',

  // companion pets
  'K-9 War Dog':'สุนัขสงคราม K-9', 'Recon Drone':'โดรนสอดแนมไฮเทค', 'Sentry Turret':'ป้อมปืนกลเซนทรี',
  'Wolf Pup':'สุนัขสงคราม K-9', 'Spirit Fairy':'โดรนสอดแนมไฮเทค', 'Frost Hatchling':'ป้อมปืนกลเซนทรี',

  // loot & consumables
  'Infected Flesh':'ชิ้นส่วนเนื้อซอมบี้ติดเชื้อ', 'Biohazard Fiber':'เส้นใยชีวภาพอันตราย', 'Corrosive Acid Gland':'ต่อมกรดกัดกร่อน', 'Mutated Bone Shard':'เศษกระดูกกลายพันธุ์',
  'Goliath Tank Core':'แกนชีวภาพ The Tank', 'Necrotic Sinew':'เอ็นซากศพเน่าเปื่อย', 'Biohazard Intel':'ข้อมูลวิจัยชีวภาพ',
  'Alpha Tyrant Organ':'อวัยวะไทแรนต์อัลฟ่า', 'Dark Bio-Mutagen':'สารกลายพันธุ์ชีวภาพมืด', 'Cryo Gland':'ต่อมพิษเยือกแข็ง',
  'Insulated Bio-Pelt':'ชิ้นส่วนขนติดเชื้อทนหนาว', 'Cryo Bio-Crystal':'ผลึกชีวภาพเยือกแข็ง', 'Cryo Titan Carapace':'เกราะเปลือกอสูรเยือกแข็ง',
  'Unstable Bio-Cell':'เซลล์ชีวภาพเพลิงไม่เสถียร', 'Calcified Flame Spike':'หนามกระดูกเพลิงกลายพันธุ์', 'Slag Bio-Carapace':'เกราะเปลือกชีวภาพทนความร้อน',
  'Nemesis Omega Heart':'หัวใจปฏิกรณ์เนเมซิสโอเมก้า',
  'Scrap Metal':'เศษเหล็กสงคราม', 'Kevlar Fiber':'เส้นใยเคฟลาร์', 'Radio Comm Chip':'ชิปวิทยุทหาร', 'Carbon Steel Plate':'แผ่นเหล็กกล้าคาร์บอน',
  'Commander Insignia':'เหรียญตราผู้บัญชาการ', 'Optic Cable':'สายเคเบิลเซนเซอร์', 'Encrypted Intel':'ข้อมูลลับเข้ารหัส',
  'Flight Reactor Core':'แกนปฏิกรณ์การบิน', 'Dark Energy Battery':'แบตเตอรี่พลังงานมืด', 'Thermal Core':'แกนความร้อนเทอร์มอล',
  'Insulated Kevlar':'เคฟลาร์กันความเย็น', 'Optic Prism':'ปริซึมเลนส์สไนเปอร์', 'Titanium Armor Plate':'เกราะไททาเนียมรถถัง',
  'Refined Fuel Cell':'เซลล์เชื้อเพลิงกลั่น', 'High-Caliber Casing':'ปลอกกระสุนขนาดหนัก', 'Tungsten Alloy Plate':'แผ่นโลหะทังสเตน',
  'Dreadnought Reactor Core':'แกนเตาปฏิกรณ์หุ่นรบ',
  'Energy Cell':'เซลล์พลังงานสูท', 'Combat Stimpack':'สติมแพ็กกระตุ้นการรบ', 'Tactical Beacon':'บีคอนส่งสัญญาณส่งกลับฐาน',
  'Field Medkit':'กล่องปฐมพยาบาลสนาม', 'Mana Potion':'เซลล์พลังงานสูท', 'Hero Elixir':'สติมแพ็กกระตุ้นการรบ', 'Town Scroll':'บีคอนส่งสัญญาณส่งกลับฐาน', 'Potion':'กล่องปฐมพยาบาล',

  // operations (campaigns)
  'Perimeter Sweep':'ปฏิบัติการกวาดล้างรอบฐาน', 'Biohazard Samples':'ปฏิบัติการเก็บตัวอย่างชีวภาพ', 'Kevlar Supplies':'ปฏิบัติการจัดหาเคฟลาร์',
  'Crawler Infestation':'ปฏิบัติการกวาดล้างซอมบี้คลาน', 'Guerilla Ambush':'ปฏิบัติการกวาดล้างกองโจร',
  'Scout Ruined City':'ปฏิบัติการสอดแนมเมืองร้าง', 'Scout Base Bravo':'ปฏิบัติการสอดแนมฐานบราโว',
  'Infected Hazmat Cleanse':'ปฏิบัติการกำจัดทหารติดเชื้อ', 'Neutralize Mercs':'ปฏิบัติการกำจัดทหารรับจ้าง',
  'Neutralize Goliath Tank':'ปฏิบัติการโค่นล้มซอมบี้ยักษ์ The Tank', 'Destroy Gun Truck':'ปฏิบัติการทำลายรถหุ้มเกราะ',
  'Bunker B3 Bio-Weapon':'ปฏิบัติการกำจัดเนเมซิสไทแรนต์', 'Bunker B3 Infiltration':'ปฏิบัติการแทรกซึมบังเกอร์ B3',
  'Operation Frostpeak':'ปฏิบัติการบุกยึดสถานีวิจัยฟรอสต์พีค',
  'Cryo Titan Vanquisher':'ปฏิบัติการปราบอสูรกายแช่แข็ง', 'Goliath Tank Buster':'ปฏิบัติการทำลายรถถังโกไลแอท',
  'Operation Omega Nemesis':'ปฏิบัติการกวาดล้างเนเมซิสโอเมก้า', 'Operation Dreadnought':'ปฏิบัติการโค่นล้มหุ่นรบยักษ์',

  // titles & achievements
  'Recruit':'พลทหารใหม่', 'Corporal':'สิบโท', 'Sergeant':'สิบเอก', 'Vehicle Hunter':'นักล่ารถหุ้มเกราะ',
  'Tank Slayer':'มือสังหารแทงค์', 'Tyrant Slayer':'มือพิฆาตไทแรนต์', 'Titan Slayer':'มือสังหารไททัน', 'Omega Slayer':'มือสังหารโอเมก้า',
  'Sky Cleaner':'ผู้ครองนภากาศ', 'Anti-Armor Ace':'มือพิฆาตรถถัง', 'Apex Commando':'ยอดคอมมานโด',
  'Commando':'คอมมานโด', 'Iron Commando':'ไอรอนคอมมานโด', 'Quartermaster':'นายคลังสรรพาวุธ',
  'Master Gunsmith':'ช่างปืนเอก', 'Master Armorer':'นายช่างเกราะเอก', 'Field Engineer':'วิศวกรสนาม',
  'Recon Specialist':'ผู้เชี่ยวชาญการลาดตระเวน', 'Secret Agent':'สายลับรหัสลับ', 'Combat Ready':'พร้อมรบ',
  'Ghost Operative':'มือสังหารไร้เงา', 'Rift Infiltrator':'ผู้แทรกซึมมิติ', 'Rift Commando':'คอมมานโดทะลวงมิติ',
  'Omega Specialist':'ผู้เชี่ยวชาญโอเมก้า', 'Supreme Commander':'ผู้บัญชาการสูงสุด',
  'First Blood':'ประเดิมเลือดแรก', 'First Kill':'ประเดิมสังหารแรก', 'Field Promotion':'เลื่อนยศในสนามรบ', 'Outpost Veteran':'ทหารผ่านศึกฐานกักกัน', 'FOB Veteran':'ทหารผ่านศึก FOB',
  'Goliath Neutralizer':'ผู้โค่นล้มซอมบี้ยักษ์ The Tank', 'Technical Neutralizer':'ทำลายรถหุ้มเกราะ',
  'Tyrant Exterminator':'ผู้กำจัดเนเมซิสไทแรนต์', 'Air Supremacy':'ครองนภากาศ',
  'Titan Vanquisher':'ผู้พิชิตอสูรกายแช่แข็ง', 'Tank Destroyer':'ผู้ทำลายล้างรถถัง',
  'Nemesis Omega Buster':'ผู้ทำลายล้างเนเมซิสโอเมก้า', 'Dreadnought Buster':'ผู้ทำลายหุ่นรบยักษ์',
  'Outpost Defense Line':'แนวป้องกันฐานกักกัน', 'FOB Defense Line':'แนวป้องกันฐาน FOB', 'Iron Defender':'ปราการเหล็ก',
  'War Budget Hoarder':'ผู้สะสมงบประมาณสงคราม', 'Armory Gunsmith':'ช่างสรรพาวุธ', 'Tactical Weapon Modder':'ช่างแต่งปืนยุทธวิธี',
  'Threat Intel Expert':'ผู้เชี่ยวชาญข่าวกรองข้าศึก', 'Black-Ops Cache':'คลังอาวุธปฏิบัติการลับ',
  'Base Supply Drop':'คำขอกล่องเสบียงฐาน', 'Tactical Roll Master':'ปรมาจารย์กลิ้งหลบกระสุน',
  'Hostile Rift Sweep':'กวาดล้างรอยแยกมิติ', 'Deep Breach':'เจาะลึกทะลวงมิติ', 'Omega Cleanse':'กวาดล้างโอเมก้า',

  // NPCs
  'QUARTERMASTER HIGGINS':'นายคลังสรรพาวุธ ฮิกกินส์', 'MERCHANT':'นายคลังสรรพาวุธ ฮิกกินส์',
  'COMMANDER VANCE':'ผู้การแวนซ์', 'ELDER BRANN':'ผู้การแวนซ์',
  'DRILL SGT. MILLER':'จ่าฝึกมิลเลอร์', 'MIRA THE HUNTER':'จ่าฝึกมิลเลอร์',
  'MAJOR BRIGGS':'พันตรีบริกส์', 'ARENA MASTER':'พันตรีบริกส์',
  'INTEL OFFICER MALAKOR':'เจ้าหน้าที่ข่าวกรอง มาลาคอร์', 'VOID SEER MALAKOR':'เจ้าหน้าที่ข่าวกรอง มาลาคอร์',
  'BASE SENTRY VORN':'พลทหารยาม วอร์น', 'CAPTAIN VORN':'พลทหารยาม วอร์น',
  'EAST PERIMETER SENTRY':'พลทหารยามแนวตะวันออก', 'NORTH WALL SENTRY':'พลทหารยามกำแพงเหนือ', 'SOUTH WALL SENTRY':'พลทหารยามกำแพงใต้',
  'NORTH GATE SENTRY':'พลทหารยามประตูเหนือ', 'NORTH WATCHTOWER SENTRY':'พลทหารยามหอสังเกตการณ์เหนือ',
  'SOUTH GATE SENTRY':'พลทหารยามประตูใต้', 'SOUTH WATCHTOWER SENTRY':'พลทหารยามหอสังเกตการณ์ใต้',
};
// also accept UPPERCASE versions (titles and boss bars upper-case names)
for (const [k, v] of Object.entries(TH_NAMES)) TH_NAMES[k.toUpperCase()] ??= v;

const RARITY_TH = { COMMON:'ธรรมดา', FINE:'ดี', RARE:'หายาก', EPIC:'มหากาพย์', LEGEND:'ตำนาน' };
const goalTH = g => g
  .replace(/^Slay (\d+) (.+)$/, (_, n, m) => `กำจัด${trName(m)} ${n} ตัว`)
  .replace(/^Bring (\d+) (.+)s$/, (_, n, m) => `นำ${trName(m)}มา ${n} ชิ้น`)
  .replace(/^Visit the (.+)$/, (_, m) => `ไปสำรวจ${trName(m)}`);

TH_NAMES['Behemoth Prime'] = TH_NAMES['BEHEMOTH PRIME'] = 'บีฮีมอธไพรม์';
TH_NAMES['M1A1 ABRAMS'] = 'รถถัง M1A1 เอบรามส์';
TH_NAMES['Behemoth Heart'] = TH_NAMES['BEHEMOTH HEART'] = 'หัวใจบีฮีมอธ';
TH = {
  // auto farm, bots & world boss (bots.js)
  'AUTO':'ออโต้', 'AUTO FARM: ON':'ออโต้ฟาร์ม: เปิด', 'AUTO FARM: OFF':'ออโต้ฟาร์ม: ปิด',
  'WORLD BOSS!':'บอสโลก!', 'WORLD BOSS DEFEATED!':'ปราบบอสโลกสำเร็จ!',
  'Behemoth Prime has broken into the Meadow! Gather a party!':'บีฮีมอธไพรม์บุกเข้าทุ่งหญ้าแล้ว! รวมปาร์ตี้ไปตีกัน!',
  'The Behemoth regenerates! Bring more heroes!':'บีฮีมอธฟื้นพลัง! ต้องมีคนช่วยตีมากกว่านี้!',
  'WORLD BOSS ACTIVE: Meadow':'บอสโลกปรากฏที่ทุ่งหญ้า!',
  // title / class select / settings
  'A PIXEL LOOT RPG':'เกม RPG ล่ามอนฟาร์มของ', 'ENTER: CONTINUE':'ENTER: เล่นต่อ', 'N: NEW GAME':'N: เริ่มเกมใหม่',
  'PRESS ENTER':'กด ENTER เพื่อเริ่ม', 'O: SETTINGS':'O: ตั้งค่า', 'CHOOSE YOUR CLASS':'เลือกอาชีพ', '< >  ENTER: CHOOSE':'< >  ENTER: เลือก',
  'Tough melee fighter.':'นักสู้ระยะประชิด ถึกทน', 'Fragile caster of magic bolts.':'นักเวท ยิงเวทระยะไกล แต่ตัวบาง',
  'Swift archer with long range.':'นักธนูว่องไว ยิงได้ไกล',
  'SETTINGS':'ตั้งค่า', 'RESUME':'เล่นต่อ', 'MUSIC':'เพลง', 'SOUND FX':'เสียงเอฟเฟกต์', 'LANGUAGE':'ภาษา', 'DIFFICULTY':'ความยาก',
  'HOW TO PLAY':'วิธีเล่น', 'FULLSCREEN':'เต็มจอ', 'QUIT TO TITLE':'กลับหน้าแรก', 'BACK':'กลับ', 'ON':'เปิด', 'OFF':'ปิด',
  'EASY':'ง่าย', 'NORMAL':'ปกติ', 'HARD':'ยาก',
  'Weaker foes, more loot, no gold lost on death.':'ศัตรูอ่อนลง ได้ของมากขึ้น ตายไม่เสียเงิน',
  'The intended challenge. Lose 10% gold on death.':'ความยากมาตรฐาน ตายเสียเงิน 10%',
  'Tough foes hit hard. More XP and gold. Lose 20% gold.':'ศัตรูถึกและตีแรง ได้ XP และเงินมากขึ้น ตายเสียเงิน 20%',
  'UP/DN:SELECT  L/R:CHANGE':'ขึ้น/ลง: เลือก   ซ้าย/ขวา: เปลี่ยน', 'TAB':'TAB', 'ARROWS':'จำนวนธนู',
  // HUD & world
  'E:OPEN GATE':'E:เปิดประตู', 'E:CLOSE GATE':'E:ปิดประตู', 'GATE OPEN':'ประตูเปิด', 'GATE CLOSED':'ประตูปิด', 'BLOCKED!':'มีของขวาง!',
  'E:TRADE':'E:ซื้อขาย', 'E:TALK':'E:คุย', 'E:OPEN':'E:เปิด', 'E:STASH':'E:คลังเก็บของ', 'E:PRAY':'E:อธิษฐาน', 'E:WELL':'E:ดื่มน้ำ',
  'E:ENTER RIFT':'E:เข้าสู่รอยแยกมิติ', 'ANOMALY:':'ปรากฏการณ์:',
  'QUESTS':'เควส', 'ATK UP':'พลังโจมตีขึ้น!', 'LEVEL UP':'เลเวลอัป!',
  'ELIXIR!':'ยาฮีโร่!', 'SECRET FOUND!':'พบความลับ!', 'NEXT':'ถัดไป',
  'COMBO!':'คอมโบ!', 'ENRAGED!':'คลั่งศึก!', 'SUMMON!':'อัญเชิญ!', 'CHILLED!':'ติดหนาวเหน็บ!',
  'RELOADING...':'กำลังบรรจุกระสุน...', 'LOCK & LOAD!':'บรรจุกระสุนพร้อมยิง!', 'LOW AMMO [R]':'กระสุนใกล้หมด [R]',
  'SHRINE!':'รับพรศักดิ์สิทธิ์!', 'BLESSED!':'ได้รับพร!', 'REFRESHED!':'สดชื่น!',
  'DAY':'กลางวัน', 'DUSK':'พลบค่ำ', 'NIGHT':'กลางคืน', 'DAWN':'รุ่งสาง', 'CRYPT':'สุสานมืด', 'BLIZZARD':'พายุหิมะ', 'CALDERA':'ปล่องไฟ',
  'B:BOOK  N':'B:สมุด  N', 'Y:TITLES  B  N':'Y:ฉายา  B  N', 'BESTIARY':'สมุดภาพมอนสเตอร์', 'HUNTER BONUS':'โบนัสนักล่า',
  'ACHIEVEMENTS & TITLES':'ความสำเร็จและฉายา', 'ACTIVE TITLE':'ฉายาที่ใช้อยู่',
  'TITLE REWARD:':'ฉายาที่ได้รับ:', 'TITLE BONUS:':'โบนัสฉายา:', 'EQUIPPED BONUS:':'โบนัสที่ได้รับ:', 'EQUIPPED BONUS':'โบนัสจากฉายา',
  'EQUIP TITLE':'สวมใส่ฉายา', 'UNEQUIP TITLE':'ถอดฉายา', 'SECRET ACHIEVEMENT':'ความสำเร็จลับ', 'ACHIEVEMENT':'ความสำเร็จ',
  '(NO TITLE)':'(ไม่มีฉายา)', 'Equip a title to':'สวมใส่ฉายาเพื่อ', 'gain stat bonus':'รับโบนัสค่าพลังพิเศษ',
  'gain stat bonuses':'รับโบนัสค่าพลังพิเศษ',
  'Keep exploring to discover this secret feat.':'จงออกสำรวจเพื่อค้นพบความสำเร็จลับนี้',
  'Keep exploring to discover this secret achievement.':'จงออกสำรวจเพื่อค้นพบความสำเร็จลับนี้',
  '??? (SECRET)':'??? (ความลับ)', 'ARROWS/CLICK:SELECT  ENT:EQUIP  Y/ESC:CLOSE':'ลูกศร/คลิก:เลือก  ENT:สวม  Y/ESC:ปิด',
  'NO TITLE [Y]':'ไม่มีฉายา [Y]', 'Titles (Y)':'ฉายา (Y)', 'Unequipped title.':'ถอดฉายาออกแล้ว',
  '+5% XP Gain':'+5% ได้รับ XP', '+15 Max MP':'+15 MP สูงสุด', '+40 Max HP':'+40 HP สูงสุด',
  '+5 Flat ATK':'+5 พลังโจมตีพื้นฐาน', '+5% Crit Rate':'+5% อัตราคริ', '+12% Boss DMG':'+12% ดาเมจบอส',
  '+8% Total ATK':'+8% พลังโจมตีรวม', '+4 DEF':'+4 พลังป้องกัน', '+4 ATK, +3 DEF, +30 HP':'+4 ATK, +3 DEF, +30 HP',
  '+20% Gold Find':'+20% ได้รับทอง', '+3 ATK, +2 DEF':'+3 ATK, +2 DEF', '+5% Move Speed':'+5% ความเร็วเคลื่อนที่',
  '+8% Boss DMG, +5% SPD':'+8% ดาเมจบอส, +5% ความเร็ว', '+8% Crit Rate':'+8% อัตราคริ',
  '2x Health & Mana Regen':'ฟื้นฟู HP/MP 2 เท่า', '+10% Move Speed':'+10% ความเร็วเคลื่อนที่',
  '+10% Boss DMG, +5% Crit Rate':'+10% ดาเมจบอส, +5% อัตราคริ',
  '+6 Flat ATK, +6 DEF, +40 HP':'+6 ATK, +6 DEF, +40 HP',
  '+15% Boss DMG, +8% SPD':'+15% ดาเมจบอส, +8% ความเร็ว',
  '+15% Total ATK, +10% Crit Rate, +10% SPD':'+15% พลังโจมตีรวม, +10% อัตราคริ, +10% ความเร็ว',
  'Step through the swirling rift portal into the Abyssal Rift for the first time.':'ก้าวผ่านประตูมิติหมุนวนเข้าสู่รอยแยกอเวจีเป็นครั้งแรก',
  'Delve deep into the infinite void and survive to reach Abyssal Rift Depth 5.':'ดำดิ่งสู่ห้วงว่างเปล่าไร้สิ้นสุดและเอาชีวิตรอดจนถึงความลึกระดับ 5',
  'Vanquish the cosmic horrors lurking in the void to reach Abyssal Rift Depth 10.':'ปราบอสูรกายแห่งห้วงจักรวาลเพื่อไปให้ถึงความลึกระดับ 10',
  'Master the infinite void and conquer the horrors of Abyssal Rift Depth 20.':'บรรลุความเชี่ยวชาญแห่งความว่างเปล่าและพิชิตความลึกระดับ 20',
  'Slay 10 foes':'กำจัดมอนครบ 10 ตัว', '(or 1 Boss) to':'(หรือบอส 1 ตัว)', 'unlock Mastery:':'เพื่อปลดล็อกความชำนาญ:', '+15% DMG vs foe':'ดาเมจ +15% ถาวร',
  'BOSS MONSTER':'มอนสเตอร์ระดับบอส', 'MONSTER':'มอนสเตอร์ทั่วไป', '★ MASTERY (+15% DMG)':'★ ชำนาญ (+15% ดาเมจ)',
  'DROP:':'ของดรอป:', 'ARROWS/CLICK:SELECT  B/ESC:CLOSE':'ลูกศร/คลิก:เลือก  B/ESC:ปิด',
  'No consumables in bag!':'ไม่มีไอเทมกดใช้ในกระเป๋า!',
  'WORLD MAP':'แผนที่โลก', 'UP':'ขึ้น', 'DOWN':'ลง', 'CHEST':'หีบ', 'FOE':'ศัตรู', 'CHECKPT':'ด่าน', 'BOSS':'บอส', 'YOU':'คุณ',
  'YOU HAVE FALLEN':'คุณพ่ายแพ้แล้ว', 'ENTER: RETURN TO VILLAGE':'ENTER: กลับหมู่บ้าน',
  // skill tree
  'TACTICAL TRAINING TREE':'แผนผังฝึกยุทธวิธีทางทหาร', 'SURVIVAL':'เอาชีวิตรอด', 'BALLISTICS':'อาวุธปืน', 'TACTICS':'ยุทธวิธี',
  'SKILL TREE':'ต้นไม้สกิล', 'TREE':'ต้นไม้', 'BODY':'ร่างกาย', 'ENTER: LEARN':'ENTER: เรียน', 'T: CLOSE':'T: ปิด',
  'MAXED':'อัปสูงสุดแล้ว', 'LEARN THE SKILL ABOVE':'ต้องเรียนสกิลด้านบนก่อน', 'NO SKILL POINTS':'ไม่มีแต้มสกิล',
  'DAMAGE':'ดาเมจ', 'COOLDOWN':'คูลดาวน์', 'EFFECT':'ผล', 'NOW':'ตอนนี้',
  '+8% max HP/Armor per rank.':'HP สูงสุด/เกราะ +8% ต่อขั้น', '+8% move speed per rank.':'ความเร็วเดิน +8% ต่อขั้น',
  '+20% combat pay & loot from all sources per rank.':'เงินรางวัลและของดรอป +20% ต่อขั้น',
  'Basic firearm attacks deal +10% damage per rank.':'การยิงปืนปกติแรงขึ้น +10% ต่อขั้น',
  'Firearm reload time -12% per rank.':'เวลารีโหลดปืนไวขึ้น -12% ต่อขั้น',
  '+5% firearm critical strike chance per rank.':'โอกาสคริติคอลปืน +5% ต่อขั้น',
  'Combat roll cooldown -20% per rank.':'คูลดาวน์กลิ้งหลบ -20% ต่อขั้น',
  'Rifle bullets cause +25% explosive area damage.':'กระสุนไรเฟิลสร้างความเสียหายกระจายรอบข้าง +25%',
  'Rapid kills grant +25% move speed and instant reload for 4s.':'สังหารต่อเนื่องรับความเร็วเดิน +25% และรีโหลดทันที 4 วิ',
  'Sniper rounds pierce through all enemies without damage drop.':'กระสุนสไนเปอร์เจาะทะลุศัตรูทุกตัวโดยไม่ลดดาเมจ',
  'Scoped shots gain +35% critical strike damage.':'การยิงเล็งสร้างความเสียหายคริติคอลแรงขึ้น +35%',
  'Shotguns fire 2 extra heavy buckshot pellets.':'ลูกซองยิงลูกปรายขนาดหนักเพิ่มขึ้นอีก 2 นัด',
  'After a combat roll, shots gain 100% critical strike chance for 3s.':'หลังกลิ้งหลบ การยิงทุกนัดจะติดคริติคอล 100% เป็นเวลา 3 วิ',
  // bag
  'ALL':'รวม', 'GEAR':'สวม', 'USE':'ใช้', 'LOOT':'ดรอป', 'SORT':'เรียง', 'MONSTER LOOT':'ของดรอปจากมอน',
  'Sell to merchant':'ขายให้พ่อค้า', 'for gold.':'แลกเป็นเงิน', 'CONSUMABLE':'ไอเทมใช้งาน', 'SELL':'ขาย', 'UNEQUIP':'ถอด',
  'EQUIP':'สวม', 'DROP (X)':'ทิ้ง (X)', '(EMPTY SLOT)':'(ช่องว่าง)', 'Click or use arrows':'คลิกหรือใช้ปุ่มลูกศร',
  'to select an item.':'เพื่อเลือกไอเทม',
  'ENT/CLICK:SELL  F:FILTER  R:SORT  ESC:BACK':'ENT/คลิก:ขาย  F:กรอง  R:เรียง  ESC:กลับ',
  'ENT/CLICK:ACT  X:DROP  F:FILTER  R:SORT':'ENT/คลิก:ใช้  X:ทิ้ง  F:กรอง  R:เรียง',
  'Restores 60% of Max MP.':'ฟื้น MP 60%', 'ATK +25%, Crit +15%, SPD +12% (30s).':'ATK +25% คริ +15% เร็ว +12% (30 วิ)',
  'Teleports back to Ironvale Village.':'วาร์ปกลับหมู่บ้านไอรอนเวล',
  // shop
  'MERCHANT & ANVIL':'พ่อค้าและทั่งตีเหล็ก', 'HP POTION        15G':'ยา HP              15G', '5x HP POTIONS    70G':'ยา HP x5           70G',
  'MANA POTION      20G':'ยา MP              20G', 'HERO ELIXIR      45G':'ยาฮีโร่            45G', 'TOWN SCROLL      30G':'ม้วนวาร์ปกลับเมือง  30G',
  'SELL ALL LOOT':'ขายของดรอปทั้งหมด', 'SELL FROM BAG...':'เลือกขายจากกระเป๋า...', 'CRAFT GEAR...':'คราฟต์อุปกรณ์...', 'LEAVE':'ออกจากร้าน',
  'CRAFT GEAR':'สร้างอุปกรณ์', 'MATERIALS:':'วัตถุดิบที่ใช้:', 'ENT/CLICK:CRAFT  ESC:BACK':'ENT/คลิก:สร้าง  ESC:กลับ',
  'Forge monster loot into special gear.':'หลอมชิ้นส่วนมอนสเตอร์เป็นอุปกรณ์พิเศษ', 'Missing monster materials!':'วัตถุดิบจากมอนสเตอร์ยังไม่ครบ!',
  'TOWN STASH':'คลังเก็บของประจำเมือง', 'STORE':'เก็บเข้าคลัง', 'TAKE':'หยิบใส่กระเป๋า', 'Stash is full!':'คลังเก็บของเต็มแล้ว!',
  'ENT/CLICK:TRANSFER  TAB:SWITCH  ESC:CLOSE':'ENT/คลิก:ย้ายของ  TAB:สลับฝั่ง  ESC:ปิด',
  'That gear cannot get any better!':'ของชิ้นนี้ตีบวกสูงสุดแล้ว!', 'Not enough gold, friend.':'เงินไม่พอนะสหาย',
  'Pleasure doing business!':'ขอบคุณที่อุดหนุน!', 'Your bag is full!':'กระเป๋าเต็มแล้ว!', 'You have no loot to sell.':'ไม่มีของดรอปให้ขาย',
  'Welcome! Fine wares and a sturdy anvil.':'ยินดีต้อนรับ! มีของดีและทั่งตีเหล็กพร้อม',
  // messages
  'Bag is full! Cannot unequip.':'กระเป๋าเต็ม! ถอดไม่ได้', 'MP is already full!':'MP เต็มแล้ว!',
  'Hero Elixir: ATK/CRIT/SPD up for 30s!':'ยาฮีโร่: ATK/คริ/ความเร็ว เพิ่ม 30 วิ!', 'Already in Ironvale Village!':'อยู่ในหมู่บ้านอยู่แล้ว!',
  'Teleported to Ironvale Village!':'วาร์ปกลับหมู่บ้านแล้ว!', 'Sell monster loot to the merchant in town.':'นำของดรอปไปขายพ่อค้าในเมือง',
  'Quest complete! Return to the Elder.':'ทำเควสสำเร็จ! กลับไปหาผู้เฒ่า', 'Bounty complete! Return to Mira.':'ล่าค่าหัวสำเร็จ! กลับไปหามิร่า',
  'Not enough MP!':'MP ไม่พอ!', 'No potions left!':'ยา HP หมดแล้ว!', 'HP is already full.':'HP เต็มแล้ว',
  'Found a Potion!':'เจอยา HP!', 'You climb back to the surface.':'คุณปีนกลับขึ้นสู่พื้นดิน',
  'Your bag is full! Sell at the merchant.':'กระเป๋าเต็ม! ไปขายของที่พ่อค้า', 'Take the stairs back up to the surface.':'ขึ้นบันไดเพื่อกลับสู่พื้นดิน',
  'A cold wind rises from below... (LV 8+ advised)':'ลมเย็นเยียบพัดขึ้นมาจากเบื้องล่าง... (แนะนำ LV 8+)',
  'You feel a terrible presence on this floor.':'คุณรู้สึกถึงพลังน่าสะพรึงบนชั้นนี้',
  'A strange weapon from another world... AK-47!':'อาวุธประหลาดจากต่างโลก... AK-47!',
  'Tossed 10G into the well! HP/MP full & blessed for 30s!':'โยนเหรียญ 10G ลงบ่อน้ำ! ฟื้น HP/MP เต็มและรับพร 30 วิ!',
  'Drank from the well. HP & MP fully restored!':'ดื่มน้ำจากบ่อศักดิ์สิทธิ์ ฟื้นฟู HP และ MP เต็มแล้ว!',
  'Shrine of Fury! Full HP/MP & ATK +60% for 30s!':'แท่นบูชาแห่งความคลั่ง! ฟื้น HP/MP เต็ม และ ATK +60% นาน 30 วิ!',
  'Shrine of Valor! Full HP/MP, Elixir & 100% Crit!':'แท่นบูชาแห่งความกล้า! ฟื้น HP/MP เต็ม พร้อมบัฟยาฮีโร่และคริ 100%!',
  'Shrine of Fortune! Full HP/MP & ancient treasure!':'แท่นบูชาแห่งโชคลาภ! ฟื้น HP/MP เต็ม และได้รับสมบัติโบราณ!',
  'ARENA MASTER':'ผู้คุมลานประลอง', 'COLOSSEUM ARENA!':'ลานประลองโคลอสเซียม!', 'NEXT WAVE SOON...':'เวฟถัดไปกำลังจะมา...',
  'Welcome to the Colosseum! Survive Endless Waves! Step on < to leave.':'ยินดีต้อนรับสู่โคลอสเซียม! เอาชีวิตรอดจากเวฟไร้สิ้นสุด! เหยียบบันได < เพื่อออก',
  'You leave the Colosseum.':'คุณเดินออกจากลานประลองโคลอสเซียม',
  '★ Treasure Champion slain! Bonus spoils!':'★ โค่นแชมเปี้ยนสมบัติสำเร็จ! รับทองและไอเทมโบนัส!',
  '★ Abyssal Guardian Defeated! The rift stirs...':'★ ผู้พิทักษ์อเวจีถูกกำจัดแล้ว! มิติกำลังสั่นไหว...',
  'You step through the rift portal back to the village.':'คุณก้าวผ่านประตูมิติกลับสู่หมู่บ้าน',
  'The cosmic fabric is tearing apart... Beyond this swirling rift lies the infinite Abyss.':
    'โครงสร้างแห่งจักรวาลกำลังฉีกขาด... เบื้องหลังรอยแยกที่หมุนวนนี้คือห้วงอเวจีไร้ที่สิ้นสุด',
  'Each depth is darker and more treacherous than the last, warped by shifting cosmic anomalies.':
    'แต่ละระดับความลึกจะยิ่งมืดมิดและอันตราย บิดเบี้ยวไปด้วยปรากฏการณ์จักรวาลที่ผันแปร',
  'Step onto the Abyssal Rift (V) when you are prepared. May the stars guide your blade.':
    'ก้าวเข้าสู่รอยแยกอเวจี (V) เมื่อเจ้าพร้อม ขอให้ดวงดารานำทางคมดาบของเจ้า',
  'Waves grow stronger and every 5th wave unleashes a Boss! Step on the stairs (<) anytime to leave with your spoils.':
    'ศัตรูจะเก่งขึ้นทุกเวฟ และทุกๆ เวฟที่ 5 จะมีบอสปรากฏตัว! เหยียบบันได (<) ได้ตลอดเวลาเพื่อพารางวัลกลับออกไป',
  // dialog
  'Talk to me when you see a ! over my head. Mira the hunter posts bounties, and the merchant buys your loot.':
    'มาคุยกับข้าเมื่อเห็นเครื่องหมาย ! บนหัว มิร่านักล่าจะมีงานล่าค่าหัวให้ ส่วนพ่อค้าจะรับซื้อของดรอปของเจ้า',
  'At LV 2 and LV 5 you will learn class skills: press K and L. Press T to train them.':
    'เมื่อถึง LV 2 และ LV 5 เจ้าจะได้สกิลประจำอาชีพ กด K และ L เพื่อใช้ และกด T เพื่ออัปสกิล',
  'Ironvale is at peace thanks to you, hero. Mira still pays for monster bounties if you want work.':
    'ไอรอนเวลสงบสุขได้เพราะเจ้า ผู้กล้า ถ้าอยากได้งานเพิ่ม มิร่ายังรับจ้างล่ามอนอยู่นะ',
  'Need coin? I pay for every beast you put down out there.':'อยากได้เงินไหม? ข้าจ่ายให้ทุกตัวที่เจ้าล่าได้',
  'Slimes are eating our crops in the Meadow east of here. Please slay 5 of them.':'สไลม์กำลังกินพืชผลในทุ่งหญ้าทางตะวันออก ช่วยกำจัดให้ 5 ตัวที',
  'The fields are safe again. Take this, with my thanks.':'ทุ่งนาปลอดภัยแล้ว รับนี่ไปเป็นการขอบคุณ',
  'Winter is coming. Bring me 3 Wolf Pelts from the Dark Forest across the river.':'ฤดูหนาวใกล้มาแล้ว เอาหนังหมาป่า 3 ผืนจากป่ามืดฝั่งแม่น้ำมาให้ข้าที',
  'Fine pelts! The children will be warm this winter.':'หนังชั้นดี! เด็กๆ จะได้อบอุ่นในหน้าหนาวนี้',
  'Goblins raided our caravan in the Dark Forest. Teach 6 of them a lesson.':'ก็อบลินปล้นกองคาราวานในป่ามืด ไปสั่งสอนพวกมันสัก 6 ตัว',
  'They will think twice now. Take this gear from my old adventuring days.':'คราวนี้พวกมันคงเข็ด รับอุปกรณ์จากสมัยผจญภัยของข้าไปเถอะ',
  'Strange lights glow in the Old Ruins far to the east. Go and see what lurks there.':'มีแสงประหลาดในซากปรักหักพังทางตะวันออกไกล ไปดูหน่อยว่ามีอะไรซ่อนอยู่',
  'Skeletons walk again? Dark magic is at work...':'โครงกระดูกเดินได้อีกแล้วหรือ? มีเวทมนตร์มืดอยู่เบื้องหลังแน่...',
  'Put 8 of those restless skeletons back to sleep.':'ส่งโครงกระดูกที่ไม่ยอมหลับใหล 8 ตัว กลับไปนอนซะ',
  'You grow stronger every day. I am proud of you.':'เจ้าแข็งแกร่งขึ้นทุกวัน ข้าภูมิใจในตัวเจ้า',
  'The Orc Warlord commands the dead from the heart of the ruins. End him, and Ironvale is free.':'จอมทัพออร์คบัญชาการคนตายจากใจกลางซากปรักหักพัง ปราบมันซะ แล้วไอรอนเวลจะเป็นอิสระ',
  'You did it! Songs will be sung of you. Take this treasure, hero.':'เจ้าทำได้! ผู้คนจะขับขานถึงเจ้า รับสมบัตินี้ไปเถิด ผู้กล้า',
  'The dead still stir... A stairway in the Old Ruins leads to an ancient crypt. On its third floor sleeps the Lich King. Destroy him.':
    'คนตายยังไม่สงบ... บันไดในซากปรักหักพังนำไปสู่สุสานโบราณ ราชาลิชหลับใหลอยู่ชั้นที่ 3 จงทำลายมัน',
  'The curse is broken at last. You are the true hero of Ironvale!':'คำสาปถูกทำลายแล้ว เจ้าคือวีรบุรุษตัวจริงของไอรอนเวล!',
  'A mystic portal opened north of the Meadow, leading to Frostpeak Pass. Slay 5 Yetis to secure the mountain trail.':
    'ประตูมิติทางเหนือของทุ่งหญ้าเปิดออกสู่ช่องเขาฟรอสต์พีค จงกำจัดเยติ 5 ตัวเพื่อเปิดทางเดินบนภูเขา',
  'Even the mountain beasts bow to your might! Prepare yourself for what rules the peak.':
    'แม้แต่สัตว์อสูรแห่งขุนเขายังสยบต่อพลังของเจ้า! จงเตรียมพร้อมรับมือสิ่งที่ครองยอดเขานั้น',
  'At the summit of Frostpeak nests the ancient Frost Wyrm. Slay the beast before its blizzard buries Ironvale!':
    'บนยอดเขาฟรอสต์พีคคือรังของมังกรน้ำแข็งบรรพกาล จงสังหารมันก่อนที่พายุหิมะจะฝังหมู่บ้านไอรอนเวล!',
  'Incredible! You have slain a dragon of legend. Yet a fiery tremor now shakes the southern forest...':
    'เหลือเชื่อมาก! เจ้าสังหารมังกรในตำนานได้สำเร็จ แต่ตอนนี้กลับมีแรงสั่นสะเทือนเพลิงปะทุขึ้นทางใต้ของป่ามืด...',
  'A fiery rift in the southern Dark Forest leads to Emberfall Crater. Defeat the Infernal Lord at its heart!':
    'รอยแยกเพลิงทางใต้ของป่ามืดนำไปสู่ปากปล่องเอมเบอร์ฟอล จงโค่นจอมอสูรเพลิงโลกันตร์ที่ใจกลางปล่องภูเขาไฟ!',
  'Ice and fire alike have fallen before you. Your name will echo through eternity, Champion of Ironvale!':
    'ทั้งน้ำแข็งและเปลวเพลิงต่างสยบแทบเท้าเจ้า นามของเจ้าจะถูกจารึกไปชั่วนิรันดร์ แชมเปี้ยนแห่งไอรอนเวล!',
  // guard tips
  'Cross the river by the main road, or the small bridges to the north and south.':'ข้ามแม่น้ำได้ทางถนนใหญ่ หรือสะพานเล็กทางเหนือและใต้',
  'Wolves are fast. Do not try to outrun them, stand and fight!':'หมาป่าวิ่งเร็ว อย่าคิดหนี ยืนสู้ซะ!',
  'The merchant pays well for loot. Sell often and upgrade your gear at his anvil.':'พ่อค้าให้ราคาดี ขายของบ่อยๆ แล้วตีบวกอุปกรณ์ที่ทั่งของเขา',
  'Rest inside the village walls. Your wounds and mana heal quickly here.':'พักในกำแพงหมู่บ้าน HP และ MP จะฟื้นเร็ว',
  'They say the Orc Warlord slams the ground. Step back when you see the red ring!':'ว่ากันว่าจอมทัพออร์คกระแทกพื้น เห็นวงแดงเมื่อไหร่ให้ถอยออกมา!',
  'A stairway in the Old Ruins leads down to a dark crypt. Its chests hold great treasure.':'บันไดในซากปรักหักพังนำลงไปสู่สุสานมืด หีบในนั้นมีสมบัติล้ำค่า',
  'Press T to open your skill tree. Every level gives you a skill point.':'กด T เพื่อเปิดหน้าสกิล ทุกเลเวลจะได้แต้มสกิล',
  'Hunters whisper of a trail in the Dark Forest that ends at a pine... that is not really a pine.':'นักล่ากระซิบกันถึงทางเดินในป่ามืดที่ไปสิ้นสุดที่ต้นสน... ซึ่งไม่ใช่ต้นสนจริงๆ',
  'Mystic portals north of the Meadow and south of the Dark Forest lead to Frostpeak and Emberfall.':
    'ประตูมิติทางเหนือของทุ่งหญ้าและทางใต้ของป่ามืดนำไปสู่ช่องเขาฟรอสต์พีคและปากปล่องเอมเบอร์ฟอล',
};

TH_RX = [
  [/^RAIDERS (\d+)\/(\d+)$/, 'ผู้ร่วมตี $1/$2'],
  [/^(.+) was knocked out!$/, '$1 ถูกน็อก!'],
  // HUD / screens
  [/^\+(\d+) SKILL PT \[T\]$/, '+$1 แต้มสกิล [T]'],
  [/^Hunt (.+) (\d+)\/(\d+)$/, (_, m, a, b) => `ล่า${trName(m)} ${a}/${b}`],
  [/^CRYPT B(\d+)$/i, 'สุสานใต้ดิน ชั้น $1'], [/^CRYPT  FLOOR (\d+)$/, 'สุสานใต้ดิน ชั้น $1'],
  [/^SAVE: LV (\d+)  (\d+)G$/, 'เซฟ: LV $1  $2G'], [/^Lost (\d+) gold$/, 'เสียเงิน $1G'],
  [/^POINTS (\d+)$/, 'แต้ม $1'], [/^NEEDS LV (\d+)$/, 'ต้องการ LV $1'], [/^GOLD (\d+)G$/, 'เงิน $1G'],
  [/^GOLD (\d+)G   HP POTIONS (\d+)$/, 'เงิน $1G   ยา HP $2'], [/^SELL (\d+)$/, 'ขาย $1'], [/^BAG (\d+)\/(\d+)$/, 'กระเป๋า $1/$2'],
  [/^STASH (\d+)\/(\d+)$/, 'คลัง $1/$2'], [/^CRAFT \((\d+)G\)$/, 'สร้าง ($1G)'],
  [/^LIFESTEAL \+(\d+)%$/, 'ดูดเลือด +$1%'], [/^FROST TOUCH \+(\d+)%$/, 'ติดแช่แข็ง +$1%'],
  [/^CRIT RATE \+(\d+)%$/, 'อัตราคริ +$1%'], [/^SKILL HASTE \+(\d+)%$/, 'ลดคูลดาวน์สกิล +$1%'],
  [/^GOLD FIND \+(\d+)%$/, 'ได้เงินเพิ่ม +$1%'], [/^THORNS \+(\d+)%$/, 'สะท้อนดาเมจ +$1%'],
  [/^Crafted (.+)!$/, 'สร้าง $1 สำเร็จ!'],
  [/^FOUND (\d+)\/(\d+)   ★ (\d+)\/(\d+)$/, 'ค้นพบ $1/$2   ★ $3/$4'],
  [/^SLAIN: (\d+)$/, 'สังหารแล้ว: $1 ตัว'], [/^MASTERY: (\d+)\/(\d+)$/, 'ความชำนาญ: $1/$2'],
  [/^HP (\d+)   ATK (\d+)   DEF (\d+)$/, 'HP $1   ATK $2   DEF $3'],
  [/^XP (\d+)   GOLD (\d+)-(\d+)G$/, 'XP $1   เงิน $2-$3G'],
  [/^(.+) \((\d+)%\)$/, (_, n, r) => `${trName(n)} (${r}%)`],
  [/^GEAR DROP: (\d+)%$/, 'โอกาสดรอปอุปกรณ์: $1%'],
  [/^★ Mastery: (.+)! \(\+15% DMG\)$/, (_, n) => `★ ปลดล็อกความชำนาญ: ${trName(n)}! (ดาเมจ +15%)`],
  [/^(\w+) LV(\d+)$/, (_, c, l) => `${trName(c)} LV${l}`],
  [/^ATK (\d+)  DEF (\d+)  CRT (\d+)%  SPD \+(\d+)%$/, 'ATK $1  DEF $2  คริ $3%  เร็ว +$4%'],
  [/^(COMMON|FINE|RARE|EPIC|LEGEND) (\w+)( \(EQ\))?$/, (_, r, s, eq) => `${RARITY_TH[r]} ${s}${eq ? ' (สวมอยู่)' : ''}`],
  [/^MAX HP \+(\d+)$/, 'HP สูงสุด +$1'], [/^MOVE SPD \+(\d+)%$/, 'ความเร็ว +$1%'], [/^VALUE (\d+)G$/, 'ราคา $1G'],
  [/^(\w+) ONLY$/, (_, c) => `เฉพาะ${trName(c.charAt(0) + c.slice(1).toLowerCase())}`],
  [/^EMPTY (\w+) SLOT$/, 'ช่อง $1 ว่าง'],
  [/^< ANVIL \[(\w+)\] (.+) >$/, '< ตีบวก [$1] $2 >'],
  [/^< REROLL \[(\w+)\] (.+) >$/, '< สุ่มออปชัน [$1] $2 >'],
  [/^Enchanted (.+): (.+)!$/, 'สุ่มออปชัน $1 สำเร็จ: $2!'],
  [/^COLOSSEUM W(\d+)$/i, 'โคลอสเซียม เวฟ $1'],
  [/^WAVE (\d+)!$/i, 'เวฟที่ $1!'],
  [/^WAVE (\d+)   BEST W(\d+)$/, 'เวฟ $1   สถิติสูงสุด W$2'],
  [/^ABYSSAL RIFT D(\d+)  \[BEST (\d+)\]$/, 'รอยแยกอเวจี ชั้น $1  [สถิติ $2]'],
  [/^ABYSSAL RIFT D(\d+)$/i, 'รอยแยกอเวจี ชั้น $1'],
  [/^Abyssal Rift D(\d+)$/i, 'รอยแยกอเวจี ชั้น $1'],
  [/^RIFT D(\d+)$/i, 'รอยแยก ชั้น $1'],
  [/^Every 5th depth awakens an Abyssal Guardian with untold treasures\. Deepest descent: Depth (\d+)\.$/,
    'ทุกๆ ระดับความลึกที่ 5 จะมีผู้พิทักษ์อเวจีพร้อมสมบัติล้ำค่า สถิติดำดิ่งลึกสุด: ชั้น $1'],
  [/^FOES LEFT: (\d+)$/, 'ศัตรูที่เหลือ: $1'],
  [/^★ Wave (\d+) Cleared! \+(\d+)G \+(\d+)XP \(Best: W(\d+)\)$/, '★ ผ่านเวฟ $1! +$2G +$3XP (สถิติ: W$4)'],
  [/^Hail, gladiator! Test your might in the Endless Colosseum! \(Best Wave: (\d+)\)$/,
    'คารวะนักสู้! มาทดสอบฝีมือในโคลอสเซียมไร้สิ้นสุดสิ! (สถิติสูงสุด: เวฟ $1)'],
  [/^Companion: (.+) — (.+)$/, 'สัตว์เลี้ยงคู่หู: $1 — $2'],
  [/^(.+)  (\d+)\/(\d+)$/, (_, n, a, b) => `${trName(n)}  ${a}/${b}`],
  [/^(.+)\+$/, (_, n) => `${trName(n)}+`],
  [/^AMMO (\d+)\/(\d+) \[R\]$/, 'กระสุน $1/$2 [R]'],
  [/^MAG (\d+)   RLD (.+)s$/, 'แม็ก $1 นัด   รีโหลด $2 วิ'],
  [/^-(\d+) WIRE$/, '-$1 ลวดหนาม'],
  [/^-(\d+) TOXIC$/, '-$1 พิษชีวภาพ'],
  [/^(.+) deals \+25% damage per rank\.$/, (_, n) => `${trName(n)} แรงขึ้น +25% ต่อขั้น`],
  [/^(.+) cooldown -20% & firearm reload time -12% per rank\.$/, (_, n) => `${trName(n)} คูลดาวน์ -20% และรีโหลดไวขึ้น 12% ต่อขั้น`],
  [/^(.+) cooldown -20% per rank\.$/, (_, n) => `${trName(n)} คูลดาวน์ -20% ต่อขั้น`],
  [/^LV (\d+)\/(\d+)$/, 'เลเวล $1/$2'], [/^NEEDS PLAYER LV (\d+)$/, 'ต้องการเลเวลตัวละคร $1'],
  [/^UNLOCKS AT LV (\d+)$/, 'ปลดล็อกที่ LV $1'],
  // shop messages
  [/^No (\w+) equipped\. Use < > to pick slot\.$/, 'ยังไม่ได้สวม $1 กด < > เพื่อเลือกช่อง'],
  [/^Hammered into (.+)!$/, 'ตีบวกสำเร็จ: $1!'], [/^Bought (.+)!$/, (_, n) => `ซื้อ${trName(n)}แล้ว!`],
  [/^Sold all loot for (\d+)G\.$/, 'ขายของดรอปทั้งหมดได้ $1G'], [/^Sold (.+) for (\d+)G\.$/, (_, n, g) => `ขาย ${trName(n)} ได้ ${g}G`],
  // messages
  [/^Only a (\w+) can use that\.$/, (_, c) => `เฉพาะ${trName(c.charAt(0) + c.slice(1).toLowerCase())}ที่ใช้ได้`],
  [/^Dropped (.+)$/, (_, n) => `ทิ้ง ${trName(n)} แล้ว`],
  [/^\+(\d+) Potions$/, '+$1 ยา HP'], [/^Received (.+)!$/, (_, n) => `ได้รับ ${trName(n)}!`],
  [/^Got (.+?)!?$/, (_, n) => `ได้รับ ${trName(n)}`], [/^Found (.+)!$/, (_, n) => `พบ ${trName(n)}!`],
  [/^(.+) unlocks at LV (\d+)$/, (_, n, l) => `${trName(n)} ปลดล็อกที่ LV ${l}`],
  [/^LEVEL UP! LV (\d+)  \+(\d+) skill points? \(T\)$/, 'เลเวลอัป! LV $1  +$2 แต้มสกิล (T)'],
  [/^ACHIEVEMENT UNLOCKED: (.+)!$/, (_, n) => `★ ปลดล็อกความสำเร็จ: ${trName(n)}!`],
  [/^Equipped Title: \[(.+)\]!$/, (_, n) => `สวมใส่ฉายา: [${trName(n)}]!`],
  [/^\[(.+)\]$/, (_, n) => `[${trName(n)}]`],
  [/^The (.+) has fallen!$/, (_, n) => `${trName(n)} ถูกโค่นแล้ว!`],
  [/^Dangerous area! \(LV (\d+)\+ advised\)$/, 'พื้นที่อันตราย! (แนะนำ LV $1+)'],
  [/^(.+) reached LV (\d+)!$/, (_, n, l) => `${trName(n)} อัปเป็น Lv${l}!`],
  [/^(.+) (\d+)\/(\d+)$/, (_, n, a, b) => `${trName(n)} ${a}/${b}`],
  [/^(.+) x(\d+)$/, (_, n, c) => `${trName(n)} x${c}`],
  // dialog
  [/^Welcome, young (\w+)! I am Brann, elder of Ironvale\. Monsters plague the lands east of our village\.$/,
    (_, c) => `ยินดีต้อนรับ ${trName(c.charAt(0).toUpperCase() + c.slice(1))}หนุ่ม! ข้าคือแบรนน์ ผู้เฒ่าแห่งไอรอนเวล มอนสเตอร์กำลังอาละวาดทางตะวันออกของหมู่บ้าน`],
  [/^NEW QUEST: (.+?)\. (.+?)\. Reward: (\d+)G, (\d+) XP\.$/, (_, n, g, gold, xp) => `เควสใหม่: ${trName(n)} — ${goalTH(g)} รางวัล ${gold}G, ${xp} XP`],
  [/^(.+)\. Progress: (\d+)\/(\d+)\. Do not give up!$/, (_, g, a, b) => `${goalTH(g)} ความคืบหน้า ${a}/${b} อย่ายอมแพ้!`],
  [/^BOUNTY: Slay (\d+) (.+)\. Reward: (\d+)G, (\d+) XP\.$/, (_, n, m, g, x) => `ค่าหัว: กำจัด${trName(m)} ${n} ตัว รางวัล ${g}G, ${x} XP`],
  [/^Clean work! Here is your (\d+)G\. Come back for more\.$/, 'ฝีมือดี! นี่ค่าจ้าง $1G แวะมาอีกนะ'],
  [/^Still hunting\? (.+): (\d+)\/(\d+)\.$/, (_, m, a, b) => `ยังล่าอยู่หรือ? ${trName(m)}: ${a}/${b}`],
];

// ---- Zombie invasion (invasion.js) ----
Object.assign(TH, {
  'ZOMBIE INVASION!': 'ซอมบี้บุก!', 'INVASION REPELLED!': 'ต้านการบุกสำเร็จ!',
  'Sirens! A zombie horde is marching on the base from the east!': 'ไซเรนดัง! ฝูงซอมบี้กำลังบุกฐานมาจากทางตะวันออก!',
  'Soldiers are moving to defensive positions!': 'ทหารกำลังเข้าประจำที่มั่นป้องกัน!',
  'The horde broke through the base wall!': 'ซอมบี้พังกำแพงเข้าฐานแล้ว!',
  'The horde smashed a hole in the wall!': 'ซอมบี้พังกำแพงจนเป็นรูแล้ว!',
  'The engineers have rebuilt every wall.': 'ทหารช่างซ่อมกำแพงครบทุกจุดแล้ว',
  'BOSS INCOMING!': 'บอสบุกมาแล้ว!', 'WEST TUNNEL': 'อุโมงค์ฝั่งตะวันตก', 'HUMVEE M2': 'ฮัมวี่ M2', 'AH-64D APACHE': 'เฮลิคอปเตอร์ AH-64D อาปาเช่', 'DESTROYED': 'ถูกทำลาย',
  'Motor pool: Humvee gun trucks and two more Abrams are rolling out! Apache lifting off!': 'ยานยนต์: ฮัมวี่ติดป้อมปืนและรถถังเอบรามส์อีก 2 คันกำลังออก! อาปาเช่กำลังขึ้นบิน!',
  'A Humvee gun truck has been destroyed!': 'ฮัมวี่ติดป้อมปืนถูกทำลาย!',
  'The recovery truck has been destroyed! Another one will be sent.': 'รถลากกู้ซากถูกทำลาย! จะส่งคันใหม่ออกไป',
  'A medic team has been wiped out!': 'ทีมแพทย์สนามถูกฆ่าหมดทั้งทีม!', 'The Apache is down!': 'อาปาเช่ตกแล้ว!', "Apache hit! It's going down!": 'อาปาเช่ถูกยิง! กำลังตก!',
  'An M198 howitzer has been destroyed!': 'ปืนใหญ่ M198 ถูกทำลาย!', 'A replacement M198 howitzer has been towed into position.': 'ปืนใหญ่ M198 กระบอกใหม่ถูกลากเข้าที่แล้ว', 'REINFORCEMENTS!': 'กำลังเสริมมาแล้ว!', 'FPV LAUNCH!': 'ปล่อยโดรน FPV!',
  'Artillery: fire for effect on the river line!': 'ปืนใหญ่: ยิงสนับสนุนแนวริมแม่น้ำ!', 'UI HIDDEN · PRESS U TO SHOW': 'ซ่อน UI แล้ว · กด U เพื่อแสดง',
  'M198 HOWITZER': 'ปืนใหญ่ M198', 'FIRE MISSION!': 'ยิงสนับสนุน!', 'WORLD BOSS JOINS THE HORDE!': 'บอสโลกบุกมากับฝูงซอมบี้!', 'BREACH!': 'กำแพงพัง!', 'REPAIRED!': 'ซ่อมเสร็จ!', 'REPAIRING': 'กำลังซ่อม',
  'The horde dispersed back into the wastes.': 'ฝูงซอมบี้ถอยกลับไปแล้ว',
  'Soldier down! MEDIC!': 'ทหารบาดเจ็บ! หน่วยแพทย์!',
  'IN POSITION!': 'เข้าที่แล้ว!', 'DEPLOYING': 'กำลังตั้งป้อม', 'CLIMB!': 'ปีน!',
});
TH_RX.push(
  [/^ZOMBIE INVASION IN (\d+)s$/, 'ซอมบี้จะบุกใน $1 วินาที'],
  [/^INVASION · WAVE (\d+)\/(\d+) · (\d+) LEFT$/, 'ซอมบี้บุก · ระลอก $1/$2 · เหลือ $3 ตัว'],
  [/^WAVE (\d+)!$/, 'ระลอกที่ $1!'],
  [/^(.+)  \((\d+) BOSSES\)$/, (_, n, k) => `${trName(n)}  (บอส ${k} ตัว)`],
  [/^ZOOM (\d+)%$/, 'ซูม $1%'],
  [/^Reinforcements: (\d+) soldiers are moving up to the line!$/, 'กำลังเสริม: ทหาร $1 นายกำลังเข้าแนวรบ!'],
  [/^(.+) is leading the horde!$/, (_, n) => `${trName(n)} นำฝูงซอมบี้บุกมา!`],
  [/^Combat engineers are heading out to repair (\d+) wall sections\.$/, 'ทหารช่างกำลังออกไปซ่อมกำแพง $1 จุด'],
  [/^The horde was repelled! \+(\d+)G \+(\d+) XP$/, 'ต้านฝูงซอมบี้ได้แล้ว! +$1G +$2 XP'],
);

// ---- expansion sectors ----
Object.assign(TH_NAMES, {
  'Sector 4: Abandoned Airfield': 'เซกเตอร์ 4: สนามบินร้าง',
  'Sector 5: Quarantine Hospital': 'เซกเตอร์ 5: โรงพยาบาลกักกันเชื้อ',
  'Sector 6: Dead Farmland': 'เซกเตอร์ 6: ไร่นาร้าง',
  'Sector 7: Flooded District': 'เซกเตอร์ 7: ย่านน้ำท่วม',
  'Sector 8: Harbor Docks': 'เซกเตอร์ 8: ท่าเรือ',
});
for (const k of Object.keys(TH_NAMES)) if (k.startsWith('Sector ') && !TH_NAMES[k.toUpperCase()]) TH_NAMES[k.toUpperCase()] = TH_NAMES[k];
TH_NAMES['Perimeter Field (Safe Zone)'] = TH_NAMES['PERIMETER FIELD (SAFE ZONE)'] = 'ลานรอบฐาน (เขตปลอดภัย)';

// ---- Survivor Farm ----
TH_NAMES['Survivor Farm (Safe Zone)'] = TH_NAMES['SURVIVOR FARM (SAFE ZONE)'] = 'ฟาร์มผู้รอดชีวิต (เขตปลอดภัย)';
Object.assign(TH_NAMES, {
  'FARMER BEN': 'ชาวไร่เบน', 'FARMER MALI': 'ชาวไร่มะลิ', 'GROWER DANG': 'คนปลูกผักแดง', 'GROWER NOK': 'คนปลูกผักนก',
  'ORCHARD KEEPER JO': 'คนดูแลสวนผลไม้โจ', 'FARMER LEK': 'ชาวไร่เล็ก', 'BARN HAND TAN': 'คนงานโรงนาตาล', 'FARM MILITIA': 'ทหารอาสาประจำฟาร์ม',
});
Object.assign(TH, {
  'The fields feed the whole base. Every sack of grain goes to the mess hall at FOB Ironvale.': 'ไร่นี้เลี้ยงคนทั้งฐาน ข้าวทุกกระสอบส่งไปโรงอาหารที่ฐาน FOB Ironvale',
  'Zombies cannot cross our fence. The militia at the bridge keeps the city crawlers out.': 'ซอมบี้ข้ามรั้วเราไม่ได้หรอก ทหารอาสาที่สะพานคอยกันพวกตัวคลานจากในเมืองไว้',
  'The greenhouses grow tomatoes and greens all year, even when the toxic rain comes.': 'โรงเรือนปลูกมะเขือเทศกับผักได้ทั้งปี ต่อให้ฝนพิษตกก็ไม่เป็นไร',
  'The orchard trees survived the outbreak. We still pick apples every harvest.': 'ต้นไม้ในสวนรอดจากการระบาดมาได้ ทุกฤดูเก็บเกี่ยวเรายังได้เก็บแอปเปิลอยู่',
  'The tractor runs on diesel salvaged from the airfield. Do not tell the Quartermaster!': 'รถไถคันนี้ใช้ดีเซลที่ไปเก็บมาจากสนามบิน อย่าบอกผู้กองฝ่ายเสบียงนะ!',
  'Rest here if you are hurt, soldier. Nothing gets past the farm fence.': 'บาดเจ็บก็พักที่นี่ก่อนนะทหาร ไม่มีอะไรผ่านรั้วฟาร์มเข้ามาได้หรอก',
});
// ---- Base construction (build.js) ----
TH_NAMES['Scrap'] = TH_NAMES['SCRAP'] = 'เศษเหล็ก';
Object.assign(TH_NAMES, {
  'Sandbags': 'แนวกระสอบทราย', 'Razor Wire': 'รั้วลวดหนามใบมีด', 'HESCO Wall': 'กำแพงบล็อก HESCO', 'Steel Wall': 'กำแพงเหล็ก',
  'Sentry Gun .50': 'ป้อมปืนกลอัตโนมัติ .50', 'Flame Trap': 'กับดักไฟ', 'Acid Trap': 'กับดักกรด', 'Ammo Cache': 'คลังกระสุน', 'Searchlight': 'ไฟสปอตไลท์',
});
Object.assign(TH, {
  'BUILD MODE': 'โหมดสร้างฐาน', 'BUILD MODE: ON': 'โหมดสร้างฐาน: เปิด', 'BUILD MODE: OFF': 'โหมดสร้างฐาน: ปิด',
  'Y:MEDALS  X  N': 'Y:เหรียญ  X  N', 'X: REMOVE': 'X: รื้อถอน', 'AMMO FULL!': 'กระสุนเต็ม!',
  '1-9 Q E: PICK · SPACE/CLICK: BUILD · X/RIGHT-CLICK: REMOVE · B: EXIT': '1-9 Q E: เลือก · SPACE/คลิก: สร้าง · X/คลิกขวา: รื้อ · B: ออก',
  'You can only build in the main world.': 'สร้างได้เฉพาะในโลกหลักเท่านั้น',
  'Only in the main world': 'สร้างได้เฉพาะโลกหลัก', 'Out of bounds': 'นอกเขตแผนที่', 'Too far away': 'ไกลเกินไป', 'Blocked': 'มีสิ่งกีดขวาง',
  'You are standing there': 'คุณยืนทับอยู่', 'Someone is in the way': 'มีคนขวางอยู่', 'Build limit reached': 'สร้างครบจำนวนสูงสุดแล้ว',
  'Sentry limit reached': 'ป้อมปืนครบจำนวนสูงสุดแล้ว', 'Not enough scrap': 'เศษเหล็กไม่พอ', 'Not enough gold': 'เงินไม่พอ', 'Nothing to remove here': 'ไม่มีอะไรให้รื้อตรงนี้',
  'Cover: -30% damage taken next to it. Zombies crossing slow down.': 'ที่กำบัง: ยืนข้างๆ รับดาเมจลดลง 30% ซอมบี้ที่เดินข้ามจะช้าลง',
  'Zombies on the wire bleed and move 50% slower.': 'ซอมบี้ที่เหยียบจะเลือดไหลและเดินช้าลง 50%',
  'Blocks the path. Zombies must smash through it.': 'ขวางทางเดิน ซอมบี้ต้องทุบทำลายก่อนจึงจะผ่านได้',
  'Armoured wall. Takes a horde a long time to break.': 'กำแพงหุ้มเกราะ ฝูงซอมบี้ต้องใช้เวลานานกว่าจะพังได้',
  'Turns and fires on zombies within range.': 'หมุนเล็งและยิงสาดใส่ซอมบี้ที่เข้ามาในระยะ',
  'Burns every zombie that comes close. Put it in a chokepoint.': 'เผาซอมบี้ทุกตัวที่เข้าใกล้ วางไว้ตามจุดคอขวด',
  'Sprays acid: damage over time and 50% slow.': 'พ่นกรด: ดาเมจต่อเนื่องและทำให้ช้าลง 50%',
  'Stand next to it to refill your magazine instantly.': 'ยืนข้างๆ เพื่อเติมกระสุนให้เต็มทันที',
  'Lights up the area around it at night.': 'ส่องสว่างพื้นที่รอบๆ ในเวลากลางคืน',
});
TH_RX.push(
  [/^(\d+) SCRAP$/, '$1 เศษเหล็ก'], [/^\+(\d+) SCRAP$/, '+$1 เศษเหล็ก'], [/^\+(\d+) SCRAP \+(\d+)G$/, '+$1 เศษเหล็ก +$2G'],
  [/^(.+) destroyed!$/, (m, n) => `${trName(n)} ถูกทำลาย!`],
);
// ---- Abandoned city (world.js) ----
TH['Recon scouts whisper of a hidden weapons cache walled up behind a cracked brick wall in the warehouse district.'] =
  'หน่วยลาดตระเวนกระซิบกันว่ามีคลังอาวุธลับถูกก่อกำแพงปิดไว้หลังผนังอิฐร้าวในย่านโกดัง';
// ---- Tank recovery & the fallen (recovery.js) ----
Object.assign(TH, {
  'Soldier down! KIA!': 'ทหารเสียชีวิตแล้ว!',
  'M1A1 Abrams knocked out! Recovery truck on the way.': 'รถถัง M1A1 ถูกทำลาย! รถกู้ภัยกำลังไปลาก',
  'Recovery truck dispatched from the motor pool.': 'รถลากออกจากโรงซ่อมบำรุงแล้ว',
  'Tank repaired! Rolling back to its post.': 'ซ่อมรถถังเสร็จแล้ว! กำลังกลับเข้าประจำจุด',
  'KNOCKED OUT': 'ถูกทำลาย', 'HOOKING UP': 'กำลังเกี่ยวสลิง', 'REPAIRING': 'กำลังซ่อม',
});
// ---- BTR-80 patrols (patrol.js) ----
Object.assign(TH, { 'SECURING AREA': 'กำลังเคลียร์พื้นที่', 'ON PATROL': 'กำลังลาดตระเวน', 'SEARCHING': 'กำลังค้นหา', 'LOOT!': 'เก็บของได้!' });
TH_RX.push(
  [/^NEXT PATROL (\d+)s$/, 'ออกลาดตระเวนใน $1 วิ'],
  [/^(BTR-80 \w+) heading out on patrol to sweep the city\.$/, '$1 ออกลาดตระเวนกวาดล้างในเมือง'],
  [/^(BTR-80 \w+) is back: \+(\d+) scrap, \+(\d+)G(, \+(\d+) medkit)?(, (\d+) item\(s\) to the supply locker)?$/,
    (m, n, s, g, _a, pot, _b, it) => `${n} กลับฐานแล้ว: +${s} เศษเหล็ก +${g}G${pot ? ` +${pot} ชุดปฐมพยาบาล` : ''}${it ? ` ของ ${it} ชิ้นเข้าตู้เก็บของ` : ''}`],
  [/^(.+) knocked out! Recovery truck on the way\.$/, '$1 ถูกทำลาย! รถกู้ภัยกำลังไปลาก'],
);
// ---- Night frenzy (gameplay.js) ----
Object.assign(TH, {
  'NIGHTFALL': 'ค่ำแล้ว', 'FRENZY': 'คลั่ง',
  'Night falls: the infected are frenzied! Tougher, faster and deadlier until dawn.': 'ตกกลางคืนแล้ว! ซอมบี้คลั่ง ทนทาน เร็ว และโหดขึ้นจนกว่าจะเช้า',
  'Dawn breaks. The infected slow down again.': 'รุ่งเช้าแล้ว ซอมบี้กลับมาช้าลง',
});
// ---- QRF reinforcements (patrol.js) ----
Object.assign(TH, {
  'REINFORCING': 'กำลังเสริมกำลัง', 'RETURNING TO BASE': 'กำลังกลับฐาน', 'QRF EN ROUTE': 'กำลังเสริมกำลังเดินทาง', 'HOLDING: WAITING FOR QRF': 'ตั้งรับ: รอกำลังเสริม',
  'REINFORCED!': 'กำลังเสริมมาถึง!', 'The QRF is back at base.': 'หน่วยกำลังเสริมกลับถึงฐานแล้ว',
  'Reinforcements can only be sent in the main world.': 'ส่งกำลังเสริมได้เฉพาะในโลกหลัก', 'The QRF is already deployed.': 'หน่วยกำลังเสริมออกปฏิบัติการอยู่แล้ว',
  'No patrol is out in the field.': 'ไม่มีหน่วยลาดตระเวนอยู่นอกฐาน',
});
TH_RX.push(
  [/^(.+) requests reinforcements! Press F to send the QRF\.$/, '$1 ขอกำลังเสริม! กด F เพื่อส่งหน่วย QRF'],
  [/^QRF dispatched to (.+)! Hold on!$/, 'ส่งหน่วย QRF ไปช่วย $1 แล้ว! ประคองไว้ก่อน!'],
  [/^QRF has reached (.+)\.$/, 'หน่วย QRF ถึง $1 แล้ว'],
  [/^The QRF is rearming: ready in (\d+)s\.$/, 'หน่วย QRF กำลังเตรียมพร้อม: อีก $1 วินาที'],
  [/^BTR-80 (\w+) is not out in the field\.$/, 'BTR-80 $1 ไม่ได้อยู่นอกฐาน'],
);
// ---- Airstrikes & stronger horde (airstrike.js / gameplay.js) ----
TH_RX.push(
  [/^(.+) called in an airstrike on a zombie horde!$/, '$1 เรียกเครื่องทิ้งระเบิดถล่มฝูงซอมบี้!'],
  [/^(.+) called in an airstrike on (.+)!$/, (m, a, b) => `${a} เรียกเครื่องทิ้งระเบิดถล่ม ${trName(b)}!`],
);
// ---- Admin observer mode (spectator.js) ----
Object.assign(TH, {
  'ADMIN OBSERVER': 'แอดมินผู้สังเกตการณ์',
  'V: ADMIN OBSERVER': 'V: โหมดแอดมินผู้สังเกตการณ์',
  'ZOMBIES': 'ซอมบี้', 'BOSSES': 'บอส', 'OPERATIVES': 'หน่วยรบ', 'VEHICLES': 'ยานพาหนะ', 'SOLDIERS': 'ทหารประจำแนว',
  'STRUCTURES': 'สิ่งปลูกสร้าง', 'INVASION': 'การบุกฐาน', 'TIME': 'เวลา', 'UNITS  [TAB]': 'หน่วย  [TAB]',
  'No bosses or bombers right now.': 'ตอนนี้ไม่มีบอสหรือเครื่องบินทิ้งระเบิด',
  'Nothing to follow there.': 'ไม่มีหน่วยให้ติดตาม',
  'No zombies anywhere. All quiet.': 'ไม่มีซอมบี้เลย สงบเงียบ',
  'FOB Ironvale': 'ฐาน FOB Ironvale',
  'World paused': 'หยุดเวลาโลก', 'World running': 'เวลาเดินต่อ',
  'Lost track of that unit.': 'ขาดการติดตามหน่วยนั้นแล้ว',
  'Observer mode works in the main world only.': 'โหมดผู้สังเกตการณ์ใช้ได้เฉพาะในโลกหลักเท่านั้น',
  'Observer mode: you are an invisible camera. Tab follows units, F2 returns to play.': 'โหมดผู้สังเกตการณ์: คุณคือกล้องล่องหน กด Tab ติดตามหน่วย กด F2 กลับไปเล่น',
  'Observer mode off. You have control again.': 'ปิดโหมดผู้สังเกตการณ์ กลับมาควบคุมตัวละครแล้ว',
  'TAB/Q:UNITS  1-5:JUMP  SPC:PAUSE  -/=:SPEED  N:MAP  U:HIDE UI  F2:EXIT': 'TAB/Q:หน่วย  1-5:กระโดด  SPC:หยุด  -/=:ความเร็ว  N:แผนที่  U:ซ่อน UI  F2:ออก',
});
TH_RX.push(
  [/^IN (\d+)s$/, 'อีก $1 วิ'],
  [/^WAVE (\d+)$/, 'ระลอก $1'],
  [/^Hot spot: (\d+) zombies here$/, 'จุดร้อน: ซอมบี้ $1 ตัวตรงนี้'],
  [/^Sim speed (\d)x$/, 'ความเร็วจำลอง $1x'],
  [/^(PAUSED|SPEED (\d)x)  ·  (.+)$/, (m, a, s, z) => `${s ? 'ความเร็ว ' + s + 'x' : 'หยุดเวลา'}  ·  ${tr(z)}`],
  [/^(.+) · FRENZY$/, (m, a) => `${tr(a)} · คลุ้มคลั่ง`],
  [/^(BOSS|AIR STRIKE|QRF|BTR-80|TANK|RECOVERY|MEDIC|OPERATIVE|SOLDIER)  ·  (.+)$/, (m, k, n) =>
    `${{ BOSS: 'บอส', 'AIR STRIKE': 'โจมตีทางอากาศ', QRF: 'กำลังเสริม', 'BTR-80': 'BTR-80', TANK: 'รถถัง', RECOVERY: 'รถกู้ภัย', MEDIC: 'หน่วยแพทย์', OPERATIVE: 'หน่วยรบ', SOLDIER: 'ทหาร' }[k]}  ·  ${n}`],
);
// ---- Medics & invasion recovery (medic.js / recovery.js) ----
Object.assign(TH, {
  'Recovery will roll out once the invasion is over.': 'รถกู้ภัยจะออกไปลากหลังจบการบุกของซอมบี้',
  'MEDICS FALL BACK!': 'หน่วยแพทย์ถอย!', 'LOADING': 'กำลังยกขึ้นเปล', 'REVIVED': 'ฟื้นแล้ว!',
});
TH_RX.push(
  [/^(.+) is down! Medics will go out after the invasion\.$/, '$1 ล้มแล้ว! หน่วยแพทย์จะออกไปรับหลังจบการบุก'],
  [/^(.+) is down! Medics are on the way\.$/, '$1 ล้มแล้ว! หน่วยแพทย์กำลังไปรับ'],
  [/^Medic team heading out for (.+)\.$/, 'หน่วยแพทย์ออกไปรับ $1'],
  [/^(.+) has been patched up and is back in action\.$/, '$1 ได้รับการรักษาแล้ว กลับมาสู้ต่อ!'],
  [/^(.+) KIA$/, '$1 เสียชีวิต'],
);

TH_NAMES['Western Woods'] = TH_NAMES['WESTERN WOODS'] = 'ป่าฝั่งตะวันตก';
TH_NAMES['FOB West Wing'] = 'ฐานปีกตะวันตก'; TH_NAMES['Outer Yard'] = 'ลานชั้นนอก';
TH_RX.push([/^A replacement AH-64D has landed on pad (\d+)\.$/, 'อาปาเช่ลำใหม่ลงจอดที่ลานจอด $1 แล้ว']);
Object.assign(TH, { 'UH-60 C2 BLACK HAWK': 'แบล็กฮอว์ก UH-60 บังคับการ', 'C2 ON STATION · FIRE MISSIONS COORDINATED': 'ฮอบังคับการขึ้นบินแล้ว · ประสานการยิงสนับสนุน',
  'C2 Black Hawk on station: fire missions coordinated.': 'ฮอบังคับการแบล็กฮอว์กขึ้นประจำการ: ประสานการยิงปืนใหญ่และโดรนแล้ว',
  'The C2 Black Hawk is down! Fire missions uncoordinated.': 'ฮอบังคับการตก! การยิงสนับสนุนไม่มีคนประสาน',
  "C2 Black Hawk hit! It's going down!": 'ฮอบังคับการถูกยิง! กำลังตก!',
  'A replacement UH-60 C2 has landed on pad 3.': 'ฮอบังคับการลำใหม่ลงจอดที่ลานจอด 3 แล้ว' });
Object.assign(TH, { 'A medic team is heading outside the walls with a 3-man escort.': 'ทีมแพทย์กำลังออกนอกกำแพง พร้อมทหารคุ้มกัน 3 นาย', 'Escort down!': 'ทหารคุ้มกันถูกยิงล้ม!' });
Object.assign(TH, { 'Behemoth Prime has appeared across the river! Gather a party!': 'บีฮีมอธไพรม์โผล่ขึ้นที่ฝั่งเมืองข้ามแม่น้ำ! รวมทีมไปตีกัน!',
  'Bag full: the loot went to your supply locker.': 'กระเป๋าเต็ม: ของถูกส่งไปที่ตู้เก็บของ' });
Object.assign(TH, { 'Engineers have re-laid the river mines.': 'ทหารช่างวางทุ่นระเบิดในแม่น้ำใหม่แล้ว' });

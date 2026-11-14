/**
 * Catálogo canónico de ediciones/sets de Magic: The Gathering extraído de la hoja "Sets".
 */
export interface MtgSet {
  code: string;
  name: string;
  year?: string;
}

export const MTG_SETS: MtgSet[] = [
  {
    "code": "2ED",
    "name": "Unlimited Edition",
    "year": "1993"
  },
  {
    "code": "3ED",
    "name": "Revised Edition",
    "year": "1994"
  },
  {
    "code": "LEA",
    "name": "Limited Edition Alpha",
    "year": "1993"
  },
  {
    "code": "LEB",
    "name": "Limited Edition Beta",
    "year": "1993"
  },
  {
    "code": "ARN",
    "name": "Arabian Nights",
    "year": "1993"
  },
  {
    "code": "ATQ",
    "name": "Antiquities",
    "year": "1994"
  },
  {
    "code": "LEG",
    "name": "Legends",
    "year": "1994"
  },
  {
    "code": "DRK",
    "name": "The Dark",
    "year": "1994"
  },
  {
    "code": "FEM",
    "name": "Fallen Empires",
    "year": "1994"
  },
  {
    "code": "4ED",
    "name": "Fourth Edition",
    "year": "1995"
  },
  {
    "code": "ICE",
    "name": "Ice Age",
    "year": "1995"
  },
  {
    "code": "CHR",
    "name": "Chronicles",
    "year": "1995"
  },
  {
    "code": "ALL",
    "name": "Alliances",
    "year": "1996"
  },
  {
    "code": "MIR",
    "name": "Mirage",
    "year": "1996"
  },
  {
    "code": "VIS",
    "name": "Visions",
    "year": "1997"
  },
  {
    "code": "WTH",
    "name": "Weatherlight",
    "year": "1997"
  },
  {
    "code": "TMP",
    "name": "Tempest",
    "year": "1997"
  },
  {
    "code": "STH",
    "name": "Stronghold",
    "year": "1998"
  },
  {
    "code": "EXO",
    "name": "Exodus",
    "year": "1998"
  },
  {
    "code": "USG",
    "name": "Urza's Saga",
    "year": "1998"
  },
  {
    "code": "ULG",
    "name": "Urza's Legacy",
    "year": "1999"
  },
  {
    "code": "UDS",
    "name": "Urza's Destiny",
    "year": "1999"
  },
  {
    "code": "MMQ",
    "name": "Mercadian Masques",
    "year": "1999"
  },
  {
    "code": "INV",
    "name": "Invasion",
    "year": "2000"
  },
  {
    "code": "ODY",
    "name": "Odyssey",
    "year": "2001"
  },
  {
    "code": "ONS",
    "name": "Onslaught",
    "year": "2002"
  },
  {
    "code": "MRD",
    "name": "Mirrodin",
    "year": "2003"
  },
  {
    "code": "RAV",
    "name": "Ravnica: City of Guilds",
    "year": "2005"
  },
  {
    "code": "TSP",
    "name": "Time Spiral",
    "year": "2006"
  },
  {
    "code": "LRW",
    "name": "Lorwyn",
    "year": "2007"
  },
  {
    "code": "ALA",
    "name": "Shards of Alara",
    "year": "2008"
  },
  {
    "code": "ZEN",
    "name": "Zendikar",
    "year": "2009"
  },
  {
    "code": "SOM",
    "name": "Scars of Mirrodin",
    "year": "2010"
  },
  {
    "code": "ISD",
    "name": "Innistrad",
    "year": "2011"
  },
  {
    "code": "RTR",
    "name": "Return to Ravnica",
    "year": "2012"
  },
  {
    "code": "THS",
    "name": "Theros",
    "year": "2013"
  },
  {
    "code": "KTK",
    "name": "Khans of Tarkir",
    "year": "2014"
  },
  {
    "code": "BFZ",
    "name": "Battle for Zendikar",
    "year": "2015"
  },
  {
    "code": "KLD",
    "name": "Kaladesh",
    "year": "2016"
  },
  {
    "code": "AKH",
    "name": "Amonkhet",
    "year": "2017"
  },
  {
    "code": "XLN",
    "name": "Ixalan",
    "year": "2017"
  },
  {
    "code": "DOM",
    "name": "Dominaria",
    "year": "2018"
  },
  {
    "code": "GRN",
    "name": "Guilds of Ravnica",
    "year": "2018"
  },
  {
    "code": "RNA",
    "name": "Ravnica Allegiance",
    "year": "2019"
  },
  {
    "code": "WAR",
    "name": "War of the Spark",
    "year": "2019"
  },
  {
    "code": "ELD",
    "name": "Throne of Eldraine",
    "year": "2019"
  },
  {
    "code": "THB",
    "name": "Theros Beyond Death",
    "year": "2020"
  },
  {
    "code": "IKO",
    "name": "Ikoria: Lair of Behemoths",
    "year": "2020"
  },
  {
    "code": "ZNR",
    "name": "Zendikar Rising",
    "year": "2020"
  },
  {
    "code": "KHM",
    "name": "Kaldheim",
    "year": "2021"
  },
  {
    "code": "STX",
    "name": "Strixhaven: School of Mages",
    "year": "2021"
  },
  {
    "code": "AFR",
    "name": "Adventures in the Forgotten Realms",
    "year": "2021"
  },
  {
    "code": "MID",
    "name": "Innistrad: Midnight Hunt",
    "year": "2021"
  },
  {
    "code": "VOW",
    "name": "Innistrad: Crimson Vow",
    "year": "2021"
  },
  {
    "code": "NEO",
    "name": "Kamigawa: Neon Dynasty",
    "year": "2022"
  },
  {
    "code": "SNC",
    "name": "Streets of New Capenna",
    "year": "2022"
  },
  {
    "code": "DMU",
    "name": "Dominaria United",
    "year": "2022"
  },
  {
    "code": "BRO",
    "name": "The Brothers' War",
    "year": "2022"
  },
  {
    "code": "ONE",
    "name": "Phyrexia: All Will Be One",
    "year": "2023"
  },
  {
    "code": "MOM",
    "name": "March of the Machine",
    "year": "2023"
  },
  {
    "code": "WOE",
    "name": "Wilds of Eldraine",
    "year": "2023"
  },
  {
    "code": "LCI",
    "name": "The Lost Caverns of Ixalan",
    "year": "2023"
  },
  {
    "code": "MKM",
    "name": "Murders at Karlov Manor",
    "year": "2024"
  },
  {
    "code": "OTJ",
    "name": "Outlaws of Thunder Junction",
    "year": "2024"
  },
  {
    "code": "BLB",
    "name": "Bloomburrow",
    "year": "2024"
  },
  {
    "code": "DSK",
    "name": "Duskmourn: House of Horror",
    "year": "2024"
  },
  {
    "code": "FDN",
    "name": "Foundations",
    "year": "2024"
  },
  {
    "code": "CED",
    "name": "Collectors' Edition",
    "year": "1993"
  },
  {
    "code": "CEI",
    "name": "Intl. Collectors' Edition",
    "year": "1993"
  },
  {
    "code": "PDRC",
    "name": "Dragon Con",
    "year": "1994"
  },
  {
    "code": "FBB",
    "name": "Foreign Black Border",
    "year": "1994"
  },
  {
    "code": "PHPR",
    "name": "HarperPrism Book Promos",
    "year": "1994"
  },
  {
    "code": "SUM",
    "name": "Summer Magic / Edgar",
    "year": "1994"
  },
  {
    "code": "BCHR",
    "name": "Chronicles Foreign Black Border",
    "year": "1995"
  },
  {
    "code": "4BB",
    "name": "Fourth Edition Foreign Black Border",
    "year": "1995"
  },
  {
    "code": "HML",
    "name": "Homelands",
    "year": "1995"
  },
  {
    "code": "PMEI",
    "name": "Media and Collaboration Promos",
    "year": "1995"
  },
  {
    "code": "REN",
    "name": "Renaissance",
    "year": "1995"
  },
  {
    "code": "RIN",
    "name": "Rinascimento",
    "year": "1995"
  },
  {
    "code": "PARL",
    "name": "Arena League 1996",
    "year": "1996"
  },
  {
    "code": "PCEL",
    "name": "Celebration Cards",
    "year": "1996"
  },
  {
    "code": "PLGM",
    "name": "DCI Legend Membership",
    "year": "1996"
  },
  {
    "code": "ITP",
    "name": "Introductory Two-Player Set",
    "year": "1996"
  },
  {
    "code": "MGB",
    "name": "Multiverse Gift Box",
    "year": "1996"
  },
  {
    "code": "O90P",
    "name": "Oversized 90's Promos",
    "year": "1996"
  },
  {
    "code": "PTC",
    "name": "Pro Tour Collector Set",
    "year": "1996"
  },
  {
    "code": "PRED",
    "name": "Redemption Program",
    "year": "1996"
  },
  {
    "code": "RQS",
    "name": "Rivals Quick Start Set",
    "year": "1996"
  },
  {
    "code": "PAST",
    "name": "Astral Cards",
    "year": "1997"
  },
  {
    "code": "5ED",
    "name": "Fifth Edition",
    "year": "1997"
  },
  {
    "code": "PMIC",
    "name": "MicroProse Promos",
    "year": "1997"
  },
  {
    "code": "OLEP",
    "name": "Oversized League Prizes",
    "year": "1997"
  },
  {
    "code": "POR",
    "name": "Portal",
    "year": "1997"
  },
  {
    "code": "PTMP",
    "name": "Tempest Promos",
    "year": "1997"
  },
  {
    "code": "PVAN",
    "name": "Vanguard Series",
    "year": "1997"
  },
  {
    "code": "WC97",
    "name": "World Championship Decks 1997",
    "year": "1997"
  },
  {
    "code": "ATH",
    "name": "Anthologies",
    "year": "1998"
  },
  {
    "code": "PALP",
    "name": "Asia Pacific Land Program",
    "year": "1998"
  },
  {
    "code": "PEXO",
    "name": "Exodus Promos",
    "year": "1998"
  },
  {
    "code": "JGP",
    "name": "Judge Gift Cards 1998",
    "year": "1998"
  },
  {
    "code": "P02",
    "name": "Portal Second Age",
    "year": "1998"
  },
  {
    "code": "PSTH",
    "name": "Stronghold Promos",
    "year": "1998"
  },
  {
    "code": "UGL",
    "name": "Unglued",
    "year": "1998"
  },
  {
    "code": "TUGL",
    "name": "Unglued Tokens",
    "year": "1998"
  },
  {
    "code": "PUSG",
    "name": "Urza's Saga Promos",
    "year": "1998"
  },
  {
    "code": "WC98",
    "name": "World Championship Decks 1998",
    "year": "1998"
  },
  {
    "code": "PAL99",
    "name": "Arena League 1999",
    "year": "1999"
  },
  {
    "code": "BRB",
    "name": "Battle Royale Box Set",
    "year": "1999"
  },
  {
    "code": "6ED",
    "name": "Classic Sixth Edition",
    "year": "1999"
  },
  {
    "code": "PGRU",
    "name": "Guru",
    "year": "1999"
  },
  {
    "code": "G99",
    "name": "Judge Gift Cards 1999",
    "year": "1999"
  },
  {
    "code": "PSUS",
    "name": "Junior Super Series",
    "year": "1999"
  },
  {
    "code": "PMMQ",
    "name": "Mercadian Masques Promos",
    "year": "1999"
  },
  {
    "code": "PTK",
    "name": "Portal Three Kingdoms",
    "year": "1999"
  },
  {
    "code": "PPTK",
    "name": "Portal Three Kingdoms Promos",
    "year": "1999"
  },
  {
    "code": "S99",
    "name": "Starter 1999",
    "year": "1999"
  },
  {
    "code": "PUDS",
    "name": "Urza's Destiny Promos",
    "year": "1999"
  },
  {
    "code": "PULG",
    "name": "Urza's Legacy Promos",
    "year": "1999"
  },
  {
    "code": "PWOS",
    "name": "Wizards of the Coast Online Store",
    "year": "1999"
  },
  {
    "code": "WC99",
    "name": "World Championship Decks 1999",
    "year": "1999"
  },
  {
    "code": "PWOR",
    "name": "World Championship Promos",
    "year": "1999"
  },
  {
    "code": "PAL00",
    "name": "Arena League 2000",
    "year": "2000"
  },
  {
    "code": "BTD",
    "name": "Beatdown Box Set",
    "year": "2000"
  },
  {
    "code": "PELP",
    "name": "European Land Program",
    "year": "2000"
  },
  {
    "code": "FNM",
    "name": "Friday Night Magic 2000",
    "year": "2000"
  },
  {
    "code": "PINV",
    "name": "Invasion Promos",
    "year": "2000"
  },
  {
    "code": "G00",
    "name": "Judge Gift Cards 2000",
    "year": "2000"
  },
  {
    "code": "NEM",
    "name": "Nemesis",
    "year": "2000"
  },
  {
    "code": "PNEM",
    "name": "Nemesis Promos",
    "year": "2000"
  },
  {
    "code": "PCY",
    "name": "Prophecy",
    "year": "2000"
  },
  {
    "code": "PPCY",
    "name": "Prophecy Promos",
    "year": "2000"
  },
  {
    "code": "S00",
    "name": "Starter 2000",
    "year": "2000"
  },
  {
    "code": "WC00",
    "name": "World Championship Decks 2000",
    "year": "2000"
  },
  {
    "code": "APC",
    "name": "Apocalypse",
    "year": "2001"
  },
  {
    "code": "PAPC",
    "name": "Apocalypse Promos",
    "year": "2001"
  },
  {
    "code": "PAL01",
    "name": "Arena League 2001",
    "year": "2001"
  },
  {
    "code": "DKM",
    "name": "Deckmasters",
    "year": "2001"
  },
  {
    "code": "F01",
    "name": "Friday Night Magic 2001",
    "year": "2001"
  },
  {
    "code": "G01",
    "name": "Judge Gift Cards 2001",
    "year": "2001"
  },
  {
    "code": "MPR",
    "name": "Magic Player Rewards 2001",
    "year": "2001"
  },
  {
    "code": "PODY",
    "name": "Odyssey Promos",
    "year": "2001"
  },
  {
    "code": "PLS",
    "name": "Planeshift",
    "year": "2001"
  },
  {
    "code": "PPLS",
    "name": "Planeshift Promos",
    "year": "2001"
  },
  {
    "code": "PSDG",
    "name": "Sega Dreamcast Cards",
    "year": "2001"
  },
  {
    "code": "7ED",
    "name": "Seventh Edition",
    "year": "2001"
  },
  {
    "code": "WC01",
    "name": "World Championship Decks 2001",
    "year": "2001"
  },
  {
    "code": "PAL02",
    "name": "Arena League 2002",
    "year": "2002"
  },
  {
    "code": "F02",
    "name": "Friday Night Magic 2002",
    "year": "2002"
  },
  {
    "code": "JP1",
    "name": "Hobby Japan Promos",
    "year": "2002"
  },
  {
    "code": "G02",
    "name": "Judge Gift Cards 2002",
    "year": "2002"
  },
  {
    "code": "JUD",
    "name": "Judgment",
    "year": "2002"
  },
  {
    "code": "PJUD",
    "name": "Judgment Promos",
    "year": "2002"
  },
  {
    "code": "PRM",
    "name": "Magic Online Promos",
    "year": "2002"
  },
  {
    "code": "PR2",
    "name": "Magic Player Rewards 2002",
    "year": "2002"
  },
  {
    "code": "PONS",
    "name": "Onslaught Promos",
    "year": "2002"
  },
  {
    "code": "TOR",
    "name": "Torment",
    "year": "2002"
  },
  {
    "code": "PTOR",
    "name": "Torment Promos",
    "year": "2002"
  },
  {
    "code": "WC02",
    "name": "World Championship Decks 2002",
    "year": "2002"
  },
  {
    "code": "PAL03",
    "name": "Arena League 2003",
    "year": "2003"
  },
  {
    "code": "8ED",
    "name": "Eighth Edition",
    "year": "2003"
  },
  {
    "code": "P8ED",
    "name": "Eighth Edition Promos",
    "year": "2003"
  },
  {
    "code": "F03",
    "name": "Friday Night Magic 2003",
    "year": "2003"
  },
  {
    "code": "PJJT",
    "name": "Japan Junior Tournament",
    "year": "2003"
  },
  {
    "code": "G03",
    "name": "Judge Gift Cards 2003",
    "year": "2003"
  },
  {
    "code": "LGN",
    "name": "Legions",
    "year": "2003"
  },
  {
    "code": "PLGN",
    "name": "Legions Promos",
    "year": "2003"
  },
  {
    "code": "PMOA",
    "name": "Magic Online Avatars",
    "year": "2003"
  },
  {
    "code": "P03",
    "name": "Magic Player Rewards 2003",
    "year": "2003"
  },
  {
    "code": "SCG",
    "name": "Scourge",
    "year": "2003"
  },
  {
    "code": "PSCG",
    "name": "Scourge Promos",
    "year": "2003"
  },
  {
    "code": "OVNT",
    "name": "Vintage Championship",
    "year": "2003"
  },
  {
    "code": "WC03",
    "name": "World Championship Decks 2003",
    "year": "2003"
  },
  {
    "code": "PAL04",
    "name": "Arena League 2004",
    "year": "2004"
  },
  {
    "code": "CHK",
    "name": "Champions of Kamigawa",
    "year": "2004"
  },
  {
    "code": "PCHK",
    "name": "Champions of Kamigawa Promos",
    "year": "2004"
  },
  {
    "code": "DST",
    "name": "Darksteel",
    "year": "2004"
  },
  {
    "code": "PDST",
    "name": "Darksteel Promos",
    "year": "2004"
  },
  {
    "code": "5DN",
    "name": "Fifth Dawn",
    "year": "2004"
  },
  {
    "code": "P5DN",
    "name": "Fifth Dawn Promos",
    "year": "2004"
  },
  {
    "code": "F04",
    "name": "Friday Night Magic 2004",
    "year": "2004"
  },
  {
    "code": "G04",
    "name": "Judge Gift Cards 2004",
    "year": "2004"
  },
  {
    "code": "P04",
    "name": "Magic Player Rewards 2004",
    "year": "2004"
  },
  {
    "code": "PMRD",
    "name": "Mirrodin Promos",
    "year": "2004"
  },
  {
    "code": "UNH",
    "name": "Unhinged",
    "year": "2004"
  },
  {
    "code": "PUNH",
    "name": "Unhinged Promos",
    "year": "2004"
  },
  {
    "code": "WC04",
    "name": "World Championship Decks 2004",
    "year": "2004"
  },
  {
    "code": "PAL05",
    "name": "Arena League 2005",
    "year": "2005"
  },
  {
    "code": "BOK",
    "name": "Betrayers of Kamigawa",
    "year": "2005"
  },
  {
    "code": "PBOK",
    "name": "Betrayers of Kamigawa Promos",
    "year": "2005"
  },
  {
    "code": "F05",
    "name": "Friday Night Magic 2005",
    "year": "2005"
  },
  {
    "code": "G05",
    "name": "Judge Gift Cards 2005",
    "year": "2005"
  },
  {
    "code": "PJSE",
    "name": "Junior Series Europe",
    "year": "2005"
  },
  {
    "code": "P05",
    "name": "Magic Player Rewards 2005",
    "year": "2005"
  },
  {
    "code": "PMPS",
    "name": "Magic Premiere Shop 2005",
    "year": "2005"
  },
  {
    "code": "9ED",
    "name": "Ninth Edition",
    "year": "2005"
  },
  {
    "code": "P9ED",
    "name": "Ninth Edition Promos",
    "year": "2005"
  },
  {
    "code": "PRAV",
    "name": "Ravnica: City of Guilds Promos",
    "year": "2005"
  },
  {
    "code": "PSAL",
    "name": "Salvat 2005",
    "year": "2005"
  },
  {
    "code": "SOK",
    "name": "Saviors of Kamigawa",
    "year": "2005"
  },
  {
    "code": "PSOK",
    "name": "Saviors of Kamigawa Promos",
    "year": "2005"
  },
  {
    "code": "P2HG",
    "name": "Two-Headed Giant Tournament",
    "year": "2005"
  },
  {
    "code": "PAL06",
    "name": "Arena League 2006",
    "year": "2006"
  },
  {
    "code": "PCMP",
    "name": "Champs and States",
    "year": "2006"
  },
  {
    "code": "CSP",
    "name": "Coldsnap",
    "year": "2006"
  },
  {
    "code": "PCSP",
    "name": "Coldsnap Promos",
    "year": "2006"
  },
  {
    "code": "CST",
    "name": "Coldsnap Theme Decks",
    "year": "2006"
  },
  {
    "code": "DCI",
    "name": "DCI Promos",
    "year": "2006"
  },
  {
    "code": "DIS",
    "name": "Dissension",
    "year": "2006"
  },
  {
    "code": "PDIS",
    "name": "Dissension Promos",
    "year": "2006"
  },
  {
    "code": "F06",
    "name": "Friday Night Magic 2006",
    "year": "2006"
  },
  {
    "code": "GPT",
    "name": "Guildpact",
    "year": "2006"
  },
  {
    "code": "PGPT",
    "name": "Guildpact Promos",
    "year": "2006"
  },
  {
    "code": "PHUK",
    "name": "Hachette UK",
    "year": "2006"
  },
  {
    "code": "HHO",
    "name": "Happy Holidays",
    "year": "2006"
  },
  {
    "code": "G06",
    "name": "Judge Gift Cards 2006",
    "year": "2006"
  },
  {
    "code": "PJAS",
    "name": "Junior APAC Series",
    "year": "2006"
  },
  {
    "code": "P06",
    "name": "Magic Player Rewards 2006",
    "year": "2006"
  },
  {
    "code": "PMPS06",
    "name": "Magic Premiere Shop 2006",
    "year": "2006"
  },
  {
    "code": "PTSP",
    "name": "Time Spiral Promos",
    "year": "2006"
  },
  {
    "code": "TSB",
    "name": "Time Spiral Timeshifted",
    "year": "2006"
  },
  {
    "code": "DD1",
    "name": "Duel Decks: Elves vs. Goblins",
    "year": "2007"
  },
  {
    "code": "TDD1",
    "name": "Duel Decks: Elves vs. Goblins Tokens",
    "year": "2007"
  },
  {
    "code": "F07",
    "name": "Friday Night Magic 2007",
    "year": "2007"
  },
  {
    "code": "FUT",
    "name": "Future Sight",
    "year": "2007"
  },
  {
    "code": "PFUT",
    "name": "Future Sight Promos",
    "year": "2007"
  },
  {
    "code": "PGPX",
    "name": "Grand Prix Promos",
    "year": "2007"
  },
  {
    "code": "G07",
    "name": "Judge Gift Cards 2007",
    "year": "2007"
  },
  {
    "code": "PLRW",
    "name": "Lorwyn Promos",
    "year": "2007"
  },
  {
    "code": "TLRW",
    "name": "Lorwyn Tokens",
    "year": "2007"
  },
  {
    "code": "P07",
    "name": "Magic Player Rewards 2007",
    "year": "2007"
  },
  {
    "code": "PMPS07",
    "name": "Magic Premiere Shop 2007",
    "year": "2007"
  },
  {
    "code": "ME1",
    "name": "Masters Edition",
    "year": "2007"
  },
  {
    "code": "PLC",
    "name": "Planar Chaos",
    "year": "2007"
  },
  {
    "code": "PPLC",
    "name": "Planar Chaos Promos",
    "year": "2007"
  },
  {
    "code": "PPRO",
    "name": "Pro Tour Promos",
    "year": "2007"
  },
  {
    "code": "10E",
    "name": "Tenth Edition",
    "year": "2007"
  },
  {
    "code": "P10E",
    "name": "Tenth Edition Promos",
    "year": "2007"
  },
  {
    "code": "T10E",
    "name": "Tenth Edition Tokens",
    "year": "2007"
  },
  {
    "code": "P15A",
    "name": "15th Anniversary Cards",
    "year": "2008"
  },
  {
    "code": "DD2",
    "name": "Duel Decks: Jace vs. Chandra",
    "year": "2008"
  },
  {
    "code": "TDD2",
    "name": "Duel Decks: Jace vs. Chandra Tokens",
    "year": "2008"
  },
  {
    "code": "EVE",
    "name": "Eventide",
    "year": "2008"
  },
  {
    "code": "PEVE",
    "name": "Eventide Promos",
    "year": "2008"
  },
  {
    "code": "TEVE",
    "name": "Eventide Tokens",
    "year": "2008"
  },
  {
    "code": "F08",
    "name": "Friday Night Magic 2008",
    "year": "2008"
  },
  {
    "code": "DRB",
    "name": "From the Vault: Dragons",
    "year": "2008"
  },
  {
    "code": "G08",
    "name": "Judge Gift Cards 2008",
    "year": "2008"
  },
  {
    "code": "P08",
    "name": "Magic Player Rewards 2008",
    "year": "2008"
  },
  {
    "code": "PMPS08",
    "name": "Magic Premiere Shop 2008",
    "year": "2008"
  },
  {
    "code": "ME2",
    "name": "Masters Edition II",
    "year": "2008"
  },
  {
    "code": "MOR",
    "name": "Morningtide",
    "year": "2008"
  },
  {
    "code": "PMOR",
    "name": "Morningtide Promos",
    "year": "2008"
  },
  {
    "code": "TMOR",
    "name": "Morningtide Tokens",
    "year": "2008"
  },
  {
    "code": "SHM",
    "name": "Shadowmoor",
    "year": "2008"
  },
  {
    "code": "PSHM",
    "name": "Shadowmoor Promos",
    "year": "2008"
  },
  {
    "code": "TSHM",
    "name": "Shadowmoor Tokens",
    "year": "2008"
  },
  {
    "code": "PALA",
    "name": "Shards of Alara Promos",
    "year": "2008"
  },
  {
    "code": "TALA",
    "name": "Shards of Alara Tokens",
    "year": "2008"
  },
  {
    "code": "ARB",
    "name": "Alara Reborn",
    "year": "2009"
  },
  {
    "code": "PARB",
    "name": "Alara Reborn Promos",
    "year": "2009"
  },
  {
    "code": "TARB",
    "name": "Alara Reborn Tokens",
    "year": "2009"
  },
  {
    "code": "CON",
    "name": "Conflux",
    "year": "2009"
  },
  {
    "code": "PCON",
    "name": "Conflux Promos",
    "year": "2009"
  },
  {
    "code": "TCON",
    "name": "Conflux Tokens",
    "year": "2009"
  },
  {
    "code": "DDC",
    "name": "Duel Decks: Divine vs. Demonic",
    "year": "2009"
  },
  {
    "code": "TDDC",
    "name": "Duel Decks: Divine vs. Demonic Tokens",
    "year": "2009"
  },
  {
    "code": "DDD",
    "name": "Duel Decks: Garruk vs. Liliana",
    "year": "2009"
  },
  {
    "code": "TDDD",
    "name": "Duel Decks: Garruk vs. Liliana Tokens",
    "year": "2009"
  },
  {
    "code": "PDTP",
    "name": "Duels of the Planeswalkers 2009 Promos",
    "year": "2009"
  },
  {
    "code": "F09",
    "name": "Friday Night Magic 2009",
    "year": "2009"
  },
  {
    "code": "V09",
    "name": "From the Vault: Exiled",
    "year": "2009"
  },
  {
    "code": "G09",
    "name": "Judge Gift Cards 2009",
    "year": "2009"
  },
  {
    "code": "M10",
    "name": "Magic 2010",
    "year": "2009"
  },
  {
    "code": "PM10",
    "name": "Magic 2010 Promos",
    "year": "2009"
  },
  {
    "code": "TM10",
    "name": "Magic 2010 Tokens",
    "year": "2009"
  },
  {
    "code": "P09",
    "name": "Magic Player Rewards 2009",
    "year": "2009"
  },
  {
    "code": "PMPS09",
    "name": "Magic Premiere Shop 2009",
    "year": "2009"
  },
  {
    "code": "ME3",
    "name": "Masters Edition III",
    "year": "2009"
  },
  {
    "code": "HOP",
    "name": "Planechase",
    "year": "2009"
  },
  {
    "code": "OHOP",
    "name": "Planechase Planes",
    "year": "2009"
  },
  {
    "code": "PHOP",
    "name": "Planechase Promos",
    "year": "2009"
  },
  {
    "code": "H09",
    "name": "Premium Deck Series: Slivers",
    "year": "2009"
  },
  {
    "code": "PURL",
    "name": "URL/Convention Promos",
    "year": "2009"
  },
  {
    "code": "PZEN",
    "name": "Zendikar Promos",
    "year": "2009"
  },
  {
    "code": "TZEN",
    "name": "Zendikar Tokens",
    "year": "2009"
  },
  {
    "code": "ARC",
    "name": "Archenemy",
    "year": "2010"
  },
  {
    "code": "OARC",
    "name": "Archenemy Schemes",
    "year": "2010"
  },
  {
    "code": "DDF",
    "name": "Duel Decks: Elspeth vs. Tezzeret",
    "year": "2010"
  },
  {
    "code": "TDDF",
    "name": "Duel Decks: Elspeth vs. Tezzeret Tokens",
    "year": "2010"
  },
  {
    "code": "DDE",
    "name": "Duel Decks: Phyrexia vs. the Coalition",
    "year": "2010"
  },
  {
    "code": "TDDE",
    "name": "Duel Decks: Phyrexia vs. the Coalition Tokens",
    "year": "2010"
  },
  {
    "code": "DPA",
    "name": "Duels of the Planeswalkers",
    "year": "2010"
  },
  {
    "code": "PDP10",
    "name": "Duels of the Planeswalkers 2010 Promos",
    "year": "2010"
  },
  {
    "code": "F10",
    "name": "Friday Night Magic 2010",
    "year": "2010"
  },
  {
    "code": "V10",
    "name": "From the Vault: Relics",
    "year": "2010"
  },
  {
    "code": "G10",
    "name": "Judge Gift Cards 2010",
    "year": "2010"
  },
  {
    "code": "M11",
    "name": "Magic 2011",
    "year": "2010"
  },
  {
    "code": "PM11",
    "name": "Magic 2011 Promos",
    "year": "2010"
  },
  {
    "code": "TM11",
    "name": "Magic 2011 Tokens",
    "year": "2010"
  },
  {
    "code": "TD0",
    "name": "Magic Online Theme Decks",
    "year": "2010"
  },
  {
    "code": "P10",
    "name": "Magic Player Rewards 2010",
    "year": "2010"
  },
  {
    "code": "PMPS10",
    "name": "Magic Premiere Shop 2010",
    "year": "2010"
  },
  {
    "code": "PD2",
    "name": "Premium Deck Series: Fire and Lightning",
    "year": "2010"
  },
  {
    "code": "ROE",
    "name": "Rise of the Eldrazi",
    "year": "2010"
  },
  {
    "code": "PROE",
    "name": "Rise of the Eldrazi Promos",
    "year": "2010"
  },
  {
    "code": "TROE",
    "name": "Rise of the Eldrazi Tokens",
    "year": "2010"
  },
  {
    "code": "PSOM",
    "name": "Scars of Mirrodin Promos",
    "year": "2010"
  },
  {
    "code": "TSOM",
    "name": "Scars of Mirrodin Tokens",
    "year": "2010"
  },
  {
    "code": "WWK",
    "name": "Worldwake",
    "year": "2010"
  },
  {
    "code": "PWWK",
    "name": "Worldwake Promos",
    "year": "2010"
  },
  {
    "code": "TWWK",
    "name": "Worldwake Tokens",
    "year": "2010"
  },
  {
    "code": "CMD",
    "name": "Commander 2011",
    "year": "2011"
  },
  {
    "code": "PCMD",
    "name": "Commander 2011 Launch Party",
    "year": "2011"
  },
  {
    "code": "OCMD",
    "name": "Commander 2011 Oversized",
    "year": "2011"
  },
  {
    "code": "DDH",
    "name": "Duel Decks: Ajani vs. Nicol Bolas",
    "year": "2011"
  },
  {
    "code": "TDDH",
    "name": "Duel Decks: Ajani vs. Nicol Bolas Tokens",
    "year": "2011"
  },
  {
    "code": "DDG",
    "name": "Duel Decks: Knights vs. Dragons",
    "year": "2011"
  },
  {
    "code": "TDDG",
    "name": "Duel Decks: Knights vs. Dragons Tokens",
    "year": "2011"
  },
  {
    "code": "TD2",
    "name": "Duel Decks: Mirrodin Pure vs. New Phyrexia",
    "year": "2011"
  },
  {
    "code": "PDP12",
    "name": "Duels of the Planeswalkers 2012 Promos",
    "year": "2011"
  },
  {
    "code": "F11",
    "name": "Friday Night Magic 2011",
    "year": "2011"
  },
  {
    "code": "V11",
    "name": "From the Vault: Legends",
    "year": "2011"
  },
  {
    "code": "PISD",
    "name": "Innistrad Promos",
    "year": "2011"
  },
  {
    "code": "TISD",
    "name": "Innistrad Tokens",
    "year": "2011"
  },
  {
    "code": "G11",
    "name": "Judge Gift Cards 2011",
    "year": "2011"
  },
  {
    "code": "OLGC",
    "name": "Legacy Championship",
    "year": "2011"
  },
  {
    "code": "M12",
    "name": "Magic 2012",
    "year": "2011"
  },
  {
    "code": "PM12",
    "name": "Magic 2012 Promos",
    "year": "2011"
  },
  {
    "code": "TM12",
    "name": "Magic 2012 Tokens",
    "year": "2011"
  },
  {
    "code": "P11",
    "name": "Magic Player Rewards 2011",
    "year": "2011"
  },
  {
    "code": "PMPS11",
    "name": "Magic Premiere Shop 2011",
    "year": "2011"
  },
  {
    "code": "ME4",
    "name": "Masters Edition IV",
    "year": "2011"
  },
  {
    "code": "MBS",
    "name": "Mirrodin Besieged",
    "year": "2011"
  },
  {
    "code": "PMBS",
    "name": "Mirrodin Besieged Promos",
    "year": "2011"
  },
  {
    "code": "TMBS",
    "name": "Mirrodin Besieged Tokens",
    "year": "2011"
  },
  {
    "code": "NPH",
    "name": "New Phyrexia",
    "year": "2011"
  },
  {
    "code": "PNPH",
    "name": "New Phyrexia Promos",
    "year": "2011"
  },
  {
    "code": "TNPH",
    "name": "New Phyrexia Tokens",
    "year": "2011"
  },
  {
    "code": "PD3",
    "name": "Premium Deck Series: Graveborn",
    "year": "2011"
  },
  {
    "code": "PS11",
    "name": "Salvat 2011",
    "year": "2011"
  },
  {
    "code": "PW11",
    "name": "Wizards Play Network 2011",
    "year": "2011"
  },
  {
    "code": "AVR",
    "name": "Avacyn Restored",
    "year": "2012"
  },
  {
    "code": "PAVR",
    "name": "Avacyn Restored Promos",
    "year": "2012"
  },
  {
    "code": "TAVR",
    "name": "Avacyn Restored Tokens",
    "year": "2012"
  },
  {
    "code": "CM1",
    "name": "Commander's Arsenal",
    "year": "2012"
  },
  {
    "code": "OCM1",
    "name": "Commander's Arsenal Oversized",
    "year": "2012"
  },
  {
    "code": "DKA",
    "name": "Dark Ascension",
    "year": "2012"
  },
  {
    "code": "PDKA",
    "name": "Dark Ascension Promos",
    "year": "2012"
  },
  {
    "code": "TDKA",
    "name": "Dark Ascension Tokens",
    "year": "2012"
  },
  {
    "code": "DDJ",
    "name": "Duel Decks: Izzet vs. Golgari",
    "year": "2012"
  },
  {
    "code": "TDDJ",
    "name": "Duel Decks: Izzet vs. Golgari Tokens",
    "year": "2012"
  },
  {
    "code": "DDI",
    "name": "Duel Decks: Venser vs. Koth",
    "year": "2012"
  },
  {
    "code": "TDDI",
    "name": "Duel Decks: Venser vs. Koth Tokens",
    "year": "2012"
  },
  {
    "code": "PDP13",
    "name": "Duels of the Planeswalkers 2013 Promos",
    "year": "2012"
  },
  {
    "code": "F12",
    "name": "Friday Night Magic 2012",
    "year": "2012"
  },
  {
    "code": "V12",
    "name": "From the Vault: Realms",
    "year": "2012"
  },
  {
    "code": "PIDW",
    "name": "IDW Comics Inserts",
    "year": "2012"
  },
  {
    "code": "J12",
    "name": "Judge Gift Cards 2012",
    "year": "2012"
  },
  {
    "code": "L12",
    "name": "League Tokens 2012",
    "year": "2012"
  },
  {
    "code": "M13",
    "name": "Magic 2013",
    "year": "2012"
  },
  {
    "code": "PM13",
    "name": "Magic 2013 Promos",
    "year": "2012"
  },
  {
    "code": "TM13",
    "name": "Magic 2013 Tokens",
    "year": "2012"
  },
  {
    "code": "PHEL",
    "name": "Open the Helvault",
    "year": "2012"
  },
  {
    "code": "PC2",
    "name": "Planechase 2012",
    "year": "2012"
  },
  {
    "code": "OPC2",
    "name": "Planechase 2012 Planes",
    "year": "2012"
  },
  {
    "code": "PRTR",
    "name": "Return to Ravnica Promos",
    "year": "2012"
  },
  {
    "code": "TRTR",
    "name": "Return to Ravnica Tokens",
    "year": "2012"
  },
  {
    "code": "PW12",
    "name": "Wizards Play Network 2012",
    "year": "2012"
  },
  {
    "code": "C13",
    "name": "Commander 2013",
    "year": "2013"
  },
  {
    "code": "OC13",
    "name": "Commander 2013 Oversized",
    "year": "2013"
  },
  {
    "code": "DGM",
    "name": "Dragon's Maze",
    "year": "2013"
  },
  {
    "code": "PDGM",
    "name": "Dragon's Maze Promos",
    "year": "2013"
  },
  {
    "code": "TDGM",
    "name": "Dragon's Maze Tokens",
    "year": "2013"
  },
  {
    "code": "DDL",
    "name": "Duel Decks: Heroes vs. Monsters",
    "year": "2013"
  },
  {
    "code": "TDDL",
    "name": "Duel Decks: Heroes vs. Monsters Tokens",
    "year": "2013"
  },
  {
    "code": "DDK",
    "name": "Duel Decks: Sorin vs. Tibalt",
    "year": "2013"
  },
  {
    "code": "TDDK",
    "name": "Duel Decks: Sorin vs. Tibalt Tokens",
    "year": "2013"
  },
  {
    "code": "PDP14",
    "name": "Duels of the Planeswalkers 2014 Promos",
    "year": "2013"
  },
  {
    "code": "TFTH",
    "name": "Face the Hydra",
    "year": "2013"
  },
  {
    "code": "F13",
    "name": "Friday Night Magic 2013",
    "year": "2013"
  },
  {
    "code": "V13",
    "name": "From the Vault: Twenty",
    "year": "2013"
  },
  {
    "code": "GTC",
    "name": "Gatecrash",
    "year": "2013"
  },
  {
    "code": "PGTC",
    "name": "Gatecrash Promos",
    "year": "2013"
  },
  {
    "code": "TGTC",
    "name": "Gatecrash Tokens",
    "year": "2013"
  },
  {
    "code": "J13",
    "name": "Judge Gift Cards 2013",
    "year": "2013"
  },
  {
    "code": "L13",
    "name": "League Tokens 2013",
    "year": "2013"
  },
  {
    "code": "M14",
    "name": "Magic 2014",
    "year": "2013"
  },
  {
    "code": "PM14",
    "name": "Magic 2014 Promos",
    "year": "2013"
  },
  {
    "code": "TM14",
    "name": "Magic 2014 Tokens",
    "year": "2013"
  },
  {
    "code": "MMA",
    "name": "Modern Masters",
    "year": "2013"
  },
  {
    "code": "TMMA",
    "name": "Modern Masters Tokens",
    "year": "2013"
  },
  {
    "code": "PSDC",
    "name": "San Diego Comic-Con 2013",
    "year": "2013"
  },
  {
    "code": "THP1",
    "name": "Theros Hero's Path",
    "year": "2013"
  },
  {
    "code": "PTHS",
    "name": "Theros Promos",
    "year": "2013"
  },
  {
    "code": "TTHS",
    "name": "Theros Tokens",
    "year": "2013"
  },
  {
    "code": "WMC",
    "name": "World Magic Cup Qualifiers",
    "year": "2013"
  },
  {
    "code": "TBTH",
    "name": "Battle the Horde",
    "year": "2014"
  },
  {
    "code": "BNG",
    "name": "Born of the Gods",
    "year": "2014"
  },
  {
    "code": "THP2",
    "name": "Born of the Gods Hero's Path",
    "year": "2014"
  },
  {
    "code": "PBNG",
    "name": "Born of the Gods Promos",
    "year": "2014"
  },
  {
    "code": "TBNG",
    "name": "Born of the Gods Tokens",
    "year": "2014"
  },
  {
    "code": "C14",
    "name": "Commander 2014",
    "year": "2014"
  },
  {
    "code": "OC14",
    "name": "Commander 2014 Oversized",
    "year": "2014"
  },
  {
    "code": "TC14",
    "name": "Commander 2014 Tokens",
    "year": "2014"
  },
  {
    "code": "CNS",
    "name": "Conspiracy",
    "year": "2014"
  },
  {
    "code": "PCNS",
    "name": "Conspiracy Promos",
    "year": "2014"
  },
  {
    "code": "TCNS",
    "name": "Conspiracy Tokens",
    "year": "2014"
  },
  {
    "code": "TDAG",
    "name": "Defeat a God",
    "year": "2014"
  },
  {
    "code": "DVD",
    "name": "Duel Decks Anthology: Divine vs. Demonic",
    "year": "2014"
  },
  {
    "code": "TDVD",
    "name": "Duel Decks Anthology: Divine vs. Demonic Tokens",
    "year": "2014"
  },
  {
    "code": "EVG",
    "name": "Duel Decks Anthology: Elves vs. Goblins",
    "year": "2014"
  },
  {
    "code": "TEVG",
    "name": "Duel Decks Anthology: Elves vs. Goblins Tokens",
    "year": "2014"
  },
  {
    "code": "GVL",
    "name": "Duel Decks Anthology: Garruk vs. Liliana",
    "year": "2014"
  },
  {
    "code": "TGVL",
    "name": "Duel Decks Anthology: Garruk vs. Liliana Tokens",
    "year": "2014"
  },
  {
    "code": "JVC",
    "name": "Duel Decks Anthology: Jace vs. Chandra",
    "year": "2014"
  },
  {
    "code": "TJVC",
    "name": "Duel Decks Anthology: Jace vs. Chandra Tokens",
    "year": "2014"
  },
  {
    "code": "DDM",
    "name": "Duel Decks: Jace vs. Vraska",
    "year": "2014"
  },
  {
    "code": "TDDM",
    "name": "Duel Decks: Jace vs. Vraska Tokens",
    "year": "2014"
  },
  {
    "code": "DDN",
    "name": "Duel Decks: Speed vs. Cunning",
    "year": "2014"
  },
  {
    "code": "PDP15",
    "name": "Duels of the Planeswalkers 2015 Promos",
    "year": "2014"
  },
  {
    "code": "F14",
    "name": "Friday Night Magic 2014",
    "year": "2014"
  },
  {
    "code": "V14",
    "name": "From the Vault: Annihilation",
    "year": "2014"
  },
  {
    "code": "JOU",
    "name": "Journey into Nyx",
    "year": "2014"
  },
  {
    "code": "THP3",
    "name": "Journey into Nyx Hero's Path",
    "year": "2014"
  },
  {
    "code": "PJOU",
    "name": "Journey into Nyx Promos",
    "year": "2014"
  },
  {
    "code": "TJOU",
    "name": "Journey into Nyx Tokens",
    "year": "2014"
  },
  {
    "code": "J14",
    "name": "Judge Gift Cards 2014",
    "year": "2014"
  },
  {
    "code": "PKTK",
    "name": "Khans of Tarkir Promos",
    "year": "2014"
  },
  {
    "code": "TKTK",
    "name": "Khans of Tarkir Tokens",
    "year": "2014"
  },
  {
    "code": "L14",
    "name": "League Tokens 2014",
    "year": "2014"
  },
  {
    "code": "PPC1",
    "name": "M15 Prerelease Challenge",
    "year": "2014"
  },
  {
    "code": "M15",
    "name": "Magic 2015",
    "year": "2014"
  },
  {
    "code": "CP1",
    "name": "Magic 2015 Clash Pack",
    "year": "2014"
  },
  {
    "code": "PM15",
    "name": "Magic 2015 Promos",
    "year": "2014"
  },
  {
    "code": "TM15",
    "name": "Magic 2015 Tokens",
    "year": "2014"
  },
  {
    "code": "MD1",
    "name": "Modern Event Deck 2014",
    "year": "2014"
  },
  {
    "code": "TMD1",
    "name": "Modern Event Deck 2014 Tokens",
    "year": "2014"
  },
  {
    "code": "PS14",
    "name": "San Diego Comic-Con 2014",
    "year": "2014"
  },
  {
    "code": "VMA",
    "name": "Vintage Masters",
    "year": "2014"
  },
  {
    "code": "PSS1",
    "name": "BFZ Standard Series",
    "year": "2015"
  },
  {
    "code": "PBFZ",
    "name": "Battle for Zendikar Promos",
    "year": "2015"
  },
  {
    "code": "TBFZ",
    "name": "Battle for Zendikar Tokens",
    "year": "2015"
  },
  {
    "code": "C15",
    "name": "Commander 2015",
    "year": "2015"
  },
  {
    "code": "OC15",
    "name": "Commander 2015 Oversized",
    "year": "2015"
  },
  {
    "code": "TC15",
    "name": "Commander 2015 Tokens",
    "year": "2015"
  },
  {
    "code": "DTK",
    "name": "Dragons of Tarkir",
    "year": "2015"
  },
  {
    "code": "PDTK",
    "name": "Dragons of Tarkir Promos",
    "year": "2015"
  },
  {
    "code": "TDTK",
    "name": "Dragons of Tarkir Tokens",
    "year": "2015"
  },
  {
    "code": "DDO",
    "name": "Duel Decks: Elspeth vs. Kiora",
    "year": "2015"
  },
  {
    "code": "DDP",
    "name": "Duel Decks: Zendikar vs. Eldrazi",
    "year": "2015"
  },
  {
    "code": "FRF",
    "name": "Fate Reforged",
    "year": "2015"
  },
  {
    "code": "CP2",
    "name": "Fate Reforged Clash Pack",
    "year": "2015"
  },
  {
    "code": "PFRF",
    "name": "Fate Reforged Promos",
    "year": "2015"
  },
  {
    "code": "TFRF",
    "name": "Fate Reforged Tokens",
    "year": "2015"
  },
  {
    "code": "F15",
    "name": "Friday Night Magic 2015",
    "year": "2015"
  },
  {
    "code": "V15",
    "name": "From the Vault: Angels",
    "year": "2015"
  },
  {
    "code": "J15",
    "name": "Judge Gift Cards 2015",
    "year": "2015"
  },
  {
    "code": "L15",
    "name": "League Tokens 2015",
    "year": "2015"
  },
  {
    "code": "PZ1",
    "name": "Legendary Cube Prize Pack",
    "year": "2015"
  },
  {
    "code": "ORI",
    "name": "Magic Origins",
    "year": "2015"
  },
  {
    "code": "CP3",
    "name": "Magic Origins Clash Pack",
    "year": "2015"
  },
  {
    "code": "PORI",
    "name": "Magic Origins Promos",
    "year": "2015"
  },
  {
    "code": "TORI",
    "name": "Magic Origins Tokens",
    "year": "2015"
  },
  {
    "code": "MM2",
    "name": "Modern Masters 2015",
    "year": "2015"
  },
  {
    "code": "TMM2",
    "name": "Modern Masters 2015 Tokens",
    "year": "2015"
  },
  {
    "code": "PS15",
    "name": "San Diego Comic-Con 2015",
    "year": "2015"
  },
  {
    "code": "PTKDF",
    "name": "Tarkir Dragonfury",
    "year": "2015"
  },
  {
    "code": "TPR",
    "name": "Tempest Remastered",
    "year": "2015"
  },
  {
    "code": "UGIN",
    "name": "Ugin's Fate",
    "year": "2015"
  },
  {
    "code": "EXP",
    "name": "Zendikar Expeditions",
    "year": "2015"
  },
  {
    "code": "C16",
    "name": "Commander 2016",
    "year": "2016"
  },
  {
    "code": "OC16",
    "name": "Commander 2016 Oversized",
    "year": "2016"
  },
  {
    "code": "TC16",
    "name": "Commander 2016 Tokens",
    "year": "2016"
  },
  {
    "code": "CN2",
    "name": "Conspiracy: Take the Crown",
    "year": "2016"
  },
  {
    "code": "TCN2",
    "name": "Conspiracy: Take the Crown Tokens",
    "year": "2016"
  },
  {
    "code": "DDQ",
    "name": "Duel Decks: Blessed vs. Cursed",
    "year": "2016"
  },
  {
    "code": "DDR",
    "name": "Duel Decks: Nissa vs. Ob Nixilis",
    "year": "2016"
  },
  {
    "code": "EMN",
    "name": "Eldritch Moon",
    "year": "2016"
  },
  {
    "code": "PEMN",
    "name": "Eldritch Moon Promos",
    "year": "2016"
  },
  {
    "code": "TEMN",
    "name": "Eldritch Moon Tokens",
    "year": "2016"
  },
  {
    "code": "EMA",
    "name": "Eternal Masters",
    "year": "2016"
  },
  {
    "code": "TEMA",
    "name": "Eternal Masters Tokens",
    "year": "2016"
  },
  {
    "code": "F16",
    "name": "Friday Night Magic 2016",
    "year": "2016"
  },
  {
    "code": "V16",
    "name": "From the Vault: Lore",
    "year": "2016"
  },
  {
    "code": "J16",
    "name": "Judge Gift Cards 2016",
    "year": "2016"
  },
  {
    "code": "MPS",
    "name": "Kaladesh Inventions",
    "year": "2016"
  },
  {
    "code": "PKLD",
    "name": "Kaladesh Promos",
    "year": "2016"
  },
  {
    "code": "TKLD",
    "name": "Kaladesh Tokens",
    "year": "2016"
  },
  {
    "code": "L16",
    "name": "League Tokens 2016",
    "year": "2016"
  },
  {
    "code": "OGW",
    "name": "Oath of the Gatewatch",
    "year": "2016"
  },
  {
    "code": "POGW",
    "name": "Oath of the Gatewatch Promos",
    "year": "2016"
  },
  {
    "code": "TOGW",
    "name": "Oath of the Gatewatch Tokens",
    "year": "2016"
  },
  {
    "code": "PCA",
    "name": "Planechase Anthology",
    "year": "2016"
  },
  {
    "code": "OPCA",
    "name": "Planechase Anthology Planes",
    "year": "2016"
  },
  {
    "code": "TPCA",
    "name": "Planechase Anthology Tokens",
    "year": "2016"
  },
  {
    "code": "PS16",
    "name": "San Diego Comic-Con 2016",
    "year": "2016"
  },
  {
    "code": "SOI",
    "name": "Shadows over Innistrad",
    "year": "2016"
  },
  {
    "code": "PSOI",
    "name": "Shadows over Innistrad Promos",
    "year": "2016"
  },
  {
    "code": "TSOI",
    "name": "Shadows over Innistrad Tokens",
    "year": "2016"
  },
  {
    "code": "PZ2",
    "name": "Treasure Chest",
    "year": "2016"
  },
  {
    "code": "W16",
    "name": "Welcome Deck 2016",
    "year": "2016"
  },
  {
    "code": "PHTR",
    "name": "2016 Heroes of the Realm",
    "year": "2017"
  },
  {
    "code": "G17",
    "name": "2017 Gift Pack",
    "year": "2017"
  },
  {
    "code": "AER",
    "name": "Aether Revolt",
    "year": "2017"
  },
  {
    "code": "PAER",
    "name": "Aether Revolt Promos",
    "year": "2017"
  },
  {
    "code": "TAER",
    "name": "Aether Revolt Tokens",
    "year": "2017"
  },
  {
    "code": "MP2",
    "name": "Amonkhet Invocations",
    "year": "2017"
  },
  {
    "code": "PAKH",
    "name": "Amonkhet Promos",
    "year": "2017"
  },
  {
    "code": "TAKH",
    "name": "Amonkhet Tokens",
    "year": "2017"
  },
  {
    "code": "E01",
    "name": "Archenemy: Nicol Bolas",
    "year": "2017"
  },
  {
    "code": "OE01",
    "name": "Archenemy: Nicol Bolas Schemes",
    "year": "2017"
  },
  {
    "code": "TE01",
    "name": "Archenemy: Nicol Bolas Tokens",
    "year": "2017"
  },
  {
    "code": "C17",
    "name": "Commander 2017",
    "year": "2017"
  },
  {
    "code": "OC17",
    "name": "Commander 2017 Oversized",
    "year": "2017"
  },
  {
    "code": "TC17",
    "name": "Commander 2017 Tokens",
    "year": "2017"
  },
  {
    "code": "CMA",
    "name": "Commander Anthology",
    "year": "2017"
  },
  {
    "code": "TCMA",
    "name": "Commander Anthology Tokens",
    "year": "2017"
  },
  {
    "code": "DDT",
    "name": "Duel Decks: Merfolk vs. Goblins",
    "year": "2017"
  },
  {
    "code": "TDDT",
    "name": "Duel Decks: Merfolk vs. Goblins Tokens",
    "year": "2017"
  },
  {
    "code": "DDS",
    "name": "Duel Decks: Mind vs. Might",
    "year": "2017"
  },
  {
    "code": "TDDS",
    "name": "Duel Decks: Mind vs. Might Tokens",
    "year": "2017"
  },
  {
    "code": "E02",
    "name": "Explorers of Ixalan",
    "year": "2017"
  },
  {
    "code": "F17",
    "name": "Friday Night Magic 2017",
    "year": "2017"
  },
  {
    "code": "F18",
    "name": "Friday Night Magic 2018",
    "year": "2017"
  },
  {
    "code": "V17",
    "name": "From the Vault: Transform",
    "year": "2017"
  },
  {
    "code": "H17",
    "name": "HasCon 2017",
    "year": "2017"
  },
  {
    "code": "HOU",
    "name": "Hour of Devastation",
    "year": "2017"
  },
  {
    "code": "PHOU",
    "name": "Hour of Devastation Promos",
    "year": "2017"
  },
  {
    "code": "THOU",
    "name": "Hour of Devastation Tokens",
    "year": "2017"
  },
  {
    "code": "IMA",
    "name": "Iconic Masters",
    "year": "2017"
  },
  {
    "code": "TIMA",
    "name": "Iconic Masters Tokens",
    "year": "2017"
  },
  {
    "code": "PXLN",
    "name": "Ixalan Promos",
    "year": "2017"
  },
  {
    "code": "TXLN",
    "name": "Ixalan Tokens",
    "year": "2017"
  },
  {
    "code": "J17",
    "name": "Judge Gift Cards 2017",
    "year": "2017"
  },
  {
    "code": "L17",
    "name": "League Tokens 2017",
    "year": "2017"
  },
  {
    "code": "MM3",
    "name": "Modern Masters 2017",
    "year": "2017"
  },
  {
    "code": "TMM3",
    "name": "Modern Masters 2017 Tokens",
    "year": "2017"
  },
  {
    "code": "PS17",
    "name": "San Diego Comic-Con 2017",
    "year": "2017"
  },
  {
    "code": "UST",
    "name": "Unstable",
    "year": "2017"
  },
  {
    "code": "PUST",
    "name": "Unstable Promos",
    "year": "2017"
  },
  {
    "code": "TUST",
    "name": "Unstable Tokens",
    "year": "2017"
  },
  {
    "code": "W17",
    "name": "Welcome Deck 2017",
    "year": "2017"
  },
  {
    "code": "PSS2",
    "name": "XLN Standard Showdown",
    "year": "2017"
  },
  {
    "code": "PXTC",
    "name": "XLN Treasure Chest",
    "year": "2017"
  },
  {
    "code": "PH17",
    "name": "2017 Heroes of the Realm",
    "year": "2018"
  },
  {
    "code": "ANA",
    "name": "Arena New Player Experience",
    "year": "2018"
  },
  {
    "code": "OANA",
    "name": "Arena New Player Experience Cards",
    "year": "2018"
  },
  {
    "code": "XANA",
    "name": "Arena New Player Experience Extras",
    "year": "2018"
  },
  {
    "code": "BBD",
    "name": "Battlebond",
    "year": "2018"
  },
  {
    "code": "PBBD",
    "name": "Battlebond Promos",
    "year": "2018"
  },
  {
    "code": "TBBD",
    "name": "Battlebond Tokens",
    "year": "2018"
  },
  {
    "code": "C18",
    "name": "Commander 2018",
    "year": "2018"
  },
  {
    "code": "OC18",
    "name": "Commander 2018 Oversized",
    "year": "2018"
  },
  {
    "code": "TC18",
    "name": "Commander 2018 Tokens",
    "year": "2018"
  },
  {
    "code": "CM2",
    "name": "Commander Anthology Volume II",
    "year": "2018"
  },
  {
    "code": "TCM2",
    "name": "Commander Anthology Volume II Tokens",
    "year": "2018"
  },
  {
    "code": "M19",
    "name": "Core Set 2019",
    "year": "2018"
  },
  {
    "code": "PM19",
    "name": "Core Set 2019 Promos",
    "year": "2018"
  },
  {
    "code": "TM19",
    "name": "Core Set 2019 Tokens",
    "year": "2018"
  },
  {
    "code": "PDOM",
    "name": "Dominaria Promos",
    "year": "2018"
  },
  {
    "code": "TDOM",
    "name": "Dominaria Tokens",
    "year": "2018"
  },
  {
    "code": "DDU",
    "name": "Duel Decks: Elves vs. Inventors",
    "year": "2018"
  },
  {
    "code": "TDDU",
    "name": "Duel Decks: Elves vs. Inventors Tokens",
    "year": "2018"
  },
  {
    "code": "GK1",
    "name": "GRN Guild Kit",
    "year": "2018"
  },
  {
    "code": "TGK1",
    "name": "GRN Guild Kit Tokens",
    "year": "2018"
  },
  {
    "code": "PRWK",
    "name": "GRN Ravnica Weekend",
    "year": "2018"
  },
  {
    "code": "GNT",
    "name": "Game Night",
    "year": "2018"
  },
  {
    "code": "GS1",
    "name": "Global Series Jiang Yanggu & Mu Yanling",
    "year": "2018"
  },
  {
    "code": "PGRN",
    "name": "Guilds of Ravnica Promos",
    "year": "2018"
  },
  {
    "code": "TGRN",
    "name": "Guilds of Ravnica Tokens",
    "year": "2018"
  },
  {
    "code": "J18",
    "name": "Judge Gift Cards 2018",
    "year": "2018"
  },
  {
    "code": "PLNY",
    "name": "Lunar New Year 2018",
    "year": "2018"
  },
  {
    "code": "G18",
    "name": "M19 Gift Pack",
    "year": "2018"
  },
  {
    "code": "PSS3",
    "name": "M19 Standard Showdown",
    "year": "2018"
  },
  {
    "code": "PANA",
    "name": "MTG Arena Promos",
    "year": "2018"
  },
  {
    "code": "A25",
    "name": "Masters 25",
    "year": "2018"
  },
  {
    "code": "TA25",
    "name": "Masters 25 Tokens",
    "year": "2018"
  },
  {
    "code": "MED",
    "name": "Mythic Edition",
    "year": "2018"
  },
  {
    "code": "TMED",
    "name": "Mythic Edition Tokens",
    "year": "2018"
  },
  {
    "code": "PNAT",
    "name": "Nationals Promos",
    "year": "2018"
  },
  {
    "code": "RIX",
    "name": "Rivals of Ixalan",
    "year": "2018"
  },
  {
    "code": "PRIX",
    "name": "Rivals of Ixalan Promos",
    "year": "2018"
  },
  {
    "code": "TRIX",
    "name": "Rivals of Ixalan Tokens",
    "year": "2018"
  },
  {
    "code": "PS18",
    "name": "San Diego Comic-Con 2018",
    "year": "2018"
  },
  {
    "code": "SS1",
    "name": "Signature Spellbook: Jace",
    "year": "2018"
  },
  {
    "code": "PUMA",
    "name": "Ultimate Box Topper",
    "year": "2018"
  },
  {
    "code": "UMA",
    "name": "Ultimate Masters",
    "year": "2018"
  },
  {
    "code": "TUMA",
    "name": "Ultimate Masters Tokens",
    "year": "2018"
  },
  {
    "code": "PH18",
    "name": "2018 Heroes of the Realm",
    "year": "2019"
  },
  {
    "code": "C19",
    "name": "Commander 2019",
    "year": "2019"
  },
  {
    "code": "OC19",
    "name": "Commander 2019 Oversized",
    "year": "2019"
  },
  {
    "code": "TC19",
    "name": "Commander 2019 Tokens",
    "year": "2019"
  },
  {
    "code": "M20",
    "name": "Core Set 2020",
    "year": "2019"
  },
  {
    "code": "PM20",
    "name": "Core Set 2020 Promos",
    "year": "2019"
  },
  {
    "code": "TM20",
    "name": "Core Set 2020 Tokens",
    "year": "2019"
  },
  {
    "code": "GN2",
    "name": "Game Night 2019",
    "year": "2019"
  },
  {
    "code": "TGN2",
    "name": "Game Night 2019 Tokens",
    "year": "2019"
  },
  {
    "code": "HA1",
    "name": "Historic Anthology 1",
    "year": "2019"
  },
  {
    "code": "J19",
    "name": "Judge Gift Cards 2019",
    "year": "2019"
  },
  {
    "code": "PPP1",
    "name": "M20 Promo Packs",
    "year": "2019"
  },
  {
    "code": "PF19",
    "name": "MagicFest 2019",
    "year": "2019"
  },
  {
    "code": "MH1",
    "name": "Modern Horizons",
    "year": "2019"
  },
  {
    "code": "AMH1",
    "name": "Modern Horizons Art Series",
    "year": "2019"
  },
  {
    "code": "PMH1",
    "name": "Modern Horizons Promos",
    "year": "2019"
  },
  {
    "code": "TMH1",
    "name": "Modern Horizons Tokens",
    "year": "2019"
  },
  {
    "code": "CMB1",
    "name": "Mystery Booster Playtest Cards 2019",
    "year": "2019"
  },
  {
    "code": "PWCS",
    "name": "Planeswalker Championship Promos",
    "year": "2019"
  },
  {
    "code": "PTG",
    "name": "Ponies: The Galloping",
    "year": "2019"
  },
  {
    "code": "GK2",
    "name": "RNA Guild Kit",
    "year": "2019"
  },
  {
    "code": "TGK2",
    "name": "RNA Guild Kit Tokens",
    "year": "2019"
  },
  {
    "code": "PRW2",
    "name": "RNA Ravnica Weekend",
    "year": "2019"
  },
  {
    "code": "PRNA",
    "name": "Ravnica Allegiance Promos",
    "year": "2019"
  },
  {
    "code": "TRNA",
    "name": "Ravnica Allegiance Tokens",
    "year": "2019"
  },
  {
    "code": "PS19",
    "name": "San Diego Comic-Con 2019",
    "year": "2019"
  },
  {
    "code": "SLD",
    "name": "Secret Lair Drop",
    "year": "2019"
  },
  {
    "code": "SS2",
    "name": "Signature Spellbook: Gideon",
    "year": "2019"
  },
  {
    "code": "PELD",
    "name": "Throne of Eldraine Promos",
    "year": "2019"
  },
  {
    "code": "TELD",
    "name": "Throne of Eldraine Tokens",
    "year": "2019"
  },
  {
    "code": "PWAR",
    "name": "War of the Spark Promos",
    "year": "2019"
  },
  {
    "code": "TWAR",
    "name": "War of the Spark Tokens",
    "year": "2019"
  },
  {
    "code": "PH19",
    "name": "2019 Heroes of the Realm",
    "year": "2020"
  },
  {
    "code": "AKR",
    "name": "Amonkhet Remastered",
    "year": "2020"
  },
  {
    "code": "ANB",
    "name": "Arena Beginner Set",
    "year": "2020"
  },
  {
    "code": "C20",
    "name": "Commander 2020",
    "year": "2020"
  },
  {
    "code": "OC20",
    "name": "Commander 2020 Oversized",
    "year": "2020"
  },
  {
    "code": "TC20",
    "name": "Commander 2020 Tokens",
    "year": "2020"
  },
  {
    "code": "CC1",
    "name": "Commander Collection: Green",
    "year": "2020"
  },
  {
    "code": "CMR",
    "name": "Commander Legends",
    "year": "2020"
  },
  {
    "code": "PCMR",
    "name": "Commander Legends Promos",
    "year": "2020"
  },
  {
    "code": "TCMR",
    "name": "Commander Legends Tokens",
    "year": "2020"
  },
  {
    "code": "M21",
    "name": "Core Set 2021",
    "year": "2020"
  },
  {
    "code": "PM21",
    "name": "Core Set 2021 Promos",
    "year": "2020"
  },
  {
    "code": "TM21",
    "name": "Core Set 2021 Tokens",
    "year": "2020"
  },
  {
    "code": "2XM",
    "name": "Double Masters",
    "year": "2020"
  },
  {
    "code": "T2XM",
    "name": "Double Masters Tokens",
    "year": "2020"
  },
  {
    "code": "HA2",
    "name": "Historic Anthology 2",
    "year": "2020"
  },
  {
    "code": "HA3",
    "name": "Historic Anthology 3",
    "year": "2020"
  },
  {
    "code": "PIKO",
    "name": "Ikoria: Lair of Behemoths Promos",
    "year": "2020"
  },
  {
    "code": "TIKO",
    "name": "Ikoria: Lair of Behemoths Tokens",
    "year": "2020"
  },
  {
    "code": "J20",
    "name": "Judge Gift Cards 2020",
    "year": "2020"
  },
  {
    "code": "JMP",
    "name": "Jumpstart",
    "year": "2020"
  },
  {
    "code": "AJMP",
    "name": "Jumpstart Arena Exclusives",
    "year": "2020"
  },
  {
    "code": "FJMP",
    "name": "Jumpstart Front Cards",
    "year": "2020"
  },
  {
    "code": "KLR",
    "name": "Kaladesh Remastered",
    "year": "2020"
  },
  {
    "code": "PLG20",
    "name": "Love Your LGS 2020",
    "year": "2020"
  },
  {
    "code": "PF20",
    "name": "MagicFest 2020",
    "year": "2020"
  },
  {
    "code": "SLU",
    "name": "Secret Lair: Ultimate Edition",
    "year": "2020"
  },
  {
    "code": "SS3",
    "name": "Signature Spellbook: Chandra",
    "year": "2020"
  },
  {
    "code": "PLST",
    "name": "The List",
    "year": "2020"
  },
  {
    "code": "PTHB",
    "name": "Theros Beyond Death Promos",
    "year": "2020"
  },
  {
    "code": "TTHB",
    "name": "Theros Beyond Death Tokens",
    "year": "2020"
  },
  {
    "code": "UND",
    "name": "Unsanctioned",
    "year": "2020"
  },
  {
    "code": "TUND",
    "name": "Unsanctioned Tokens",
    "year": "2020"
  },
  {
    "code": "AZNR",
    "name": "Zendikar Rising Art Series",
    "year": "2020"
  },
  {
    "code": "ZNC",
    "name": "Zendikar Rising Commander",
    "year": "2020"
  },
  {
    "code": "TZNC",
    "name": "Zendikar Rising Commander Tokens",
    "year": "2020"
  },
  {
    "code": "ZNE",
    "name": "Zendikar Rising Expeditions",
    "year": "2020"
  },
  {
    "code": "MZNR",
    "name": "Zendikar Rising Minigames",
    "year": "2020"
  },
  {
    "code": "PZNR",
    "name": "Zendikar Rising Promos",
    "year": "2020"
  },
  {
    "code": "SZNR",
    "name": "Zendikar Rising Substitute Cards",
    "year": "2020"
  },
  {
    "code": "TZNR",
    "name": "Zendikar Rising Tokens",
    "year": "2020"
  },
  {
    "code": "PH20",
    "name": "2020 Heroes of the Realm",
    "year": "2021"
  },
  {
    "code": "AAFR",
    "name": "Adventures in the Forgotten Realms Art Series",
    "year": "2021"
  },
  {
    "code": "MAFR",
    "name": "Adventures in the Forgotten Realms Minigames",
    "year": "2021"
  },
  {
    "code": "PAFR",
    "name": "Adventures in the Forgotten Realms Promos",
    "year": "2021"
  },
  {
    "code": "TAFR",
    "name": "Adventures in the Forgotten Realms Tokens",
    "year": "2021"
  },
  {
    "code": "YMID",
    "name": "Alchemy: Innistrad",
    "year": "2021"
  },
  {
    "code": "C21",
    "name": "Commander 2021",
    "year": "2021"
  },
  {
    "code": "OC21",
    "name": "Commander 2021 Display Commanders",
    "year": "2021"
  },
  {
    "code": "TC21",
    "name": "Commander 2021 Tokens",
    "year": "2021"
  },
  {
    "code": "AVOW",
    "name": "Crimson Vow Art Series",
    "year": "2021"
  },
  {
    "code": "VOC",
    "name": "Crimson Vow Commander",
    "year": "2021"
  },
  {
    "code": "OVOC",
    "name": "Crimson Vow Commander Display Commanders",
    "year": "2021"
  },
  {
    "code": "TVOC",
    "name": "Crimson Vow Commander Tokens",
    "year": "2021"
  },
  {
    "code": "AFC",
    "name": "Forgotten Realms Commander",
    "year": "2021"
  },
  {
    "code": "OAFC",
    "name": "Forgotten Realms Commander Display Commanders",
    "year": "2021"
  },
  {
    "code": "TAFC",
    "name": "Forgotten Realms Commander Tokens",
    "year": "2021"
  },
  {
    "code": "OAFR",
    "name": "Forgotten Realms Oversized Cards",
    "year": "2021"
  },
  {
    "code": "HA4",
    "name": "Historic Anthology 4",
    "year": "2021"
  },
  {
    "code": "HA5",
    "name": "Historic Anthology 5",
    "year": "2021"
  },
  {
    "code": "MVOW",
    "name": "Innistrad: Crimson Vow Minigames",
    "year": "2021"
  },
  {
    "code": "PVOW",
    "name": "Innistrad: Crimson Vow Promos",
    "year": "2021"
  },
  {
    "code": "SVOW",
    "name": "Innistrad: Crimson Vow Substitute Cards",
    "year": "2021"
  },
  {
    "code": "TVOW",
    "name": "Innistrad: Crimson Vow Tokens",
    "year": "2021"
  },
  {
    "code": "MMID",
    "name": "Innistrad: Midnight Hunt Minigames",
    "year": "2021"
  },
  {
    "code": "PMID",
    "name": "Innistrad: Midnight Hunt Promos",
    "year": "2021"
  },
  {
    "code": "SMID",
    "name": "Innistrad: Midnight Hunt Substitute Cards",
    "year": "2021"
  },
  {
    "code": "TMID",
    "name": "Innistrad: Midnight Hunt Tokens",
    "year": "2021"
  },
  {
    "code": "PJ21",
    "name": "Judge Gift Cards 2021",
    "year": "2021"
  },
  {
    "code": "J21",
    "name": "Jumpstart: Historic Horizons",
    "year": "2021"
  },
  {
    "code": "AKHM",
    "name": "Kaldheim Art Series",
    "year": "2021"
  },
  {
    "code": "KHC",
    "name": "Kaldheim Commander",
    "year": "2021"
  },
  {
    "code": "TKHC",
    "name": "Kaldheim Commander Tokens",
    "year": "2021"
  },
  {
    "code": "MKHM",
    "name": "Kaldheim Minigames",
    "year": "2021"
  },
  {
    "code": "PKHM",
    "name": "Kaldheim Promos",
    "year": "2021"
  },
  {
    "code": "SKHM",
    "name": "Kaldheim Substitute Cards",
    "year": "2021"
  },
  {
    "code": "TKHM",
    "name": "Kaldheim Tokens",
    "year": "2021"
  },
  {
    "code": "PLG21",
    "name": "Love Your LGS 2021",
    "year": "2021"
  },
  {
    "code": "AMID",
    "name": "Midnight Hunt Art Series",
    "year": "2021"
  },
  {
    "code": "MIC",
    "name": "Midnight Hunt Commander",
    "year": "2021"
  },
  {
    "code": "OMIC",
    "name": "Midnight Hunt Commander Display Commanders",
    "year": "2021"
  },
  {
    "code": "TMIC",
    "name": "Midnight Hunt Commander Tokens",
    "year": "2021"
  },
  {
    "code": "H1R",
    "name": "Modern Horizons 1 Timeshifts",
    "year": "2021"
  },
  {
    "code": "MH2",
    "name": "Modern Horizons 2",
    "year": "2021"
  },
  {
    "code": "AMH2",
    "name": "Modern Horizons 2 Art Series",
    "year": "2021"
  },
  {
    "code": "MMH2",
    "name": "Modern Horizons 2 Minigames",
    "year": "2021"
  },
  {
    "code": "PMH2",
    "name": "Modern Horizons 2 Promos",
    "year": "2021"
  },
  {
    "code": "TMH2",
    "name": "Modern Horizons 2 Tokens",
    "year": "2021"
  },
  {
    "code": "CMB2",
    "name": "Mystery Booster Playtest Cards 2021",
    "year": "2021"
  },
  {
    "code": "Q06",
    "name": "Pioneer Challenger Decks 2021",
    "year": "2021"
  },
  {
    "code": "ASTX",
    "name": "Strixhaven Art Series",
    "year": "2021"
  },
  {
    "code": "STA",
    "name": "Strixhaven Mystical Archive",
    "year": "2021"
  },
  {
    "code": "MSTX",
    "name": "Strixhaven: School of Mages Minigames",
    "year": "2021"
  },
  {
    "code": "PSTX",
    "name": "Strixhaven: School of Mages Promos",
    "year": "2021"
  },
  {
    "code": "SSTX",
    "name": "Strixhaven: School of Mages Substitute Cards",
    "year": "2021"
  },
  {
    "code": "TSTX",
    "name": "Strixhaven: School of Mages Tokens",
    "year": "2021"
  },
  {
    "code": "TSR",
    "name": "Time Spiral Remastered",
    "year": "2021"
  },
  {
    "code": "TTSR",
    "name": "Time Spiral Remastered Tokens",
    "year": "2021"
  },
  {
    "code": "PW21",
    "name": "Wizards Play Network 2021",
    "year": "2021"
  },
  {
    "code": "PL21",
    "name": "Year of the Ox 2021",
    "year": "2021"
  },
  {
    "code": "PH21",
    "name": "2021 Heroes of the Realm",
    "year": "2022"
  },
  {
    "code": "30A",
    "name": "30th Anniversary Edition",
    "year": "2022"
  },
  {
    "code": "P30H",
    "name": "30th Anniversary History Promos",
    "year": "2022"
  },
  {
    "code": "P30M",
    "name": "30th Anniversary Misc Promos",
    "year": "2022"
  },
  {
    "code": "P30A",
    "name": "30th Anniversary Play Promos",
    "year": "2022"
  },
  {
    "code": "T30A",
    "name": "30th Anniversary Tokens",
    "year": "2022"
  },
  {
    "code": "HBG",
    "name": "Alchemy Horizons: Baldur's Gate",
    "year": "2022"
  },
  {
    "code": "YDMU",
    "name": "Alchemy: Dominaria",
    "year": "2022"
  },
  {
    "code": "YNEO",
    "name": "Alchemy: Kamigawa",
    "year": "2022"
  },
  {
    "code": "YSNC",
    "name": "Alchemy: New Capenna",
    "year": "2022"
  },
  {
    "code": "YBRO",
    "name": "Alchemy: The Brothers' War",
    "year": "2022"
  },
  {
    "code": "ACLB",
    "name": "Battle for Baldur's Gate Art Series",
    "year": "2022"
  },
  {
    "code": "OCLB",
    "name": "Battle for Baldur's Gate Oversized Cards",
    "year": "2022"
  },
  {
    "code": "PCLB",
    "name": "Battle for Baldur's Gate Promos",
    "year": "2022"
  },
  {
    "code": "TCLB",
    "name": "Battle for Baldur's Gate Tokens",
    "year": "2022"
  },
  {
    "code": "Q07",
    "name": "Challenger Decks 2022",
    "year": "2022"
  },
  {
    "code": "CC2",
    "name": "Commander Collection: Black",
    "year": "2022"
  },
  {
    "code": "CLB",
    "name": "Commander Legends: Battle for Baldur's Gate",
    "year": "2022"
  },
  {
    "code": "MCLB",
    "name": "Commander Legends: Battle for Baldur's Gate Minigames",
    "year": "2022"
  },
  {
    "code": "WDMU",
    "name": "DMU Japanese Promo Tokens",
    "year": "2022"
  },
  {
    "code": "ADMU",
    "name": "Dominaria United Art Series",
    "year": "2022"
  },
  {
    "code": "DMC",
    "name": "Dominaria United Commander",
    "year": "2022"
  },
  {
    "code": "TDMC",
    "name": "Dominaria United Commander Tokens",
    "year": "2022"
  },
  {
    "code": "FDMU",
    "name": "Dominaria United Jumpstart Front Cards",
    "year": "2022"
  },
  {
    "code": "MDMU",
    "name": "Dominaria United Minigames",
    "year": "2022"
  },
  {
    "code": "PDMU",
    "name": "Dominaria United Promos",
    "year": "2022"
  },
  {
    "code": "PTDMU",
    "name": "Dominaria United Southeast Asia Tokens",
    "year": "2022"
  },
  {
    "code": "TDMU",
    "name": "Dominaria United Tokens",
    "year": "2022"
  },
  {
    "code": "2X2",
    "name": "Double Masters 2022",
    "year": "2022"
  },
  {
    "code": "T2X2",
    "name": "Double Masters 2022 Tokens",
    "year": "2022"
  },
  {
    "code": "PEWK",
    "name": "Eternal Weekend",
    "year": "2022"
  },
  {
    "code": "EA1",
    "name": "Explorer Anthology 1",
    "year": "2022"
  },
  {
    "code": "EA2",
    "name": "Explorer Anthology 2",
    "year": "2022"
  },
  {
    "code": "GDY",
    "name": "Game Day Promos",
    "year": "2022"
  },
  {
    "code": "GN3",
    "name": "Game Night: Free-for-All",
    "year": "2022"
  },
  {
    "code": "TGN3",
    "name": "Game Night: Free-for-All Tokens",
    "year": "2022"
  },
  {
    "code": "HA6",
    "name": "Historic Anthology 6",
    "year": "2022"
  },
  {
    "code": "DBL",
    "name": "Innistrad: Double Feature",
    "year": "2022"
  },
  {
    "code": "P22",
    "name": "Judge Gift Cards 2022",
    "year": "2022"
  },
  {
    "code": "J22",
    "name": "Jumpstart 2022",
    "year": "2022"
  },
  {
    "code": "FJ22",
    "name": "Jumpstart 2022 Front Cards",
    "year": "2022"
  },
  {
    "code": "MNEO",
    "name": "Kamigawa: Neon Dynasty Minigames",
    "year": "2022"
  },
  {
    "code": "PNEO",
    "name": "Kamigawa: Neon Dynasty Promos",
    "year": "2022"
  },
  {
    "code": "SNEO",
    "name": "Kamigawa: Neon Dynasty Substitute Cards",
    "year": "2022"
  },
  {
    "code": "TNEO",
    "name": "Kamigawa: Neon Dynasty Tokens",
    "year": "2022"
  },
  {
    "code": "PLG22",
    "name": "Love Your LGS 2022",
    "year": "2022"
  },
  {
    "code": "ANEO",
    "name": "Neon Dynasty Art Series",
    "year": "2022"
  },
  {
    "code": "NEC",
    "name": "Neon Dynasty Commander",
    "year": "2022"
  },
  {
    "code": "TNEC",
    "name": "Neon Dynasty Commander Tokens",
    "year": "2022"
  },
  {
    "code": "ASNC",
    "name": "New Capenna Art Series",
    "year": "2022"
  },
  {
    "code": "NCC",
    "name": "New Capenna Commander",
    "year": "2022"
  },
  {
    "code": "PNCC",
    "name": "New Capenna Commander Promos",
    "year": "2022"
  },
  {
    "code": "TNCC",
    "name": "New Capenna Commander Tokens",
    "year": "2022"
  },
  {
    "code": "PRCQ",
    "name": "Regional Championship Qualifiers 2022",
    "year": "2022"
  },
  {
    "code": "SLC",
    "name": "Secret Lair Countdown",
    "year": "2022"
  },
  {
    "code": "TSCD",
    "name": "Starter Commander Deck Tokens",
    "year": "2022"
  },
  {
    "code": "SCD",
    "name": "Starter Commander Decks",
    "year": "2022"
  },
  {
    "code": "SCH",
    "name": "Store Championships",
    "year": "2022"
  },
  {
    "code": "MSNC",
    "name": "Streets of New Capenna Minigames",
    "year": "2022"
  },
  {
    "code": "PSNC",
    "name": "Streets of New Capenna Promos",
    "year": "2022"
  },
  {
    "code": "PTSNC",
    "name": "Streets of New Capenna Southeast Asia Tokens",
    "year": "2022"
  },
  {
    "code": "TSNC",
    "name": "Streets of New Capenna Tokens",
    "year": "2022"
  },
  {
    "code": "PSVC",
    "name": "Summer Vacation Promos 2022",
    "year": "2022"
  },
  {
    "code": "ABRO",
    "name": "The Brothers' War Art Series",
    "year": "2022"
  },
  {
    "code": "BRC",
    "name": "The Brothers' War Commander",
    "year": "2022"
  },
  {
    "code": "TBRC",
    "name": "The Brothers' War Commander Tokens",
    "year": "2022"
  },
  {
    "code": "FBRO",
    "name": "The Brothers' War Jumpstart Front Cards",
    "year": "2022"
  },
  {
    "code": "MBRO",
    "name": "The Brothers' War Minigames",
    "year": "2022"
  },
  {
    "code": "PBRO",
    "name": "The Brothers' War Promos",
    "year": "2022"
  },
  {
    "code": "BRR",
    "name": "The Brothers' War Retro Artifacts",
    "year": "2022"
  },
  {
    "code": "PTBRO",
    "name": "The Brothers' War Southeast Asia Tokens",
    "year": "2022"
  },
  {
    "code": "SBRO",
    "name": "The Brothers' War Substitute Cards",
    "year": "2022"
  },
  {
    "code": "TBRO",
    "name": "The Brothers' War Tokens",
    "year": "2022"
  },
  {
    "code": "ULST",
    "name": "The List (Unfinity Foil Edition)",
    "year": "2022"
  },
  {
    "code": "BOT",
    "name": "Transformers",
    "year": "2022"
  },
  {
    "code": "TBOT",
    "name": "Transformers Tokens",
    "year": "2022"
  },
  {
    "code": "UNF",
    "name": "Unfinity",
    "year": "2022"
  },
  {
    "code": "SUNF",
    "name": "Unfinity Sticker Sheets",
    "year": "2022"
  },
  {
    "code": "TUNF",
    "name": "Unfinity Tokens",
    "year": "2022"
  },
  {
    "code": "SLX",
    "name": "Universes Within",
    "year": "2022"
  },
  {
    "code": "40K",
    "name": "Warhammer 40,000 Commander",
    "year": "2022"
  },
  {
    "code": "T40K",
    "name": "Warhammer 40,000 Tokens",
    "year": "2022"
  },
  {
    "code": "PW22",
    "name": "Wizards Play Network 2022",
    "year": "2022"
  },
  {
    "code": "PL22",
    "name": "Year of the Tiger 2022",
    "year": "2022"
  },
  {
    "code": "PH22",
    "name": "2022 Heroes of the Realm",
    "year": "2023"
  },
  {
    "code": "P30T",
    "name": "30th Anniversary Celebration Tokyo",
    "year": "2023"
  },
  {
    "code": "YLCI",
    "name": "Alchemy: Ixalan",
    "year": "2023"
  },
  {
    "code": "YONE",
    "name": "Alchemy: Phyrexia",
    "year": "2023"
  },
  {
    "code": "YWOE",
    "name": "Alchemy: Wilds of Eldraine",
    "year": "2023"
  },
  {
    "code": "CMM",
    "name": "Commander Masters",
    "year": "2023"
  },
  {
    "code": "ACMM",
    "name": "Commander Masters Art Series",
    "year": "2023"
  },
  {
    "code": "TCMM",
    "name": "Commander Masters Tokens",
    "year": "2023"
  },
  {
    "code": "WHO",
    "name": "Doctor Who",
    "year": "2023"
  },
  {
    "code": "TWHO",
    "name": "Doctor Who Tokens",
    "year": "2023"
  },
  {
    "code": "DMR",
    "name": "Dominaria Remastered",
    "year": "2023"
  },
  {
    "code": "TDMR",
    "name": "Dominaria Remastered Tokens",
    "year": "2023"
  },
  {
    "code": "EA3",
    "name": "Explorer Anthology 3",
    "year": "2023"
  },
  {
    "code": "HA7",
    "name": "Historic Anthology 7",
    "year": "2023"
  },
  {
    "code": "P23",
    "name": "Judge Gift Cards 2023",
    "year": "2023"
  },
  {
    "code": "REX",
    "name": "Jurassic World Collection",
    "year": "2023"
  },
  {
    "code": "TREX",
    "name": "Jurassic World Collection Tokens",
    "year": "2023"
  },
  {
    "code": "WMOM",
    "name": "MOM Japanese Promo Tokens",
    "year": "2023"
  },
  {
    "code": "PMDA",
    "name": "Magic × Duel Masters Promos",
    "year": "2023"
  },
  {
    "code": "PF23",
    "name": "MagicFest 2023",
    "year": "2023"
  },
  {
    "code": "AMOM",
    "name": "March of the Machine Art Series",
    "year": "2023"
  },
  {
    "code": "MOC",
    "name": "March of the Machine Commander",
    "year": "2023"
  },
  {
    "code": "TMOC",
    "name": "March of the Machine Commander Tokens",
    "year": "2023"
  },
  {
    "code": "FMOM",
    "name": "March of the Machine Jumpstart Front Cards",
    "year": "2023"
  },
  {
    "code": "PMOM",
    "name": "March of the Machine Promos",
    "year": "2023"
  },
  {
    "code": "SMOM",
    "name": "March of the Machine Substitute Cards",
    "year": "2023"
  },
  {
    "code": "TMOM",
    "name": "March of the Machine Tokens",
    "year": "2023"
  },
  {
    "code": "MAT",
    "name": "March of the Machine: The Aftermath",
    "year": "2023"
  },
  {
    "code": "PMAT",
    "name": "March of the Machine: The Aftermath Promos",
    "year": "2023"
  },
  {
    "code": "MUL",
    "name": "Multiverse Legends",
    "year": "2023"
  },
  {
    "code": "TMUL",
    "name": "Multiverse Legends Tokens",
    "year": "2023"
  },
  {
    "code": "WONE",
    "name": "ONE Japanese Promo Tokens",
    "year": "2023"
  },
  {
    "code": "AONE",
    "name": "Phyrexia: All Will Be One Art Series",
    "year": "2023"
  },
  {
    "code": "ONC",
    "name": "Phyrexia: All Will Be One Commander",
    "year": "2023"
  },
  {
    "code": "TONC",
    "name": "Phyrexia: All Will Be One Commander Tokens",
    "year": "2023"
  },
  {
    "code": "FONE",
    "name": "Phyrexia: All Will Be One Jumpstart Front Cards",
    "year": "2023"
  },
  {
    "code": "MONE",
    "name": "Phyrexia: All Will Be One Minigames",
    "year": "2023"
  },
  {
    "code": "PONE",
    "name": "Phyrexia: All Will Be One Promos",
    "year": "2023"
  },
  {
    "code": "TONE",
    "name": "Phyrexia: All Will Be One Tokens",
    "year": "2023"
  },
  {
    "code": "PR23",
    "name": "Regional Championship Qualifiers 2023",
    "year": "2023"
  },
  {
    "code": "SLP",
    "name": "Secret Lair Promo",
    "year": "2023"
  },
  {
    "code": "SIS",
    "name": "Shadows of the Past",
    "year": "2023"
  },
  {
    "code": "SIR",
    "name": "Shadows over Innistrad Remastered",
    "year": "2023"
  },
  {
    "code": "SPG",
    "name": "Special Guests",
    "year": "2023"
  },
  {
    "code": "ALTR",
    "name": "Tales of Middle-earth Art Series",
    "year": "2023"
  },
  {
    "code": "LTC",
    "name": "Tales of Middle-earth Commander",
    "year": "2023"
  },
  {
    "code": "TLTC",
    "name": "Tales of Middle-earth Commander Tokens",
    "year": "2023"
  },
  {
    "code": "FLTR",
    "name": "Tales of Middle-earth Front Cards",
    "year": "2023"
  },
  {
    "code": "PLTR",
    "name": "Tales of Middle-earth Promos",
    "year": "2023"
  },
  {
    "code": "ALTC",
    "name": "Tales of Middle-earth Scene Box",
    "year": "2023"
  },
  {
    "code": "TLTR",
    "name": "Tales of Middle-earth Tokens",
    "year": "2023"
  },
  {
    "code": "LTR",
    "name": "The Lord of the Rings: Tales of Middle-earth",
    "year": "2023"
  },
  {
    "code": "MLTR",
    "name": "The Lord of the Rings: Tales of Middle-earth Minigames",
    "year": "2023"
  },
  {
    "code": "ALCI",
    "name": "The Lost Caverns of Ixalan Art Series",
    "year": "2023"
  },
  {
    "code": "LCC",
    "name": "The Lost Caverns of Ixalan Commander",
    "year": "2023"
  },
  {
    "code": "TLCC",
    "name": "The Lost Caverns of Ixalan Commander Tokens",
    "year": "2023"
  },
  {
    "code": "PLCI",
    "name": "The Lost Caverns of Ixalan Promos",
    "year": "2023"
  },
  {
    "code": "SLCI",
    "name": "The Lost Caverns of Ixalan Substitute Cards",
    "year": "2023"
  },
  {
    "code": "TLCI",
    "name": "The Lost Caverns of Ixalan Tokens",
    "year": "2023"
  },
  {
    "code": "PTSR",
    "name": "Time Spiral Remastered Promos",
    "year": "2023"
  },
  {
    "code": "UNK",
    "name": "Unknown Event",
    "year": "2023"
  },
  {
    "code": "WWOE",
    "name": "WOE Japanese Promo Tokens",
    "year": "2023"
  },
  {
    "code": "AWOE",
    "name": "Wilds of Eldraine Art Series",
    "year": "2023"
  },
  {
    "code": "WOC",
    "name": "Wilds of Eldraine Commander",
    "year": "2023"
  },
  {
    "code": "TWOC",
    "name": "Wilds of Eldraine Commander Tokens",
    "year": "2023"
  },
  {
    "code": "PWOE",
    "name": "Wilds of Eldraine Promos",
    "year": "2023"
  },
  {
    "code": "TWOE",
    "name": "Wilds of Eldraine Tokens",
    "year": "2023"
  },
  {
    "code": "WOT",
    "name": "Wilds of Eldraine: Enchanting Tales",
    "year": "2023"
  },
  {
    "code": "PW23",
    "name": "Wizards Play Network 2023",
    "year": "2023"
  },
  {
    "code": "PL23",
    "name": "Year of the Rabbit 2023",
    "year": "2023"
  },
  {
    "code": "YBLB",
    "name": "Alchemy: Bloomburrow",
    "year": "2024"
  },
  {
    "code": "YDSK",
    "name": "Alchemy: Duskmourn",
    "year": "2024"
  },
  {
    "code": "YMKM",
    "name": "Alchemy: Murders at Karlov Manor",
    "year": "2024"
  },
  {
    "code": "YOTJ",
    "name": "Alchemy: Outlaws of Thunder Junction",
    "year": "2024"
  },
  {
    "code": "ACR",
    "name": "Assassin's Creed",
    "year": "2024"
  },
  {
    "code": "AACR",
    "name": "Assassin's Creed Art Series",
    "year": "2024"
  },
  {
    "code": "MACR",
    "name": "Assassin's Creed Minigames",
    "year": "2024"
  },
  {
    "code": "TACR",
    "name": "Assassin's Creed Tokens",
    "year": "2024"
  },
  {
    "code": "PUNK",
    "name": "Black Lotus Unknown Planechase",
    "year": "2024"
  },
  {
    "code": "ABLB",
    "name": "Bloomburrow Art Series",
    "year": "2024"
  },
  {
    "code": "BLC",
    "name": "Bloomburrow Commander",
    "year": "2024"
  },
  {
    "code": "TBLC",
    "name": "Bloomburrow Commander Tokens",
    "year": "2024"
  },
  {
    "code": "PBLB",
    "name": "Bloomburrow Promos",
    "year": "2024"
  },
  {
    "code": "TBLB",
    "name": "Bloomburrow Tokens",
    "year": "2024"
  },
  {
    "code": "OTP",
    "name": "Breaking News",
    "year": "2024"
  },
  {
    "code": "TOTP",
    "name": "Breaking News Tokens",
    "year": "2024"
  },
  {
    "code": "PCBB",
    "name": "Cowboy Bebop",
    "year": "2024"
  },
  {
    "code": "TDSC",
    "name": "Duskmourn Commander Tokens",
    "year": "2024"
  },
  {
    "code": "ADSK",
    "name": "Duskmourn: House of Horror Art Series",
    "year": "2024"
  },
  {
    "code": "DSC",
    "name": "Duskmourn: House of Horror Commander",
    "year": "2024"
  },
  {
    "code": "PDSK",
    "name": "Duskmourn: House of Horror Promos",
    "year": "2024"
  },
  {
    "code": "TDSK",
    "name": "Duskmourn: House of Horror Tokens",
    "year": "2024"
  },
  {
    "code": "PIP",
    "name": "Fallout",
    "year": "2024"
  },
  {
    "code": "TPIP",
    "name": "Fallout Tokens",
    "year": "2024"
  },
  {
    "code": "AFDN",
    "name": "Foundations Art Series",
    "year": "2024"
  },
  {
    "code": "FDC",
    "name": "Foundations Commander",
    "year": "2024"
  },
  {
    "code": "FFDN",
    "name": "Foundations Front Cards",
    "year": "2024"
  },
  {
    "code": "J25",
    "name": "Foundations Jumpstart",
    "year": "2024"
  },
  {
    "code": "FJ25",
    "name": "Foundations Jumpstart Front Cards",
    "year": "2024"
  },
  {
    "code": "PFDN",
    "name": "Foundations Promos",
    "year": "2024"
  },
  {
    "code": "TFDN",
    "name": "Foundations Tokens",
    "year": "2024"
  },
  {
    "code": "PLG24",
    "name": "Love Your LGS 2024",
    "year": "2024"
  },
  {
    "code": "WMKM",
    "name": "MKM Japanese Promo Tokens",
    "year": "2024"
  },
  {
    "code": "PSS4",
    "name": "MKM Standard Showdown",
    "year": "2024"
  },
  {
    "code": "PF24",
    "name": "MagicFest 2024",
    "year": "2024"
  },
  {
    "code": "H2R",
    "name": "Modern Horizons 2 Timeshifts",
    "year": "2024"
  },
  {
    "code": "MH3",
    "name": "Modern Horizons 3",
    "year": "2024"
  },
  {
    "code": "AMH3",
    "name": "Modern Horizons 3 Art Series",
    "year": "2024"
  },
  {
    "code": "M3C",
    "name": "Modern Horizons 3 Commander",
    "year": "2024"
  },
  {
    "code": "TM3C",
    "name": "Modern Horizons 3 Commander Tokens",
    "year": "2024"
  },
  {
    "code": "PMH3",
    "name": "Modern Horizons 3 Promos",
    "year": "2024"
  },
  {
    "code": "SMH3",
    "name": "Modern Horizons 3 Substitute Cards",
    "year": "2024"
  },
  {
    "code": "TMH3",
    "name": "Modern Horizons 3 Tokens",
    "year": "2024"
  },
  {
    "code": "AMKM",
    "name": "Murders at Karlov Manor Art Series",
    "year": "2024"
  },
  {
    "code": "MKC",
    "name": "Murders at Karlov Manor Commander",
    "year": "2024"
  },
  {
    "code": "TMKC",
    "name": "Murders at Karlov Manor Commander Tokens",
    "year": "2024"
  },
  {
    "code": "PMKM",
    "name": "Murders at Karlov Manor Promos",
    "year": "2024"
  },
  {
    "code": "TMKM",
    "name": "Murders at Karlov Manor Tokens",
    "year": "2024"
  },
  {
    "code": "MB2",
    "name": "Mystery Booster 2",
    "year": "2024"
  },
  {
    "code": "AOTJ",
    "name": "Outlaws of Thunder Junction Art Series",
    "year": "2024"
  },
  {
    "code": "OTC",
    "name": "Outlaws of Thunder Junction Commander",
    "year": "2024"
  },
  {
    "code": "TOTC",
    "name": "Outlaws of Thunder Junction Commander Tokens",
    "year": "2024"
  },
  {
    "code": "POTJ",
    "name": "Outlaws of Thunder Junction Promos",
    "year": "2024"
  },
  {
    "code": "TOTJ",
    "name": "Outlaws of Thunder Junction Tokens",
    "year": "2024"
  },
  {
    "code": "PIO",
    "name": "Pioneer Masters",
    "year": "2024"
  },
  {
    "code": "RVR",
    "name": "Ravnica Remastered",
    "year": "2024"
  },
  {
    "code": "TRVR",
    "name": "Ravnica Remastered Tokens",
    "year": "2024"
  },
  {
    "code": "CLU",
    "name": "Ravnica: Clue Edition",
    "year": "2024"
  },
  {
    "code": "FCLU",
    "name": "Ravnica: Clue Edition Front Cards",
    "year": "2024"
  },
  {
    "code": "PLTC",
    "name": "Tales of Middle-earth Deluxe Commander Kit",
    "year": "2024"
  },
  {
    "code": "BIG",
    "name": "The Big Score",
    "year": "2024"
  },
  {
    "code": "TBIG",
    "name": "The Big Score Tokens",
    "year": "2024"
  },
  {
    "code": "PW24",
    "name": "Wizards Play Network 2024",
    "year": "2024"
  },
  {
    "code": "PL24",
    "name": "Year of the Dragon 2024",
    "year": "2024"
  },
  {
    "code": "PH23",
    "name": "2023 Heroes of the Realm",
    "year": "2025"
  },
  {
    "code": "DFT",
    "name": "Aetherdrift",
    "year": "2025"
  },
  {
    "code": "ADFT",
    "name": "Aetherdrift Art Series",
    "year": "2025"
  },
  {
    "code": "DRC",
    "name": "Aetherdrift Commander",
    "year": "2025"
  },
  {
    "code": "TDRC",
    "name": "Aetherdrift Commander Tokens",
    "year": "2025"
  },
  {
    "code": "PDFT",
    "name": "Aetherdrift Promos",
    "year": "2025"
  },
  {
    "code": "TDFT",
    "name": "Aetherdrift Tokens",
    "year": "2025"
  },
  {
    "code": "YDFT",
    "name": "Alchemy: Aetherdrift",
    "year": "2025"
  },
  {
    "code": "YEOE",
    "name": "Alchemy: Edge of Eternities",
    "year": "2025"
  },
  {
    "code": "YTDM",
    "name": "Alchemy: Tarkir",
    "year": "2025"
  },
  {
    "code": "AA1",
    "name": "Arena Anthology 1",
    "year": "2025"
  },
  {
    "code": "AA2",
    "name": "Arena Anthology 2",
    "year": "2025"
  },
  {
    "code": "AA3",
    "name": "Arena Anthology 3",
    "year": "2025"
  },
  {
    "code": "AA4",
    "name": "Arena Anthology 4",
    "year": "2025"
  },
  {
    "code": "TLA",
    "name": "Avatar: The Last Airbender",
    "year": "2025"
  },
  {
    "code": "FTLA",
    "name": "Avatar: The Last Airbender Beginner Box Front Cards",
    "year": "2025"
  },
  {
    "code": "TLE",
    "name": "Avatar: The Last Airbender Eternal",
    "year": "2025"
  },
  {
    "code": "TTLE",
    "name": "Avatar: The Last Airbender Eternal Tokens",
    "year": "2025"
  },
  {
    "code": "JTLA",
    "name": "Avatar: The Last Airbender Jumpstart Front Cards",
    "year": "2025"
  },
  {
    "code": "PTLA",
    "name": "Avatar: The Last Airbender Promos",
    "year": "2025"
  },
  {
    "code": "TTLA",
    "name": "Avatar: The Last Airbender Tokens",
    "year": "2025"
  },
  {
    "code": "ATLA",
    "name": "Avatar: the Last Airbender Art Series",
    "year": "2025"
  },
  {
    "code": "ATLE",
    "name": "Avatar: the Last Airbender Eternal Art Series",
    "year": "2025"
  },
  {
    "code": "EOE",
    "name": "Edge of Eternities",
    "year": "2025"
  },
  {
    "code": "AEOE",
    "name": "Edge of Eternities Art Series",
    "year": "2025"
  },
  {
    "code": "EOC",
    "name": "Edge of Eternities Commander",
    "year": "2025"
  },
  {
    "code": "TEOC",
    "name": "Edge of Eternities Commander Tokens",
    "year": "2025"
  },
  {
    "code": "PEOE",
    "name": "Edge of Eternities Promos",
    "year": "2025"
  },
  {
    "code": "TEOE",
    "name": "Edge of Eternities Tokens",
    "year": "2025"
  },
  {
    "code": "EOS",
    "name": "Edge of Eternities: Stellar Sights",
    "year": "2025"
  },
  {
    "code": "WFIN",
    "name": "FIN Asia WPN Promo Tokens",
    "year": "2025"
  },
  {
    "code": "PSS5",
    "name": "FIN Standard Showdown",
    "year": "2025"
  },
  {
    "code": "FIN",
    "name": "Final Fantasy",
    "year": "2025"
  },
  {
    "code": "AFIN",
    "name": "Final Fantasy Art Series",
    "year": "2025"
  },
  {
    "code": "FIC",
    "name": "Final Fantasy Commander",
    "year": "2025"
  },
  {
    "code": "TFIC",
    "name": "Final Fantasy Commander Tokens",
    "year": "2025"
  },
  {
    "code": "PFIN",
    "name": "Final Fantasy Promos",
    "year": "2025"
  },
  {
    "code": "RFIN",
    "name": "Final Fantasy Regional Promos",
    "year": "2025"
  },
  {
    "code": "AFIC",
    "name": "Final Fantasy Scene Box",
    "year": "2025"
  },
  {
    "code": "TFIN",
    "name": "Final Fantasy Tokens",
    "year": "2025"
  },
  {
    "code": "FCA",
    "name": "Final Fantasy: Through the Ages",
    "year": "2025"
  },
  {
    "code": "INR",
    "name": "Innistrad Remastered",
    "year": "2025"
  },
  {
    "code": "AINR",
    "name": "Innistrad Remastered Art Series",
    "year": "2025"
  },
  {
    "code": "TINR",
    "name": "Innistrad Remastered Tokens",
    "year": "2025"
  },
  {
    "code": "PJSC",
    "name": "Japan Standard Cup",
    "year": "2025"
  },
  {
    "code": "PLG25",
    "name": "Love Your LGS 2025",
    "year": "2025"
  },
  {
    "code": "PF25",
    "name": "MagicFest 2025",
    "year": "2025"
  },
  {
    "code": "LMAR",
    "name": "Marvel Legends Series Inserts",
    "year": "2025"
  },
  {
    "code": "MAR",
    "name": "Marvel Universe",
    "year": "2025"
  },
  {
    "code": "SPM",
    "name": "Marvel's Spider-Man",
    "year": "2025"
  },
  {
    "code": "ASPM",
    "name": "Marvel's Spider-Man Art Series",
    "year": "2025"
  },
  {
    "code": "SPE",
    "name": "Marvel's Spider-Man Eternal",
    "year": "2025"
  },
  {
    "code": "PSPM",
    "name": "Marvel's Spider-Man Promos",
    "year": "2025"
  },
  {
    "code": "TSPM",
    "name": "Marvel's Spider-Man Tokens",
    "year": "2025"
  },
  {
    "code": "PA1",
    "name": "Pioneer Anthology 1",
    "year": "2025"
  },
  {
    "code": "PSSC",
    "name": "Secret Lair Showcase Planes",
    "year": "2025"
  },
  {
    "code": "PSPL",
    "name": "Spotlight Series",
    "year": "2025"
  },
  {
    "code": "TDM",
    "name": "Tarkir: Dragonstorm",
    "year": "2025"
  },
  {
    "code": "ATDM",
    "name": "Tarkir: Dragonstorm Art Series",
    "year": "2025"
  },
  {
    "code": "TDC",
    "name": "Tarkir: Dragonstorm Commander",
    "year": "2025"
  },
  {
    "code": "TTDC",
    "name": "Tarkir: Dragonstorm Commander Tokens",
    "year": "2025"
  },
  {
    "code": "PTDM",
    "name": "Tarkir: Dragonstorm Promos",
    "year": "2025"
  },
  {
    "code": "TTDM",
    "name": "Tarkir: Dragonstorm Tokens",
    "year": "2025"
  },
  {
    "code": "PBIG",
    "name": "The Big Score Promos",
    "year": "2025"
  },
  {
    "code": "OM1",
    "name": "Through the Omenpaths",
    "year": "2025"
  },
  {
    "code": "OMB",
    "name": "Through the Omenpaths Bonus Sheet",
    "year": "2025"
  },
  {
    "code": "PW25",
    "name": "Wizards Play Network 2025",
    "year": "2025"
  },
  {
    "code": "PL25",
    "name": "Year of the Snake 2025",
    "year": "2025"
  },
  {
    "code": "YECL",
    "name": "Alchemy: Lorwyn Eclipsed",
    "year": "2026"
  },
  {
    "code": "YSOS",
    "name": "Alchemy: Secrets of Strixhaven",
    "year": "2026"
  },
  {
    "code": "ECL",
    "name": "Lorwyn Eclipsed",
    "year": "2026"
  },
  {
    "code": "AECL",
    "name": "Lorwyn Eclipsed Art Series",
    "year": "2026"
  },
  {
    "code": "ECC",
    "name": "Lorwyn Eclipsed Commander",
    "year": "2026"
  },
  {
    "code": "TECC",
    "name": "Lorwyn Eclipsed Commander Tokens",
    "year": "2026"
  },
  {
    "code": "PECL",
    "name": "Lorwyn Eclipsed Promos",
    "year": "2026"
  },
  {
    "code": "TECL",
    "name": "Lorwyn Eclipsed Tokens",
    "year": "2026"
  },
  {
    "code": "PF26",
    "name": "MagicFest 2026",
    "year": "2026"
  },
  {
    "code": "MSH",
    "name": "Marvel Super Heroes",
    "year": "2026"
  },
  {
    "code": "AMSH",
    "name": "Marvel Super Heroes Art Series",
    "year": "2026"
  },
  {
    "code": "MSC",
    "name": "Marvel Super Heroes Commander",
    "year": "2026"
  },
  {
    "code": "TMSC",
    "name": "Marvel Super Heroes Commander Tokens",
    "year": "2026"
  },
  {
    "code": "FMSC",
    "name": "Marvel Super Heroes Jumpstart Front Cards",
    "year": "2026"
  },
  {
    "code": "TMSH",
    "name": "Marvel Super Heroes Tokens",
    "year": "2026"
  },
  {
    "code": "MBC",
    "name": "Mystery Booster Commander Edition",
    "year": "2026"
  },
  {
    "code": "FRA",
    "name": "Reality Fracture",
    "year": "2026"
  },
  {
    "code": "FRC",
    "name": "Reality Fracture Commander",
    "year": "2026"
  },
  {
    "code": "SOS",
    "name": "Secrets of Strixhaven",
    "year": "2026"
  },
  {
    "code": "ASOS",
    "name": "Secrets of Strixhaven Art Series",
    "year": "2026"
  },
  {
    "code": "SOC",
    "name": "Secrets of Strixhaven Commander",
    "year": "2026"
  },
  {
    "code": "TSOC",
    "name": "Secrets of Strixhaven Commander Tokens",
    "year": "2026"
  },
  {
    "code": "SOA",
    "name": "Secrets of Strixhaven Mystical Archive",
    "year": "2026"
  },
  {
    "code": "PSOS",
    "name": "Secrets of Strixhaven Promos",
    "year": "2026"
  },
  {
    "code": "TSOS",
    "name": "Secrets of Strixhaven Tokens",
    "year": "2026"
  },
  {
    "code": "TRK",
    "name": "Star Trek",
    "year": "2026"
  },
  {
    "code": "TRC",
    "name": "Star Trek Commander",
    "year": "2026"
  },
  {
    "code": "TTRK",
    "name": "Star Trek Tokens",
    "year": "2026"
  },
  {
    "code": "SDS",
    "name": "Stardates",
    "year": "2026"
  },
  {
    "code": "TMT",
    "name": "Teenage Mutant Ninja Turtles",
    "year": "2026"
  },
  {
    "code": "ATMT",
    "name": "Teenage Mutant Ninja Turtles Art Series",
    "year": "2026"
  },
  {
    "code": "TMC",
    "name": "Teenage Mutant Ninja Turtles Eternal",
    "year": "2026"
  },
  {
    "code": "FTMC",
    "name": "Teenage Mutant Ninja Turtles Eternal Front Cards",
    "year": "2026"
  },
  {
    "code": "TTMC",
    "name": "Teenage Mutant Ninja Turtles Eternal Tokens",
    "year": "2026"
  },
  {
    "code": "PZA",
    "name": "Teenage Mutant Ninja Turtles Source Material",
    "year": "2026"
  },
  {
    "code": "TTMT",
    "name": "Teenage Mutant Ninja Turtles Tokens",
    "year": "2026"
  },
  {
    "code": "HOB",
    "name": "The Hobbit",
    "year": "2026"
  },
  {
    "code": "HOC",
    "name": "The Hobbit Eternal",
    "year": "2026"
  },
  {
    "code": "THOB",
    "name": "The Hobbit Tokens",
    "year": "2026"
  },
  {
    "code": "PW26",
    "name": "Wizards Play Network 2026",
    "year": "2026"
  },
  {
    "code": "PL26",
    "name": "Year of the Horse 2026",
    "year": "2026"
  }
];

export function findMtgSetByCode(code: string): MtgSet | undefined {
  const norm = code.trim().toUpperCase();
  return MTG_SETS.find((s) => s.code === norm);
}

export function findMtgSetByName(name: string): MtgSet | undefined {
  const norm = name.trim().toLowerCase();
  return MTG_SETS.find((s) => s.name.toLowerCase() === norm);
}

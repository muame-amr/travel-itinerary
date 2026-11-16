import * as XLSX from 'xlsx';
import fs from 'node:fs';
import path from 'node:path';

const sampleRows = [
  {
    Day: 'Day 1',
    Date: '2026-04-10',
    Time: '09:00 AM',
    Place: 'Senso-ji Temple',
    Address: '2-3-1 Asakusa, Taito City, Tokyo, Japan',
    Category: 'Sightseeing',
    Activity: 'Walk through Kaminarimon Gate, explore Nakamise shopping street, and visit Tokyo’s oldest Buddhist temple.',
    Cost: 'Free',
    Booking: 'Walk-in',
    Link: 'https://www.google.com/maps?q=35.714765,139.796655',
    Lat: 35.714765,
    Lng: 139.796655
  },
  {
    Day: 'Day 1',
    Date: '2026-04-10',
    Time: '11:30 AM',
    Place: 'Tokyo Skytree',
    Address: '1-1-2 Oshiage, Sumida City, Tokyo, Japan',
    Category: 'Attraction',
    Activity: 'Panoramic views of Tokyo from the 350m Tembo Deck and shopping at Solamachi.',
    Cost: '¥3,100',
    Booking: 'Booked (Ref: SKY-8821)',
    Link: 'https://www.tokyo-skytree.jp/en/',
    Lat: 35.710063,
    Lng: 139.8107
  },
  {
    Day: 'Day 1',
    Date: '2026-04-10',
    Time: '01:15 PM',
    Place: 'Tsukiji Outer Market',
    Address: '4-16-2 Tsukiji, Chuo City, Tokyo, Japan',
    Category: 'Food',
    Activity: 'Fresh sushi bowls, tamagoyaki skewers, and matcha desserts in the historic market alleys.',
    Cost: '¥4,500',
    Booking: 'No reservation needed',
    Link: 'https://www.google.com/maps?q=35.665486,139.770667',
    Lat: 35.665486,
    Lng: 139.770667
  },
  {
    Day: 'Day 1',
    Date: '2026-04-10',
    Time: '04:30 PM',
    Place: 'teamLab Planets TOKYO',
    Address: '6-1-16 Toyosu, Koto City, Tokyo, Japan',
    Category: 'Museum',
    Activity: 'Immersive barefoot digital art museum with water and crystal light installations.',
    Cost: '¥4,200',
    Booking: 'Timed Entry 16:30 (Ref: TL-4092)',
    Link: 'https://www.teamlab.art/e/planets/',
    Lat: 35.649123,
    Lng: 139.789779
  },
  {
    Day: 'Day 1',
    Date: '2026-04-10',
    Time: '07:30 PM',
    Place: 'Ginza Six Rooftop Garden',
    Address: '6-10-1 Ginza, Chuo City, Tokyo, Japan',
    Category: 'Shopping & Dining',
    Activity: 'Evening stroll in Ginza, dinner at the dining floor, and night city views from the rooftop garden.',
    Cost: '¥6,000',
    Booking: 'Table reserved at 19:45',
    Link: 'https://ginza6.tokyo/',
    Lat: 35.669586,
    Lng: 139.763958
  },
  {
    Day: 'Day 2',
    Date: '2026-04-11',
    Time: '09:30 AM',
    Place: 'Meiji Jingu Shrine',
    Address: '1-1 Yoyogikamizonocho, Shibuya City, Tokyo, Japan',
    Category: 'Sightseeing',
    Activity: 'Peaceful morning walk under towering forested torii gates and traditional sake barrels.',
    Cost: 'Free',
    Booking: 'Walk-in',
    Link: 'https://www.meijijingu.or.jp/en/',
    Lat: 35.676398,
    Lng: 139.699326
  },
  {
    Day: 'Day 2',
    Date: '2026-04-11',
    Time: '11:30 AM',
    Place: 'Takeshita Street (Harajuku)',
    Address: '1 Jingumae, Shibuya City, Tokyo, Japan',
    Category: 'Shopping',
    Activity: 'Explore quirky boutiques, vintage shops, and grab famous Harajuku crepes.',
    Cost: '¥2,000',
    Booking: 'Walk-in',
    Link: 'https://www.google.com/maps?q=35.671566,139.703148',
    Lat: 35.671566,
    Lng: 139.703148
  },
  {
    Day: 'Day 2',
    Date: '2026-04-11',
    Time: '02:00 PM',
    Place: 'Shibuya Sky & Scramble Crossing',
    Address: '2-24-12 Shibuya, Shibuya City, Tokyo, Japan',
    Category: 'Attraction',
    Activity: 'Cross the world’s busiest intersection, say hello to Hachiko statue, and ascend Shibuya Sky observation deck.',
    Cost: '¥2,500',
    Booking: 'Booked (Ref: SHB-119)',
    Link: 'https://www.shibuya-scramble-square.com/sky/',
    Lat: 35.658034,
    Lng: 139.701636
  },
  {
    Day: 'Day 2',
    Date: '2026-04-11',
    Time: '06:30 PM',
    Place: 'Omoide Yokocho & Shinjuku',
    Address: '1-2 Nishishinjuku, Shinjuku City, Tokyo, Japan',
    Category: 'Food',
    Activity: 'Yakitori dinner in nostalgic lantern-lit alleyways, followed by seeing the 3D giant cat billboard in Shinjuku.',
    Cost: '¥5,000',
    Booking: 'Walk-in',
    Link: 'https://www.google.com/maps?q=35.692972,139.699553',
    Lat: 35.692972,
    Lng: 139.699553
  },
  {
    Day: 'Day 3',
    Date: '2026-04-12',
    Time: '10:00 AM',
    Place: 'Ueno Park & Tokyo National Museum',
    Address: '13-9 Uenokoen, Taito City, Tokyo, Japan',
    Category: 'Museum',
    Activity: 'Stroll around Shinobazu Pond and view samurai armor, ukiyo-e prints, and national treasures.',
    Cost: '¥1,000',
    Booking: 'Walk-in',
    Link: 'https://www.tnm.jp/',
    Lat: 35.718835,
    Lng: 139.776522
  },
  {
    Day: 'Day 3',
    Date: '2026-04-12',
    Time: '01:00 PM',
    Place: 'Akihabara Electric Town',
    Address: '1 Sotokanda, Chiyoda City, Tokyo, Japan',
    Category: 'Shopping',
    Activity: 'Retro gaming arcades, anime figure stores, and electronics mega-stores.',
    Cost: '¥3,500',
    Booking: 'Walk-in',
    Link: 'https://www.google.com/maps?q=35.698383,139.773072',
    Lat: 35.698383,
    Lng: 139.773072
  },
  {
    Day: 'Day 3',
    Date: '2026-04-12',
    Time: '05:00 PM',
    Place: 'Tokyo Tower & Zojo-ji Temple',
    Address: '4-2-8 Shibakoen, Minato City, Tokyo, Japan',
    Category: 'Sightseeing',
    Activity: 'Golden hour photos at Zojo-ji Temple with Tokyo Tower illuminated in the background.',
    Cost: '¥1,200',
    Booking: 'Walk-in',
    Link: 'https://www.tokyotower.co.jp/en/',
    Lat: 35.658581,
    Lng: 139.745433
  }
];

const worksheet = XLSX.utils.json_to_sheet(sampleRows);
worksheet['!cols'] = [
  { wch: 10 }, // Day
  { wch: 12 }, // Date
  { wch: 12 }, // Time
  { wch: 30 }, // Place
  { wch: 42 }, // Address
  { wch: 18 }, // Category
  { wch: 65 }, // Activity
  { wch: 12 }, // Cost
  { wch: 28 }, // Booking
  { wch: 42 }, // Link
  { wch: 12 }, // Lat
  { wch: 12 }, // Lng
];

const workbook = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(workbook, worksheet, 'Itinerary');

const publicDir = path.resolve('public');
fs.mkdirSync(publicDir, { recursive: true });

const publicFile = path.join(publicDir, 'sample-itinerary.xlsx');
const rootFile = path.resolve('sample-itinerary.xlsx');

XLSX.writeFile(workbook, publicFile);
XLSX.writeFile(workbook, rootFile);

console.log(`Generated sample Excel itinerary at:\n - ${publicFile}\n - ${rootFile}`);

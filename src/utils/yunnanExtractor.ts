import * as XLSX from 'xlsx';
import {
  HotelBookingInfo,
  ItineraryItem,
  ParsedWorkbookResult,
  TransportLegInfo,
  TripLogisticsSummary,
} from '../types';
import { recomputeDistances } from './excelParser';

export function isYunnanTripWorkbook(workbook: XLSX.WorkBook): boolean {
  return workbook.SheetNames.some(
    (name) =>
      name.includes('Day-by-Day Outfit Plan') ||
      name.includes('Logistics & e-Arrival Card')
  );
}

function extractLogisticsFromSheet(
  workbook: XLSX.WorkBook
): TripLogisticsSummary | undefined {
  const sheetName = workbook.SheetNames.find((n) =>
    n.includes('Logistics & e-Arrival Card')
  );
  if (!sheetName) return undefined;

  const ws = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<string[]>(ws, {
    header: 1,
    defval: '',
    raw: false,
  });

  const hotels: HotelBookingInfo[] = [];
  const transportLegs: TransportLegInfo[] = [];
  let hotelsTotal = 'RM 789.10';
  let trainsTotal = 'RM 1,647.08';

  let mode: 'none' | 'hotels' | 'transport' = 'none';

  for (const row of rows) {
    const firstCell = String(row[0] || '').trim();
    if (firstCell.startsWith('TABLE B:')) {
      mode = 'hotels';
      continue;
    }
    if (firstCell.startsWith('TABLE C:')) {
      mode = 'transport';
      continue;
    }

    if (mode === 'hotels') {
      if (firstCell === 'Stay Segment' || !firstCell) continue;
      if (firstCell.startsWith('Total Confirmed')) {
        if (row[9]) hotelsTotal = String(row[9]).trim();
        mode = 'none';
        continue;
      }
      hotels.push({
        staySegment: firstCell,
        dates: String(row[1] || '').trim(),
        cityArea: String(row[2] || '').trim(),
        hotelName: String(row[3] || '').trim(),
        address: String(row[4] || '').trim(),
        contact: String(row[5] || '').trim(),
        roomType: String(row[6] || '').trim(),
        bookingStatus: String(row[7] || '').trim(),
        notes: String(row[8] || '').trim(),
        price: String(row[9] || '').trim(),
        link: String(row[10] || '').trim() || undefined,
      });
    } else if (mode === 'transport') {
      if (firstCell === 'Leg #' || !firstCell) continue;
      if (firstCell.startsWith('Total High-Speed')) {
        if (row[9]) trainsTotal = String(row[9]).trim();
        mode = 'none';
        continue;
      }
      transportLegs.push({
        leg: firstCell,
        dateAndType: String(row[1] || '').trim(),
        route: String(row[2] || '').trim(),
        carrier: String(row[3] || '').trim(),
        departure: String(row[4] || '').trim(),
        arrival: String(row[5] || '').trim(),
        passengers: String(row[6] || '').trim(),
        bookingRef: String(row[7] || '').trim(),
        notes: String(row[8] || '').trim(),
        price: String(row[9] || '').trim(),
        link: String(row[10] || '').trim() || undefined,
      });
    }
  }

  return {
    title: 'Yunnan & Hangzhou Expedition 2026',
    subtitle: 'Nov 6–15, 2026 · 10 Days / 9 Nights · 4 Travelers (Visa-Free)',
    duration: '10 Days (Nov 6–15, 2026)',
    travelers: 'Arif, Awis, Nuqman, Amiruddin (4 Pax)',
    hotelsTotal,
    trainsTotal,
    hotels,
    transportLegs,
  };
}

interface RawStopSeed {
  day: string;
  dayNumber: number;
  time: string;
  place: string;
  chineseName?: string;
  address: string;
  category: string;
  altitude: string;
  activity: string;
  logisticsNotes?: string;
  cost?: string;
  booking?: string;
  link?: string;
  lat: number;
  lng: number;
}

export function parseYunnanWorkbook(
  workbook: XLSX.WorkBook,
  fileName: string
): ParsedWorkbookResult {
  const outfitSheetName =
    workbook.SheetNames.find((n) => n.includes('Day-by-Day Outfit Plan')) ||
    workbook.SheetNames[0];
  const ws = workbook.Sheets[outfitSheetName];
  const rows = XLSX.utils.sheet_to_json<Record<string, string>>(ws, {
    defval: '',
    raw: false,
  });

  // Extract Day-level Date, Weather, Route, and Practical Notes directly from the Excel rows
  const dayMeta = new Map<
    string,
    {
      date: string;
      locationsAndAltitude: string;
      weather: string;
      practicalNotes: string;
      refUrl: string;
    }
  >();

  for (const r of rows) {
    const dayKey = String(r['Day'] || '').trim();
    if (!dayKey) continue;
    dayMeta.set(dayKey, {
      date: String(r['Date'] || '').trim(),
      locationsAndAltitude: String(r['Locations & Altitude'] || '').trim(),
      weather: String(r['Expected Temp & Weather'] || '').trim(),
      practicalNotes: String(r['Practical & Logistics Notes'] || '').trim(),
      refUrl: String(r['Weather / Destination Reference URL'] || '').trim(),
    });
  }

  const logistics = extractLogisticsFromSheet(workbook);

  // Curated stop-by-stop extraction from the Day-by-Day Planned Itinerary + Table B (Hotels) + Table C (Transport)
  const seeds: RawStopSeed[] = [
    // ================= DAY 1 (Fri, Nov 6, 2026) =================
    {
      day: 'Day 1',
      dayNumber: 1,
      time: '04:05 AM – 07:50 AM',
      place: 'Flight KLIA T1 → Kunming Changshui Airport (MU858)',
      chineseName: '昆明长水国际机场 (中国东方航空 MU858)',
      address: 'Kunming Changshui International Airport (KMG), Guandu District, Kunming, Yunnan',
      category: 'Flight',
      altitude: '1,890m',
      activity:
        'Depart Kuala Lumpur (KLIA T1) at 04:05 AM on China Eastern Airlines MU858, arriving Kunming (KMG) at 07:50 AM. Clear China 30-day visa-free immigration.',
      logisticsNotes:
        'Baggage allowance: 1 personal item + 1 carry-on (8kg) + 1 checked bag (23kg) per pax. Keep packable jacket at top of carry-on for 8–10°C morning landing.',
      cost: 'Included in Flight',
      booking: 'Confirmed | Booking #1433814282849193 | PNR: MFBREE',
      link: 'https://www.trip.com/',
      lat: 25.1019,
      lng: 102.9292,
    },
    {
      day: 'Day 1',
      dayNumber: 1,
      time: '10:00 AM',
      place: 'Kunming Yuboting Homestay (Railway Station)',
      chineseName: '昆明云泊庭酒店(火车站店)',
      address:
        '26F, Building 3, Xindu Yuncheng, No. 51 Yongping Road, Guandu District, Kunming (云南省昆明市官渡区永平路51号鑫都韵城3栋26楼)',
      category: 'Hotel',
      altitude: '1,890m',
      activity:
        'Early check-in confirmed after 10:00 AM. Located just 650m from Kunming Railway Station ahead of tomorrow morning’s high-speed bullet train to Dali.',
      logisticsNotes:
        'Boxiang Business Twin Room (4 adults, 2 queen beds). Phone: +86 871 6355 5545. Free cancellation before 18:00 Nov 6.',
      cost: 'RM 98.61',
      booking: 'Confirmed | Trip.com #1433815592437825',
      link: 'https://www.trip.com/hotels/kunming-hotel-detail-109882386/kunming-yuboting-homestay/',
      lat: 25.0185,
      lng: 102.7236,
    },
    {
      day: 'Day 1',
      dayNumber: 1,
      time: '02:00 PM',
      place: 'Green Lake Park (Cuihu Park)',
      chineseName: '翠湖公园',
      address: '220 Cuihu South Road, Wuhua District, Kunming, Yunnan',
      category: 'Sightseeing',
      altitude: '1,890m',
      activity:
        'Afternoon casual stroll around Kunming’s scenic Green Lake Park (Cuihu Park), pavilions, and migrating black-headed gulls in mild 17–18°C sunshine.',
      cost: 'Free',
      booking: 'Walk-in',
      lat: 25.0494,
      lng: 102.7031,
    },
    {
      day: 'Day 1',
      dayNumber: 1,
      time: '04:30 PM',
      place: 'Kunming Old Street & Shuncheng Mosque Area',
      chineseName: '昆明老街 & 顺城清真寺美食街',
      address: 'Guanghua Street & Shuncheng Street, Wuhua District, Kunming, Yunnan',
      category: 'Food & Culture',
      altitude: '1,890m',
      activity:
        'Explore historic Kunming Old Street architecture and enjoy halal Yunnan dinner around Shuncheng Mosque area. Rest early for tomorrow’s morning bullet train.',
      lat: 25.0406,
      lng: 102.7089,
    },

    // ================= DAY 2 (Sat, Nov 7, 2026) =================
    {
      day: 'Day 2',
      dayNumber: 2,
      time: '08:43 AM – 10:54 AM',
      place: 'Bullet Train: Kunming Station → Dali Station',
      chineseName: '昆明站 → 大理站 (高铁)',
      address: 'Kunming Railway Station → Dali Railway Station, Dali, Yunnan',
      category: 'Train',
      altitude: '1,890m → 1,990m',
      activity:
        'Board the 08:43 AM China Railway High-Speed bullet train from Kunming Railway Station (steps from homestay), arriving at Dali Railway Station at 10:54 AM.',
      logisticsNotes:
        'Bring original passports to enter the railway station via the manual verification lane.',
      cost: 'RM 318.96 (4 Pax)',
      booking: 'Reservation Submitted (Trip.com)',
      link: 'https://www.trip.com/trains/china/',
      lat: 25.5891,
      lng: 100.2512,
    },
    {
      day: 'Day 2',
      dayNumber: 2,
      time: '12:00 PM',
      place: 'YouZe·Yunye Realm Vacation Garden Homestay (Cai Village Pier)',
      chineseName: '云野境花园美宿(大理洱海才村码头店)',
      address:
        'No. 350, Village Group 5, Xiajiyi Village, Cai Village Pier, Dali Town (云南省大理白族自治州大理市大理镇下鸡邑村五社350号)',
      category: 'Hotel',
      altitude: '1,970m',
      activity:
        'Drop bags and check in at YouZe·Yunye Realm Homestay at Erhai Lake Cai Village Pier (official check-in after 14:00).',
      logisticsNotes:
        'Wangcang Twin Room · 1 Room (4 adults, 2 double beds). Contact property via Trip.com App ("Call/Message Property").',
      cost: 'RM 158.74',
      booking: 'Confirmed & PAID (Trip.com)',
      link: 'https://es.trip.com/hotels/dali-hotel-detail-133280671/youzeyunye-realm-relaxation-time-vacation-garden-homestay/',
      lat: 25.7126,
      lng: 100.1864,
    },
    {
      day: 'Day 2',
      dayNumber: 2,
      time: '02:00 PM',
      place: 'Erhai Lake Ecological Corridor & Cai Village Pier',
      chineseName: '洱海生态廊道 (才村码头)',
      address: 'Cai Village Pier, Erhai Lake West Shore, Dali, Yunnan',
      category: 'Sightseeing',
      altitude: '1,970m',
      activity:
        'Afternoon cycling and lakeside stroll along the scenic Erhai Lake Ecological Corridor right from Cai Village Pier.',
      logisticsNotes: 'Strong plateau UV and crisp 18–19°C lake breeze—wear sunglasses and sunscreen.',
      lat: 25.7155,
      lng: 100.1912,
    },
    {
      day: 'Day 2',
      dayNumber: 2,
      time: '04:00 PM',
      place: 'Three Pagodas of Chongsheng Temple',
      chineseName: '崇圣寺三塔',
      address: 'Chongsheng Temple, National Road 214, Dali Town, Dali, Yunnan',
      category: 'Sightseeing',
      altitude: '2,050m',
      activity:
        'Visit Dali’s iconic 9th-century Three Pagodas set against the dramatic Cangshan Mountain range.',
      lat: 25.7094,
      lng: 100.1463,
    },
    {
      day: 'Day 2',
      dayNumber: 2,
      time: '06:00 PM',
      place: 'Dali Ancient Town',
      chineseName: '大理古城 (复兴路 / 洋人街)',
      address: 'Fuxing Road & Foreigner Street, Dali Ancient Town, Dali, Yunnan',
      category: 'Sightseeing',
      altitude: '2,000m',
      activity:
        'Evening stroll through Dali Ancient Town gates, Fuxing Road pedestrian street, and halal dinner before returning to Erhai Lake homestay.',
      lat: 25.6953,
      lng: 100.1636,
    },

    // ================= DAY 3 (Sun, Nov 8, 2026) =================
    {
      day: 'Day 3',
      dayNumber: 3,
      time: '09:13 AM – 11:29 AM',
      place: 'Bullet Train: Dali Station → Lijiang Station',
      chineseName: '大理站 → 丽江站 (高铁)',
      address: 'Dali Railway Station → Lijiang Railway Station, Lijiang, Yunnan',
      category: 'Train',
      altitude: '1,990m → 2,400m',
      activity:
        'Check out of Dali homestay by 08:00 AM to reach Dali Station by 08:30 AM. Board 09:13 AM high-speed bullet train arriving Lijiang Railway Station at 11:29 AM.',
      cost: 'RM 220.24 (4 Pax)',
      booking: 'Reservation Submitted (Trip.com)',
      link: 'https://www.trip.com/trains/china/',
      lat: 26.8172,
      lng: 100.2456,
    },
    {
      day: 'Day 3',
      dayNumber: 3,
      time: '12:30 PM',
      place: 'Lijiang Old Town Hotel / Homestay',
      chineseName: '丽江古城酒店 / 客栈',
      address: 'Lijiang Old Town, Gucheng District, Lijiang, Yunnan (丽江市古城区丽江古城)',
      category: 'Hotel',
      altitude: '2,400m',
      activity:
        'Check in to Lijiang Hotel/Homestay and acclimatize to 2,400m elevation.',
      logisticsNotes:
        'Contact Abu Outdoor tour leader (+86 139 8879 9488) on WeChat today to confirm tomorrow’s 05:30 AM hotel pickup location and verify Nov 8–9 room details.',
      cost: 'TBD / Tour Add-on',
      booking: 'Coordinate with Abu Outdoor (+86 139 8879 9488)',
      lat: 26.8721,
      lng: 100.2335,
    },
    {
      day: 'Day 3',
      dayNumber: 3,
      time: '02:30 PM',
      place: 'Lijiang Old Town (Dayan Ancient Town)',
      chineseName: '丽江古城 (大研古镇四方街)',
      address: 'Sifang Street, Gucheng District, Lijiang, Yunnan',
      category: 'Sightseeing',
      altitude: '2,400m',
      activity:
        'Afternoon exploration of Lijiang Old Town’s stone bridges, canals, Big Water Wheels, and Sifang Street.',
      logisticsNotes:
        'Buy halal snacks, bread, and cup noodles tonight to pack for tomorrow’s Jade Dragon Snow Mountain lunch.',
      lat: 26.8729,
      lng: 100.2348,
    },
    {
      day: 'Day 3',
      dayNumber: 3,
      time: '04:30 PM',
      place: 'Black Dragon Pool Park (Heilongtan)',
      chineseName: '黑龙潭公园',
      address: 'No. 1 Minzhu Road, Gucheng District, Lijiang, Yunnan',
      category: 'Sightseeing',
      altitude: '2,400m',
      activity:
        'Stroll around Black Dragon Pool for the classic reflection view of Jade Dragon Snow Mountain over Suocui Bridge and Deyue Pavilion. Rest early for 05:30 AM pickup.',
      lat: 26.8856,
      lng: 100.2336,
    },

    // ================= DAY 4 (Mon, Nov 9, 2026) =================
    {
      day: 'Day 4',
      dayNumber: 4,
      time: '05:30 AM – 07:30 AM',
      place: 'Ganhaizi / Dongba Valley Golden Sunrise',
      chineseName: '玉龙雪山甘海子 / 东巴谷 (日照金山)',
      address: 'Ganhaizi Scenic Area, Yulong Naxi Autonomous County, Lijiang, Yunnan',
      category: 'Sightseeing',
      altitude: '3,100m–3,200m',
      activity:
        '05:30 AM pickup from Lijiang hotel by Abu Outdoor driver; 06:15 AM standby at Ganhaizi / Dongba Valley to witness the Golden Sunrise (~06:30 AM) illuminating Jade Dragon Snow Mountain.',
      booking: 'Abu Outdoor 4-Day Tour (Ref: ABO-1017/30/08/26)',
      lat: 27.0956,
      lng: 100.2553,
    },
    {
      day: 'Day 4',
      dayNumber: 4,
      time: '08:00 AM',
      place: 'Jade Dragon Snow Mountain Glacier Park (4,680m)',
      chineseName: '玉龙雪山冰川公园大索道 (4680米)',
      address: 'Glacier Park Cableway Upper Station, Jade Dragon Snow Mountain, Lijiang',
      category: 'Sightseeing',
      altitude: '4,680m',
      activity:
        'Take the Glacier Park Cableway up to 4,680m and walk slowly along the high-altitude wooden boardwalk to the 4,680m stone monument.',
      logisticsNotes:
        'Package includes cableway ticket, 1 oxygen canister, and 1 rental overcoat. Bring insulated thermos with hot water + halal snacks/cup noodles for lunch.',
      booking: 'Included in Abu Outdoor Tour',
      lat: 27.0986,
      lng: 100.1936,
    },
    {
      day: 'Day 4',
      dayNumber: 4,
      time: '12:00 PM',
      place: 'Blue Moon Valley (Baishui River)',
      chineseName: '蓝月谷 (白水河)',
      address: 'Blue Moon Valley, Jade Dragon Snow Mountain Scenic Area, Lijiang',
      category: 'Sightseeing',
      altitude: '3,100m',
      activity:
        'Midday walk along the mineral-rich turquoise lakes and white travertine waterfalls of Blue Moon Valley.',
      lat: 27.1258,
      lng: 100.2422,
    },
    {
      day: 'Day 4',
      dayNumber: 4,
      time: '02:50 PM – 04:00 PM',
      place: 'Impression Lijiang Outdoor Show',
      chineseName: '印象·丽江实景演出',
      address: 'Ganhaizi Impression Theater, Jade Dragon Snow Mountain, Lijiang',
      category: 'Sightseeing',
      altitude: '3,100m',
      activity:
        'Watch the open-air ethnic cultural performance "Impression Lijiang" staged at 3,100m against the snow mountain backdrop (ends 04:00 PM).',
      booking: 'Included in Abu Outdoor Tour',
      lat: 27.0933,
      lng: 100.2539,
    },
    {
      day: 'Day 4',
      dayNumber: 4,
      time: '05:00 PM',
      place: 'Shuhe Old Town & Baisha Old Town',
      chineseName: '束河古镇 & 白沙古镇',
      address: 'Shuhe Ancient Town, Gucheng District, Lijiang, Yunnan',
      category: 'Sightseeing',
      altitude: '2,400m',
      activity:
        '05:00 PM drop-off at Shuhe Old Town / Baisha Old Town for a relaxed evening stroll and dinner before overnighting in Lijiang.',
      lat: 26.9219,
      lng: 100.2047,
    },

    // ================= DAY 5 (Tue, Nov 10, 2026) =================
    {
      day: 'Day 5',
      dayNumber: 5,
      time: '10:00 AM',
      place: 'Tiger Leaping Gorge Scenic Area',
      chineseName: '虎跳峡景区',
      address: 'Tiger Leaping Gorge Town, Shangri-La, Diqing Prefecture, Yunnan',
      category: 'Sightseeing',
      altitude: '1,850m',
      activity:
        '09:00 AM depart Lijiang; arrive Tiger Leaping Gorge at 10:00 AM for 2 hours exploring one of the world’s deepest river canyons (tour package includes escalator).',
      logisticsNotes:
        'Eat halal lunch in the Tiger Leaping Gorge town area before going up to the scenic cliffside café.',
      booking: 'Included in Abu Outdoor Tour',
      lat: 27.1872,
      lng: 100.1208,
    },
    {
      day: 'Day 5',
      dayNumber: 5,
      time: '12:00 PM',
      place: 'Tiger Leaping Gorge Cliffside Café / Halfway Deck',
      chineseName: '虎跳峡悬崖咖啡 / 中途客栈观景台',
      address: 'Upper/Middle High Trail Observation Deck, Tiger Leaping Gorge, Shangri-La',
      category: 'Sightseeing',
      altitude: '2,250m',
      activity:
        'Panoramic canyon and snow mountain views from the Cliffside Café / Halfway / Tea Horse Guesthouse Observation Deck.',
      logisticsNotes:
        'Café entry requires 1 drink/person (28–88 CNY); sells hot water if you bring RTE halal meals/cup noodles.',
      cost: '28–88 CNY (1 drink/pax)',
      lat: 27.2244,
      lng: 100.1425,
    },
    {
      day: 'Day 5',
      dayNumber: 5,
      time: '02:00 PM',
      place: 'Haba Snow Mountain Observation Deck',
      chineseName: '哈巴雪山观景台',
      address: 'Sanba Township Highway Viewpoint, Shangri-La, Diqing Prefecture, Yunnan',
      category: 'Sightseeing',
      altitude: '2,800m',
      activity:
        'Scenic viewpoint overlooking the 5,396m Haba Snow Mountain peak and highland valleys en route to Baishuitai.',
      lat: 27.3694,
      lng: 100.1211,
    },
    {
      day: 'Day 5',
      dayNumber: 5,
      time: '04:00 PM',
      place: 'Baishuitai (White Water Terrace)',
      chineseName: '白水台',
      address: 'Baishui Village, Sanba Naxi Township, Shangri-La, Diqing, Yunnan',
      category: 'Sightseeing',
      altitude: '2,400m',
      activity:
        'Explore the cascading turquoise mineral spring terraces of Baishuitai, the birthplace of Naxi Dongba culture.',
      booking: 'Included in Abu Outdoor Tour',
      lat: 27.5025,
      lng: 100.0439,
    },
    {
      day: 'Day 5',
      dayNumber: 5,
      time: '07:00 PM',
      place: 'Dukezong Ancient Town & Shangri-La Hotel',
      chineseName: '香格里拉独克宗古城 (阿布户外住宿)',
      address:
        'No. 84 Langjue, Jinlong Neighborhood Committee, Dukezong Ancient Town, Shangri-La (香格里拉建塘镇独克宗古城金龙居委会廊觉84号)',
      category: 'Hotel',
      altitude: '3,200m–3,300m',
      activity:
        '07:00 PM arrival and check-in at Shangri-La Hotel/Homestay in Dukezong Ancient Town.',
      logisticsNotes:
        'Do not shower with very hot water for too long on your first night at 3,200m in Shangri-La to prevent altitude headaches.',
      booking: 'Abu Outdoor Tour Accommodation (Ref: ABO-1017/30/08/26)',
      lat: 27.8136,
      lng: 99.7069,
    },

    // ================= DAY 6 (Wed, Nov 11, 2026) =================
    {
      day: 'Day 6',
      dayNumber: 6,
      time: '09:40 AM',
      place: 'Napahai Wetland & Prairie Scenic Café',
      chineseName: '纳帕海依拉草原 (黑豆咖啡 / 鹿场)',
      address: 'Napahai Nature Reserve, Jiantang Town, Shangri-La, Yunnan',
      category: 'Sightseeing',
      altitude: '3,200m',
      activity:
        'Depart Shangri-La at 08:30 AM for Napahai Wetland and stop at a scenic prairie café (Heidou Café, Lisiman Wild Deer, or Muka Ranch).',
      lat: 27.8861,
      lng: 99.6486,
    },
    {
      day: 'Day 6',
      dayNumber: 6,
      time: '10:45 AM',
      place: 'Songzanlin Monastery (Ganden Sumtseling)',
      chineseName: '噶丹·松赞林寺',
      address: 'No. 3 Niwang Road, Jiantang Town, Shangri-La, Yunnan',
      category: 'Sightseeing',
      altitude: '3,380m',
      activity:
        'Explore Yunnan’s largest Tibetan Buddhist monastery ("Little Potala Palace"). Respect monastery dress code (long pants, covered shoulders, remove hats indoors).',
      booking: 'Included in Abu Outdoor Tour',
      lat: 27.8686,
      lng: 99.7031,
    },
    {
      day: 'Day 6',
      dayNumber: 6,
      time: '12:30 PM',
      place: 'Dukezong Old Town Lunch Stop',
      chineseName: '独克宗古城午餐',
      address: 'Dukezong Ancient Town, Jiantang Town, Shangri-La, Yunnan',
      category: 'Food',
      altitude: '3,200m',
      activity:
        'Midday lunch in Dukezong Old Town before driving northwest toward Deqin.',
      lat: 27.8142,
      lng: 99.7078,
    },
    {
      day: 'Day 6',
      dayNumber: 6,
      time: '02:00 PM',
      place: 'Helong Bridge (Jinsha River)',
      chineseName: '贺龙桥',
      address: 'Helong Bridge, Benzilan Town, Deqin County, Diqing, Yunnan',
      category: 'Sightseeing',
      altitude: '1,980m',
      activity:
        'Historic bridge stop across the roaring upper Jinsha River gorge in the warmer low-altitude valley (15–18°C).',
      lat: 28.1742,
      lng: 99.3547,
    },
    {
      day: 'Day 6',
      dayNumber: 6,
      time: '03:00 PM',
      place: 'Benzilan Town & Jinsha River Great Bend',
      chineseName: '奔子栏 & 金沙江大拐弯观景台',
      address: 'Jinsha River Omega Bend Viewing Deck, Benzilan Town, Deqin County, Yunnan',
      category: 'Sightseeing',
      altitude: '2,000m',
      activity:
        'Pass through Benzilan Town and view the dramatic 180-degree horseshoe bend ("Omega Bend") of the Jinsha River.',
      booking: 'Included in Abu Outdoor Tour',
      lat: 28.2397,
      lng: 99.2931,
    },
    {
      day: 'Day 6',
      dayNumber: 6,
      time: '05:00 PM',
      place: 'Feilai Temple Observation Deck (Meili Snow Mountain) & Deqin Stay',
      chineseName: '飞来寺观景台 (梅里雪山) & 德钦住宿',
      address: 'Feilai Temple Scenic Area, Shengping Town, Deqin County, Diqing, Yunnan',
      category: 'Hotel',
      altitude: '3,400m',
      activity:
        '05:00 PM sunset views of Meili Snow Mountain (6,740m Kawagarbo Peak) at Feilai Temple Observation Deck; 06:00 PM check in to Deqin hotel; 07:00 PM dinner & optional night stargazing at Feilai Deck / LangLiGeLang Café.',
      logisticsNotes:
        'Keep 15 CNY small cash per person in case local villagers collect cleaning fee at Feilaishi Deck.',
      booking: 'Abu Outdoor Tour Accommodation',
      lat: 28.4453,
      lng: 98.8781,
    },

    // ================= DAY 7 (Thu, Nov 12, 2026) =================
    {
      day: 'Day 7',
      dayNumber: 7,
      time: '07:00 AM – 08:30 AM',
      place: 'Feilai Temple Sunrise ("Sunlight over Golden Mountain")',
      chineseName: '飞来寺观景台 (梅里雪山日照金山)',
      address: 'Feilai Temple Observation Deck, Deqin County, Diqing, Yunnan',
      category: 'Sightseeing',
      altitude: '3,400m',
      activity:
        '07:00 AM sunrise standby at Feilai Observation Deck for the sacred "Sunlight over Golden Mountain" (Rizhao Jinshan) over Meili Snow Mountain at ~08:00 AM.',
      logisticsNotes:
        'Freezing stationary wait (-5°C to 2°C)—use adhesive hand and toe warmers and keep spare phone batteries warm.',
      lat: 28.4453,
      lng: 98.8781,
    },
    {
      day: 'Day 7',
      dayNumber: 7,
      time: '08:45 AM',
      place: 'Wunongding Observation Deck (13 White Pagodas)',
      chineseName: '雾浓顶观景台 (十三白塔)',
      address: 'Wunongding Village, Shengping Town, Deqin County, Diqing, Yunnan',
      category: 'Sightseeing',
      altitude: '3,620m',
      activity:
        'Morning panoramic view of the entire Meili Snow Mountain massif framed by the 13 White Pagodas at Wunongding, followed by 10:00 AM hotel rest/checkout and 12:00 PM Deqin lunch.',
      lat: 28.4219,
      lng: 98.9261,
    },
    {
      day: 'Day 7',
      dayNumber: 7,
      time: '01:00 PM',
      place: 'Baima Snow Mountain Pass (4,292m)',
      chineseName: '白马雪山垭口 (4292米)',
      address: 'G214 Baima Snow Mountain Pass, Deqin County, Diqing, Yunnan',
      category: 'Sightseeing',
      altitude: '4,292m',
      activity:
        'Cross the high-altitude Baima Snow Mountain Pass at 4,292m en route back toward Shangri-La.',
      lat: 28.3278,
      lng: 99.0789,
    },
    {
      day: 'Day 7',
      dayNumber: 7,
      time: '04:30 PM – 10:04 PM',
      place: 'Bullet Train: Shangri-La Station → Kunming Station',
      chineseName: '香格里拉站 → 昆明站 (高铁)',
      address: 'Shangri-La Railway Station → Kunming Railway Station',
      category: 'Train',
      altitude: '3,200m → 1,890m',
      activity:
        '04:30 PM Abu Outdoor tour drop-off at Shangri-La Railway Station. Board the 17:25 PM high-speed bullet train directly to Kunming, arriving at 22:04 PM.',
      logisticsNotes:
        'Stow heavy winter outer layers before boarding the heated 20°C–22°C train cabin.',
      cost: 'RM 1,107.88 (4 Pax)',
      booking: 'Reservation Submitted (Trip.com)',
      link: 'https://www.trip.com/trains/china/',
      lat: 27.8014,
      lng: 99.6872,
    },
    {
      day: 'Day 7',
      dayNumber: 7,
      time: '10:45 PM',
      place: 'Ximo Homestay (Kunming Old Street & Cuihu Branch)',
      chineseName: 'Seamo·喜陌民宿(昆明老街翠湖店)',
      address:
        '9th Floor, Xingjie Building, No. 168 Wuyi Road, Wuhua District, Kunming (云南省昆明市五华区五一路168号兴杰大厦9楼 — Metro Wuyi Rd Exit D)',
      category: 'Hotel',
      altitude: '1,890m',
      activity:
        'Arrive at Ximo Homestay (~22:45 PM via taxi/Metro from Kunming Station) for a 2-night post-tour stay in central Kunming.',
      logisticsNotes:
        'Mufeng Audio-Visual Twin Room (4 adults, 2 queen beds, smart toilet + washing machine). Message property on Trip.com to notify late arrival.',
      cost: 'RM 334.50 (2 Nights)',
      booking: 'Confirmed | Trip.com #1433815639580893',
      link: 'https://my.trip.com/hotels/kunming-hotel-detail-135563078/ximo-homestay/',
      lat: 25.0419,
      lng: 102.7042,
    },

    // ================= DAY 8 (Fri, Nov 13, 2026) =================
    {
      day: 'Day 8',
      dayNumber: 8,
      time: '10:00 AM',
      place: 'Cuihu Park & Wuyi Road Neighborhood',
      chineseName: '翠湖公园',
      address: '220 Cuihu South Road, Wuhua District, Kunming, Yunnan',
      category: 'Sightseeing',
      altitude: '1,890m',
      activity:
        'Relaxed post-tour morning stroll at Cuihu Park and coffee by the lake.',
      lat: 25.0494,
      lng: 102.7031,
    },
    {
      day: 'Day 8',
      dayNumber: 8,
      time: '12:30 PM',
      place: 'Shuncheng Street Halal Culinary & Kunming Old Street',
      chineseName: '顺城街清真美食 & 昆明老街',
      address: 'Shuncheng Street & Qianwang Street, Wuhua District, Kunming, Yunnan',
      category: 'Food',
      altitude: '1,890m',
      activity:
        'Halal beef hotpot and braised beef noodles on Shuncheng Street, plus souvenir shopping for Yunnan Pu’er tea and freshly baked rose flower cakes.',
      lat: 25.0394,
      lng: 102.7078,
    },
    {
      day: 'Day 8',
      dayNumber: 8,
      time: '03:30 PM',
      place: 'Dounan Flower Market',
      chineseName: '斗南花卉市场',
      address: 'Huadu Ocean World, Chenggong District, Kunming, Yunnan',
      category: 'Shopping',
      altitude: '1,890m',
      activity:
        'Visit Asia’s largest fresh flower trading market in Chenggong District, then return to Ximo Homestay to consolidate all heavy winter gear into the 23kg checked suitcases for tomorrow’s flight.',
      lat: 24.9086,
      lng: 102.7856,
    },

    // ================= DAY 9 (Sat, Nov 14, 2026) =================
    {
      day: 'Day 9',
      dayNumber: 9,
      time: '09:10 AM – 11:35 AM',
      place: 'Flight Kunming (KMG) → Hangzhou Xiaoshan Airport T3 (MU5835)',
      chineseName: '昆明长水机场 → 杭州萧山国际机场T3 (东航 MU5835)',
      address: 'Hangzhou Xiaoshan International Airport Terminal 3 (HGH), Xiaoshan District, Hangzhou',
      category: 'Flight',
      altitude: '1,890m → 20m',
      activity:
        'Depart Kunming at 09:10 AM on China Eastern Airlines MU5835, landing at Hangzhou Xiaoshan International Airport Terminal 3 at 11:35 AM for a 21h 40m layover.',
      logisticsNotes:
        'CRITICAL BAGGAGE NOTE: Baggage is NOT checked through in Hangzhou! Must claim all 23kg checked bags at Terminal 3 and contact Welcome Hotel for free airport shuttle pickup.',
      cost: 'Included in Flight',
      booking: 'Confirmed | Booking #1433814282849193 | PNR: MFBREE',
      link: 'https://www.trip.com/',
      lat: 30.2295,
      lng: 120.4344,
    },
    {
      day: 'Day 9',
      dayNumber: 9,
      time: '12:45 PM',
      place: 'Welcome Hotel (Hangzhou Xiaoshan Airport Branch)',
      chineseName: '欢迎酒店(杭州萧山国际机场大会展店)',
      address:
        'No. 4518 Xiaoqing Avenue, Xiaoshan District, Hangzhou, Zhejiang (浙江省杭州市萧山区萧清大道4518号)',
      category: 'Hotel',
      altitude: '20m',
      activity:
        'Take free airport shuttle to Welcome Hotel (~5.5 km from HGH Airport, 3.3 km from Xingang Metro Station) to check in and drop off the 23kg suitcases.',
      logisticsNotes:
        'Cozy Family Executive Suite · 1 Room (4 adults, 2 queen beds, smart toilet). Arrange free airport pick-up via Trip.com App ("Call Property").',
      cost: 'RM 197.25',
      booking: 'Confirmed & PAID (Trip.com)',
      link: 'https://my.trip.com/hotels/hangzhou-hotel-detail-127423767/huan-ying-jiu-dian/',
      lat: 30.2447,
      lng: 120.3886,
    },
    {
      day: 'Day 9',
      dayNumber: 9,
      time: '02:30 PM',
      place: 'West Lake (Xihu) Scenic Area',
      chineseName: '杭州西湖风景名胜区',
      address: 'West Lake Scenic Area, Xihu District, Hangzhou, Zhejiang',
      category: 'Sightseeing',
      altitude: '20m',
      activity:
        'Afternoon boat ride and lakeside walk along Hangzhou’s UNESCO-listed West Lake, Su Causeway, and Broken Bridge.',
      logisticsNotes: 'Bring compact umbrella or rain shell for damp lakeside autumn breeze (8–17°C).',
      lat: 30.2427,
      lng: 120.1487,
    },
    {
      day: 'Day 9',
      dayNumber: 9,
      time: '06:00 PM',
      place: 'Hefang Ancient Street & Phoenix Mosque (Halal Dining)',
      chineseName: '河坊街 & 凤凰寺清真美食',
      address: '227 Zhongshan Middle Road & Hefang Street, Shangcheng District, Hangzhou',
      category: 'Food & Culture',
      altitude: '20m',
      activity:
        'Visit historic Phoenix Mosque (one of China’s Four Great Mosques) for halal dinner along Zhongshan Middle Road, followed by an evening stroll down Hefang Street before returning to Welcome Hotel.',
      lat: 30.2442,
      lng: 120.1683,
    },

    // ================= DAY 10 (Sun, Nov 15, 2026) =================
    {
      day: 'Day 10',
      dayNumber: 10,
      time: '06:15 AM',
      place: 'Hangzhou Xiaoshan International Airport Terminal 4 Check-In',
      chineseName: '杭州萧山国际机场T4航站楼',
      address: 'Terminal 4, Hangzhou Xiaoshan International Airport (HGH), Hangzhou, Zhejiang',
      category: 'Flight',
      altitude: '20m',
      activity:
        'Arrive at Hangzhou Airport Terminal 4 by 06:15 AM (3 hours before departure) via hotel shuttle to re-check 23kg bags and clear exit immigration.',
      booking: 'China Eastern MU5095 | PNR: MFBREE',
      lat: 30.2328,
      lng: 120.4312,
    },
    {
      day: 'Day 10',
      dayNumber: 10,
      time: '09:15 AM – 02:30 PM',
      place: 'Flight Hangzhou (HGH T4) → Kuala Lumpur (KLIA T1) (MU5095)',
      chineseName: '杭州萧山机场T4 → 吉隆坡国际机场T1 (东航 MU5095)',
      address: 'Kuala Lumpur International Airport Terminal 1 (KUL), Sepang, Malaysia',
      category: 'Flight',
      altitude: '20m → 30m',
      activity:
        'Depart Hangzhou T4 at 09:15 AM on China Eastern Airlines MU5095 and arrive home at Kuala Lumpur International Airport (KLIA T1) at 02:30 PM.',
      logisticsNotes:
        'Keep extra space in carry-on to stow your jacket and hoodie on the plane before landing in 30–32°C tropical Kuala Lumpur.',
      cost: 'Included in Flight',
      booking: 'Confirmed | Booking #1433814282849193 | PNR: MFBREE',
      link: 'https://www.trip.com/',
      lat: 2.7456,
      lng: 101.7072,
    },
  ];

  const dayCounters = new Map<string, number>();

  const items: ItineraryItem[] = seeds.map((seed, idx) => {
    const count = (dayCounters.get(seed.day) || 0) + 1;
    dayCounters.set(seed.day, count);

    const meta = dayMeta.get(seed.day);
    const extraFields: Record<string, string> = {};
    if (seed.chineseName) {
      extraFields['Chinese Name (中文)'] = seed.chineseName;
    }
    if (seed.altitude) {
      extraFields['Altitude'] = seed.altitude;
    }
    if (meta?.weather) {
      extraFields['Day Weather'] = meta.weather;
    }

    return {
      id: `yunnan-stop-${idx + 1}`,
      rowIndex: idx + 1,
      day: seed.day,
      dayNumber: seed.dayNumber,
      stopOrderInDay: count,
      date: meta?.date || undefined,
      time: seed.time,
      place: seed.place,
      chineseName: seed.chineseName,
      address: seed.address,
      category: seed.category,
      altitude: seed.altitude,
      weather: meta?.weather,
      activity: seed.activity,
      logisticsNotes: seed.logisticsNotes || meta?.practicalNotes,
      cost: seed.cost,
      booking: seed.booking,
      link: seed.link || meta?.refUrl,
      lat: seed.lat,
      lng: seed.lng,
      geocodeStatus: 'resolved',
      geocodeSource: 'excel',
      extraFields,
    };
  });

  return {
    fileName,
    sheetNames: ['10-Day Yunnan & Hangzhou Itinerary'],
    activeSheet: '10-Day Yunnan & Hangzhou Itinerary',
    items: recomputeDistances(items),
    logistics,
  };
}

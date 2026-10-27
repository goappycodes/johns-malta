/*
  Johns Malta - mock catalogue for the homepage prototype.
  In production this data is cached from the codevlabs API (services, vehicle
  classes, route prices, availability) so the website and back office quote
  from one source of truth. Prices below are placeholders for the mockup.
*/
(function () {
  const IMG = 'https://codevlabs.com/api/cup/uploads/5/';
  const UNS = (id, w, h) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w || 900}${h ? '&h=' + h : ''}&q=70`;

  const AIRPORT = 'Malta International Airport (MLA)';

  // Vehicle classes: transfer price = route base x multiplier; hourly rate per class.
  const vehicles = [
    { id: 'economy',  name: 'Economy',        model: 'Mercedes C-Class or similar',   seats: 3, bags: 2, mult: 1,   hourly: 30, img: IMG + '1691672915.jpg', perks: ['Free Wi-Fi', 'Bottled water'] },
    { id: 'executive',name: 'Executive',      model: 'Mercedes E-Class or similar',   seats: 3, bags: 3, mult: 1.6, hourly: 40, img: IMG + 'mercedes_elcass.jpg', perks: ['Leather interior', 'Free Wi-Fi', 'Bottled water'] },
    { id: 'luxury',   name: 'Luxury',         model: 'Mercedes S-Class / EQ or similar', seats: 3, bags: 2, mult: 2.8, hourly: 65, img: IMG + '1737980201.jpg', perks: ['Chauffeur in livery', 'Rear comfort seats', 'Free Wi-Fi'] },
    { id: 'minivan',  name: 'Minivan',        model: 'Peugeot Traveller or similar',  seats: 7, bags: 6, mult: 1.8, hourly: 45, img: IMG + '1615806734.jpg', perks: ['Ideal for families', 'Free Wi-Fi'] },
    { id: 'carrier',  name: 'People Carrier', model: 'Mercedes V-Class / Tourneo',    seats: 8, bags: 8, mult: 2.4, hourly: 55, img: IMG + '1737985046.jpg', perks: ['Groups & golf bags', 'Free Wi-Fi'] }
  ];

  // Fixed airport fares (Economy base) per locality. First five match the live site.
  const routes = [
    { name: 'Valletta', price: 15, mins: 20, top: true },
    { name: "St Julian's", price: 16, mins: 25, top: true },
    { name: 'Sliema', price: 16, mins: 25, top: true },
    { name: 'Bugibba', price: 26, mins: 35, top: true },
    { name: 'Qawra', price: 26, mins: 35, top: true },
    { name: 'Golden Bay', price: 28, mins: 40, top: true },
    { name: 'Mellieħa', price: 30, mins: 40, top: true },
    { name: 'Mdina & Rabat', price: 18, mins: 25, top: true },
    { name: 'Floriana', price: 15, mins: 18 },
    { name: 'Gżira', price: 16, mins: 22 },
    { name: 'Msida', price: 15, mins: 20 },
    { name: 'Pembroke', price: 18, mins: 28 },
    { name: 'Paceville', price: 17, mins: 26 },
    { name: "St Paul's Bay", price: 25, mins: 33 },
    { name: 'Mosta', price: 20, mins: 25 },
    { name: 'Attard', price: 16, mins: 20 },
    { name: "Ta' Qali", price: 18, mins: 22 },
    { name: 'Birgu (Vittoriosa)', price: 15, mins: 20 },
    { name: 'Kalkara', price: 16, mins: 22 },
    { name: 'Marsaskala', price: 15, mins: 15 },
    { name: 'Marsaxlokk', price: 15, mins: 15 },
    { name: 'Birżebbuġa', price: 15, mins: 12 },
    { name: 'Mġarr (Malta)', price: 26, mins: 35 },
    { name: 'Ċirkewwa (Gozo ferry)', price: 32, mins: 45 },
    { name: 'Gozo, Victoria (incl. ferry)', price: 65, mins: 80 },
    { name: 'Valletta Cruise Port', price: 16, mins: 20 }
  ];

  // Thumbnail per destination (Unsplash, free licence).
  const routeImg = {
    'Valletta': '1527155431803-74e5f93c7111', "St Julian's": '1675773681378-0aef6f722a5e', 'Sliema': '1669718022108-505b40ed2e65',
    'Bugibba': '1724176432750-97c4625e2ecf', 'Qawra': '1702855830481-57a0de1948fa', 'Golden Bay': '1512679186997-081a6da4e083',
    'Mellieħa': '1671196365369-1c5edb4c0e1c', 'Mdina & Rabat': '1578930793485-196f13e97ce0', 'Floriana': '1600498202878-79bdcbe69033',
    'Gżira': '1669717863666-165b88e329d8', 'Msida': '1665608932866-7a8eaaf63e8d', 'Pembroke': '1710957442268-a897d6074f99',
    'Paceville': '1645097146323-a6c1478b0774', "St Paul's Bay": '1739393939001-f74e9a41bdc8', 'Mosta': '1607900290825-b5cebb9f832d',
    'Attard': '1736971624947-2d2caf2d5bb3', "Ta' Qali": '1584347970643-928be84331da', 'Birgu (Vittoriosa)': '1671448037849-a2258db28bfb',
    'Kalkara': '1697468362685-825eef3d00d2', 'Marsaskala': '1694558391727-eff55c972a33', 'Marsaxlokk': '1587974928552-4f4aac51b45d',
    'Birżebbuġa': '1561369408-1e91d37fd2c5', 'Mġarr (Malta)': '1587210893789-e773df95ed41', 'Ċirkewwa (Gozo ferry)': '1730190203082-73a4b980b9a8',
    'Gozo, Victoria (incl. ferry)': '1571856975545-119703c5225c', 'Valletta Cruise Port': '1736531966587-fe98ab5f8a79'
  };
  routes.forEach((r) => { if (routeImg[r.name]) { r.img = UNS(routeImg[r.name], 120, 120); r.photo = UNS(routeImg[r.name], 640, 480); } });

  // Extra pickup / drop-off points mapped to a priced locality.
  const places = [
    { name: AIRPORT, area: 'Luqa', airport: true },
    { name: 'The Phoenicia Malta', area: 'Floriana' },
    { name: 'Iniala Harbour House', area: 'Valletta' },
    { name: 'The Westin Dragonara Resort', area: "St Julian's" },
    { name: 'Hilton Malta', area: "St Julian's" },
    { name: 'Corinthia Palace Malta', area: 'Attard' },
    { name: 'AX The Palace', area: 'Sliema' },
    { name: 'Radisson Blu Resort', area: "St Julian's" },
    { name: 'db San Antonio Hotel + Spa', area: 'Qawra' },
    { name: 'Ramla Bay Resort', area: 'Mellieħa' },
    { name: 'The Xara Palace', area: 'Mdina & Rabat' }
  ];

  const extras = [
    { id: 'childSeat', name: 'Child seat', note: '9 to 18 kg', price: 5, max: 3, icon: 'i-baby' },
    { id: 'booster', name: 'Booster seat', note: '15 to 36 kg', price: 5, max: 3, icon: 'i-baby' },
    { id: 'stop', name: 'Extra stop', note: 'On the way, up to 15 min', price: 10, max: 2, icon: 'i-pin' },
    { id: 'sport', name: 'Oversize luggage', note: 'Golf bag, bike or pram', price: 5, max: 4, icon: 'i-bag' }
  ];

  const tours = [
    { id: 'valletta', name: 'Valletta & the Three Cities', type: 'half', hours: 4, price: 160, rating: 4.9, reviews: 212,
      img: UNS('1669294841689-0ceb34ad40c1', 900), pins: ['valletta', 'birgu'], stops: ['Upper Barrakka Gardens', "St John's Co-Cathedral", 'Birgu waterfront'] },
    { id: 'mdina', name: 'Mdina, Rabat & Dingli Cliffs', type: 'half', hours: 5, price: 180, rating: 4.9, reviews: 168,
      img: UNS('1674393371426-df5dbfdce43c', 900), pins: ['mdina', 'dingli'], stops: ['The Silent City', "St Paul's Catacombs", 'Dingli Cliffs at sunset'] },
    { id: 'south', name: 'Blue Grotto & Marsaxlokk', type: 'half', hours: 4, price: 160, rating: 4.8, reviews: 141,
      img: UNS('1593980806399-cb0aee36703e', 900), pins: ['bluegrotto', 'marsaxlokk'], stops: ['Blue Grotto boat trip', 'Sunday fish market', 'Ħaġar Qim temples'] },
    { id: 'gozo', name: 'Gozo Discovery Day', type: 'full', hours: 8, price: 340, rating: 5.0, reviews: 97,
      img: UNS('1571856975545-119703c5225c', 900), pins: ['cirkewwa', 'mgarr', 'victoria', 'ramla'], stops: ['Ferry included', 'Victoria Citadel', 'Ramla Bay & Xlendi'] },
    { id: 'highlights', name: 'Malta Highlights in a Day', type: 'full', hours: 8, price: 320, rating: 4.9, reviews: 186,
      img: UNS('1560365337-6f42f70dd874', 900), pins: ['valletta', 'mosta', 'mdina', 'marsaxlokk'], stops: ['Valletta', 'Mdina', 'Mosta Dome', 'Marsaxlokk'] }
  ];

  // Real Johns vintage fleet (from johns.com.mt/weddings). Prices are placeholders.
  const cars = [
    { id: 'rr-cloud-59', name: 'Rolls-Royce Silver Cloud', year: 1959, colour: 'White pearl', seats: 4, price: 450, img: IMG + '1609249566.jpg' },
    { id: 'daimler-conv', name: 'Daimler Limousine Convertible', year: 1977, colour: 'White', seats: 6, price: 420, img: IMG + '1609254137.jpg' },
    { id: 'rr-cloud-conv', name: 'Rolls-Royce Silver Cloud Convertible', year: 1958, colour: 'White', seats: 4, price: 520, img: IMG + '1613473455.jpg' },
    { id: 'cadillac', name: 'GM Cadillac', year: 1959, colour: 'White', seats: 4, price: 480, img: IMG + '1613553347.jpg' },
    { id: 'rr-cloud-69', name: 'Rolls-Royce Silver Cloud', year: 1969, colour: 'Silver', seats: 4, price: 450, img: IMG + '1609249886.jpg' },
    { id: 'daimler-limo', name: 'Daimler Limousine', year: 1978, colour: 'Black & white', seats: 6, price: 400, img: IMG + '1613569712.jpg' },
    { id: 'austin', name: 'Austin Princess', year: 1960, colour: 'Silver', seats: 6, price: 380, img: IMG + '1613547379.jpg' },
    { id: 'humber', name: 'Humber Super Snipe', year: 1967, colour: 'Black', seats: 4, price: 350, img: IMG + '1613571825.jpg' }
  ];

  window.JM = {
    AIRPORT,
    vehicles,
    routes,
    places,
    extras,
    tours,
    cars,
    wedding: { deposit: 150, includedHours: 3, extraHour: 90, champagne: 35 },
    hourlyMin: 3,
    hourlyMax: 12,
    tourSurcharge: { half: { minivan: 60, carrier: 120 }, full: { minivan: 100, carrier: 200 } }
  };
})();

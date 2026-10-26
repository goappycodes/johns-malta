/*
  Johns Malta - mock catalogue for the homepage prototype.
  In production this data is cached from the codevlabs API (services, vehicle
  classes, route prices, availability) so the website and back office quote
  from one source of truth. Prices below are placeholders for the mockup.
*/
(function () {
  const IMG = 'https://codevlabs.com/api/cup/uploads/5/';
  const UNS = (id, w) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w || 900}&q=70`;

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
      img: UNS('1669294841689-0ceb34ad40c1', 900), stops: ['Upper Barrakka Gardens', "St John's Co-Cathedral", 'Birgu waterfront'] },
    { id: 'mdina', name: 'Mdina, Rabat & Dingli Cliffs', type: 'half', hours: 5, price: 180, rating: 4.9, reviews: 168,
      img: UNS('1674393371426-df5dbfdce43c', 900), stops: ['The Silent City', "St Paul's Catacombs", 'Dingli Cliffs at sunset'] },
    { id: 'south', name: 'Blue Grotto & Marsaxlokk', type: 'half', hours: 4, price: 160, rating: 4.8, reviews: 141,
      img: UNS('1593980806399-cb0aee36703e', 900), stops: ['Blue Grotto boat trip', 'Sunday fish market', 'Ħaġar Qim temples'] },
    { id: 'gozo', name: 'Gozo Discovery Day', type: 'full', hours: 8, price: 340, rating: 5.0, reviews: 97,
      img: UNS('1571856975545-119703c5225c', 900), stops: ['Ferry included', 'Victoria Citadel', 'Ramla Bay & Xlendi'] },
    { id: 'highlights', name: 'Malta Highlights in a Day', type: 'full', hours: 8, price: 320, rating: 4.9, reviews: 186,
      img: UNS('1560365337-6f42f70dd874', 900), stops: ['Valletta', 'Mdina', 'Mosta Dome', 'Marsaxlokk'] },
    { id: 'west', name: 'Golden Bay & Popeye Village', type: 'half', hours: 4, price: 150, rating: 4.7, reviews: 88,
      img: UNS('1548780416-f23a4186ceb9', 900), stops: ['Popeye Village viewpoint', 'Golden Bay', 'Għajn Tuffieħa'] }
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

// Night Market is a fictional weekly street-food market. Placeholder content.

export type Vendor = {
  id: string
  name: string
  cuisine: string
  blurb: string
  price: '$' | '$$' | '$$$'
  stall: string
}

export const vendors: Vendor[] = [
  { id: 'dumpling', name: 'Fold & Steam', cuisine: 'Dumplings', blurb: 'Pork and chive, mushroom and cabbage, twelve pleats each.', price: '$', stall: 'A1' },
  { id: 'taco', name: 'Comal 24', cuisine: 'Tacos', blurb: 'Blue-corn tortillas pressed to order over a steel comal.', price: '$', stall: 'A4' },
  { id: 'skewer', name: 'Coal Line', cuisine: 'Skewers', blurb: 'Lamb, cumin and chili over binchotan, sold by the stick.', price: '$$', stall: 'B2' },
  { id: 'noodle', name: 'Long Pull', cuisine: 'Hand-pulled noodles', blurb: 'Biang-biang ribbons slapped out while you watch.', price: '$$', stall: 'B5' },
  { id: 'mochi', name: 'Soft Serve Moon', cuisine: 'Dessert', blurb: 'Mochi ice cream in six flavours, one of them black sesame.', price: '$', stall: 'C1' },
  { id: 'tea', name: 'Glasshouse Tea', cuisine: 'Drinks', blurb: 'Cold-brew oolong, yuzu soda and a very slow pour-over.', price: '$', stall: 'C3' },
]

export const hours = [
  { day: 'Friday', time: '17:00 to 23:00' },
  { day: 'Saturday', time: '16:00 to 00:00' },
  { day: 'Sunday', time: '16:00 to 22:00' },
]

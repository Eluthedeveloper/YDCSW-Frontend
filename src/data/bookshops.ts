export interface Bookshop {
  id: number;
  name: string;
  address: string;
  phone: string;
  description: string;
  lat: number;
  lng: number;
  googleMapsUrl: string;
}

export const bookshops: Bookshop[] = [
  {
    id: 1,
    name: "Piyassa Branch",
    address: "Piyassa, Addis Ababa",
    phone: "+251-11-XXX-XXXX",
    description: "Main branch located in the heart of Piyassa, offering a wide selection of Christian literature and vestments.",
    lat: 9.0322,
    lng: 38.7424,
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=9.0322,38.7424",
  },
  {
    id: 2,
    name: "Meganegna Branch",
    address: "Meganegna, Addis Ababa",
    phone: "+251-11-XXX-XXXX",
    description: "Conveniently located in Meganegna, serving the community with quality religious books and resources.",
    lat: 9.0152,
    lng: 38.743,
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=9.0152,38.7430",
  },
  {
    id: 3,
    name: "Mekanisa Branch",
    address: "Mekanisa, Addis Ababa",
    phone: "+251-11-XXX-XXXX",
    description: "Serving the Mekanisa community with a full range of Christian literature and worship materials.",
    lat: 9.0053,
    lng: 38.7302,
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=9.0053,38.7302",
  },
  {
    id: 4,
    name: "Bole Branch",
    address: "Bole, Addis Ababa",
    phone: "+251-11-XXX-XXXX",
    description: "Located in the bustling Bole area, providing easy access to Christian resources for the community.",
    lat: 9.003,
    lng: 38.7637,
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=9.0030,38.7637",
  },
  {
    id: 5,
    name: "Adama Branch",
    address: "Adama, Oromia",
    phone: "+251-22-XXX-XXXX",
    description: "Serving the city of Adama with quality Christian literature and vestment supplies.",
    lat: 8.5419,
    lng: 39.2691,
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=8.5419,39.2691",
  },
  {
    id: 6,
    name: "Bishoftu Branch",
    address: "Bishoftu, Oromia",
    phone: "+251-22-XXX-XXXX",
    description: "Located in Bishoftu, providing Christian resources to the community and surrounding areas.",
    lat: 8.7529,
    lng: 38.9793,
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=8.7529,38.9793",
  },
];
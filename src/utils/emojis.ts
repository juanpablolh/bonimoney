export interface EmojiCategory {
    id: string;
    name: string;
    emojis: EmojiItem[];
}

export interface EmojiItem {
    emoji: string;
    label: string;
    keywords: string[];
}

export const EMOJI_CATEGORIES: EmojiCategory[] = [
    {
        id: 'food_drink',
        name: 'Comida y Bebida Compartida',
        emojis: [
            { emoji: '🍕', label: 'Pizza', keywords: ['pizza', 'comida', 'food', 'cenar', 'dinner'] },
            { emoji: '🍔', label: 'Restaurante', keywords: ['hamburguesa', 'burger', 'restaurante', 'restaurant', 'comida', 'food'] },
            { emoji: '🍺', label: 'Bar/Cerveza', keywords: ['cerveza', 'beer', 'alcohol', 'bar', 'drink', 'trago', 'pub'] },
            { emoji: '☕', label: 'Café', keywords: ['cafe', 'coffee', 'te', 'tea', 'desayuno', 'breakfast'] },
            { emoji: '🍜', label: 'Comida rápida', keywords: ['fideos', 'noodle', 'ramen', 'china', 'japonesa', 'asian', 'comida', 'food'] },
            { emoji: '🍰', label: 'Postres', keywords: ['pastel', 'torta', 'cake', 'dulce', 'sweet', 'postre', 'dessert'] },
            { emoji: '🍷', label: 'Vino/Copas', keywords: ['vino', 'wine', 'copa', 'glass', 'alcohol', 'drink', 'fiesta'] },
            { emoji: '🧃', label: 'Bebidas', keywords: ['jugo', 'juice', 'caja', 'box', 'bebida', 'drink'] },
            { emoji: '🥘', label: 'Cena grupal', keywords: ['paella', 'comida', 'food', 'cena', 'dinner', 'plato', 'dish'] },
            { emoji: '🍿', label: 'Snacks', keywords: ['palomitas', 'popcorn', 'cine', 'movie', 'snack', 'picoteo'] },
        ]
    },
    {
        id: 'home',
        name: 'Hogar y Convivencia',
        emojis: [
            { emoji: '🏠', label: 'Renta/Alquiler', keywords: ['casa', 'house', 'renta', 'alquiler', 'rent', 'hogar', 'home'] },
            { emoji: '💡', label: 'Electricidad', keywords: ['luz', 'light', 'electricidad', 'electricity', 'foco', 'bulb', 'energia', 'energy'] },
            { emoji: '💧', label: 'Agua', keywords: ['agua', 'water', 'gota', 'drop', 'servicios', 'utilities'] },
            { emoji: '🔥', label: 'Gas', keywords: ['fuego', 'fire', 'gas', 'calefaccion', 'heating', 'cocina'] },
            { emoji: '📱', label: 'Internet', keywords: ['celular', 'phone', 'movil', 'mobile', 'internet', 'wifi', 'datos', 'data'] },
            { emoji: '🧹', label: 'Limpieza/Productos', keywords: ['escoba', 'broom', 'limpieza', 'cleaning', 'aseo'] },
            { emoji: '🛒', label: 'Supermercado', keywords: ['carro', 'cart', 'compras', 'shopping', 'supermercado', 'market', 'comida', 'food'] },
            { emoji: '🧻', label: 'Artículos del hogar', keywords: ['papel', 'toilet', 'baño', 'bathroom', 'aseo'] },
        ]
    },
    {
        id: 'transport',
        name: 'Transporte Compartido',
        emojis: [
            { emoji: '🚗', label: 'Gasolina/Auto', keywords: ['auto', 'car', 'coche', 'gasolina', 'fuel', 'viaje', 'trip'] },
            { emoji: '🚕', label: 'Taxi/Uber', keywords: ['taxi', 'uber', 'cab', 'transporte', 'transport', 'viaje'] },
            { emoji: '🚐', label: 'Van/Transporte grupal', keywords: ['bus', 'minibus', 'van', 'transporte', 'transport', 'viaje', 'trip'] },
            { emoji: '🅿️', label: 'Estacionamiento', keywords: ['parking', 'estacionamiento', 'parqueo', 'auto', 'car'] },
            { emoji: '⛽', label: 'Combustible', keywords: ['bencina', 'fuel', 'gasolina', 'gas', 'combustible', 'pump'] },
            { emoji: '🚇', label: 'Transporte público', keywords: ['metro', 'subway', 'tren', 'train', 'bus', 'transporte', 'transport'] },
        ]
    },
    {
        id: 'travel',
        name: 'Viajes y Alojamiento',
        emojis: [
            { emoji: '✈️', label: 'Vuelos', keywords: ['avion', 'plane', 'vuelo', 'flight', 'viaje', 'trip', 'vacaciones'] },
            { emoji: '🏨', label: 'Hotel/Hospedaje', keywords: ['hotel', 'hospedaje', 'alojamiento', 'accommodation', 'edificio', 'building'] },
            { emoji: '🏖️', label: 'Playa/Resort', keywords: ['playa', 'beach', 'mar', 'sea', 'vacaciones', 'holiday', 'verano', 'summer'] },
            { emoji: '🎿', label: 'Actividades turísticas', keywords: ['esqui', 'ski', 'nieve', 'snow', 'deporte', 'sport', 'invierno', 'winter'] },
            { emoji: '🗺️', label: 'Tours', keywords: ['mapa', 'map', 'tour', 'guia', 'guide', 'viaje', 'trip', 'turismo'] },
            { emoji: '🎒', label: 'Excursión', keywords: ['mochila', 'backpack', 'excursion', 'hiking', 'trekking', 'viaje'] },
            { emoji: '🏕️', label: 'Camping', keywords: ['campamento', 'camping', 'carpa', 'tent', 'naturaleza', 'nature'] },
            { emoji: '🚢', label: 'Crucero', keywords: ['barco', 'ship', 'ote', 'boat', 'crucero', 'cruise', 'mar', 'sea'] },
        ]
    },
    {
        id: 'events',
        name: 'Eventos y Celebraciones',
        emojis: [
            { emoji: '🎉', label: 'Fiesta', keywords: ['fiesta', 'party', 'celebracion', 'celebration', 'confeti'] },
            { emoji: '🎂', label: 'Cumpleaños', keywords: ['pastel', 'torta', 'cake', 'cumpleaños', 'birthday', 'vela', 'candle'] },
            { emoji: '🎊', label: 'Celebración', keywords: ['confeti', 'ball', 'celebracion', 'celebration', 'fiesta'] },
            { emoji: '🎈', label: 'Evento especial', keywords: ['globo', 'balloon', 'fiesta', 'party', 'cumpleaños'] },
            { emoji: '💒', label: 'Boda', keywords: ['boda', 'wedding', 'matrimonio', 'marriage', 'iglesia', 'church', 'amor'] },
            { emoji: '🎄', label: 'Navidad/Festividades', keywords: ['arbol', 'tree', 'navidad', 'christmas', 'pascua', 'regalo'] },
            { emoji: '🎃', label: 'Halloween', keywords: ['calabaza', 'pumpkin', 'halloween', 'miedo', 'scary', 'disfraz'] },
            { emoji: '🎆', label: 'Año nuevo', keywords: ['fuegos', 'fireworks', 'año nuevo', 'new year', 'celebracion'] },
        ]
    },
    {
        id: 'entertainment',
        name: 'Entretenimiento Grupal',
        emojis: [
            { emoji: '🎬', label: 'Cine', keywords: ['cine', 'cinema', 'pelicula', 'movie', 'film', 'claqueta'] },
            { emoji: '🎮', label: 'Videojuegos', keywords: ['juego', 'game', 'consola', 'console', 'play', 'videojuego'] },
            { emoji: '🎵', label: 'Concierto', keywords: ['musica', 'music', 'nota', 'note', 'cancion', 'song', 'concierto'] },
            { emoji: '⚽', label: 'Deportes/Partido', keywords: ['futbol', 'soccer', 'pelota', 'ball', 'deporte', 'sport', 'juego'] },
            { emoji: '🎳', label: 'Bowling', keywords: ['bolos', 'bowling', 'pino', 'pin', 'juego', 'game'] },
            { emoji: '🎯', label: 'Actividades recreativas', keywords: ['dardo', 'dart', 'blanco', 'target', 'juego', 'game', 'punteria'] },
            { emoji: '🎪', label: 'Espectáculo', keywords: ['circo', 'circus', 'show', 'espectaculo', 'carpa', 'tent'] },
            { emoji: '🎨', label: 'Taller/Clase', keywords: ['arte', 'art', 'pintura', 'paint', 'paleta', 'palette', 'clase', 'class'] },
            { emoji: '🏊', label: 'Piscina/Spa', keywords: ['nadar', 'swim', 'piscina', 'pool', 'agua', 'water', 'deporte'] },
            { emoji: '🎢', label: 'Parque de diversiones', keywords: ['montaña rusa', 'roller coaster', 'parque', 'park', 'juego'] },
        ]
    },
    {
        id: 'shopping',
        name: 'Compras Compartidas',
        emojis: [
            { emoji: '🎁', label: 'Regalos (grupales)', keywords: ['regalo', 'gift', 'presente', 'caja', 'box', 'sorpresa'] },
            { emoji: '🧴', label: 'Productos compartidos', keywords: ['botella', 'lotion', 'crema', 'cosmetico', 'baño'] },
            { emoji: '🔧', label: 'Herramientas/Reparaciones', keywords: ['herramienta', 'tool', 'llave', 'wrench', 'reparacion', 'fix'] },
        ]
    },
    {
        id: 'other',
        name: 'Otros Gastos Grupales',
        emojis: [
            { emoji: '💰', label: 'Efectivo/General', keywords: ['dinero', 'money', 'bolsa', 'bag', 'dolar', 'cash', 'efectivo'] },
            { emoji: '📦', label: 'Envíos/Delivery', keywords: ['paquete', 'package', 'caja', 'box', 'envio', 'delivery', 'correo'] },
            { emoji: '💳', label: 'Suscripciones compartidas', keywords: ['tarjeta', 'card', 'credito', 'credit', 'pago', 'payment'] },
            { emoji: '🎓', label: 'Curso/Formación', keywords: ['graduacion', 'graduation', 'gorro', 'cap', 'estudio', 'study', 'clase'] },
            { emoji: '📸', label: 'Fotógrafo', keywords: ['camara', 'camera', 'foto', 'photo', 'flash', 'recuerdo'] },
            { emoji: '🎤', label: 'Karaoke', keywords: ['microfono', 'microphone', 'cantar', 'sing', 'musica', 'music', 'fiesta'] },
            { emoji: '🏋️', label: 'Gimnasio grupal', keywords: ['pesas', 'weight', 'gimnasio', 'gym', 'ejercicio', 'workout', 'deporte'] },
        ]
    }
];

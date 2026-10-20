// Mayra's Team Hub content. Only sent after the right TEAM_CODE (see netlify/functions/hub.mjs).
// PLACEHOLDER CONTENT: replace links, schedule, promos and team members with Mayra's real ones.
export default {
  welcome: {
    es: '¡Bienvenida a la familia! Aquí tienes todo lo que necesitas para empezar y crecer. Si algo no está claro, escríbeme.',
    en: 'Welcome to the family! Everything you need to start and grow is right here. If anything is unclear, message me.'
  },
  checklist: [
    { id: 'store', es: 'Abre tu tienda Farmasi y personaliza tu perfil', en: 'Open your Farmasi store and set up your profile' },
    { id: 'group', es: 'Únete al grupo de WhatsApp del equipo', en: 'Join the team WhatsApp group' },
    { id: 'call', es: 'Agenda tu llamada de bienvenida conmigo', en: 'Book your welcome call with me' },
    { id: 'train', es: 'Mira el entrenamiento "Tu primera semana"', en: 'Watch the "Your first week" training' },
    { id: 'list', es: 'Escribe una lista de 20 personas a quienes contarles', en: 'Write a list of 20 people to tell' },
    { id: 'post', es: 'Comparte tu primera publicación de productos', en: 'Share your first product post' }
  ],
  schedule: [
    { es: ['Llamada del equipo', 'Lunes · 8:00 PM'], en: ['Team call', 'Monday · 8:00 PM'] },
    { es: ['Entrenamiento corto', 'Miércoles · 12:00 PM'], en: ['Quick training', 'Wednesday · 12:00 PM'] },
    { es: ['Reconocimientos del mes', 'Primer domingo · 7:00 PM'], en: ['Monthly recognition', 'First Sunday · 7:00 PM'] }
  ],
  links: [
    { es: 'Grupo de WhatsApp del equipo', en: 'Team WhatsApp group', url: 'https://chat.whatsapp.com/' },
    { es: 'Sala de Zoom del equipo', en: 'Team Zoom room', url: 'https://zoom.us/' },
    { es: 'Entrenamiento: Tu primera semana', en: 'Training: Your first week', url: 'https://www.farmasius.com/' },
    { es: 'Mensajes listos para compartir', en: 'Ready-to-share messages', url: 'https://www.farmasius.com/' },
    { es: 'Catálogo del mes', en: "This month's catalog", url: 'https://www.farmasius.com/mayrasotoburgos' }
  ],
  promos: [
    { es: ['Oferta del mes', 'Compra 2 productos de maquillaje y llévate el tercero a mitad de precio.'],
      en: ['Deal of the month', 'Buy 2 makeup products and get the third at half price.'] },
    { es: ['Para compartir esta semana', 'Sunkiss Drops y Zen Extension Lash Mascara son las más pedidas.'],
      en: ['Share this week', 'Sunkiss Drops and Zen Extension Lash Mascara are the most requested.'] }
  ],
  team: [
    { name: 'Carmen Rivera', es: 'Manager', en: 'Manager', phone: '17875550101' },
    { name: 'Lourdes Méndez', es: 'Senior Manager', en: 'Senior Manager', phone: '17875550102' },
    { name: 'Yesenia López', es: 'Nueva en el equipo', en: 'New to the team', phone: '14075550103' },
    { name: 'Paola Vega', es: 'Nueva en el equipo', en: 'New to the team', phone: '14075550104' }
  ]
}

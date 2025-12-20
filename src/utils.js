export function createPageUrl(name){
  // simple map for demo
  const map = { Home: '/', Favorites: '/favorites', Analytics: '/analytics', Profile: '/profile' }
  return map[name] || '/'
}

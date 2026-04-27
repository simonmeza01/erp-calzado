export const ESTADOS_VENEZUELA: Record<string, string[]> = {
  'Distrito Capital': ['Caracas'],
  'Miranda': ['Los Teques', 'Guarenas', 'Guatire', 'Petare', 'Baruta', 'Chacao', 'Charallave', 'Ocumare del Tuy'],
  'Aragua': ['Maracay', 'Turmero', 'La Victoria', 'Cagua', 'Villa de Cura', 'El Limón'],
  'Carabobo': ['Valencia', 'Puerto Cabello', 'Guacara', 'Los Guayos', 'Naguanagua', 'San Diego'],
  'Zulia': ['Maracaibo', 'Cabimas', 'Ciudad Ojeda', 'Punto Fijo', 'Lagunillas', 'Machiques'],
  'Lara': ['Barquisimeto', 'Cabudare', 'Carora', 'El Tocuyo'],
  'Bolívar': ['Ciudad Bolívar', 'Puerto Ordaz', 'San Félix', 'Upata', 'Caicara del Orinoco'],
  'Táchira': ['San Cristóbal', 'Rubio', 'La Fría', 'San Antonio del Táchira'],
  'Mérida': ['Mérida', 'Ejido', 'El Vigía', 'Tovar'],
  'Anzoátegui': ['Barcelona', 'Puerto La Cruz', 'El Tigre', 'Anaco', 'Cantaura'],
  'Monagas': ['Maturín', 'Punta de Mata', 'Temblador', 'Caripito'],
  'Sucre': ['Cumaná', 'Carúpano', 'Güiria', 'Maturín'],
  'Nueva Esparta': ['La Asunción', 'Porlamar', 'Pampatar'],
  'Falcón': ['Coro', 'Punto Fijo', 'La Vela de Coro'],
  'Yaracuy': ['San Felipe', 'Yaritagua', 'Chivacoa'],
  'Trujillo': ['Trujillo', 'Valera', 'Boconó'],
  'Barinas': ['Barinas', 'Barinitas', 'Santa Bárbara de Barinas'],
  'Portuguesa': ['Guanare', 'Araure', 'Acarigua'],
  'Cojedes': ['San Carlos', 'Tinaquillo'],
  'Guárico': ['San Juan de los Morros', 'Calabozo', 'Valle de la Pascua'],
  'Apure': ['San Fernando de Apure', 'Guasdualito'],
  'Amazonas': ['Puerto Ayacucho'],
  'Delta Amacuro': ['Tucupita'],
  'Vargas': ['La Guaira', 'Maiquetía', 'Macuto'],
};

export const ESTADOS_LIST = Object.keys(ESTADOS_VENEZUELA).sort();

export function getCiudadesPorEstado(estado: string): string[] {
  return ESTADOS_VENEZUELA[estado] ?? [];
}

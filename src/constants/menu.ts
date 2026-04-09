// Definiciones de ingredientes y extras.
// Estas constantes son la fuente de verdad del frontend para el modal de personalización.
// No viven en la DB porque son fijas para este negocio.

// ─── Grupos de ingredientes (removibles por grupo o individualmente) ───────────

export interface IngredientGroup {
  id:    string
  label: string
  items: string[]
}

export const INGREDIENT_GROUPS: Record<string, IngredientGroup> = {
  verduras: {
    id:    'verduras',
    label: 'Verduras',
    items: ['lechuga', 'zanahoria', 'jitomate', 'cebolla'],
  },
  aderezos: {
    id:    'aderezos',
    label: 'Aderezos',
    items: ['mostaza', 'catsup', 'mayonesa'],
  },
}

// Label legible para cada sub-ingrediente
export const INGREDIENT_LABELS: Record<string, string> = {
  lechuga:   'Lechuga',
  zanahoria: 'Zanahoria',
  jitomate:  'Jitomate',
  cebolla:   'Cebolla',
  mostaza:   'Mostaza',
  catsup:    'Catsup',
  mayonesa:  'Mayonesa',
  queso:     'Queso',
  champiñones: 'Champiñones',
  piña:      'Piña',
  jamón:     'Jamón',
  tocino:    'Tocino',
  chorizo:   'Chorizo',
}

// ─── Extras con costo ─────────────────────────────────────────────────────────

export interface ExtraOption {
  id:          string
  name:        string
  price:       number
  subchoices:  string[]  // si no está vacío, el usuario debe elegir uno
}

export const EXTRAS: ExtraOption[] = [
  {
    id:         'queso_extra',
    name:       'Queso extra',
    price:      20,
    subchoices: [],
  },
  {
    id:         'tocino_extra',
    name:       'Tocino extra',
    price:      20,
    subchoices: [],
  },
  {
    id:         'chorizo_extra',
    name:       'Chorizo extra',
    price:      20,
    subchoices: [],
  },
  {
    id:         'ingrediente_extra',
    name:       'Ingrediente extra',
    price:      10,
    subchoices: ['champiñones', 'piña'],
  },
]

export const SUBCHOICE_LABELS: Record<string, string> = {
  champiñones: 'Champiñones',
  piña:        'Piña',
}

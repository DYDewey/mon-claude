import { isModelChoice, type ModelChoice } from '../../shared/model';

// Dernier modèle choisi, retenu entre deux lancements de l'app. Absent : « Par défaut ».
const KEY = 'mon-claude:model';

export function readLastModel(storage: Pick<Storage, 'getItem'>): ModelChoice | undefined {
  try {
    const value = storage.getItem(KEY);
    return isModelChoice(value) ? value : undefined;
  } catch {
    return undefined;
  }
}

export function writeLastModel(storage: Pick<Storage, 'setItem' | 'removeItem'>, model: ModelChoice | undefined): void {
  try {
    if (model) storage.setItem(KEY, model);
    else storage.removeItem(KEY);
  } catch {
    // stockage indisponible : le choix ne sera pas retenu, sans gravité
  }
}

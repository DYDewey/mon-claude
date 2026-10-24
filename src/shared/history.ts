// Historique en lecture seule : sessions passées lues dans ~/.claude/projects/.

export interface HistorySession {
  id: string;
  title: string;
  /** Dernière activité, en ms. */
  lastAt: number;
  messageCount: number;
}

export interface HistoryProject {
  /** Nom du dossier dans ~/.claude/projects/ (chemin encodé, sert d'identifiant). */
  folder: string;
  /** Vrai chemin du projet (champ `cwd` des messages), s'il est connu. */
  path?: string;
  /** De la plus récente à la plus ancienne. */
  sessions: HistorySession[];
}

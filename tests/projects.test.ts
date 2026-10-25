import { describe, expect, it } from 'vitest';
import type { HistoryProject } from '../src/shared/history';
import { emptyOrganize } from '../src/shared/organize';
import {
  addProject,
  buildProjectPrompt,
  MAX_FILES,
  MAX_INSTRUCTIONS,
  newProjectId,
  parseProjects,
  projectForCwd,
  projectSessions,
  removeProject,
  sameFolder,
  updateProject,
} from '../src/shared/projects';

const withReact = addProject(emptyOrganize(), 'p_react001', 'D:\\Cours\\react');

describe('newProjectId', () => {
  it('donne p_ suivi de 8 caractères, différent à chaque appel', () => {
    const id = newProjectId();
    expect(id).toMatch(/^p_[a-z0-9]{8}$/);
    expect(newProjectId()).not.toBe(id);
  });
});

describe('addProject', () => {
  it('crée le projet avec le nom du dossier', () => {
    expect(withReact.projects).toEqual({ p_react001: { name: 'react', folder: 'D:\\Cours\\react' } });
  });

  it('ne crée pas un second projet sur le même dossier', () => {
    expect(addProject(withReact, 'p_autre001', 'd:\\cours\\react\\')).toBe(withReact);
  });

  it('ne touche pas aux sessions rangées', () => {
    const data = { ...emptyOrganize(), sessions: { 'a/b': { favorite: true as const } } };
    expect(addProject(data, 'p_x0000001', 'C:\\x').sessions).toEqual(data.sessions);
  });
});

describe('updateProject', () => {
  it('change le nom, les instructions et les fichiers', () => {
    const data = updateProject(withReact, 'p_react001', {
      name: ' Cours React ',
      instructions: 'Explique simplement',
      files: ['D:\\a.pdf', 'D:\\a.pdf', 'D:\\b.txt'],
    });
    expect(data.projects?.p_react001).toEqual({
      name: 'Cours React',
      folder: 'D:\\Cours\\react',
      instructions: 'Explique simplement',
      files: ['D:\\a.pdf', 'D:\\b.txt'],
    });
  });

  it('un nom vide remet le nom du dossier, des instructions vides disparaissent', () => {
    const named = updateProject(withReact, 'p_react001', { name: 'X', instructions: 'Y', files: ['D:\\a'] });
    const data = updateProject(named, 'p_react001', { name: '  ', instructions: '  ', files: [] });
    expect(data.projects?.p_react001).toEqual({ name: 'react', folder: 'D:\\Cours\\react' });
  });

  it('coupe les instructions et la liste de fichiers trop longues', () => {
    const files = Array.from({ length: MAX_FILES + 5 }, (_, i) => `C:\\f${i}`);
    const data = updateProject(withReact, 'p_react001', { instructions: 'a'.repeat(MAX_INSTRUCTIONS + 10), files });
    expect(data.projects?.p_react001.instructions).toHaveLength(MAX_INSTRUCTIONS);
    expect(data.projects?.p_react001.files).toHaveLength(MAX_FILES);
  });

  it('projet inconnu : rien ne change', () => {
    expect(updateProject(withReact, 'p_inconnu1', { name: 'X' })).toBe(withReact);
  });
});

describe('removeProject', () => {
  it('retire seulement la fiche', () => {
    const data = { ...withReact, sessions: { 'a/b': { favorite: true as const } } };
    expect(removeProject(data, 'p_react001')).toEqual({ version: 1, sessions: data.sessions, projects: {} });
  });
});

describe('sameFolder', () => {
  it('ignore la casse, les \\ finaux et les /', () => {
    expect(sameFolder('D:\\Cours\\React\\', 'd:\\cours\\react')).toBe(true);
    expect(sameFolder('D:/Cours/react', 'D:\\Cours\\react')).toBe(true);
    expect(sameFolder('D:\\Cours\\react2', 'D:\\Cours\\react')).toBe(false);
  });
});

describe('projectForCwd', () => {
  it('trouve le projet du dossier, ou null', () => {
    expect(projectForCwd(withReact, 'd:\\cours\\react')?.id).toBe('p_react001');
    expect(projectForCwd(withReact, 'D:\\Cours')).toBeNull();
    expect(projectForCwd(emptyOrganize(), 'D:\\Cours\\react')).toBeNull();
  });
});

describe('projectSessions', () => {
  const history: HistoryProject[] = [
    { folder: 'D--Cours-react', path: 'D:\\Cours\\react', sessions: [{ id: 's1', title: 'A', lastAt: 100, messageCount: 1 }] },
    { folder: 'd--cours-react', path: 'd:\\cours\\react\\', sessions: [{ id: 's2', title: 'B', lastAt: 300, messageCount: 1 }] },
    { folder: 'D--autre', path: 'D:\\autre', sessions: [{ id: 's3', title: 'C', lastAt: 200, messageCount: 1 }] },
    { folder: 'sans-chemin', sessions: [{ id: 's4', title: 'D', lastAt: 400, messageCount: 1 }] },
  ];

  it('sessions du dossier du projet, plus récentes d abord', () => {
    const project = withReact.projects!.p_react001;
    expect(projectSessions(history, project).map((e) => e.session.id)).toEqual(['s2', 's1']);
  });
});

describe('buildProjectPrompt', () => {
  const base = { name: 'Cours React', folder: 'D:\\Cours\\react' };
  const exists = (path: string) => path !== 'D:\\absent.pdf';

  it('rien à envoyer : null', () => {
    expect(buildProjectPrompt(base, exists)).toBeNull();
    expect(buildProjectPrompt({ ...base, instructions: '  ', files: ['D:\\absent.pdf'] }, exists)).toBeNull();
  });

  it('instructions seules', () => {
    expect(buildProjectPrompt({ ...base, instructions: 'Explique simplement' }, exists)).toBe(
      'Instructions du projet « Cours React » :\nExplique simplement',
    );
  });

  it('fichiers seuls, sans ceux qui ont disparu', () => {
    expect(buildProjectPrompt({ ...base, files: ['D:\\sujet.pdf', 'D:\\absent.pdf'] }, exists)).toBe(
      'Fichiers de référence du projet « Cours React » (lis-les avec Read si utile) :\n- D:\\sujet.pdf',
    );
  });

  it('les deux, séparés par une ligne vide', () => {
    const prompt = buildProjectPrompt({ ...base, instructions: 'Sois bref', files: ['D:\\sujet.pdf'] }, exists);
    expect(prompt).toBe(
      'Instructions du projet « Cours React » :\nSois bref\n\n' +
        'Fichiers de référence du projet « Cours React » (lis-les avec Read si utile) :\n- D:\\sujet.pdf',
    );
  });
});

describe('parseProjects', () => {
  it('garde les projets valides et nettoie les champs', () => {
    // JSON.parse : « __proto__ » devient une vraie clé, comme dans un organize.json piégé.
    const raw: unknown = JSON.parse(`{
      "p_ok000001": { "name": "A", "folder": "C:\\\\a", "instructions": "x", "files": ["C:\\\\f", 3, "C:\\\\f"], "extra": 1 },
      "p_bad00001": { "name": "Sans dossier" },
      "p_bad00002": "pas un objet",
      "__proto__": { "name": "pirate", "folder": "C:\\\\p" },
      "pas-une-cle": { "name": "B", "folder": "C:\\\\b" }
    }`);
    const parsed = parseProjects(raw);
    expect(parsed).toEqual({ p_ok000001: { name: 'A', folder: 'C:\\a', instructions: 'x', files: ['C:\\f'] } });
    expect(Object.getPrototypeOf(parsed)).toBe(Object.prototype);
  });

  it('coupe les instructions trop longues', () => {
    const parsed = parseProjects({ p_long0001: { name: 'A', folder: 'C:\\a', instructions: 'a'.repeat(MAX_INSTRUCTIONS * 2) } });
    expect(parsed.p_long0001.instructions).toHaveLength(MAX_INSTRUCTIONS);
  });

  it('pas un objet : aucun projet', () => {
    expect(parseProjects(undefined)).toEqual({});
    expect(parseProjects([])).toEqual({});
  });
});

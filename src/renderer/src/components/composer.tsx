import { Paperclip, X } from 'lucide-react';
import { useState, type ClipboardEvent, type DragEvent, type KeyboardEvent } from 'react';
import { addAttachments, canSend, droppedPaths, fileName, imageExt, withAttachments } from '../../../shared/attachments';
import { matchCommands, SlashMenu } from './slash-menu';

interface Props {
  running: boolean;
  onSend: (text: string) => void;
  onStop: () => void;
  /** Ouvre la boîte de dialogue Windows ; renvoie les chemins choisis (vide si annulé). */
  onPickFiles: () => Promise<string[]>;
  /** Chemin sur le disque d'un fichier glissé-déposé ('' si ce n'en est pas un). */
  pathForFile: (file: File) => string;
  /** Enregistre une image collée et renvoie son chemin. */
  onSavePasted: (bytes: Uint8Array, ext: string) => Promise<string>;
  /** Noms des commandes et skills proposés après « / ». */
  commands: string[];
  /** Prochain message proposé par claude : affiché en gris, Tab le recopie. */
  suggestion?: string;
}

export function AttachmentChips({ files, onRemove }: { files: string[]; onRemove: (path: string) => void }) {
  if (files.length === 0) return null;
  return (
    <div className="attachments">
      {files.map((path) => (
        <span key={path} className="attachment" title={path}>
          {fileName(path)}
          <button onClick={() => onRemove(path)} aria-label={`Retirer ${fileName(path)}`} title="Retirer">
            <X size={12} aria-hidden />
          </button>
        </span>
      ))}
    </div>
  );
}

export function Composer({ running, onSend, onStop, onPickFiles, pathForFile, onSavePasted, commands, suggestion }: Props) {
  const [text, setText] = useState('');
  const [files, setFiles] = useState<string[]>([]);
  const [dragging, setDragging] = useState(false);
  const [selected, setSelected] = useState(0);
  const [menuClosed, setMenuClosed] = useState(false);
  const matches = menuClosed ? [] : matchCommands(text, commands);

  function change(value: string) {
    setText(value);
    setSelected(0);
    setMenuClosed(false);
  }

  function pick(name: string) {
    change(`/${name} `);
  }

  function submit() {
    if (!canSend(text, files) || running) return;
    onSend(withAttachments(text, files));
    setText('');
    setFiles([]);
  }

  async function pickFiles() {
    const picked = await onPickFiles();
    setFiles((current) => addAttachments(current, picked));
  }

  function onDragOver(e: DragEvent) {
    if (running || !e.dataTransfer.types.includes('Files')) return;
    e.preventDefault(); // sinon le navigateur refuse le dépôt
    setDragging(true);
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setDragging(false);
    if (running) return;
    const dropped = droppedPaths([...e.dataTransfer.files], pathForFile);
    setFiles((current) => addAttachments(current, dropped));
  }

  // Fichier copié dans l'Explorateur : on prend son chemin. Capture d'écran : on l'enregistre d'abord.
  // Sans fichier dans le presse-papiers, le collage de texte se fait normalement.
  async function onPaste(e: ClipboardEvent<HTMLTextAreaElement>) {
    const pasted = [...e.clipboardData.files];
    if (pasted.length === 0) return;
    e.preventDefault();
    const paths: string[] = [];
    for (const file of pasted) {
      const path = pathForFile(file);
      const ext = imageExt(file.type);
      if (path) paths.push(path);
      else if (ext) paths.push(await onSavePasted(new Uint8Array(await file.arrayBuffer()), ext));
    }
    setFiles((current) => addAttachments(current, paths));
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Tab' && !text && suggestion) {
      e.preventDefault();
      change(suggestion);
      return;
    }
    if (matches.length > 0) {
      const move = { ArrowDown: 1, ArrowUp: -1 }[e.key];
      if (move) {
        e.preventDefault();
        setSelected((selected + move + matches.length) % matches.length);
        return;
      }
      if (e.key === 'Escape') {
        setMenuClosed(true);
        return;
      }
      // Tab ou Entrée complète le nom ; Entrée sur un nom déjà complet envoie directement.
      if (e.key === 'Tab' || (e.key === 'Enter' && !e.shiftKey && text.slice(1) !== matches[selected])) {
        e.preventDefault();
        pick(matches[selected]);
        return;
      }
    }
    // Entrée envoie, Maj+Entrée fait un saut de ligne.
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  return (
    <div
      className={dragging ? 'composer dragging' : 'composer'}
      onDragOver={onDragOver}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
    >
      {matches.length > 0 && <SlashMenu items={matches} selected={selected} onPick={pick} />}
      <AttachmentChips files={files} onRemove={(path) => setFiles((current) => current.filter((p) => p !== path))} />
      <textarea
        value={text}
        onChange={(e) => change(e.target.value)}
        onKeyDown={onKeyDown}
        onPaste={onPaste}
        disabled={running}
        placeholder={
          running ? 'Claude répond…' : suggestion ? `${suggestion}   (Tab pour reprendre)` : 'Écris ton message (Entrée pour envoyer)'
        }
        rows={3}
        autoFocus
      />
      <button className="btn-icon" onClick={pickFiles} disabled={running} title="Joindre des fichiers" aria-label="Joindre des fichiers">
        <Paperclip size={18} aria-hidden />
      </button>
      {running ? (
        <button onClick={onStop}>Stop</button>
      ) : (
        <button onClick={submit} disabled={!canSend(text, files)}>
          Envoyer
        </button>
      )}
    </div>
  );
}

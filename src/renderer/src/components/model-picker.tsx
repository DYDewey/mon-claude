import { isModelChoice, MODEL_CHOICES, type ModelChoice } from '../../../shared/model';

export function ModelPicker({
  value,
  activeModel,
  disabled,
  onChange,
}: {
  value?: ModelChoice;
  /** Modèle réellement utilisé, lu dans le flux (inconnu avant la 1re réponse). */
  activeModel?: string;
  disabled: boolean;
  onChange: (model: ModelChoice | undefined) => void;
}) {
  return (
    <span className="model-picker">
      <select
        value={value ?? ''}
        disabled={disabled}
        onChange={(e) => onChange(isModelChoice(e.target.value) ? e.target.value : undefined)}
        title="Modèle de la session : le changer relance claude, la conversation continue"
      >
        <option value="">Par défaut</option>
        {MODEL_CHOICES.map((c) => (
          <option key={c.value} value={c.value}>
            {c.label}
          </option>
        ))}
      </select>
      {activeModel && <span className="muted">{activeModel}</span>}
    </span>
  );
}

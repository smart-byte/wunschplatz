import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

// Umami's script skips every visit while this key is set.
const OPT_OUT_KEY = 'umami.disabled';

function counting() {
  try {
    return localStorage.getItem(OPT_OUT_KEY) === null;
  } catch {
    // Without storage Umami cannot read an opt-out either.
    return true;
  }
}

export function CountingSwitch() {
  const { t } = useTranslation('app');
  const [on, setOn] = useState(counting);

  const change = (next: boolean) => {
    try {
      if (next) localStorage.removeItem(OPT_OUT_KEY);
      else localStorage.setItem(OPT_OUT_KEY, '1');
      setOn(next);
    } catch {
      // Blocked storage keeps the current setting.
    }
  };

  return (
    <div className="mt-4 inline-flex items-center gap-2.5 rounded-md border border-rule bg-white px-4 py-3">
      <Checkbox
        id="count-visits"
        checked={on}
        onCheckedChange={(checked) => change(checked === true)}
      />
      <Label htmlFor="count-visits">{t('legal.counting')}</Label>
    </div>
  );
}

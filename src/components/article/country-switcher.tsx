
'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCountry } from '@/hooks/use-country';
import { COUNTRIES, type CountryCode } from '@/lib/types';
import { MapPin } from 'lucide-react';

export function CountrySwitcher() {
  const { country, setCountry } = useCountry();

  return (
    <Select value={country} onValueChange={(value: CountryCode) => setCountry(value)}>
      <SelectTrigger className="w-auto gap-2 bg-background">
        <MapPin className="h-4 w-4" />
        <SelectValue placeholder="Country" />
      </SelectTrigger>
      <SelectContent>
        {COUNTRIES.map(c => (
          <SelectItem key={c.code} value={c.code}>
            {c.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

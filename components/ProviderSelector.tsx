"use client";

import { providers, type ProviderKey } from "@/lib/providers";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ProviderSelectorProps {
  provider: ProviderKey;
  model: string;
  onProviderChange: (provider: ProviderKey) => void;
  onModelChange: (model: string) => void;
}

export function ProviderSelector({
  provider,
  model,
  onProviderChange,
  onModelChange,
}: ProviderSelectorProps) {
  const handleProviderChange = (newProvider: ProviderKey) => {
    onProviderChange(newProvider);
    // Set the first model of the new provider as default
    const firstModel = Object.keys(providers[newProvider].models)[0];
    onModelChange(firstModel);
  };

  return (
    <div className="flex gap-2">
      <Select value={provider} onValueChange={handleProviderChange}>
        <SelectTrigger className="w-32">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(providers).map(([key, provider]) => (
            <SelectItem key={key} value={key}>
              {provider.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={model} onValueChange={onModelChange}>
        <SelectTrigger className="w-48">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(providers[provider].models).map(([key, name]) => (
            <SelectItem key={key} value={key}>
              {name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

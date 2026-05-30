import { Surface } from "@/components/Surface";

export function ModeCard({ name, description }: { name: string; description: string }) {
  return (
    <Surface register="lift" as="li" className="p-6">
      <h3 className="text-xl font-semibold">{name}</h3>
      <p className="mt-2 text-[var(--text-secondary)]">{description}</p>
    </Surface>
  );
}

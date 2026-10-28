import { FieldError, label, select } from "@/components/ui/field";
import { cn } from "@/lib/cn";
import type { Role } from "@/lib/data/taxonomy";

export function RoleSelect({ roles, defaultValue, error }: { roles: Role[]; defaultValue?: string; error?: string }) {
  return (
    <div>
      <label htmlFor="role_id" className={label}>
        Role
      </label>
      <select
        id="role_id"
        name="role_id"
        defaultValue={defaultValue ?? ""}
        aria-invalid={!!error}
        aria-describedby="role_id-error"
        className={cn(select, "mt-2")}
      >
        <option value="">Choose a role</option>
        {roles.map((r) => (
          <option key={r.id} value={r.id}>
            {r.label}
            {r.aliases.length ? ` (${r.aliases.join(", ")})` : ""}
          </option>
        ))}
      </select>
      <FieldError id="role_id-error">{error}</FieldError>
    </div>
  );
}

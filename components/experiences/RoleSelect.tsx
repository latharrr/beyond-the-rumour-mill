import type { Role } from "@/lib/data/taxonomy";

export function RoleSelect({ roles, defaultValue, error }: { roles: Role[]; defaultValue?: string; error?: string }) {
  return (
    <>
      <label htmlFor="role_id">Role</label>
      <select id="role_id" name="role_id" defaultValue={defaultValue ?? ""} aria-invalid={!!error} aria-describedby="role_id-error">
        <option value="">Choose a role</option>
        {roles.map((r) => (
          <option key={r.id} value={r.id}>{r.label}{r.aliases.length ? ` (${r.aliases.join(", ")})` : ""}</option>
        ))}
      </select>
      {error && <p id="role_id-error" role="alert">{error}</p>}
    </>
  );
}

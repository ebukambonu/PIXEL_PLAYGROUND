export const DISPLAY_ROLES = [
  "gamer",
  "supporter",
  "dev",
  "admin",
  "og",
  "owner",
  "op",
];
export const ROLE_LABELS = {
  gamer: "Gamer",
  supporter: "Supporter",
  dev: "Dev",
  admin: "Admin",
  og: "OG",
  owner: "Owner",
  op: "OP",
};
export function displayRole(user) {
  const role = user?.displayRole ?? user?.display_role;
  return DISPLAY_ROLES.includes(role)
    ? role
    : user?.admin || user?.role === "admin"
      ? "owner"
      : "gamer";
}

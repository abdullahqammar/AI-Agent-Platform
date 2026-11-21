import "server-only";
import { getConnection } from "./connection";
import { createTenantAccess } from "./tenant";

let tenantAccess: ReturnType<typeof createTenantAccess> | undefined;

export const withTenant: ReturnType<typeof createTenantAccess> = (...args) => {
  tenantAccess ??= createTenantAccess(getConnection());
  return tenantAccess(...args);
};

export { TenantAccessDenied } from "./tenant";

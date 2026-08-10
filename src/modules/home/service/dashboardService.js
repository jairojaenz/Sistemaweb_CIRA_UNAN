/**
 * Dashboard home: agrega conteos desde Users + catálogos.
 * Usa Promise.allSettled para no tumbar todo el panel si un endpoint falla (p. ej. 403 no-admin).
 */
import { apiGet } from "../../../auth/api";
import { asList } from "../../../utils/apiList.js";

export async function getDashboardStats() {
  const [usersRes, labsRes, cargosRes, deptosRes] = await Promise.allSettled([
    apiGet("/api/User/get-users"),
    apiGet("/api/catalogos/laboratorios"),
    apiGet("/api/catalogos/cargos"),
    apiGet("/api/catalogos/departamentos"),
  ]);

  const users = usersRes.status === "fulfilled" ? asList(usersRes.value) : [];
  const labs = labsRes.status === "fulfilled" ? asList(labsRes.value) : [];
  const cargos = cargosRes.status === "fulfilled" ? asList(cargosRes.value) : [];
  const deptos = deptosRes.status === "fulfilled" ? asList(deptosRes.value) : [];

  return {
    totalUsuarios: users.length,
    totalLaboratorios: labs.length,
    totalCargos: cargos.length,
    totalDepartamentos: deptos.length,
    usuariosActivos: users.filter((u) => u.activo).length,
    usuariosInactivos: users.filter((u) => !u.activo).length,
    recentUsers: users.slice(0, 5),
  };
}
